(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const shell = document.getElementById('shell');
  const BASE_W = 384;
  const BASE_H = 224;
  const WORLD_SCALE = 1.75;
  const W = Math.round(BASE_W * WORLD_SCALE);
  const H = Math.round(BASE_H * WORLD_SCALE);
  const scaleWorld = (value) => value * WORLD_SCALE;
  const baseCoord = (value) => value / WORLD_SCALE;
  const WORLD = {
    hudH: scaleWorld(18),
    insetX: scaleWorld(10),
    edgePad: scaleWorld(14),
    sidePad: scaleWorld(12),
    waterTop: scaleWorld(28),
    waterTopSoft: scaleWorld(26),
    waterBottom: scaleWorld(176),
    waterBottomSoft: scaleWorld(178),
    spawnTop: scaleWorld(34),
    foodTop: scaleWorld(30),
    bloomTop: scaleWorld(42),
    bloomBottom: scaleWorld(156),
    sandLine: scaleWorld(172),
    plantBaseY: scaleWorld(186),
  };
  canvas.width = W;
  canvas.height = H;
  const tankStage = document.getElementById('tank-stage');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  ctx.imageSmoothingEnabled = false;

  const noscript = document.getElementById('noscript');
  if (noscript) noscript.remove();

  const UI = {
    bottomDock: document.getElementById('bottom-dock'),
    historyPanel: document.getElementById('history-panel'),
    insightPanel: document.getElementById('insight-panel'),
    statFish: document.getElementById('stat-fish'),
    statDominant: document.getElementById('stat-dominant'),
    statFood: document.getElementById('stat-food'),
    statSeason: document.getElementById('stat-season'),
    statEnergy: document.getElementById('stat-energy'),
    statPressure: document.getElementById('stat-pressure'),
    statTurnover: document.getElementById('stat-turnover'),
    statTurnoverNote: document.getElementById('stat-turnover-note'),
    pauseButton: document.getElementById('pause-toggle'),
    resetButton: document.getElementById('reset-sim'),
    controlsToggleButton: document.getElementById('controls-toggle'),
    controlsCloseButton: document.getElementById('controls-close'),
    controlScrim: document.getElementById('control-scrim'),
    focusButton: document.getElementById('focus-mode'),
    seedInput: document.getElementById('seed-input'),
    applySeedButton: document.getElementById('apply-seed'),
    controlFood: document.getElementById('control-food'),
    controlFoodValue: document.getElementById('control-food-value'),
    controlMetabolism: document.getElementById('control-metabolism'),
    controlMetabolismValue: document.getElementById('control-metabolism-value'),
    controlFertility: document.getElementById('control-fertility'),
    controlFertilityValue: document.getElementById('control-fertility-value'),
    controlSeason: document.getElementById('control-season'),
    controlSeasonValue: document.getElementById('control-season-value'),
    scenarioNote: document.getElementById('scenario-note'),
    scenarioButtons: Array.from(document.querySelectorAll('[data-scenario]')),
    presetNote: document.getElementById('preset-note'),
    presetButtons: Array.from(document.querySelectorAll('[data-preset]')),
    viewButtons: Array.from(document.querySelectorAll('[data-view]')),
    historyCanvas: document.getElementById('history'),
    historyNote: document.getElementById('history-note'),
    replayNote: document.getElementById('replay-note'),
    replayBookmarkButton: document.getElementById('replay-bookmark'),
    replayRewindShortButton: document.getElementById('replay-rewind-short'),
    replayRewindLongButton: document.getElementById('replay-rewind-long'),
    replayLiveButton: document.getElementById('replay-live'),
    replayScrubber: document.getElementById('replay-scrubber'),
    replayScrubLabel: document.getElementById('replay-scrub-label'),
    bookmarkList: document.getElementById('bookmark-list'),
    eventStream: document.getElementById('event-stream'),
    seasonCallout: document.getElementById('season-callout'),
    pressureCallout: document.getElementById('pressure-callout'),
    cycleCallout: document.getElementById('cycle-callout'),
    inspectHighlightButton: document.getElementById('inspect-highlight'),
    inspectClearButton: document.getElementById('inspect-clear'),
    inspectKicker: document.getElementById('inspect-kicker'),
    inspectName: document.getElementById('inspect-name'),
    inspectSummary: document.getElementById('inspect-summary'),
    inspectArchetype: document.getElementById('inspect-archetype'),
    inspectStage: document.getElementById('inspect-stage'),
    inspectEnergy: document.getElementById('inspect-energy'),
    inspectHunger: document.getElementById('inspect-hunger'),
    inspectSatiation: document.getElementById('inspect-satiation'),
    inspectLineage: document.getElementById('inspect-lineage'),
    inspectGeneration: document.getElementById('inspect-generation'),
    inspectIntent: document.getElementById('inspect-intent'),
    inspectTarget: document.getElementById('inspect-target'),
    inspectLineageNote: document.getElementById('inspect-lineage-note'),
    watchAge: document.getElementById('watch-age'),
    watchMeals: document.getElementById('watch-meals'),
    watchHunts: document.getElementById('watch-hunts'),
    watchOffspring: document.getElementById('watch-offspring'),
    watchStatus: document.getElementById('watch-status'),
    watchFeed: document.getElementById('watch-feed'),
    watchFeedNote: document.getElementById('watch-feed-note'),
    splitJuvenile: document.getElementById('split-juvenile'),
    splitAdult: document.getElementById('split-adult'),
    splitHerbivore: document.getElementById('split-herbivore'),
    splitCarnivore: document.getElementById('split-carnivore'),
    disturbanceNote: document.getElementById('disturbance-note'),
    overlayPopulation: document.getElementById('overlay-population'),
    overlayPopNote: document.getElementById('overlay-pop-note'),
    overlayResources: document.getElementById('overlay-resources'),
    overlayResourceNote: document.getElementById('overlay-resource-note'),
    overlayRun: document.getElementById('overlay-run'),
    overlayRunNote: document.getElementById('overlay-run-note'),
    overlayWatch: document.getElementById('overlay-watch'),
    overlayWatchNote: document.getElementById('overlay-watch-note'),
    archetypes: {
      grazer: document.getElementById('arch-grazer'),
      shoaler: document.getElementById('arch-shoaler'),
      opportunist: document.getElementById('arch-opportunist'),
      hunter: document.getElementById('arch-hunter'),
    },
  };
  const historyCtx = UI.historyCanvas ? UI.historyCanvas.getContext('2d') : null;
  if (historyCtx) historyCtx.imageSmoothingEnabled = false;
  // Prefer stepped scaling so the tank can use the panel without becoming blurry.
  function resizeCanvas() {
    const rect = tankStage ? tankStage.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    const availW = Math.max(1, rect.width - 28);
    const availH = Math.max(1, rect.height - 28);
    const scale = Math.max(1, Math.floor(Math.min(availW / W, availH / H) * 4) / 4);
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
  }

  let syncedDockHeight = 0;
  function syncDockHeights() {
    if (!UI.historyPanel || !UI.insightPanel || !UI.bottomDock) return;
    const cinematicActive = shell && shell.dataset.cinematic === 'true';
    if (window.innerWidth <= 1200 || cinematicActive) {
      if (UI.historyPanel.style.height) UI.historyPanel.style.height = '';
      syncedDockHeight = 0;
      return;
    }
    const target = Math.round(UI.insightPanel.getBoundingClientRect().height);
    if (target <= 0) return;
    if (Math.abs(target - syncedDockHeight) < 1) return;
    UI.historyPanel.style.height = `${target}px`;
    syncedDockHeight = target;
  }

  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('resize', syncDockHeights, { passive: true });
  let stageObserver = null;
  if (typeof ResizeObserver !== 'undefined' && tankStage) {
    stageObserver = new ResizeObserver(resizeCanvas);
    stageObserver.observe(tankStage);
  }
  let dockObserver = null;
  if (typeof ResizeObserver !== 'undefined' && UI.insightPanel) {
    dockObserver = new ResizeObserver(syncDockHeights);
    dockObserver.observe(UI.insightPanel);
    if (UI.bottomDock) dockObserver.observe(UI.bottomDock);
  }
  resizeCanvas();
  syncDockHeights();

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const approach = (v, target, delta) => (v < target ? Math.min(target, v + delta) : Math.max(target, v - delta));
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const randi = (a, bInclusive) => (a + (Math.random() * (bInclusive - a + 1)) | 0);
  const hypot = Math.hypot;
  function norm2(x, y) {
    const m = hypot(x, y);
    if (m < 1e-6) return { x: 0, y: 0, m: 0 };
    return { x: x / m, y: y / m, m };
  }

  function dist2(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  function circleHit(a, b, pad = 0) {
    const rr = (a.r + b.r + pad) ** 2;
    return dist2(a, b) <= rr;
  }

  // --- Input ---------------------------------------------------------------

  const input = {
    down: Object.create(null),
    pressed: Object.create(null),
    used: Object.create(null),
    pointer: { tapped: false },
  };

  function isInteractiveTarget(target) {
    return target instanceof Element && Boolean(target.closest('input, button, select, textarea, [contenteditable="true"]'));
  }

  function setKey(e, isDown) {
    const code = e.code || e.key;
    if (!code) return;
    if (isInteractiveTarget(e.target)) {
      input.down[code] = false;
      return;
    }
    if (isDown) {
      if (!input.down[code]) input.pressed[code] = true;
      input.down[code] = true;
    } else {
      input.down[code] = false;
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Backspace'].includes(code)) e.preventDefault();
  }

  window.addEventListener('keydown', (e) => setKey(e, true), { passive: false });
  window.addEventListener('keyup', (e) => setKey(e, false), { passive: false });
  window.addEventListener('blur', () => {
    input.down = Object.create(null);
    input.pressed = Object.create(null);
    input.pointer.tapped = false;
    pauseGame('focus');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame('focus');
  });

  function consumePressed(...codes) {
    for (const c of codes) {
      if (input.pressed[c] && !input.used[c]) {
        input.used[c] = true;
        return true;
      }
    }
    return false;
  }

  function resetPressed() {
    input.pressed = Object.create(null);
    input.used = Object.create(null);
    input.pointer.tapped = false;
  }

  function canvasPointToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const sx = rect.width > 0 ? W / rect.width : 1;
    const sy = rect.height > 0 ? H / rect.height : 1;
    return {
      x: clamp((clientX - rect.left) * sx, 0, W),
      y: clamp((clientY - rect.top) * sy, 0, H),
    };
  }

  function pickFishAt(x, y) {
    let best = null;
    let bestScore = Infinity;
    for (const fish of g.fish) {
      const dx = fish.x - x;
      const dy = fish.y - y;
      const d = hypot(dx, dy);
      const reach = fish.r * 1.3 + scaleWorld(2);
      if (d > reach) continue;
      const score = d / Math.max(1, fish.r);
      if (score < bestScore) {
        best = fish;
        bestScore = score;
      }
    }
    return best;
  }

  canvas.addEventListener('pointerdown', (e) => {
    const point = canvasPointToWorld(e.clientX, e.clientY);
    const fish = pickFishAt(point.x, point.y);
    if (fish) {
      if (fish.id === selectedFishId) {
        WATCH_VIEW.cardVisible = !WATCH_VIEW.cardVisible;
        WATCH_VIEW.lastSubjectId = fish.id;
        if (WATCH_VIEW.cardVisible) WATCH_VIEW.slotHold = 0;
      } else {
        selectFish(fish);
      }
      updateUiPanels(true);
      SFX.play('ui');
      input.pointer.tapped = false;
    } else {
      input.pointer.tapped = true;
    }
    canvas.setPointerCapture?.(e.pointerId);
  });

  // --- Audio ---------------------------------------------------------------

  function makeSfx() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let ctx = null;
    let master = null;
    let unlocked = false;

    function ensure() {
      if (ctx) return;
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = 0.18;
      master.connect(ctx.destination);
    }

    function unlock() {
      ensure();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      unlocked = true;
    }

    function tone({ type = 'square', f0 = 220, f1 = 220, t = 0.08, a0 = 0.6, a1 = 0.0 }) {
      ensure();
      if (!unlocked) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, ctx.currentTime);
      o.frequency.linearRampToValueAtTime(f1, ctx.currentTime + t);
      g.gain.setValueAtTime(a0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(a1, ctx.currentTime + t);
      o.connect(g);
      g.connect(master);
      o.start();
      o.stop(ctx.currentTime + t);
    }

    function noise({ t = 0.12, a0 = 0.35, a1 = 0.0, hp = 300, lp = 3800 }) {
      ensure();
      if (!unlocked) return;
      const sr = ctx.sampleRate;
      const n = (t * sr) | 0;
      const buf = ctx.createBuffer(1, n, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.setValueAtTime(a0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(a1, ctx.currentTime + t);
      const f1 = ctx.createBiquadFilter();
      f1.type = 'highpass';
      f1.frequency.value = hp;
      const f2 = ctx.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.value = lp;
      src.connect(f1);
      f1.connect(f2);
      f2.connect(g);
      g.connect(master);
      src.start();
      src.stop(ctx.currentTime + t);
    }

    function play(name) {
      // Tiny synth palette: keep it VGA-arcade simple.
      if (name === 'eat') {
        tone({ type: 'square', f0: 620, f1: 880, t: 0.06, a0: 0.55 });
        tone({ type: 'triangle', f0: 220, f1: 110, t: 0.08, a0: 0.22 });
      } else if (name === 'eat_big') {
        tone({ type: 'square', f0: 220, f1: 110, t: 0.09, a0: 0.55 });
        tone({ type: 'square', f0: 440, f1: 660, t: 0.07, a0: 0.35 });
      } else if (name === 'dash') {
        noise({ t: 0.10, a0: 0.28, hp: 700, lp: 5200 });
        tone({ type: 'sawtooth', f0: 110, f1: 55, t: 0.10, a0: 0.30 });
      } else if (name === 'hit') {
        tone({ type: 'square', f0: 98, f1: 78, t: 0.14, a0: 0.60 });
        noise({ t: 0.16, a0: 0.25, hp: 200, lp: 2000 });
      } else if (name === 'ui') {
        tone({ type: 'square', f0: 660, f1: 660, t: 0.045, a0: 0.40 });
      }
    }

    return { unlock, play };
  }

  const SFX = makeSfx();
  window.addEventListener('pointerdown', () => SFX.unlock(), { passive: true });
  window.addEventListener('keydown', () => SFX.unlock(), { passive: true });

  // --- VGA-ish palette -----------------------------------------------------

  const COL = {
    ink: '#05060a',
    ui0: '#0b1021',
    ui1: '#1d2a4a',
    ui2: '#2d4a7a',
    water0: '#071126',
    water1: '#0b2447',
    water2: '#103a6b',
    water3: '#1f6c96',
    foam: '#a8e6ff',
    sand0: '#2c2a2a',
    sand1: '#5b4a33',
    sand2: '#c8a55d',
    sand3: '#f2d16b',
    fish0: '#0b3d2e',
    fish1: '#1d7f5a',
    fish2: '#6ddc8f',
    fish3: '#ffe66d',
    red: '#d64545',
    orange: '#f08a4b',
    white: '#f6f2ff',
    gray: '#5c6c7f',
  };

  // --- Bitmap font (5x7) ---------------------------------------------------

  const FONT = (() => {
    const F = Object.create(null);
    const A = (rows) => rows.map((r) => parseInt(r, 2));

    // 5 bits wide, 7 rows high. Use '?' fallback for unknown glyphs.
    F[' '] = A(['00000', '00000', '00000', '00000', '00000', '00000', '00000']);
    F['?'] = A(['01110', '10001', '00001', '00010', '00100', '00000', '00100']);
    F['.'] = A(['00000', '00000', '00000', '00000', '00000', '00110', '00110']);
    F[','] = A(['00000', '00000', '00000', '00000', '00110', '00110', '00100']);
    F['!'] = A(['00100', '00100', '00100', '00100', '00100', '00000', '00100']);
    F[':'] = A(['00000', '00110', '00110', '00000', '00110', '00110', '00000']);
    F['/'] = A(['00001', '00010', '00100', '01000', '10000', '00000', '00000']);
    F['#'] = A(['01010', '11111', '01010', '01010', '11111', '01010', '01010']);
    F['-'] = A(['00000', '00000', '00000', '11111', '00000', '00000', '00000']);
    F['='] = A(['00000', '00000', '11111', '00000', '11111', '00000', '00000']);
    F['+'] = A(['00000', '00100', '00100', '11111', '00100', '00100', '00000']);
    F['x'] = A(['00000', '10001', '01010', '00100', '01010', '10001', '00000']);

    // Digits
    F['0'] = A(['01110', '10001', '10011', '10101', '11001', '10001', '01110']);
    F['1'] = A(['00100', '01100', '00100', '00100', '00100', '00100', '01110']);
    F['2'] = A(['01110', '10001', '00001', '00010', '00100', '01000', '11111']);
    F['3'] = A(['11110', '00001', '00001', '01110', '00001', '00001', '11110']);
    F['4'] = A(['00010', '00110', '01010', '10010', '11111', '00010', '00010']);
    F['5'] = A(['11111', '10000', '10000', '11110', '00001', '00001', '11110']);
    F['6'] = A(['01110', '10000', '10000', '11110', '10001', '10001', '01110']);
    F['7'] = A(['11111', '00001', '00010', '00100', '01000', '01000', '01000']);
    F['8'] = A(['01110', '10001', '10001', '01110', '10001', '10001', '01110']);
    F['9'] = A(['01110', '10001', '10001', '01111', '00001', '00001', '01110']);

    // Uppercase letters A-Z
    F['A'] = A(['01110', '10001', '10001', '11111', '10001', '10001', '10001']);
    F['B'] = A(['11110', '10001', '10001', '11110', '10001', '10001', '11110']);
    F['C'] = A(['01110', '10001', '10000', '10000', '10000', '10001', '01110']);
    F['D'] = A(['11100', '10010', '10001', '10001', '10001', '10010', '11100']);
    F['E'] = A(['11111', '10000', '10000', '11110', '10000', '10000', '11111']);
    F['F'] = A(['11111', '10000', '10000', '11110', '10000', '10000', '10000']);
    F['G'] = A(['01110', '10001', '10000', '10111', '10001', '10001', '01110']);
    F['H'] = A(['10001', '10001', '10001', '11111', '10001', '10001', '10001']);
    F['I'] = A(['01110', '00100', '00100', '00100', '00100', '00100', '01110']);
    F['J'] = A(['00111', '00010', '00010', '00010', '00010', '10010', '01100']);
    F['K'] = A(['10001', '10010', '10100', '11000', '10100', '10010', '10001']);
    F['L'] = A(['10000', '10000', '10000', '10000', '10000', '10000', '11111']);
    F['M'] = A(['10001', '11011', '10101', '10101', '10001', '10001', '10001']);
    F['N'] = A(['10001', '11001', '10101', '10011', '10001', '10001', '10001']);
    F['O'] = A(['01110', '10001', '10001', '10001', '10001', '10001', '01110']);
    F['P'] = A(['11110', '10001', '10001', '11110', '10000', '10000', '10000']);
    F['Q'] = A(['01110', '10001', '10001', '10001', '10101', '10010', '01101']);
    F['R'] = A(['11110', '10001', '10001', '11110', '10100', '10010', '10001']);
    F['S'] = A(['01111', '10000', '10000', '01110', '00001', '00001', '11110']);
    F['T'] = A(['11111', '00100', '00100', '00100', '00100', '00100', '00100']);
    F['U'] = A(['10001', '10001', '10001', '10001', '10001', '10001', '01110']);
    F['V'] = A(['10001', '10001', '10001', '10001', '10001', '01010', '00100']);
    F['W'] = A(['10001', '10001', '10001', '10101', '10101', '10101', '01010']);
    F['X'] = A(['10001', '10001', '01010', '00100', '01010', '10001', '10001']);
    F['Y'] = A(['10001', '10001', '01010', '00100', '00100', '00100', '00100']);
    F['Z'] = A(['11111', '00001', '00010', '00100', '01000', '10000', '11111']);

    return F;
  })();

  function drawText(c, text, x, y, col, scale = 1, align = 'left') {
    const s = String(text);
    const glyphW = 5;
    const glyphH = 7;
    const spacing = 1;
    const w = s.length ? (s.length * (glyphW + spacing) - spacing) * scale : 0;
    let xx = x;
    if (align === 'center') xx -= (w / 2) | 0;
    else if (align === 'right') xx -= w;
    c.fillStyle = col;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      const g = FONT[ch] || FONT[ch.toUpperCase()] || FONT['?'];
      for (let row = 0; row < glyphH; row++) {
        const bits = g[row] | 0;
        for (let colI = 0; colI < glyphW; colI++) {
          if (bits & (1 << (glyphW - 1 - colI))) {
            c.fillRect(xx + colI * scale, y + row * scale, scale, scale);
          }
        }
      }
      xx += (glyphW + spacing) * scale;
    }
  }

  function bitmapTextWidth(text, scale = 1) {
    const s = String(text);
    const glyphW = 5;
    const spacing = 1;
    return s.length ? (s.length * (glyphW + spacing) - spacing) * scale : 0;
  }

  function wrapBitmapText(text, maxWidth, scale = 1) {
    const source = String(text || '').trim();
    if (!source) return [''];
    const words = source.split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (bitmapTextWidth(candidate, scale) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      if (bitmapTextWidth(word, scale) <= maxWidth) {
        line = word;
        continue;
      }
      let chunk = '';
      for (const ch of word) {
        const chunkCandidate = chunk + ch;
        if (bitmapTextWidth(chunkCandidate, scale) <= maxWidth || !chunk) {
          chunk = chunkCandidate;
          continue;
        }
        lines.push(chunk);
        chunk = ch;
      }
      line = chunk;
    }
    if (line) lines.push(line);
    return lines;
  }

  // --- Pixel sprites -------------------------------------------------------

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function spriteFrom(rows, palette) {
    const h = rows.length;
    const w = rows[0].length;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const sctx = c.getContext('2d', { alpha: true });
    sctx.imageSmoothingEnabled = false;
    const img = sctx.createImageData(w, h);
    const data = img.data;
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        const idx = (y * w + x) * 4;
        if (ch === '.' || ch === ' ') {
          data[idx + 3] = 0;
          continue;
        }
        const rgb = palette[ch] || palette['?'] || { r: 255, g: 0, b: 255 };
        data[idx + 0] = rgb.r;
        data[idx + 1] = rgb.g;
        data[idx + 2] = rgb.b;
        data[idx + 3] = 255;
      }
    }
    sctx.putImageData(img, 0, 0);
    return c;
  }

  const P = {
    '0': hexToRgb(COL.ink),
    '1': hexToRgb(COL.fish0),
    '2': hexToRgb(COL.fish1),
    '3': hexToRgb(COL.fish2),
    '4': hexToRgb(COL.fish3),
    '5': hexToRgb(COL.orange),
    '6': hexToRgb(COL.red),
    '7': hexToRgb(COL.foam),
    '8': hexToRgb(COL.gray),
    '9': hexToRgb(COL.white),
    '?': { r: 255, g: 0, b: 255 },
  };

  const SPR = {
    opportunist: [
      spriteFrom(
        [
          '....00..........',
          '..002320........',
          '.023333220......',
          '023333333320....',
          '23333333339020..',
          '023333333320....',
          '.023333220......',
          '..002320........',
          '....00..........',
        ],
        P,
      ),
      spriteFrom(
        [
          '.....0..........',
          '...02220........',
          '.02333320.......',
          '023333333320....',
          '23333333339020..',
          '023333333320....',
          '.02333320.......',
          '...02220........',
          '.....0..........',
        ],
        P,
      ),
    ],
    juvenile: [
      spriteFrom(
        [
          '...00.........',
          '..02320.......',
          '.02333320.....',
          '023333339020..',
          '.02333320.....',
          '..02320.......',
          '...00.........',
        ],
        P,
      ),
      spriteFrom(
        [
          '....0.........',
          '..0220........',
          '.02333320.....',
          '023333339020..',
          '.02333320.....',
          '..0220........',
          '....0.........',
        ],
        P,
      ),
    ],
    grazer: [
      spriteFrom(
        [
          '....00.........',
          '..002320.......',
          '.02333320......',
          '02333333320....',
          '233333339020...',
          '02333333320....',
          '.02333320......',
          '..002320.......',
          '....00.........',
        ],
        P,
      ),
      spriteFrom(
        [
          '.....0.........',
          '...02220.......',
          '.02333320......',
          '02333333320....',
          '233333339020...',
          '02333333320....',
          '.02333320......',
          '...02220.......',
          '.....0.........',
        ],
        P,
      ),
    ],
    shoaler: [
      spriteFrom(
        [
          '...0............',
          '..020...........',
          '.023320.........',
          '02344449020.....',
          '.0233320........',
          '..0220..........',
          '...0............',
        ],
        P,
      ),
      spriteFrom(
        [
          '....0...........',
          '...020..........',
          '.023320.........',
          '02344449020.....',
          '.023320.........',
          '...020..........',
          '....0...........',
        ],
        P,
      ),
    ],
    hunter: [
      spriteFrom(
        [
          '....00............',
          '..002650..........',
          '.0265555520.......',
          '0265555555520.....',
          '265555555559020...',
          '0265555555520.....',
          '.0265555520.......',
          '..002650..........',
          '....00............',
        ],
        P,
      ),
      spriteFrom(
        [
          '.....0............',
          '...022650.........',
          '.0265555520.......',
          '0265555555520.....',
          '265555555559020...',
          '0265555555520.....',
          '.0265555520.......',
          '...022650.........',
          '.....0............',
        ],
        P,
      ),
    ],
    food: spriteFrom(['.77.', '7997', '7997', '.77.'], P),
    bubble: spriteFrom(['.77.', '7..7', '7..7', '.77.'], P),
    plant: spriteFrom(
      [
        '..1....1..',
        '..12..21..',
        '..123321..',
        '.12333321.',
        '1233333321',
        '..123321..',
        '...1221...',
        '....11....',
      ],
      P,
    ),
    reed: spriteFrom(
      [
        '....1....',
        '....1....',
        '...12....',
        '...12..1.',
        '..123..21',
        '..123321.',
        '.12333321',
        '.12333321',
        '..123321.',
        '...1221..',
        '....11...',
        '....11...',
      ],
      P,
    ),
    rock: spriteFrom(
      [
        '....88......',
        '..888888....',
        '.88882288...',
        '8888222288..',
        '88822222288.',
        '.8822222288.',
        '..8882288...',
        '....888.....',
      ],
      P,
    ),
    shelf: spriteFrom(
      [
        '......88........',
        '....888888......',
        '..8888228888....',
        '.888222222288...',
        '88822222222288..',
        '.888822222888...',
        '...88888888.....',
        '.....8888.......',
      ],
      P,
    ),
    snag: spriteFrom(
      [
        '......5.......',
        '.....550......',
        '....5550......',
        '...055500.....',
        '..0555550.....',
        '.055055550....',
        '0550..05550...',
        '.550...05550..',
        '..50....05550.',
        '..00.....0550.',
        '..........050.',
        '...........0..',
      ],
      P,
    ),
  };

  const FORMATION_ART_SOURCES = {
    arch: 'generated/asset-forge/item_aquarium_stone_arch.ega16.png',
    cave: 'generated/asset-forge/item_aquarium_stone_arch.ega16.png',
    reef: 'generated/asset-forge/item_aquarium_stone_arch.ega16.png',
    spine: 'generated/asset-forge/item_aquarium_boulder_spine.ega16.png',
    ridge: 'generated/asset-forge/item_aquarium_boulder_spine.ega16.png',
    shelf: 'generated/asset-forge/item_aquarium_boulder_spine.ega16.png',
    castle: 'generated/asset-forge/item_aquarium_bug_castle.ega16.png',
    screen: 'generated/asset-forge/item_aquarium_kelp_screen.ega16.png',
    snag: 'generated/asset-forge/item_aquarium_driftwood_snag.ega16.png',
  };
  const FORMATION_ART_BOUNDS = {
    arch: { left: 0, right: 1, top: 9 / 64, bottom: 52 / 64 },
    cave: { left: 0, right: 1, top: 9 / 64, bottom: 52 / 64 },
    reef: { left: 0, right: 1, top: 9 / 64, bottom: 52 / 64 },
    spine: { left: 0, right: 1, top: 13 / 64, bottom: 49 / 64 },
    ridge: { left: 0, right: 1, top: 13 / 64, bottom: 49 / 64 },
    shelf: { left: 0, right: 1, top: 13 / 64, bottom: 49 / 64 },
    castle: { left: 0, right: 1, top: 3 / 64, bottom: 58 / 64 },
    screen: { left: 6 / 64, right: 58 / 64, top: 2 / 64, bottom: 60 / 64 },
    snag: { left: 0, right: 63 / 64, top: 5 / 64, bottom: 57 / 64 },
  };
  const FORMATION_ART = Object.create(null);
  const FISH_ART_SOURCES = {
    juvenile: 'generated/asset-forge/item_fish_juvenile.ega16.png',
    juvenile_grazer: 'generated/asset-forge/item_fish_juvenile_grazer.ega16.png',
    juvenile_shoaler: 'generated/asset-forge/item_fish_juvenile_shoaler.ega16.png',
    juvenile_opportunist: 'generated/asset-forge/item_fish_juvenile_opportunist.ega16.png',
    juvenile_hunter: 'generated/asset-forge/item_fish_juvenile_hunter.ega16.png',
    grazer: 'generated/asset-forge/item_fish_grazer.ega16.png',
    shoaler: 'generated/asset-forge/item_fish_shoaler.ega16.png',
    opportunist: 'generated/asset-forge/item_fish_opportunist.ega16.png',
    hunter: 'generated/asset-forge/item_fish_hunter.ega16.png',
  };
  const FISH_ART_BOUNDS = {
    juvenile: { left: 3 / 32, right: 29 / 32, top: 8 / 32, bottom: 21 / 32 },
    juvenile_grazer: { left: 5 / 32, right: 27 / 32, top: 6 / 32, bottom: 24 / 32 },
    juvenile_shoaler: { left: 3 / 32, right: 28 / 32, top: 8 / 32, bottom: 21 / 32 },
    juvenile_opportunist: { left: 4 / 32, right: 28 / 32, top: 6 / 32, bottom: 24 / 32 },
    juvenile_hunter: { left: 3 / 32, right: 30 / 32, top: 7 / 32, bottom: 22 / 32 },
    grazer: { left: 3 / 32, right: 29 / 32, top: 6 / 32, bottom: 24 / 32 },
    shoaler: { left: 1 / 32, right: 31 / 32, top: 8 / 32, bottom: 22 / 32 },
    opportunist: { left: 3 / 32, right: 28 / 32, top: 6 / 32, bottom: 24 / 32 },
    hunter: { left: 0, right: 1, top: 8 / 32, bottom: 21 / 32 },
  };
  const FISH_ART = Object.create(null);

  function loadFormationArt() {
    if (typeof Image === 'undefined') return;
    for (const [key, src] of Object.entries(FORMATION_ART_SOURCES)) {
      if (FORMATION_ART[key]) continue;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        FORMATION_ART[key] = img;
      };
      img.onerror = () => {
        FORMATION_ART[key] = null;
      };
      img.src = src;
    }
  }

  loadFormationArt();

  function loadFishArt() {
    if (typeof Image === 'undefined') return;
    for (const [key, src] of Object.entries(FISH_ART_SOURCES)) {
      if (FISH_ART[key]) continue;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        FISH_ART[key] = img;
      };
      img.onerror = () => {
        FISH_ART[key] = null;
      };
      img.src = src;
    }
  }

  loadFishArt();

  function drawSprite(c, spr, x, y, scale, flip, tint = null, alpha = 1) {
    c.save();
    c.globalAlpha = alpha;
    c.translate(x | 0, y | 0);
    c.scale(flip ? -1 : 1, 1);
    c.imageSmoothingEnabled = false;
    const w = spr.width * scale;
    const h = spr.height * scale;
    c.drawImage(spr, (-w / 2) | 0, (-h / 2) | 0, w | 0, h | 0);
    if (tint) {
      c.globalCompositeOperation = 'source-atop';
      c.globalAlpha = alpha * 0.18;
      c.fillStyle = tint;
      c.fillRect((-w / 2) | 0, (-h / 2) | 0, w | 0, h | 0);
    }
    c.restore();
  }

  function drawImageAsset(c, img, x, y, width, height, flip = false, alpha = 1) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    c.save();
    c.globalAlpha = alpha;
    c.translate(x | 0, y | 0);
    c.scale(flip ? -1 : 1, 1);
    c.imageSmoothingEnabled = false;
    c.drawImage(img, (-width / 2) | 0, (-height / 2) | 0, width | 0, height | 0);
    c.restore();
    return true;
  }

  function drawBoundedImageAsset(c, img, bounds, x, y, targetWidth, targetHeight, flip = false, alpha = 1) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    const contentWidth = Math.max(0.25, bounds.right - bounds.left);
    const contentHeight = Math.max(0.25, bounds.bottom - bounds.top);
    const width = targetWidth / contentWidth;
    const height = targetHeight / contentHeight;
    const xOffset = ((bounds.left + bounds.right) * 0.5 - 0.5) * width * (flip ? -1 : 1);
    const yOffset = ((bounds.top + bounds.bottom) * 0.5 - 0.5) * height;
    return drawImageAsset(c, img, x + xOffset, y + yOffset, width, height, flip, alpha);
  }

  function spriteFrame(spr, phase = 0) {
    if (!Array.isArray(spr)) return spr;
    const idx = Math.abs(phase | 0) % spr.length;
    return spr[idx];
  }

  // --- Background ----------------------------------------------------------

  const bg = (() => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const b = c.getContext('2d', { alpha: false });
    const img = b.createImageData(W, H);
    const d = img.data;
    const top = hexToRgb(COL.water0);
    const mid = hexToRgb(COL.water2);
    const bot = hexToRgb(COL.water3);
    const sand = hexToRgb(COL.sand2);
    for (let y = 0; y < H; y++) {
      const t = y / (H - 1);
      const t2 = t < 0.7 ? t / 0.7 : (t - 0.7) / 0.3;
      const c0 = t < 0.7 ? top : mid;
      const c1 = t < 0.7 ? mid : bot;
      let r = (lerp(c0.r, c1.r, t2) + 0.5) | 0;
      let g = (lerp(c0.g, c1.g, t2) + 0.5) | 0;
      let b0 = (lerp(c0.b, c1.b, t2) + 0.5) | 0;

      const sandLine = WORLD.sandLine;
      const sandT = clamp((y - sandLine) / 22, 0, 1);
      if (sandT > 0) {
        r = (lerp(r, sand.r, sandT) + 0.5) | 0;
        g = (lerp(g, sand.g, sandT) + 0.5) | 0;
        b0 = (lerp(b0, sand.b, sandT) + 0.5) | 0;
      }

      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const n = ((x * 13 + y * 17) & 7) - 3;
        const dither = ((x + y) & 1) ? 1 : -1;
        const v = n + dither;
        d[i + 0] = clamp(r + v, 0, 255);
        d[i + 1] = clamp(g + v, 0, 255);
        d[i + 2] = clamp(b0 + v, 0, 255);
        d[i + 3] = 255;
      }
    }
    b.putImageData(img, 0, 0);
    return c;
  })();

  const noise = (() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const nctx = c.getContext('2d', { alpha: true });
    const img = nctx.createImageData(c.width, c.height);
    return { c, nctx, img };
  })();

  function updateNoise() {
    const { nctx, img } = noise;
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = randi(0, 255);
      d[i + 0] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = randi(0, 28);
    }
    nctx.putImageData(img, 0, 0);
  }

  function makeRng(seed) {
    let t = (seed >>> 0) || 1;
    const next = () => {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      next.state = t >>> 0;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
    next.state = t >>> 0;
    return next;
  }

  function cloneData(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  // --- Simulation ----------------------------------------------------------

  const SIM = {
    initialFish: 24,
    initialFood: 40,
    maxFish: 62,
    foodCap: 96,
    foodCapLeanFactor: 0.68,
    foodSpawnMin: 0.12,
    foodSpawnMax: 0.28,
    decoCap: 52,
    metabolism: 1.25,
    leanMetabolismBoost: 0.18,
    motionDrain: 0.015,
    foodEnergy: 16,
    preyEnergy: 26,
    reproductionEnergy: 92,
    reproductionCooldownMin: 9,
    reproductionCooldownMax: 15,
    mutation: 0.12,
    mutationSight: scaleWorld(8),
    socialRadius: scaleWorld(42),
    crowdRadius: scaleWorld(18),
    immigrationThreshold: 8,
    immigrationEvery: 12,
    reseedDelay: 3.2,
    seedBase: 240311,
    seedStep: 977,
    fixedDt: 1 / 60,
    maxSubsteps: 6,
    seasonRate: 0.072,
    bloomMinRadius: scaleWorld(18),
    bloomMaxRadius: scaleWorld(34),
    currentStrength: scaleWorld(11.5),
    currentVerticalStrength: scaleWorld(4.2),
    currentResistanceDrain: 0.018,
    detritusCap: 220,
    planktonCap: 40,
    detritusSink: scaleWorld(12),
    detritusDecayMin: 6,
    detritusDecayMax: 12,
    wasteEveryMin: 3.2,
    wasteEveryMax: 6.2,
    juvenileMaturityMin: 14,
    juvenileMaturityMax: 22,
    juvenileGrowth: 0.52,
    juvenileAdultThreshold: 0.88,
    memoryDuration: 18,
    satiationDecay: 0.085,
    predatorCooldownMin: 2.8,
    predatorCooldownMax: 5.2,
    disturbanceEveryMin: 18,
    disturbanceEveryMax: 34,
    disturbanceDurationMin: 8,
    disturbanceDurationMax: 15,
    trailPoints: 16,
    trailSampleEvery: 0.18,
    eventLogMax: 18,
  };

  const TUNE = {
    foodFlow: 1,
    metabolism: 1,
    fertility: 1,
    season: 1,
  };

  const HISTORY = {
    points: [],
    clock: 0,
    sampleEvery: 0.5,
    maxPoints: 72,
  };

  const PRESETS = {
    scarce: {
      label: 'Scarce',
      note: 'Low food and higher burn rates make bottlenecks and recoveries show up quickly.',
      values: { foodFlow: 0.82, metabolism: 1.18, fertility: 0.90, season: 1.10 },
    },
    balanced: {
      label: 'Balanced',
      note: 'Balanced baseline. Good for watching slow ecological turnover.',
      values: { foodFlow: 1.00, metabolism: 1.00, fertility: 1.00, season: 1.00 },
    },
    bloom: {
      label: 'Bloom',
      note: 'Rich water and softer burn rates promote feeding clusters and short baby booms.',
      values: { foodFlow: 1.28, metabolism: 0.92, fertility: 1.10, season: 0.82 },
    },
    volatile: {
      label: 'Volatile',
      note: 'Fast seasons and higher turnover push the tank into more dramatic swings.',
      values: { foodFlow: 1.06, metabolism: 1.22, fertility: 1.18, season: 1.55 },
    },
  };

  const DEFAULT_LINEUP = ['grazer', 'shoaler', 'grazer', 'opportunist', 'shoaler', 'grazer', 'hunter', 'shoaler', 'opportunist', 'grazer', 'hunter', 'shoaler'];

  const SCENARIOS = {
    baseline: {
      label: 'Baseline Drift',
      note: 'Balanced pressure and a standard seeded population for comparing routes, wakes, and slow turnover.',
      focus: 'Good for reading the base ecology before applying a stronger scenario.',
      seed: 240311,
      values: { foodFlow: 1.00, metabolism: 1.00, fertility: 1.00, season: 1.00 },
      population: { count: SIM.initialFish, foodCount: SIM.initialFood, juvenileRatio: 0.18, lineup: DEFAULT_LINEUP },
      env: { season: 0.50 },
    },
    nursery_pressure: {
      label: 'Nursery Pressure',
      note: 'More juveniles, leaner feeding pressure, and shelter-heavy lanes make refuge use and wake clustering easier to read.',
      focus: 'Watch juvenile traffic pile into shelter pockets while adults patrol the open lanes around them.',
      seed: 241288,
      values: { foodFlow: 0.90, metabolism: 1.08, fertility: 0.96, season: 0.94 },
      population: {
        count: 28,
        foodCount: 30,
        juvenileRatio: 0.42,
        lineup: ['grazer', 'shoaler', 'grazer', 'shoaler', 'opportunist', 'shoaler', 'hunter', 'grazer', 'shoaler', 'opportunist'],
      },
      env: {
        season: 0.38,
        nutrientPatches: [
          { x: 0.22, y: 0.78, nut: 3.2 },
          { x: 0.78, y: 0.74, nut: 2.6 },
        ],
      },
    },
    predator_bloom: {
      label: 'Predator Bloom',
      note: 'Richer water and a carnivore-heavy mix create visible hunting waves around bloom lanes and structure edges.',
      focus: 'Watch hunters and opportunists cycle between bloom-fed recovery and short predation bursts.',
      seed: 246173,
      values: { foodFlow: 1.16, metabolism: 1.02, fertility: 1.08, season: 0.92 },
      population: {
        count: 26,
        foodCount: 48,
        juvenileRatio: 0.12,
        lineup: ['hunter', 'opportunist', 'shoaler', 'hunter', 'opportunist', 'grazer', 'hunter', 'shoaler', 'opportunist', 'hunter'],
      },
      env: {
        season: 0.66,
        nutrientPatches: [
          { x: 0.34, y: 0.42, nut: 3.4 },
          { x: 0.68, y: 0.55, nut: 3.8 },
        ],
      },
    },
    lean_recovery: {
      label: 'Lean Recovery',
      note: 'Starts on the back side of a crash with fewer fish, tight food, and recovery plumes that can trigger a rebound.',
      focus: 'Watch whether recovering food pockets rebuild grazers first or simply feed another predator wave.',
      seed: 240311,
      values: { foodFlow: 0.88, metabolism: 1.12, fertility: 0.92, season: 1.05 },
      population: {
        count: 18,
        foodCount: 18,
        juvenileRatio: 0.24,
        lineup: ['grazer', 'shoaler', 'opportunist', 'grazer', 'hunter', 'shoaler', 'grazer', 'opportunist'],
      },
      env: {
        season: 0.28,
        foodCrash: 0.18,
        nutrientPatches: [
          { x: 0.20, y: 0.82, nut: 4.4 },
          { x: 0.56, y: 0.76, nut: 3.8 },
          { x: 0.80, y: 0.80, nut: 3.2 },
        ],
      },
    },
    murky_shock: {
      label: 'Murky Shock',
      note: 'A balanced tank starts under murk pressure, forcing fish to rely more on memory, shelter, and short-range cues.',
      focus: 'Watch routes compress and split as visibility drops, then see which lineages recover cleanly afterward.',
      seed: 244219,
      values: { foodFlow: 1.00, metabolism: 1.05, fertility: 1.00, season: 1.14 },
      population: { count: 24, foodCount: 34, juvenileRatio: 0.18, lineup: DEFAULT_LINEUP },
      env: {
        season: 0.52,
        disturbance: { active: 'murk', strength: 0.62, duration: 12, timer: 24 },
      },
    },
  };

  const VIEW = {
    trails: true,
    foodMap: true,
    current: false,
  };

  const REPLAY = {
    sampleEvery: 1,
    maxSeconds: 45,
    maxBookmarks: 6,
    maxVisibleBookmarks: 5,
    buffer: [],
    bookmarks: [],
    returnSnapshot: null,
    clock: 0,
    nextId: 1,
    activeSnapshotId: null,
  };

  const WATCH_VIEW = {
    cardVisible: false,
    slot: 'tr',
    slotHold: 0,
    lastSubjectId: null,
  };

  const WATCH_PREFIX = {
    grazer: ['Reed', 'Drift', 'Loam', 'Silt', 'Moss', 'Rill'],
    shoaler: ['Glint', 'Ribbon', 'Flicker', 'Current', 'Shiver', 'Needle'],
    opportunist: ['Skim', 'Brine', 'Scuff', 'Rook', 'Slip', 'Mottle'],
    hunter: ['Wake', 'Razor', 'Talon', 'Pike', 'Mako', 'Vanta'],
  };
  const WATCH_SUFFIX = ['Thread', 'Echo', 'Notch', 'Trace', 'Gleam', 'Drift', 'Flash', 'Latch', 'Ridge', 'Veer'];

  const FISH_TINTS = [COL.fish1, COL.fish2, COL.fish3, COL.orange, COL.gray];
  function spreadPositions(count, start, end, wobble = 0) {
    if (count <= 1) return [(start + end) * 0.5];
    const out = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const x = lerp(start, end, t) + Math.sin(i * 1.73) * wobble;
      out.push(clamp(x, start, end));
    }
    return out;
  }

  function waterLaneY(frac) {
    return lerp(WORLD.waterTop + scaleWorld(12), WORLD.sandLine - scaleWorld(10), clamp(frac, 0, 1));
  }

  function bottomAnchorY(height, clearance = 2, centerBias = 0.5) {
    const baseY = WORLD.plantBaseY - scaleWorld(clearance);
    return {
      baseY,
      centerY: baseY - scaleWorld(height * centerBias),
    };
  }

  function formationFrom(spec) {
    const rx = scaleWorld(spec.w * 0.5);
    const ry = scaleWorld(spec.h * 0.5);
    const anchored = spec.anchorBottom !== false;
    const grounded = anchored ? bottomAnchorY(spec.h, spec.clearance ?? 2, spec.centerBias ?? 0.5) : { baseY: waterLaneY(spec.y) + ry, centerY: waterLaneY(spec.y) };
    return {
      id: spec.id,
      kind: spec.kind,
      x: lerp(scaleWorld(32), W - scaleWorld(32), spec.x),
      y: grounded.centerY,
      baseY: grounded.baseY,
      rx,
      ry,
      wakeLength: scaleWorld(spec.wakeLength ?? spec.w * 1.55),
      wakeWidth: scaleWorld(spec.wakeWidth ?? spec.h * 0.92),
      shelter: spec.shelter,
      school: spec.school,
      calm: spec.calm,
      deflect: scaleWorld(spec.deflect ?? 4.8),
      lane: scaleWorld(spec.lane ?? 2.8),
      solidity: spec.solidity ?? 0.9,
      layer: spec.layer ?? 'front',
      alpha: spec.alpha ?? 0.48,
      flowX: 1,
      flowY: 0,
      perpX: 0,
      perpY: 1,
      wakeX: 0,
      wakeY: 0,
      wakeR: scaleWorld(spec.wakeWidth ?? spec.h * 0.92),
      art: spec.art ?? spec.kind,
      anchorBottom: anchored,
    };
  }

  const LIGHT_COLUMNS = spreadPositions(8, scaleWorld(34), W - scaleWorld(34), scaleWorld(6));
  const PLANT_REFUGES = spreadPositions(12, scaleWorld(22), W - scaleWorld(22), scaleWorld(4));
  function sampleBetween(range, rng) {
    return Array.isArray(range) ? lerp(range[0], range[1], rng()) : range;
  }

  function pickFrom(list, rng) {
    return list[Math.floor(rng() * list.length)];
  }

  const FORMATION_LIBRARY = {
    cave: {
      kind: 'cave',
      art: 'cave',
      w: [50, 68],
      h: [24, 34],
      wakeLength: [72, 92],
      wakeWidth: [20, 26],
      shelter: [0.82, 0.92],
      school: [0.26, 0.40],
      calm: [0.68, 0.78],
      deflect: [5.2, 6.0],
      lane: [3.0, 3.6],
      solidity: [0.92, 0.98],
      layer: 'front',
      alpha: [0.56, 0.66],
      clearance: [1.5, 3.5],
      centerBias: [0.46, 0.54],
    },
    ridge: {
      kind: 'ridge',
      art: 'ridge',
      w: [68, 88],
      h: [16, 24],
      wakeLength: [88, 110],
      wakeWidth: [16, 22],
      shelter: [0.72, 0.82],
      school: [0.48, 0.62],
      calm: [0.58, 0.70],
      deflect: [5.8, 6.8],
      lane: [3.4, 4.2],
      solidity: [0.90, 0.96],
      layer: 'front',
      alpha: [0.48, 0.58],
      clearance: [1.0, 2.5],
      centerBias: [0.44, 0.52],
    },
    castle: {
      kind: 'castle',
      art: 'castle',
      w: [38, 52],
      h: [44, 60],
      wakeLength: [70, 92],
      wakeWidth: [18, 24],
      shelter: [0.82, 0.94],
      school: [0.34, 0.48],
      calm: [0.64, 0.76],
      deflect: [4.6, 5.5],
      lane: [2.8, 3.4],
      solidity: [0.88, 0.95],
      layer: 'front',
      alpha: [0.50, 0.62],
      clearance: [1.0, 3.0],
      centerBias: [0.48, 0.56],
    },
    screen: {
      kind: 'screen',
      art: 'screen',
      w: [20, 30],
      h: [66, 86],
      wakeLength: [70, 86],
      wakeWidth: [22, 30],
      shelter: [0.68, 0.80],
      school: [0.54, 0.68],
      calm: [0.54, 0.66],
      deflect: [3.8, 4.8],
      lane: [2.2, 2.8],
      solidity: [0.54, 0.66],
      layer: 'back',
      alpha: [0.30, 0.40],
      clearance: [1.0, 3.0],
      centerBias: [0.50, 0.58],
    },
    snag: {
      kind: 'snag',
      art: 'snag',
      w: [28, 38],
      h: [42, 58],
      wakeLength: [64, 82],
      wakeWidth: [18, 24],
      shelter: [0.58, 0.72],
      school: [0.24, 0.36],
      calm: [0.48, 0.58],
      deflect: [4.7, 5.6],
      lane: [2.3, 2.9],
      solidity: [0.78, 0.88],
      layer: 'mid',
      alpha: [0.42, 0.52],
      clearance: [1.0, 3.0],
      centerBias: [0.46, 0.54],
    },
  };

  const FORMATION_SLOTS = [
    { id: 'west', kinds: ['ridge', 'cave'], x: [0.15, 0.24] },
    { id: 'center', kinds: ['castle', 'cave'], x: [0.47, 0.55] },
    { id: 'east', kinds: ['snag', 'ridge', 'castle'], x: [0.77, 0.86] },
  ];

  const OPTIONAL_FORMATION_SLOTS = [
    { id: 'accent-left', kinds: ['screen', 'snag'], x: [0.30, 0.38] },
    { id: 'accent-right', kinds: ['screen', 'snag'], x: [0.62, 0.70] },
  ];

  let FORMATIONS = [];
  let SHELTER_POCKETS = [];
  let REED_BEDS = [];
  let ROCK_CLUSTERS = [];

  function buildFormationForSlot(slot, rng, index) {
    const key = pickFrom(slot.kinds, rng);
    const lib = FORMATION_LIBRARY[key];
    return formationFrom({
      id: `${slot.id}-${key}-${index}`,
      kind: lib.kind,
      art: lib.art,
      x: sampleBetween(slot.x, rng),
      y: sampleBetween(slot.y, rng),
      w: sampleBetween(lib.w, rng),
      h: sampleBetween(lib.h, rng),
      wakeLength: sampleBetween(lib.wakeLength, rng),
      wakeWidth: sampleBetween(lib.wakeWidth, rng),
      shelter: sampleBetween(lib.shelter, rng),
      school: sampleBetween(lib.school, rng),
      calm: sampleBetween(lib.calm, rng),
      deflect: sampleBetween(lib.deflect, rng),
      lane: sampleBetween(lib.lane, rng),
      solidity: sampleBetween(lib.solidity, rng),
      layer: lib.layer,
      alpha: sampleBetween(lib.alpha, rng),
      clearance: sampleBetween(lib.clearance, rng),
      centerBias: sampleBetween(lib.centerBias, rng),
    });
  }

  function spreadFormationPositions() {
    const margin = scaleWorld(24);
    FORMATIONS.sort((a, b) => a.x - b.x);
    for (let i = 1; i < FORMATIONS.length; i++) {
      const prev = FORMATIONS[i - 1];
      const cur = FORMATIONS[i];
      const minX = prev.x + prev.rx + cur.rx + margin;
      if (cur.x < minX) cur.x = minX;
    }
    for (let i = FORMATIONS.length - 2; i >= 0; i--) {
      const next = FORMATIONS[i + 1];
      const cur = FORMATIONS[i];
      const maxX = next.x - next.rx - cur.rx - margin;
      if (cur.x > maxX) cur.x = maxX;
    }
    for (const formation of FORMATIONS) {
      formation.x = clamp(formation.x, WORLD.edgePad + formation.rx, W - WORLD.edgePad - formation.rx);
    }
  }

  function ensureHabitatVariety(rng) {
    const hardKinds = new Set(['cave', 'castle']);
    if (!FORMATIONS.some((formation) => hardKinds.has(formation.kind))) {
      FORMATIONS[1] = buildFormationForSlot({ id: 'center-rescue', kinds: ['castle', 'cave'], x: [0.47, 0.55] }, rng, 1);
    }

    const screenIndexes = [];
    for (let i = 0; i < FORMATIONS.length; i++) {
      if (FORMATIONS[i].kind === 'screen') screenIndexes.push(i);
    }
    for (let i = 1; i < screenIndexes.length; i++) {
      FORMATIONS[screenIndexes[i]] = buildFormationForSlot({ id: `screen-swap-${i}`, kinds: ['snag', 'ridge'], x: [0.28 + i * 0.18, 0.34 + i * 0.18] }, rng, screenIndexes[i]);
    }
  }

  function rebuildHabitat(seed = currentSeed) {
    const rng = makeRng((seed ^ 0x9e3779b9) >>> 0);
    FORMATIONS = FORMATION_SLOTS.map((slot, index) => buildFormationForSlot(slot, rng, index));
    const extraCount = rng() < 0.38 ? 1 : 0;
    for (let i = 0; i < extraCount; i++) {
      const slot = pickFrom(OPTIONAL_FORMATION_SLOTS, rng);
      FORMATIONS.push(buildFormationForSlot(slot, rng, FORMATIONS.length));
    }
    ensureHabitatVariety(rng);
    spreadFormationPositions();
    refreshFormationCache();

    SHELTER_POCKETS = [
      { x: scaleWorld(22), y: WORLD.sandLine - scaleWorld(6), r: scaleWorld(28) },
      { x: W - scaleWorld(22), y: WORLD.sandLine - scaleWorld(6), r: scaleWorld(28) },
      { x: scaleWorld(30), y: waterLaneY(0.66), r: scaleWorld(22) },
      { x: W - scaleWorld(30), y: waterLaneY(0.66), r: scaleWorld(22) },
      ...PLANT_REFUGES.map((x, index) => ({
        x,
        y: WORLD.plantBaseY - scaleWorld(index % 2 === 0 ? 8 : 11),
        r: scaleWorld(index === 0 || index === PLANT_REFUGES.length - 1 ? 27 : 23),
      })),
      ...PLANT_REFUGES.filter((_, index) => index > 0 && index < PLANT_REFUGES.length - 1 && index % 2 === 1).map((x) => ({
        x: x + scaleWorld(8),
        y: WORLD.plantBaseY - scaleWorld(30),
        r: scaleWorld(17),
      })),
      ...FORMATIONS.flatMap((formation) => [
        { x: formation.x, y: formation.baseY - formation.ry * 0.38, r: Math.max(scaleWorld(18), formation.ry * 0.82) },
        { x: formation.wakeX, y: formation.wakeY, r: Math.max(scaleWorld(16), formation.wakeWidth * 0.72) },
      ]),
    ];

    REED_BEDS = [
      ...PLANT_REFUGES.map((x, index) => ({
        x: x + Math.sin(index * 0.6 + seed * 0.0002) * scaleWorld(4),
        y: WORLD.plantBaseY - scaleWorld(index % 3 === 0 ? 35 : index % 2 === 0 ? 30 : 26),
        scale: 0.88 + (index % 4) * 0.12,
        alpha: 0.13 + (index % 3) * 0.02,
      })),
      ...FORMATIONS.filter((formation) => formation.kind === 'screen').flatMap((formation, index) => [
        { x: formation.x - formation.rx * 0.36, y: formation.baseY - scaleWorld(8), scale: 1.06 + index * 0.04, alpha: 0.18 + index * 0.02 },
        { x: formation.x + formation.rx * 0.18, y: formation.baseY - scaleWorld(4), scale: 1.22, alpha: 0.22 },
        { x: formation.x + formation.rx * 0.42, y: formation.baseY - scaleWorld(10), scale: 0.94, alpha: 0.16 },
      ]),
      ...FORMATIONS.filter((formation) => formation.kind !== 'screen' && formation.layer !== 'back').map((formation, index) => ({
        x: formation.x + formation.rx * (rng() * 0.6 - 0.3),
        y: formation.baseY - scaleWorld(4 + rng() * 8),
        scale: 0.84 + (index % 3) * 0.14,
        alpha: 0.10 + formation.alpha * 0.10,
      })),
    ];

    ROCK_CLUSTERS = [
      ...FORMATIONS.filter((formation) => formation.kind !== 'screen').map((formation, index) => ({
        x: formation.x + (rng() * 2 - 1) * formation.rx * 0.12,
        y: formation.baseY + scaleWorld(2),
        scale: 0.94 + (index % 3) * 0.15 + rng() * 0.08,
        alpha: 0.38 + formation.alpha * 0.26,
      })),
      { x: scaleWorld(48), y: WORLD.plantBaseY + scaleWorld(2), scale: 0.92, alpha: 0.40 },
      { x: W * 0.34, y: WORLD.plantBaseY + scaleWorld(1), scale: 0.98, alpha: 0.34 },
      { x: W * 0.67, y: WORLD.plantBaseY + scaleWorld(2), scale: 1.08, alpha: 0.42 },
      { x: W - scaleWorld(44), y: WORLD.plantBaseY + scaleWorld(1), scale: 0.96, alpha: 0.38 },
    ];
  }
  const LINEAGE_TINTS = ['#7ad9ff', '#ffe66d', '#ff8c69', '#83f29d', '#cbb6ff', '#f6f2ff', '#89d0c2', '#ffbf69'];
  const ARCHETYPES = [
    {
      id: 'grazer',
      label: 'GRAZER',
      weight: 0.32,
      size: [scaleWorld(4.1), scaleWorld(5.9)],
      tint: COL.fish2,
      traits: {
        speed: [1.02, 1.24],
        turn: [1.00, 1.28],
        fear: [0.95, 1.30],
        greed: [0.72, 1.02],
        social: [0.88, 1.38],
        sight: [scaleWorld(50), scaleWorld(86)],
        carnivore: [0.05, 0.18],
        bloom: [0.88, 1.25],
        refuge: [0.72, 1.10],
        depth: [0.76, 0.94],
      },
    },
    {
      id: 'shoaler',
      label: 'SHOAL',
      weight: 0.27,
      size: [scaleWorld(4.6), scaleWorld(6.9)],
      tint: COL.fish3,
      traits: {
        speed: [0.94, 1.16],
        turn: [0.90, 1.16],
        fear: [0.88, 1.18],
        greed: [0.88, 1.16],
        social: [1.10, 1.45],
        sight: [scaleWorld(46), scaleWorld(82)],
        carnivore: [0.18, 0.34],
        bloom: [0.55, 0.92],
        refuge: [0.52, 0.84],
        depth: [0.34, 0.58],
      },
    },
    {
      id: 'opportunist',
      label: 'OPPORT',
      weight: 0.25,
      size: [scaleWorld(5.5), scaleWorld(7.9)],
      tint: COL.orange,
      traits: {
        speed: [0.86, 1.08],
        turn: [0.84, 1.08],
        fear: [0.62, 0.96],
        greed: [1.00, 1.28],
        social: [0.48, 0.88],
        sight: [scaleWorld(58), scaleWorld(94)],
        carnivore: [0.42, 0.66],
        bloom: [0.28, 0.55],
        refuge: [0.28, 0.56],
        depth: [0.48, 0.74],
      },
    },
    {
      id: 'hunter',
      label: 'HUNTER',
      weight: 0.16,
      size: [scaleWorld(7.5), scaleWorld(9.7)],
      tint: COL.gray,
      traits: {
        speed: [0.72, 0.98],
        turn: [0.72, 0.96],
        fear: [0.42, 0.68],
        greed: [1.18, 1.48],
        social: [0.20, 0.50],
        sight: [scaleWorld(74), scaleWorld(112)],
        carnivore: [0.78, 1.00],
        bloom: [0.08, 0.24],
        refuge: [0.06, 0.18],
        depth: [0.24, 0.52],
      },
    },
  ];

  let simRand = makeRng(SIM.seedBase);
  let currentSeed = SIM.seedBase;
  let runIndex = 0;
  let simAccumulator = 0;
  let uiClock = 0;
  let activePreset = 'balanced';
  let nextLineageId = 1;
  let nextFishId = 1;
  let paused = false;
  let controlsOpen = false;
  let cinematic = false;
  let currentScenarioId = 'baseline';
  let selectedFishId = null;
  let selectedFishPin = null;
  let highlightedLineage = null;
  let pauseReason = '';
  let pauseClock = 0;
  let last = performance.now();

  function randSim(a = 0, b = 1) {
    return a + simRand() * (b - a);
  }

  function randiSim(a, bInclusive) {
    return a + ((simRand() * (bInclusive - a + 1)) | 0);
  }

  function sampleRange(range) {
    return randSim(range[0], range[1]);
  }

  function archetypeById(id) {
    return ARCHETYPES.find((entry) => entry.id === id) || ARCHETYPES[0];
  }

  function juvenileRatioRangeFor(archetypeId) {
    if (archetypeId === 'hunter') return [0.34, 0.46];
    if (archetypeId === 'opportunist') return [0.40, 0.52];
    if (archetypeId === 'shoaler') return [0.44, 0.56];
    return [0.46, 0.58];
  }

  function pickArchetype(preferred = null) {
    if (preferred) return archetypeById(preferred);
    let pick = randSim();
    for (const entry of ARCHETYPES) {
      pick -= entry.weight;
      if (pick <= 0) return entry;
    }
    return ARCHETYPES[ARCHETYPES.length - 1];
  }

  function currentReproductionEnergy() {
    return SIM.reproductionEnergy / TUNE.fertility;
  }

  function currentMaxEnergy() {
    return currentReproductionEnergy() * 1.45;
  }

  function currentFoodCap(season) {
    const crash = g && g.env ? lerp(1, 0.58, g.env.foodCrash || 0) : 1;
    return Math.max(10, Math.round(lerp(SIM.foodCap * SIM.foodCapLeanFactor, SIM.foodCap, season) * TUNE.foodFlow * crash));
  }

  function nextFoodInterval(season) {
    const crash = g && g.env ? lerp(1, 1.8, g.env.foodCrash || 0) : 1;
    const min = clamp((lerp(0.34, SIM.foodSpawnMin, season) / TUNE.foodFlow) * crash, 0.05, 1.45);
    const max = clamp((lerp(0.54, SIM.foodSpawnMax, season) / TUNE.foodFlow) * crash, min + 0.02, 1.85);
    return randSim(min, max);
  }

  function nextLineageTint(id) {
    return LINEAGE_TINTS[(Math.max(1, id) - 1) % LINEAGE_TINTS.length];
  }

  function disturbanceLabel() {
    if (!g || !g.env || !g.env.disturbance.active) return 'Calm water';
    const type = g.env.disturbance.active;
    if (type === 'reversal') return 'Current reversal';
    if (type === 'murk') return 'Murk bloom';
    if (type === 'oxygen') return 'Oxygen dip';
    if (type === 'crash') return 'Food crash';
    return 'Disturbance';
  }

  function scenarioById(id) {
    return SCENARIOS[id] || SCENARIOS.baseline;
  }

  function currentScenario() {
    return scenarioById(currentScenarioId);
  }

  function activeReplaySnapshot() {
    if (REPLAY.activeSnapshotId == null) return null;
    return REPLAY.bookmarks.find((entry) => entry.id === REPLAY.activeSnapshotId) || REPLAY.buffer.find((entry) => entry.id === REPLAY.activeSnapshotId) || null;
  }

  function replayIndexForSnapshot(snapshot) {
    if (!snapshot || !REPLAY.buffer.length) return REPLAY.buffer.length;
    const direct = REPLAY.buffer.findIndex((entry) => entry.id === snapshot.id);
    if (direct >= 0) return direct;
    let nearest = 0;
    for (const [index, entry] of REPLAY.buffer.entries()) {
      if (entry.takenAt <= snapshot.takenAt) nearest = index;
      else break;
    }
    return nearest;
  }

  function pointFromNormalized(nx, ny) {
    return {
      x: lerp(WORLD.edgePad, W - WORLD.edgePad, clamp(nx, 0, 1)),
      y: lerp(WORLD.waterTopSoft, WORLD.waterBottom, clamp(ny, 0, 1)),
    };
  }

  function resetReplayState() {
    REPLAY.buffer.length = 0;
    REPLAY.bookmarks.length = 0;
    REPLAY.returnSnapshot = null;
    REPLAY.clock = 0;
    REPLAY.activeSnapshotId = null;
    REPLAY.nextId = 1;
  }

  function rebaseReplayBuffer(label = 'Recent') {
    REPLAY.buffer.length = 0;
    REPLAY.clock = REPLAY.sampleEvery;
    captureReplaySnapshot('auto', label);
  }

  function makeReplaySnapshot(kind = 'auto', label = '') {
    return {
      id: REPLAY.nextId++,
      kind,
      label,
      takenAt: Number(g.time.toFixed(2)),
      scenarioId: currentScenarioId,
      currentSeed,
      seedBase: SIM.seedBase,
      runIndex,
      paused,
      pauseReason,
      tune: cloneData(TUNE),
      history: cloneData(HISTORY),
      selectedFishId,
      selectedFishPin: cloneData(selectedFishPin),
      highlightedLineage,
      rngState: simRand && Number.isFinite(simRand.state) ? simRand.state : currentSeed,
      state: cloneData(g),
    };
  }

  function captureReplaySnapshot(kind = 'auto', label = '') {
    const snapshot = makeReplaySnapshot(kind, label);
    REPLAY.buffer.push(snapshot);
    const maxEntries = Math.max(1, Math.round(REPLAY.maxSeconds / REPLAY.sampleEvery));
    if (REPLAY.buffer.length > maxEntries) REPLAY.buffer.shift();
    return snapshot;
  }

  function restoreReplaySnapshot(snapshot, preserveReturn = true, preserveSelection = true) {
    if (!snapshot) return false;
    const preservedSelectionId = selectedFishId;
    const preservedSelectionPin = cloneData(selectedFishPin);
    const preservedLineage = highlightedLineage;
    if (preserveReturn && REPLAY.activeSnapshotId == null && !REPLAY.returnSnapshot) {
      REPLAY.returnSnapshot = makeReplaySnapshot('live', 'Live return');
    }
    currentScenarioId = snapshot.scenarioId || currentScenarioId;
    for (const [key, value] of Object.entries(snapshot.tune || {})) {
      if (key in TUNE) TUNE[key] = value;
    }
    currentSeed = snapshot.currentSeed || currentSeed;
    SIM.seedBase = snapshot.seedBase || currentSeed;
    runIndex = snapshot.runIndex || 0;
    simRand = makeRng(snapshot.rngState || currentSeed);
    rebuildHabitat(currentSeed);
    g = cloneData(snapshot.state);
    HISTORY.points = cloneData(snapshot.history?.points || []);
    HISTORY.clock = snapshot.history?.clock || 0;
    selectedFishId = preserveSelection ? preservedSelectionId : snapshot.selectedFishId ?? null;
    selectedFishPin = preserveSelection ? preservedSelectionPin : cloneData(snapshot.selectedFishPin ?? null);
    highlightedLineage = preserveSelection ? preservedLineage : snapshot.highlightedLineage ?? null;
    WATCH_VIEW.slotHold = 0;
    WATCH_VIEW.lastSubjectId = selectedFishId;
    const restoringLiveBranch = snapshot.kind === 'live' && !preserveReturn;
    paused = restoringLiveBranch ? Boolean(snapshot.paused) : true;
    pauseReason = paused ? (restoringLiveBranch ? snapshot.pauseReason || 'manual' : 'replay') : '';
    pauseClock = 0;
    simAccumulator = 0;
    uiClock = 0;
    last = performance.now();
    REPLAY.activeSnapshotId = snapshot.kind === 'live' ? null : snapshot.id;
    syncControlInputs();
    updateUiPanels(true);
    return true;
  }

  function replaySnapshotFromBuffer(secondsBack) {
    if (!REPLAY.buffer.length) return null;
    const target = Math.max(0, g.time - secondsBack);
    let pick = REPLAY.buffer[0];
    for (const snapshot of REPLAY.buffer) {
      if (snapshot.takenAt <= target) pick = snapshot;
      else break;
    }
    return pick;
  }

  function scrubReplayTo(indexValue) {
    const liveIndex = REPLAY.buffer.length;
    const index = clamp(Math.round(Number(indexValue) || 0), 0, liveIndex);
    if (index >= liveIndex) {
      if (REPLAY.activeSnapshotId != null) return returnToLive();
      syncReplayUi();
      return true;
    }
    const snapshot = REPLAY.buffer[index];
    if (!snapshot) return false;
    const restored = restoreReplaySnapshot(snapshot, true);
    if (restored) pauseReason = 'replay';
    return restored;
  }

  function addBookmark() {
    const label = `Bookmark ${REPLAY.bookmarks.length + 1}`;
    const snapshot = makeReplaySnapshot('bookmark', label);
    REPLAY.bookmarks.unshift(snapshot);
    if (REPLAY.bookmarks.length > REPLAY.maxBookmarks) REPLAY.bookmarks.length = REPLAY.maxBookmarks;
    pushEvent('bookmark', `${label} saved`, `${currentScenario().label} at T+${formatEventTime(snapshot.takenAt)} with ${snapshot.state.fish.length} fish in view.`, {
      lineage: highlightedLineage,
    });
    updateUiPanels(true);
    return snapshot;
  }

  function rewindReplay(secondsBack) {
    const snapshot = replaySnapshotFromBuffer(secondsBack);
    if (!snapshot) return false;
    const restored = restoreReplaySnapshot(snapshot, true);
    if (restored) {
      pauseReason = 'replay';
      SFX.play('ui');
    }
    return restored;
  }

  function restoreBookmark(id) {
    const snapshot = REPLAY.bookmarks.find((entry) => entry.id === id);
    if (!snapshot) return false;
    const restored = restoreReplaySnapshot(snapshot, true);
    if (restored) SFX.play('ui');
    return restored;
  }

  function returnToLive() {
    if (!REPLAY.returnSnapshot) return false;
    const snapshot = REPLAY.returnSnapshot;
    REPLAY.returnSnapshot = null;
    const restored = restoreReplaySnapshot(snapshot, false);
    if (restored) {
      REPLAY.activeSnapshotId = null;
      rebaseReplayBuffer('Live edge');
      updateUiPanels(true);
      SFX.play('ui');
    }
    return restored;
  }

  function pocketShelterAt(x, y) {
    let shelter = 0;
    for (const pocket of SHELTER_POCKETS) {
      const d = hypot(x - pocket.x, y - pocket.y);
      if (d > pocket.r) continue;
      shelter = Math.max(shelter, 1 - d / pocket.r);
    }
    return shelter;
  }

  function nearestShelterPocket(x, y) {
    let best = SHELTER_POCKETS[0];
    let bestDist = Infinity;
    for (const pocket of SHELTER_POCKETS) {
      const d = hypot(x - pocket.x, y - pocket.y);
      if (d < bestDist) {
        best = pocket;
        bestDist = d;
      }
    }
    return best;
  }

  function rawCurrentAt(x, y) {
    const bx = baseCoord(x);
    const by = baseCoord(y);
    const season = g && g.env ? g.env.season : 0.5;
    const disturbance = g && g.env ? g.env.disturbance : { active: null, strength: 0 };
    const reversal = disturbance.active === 'reversal' ? disturbance.strength : 0;
    const flip = reversal > 0.02 ? -1 : 1;
    const phase = (g ? g.time : 0) * 0.42 + currentSeed * 0.0021;
    const band = Math.sin(by * 0.108 + phase) * 0.72 + Math.cos(bx * 0.038 - phase * 0.7) * 0.28;
    const undertow = Math.cos(by * 0.042 + phase * 0.9 + bx * 0.018) * 0.55;
    const depthLane = by < 70 ? 1.12 : by > 150 ? 0.74 : 1;
    const strength = SIM.currentStrength * depthLane * (0.55 + season * 0.65 + reversal * 0.8);
    const vertical = SIM.currentVerticalStrength * lerp(0.18, 0.42, clamp((by - 70) / 80, 0, 1)) * (0.75 + reversal * 0.65);
    return {
      x: band * strength * flip,
      y: undertow * vertical,
      magnitude: hypot(band * strength * flip, undertow * vertical),
    };
  }

  function refreshFormationCache() {
    for (const formation of FORMATIONS) {
      const raw = rawCurrentAt(formation.x, formation.y);
      const dir = norm2(raw.x || 1, raw.y);
      formation.flowX = dir.m > 0.01 ? dir.x : 1;
      formation.flowY = dir.m > 0.01 ? dir.y : 0;
      formation.perpX = -formation.flowY;
      formation.perpY = formation.flowX;
      formation.wakeX = clamp(formation.x + formation.flowX * formation.wakeLength * 0.52, WORLD.edgePad, W - WORLD.edgePad);
      formation.wakeY = clamp(formation.y + formation.flowY * formation.wakeLength * 0.18, WORLD.waterTopSoft, WORLD.waterBottom);
      formation.wakeR = formation.wakeWidth * 0.76;
    }
  }

  function formationFieldAt(x, y) {
    let shelter = 0;
    let schoolBoost = 0;
    let block = 0;
    let pushX = 0;
    let pushY = 0;
    let calmMul = 1;
    let wakeStrength = 0;

    for (const formation of FORMATIONS) {
      const relX = x - formation.x;
      const relY = y - formation.y;
      const coreX = relX / formation.rx;
      const coreY = relY / formation.ry;
      const core = coreX * coreX + coreY * coreY;
      const edgeX = relX / (formation.rx + scaleWorld(8));
      const edgeY = relY / (formation.ry + scaleWorld(8));
      const edge = edgeX * edgeX + edgeY * edgeY;
      const along = relX * formation.flowX + relY * formation.flowY;
      const side = relX * formation.perpX + relY * formation.perpY;

      if (edge < 1.12) {
        const edgeForce = 1 - clamp(edge / 1.12, 0, 1);
        const sideSign = side === 0 ? (formation.perpY >= 0 ? 1 : -1) : Math.sign(side);
        pushX += formation.perpX * sideSign * formation.deflect * edgeForce * formation.solidity;
        pushY += formation.perpY * sideSign * formation.deflect * edgeForce * formation.solidity;
      }

      if (core < 1) {
        const depth = 1 - core;
        const escape = norm2(relX || formation.perpX, relY || formation.perpY);
        pushX += escape.x * formation.deflect * (0.55 + depth * 1.1) * formation.solidity;
        pushY += escape.y * formation.deflect * (0.55 + depth * 1.1) * formation.solidity;
        calmMul = Math.min(calmMul, 1 - formation.calm * depth * 0.84);
        shelter = Math.max(shelter, formation.shelter * depth * 0.42);
        block = Math.max(block, depth * formation.solidity);
      }

      if (along > formation.rx * 0.12 && along < formation.wakeLength) {
        const sideT = Math.abs(side) / formation.wakeWidth;
        if (sideT < 1) {
          const alongT = clamp(along / formation.wakeLength, 0, 1);
          const wake = Math.pow(1 - alongT, 0.78) * (1 - sideT) * (0.72 + formation.solidity * 0.28);
          if (wake > 0.01) {
            shelter = Math.max(shelter, formation.shelter * wake);
            schoolBoost = Math.max(schoolBoost, formation.school * wake);
            calmMul = Math.min(calmMul, 1 - formation.calm * wake * 0.82);
            wakeStrength = Math.max(wakeStrength, wake);
          }
        }
      }
    }

    return { shelter, schoolBoost, block, pushX, pushY, calmMul, wakeStrength };
  }

  function shelterFactorAt(x, y) {
    const pocket = pocketShelterAt(x, y);
    const formation = formationFieldAt(x, y);
    return Math.max(pocket, formation.shelter);
  }

  function formationCollisionAt(x, y, pad = 0, solidOnly = false) {
    let bestFormation = null;
    let bestDepth = 0;
    for (const formation of FORMATIONS) {
      if (solidOnly && formation.solidity < 0.72) continue;
      const nx = (x - formation.x) / (formation.rx + pad);
      const ny = (y - formation.y) / (formation.ry + pad);
      const core = nx * nx + ny * ny;
      if (core >= 1) continue;
      const depth = 1 - core;
      if (depth > bestDepth) {
        bestDepth = depth;
        bestFormation = formation;
      }
    }
    return { formation: bestFormation, depth: bestDepth };
  }

  function projectOutOfFormation(x, y, pad = scaleWorld(4), solidOnly = false) {
    let px = clamp(x, WORLD.edgePad, W - WORLD.edgePad);
    let py = clamp(y, WORLD.waterTopSoft, WORLD.waterBottom);
    for (let i = 0; i < FORMATIONS.length; i++) {
      const hit = formationCollisionAt(px, py, pad, solidOnly);
      if (!hit.formation || hit.depth <= 0) break;
      const rel = norm2(px - hit.formation.x || hit.formation.perpX, py - hit.formation.y || hit.formation.perpY);
      px = clamp(hit.formation.x + rel.x * (hit.formation.rx + pad + scaleWorld(2)), WORLD.edgePad, W - WORLD.edgePad);
      py = clamp(hit.formation.y + rel.y * (hit.formation.ry + pad + scaleWorld(2)), WORLD.waterTopSoft, WORLD.waterBottom);
    }
    return { x: px, y: py };
  }

  function bestWakeTarget(x, y, sight = scaleWorld(72)) {
    let best = null;
    let bestScore = -1;
    for (const formation of FORMATIONS) {
      const dx = formation.wakeX - x;
      const dy = formation.wakeY - y;
      const d = hypot(dx, dy);
      const reach = sight * 0.68 + formation.wakeR;
      if (d > reach) continue;
      const score = (1 - clamp(d / reach, 0, 1)) * (formation.school * 0.72 + formation.shelter * 0.44 + formation.wakeR / scaleWorld(30) * 0.12);
      if (score > bestScore) {
        bestScore = score;
        best = { x: formation.wakeX, y: formation.wakeY, r: formation.wakeR, formation, score };
      }
    }
    return best;
  }

  function currentAt(x, y) {
    const raw = rawCurrentAt(x, y);
    const formation = formationFieldAt(x, y);
    const shelter = Math.max(pocketShelterAt(x, y), formation.shelter);
    const calm = lerp(1, 0.18, shelter) * formation.calmMul;
    return {
      x: raw.x * calm + formation.pushX,
      y: raw.y * calm + formation.pushY,
      shelter,
      schoolBoost: formation.schoolBoost,
      block: formation.block,
      wake: formation.wakeStrength,
      magnitude: hypot(raw.x * calm + formation.pushX, raw.y * calm + formation.pushY),
    };
  }

  function planktonRichnessAt(x, y, radius = 30) {
    if (!g || !g.plankton) return 0;
    let richness = 0;
    for (const patch of g.plankton) {
      const d = hypot(x - patch.x, y - patch.y);
      const reach = radius + patch.r;
      if (d > reach) continue;
      richness += (1 - d / reach) * patch.nut;
    }
    return richness;
  }

  function bestPlanktonPatchFor(f, sight, hunger) {
    let best = null;
    let bestScore = -1;
    for (const patch of g.plankton) {
      const dx = patch.x - f.x;
      const dy = patch.y - f.y;
      const d = hypot(dx, dy);
      const reach = sight * 0.8 + patch.r;
      if (d > reach) continue;
      const score = (1 - clamp(d / reach, 0, 1)) * (patch.nut * 0.28 + hunger * 0.65 + f.traits.bloom * 0.2);
      if (score > bestScore) {
        best = patch;
        bestScore = score;
      }
    }
    return { patch: best, score: bestScore };
  }

  function seasonLabel(season = g.env.season) {
    if (season < 0.38) return 'LEAN';
    if (season > 0.62) return 'BLOOM';
    return 'SHIFT';
  }

  function seasonSentence(season = g.env.season) {
    if (season < 0.38) return 'Lean season';
    if (season > 0.62) return 'Bloom season';
    return 'Season shift';
  }

  function populationBreakdown() {
    const counts = {
      grazer: 0,
      shoaler: 0,
      opportunist: 0,
      hunter: 0,
      juvenile: 0,
      adult: 0,
      herbivore: 0,
      carnivore: 0,
      lineages: 0,
    };
    const lineages = new Set();
    for (const fish of g.fish) {
      counts[fish.archetype] = (counts[fish.archetype] || 0) + 1;
      counts[fish.stage === 'juvenile' ? 'juvenile' : 'adult']++;
      if (fish.traits.carnivore >= 0.5) counts.carnivore++;
      else counts.herbivore++;
      lineages.add(fish.lineage);
    }
    counts.lineages = lineages.size;
    return counts;
  }

  function countLivingLineage(lineage) {
    let count = 0;
    for (const fish of g.fish) if (fish.lineage === lineage) count++;
    return count;
  }

  function findFishById(id) {
    if (id == null) return null;
    for (const fish of g.fish) {
      if (fish.id === id) return fish;
    }
    return null;
  }

  function watchNameForFish(archetypeId, lineage, fishId, generation = 0) {
    const prefixes = WATCH_PREFIX[archetypeId] || WATCH_PREFIX.grazer;
    const prefix = prefixes[(Math.max(0, lineage) + Math.max(0, fishId) + generation) % prefixes.length];
    const suffix = WATCH_SUFFIX[(Math.max(0, fishId) + lineage * 2 + generation) % WATCH_SUFFIX.length];
    return `${prefix} ${suffix}`;
  }

  function liveWatchStatus(fish) {
    if (!fish) return '-';
    if (fish.intent === 'hunt') return 'Live hunt';
    if (fish.intent === 'food' || fish.intent === 'plankton' || fish.intent === 'bloom') return 'Feeding';
    if (fish.intent === 'evade') return 'Evading';
    if (fish.intent === 'school') return 'Holding formation';
    if (fish.intent === 'wake' || fish.intent === 'shelter') return 'Using cover';
    if (fish.energy < currentReproductionEnergy() * 0.34) return 'Under pressure';
    return 'Live';
  }

  function formatWatchAge(age) {
    if (!Number.isFinite(age)) return '-';
    return `${Math.max(0, age).toFixed(age >= 10 ? 0 : 1)}s`;
  }

  function pinDataForFish(fish, overrides = {}) {
    if (!fish) return null;
    return {
      id: fish.id,
      lineage: fish.lineage,
      lineageTint: fish.lineageTint,
      archetype: fish.archetype,
      archetypeLabel: fish.archetypeLabel,
      generation: fish.generation,
      stage: fish.stage,
      watchName: fish.watchName,
      age: Number.isFinite(fish.age) ? Number(fish.age.toFixed(2)) : 0,
      meals: fish.meals || 0,
      hunts: fish.hunts || 0,
      offspring: fish.offspring || 0,
      watchStatus: overrides.watchStatus ?? liveWatchStatus(fish),
      watchSummary: overrides.watchSummary ?? '',
      exitTime: overrides.exitTime ?? null,
    };
  }

  function currentSubjectPin() {
    const selected = findFishById(selectedFishId);
    if (selected) {
      selectedFishPin = pinDataForFish(selected);
      return selectedFishPin;
    }
    return selectedFishPin;
  }

  function retainPinnedOutcome(fish, watchStatus, watchSummary) {
    if (!fish) return;
    if (selectedFishId !== fish.id && selectedFishPin?.id !== fish.id) return;
    selectedFishPin = pinDataForFish(fish, {
      watchStatus,
      watchSummary,
      exitTime: Number(g.time.toFixed(2)),
    });
  }

  function selectedLineageId() {
    const selected = findFishById(selectedFishId);
    if (selected) {
      selectedFishPin = pinDataForFish(selected);
      return selected.lineage;
    }
    return selectedFishPin?.lineage ?? null;
  }

  function clearSelection() {
    selectedFishId = null;
    selectedFishPin = null;
    WATCH_VIEW.cardVisible = false;
    WATCH_VIEW.lastSubjectId = null;
    WATCH_VIEW.slotHold = 0;
  }

  function selectFish(fish) {
    if (fish && fish.id !== selectedFishId) {
      WATCH_VIEW.slotHold = 0;
    }
    selectedFishId = fish ? fish.id : null;
    selectedFishPin = fish ? pinDataForFish(fish) : null;
    WATCH_VIEW.lastSubjectId = fish ? fish.id : null;
    WATCH_VIEW.cardVisible = Boolean(fish);
  }

  function toggleWatchCard(force = null) {
    if (!currentSubjectPin()) {
      WATCH_VIEW.cardVisible = false;
      return false;
    }
    WATCH_VIEW.cardVisible = force == null ? !WATCH_VIEW.cardVisible : Boolean(force);
    if (WATCH_VIEW.cardVisible) WATCH_VIEW.slotHold = 0;
    return WATCH_VIEW.cardVisible;
  }

  function toggleSelectedLineageHighlight() {
    const lineage = selectedLineageId();
    if (lineage == null) {
      highlightedLineage = null;
      return false;
    }
    highlightedLineage = highlightedLineage === lineage ? null : lineage;
    return true;
  }

  function formatEventTime(time) {
    const total = Math.max(0, time || 0);
    const mins = Math.floor(total / 60);
    const secs = Math.floor(total % 60)
      .toString()
      .padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function pushEvent(kind, title, detail, meta = {}) {
    if (!g || !g.events) return;
    const relatedFishIds = Array.from(
      new Set(
        [meta.fishId, meta.targetFishId, meta.parentFishId, ...(Array.isArray(meta.relatedFishIds) ? meta.relatedFishIds : [])].filter(
          (value) => value != null,
        ),
      ),
    );
    const relatedLineages = Array.from(
      new Set(
        [meta.lineage, meta.targetLineage, meta.parentLineage, ...(Array.isArray(meta.relatedLineages) ? meta.relatedLineages : [])].filter(
          (value) => value != null,
        ),
      ),
    );
    g.events.unshift({
      kind,
      title,
      detail,
      time: g.time,
      fishId: meta.fishId ?? null,
      lineage: meta.lineage ?? null,
      targetFishId: meta.targetFishId ?? null,
      targetLineage: meta.targetLineage ?? null,
      parentFishId: meta.parentFishId ?? null,
      parentLineage: meta.parentLineage ?? null,
      relatedFishIds,
      relatedLineages,
    });
    if (g.events.length > SIM.eventLogMax) g.events.length = SIM.eventLogMax;
  }

  function renderEventStream() {
    if (!UI.eventStream) return;
    if (!g.events.length) {
      UI.eventStream.innerHTML =
        '<article class="event-item"><span class="event-time">T+0:00</span><strong>Waiting for the first event</strong><small>The tank will start filling this timeline as soon as something notable happens.</small></article>';
      return;
    }
    UI.eventStream.innerHTML = g.events
      .map((event) => {
        const lineage = event.lineage != null ? ` · lineage ${event.lineage}` : '';
        return `<article class="event-item" data-kind="${event.kind}"><span class="event-time">T+${formatEventTime(event.time)}</span><strong>${event.title}${lineage}</strong><small>${event.detail}</small></article>`;
      })
      .join('');
  }

  function renderBookmarkList() {
    if (!UI.bookmarkList) return;
    if (!REPLAY.bookmarks.length) {
      UI.bookmarkList.innerHTML =
        '<article class="bookmark-chip bookmark-empty"><strong>No bookmarks yet</strong><small>Bookmark a live moment to pin a seed, time, and population snapshot for fast return.</small></article>';
      return;
    }
    UI.bookmarkList.innerHTML = REPLAY.bookmarks
      .slice(0, REPLAY.maxVisibleBookmarks)
      .map((snapshot) => {
        const active = snapshot.id === REPLAY.activeSnapshotId;
        return `<button type="button" class="bookmark-chip" data-bookmark-id="${snapshot.id}" data-active="${active ? 'true' : 'false'}"><strong>${snapshot.label} · T+${formatEventTime(snapshot.takenAt)}</strong><small>${scenarioById(snapshot.scenarioId).label} · seed ${snapshot.currentSeed} · ${snapshot.state.fish.length} fish</small></button>`;
      })
      .join('');
  }

  function renderWatchFeed(subjectPin) {
    if (!UI.watchFeed || !UI.watchFeedNote) return;
    if (!subjectPin) {
      UI.watchFeedNote.textContent = 'Recent events for the pinned fish or lineage.';
      UI.watchFeed.innerHTML =
        '<article class="event-item"><span class="event-time">Watch</span><strong>No subject pinned</strong><small>Pick a fish to start a fish-centric event feed.</small></article>';
      return;
    }

    const fishId = subjectPin.id;
    const lineage = subjectPin.lineage;
    const direct = [];
    const branch = [];
    for (const event of g.events) {
      const directMatch = fishId != null && Array.isArray(event.relatedFishIds) && event.relatedFishIds.includes(fishId);
      const branchMatch =
        !directMatch && lineage != null && Array.isArray(event.relatedLineages) && event.relatedLineages.includes(lineage);
      if (directMatch) direct.push({ event, scope: 'Direct' });
      else if (branchMatch) branch.push({ event, scope: 'Branch' });
    }
    const entries = [...direct, ...branch].slice(0, 6);

    if (!entries.length) {
      UI.watchFeedNote.textContent = `${subjectPin.watchName} has no direct or branch events in the current window yet.`;
      UI.watchFeed.innerHTML =
        '<article class="event-item"><span class="event-time">Watch</span><strong>No tracked events yet</strong><small>The watch feed fills as this fish, or its lineage, triggers notable events.</small></article>';
      return;
    }

    UI.watchFeedNote.textContent =
      direct.length > 0
        ? `Showing direct events for ${subjectPin.watchName}, with lineage spillover when the branch is active.`
        : `No direct events for ${subjectPin.watchName} in view, so this feed is following lineage ${subjectPin.lineage}.`;
    UI.watchFeed.innerHTML = entries
      .map(({ event, scope }) => {
        return `<article class="event-item" data-kind="${event.kind}"><span class="event-time">${scope} · T+${formatEventTime(
          event.time,
        )}</span><strong>${event.title}</strong><small>${event.detail}</small></article>`;
      })
      .join('');
  }

  function syncControlInputs() {
    if (UI.controlFood) UI.controlFood.value = String(Math.round(TUNE.foodFlow * 100));
    if (UI.controlMetabolism) UI.controlMetabolism.value = String(Math.round(TUNE.metabolism * 100));
    if (UI.controlFertility) UI.controlFertility.value = String(Math.round(TUNE.fertility * 100));
    if (UI.controlSeason) UI.controlSeason.value = String(Math.round(TUNE.season * 100));
  }

  function syncScenarioUi() {
    const scenario = currentScenario();
    for (const button of UI.scenarioButtons) {
      const isActive = button.dataset.scenario === currentScenarioId;
      button.dataset.active = isActive ? 'true' : 'false';
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
    if (UI.scenarioNote) {
      UI.scenarioNote.textContent = `${scenario.label}. ${scenario.note}`;
    }
  }

  function findMatchingPreset() {
    for (const [id, preset] of Object.entries(PRESETS)) {
      const match = Object.entries(preset.values).every(([key, value]) => Math.abs(TUNE[key] - value) < 0.005);
      if (match) return id;
    }
    return 'custom';
  }

  function syncPresetUi() {
    activePreset = findMatchingPreset();
    for (const button of UI.presetButtons) {
      const isActive = button.dataset.preset === activePreset;
      button.dataset.active = isActive ? 'true' : 'false';
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
    if (UI.presetNote) {
      UI.presetNote.textContent =
        activePreset === 'custom' ? 'Custom mix. The sliders are no longer on a named preset.' : PRESETS[activePreset].note;
    }
  }

  function syncViewUi() {
    for (const button of UI.viewButtons) {
      const key = button.dataset.view;
      const isActive = Boolean(VIEW[key]);
      button.dataset.active = isActive ? 'true' : 'false';
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
  }

  function syncReplayUi() {
    const liveAvailable = Boolean(REPLAY.returnSnapshot);
    const replayActive = REPLAY.activeSnapshotId != null;
    const active = activeReplaySnapshot();
    const liveIndex = REPLAY.buffer.length;
    if (UI.replayBookmarkButton) UI.replayBookmarkButton.disabled = !g || !g.fish.length;
    if (UI.replayRewindShortButton) UI.replayRewindShortButton.disabled = REPLAY.buffer.length < 2;
    if (UI.replayRewindLongButton) UI.replayRewindLongButton.disabled = REPLAY.buffer.length < 2;
    if (UI.replayLiveButton) {
      UI.replayLiveButton.disabled = !liveAvailable;
      UI.replayLiveButton.dataset.state = replayActive ? 'active' : 'idle';
    }
    if (UI.replayScrubber) {
      UI.replayScrubber.min = '0';
      UI.replayScrubber.max = String(Math.max(1, liveIndex));
      UI.replayScrubber.value = String(replayActive ? replayIndexForSnapshot(active) : liveIndex);
      UI.replayScrubber.disabled = liveIndex < 1;
    }
    if (UI.replayScrubLabel) {
      if (replayActive && active) UI.replayScrubLabel.textContent = `${active.label || 'Snapshot'} · T+${formatEventTime(active.takenAt)}`;
      else if (REPLAY.buffer.length) UI.replayScrubLabel.textContent = `Live edge · T+${formatEventTime(REPLAY.buffer[REPLAY.buffer.length - 1].takenAt)}`;
      else UI.replayScrubLabel.textContent = 'Buffer warming up';
    }
    if (UI.replayNote) {
      if (replayActive) {
        const label = active ? `${active.label || 'Snapshot'} at T+${formatEventTime(active.takenAt)}` : 'Recorded snapshot';
        UI.replayNote.textContent = `Replay loaded from ${label}. Scrub to another moment or Return Live to jump back to the saved branch.`;
      } else if (liveAvailable) {
        UI.replayNote.textContent = `Running from a replayed branch. Return Live jumps back to the saved branch captured before the scrub.`;
      } else {
        UI.replayNote.textContent = `Recording the last ${REPLAY.maxSeconds} seconds of ${currentScenario().label}. ${REPLAY.bookmarks.length} bookmark${REPLAY.bookmarks.length === 1 ? '' : 's'} saved.`;
      }
    }
  }

  function applyPreset(id) {
    const preset = PRESETS[id];
    if (!preset) return;
    for (const [key, value] of Object.entries(preset.values)) TUNE[key] = value;
    syncControlInputs();
    syncPresetUi();
    updateUiPanels(true);
  }

  function applyScenario(id) {
    const scenario = scenarioById(id);
    currentScenarioId = id in SCENARIOS ? id : 'baseline';
    for (const [key, value] of Object.entries(scenario.values || {})) {
      if (key in TUNE) TUNE[key] = value;
    }
    SIM.seedBase = scenario.seed || SIM.seedBase;
    runIndex = 0;
    syncControlInputs();
    syncScenarioUi();
    syncPresetUi();
    resetSimulation();
  }

  function setSeed(seed) {
    const parsed = Number(seed);
    if (!Number.isFinite(parsed) || parsed < 1) return false;
    SIM.seedBase = (parsed >>> 0) || 1;
    runIndex = 0;
    resetSimulation();
    return true;
  }

  function nearestFoodProbe(f) {
    let nearest = null;
    let nearestDist = Infinity;
    const hunger = clamp((currentReproductionEnergy() - f.energy) / currentReproductionEnergy(), 0, 1);
    const sight = f.traits.sight + f.r * 4 + hunger * 10;
    for (const food of g.food) {
      const dx = food.x - f.x;
      const dy = food.y - f.y;
      const d = hypot(dx, dy);
      if (d > sight + 18) continue;
      if (d < nearestDist) {
        nearestDist = d;
        nearest = { food, d, dx, dy, hunger, sight };
      }
    }
    return nearest;
  }

  function auditSnapshot() {
    const counts = populationBreakdown();
    const appetite = {
      visibleFood: 0,
      hungryVisibleFood: 0,
      hungryApproachingFood: 0,
      hungryDriftingFromFood: 0,
    };

    for (const f of g.fish) {
      const probe = nearestFoodProbe(f);
      if (!probe) continue;
      appetite.visibleFood++;
      const hunger = probe.hunger;
      if (hunger < 0.3) continue;
      appetite.hungryVisibleFood++;
      const vel = norm2(f.vx, f.vy);
      const toward = norm2(probe.dx, probe.dy);
      const alignment = vel.m > 0.001 ? vel.x * toward.x + vel.y * toward.y : 0;
      if (alignment > 0.12) appetite.hungryApproachingFood++;
      if (alignment < -0.12) appetite.hungryDriftingFromFood++;
    }

    return {
      scenario: g.run.scenario,
      seed: g.run.seed,
      time: Number(g.time.toFixed(2)),
      paused,
      pauseReason,
      fish: g.fish.length,
      food: g.food.length,
      avgEnergy: Number(g.avgEnergy.toFixed(2)),
      births: g.stats.births,
      deaths: g.stats.deaths,
      foodTaken: g.stats.foodTaken,
      predations: g.stats.predations,
      reseeds: g.stats.reseeds,
      season: seasonLabel(g.env.season),
      disturbance: disturbanceLabel(),
      archetypes: { grazer: counts.grazer, shoaler: counts.shoaler, opportunist: counts.opportunist, hunter: counts.hunter },
      juvenile: counts.juvenile,
      adult: counts.adult,
      herbivore: counts.herbivore,
      carnivore: counts.carnivore,
      appetite,
    };
  }

  function runAudit(seconds = 30) {
    const total = Math.max(0, Number(seconds) || 0);
    const steps = Math.round(total / SIM.fixedDt);
    for (let i = 0; i < steps; i++) updateSimulation(SIM.fixedDt);
    uiClock = 0;
    updateUiPanels(true);
    return auditSnapshot();
  }

  function syncControlLabels() {
    if (UI.controlFoodValue) UI.controlFoodValue.textContent = `${TUNE.foodFlow.toFixed(2)}x`;
    if (UI.controlMetabolismValue) UI.controlMetabolismValue.textContent = `${TUNE.metabolism.toFixed(2)}x`;
    if (UI.controlFertilityValue) UI.controlFertilityValue.textContent = `${TUNE.fertility.toFixed(2)}x`;
    if (UI.controlSeasonValue) UI.controlSeasonValue.textContent = `${TUNE.season.toFixed(2)}x`;
    syncScenarioUi();
    syncPresetUi();
    syncViewUi();
    syncReplayUi();
    if (UI.pauseButton) {
      const replayActive = REPLAY.activeSnapshotId != null;
      UI.pauseButton.textContent = replayActive ? 'Resume Snapshot [P]' : paused ? 'Resume [P]' : 'Pause [P]';
      UI.pauseButton.dataset.state = replayActive ? 'replay' : paused ? 'paused' : 'running';
    }
    if (shell) {
      shell.dataset.cinematic = cinematic ? 'true' : 'false';
      shell.dataset.controls = controlsOpen && !cinematic ? 'open' : 'closed';
    }
    if (UI.controlsToggleButton) {
      UI.controlsToggleButton.textContent = controlsOpen && !cinematic ? 'Hide Controls [T]' : 'Controls [T]';
      UI.controlsToggleButton.dataset.state = controlsOpen && !cinematic ? 'active' : 'idle';
    }
    if (UI.focusButton) {
      UI.focusButton.textContent = cinematic ? 'Exit Focus [C]' : 'Focus [C]';
      UI.focusButton.dataset.state = cinematic ? 'active' : 'idle';
    }
    const subjectPin = currentSubjectPin();
    const selected = findFishById(selectedFishId);
    const selectedLineage = selected ? selected.lineage : subjectPin?.lineage ?? null;
    if (UI.inspectHighlightButton) {
      const active = Boolean(selectedLineage != null && highlightedLineage === selectedLineage);
      UI.inspectHighlightButton.textContent = active ? 'Lineage On [L]' : 'Highlight [L]';
      UI.inspectHighlightButton.dataset.state = active ? 'active' : 'idle';
      UI.inspectHighlightButton.disabled = selectedLineage == null;
    }
    if (UI.inspectClearButton) UI.inspectClearButton.disabled = selectedFishId == null && highlightedLineage == null;
    if (UI.seedInput && document.activeElement !== UI.seedInput) UI.seedInput.value = String(currentSeed);
  }

  function resetHistory() {
    HISTORY.points.length = 0;
    HISTORY.clock = 0;
  }

  function sampleReplay(dt) {
    REPLAY.clock -= dt;
    if (REPLAY.clock > 0) return;
    REPLAY.clock += REPLAY.sampleEvery;
    captureReplaySnapshot('auto', 'Recent');
  }

  function sampleHistory(dt) {
    HISTORY.clock -= dt;
    if (HISTORY.clock > 0) return;
    HISTORY.clock += HISTORY.sampleEvery;
    HISTORY.points.push({
      fish: g.fish.length,
      food: g.food.length,
      energy: g.avgEnergy,
      season: g.env.season,
    });
    if (HISTORY.points.length > HISTORY.maxPoints) HISTORY.points.shift();
  }

  function drawHistoryPanel() {
    if (!historyCtx || !UI.historyCanvas) return;
    const c = historyCtx;
    const w = UI.historyCanvas.width;
    const h = UI.historyCanvas.height;
    const padX = 10;
    const padY = 10;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;

    c.clearRect(0, 0, w, h);
    const bg = c.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, 'rgba(11, 24, 49, 0.96)');
    bg.addColorStop(1, 'rgba(4, 10, 21, 0.98)');
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);

    c.strokeStyle = 'rgba(168,230,255,0.10)';
    c.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padY + (innerH * i) / 4;
      c.beginPath();
      c.moveTo(padX, y);
      c.lineTo(w - padX, y);
      c.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const x = padX + (innerW * i) / 6;
      c.beginPath();
      c.moveTo(x, padY);
      c.lineTo(x, h - padY);
      c.stroke();
    }

    if (HISTORY.points.length < 2) {
      c.fillStyle = 'rgba(168,230,255,0.70)';
      c.font = '12px ui-monospace, monospace';
      c.fillText('collecting trace...', 14, h / 2 + 4);
      return;
    }

    const fishMax = Math.max(SIM.maxFish, ...HISTORY.points.map((point) => point.fish), 1);
    const foodMax = Math.max(currentFoodCap(g.env.season), ...HISTORY.points.map((point) => point.food), 1);
    const energyMax = Math.max(currentReproductionEnergy() * 1.05, ...HISTORY.points.map((point) => point.energy), 1);
    const xAt = (index) => padX + (index / (HISTORY.points.length - 1)) * innerW;
    const yAt = (value, max) => padY + innerH - clamp(value / max, 0, 1) * innerH;

    for (let i = 0; i < HISTORY.points.length; i++) {
      const point = HISTORY.points[i];
      const x = xAt(i);
      c.strokeStyle =
        point.season < 0.38 ? 'rgba(240,138,75,0.10)' : point.season > 0.62 ? 'rgba(109,220,143,0.10)' : 'rgba(168,230,255,0.08)';
      c.beginPath();
      c.moveTo(x, padY);
      c.lineTo(x, h - padY);
      c.stroke();
    }

    function strokeSeries(color, max, key) {
      c.strokeStyle = color;
      c.lineWidth = 2;
      c.beginPath();
      HISTORY.points.forEach((point, index) => {
        const x = xAt(index);
        const y = yAt(point[key], max);
        if (!index) c.moveTo(x, y);
        else c.lineTo(x, y);
      });
      c.stroke();
    }

    strokeSeries('rgba(109,220,143,0.96)', fishMax, 'fish');
    strokeSeries('rgba(255,230,109,0.96)', foodMax, 'food');
    strokeSeries('rgba(240,138,75,0.96)', energyMax, 'energy');

    const latest = HISTORY.points[HISTORY.points.length - 1];
    function markLatest(color, max, key) {
      const x = xAt(HISTORY.points.length - 1);
      const y = yAt(latest[key], max);
      c.fillStyle = 'rgba(4,10,21,0.96)';
      c.beginPath();
      c.arc(x, y, 4, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = color;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, 3, 0, Math.PI * 2);
      c.stroke();
    }

    markLatest('rgba(109,220,143,0.96)', fishMax, 'fish');
    markLatest('rgba(255,230,109,0.96)', foodMax, 'food');
    markLatest('rgba(240,138,75,0.96)', energyMax, 'energy');
  }

  function updateUiPanels(force = false) {
    if (!force && uiClock < 0.12) return;
    uiClock = 0;
    syncControlLabels();

    const counts = populationBreakdown();
    const dominantId = ['grazer', 'shoaler', 'opportunist', 'hunter'].sort((a, b) => counts[b] - counts[a])[0];
    const dominant = counts[dominantId] ? archetypeById(dominantId).label : 'NONE';
    const selected = findFishById(selectedFishId);
    if (selected) selectedFishPin = pinDataForFish(selected);
    const pinned = selectedFishPin;
    const subjectPin = selected || pinned ? currentSubjectPin() : null;
    const replayActive = REPLAY.activeSnapshotId != null;
    const scenario = currentScenario();
    const season = g.env.season;
    const disturbance = disturbanceLabel();
    const recent = HISTORY.points.length ? HISTORY.points[Math.max(0, HISTORY.points.length - 10)] : null;
    const latest = HISTORY.points.length ? HISTORY.points[HISTORY.points.length - 1] : null;
    const fishDelta = recent && latest ? latest.fish - recent.fish : 0;
    const foodDelta = recent && latest ? latest.food - recent.food : 0;
    const energyDelta = recent && latest ? latest.energy - recent.energy : 0;

    if (UI.statFish) UI.statFish.textContent = `${g.fish.length} fish`;
    if (UI.statDominant) {
      UI.statDominant.textContent =
        g.fish.length
          ? `Dominant ${dominant} x${counts[dominantId]} • ${counts.lineages} visible lineages`
          : 'No surviving fish in the tank';
    }
    if (UI.statFood) UI.statFood.textContent = `${g.food.length} food • ${g.plankton.length} plumes`;
    if (UI.statSeason) UI.statSeason.textContent = `${scenario.label} • Seed ${g.run.seed} • ${seasonSentence(season)} • ${disturbance}`;
    if (UI.statEnergy) UI.statEnergy.textContent = `${Math.round(g.avgEnergy)} avg energy`;
    if (UI.statPressure) {
      const presetLabel = activePreset === 'custom' ? 'Custom mix' : PRESETS[activePreset].label;
      UI.statPressure.textContent = `${presetLabel} • Herb ${counts.herbivore} • Carn ${counts.carnivore}`;
    }
    if (UI.statTurnover) UI.statTurnover.textContent = `${g.stats.births} births / ${g.stats.deaths} deaths`;
    if (UI.statTurnoverNote) UI.statTurnoverNote.textContent = `${g.stats.predations} predations • ${g.stats.disturbances} disturbances`;
    if (UI.overlayPopulation) UI.overlayPopulation.textContent = `${g.fish.length} fish`;
    if (UI.overlayPopNote) {
      UI.overlayPopNote.textContent = g.fish.length
        ? `${counts.juvenile} juvenile • ${counts.adult} adult • ${counts.lineages} lineages`
        : 'No survivors. The tank is waiting on migrants or a reseed.';
    }
    if (UI.overlayResources) UI.overlayResources.textContent = `${g.food.length} food • ${g.plankton.length} plumes`;
    if (UI.overlayResourceNote) UI.overlayResourceNote.textContent = `${seasonSentence(season)} • ${disturbance}`;
    if (UI.overlayRun) UI.overlayRun.textContent = scenario.label;
    if (UI.overlayRunNote) {
      const presetLabel = activePreset === 'custom' ? 'Custom mix' : PRESETS[activePreset].label;
      UI.overlayRunNote.textContent = `Seed ${g.run.seed} • ${presetLabel} • ${paused ? 'Paused' : 'Running'}`;
    }

    if (UI.splitJuvenile) UI.splitJuvenile.textContent = String(counts.juvenile);
    if (UI.splitAdult) UI.splitAdult.textContent = String(counts.adult);
    if (UI.splitHerbivore) UI.splitHerbivore.textContent = String(counts.herbivore);
    if (UI.splitCarnivore) UI.splitCarnivore.textContent = String(counts.carnivore);
    if (UI.disturbanceNote) {
      UI.disturbanceNote.textContent =
        g.env.disturbance.active
          ? `${disturbance}: visibility, currents, or bottom oxygen are temporarily shifted.`
          : 'Calm water. Trails and overlays expose the stable lanes, refuges, and food pockets.';
    }

    if (UI.seasonCallout) {
      UI.seasonCallout.textContent = g.env.disturbance.active
        ? `${disturbance}: the tank is under a short-term stress test, so watch routes and shelter usage change.`
        : season < 0.38
          ? 'Lean season: metabolism rises, food caps shrink, and grazers start to feel exposed.'
          : season > 0.62
            ? 'Bloom season: nutrient plumes are dense, feeding lanes widen, and births become more likely.'
            : 'Shift phase: the plumes are moving and schools are reorganizing around the next resource pocket.';
    }

    if (UI.pressureCallout) {
      if (!g.fish.length) {
        UI.pressureCallout.textContent = 'The tank has collapsed. Immigration or reseeding is the only way back.';
      } else if (counts.juvenile > counts.adult) {
        UI.pressureCallout.textContent = 'Juveniles outnumber adults, so lee wakes, refuges, and shallow food pockets are shaping the run.';
      } else if (g.avgEnergy < currentReproductionEnergy() * 0.42) {
        UI.pressureCallout.textContent = 'Average energy is low, so the fish are spending more time chasing survival than reproduction.';
      } else if (g.avgEnergy > currentReproductionEnergy() * 0.72) {
        UI.pressureCallout.textContent = 'Energy reserves are strong. Watch for a short burst of splitting before the next correction.';
      } else {
        UI.pressureCallout.textContent = 'Pressure is balanced enough for multiple archetypes to coexist without a scripted outcome.';
      }
    }

    if (UI.cycleCallout) {
      if (g.fish.length <= SIM.immigrationThreshold) {
        UI.cycleCallout.textContent = 'The population is near a bottleneck, so incoming migrants can reshape the whole mix.';
      } else if (g.env.foodCrash > 0.25) {
        UI.cycleCallout.textContent = 'Food crash is pinching the plankton loop, so remembered patches and hunting waves matter more.';
      } else if (counts.carnivore >= Math.max(3, counts.herbivore - 1)) {
        UI.cycleCallout.textContent = 'Carnivores are dense enough to create hunting waves, so watch for shelter clustering and recovery gaps.';
      } else if (fishDelta >= 3 && foodDelta <= 0) {
        UI.cycleCallout.textContent = 'Population is expanding into its food reserve. A correction wave is likely if births keep leading.';
      } else if (fishDelta <= -3 && foodDelta >= 0) {
        UI.cycleCallout.textContent = 'Deaths are outpacing births and food is recovering, which usually sets up the next rebound.';
      } else if (energyDelta > 8) {
        UI.cycleCallout.textContent = 'Energy is climbing faster than population. The next visible event may be a reproduction pulse.';
      } else {
        UI.cycleCallout.textContent = 'The tank is oscillating through local pushes and retreats rather than following a canned sequence.';
      }
    }

    if (UI.overlayWatch) {
      UI.overlayWatch.textContent = g.env.disturbance.active
        ? disturbance
        : season < 0.38
          ? 'Lean pressure'
          : season > 0.62
            ? 'Bloom phase'
            : counts.carnivore >= Math.max(3, counts.herbivore - 1)
              ? 'Hunter wave'
              : 'Shift phase';
    }

    if (UI.overlayWatchNote) {
      if (!g.fish.length) UI.overlayWatchNote.textContent = 'Collapse conditions are visible. Watch immigration or reseeding reshape the next cycle.';
      else if (counts.juvenile > counts.adult) UI.overlayWatchNote.textContent = 'Juveniles are leaning on shelter pockets, kelp screens, and shallower feeding lanes.';
      else if (g.env.disturbance.active) UI.overlayWatchNote.textContent = 'Currents, murk, or oxygen are temporarily rerouting wakes and shelter usage.';
      else if (counts.carnivore >= Math.max(3, counts.herbivore - 1)) UI.overlayWatchNote.textContent = 'Predator density is high enough to create ambush pockets behind shelves and snags.';
      else UI.overlayWatchNote.textContent = 'Routes, lee wakes, and food patches are still reorganizing in real time.';
    }

    if (selected) {
      const lineageCount = countLivingLineage(selected.lineage);
      if (UI.inspectKicker) UI.inspectKicker.textContent = `Lineage ${selected.lineage}`;
      if (UI.inspectName) UI.inspectName.textContent = selected.watchName || `${selected.archetypeLabel} #${selected.id}`;
      if (UI.inspectSummary) {
        UI.inspectSummary.textContent = `${selected.archetypeLabel} #${selected.id} is a generation ${selected.generation} ${selected.stage} with ${Math.round(selected.energy)} energy and ${lineageCount} living fish in the lineage. Click the same fish again to tuck the in-tank card away without clearing the subject.`;
      }
      if (UI.inspectArchetype) UI.inspectArchetype.textContent = selected.archetypeLabel;
      if (UI.inspectStage) UI.inspectStage.textContent = selected.stage.toUpperCase();
      if (UI.inspectEnergy) UI.inspectEnergy.textContent = `${Math.round(selected.energy)}`;
      if (UI.inspectHunger) UI.inspectHunger.textContent = `${Math.round(selected.hunger * 100)}%`;
      if (UI.inspectSatiation) UI.inspectSatiation.textContent = `${Math.round(selected.satiation * 100)}%`;
      if (UI.inspectLineage) UI.inspectLineage.textContent = `${selected.lineage}`;
      if (UI.inspectGeneration) UI.inspectGeneration.textContent = `${selected.generation}`;
      if (UI.inspectIntent) UI.inspectIntent.textContent = selected.intent.toUpperCase();
      if (UI.inspectTarget) {
        const target = selected.intentTarget
          ? ` Target ${selected.intentTarget.kind} near ${Math.round(baseCoord(selected.intentTarget.x))}, ${Math.round(baseCoord(selected.intentTarget.y))}.`
          : '';
        UI.inspectTarget.textContent = `${selected.intentNote}${target} Neighbors ${selected.neighbors}, stress ${Math.round(selected.stress * 100)}%.`;
      }
      if (UI.inspectLineageNote) {
        UI.inspectLineageNote.textContent =
          highlightedLineage === selected.lineage
            ? `Lineage ${selected.lineage} is highlighted. Matching fish stay bright and carry a tint marker; the pinned fish keeps the white ring and target line. ${lineageCount} living fish remain in that branch.`
            : `Lineage ${selected.lineage} is not highlighted. Press [L] or use Highlight to isolate it. The white ring and target line belong only to the pinned fish.`;
      }
    } else if (pinned) {
      const lineageCount = pinned.lineage != null ? countLivingLineage(pinned.lineage) : 0;
      if (UI.inspectKicker) UI.inspectKicker.textContent = pinned.lineage != null ? `Lineage ${pinned.lineage}` : 'Pinned fish';
      if (UI.inspectName) UI.inspectName.textContent = pinned.watchName || `${pinned.archetypeLabel} #${pinned.id}`;
      if (UI.inspectSummary) {
        UI.inspectSummary.textContent = replayActive
          ? `Pinned fish is not present in this snapshot. It may not have been born yet or may already be gone at this moment in the branch.`
          : pinned.watchSummary || `Pinned fish is no longer present in the live tank. It may have died or been consumed, but the inspector is keeping your subject pinned for review.`;
      }
      if (UI.inspectArchetype) UI.inspectArchetype.textContent = pinned.archetypeLabel;
      if (UI.inspectStage) UI.inspectStage.textContent = pinned.stage.toUpperCase();
      if (UI.inspectEnergy) UI.inspectEnergy.textContent = '-';
      if (UI.inspectHunger) UI.inspectHunger.textContent = '-';
      if (UI.inspectSatiation) UI.inspectSatiation.textContent = '-';
      if (UI.inspectLineage) UI.inspectLineage.textContent = pinned.lineage != null ? `${pinned.lineage}` : '-';
      if (UI.inspectGeneration) UI.inspectGeneration.textContent = `${pinned.generation}`;
      if (UI.inspectIntent) UI.inspectIntent.textContent = replayActive ? 'OFF-SNAPSHOT' : 'ABSENT';
      if (UI.inspectTarget) {
        UI.inspectTarget.textContent = replayActive
          ? 'Pinned fish is off-snapshot. Scrub to a nearby moment or Return Live to look for it again.'
          : 'Pinned fish is absent from the live tank. Clear the pin or keep lineage highlight on to follow the branch.';
      }
      if (UI.inspectLineageNote) {
        if (highlightedLineage != null && pinned.lineage === highlightedLineage) {
          UI.inspectLineageNote.textContent = `Lineage ${pinned.lineage} is highlighted even though the pinned fish is absent from this moment. ${lineageCount} living fish from that branch are currently visible.`;
        } else if (pinned.lineage != null) {
          UI.inspectLineageNote.textContent = `Pinned fish belongs to lineage ${pinned.lineage}. Press [L] or use Highlight to keep following that branch even when this individual is off-snapshot.`;
        } else {
          UI.inspectLineageNote.textContent = 'Pinned fish is absent and no lineage highlight is active.';
        }
      }
    } else {
      if (UI.inspectKicker) UI.inspectKicker.textContent = highlightedLineage != null ? `Lineage ${highlightedLineage}` : 'Selection';
      if (UI.inspectName) UI.inspectName.textContent = 'No fish selected';
      if (UI.inspectSummary) {
        UI.inspectSummary.textContent =
          highlightedLineage != null
            ? `Lineage ${highlightedLineage} is still highlighted. Click a fish in the tank to pin its live state.`
            : 'Click any fish in the tank to pin it. Click the same fish again to hide or restore the in-tank card. Empty-water taps still pause the run.';
      }
      if (UI.inspectArchetype) UI.inspectArchetype.textContent = '-';
      if (UI.inspectStage) UI.inspectStage.textContent = '-';
      if (UI.inspectEnergy) UI.inspectEnergy.textContent = '-';
      if (UI.inspectHunger) UI.inspectHunger.textContent = '-';
      if (UI.inspectSatiation) UI.inspectSatiation.textContent = '-';
      if (UI.inspectLineage) UI.inspectLineage.textContent = highlightedLineage != null ? `${highlightedLineage}` : '-';
      if (UI.inspectGeneration) UI.inspectGeneration.textContent = '-';
      if (UI.inspectIntent) UI.inspectIntent.textContent = '-';
      if (UI.inspectTarget) UI.inspectTarget.textContent = 'No fish selected.';
      if (UI.inspectLineageNote) {
        UI.inspectLineageNote.textContent =
          highlightedLineage != null
            ? `Lineage ${highlightedLineage} is highlighted. Matching fish stay bright and carry a tint marker. ${countLivingLineage(highlightedLineage)} living fish remain in that branch.`
            : 'Lineage highlighting is off.';
      }
    }

    if (selected) {
      if (UI.watchAge) UI.watchAge.textContent = formatWatchAge(selected.age);
      if (UI.watchMeals) UI.watchMeals.textContent = String(selected.meals || 0);
      if (UI.watchHunts) UI.watchHunts.textContent = String(selected.hunts || 0);
      if (UI.watchOffspring) UI.watchOffspring.textContent = String(selected.offspring || 0);
      if (UI.watchStatus) UI.watchStatus.textContent = liveWatchStatus(selected);
    } else if (pinned) {
      const pinnedStatus = replayActive ? 'Off-snapshot' : pinned.exitTime != null ? pinned.watchStatus || 'Absent' : 'Absent';
      if (UI.watchAge) UI.watchAge.textContent = formatWatchAge(pinned.age);
      if (UI.watchMeals) UI.watchMeals.textContent = String(pinned.meals || 0);
      if (UI.watchHunts) UI.watchHunts.textContent = String(pinned.hunts || 0);
      if (UI.watchOffspring) UI.watchOffspring.textContent = String(pinned.offspring || 0);
      if (UI.watchStatus) UI.watchStatus.textContent = pinnedStatus;
    } else {
      if (UI.watchAge) UI.watchAge.textContent = '-';
      if (UI.watchMeals) UI.watchMeals.textContent = '-';
      if (UI.watchHunts) UI.watchHunts.textContent = '-';
      if (UI.watchOffspring) UI.watchOffspring.textContent = '-';
      if (UI.watchStatus) UI.watchStatus.textContent = '-';
    }

    renderWatchFeed(subjectPin);

    if (UI.historyNote) {
      if (!latest || !recent) UI.historyNote.textContent = 'Sampling the tank...';
      else if (g.env.disturbance.active) {
        UI.historyNote.textContent = `${disturbance}: fish ${fishDelta >= 0 ? '+' : ''}${fishDelta}, food ${foodDelta >= 0 ? '+' : ''}${foodDelta}, juveniles ${counts.juvenile}, adults ${counts.adult}.`;
      }
      else if (season < 0.38) {
        UI.historyNote.textContent = `Lean pressure: fish ${fishDelta >= 0 ? '+' : ''}${fishDelta}, food ${foodDelta >= 0 ? '+' : ''}${foodDelta}, now ${latest.fish} fish at ${Math.round(latest.energy)} avg energy.`;
      } else if (season > 0.62) {
        UI.historyNote.textContent = `Bloom pulse: fish ${fishDelta >= 0 ? '+' : ''}${fishDelta}, energy ${Math.round(energyDelta)}, now ${latest.food} food drifting through the tank.`;
      } else {
        UI.historyNote.textContent = `Shift phase: fish ${fishDelta >= 0 ? '+' : ''}${fishDelta}, food ${foodDelta >= 0 ? '+' : ''}${foodDelta}, now ${latest.fish} fish and ${latest.food} food.`;
      }
    }

    for (const id of Object.keys(UI.archetypes)) {
      if (UI.archetypes[id]) UI.archetypes[id].textContent = String(counts[id] || 0);
    }

    renderEventStream();
    renderBookmarkList();
    drawHistoryPanel();
    syncDockHeights();
  }

  function applySeedFromInput() {
    if (!UI.seedInput) return;
    const parsed = Number.parseInt(UI.seedInput.value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      UI.seedInput.value = String(currentSeed);
      return;
    }
    SIM.seedBase = parsed >>> 0;
    if (!SIM.seedBase) SIM.seedBase = 1;
    runIndex = 0;
    SFX.play('ui');
    resetSimulation();
  }

  function bindUi() {
    syncControlInputs();
    syncPresetUi();
    if (UI.pauseButton) UI.pauseButton.addEventListener('click', () => togglePause());
    if (UI.resetButton) {
      UI.resetButton.addEventListener('click', () => {
        SFX.play('ui');
        resetSimulation();
      });
    }
    if (UI.controlsToggleButton) {
      UI.controlsToggleButton.addEventListener('click', () => {
        if (cinematic) cinematic = false;
        controlsOpen = !controlsOpen;
        updateUiPanels(true);
        SFX.play('ui');
      });
    }
    if (UI.controlsCloseButton) {
      UI.controlsCloseButton.addEventListener('click', () => {
        controlsOpen = false;
        updateUiPanels(true);
        SFX.play('ui');
      });
    }
    if (UI.controlScrim) {
      UI.controlScrim.addEventListener('click', () => {
        controlsOpen = false;
        updateUiPanels(true);
      });
    }
    if (UI.focusButton) {
      UI.focusButton.addEventListener('click', () => {
        cinematic = !cinematic;
        if (cinematic) controlsOpen = false;
        updateUiPanels(true);
        SFX.play('ui');
      });
    }
    if (UI.inspectHighlightButton) {
      UI.inspectHighlightButton.addEventListener('click', () => {
        if (!toggleSelectedLineageHighlight()) return;
        updateUiPanels(true);
        SFX.play('ui');
      });
    }
    if (UI.inspectClearButton) {
      UI.inspectClearButton.addEventListener('click', () => {
        clearSelection();
        highlightedLineage = null;
        updateUiPanels(true);
        SFX.play('ui');
      });
    }
    if (UI.applySeedButton) UI.applySeedButton.addEventListener('click', applySeedFromInput);
    if (UI.seedInput) {
      UI.seedInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applySeedFromInput();
      });
    }

    const sliders = [
      [UI.controlFood, 'foodFlow'],
      [UI.controlMetabolism, 'metabolism'],
      [UI.controlFertility, 'fertility'],
      [UI.controlSeason, 'season'],
    ];
    for (const [input, key] of sliders) {
      if (!input) continue;
      input.addEventListener('input', () => {
        TUNE[key] = clamp(Number(input.value) / 100, 0.1, 2.5);
        updateUiPanels(true);
      });
      input.addEventListener('change', () => SFX.play('ui'));
    }

    for (const button of UI.scenarioButtons) {
      button.addEventListener('click', () => {
        controlsOpen = false;
        applyScenario(button.dataset.scenario);
        SFX.play('ui');
      });
    }

    for (const button of UI.presetButtons) {
      button.addEventListener('click', () => {
        applyPreset(button.dataset.preset);
        SFX.play('ui');
      });
    }

    for (const button of UI.viewButtons) {
      button.addEventListener('click', () => {
        const key = button.dataset.view;
        if (!(key in VIEW)) return;
        VIEW[key] = !VIEW[key];
        syncViewUi();
        updateUiPanels(true);
        SFX.play('ui');
      });
    }

    if (UI.replayBookmarkButton) {
      UI.replayBookmarkButton.addEventListener('click', () => {
        addBookmark();
        SFX.play('ui');
      });
    }

    if (UI.replayRewindShortButton) {
      UI.replayRewindShortButton.addEventListener('click', () => {
        rewindReplay(15);
      });
    }

    if (UI.replayRewindLongButton) {
      UI.replayRewindLongButton.addEventListener('click', () => {
        rewindReplay(30);
      });
    }

    if (UI.replayLiveButton) {
      UI.replayLiveButton.addEventListener('click', () => {
        returnToLive();
      });
    }

    if (UI.replayScrubber) {
      UI.replayScrubber.addEventListener('input', () => {
        scrubReplayTo(UI.replayScrubber.value);
      });
    }

    if (UI.bookmarkList) {
      UI.bookmarkList.addEventListener('click', (e) => {
        const button = e.target.closest('[data-bookmark-id]');
        if (!button) return;
        restoreBookmark(Number(button.dataset.bookmarkId));
      });
    }
  }

  function nextRunSeed() {
    currentSeed = (SIM.seedBase + runIndex * SIM.seedStep) >>> 0;
    if (!currentSeed) currentSeed = 1;
    runIndex++;
    simRand = makeRng(currentSeed);
    simAccumulator = 0;
    syncControlLabels();
  }

  function pauseGame(reason = 'manual') {
    if (paused) return;
    paused = true;
    pauseReason = reason;
    pauseClock = 0;
    input.down = Object.create(null);
    input.pressed = Object.create(null);
    input.used = Object.create(null);
    syncControlLabels();
    updateUiPanels(true);
  }

  function resumeGame() {
    if (!paused) return;
    const leavingReplay = REPLAY.activeSnapshotId != null && pauseReason === 'replay';
    paused = false;
    pauseReason = '';
    pauseClock = 0;
    if (leavingReplay) REPLAY.activeSnapshotId = null;
    input.down = Object.create(null);
    input.pressed = Object.create(null);
    input.used = Object.create(null);
    input.pointer.tapped = false;
    simAccumulator = 0;
    last = performance.now();
    if (leavingReplay) rebaseReplayBuffer('Branch live');
    syncControlLabels();
    updateUiPanels(true);
  }

  function togglePause() {
    if (paused) resumeGame();
    else pauseGame('manual');
    SFX.play('ui');
  }

  function newSimulation() {
    return {
      time: 0,
      shake: 0,
      shakeX: 0,
      shakeY: 0,
      fish: [],
      food: [],
      detritus: [],
      plankton: [],
      particles: [],
      deco: [],
      events: [],
      sp: { food: 0, deco: 0, migrant: SIM.immigrationEvery },
      stats: { births: 0, deaths: 0, foodTaken: 0, predations: 0, reseeds: 0, disturbances: 0 },
      avgEnergy: 0,
      extinctionClock: 0,
      run: { seed: currentSeed, index: runIndex - 1, scenario: currentScenarioId },
      env: {
        season: 0.5,
        blooms: [createBloom(0), createBloom(1), createBloom(2)],
        murk: 0,
        oxygenDip: 0,
        foodCrash: 0,
        disturbance: {
          active: null,
          timer: randSim(SIM.disturbanceEveryMin, SIM.disturbanceEveryMax),
          age: 0,
          duration: 0,
          strength: 0,
        },
      },
    };
  }

  let g = newSimulation();

  function shake(amt) {
    g.shake = Math.min(10, g.shake + amt);
  }

  function spawnParticle(x, y, vx, vy, life, col, size = 1) {
    g.particles.push({ x, y, vx, vy, life, ttl: life, col, size });
  }

  function burst(x, y, col, count = 14, spd = 58, life = 0.35) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(spd * 0.25, spd);
      spawnParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(life * 0.55, life), col, randi(1, 2));
    }
  }

  function spawnDetritus(x, y, nut = 1, tint = COL.sand2) {
    if (g.detritus.length >= SIM.detritusCap) g.detritus.shift();
    g.detritus.push({
      x,
      y,
      vx: randSim(-scaleWorld(4), scaleWorld(4)),
      vy: randSim(scaleWorld(6), scaleWorld(12)),
      nut,
      life: randSim(SIM.detritusDecayMin, SIM.detritusDecayMax),
      tint,
    });
  }

  function depositNutrients(x, y, nut) {
    if (nut <= 0) return;
    let best = null;
    let bestDist = Infinity;
    for (const patch of g.plankton) {
      const d = hypot(x - patch.x, y - patch.y);
      if (d < bestDist && d < scaleWorld(26)) {
        best = patch;
        bestDist = d;
      }
    }
    if (best) {
      best.nut = clamp(best.nut + nut, 0.4, 10);
      best.ttl = Math.min(best.ttl + nut * 0.8, 40);
      best.r = clamp(best.r + nut * scaleWorld(0.6), scaleWorld(8), scaleWorld(28));
      return;
    }
    if (g.plankton.length >= SIM.planktonCap) {
      g.plankton.sort((a, b) => a.nut - b.nut);
      g.plankton.shift();
    }
    g.plankton.push({
      x: clamp(x, scaleWorld(16), W - scaleWorld(16)),
      y: clamp(y, WORLD.foodTop, WORLD.waterBottom),
      vx: randSim(-scaleWorld(2), scaleWorld(2)),
      vy: randSim(-scaleWorld(1), scaleWorld(1)),
      nut: clamp(nut, 0.6, 4),
      ttl: randSim(18, 28),
      r: clamp(scaleWorld(8) + nut * scaleWorld(4), scaleWorld(8), scaleWorld(26)),
      phase: randSim(0, Math.PI * 2),
    });
  }

  function rememberPatch(f, x, y, richness = 1) {
    f.memory = {
      x: clamp(x, WORLD.edgePad, W - WORLD.edgePad),
      y: clamp(y, WORLD.waterTop, WORLD.waterBottom),
      ttl: SIM.memoryDuration,
      richness: clamp(richness, 0.4, 2.8),
    };
  }

  function sampleTrail(f, dt) {
    f.trailT -= dt;
    if (f.trailT > 0) return;
    f.trailT += SIM.trailSampleEvery;
    f.trail.push({ x: f.x, y: f.y });
    if (f.trail.length > SIM.trailPoints) f.trail.shift();
  }

  function pickTint(inherit = null, preferred = null) {
    if (inherit && randSim() < 0.78) return inherit;
    if (preferred && randSim() < 0.82) return preferred;
    return FISH_TINTS[randiSim(0, FISH_TINTS.length - 1)];
  }

  function mutateValue(v, amount, min, max) {
    return clamp(v * (1 + randSim(-amount, amount)), min, max);
  }

  function randomOpenWaterPoint(minY = WORLD.spawnTop, maxY = WORLD.sandLine, pad = scaleWorld(4), solidOnly = false) {
    for (let i = 0; i < 24; i++) {
      const point = {
        x: randSim(WORLD.edgePad, W - WORLD.edgePad),
        y: randSim(minY, maxY),
      };
      if (formationCollisionAt(point.x, point.y, pad, solidOnly).depth <= 0) return point;
    }
    return projectOutOfFormation(randSim(WORLD.edgePad, W - WORLD.edgePad), randSim(minY, maxY), pad, solidOnly);
  }

  function createBloom(slot) {
    const point = randomOpenWaterPoint(scaleWorld(48), waterLaneY(0.72), scaleWorld(10), true);
    return {
      slot,
      phase: randSim(0, Math.PI * 2),
      speed: randSim(0.16, 0.34) * (slot ? 1 : -1),
      orbitX: randSim(scaleWorld(30), scaleWorld(76)),
      orbitY: randSim(scaleWorld(12), scaleWorld(28)),
      strength: randSim(0.82, 1.18),
      x: point.x,
      y: point.y,
      radius: randSim(SIM.bloomMinRadius, SIM.bloomMaxRadius),
    };
  }

  function bloomSpawnPoint() {
    if (!g.env || !g.env.blooms.length || randSim() < 0.20) {
      return randomOpenWaterPoint(WORLD.waterTopSoft, WORLD.waterBottom, scaleWorld(3), true);
    }

    const bloom = g.env.blooms[randiSim(0, g.env.blooms.length - 1)];
    const angle = randSim(0, Math.PI * 2);
    const dist = bloom.radius * Math.sqrt(randSim()) * randSim(0.25, 1.05);
    return projectOutOfFormation(
      clamp(bloom.x + Math.cos(angle) * dist, WORLD.edgePad, W - WORLD.edgePad),
      clamp(bloom.y + Math.sin(angle) * dist, WORLD.waterTopSoft, WORLD.waterBottom),
      scaleWorld(3),
      true,
    );
  }

  function spawnFood(x = null, y = null) {
    const at = x == null || y == null ? bloomSpawnPoint() : projectOutOfFormation(x, y, scaleWorld(3), true);
    g.food.push({
      x: at.x,
      y: at.y,
      vx: randSim(-scaleWorld(6), scaleWorld(6)),
      vy: randSim(scaleWorld(8), scaleWorld(18)),
      r: scaleWorld(2.4),
      wob: randSim(0, 10),
    });
  }

  function applyScenarioEnvironment(scenario) {
    const env = scenario.env || {};
    if (env.season != null) g.env.season = clamp(env.season, 0.05, 0.95);
    if (env.murk != null) g.env.murk = clamp(env.murk, 0, 1);
    if (env.oxygenDip != null) g.env.oxygenDip = clamp(env.oxygenDip, 0, 1);
    if (env.foodCrash != null) g.env.foodCrash = clamp(env.foodCrash, 0, 1);
    if (env.disturbance) {
      g.env.disturbance.active = env.disturbance.active || null;
      g.env.disturbance.age = 0;
      g.env.disturbance.duration = env.disturbance.duration ?? randSim(SIM.disturbanceDurationMin, SIM.disturbanceDurationMax);
      g.env.disturbance.strength = env.disturbance.strength ?? 0.5;
      g.env.disturbance.timer = env.disturbance.timer ?? randSim(SIM.disturbanceEveryMin, SIM.disturbanceEveryMax);
    }
    if (Array.isArray(env.nutrientPatches)) {
      for (const patch of env.nutrientPatches) {
        const point = pointFromNormalized(patch.x, patch.y);
        depositNutrients(point.x, point.y, patch.nut ?? 2.4);
        for (let i = 0; i < Math.max(2, Math.round((patch.nut ?? 2.4) * 1.5)); i++) {
          spawnFood(point.x + randSim(-scaleWorld(14), scaleWorld(14)), point.y + randSim(-scaleWorld(8), scaleWorld(8)));
        }
      }
    }
  }

  function spawnDecoBubble() {
    g.deco.push({
      x: randSim(WORLD.sidePad, W - WORLD.sidePad),
      y: H + randSim(0, 20),
      r: randSim(scaleWorld(1.2), scaleWorld(2.2)),
      vy: randSim(scaleWorld(10), scaleWorld(26)),
      phase: randSim(0, 10),
      a: randSim(0.10, 0.24),
    });
  }

  function makeFish(opts = {}) {
    const archetype = pickArchetype(opts.archetype);
    const stage = opts.stage ?? 'adult';
    const adultR = clamp(opts.adultR ?? sampleRange(archetype.size), scaleWorld(4.0), scaleWorld(10.5));
    const [juvenileMin, juvenileMax] = juvenileRatioRangeFor(archetype.id);
    const defaultR = stage === 'juvenile' ? adultR * randSim(juvenileMin, juvenileMax) : adultR;
    const r = clamp(opts.r ?? defaultR, stage === 'juvenile' ? scaleWorld(2.6) : scaleWorld(4.0), scaleWorld(10.5));
    const traits = opts.traits || {
      speed: sampleRange(archetype.traits.speed),
      turn: sampleRange(archetype.traits.turn),
      fear: sampleRange(archetype.traits.fear),
      greed: sampleRange(archetype.traits.greed),
      social: sampleRange(archetype.traits.social),
      sight: sampleRange(archetype.traits.sight),
      carnivore: sampleRange(archetype.traits.carnivore),
      bloom: sampleRange(archetype.traits.bloom),
      refuge: sampleRange(archetype.traits.refuge),
      depth: sampleRange(archetype.traits.depth),
    };
    const vx = opts.vx ?? randSim(-scaleWorld(16), scaleWorld(16));
    const vy = opts.vy ?? randSim(-scaleWorld(12), scaleWorld(12));
    const lineage = opts.lineage ?? nextLineageId++;
    const lineageTint = opts.lineageTint ?? nextLineageTint(lineage);
    const id = opts.id ?? nextFishId++;
    const spawnPoint =
      opts.x != null && opts.y != null
        ? projectOutOfFormation(opts.x, opts.y, r * 0.68, true)
        : randomOpenWaterPoint(WORLD.spawnTop, WORLD.sandLine, r * 0.68, true);
    return {
      id,
      x: spawnPoint.x,
      y: spawnPoint.y,
      vx,
      vy,
      r,
      adultR,
      stage,
      facing: vx >= 0 ? 1 : -1,
      tint: pickTint(opts.tint, archetype.tint),
      lineage,
      lineageTint,
      watchName: opts.watchName ?? watchNameForFish(archetype.id, lineage, id, opts.generation ?? 0),
      energy: opts.energy ?? randSim(46, 70),
      age: opts.age ?? 0,
      generation: opts.generation ?? 0,
      archetype: archetype.id,
      archetypeLabel: archetype.label,
      traits,
      reproCd: opts.reproCd ?? randSim(3, 8),
      wanderA: opts.wanderA ?? randSim(0, Math.PI * 2),
      wanderT: opts.wanderT ?? randSim(0.35, 1.10),
      maturityAge: opts.maturityAge ?? randSim(SIM.juvenileMaturityMin, SIM.juvenileMaturityMax),
      satiation: opts.satiation ?? 0,
      huntCd: opts.huntCd ?? 0,
      memory: opts.memory ?? null,
      trail: opts.trail ?? [],
      trailT: opts.trailT ?? randSim(0, SIM.trailSampleEvery),
      wasteT: opts.wasteT ?? randSim(SIM.wasteEveryMin, SIM.wasteEveryMax),
      flash: opts.flash ?? 0,
      meals: opts.meals ?? 0,
      hunts: opts.hunts ?? 0,
      offspring: opts.offspring ?? 0,
      hunger: 0,
      stress: 0,
      neighbors: 0,
      crowding: 0,
      intent: opts.intent ?? 'patrol',
      intentNote: opts.intentNote ?? 'Settling into the tank.',
      intentTarget: opts.intentTarget ?? null,
      alive: true,
    };
  }

  function spawnImmigrant() {
    const side = randiSim(0, 1);
    const archetype = g.env.season > 0.55 ? (randSim() < 0.65 ? 'grazer' : 'shoaler') : randSim() < 0.5 ? 'shoaler' : 'opportunist';
    const entry = randomOpenWaterPoint(WORLD.spawnTop, waterLaneY(0.78), scaleWorld(6), true);
    const immigrant = makeFish({
      archetype,
      x: side ? Math.min(entry.x, scaleWorld(26)) : Math.max(entry.x, W - scaleWorld(26)),
      y: entry.y,
      vx: side ? randSim(scaleWorld(14), scaleWorld(28)) : randSim(-scaleWorld(28), -scaleWorld(14)),
      vy: randSim(-scaleWorld(8), scaleWorld(8)),
      energy: randSim(48, 72),
      reproCd: randSim(5, 10),
    });
    g.fish.push(immigrant);
    pushEvent('immigrant', `${immigrant.archetypeLabel} immigrant arrived`, 'A low-population migrant entered from the tank edge.', {
      fishId: immigrant.id,
      lineage: immigrant.lineage,
    });
  }

  function spawnInitialPopulation(config = {}) {
    const count = config.count ?? SIM.initialFish;
    const foodCount = config.foodCount ?? SIM.initialFood;
    const juvenileRatio = clamp(config.juvenileRatio ?? 0.18, 0, 0.85);
    const lineup = config.lineup && config.lineup.length ? config.lineup : DEFAULT_LINEUP;
    for (let i = 0; i < count; i++) {
      const point = randomOpenWaterPoint(WORLD.spawnTop, waterLaneY(0.78), scaleWorld(7), true);
      const stage = randSim() < juvenileRatio ? 'juvenile' : 'adult';
      g.fish.push(
        makeFish({
          archetype: lineup[i % lineup.length],
          stage,
          x: point.x,
          y: point.y,
          energy: randSim(46, 74),
          reproCd: randSim(2, 9),
        }),
      );
    }
    for (let i = 0; i < foodCount; i++) {
      spawnFood(randSim(WORLD.edgePad, W - WORLD.edgePad), randSim(WORLD.foodTop, WORLD.waterBottom));
    }
  }

  function resetSimulation() {
    const scenario = currentScenario();
    nextRunSeed();
    rebuildHabitat(currentSeed);
    nextLineageId = 1;
    nextFishId = 1;
    WATCH_VIEW.cardVisible = false;
    WATCH_VIEW.slotHold = 0;
    WATCH_VIEW.lastSubjectId = null;
    selectedFishId = null;
    selectedFishPin = null;
    highlightedLineage = null;
    g = newSimulation();
    g.run.scenario = currentScenarioId;
    refreshFormationCache();
    paused = false;
    pauseReason = '';
    pauseClock = 0;
    input.down = Object.create(null);
    input.pressed = Object.create(null);
    input.used = Object.create(null);
    input.pointer.tapped = false;
    resetHistory();
    resetReplayState();
    spawnInitialPopulation(scenario.population);
    applyScenarioEnvironment(scenario);
    g.avgEnergy = g.fish.length ? g.fish.reduce((sum, fish) => sum + fish.energy, 0) / g.fish.length : 0;
    sampleHistory(HISTORY.sampleEvery);
    captureReplaySnapshot('auto', 'Live seed');
    simAccumulator = 0;
    uiClock = 0;
    last = performance.now();
    updateUiPanels(true);
  }

  function createOffspring(parent) {
    const childArchetype = randSim() < 0.90 ? parent.archetype : pickArchetype().id;
    const [juvenileMin, juvenileMax] = juvenileRatioRangeFor(childArchetype);
    const angle = randSim(0, Math.PI * 2);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const childEnergy = parent.energy * 0.34;
    const childAdultR = mutateValue(parent.adultR || parent.r, SIM.mutation, scaleWorld(4.0), scaleWorld(10.5));
    parent.energy = Math.max(24, parent.energy - childEnergy - 6);
    parent.reproCd = randSim(SIM.reproductionCooldownMin, SIM.reproductionCooldownMax);
    parent.flash = 0.50;
    const childPoint = projectOutOfFormation(
      clamp(parent.x + dx * (parent.r + scaleWorld(4)), WORLD.sidePad, W - WORLD.sidePad),
      clamp(parent.y + dy * (parent.r + scaleWorld(4)), WORLD.waterTop, WORLD.waterBottom),
      scaleWorld(4),
      true,
    );

    const child = makeFish({
      archetype: childArchetype,
      stage: 'juvenile',
      x: childPoint.x,
      y: childPoint.y,
      vx: parent.vx * 0.4 - dx * scaleWorld(18),
      vy: parent.vy * 0.4 - dy * scaleWorld(18),
      adultR: childAdultR,
      r: clamp(childAdultR * randSim(juvenileMin, juvenileMax), scaleWorld(2.6), childAdultR * 0.68),
      tint: parent.tint,
      lineage: parent.lineage,
      lineageTint: parent.lineageTint,
      energy: childEnergy,
      generation: parent.generation + 1,
      maturityAge: randSim(SIM.juvenileMaturityMin, SIM.juvenileMaturityMax),
      reproCd: randSim(6, 10),
      traits: {
        speed: mutateValue(parent.traits.speed, SIM.mutation, 0.72, 1.40),
        turn: mutateValue(parent.traits.turn, SIM.mutation, 0.72, 1.40),
        fear: mutateValue(parent.traits.fear, SIM.mutation, 0.55, 1.70),
        greed: mutateValue(parent.traits.greed, SIM.mutation, 0.55, 1.70),
        social: mutateValue(parent.traits.social, SIM.mutation, 0.35, 1.55),
        sight: clamp(parent.traits.sight + randSim(-SIM.mutationSight, SIM.mutationSight), scaleWorld(36), scaleWorld(118)),
        carnivore: mutateValue(parent.traits.carnivore, SIM.mutation, 0.02, 1.00),
        bloom: mutateValue(parent.traits.bloom, SIM.mutation, 0.02, 1.45),
        refuge: mutateValue(parent.traits.refuge, SIM.mutation, 0.02, 1.30),
        depth: mutateValue(parent.traits.depth, SIM.mutation, 0.12, 0.96),
      },
      flash: 0.75,
    });
    parent.offspring = (parent.offspring || 0) + 1;
    g.stats.births++;
    pushEvent(
      'birth',
      `${parent.archetypeLabel} split into a juvenile`,
      `Generation ${child.generation} entered the tank with ${Math.round(child.energy)} energy.`,
      {
        fishId: child.id,
        lineage: child.lineage,
        parentFishId: parent.id,
        parentLineage: parent.lineage,
        relatedFishIds: [child.id, parent.id],
        relatedLineages: [child.lineage, parent.lineage],
      },
    );
    burst(parent.x, parent.y, COL.foam, 12, 62, 0.32);
    return child;
  }

  function startDisturbance(type = null) {
    const disturbance = g.env.disturbance;
    disturbance.active = type || ['reversal', 'murk', 'oxygen', 'crash'][randiSim(0, 3)];
    disturbance.age = 0;
    disturbance.duration = randSim(SIM.disturbanceDurationMin, SIM.disturbanceDurationMax);
    disturbance.strength = 0;
    g.stats.disturbances++;
    pushEvent(
      'disturbance',
      `${disturbanceLabel().replace(/^./, (m) => m.toUpperCase())} started`,
      'Currents, visibility, oxygen, or food pressure shifted across the tank.',
    );
  }

  function updateEnvironment(dt) {
    const season = 0.5 + 0.5 * Math.sin(g.time * SIM.seasonRate * TUNE.season + currentSeed * 0.0009);
    g.env.season = season;
    const disturbance = g.env.disturbance;
    if (disturbance.active) {
      disturbance.age += dt;
      const enter = clamp(disturbance.age / 2.5, 0, 1);
      const exit = clamp((disturbance.duration - disturbance.age) / 2.5, 0, 1);
      disturbance.strength = Math.min(enter, exit);
      if (disturbance.age >= disturbance.duration) {
        disturbance.active = null;
        disturbance.age = 0;
        disturbance.duration = 0;
        disturbance.strength = 0;
        disturbance.timer = randSim(SIM.disturbanceEveryMin, SIM.disturbanceEveryMax);
      }
    } else {
      disturbance.timer -= dt;
      if (disturbance.timer <= 0) startDisturbance();
    }

    g.env.murk = disturbance.active === 'murk' ? disturbance.strength : 0;
    g.env.oxygenDip = disturbance.active === 'oxygen' ? disturbance.strength : 0;
    g.env.foodCrash = disturbance.active === 'crash' ? disturbance.strength : 0;

    for (const bloom of g.env.blooms) {
      bloom.phase += dt * bloom.speed;
      bloom.x = clamp(
        W / 2 + Math.sin(bloom.phase + bloom.slot * 0.7) * bloom.orbitX + (bloom.slot ? 1 : -1) * (season - 0.5) * scaleWorld(20),
        scaleWorld(22),
        W - scaleWorld(22),
      );
      bloom.y = clamp(
        scaleWorld(94) + Math.cos(bloom.phase * 1.45 + bloom.slot) * bloom.orbitY + Math.sin(bloom.phase * 0.6) * scaleWorld(8),
        WORLD.bloomTop,
        WORLD.bloomBottom,
      );
      const bloomPoint = projectOutOfFormation(bloom.x, bloom.y, bloom.radius * 0.16, true);
      bloom.x = bloomPoint.x;
      bloom.y = bloomPoint.y;
      bloom.radius = lerp(
        SIM.bloomMinRadius,
        SIM.bloomMaxRadius,
        clamp(0.20 + season * 0.65 + (bloom.strength - 0.82) - g.env.foodCrash * 0.18, 0, 1),
      );
    }
  }

  function updateDeco(dt) {
    g.sp.deco -= dt;
    if (g.sp.deco <= 0 && g.deco.length < SIM.decoCap) {
      spawnDecoBubble();
      g.sp.deco = randSim(0.14, 0.38);
    }

    for (const b of g.deco) {
      b.phase += dt;
      b.y -= b.vy * dt;
      b.x += Math.sin(b.phase * 2.2) * dt * scaleWorld(6);
    }
    g.deco = g.deco.filter((b) => b.y > -scaleWorld(12));
  }

  function updateDetritus(dt) {
    for (const d of g.detritus) {
      const field = currentAt(d.x, d.y);
      d.life -= dt;
      d.vx = approach(d.vx, field.x * 0.35, dt * 3.5);
      d.vy = approach(d.vy, SIM.detritusSink + field.y * 0.2, dt * 5);
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      const settled = projectOutOfFormation(d.x, d.y, scaleWorld(1), true);
      d.x = settled.x;
      d.y = settled.y;
    }

    for (let i = g.detritus.length - 1; i >= 0; i--) {
      const d = g.detritus[i];
      if (d.life > 0 && d.y < WORLD.waterBottomSoft) continue;
      depositNutrients(d.x, Math.min(scaleWorld(170), d.y - scaleWorld(4)), d.nut * (0.85 + shelterFactorAt(d.x, d.y) * 0.65));
      g.detritus.splice(i, 1);
    }
  }

  function updatePlankton(dt) {
    for (const patch of g.plankton) {
      const field = currentAt(patch.x, patch.y);
      patch.phase += dt;
      patch.ttl -= dt;
      patch.vx = approach(patch.vx, field.x * 0.12 + Math.sin(patch.phase) * 0.4, dt * 2);
      patch.vy = approach(patch.vy, field.y * 0.08 + Math.cos(patch.phase * 1.2) * 0.2, dt * 2);
      patch.x = clamp(patch.x + patch.vx * dt, WORLD.edgePad, W - WORLD.edgePad);
      patch.y = clamp(patch.y + patch.vy * dt, WORLD.waterTopSoft, WORLD.waterBottom);
      const slip = projectOutOfFormation(patch.x, patch.y, scaleWorld(3), true);
      patch.x = slip.x;
      patch.y = slip.y;
      patch.nut = Math.max(0, patch.nut - dt * (0.04 + g.env.foodCrash * 0.06));
      patch.r = clamp(scaleWorld(8) + patch.nut * scaleWorld(4.2), scaleWorld(8), scaleWorld(28));

      if (patch.nut > 0.35 && g.food.length < currentFoodCap(g.env.season)) {
        const spawnChance = dt * (0.08 + patch.nut * 0.05) * (1 - g.env.foodCrash * 0.45);
        if (randSim() < spawnChance) {
          spawnFood(
            clamp(patch.x + randSim(-patch.r, patch.r), WORLD.edgePad, W - WORLD.edgePad),
            clamp(patch.y + randSim(-patch.r * 0.55, patch.r * 0.55), WORLD.waterTop, WORLD.waterBottom),
          );
          patch.nut = Math.max(0, patch.nut - 0.22);
        }
      }
    }
    g.plankton = g.plankton.filter((patch) => patch.ttl > 0 && patch.nut > 0.08);
  }

  function updateFood(dt) {
    g.sp.food -= dt;
    const season = g.env.season;
    const foodCap = currentFoodCap(season);
    if (g.sp.food <= 0 && g.food.length < foodCap) {
      spawnFood();
      if (randSim() < clamp(lerp(0.08, 0.22, season) * (0.72 + TUNE.foodFlow * 0.42), 0.04, 0.6) && g.food.length < foodCap) {
        const driftPoint = randomOpenWaterPoint(WORLD.foodTop, waterLaneY(0.72), scaleWorld(3), true);
        spawnFood(driftPoint.x, driftPoint.y);
      }
      g.sp.food = nextFoodInterval(season);
    }

    for (const f of g.food) {
      f.wob += dt;
      const bloomDrift = Math.sin(g.time * 0.6 + baseCoord(f.y) * 0.04) * lerp(scaleWorld(1.5), scaleWorld(4.5), season);
      const field = currentAt(f.x, f.y);
      f.vx = approach(f.vx, Math.sin(f.wob * 3.0) * scaleWorld(8) + bloomDrift + field.x * 0.35, dt * scaleWorld(30));
      f.vy = approach(f.vy, scaleWorld(8) + field.y * 0.18, dt * scaleWorld(18));
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      const slip = projectOutOfFormation(f.x, f.y, scaleWorld(2), true);
      f.x = slip.x;
      f.y = slip.y;
      if (f.x < WORLD.insetX) {
        f.x = WORLD.insetX;
        f.vx = Math.abs(f.vx);
      }
      if (f.x > W - WORLD.insetX) {
        f.x = W - WORLD.insetX;
        f.vx = -Math.abs(f.vx);
      }
      if (f.y < WORLD.waterTop) f.y = WORLD.waterTop;
      if (f.y > WORLD.waterBottom) f.y = WORLD.waterBottom;
    }
    g.food = g.food.filter((f) => f.y < H + WORLD.hudH);
  }

  function updateFish(dt) {
    const newborns = [];
    const season = g.env.season;
    const reproductionEnergy = currentReproductionEnergy();

    for (const f of g.fish) {
      if (!f.alive) continue;

      f.age += dt;
      f.reproCd = Math.max(0, f.reproCd - dt);
      f.flash = Math.max(0, f.flash - dt);
      f.satiation = Math.max(0, f.satiation - dt * SIM.satiationDecay);
      f.huntCd = Math.max(0, f.huntCd - dt);
      if (f.memory) {
        f.memory.ttl -= dt * (1 + g.env.foodCrash * 0.35);
        if (f.memory.ttl <= 0) f.memory = null;
      }

      if (f.stage === 'juvenile') {
        f.r = approach(f.r, f.adultR, dt * SIM.juvenileGrowth);
        if (f.age >= f.maturityAge && f.r >= f.adultR * SIM.juvenileAdultThreshold) {
          f.r = f.adultR;
          f.stage = 'adult';
          f.flash = Math.max(f.flash, 0.4);
          burst(f.x, f.y, f.lineageTint, 8, 28, 0.18);
        }
      }

      sampleTrail(f, dt);
      f.wanderT -= dt;
      if (f.wanderT <= 0) {
        f.wanderT = randSim(0.35, 1.15) / Math.max(0.7, f.traits.turn);
        f.wanderA += randSim(-1.35, 1.35);
      } else {
        f.wanderA += randSim(-0.45, 0.45) * dt;
      }

      const juvenile = f.stage === 'juvenile';
      const stageSpeed = juvenile ? 1.18 : 1;
      const stageTurn = juvenile ? 1.16 : 1;
      const stageFear = juvenile ? 1.22 : 1;
      const stageRefuge = juvenile ? 1.36 : 1;
      const stageSocial = juvenile ? 1.12 : 1;
      const effectiveCarnivore = clamp(f.traits.carnivore * (juvenile ? 0.22 : 1) * (1 - f.satiation * 0.18), 0.02, 1.00);
      const effectiveBloom = f.traits.bloom * (juvenile ? 1.08 : 1);
      const effectiveRefuge = f.traits.refuge * stageRefuge;
      const effectiveDepth = clamp(f.traits.depth + (juvenile ? 0.10 : 0) - g.env.oxygenDip * 0.16, 0.12, 0.96);
      const hunger = clamp((reproductionEnergy - f.energy) / reproductionEnergy, 0, 1);
      const sight = (f.traits.sight + f.r * 4 + hunger * 10) * lerp(1, 0.62, g.env.murk);
      const field = currentAt(f.x, f.y);
      const wakeTarget = bestWakeTarget(f.x, f.y, sight + scaleWorld(18));
      let desireX = Math.cos(f.wanderA) * (0.20 + (1 - f.traits.social) * 0.16);
      let desireY = Math.sin(f.wanderA) * (0.20 + (1 - f.traits.social) * 0.16);
      let intent = 'patrol';
      let intentNote = 'Loosely wandering through open water.';
      let intentTarget = null;

      let bestFood = null;
      let bestFoodScore = -1;
      for (const food of g.food) {
        const dx = food.x - f.x;
        const dy = food.y - f.y;
        const d = hypot(dx, dy);
        if (d > sight + scaleWorld(18)) continue;
        const planktonBonus = planktonRichnessAt(food.x, food.y, scaleWorld(14)) * 0.04;
        const score =
          (1 - clamp(d / (sight + scaleWorld(18)), 0, 1)) * (0.7 + hunger * (1.7 - effectiveCarnivore * 0.6) + effectiveBloom * 0.2 + planktonBonus);
        if (score > bestFoodScore) {
          bestFoodScore = score;
          bestFood = food;
        }
      }
      if (bestFood) {
        const n = norm2(bestFood.x - f.x, bestFood.y - f.y);
        const foodDrive = 1.20 + hunger * 2.25 + (1 - effectiveCarnivore) * 0.35 + f.traits.greed * 0.12 + juvenile * 0.2;
        desireX += n.x * foodDrive;
        desireY += n.y * foodDrive;
        intent = 'food';
        intentNote = 'Tracking a visible food particle.';
        intentTarget = { x: bestFood.x, y: bestFood.y, kind: 'food' };
      }

      const planktonPick = bestPlanktonPatchFor(f, sight, hunger);
      if (!bestFood && planktonPick.patch) {
        const n = norm2(planktonPick.patch.x - f.x, planktonPick.patch.y - f.y);
        desireX += n.x * (0.18 + planktonPick.score);
        desireY += n.y * (0.18 + planktonPick.score);
        intent = 'plankton';
        intentNote = 'Leaning toward a nutrient-rich patch.';
        intentTarget = { x: planktonPick.patch.x, y: planktonPick.patch.y, kind: 'plankton' };
      }

      let alignX = 0;
      let alignY = 0;
      let centerX = 0;
      let centerY = 0;
      let neighbors = 0;
      let sepX = 0;
      let sepY = 0;
      let stress = 0;
      let threatX = 0;
      let threatY = 0;
      let threatWeight = 0;
      let bestPrey = null;
      let bestPreyScore = -1;

      for (const other of g.fish) {
        if (other === f || !other.alive) continue;

        const dx = other.x - f.x;
        const dy = other.y - f.y;
        const d = Math.max(0.001, hypot(dx, dy));

        if (d < SIM.socialRadius + f.traits.social * scaleWorld(12)) {
          neighbors++;
          alignX += other.vx;
          alignY += other.vy;
          centerX += other.x;
          centerY += other.y;
        }

        const separationRadius = SIM.crowdRadius + (f.r + other.r) * 0.35;
        if (d < separationRadius) {
          const n = norm2(f.x - other.x, f.y - other.y);
          const force = 1 - d / separationRadius;
          sepX += n.x * force;
          sepY += n.y * force;
          stress += force;
        }

        if (other.r > f.r * 1.12) {
          const fearScore = (other.r / f.r) * (1 - clamp(d / (sight * 1.15), 0, 1));
          if (fearScore > threatWeight) {
            threatWeight = fearScore;
            const n = norm2(f.x - other.x, f.y - other.y);
            threatX = n.x;
            threatY = n.y;
          }
        } else if (f.r > other.r * 1.18) {
          const preyNeed = 0.10 + hunger * 0.75 + f.traits.greed * 0.45 + f.traits.carnivore * 1.10;
          const sizeEdge = clamp((f.r - other.r) / f.r, 0.2, 1.2);
          const preyScore = preyNeed * sizeEdge * (1 - clamp(d / sight, 0, 1));
          if (preyScore > bestPreyScore) {
            bestPreyScore = preyScore;
            bestPrey = other;
          }
        }
      }

      if (neighbors > 0 && f.traits.social > 0.18) {
        alignX /= neighbors;
        alignY /= neighbors;
        centerX /= neighbors;
        centerY /= neighbors;
        const heading = norm2(alignX, alignY);
        const center = norm2(centerX - f.x, centerY - f.y);
        const schooling = (f.traits.social * stageSocial + field.schoolBoost * 0.95) * (0.28 + (1 - hunger) * 0.72) * (bestFood ? 0.42 : 1);
        desireX += heading.x * (0.10 + schooling * 0.24);
        desireY += heading.y * (0.10 + schooling * 0.24);
        desireX += center.x * (0.05 + schooling * 0.12);
        desireY += center.y * (0.05 + schooling * 0.12);
        if ((intent === 'patrol' || intent === 'wake') && (hunger < 0.55 || field.schoolBoost > 0.12)) {
          intent = 'school';
          intentNote = 'Holding formation with nearby fish.';
          intentTarget = { x: centerX, y: centerY, kind: 'school' };
        }
      }

      if (!bestFood && g.env.blooms.length) {
        let bloomPick = null;
        let bloomScore = -1;
        for (const bloom of g.env.blooms) {
          const dx = bloom.x - f.x;
          const dy = bloom.y - f.y;
          const d = hypot(dx, dy);
          const reach = bloom.radius + sight * 0.55;
          if (d > reach) continue;
          const score = (1 - clamp(d / reach, 0, 1)) * (0.25 + hunger * 0.55 + effectiveBloom * 0.9) * (0.35 + season);
          if (score > bloomScore) {
            bloomScore = score;
            bloomPick = bloom;
          }
        }
        if (bloomPick) {
          const n = norm2(bloomPick.x - f.x, bloomPick.y - f.y);
          desireX += n.x * (0.12 + bloomScore);
          desireY += n.y * (0.12 + bloomScore);
          if (intent === 'patrol') {
            intent = 'bloom';
            intentNote = 'Drifting toward an active bloom lane.';
            intentTarget = { x: bloomPick.x, y: bloomPick.y, kind: 'bloom' };
          }
        }
      }

      if (sepX || sepY) {
        const sep = norm2(sepX, sepY);
        desireX += sep.x * (1.15 + stress * 0.35);
        desireY += sep.y * (1.15 + stress * 0.35);
      }

      const pursuePrey =
        bestPrey &&
        (!bestFood || effectiveCarnivore > 0.72 || bestPreyScore > bestFoodScore * (1.20 + (1 - effectiveCarnivore) * 0.8));
      if (pursuePrey) {
        const n = norm2(bestPrey.x - f.x, bestPrey.y - f.y);
        const predatorDrive = (0.12 + hunger * 0.4 + f.traits.greed * 0.35 + effectiveCarnivore * 0.95) * (1 - f.satiation) * (f.huntCd <= 0 ? 1 : 0.2);
        desireX += n.x * predatorDrive;
        desireY += n.y * predatorDrive;
        intent = 'hunt';
        intentNote = 'Pressing a smaller fish as prey.';
        intentTarget = { x: bestPrey.x, y: bestPrey.y, kind: 'prey' };
      }

      if (threatWeight > 0) {
        desireX += threatX * (1.55 + f.traits.fear * stageFear * 1.15 + threatWeight * 0.35);
        desireY += threatY * (1.55 + f.traits.fear * stageFear * 1.15 + threatWeight * 0.35);
        intent = 'evade';
        intentNote = 'Backing off a larger nearby threat.';
        intentTarget = { x: f.x + threatX * scaleWorld(18), y: f.y + threatY * scaleWorld(18), kind: 'threat' };
        if (effectiveRefuge > 0.08) {
          const shelterTarget = wakeTarget && (juvenile || wakeTarget.score > 0.16 + effectiveRefuge * 0.08) ? wakeTarget : nearestShelterPocket(f.x, f.y);
          const refuge = norm2(shelterTarget.x - f.x, shelterTarget.y - f.y);
          desireX += refuge.x * (0.18 + effectiveRefuge * threatWeight * 0.95);
          desireY += refuge.y * (0.18 + effectiveRefuge * threatWeight * 0.95);
          intentNote = wakeTarget && shelterTarget === wakeTarget ? 'Breaking toward the lee behind a formation.' : 'Breaking toward the nearest shelter pocket.';
          intentTarget = { x: shelterTarget.x, y: shelterTarget.y, kind: 'shelter' };
        }
      }

      if (f.memory && threatWeight < 0.45 && (!bestFood || bestFoodScore < 0.85)) {
        const memoryVec = norm2(f.memory.x - f.x, f.memory.y - f.y);
        const crowdPenalty = clamp((neighbors - 3) / 6, 0, 0.55);
        const memoryDrive = (0.16 + hunger * 0.9 + f.memory.richness * 0.28) * (1 - crowdPenalty);
        desireX += memoryVec.x * memoryDrive;
        desireY += memoryVec.y * memoryDrive;
        if (intent === 'patrol' || intent === 'plankton' || intent === 'bloom') {
          intent = 'memory';
          intentNote = 'Returning to a remembered productive patch.';
          intentTarget = { x: f.memory.x, y: f.memory.y, kind: 'memory' };
        }
        if (hypot(f.memory.x - f.x, f.memory.y - f.y) < scaleWorld(12) && (!bestFood || bestFoodScore < 0.4)) {
          f.memory.ttl -= dt * (2.4 + crowdPenalty * 2.5);
        }
      }

      if (wakeTarget && threatWeight < 0.55 && (juvenile || field.magnitude > scaleWorld(3.8) || f.traits.social > 0.72 || hunger < 0.45)) {
        const wakeVec = norm2(wakeTarget.x - f.x, wakeTarget.y - f.y);
        const wakeDrive = (0.10 + wakeTarget.score * 0.62 + field.schoolBoost * 0.34 + effectiveRefuge * 0.16) * (bestFood ? 0.72 : 1);
        desireX += wakeVec.x * wakeDrive;
        desireY += wakeVec.y * wakeDrive;
        if (intent === 'patrol' || intent === 'school' || intent === 'plankton') {
          intent = 'wake';
          intentNote = 'Sliding into calmer water behind a formation.';
          intentTarget = { x: wakeTarget.x, y: wakeTarget.y, kind: 'wake' };
        }
      }

      const nicheTargetY = lerp(scaleWorld(42), scaleWorld(168), effectiveDepth);
      const nicheForce = clamp((nicheTargetY - f.y) / scaleWorld(44), -1, 1);
      desireY += nicheForce * (0.10 + (juvenile ? 0.12 : 0.05) + effectiveBloom * 0.04);

      if (juvenile && shelterFactorAt(f.x, f.y) < 0.28) {
        const shelterTarget = wakeTarget && wakeTarget.score > 0.12 ? wakeTarget : nearestShelterPocket(f.x, f.y);
        const shelterVec = norm2(shelterTarget.x - f.x, shelterTarget.y - f.y);
        desireX += shelterVec.x * (0.18 + effectiveRefuge * 0.28);
        desireY += shelterVec.y * (0.18 + effectiveRefuge * 0.28);
        if (intent === 'patrol' || intent === 'school') {
          intent = 'shelter';
          intentNote = wakeTarget && shelterTarget === wakeTarget ? 'Juvenile staying tucked behind a current break.' : 'Juvenile staying tucked near cover.';
          intentTarget = { x: shelterTarget.x, y: shelterTarget.y, kind: 'shelter' };
        }
      }

      const wallPad = WORLD.edgePad + f.r * 1.4;
      if (f.x < wallPad) desireX += (wallPad - f.x) / wallPad * 1.8;
      if (f.x > W - wallPad) desireX -= (f.x - (W - wallPad)) / wallPad * 1.8;
      if (f.y < WORLD.waterTopSoft + f.r) desireY += ((WORLD.waterTopSoft + f.r) - f.y) / (WORLD.insetX + f.r) * 1.6;
      if (f.y > WORLD.waterBottomSoft - f.r) desireY -= (f.y - (WORLD.waterBottomSoft - f.r)) / (WORLD.insetX + f.r) * 1.6;

      const desired = norm2(desireX, desireY);
      const size01 = clamp((f.r - scaleWorld(4)) / scaleWorld(6.5), 0, 1);
      const maxSpeed = lerp(scaleWorld(54), scaleWorld(28), size01) * f.traits.speed * stageSpeed * (threatWeight > 0.25 ? 1.16 : 1);
      const accel = lerp(scaleWorld(84), scaleWorld(46), size01) * f.traits.turn * stageTurn * (threatWeight > 0.25 ? 1.14 : 1);
      const drag = 2.6 - f.traits.turn * 0.30;
      f.hunger = hunger;
      f.stress = threatWeight;
      f.neighbors = neighbors;
      f.crowding = stress;
      f.intent = intent;
      f.intentNote = intentNote;
      f.intentTarget = intentTarget;

      if (desired.m > 0.001) {
        f.vx += desired.x * accel * dt;
        f.vy += desired.y * accel * dt;
      }

      const drift = juvenile ? 0.96 : 0.78 + size01 * 0.16;
      f.vx += field.x * drift * dt;
      f.vy += field.y * drift * dt;
      f.vx -= f.vx * drag * dt;
      f.vy -= f.vy * drag * dt;
      f.vx += Math.sin(g.time * 0.8 + baseCoord(f.y) * 0.035 + f.wanderA) * dt * scaleWorld(2.4);
      f.vy += Math.cos(g.time * 0.45 + baseCoord(f.x) * 0.025 + f.wanderA * 0.7) * dt * scaleWorld(1.2);

      const speed = hypot(f.vx, f.vy);
      if (speed > maxSpeed) {
        f.vx = (f.vx / speed) * maxSpeed;
        f.vy = (f.vy / speed) * maxSpeed;
      }

      f.x += f.vx * dt;
      f.y += f.vy * dt;

      if (f.x < WORLD.insetX) {
        f.x = WORLD.insetX;
        f.vx = Math.abs(f.vx) * 0.55;
      }
      if (f.x > W - WORLD.insetX) {
        f.x = W - WORLD.insetX;
        f.vx = -Math.abs(f.vx) * 0.55;
      }
      if (f.y < WORLD.waterTop) {
        f.y = WORLD.waterTop;
        f.vy = Math.abs(f.vy) * 0.55;
      }
      if (f.y > WORLD.waterBottom) {
        f.y = WORLD.waterBottom;
        f.vy = -Math.abs(f.vy) * 0.55;
      }

      const obstacleHit = formationCollisionAt(f.x, f.y, f.r * 0.62, true);
      if (obstacleHit.formation && obstacleHit.depth > 0) {
        const escape = norm2(f.x - obstacleHit.formation.x || obstacleHit.formation.perpX, f.y - obstacleHit.formation.y || obstacleHit.formation.perpY);
        f.x = clamp(f.x + escape.x * (obstacleHit.depth * (f.r + scaleWorld(3))), WORLD.insetX, W - WORLD.insetX);
        f.y = clamp(f.y + escape.y * (obstacleHit.depth * (f.r + scaleWorld(3))), WORLD.waterTop, WORLD.waterBottom);
        f.vx += escape.x * scaleWorld(9) * obstacleHit.depth;
        f.vy += escape.y * scaleWorld(9) * obstacleHit.depth;
      }

      if (f.vx > scaleWorld(1.5)) f.facing = 1;
      else if (f.vx < -scaleWorld(1.5)) f.facing = -1;

      const motionCost = speed * SIM.motionDrain * (0.8 + size01 * 0.65);
      const currentResistance = desired.m > 0.001 ? Math.max(0, -(desired.x * field.x + desired.y * field.y)) : hypot(field.x, field.y) * 0.2;
      const oxygenStress = g.env.oxygenDip * clamp((f.y - scaleWorld(92)) / scaleWorld(74), 0, 1) * 0.55;
      const seasonalMetabolism = (SIM.metabolism * TUNE.metabolism + (1 - season) * SIM.leanMetabolismBoost * TUNE.metabolism) * (1 + oxygenStress);
      f.energy -= dt * (seasonalMetabolism * (0.72 + f.r * 0.18) + motionCost + currentResistance * SIM.currentResistanceDrain);

      f.wasteT -= dt * (0.9 + size01 * 0.25);
      if (f.wasteT <= 0) {
        spawnDetritus(f.x - f.facing * Math.max(scaleWorld(2), f.r * 0.35), f.y + scaleWorld(1), 0.35 + size01 * 0.45, f.lineageTint);
        f.wasteT = randSim(SIM.wasteEveryMin, SIM.wasteEveryMax);
      }

      if (bestFood && bestFoodScore > 0.55) rememberPatch(f, bestFood.x, bestFood.y, 0.9 + bestFoodScore * 0.4);
      else if (planktonPick.patch && planktonPick.score > 0.35) rememberPatch(f, planktonPick.patch.x, planktonPick.patch.y, 0.8 + planktonPick.patch.nut * 0.12);

      if (f.energy <= 0) {
        f.alive = false;
        g.stats.deaths++;
        retainPinnedOutcome(
          f,
          'Starved',
          `${f.watchName || f.archetypeLabel} starved at T+${formatEventTime(g.time)} after ${Math.round(f.age)} seconds in the tank.`,
        );
        pushEvent('death', `${f.archetypeLabel} starved`, `Lineage ${f.lineage} lost a ${f.stage} at ${Math.round(f.age)}s of age.`, {
          fishId: f.id,
          lineage: f.lineage,
        });
        for (let i = 0; i < Math.max(3, Math.round(f.r)); i++) {
          spawnDetritus(f.x + randSim(-f.r, f.r), f.y + randSim(-f.r, f.r), 0.55 + f.r * 0.08, f.lineageTint);
        }
        burst(f.x, f.y, COL.red, 12, 54, 0.46);
        shake(1.0);
        continue;
      }

      if (f.stage === 'adult' && f.energy >= reproductionEnergy && f.reproCd <= 0 && f.age > 10 && g.fish.length + newborns.length < SIM.maxFish) {
        newborns.push(createOffspring(f));
      }
    }

    if (newborns.length) {
      g.fish.push(...newborns);
    }
  }

  function resolveInteractions() {
    const maxEnergy = currentMaxEnergy();
    const reproductionEnergy = currentReproductionEnergy();
    for (const f of g.fish) {
      if (!f.alive) continue;
      for (let i = g.food.length - 1; i >= 0; i--) {
        const food = g.food[i];
        if (!circleHit(f, food, 0)) continue;
        g.food.splice(i, 1);
        const size01 = clamp((f.r - scaleWorld(4)) / scaleWorld(6.5), 0, 1);
        const foodGain = SIM.foodEnergy * lerp(1.20, 0.82, size01) * lerp(1.12, 0.84, f.traits.carnivore);
        f.energy = Math.min(maxEnergy, f.energy + foodGain);
        f.meals = (f.meals || 0) + 1;
        f.satiation = clamp(f.satiation + lerp(0.35, 0.12, f.traits.carnivore), 0, 1.8);
        f.flash = Math.max(f.flash, 0.20);
        rememberPatch(f, food.x, food.y, 1.05 + planktonRichnessAt(food.x, food.y, scaleWorld(12)) * 0.08);
        for (const patch of g.plankton) {
          const d = hypot(food.x - patch.x, food.y - patch.y);
          if (d > patch.r + scaleWorld(4)) continue;
          patch.nut = Math.max(0, patch.nut - 0.18);
          patch.ttl = Math.max(4, patch.ttl - 0.4);
          break;
        }
        g.stats.foodTaken++;
        burst(food.x, food.y, COL.foam, 8, 44, 0.28);
      }
    }

    for (let i = 0; i < g.fish.length; i++) {
      const a = g.fish[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < g.fish.length; j++) {
        if (!a.alive) break;
        const b = g.fish[j];
        if (!b.alive) continue;

        if (!circleHit(a, b, 0)) continue;

        let eater = null;
        let prey = null;
        if (a.stage === 'adult' && a.huntCd <= 0 && a.satiation < 0.78 && a.r >= b.r * 1.18 && a.energy < reproductionEnergy * 1.18 && a.traits.carnivore >= 0.22) {
          eater = a;
          prey = b;
        } else if (b.stage === 'adult' && b.huntCd <= 0 && b.satiation < 0.78 && b.r >= a.r * 1.18 && b.energy < reproductionEnergy * 1.18 && b.traits.carnivore >= 0.22) {
          eater = b;
          prey = a;
        }

        if (eater && prey) {
          prey.alive = false;
          eater.energy = Math.min(maxEnergy, eater.energy + SIM.preyEnergy + prey.r * 2.4);
          eater.meals = (eater.meals || 0) + 1;
          eater.hunts = (eater.hunts || 0) + 1;
          eater.satiation = clamp(eater.satiation + 0.95, 0, 2.2);
          eater.huntCd = randSim(SIM.predatorCooldownMin, SIM.predatorCooldownMax);
          eater.flash = Math.max(eater.flash, 0.32);
          rememberPatch(eater, prey.x, prey.y, 1.5);
          retainPinnedOutcome(
            prey,
            'Consumed',
            `${prey.watchName || prey.archetypeLabel} was consumed by ${eater.watchName || eater.archetypeLabel} at T+${formatEventTime(g.time)}.`,
          );
          for (let n = 0; n < Math.max(2, Math.round(prey.r * 0.5)); n++) {
            spawnDetritus(prey.x + randSim(-prey.r, prey.r), prey.y + randSim(-prey.r, prey.r), 0.24 + prey.r * 0.05, prey.lineageTint);
          }
          g.stats.deaths++;
          g.stats.predations++;
          pushEvent(
            'predation',
            `${eater.archetypeLabel} consumed ${prey.archetypeLabel.toLowerCase()}`,
            `Lineage ${eater.lineage} caught lineage ${prey.lineage} in open water.`,
            {
              fishId: eater.id,
              lineage: eater.lineage,
              targetFishId: prey.id,
              targetLineage: prey.lineage,
              relatedFishIds: [eater.id, prey.id],
              relatedLineages: [eater.lineage, prey.lineage],
            },
          );
          burst(prey.x, prey.y, prey.tint, 14, 70, 0.42);
          shake(1.6);
          if (prey === a) break;
          continue;
        }

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.max(0.001, hypot(dx, dy));
        const overlap = a.r + b.r - d;
        if (overlap <= 0) continue;
        const nx = dx / d;
        const ny = dy / d;
        const push = overlap * 0.52;
        a.x -= nx * push * 0.5;
        a.y -= ny * push * 0.5;
        b.x += nx * push * 0.5;
        b.y += ny * push * 0.5;
        a.vx -= nx * 8;
        a.vy -= ny * 8;
        b.vx += nx * 8;
        b.vy += ny * 8;
      }
    }

    g.fish = g.fish.filter((f) => f.alive);

    let totalEnergy = 0;
    for (const f of g.fish) totalEnergy += f.energy;
    g.avgEnergy = g.fish.length ? totalEnergy / g.fish.length : 0;
  }

  function updateParticles(dt) {
    for (const q of g.particles) {
      q.life -= dt;
      q.vy += 24 * dt * (q.col === COL.foam ? -1 : 1);
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= 1 - dt * 1.6;
      q.vy *= 1 - dt * 1.4;
    }
    g.particles = g.particles.filter((q) => q.life > 0);
  }

  function updateSimulation(dt) {
    g.time += dt;

    g.shake = approach(g.shake, 0, dt * 26);
    if (g.shake > 0.01) {
      g.shakeX = rand(-g.shake, g.shake);
      g.shakeY = rand(-g.shake, g.shake);
    } else {
      g.shakeX = 0;
      g.shakeY = 0;
    }

    updateEnvironment(dt);
    refreshFormationCache();
    updateDeco(dt);
    updateDetritus(dt);
    updatePlankton(dt);
    updateFood(dt);
    updateFish(dt);
    resolveInteractions();
    updateParticles(dt);
    sampleHistory(dt);
    sampleReplay(dt);

    if (g.fish.length <= SIM.immigrationThreshold) {
      g.sp.migrant -= dt;
      if (g.sp.migrant <= 0 && g.fish.length < SIM.maxFish) {
        spawnImmigrant();
        g.sp.migrant = randSim(SIM.immigrationEvery * 0.8, SIM.immigrationEvery * 1.2);
      }
    } else {
      g.sp.migrant = Math.min(SIM.immigrationEvery, g.sp.migrant + dt * 0.45);
    }

    if (!g.fish.length) {
      g.extinctionClock += dt;
      if (g.extinctionClock >= SIM.reseedDelay) {
        g.stats.reseeds++;
        spawnInitialPopulation(Math.max(6, SIM.initialFish - 2));
        pushEvent('reseed', 'Tank reseeded after collapse', 'A fresh population was introduced because no fish survived the last cycle.');
        burst(W / 2, H / 2, COL.foam, 18, 52, 0.52);
        g.extinctionClock = 0;
      }
    } else {
      g.extinctionClock = 0;
    }
  }

  bindUi();
  syncControlLabels();
  resetSimulation();

  // --- Render --------------------------------------------------------------

  function drawCaustics(c, t) {
    c.save();
    c.globalAlpha = 0.12;
    c.fillStyle = COL.foam;
    for (let i = 0; i < 7; i++) {
      const y0 = scaleWorld(26 + i * 18) + Math.sin(t * 0.7 + i * 1.3) * scaleWorld(4);
      for (let x = 0; x < W; x += scaleWorld(12)) {
        const yy = y0 + Math.sin(t * 1.4 + baseCoord(x) * 0.12 + i) * scaleWorld(2);
        c.fillRect(x, yy | 0, scaleWorld(10), 1);
      }
    }
    c.restore();
  }

  function drawFrame(c) {
    c.save();
    c.globalAlpha = 1;
    c.strokeStyle = COL.ui2;
    c.lineWidth = 1;
    c.strokeRect(0.5, 0.5, W - 1, H - 1);
    c.strokeStyle = 'rgba(255,255,255,0.07)';
    c.strokeRect(1.5, 1.5, W - 3, H - 3);
    c.restore();
  }

  function drawHud(c) {
    const counts = populationBreakdown();
    c.save();
    c.globalAlpha = 1;
    c.fillStyle = COL.ui0;
    c.fillRect(0, 0, W, WORLD.hudH);
    c.fillStyle = COL.ui1;
    c.fillRect(0, WORLD.hudH, W, 1);
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.fillRect(0, 0, W, 1);

    const fishCol = g.fish.length <= SIM.immigrationThreshold ? COL.orange : COL.white;
    drawText(c, `FISH ${g.fish.length} FOOD ${g.food.length} AVG E ${Math.round(g.avgEnergy)}`, 6, 2, fishCol, 1);
    drawText(c, `JUV ${counts.juvenile} ADULT ${counts.adult} HERB ${counts.herbivore} CARN ${counts.carnivore}`, 6, 10, COL.gray, 1);
    c.restore();
  }

  function drawHintPanel(c, lines, alpha = 1) {
    if (!lines.length) return;
    const lineH = 9;
    const padX = 6;
    const padY = 5;
    const maxWidth = Math.min(248, W - 16);
    const innerWidth = maxWidth - padX * 2;
    const wrapped = [];
    for (const line of lines) wrapped.push(...wrapBitmapText(line, innerWidth, 1));
    const contentWidth = wrapped.reduce((max, line) => Math.max(max, bitmapTextWidth(line, 1)), 0);
    const width = Math.min(maxWidth, Math.max(92, contentWidth + padX * 2));
    const height = padY * 2 + wrapped.length * lineH;
    const x = 8;
    const y = H - height - 8;
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = 'rgba(0,0,0,0.50)';
    c.fillRect(x, y, width, height);
    c.strokeStyle = 'rgba(255,255,255,0.10)';
    c.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    for (let i = 0; i < wrapped.length; i++) {
      drawText(c, wrapped[i], x + padX, y + padY + i * lineH, COL.foam, 1);
    }
    c.restore();
  }

  function renderReplayOverlay(c) {
    const active = activeReplaySnapshot();
    const lines = ['REPLAY SNAPSHOT'];
    if (active) lines.push(`${active.label || 'Snapshot'} T+${formatEventTime(active.takenAt)}`);
    lines.push('SCRUB OR RETURN LIVE');

    const lineH = 9;
    const padX = 6;
    const padY = 5;
    const maxWidth = scaleWorld(148);
    const innerWidth = maxWidth - padX * 2;
    const wrapped = [];
    for (const line of lines) wrapped.push(...wrapBitmapText(line, innerWidth, 1));
    const contentWidth = wrapped.reduce((max, line) => Math.max(max, bitmapTextWidth(line, 1)), 0);
    const width = Math.min(maxWidth, Math.max(scaleWorld(70), contentWidth + padX * 2));
    const height = padY * 2 + wrapped.length * lineH;
    const x = W - width - 8;
    const y = WORLD.hudH + 8;

    c.save();
    c.globalAlpha = 0.92;
    c.fillStyle = 'rgba(0,0,0,0.42)';
    c.fillRect(x, y, width, height);
    c.strokeStyle = 'rgba(168,230,255,0.14)';
    c.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    for (let i = 0; i < wrapped.length; i++) {
      drawText(c, wrapped[i], x + padX, y + padY + i * lineH, i === 0 ? COL.foam : COL.gray, 1);
    }
    c.restore();
  }

  function renderPauseOverlay(c) {
    const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(pauseClock * 4.5));
    c.save();
    c.globalAlpha = 0.55;
    c.fillStyle = '#000';
    c.fillRect(0, WORLD.hudH, W, H - WORLD.hudH);
    c.restore();

    c.save();
    c.globalAlpha = 0.95;
    c.fillStyle = 'rgba(0,0,0,0.65)';
    c.fillRect(scaleWorld(28), scaleWorld(60), W - scaleWorld(56), scaleWorld(74));
    c.strokeStyle = 'rgba(255,255,255,0.12)';
    c.strokeRect(scaleWorld(28) + 0.5, scaleWorld(60) + 0.5, W - scaleWorld(57), scaleWorld(73));
    c.restore();

    drawText(c, 'PAUSED', W / 2, scaleWorld(70), COL.foam, 2, 'center');
    if (pauseReason === 'focus') drawText(c, 'FOCUS LOST', W / 2, scaleWorld(88), COL.gray, 1, 'center');
    else if (pauseReason === 'replay') drawText(c, 'REPLAY SNAPSHOT', W / 2, scaleWorld(88), COL.gray, 1, 'center');
    drawText(c, `SEED ${g.run.seed} ${seasonLabel(g.env.season)}`, W / 2, scaleWorld(98), COL.foam, 1, 'center');
    drawText(c, `${disturbanceLabel().toUpperCase()} • FISH ${g.fish.length} FOOD ${g.food.length} AVG E ${Math.round(g.avgEnergy)}`, W / 2, scaleWorld(108), COL.gray, 1, 'center');
    drawText(c, 'P / SPACE TO RESUME  R FOR NEXT SEED  B TO BOOKMARK', W / 2, scaleWorld(118), `rgba(168,230,255,${0.25 + 0.65 * pulse})`, 1, 'center');
    drawText(c, 'USE THE CONTROL DOCK FOR SCENARIOS, REWINDS, AND PRESSURE', W / 2, scaleWorld(128), COL.gray, 1, 'center');
  }

  function watchSubjectState() {
    const selected = findFishById(selectedFishId);
    if (selected) selectedFishPin = pinDataForFish(selected);
    const pinned = selectedFishPin;
    if (!selected && !pinned) return null;
    const replayActive = REPLAY.activeSnapshotId != null;
    const subject = selected || pinned;
    const status = selected
      ? liveWatchStatus(selected).toUpperCase()
      : replayActive
        ? 'OFF SNAPSHOT'
        : String(subject.watchStatus || 'ABSENT').toUpperCase();
    const detail = selected
      ? `E ${Math.round(selected.energy)} AGE ${Math.round(selected.age)}S`
      : subject.lineage != null
        ? `LINE ${subject.lineage} GEN ${subject.generation}`
        : `GEN ${subject.generation}`;
    const note = selected
      ? `LINE ${selected.lineage} ${selected.stage.toUpperCase()}`
      : replayActive
        ? 'RETURN LIVE TO TRACK'
        : 'FOLLOW THE LINEAGE';
    return {
      selected,
      pinned,
      subject,
      present: Boolean(selected),
      replayActive,
      name: subject.watchName || `${subject.archetypeLabel} #${subject.id}`,
      title: `${subject.archetypeLabel} #${subject.id}`,
      status,
      detail,
      note,
      tint: subject.lineageTint || COL.foam,
    };
  }

  function watchSlotPosition(slot, fish, boxW, boxH) {
    const offsetX = fish.r + scaleWorld(14);
    const offsetY = fish.r + scaleWorld(12);
    const rawX = slot.includes('r') ? fish.x + offsetX : fish.x - offsetX - boxW;
    const rawY = slot.startsWith('b') ? fish.y + offsetY : fish.y - offsetY - boxH;
    const x = clamp(rawX, 8, W - boxW - 8);
    const y = clamp(rawY, WORLD.hudH + 8, H - boxH - 8);
    const overflow = Math.abs(rawX - x) + Math.abs(rawY - y);
    return { x, y, overflow };
  }

  function preferredWatchSlot(fish) {
    const nearLeft = fish.x < scaleWorld(56);
    const nearRight = fish.x > W - scaleWorld(56);
    const nearTop = fish.y < WORLD.hudH + scaleWorld(36);
    const nearBottom = fish.y > H - scaleWorld(52);
    const horiz = nearLeft ? 'r' : nearRight ? 'l' : fish.facing >= 0 ? 'l' : 'r';
    const vert = nearTop ? 'b' : nearBottom ? 't' : 't';
    return `${vert}${horiz}`;
  }

  function drawWatchOverlay(c) {
    const state = watchSubjectState();
    if (!state || !WATCH_VIEW.cardVisible) return;

    const lineH = 9;
    const pad = 6;
    const lines = [state.name, state.title, state.status, state.detail, state.note];
    const textWidth = lines.reduce((max, line) => Math.max(max, bitmapTextWidth(line, 1)), 0);
    const textBoxW = Math.max(scaleWorld(76), textWidth + 4);
    const boxW = pad * 2 + textBoxW;
    const boxH = pad * 2 + lines.length * lineH;

    let x = W - boxW - 8;
    let y = WORLD.hudH + 8;
    let anchorX = x + boxW * 0.5;
    let anchorY = y + boxH * 0.5;
    let slot = WATCH_VIEW.slot;

    if (state.present) {
      const preferred = preferredWatchSlot(state.selected);
      const current = watchSlotPosition(WATCH_VIEW.slot, state.selected, boxW, boxH);
      const desired = watchSlotPosition(preferred, state.selected, boxW, boxH);
      if (WATCH_VIEW.lastSubjectId !== state.selected.id) {
        WATCH_VIEW.slot = preferred;
        WATCH_VIEW.slotHold = 0.8;
      } else if (current.overflow > scaleWorld(4.5) || (preferred !== WATCH_VIEW.slot && WATCH_VIEW.slotHold <= 0 && desired.overflow <= current.overflow + 1)) {
        WATCH_VIEW.slot = preferred;
        WATCH_VIEW.slotHold = 0.8;
      }
      slot = WATCH_VIEW.slot;
      const pos = watchSlotPosition(slot, state.selected, boxW, boxH);
      x = pos.x;
      y = pos.y;
      anchorX = clamp(state.selected.x, x + 10, x + boxW - 10);
      anchorY = clamp(state.selected.y, y + 10, y + boxH - 10);
      WATCH_VIEW.lastSubjectId = state.selected.id;
    } else {
      const topOffset = REPLAY.activeSnapshotId != null ? scaleWorld(36) : 0;
      x = W - boxW - 8;
      y = WORLD.hudH + 8 + topOffset;
      anchorX = x + boxW - 14;
      anchorY = y + boxH * 0.5;
      WATCH_VIEW.lastSubjectId = state.subject.id;
    }

    const textX = x + pad;
    const textY = y + pad;

    if (state.present) {
      c.save();
      c.globalAlpha = 0.5;
      c.strokeStyle = state.tint;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(state.selected.x, state.selected.y);
      c.lineTo(anchorX, anchorY);
      c.stroke();
      c.restore();
    }

    c.save();
    c.fillStyle = 'rgba(6,12,24,0.86)';
    c.fillRect(x, y, boxW, boxH);
    c.strokeStyle = 'rgba(168,230,255,0.14)';
    c.strokeRect(x + 0.5, y + 0.5, boxW - 1, boxH - 1);
    c.fillStyle = state.tint;
    c.fillRect(x + 1, y + 1, 3, boxH - 2);
    c.fillStyle = 'rgba(255,255,255,0.05)';
    c.fillRect(x + 5, y + 5, boxW - 10, 1);

    for (let i = 0; i < lines.length; i++) {
      const color = i === 0 ? COL.white : i === 2 ? state.tint : COL.gray;
      drawText(c, lines[i], textX, textY + i * lineH, color, 1);
    }
    c.restore();
  }

  function renderFoodMap(c) {
    if (!VIEW.foodMap) return;
    c.save();
    for (let y = WORLD.waterTop; y < WORLD.waterBottom; y += scaleWorld(8)) {
      for (let x = WORLD.sidePad; x < W - WORLD.sidePad; x += scaleWorld(8)) {
        let richness = planktonRichnessAt(x, y, scaleWorld(12)) * 0.22;
        for (const bloom of g.env.blooms) {
          const d = hypot(x - bloom.x, y - bloom.y);
          const reach = bloom.radius * 1.08;
          if (d > reach) continue;
          richness += (1 - d / reach) * (0.16 + g.env.season * 0.22);
        }
        if (richness <= 0.08) continue;
        const alpha = clamp(richness * 0.18, 0.05, 0.24);
        c.globalAlpha = alpha;
        c.fillStyle = richness > 0.62 ? COL.fish2 : richness > 0.32 ? COL.foam : COL.water3;
        c.fillRect(x - scaleWorld(4), y - scaleWorld(4), scaleWorld(8), scaleWorld(8));
      }
    }
    c.restore();
  }

  function renderCurrentOverlay(c) {
    if (!VIEW.current) return;
    c.save();
    c.lineWidth = 1;
    for (let y = WORLD.foodTop; y < WORLD.waterBottom; y += scaleWorld(20)) {
      for (let x = scaleWorld(16); x < W - WORLD.sidePad; x += scaleWorld(22)) {
        const field = currentAt(x, y);
        const mag = hypot(field.x, field.y);
        if (mag < 0.25) continue;
        const alpha = clamp(0.10 + mag / (SIM.currentStrength * 1.55), 0.12, 0.34);
        const dx = (field.x / SIM.currentStrength) * scaleWorld(7.5);
        const dy = (field.y / SIM.currentStrength) * scaleWorld(7.5);
        const endX = x + dx;
        const endY = y + dy;
        c.globalAlpha = alpha;
        c.strokeStyle = field.shelter > 0.12 ? COL.fish2 : COL.foam;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(endX, endY);
        c.stroke();
        const n = norm2(dx, dy);
        c.beginPath();
        c.moveTo(endX, endY);
        c.lineTo(endX - n.x * scaleWorld(2.5) - n.y * scaleWorld(1.7), endY - n.y * scaleWorld(2.5) + n.x * scaleWorld(1.7));
        c.moveTo(endX, endY);
        c.lineTo(endX - n.x * scaleWorld(2.5) + n.y * scaleWorld(1.7), endY - n.y * scaleWorld(2.5) - n.x * scaleWorld(1.7));
        c.stroke();
      }
    }
    c.globalAlpha = 0.12;
    c.strokeStyle = COL.fish2;
    for (const pocket of SHELTER_POCKETS) {
      c.beginPath();
      c.arc(pocket.x, pocket.y, pocket.r * 0.55, 0, Math.PI * 2);
      c.stroke();
    }
    c.strokeStyle = COL.foam;
    for (const formation of FORMATIONS) {
      c.globalAlpha = 0.18;
      c.beginPath();
      c.ellipse(formation.x, formation.y, formation.rx, formation.ry, 0, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 0.14 + formation.school * 0.08;
      c.strokeStyle = COL.fish2;
      c.beginPath();
      c.ellipse(formation.wakeX, formation.wakeY, formation.wakeWidth, formation.wakeR, 0, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = COL.foam;
    }
    c.restore();
  }

  function renderDetritus(c) {
    c.save();
    for (const d of g.detritus) {
      c.globalAlpha = clamp(d.life / SIM.detritusDecayMax, 0.18, 0.65);
      c.fillStyle = d.tint;
      c.fillRect((d.x | 0) - 1, d.y | 0, 2, 1);
    }
    c.restore();
  }

  function renderPlankton(c) {
    c.save();
    for (const patch of g.plankton) {
      const alpha = VIEW.foodMap ? 0.10 : clamp(0.05 + patch.nut * 0.012, 0.05, 0.16);
      c.globalAlpha = alpha;
      c.fillStyle = patch.nut > 1.6 ? COL.fish2 : COL.foam;
      for (let i = 0; i < 6; i++) {
        const angle = patch.phase + i * 1.05;
        const rr = patch.r * (0.25 + (i % 3) * 0.18);
        c.fillRect((patch.x + Math.cos(angle) * rr) | 0, (patch.y + Math.sin(angle * 1.15) * rr * 0.55) | 0, 2, 1);
      }
    }
    c.restore();
  }

  function fishRenderAlpha(f, baseAlpha = 1) {
    if (highlightedLineage == null) return baseAlpha;
    if (f.lineage === highlightedLineage || f.id === selectedFishId) return baseAlpha;
    return baseAlpha * 0.18;
  }

  function renderTrails(c) {
    if (!VIEW.trails) return;
    c.save();
    c.lineWidth = 1;
    for (const f of g.fish) {
      if (f.trail.length < 2) continue;
      for (let i = 1; i < f.trail.length; i++) {
        const a = f.trail[i - 1];
        const b = f.trail[i];
        c.globalAlpha = fishRenderAlpha(f, (i / f.trail.length) * (f.stage === 'juvenile' ? 0.46 : 0.34));
        c.strokeStyle = f.lineageTint;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
      }
    }
    c.restore();
  }

  function drawWakeShadow(c, formation, alpha = 0.12) {
    c.save();
    c.fillStyle = 'rgba(8,15,30,0.60)';
    for (let i = 0; i < 4; i++) {
      const t = i / 3;
      const x = formation.x + formation.flowX * formation.wakeLength * (0.28 + t * 0.48);
      const y = formation.y + formation.flowY * formation.wakeLength * (0.08 + t * 0.10);
      const w = formation.wakeWidth * (1.12 - t * 0.16);
      const h = Math.max(scaleWorld(3), formation.ry * (0.44 - t * 0.06));
      c.globalAlpha = alpha * (1 - t * 0.16);
      c.fillRect((x - w * 0.5) | 0, (y - h * 0.5) | 0, w | 0, h | 0);
    }
    c.restore();
  }

  function drawFormationAsset(c, formation, occluder = false) {
    const key = formation.art || formation.kind;
    const img = FORMATION_ART[key];
    if (!img || !img.complete || !img.naturalWidth) return false;
    const bounds = FORMATION_ART_BOUNDS[key] || { left: 0, right: 1, top: 0, bottom: 1 };

    let targetWidth = formation.rx * 2.0;
    let targetHeight = formation.ry * 2.0;
    let alpha = formation.alpha * (occluder ? 0.74 : 0.98);

    if (key === 'screen') {
      targetWidth = formation.rx * 2.24;
      targetHeight = formation.ry * 2.06;
      alpha = formation.alpha * (occluder ? 0.58 : 0.96);
    } else if (key === 'snag') {
      targetWidth = formation.rx * 2.1;
      targetHeight = formation.ry * 2.16;
      alpha = formation.alpha * (occluder ? 0.70 : 0.96);
    } else if (key === 'spine' || key === 'shelf' || key === 'ridge') {
      targetWidth = formation.rx * 2.32;
      targetHeight = formation.ry * 2.08;
      alpha = formation.alpha * (occluder ? 0.72 : 0.98);
    } else if (key === 'arch' || key === 'reef' || key === 'cave') {
      targetWidth = formation.rx * 2.14;
      targetHeight = formation.ry * 2.08;
    } else if (key === 'castle') {
      targetWidth = formation.rx * 2.12;
      targetHeight = formation.ry * 2.10;
      alpha = formation.alpha * (occluder ? 0.70 : 0.98);
    }

    const contentWidth = Math.max(0.25, bounds.right - bounds.left);
    const contentHeight = Math.max(0.25, bounds.bottom - bounds.top);
    const width = targetWidth / contentWidth;
    const height = targetHeight / contentHeight;
    const centerX = formation.x + ((bounds.left + bounds.right) * 0.5 - 0.5) * width;
    const centerY = formation.baseY - (bounds.bottom - 0.5) * height;

    c.save();
    c.globalAlpha = occluder ? 0.12 : 0.18;
    c.fillStyle = '#000';
    c.fillRect((formation.x - width * 0.44) | 0, (formation.baseY - scaleWorld(1)) | 0, (width * 0.88) | 0, Math.max(2, height * 0.10) | 0);
    c.restore();

    const drawn = drawImageAsset(c, img, centerX, centerY, width, height, false, alpha);
    if (drawn && !occluder && key !== 'screen') {
      drawSprite(c, SPR.plant, formation.x + formation.rx * 0.08, formation.baseY - scaleWorld(6), WORLD_SCALE * 0.84, false, null, formation.alpha * 0.24);
    }
    return drawn;
  }

  function drawFormation(c, formation, occluder = false) {
    const sway = Math.sin(g.time * 0.72 + formation.x * 0.01) * scaleWorld(3);
    const alpha = formation.alpha * (occluder ? 0.88 : 1);

    if (!occluder) drawWakeShadow(c, formation, formation.kind === 'screen' ? 0.08 : 0.12 + formation.alpha * 0.06);
    if (drawFormationAsset(c, formation, occluder)) return;

    if (formation.kind === 'screen') {
      const stems = occluder ? 3 : 5;
      for (let i = 0; i < stems; i++) {
        const t = stems <= 1 ? 0.5 : i / (stems - 1);
        const x = formation.x - formation.rx * 0.56 + formation.rx * 1.12 * t + sway * (0.35 + t * 0.3);
        const y = formation.baseY - scaleWorld(10) + Math.sin(g.time * 1.08 + i) * scaleWorld(2);
        const scale = WORLD_SCALE * (0.98 + t * 0.30 + (occluder ? 0.08 : 0));
        drawSprite(c, SPR.reed, x, y, scale, i % 2 === 1, null, alpha * (occluder ? 0.46 : 0.34));
      }
      if (!occluder) {
        drawSprite(c, SPR.plant, formation.x - formation.rx * 0.18, formation.baseY - scaleWorld(4), WORLD_SCALE * 1.1, false, null, alpha * 0.40);
        drawSprite(c, SPR.plant, formation.x + formation.rx * 0.24, formation.baseY - scaleWorld(3), WORLD_SCALE * 0.96, true, null, alpha * 0.36);
      }
      return;
    }

    if (formation.kind === 'snag') {
      drawSprite(c, SPR.snag, formation.x + sway * 0.18, formation.baseY - formation.ry * 0.54, WORLD_SCALE * 1.36, false, null, alpha * (occluder ? 0.48 : 0.56));
      if (!occluder) {
        drawSprite(c, SPR.rock, formation.x - formation.rx * 0.22, formation.baseY + scaleWorld(2), WORLD_SCALE * 1.14, false, null, alpha * 0.40);
        drawSprite(c, SPR.rock, formation.x + formation.rx * 0.18, formation.baseY + scaleWorld(3), WORLD_SCALE * 0.96, true, null, alpha * 0.34);
      }
      return;
    }

    if (formation.kind === 'castle') {
      const left = (formation.x - formation.rx * 0.78) | 0;
      const top = (formation.baseY - formation.ry * 1.02) | 0;
      const bodyW = Math.max(18, (formation.rx * 1.56) | 0);
      const bodyH = Math.max(12, (formation.ry * 0.92) | 0);
      const towerW = Math.max(6, (formation.rx * 0.42) | 0);
      const towerH = Math.max(10, (formation.ry * 1.14) | 0);
      c.save();
      c.globalAlpha = alpha * (occluder ? 0.34 : 0.62);
      c.fillStyle = '#6b4535';
      c.fillRect(left + towerW, top + Math.max(2, towerH - bodyH), bodyW, bodyH);
      c.fillRect(left, top, towerW, towerH);
      c.fillRect(left + towerW + bodyW - 1, top + scaleWorld(2), towerW, towerH - scaleWorld(2));
      c.fillStyle = '#936349';
      c.fillRect(left + towerW + scaleWorld(2), top + Math.max(3, towerH - bodyH) + scaleWorld(2), Math.max(10, bodyW - scaleWorld(4)), Math.max(6, bodyH - scaleWorld(4)));
      c.fillRect(left + scaleWorld(1), top + scaleWorld(2), Math.max(4, towerW - scaleWorld(2)), Math.max(7, towerH - scaleWorld(5)));
      c.fillRect(left + towerW + bodyW + scaleWorld(1), top + scaleWorld(4), Math.max(4, towerW - scaleWorld(2)), Math.max(7, towerH - scaleWorld(7)));
      c.fillStyle = '#2b1c18';
      c.fillRect(left + towerW + ((bodyW - Math.max(6, bodyW * 0.22)) * 0.5) | 0, top + towerH - Math.max(7, bodyH * 0.42), Math.max(6, bodyW * 0.22) | 0, Math.max(7, bodyH * 0.42) | 0);
      c.fillRect(left + towerW + scaleWorld(6), top + towerH - Math.max(11, bodyH * 0.58), Math.max(4, towerW * 0.46) | 0, Math.max(5, towerW * 0.46) | 0);
      c.fillRect(left + towerW + bodyW - scaleWorld(10), top + towerH - Math.max(11, bodyH * 0.58), Math.max(4, towerW * 0.46) | 0, Math.max(5, towerW * 0.46) | 0);
      c.fillStyle = '#b99263';
      c.fillRect(left + towerW, top + Math.max(1, towerH - bodyH), bodyW, scaleWorld(2));
      c.restore();
      drawSprite(c, SPR.rock, formation.x - formation.rx * 0.30, formation.baseY + scaleWorld(2), WORLD_SCALE * 0.94, false, null, alpha * 0.30);
      drawSprite(c, SPR.rock, formation.x + formation.rx * 0.26, formation.baseY + scaleWorld(3), WORLD_SCALE * 0.82, true, null, alpha * 0.26);
      return;
    }

    if (formation.kind === 'cave') {
      const left = (formation.x - formation.rx * 0.86) | 0;
      const top = (formation.baseY - formation.ry * 0.96) | 0;
      const width = Math.max(22, (formation.rx * 1.72) | 0);
      const height = Math.max(12, (formation.ry * 0.94) | 0);
      const mouthW = Math.max(10, (width * 0.34) | 0);
      const mouthH = Math.max(8, (height * 0.52) | 0);
      c.save();
      c.globalAlpha = alpha * (occluder ? 0.34 : 0.58);
      c.fillStyle = '#31414f';
      c.fillRect(left, top + scaleWorld(4), width, height - scaleWorld(4));
      c.fillRect(left + scaleWorld(4), top, width - scaleWorld(8), Math.max(6, height * 0.44) | 0);
      c.fillStyle = '#52606d';
      c.fillRect(left + scaleWorld(3), top + scaleWorld(3), width - scaleWorld(6), Math.max(5, height * 0.34) | 0);
      c.fillRect(left + scaleWorld(8), top + scaleWorld(6), Math.max(8, width - scaleWorld(16)), Math.max(4, height * 0.22) | 0);
      c.fillStyle = '#11161e';
      c.fillRect((formation.x - mouthW * 0.5) | 0, (formation.baseY - mouthH) | 0, mouthW, mouthH);
      c.fillRect((formation.x - mouthW * 0.20) | 0, (formation.baseY - mouthH - scaleWorld(4)) | 0, Math.max(5, mouthW * 0.40) | 0, Math.max(4, mouthH * 0.28) | 0);
      c.restore();
      drawSprite(c, SPR.plant, formation.x + formation.rx * 0.18, formation.baseY - scaleWorld(4), WORLD_SCALE * 0.82, false, null, alpha * 0.24);
      return;
    }

    if (formation.kind === 'ridge') {
      const segments = 5;
      for (let i = 0; i < segments; i++) {
        const t = segments <= 1 ? 0.5 : i / (segments - 1);
        const x = formation.x - formation.rx * 0.74 + formation.rx * 1.48 * t;
        const y = formation.baseY - formation.ry * (0.40 + (i % 2) * 0.08) + Math.sin(i * 0.85 + g.time * 0.2) * scaleWorld(1.6);
        drawSprite(c, i === 2 ? SPR.shelf : SPR.rock, x, y, WORLD_SCALE * (i === 2 ? 1.1 : 0.96 + (i % 3) * 0.12), i % 2 === 1, null, alpha * (occluder ? 0.30 : 0.48));
      }
      return;
    }

    const rockScale = WORLD_SCALE * (1.02 + formation.rx / scaleWorld(70));
    drawSprite(c, SPR.rock, formation.x - formation.rx * 0.24, formation.baseY - formation.ry * 0.34, rockScale * 1.04, false, null, alpha * 0.50);
    drawSprite(c, SPR.rock, formation.x + formation.rx * 0.18, formation.baseY - formation.ry * 0.28, rockScale * 0.94, true, null, alpha * 0.44);
    if (!occluder) {
      drawSprite(c, SPR.plant, formation.x + formation.rx * 0.04, formation.baseY - scaleWorld(6), WORLD_SCALE * 0.94, false, null, alpha * 0.34);
    }
  }

  function renderFormationLayer(c, layer, occluder = false) {
    for (const formation of FORMATIONS) {
      if (formation.layer !== layer) continue;
      drawFormation(c, formation, occluder);
    }
  }

  function renderBackdropHabitat(c) {
    c.save();
    c.globalAlpha = 0.12;
    c.fillStyle = 'rgba(168,230,255,0.12)';
    c.fillRect(0, WORLD.hudH, W, scaleWorld(48));
    c.globalAlpha = 0.08;
    c.fillStyle = 'rgba(109,220,143,0.10)';
    c.fillRect(0, scaleWorld(98), W, scaleWorld(82));
    c.globalAlpha = 0.10;
    c.fillStyle = 'rgba(8,15,30,0.44)';
    c.fillRect(0, scaleWorld(210), W, H - scaleWorld(210));
    c.restore();

    c.save();
    c.fillStyle = COL.foam;
    for (let i = 0; i < LIGHT_COLUMNS.length; i++) {
      const x = LIGHT_COLUMNS[i] + Math.sin(g.time * 0.22 + i * 0.8) * scaleWorld(7);
      c.globalAlpha = 0.045 + (i % 3) * 0.02;
      c.fillRect((x - scaleWorld(2)) | 0, WORLD.hudH, scaleWorld(4), scaleWorld(142));
      c.globalAlpha = 0.028;
      c.fillRect((x + scaleWorld(5)) | 0, WORLD.hudH, scaleWorld(2), scaleWorld(112));
    }
    c.restore();

    renderFormationLayer(c, 'back');
    renderFormationLayer(c, 'mid');

    for (let i = 0; i < REED_BEDS.length; i++) {
      const bed = REED_BEDS[i];
      const sway = Math.sin(g.time * 0.72 + i * 0.8) * scaleWorld(5);
      drawSprite(c, SPR.reed, bed.x + sway, bed.y, bed.scale * WORLD_SCALE * 1.18, i % 2 === 1, null, bed.alpha);
      drawSprite(c, SPR.reed, bed.x + sway + scaleWorld(9), bed.y + scaleWorld(5), bed.scale * WORLD_SCALE * 0.92, i % 2 === 0, null, bed.alpha * 0.72);
    }

    c.save();
    c.fillStyle = COL.foam;
    for (let i = 0; i < 28; i++) {
      const travel = g.time * scaleWorld(5 + (i % 5)) + i * scaleWorld(19);
      const x = ((travel + i * scaleWorld(22)) % (W + scaleWorld(24))) - scaleWorld(12);
      const y = WORLD.waterTop + (((i * 29) % 132) * WORLD_SCALE) + Math.sin(g.time * 0.42 + i * 0.7) * scaleWorld(4);
      c.globalAlpha = 0.03 + (i % 4) * 0.012;
      c.fillRect(x | 0, y | 0, 1, 1);
    }
    c.restore();
  }

  function renderForegroundHabitat(c) {
    c.save();
    for (const cluster of ROCK_CLUSTERS) {
      c.globalAlpha = cluster.alpha * 0.6;
      c.fillStyle = COL.sand0;
      c.fillRect((cluster.x - scaleWorld(14)) | 0, (cluster.y + scaleWorld(4)) | 0, scaleWorld(28), scaleWorld(6));
      drawSprite(c, SPR.rock, cluster.x, cluster.y, cluster.scale * WORLD_SCALE * 1.28, false, null, cluster.alpha);
    }
    c.restore();

    renderFormationLayer(c, 'front');
  }

  function renderCommon() {
    ctx.save();
    ctx.translate(g.shakeX | 0, g.shakeY | 0);
    ctx.drawImage(bg, 0, 0);
    drawCaustics(ctx, g.time);
    renderBackdropHabitat(ctx);

    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = 'rgba(168,230,255,0.14)';
    ctx.fillRect(0, WORLD.hudH, W, scaleWorld(54));
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = 'rgba(109,220,143,0.11)';
    ctx.fillRect(0, scaleWorld(104), W, scaleWorld(74));
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = 'rgba(12,18,34,0.42)';
    ctx.fillRect(0, scaleWorld(214), W, H - scaleWorld(214));
    ctx.restore();

    ctx.save();
    ctx.fillStyle = COL.foam;
    for (let i = 0; i < 5; i++) {
      const x = scaleWorld(36 + i * 58) + Math.sin(g.time * 0.25 + i * 0.8) * scaleWorld(6);
      ctx.globalAlpha = 0.05 + (i % 2) * 0.02;
      ctx.fillRect((x - scaleWorld(1.5)) | 0, WORLD.hudH, scaleWorld(3), scaleWorld(122));
      ctx.globalAlpha = 0.025;
      ctx.fillRect((x + scaleWorld(4)) | 0, WORLD.hudH, scaleWorld(2), scaleWorld(96));
    }
    ctx.restore();

    // Subtle nutrient plumes make food-rich regions readable without changing the style.
    ctx.fillStyle = COL.foam;
    for (const bloom of g.env.blooms) {
      ctx.save();
      ctx.globalAlpha = 0.04 + g.env.season * 0.07;
      for (let i = 0; i < 8; i++) {
        const angle = bloom.phase * (1.1 + i * 0.03) + i * 0.82;
        const radius = bloom.radius * (0.28 + (i % 4) * 0.18);
        const x = bloom.x + Math.cos(angle) * radius;
        const y = bloom.y + Math.sin(angle * 1.2) * radius * 0.6;
        ctx.fillRect(x | 0, y | 0, 2, 1);
      }
      ctx.restore();
    }

    if (g.env.murk > 0.02) {
      ctx.save();
      ctx.globalAlpha = g.env.murk * 0.18;
      ctx.fillStyle = COL.fish1;
      ctx.fillRect(0, WORLD.hudH, W, H - WORLD.hudH);
      ctx.restore();
    }

    if (g.env.oxygenDip > 0.02) {
      ctx.save();
      ctx.globalAlpha = g.env.oxygenDip * 0.16;
      ctx.fillStyle = COL.red;
      ctx.fillRect(0, scaleWorld(124), W, H - scaleWorld(124));
      ctx.restore();
    }

    if (g.env.foodCrash > 0.02) {
      ctx.save();
      ctx.globalAlpha = g.env.foodCrash * 0.14;
      ctx.fillStyle = COL.gray;
      ctx.fillRect(0, WORLD.hudH, W, H - WORLD.hudH);
      ctx.restore();
    }

    ctx.fillStyle = COL.gray;
    ctx.globalAlpha = 0.34;
    for (let i = 0; i < PLANT_REFUGES.length; i++) {
      const x = PLANT_REFUGES[i];
      const y = WORLD.plantBaseY + Math.sin(g.time * 0.7 + i) * scaleWorld(1.5);
      ctx.fillRect((x - scaleWorld(7)) | 0, (y - scaleWorld(4)) | 0, scaleWorld(14), scaleWorld(4));
      ctx.fillRect((x - scaleWorld(4)) | 0, (y - scaleWorld(7)) | 0, scaleWorld(8), scaleWorld(3));
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = COL.sand1;
    ctx.globalAlpha = 0.78;
    for (let i = 0; i < PLANT_REFUGES.length; i++) {
      const x = PLANT_REFUGES[i] + Math.sin(i * 1.7) * scaleWorld(2);
      const y = WORLD.plantBaseY + scaleWorld(2);
      ctx.fillRect((x - scaleWorld(10)) | 0, y | 0, scaleWorld(20), scaleWorld(5));
      ctx.fillRect((x - scaleWorld(6)) | 0, (y - scaleWorld(4)) | 0, scaleWorld(12), scaleWorld(4));
    }
    ctx.globalAlpha = 1;

    renderForegroundHabitat(ctx);

    // Plants
    for (let i = 0; i < PLANT_REFUGES.length; i++) {
      const x = PLANT_REFUGES[i] + Math.sin(g.time * 0.7 + i) * scaleWorld(4);
      const y = WORLD.plantBaseY + Math.sin(g.time * 1.1 + i * 0.9) * scaleWorld(2);
      const scale = (1.28 + (i % 3) * 0.22) * WORLD_SCALE;
      drawSprite(ctx, SPR.plant, x, y, scale, false, null, 0.95);
    }

    // Decorative bubbles
    for (const b of g.deco) {
      drawSprite(ctx, SPR.bubble, b.x, b.y, b.r, false, null, b.a);
    }

    ctx.restore();
  }

  function fishVisual(f) {
    if (f.stage === 'juvenile') {
      if (f.archetype === 'hunter') return { spr: SPR.juvenile, scale: f.r / scaleWorld(4.3), asset: 'juvenile_hunter', baseFacing: -1, bodyW: f.r * 1.62, bodyH: f.r * 0.74 };
      if (f.archetype === 'opportunist') return { spr: SPR.juvenile, scale: f.r / scaleWorld(4.3), asset: 'juvenile_opportunist', baseFacing: -1, bodyW: f.r * 1.54, bodyH: f.r * 0.88 };
      if (f.archetype === 'shoaler') return { spr: SPR.juvenile, scale: f.r / scaleWorld(4.3), asset: 'juvenile_shoaler', baseFacing: -1, bodyW: f.r * 1.72, bodyH: f.r * 0.72 };
      return { spr: SPR.juvenile, scale: f.r / scaleWorld(4.3), asset: 'juvenile_grazer', baseFacing: -1, bodyW: f.r * 1.58, bodyH: f.r * 0.84 };
    }
    if (f.archetype === 'grazer') return { spr: SPR.grazer, scale: f.r / scaleWorld(4.5), asset: 'grazer', baseFacing: 1, bodyW: f.r * 2.05, bodyH: f.r * 1.12 };
    if (f.archetype === 'shoaler') return { spr: SPR.shoaler, scale: f.r / scaleWorld(5.2), asset: 'shoaler', baseFacing: -1, bodyW: f.r * 2.18, bodyH: f.r * 0.92 };
    if (f.archetype === 'opportunist') return { spr: SPR.opportunist, scale: f.r / scaleWorld(6.4), asset: 'opportunist', baseFacing: -1, bodyW: f.r * 1.92, bodyH: f.r * 1.18 };
    return { spr: SPR.hunter, scale: f.r / scaleWorld(7.4), asset: 'hunter', baseFacing: -1, bodyW: f.r * 2.28, bodyH: f.r * 0.98 };
  }

  function renderSimulation() {
    renderCommon();
    renderFoodMap(ctx);
    renderCurrentOverlay(ctx);
    renderTrails(ctx);
    renderPlankton(ctx);
    renderDetritus(ctx);

    // Food
    for (const f of g.food) {
      drawSprite(ctx, SPR.food, f.x, f.y, 1.0, false, null, 0.95);
    }

    // Fish
    for (const f of g.fish) {
      const vis = fishVisual(f);
      const alpha = fishRenderAlpha(f, f.energy < 18 ? 0.76 : 0.97);
      if (f.r >= scaleWorld(6.2)) {
        ctx.save();
        ctx.globalAlpha = fishRenderAlpha(f, 0.03 + clamp((f.y - WORLD.waterTop) / (WORLD.waterBottom - WORLD.waterTop), 0, 1) * 0.03);
        ctx.fillStyle = '#000';
        const shadowY = (f.y + vis.bodyH * 0.42) | 0;
        const shadowW = Math.max(2, (vis.bodyW * 0.28) | 0);
        ctx.fillRect((f.x - shadowW / 2) | 0, shadowY, shadowW, 1);
        ctx.restore();
      }
      const fishAsset = vis.asset ? FISH_ART[vis.asset] : null;
      const bobY = Math.sin(g.time * 7.2 + f.wanderA * 1.4 + f.id * 0.13) * Math.min(scaleWorld(0.45), vis.bodyH * 0.05);
      const flipAsset = vis.baseFacing === 1 ? f.facing < 0 : f.facing > 0;
      if (fishAsset && FISH_ART_BOUNDS[vis.asset]) {
        drawBoundedImageAsset(ctx, fishAsset, FISH_ART_BOUNDS[vis.asset], f.x, f.y + bobY, vis.bodyW, vis.bodyH, flipAsset, alpha);
      } else {
        const swimFrame = spriteFrame(vis.spr, g.time * 8 + f.wanderA * 1.7 + (f.facing < 0 ? 1 : 0));
        drawSprite(ctx, swimFrame, f.x, f.y, vis.scale, f.facing < 0, f.tint, alpha);
      }
      ctx.save();
      ctx.globalAlpha = alpha * 0.92;
      ctx.fillStyle = f.lineageTint;
      const dorsalY = (f.y - Math.max(2, vis.bodyH * 0.34)) | 0;
      const dorsalX = (f.x - f.facing * Math.max(1, vis.bodyW * 0.06)) | 0;
      ctx.fillRect(dorsalX, dorsalY, 2, 1);
      ctx.fillRect((dorsalX + f.facing) | 0, dorsalY + 1, 1, 1);
      if (f.stage === 'juvenile') {
        ctx.fillStyle = COL.white;
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillRect((f.x - 1) | 0, (f.y + Math.max(2, vis.bodyH * 0.18)) | 0, 2, 1);
      }
      ctx.restore();
      if (f.flash > 0) {
        ctx.save();
        ctx.globalAlpha = f.flash * 0.18;
        ctx.strokeStyle = f.energy > 36 ? COL.foam : COL.orange;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (f.energy < 20) {
        ctx.save();
        ctx.globalAlpha = fishRenderAlpha(f, 0.55);
        ctx.fillStyle = COL.orange;
        ctx.fillRect((f.x - 3) | 0, (f.y - f.r - 6) | 0, 6, 1);
        ctx.restore();
      }
      if (highlightedLineage != null && f.lineage === highlightedLineage && f.id !== selectedFishId) {
        ctx.save();
        ctx.globalAlpha = 0.22 + Math.sin(g.time * 3.4 + f.id * 0.31) * 0.05;
        ctx.fillStyle = f.lineageTint;
        const markerW = Math.max(3, Math.round(vis.bodyW * 0.42));
        const markerX = (f.x - markerW / 2) | 0;
        const markerY = (f.y - vis.bodyH * 0.88) | 0;
        ctx.fillRect(markerX, markerY, markerW, 1);
        if (markerW >= 4) {
          ctx.fillRect(markerX + 1, markerY - 1, markerW - 2, 1);
        }
        const tailX = (f.x - f.facing * Math.max(2, vis.bodyW * 0.62)) | 0;
        const tailY = (f.y + vis.bodyH * 0.08) | 0;
        ctx.fillRect(tailX, tailY, 2, 1);
        ctx.fillRect((tailX + f.facing) | 0, tailY - 1, 1, 1);
        ctx.restore();
      }
      if (f.id === selectedFishId) {
        if (f.intentTarget) {
          ctx.save();
          ctx.globalAlpha = 0.42;
          ctx.strokeStyle = f.lineageTint;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(f.x, f.y);
          ctx.lineTo(f.intentTarget.x, f.intentTarget.y);
          ctx.stroke();
          ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha = 0.88;
        ctx.strokeStyle = COL.foam;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    renderFormationLayer(ctx, 'back', true);
    renderFormationLayer(ctx, 'mid', true);

    // Particles
    for (const q of g.particles) {
      const k = clamp(q.life / q.ttl, 0, 1);
      ctx.globalAlpha = k;
      ctx.fillStyle = q.col;
      ctx.fillRect((q.x | 0) - ((q.size / 2) | 0), (q.y | 0) - ((q.size / 2) | 0), q.size, q.size);
    }
    ctx.globalAlpha = 1;

    drawHud(ctx);

    const lines = [];
    const introAlpha = clamp(1 - Math.max(0, g.time - 3.5) / 1.5, 0, 1);
    if (introAlpha > 0.01) {
      lines.push('AUTONOMOUS ECOLOGY');
      lines.push('THE CONSOLE FRAMES THE EXPERIMENT');
      lines.push('TUNE FOOD, METABOLISM, FERTILITY, SEASONS');
      lines.push('P PAUSE  R NEXT SEED  TAP TO PAUSE');
      drawHintPanel(ctx, lines, introAlpha);
    } else if (g.env.disturbance.active) {
      lines.push(disturbanceLabel().toUpperCase());
      lines.push('WATCH ROUTES, SHELTERS, AND FEEDING LANES SHIFT');
      drawHintPanel(ctx, lines, 0.88);
    } else if (!g.fish.length) {
      lines.push('POPULATION COLLAPSED');
      lines.push(`TANK RESEEDS IN ${Math.ceil(Math.max(0, SIM.reseedDelay - g.extinctionClock))}`);
      drawHintPanel(ctx, lines, 0.95);
    } else if (g.fish.length <= SIM.immigrationThreshold) {
      lines.push('LOW POPULATION DRAWS IN MIGRANTS');
      if (g.stats.reseeds > 0) lines.push(`RESEEDS ${g.stats.reseeds}`);
      drawHintPanel(ctx, lines, 0.85);
    }

    if (paused && pauseReason === 'replay') renderReplayOverlay(ctx);
    else if (paused) renderPauseOverlay(ctx);
    postFx();
    drawWatchOverlay(ctx);
    drawFrame(ctx);
  }

  function postFx() {
    // Scanlines
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#000';
    for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
    ctx.restore();

    // Noise
    updateNoise();
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.075;
    ctx.drawImage(noise.c, 0, 0, W, H);
    ctx.restore();

    // Vignette
    ctx.save();
    const vg = ctx.createRadialGradient(W / 2, H / 2, 35, W / 2, H / 2, 175);
    vg.addColorStop(0, 'rgba(0,0,0,0.0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Glass highlight
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = COL.foam;
    ctx.fillRect(4, 22, 2, H - 30);
    ctx.fillRect(W - 6, 22, 2, H - 30);
    ctx.globalAlpha = 0.06;
    ctx.fillRect(8, 22, 1, H - 30);
    ctx.restore();
  }

  // --- Main loop -----------------------------------------------------------

  function frame(now) {
    const rawDt = (now - last) / 1000;
    last = now;
    const dt = clamp(rawDt, 0, 0.10);

    if (consumePressed('KeyR', 'Enter')) {
      SFX.play('ui');
      resetSimulation();
    }

    if (consumePressed('KeyT')) {
      if (cinematic) cinematic = false;
      controlsOpen = !controlsOpen;
      updateUiPanels(true);
      SFX.play('ui');
    }

    if (consumePressed('KeyC')) {
      cinematic = !cinematic;
      if (cinematic) controlsOpen = false;
      updateUiPanels(true);
      SFX.play('ui');
    }

    if (consumePressed('KeyL')) {
      if (toggleSelectedLineageHighlight()) {
        updateUiPanels(true);
        SFX.play('ui');
      }
    }

    if (consumePressed('KeyX', 'Backspace', 'Delete')) {
      if (selectedFishId != null || highlightedLineage != null) {
        clearSelection();
        highlightedLineage = null;
        updateUiPanels(true);
        SFX.play('ui');
      }
    }

    if (consumePressed('KeyB') && document.activeElement !== UI.seedInput) {
      addBookmark();
      SFX.play('ui');
    }

    if (consumePressed('KeyP', 'Space', 'Escape') || input.pointer.tapped) {
      togglePause();
    }

    if (!paused) {
      simAccumulator = Math.min(simAccumulator + dt, SIM.fixedDt * SIM.maxSubsteps);
      let steps = 0;
      while (simAccumulator >= SIM.fixedDt && steps < SIM.maxSubsteps) {
        updateSimulation(SIM.fixedDt);
        simAccumulator -= SIM.fixedDt;
        steps++;
      }
    }
    else pauseClock += dt;

    WATCH_VIEW.slotHold = Math.max(0, WATCH_VIEW.slotHold - dt);

    ctx.clearRect(0, 0, W, H);
    renderSimulation();
    uiClock += dt;
    updateUiPanels();

    resetPressed();
    requestAnimationFrame(frame);
  }

  window.__FISHTANK_DEBUG__ = {
    snapshot: () => auditSnapshot(),
    runAudit: (seconds) => runAudit(seconds),
    setSeed: (seed) => setSeed(seed),
    applyPreset: (id) => applyPreset(id),
    applyScenario: (id) => applyScenario(id),
    rewindReplay: (seconds) => rewindReplay(seconds),
    returnToLive: () => returnToLive(),
    restoreBookmark: (id) => restoreBookmark(id),
    bookmarkIds: () => REPLAY.bookmarks.map((entry) => entry.id),
    fishIds: () => g.fish.map((fish) => fish.id),
    selectFishById: (id) => {
      const fish = findFishById(id);
      if (!fish) return false;
      selectFish(fish);
      updateUiPanels(true);
      return true;
    },
    selection: () => ({
      selectedFishId,
      selectedFishPin: cloneData(selectedFishPin),
      highlightedLineage,
      watchCardVisible: WATCH_VIEW.cardVisible,
      selectedPresent: Boolean(findFishById(selectedFishId)),
    }),
    toggleWatchCard: (value) => toggleWatchCard(value),
    setView: (key, value) => {
      if (!(key in VIEW)) return { ...VIEW };
      VIEW[key] = value == null ? !VIEW[key] : Boolean(value);
      syncViewUi();
      return { ...VIEW };
    },
  };

  requestAnimationFrame(frame);
})();
