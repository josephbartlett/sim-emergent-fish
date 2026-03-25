(() => {
  'use strict';

  const DEFAULT_TEMPO = 500000;
  const VOLUME_KEY = 'fishtank.music.volume.v2';
  const ENABLED_KEY = 'fishtank.music.enabled.v4';
  const CACHE_DB = 'fishtank-audio-cache';
  const CACHE_STORE = 'renders';
  const RENDER_CACHE_VERSION = 'ambient-pack-v1-mono12';

  const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);

  function readUint32(view, offset) {
    return view.getUint32(offset, false);
  }

  function readUint16(view, offset) {
    return view.getUint16(offset, false);
  }

  function readString(view, offset, length) {
    let out = '';
    for (let i = 0; i < length; i++) out += String.fromCharCode(view.getUint8(offset + i));
    return out;
  }

  function writeString(view, offset, value) {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  }

  function readVarLen(view, state) {
    let value = 0;
    while (state.offset < state.end) {
      const byte = view.getUint8(state.offset++);
      value = (value << 7) | (byte & 0x7f);
      if ((byte & 0x80) === 0) break;
    }
    return value >>> 0;
  }

  function parseMidi(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    let offset = 0;

    if (readString(view, offset, 4) !== 'MThd') throw new Error('Invalid MIDI header.');
    offset += 4;
    const headerLength = readUint32(view, offset);
    offset += 4;
    const format = readUint16(view, offset);
    offset += 2;
    const trackCount = readUint16(view, offset);
    offset += 2;
    const division = readUint16(view, offset);
    offset += 2;
    offset += Math.max(0, headerLength - 6);

    if (division & 0x8000) throw new Error('SMPTE MIDI timing is not supported.');
    if (format > 1) throw new Error('Only MIDI format 0 and 1 are supported.');

    const ticksPerQuarter = division;
    const tempoEvents = [{ tick: 0, microsecondsPerQuarter: DEFAULT_TEMPO }];
    const rawNotes = [];
    let endTick = 0;

    for (let trackIndex = 0; trackIndex < trackCount; trackIndex++) {
      if (readString(view, offset, 4) !== 'MTrk') throw new Error(`Invalid MIDI track header at track ${trackIndex}.`);
      offset += 4;
      const length = readUint32(view, offset);
      offset += 4;

      const state = { offset, end: offset + length };
      let tick = 0;
      let runningStatus = 0;
      const channelPrograms = new Uint8Array(16);
      const openNotes = new Map();

      while (state.offset < state.end) {
        tick += readVarLen(view, state);
        let status = view.getUint8(state.offset++);
        if (status < 0x80) {
          state.offset--;
          status = runningStatus;
        } else {
          runningStatus = status;
        }

        if (status === 0xff) {
          const metaType = view.getUint8(state.offset++);
          const metaLength = readVarLen(view, state);
          if (metaType === 0x51 && metaLength === 3) {
            const tempo =
              (view.getUint8(state.offset) << 16) |
              (view.getUint8(state.offset + 1) << 8) |
              view.getUint8(state.offset + 2);
            tempoEvents.push({ tick, microsecondsPerQuarter: tempo >>> 0 });
          }
          state.offset += metaLength;
          runningStatus = 0;
          continue;
        }

        if (status === 0xf0 || status === 0xf7) {
          state.offset += readVarLen(view, state);
          runningStatus = 0;
          continue;
        }

        const command = status & 0xf0;
        const channel = status & 0x0f;

        if (command === 0x80 || command === 0x90) {
          const note = view.getUint8(state.offset++);
          const velocity = view.getUint8(state.offset++);
          const key = `${channel}:${note}`;
          if (command === 0x90 && velocity > 0) {
            const stack = openNotes.get(key) || [];
            stack.push({
              tick,
              velocity,
              program: channelPrograms[channel] || 0,
              channel,
              note,
              trackIndex,
            });
            openNotes.set(key, stack);
          } else {
            const stack = openNotes.get(key);
            if (stack && stack.length) {
              const start = stack.pop();
              rawNotes.push({
                channel,
                note,
                velocity: start.velocity,
                program: start.program,
                startTick: start.tick,
                endTick: Math.max(tick, start.tick + 1),
                trackIndex: start.trackIndex,
              });
              if (!stack.length) openNotes.delete(key);
            }
          }
        } else if (command === 0xc0 || command === 0xd0) {
          channelPrograms[channel] = view.getUint8(state.offset++);
        } else {
          state.offset += 2;
        }
      }

      endTick = Math.max(endTick, tick);
      for (const stack of openNotes.values()) {
        for (const start of stack) {
          rawNotes.push({
            channel: start.channel,
            note: start.note,
            velocity: start.velocity,
            program: start.program,
            startTick: start.tick,
            endTick: Math.max(tick, start.tick + 1),
            trackIndex: start.trackIndex,
          });
        }
      }

      offset += length;
    }

    const tempoMap = tempoEvents
      .sort((a, b) => a.tick - b.tick)
      .filter((event, index, list) => index === 0 || event.tick !== list[index - 1].tick || event.microsecondsPerQuarter !== list[index - 1].microsecondsPerQuarter);

    const segments = [];
    let lastTick = 0;
    let lastSeconds = 0;
    let currentTempo = DEFAULT_TEMPO;
    for (const event of tempoMap) {
      if (event.tick > lastTick) {
        segments.push({ tick: lastTick, seconds: lastSeconds, microsecondsPerQuarter: currentTempo });
        lastSeconds += ((event.tick - lastTick) * currentTempo) / ticksPerQuarter / 1000000;
        lastTick = event.tick;
      }
      currentTempo = event.microsecondsPerQuarter;
    }
    segments.push({ tick: lastTick, seconds: lastSeconds, microsecondsPerQuarter: currentTempo });

    function tickToSeconds(tick) {
      let segment = segments[0];
      for (let i = 1; i < segments.length; i++) {
        if (segments[i].tick > tick) break;
        segment = segments[i];
      }
      return segment.seconds + ((tick - segment.tick) * segment.microsecondsPerQuarter) / ticksPerQuarter / 1000000;
    }

    const notes = rawNotes
      .map((note) => {
        const start = tickToSeconds(note.startTick);
        const end = tickToSeconds(note.endTick);
        return {
          ...note,
          start,
          end: Math.max(start + 0.04, end),
          duration: Math.max(0.04, end - start),
        };
      })
      .sort((a, b) => a.start - b.start || a.note - b.note);

    const duration = Math.max(
      tickToSeconds(endTick),
      notes.reduce((max, note) => Math.max(max, note.end), 0),
    );

    const initialTempo = tempoMap[0]?.microsecondsPerQuarter || DEFAULT_TEMPO;
    return {
      notes,
      duration,
      tempoBpm: Math.max(1, Math.round(60000000 / initialTempo)),
    };
  }

  function noteFrequency(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  function instrumentProfile(note) {
    if (note.channel === 9) {
      return {
        kind: 'noise',
        gain: 0.022,
        attack: 0.001,
        decay: 0.05,
        sustain: 0.1,
        release: 0.1,
      };
    }
    const program = note.program || 0;
    if ((program >= 48 && program <= 55) || (program >= 88 && program <= 95)) {
      return {
        kind: 'pad',
        base: 'sine',
        gain: 0.044,
        attack: 0.05,
        decay: 0.26,
        sustain: 0.52,
        release: 1.25,
      };
    }
    if (program <= 7) {
      return {
        kind: 'piano',
        base: 'triangle',
        gain: 0.064,
        attack: 0.006,
        decay: 0.18,
        sustain: 0.2,
        release: 0.84,
      };
    }
    return {
      kind: 'soft',
      base: 'triangle',
      gain: 0.042,
      attack: 0.012,
      decay: 0.2,
      sustain: 0.24,
      release: 0.96,
    };
  }

  function createNoiseBuffer(context, duration) {
    const frames = Math.max(1, Math.floor(duration * context.sampleRate));
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
    }
    return buffer;
  }

  function encodeWav(audioBuffer) {
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const frames = audioBuffer.length;
    const bytesPerSample = 2;
    const blockAlign = channels * bytesPerSample;
    const dataSize = frames * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    const channelData = [];
    for (let channel = 0; channel < channels; channel++) channelData.push(audioBuffer.getChannelData(channel));
    for (let frame = 0; frame < frames; frame++) {
      for (let channel = 0; channel < channels; channel++) {
        const sample = clamp(channelData[channel][frame], -1, 1);
        view.setInt16(offset, sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff), true);
        offset += 2;
      }
    }
    return buffer;
  }

  function openCacheDb() {
    if (!('indexedDB' in window)) return Promise.resolve(null);
    return new Promise((resolve) => {
      const request = window.indexedDB.open(CACHE_DB, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(CACHE_STORE)) db.createObjectStore(CACHE_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  async function readCachedRender(key) {
    const db = await openCacheDb();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(CACHE_STORE, 'readonly');
      const request = tx.objectStore(CACHE_STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async function storeCachedRender(key, data) {
    const db = await openCacheDb();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(CACHE_STORE, 'readwrite');
      tx.objectStore(CACHE_STORE).put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  }

  async function decodeCachedRender(arrayBuffer) {
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineCtx) throw new Error('Offline audio decoding is not available in this browser.');
    const context = new OfflineCtx(1, 1, 16000);
    return context.decodeAudioData(arrayBuffer.slice(0));
  }

  async function renderMidiToBuffer(midi) {
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineCtx) throw new Error('Offline audio rendering is not available in this browser.');

    const sampleRate = 12000;
    const tail = 1;
    const frames = Math.ceil((midi.duration + tail) * sampleRate);
    const context = new OfflineCtx(1, frames, sampleRate);

    const bus = context.createGain();
    const master = context.createGain();
    const lowpass = context.createBiquadFilter();

    bus.gain.value = 1;
    master.gain.value = 0.76;
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3200;
    lowpass.Q.value = 0.18;

    bus.connect(master);
    master.connect(lowpass);
    lowpass.connect(context.destination);

    const noiseBuffer = createNoiseBuffer(context, 0.18);

    for (const note of midi.notes) {
      const profile = instrumentProfile(note);
      const start = note.start;
      const end = note.end;
      const peak = Math.max(0.0001, profile.gain * Math.pow((note.velocity || 96) / 127, 1.45));
      const sustain = Math.max(0.0001, peak * profile.sustain);
      const attackEnd = Math.min(end, start + profile.attack);
      const decayEnd = Math.min(end, attackEnd + profile.decay);
      const amplitude = context.createGain();

      amplitude.gain.setValueAtTime(0.0001, start);
      amplitude.gain.linearRampToValueAtTime(peak, attackEnd);
      amplitude.gain.exponentialRampToValueAtTime(sustain, decayEnd);
      amplitude.gain.setValueAtTime(sustain, end);
      amplitude.gain.exponentialRampToValueAtTime(0.0001, end + profile.release);
      const targetNode = amplitude;
      amplitude.connect(bus);

      if (profile.kind === 'noise') {
        const source = context.createBufferSource();
        source.buffer = noiseBuffer;
        source.connect(targetNode);
        source.start(start);
        source.stop(Math.min(end + profile.release, midi.duration + tail));
        continue;
      }

      const base = context.createOscillator();
      base.type = profile.base;
      base.frequency.setValueAtTime(noteFrequency(note.note), start);
      base.connect(targetNode);

      base.start(start);
      base.stop(end + profile.release + 0.05);
    }

    return context.startRendering();
  }

  function loadStoredVolume(fallback) {
    try {
      const value = Number.parseFloat(window.localStorage.getItem(VOLUME_KEY) || '');
      if (Number.isFinite(value)) return clamp(value, 0, 1);
    } catch {}
    return fallback;
  }

  function storeVolume(value) {
    try {
      window.localStorage.setItem(VOLUME_KEY, String(value));
    } catch {}
  }

  function loadStoredEnabled(fallback) {
    try {
      const raw = window.localStorage.getItem(ENABLED_KEY);
      if (raw === 'true') return true;
      if (raw === 'false') return false;
    } catch {}
    return fallback;
  }

  function storeEnabled(value) {
    try {
      window.localStorage.setItem(ENABLED_KEY, value ? 'true' : 'false');
    } catch {}
  }

  function createAmbientMusicController(options) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const {
      tracks = [],
      src,
      title,
      tempo,
      note,
      attribution,
      defaultVolume = 1,
      defaultEnabled = false,
      onStateChange = null,
    } = options;

    const playlist = (Array.isArray(tracks) && tracks.length ? tracks : [{ src, title, tempo, note }]).filter(
      (track) => track && track.src,
    );

    function normalizeTrackIndex(index) {
      return ((index % playlist.length) + playlist.length) % playlist.length;
    }

    function trackAt(index) {
      return playlist[normalizeTrackIndex(index)];
    }

    function cacheKey(index) {
      const track = trackAt(index);
      return `${RENDER_CACHE_VERSION}:${track.src}`;
    }

    const state = {
      available: Boolean(AudioCtx) && playlist.length > 0,
      enabled: false,
      loading: false,
      ready: false,
      error: '',
      title: playlist[0]?.title || title || 'Ambient',
      tempo: playlist[0]?.tempo || tempo || 0,
      note: playlist[0]?.note || note || '',
      attribution,
      volume: loadStoredVolume(defaultVolume),
      preferredEnabled: loadStoredEnabled(defaultEnabled),
      simulationPaused: false,
      trackIndex: 0,
      trackCount: playlist.length,
    };

    let context = null;
    let gainNode = null;
    let sourceNode = null;
    const buffers = new Map();
    const trackMeta = new Map();
    const renderPromises = new Map();
    let warmScheduled = false;
    let warmTimeoutId = 0;
    let startPromise = Promise.resolve();

    function syncTrackState(index) {
      const normalized = normalizeTrackIndex(index);
      const track = trackAt(normalized);
      const meta = trackMeta.get(normalized);
      state.trackIndex = normalized;
      state.title = track.title;
      state.tempo = track.tempo || meta?.tempo || 0;
      state.note = track.note || '';
      return track;
    }

    syncTrackState(0);

    function snapshot() {
      const nextTrack = trackAt(state.trackIndex + 1);
      const preparing = state.loading && state.preferredEnabled;
      return {
        ...state,
        buttonLabel: preparing ? 'Starting…' : state.preferredEnabled ? 'Music On' : 'Music Off',
        noteLabel: state.error
          ? `Ambient unavailable · ${state.error}`
          : preparing
            ? `Preparing ${state.title}… first start can take a moment.`
            : state.preferredEnabled && state.simulationPaused
              ? `Paused with tank · cue ${state.trackIndex + 1}/${state.trackCount} · ${state.tempo} BPM`
              : `${state.enabled ? 'On' : 'Off'} · cue ${state.trackIndex + 1}/${state.trackCount} · ${state.tempo} BPM${nextTrack ? ` · next ${nextTrack.title}` : ''}`,
      };
    }

    function emit() {
      const detail = snapshot();
      if (typeof onStateChange === 'function') onStateChange(detail);
      return detail;
    }

    function clearWarmTimeout() {
      if (!warmTimeoutId) return;
      window.clearTimeout(warmTimeoutId);
      warmTimeoutId = 0;
    }

    function syncGain() {
      if (!gainNode || !context) return;
      gainNode.gain.setTargetAtTime(state.volume * 0.86, context.currentTime, 0.02);
    }

    async function ensureContext() {
      if (!AudioCtx) throw new Error('Web Audio is not available in this browser.');
      if (!context) {
        context = new AudioCtx();
        gainNode = context.createGain();
        gainNode.connect(context.destination);
        syncGain();
      }
      return context;
    }

    async function ensureBuffer(index, announce = false) {
      const normalized = normalizeTrackIndex(index);
      if (buffers.has(normalized)) return buffers.get(normalized);
      if (renderPromises.has(normalized)) {
        if (announce) {
          state.loading = true;
          state.error = '';
          emit();
          try {
            return await renderPromises.get(normalized);
          } finally {
            state.loading = false;
            emit();
          }
        }
        return renderPromises.get(normalized);
      }

      if (announce) {
        state.loading = true;
        state.error = '';
        emit();
      }

      const promise = (async () => {
        const cached = await readCachedRender(cacheKey(normalized));
        if (cached instanceof ArrayBuffer) return decodeCachedRender(cached);
        const track = trackAt(normalized);
        const response = await fetch(track.src, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`Could not load ${track.src}.`);
        const midi = parseMidi(await response.arrayBuffer());
        trackMeta.set(normalized, { tempo: midi.tempoBpm, duration: midi.duration });
        const rendered = await renderMidiToBuffer(midi);
        storeCachedRender(cacheKey(normalized), encodeWav(rendered));
        return rendered;
      })()
        .then((rendered) => {
          buffers.set(normalized, rendered);
          if (state.trackIndex === normalized) syncTrackState(normalized);
          state.ready = true;
          return rendered;
        })
        .catch((error) => {
          state.error = error && error.message ? error.message : 'Unknown audio error.';
          throw error;
        })
        .finally(() => {
          renderPromises.delete(normalized);
          if (announce) {
            state.loading = false;
            emit();
          }
        });
      renderPromises.set(normalized, promise);
      return promise;
    }

    async function disposeSource() {
      if (!sourceNode) return;
      const current = sourceNode;
      sourceNode = null;
      current.onended = null;
      try {
        current.stop();
      } catch {}
      try {
        current.disconnect();
      } catch {}
    }

    async function startTrack(index) {
      const normalized = normalizeTrackIndex(index);
      syncTrackState(normalized);
      emit();
      await ensureContext();
      const rendered = await ensureBuffer(normalized, true);
      await disposeSource();
      const current = context.createBufferSource();
      current.buffer = rendered;
      current.loop = false;
      current.connect(gainNode);
      current.onended = () => {
        if (sourceNode !== current) return;
        sourceNode = null;
        if (!state.preferredEnabled || state.simulationPaused) {
          state.enabled = false;
          emit();
          return;
        }
        queuePlaybackStart(normalized + 1);
      };
      sourceNode = current;
      current.start(0);
      await context.resume();
      state.enabled = true;
      state.error = '';
      emit();
      scheduleNextTrackWarm(normalized);
    }

    function queuePlaybackStart(index) {
      const normalized = normalizeTrackIndex(index);
      startPromise = startPromise
        .catch(() => {})
        .then(() => startTrack(normalized))
        .catch((error) => {
          state.enabled = false;
          state.error = error && error.message ? error.message : 'Unknown audio error.';
          emit();
        });
      return startPromise;
    }

    async function setEnabled(nextEnabled) {
      if (!state.available) {
        state.error = 'Web Audio is not available in this browser.';
        emit();
        return;
      }
      state.preferredEnabled = Boolean(nextEnabled);
      storeEnabled(state.preferredEnabled);
      if (nextEnabled) {
        await ensureContext();
        if (sourceNode) {
          if (state.simulationPaused) {
            await context.suspend();
            state.enabled = false;
            state.error = '';
            emit();
          } else {
            await context.resume();
            state.enabled = true;
            state.error = '';
            emit();
            scheduleNextTrackWarm(state.trackIndex);
          }
        } else if (state.simulationPaused) {
          await ensureBuffer(state.trackIndex, true);
          state.enabled = false;
          state.error = '';
          emit();
          scheduleNextTrackWarm(state.trackIndex);
        } else {
          await queuePlaybackStart(state.trackIndex);
        }
      } else if (context) {
        await context.suspend();
        state.enabled = false;
      } else {
        state.enabled = false;
      }
      emit();
    }

    async function toggle() {
      if (state.loading && !state.enabled) {
        state.preferredEnabled = !state.preferredEnabled;
        storeEnabled(state.preferredEnabled);
        if (state.preferredEnabled) {
          ensureContext()
            .then(async () => {
              if (!state.simulationPaused && sourceNode) {
                await context.resume();
                state.enabled = true;
                emit();
              } else if (!state.simulationPaused) {
                queuePlaybackStart(state.trackIndex);
              }
            })
            .catch((error) => {
              state.error = error && error.message ? error.message : 'Unknown audio error.';
              emit();
            });
        }
        return emit();
      }
      try {
        await setEnabled(!(state.enabled || state.preferredEnabled));
        return emit();
      } catch (error) {
        state.loading = false;
        state.enabled = false;
        state.error = error && error.message ? error.message : 'Unknown audio error.';
        return emit();
      }
    }

    function setVolume(volume) {
      state.volume = clamp(volume, 0, 1);
      storeVolume(state.volume);
      syncGain();
      return emit();
    }

    async function warmTrack(index) {
      try {
        await ensureBuffer(index, false);
      } catch {}
    }

    function scheduleNextTrackWarm(currentIndex) {
      clearWarmTimeout();
      if (playlist.length <= 1) return;
      const nextIndex = normalizeTrackIndex(currentIndex + 1);
      if (buffers.has(nextIndex) || renderPromises.has(nextIndex)) return;
      warmTimeoutId = window.setTimeout(() => {
        warmTimeoutId = 0;
        warmTrack(nextIndex);
      }, 1400);
    }

    function scheduleWarmRender() {
      if (warmScheduled || !state.available) return;
      warmScheduled = true;
      const warm = () => {
        ensureBuffer(state.trackIndex, false).catch((error) => {
          state.loading = false;
          state.error = error && error.message ? error.message : 'Unknown audio error.';
          emit();
        });
      };
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(warm, { timeout: 180 });
      } else {
        window.setTimeout(warm, 80);
      }
    }

    async function setSimulationPaused(nextPaused) {
      state.simulationPaused = Boolean(nextPaused);
      if (!context || !state.preferredEnabled) {
        if (state.simulationPaused) state.enabled = false;
        return emit();
      }
      try {
        if (state.simulationPaused) {
          await context.suspend();
          state.enabled = false;
        } else {
          if (sourceNode) {
            await context.resume();
            state.enabled = true;
            scheduleNextTrackWarm(state.trackIndex);
          } else {
            await queuePlaybackStart(state.trackIndex);
          }
        }
        state.error = '';
      } catch (error) {
        state.enabled = false;
        state.error = error && error.message ? error.message : 'Unknown audio error.';
      }
      return emit();
    }

    function advanceTrack() {
      const nextIndex = state.trackIndex + 1;
      if (state.preferredEnabled && !state.simulationPaused) {
        queuePlaybackStart(nextIndex);
      } else {
        syncTrackState(nextIndex);
        emit();
        warmTrack(nextIndex);
        scheduleNextTrackWarm(nextIndex);
      }
      return snapshot();
    }

    function getState() {
      return snapshot();
    }

    scheduleWarmRender();
    emit();
    return { toggle, setVolume, getState, setSimulationPaused, advanceTrack };
  }

  window.FishtankMusic = { createAmbientMusicController };
})();
