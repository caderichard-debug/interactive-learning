(function () {
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  var c = document.getElementById("viz");
  if (!c) return;
  var x = c.getContext("2d");
  var rttEl = document.getElementById("n-rtt");
  var lossEl = document.getElementById("n-loss");
  var vr = document.getElementById("v-rtt");
  var vl = document.getElementById("v-loss");
  var r = document.getElementById("readout");
  var mTput = document.getElementById("m-tput");
  var mRetx = document.getElementById("m-retx");
  var mCwnd = document.getElementById("m-cwnd");

  var t = 0;
  var pkt = [];
  var retransmitCount = 0;
  var cwnd = 12;
  var cwndHist = [];
  var cwndHistMax = 120;

  function spawn() {
    pkt.push({
      dir: 1,
      pos: 0,
      y: 0,
      hue: Math.random() > 0.5 ? "#5ba3b5" : "#e07060",
    });
  }
  for (var i = 0; i < 8; i++) spawn();

  function draw() {
    t += 0.016;
    var rtt = rttEl ? Number(rttEl.value) : 80;
    var lossPct = lossEl ? Number(lossEl.value) : 0;
    if (vr) vr.textContent = String(Math.round(rtt));
    if (vl) vl.textContent = String(Math.round(lossPct));

    var w = c.width;
    var h = c.height;
    var splitY = 272;
    var cwndBandY0 = splitY - 52;
    var cwndBandH = 44;
    x.clearRect(0, 0, w, h);

    var base = rtt / 120;
    var phases = [
      { name: "DNS lookup", k: 0.22 },
      { name: "TCP setup time (toy aggregate)", k: 0.38 },
      { name: "TLS handshake", k: 0.55 },
      { name: "Request → TTFB", k: 0.32 },
    ];
    var totalW = 0;
    for (var p = 0; p < phases.length; p++) totalW += phases[p].k;
    var barMax = w - 120;
    var x0 = 48;
    var rowYDns = 16;
    var rowYTcp = 44;
    var rowYTcpTimeline = 78;
    var rowYTls = 146;
    var rowYReq = 198;
    var rowYs = [rowYDns, rowYTcp, rowYTls, rowYReq];
    var tcpRowIndex = 1;

    for (var j = 0; j < phases.length; j++) {
      var rowY = rowYs[j];
      var bw = (phases[j].k / totalW) * barMax * base;
      x.fillStyle = "#2a2928";
      x.fillRect(x0, rowY, barMax * base + 4, 22);
      x.fillStyle = j === 3 ? "#8b7aa8" : j === 2 ? "#5ba3b5" : "#5a9a6e";
      x.fillRect(x0, rowY, bw, 22);
      x.fillStyle = "#e7e5e2";
      x.font = "11px JetBrains Mono, ui-monospace, monospace";
      x.fillText(phases[j].name, 12, rowY + 15);
      if (j === tcpRowIndex) {
        x.fillStyle = "#8a8884";
        x.font = "8px JetBrains Mono, ui-monospace, monospace";
        x.fillText(
          "≠ 3-way timeline",
          x0 + barMax * base + 10,
          rowY + 15
        );
      }
    }
    x.fillStyle = "#6a6864";
    x.font = "9px JetBrains Mono, ui-monospace, monospace";
    x.fillText(
      "↑ Four rows = setup latency shares (toys). Next row = TCP control segments only.",
      12,
      rowYTcpTimeline - 6
    );

    /* --- TCP 3-way: separate time axis (not the same as the cost bar above) --- */
    var tlX0 = x0;
    var tlW = Math.max(120, barMax * base + 4);
    var tlY = rowYTcpTimeline;
    var tlMid = tlY + 22;
    x.fillStyle = "#e7e5e2";
    x.font = "10px JetBrains Mono, ui-monospace, monospace";
    x.fillText("TCP 3-way only: SYN → SYN-ACK → ACK (order on the wire)", 12, tlY + 12);
    x.strokeStyle = "#444444";
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(tlX0, tlMid);
    x.lineTo(tlX0 + tlW, tlMid);
    x.stroke();
    x.fillStyle = "#666666";
    x.font = "9px JetBrains Mono, ui-monospace, monospace";
    x.fillText("time →", tlX0 + tlW - 38, tlMid - 8);
    var tripLabels = [
      { t: "SYN", sub: "client → server" },
      { t: "SYN-ACK", sub: "server → client" },
      { t: "ACK", sub: "client → server" },
    ];
    var nSeg = tripLabels.length;
    x.textAlign = "center";
    for (var s = 0; s < nSeg; s++) {
      var frac = (s + 0.5) / nSeg;
      var cx = tlX0 + frac * tlW;
      x.fillStyle = s === 1 ? "#4a7a8a" : "#4d8a5c";
      x.beginPath();
      x.arc(cx, tlMid, 6, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = "#f2f0ed";
      x.font = "9px JetBrains Mono, ui-monospace, monospace";
      x.fillText(tripLabels[s].t, cx, tlMid + 22);
      x.fillStyle = "#777777";
      x.font = "8px JetBrains Mono, ui-monospace, monospace";
      x.fillText(tripLabels[s].sub, cx, tlMid + 34);
      if (s < nSeg - 1) {
        var cx2 = tlX0 + ((s + 1.5) / nSeg) * tlW;
        x.strokeStyle = "#555555";
        x.setLineDash([3, 3]);
        x.beginPath();
        x.moveTo(cx + 8, tlMid);
        x.lineTo(cx2 - 8, tlMid);
        x.stroke();
        x.setLineDash([]);
        x.fillStyle = "#666666";
        x.font = "8px JetBrains Mono, ui-monospace, monospace";
        x.fillText("≤ ½ RTT", (cx + cx2) / 2, tlMid - 10);
      }
    }
    x.textAlign = "left";
    x.fillStyle = "#888888";
    x.font = "9px JetBrains Mono, ui-monospace, monospace";
    x.fillText(
      "Green bar above = how long “TCP setup” is budgeted to take. This axis = which segments fire, not duration.",
      tlX0,
      tlY + 52
    );

    /* --- cwnd strip --- */
    x.fillStyle = "#1f1e1d";
    x.fillRect(12, cwndBandY0, w - 24, cwndBandH);
    x.strokeStyle = "#333333";
    x.strokeRect(12, cwndBandY0, w - 24, cwndBandH);
    x.fillStyle = "#666666";
    x.font = "10px JetBrains Mono, ui-monospace, monospace";
    x.fillText(
      "Congestion window (toy): shrinks on loss / retransmit; grows between good RTTs",
      20,
      cwndBandY0 + 14
    );

    cwndHist.push(cwnd);
    if (cwndHist.length > cwndHistMax) cwndHist.shift();
    var cmax = 2;
    for (var hi = 0; hi < cwndHist.length; hi++) cmax = Math.max(cmax, cwndHist[hi]);
    var plotL = 20;
    var plotR = w - 20;
    var plotB = cwndBandY0 + cwndBandH - 6;
    var plotT = cwndBandY0 + 22;
    x.strokeStyle = "#333333";
    x.beginPath();
    x.moveTo(plotL, plotB);
    x.lineTo(plotR, plotB);
    x.stroke();
    if (cwndHist.length > 1) {
      x.strokeStyle = "#5ba3b5";
      x.lineWidth = 1.5;
      x.beginPath();
      var span = Math.max(1, cwndHist.length - 1);
      for (var pi = 0; pi < cwndHist.length; pi++) {
        var pxp = plotL + (pi / span) * (plotR - plotL);
        var norm = cwndHist[pi] / cmax;
        var pyp = plotB - norm * (plotB - plotT);
        if (pi === 0) x.moveTo(pxp, pyp);
        else x.lineTo(pxp, pyp);
      }
      x.stroke();
      x.lineWidth = 1;
    }

    x.strokeStyle = "#333333";
    x.beginPath();
    x.moveTo(0, splitY);
    x.lineTo(w, splitY);
    x.stroke();

    /* --- Packet stream (bottom) --- */
    var cxL = 70;
    var cxR = w - 70;
    x.strokeStyle = "#2a2928";
    x.setLineDash([6, 6]);
    x.beginPath();
    x.moveTo(cxL, splitY + 24);
    x.lineTo(cxL, h - 30);
    x.moveTo(cxR, splitY + 24);
    x.lineTo(cxR, h - 30);
    x.stroke();
    x.setLineDash([]);
    x.fillStyle = "#666666";
    x.font = "10px JetBrains Mono, ui-monospace, monospace";
    x.fillText("client", cxL - 18, splitY + 18);
    x.fillText("server", cxR - 22, splitY + 18);

    var speed = 420 / Math.max(40, rtt);
    if (Math.random() < 0.045) spawn();
    for (var k = 0; k < pkt.length; k++) {
      var pk = pkt[k];
      if (!pk.y) pk.y = splitY + 40 + Math.random() * (h - splitY - 70);
      pk.pos += speed * 0.016 * pk.dir;
      if (pk.dir === 1 && pk.pos >= 1) {
        pk.pos = 1;
        if (Math.random() * 100 < lossPct) {
          pk.dir = -1;
          pk.pos = 0.88;
          retransmitCount++;
          cwnd = Math.max(2, cwnd * 0.72);
        } else {
          pk.dir = -1;
        }
      } else if (pk.dir === -1 && pk.pos <= 0) {
        pk.pos = 0;
        pk.dir = 1;
        cwnd = Math.min(96, cwnd + 0.9 + (96 - cwnd) * 0.004);
      }
      var px = cxL + clamp(pk.pos, 0, 1) * (cxR - cxL);
      x.fillStyle = pk.hue;
      x.beginPath();
      x.arc(px, pk.y, 5, 0, Math.PI * 2);
      x.fill();
    }
    if (pkt.length > 22) pkt.splice(0, pkt.length - 22);

    var tputIdx = (cwnd / Math.max(40, rtt)) * 420;
    if (mTput) mTput.textContent = tputIdx.toFixed(2);
    if (mRetx) mRetx.textContent = String(retransmitCount);
    if (mCwnd) mCwnd.textContent = cwnd.toFixed(1);

    x.fillStyle = "#666666";
    x.font = "9px JetBrains Mono, ui-monospace, monospace";
    x.fillText(
      "Stream: forward = in flight · reverse = loss/retransmit",
      cxL - 18,
      h - 20
    );
    x.fillStyle = "#5ba3b5";
    x.font = "10px JetBrains Mono, ui-monospace, monospace";
    x.fillText("Retransmit count (session): " + retransmitCount, cxL - 18, h - 10);
    x.fillStyle = "#c9c7c3";
    x.fillText("Throughput index: " + tputIdx.toFixed(2), cxR - 188, h - 10);

    if (r)
      r.innerHTML =
        "<strong>Throughput index:</strong> " +
        tputIdx.toFixed(2) +
        " · <strong>Retransmit count (session):</strong> " +
        retransmitCount +
        " · <strong>cwnd:</strong> " +
        cwnd.toFixed(1) +
        " (toy) · <strong>Loss:</strong> " +
        lossPct +
        "% · <strong>RTT:</strong> " +
        rtt +
        " ms<br><span style=\"color:var(--text-secondary);font-size:13px;line-height:1.5\">Higher RTT stretches flight time; loss triggers retransmits and shrinks cwnd in this toy coupling. Same numbers appear in the metric cells above.</span>";

    requestAnimationFrame(draw);
  }
  var resetBtn = document.getElementById("reset-stream-metrics");
  if (resetBtn)
    resetBtn.addEventListener("click", function () {
      retransmitCount = 0;
      cwnd = 12;
      cwndHist = [];
    });

  requestAnimationFrame(draw);
})();
