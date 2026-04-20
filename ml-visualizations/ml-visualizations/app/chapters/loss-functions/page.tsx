'use client';

import Link from 'next/link';
import { useState, useCallback, type CSSProperties } from 'react';

type Mode = 'regression' | 'classification';

// Chart geometry
const ML = 44; // margin left
const MT = 12; // margin top
const MB = 28; // margin bottom
const MR = 12;
const CW = 380; // chart width
const CH = 220; // chart height
const SVG_W = ML + CW + MR;
const SVG_H = MT + CH + MB;

const REG_X_MIN = -3, REG_X_MAX = 3;
const CLS_X_MIN = 0.01, CLS_X_MAX = 0.99;
const Y_MIN = 0;
const REG_Y_MAX = 9;
const CLS_Y_MAX = 5;

function toSvgX(v: number, xMin: number, xMax: number) {
  return ML + ((v - xMin) / (xMax - xMin)) * CW;
}
function toSvgY(v: number, yMax: number) {
  const clamped = Math.min(v, yMax);
  return MT + CH - ((clamped - Y_MIN) / (yMax - Y_MIN)) * CH;
}

function makePath(
  fn: (x: number) => number,
  xMin: number, xMax: number, yMax: number,
  steps = 300,
): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    const y = fn(x);
    if (!isFinite(y)) continue;
    pts.push(`${toSvgX(x, xMin, xMax).toFixed(1)},${toSvgY(y, yMax).toFixed(1)}`);
  }
  return pts.length > 1 ? `M${pts.join('L')}` : '';
}

// Loss functions
const mse     = (e: number) => e * e;
const mae     = (e: number) => Math.abs(e);
const huber   = (e: number, d: number) =>
  Math.abs(e) <= d ? (e * e) / 2 : d * (Math.abs(e) - d / 2);
const cePosY  = (p: number) => -Math.log(Math.max(p, 1e-7));          // cross-entropy y=1
const ceNegY  = (p: number) => -Math.log(Math.max(1 - p, 1e-7));      // cross-entropy y=0
const mseCls  = (p: number, y: number) => (p - y) * (p - y);

// Gradients (for educational display)
const gradMse     = (e: number) => 2 * e;
const gradMae     = (e: number) => (e > 0 ? 1 : e < 0 ? -1 : 0);
const gradHuber   = (e: number, d: number) => Math.abs(e) <= d ? e : d * (e > 0 ? 1 : -1);
const gradCePosY  = (p: number) => -1 / Math.max(p, 1e-7);
const gradCeNegY  = (p: number) => 1 / Math.max(1 - p, 1e-7);

type LossKey = 'mse' | 'mae' | 'huber' | 'ce1' | 'ce0' | 'mseCls';

const LOSS_META: Record<LossKey, { label: string; color: string }> = {
  mse:    { label: 'MSE',              color: '#e07060' },
  mae:    { label: 'MAE',              color: '#5ba3b5' },
  huber:  { label: 'Huber',            color: '#8b7aa8' },
  ce1:    { label: 'Cross-Entropy (y=1)', color: '#e07060' },
  ce0:    { label: 'Cross-Entropy (y=0)', color: '#5ba3b5' },
  mseCls: { label: 'MSE (reference)',  color: '#8b7aa8' },
};

export default function LossFunctionsPage() {
  const [mode, setMode]             = useState<Mode>('regression');
  const [error, setError]           = useState(1.5);
  const [prob, setProb]             = useState(0.3);
  const [delta, setDelta]           = useState(1.0);
  const [trueLabel, setTrueLabel]   = useState(1);
  const [activeLoss, setActiveLoss] = useState<LossKey | null>(null);

  const isReg = mode === 'regression';
  const xMin  = isReg ? REG_X_MIN : CLS_X_MIN;
  const xMax  = isReg ? REG_X_MAX : CLS_X_MAX;
  const yMax  = isReg ? REG_Y_MAX : CLS_Y_MAX;
  const xVal  = isReg ? error : prob;

  // Current loss values at the marker
  const losses: Record<LossKey, number> = {
    mse:    isReg ? mse(error) : 0,
    mae:    isReg ? mae(error) : 0,
    huber:  isReg ? huber(error, delta) : 0,
    ce1:    !isReg ? cePosY(prob) : 0,
    ce0:    !isReg ? ceNegY(prob) : 0,
    mseCls: !isReg ? mseCls(prob, trueLabel) : 0,
  };

  // Gradient at marker
  const grads: Record<LossKey, number> = {
    mse:    isReg ? gradMse(error) : 0,
    mae:    isReg ? gradMae(error) : 0,
    huber:  isReg ? gradHuber(error, delta) : 0,
    ce1:    !isReg ? gradCePosY(prob) : 0,
    ce0:    !isReg ? gradCeNegY(prob) : 0,
    mseCls: !isReg ? 2 * (prob - trueLabel) : 0,
  };

  // Which losses to show
  const regKeys:  LossKey[] = ['mse', 'mae', 'huber'];
  const clsKeys:  LossKey[] = ['ce1', 'ce0', 'mseCls'];
  const visKeys   = isReg ? regKeys : clsKeys;

  // Curve paths
  const getCurve = useCallback((key: LossKey): string => {
    switch (key) {
      case 'mse':    return makePath(e => mse(e),         xMin, xMax, yMax);
      case 'mae':    return makePath(e => mae(e),         xMin, xMax, yMax);
      case 'huber':  return makePath(e => huber(e, delta), xMin, xMax, yMax);
      case 'ce1':    return makePath(p => cePosY(p),      xMin, xMax, yMax);
      case 'ce0':    return makePath(p => ceNegY(p),      xMin, xMax, yMax);
      case 'mseCls': return makePath(p => mseCls(p, trueLabel), xMin, xMax, yMax);
      default:       return '';
    }
  }, [xMin, xMax, yMax, delta, trueLabel]);

  // Marker x pixel
  const markerX = toSvgX(xVal, xMin, xMax);

  // Y ticks for axis
  const yTicks = [0, isReg ? 2 : 1, isReg ? 4 : 2, isReg ? 6 : 3, isReg ? 8 : 4];
  const xTicks = isReg ? [-3, -2, -1, 0, 1, 2, 3] : [0, 0.2, 0.4, 0.6, 0.8, 1.0];

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

  const lossInfoBox = (title: string, body: string, accent: string) => (
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

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.3px', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Loss Functions
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '640px' }}>
          Loss functions measure how wrong a prediction is. Different choices produce different gradient shapes — which determines how the network learns and how it responds to outliers.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'stretch', minHeight: '520px' }}>

        {/* Visualization panel */}
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, height: '100%' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isReg ? 'Loss vs Prediction Error' : 'Loss vs Predicted Probability'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#e07060', opacity: 0.85 }}>{isReg ? 'Regression' : 'Classification'}</span>
          </div>

          {/* Chart */}
          <div style={{ overflowX: 'auto' }}>
            <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
              {/* Grid lines */}
              {yTicks.map(y => (
                <g key={`yg-${y}`}>
                  <line
                    x1={ML} y1={toSvgY(y, yMax)}
                    x2={ML + CW} y2={toSvgY(y, yMax)}
                    stroke="#2a2928" strokeWidth="1"
                  />
                  <text x={ML - 6} y={toSvgY(y, yMax) + 4} textAnchor="end"
                    style={{ fill: '#666', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>{y}</text>
                </g>
              ))}
              {xTicks.map(x => (
                <g key={`xg-${x}`}>
                  <line
                    x1={toSvgX(x, xMin, xMax)} y1={MT}
                    x2={toSvgX(x, xMin, xMax)} y2={MT + CH}
                    stroke="#2a2928" strokeWidth="1"
                  />
                  <text x={toSvgX(x, xMin, xMax)} y={MT + CH + 16} textAnchor="middle"
                    style={{ fill: '#666', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                    {isReg ? x : x.toFixed(1)}
                  </text>
                </g>
              ))}

              {/* Axes */}
              <line x1={ML} y1={MT} x2={ML} y2={MT + CH} stroke="#444" strokeWidth="1" />
              <line x1={ML} y1={MT + CH} x2={ML + CW} y2={MT + CH} stroke="#444" strokeWidth="1" />
              {/* Zero line for regression */}
              {isReg && (
                <line
                  x1={toSvgX(0, xMin, xMax)} y1={MT}
                  x2={toSvgX(0, xMin, xMax)} y2={MT + CH}
                  stroke="#3a3938" strokeWidth="1"
                />
              )}

              {/* Loss curves */}
              {visKeys.map(key => {
                const { color } = LOSS_META[key];
                const isHighlit = activeLoss === null || activeLoss === key;
                return (
                  <path key={key}
                    d={getCurve(key)}
                    fill="none"
                    stroke={color}
                    strokeWidth={activeLoss === key ? 2.5 : isHighlit ? 1.5 : 0.4}
                    opacity={isHighlit ? 1 : 0.2}
                    style={{ transition: 'opacity 0.2s, stroke-width 0.2s' }}
                  />
                );
              })}

              {/* Current prediction marker */}
              <line
                x1={markerX} y1={MT}
                x2={markerX} y2={MT + CH}
                stroke="#e07060" strokeWidth="1" strokeDasharray="4 3"
                opacity={0.6}
              />

              {/* Dots at marker for each curve */}
              {visKeys.map(key => {
                const { color } = LOSS_META[key];
                const lv = losses[key];
                if (lv > yMax || !isFinite(lv)) return null;
                const isHighlit = activeLoss === null || activeLoss === key;
                return (
                  <circle key={`dot-${key}`}
                    cx={markerX}
                    cy={toSvgY(lv, yMax)}
                    r={activeLoss === key ? 5 : 3.5}
                    fill={color}
                    opacity={isHighlit ? 1 : 0.2}
                    style={{ transition: 'opacity 0.2s, r 0.2s' }}
                  />
                );
              })}

              {/* X-axis label */}
              <text x={ML + CW / 2} y={SVG_H - 2} textAnchor="middle"
                style={{ fill: '#555', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                {isReg ? 'prediction error (ŷ − y)' : 'predicted probability p'}
              </text>
            </svg>
          </div>

          {/* Live loss values row */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {visKeys.map(key => {
              const { label, color } = LOSS_META[key];
              const lv = losses[key];
              const gv = grads[key];
              const isA = activeLoss === key;
              return (
                <button key={key}
                  onClick={() => setActiveLoss(isA ? null : key)}
                  style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 12px', borderRadius: '8px', border: isA ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.06)', background: isA ? `rgba(${color === '#e07060' ? '224,112,96' : color === '#5ba3b5' ? '91,163,181' : '139,122,168'},0.1)` : 'rgba(0,0,0,0.15)', cursor: 'pointer', flex: 1, minWidth: '80px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color }}>{isFinite(lv) ? lv.toFixed(3) : '∞'}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#666' }}>∂L/∂x = {isFinite(gv) ? gv.toFixed(3) : '∞'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls panel — match viz height; summary pinned to bottom */}
        <div style={{
          background: 'var(--visual-box)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          minHeight: 0,
          height: '100%',
          overflowY: 'auto',
        }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Controls</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }} htmlFor="loss-mode">Problem type</label>
            <select
              id="loss-mode"
              value={mode}
              onChange={e => setMode(e.target.value as Mode)}
              style={selectStyle}
            >
              <option value="regression">Regression (error on ℝ)</option>
              <option value="classification">Classification (probability in [0,1])</option>
            </select>
          </div>

          {/* Regression: error slider */}
          {isReg && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prediction Error</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#e07060' }}>{error.toFixed(2)}</span>
              </div>
              <input type="range" min={-3} max={3} step={0.05} value={error}
                onChange={e => setError(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#e07060', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#555' }}>−3</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#555' }}>+3</span>
              </div>
            </div>
          )}

          {/* Classification: probability slider */}
          {!isReg && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Predicted Prob.</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#e07060' }}>{prob.toFixed(2)}</span>
              </div>
              <input type="range" min={0.01} max={0.99} step={0.01} value={prob}
                onChange={e => setProb(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#e07060', cursor: 'pointer' }} />
            </div>
          )}

          {!isReg && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }} htmlFor="loss-ylabel">MSE reference label</label>
              <select
                id="loss-ylabel"
                value={trueLabel}
                onChange={e => setTrueLabel(Number(e.target.value) as 0 | 1)}
                style={selectStyle}
              >
                <option value={1}>y = 1 (positive class)</option>
                <option value={0}>y = 0 (negative class)</option>
              </select>
            </div>
          )}

          {/* Huber delta (regression only) */}
          {isReg && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Huber δ</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#8b7aa8' }}>{delta.toFixed(1)}</span>
              </div>
              <input type="range" min={0.2} max={2.5} step={0.1} value={delta}
                onChange={e => setDelta(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#8b7aa8', cursor: 'pointer' }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#555', lineHeight: 1.4 }}>
                Transition point between quadratic and linear behavior
              </p>
            </div>
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '120px' }}>
            {lossInfoBox(
              'Reading the chart',
              'The dashed vertical line is your chosen error (regression) or predicted probability (classification). Dots show each loss at that x-value; click a loss card under the chart to dim other curves.',
              '#5ba3b5',
            )}
            {lossInfoBox(
              isReg ? 'Gradients' : 'Cross-entropy',
              isReg
                ? '∂L/∂x uses x as the error axis: MSE pulls harder when error is large; MAE uses a constant magnitude; Huber switches at δ.'
                : 'Two CE curves fix the logging definition (penalize 1−p vs p). MSE on probabilities is shown as a smooth reference for the selected y.',
              '#8b7aa8',
            )}
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>At current marker</span>
            {visKeys.map(key => {
              const { label, color } = LOSS_META[key];
              const lv = losses[key];
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888', flex: 1, minWidth: 0 }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color }}>{isFinite(lv) ? lv.toFixed(3) : '∞'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key concepts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { title: 'MSE vs MAE', desc: 'MSE squares the error — a prediction 3× further away incurs 9× the loss. This makes it sensitive to outliers. MAE grows linearly, so outliers are penalized equally.', color: '#e07060' },
          { title: 'Huber Loss', desc: 'Huber is quadratic (MSE) for small errors and linear (MAE) for large ones. The δ parameter controls the transition. This combines smooth gradients near zero with outlier robustness.', color: '#5ba3b5' },
          { title: 'Cross-Entropy', desc: 'For classification, cross-entropy penalizes confident wrong predictions exponentially. Predicting 1% when the true label is 1 incurs −log(0.01) ≈ 4.6 — far more than predicting 50%.', color: '#8b7aa8' },
        ].map(({ title, desc, color }) => (
          <div key={title} style={{ padding: '14px 16px', background: 'transparent', borderRadius: '8px', border: '1px solid var(--grid-line)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color, marginBottom: '6px' }}>{title}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #333' }}>
        <Link href="/chapters/convolutional-networks" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e07060', textDecoration: 'none' }}>
          ← Convolutional Networks
        </Link>
        <Link href="/chapters/softmax" style={{ padding: '8px 18px', borderRadius: '6px', background: '#e07060', color: '#1a1210', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Next: Softmax & Temperature →
        </Link>
      </div>
    </div>
  );
}
