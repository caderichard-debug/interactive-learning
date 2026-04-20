'use client';

import { useState, useEffect, useCallback } from 'react';

const EXAMPLES = [
  { label: 'Simple',   text: 'The cat sat on the mat' },
  { label: 'Technical', text: 'Gradients flow through deep networks' },
  { label: 'Complex',  text: 'Attention allows models to focus' },
];

const generateWeights = (tokens: string[], headId: number): number[][] => {
  const n = tokens.length;
  const mat: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  // Seed with headId for reproducibility per head
  const rng = (i: number, j: number) => Math.abs(Math.sin((i * 13 + j * 7 + headId * 31) * 9301 + 49297) % 1);

  for (let i = 0; i < n; i++) {
    let row: number[] = [];
    for (let j = 0; j < n; j++) {
      let w = rng(i, j) * 0.1;
      if (i === j) w += 0.35 + rng(i, j) * 0.25;
      else if (Math.abs(i - j) === 1) w += 0.08 + rng(i, j) * 0.12;
      row.push(w);
    }
    // Softmax
    const sum = row.reduce((a, b) => a + b, 0);
    mat[i] = row.map(v => v / sum);
  }
  return mat;
};

export default function AttentionPage() {
  const [text, setText]           = useState('The cat sat on the mat');
  const [numHeads, setNumHeads]   = useState(4);
  const [activeHead, setActiveHead] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);
  const [pinnedCell, setPinnedCell]   = useState<[number, number] | null>(null);
  const [weights, setWeights]     = useState<number[][][]>([]);

  const tokens = text.trim().split(/\s+/).slice(0, 7);

  const regenWeights = useCallback(() => {
    setWeights(Array.from({ length: numHeads }, (_, h) => generateWeights(tokens, h)));
    setPinnedCell(null);
  }, [text, numHeads]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { regenWeights(); }, [regenWeights]);

  // Average across heads or show single head
  const displayMatrix: number[][] = weights.length > 0
    ? tokens.map((_, i) => tokens.map((_, j) => {
        const sum = weights.reduce((s, h) => s + (h[i]?.[j] ?? 0), 0);
        return sum / weights.length;
      }))
    : [];

  const focusMatrix = weights[activeHead] ?? displayMatrix;

  const cell = pinnedCell ?? hoveredCell;
  const cellInfo = cell && focusMatrix[cell[0]]?.[cell[1]] != null ? {
    from: tokens[cell[0]],
    to:   tokens[cell[1]],
    w:    focusMatrix[cell[0]][cell[1]],
  } : null;

  // SVG cell size
  const CELL = 46;
  const PAD  = 64; // left/top label space
  const n = tokens.length;
  const svgW = PAD + n * CELL + 8;
  const svgH = PAD + n * CELL + 8;

  const heatColor = (w: number) =>
    `rgba(224, ${Math.round(112 - w * 55)}, ${Math.round(96 - w * 30)}, ${0.15 + w * 0.85})`;

  return (
    <div style={{ padding: '32px 40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.3px', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Attention Mechanisms
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '640px' }}>
          Each token attends to every other token. The heatmap shows how much attention each word pays to each other word.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', minHeight: '460px' }}>

        {/* Heatmap */}
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Attention Matrix — {numHeads > 1 ? `avg of ${numHeads} heads` : '1 head'}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 4, 8].map(h => (
                <button key={h} onClick={() => setNumHeads(h)}
                  style={{ padding: '4px 10px', borderRadius: '5px', border: numHeads === h ? '1px solid rgba(224,112,96,0.5)' : '1px solid #333', background: numHeads === h ? 'rgba(224,112,96,0.12)' : 'none', color: numHeads === h ? '#e07060' : '#666', fontFamily: 'var(--font-mono)', fontSize: '11px', cursor: 'pointer' }}>
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Head tabs (only when >1 head) */}
          {numHeads > 1 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <button onClick={() => setActiveHead(-1)}
                style={{ padding: '3px 10px', borderRadius: '4px', border: activeHead === -1 ? '1px solid rgba(224,112,96,0.5)' : '1px solid #333', background: activeHead === -1 ? 'rgba(224,112,96,0.1)' : 'none', color: activeHead === -1 ? '#e07060' : '#666', fontFamily: 'var(--font-mono)', fontSize: '10px', cursor: 'pointer' }}>
                avg
              </button>
              {Array.from({ length: numHeads }, (_, i) => (
                <button key={i} onClick={() => setActiveHead(i)}
                  style={{ padding: '3px 10px', borderRadius: '4px', border: activeHead === i ? '1px solid rgba(224,112,96,0.5)' : '1px solid #333', background: activeHead === i ? 'rgba(224,112,96,0.1)' : 'none', color: activeHead === i ? '#e07060' : '#666', fontFamily: 'var(--font-mono)', fontSize: '10px', cursor: 'pointer' }}>
                  h{i + 1}
                </button>
              ))}
            </div>
          )}

          {/* SVG heatmap */}
          <div style={{ overflowX: 'auto' }}>
            <svg width={svgW} height={svgH} style={{ display: 'block' }}>
              {/* Column labels (target tokens — top) */}
              {tokens.map((tok, j) => (
                <text key={`col-${j}`} x={PAD + j * CELL + CELL / 2} y={PAD - 8} textAnchor="middle"
                  style={{ fill: '#888', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  {tok.length > 5 ? tok.slice(0, 4) + '…' : tok}
                </text>
              ))}
              {/* Row labels (source tokens — left) */}
              {tokens.map((tok, i) => (
                <text key={`row-${i}`} x={PAD - 6} y={PAD + i * CELL + CELL / 2 + 4} textAnchor="end"
                  style={{ fill: '#888', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  {tok.length > 5 ? tok.slice(0, 4) + '…' : tok}
                </text>
              ))}
              {/* Cells */}
              {focusMatrix.map((row, i) =>
                row.map((w, j) => {
                  const isHovered = hoveredCell?.[0] === i && hoveredCell?.[1] === j;
                  const isPinned  = pinnedCell?.[0]  === i && pinnedCell?.[1]  === j;
                  const isActive  = isHovered || isPinned;
                  return (
                    <g key={`${i}-${j}`}>
                      <rect
                        x={PAD + j * CELL + 1} y={PAD + i * CELL + 1}
                        width={CELL - 2} height={CELL - 2}
                        rx="3"
                        fill={heatColor(w)}
                        stroke={isActive ? '#e07060' : 'transparent'}
                        strokeWidth={isActive ? 1.5 : 0}
                        style={{ cursor: 'pointer', transition: 'fill 0.15s' }}
                        onMouseEnter={() => setHoveredCell([i, j])}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => setPinnedCell(isPinned ? null : [i, j])}
                      />
                      <text x={PAD + j * CELL + CELL / 2} y={PAD + i * CELL + CELL / 2 + 4}
                        textAnchor="middle" style={{ fill: w > 0.35 ? '#fff' : '#888', fontSize: '10px', fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>
                        {w.toFixed(2)}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>
          </div>

          {/* Cell info */}
          {cellInfo ? (
            <div style={{ background: 'rgba(26,25,24,0.97)', border: '1px solid rgba(224,112,96,0.3)', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e07060', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {cellInfo.from} → {cellInfo.to}
                </span>
                {pinnedCell && (
                  <button onClick={() => setPinnedCell(null)} style={{ color: '#666', fontSize: '13px', background: 'none', cursor: 'pointer', padding: '0 0 0 8px' }}>✕</button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: '#e07060' }}>{(cellInfo.w * 100).toFixed(1)}%</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>attention weight</span>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#888', marginTop: '4px', lineHeight: 1.4 }}>
                &ldquo;{cellInfo.from}&rdquo; directs {(cellInfo.w * 100).toFixed(1)}% of its attention toward &ldquo;{cellInfo.to}&rdquo;
              </p>
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#555', textAlign: 'center' }}>
              hover a cell to inspect attention weight
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Controls
          </span>

          {/* Input sentence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Input Sentence</span>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', color: '#e7e5e2', border: '1px solid #333', borderRadius: '6px', padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '12px', resize: 'none', outline: 'none' }}
              placeholder="Enter a sentence…"
            />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#e07060' }}>{tokens.length}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>tokens (max 7)</span>
            </div>
          </div>

          {/* Examples */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Examples</span>
            {EXAMPLES.map(ex => (
              <button key={ex.label} onClick={() => setText(ex.text)}
                style={{ padding: '7px 10px', borderRadius: '6px', border: text === ex.text ? '1px solid rgba(224,112,96,0.4)' : '1px solid #333', background: text === ex.text ? 'rgba(224,112,96,0.08)' : 'none', color: text === ex.text ? '#e07060' : '#888', fontFamily: 'var(--font-body)', fontSize: '12px', textAlign: 'left', cursor: 'pointer' }}>
                {ex.label}
              </button>
            ))}
          </div>

          {/* Regenerate */}
          <button onClick={regenWeights}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(224,112,96,0.35)', background: 'rgba(224,112,96,0.08)', color: '#e07060', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            ↻ Regenerate Weights
          </button>

          {/* Stats */}
          <div style={{ borderTop: '1px solid #333', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stats</span>
            {[
              { label: 'Tokens', value: String(tokens.length) },
              { label: 'Heads',  value: String(numHeads) },
              { label: 'Matrix', value: `${tokens.length}²` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#e07060' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key concepts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { title: 'Query · Key · Value', desc: 'Q×Kᵀ scores how much each token should attend to others. Scores are softmaxed then applied to V.', color: '#e07060' },
          { title: 'Scaled Dot-Product', desc: 'Scores are divided by √d_k before softmax to prevent gradients from vanishing in high dimensions.', color: '#5ba3b5' },
          { title: 'Multi-Head Benefits', desc: 'Parallel heads capture different relationship types — syntax, coreference, semantics — simultaneously.', color: '#8b7aa8' },
        ].map(({ title, desc, color }) => (
          <div key={title} style={{ padding: '14px 16px', background: 'transparent', borderRadius: '8px', border: '1px solid var(--grid-line)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color, marginBottom: '6px' }}>{title}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #333' }}>
        <a href="/chapters/gradient-descent" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e07060', textDecoration: 'none' }}>
          ← Gradient Descent
        </a>
        <a href="/chapters/transformers" style={{ padding: '8px 18px', borderRadius: '6px', background: '#e07060', color: '#1a1210', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Next: Transformers →
        </a>
      </div>
    </div>
  );
}
