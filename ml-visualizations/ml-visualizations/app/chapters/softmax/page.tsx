'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';

const N = 4;
const BAR_GAP = 8;
const CHART_H = 200;
const CHART_W = 320;
const ML = 48;
const MB = 36;

function softmax(logits: number[], T: number): number[] {
  const t = Math.max(0.08, T);
  const scaled = logits.map(z => z / t);
  const m = Math.max(...scaled);
  const exps = scaled.map(z => Math.exp(Math.min(z - m, 20)));
  const s = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map(e => e / s);
}

function entropy(probs: number[]): number {
  let h = 0;
  for (const p of probs) {
    if (p > 1e-10) h -= p * Math.log(p);
  }
  return h;
}

const PRESETS: Record<string, number[]> = {
  uniform: [0, 0, 0, 0],
  peaked: [2.5, 0.2, -0.3, -0.4],
  close: [0.4, 0.5, 0.35, 0.2],
  mixed: [1.2, -0.8, 0.6, -1.4],
};

export default function SoftmaxPage() {
  const [logits, setLogits] = useState<number[]>([...PRESETS.peaked]);
  const [temp, setTemp] = useState(1);
  const [preset, setPreset] = useState<string>('custom');

  const probs = useMemo(() => softmax(logits, temp), [logits, temp]);
  const H = useMemo(() => entropy(probs), [probs]);
  const argmax = probs.indexOf(Math.max(...probs));

  const barW = (CHART_W - (N - 1) * BAR_GAP) / N;

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

  const applyPreset = (key: string) => {
    setPreset(key);
    if (key !== 'custom' && PRESETS[key]) setLogits([...PRESETS[key]]);
  };

  return (
    <div style={{ padding: '32px 40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.3px', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Softmax & Temperature
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '640px' }}>
          Softmax turns raw logits into a valid probability distribution: positive values that sum to 1. Temperature rescales how peaked or flat that distribution becomes.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'stretch', minHeight: '520px' }}>
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Probabilities over {N} classes
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#e07060', opacity: 0.9 }}>
              Σp = {probs.reduce((a, b) => a + b, 0).toFixed(3)}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <svg width={ML + CHART_W} height={CHART_H + MB} style={{ display: 'block' }}>
              {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                const y = CHART_H - tick * CHART_H + 8;
                return (
                  <g key={tick}>
                    <line x1={ML} y1={y} x2={ML + CHART_W} y2={y} stroke="#2a2928" strokeWidth="1" />
                    <text x={ML - 6} y={y + 3} textAnchor="end" style={{ fill: '#555', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>{tick.toFixed(2)}</text>
                  </g>
                );
              })}
              <line x1={ML} y1={8} x2={ML} y2={CHART_H + 8} stroke="#444" strokeWidth="1" />
              <line x1={ML} y1={CHART_H + 8} x2={ML + CHART_W} y2={CHART_H + 8} stroke="#444" strokeWidth="1" />
              {probs.map((p, i) => {
                const x = ML + i * (barW + BAR_GAP);
                const h = p * CHART_H;
                const y0 = CHART_H + 8 - h;
                const hue = i === argmax ? '#e07060' : i % 2 === 0 ? '#5ba3b5' : '#8b7aa8';
                return (
                  <g key={i}>
                    <rect x={x} y={y0} width={barW} height={h} rx={4} fill={hue} opacity={0.85} />
                    <text x={x + barW / 2} y={CHART_H + 26} textAnchor="middle" style={{ fill: '#888', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>z{i}</text>
                    <text x={x + barW / 2} y={CHART_H + 40} textAnchor="middle" style={{ fill: '#aaa', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>{p.toFixed(3)}</text>
                  </g>
                );
              })}
              <text x={ML + CHART_W / 2} y={CHART_H + MB - 2} textAnchor="middle" style={{ fill: '#555', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>class index</text>
            </svg>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666' }}>
            {logits.map((z, i) => (
              <div key={i} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #333', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ color: '#888', marginBottom: '4px' }}>logit {i}</div>
                <div style={{ color: '#e7e5e2', fontWeight: 600 }}>{z.toFixed(2)}</div>
              </div>
            ))}
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
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }} htmlFor="sm-preset">Logit preset</label>
            <select
              id="sm-preset"
              value={preset}
              onChange={e => applyPreset(e.target.value)}
              style={selectStyle}
            >
              <option value="custom">Custom (use sliders)</option>
              <option value="uniform">Uniform logits</option>
              <option value="peaked">One clear winner</option>
              <option value="close">Close race</option>
              <option value="mixed">Mixed signs</option>
            </select>
          </div>

          {logits.map((z, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666' }}>z{i}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#5ba3b5' }}>{z.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={-4}
                max={4}
                step={0.05}
                value={z}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  setLogits(prev => prev.map((x, j) => (j === i ? v : x)));
                  setPreset('custom');
                }}
                style={{ width: '100%', accentColor: '#5ba3b5', cursor: 'pointer' }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Temperature T</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#e07060' }}>{temp.toFixed(2)}</span>
            </div>
            <input type="range" min={0.15} max={4} step={0.05} value={temp}
              onChange={e => setTemp(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#e07060', cursor: 'pointer' }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#555', lineHeight: 1.4, margin: 0 }}>
              Low T sharpens the distribution; high T pushes probabilities toward uniform.
            </p>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '100px' }}>
            {infoBox(
              'Numerical stability',
              'We subtract max(z/T) before exp so the largest exponent is 0 — same probabilities, no overflow.',
              '#5ba3b5',
            )}
            {infoBox(
              'Why temperature?',
              'At inference, T < 1 makes the model more decisive; T > 1 spreads mass for calibration or exploration.',
              '#8b7aa8',
            )}
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Summary</span>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>Entropy H(p)</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#e07060' }}>{H.toFixed(3)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>Argmax class</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#e07060' }}>{argmax} ({probs[argmax].toFixed(3)})</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { title: 'From logits to probabilities', desc: 'Softmax is invariant to adding the same constant to every logit — only differences matter. That is why we can center exponentials for stable computation.', color: '#e07060' },
          { title: 'Temperature scaling', desc: 'Dividing logits by T before softmax is equivalent to raising each probability to 1/T and renormalizing. T→∞ approaches uniform; T→0 approaches a one-hot argmax.', color: '#5ba3b5' },
          { title: 'Entropy', desc: 'Entropy measures uncertainty: it is highest for a uniform distribution over classes and lowest when one class has probability 1.', color: '#8b7aa8' },
        ].map(({ title, desc, color }) => (
          <div key={title} style={{ padding: '14px 16px', background: 'transparent', borderRadius: '8px', border: '1px solid var(--grid-line)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color, marginBottom: '6px' }}>{title}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #333' }}>
        <Link href="/chapters/loss-functions" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e07060', textDecoration: 'none' }}>
          ← Loss Functions
        </Link>
        <Link href="/chapters/regularization" style={{ padding: '8px 18px', borderRadius: '6px', background: '#e07060', color: '#1a1210', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Next: Regularization →
        </Link>
      </div>
    </div>
  );
}
