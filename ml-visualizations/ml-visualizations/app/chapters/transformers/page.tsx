'use client';

import { useState, useEffect, useRef } from 'react';

interface Layer {
  name: string;
  type: 'input' | 'positional' | 'attention' | 'addnorm' | 'ffn' | 'output';
  desc: string;
  details: string[];
}

const LAYERS: Layer[] = [
  { name: 'Input Embeddings',   type: 'input',      desc: 'Convert tokens to dense 512-dim vectors.', details: ['Each token maps to a learned vector', 'Captures semantic meaning', 'Dimension: 512'] },
  { name: 'Positional Encoding', type: 'positional', desc: 'Add position information via sin/cos functions.', details: ['Sine & cosine at varying frequencies', 'Same dimension as embeddings (512)', 'Injected, not learned'] },
  { name: 'Multi-Head Attention', type: 'attention',  desc: 'Self-attention across 8 parallel heads.', details: ['Q, K, V projections per head', '8 heads × 64-dim = 512-dim total', 'Captures different relationship types'] },
  { name: 'Add & Norm',          type: 'addnorm',    desc: 'Residual connection + layer normalization.', details: ['x + Attention(x)', 'Stabilizes gradients in deep networks', 'Enables training of 100+ layer models'] },
  { name: 'Feed Forward',        type: 'ffn',        desc: 'Two-layer MLP applied to each position.', details: ['Expand: 512 → 2048 with ReLU', 'Contract: 2048 → 512', 'Applied independently per token'] },
  { name: 'Add & Norm',          type: 'addnorm',    desc: 'Second residual connection after FFN.', details: ['x + FFN(x)', 'Second normalization in encoder block', 'One full encoder block complete'] },
  { name: 'Output',              type: 'output',     desc: 'Rich contextual representations ready for use.', details: ['6 encoder blocks stacked', 'Each token now "sees" full context', 'Used for downstream tasks or decoder'] },
];

const LAYER_COLORS: Record<Layer['type'], string> = {
  input:      '#5ba3b5',
  positional: '#8b7aa8',
  attention:  '#e07060',
  addnorm:    '#5a9a6e',
  ffn:        '#c9a86c',
  output:     '#e07060',
};

const getPositionalEncoding = (pos: number, dim: number) =>
  Math.sin(pos / Math.pow(10000, (dim % 2) / 512));

export default function TransformersPage() {
  const [step, setStep]         = useState(0);
  const [inputText, setInputText] = useState('The model learns context');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const tokens = inputText.trim().split(/\s+/).slice(0, 8);
  const currentLayer = LAYERS[step];
  const color = LAYER_COLORS[currentLayer.type];

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStep(prev => {
          if (prev >= LAYERS.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, 1800);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [isPlaying]);

  // Positional encoding preview values
  const posEnc = tokens.map((_, pos) => ({
    pos,
    d0: getPositionalEncoding(pos, 0).toFixed(3),
    d1: getPositionalEncoding(pos, 1).toFixed(3),
  }));

  const progressPct = ((step + 1) / LAYERS.length) * 100;

  return (
    <div style={{ padding: '32px 40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.3px', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Transformer Architecture
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '640px' }}>
          Walk through each layer of a transformer encoder step by step. Click any layer to jump to it.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', minHeight: '460px' }}>

        {/* Architecture viz */}
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Encoder Architecture
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
              {step + 1} / {LAYERS.length}
            </span>
          </div>

          <div style={{ height: '2px', background: '#333', borderRadius: '1px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: color, transition: 'width 0.4s ease, background 0.3s ease', borderRadius: '1px' }} />
          </div>

          {/* Layer list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {LAYERS.map((layer, i) => {
              const isActive = i === step;
              const isPast   = i < step;
              const c = LAYER_COLORS[layer.type];
              return (
                <div key={i} onClick={() => { setStep(i); setIsPlaying(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                    border: isActive ? `1px solid ${c}40` : '1px solid transparent',
                    background: isActive ? `${c}0d` : 'none',
                    opacity: isPast ? 1 : isActive ? 1 : 0.4,
                    transition: 'all 0.2s',
                  }}>
                  {/* Color dot */}
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isPast || isActive ? c : '#444', flexShrink: 0, transition: 'background 0.3s' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: isActive ? 600 : 400, fontSize: '13px', color: isActive ? '#e7e5e2' : '#888' }}>{layer.name}</div>
                    {isActive && (
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#888', marginTop: '2px', lineHeight: 1.4 }}>{layer.desc}</div>
                    )}
                  </div>
                  {/* Active indicator bar */}
                  {isActive && <div style={{ width: '3px', height: '32px', borderRadius: '2px', background: c, flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>

          {/* Active layer detail card */}
          <div style={{ background: `${color}0d`, border: `1px solid ${color}30`, borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {currentLayer.name}
              </span>
              <button onClick={() => setShowDetails(d => !d)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', background: 'none', border: '1px solid #333', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer' }}>
                {showDetails ? 'less' : 'details'}
              </button>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#e7e5e2', lineHeight: 1.5 }}>{currentLayer.desc}</p>
            {showDetails && (
              <ul style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {currentLayer.details.map((d, i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', fontFamily: 'var(--font-body)', fontSize: '12px', color: '#888', lineHeight: 1.4 }}>
                    <span style={{ color, flexShrink: 0 }}>→</span>{d}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Positional encoding preview */}
          {currentLayer.type === 'positional' && (
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Encoding Preview (dims 0, 1)
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {posEnc.map(({ pos, d0, d1 }) => (
                  <div key={pos} style={{ flexShrink: 0, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#666', marginBottom: '4px' }}>{tokens[pos]}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#8b7aa8' }}>{d0}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#5ba3b5' }}>{d1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step controls */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => { setStep(s => Math.max(0, s - 1)); setIsPlaying(false); }}
              disabled={step === 0}
              style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #333', background: 'none', color: step === 0 ? '#444' : '#888', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: step === 0 ? 'not-allowed' : 'pointer' }}>
              ← Prev
            </button>
            <button onClick={() => setIsPlaying(p => !p)}
              style={{ padding: '8px 18px', borderRadius: '6px', border: `1px solid ${isPlaying ? 'rgba(90,154,110,0.4)' : 'rgba(224,112,96,0.35)'}`, background: isPlaying ? 'rgba(90,154,110,0.1)' : 'rgba(224,112,96,0.1)', color: isPlaying ? '#5a9a6e' : '#e07060', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
              {isPlaying ? '⏸ Pause' : '▶ Auto'}
            </button>
            <button onClick={() => { setStep(s => Math.min(LAYERS.length - 1, s + 1)); setIsPlaying(false); }}
              disabled={step === LAYERS.length - 1}
              style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid rgba(224,112,96,0.35)', background: 'rgba(224,112,96,0.1)', color: step === LAYERS.length - 1 ? '#555' : '#e07060', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: step === LAYERS.length - 1 ? 'not-allowed' : 'pointer' }}>
              Next →
            </button>
          </div>
        </div>

        {/* Controls + stats */}
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Controls
          </span>

          {/* Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Input Text</span>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              rows={3}
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', color: '#e7e5e2', border: '1px solid #333', borderRadius: '6px', padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '12px', resize: 'none', outline: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#e07060' }}>{tokens.length}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>tokens</span>
            </div>
          </div>

          {/* Quick examples */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Examples</span>
            {[
              'The model learns context',
              'Attention is all you need',
              'Transformers changed NLP',
            ].map(ex => (
              <button key={ex} onClick={() => setInputText(ex)}
                style={{ padding: '7px 10px', borderRadius: '6px', border: inputText === ex ? '1px solid rgba(224,112,96,0.4)' : '1px solid #333', background: inputText === ex ? 'rgba(224,112,96,0.08)' : 'none', color: inputText === ex ? '#e07060' : '#888', fontFamily: 'var(--font-body)', fontSize: '12px', textAlign: 'left', cursor: 'pointer' }}>
                {ex}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #333', paddingTop: '16px' }}>
            <button onClick={() => { setStep(0); setIsPlaying(true); }}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(224,112,96,0.35)', background: 'rgba(224,112,96,0.08)', color: '#e07060', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              ▶ Start Tour
            </button>
            <button onClick={() => { setStep(0); setIsPlaying(false); }}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #333', background: 'none', color: '#666', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
              ↺ Reset
            </button>
          </div>

          {/* Model stats */}
          <div style={{ borderTop: '1px solid #333', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Base Transformer</span>
            {[
              { label: 'Enc Layers', value: '6' },
              { label: 'Hidden Dim', value: '512' },
              { label: 'Heads',      value: '8' },
              { label: 'FFN Dim',    value: '2048' },
              { label: 'Params',     value: '~65M' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#e7e5e2' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key concepts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { title: 'Self-Attention',       desc: 'Each token directly attends to all other tokens, capturing long-range dependencies without sequential processing.', color: '#e07060' },
          { title: 'Positional Encoding',  desc: 'Sinusoidal encodings inject sequence order since attention itself has no sense of position.', color: '#8b7aa8' },
          { title: 'Residual Connections', desc: 'Add & Norm layers provide gradient highways that enable training of very deep transformer stacks.', color: '#5a9a6e' },
        ].map(({ title, desc, color }) => (
          <div key={title} style={{ padding: '14px 16px', background: 'transparent', borderRadius: '8px', border: '1px solid var(--grid-line)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color, marginBottom: '6px' }}>{title}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Encoder vs Decoder */}
      <div style={{ padding: '20px 24px', background: 'transparent', borderRadius: '10px', border: '1px solid var(--grid-line)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Encoder vs Decoder</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {[
            { title: 'Encoder', color: '#5ba3b5', items: ['Multi-head self-attention', 'Full bidirectional context', 'Residual + Layer Norm', '6 stacked identical blocks'] },
            { title: 'Decoder', color: '#8b7aa8', items: ['Masked self-attention (causal)', 'Cross-attention to encoder', 'Autoregressive generation', '6 stacked identical blocks'] },
          ].map(({ title, color, items }) => (
            <div key={title}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px', color, marginBottom: '8px' }}>{title}</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {items.map(item => (
                  <li key={item} style={{ display: 'flex', gap: '8px', fontFamily: 'var(--font-body)', fontSize: '12px', color: '#888' }}>
                    <span style={{ color, flexShrink: 0 }}>·</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #333' }}>
        <a href="/chapters/attention" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e07060', textDecoration: 'none' }}>
          ← Attention Mechanisms
        </a>
        <a href="/chapters/convolutional-networks" style={{ padding: '8px 18px', borderRadius: '6px', background: '#e07060', color: '#1a1210', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Next: Convolutional Networks →
        </a>
      </div>
    </div>
  );
}
