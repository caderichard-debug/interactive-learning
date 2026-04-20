(function () {
  var cPart = document.getElementById("viz-partition");
  var cTerm = document.getElementById("viz-term");
  var cLog = document.getElementById("viz-log");
  var xPart = cPart ? cPart.getContext("2d") : null;
  var xTerm = cTerm ? cTerm.getContext("2d") : null;
  var xLog = cLog ? cLog.getContext("2d") : null;
  var s1 = document.getElementById("s1");
  var s2 = document.getElementById("s2");
  var sev = document.getElementById("sev");
  var qEl = document.getElementById("q");
  var rPart = document.getElementById("readout-partition");
  var rTerm = document.getElementById("readout-term");
  var rLog = document.getElementById("readout-log");

  var nodes = 9;
  var cx = 430;
  var cy = 148;
  var rad = 118;
  var partDirty = false;

  function drawPartition() {
    if (!xPart || !cPart) return;
    var part = s1 ? Number(s1.value) / 100 : 0.35;
    var quorumFrac = s2 ? Number(s2.value) / 100 : 0.51;
    if (sev) sev.textContent = s1 ? String(s1.value) : "";
    if (qEl) qEl.textContent = s2 ? String(s2.value) : "";

    var w = cPart.width;
    var h = cPart.height;
    xPart.clearRect(0, 0, w, h);

    var isolatedCount = Math.round(part * (nodes - 1));
    var reachable = nodes - isolatedCount;
    var needVotes = Math.ceil(nodes * quorumFrac);
    var canWrite = reachable >= needVotes;

    xPart.fillStyle = "rgba(42, 41, 40, 0.92)";
    xPart.strokeStyle = "rgba(231, 229, 226, 0.2)";
    xPart.lineWidth = 1;
    xPart.fillRect(16, 8, w - 32, 44);
    xPart.strokeRect(16, 8, w - 32, 44);
    xPart.fillStyle = "#b8b6b3";
    xPart.font = "10px JetBrains Mono, ui-monospace, monospace";
    xPart.textAlign = "left";
    xPart.fillText(
      "N = " +
        nodes +
        "   ·   quorum rule: ≥ " +
        needVotes +
        " votes (" +
        (s2 ? s2.value : "51") +
        "% of N)   ·   majority side: " +
        reachable +
        " reachable   ·   isolated: " +
        isolatedCount,
      28,
      26
    );
    xPart.fillStyle = canWrite ? "rgba(90, 154, 110, 0.95)" : "rgba(199, 90, 90, 0.95)";
    xPart.fillText(
      "strict quorum write: " + (canWrite ? "OK (reachable ≥ votes needed)" : "BLOCKED (reachable < votes needed)"),
      28,
      42
    );

    var base = 0;
    var cutAng = (Math.PI * 2 * (isolatedCount - 0.5)) / nodes + base;
    var ix = cx + Math.cos(cutAng) * rad * 0.42;
    var iy = cy + Math.sin(cutAng) * rad * 0.72 * 0.72;
    var ox = cx + Math.cos(cutAng) * rad * 1.28;
    var oy = cy + Math.sin(cutAng) * rad * 1.28 * 0.72;
    xPart.save();
    xPart.setLineDash([6, 6]);
    xPart.strokeStyle = "rgba(231, 229, 226, 0.45)";
    xPart.lineWidth = 2;
    xPart.beginPath();
    xPart.moveTo(ix, iy);
    xPart.lineTo(ox, oy);
    xPart.stroke();
    xPart.restore();
    xPart.fillStyle = "#888888";
    xPart.font = "10px JetBrains Mono, ui-monospace, monospace";
    xPart.textAlign = "center";
    xPart.fillText("partition cut (topology)", (ix + ox) / 2 + 28, (iy + oy) / 2 - 8);

    var sumRx = 0;
    var sumRy = 0;
    var sumIx = 0;
    var sumIy = 0;
    var nR = 0;
    var nI = 0;
    for (var i = 0; i < nodes; i++) {
      var ang = (Math.PI * 2 * i) / nodes + base;
      var px = cx + Math.cos(ang) * rad;
      var py = cy + Math.sin(ang) * rad * 0.72;
      var isolated = i < isolatedCount;
      if (isolated) {
        sumIx += px;
        sumIy += py;
        nI++;
      } else {
        sumRx += px;
        sumRy += py;
        nR++;
      }
    }
    if (nR > 0) {
      xPart.fillStyle = "rgba(91, 163, 181, 0.12)";
      xPart.font = "700 9px Inter, system-ui, sans-serif";
      xPart.textAlign = "center";
      xPart.fillText("reachable (majority side)", sumRx / nR, sumRy / nR - 22);
    }
    if (nI > 0) {
      xPart.fillStyle = "rgba(199, 90, 90, 0.15)";
      xPart.font = "700 9px Inter, system-ui, sans-serif";
      xPart.textAlign = "center";
      xPart.fillText("isolated slice", sumIx / nI, sumIy / nI - 22);
    }

    for (var j = 0; j < nodes; j++) {
      var ang2 = (Math.PI * 2 * j) / nodes + base;
      var px2 = cx + Math.cos(ang2) * rad;
      var py2 = cy + Math.sin(ang2) * rad * 0.72;
      var iso = j < isolatedCount;
      xPart.beginPath();
      xPart.arc(px2, py2, 12, 0, Math.PI * 2);
      xPart.fillStyle = iso ? "#c75a5a" : "#5ba3b5";
      xPart.fill();
      xPart.fillStyle = "#2a2928";
      xPart.font = "9px JetBrains Mono, ui-monospace, monospace";
      xPart.textAlign = "center";
      xPart.fillText(iso ? "iso" : "ok", px2, py2 + 26);
    }

    xPart.textAlign = "left";
    xPart.fillStyle = "#888888";
    xPart.font = "10px JetBrains Mono, ui-monospace, monospace";
    xPart.fillText("legend", 16, 118);
    xPart.fillStyle = "#c75a5a";
    xPart.fillRect(16, 124, 10, 10);
    xPart.fillStyle = "#e7e5e2";
    xPart.fillText("isolated (minority side of cut)", 32, 133);
    xPart.fillStyle = "#5ba3b5";
    xPart.fillRect(16, 140, 10, 10);
    xPart.fillStyle = "#e7e5e2";
    xPart.fillText("reachable on majority side", 32, 149);

    var barY = h - 40;
    var barX = 24;
    var barTotalW = w - 48;
    var unitW = barTotalW / nodes;
    xPart.fillStyle = "#2a2928";
    xPart.fillRect(barX, barY, barTotalW, 14);
    xPart.fillStyle = "rgba(91, 163, 181, 0.85)";
    xPart.fillRect(barX, barY, unitW * reachable, 14);
    xPart.fillStyle = "rgba(231, 229, 226, 0.25)";
    xPart.fillRect(barX + unitW * reachable, barY, barTotalW - unitW * reachable, 14);
    var needX = barX + unitW * needVotes;
    xPart.strokeStyle = "#e07060";
    xPart.lineWidth = 2;
    xPart.beginPath();
    xPart.moveTo(needX, barY - 3);
    xPart.lineTo(needX, barY + 17);
    xPart.stroke();
    xPart.fillStyle = "#e7e5e2";
    xPart.font = "9px JetBrains Mono, ui-monospace, monospace";
    xPart.textAlign = "center";
    xPart.fillText("need", needX, barY - 6);
    xPart.textAlign = "left";
    xPart.fillStyle = "#888888";
    xPart.font = "10px JetBrains Mono, ui-monospace, monospace";
    xPart.fillText("reachable count (blue segments) vs quorum threshold (red tick)", barX, barY + 28);

    if (rPart) {
      rPart.innerHTML =
        "<strong>Topology knob:</strong> partition severity moves the cut and changes how many replicas sit on the <strong>reachable</strong> side — it does <em>not</em> change N or the quorum formula.<br><strong>Policy knob:</strong> quorum threshold sets <strong>ceil(N × %)</strong> on the <em>full</em> membership.<br><strong>Strict quorum writes:</strong> " +
        (canWrite
          ? "<span style=\"color:#5a9a6e\">reachable (" +
            reachable +
            ") ≥ votes needed (" +
            needVotes +
            ")</span>"
          : "<span style=\"color:#c75a5a\">reachable (" +
            reachable +
            ") &lt; votes needed (" +
            needVotes +
            ") → blocked for strict quorum on this side</span>") +
        "<br><span style=\"color:var(--text-secondary);font-size:13px;line-height:1.55\">Same quorum number as in leader election — sketch 2 — but there the limit is <em>grants in a term</em>; here the limit is <em>who is reachable after a cut</em>.</span>";
    }
  }

  function drawTerm(tSec) {
    if (!xTerm || !cTerm) return;
    var ph = Math.floor(tSec % 8);
    var w = cTerm.width;
    var h = cTerm.height;
    xTerm.clearRect(0, 0, w, h);

    var term = 5;
    var roles = ["F", "F", "F", "F"];
    var caption = "";
    if (ph === 0) {
      term = 5;
      caption = "Steady followers — need a new leader after a timeout (term " + term + ").";
    } else if (ph === 1) {
      term = 6;
      roles = ["C", "F", "C", "F"];
      caption = "Two candidates bump the term — split candidacy.";
    } else if (ph === 2) {
      term = 6;
      roles = ["C", "F", "C", "F"];
      caption = "Split vote: neither side has a majority of grants — election fails.";
    } else if (ph === 3) {
      term = 6;
      roles = ["F", "F", "F", "F"];
      caption = "Randomized backoff, then retry (jitter avoids synchronized storms).";
    } else if (ph === 4) {
      term = 7;
      roles = ["F", "C", "F", "F"];
      caption = "One candidate with a higher term — collects votes.";
    } else if (ph === 5) {
      term = 7;
      roles = ["F", "L", "F", "F"];
      caption = "Majority grants → leader for term " + term + " (toy: 3 of 4 would be a majority).";
    } else if (ph === 6) {
      term = 7;
      roles = ["F", "L", "F", "F"];
      caption = "Stable leader window — append entries in sketch 3.";
    } else {
      term = 7;
      roles = ["F", "L", "F", "F"];
      caption = "Hold — loop restarts.";
    }

    xTerm.fillStyle = "rgba(42, 41, 40, 0.92)";
    xTerm.fillRect(16, 10, w - 32, 36);
    xTerm.strokeStyle = "rgba(231, 229, 226, 0.2)";
    xTerm.strokeRect(16, 10, w - 32, 36);
    xTerm.fillStyle = "#e7e5e2";
    xTerm.font = "700 12px JetBrains Mono, ui-monospace, monospace";
    xTerm.textAlign = "left";
    xTerm.fillText("term " + String(term), 28, 32);

    var labels = ["S1", "S2", "S3", "S4"];
    var xs = [56, 236, 416, 596];
    var pal = { F: { fill: "rgba(91, 163, 181, 0.35)", stroke: "#5ba3b5", lab: "follower" }, C: { fill: "rgba(201, 168, 108, 0.4)", stroke: "#c9a86c", lab: "candidate" }, L: { fill: "rgba(224, 112, 96, 0.45)", stroke: "#e07060", lab: "leader" } };
    for (var r = 0; r < 4; r++) {
      var role = roles[r];
      var p = pal[role];
      var x = xs[r];
      var y = 62;
      xTerm.fillStyle = p.fill;
      xTerm.strokeStyle = p.stroke;
      xTerm.lineWidth = 2;
      xTerm.beginPath();
      xTerm.rect(x, y, 132, 52);
      xTerm.fill();
      xTerm.stroke();
      xTerm.fillStyle = "#e7e5e2";
      xTerm.font = "700 11px Inter, system-ui, sans-serif";
      xTerm.textAlign = "left";
      xTerm.fillText(labels[r], x + 12, y + 22);
      xTerm.fillStyle = "#b8b6b3";
      xTerm.font = "10px JetBrains Mono, ui-monospace, monospace";
      xTerm.fillText(role + " · " + p.lab, x + 12, y + 40);
    }

    xTerm.fillStyle = "#888888";
    xTerm.font = "10px JetBrains Mono, ui-monospace, monospace";
    xTerm.textAlign = "left";
    xTerm.fillText("majority here = 3 of 4 replicas — aligns with the log sketch below", 16, h - 14);

    if (rTerm) {
      rTerm.innerHTML =
        "<strong>Step " +
        (ph + 1) +
        "/8:</strong> " +
        caption +
        "<br><span style=\"color:var(--text-secondary);font-size:13px;line-height:1.55\">Not Raft verbatim: omits log comparison on RequestVote, prevote, and membership changes. Links: <a href=\"chapters/leader-election.html\" style=\"color:var(--accent-primary)\">Leader election</a>.</span>";
    }
  }

  function followerMaxEntry(ph, replicaIdx) {
    var maxBase = 3;
    if (ph <= 0) return maxBase;
    if (ph >= 5) return 4;
    if (ph === 4) return replicaIdx < 3 ? 4 : maxBase;
    if (ph === 3) return replicaIdx < 2 ? 4 : maxBase;
    if (ph === 2) return replicaIdx < 1 ? 4 : maxBase;
    if (ph === 1) return maxBase;
    return maxBase;
  }

  function isCommitted(ph, replicaIdx, entryIdx) {
    if (entryIdx <= 3) return true;
    if (entryIdx !== 4) return false;
    var on4 = followerMaxEntry(ph, replicaIdx) >= 4;
    var countOn4 = 0;
    for (var f = 0; f < 4; f++) {
      if (followerMaxEntry(ph, f) >= 4) countOn4++;
    }
    return on4 && countOn4 >= 3;
  }

  function drawLog(tSec) {
    if (!xLog || !cLog) return;
    var ph = Math.floor(tSec % 7);
    var w = cLog.width;
    var h = cLog.height;
    xLog.clearRect(0, 0, w, h);

    var term = 4;
    var labels = ["L", "F1", "F2", "F3"];
    var roles = ["Leader", "Follower", "Follower", "Follower"];
    var xs = [72, 232, 392, 552];

    for (var r = 0; r < 4; r++) {
      var maxE = followerMaxEntry(ph, r);
      var pulse = ph === 0 && r === 0;
      xLog.fillStyle = r === 0 ? "#c9a86c" : "#4a6b8a";
      xLog.font = "700 11px Inter, system-ui, sans-serif";
      xLog.textAlign = "left";
      xLog.fillText(labels[r] + " · " + roles[r], xs[r], 28);
      if (pulse) {
        xLog.strokeStyle = "rgba(201, 168, 108, 0.9)";
        xLog.lineWidth = 2;
        xLog.strokeRect(xs[r] - 4, 10, 168, 22);
      }
      xLog.fillStyle = "#888888";
      xLog.font = "9px JetBrains Mono, ui-monospace, monospace";
      xLog.fillText("term " + String(term), xs[r], 44);

      var bx = xs[r];
      var by = 58;
      for (var e = 1; e <= 4; e++) {
        if (e > maxE) break;
        var committed = isCommitted(ph, r, e);
        var pending = e === 4 && !committed;
        xLog.fillStyle = pending ? "rgba(201, 168, 108, 0.35)" : committed ? "rgba(90, 154, 110, 0.35)" : "rgba(91, 163, 181, 0.25)";
        xLog.strokeStyle = pending ? "#c9a86c" : committed ? "#5a9a6e" : "#5ba3b5";
        xLog.lineWidth = pending ? 2 : 1;
        xLog.fillRect(bx, by, 26, 22);
        xLog.strokeRect(bx, by, 26, 22);
        xLog.fillStyle = "#e7e5e2";
        xLog.font = "700 10px JetBrains Mono, ui-monospace, monospace";
        xLog.textAlign = "center";
        xLog.fillText(String(e), bx + 13, by + 15);
        bx += 32;
      }
    }

    xLog.textAlign = "left";
    xLog.fillStyle = "#888888";
    xLog.font = "10px JetBrains Mono, ui-monospace, monospace";
    xLog.fillText("N=4 → majority = 3 replicas holding index 4 · phase " + String(ph + 1) + "/7", 16, h - 16);

    if (rLog) {
      var msgs = [
        "<strong>Election settled:</strong> leader highlighted; all logs share committed prefix <strong>1–3</strong>.",
        "Stable prefix <strong>1–3</strong> on every replica before new work.",
        "Leader appends index <strong>4</strong> locally — not yet replicated.",
        "First follower receives <strong>4</strong>; still only two copies of the new slot.",
        "Second follower receives <strong>4</strong>; <strong>three of four</strong> hold it → toy commit coloring on three replicas.",
        "Third follower catches up — whole cluster stores index <strong>4</strong>.",
        "Hold frame — loop restarts."
      ];
      rLog.innerHTML =
        "<strong>Step " +
        (ph + 1) +
        "/7:</strong> " +
        msgs[ph] +
        "<br><span style=\"color:var(--text-secondary);font-size:13px;line-height:1.55\">Real Raft tracks matchIndex/nextIndex and fsync policies; this is a happy path only.</span>";
    }
  }

  function frame(ts) {
    var tSec = ts / 1000;
    if (partDirty) {
      partDirty = false;
      drawPartition();
    }
    drawTerm(tSec);
    drawLog(tSec);
    requestAnimationFrame(frame);
  }

  if (xPart || xTerm || xLog) {
    partDirty = !!xPart;
    requestAnimationFrame(frame);
  }

  function onSlide() {
    drawPartition();
  }
  if (s1) s1.addEventListener("input", onSlide);
  if (s2) s2.addEventListener("input", onSlide);
})();
