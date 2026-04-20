(function () {
  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function read(id) {
    var el = document.getElementById(id);
    if (!el) return 0;
    var v = Number(el.value);
    return isFinite(v) ? v : 0;
  }

  function label(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(val);
  }

  function paybackLabel(payback) {
    if (!isFinite(payback) || payback < 0) return "—";
    if (payback >= 999) return "∞";
    if (payback > 72) return ">72 mo";
    return payback.toFixed(1) + " mo";
  }

  var t = 0;
  var cf = document.getElementById("viz-funnel");
  var ce = document.getElementById("viz-econ");
  var cm = document.getElementById("viz-mrr");
  var cc = document.getElementById("viz-cohort");

  function frame(now) {
    t += 0.02;
    var vis = read("f-vis");
    var c1 = clamp(read("f-c1") / 100, 0.001, 0.999);
    var c2 = clamp(read("f-c2") / 100, 0.001, 0.999);
    var c3 = clamp(read("f-c3") / 100, 0.001, 0.999);
    var c4 = clamp(read("f-c4") / 100, 0.001, 0.999);
    label("v-vis", vis);
    label("v-c1", Math.round(c1 * 100));
    label("v-c2", Math.round(c2 * 100));
    label("v-c3", Math.round(c3 * 100));
    label("v-c4", Math.round(c4 * 100));

    var n1 = Math.max(0, Math.round(vis));
    var n2 = Math.round(n1 * c1);
    var n3 = Math.round(n2 * c2);
    var n4 = Math.round(n3 * c3);
    var n5 = Math.round(n4 * c4);
    var stages = [n1, n2, n3, n4, n5];
    var rf = document.getElementById("readout-funnel");
    if (rf)
      rf.innerHTML =
        "<strong>Stage counts:</strong> " +
        n1.toLocaleString() +
        " → " +
        n2.toLocaleString() +
        " → " +
        n3.toLocaleString() +
        " → " +
        n4.toLocaleString() +
        " → " +
        n5.toLocaleString() +
        " <span style=\"color:var(--text-secondary)\">(toy linear funnel)</span>";

    if (cf) {
      var xf = cf.getContext("2d");
      var wf = cf.width;
      var hf = cf.height;
      xf.clearRect(0, 0, wf, hf);
      var maxN = Math.max(1, n1);
      var bw = (wf - 80) / stages.length;
      for (var i = 0; i < stages.length; i++) {
        var frac = stages[i] / maxN;
        var hbar = 24 + frac * (hf - 70);
        var x = 40 + i * bw + 6;
        var pulse = 0.92 + 0.08 * Math.sin(t + i * 0.4);
        xf.fillStyle =
          i === stages.length - 1
            ? "rgba(224,112,96,0.85)"
            : "rgba(91,163,181," + (0.35 + 0.45 * pulse) + ")";
        xf.fillRect(x, hf - 40 - hbar, bw - 12, hbar);
        xf.fillStyle = "#888888";
        xf.font = "10px JetBrains Mono, ui-monospace, monospace";
        xf.fillText(String(i + 1), x + 4, hf - 18);
      }
    }

    var cac = Math.max(0, read("e-cac"));
    var mrr = Math.max(0, read("e-mrr"));
    var mar = clamp(read("e-mar") / 100, 0, 1);
    var lifeMo = Math.max(0, read("e-life"));
    var trimPts = clamp(read("e-ltvtrim"), 0, 35);
    label("v-cac", cac);
    label("v-mrr", mrr);
    label("v-mar", Math.round(mar * 100));
    label("v-life", lifeMo);
    label("v-ltvtrim", Math.round(trimPts));

    var contrib = mrr * mar;
    var payback = contrib > 1e-9 ? cac / contrib : Infinity;
    var ltv = contrib * lifeMo;
    var stressedMar = clamp(mar - trimPts / 100, 0, 1);
    var ltvDownside = mrr * stressedMar * lifeMo;
    var ltvCac = cac > 1e-9 && isFinite(ltv) ? ltv / cac : Infinity;
    var lifeLow = Math.max(6, lifeMo * 0.8);
    var lifeHigh = Math.min(96, lifeMo * 1.2);
    var ltvAtLowLife = contrib * lifeLow;
    var ltvAtHighLife = contrib * lifeHigh;
    var ltvMrrLow = mrr * 0.85 * mar * lifeMo;
    var ltvMrrHigh = mrr * 1.15 * mar * lifeMo;
    var ltvStr = isFinite(ltv) ? "$" + ltv.toFixed(0) : "—";

    var re = document.getElementById("readout-econ");
    if (re) {
      var bandStr =
        isFinite(ltv) && contrib > 1e-9
          ? " · <strong>LTV if lifetime ±20%:</strong> $" +
            ltvAtLowLife.toFixed(0) +
            "–$" +
            ltvAtHighLife.toFixed(0)
          : "";
      var mrrBandStr =
        isFinite(ltv) && mar > 1e-9 && lifeMo > 0
          ? " · <strong>LTV if net MRR ±15%:</strong> $" +
            ltvMrrLow.toFixed(0) +
            "–$" +
            ltvMrrHigh.toFixed(0)
          : "";
      var downsideStr =
        trimPts > 0 && isFinite(ltvDownside) && lifeMo > 0
          ? " · <strong>LTV @ −" +
            trimPts.toFixed(0) +
            " pp margin:</strong> $" +
            ltvDownside.toFixed(0)
          : "";
      var ratioStr =
        isFinite(ltvCac) && ltvCac < 1e6
          ? ltvCac.toFixed(2) + "×"
          : cac <= 1e-9
            ? "n/a"
            : "∞";
      re.innerHTML =
        "<strong>Monthly contribution:</strong> $" +
        contrib.toFixed(0) +
        " · <strong>CAC payback:</strong> " +
        paybackLabel(payback) +
        "<br><strong>Toy LTV:</strong> " +
        ltvStr +
        " · <strong>LTV : CAC:</strong> " +
        ratioStr +
        bandStr +
        mrrBandStr +
        downsideStr +
        " <span style=\"color:var(--text-secondary);font-size:13px\">(undiscounted; sanity-check vs cohort NRR)</span>";
    }

    if (ce) {
      var xe = ce.getContext("2d");
      var we = ce.width;
      var he = ce.height;
      xe.clearRect(0, 0, we, he);
      var cap = 36;
      var paybackArc =
        isFinite(payback) && payback >= 0 && payback < 1e6
          ? Math.min(payback, 72)
          : null;
      var pb =
        paybackArc === null ? 0 : clamp(paybackArc, 0, cap);
      var cxL = we * 0.22;
      var cyA = he - 10;
      xe.strokeStyle = "#2a2928";
      xe.lineWidth = 8;
      xe.beginPath();
      xe.arc(cxL, cyA, 58, Math.PI, Math.PI + Math.PI, false);
      xe.stroke();
      xe.strokeStyle =
        paybackArc === null
          ? "#555555"
          : paybackArc <= 18
            ? "#5a9a6e"
            : paybackArc <= 30
              ? "#c9a86c"
              : "#c75a5a";
      xe.lineWidth = 8;
      xe.beginPath();
      xe.arc(cxL, cyA, 58, Math.PI, Math.PI + (pb / cap) * Math.PI, false);
      xe.stroke();
      xe.fillStyle = "#e7e5e2";
      xe.font = "12px JetBrains Mono, ui-monospace, monospace";
      xe.textAlign = "center";
      xe.fillText("payback " + paybackLabel(payback), cxL, cyA - 74);
      if (isFinite(ltv) && ltv > 0) {
        xe.font = "11px JetBrains Mono, ui-monospace, monospace";
        xe.fillStyle = "#a8a6a3";
        xe.fillText("LTV " + ltvStr, cxL, cyA - 90);
      }

      var bx0 = we * 0.48;
      var bx1 = we * 0.94;
      var bwBar = bx1 - bx0;
      var byM = he * 0.42;
      var bh = 22;
      xe.fillStyle = "#2a2928";
      xe.fillRect(bx0, byM, bwBar, bh);
      var ratioCap = 5;
      var fillFrac = isFinite(ltvCac) ? clamp(ltvCac / ratioCap, 0, 1) : 0;
      var pulseE = 0.92 + 0.08 * Math.sin(t * 1.2);
      xe.fillStyle =
        isFinite(ltvCac) && ltvCac >= 3
          ? "rgba(90,154,110," + (0.55 + 0.25 * pulseE) + ")"
          : "rgba(91,163,181," + (0.45 + 0.3 * pulseE) + ")";
      xe.fillRect(bx0, byM, bwBar * fillFrac, bh);
      xe.strokeStyle = "#444444";
      xe.lineWidth = 1;
      xe.strokeRect(bx0, byM, bwBar, bh);
      xe.textAlign = "left";
      xe.fillStyle = "#888888";
      xe.font = "10px JetBrains Mono, ui-monospace, monospace";
      xe.fillText("LTV:CAC (0–" + ratioCap + "×)", bx0, byM - 8);
      xe.textAlign = "right";
      xe.fillStyle = "#e7e5e2";
      xe.font = "12px JetBrains Mono, ui-monospace, monospace";
      xe.fillText(
        isFinite(ltvCac) && ltvCac < 1e6 ? ltvCac.toFixed(2) + "×" : "—",
        bx1,
        byM + 16
      );
      xe.textAlign = "left";
    }

    var m0 = Math.max(0, read("m-m0"));
    var mNew = Math.max(0, read("m-new"));
    var mExp = Math.max(0, read("m-exp"));
    var mCont = Math.max(0, read("m-cont"));
    var mChurn = Math.max(0, read("m-churn"));
    label("v-m0", m0);
    label("v-mn", mNew);
    label("v-me", mExp);
    label("v-mc", mCont);
    label("v-mch", mChurn);
    var netK = mNew + mExp - mCont - mChurn;
    var sumEnd = m0 + netK;
    var endK = Math.max(0, sumEnd);
    var rm = document.getElementById("readout-mrr");
    if (rm) {
      var sign = netK >= 0 ? "+" : "";
      var grossIn = mNew + mExp;
      var grossOut = mCont + mChurn;
      var denom = grossIn + grossOut;
      var compStr = "";
      if (denom > 1e-9) {
        compStr =
          " <strong>Composition:</strong> " +
          ((100 * grossIn) / denom).toFixed(0) +
          "% of gross motion is adds (new+exp); " +
          ((100 * grossOut) / denom).toFixed(0) +
          "% is drag (cont+churn).";
      }
      var qual =
        grossOut > 1e-9
          ? " <strong>Expansion vs churn:</strong> $" +
            mExp.toFixed(0) +
            "k exp for $" +
            mChurn.toFixed(0) +
            "k churn."
          : "";
      rm.innerHTML =
        "<strong>Net MRR change:</strong> " +
        sign +
        netK.toFixed(0) +
        " $k · <strong>Ending MRR:</strong> " +
        endK.toFixed(0) +
        " $k" +
        compStr +
        qual +
        " <span style=\"color:var(--text-secondary);font-size:13px\">(single-period toy; not rolled cohort revenue)</span>";
    }

    if (cm) {
      var xm = cm.getContext("2d");
      var wm = cm.width;
      var hm = cm.height;
      xm.clearRect(0, 0, wm, hm);
      var labels = ["Start", "+New", "+Exp", "−Cont", "−Churn", "End"];
      var maxV = Math.max(
        100,
        m0,
        m0 + mNew + mExp,
        endK,
        sumEnd > 0 ? sumEnd : 0
      );
      var padL = 44;
      var padR = 20;
      var padB = 40;
      var padT = 24;
      var plotW = wm - padL - padR;
      var plotH = hm - padT - padB;
      var baseY = padT + plotH;
      var pulseM = 0.03 * Math.sin(t);

      function yOf(v) {
        var vv = Math.max(0, v);
        return baseY - (vv / maxV) * plotH;
      }

      xm.strokeStyle = "#333333";
      xm.lineWidth = 1;
      xm.beginPath();
      xm.moveTo(padL, baseY);
      xm.lineTo(wm - padR, baseY);
      xm.stroke();

      var nCol = labels.length;
      var slot = plotW / nCol;
      var colW = slot * 0.55;
      var colGap = (slot - colW) / 2;

      function colX(i) {
        return padL + i * slot + colGap;
      }

      xm.fillStyle = "rgba(91,163,181,0.45)";
      xm.fillRect(colX(0), yOf(m0), colW, baseY - yOf(m0));
      xm.strokeStyle = "#5ba3b5";
      xm.strokeRect(colX(0), yOf(m0), colW, baseY - yOf(m0));
      xm.fillStyle = "#e7e5e2";
      xm.font = "11px JetBrains Mono, ui-monospace, monospace";
      xm.textAlign = "center";
      xm.fillText(String(Math.round(m0)), colX(0) + colW / 2, yOf(m0) - 6 + pulseM * 6);

      var cum = m0;
      var deltas = [mNew, mExp, -mCont, -mChurn];
      var dcols = ["#5a9a6e", "#5ba3b5", "#c9a86c", "#c75a5a"];
      for (var di = 0; di < 4; di++) {
        var prev = cum;
        cum = cum + deltas[di];
        var prevClamped = Math.max(0, prev);
        var cumClamped = Math.max(0, cum);
        var y1 = baseY - (prevClamped / maxV) * plotH;
        var y2 = baseY - (cumClamped / maxV) * plotH;
        var top = Math.min(y1, y2);
        var hBar = Math.max(3, Math.abs(y2 - y1));
        var xi = colX(di + 1);
        xm.fillStyle = dcols[di];
        var breathe = 0.88 + 0.1 * Math.sin(t * 1.25 + di * 0.9);
        xm.globalAlpha = clamp(breathe, 0.55, 1);
        xm.fillRect(xi, top, colW, hBar);
        xm.globalAlpha = 1;
        var gl = xm.createLinearGradient(xi, top, xi + colW, top + hBar);
        gl.addColorStop(0, "rgba(255,255,255,0)");
        gl.addColorStop(
          0.55,
          "rgba(255,255,255," + (0.07 + 0.06 * Math.sin(t * 2.2 + di * 1.1)) + ")"
        );
        gl.addColorStop(1, "rgba(255,255,255,0)");
        xm.fillStyle = gl;
        xm.fillRect(xi, top, colW, hBar);
        xm.fillStyle = dcols[di];
        xm.strokeStyle = "#2a2928";
        xm.strokeRect(xi, top, colW, hBar);
        xm.fillStyle = "#e7e5e2";
        xm.fillText(
          (deltas[di] >= 0 ? "+" : "") + Math.round(deltas[di]),
          xi + colW / 2,
          top - 5
        );
        xm.strokeStyle = "#555555";
        xm.lineWidth = 1;
        xm.beginPath();
        xm.moveTo(colX(di) + colW, y1);
        xm.lineTo(xi, y1);
        xm.stroke();
      }

      var yLast = baseY - (Math.max(0, sumEnd) / maxV) * plotH;
      var yEndTop = yOf(endK);
      var hEnd = Math.max(4, baseY - yEndTop);
      var yEndRect = baseY - hEnd;
      xm.strokeStyle = "#555555";
      xm.beginPath();
      xm.moveTo(colX(4) + colW, yLast);
      xm.lineTo(colX(5), yEndRect);
      xm.stroke();
      xm.fillStyle = "rgba(224,112,96,0.92)";
      xm.fillRect(colX(5), yEndRect, colW, hEnd);
      xm.strokeStyle = "#e07060";
      xm.strokeRect(colX(5), yEndRect, colW, hEnd);
      xm.fillStyle = "#e7e5e2";
      xm.fillText(String(Math.round(endK)), colX(5) + colW / 2, yEndRect - 6 + pulseM * 6);

      xm.fillStyle = "#888888";
      xm.font = "10px JetBrains Mono, ui-monospace, monospace";
      for (var li = 0; li < labels.length; li++) {
        xm.fillText(labels[li], colX(li) + colW / 2, hm - 14);
      }
      xm.textAlign = "left";
    }

    var ret = clamp(read("c-ret") / 100, 0.5, 0.9999);
    var rRev = clamp(read("c-revm") / 100, 0.5, 0.9999);
    var cash = Math.max(0, read("r-cash"));
    var burn = Math.max(0, read("r-burn"));
    label("v-ret", Math.round(ret * 100));
    label("v-revm", Math.round(rRev * 100));
    label("v-cash", cash);
    label("v-burn", burn);

    var runway = burn > 1e-9 ? cash / burn : Infinity;
    var rr = document.getElementById("readout-runway");
    if (rr) {
      var rwStr =
        burn <= 1e-9
          ? "∞ (no burn modeled)"
          : isFinite(runway)
            ? runway.toFixed(1) + " months at current burn"
            : "—";
      var cashLine =
        burn <= 1e-9
          ? "Cash $" + cash.toLocaleString() + "k held flat with $0 burn."
          : "Cash $" +
            cash.toLocaleString() +
            "k ÷ burn $" +
            burn.toLocaleString() +
            "k/mo.";
      var halfMo = burn > 1e-9 ? cash / (2 * burn) : 0;
      var balHalf =
        burn > 1e-9 ? Math.max(0, cash - halfMo * burn) : cash;
      var quarterMo = burn > 1e-9 ? cash / (4 * burn) : 0;
      var balQ = burn > 1e-9 ? Math.max(0, cash - quarterMo * burn) : cash;
      var projTable =
        burn > 1e-9 && isFinite(runway) && cash > 0
          ? "<br><strong>Forward cash snapshots ($k, linear):</strong> mo 0 → $" +
            cash.toFixed(0) +
            " · mo " +
            quarterMo.toFixed(1) +
            " → ~$" +
            balQ.toFixed(0) +
            " · mo " +
            halfMo.toFixed(1) +
            " → ~$" +
            balHalf.toFixed(0) +
            " · ~$0 at mo " +
            runway.toFixed(1) +
            " (matches month axis on the cash chart below)."
          : burn > 1e-9 && cash <= 0
            ? "<br><strong>Forward cash:</strong> already at or below $0 with positive burn—model inflows or cut burn."
            : "";
      rr.innerHTML =
        "<strong>Runway:</strong> " +
        rwStr +
        " (" +
        cashLine +
        ")" +
        projTable +
        "<br><span style=\"color:var(--text-secondary);font-size:13px\">Top: logo (solid) vs $ cohort (dashed). Bottom: linear cash vs month. Real stacks include inflows and step hires.</span>";
    }

    if (cc) {
      var xc = cc.getContext("2d");
      var wc = cc.width;
      var hc = cc.height;
      xc.clearRect(0, 0, wc, hc);
      var splitY = Math.floor(hc * 0.48);

      xc.strokeStyle = "#2a2928";
      xc.lineWidth = 1;
      xc.beginPath();
      xc.moveTo(40, splitY - 8);
      xc.lineTo(wc - 24, splitY - 8);
      xc.stroke();

      var months = 18;
      var baseLineY = splitY - 28;
      xc.strokeStyle = "#2a2928";
      xc.beginPath();
      xc.moveTo(40, splitY - 28);
      xc.lineTo(wc - 24, splitY - 28);
      xc.stroke();
      xc.beginPath();
      xc.moveTo(40, 24);
      xc.lineTo(40, splitY - 28);
      xc.stroke();
      var pts = [];
      for (var m = 0; m <= months; m++) {
        var px = 40 + (m / months) * (wc - 64);
        var rlogo = Math.pow(ret, m);
        var py = baseLineY - rlogo * (splitY - 52);
        pts.push({ x: px, y: py });
      }
      var gradA = xc.createLinearGradient(40, 24, 40, baseLineY);
      gradA.addColorStop(0, "rgba(91,163,181,0.22)");
      gradA.addColorStop(1, "rgba(91,163,181,0.02)");
      xc.fillStyle = gradA;
      xc.beginPath();
      xc.moveTo(pts[0].x, baseLineY);
      for (var pi = 0; pi < pts.length; pi++) {
        xc.lineTo(pts[pi].x, pts[pi].y);
      }
      xc.lineTo(pts[pts.length - 1].x, baseLineY);
      xc.closePath();
      xc.fill();
      xc.strokeStyle = "#5ba3b5";
      xc.lineWidth = 2;
      xc.beginPath();
      for (var m2 = 0; m2 <= months; m2++) {
        var px2 = 40 + (m2 / months) * (wc - 64);
        var rlogo2 = Math.pow(ret, m2);
        var py2 = baseLineY - rlogo2 * (splitY - 52);
        if (m2 === 0) xc.moveTo(px2, py2);
        else xc.lineTo(px2, py2);
      }
      xc.stroke();
      xc.setLineDash([6, 5]);
      xc.strokeStyle = "rgba(224,112,96,0.95)";
      xc.lineWidth = 2;
      xc.beginPath();
      for (var m3 = 0; m3 <= months; m3++) {
        var px3 = 40 + (m3 / months) * (wc - 64);
        var rrev3 = Math.pow(rRev, m3);
        var py3 = baseLineY - rrev3 * (splitY - 52);
        if (m3 === 0) xc.moveTo(px3, py3);
        else xc.lineTo(px3, py3);
      }
      xc.stroke();
      xc.setLineDash([]);
      xc.fillStyle = "#5ba3b5";
      for (var sp = 0; sp <= months; sp += 3) {
        var sxp = 40 + (sp / months) * (wc - 64);
        var sr = Math.pow(ret, sp);
        var syp = baseLineY - sr * (splitY - 52);
        xc.beginPath();
        xc.arc(sxp, syp, 2.5, 0, Math.PI * 2);
        xc.fill();
      }
      xc.fillStyle = "rgba(224,112,96,0.9)";
      for (var sp2 = 0; sp2 <= months; sp2 += 3) {
        var sxpr = 40 + (sp2 / months) * (wc - 64);
        var srr = Math.pow(rRev, sp2);
        var sypr = baseLineY - srr * (splitY - 52);
        xc.beginPath();
        xc.arc(sxpr, sypr, 2.2, 0, Math.PI * 2);
        xc.fill();
      }
      xc.fillStyle = "#888888";
      xc.font = "10px JetBrains Mono, ui-monospace, monospace";
      xc.textAlign = "center";
      for (var tk = 0; tk <= months; tk += 6) {
        var tx = 40 + (tk / months) * (wc - 64);
        xc.fillText(String(tk), tx, splitY - 8);
      }
      xc.textAlign = "left";
      xc.fillText(
        "logos (solid, r=" +
          Math.round(ret * 100) +
          "%) · $ cohort (dashed, r=" +
          Math.round(rRev * 100) +
          "%)",
        48,
        18
      );

      var cashTop = splitY + 16;
      var cashBot = hc - 32;
      var cashH = cashBot - cashTop;
      xc.strokeStyle = "#2a2928";
      xc.beginPath();
      xc.moveTo(40, cashBot);
      xc.lineTo(wc - 24, cashBot);
      xc.stroke();
      xc.beginPath();
      xc.moveTo(40, cashTop);
      xc.lineTo(40, cashBot);
      xc.stroke();

      var maxCashM = 72;
      var cashZeroM = burn > 1e-9 ? cash / burn : maxCashM;
      var plotMonths = Math.min(
        maxCashM,
        Math.max(2, Math.ceil(cashZeroM) + 2)
      );
      var maxBal = Math.max(cash, 1);
      var plotLeft = 40;
      var plotRight = wc - 24;

      xc.strokeStyle = "#2a2a28";
      xc.lineWidth = 1;
      for (var gi = 1; gi <= 3; gi++) {
        var gy = cashBot - (gi / 4) * cashH;
        xc.beginPath();
        xc.moveTo(plotLeft, gy);
        xc.lineTo(plotRight, gy);
        xc.globalAlpha = 0.35;
        xc.stroke();
        xc.globalAlpha = 1;
      }

      var cashPts = [];
      for (var cm2 = 0; cm2 <= plotMonths; cm2++) {
        var px2 = plotLeft + (cm2 / plotMonths) * (wc - 64);
        var bal = burn > 1e-9 ? Math.max(0, cash - cm2 * burn) : cash;
        var py2 = cashBot - (bal / maxBal) * cashH;
        cashPts.push({ x: px2, y: py2, bal: bal });
      }

      var cashFill = xc.createLinearGradient(0, cashTop, 0, cashBot);
      cashFill.addColorStop(0, "rgba(201,168,108,0.18)");
      cashFill.addColorStop(1, "rgba(199,90,90,0.12)");
      xc.fillStyle = cashFill;
      xc.beginPath();
      xc.moveTo(cashPts[0].x, cashBot);
      for (var ci = 0; ci < cashPts.length; ci++) {
        xc.lineTo(cashPts[ci].x, cashPts[ci].y);
      }
      xc.lineTo(cashPts[cashPts.length - 1].x, cashBot);
      xc.closePath();
      xc.fill();

      xc.strokeStyle = "#c9a86c";
      xc.lineWidth = 2;
      xc.beginPath();
      for (var cm3 = 0; cm3 <= plotMonths; cm3++) {
        var px3 = plotLeft + (cm3 / plotMonths) * (wc - 64);
        var bal3 = burn > 1e-9 ? Math.max(0, cash - cm3 * burn) : cash;
        var py3 = cashBot - (bal3 / maxBal) * cashH;
        if (cm3 === 0) xc.moveTo(px3, py3);
        else xc.lineTo(px3, py3);
      }
      xc.stroke();

      xc.fillStyle = "#c9a86c";
      xc.font = "9px JetBrains Mono, ui-monospace, monospace";
      xc.textAlign = "center";
      var stepTick = plotMonths <= 12 ? 3 : 6;
      xc.strokeStyle = "#555555";
      xc.lineWidth = 1;
      for (var tk2 = 0; tk2 <= plotMonths; tk2 += stepTick) {
        var tx2 = plotLeft + (tk2 / plotMonths) * (wc - 64);
        xc.fillStyle = "#c9a86c";
        xc.fillText(String(tk2), tx2, cashBot + 14);
        xc.beginPath();
        xc.moveTo(tx2, cashBot);
        xc.lineTo(tx2, cashBot + 4);
        xc.stroke();
      }
      xc.textAlign = "left";

      if (burn > 1e-9 && isFinite(cashZeroM) && cashZeroM <= plotMonths) {
        var xZero = plotLeft + (cashZeroM / plotMonths) * (wc - 64);
        xc.strokeStyle = "#c75a5a";
        xc.setLineDash([4, 4]);
        xc.beginPath();
        xc.moveTo(xZero, cashTop);
        xc.lineTo(xZero, cashBot);
        xc.stroke();
        xc.setLineDash([]);
        xc.fillStyle = "#c75a5a";
        xc.font = "10px JetBrains Mono, ui-monospace, monospace";
        xc.fillText(
          "~$0 @ mo " + cashZeroM.toFixed(1),
          Math.min(wc - 120, xZero + 4),
          cashTop + 12
        );
      } else if (burn > 1e-9 && isFinite(cashZeroM) && cashZeroM > plotMonths) {
        xc.fillStyle = "#888888";
        xc.font = "10px JetBrains Mono, ui-monospace, monospace";
        xc.fillText(
          "~$0 at mo " +
            cashZeroM.toFixed(1) +
            " (past " +
            plotMonths +
            " mo window)",
          plotLeft,
          cashTop + 12
        );
      }

      xc.fillStyle = "#888888";
      xc.font = "10px JetBrains Mono, ui-monospace, monospace";
      xc.fillText("cash balance ($k) vs month (flat burn)", 48, splitY + 12);
    }

    requestAnimationFrame(frame);
  }
  if (cf || ce || cm || cc) requestAnimationFrame(frame);
})();
