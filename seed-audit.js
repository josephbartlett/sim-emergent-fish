const SEEDS = [240311, 241288, 242265, 243242, 244219, 245196, 246173, 247150];
const out = document.getElementById('out');
const frame = document.getElementById('sim');

function summarize(results) {
  const flattened = results.flatMap((entry) => entry.samples.map((sample) => ({ seed: entry.seed, sample })));
  const appetiteSnapshots = flattened.filter((entry) => entry.sample.appetite.hungryVisibleFood > 0);
  const avg = (values) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  return {
    seeds: SEEDS,
    snapshots: flattened.length,
    approachRate: Number(
      avg(appetiteSnapshots.map((entry) => entry.sample.appetite.hungryApproachingFood / entry.sample.appetite.hungryVisibleFood)).toFixed(3),
    ),
    driftRate: Number(
      avg(appetiteSnapshots.map((entry) => entry.sample.appetite.hungryDriftingFromFood / entry.sample.appetite.hungryVisibleFood)).toFixed(3),
    ),
    collapseRate: Number((flattened.filter((entry) => entry.sample.fish === 0).length / Math.max(1, flattened.length)).toFixed(3)),
    averageFoodTaken: Number(avg(results.map((entry) => entry.samples[entry.samples.length - 1].foodTaken)).toFixed(2)),
    lastSamples: results.map((entry) => entry.samples[entry.samples.length - 1]),
  };
}

function fail(message) {
  out.textContent = message;
  document.body.dataset.done = '1';
  document.body.dataset.error = '1';
}

frame.addEventListener('load', () => {
  requestAnimationFrame(() => {
    const api = frame.contentWindow?.__FISHTANK_DEBUG__;
    if (!api) {
      fail('seed audit failed: simulation debug API was not available');
      return;
    }
    const results = [];
    for (const seed of SEEDS) {
      api.applyPreset('balanced');
      api.setSeed(seed);
      const samples = [];
      for (let i = 0; i < 6; i++) samples.push(api.runAudit(5));
      results.push({ seed, samples });
    }
    out.textContent = JSON.stringify(summarize(results), null, 2);
    document.body.dataset.done = '1';
  });
});
