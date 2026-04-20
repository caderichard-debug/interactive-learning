/**
 * Wilson score interval for binomial proportion (educational demo).
 * Schematic: not a substitute for production risk or significance tests.
 */
function wilsonCI(wins, trials, z) {
  if (trials < 1) return { low: 0, high: 1, p: 0 };
  const p = Math.min(Math.max(wins / trials, 0), 1);
  const zz = z * z;
  const denom = 1 + zz / trials;
  const center = (p + zz / (2 * trials)) / denom;
  const margin =
    (z / denom) * Math.sqrt((p * (1 - p)) / trials + zz / (4 * trials * trials));
  return {
    low: Math.max(0, center - margin),
    high: Math.min(1, center + margin),
    p,
  };
}

function fmtPct(x) {
  return (100 * x).toFixed(1) + "%";
}

function init() {
  const winsEl = document.getElementById("wins");
  const trialsEl = document.getElementById("trials");
  const winsOut = document.getElementById("wins-out");
  const trialsOut = document.getElementById("trials-out");
  const readout = document.getElementById("readout");
  const bar = document.getElementById("ci-bar");

  function syncWinsMax() {
    const t = parseInt(trialsEl.value, 10);
    winsEl.max = String(t);
    const w = parseInt(winsEl.value, 10);
    if (w > t) winsEl.value = String(t);
  }

  function render() {
    syncWinsMax();
    const wins = parseInt(winsEl.value, 10);
    const trials = parseInt(trialsEl.value, 10);
    winsOut.textContent = String(wins);
    trialsOut.textContent = String(trials);

    const { low, high, p } = wilsonCI(wins, trials, 1.96);
    readout.innerHTML =
      "Observed win rate <strong>" +
      fmtPct(p) +
      "</strong>. Approx. 95% Wilson interval: <strong>" +
      fmtPct(low) +
      " – " +
      fmtPct(high) +
      "</strong>. " +
      (trials < 40
        ? "<span style='color:var(--warning)'>Few trades: the band is wide — luck and costs can dominate.</span>"
        : trials < 120
          ? "More data tightens the band; costs and regime shifts still matter."
          : "Larger <em>n</em> shrinks sampling noise; this still ignores multiple testing and non-stationarity.");

    const loPct = 100 * low;
    const hiPct = 100 * high;
    const inner = bar.querySelector(".interval");
    if (inner) {
      inner.style.left = loPct + "%";
      inner.style.width = Math.max(hiPct - loPct, 0.5) + "%";
    }
  }

  winsEl.addEventListener("input", render);
  trialsEl.addEventListener("input", render);
  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
