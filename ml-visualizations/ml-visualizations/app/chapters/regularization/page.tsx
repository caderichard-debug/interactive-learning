'use client';

import Link from 'next/link';
import { useMemo, useState, useCallback, type CSSProperties } from 'react';

type RegMode = 'l2' | 'l1';

const TARGET = 2;
const ML = 44;
const MT = 12;
const MB = 28;
const MR = 12;
const CW = 380;
const CH = 220;
const SVG_W = ML + CW + MR;
const SVG_H = MT + CH + MB;
const W_MIN = -2.5;
const W_MAX = 4.5;

const dataLoss = (w: number) => (w - TARGET) ** 2;
const regL2 = (w: number, lam: number) => lam * w * w;
const regL1 = (w: number, lam: number) => lam * Math.abs(w);
const totalLoss = (w: number, lam: number, mode: RegMode) =>
  dataLoss(w) + (mode === 'l2' ? regL2(w, lam) : regL1(w, lam));

function toSvgX(w: number) {
  return ML + ((w - W_MIN) / (W_MAX - W_MIN)) * CW;
}
function toSvgY(v: number, yMax: number) {
  const clamped = Math.min(Math.max(v, 0), yMax);
  return MT + CH - (clamped / yMax) * CH;
}

function makePath(fn: (w: number) => number, yMax: number, steps = 200): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const w = W_MIN + (i / steps) * (W_MAX - W_MIN);
    const y = fn(w);
    if (!isFinite(y)) continue;
    pts.push(`${toSvgX(w).toFixed(1)},${toSvgY(y, yMax).toFixed(1)}`);
  }
  return pts.length > 1 ? `M${pts.join('L')}` : '';
}

export default function RegularizationPage() {
  const [mode, setMode] = useState<RegMode>('l2');
  const [w, setW] = useState(0.8);
  const [lambda, setLambda] = useState(0.4);

  const yMax = useMemo(() => {
    let m = 1;
    for (let i = 0; i <= 200; i++) {
      const x = W_MIN + (i / 200) * (W_MAX - W_MIN);
      m = Math.max(m, dataLoss(x), totalLoss(x, lambda, mode));
    }
    return Math.ceil(m * 1.08);
  }, [lambda, mode]);

  const getDataPath = useCallback(() => makePath(dataLoss, yMax), [yMax]);
  const getRegPath = useCallback(
    () => makePath(x => (mode === 'l2' ? regL2(x, lambda) : regL1(x, lambda)), yMax),
    [lambda, mode, yMax],
  );
  const getTotalPath = useCallback(
    () => makePath(x => totalLoss(x, lambda, mode), yMax),
    [lambda, mode, yMax],
  );

  const dData = dataLoss(w);
  const dReg = mode === 'l2' ? regL2(w, lambda) : regL1(w, lambda);
  const dTot = dData + dReg;

  const markerX = toSvgX(w);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(t * yMax * 10) / 10);
  const xTicks = [-2, 0, 2, 4];

  const selectStyle: CSSProperties = {
    width: '100%',
    marginTop: '4px',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #333',
    background: '#141312',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    cursor: 'pointer',
  };

  const infoBox = (title: string, body: string, accent: string) => (
    <div
      key={title}
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(224,112,96,0.15)',
        background: 'rgba(0,0,0,0.2)',
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: accent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{title}</div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#888', lineHeight: 1.45, margin: 0 }}>{body}</p>
    </div>
  );

  return (
    <div style={{ padding: '32px 40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.3px', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Regularization
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '640px' }}>
          Add a penalty on weight magnitude to trade off fitting the data versus keeping weights small. L2 prefers many small weights; L1 encourages sparsity.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'stretch', minHeight: '520px' }}>
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Data vs penalty vs total (1D weight)
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#e07060', opacity: 0.9 }}>
              target w* = {TARGET}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
              {yTicks.map((yv, i) => (
                <g key={`${i}-${yv}`}>
                  <line x1={ML} y1={toSvgY(yv, yMax)} x2={ML + CW} y2={toSvgY(yv, yMax)} stroke="#2a2928" strokeWidth="1" />
                  <text x={ML - 6} y={toSvgY(yv, yMax) + 4} textAnchor="end" style={{ fill: '#666', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>{yv}</text>
                </g>
              ))}
              {xTicks.map(xv => (
                <g key={xv}>
                  <line x1={toSvgX(xv)} y1={MT} x2={toSvgX(xv)} y2={MT + CH} stroke="#2a2928" strokeWidth="1" />
                  <text x={toSvgX(xv)} y={MT + CH + 16} textAnchor="middle" style={{ fill: '#666', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>{xv}</text>
                </g>
              ))}
              <line x1={ML} y1={MT} x2={ML} y2={MT + CH} stroke="#444" strokeWidth="1" />
              <line x1={ML} y1={MT + CH} x2={ML + CW} y2={MT + CH} stroke="#444" strokeWidth="1" />
              <line x1={toSvgX(TARGET)} y1={MT} x2={toSvgX(TARGET)} y2={MT + CH} stroke="#3a3938" strokeWidth="1" strokeDasharray="3 3" />

              <path d={getDataPath()} fill="none" stroke="#5ba3b5" strokeWidth={1.5} opacity={0.95} />
              <path d={getRegPath()} fill="none" stroke="#8b7aa8" strokeWidth={1.5} opacity={0.95} />
              <path d={getTotalPath()} fill="none" stroke="#e07060" strokeWidth={2.4} opacity={1} />

              <line x1={markerX} y1={MT} x2={markerX} y2={MT + CH} stroke="#e07060" strokeWidth="1" strokeDasharray="4 3" opacity={0.65} />
              <circle cx={markerX} cy={toSvgY(dTot, yMax)} r={5} fill="#e07060" />

              <text x={ML + CW / 2} y={SVG_H - 2} textAnchor="middle" style={{ fill: '#555', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>weight w</text>
            </svg>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
            <span style={{ color: '#5ba3b5' }}>● data (w−2)²</span>
            <span style={{ color: '#8b7aa8' }}>● penalty λ·R(w)</span>
            <span style={{ color: '#e07060' }}>● total</span>
          </div>
        </div>

        <div style={{
          background: 'var(--visual-box)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          minHeight: 0,
          height: '100%',
          overflowY: 'auto',
        }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Controls</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }} htmlFor="reg-mode">Penalty type</label>
            <select
              id="reg-mode"
              value={mode}
              onChange={e => setMode(e.target.value as RegMode)}
              style={selectStyle}
            >
              <option value="l2">L2 — weight decay (smooth)</option>
              <option value="l1">L1 — sparsity (corner solutions)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Weight w</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#e07060' }}>{w.toFixed(2)}</span>
            </div>
            <input type="range" min={W_MIN} max={W_MAX} step={0.02} value={w}
              onChange={e => setW(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#e07060', cursor: 'pointer' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Strength λ</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#8b7aa8' }}>{lambda.toFixed(2)}</span>
            </div>
            <input type="range" min={0} max={2.5} step={0.02} value={lambda}
              onChange={e => setLambda(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#8b7aa8', cursor: 'pointer' }} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '100px' }}>
            {infoBox(
              'Geometric intuition',
              mode === 'l2'
                ? 'L2 adds a bowl centered at w = 0. The minimum of data + L2 shifts left toward 0 as λ grows — a bias–variance tradeoff in one dimension.'
                : 'L1 adds a V-shaped term at 0. Minima often sit exactly at 0 for some coordinates in higher dimensions, producing sparse weights.',
              '#5ba3b5',
            )}
            {infoBox(
              'What you are seeing',
              'Data loss alone is minimized at w = 2. The coral curve is what you actually optimize with regularization; its minimum moves as you change λ.',
              '#8b7aa8',
            )}
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>At current w</span>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>Data</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#5ba3b5' }}>{dData.toFixed(3)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>Penalty</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#8b7aa8' }}>{dReg.toFixed(3)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#e07060' }}>{dTot.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { title: 'L2 (ridge)', desc: 'Squaring weights penalizes large values smoothly. Gradients shrink linearly with w, so optimization stays well behaved and rarely hits exact zeros.', color: '#e07060' },
          { title: 'L1 (lasso)', desc: 'Absolute values add a constant gradient away from zero, which can drive some weights exactly to 0 — automatic feature selection in linear models.', color: '#5ba3b5' },
          { title: 'Choosing λ', desc: 'Too little regularization overfits; too much underfits. In practice λ is tuned on a validation set or via cross-validation.', color: '#8b7aa8' },
        ].map(({ title, desc, color }) => (
          <div key={title} style={{ padding: '14px 16px', background: 'transparent', borderRadius: '8px', border: '1px solid var(--grid-line)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color, marginBottom: '6px' }}>{title}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #333' }}>
        <Link href="/chapters/softmax" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e07060', textDecoration: 'none' }}>
          ← Softmax & Temperature
        </Link>
        <Link href="/chapters/encoder-decoder" style={{ padding: '8px 18px', borderRadius: '6px', background: '#e07060', color: '#1a1210', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Next: Encoder–Decoder →
        </Link>
      </div>
    </div>
  );
}
