'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface Net { weight: number; bias: number; input: number; target: number; lr: number; }

const sigmoid  = (x: number) => 1 / (1 + Math.exp(-x));
const sigmoidD = (x: number) => { const s = sigmoid(x); return s * (1 - s); };

const STEPS = [
  { key: 'start',        title: 'Initial State',        hint: 'We have a single-layer network with one weight.' },
  { key: 'forward',      title: 'Forward Pass',          hint: 'Compute weighted sum z = w·x + b.' },
  { key: 'activation',   title: 'Apply Activation',      hint: 'Output = σ(z) squashes z into [0, 1].' },
  { key: 'loss',         title: 'Compute Loss',          hint: 'Mean squared error: L = (output − target)²' },
  { key: 'dL_dOut',      title: '∂L/∂Output',            hint: 'Gradient of loss w.r.t. output = 2·error' },
  { key: 'dOut_dZ',      title: '∂Output/∂Z',            hint: "Sigmoid derivative: σ′(z) = σ(z)·(1−σ(z))" },
  { key: 'dZ_dW',        title: '∂Z/∂Weight',            hint: '∂(w·x+b)/∂w = x (the input value)' },
  { key: 'total_grad',   title: 'Chain Rule',            hint: '∂L/∂w = ∂L/∂Out × ∂Out/∂Z × ∂Z/∂w' },
  { key: 'update',       title: 'Weight Update',         hint: 'w_new = w_old − α × ∇w' },
  { key: 'done',         title: 'Step Complete',         hint: 'Apply the weight and start the next iteration.' },
];

export default function BackpropagationPage() {
  const [net, setNet] = useState<Net>({ weight: 0.5, bias: 0.0, input: 1.0, target: 0.8, lr: 0.1 });
  const [step, setStep]         = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory]   = useState<{ weight: number; loss: number }[]>([]);
  const [hovered, setHovered]   = useState<string | null>(null);
  const [pinned, setPinned]     = useState<string | null>(null);
  const intervalRef             = useRef<NodeJS.Timeout | null>(null);

  const z      = net.input * net.weight + net.bias;
  const out    = sigmoid(z);
  const err    = out - net.target;
  const loss   = err * err;
  const dL_dO  = 2 * err;
  const dO_dZ  = sigmoidD(z);
  const dZ_dW  = net.input;
  const grad   = dL_dO * dO_dZ * dZ_dW;
  const dw     = -net.lr * grad;
  const newW   = net.weight + dw;

  const applyAndReset = useCallback(() => {
    setNet(p => ({ ...p, weight: newW }));
    setHistory(h => [...h, { weight: newW, loss }]);
    setStep(0);
    setIsPlaying(false);
  }, [newW, loss]);

  const advance = useCallback(() => {
    setStep(p => {
      if (p >= STEPS.length - 1) { applyAndReset(); return 0; }
      return p + 1;
    });
  }, [applyAndReset]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(advance, 1400);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [isPlaying, advance]);

  const info: Record<string, string> = {
    input:  `Input x = ${net.input.toFixed(2)}`,
    weight: `w = ${net.weight.toFixed(4)}\ngrad = ${step >= 7 ? grad.toFixed(5) : '—'}\nΔw = ${step >= 8 ? dw.toFixed(5) : '—'}`,
    output: `z = ${z.toFixed(4)}\nσ(z) = ${out.toFixed(4)}\ntarget = ${net.target.toFixed(2)}\nerror = ${step >= 3 ? err.toFixed(4) : '—'}`,
  };
  const activeEl   = pinned || hovered;
  const progressPct = ((step + 1) / STEPS.length) * 100;
  const currentStep = STEPS[step];

  const getStepValue = () => {
    switch (step) {
      case 1: return `z = ${net.input.toFixed(2)} × ${net.weight.toFixed(3)} + ${net.bias.toFixed(2)} = ${z.toFixed(4)}`;
      case 2: return `σ(${z.toFixed(4)}) = ${out.toFixed(4)}`;
      case 3: return `L = (${out.toFixed(4)} − ${net.target})² = ${loss.toFixed(5)}`;
      case 4: return `2 × ${err.toFixed(4)} = ${dL_dO.toFixed(5)}`;
      case 5: return `σ′(${z.toFixed(3)}) = ${dO_dZ.toFixed(5)}`;
      case 6: return `∂Z/∂w = x = ${dZ_dW.toFixed(2)}`;
      case 7: return `${dL_dO.toFixed(4)} × ${dO_dZ.toFixed(4)} × ${dZ_dW} = ${grad.toFixed(5)}`;
      case 8: return `${net.weight.toFixed(4)} − ${net.lr} × ${grad.toFixed(4)} = ${newW.toFixed(4)}`;
      case 9: return `w updated: ${net.weight.toFixed(4)} → ${newW.toFixed(4)}`;
      default: return `w = ${net.weight.toFixed(4)}, target = ${net.target.toFixed(2)}`;
    }
  };

  return (
    <div style={{ padding: '32px 40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.3px', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Backpropagation
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '640px' }}>
          Step through the chain rule in action. Each step shows exactly how the gradient flows from loss back to the weight.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', minHeight: '460px' }}>

        {/* Visualization */}
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Gradient Flow
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
              {step + 1} / {STEPS.length}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: '2px', background: '#2a2928', borderRadius: '1px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: '#e07060', transition: 'width 0.4s ease', borderRadius: '1px' }} />
          </div>

          {/* Network SVG */}
          <svg viewBox="0 0 520 280" style={{ width: '100%', height: 'auto' }}>
            {/* Gradient flow arrow (backward) */}
            {step >= 7 && (
              <g>
                <defs>
                  <marker id="arrow-back" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#e07060" />
                  </marker>
                </defs>
                <path d="M 340 220 Q 260 260 180 220"
                  fill="none" stroke="#e07060" strokeWidth="1.5" strokeDasharray="4 3"
                  markerEnd="url(#arrow-back)" opacity={0.7} />
                <text x="260" y="272" textAnchor="middle"
                  style={{ fill: '#e07060', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                  ∇ = {grad.toFixed(4)}
                </text>
              </g>
            )}

            {/* Connection */}
            <line x1="160" y1="140" x2="360" y2="140"
              stroke={step >= 7 ? '#e07060' : '#444'}
              strokeWidth={step >= 7 ? Math.min(Math.abs(grad) * 40 + 2, 6) : 2}
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={() => setHovered('weight')} onMouseLeave={() => setHovered(null)}
              onClick={() => setPinned(pinned === 'weight' ? null : 'weight')}
            />
            {/* Weight label */}
            <text x="260" y="128" textAnchor="middle"
              style={{ fill: '#888', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              w = {net.weight.toFixed(4)}
            </text>
            {step >= 8 && (
              <text x="260" y="108" textAnchor="middle"
                style={{ fill: '#5a9a6e', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                Δw = {dw.toFixed(4)}
              </text>
            )}

            {/* Input neuron */}
            <circle cx="120" cy="140" r="40"
              fill={hovered === 'input' || pinned === 'input' ? '#e07060' : `rgba(224,112,96,${0.2 + net.input * 0.2})`}
              stroke="#e07060" strokeWidth={step <= 1 ? '2.5' : '1.5'}
              style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
              onMouseEnter={() => setHovered('input')} onMouseLeave={() => setHovered(null)}
              onClick={() => setPinned(pinned === 'input' ? null : 'input')}
            />
            <text x="120" y="136" textAnchor="middle"
              style={{ fill: '#e7e5e2', fontSize: '11px', fontFamily: 'var(--font-display)', fontWeight: 600, pointerEvents: 'none' }}>Input</text>
            <text x="120" y="153" textAnchor="middle"
              style={{ fill: '#e07060', fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, pointerEvents: 'none' }}>
              {net.input.toFixed(2)}
            </text>

            {/* Output neuron */}
            <circle cx="400" cy="140" r="40"
              fill={hovered === 'output' || pinned === 'output' ? '#8b7aa8' : `rgba(139,122,168,${0.15 + out * 0.4})`}
              stroke="#8b7aa8" strokeWidth={step >= 2 && step <= 3 ? '2.5' : '1.5'}
              style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
              onMouseEnter={() => setHovered('output')} onMouseLeave={() => setHovered(null)}
              onClick={() => setPinned(pinned === 'output' ? null : 'output')}
            />
            <text x="400" y="136" textAnchor="middle"
              style={{ fill: '#e7e5e2', fontSize: '11px', fontFamily: 'var(--font-display)', fontWeight: 600, pointerEvents: 'none' }}>Output</text>
            <text x="400" y="153" textAnchor="middle"
              style={{ fill: '#8b7aa8', fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, pointerEvents: 'none' }}>
              {out.toFixed(4)}
            </text>

            {/* Target + error */}
            <text x="400" y="210" textAnchor="middle"
              style={{ fill: '#666', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
              target: {net.target.toFixed(2)}
            </text>
            {step >= 3 && (
              <text x="400" y="228" textAnchor="middle"
                style={{ fill: Math.abs(err) < 0.05 ? '#5a9a6e' : '#c75a5a', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                err: {err.toFixed(4)}
              </text>
            )}
          </svg>

          {/* Element info */}
          {activeEl && info[activeEl] && (
            <div style={{ background: 'rgba(26,25,24,0.97)', border: '1px solid rgba(224,112,96,0.25)', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e07060', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{activeEl}</span>
                {pinned && <button onClick={() => setPinned(null)} style={{ color: '#666', fontSize: '13px', background: 'none', cursor: 'pointer' }}>✕</button>}
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#e7e5e2', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {info[activeEl]}
              </p>
            </div>
          )}

          {/* Step description */}
          <div style={{ background: 'rgba(224,112,96,0.06)', border: '1px solid rgba(224,112,96,0.15)', borderRadius: '8px', padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e07060', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              {currentStep.title}
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#e7e5e2', lineHeight: 1.5, marginBottom: '8px' }}>
              {currentStep.hint}
            </p>
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '6px', padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e07060', fontWeight: 600 }}>
              {getStepValue()}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #333', background: 'none', color: step === 0 ? '#444' : '#888', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: step === 0 ? 'not-allowed' : 'pointer' }}>
              ← Prev
            </button>
            <button onClick={() => setIsPlaying(p => !p)}
              style={{ padding: '8px 18px', borderRadius: '6px', border: `1px solid ${isPlaying ? 'rgba(90,154,110,0.4)' : 'rgba(224,112,96,0.35)'}`, background: isPlaying ? 'rgba(90,154,110,0.1)' : 'rgba(224,112,96,0.1)', color: isPlaying ? '#5a9a6e' : '#e07060', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
              {isPlaying ? '⏸ Pause' : '▶ Auto'}
            </button>
            <button onClick={advance}
              style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid rgba(224,112,96,0.35)', background: 'rgba(224,112,96,0.1)', color: '#e07060', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
              {step >= STEPS.length - 1 ? 'Apply →' : 'Next →'}
            </button>
          </div>
        </div>

        {/* Controls panel */}
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Parameters
          </span>

          {([
            { label: 'Learning Rate α', key: 'lr' as const, min: 0.01, max: 0.5, step: 0.01, color: '#e07060' },
            { label: 'Target',          key: 'target' as const, min: 0, max: 1, step: 0.01, color: '#5ba3b5' },
            { label: 'Input',           key: 'input'  as const, min: 0, max: 2, step: 0.01, color: '#e07060' },
          ]).map(({ label, key, min, max, step: s, color }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color }}>{net[key].toFixed(2)}</span>
              </div>
              <input type="range" min={min} max={max} step={s} value={net[key]}
                onChange={e => setNet(p => ({ ...p, [key]: +e.target.value }))}
                style={{ width: '100%', accentColor: color, cursor: 'pointer' }} />
            </div>
          ))}

          {/* Live state */}
          <div style={{ borderTop: '1px solid #2a2928', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current State</span>
            {[
              { label: 'Weight',   value: net.weight.toFixed(5), color: '#e7e5e2' },
              { label: 'Output',   value: out.toFixed(5),         color: '#8b7aa8' },
              { label: 'Error',    value: err.toFixed(5),         color: Math.abs(err) < 0.05 ? '#5a9a6e' : '#c75a5a' },
              { label: 'Loss',     value: loss.toFixed(5),        color: '#e7e5e2' },
              { label: 'Gradient', value: step >= 7 ? grad.toFixed(5) : '—', color: '#e07060' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', borderTop: '1px solid #2a2928', paddingTop: '14px' }}>
            <button onClick={applyAndReset}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(139,122,168,0.35)', background: 'rgba(139,122,168,0.1)', color: '#8b7aa8', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              ⚡ Apply & Reset
            </button>
            <button onClick={() => { setStep(0); setHistory([]); setIsPlaying(false); setNet(p => ({ ...p, weight: 0.5 })); }}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #333', background: 'none', color: '#666', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
              ↺ Reset Network
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div style={{ borderTop: '1px solid #2a2928', paddingTop: '14px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                History ({history.length} iters)
              </span>
              <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {history.slice(-8).map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666' }}>iter {history.length - (history.slice(-8).length) + i + 1}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: e.loss < 0.01 ? '#5a9a6e' : '#888' }}>L={e.loss.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key concepts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {[
          { title: 'Chain Rule',          desc: 'Multiply local gradients along the path: ∂L/∂w = ∂L/∂Out × ∂Out/∂Z × ∂Z/∂w', color: '#e07060' },
          { title: 'Gradient Descent',    desc: 'Update each weight opposite to its gradient: w_new = w_old − α × ∇w', color: '#5a9a6e' },
          { title: 'Efficiency',          desc: 'One backward pass computes all weight gradients simultaneously via dynamic programming.', color: '#8b7aa8' },
          { title: 'Vanishing Gradients', desc: 'In deep networks, repeated multiplication of small values shrinks gradients, stalling early-layer learning.', color: '#c9a86c' },
        ].map(({ title, desc, color }) => (
          <div key={title} style={{ padding: '14px 16px', background: 'transparent', borderRadius: '8px', border: '1px solid var(--grid-line)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color, marginBottom: '6px' }}>{title}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--grid-line)' }}>
        <a href="/chapters/neural-networks" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e07060', textDecoration: 'none' }}>← Neural Networks</a>
        <a href="/chapters/gradient-descent" style={{ padding: '8px 18px', borderRadius: '6px', background: '#e07060', color: '#1a1210', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Next: Gradient Descent →
        </a>
      </div>
    </div>
  );
}
