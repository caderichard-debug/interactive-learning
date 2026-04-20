'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';

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

export default function ResidualConnectionsPage() {
  const [depth, setDepth] = useState(8);
  const [decay, setDecay] = useState(0.82);
  const [compare, setCompare] = useState<'both' | 'plain' | 'residual'>('both');

  const plainHeights = useMemo(() => {
    const h: number[] = [];
    for (let i = 0; i < depth; i++) {
      h.push(Math.pow(decay, depth - 1 - i));
    }
    return h;
  }, [depth, decay]);

  const resHeights = useMemo(() => Array.from({ length: depth }, () => 1), [depth]);

  const maxH = 1;
  const barW = 14;
  const gap = 6;
  const chartH = 160;
  const baseY = 40 + chartH;
  const groupGap = 48;
  const wPlain = depth * (barW + gap);
  const wRes = depth * (barW + gap);
  const totalW = 40 + (compare === 'both' ? wPlain + groupGap + wRes : Math.max(wPlain, wRes)) + 40;

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

  const drawGroup = (x0: number, heights: number[], label: string, color: string) => {
    return (
      <g>
        <text x={x0 + (depth * (barW + gap) - gap) / 2} y={24} textAnchor="middle" style={{ fill: color, fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{label}</text>
        {heights.map((h, i) => {
          const bh = (h / maxH) * chartH;
          const x = x0 + i * (barW + gap);
          const y = baseY - bh;
          return <rect key={i} x={x} y={y} width={barW} height={bh} rx={3} fill={color} opacity={0.75 + 0.15 * h} />;
        })}
        <line x1={x0} y1={baseY} x2={x0 + depth * (barW + gap) - gap} y2={baseY} stroke="#444" strokeWidth="1" />
        <text x={x0 + (depth * (barW + gap) - gap) / 2} y={baseY + 22} textAnchor="middle" style={{ fill: '#555', fontSize: '8px', fontFamily: 'var(--font-mono)' }}>layer → input</text>
      </g>
    );
  };

  const xPlain = 32;
  const xRes = compare === 'both' ? xPlain + wPlain + groupGap : xPlain;

  return (
    <div style={{ padding: '32px 40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.3px', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Residual & Skip Connections
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '640px' }}>
          Residual blocks compute <strong style={{ color: '#e07060' }}>y = F(x) + x</strong> instead of y = F(x). The additive path gives gradients a highway to earlier layers — a key reason very deep CNNs and transformers train at all.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'stretch', minHeight: '520px' }}>
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Toy gradient reach (per layer)
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#888' }}>Higher bar → stronger signal to input</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <svg width={Math.min(totalW, 560)} height={220} style={{ display: 'block' }}>
              {compare !== 'residual' && drawGroup(xPlain, plainHeights, 'Stacked F only (illustrative)', '#e07060')}
              {compare !== 'plain' && drawGroup(xRes, resHeights, 'With residual highways', '#5ba3b5')}
              {compare === 'both' && (
                <line x1={xPlain + wPlain + 12} y1={30} x2={xPlain + wPlain + 12} y2={baseY + 8} stroke="#333" strokeDasharray="3 3" />
              )}
            </svg>
          </div>

          <div style={{ background: 'rgba(26,25,24,0.97)', border: '1px solid rgba(224,112,96,0.25)', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#e07060', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Block diagram</div>
            <svg width="100%" height={72} viewBox="0 0 400 72" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
              <rect x={8} y={16} width={56} height={40} rx={6} fill="#2a2928" stroke="#666" strokeWidth="1" />
              <text x={36} y={42} textAnchor="middle" style={{ fill: '#ccc', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>x</text>
              <line x1={64} y1={36} x2={92} y2={36} stroke="#888" strokeWidth="1.2" />
              <rect x={92} y={12} width={88} height={48} rx={8} fill="rgba(91,163,181,0.15)" stroke="#5ba3b5" strokeWidth="1.2" />
              <text x={136} y={40} textAnchor="middle" style={{ fill: '#5ba3b5', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>F(x)</text>
              <line x1={180} y1={36} x2={210} y2={36} stroke="#888" strokeWidth="1.2" />
              <circle cx={222} cy={36} r={10} fill="#2a2928" stroke="#e07060" strokeWidth="1.2" />
              <text x={222} y={40} textAnchor="middle" style={{ fill: '#e07060', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>+</text>
              <line x1={232} y1={36} x2={268} y2={36} stroke="#888" strokeWidth="1.2" />
              <rect x={268} y={16} width={56} height={40} rx={6} fill="#2a2928" stroke="#e07060" strokeWidth="1" />
              <text x={296} y={42} textAnchor="middle" style={{ fill: '#e07060', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>y</text>
              <path d="M 36 16 Q 120 4, 222 26" fill="none" stroke="#e07060" strokeWidth="1.5" strokeDasharray="3 2" opacity={0.85} />
              <text x={120} y={10} textAnchor="middle" style={{ fill: '#e07060', fontSize: '8px', fontFamily: 'var(--font-mono)' }}>skip</text>
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
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }} htmlFor="rc-view">Chart view</label>
            <select id="rc-view" value={compare} onChange={e => setCompare(e.target.value as typeof compare)} style={selectStyle}>
              <option value="both">Compare side by side</option>
              <option value="plain">Plain deep stack only</option>
              <option value="residual">Residual stack only</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Depth (layers)</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#e07060' }}>{depth}</span>
            </div>
            <input type="range" min={4} max={16} step={1} value={depth}
              onChange={e => setDepth(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#e07060', cursor: 'pointer' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attenuation γ per layer</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#8b7aa8' }}>{decay.toFixed(2)}</span>
            </div>
            <input type="range" min={0.55} max={0.98} step={0.01} value={decay}
              onChange={e => setDecay(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#8b7aa8', cursor: 'pointer' }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#555', lineHeight: 1.4, margin: 0 }}>
              Plain stack uses γ<sup>k</sup> as a cartoon for how repeated Jacobian norms shrink gradients from output toward input.
            </p>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '100px' }}>
            {infoBox(
              'Identity shortcut',
              'When F is near zero (common early in training), y ≈ x — the block acts like an identity. The network can grow capacity gradually instead of having to learn identity mappings from scratch.',
              '#5ba3b5',
            )}
            {infoBox(
              'Where you see it',
              'Transformer blocks, ResNet v2 ordering (norm → sublayer → add), and U-Net skip arms all reuse the same pattern: preserve a clean path for information and gradients.',
              '#8b7aa8',
            )}
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plain stack input signal</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: '#e07060' }}>{plainHeights[0].toFixed(3)}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>vs residual (fixed illustration) = 1.000</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { title: 'Vanishing vs highways', desc: 'Without shortcuts, repeated nonlinear maps can shrink useful gradient components exponentially in depth. Residual paths add a term that keeps at least one route close to identity.', color: '#e07060' },
          { title: 'Pre-norm vs post-norm', desc: 'Modern transformers usually place layer norm before the sublayer (pre-LN) for training stability. The residual add still happens after the sublayer block.', color: '#5ba3b5' },
          { title: 'U-Net skips', desc: 'Skip connections concatenate or add encoder features into the decoder path — architecture-level residuals that recover spatial detail lost during pooling.', color: '#8b7aa8' },
        ].map(({ title, desc, color }) => (
          <div key={title} style={{ padding: '14px 16px', background: 'transparent', borderRadius: '8px', border: '1px solid var(--grid-line)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color, marginBottom: '6px' }}>{title}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #333' }}>
        <Link href="/chapters/encoder-decoder" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e07060', textDecoration: 'none' }}>
          ← Encoder–Decoder
        </Link>
        <Link href="/chapters/normalization-layers" style={{ padding: '8px 18px', borderRadius: '6px', background: '#e07060', color: '#1a1210', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Next: Normalization Layers →
        </Link>
      </div>
    </div>
  );
}
