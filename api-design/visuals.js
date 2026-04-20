(function () {
  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  var dprCap = 2;

  /** Sync canvas bitmap size to CSS box × devicePixelRatio (avoids blur / wrong hit detection). */
  function syncCanvasSize(canvas, minW, minH, aspectW, aspectH) {
    var rect = canvas.getBoundingClientRect();
    var cssW = rect.width || canvas.clientWidth || minW;
    var dpr = Math.min(dprCap, window.devicePixelRatio || 1);
    var w = Math.max(minW, Math.floor(cssW * dpr));
    var h = Math.max(minH, Math.floor((w * aspectH) / aspectW));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return { w: canvas.width, h: canvas.height, cssW: cssW };
  }

  function wireShapeMode() {
    var r = document.querySelector('input[name="wire-shape"]:checked');
    return r && r.value === "rest" ? "rest" : "gql";
  }

  /* ----- Sync N sliders (cache panel ↔ round-trip panel) ----- */
  var shapeN = document.getElementById("shape-n");
  var cacheN = document.getElementById("cache-n");
  var vN = document.getElementById("v-n");
  var vNCache = document.getElementById("v-n-cache");
  function setN(n, src) {
    n = clamp(Math.round(Number(n)), 1, 18);
    if (shapeN && src !== shapeN) shapeN.value = String(n);
    if (cacheN && src !== cacheN) cacheN.value = String(n);
    if (vN) vN.textContent = String(n);
    if (vNCache) vNCache.textContent = String(n);
  }
  function onNInput(el) {
    setN(el.value, el);
  }
  if (shapeN) shapeN.addEventListener("input", function () { onNInput(shapeN); });
  if (cacheN) cacheN.addEventListener("input", function () { onNInput(cacheN); });
  if (shapeN && cacheN) setN(shapeN.value, shapeN);

  window.addEventListener("resize", function () {
    /* no-op hook; rAF loops re-sync each frame */
  });

  /* ----- Token bucket (rate limiting) ----- */
  var cb = document.getElementById("viz-bucket");
  if (cb) {
    var xb = cb.getContext("2d");
    var refillEl = document.getElementById("tb-refill");
    var capEl = document.getElementById("tb-cap");
    var arrEl = document.getElementById("tb-arrival");
    var vRefill = document.getElementById("v-refill");
    var vCap = document.getElementById("v-cap");
    var vArr = document.getElementById("v-arrival");
    var rb = document.getElementById("readout-bucket");
    var cap = capEl ? Number(capEl.value) : 40;
    var tokens = cap;
    var last = performance.now() / 1000;
    var accReq = 0;
    var accOk = 0;
    var accDrop = 0;
    var prevAccOk = 0;
    var emaAdmit = 0;
    var hist = [];
    var baseW = 840;
    var baseH = 220;

    function tickBucket(nowMs) {
      var now = nowMs / 1000;
      var dt = clamp(now - last, 0, 0.2);
      last = now;
      var dim = syncCanvasSize(cb, 280, 120, baseW, baseH);
      var w = dim.w;
      var h = dim.h;
      var sx = w / baseW;
      var sy = h / baseH;

      var refill = refillEl ? Number(refillEl.value) : 20;
      cap = capEl ? Number(capEl.value) : 40;
      var arrival = arrEl ? Number(arrEl.value) : 25;
      if (vRefill) vRefill.textContent = String(refill);
      if (vCap) vCap.textContent = String(cap);
      if (vArr) vArr.textContent = String(arrival);

      tokens = Math.min(cap, tokens + refill * dt);
      accReq += arrival * dt;
      while (accReq >= 1) {
        accReq -= 1;
        if (tokens >= 1) {
          tokens -= 1;
          accOk += 1;
        } else accDrop += 1;
      }

      var dOk = accOk - prevAccOk;
      prevAccOk = accOk;
      var inst = dt > 1e-6 ? dOk / dt : 0;
      emaAdmit = emaAdmit === 0 ? inst : emaAdmit * 0.92 + inst * 0.08;

      if (hist.length > 220) hist.shift();
      hist.push({ tok: tokens, cap: cap });

      xb.setTransform(1, 0, 0, 1, 0, 0);
      xb.clearRect(0, 0, w, h);
      xb.strokeStyle = "#2a2928";
      xb.lineWidth = 1;
      xb.strokeRect(56 * sx, 28 * sy, 86 * sx, 184 * sy);
      var fillH = (tokens / Math.max(1, cap)) * (178 * sy);
      xb.fillStyle = "rgba(91, 163, 181, 0.45)";
      xb.fillRect(57 * sx, 28 * sy + 178 * sy - fillH + 1 * sy, 84 * sx, fillH);
      xb.fillStyle = "#e07060";
      xb.font = "600 " + Math.max(9, 11 * sx) + "px JetBrains Mono, ui-monospace, monospace";
      xb.fillText("bucket", 58 * sx, 20 * sy);
      xb.fillStyle = "#888888";
      xb.font = Math.max(8, 10 * sx) + "px JetBrains Mono, ui-monospace, monospace";
      xb.fillText("0", 52 * sx, 218 * sy);
      xb.fillText(String(cap), 52 * sx, 36 * sy);
      xb.strokeStyle = "#5ba3b5";
      xb.lineWidth = Math.max(1, 1.5 * sx);
      var graphL = 200 * sx;
      var graphR = w - 16 * sx;
      var graphW = Math.max(40, graphR - graphL);
      if (hist.length === 1) {
        var py0 = 200 * sy - (hist[0].tok / Math.max(1, hist[0].cap)) * (165 * sy);
        var px0 = graphL + graphW * 0.5;
        xb.beginPath();
        xb.arc(px0, py0, Math.max(1.2, 2 * sx), 0, Math.PI * 2);
        xb.fillStyle = "#5ba3b5";
        xb.fill();
      } else if (hist.length > 1) {
        xb.beginPath();
        for (var i = 0; i < hist.length; i++) {
          var px = graphL + (i / (hist.length - 1)) * graphW;
          var py = 200 * sy - (hist[i].tok / Math.max(1, hist[i].cap)) * (165 * sy);
          if (i === 0) xb.moveTo(px, py);
          else xb.lineTo(px, py);
        }
        xb.stroke();
      }
      xb.fillStyle = "#888888";
      xb.font = Math.max(8, 10 * sx) + "px JetBrains Mono, ui-monospace, monospace";
      xb.fillText("token level (time)", graphL, 20 * sy);

      var ratio = accOk + accDrop > 0 ? accOk / (accOk + accDrop) : 1;
      var sustainedCeil = refill;
      var offered = arrival;
      if (rb)
        rb.innerHTML =
          "<strong>Accepted (total):</strong> " +
          Math.round(accOk) +
          " · <strong>Throttled:</strong> " +
          Math.round(accDrop) +
          " · <strong>Admit ratio:</strong> " +
          (ratio * 100).toFixed(1) +
          "%<br><strong>Instant throughput (admitted):</strong> " +
          inst.toFixed(1) +
          " req/s (this frame) · <strong>Smoothed admit rate:</strong> " +
          emaAdmit.toFixed(1) +
          " req/s · <strong>Offered load:</strong> " +
          offered.toFixed(1) +
          " req/s · <strong>Sustained throughput ceiling:</strong> " +
          sustainedCeil.toFixed(1) +
          " tok/s (refill = long-run admission cap when tokens stay depleted) · <strong>Tokens on hand:</strong> " +
          tokens.toFixed(1) +
          " / " +
          cap +
          "<br><span style=\"color:var(--text-secondary);font-size:13px;line-height:1.5\"><strong>Throughput story:</strong> admissions per second cannot exceed refill indefinitely. While the cyan fill is nonempty, bursts can run faster than refill; once it empties, admissions track refill (compare to the fixed-window sustained ceiling on the right).</span>";

      requestAnimationFrame(tickBucket);
    }
    requestAnimationFrame(tickBucket);
  }

  /* ----- Fixed window ----- */
  var cf = document.getElementById("viz-fixed");
  if (cf) {
    var xf = cf.getContext("2d");
    var fwWinEl = document.getElementById("fw-window");
    var fwLimEl = document.getElementById("fw-limit");
    var fwArrEl = document.getElementById("fw-arrival");
    var fwBurstEl = document.getElementById("fw-burst");
    var vFwWin = document.getElementById("v-fw-win");
    var vFwLim = document.getElementById("v-fw-limit");
    var vFwArr = document.getElementById("v-fw-arrival");
    var vFwBurst = document.getElementById("v-fw-burst");
    var rf = document.getElementById("readout-fixed");

    var fwLast = performance.now() / 1000;
    var fwAccReq = 0;
    var fwTime = 0;
    var fwWindowIdx = 0;
    var fwCount = 0;
    var fwBars = [];
    var fwAccOk = 0;
    var fwDrop = 0;
    var baseWf = 840;
    var baseHf = 240;

    function tickFixed(nowMs) {
      var now = nowMs / 1000;
      var dt = clamp(now - fwLast, 0, 0.2);
      fwLast = now;

      var winSec = fwWinEl ? Number(fwWinEl.value) / 10 : 1;
      winSec = clamp(winSec, 0.5, 4.5);
      var limit = fwLimEl ? Number(fwLimEl.value) : 24;
      var baseArrival = fwArrEl ? Number(fwArrEl.value) : 28;
      var burstMix = fwBurstEl ? Number(fwBurstEl.value) / 100 : 0;

      if (vFwWin) vFwWin.textContent = winSec.toFixed(1);
      if (vFwLim) vFwLim.textContent = String(limit);
      if (vFwArr) vFwArr.textContent = String(baseArrival);
      if (vFwBurst) vFwBurst.textContent = String(Math.round(burstMix * 100));

      fwTime += dt;
      var targetIdx = Math.floor(fwTime / winSec);
      while (fwWindowIdx < targetIdx) {
        fwBars.push({ a: fwCount, lim: limit });
        if (fwBars.length > 18) fwBars.shift();
        fwCount = 0;
        fwWindowIdx++;
      }

      var phase = (fwTime % winSec) / winSec;
      var burstBoost = phase > 0.9 ? 5 * burstMix : 0;
      var effArrival = baseArrival * (1 + burstBoost);

      fwAccReq += effArrival * dt;
      while (fwAccReq >= 1) {
        fwAccReq -= 1;
        if (fwCount < limit) {
          fwCount += 1;
          fwAccOk += 1;
        } else {
          fwDrop += 1;
        }
      }

      var dim = syncCanvasSize(cf, 280, 140, baseWf, baseHf);
      var w = dim.w;
      var h = dim.h;
      var sx = w / baseWf;
      var sy = h / baseHf;

      xf.setTransform(1, 0, 0, 1, 0, 0);
      xf.clearRect(0, 0, w, h);
      xf.fillStyle = "#888888";
      xf.font = Math.max(8, 10 * sx) + "px JetBrains Mono, ui-monospace, monospace";
      xf.fillText("accepted per window (last windows →)", 14 * sx, 18 * sy);

      var padL = 24 * sx;
      var padR = 16 * sx;
      var padT = 36 * sy;
      var padB = 52 * sy;
      var chartW = Math.max(80, w - padL - padR);
      var chartH = Math.max(50, h - padT - padB);
      var nbar = fwBars.length;
      /* One slot per completed window + current in-progress window (avoids empty chart at t≈0). */
      var nSlots = Math.max(1, nbar + 1);
      var slot = chartW / nSlots;
      var barW = Math.max(4, slot * 0.58);

      for (var b = 0; b < nbar; b++) {
        var bx = padL + b * slot + (slot - barW) / 2;
        var accepted = fwBars[b].a;
        var lim = Math.max(1, fwBars[b].lim);
        var bh = (accepted / lim) * chartH;
        xf.fillStyle = "#2a2928";
        xf.fillRect(bx, padT, barW, chartH);
        xf.fillStyle = "rgba(224,112,96,0.55)";
        xf.fillRect(bx, padT + chartH - bh, barW, bh);
      }

      var bxCur = padL + nbar * slot + (slot - barW) / 2;
      var bhCur = (fwCount / Math.max(1, limit)) * chartH;
      xf.fillStyle = "#2a2928";
      xf.fillRect(bxCur, padT, barW, chartH);
      xf.fillStyle = "rgba(91,163,181,0.42)";
      xf.fillRect(bxCur, padT + chartH - bhCur, barW, bhCur);
      xf.strokeStyle = "rgba(91,163,181,0.85)";
      xf.lineWidth = Math.max(1, 1.2 * sx);
      xf.strokeRect(bxCur, padT, barW, chartH);

      /* Top of chart = 100% of per-window limit */
      var capY = padT;
      xf.strokeStyle = "rgba(91,163,181,0.9)";
      xf.setLineDash([4 * sx, 4 * sx]);
      xf.beginPath();
      xf.moveTo(padL, capY);
      xf.lineTo(padL + chartW, capY);
      xf.stroke();
      xf.setLineDash([]);
      xf.fillStyle = "#5ba3b5";
      xf.font = Math.max(8, 10 * sx) + "px JetBrains Mono, ui-monospace, monospace";
      xf.fillText("per-window cap", padL + chartW - 88 * sx, capY + 12 * sy);

      xf.fillStyle = "#e7e5e2";
      xf.font = Math.max(9, 11 * sx) + "px JetBrains Mono, ui-monospace, monospace";
      var curPhase = (fwTime % winSec) / winSec;
      xf.fillText("this window: " + fwCount + " / " + limit + " · phase " + (curPhase * 100).toFixed(0) + "%", 14 * sx, h - 28 * sy);
      xf.fillStyle = "#888888";
      xf.font = Math.max(8, 10 * sx) + "px JetBrains Mono, ui-monospace, monospace";
      xf.fillText("Boundary-heavy traffic can pin two adjacent windows near the cap—classic 2× seam.", 14 * sx, h - 12 * sy);

      var seamNote = "";
      if (fwBars.length >= 2) {
        var a1 = fwBars[fwBars.length - 1].a;
        var a0 = fwBars[fwBars.length - 2].a;
        var sum = a1 + a0;
        seamNote =
          " Last pair sum: <strong>" +
          sum +
          "</strong> vs 2×limit <strong>" +
          2 * limit +
          "</strong> (shows how seams add headroom).";
      }
      var sustainedReqPerSec = limit / Math.max(1e-6, winSec);
      if (rf)
        rf.innerHTML =
          "<strong>Accepted:</strong> " +
          Math.round(fwAccOk) +
          " · <strong>Throttled:</strong> " +
          Math.round(fwDrop) +
          seamNote +
          "<br><strong>Sustained ceiling:</strong> " +
          sustainedReqPerSec.toFixed(1) +
          " req/s (limit ÷ window; long-run average when each window fills to the cap) · <strong>Offered load:</strong> " +
          effArrival.toFixed(1) +
          " req/s<br><span style=\"color:var(--text-secondary);font-size:13px;line-height:1.5\">Fixed window is easy to explain and implement; pair it with clear limits and <code>Retry-After</code>. Prefer token/leaky buckets when you need smoother admission (see left).</span>";

      requestAnimationFrame(tickFixed);
    }
    requestAnimationFrame(tickFixed);
  }

  /* ----- Cache hit / miss + wire shape ----- */
  var cc = document.getElementById("viz-cache");
  if (cc) {
    var xc = cc.getContext("2d");
    var hitEl = document.getElementById("cache-hit");
    var staleEl = document.getElementById("cache-stale");
    var vHit = document.getElementById("v-hit");
    var vStale = document.getElementById("v-stale");
    var rc = document.getElementById("readout-cache");
    var baseWc = 840;
    var baseHc = 240;

    function drawCache() {
      var hit = hitEl ? Number(hitEl.value) / 100 : 0.7;
      var staleMs = staleEl ? Number(staleEl.value) : 120;
      var n = cacheN ? Number(cacheN.value) : 6;
      if (vHit) vHit.textContent = (hit * 100).toFixed(0);
      if (vStale) vStale.textContent = String(staleMs);

      var dim = syncCanvasSize(cc, 280, 140, baseWc, baseHc);
      var w = dim.w;
      var h = dim.h;
      var sx = w / baseWc;
      var sy = h / baseHc;

      var hitLat = 6 + staleMs * 0.04;
      var missBase = 95 + staleMs * 0.22;
      var missRest = missBase * (1 + 0.38 * n);
      var missGql = missBase * (1.12 + 0.028 * n);
      var mode = wireShapeMode();
      var missPick = mode === "rest" ? missRest : missGql;
      var p50 = hit * hitLat + (1 - hit) * missPick;
      var p95 = hit * (hitLat * 2.1) + (1 - hit) * (missPick * 1.32);
      var maxMs = Math.max(220, p95 * 1.15, missRest * 1.05, missGql * 1.05, 40);
      if (!isFinite(maxMs) || maxMs <= 0) maxMs = 240;

      xc.setTransform(1, 0, 0, 1, 0, 0);
      xc.clearRect(0, 0, w, h);

      var rowCount = 6;
      var barDrawH = 18 * sy;
      var topPad = 20 * sy;
      var footPad = 26 * sy;
      var avail = Math.max(barDrawH, h - topPad - footPad);
      var step = rowCount > 1 ? (avail - barDrawH) / (rowCount - 1) : 0;

      function bar(y, label, ms, col, trackW) {
        var msSafe = isFinite(ms) ? Math.max(0, ms) : 0;
        var tw = trackW || w - 24 * sx;
        var innerW = Math.max(60, tw - 148 * sx);
        var bw = (msSafe / maxMs) * innerW;
        xc.fillStyle = "#2a2928";
        xc.fillRect(148 * sx, y, innerW, barDrawH);
        xc.fillStyle = col;
        xc.fillRect(148 * sx, y, clamp(bw, 0, innerW), barDrawH);
        xc.fillStyle = "#e7e5e2";
        xc.font = Math.max(9, 11 * sx) + "px JetBrains Mono, ui-monospace, monospace";
        xc.fillText(label + " " + msSafe.toFixed(0) + " ms", 12 * sx, y + Math.min(14 * sy, barDrawH * 0.72));
      }

      var row0 = topPad;
      bar(row0, "p50 blended", p50, "#5ba3b5");
      bar(row0 + step, "p95 blended", p95, "#8b7aa8");
      bar(row0 + 2 * step, "fresh hit only", hitLat, "#5a9a6e");
      bar(row0 + 3 * step, "origin miss (selected wire)", missPick, mode === "rest" ? "#c95a4a" : "#4a6b8a");
      bar(row0 + 4 * step, "ref: REST 1+N cold", missRest, "rgba(224,112,96,0.35)");
      bar(row0 + 5 * step, "ref: GraphQL cold", missGql, "rgba(91,163,181,0.35)");

      xc.fillStyle = "#888888";
      xc.font = Math.max(8, 10 * sx) + "px JetBrains Mono, ui-monospace, monospace";
      xc.fillText(
        "Bar width ∝ latency (toy). Green = cache path; coral/cyan refs = cold-path schema shape (do not conflate with hit rate).",
        12 * sx,
        h - 12 * sy
      );

      if (rc) {
        var shapeLine =
          mode === "rest"
            ? "Wire shape: <strong>REST 1+N</strong> — misses pay sequential RTTs (scaled by N=" + n + ")."
            : "Wire shape: <strong>GraphQL / BFF</strong> — one RTT with resolver-style depth (lighter N curve).";
        var coldDelta = missRest - missGql;
        var deltaLine =
          " · <strong>Cold-path gap (REST ref − GraphQL ref):</strong> " +
          (coldDelta >= 0 ? "+" : "") +
          coldDelta.toFixed(0) +
          " ms at this N (toy)";
        rc.innerHTML =
          "<strong>Expected p50:</strong> " +
          p50.toFixed(1) +
          " ms · <strong>p95:</strong> " +
          p95.toFixed(1) +
          " ms · " +
          shapeLine +
          deltaLine +
          "<br><span style=\"color:var(--text-secondary);font-size:13px;line-height:1.5\"><strong>Cache luck</strong> (hit rate) moves the blend toward the green bar; <strong>cold-path schema shape</strong> is what the coral/cyan reference rows isolate—do not tune one while confusing it with the other. REST stays CDN-friendly on GETs; GraphQL often shifts caching to private layers—see the <a href=\"chapters/caching.html\">caching</a> and <a href=\"chapters/rest-graphql.html\">REST vs GraphQL</a> chapters.</span>";
      }
      requestAnimationFrame(drawCache);
    }
    requestAnimationFrame(drawCache);
  }

  /* ----- REST vs GraphQL round trips ----- */
  var cr = document.getElementById("viz-shape");
  if (cr) {
    var xr = cr.getContext("2d");
    var nEl = document.getElementById("shape-n");
    var anim = 0;
    var baseWr = 840;
    var baseHr = 220;

    function drawShape() {
      anim += 0.016;
      var n = nEl ? Number(nEl.value) : 6;
      if (vN) vN.textContent = String(n);

      var dim = syncCanvasSize(cr, 280, 120, baseWr, baseHr);
      var w = dim.w;
      var h = dim.h;
      var sx = w / baseWr;
      var sy = h / baseHr;

      xr.setTransform(1, 0, 0, 1, 0, 0);
      xr.clearRect(0, 0, w, h);
      var cxL = 88 * sx;
      var cxR = w - 88 * sx;
      var cy = Math.floor(h * 0.72);
      xr.strokeStyle = "#333333";
      xr.setLineDash([4 * sx, 4 * sx]);
      xr.beginPath();
      xr.moveTo(cxL, 20 * sy);
      xr.lineTo(cxL, h - 16 * sy);
      xr.moveTo(cxR, 20 * sy);
      xr.lineTo(cxR, h - 16 * sy);
      xr.stroke();
      xr.setLineDash([]);
      xr.fillStyle = "#888888";
      xr.font = Math.max(8, 10 * sx) + "px JetBrains Mono, ui-monospace, monospace";
      xr.fillText("client", cxL - 22 * sx, 16 * sy);
      xr.fillText("server", cxR - 28 * sx, 16 * sy);
      var restTrips = 1 + n;
      var rowH = Math.min(16 * sy, (cy - 48 * sy) / Math.max(1, restTrips));
      var y0 = 40 * sy;
      for (var i = 0; i < restTrips; i++) {
        var y = y0 + i * rowH;
        xr.strokeStyle = "rgba(224,112,96,0.35)";
        xr.lineWidth = Math.max(1, sx);
        xr.beginPath();
        xr.moveTo(cxL, y);
        xr.lineTo(cxR, y);
        xr.stroke();
        var speed = 0.55 / Math.max(1, restTrips);
        var prog = (anim * speed + i * 0.31) % 1;
        var px = cxL + prog * (cxR - cxL);
        xr.fillStyle = "#e07060";
        xr.beginPath();
        xr.arc(px, y, Math.max(3, 5 * sx), 0, Math.PI * 2);
        xr.fill();
      }
      xr.strokeStyle = "#5ba3b5";
      xr.lineWidth = Math.max(2, 3 * sx);
      xr.beginPath();
      xr.moveTo(cxL, cy);
      xr.lineTo(cxR, cy);
      xr.stroke();
      xr.lineWidth = 1;
      var gProg = (anim * 0.45) % 1;
      xr.fillStyle = "#5ba3b5";
      xr.beginPath();
      xr.arc(cxL + gProg * (cxR - cxL), cy, Math.max(5, 8 * sx), 0, Math.PI * 2);
      xr.fill();
      xr.fillStyle = "#e7e5e2";
      xr.font = Math.max(9, 11 * sx) + "px JetBrains Mono, ui-monospace, monospace";
      xr.fillText("REST-style: 1 + N independent round trips (each coral row)", 12 * sx, h - 28 * sy);
      xr.fillStyle = "#5ba3b5";
      xr.fillText("GraphQL / BFF: one request path (blue)", 12 * sx, h - 12 * sy);

      var rr = document.getElementById("readout-shape");
      if (rr)
        rr.innerHTML =
          "<strong>REST sequential fetches:</strong> " +
          restTrips +
          " round trips · <strong>Single graph query:</strong> 1 (plus resolver depth and payload size)<br><span style=\"color:var(--text-secondary);font-size:13px;line-height:1.5\">Tie this view to panel 2: the same N inflates REST-shaped <strong>miss</strong> latency more than a one-hop graph-shaped miss.</span>";

      requestAnimationFrame(drawShape);
    }
    requestAnimationFrame(drawShape);
  }
})();
