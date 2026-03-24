#!/usr/bin/env python3

import json
import os
import sys

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("FISHTANK_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
APP_URL = f"{BASE_URL}/index.html"
APP_TIMEOUT_MS = int(os.environ.get("FISHTANK_APP_TIMEOUT_MS", "30000"))
LIVE_RETURN_TOLERANCE = float(os.environ.get("FISHTANK_REPLAY_LIVE_TOLERANCE", "1.5"))
SCRUB_ITERATIONS = int(os.environ.get("FISHTANK_REPLAY_SCRUB_ITERATIONS", "80"))
BUTTON_CYCLES = int(os.environ.get("FISHTANK_REPLAY_BUTTON_CYCLES", "8"))


def fail(message: str, summary: dict | None = None) -> int:
    print(f"Replay stress check failed: {message}", file=sys.stderr)
    if summary is not None:
        print(json.dumps(summary, indent=2), file=sys.stderr)
    return 1


def inspect_state(page):
    return page.evaluate(
        """() => {
          const dbg = window.__FISHTANK_DEBUG__;
          const snap = dbg.snapshot();
          const eventStream = document.getElementById('event-stream');
          const bookmarkList = document.getElementById('bookmark-list');
          const scrubber = document.getElementById('replay-scrubber');
          const pauseButton = document.getElementById('pause-toggle');
          const replayNote = document.getElementById('replay-note');
          const scrubLabel = document.getElementById('replay-scrub-label');
          const rewindShort = document.getElementById('replay-rewind-short');
          const rewindLong = document.getElementById('replay-rewind-long');
          const texts = Array.from(eventStream.querySelectorAll('.event-item')).map((el) => el.innerText);
          return {
            time: snap.time,
            paused: snap.paused,
            pauseReason: snap.pauseReason,
            eventCount: texts.length,
            placeholder: texts.some((text) => /Waiting for the first event/i.test(text)),
            invalidTexts: texts.filter((text) => /undefined|null|NaN/i.test(text)).length,
            activeBookmarkCount: bookmarkList.querySelectorAll('[data-active="true"]').length,
            bookmarkCount: bookmarkList.querySelectorAll('[data-bookmark-id]').length,
            topEvents: texts.slice(0, 3),
            replayNote: replayNote.textContent,
            pauseText: pauseButton.textContent,
            scrubValue: scrubber.value,
            scrubMax: scrubber.max,
            scrubLabel: scrubLabel.textContent,
            rewindShortDisabled: rewindShort.disabled,
            rewindLongDisabled: rewindLong.disabled,
          };
        }"""
    )


def set_scrubber(page, value: int) -> None:
    page.evaluate(
        """(value) => {
          const scrubber = document.getElementById('replay-scrubber');
          scrubber.value = String(value);
          scrubber.dispatchEvent(new Event('input', { bubbles: true }));
        }""",
        value,
    )


def record_failure(failures: list[dict], kind: str, state: dict | None = None, extra: dict | None = None) -> None:
    payload = {"kind": kind}
    if state is not None:
        payload["state"] = state
    if extra:
        payload.update(extra)
    failures.append(payload)


def main() -> int:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1024})

        page_errors: list[str] = []
        console_errors: list[str] = []
        request_failures: list[dict] = []
        page.on("pageerror", lambda exc: page_errors.append(str(exc)))
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("requestfailed", lambda req: request_failures.append({"url": req.url, "failure": req.failure}))

        try:
            page.goto(APP_URL, wait_until="load", timeout=APP_TIMEOUT_MS)
            page.wait_for_function("window.__FISHTANK_DEBUG__ && window.__FISHTANK_DEBUG__.snapshot", timeout=APP_TIMEOUT_MS)
        except PlaywrightTimeoutError:
            browser.close()
            return fail(f"timed out waiting for the app at {APP_URL}")

        page.evaluate("window.__FISHTANK_DEBUG__.applyScenario('baseline')")
        page.evaluate("window.__FISHTANK_DEBUG__.runAudit(25)")
        page.click("#replay-bookmark")
        page.evaluate("window.__FISHTANK_DEBUG__.runAudit(8)")
        page.click("#replay-bookmark")
        page.evaluate("window.__FISHTANK_DEBUG__.runAudit(12)")

        failures: list[dict] = []
        live_before = inspect_state(page)
        if live_before["bookmarkCount"] < 2:
            record_failure(failures, "bookmark-setup", live_before)

        scrub_max = int(live_before["scrubMax"])
        pattern = [0, max(0, scrub_max - 1), scrub_max // 2, scrub_max, max(0, scrub_max - 3), 1, scrub_max, 0]
        for i in range(SCRUB_ITERATIONS):
            target = pattern[i % len(pattern)]
            set_scrubber(page, target)
            state = inspect_state(page)
            current_max = int(state["scrubMax"])
            if target < current_max:
                if not (state["paused"] and state["pauseReason"] == "replay"):
                    record_failure(failures, "scrub-replay-state", state, {"iteration": i, "target": target})
            else:
                if state["pauseReason"] == "replay":
                    record_failure(failures, "scrub-live-state", state, {"iteration": i, "target": target})
            if state["invalidTexts"] or state["activeBookmarkCount"] > 1 or (state["placeholder"] and state["eventCount"] > 1):
                record_failure(failures, "scrub-dom-invariant", state, {"iteration": i, "target": target})

        page.evaluate("window.__FISHTANK_DEBUG__.returnToLive()")
        page.evaluate("window.__FISHTANK_DEBUG__.runAudit(35)")

        button_cycles_completed = 0
        for i in range(BUTTON_CYCLES):
            state = inspect_state(page)
            if state["rewindShortDisabled"] and state["rewindLongDisabled"]:
                break
            if not state["rewindShortDisabled"]:
                page.click("#replay-rewind-short")
                state = inspect_state(page)
                if not (state["paused"] and state["pauseReason"] == "replay"):
                    record_failure(failures, "rewind15-state", state, {"iteration": i})
            if not state["rewindLongDisabled"]:
                page.click("#replay-rewind-long")
                state = inspect_state(page)
                if not (state["paused"] and state["pauseReason"] == "replay"):
                    record_failure(failures, "rewind30-state", state, {"iteration": i})
            page.click("#replay-live")
            state = inspect_state(page)
            if state["pauseReason"] == "replay":
                record_failure(failures, "return-live-state", state, {"iteration": i})
            if state["invalidTexts"] or state["activeBookmarkCount"] > 1 or (state["placeholder"] and state["eventCount"] > 1):
                record_failure(failures, "button-dom-invariant", state, {"iteration": i})
            button_cycles_completed = i + 1

        if button_cycles_completed == 0:
            record_failure(failures, "button-cycles-skipped", inspect_state(page))

        branch_state = None
        branch_replay_state = None
        bookmark_ids = page.evaluate("window.__FISHTANK_DEBUG__.bookmarkIds()")
        if len(bookmark_ids) > 1:
            page.evaluate("(id) => window.__FISHTANK_DEBUG__.restoreBookmark(id)", bookmark_ids[1])
            state = inspect_state(page)
            if not (state["paused"] and state["pauseReason"] == "replay" and state["activeBookmarkCount"] == 1):
                record_failure(failures, "bookmark-restore-state", state)
            page.click("#pause-toggle")
            branch_state = inspect_state(page)
            if branch_state["pauseReason"] == "replay" or not branch_state["pauseText"].startswith("Pause"):
                record_failure(failures, "branch-resume-state", branch_state)
            set_scrubber(page, 0)
            branch_replay_state = inspect_state(page)
            if not (branch_replay_state["paused"] and branch_replay_state["pauseReason"] == "replay"):
                record_failure(failures, "branch-scrub-state", branch_replay_state)
            page.click("#replay-live")

        live_after = inspect_state(page)
        if live_after["time"] < live_before["time"] - LIVE_RETURN_TOLERANCE:
            record_failure(
                failures,
                "live-return-time",
                live_after,
                {"expected_time": live_before["time"], "tolerance": LIVE_RETURN_TOLERANCE},
            )
        if live_after["invalidTexts"] or live_after["activeBookmarkCount"] > 1 or (live_after["placeholder"] and live_after["eventCount"] > 1):
            record_failure(failures, "live-after-dom-invariant", live_after)

        browser.close()

    summary = {
        "app_url": APP_URL,
        "scrub_iterations": SCRUB_ITERATIONS,
        "button_cycles_completed": button_cycles_completed,
        "page_errors": page_errors,
        "console_errors": console_errors,
        "request_failures": request_failures,
        "liveBefore": live_before,
        "branchState": branch_state,
        "branchReplayState": branch_replay_state,
        "liveAfter": live_after,
        "failures": failures,
    }

    print(json.dumps(summary, indent=2))

    if page_errors:
        return fail("page errors were raised during replay stress", summary)
    if console_errors:
        return fail("console errors were raised during replay stress", summary)
    if request_failures:
        return fail("network requests failed during replay stress", summary)
    if failures:
        return fail("one or more replay stress assertions failed", summary)

    print("Replay stress check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
