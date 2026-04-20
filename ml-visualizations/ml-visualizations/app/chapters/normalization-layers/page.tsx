'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';

type NormMode = 'layer' | 'batch';

const ROWS = 4;
const COLS = 8;
const CS = 20;
const PAD = 36;
const GW = PAD + COLS * CS + 24;
const GH = PAD + ROWS * CS + 32;

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

function cellColor(v: number) {
  const t = Math.max(0, Math.min(1, v));
  const r = Math.round(42 + t * 182);
  const g = Math.round(41 + t * 71);
  const b = Math.round(40 + t * 56);
  return `rgb(${r},${g},${b})`;
}

export default function NormalizationLayersPage() {
  const [mode, setMode] = useState<NormMode>('layer');
  const [batchShift, setBatchShift] = useState(0.15);

  const raw = useMemo(() => {
    const g: number[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: number[] = [];
      for (let c = 0; c < COLS; c++) {
        const base = 0.45 + 0.35 * Math.sin(r * 0.9 + c * 0.35) + 0.12 * Math.cos(c * 0.7);
        row.push(Math.max(0.08, Math.min(0.98, base + batchShift * (r / ROWS - 0.35))));
      }
      g.push(row);
    }
    return g;
  }, [batchShift]);

  const rowMeans = useMemo(() => raw.map(row => row.reduce((a, b) => a + b, 0) / COLS), [raw]);
  const colMeans = useMemo(() =>
    Array.from({ length: COLS }, (_, c) => raw.reduce((s, row) => s + row[c], 0) / ROWS), [raw]);

  const rowMeanSpread = useMemo(() => {
    const mu = rowMeans.reduce((a, b) => a + b, 0) / ROWS;
    return rowMeans.reduce((s, m) => s + Math.abs(m - mu), 0) / ROWS;
  }, [rowMeans]);

  const colMeanSpread = useMemo(() => {
    const mu = colMeans.reduce((a, b) => a + b, 0) / COLS;
    return colMeans.reduce((s, m) => s + Math.abs(m - mu), 0) / COLS;
  }, [colMeans]);

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
          Normalization in Architectures
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '640px' }}>
          Normalization layers re-center and re-scale activations so training stays stable across depth and batch. The architectural question is <strong style={{ color: '#e07060' }}>which axes</strong> you treat as the population to normalize over.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'stretch', minHeight: '520px' }}>
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Activations (batch × features)
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: mode === 'layer' ? '#5ba3b5' : '#8b7aa8', opacity: 0.95 }}>
              {mode === 'layer' ? 'LayerNorm: per row' : 'BatchNorm: per column'}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <svg width={GW} height={GH} style={{ display: 'block' }}>
              <text x={PAD / 2} y={18} textAnchor="middle" style={{ fill: '#666', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>batch</text>
              <text x={PAD + (COLS * CS) / 2} y={18} textAnchor="middle" style={{ fill: '#666', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>feature index</text>
              {raw.map((row, r) => row.map((v, c) => (
                <rect
                  key={`${r}-${c}`}
                  x={PAD + c * CS + 1}
                  y={PAD + r * CS + 1}
                  width={CS - 2}
                  height={CS - 2}
                  rx={2}
                  fill={cellColor(v)}
                  stroke={mode === 'layer' ? 'rgba(91,163,181,0.35)' : 'rgba(139,122,168,0.25)'}
                  strokeWidth={1}
                />
              )))}
              {mode === 'layer' && raw.map((_, r) => (
                <rect
                  key={`br-${r}`}
                  x={PAD - 6}
                  y={PAD + r * CS - 1}
                  width={COLS * CS + 8}
                  height={CS + 2}
                  fill="none"
                  stroke="#5ba3b5"
                  strokeWidth={1.5}
                  rx={4}
                  opacity={0.9}
                />
              ))}
              {mode === 'batch' && Array.from({ length: COLS }, (_, c) => (
                <rect
                  key={`bc-${c}`}
                  x={PAD + c * CS - 1}
                  y={PAD - 6}
                  width={CS + 2}
                  height={ROWS * CS + 8}
                  fill="none"
                  stroke="#8b7aa8"
                  strokeWidth={1.5}
                  rx={4}
                  opacity={0.9}
                />
              ))}
            </svg>
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
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }} htmlFor="nl-mode">Highlight</label>
            <select id="nl-mode" value={mode} onChange={e => setMode(e.target.value as NormMode)} style={selectStyle}>
              <option value="layer">LayerNorm (across features)</option>
              <option value="batch">BatchNorm (across batch)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Batch-level offset</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#e07060' }}>{batchShift.toFixed(2)}</span>
            </div>
            <input type="range" min={-0.35} max={0.35} step={0.01} value={batchShift}
              onChange={e => setBatchShift(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#e07060', cursor: 'pointer' }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#555', lineHeight: 1.4, margin: 0 }}>
              Shifts each row slightly to mimic batch-wide drift that BatchNorm can absorb using running statistics at inference.
            </p>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '100px' }}>
            {infoBox(
              'LayerNorm (transformers)',
              'For each token vector x ∈ ℝ^d, normalize across the d features using that token’s mean and variance. Works the same for batch size 1 — ideal for autoregressive decoding.',
              '#5ba3b5',
            )}
            {infoBox(
              'BatchNorm (convnets)',
              'For each channel, normalize across all spatial positions and batch elements in the minibatch. Training uses batch stats; inference often uses exponential moving averages.',
              '#8b7aa8',
            )}
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Raw means (before norm)</span>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>Mean abs row deviation</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#5ba3b5' }}>{rowMeanSpread.toFixed(3)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>Mean abs column deviation</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#8b7aa8' }}>{colMeanSpread.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { title: 'Where it sits', desc: 'In a transformer block, normalization is usually applied around the attention and FFN sublayers (pre-LN or post-LN). That placement is part of the architecture contract with the optimizer.', color: '#e07060' },
          { title: 'Affine parameters', desc: 'After centering and scaling, learned γ and β per feature let the model undo the transform if needed — the network chooses how much to use the normalized geometry.', color: '#5ba3b5' },
          { title: 'RMSNorm', desc: 'A common variant drops mean centering and only scales by RMS. Fewer ops, similar empirical behavior in large language models.', color: '#8b7aa8' },
        ].map(({ title, desc, color }) => (
          <div key={title} style={{ padding: '14px 16px', background: 'transparent', borderRadius: '8px', border: '1px solid var(--grid-line)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color, marginBottom: '6px' }}>{title}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #333' }}>
        <Link href="/chapters/residual-connections" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e07060', textDecoration: 'none' }}>
          ← Residual & Skips
        </Link>
        <Link href="/" style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid rgba(224,112,96,0.35)', background: 'rgba(224,112,96,0.08)', color: '#e07060', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
