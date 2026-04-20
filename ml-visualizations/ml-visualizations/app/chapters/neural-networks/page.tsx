'use client';

import { useState, useEffect } from 'react';

interface NetworkState {
  input1: number;
  input2: number;
  hiddenWeights: number[][];
  hiddenBiases: number[];
  outputWeights: number[];
  outputBias: number;
}

const DEFAULT: NetworkState = {
  input1: 1.0, input2: 0.5,
  hiddenWeights: [[0.5, -0.3], [0.4, 0.6]],
  hiddenBiases: [0.1, -0.2],
  outputWeights: [0.7, 0.3],
  outputBias: 0.0,
};

const PRESETS: Record<string, NetworkState> = {
  default: DEFAULT,
  and: { input1: 1.0, input2: 1.0, hiddenWeights: [[1.0, 1.0], [-0.5, -0.5]], hiddenBiases: [-1.5, 1.0], outputWeights: [1.0, 1.0], outputBias: -1.0 },
  or:  { input1: 0.5, input2: 0.0, hiddenWeights: [[1.0, 1.0], [-0.5, -0.5]], hiddenBiases: [-0.5, 1.0], outputWeights: [1.0, 1.0], outputBias: -0.5 },
  xor: { input1: 1.0, input2: 0.0, hiddenWeights: [[1.0, 1.0], [1.0, 1.0]],   hiddenBiases: [-0.5, -1.5], outputWeights: [1.0, -1.0], outputBias: -0.5 },
};

const relu    = (x: number) => Math.max(0, x);
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export default function NeuralNetworksPage() {
  const [net, setNet]                         = useState<NetworkState>(DEFAULT);
  const [preset, setPreset]                   = useState('default');
  const [hoveredConn, setHoveredConn]         = useState<string | null>(null);
  const [pinnedConn, setPinnedConn]           = useState<string | null>(null);
  const [hoveredNeuron, setHoveredNeuron]     = useState<string | null>(null);
  const [pinnedNeuron, setPinnedNeuron]       = useState<string | null>(null);
  const [isAnimating, setIsAnimating]         = useState(false);
  const [animStep, setAnimStep]               = useState(0);

  useEffect(() => {
    if (!isAnimating) return;
    const t = setInterval(() => setAnimStep(p => (p + 1) % 3), 900);
    return () => clearInterval(t);
  }, [isAnimating]);

  const inputs = [net.input1, net.input2];
  const hidden = net.hiddenWeights.map((ws, i) => {
    const pre = ws[0] * inputs[0] + ws[1] * inputs[1] + net.hiddenBiases[i];
    return { pre, post: relu(pre) };
  });
  const outPre  = hidden.reduce((s, h, i) => s + h.post * net.outputWeights[i], 0) + net.outputBias;
  const outPost = sigmoid(outPre);

  const activeConn   = pinnedConn   || hoveredConn;
  const activeNeuron = pinnedNeuron || hoveredNeuron;

  const getConnInfo = () => {
    if (!activeConn) return null;
    const p = activeConn.split('-');
    if (p[0] === 'i' && p[2] === 'h') {
      const h = +p[3], i = +p[1], w = net.hiddenWeights[h][i];
      return { label: `Input ${i+1} → Hidden ${h+1}`, w };
    }
    if (p[0] === 'h' && p[2] === 'o') {
      const h = +p[1], w = net.outputWeights[h];
      return { label: `Hidden ${h+1} → Output`, w };
    }
    return null;
  };

  const getNeuronInfo = () => {
    if (!activeNeuron) return null;
    if (activeNeuron === 'output') return { label: 'Output', val: outPost, desc: `σ(${outPre.toFixed(3)}) = ${outPost.toFixed(4)}` };
    const [layer, i] = activeNeuron.split('-');
    const idx = +i;
    if (layer === 'inp') return { label: `Input ${idx+1}`, val: inputs[idx], desc: `Raw input: ${inputs[idx].toFixed(3)}` };
    if (layer === 'hid') return { label: `Hidden ${idx+1}`, val: hidden[idx].post, desc: `pre: ${hidden[idx].pre.toFixed(3)}, ReLU → ${hidden[idx].post.toFixed(3)}` };
    return null;
  };

  const connInfo   = getConnInfo();
  const neuronInfo = getNeuronInfo();
  const activeInfo = connInfo || neuronInfo;

  const LX = { inp: 90, hid: 280, out: 470 };
  const ny = (layer: string, i: number) => layer === 'out' ? 160 : 90 + i * 140;
  const actColor = (v: number) => `rgba(224,112,96,${0.12 + Math.min(Math.abs(v), 1) * 0.7})`;

  return (
    <div style={{ padding: '32px 40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.3px', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Neural Networks
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '640px' }}>
          Click neurons and connections to inspect values. Adjust inputs and weights to see signals propagate in real time.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', minHeight: '460px' }}>

        {/* Visualization */}
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Forward Pass
            </span>
            <button onClick={() => setIsAnimating(a => !a)}
              style={{ padding: '4px 12px', borderRadius: '5px', border: `1px solid ${isAnimating ? 'rgba(90,154,110,0.4)' : 'rgba(224,112,96,0.35)'}`, background: isAnimating ? 'rgba(90,154,110,0.1)' : 'rgba(224,112,96,0.1)', color: isAnimating ? '#5a9a6e' : '#e07060', fontFamily: 'var(--font-mono)', fontSize: '11px', cursor: 'pointer' }}>
              {isAnimating ? '⏸ Stop' : '▶ Animate'}
            </button>
          </div>

          <svg viewBox="0 0 560 320" style={{ width: '100%', height: 'auto' }}>
            {/* Layer labels */}
            {[['INPUT', LX.inp], ['HIDDEN', LX.hid], ['OUTPUT', LX.out]].map(([lbl, x]) => (
              <text key={lbl} x={x as number} y="24" textAnchor="middle"
                style={{ fill: '#555', fontSize: '9px', fontFamily: 'var(--font-mono)', letterSpacing: '1.5px' }}>
                {lbl}
              </text>
            ))}

            {/* Input → Hidden connections */}
            {hidden.map((_, hIdx) => inputs.map((_, iIdx) => {
              const id = `i-${iIdx}-h-${hIdx}`;
              const w = net.hiddenWeights[hIdx][iIdx];
              const active = activeConn === id;
              const opacity = isAnimating ? (animStep === 0 ? 0.8 : 0.12) : (active ? 1 : 0.5);
              return (
                <line key={id}
                  x1={LX.inp} y1={ny('inp', iIdx)} x2={LX.hid} y2={ny('hid', hIdx)}
                  stroke={w >= 0 ? '#e07060' : '#c75a5a'}
                  strokeWidth={active ? Math.abs(w) * 5 + 2 : Math.abs(w) * 3 + 1}
                  strokeOpacity={opacity}
                  style={{ cursor: 'pointer', transition: 'stroke-opacity 0.2s' }}
                  onMouseEnter={() => setHoveredConn(id)} onMouseLeave={() => setHoveredConn(null)}
                  onClick={() => setPinnedConn(pinnedConn === id ? null : id)}
                />
              );
            }))}

            {/* Hidden → Output connections */}
            {hidden.map((_, hIdx) => {
              const id = `h-${hIdx}-o-0`;
              const w = net.outputWeights[hIdx];
              const active = activeConn === id;
              const opacity = isAnimating ? (animStep === 1 ? 0.8 : 0.12) : (active ? 1 : 0.5);
              return (
                <line key={id}
                  x1={LX.hid} y1={ny('hid', hIdx)} x2={LX.out} y2={ny('out', 0)}
                  stroke={w >= 0 ? '#5ba3b5' : '#c75a5a'}
                  strokeWidth={active ? Math.abs(w) * 5 + 2 : Math.abs(w) * 3 + 1}
                  strokeOpacity={opacity}
                  style={{ cursor: 'pointer', transition: 'stroke-opacity 0.2s' }}
                  onMouseEnter={() => setHoveredConn(id)} onMouseLeave={() => setHoveredConn(null)}
                  onClick={() => setPinnedConn(pinnedConn === id ? null : id)}
                />
              );
            })}

            {/* Input neurons */}
            {inputs.map((v, i) => {
              const id = `inp-${i}`;
              const active = activeNeuron === id;
              return (
                <g key={id} style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredNeuron(id)} onMouseLeave={() => setHoveredNeuron(null)}
                  onClick={() => setPinnedNeuron(pinnedNeuron === id ? null : id)}>
                  <circle cx={LX.inp} cy={ny('inp', i)} r="32"
                    fill={active ? 'rgba(224,112,96,0.55)' : actColor(v)}
                    stroke="#e07060" strokeWidth={active ? 2.5 : 1.5}
                    style={{ transition: 'fill 0.2s' }} />
                  <text x={LX.inp} y={ny('inp', i) + 5} textAnchor="middle"
                    style={{ fill: '#e7e5e2', fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, pointerEvents: 'none' }}>
                    {v.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Hidden neurons */}
            {hidden.map((h, i) => {
              const id = `hid-${i}`;
              const active = activeNeuron === id;
              return (
                <g key={id} style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredNeuron(id)} onMouseLeave={() => setHoveredNeuron(null)}
                  onClick={() => setPinnedNeuron(pinnedNeuron === id ? null : id)}>
                  <circle cx={LX.hid} cy={ny('hid', i)} r="32"
                    fill={active ? 'rgba(91,163,181,0.55)' : `rgba(91,163,181,${0.1 + h.post * 0.55})`}
                    stroke="#5ba3b5" strokeWidth={active ? 2.5 : 1.5}
                    style={{ transition: 'fill 0.2s' }} />
                  <text x={LX.hid} y={ny('hid', i) + 5} textAnchor="middle"
                    style={{ fill: '#e7e5e2', fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, pointerEvents: 'none' }}>
                    {h.post.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Output neuron */}
            {(() => {
              const id = 'output';
              const active = activeNeuron === id;
              const opacity = isAnimating ? (animStep === 2 ? 1 : 0.35) : 1;
              return (
                <g style={{ cursor: 'pointer' }} opacity={opacity}
                  onMouseEnter={() => setHoveredNeuron(id)} onMouseLeave={() => setHoveredNeuron(null)}
                  onClick={() => setPinnedNeuron(pinnedNeuron === id ? null : id)}>
                  <circle cx={LX.out} cy={ny('out', 0)} r="36"
                    fill={active ? 'rgba(139,122,168,0.6)' : `rgba(139,122,168,${0.12 + outPost * 0.65})`}
                    stroke="#8b7aa8" strokeWidth={active ? 2.5 : 1.5}
                    style={{ transition: 'fill 0.2s' }} />
                  <text x={LX.out} y={ny('out', 0) + 5} textAnchor="middle"
                    style={{ fill: '#e7e5e2', fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, pointerEvents: 'none' }}>
                    {outPost.toFixed(3)}
                  </text>
                </g>
              );
            })()}
          </svg>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid #2a2928', paddingTop: '14px' }}>
            {[
              { label: 'Output', value: outPost.toFixed(4), color: '#8b7aa8' },
              { label: 'Hidden 1', value: hidden[0].post.toFixed(3), color: '#5ba3b5' },
              { label: 'Hidden 2', value: hidden[1].post.toFixed(3), color: '#5ba3b5' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color }}>{value}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Active info */}
          {activeInfo ? (
            <div style={{ background: 'rgba(26,25,24,0.97)', border: '1px solid rgba(224,112,96,0.3)', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e07060', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {connInfo?.label || neuronInfo?.label}
                </span>
                {(pinnedConn || pinnedNeuron) && (
                  <button onClick={() => { setPinnedConn(null); setPinnedNeuron(null); }}
                    style={{ color: '#666', fontSize: '13px', background: 'none', cursor: 'pointer', padding: '0 0 0 8px' }}>✕</button>
                )}
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#888', lineHeight: 1.4, marginBottom: '4px' }}>
                {neuronInfo?.desc || (connInfo && `Weight: ${connInfo.w.toFixed(4)} — ${connInfo.w >= 0 ? 'positive: amplifies signal' : 'negative: inhibits signal'}`)}
              </p>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: '#e07060' }}>
                {connInfo ? connInfo.w.toFixed(4) : neuronInfo?.val.toFixed(4)}
              </span>
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#555', textAlign: 'center' }}>
              click a neuron or connection to inspect
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Controls
          </span>

          {/* Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Presets</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
              {Object.keys(PRESETS).map(key => (
                <button key={key} onClick={() => { setNet(PRESETS[key]); setPreset(key); }}
                  style={{ padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, border: preset === key ? '1px solid rgba(224,112,96,0.45)' : '1px solid #333', background: preset === key ? 'rgba(224,112,96,0.12)' : 'none', color: preset === key ? '#e07060' : '#888', transition: 'all 0.15s' }}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inputs</span>
            {(['input1', 'input2'] as const).map((key, i) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>Input {i + 1}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#e07060' }}>{net[key].toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="2" step="0.01" value={net[key]}
                  onChange={e => { setNet(p => ({ ...p, [key]: +e.target.value })); setPreset('default'); }}
                  style={{ width: '100%', accentColor: '#e07060', cursor: 'pointer' }} />
              </div>
            ))}
          </div>

          {/* Hidden weights */}
          <div style={{ borderTop: '1px solid #2a2928', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hidden Weights</span>
            {net.hiddenWeights.map((ws, hIdx) => ws.map((w, iIdx) => (
              <div key={`${hIdx}-${iIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#555' }}>i{iIdx+1}→h{hIdx+1}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: w >= 0 ? '#e07060' : '#c75a5a' }}>{w.toFixed(2)}</span>
                </div>
                <input type="range" min="-1" max="1" step="0.01" value={w}
                  onChange={e => { const nw = net.hiddenWeights.map(r => [...r]); nw[hIdx][iIdx] = +e.target.value; setNet(p => ({ ...p, hiddenWeights: nw })); setPreset('default'); }}
                  style={{ width: '100%', accentColor: '#e07060', cursor: 'pointer' }} />
              </div>
            )))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', borderTop: '1px solid #2a2928', paddingTop: '14px' }}>
            <button onClick={() => { const r = () => (Math.random() - 0.5) * 2; setNet(p => ({ ...p, hiddenWeights: [[r(),r()],[r(),r()]], hiddenBiases: [r(),r()], outputWeights: [r(),r()], outputBias: r() })); setPreset('default'); }}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(139,122,168,0.35)', background: 'rgba(139,122,168,0.1)', color: '#8b7aa8', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              ↺ Randomize
            </button>
            <button onClick={() => { setNet(DEFAULT); setPreset('default'); }}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #333', background: 'none', color: '#666', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Key concepts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { title: 'Weights', desc: 'Learnable parameters controlling connection strength. Positive amplifies; negative inhibits the signal.', color: '#e07060' },
          { title: 'Biases',  desc: 'Offset values that shift the activation threshold, letting neurons fire even without strong inputs.', color: '#c9a86c' },
          { title: 'Activations', desc: 'Non-linear functions applied after the weighted sum. ReLU = max(0,x) in hidden layers; Sigmoid squashes output to [0,1].', color: '#5ba3b5' },
        ].map(({ title, desc, color }) => (
          <div key={title} style={{ padding: '14px 16px', background: 'transparent', borderRadius: '8px', border: '1px solid var(--grid-line)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color, marginBottom: '6px' }}>{title}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--grid-line)' }}>
        <a href="/" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e07060', textDecoration: 'none' }}>← Home</a>
        <a href="/chapters/backpropagation" style={{ padding: '8px 18px', borderRadius: '6px', background: '#e07060', color: '#1a1210', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Next: Backpropagation →
        </a>
      </div>
    </div>
  );
}
