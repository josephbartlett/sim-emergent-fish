#!/usr/bin/env python3

import json
import os
import sys

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("FISHTANK_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
AUDIT_URL = f"{BASE_URL}/seed-audit.html"
AUDIT_TIMEOUT_MS = int(os.environ.get("FISHTANK_AUDIT_TIMEOUT_MS", "90000"))

THRESHOLDS = {
    "approachRate": ("min", float(os.environ.get("FISHTANK_MIN_APPROACH_RATE", "0.58"))),
    "driftRate": ("max", float(os.environ.get("FISHTANK_MAX_DRIFT_RATE", "0.33"))),
    "collapseRate": ("max", float(os.environ.get("FISHTANK_MAX_COLLAPSE_RATE", "0.05"))),
    "averageFoodTaken": ("min", float(os.environ.get("FISHTANK_MIN_FOOD_TAKEN", "120.0"))),
}


def fail(message: str, summary: dict | None = None) -> int:
    print(f"Seed audit check failed: {message}", file=sys.stderr)
    if summary is not None:
        print(json.dumps(summary, indent=2), file=sys.stderr)
    return 1


def main() -> int:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 960})
        try:
            page.goto(AUDIT_URL, wait_until="load", timeout=30000)
            page.wait_for_function("document.body.dataset.done === '1'", timeout=AUDIT_TIMEOUT_MS)
            raw_output = page.locator("#out").inner_text()
        except PlaywrightTimeoutError:
            browser.close()
            return fail(f"timed out waiting for audit results at {AUDIT_URL}")
        browser.close()

    try:
        summary = json.loads(raw_output)
    except json.JSONDecodeError as exc:
        return fail(f"could not parse audit JSON: {exc}\nraw output:\n{raw_output}")

    print(json.dumps(summary, indent=2))

    for metric, (mode, threshold) in THRESHOLDS.items():
        value = summary.get(metric)
        if value is None:
            return fail(f"missing `{metric}` in audit output", summary)
        if mode == "min" and value < threshold:
            return fail(f"`{metric}` was {value}, expected >= {threshold}", summary)
        if mode == "max" and value > threshold:
            return fail(f"`{metric}` was {value}, expected <= {threshold}", summary)

    last_samples = summary.get("lastSamples", [])
    seeds = summary.get("seeds", [])
    if len(last_samples) != len(seeds):
        return fail(
            f"`lastSamples` length {len(last_samples)} did not match seeds length {len(seeds)}",
            summary,
        )

    print("Seed audit thresholds passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
