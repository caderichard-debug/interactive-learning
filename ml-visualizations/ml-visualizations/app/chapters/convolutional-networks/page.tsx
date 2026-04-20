'use client';

import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react';

const CELL_IN  = 24;
const CELL_OUT = 30;
const CELL_K   = 28;

type KernelName = 'identity' | 'edgeX' | 'edgeY' | 'sharpen' | 'blur';
type InputName  = 'circle' | 'edge' | 'checkerboard' | 'gradient';

const KERNELS: Record<KernelName, { label: string; values: number[][] }> = {
  identity: { label: 'Identity',     values: [[0,0,0],[0,1,0],[0,0,0]] },
  edgeX:    { label: 'Edge X (Sobel)', values: [[-1,0,1],[-2,0,2],[-1,0,1]] },
  edgeY:    { label: 'Edge Y (Sobel)', values: [[-1,-2,-1],[0,0,0],[1,2,1]] },
  sharpen:  { label: 'Sharpen',       values: [[0,-1,0],[-1,5,-1],[0,-1,0]] },
  blur:     { label: 'Blur (3×3 avg)', values: [[1,1,1],[1,1,1],[1,1,1]] },
};

const makeInput = (preset: InputName): number[][] =>
  Array.from({ length: 8 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => {
      switch (preset) {
        case 'circle': {
          const dx = c - 3.5, dy = r - 3.5;
          return Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 3.5);
        }
        case 'edge':         return c < 4 ? 0 : 1;
        case 'checkerboard': return (r + c) % 2;
        case 'gradient':     return c / 7;
      }
    })
  );

const computeFeatureMap = (input: number[][], kernel: number[][], isBlur: boolean): number[][] =>
  Array.from({ length: 6 }, (_, r) =>
    Array.from({ length: 6 }, (_, c) => {
      let sum = 0;
      for (let kr = 0; kr < 3; kr++)
        for (let kc = 0; kc < 3; kc++)
          sum += input[r + kr][c + kc] * kernel[kr][kc];
      return isBlur ? sum / 9 : sum;
    })
  );

const normalize = (map: number[][]): number[][] => {
  const flat = map.flat();
  const min = Math.min(...flat), max = Math.max(...flat);
  const range = max - min || 1;
  return map.map(row => row.map(v => (v - min) / range));
};

export default function ConvolutionalNetworksPage() {
  const [kernelName, setKernelName] = useState<KernelName>('edgeX');
  const [inputName, setInputName]   = useState<InputName>('circle');
  const [step, setStep]             = useState(0);
  const [playing, setPlaying]       = useState(false);
  const [hoveredOut, setHoveredOut] = useState<[number, number] | null>(null);
  const [pinnedOut, setPinnedOut]   = useState<[number, number] | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const input   = makeInput(inputName);
  const isBlur  = kernelName === 'blur';
  const kernel  = KERNELS[kernelName].values;
  const rawMap  = computeFeatureMap(input, kernel, isBlur);
  const normMap = normalize(rawMap);

  const outRow = Math.floor(step / 6);
  const outCol = step % 6;

  const isComputed = (r: number, c: number) => r * 6 + c <= step;
  const resolvedHover = hoveredOut && isComputed(hoveredOut[0], hoveredOut[1]) ? hoveredOut : null;
  const resolvedPin   = pinnedOut  && isComputed(pinnedOut[0],  pinnedOut[1])  ? pinnedOut  : null;
  const activeOut     = resolvedPin ?? resolvedHover ?? [outRow, outCol];

  const currentRaw = rawMap[activeOut[0]]?.[activeOut[1]] ?? 0;

  const dotTerms = Array.from({ length: 3 }, (_, kr) =>
    Array.from({ length: 3 }, (_, kc) => {
      const iv  = input[activeOut[0] + kr]?.[activeOut[1] + kc] ?? 0;
      const kv  = kernel[kr][kc];
      const kvDisp = isBlur ? '1/9' : String(kv);
      const prod = isBlur ? iv / 9 : iv * kv;
      return { iv, kvDisp, prod };
    })
  ).flat();

  const advance = useCallback(() => {
    setStep(s => {
      if (s >= 35) { setPlaying(false); return 35; }
      return s + 1;
    });
  }, []);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(advance, 180);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, advance]);

  const inputColor = (v: number) => {
    const c = Math.round(v * 220);
    return `rgb(${c},${c},${c})`;
  };

  const mapColor = (nv: number) => {
    if (nv > 0.5) {
      const t = (nv - 0.5) * 2;
      return `rgba(224,${Math.round(112 - t * 50)},${Math.round(96 - t * 40)},${0.2 + t * 0.8})`;
    }
    const t = (0.5 - nv) * 2;
    return `rgba(${Math.round(91 - t * 30)},${Math.round(163 - t * 70)},${Math.round(181 - t * 70)},${0.15 + t * 0.7})`;
  };

  const kernelCellColor = (v: number) => {
    if (v > 0) return `rgba(224, 112, 96, ${Math.min(v / 5, 1) * 0.65 + 0.12})`;
    if (v < 0) return `rgba(91, 163, 181, ${Math.min(-v / 5, 1) * 0.65 + 0.12})`;
    return 'rgba(42, 41, 40, 0.8)';
  };

  const INPUT_W = 8 * CELL_IN;
  const INPUT_H = 8 * CELL_IN;
  const OUT_W   = 6 * CELL_OUT;
  const OUT_H   = 6 * CELL_OUT;

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
        border: `1px solid rgba(224,112,96,0.2)`,
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
          Convolutional Networks
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '640px' }}>
          A kernel slides across an input grid, computing a dot product at each position to produce a feature map. Watch each output value get computed step by step.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'stretch', minHeight: '520px' }}>

        {/* Visualization panel */}
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, height: '100%' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {KERNELS[kernelName].label} · 8×8 → 6×6
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e07060' }}>
              step {step + 1} / 36
            </span>
          </div>

          {/* Grids row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', overflowX: 'auto' }}>

            {/* Input grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Input (8×8)</span>
              <svg width={INPUT_W} height={INPUT_H} style={{ display: 'block' }}>
                {input.map((row, r) => row.map((v, c) => {
                  const inWindow = r >= activeOut[0] && r <= activeOut[0] + 2 && c >= activeOut[1] && c <= activeOut[1] + 2;
                  return (
                    <rect key={`in-${r}-${c}`}
                      x={c * CELL_IN + 1} y={r * CELL_IN + 1}
                      width={CELL_IN - 2} height={CELL_IN - 2}
                      rx="1"
                      fill={inputColor(v)}
                      opacity={inWindow ? 1 : 0.28}
                    />
                  );
                }))}
                {/* Kernel window outline */}
                <rect
                  x={activeOut[1] * CELL_IN + 1}
                  y={activeOut[0] * CELL_IN + 1}
                  width={3 * CELL_IN - 2}
                  height={3 * CELL_IN - 2}
                  rx="2"
                  fill="none"
                  stroke="#e07060"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
              </svg>
            </div>

            {/* Kernel weights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kernel (3×3)</span>
              <svg width={3 * CELL_K} height={3 * CELL_K} style={{ display: 'block' }}>
                {kernel.map((row, r) => row.map((v, c) => (
                  <g key={`k-${r}-${c}`}>
                    <rect
                      x={c * CELL_K + 1} y={r * CELL_K + 1}
                      width={CELL_K - 2} height={CELL_K - 2}
                      rx="3"
                      fill={kernelCellColor(v)}
                    />
                    <text
                      x={c * CELL_K + CELL_K / 2} y={r * CELL_K + CELL_K / 2 + 4}
                      textAnchor="middle"
                      style={{ fill: '#e7e5e2', fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 600, pointerEvents: 'none' }}>
                      {isBlur ? '1/9' : v}
                    </text>
                  </g>
                )))}
              </svg>
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: '#e07060', opacity: 0.5 }}>→</span>
            </div>

            {/* Feature map */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feature Map (6×6)</span>
              <svg width={OUT_W} height={OUT_H} style={{ display: 'block' }}>
                {normMap.map((row, r) => row.map((nv, c) => {
                  const comp = isComputed(r, c);
                  const isA  = r === activeOut[0] && c === activeOut[1];
                  const isPv = pinnedOut?.[0] === r && pinnedOut?.[1] === c;
                  return (
                    <g key={`out-${r}-${c}`}>
                      <rect
                        x={c * CELL_OUT + 1} y={r * CELL_OUT + 1}
                        width={CELL_OUT - 2} height={CELL_OUT - 2}
                        rx="2"
                        fill={comp ? mapColor(nv) : '#2a2928'}
                        stroke={isA ? '#e07060' : 'transparent'}
                        strokeWidth={isA ? 1.5 : 0}
                        style={{ cursor: comp ? 'pointer' : 'default' }}
                        onMouseEnter={() => { if (comp) setHoveredOut([r, c]); }}
                        onMouseLeave={() => setHoveredOut(null)}
                        onClick={() => { if (comp) setPinnedOut(isPv ? null : [r, c]); }}
                      />
                      {comp && (
                        <text
                          x={c * CELL_OUT + CELL_OUT / 2} y={r * CELL_OUT + CELL_OUT / 2 + 4}
                          textAnchor="middle"
                          style={{ fill: nv > 0.6 ? '#1a1210' : '#888', fontSize: '8px', fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>
                          {rawMap[r][c].toFixed(1)}
                        </text>
                      )}
                    </g>
                  );
                }))}
              </svg>
            </div>
          </div>

          {/* Dot product breakdown */}
          <div style={{ background: 'rgba(26,25,24,0.97)', border: '1px solid rgba(224,112,96,0.3)', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e07060', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                output[{activeOut[0]},{activeOut[1]}] = Σ(input × kernel)
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: '#e07060' }}>{currentRaw.toFixed(3)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {dotTerms.map(({ iv, kvDisp, prod }, i) => (
                <span key={i} style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  color: prod > 0.001 ? '#e07060' : prod < -0.001 ? '#5ba3b5' : '#555',
                  background: 'rgba(0,0,0,0.25)', padding: '2px 6px', borderRadius: '3px',
                }}>
                  {iv.toFixed(2)}×{kvDisp}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Controls panel — match viz height; playback pinned to bottom */}
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
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }} htmlFor="conv-kernel">Kernel</label>
            <select
              id="conv-kernel"
              value={kernelName}
              onChange={e => {
                const k = e.target.value as KernelName;
                setKernelName(k);
                setStep(0);
                setPinnedOut(null);
                setPlaying(false);
              }}
              style={selectStyle}
            >
              {(Object.keys(KERNELS) as KernelName[]).map(k => (
                <option key={k} value={k}>{KERNELS[k].label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }} htmlFor="conv-input">Input image</label>
            <select
              id="conv-input"
              value={inputName}
              onChange={e => {
                const p = e.target.value as InputName;
                setInputName(p);
                setStep(0);
                setPinnedOut(null);
                setPlaying(false);
              }}
              style={{ ...selectStyle, borderColor: 'rgba(91,163,181,0.35)' }}
            >
              {(['circle', 'edge', 'checkerboard', 'gradient'] as InputName[]).map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '120px' }}>
            {infoBox(
              'Feature map',
              'Click any computed cell to pin the dot-product breakdown. Hover leaves follow the current animation step.',
              '#5ba3b5',
            )}
            {infoBox(
              'Output shape',
              'Stride 1, no padding: each 6×6 cell is one valid 3×3 placement — (8−3+1)² = 36 positions, visited in row-major order during playback.',
              '#e07060',
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
            {[
              { label: 'Position', value: `[${outRow},${outCol}]` },
              { label: 'Stride',   value: '1' },
              { label: 'Padding',  value: 'none' },
              { label: 'Size',     value: '8→6' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#e07060' }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Playback</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => { setStep(s => Math.max(0, s - 1)); setPinnedOut(null); }}
                style={{ flex: 1, padding: '7px', borderRadius: '6px', border: '1px solid #333', background: 'none', color: '#888', fontFamily: 'var(--font-mono)', fontSize: '14px', cursor: 'pointer' }}>‹</button>
              <button type="button" onClick={() => setPlaying(p => !p)}
                style={{ flex: 2, padding: '7px 10px', borderRadius: '6px', border: '1px solid rgba(224,112,96,0.35)', background: playing ? 'rgba(224,112,96,0.15)' : 'rgba(224,112,96,0.08)', color: '#e07060', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                {playing ? '⏸ Pause' : '▶ Play'}
              </button>
              <button type="button" onClick={() => { setStep(s => Math.min(35, s + 1)); setPinnedOut(null); }}
                style={{ flex: 1, padding: '7px', borderRadius: '6px', border: '1px solid #333', background: 'none', color: '#888', fontFamily: 'var(--font-mono)', fontSize: '14px', cursor: 'pointer' }}>›</button>
            </div>
            <button type="button" onClick={() => { setStep(0); setPlaying(false); setPinnedOut(null); }}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #333', background: 'none', color: '#666', fontFamily: 'var(--font-body)', fontSize: '12px', cursor: 'pointer' }}>
              ↺ Reset
            </button>
            <div style={{ height: '2px', background: '#2a2928', borderRadius: '1px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((step + 1) / 36) * 100}%`, background: '#e07060', transition: 'width 0.1s ease', borderRadius: '1px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Key concepts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { title: 'Sliding Window', desc: 'The kernel moves one step at a time across every position. With stride=1 and no padding, an 8×8 input and 3×3 kernel yields a 6×6 output: (8−3+1)² = 36 positions.', color: '#e07060' },
          { title: 'Feature Detection', desc: 'Edge kernels produce high values where brightness changes sharply. Blur kernels smooth by averaging neighbors. The kernel determines what pattern the layer responds to.', color: '#5ba3b5' },
          { title: 'Parameter Sharing', desc: 'One set of kernel weights is applied across every position in the input. This dramatically reduces parameters vs. fully-connected layers and adds translation invariance.', color: '#8b7aa8' },
        ].map(({ title, desc, color }) => (
          <div key={title} style={{ padding: '14px 16px', background: 'transparent', borderRadius: '8px', border: '1px solid var(--grid-line)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color, marginBottom: '6px' }}>{title}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #333' }}>
        <a href="/chapters/transformers" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e07060', textDecoration: 'none' }}>
          ← Transformers
        </a>
        <a href="/chapters/loss-functions" style={{ padding: '8px 18px', borderRadius: '6px', background: '#e07060', color: '#1a1210', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Next: Loss Functions →
        </a>
      </div>
    </div>
  );
}
