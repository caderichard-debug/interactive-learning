'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type Task = 'seq2seq' | 'autoencoder';

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

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = (dx / len) * 8;
  const uy = (dy / len) * 8;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - ux} y2={y2 - uy} stroke="#555" strokeWidth="1.5" />
      <polygon points={`${x2},${y2} ${x2 - ux - uy * 0.35},${y2 - uy + ux * 0.35} ${x2 - ux + uy * 0.35},${y2 - uy - ux * 0.35}`} fill="#555" />
    </g>
  );
}

/** Mini token ticks inside a box (sequence length visualization). */
function TokenTicks({
  x, y, w, h, n, vertical,
}: { x: number; y: number; w: number; h: number; n: number; vertical: boolean }) {
  const cap = vertical ? 24 : 32;
  const count = Math.min(n, cap);
  if (count <= 0) return null;
  const gap = vertical ? h / (count + 1) : w / (count + 1);
  const els: ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    if (vertical) {
      const ty = y + gap * (i + 1);
      els.push(
        <line key={i} x1={x + 6} y1={ty} x2={x + w - 6} y2={ty} stroke="rgba(224,112,96,0.45)" strokeWidth="1.2" />,
      );
    } else {
      const tx = x + gap * (i + 1);
      els.push(
        <line key={i} x1={tx} y1={y + 6} x2={tx} y2={y + h - 6} stroke="rgba(224,112,96,0.45)" strokeWidth="1.2" />,
      );
    }
  }
  if (n > cap) {
    els.push(
      <text
        key="more"
        x={vertical ? x + w / 2 : x + w / 2}
        y={vertical ? y + h - 4 : y + h - 3}
        textAnchor="middle"
        style={{ fill: '#666', fontSize: '7px', fontFamily: 'var(--font-mono)' }}
      >
        +{n - cap}
      </text>,
    );
  }
  return <g>{els}</g>;
}

export default function EncoderDecoderPage() {
  const [task, setTask] = useState<Task>('seq2seq');
  const [encLayers, setEncLayers] = useState(4);
  const [decLayers, setDecLayers] = useState(4);
  const [bottleneck, setBottleneck] = useState(256);
  const [srcTokens, setSrcTokens] = useState(32);
  const [tgtTokens, setTgtTokens] = useState(24);

  const vizRef = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const el = vizRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setNarrow(el.clientWidth < 520);
    });
    ro.observe(el);
    setNarrow(el.clientWidth < 520);
    return () => ro.disconnect();
  }, []);

  const isAe = task === 'autoencoder';
  const inLabel  = isAe ? 'Input x' : 'Source tokens';
  const outLabel = isAe ? 'Reconstruction x̂' : 'Target tokens';
  const ctxLabel = isAe ? 'Code z' : 'Context C';

  const tgtEff = isAe ? srcTokens : tgtTokens;

  const bw = 36 + Math.round((bottleneck / 512) * 52);

  const hIn  = Math.min(168, Math.max(46, 38 + srcTokens * 1.15));
  const hOut = Math.min(168, Math.max(46, 38 + tgtEff * 1.15));
  const hEnc = Math.min(210, Math.max(64, 48 + encLayers * 13));
  const hDec = Math.min(210, Math.max(64, 48 + decLayers * 13));
  const wEnc = Math.min(132, Math.max(64, 54 + encLayers * 6));
  const wDec = Math.min(132, Math.max(64, 54 + decLayers * 6));
  const wIn  = Math.min(118, Math.max(52, 46 + Math.min(srcTokens * 0.85, 62)));
  const wOut = Math.min(118, Math.max(52, 46 + Math.min(tgtEff * 0.85, 62)));

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

  const gap = 22;
  const maxH = Math.max(hIn, hEnc, 76, hDec, hOut);
  const cy = 24 + maxH / 2;

  const x0 = 20;
  const xEnc = x0 + wIn + gap;
  const xCtx = xEnc + wEnc + gap;
  const xDec = xCtx + bw + gap;
  const xOut = xDec + wDec + gap;
  const svgWHoriz = Math.max(520, xOut + wOut + 28);

  const horizontalDiagram = (
    <svg width={svgWHoriz} height={24 + maxH + 52} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="encFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(91,163,181,0.35)" />
          <stop offset="100%" stopColor="rgba(91,163,181,0.08)" />
        </linearGradient>
        <linearGradient id="decFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(139,122,168,0.35)" />
          <stop offset="100%" stopColor="rgba(139,122,168,0.08)" />
        </linearGradient>
      </defs>

      <rect x={x0} y={cy - hIn / 2} width={wIn} height={hIn} rx={8} fill="#2a2928" stroke="#444" strokeWidth="1" />
      <text x={x0 + wIn / 2} y={cy - hIn / 2 + 14} textAnchor="middle" style={{ fill: '#888', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>{inLabel}</text>
      <text x={x0 + wIn / 2} y={cy + 5} textAnchor="middle" style={{ fill: '#e7e5e2', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>T={srcTokens}</text>
      <TokenTicks x={x0} y={cy - hIn / 2} w={wIn} h={hIn} n={srcTokens} vertical={false} />

      <rect x={xEnc} y={cy - hEnc / 2} width={wEnc} height={hEnc} rx={8} fill="url(#encFill)" stroke="#5ba3b5" strokeWidth="1.2" />
      <text x={xEnc + wEnc / 2} y={cy - hEnc / 2 + 16} textAnchor="middle" style={{ fill: '#5ba3b5', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>ENCODER</text>
      <text x={xEnc + wEnc / 2} y={cy - 2} textAnchor="middle" style={{ fill: '#888', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>{encLayers} blocks</text>
      <text x={xEnc + wEnc / 2} y={cy + hEnc / 2 - 10} textAnchor="middle" style={{ fill: '#aaa', fontSize: '8px', fontFamily: 'var(--font-mono)' }}>self-attn + FFN</text>

      <rect x={xCtx} y={cy - 38} width={bw} height={76} rx={8} fill="rgba(224,112,96,0.12)" stroke="#e07060" strokeWidth="1.5" />
      <text x={xCtx + bw / 2} y={cy - 14} textAnchor="middle" style={{ fill: '#e07060', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{ctxLabel}</text>
      <text x={xCtx + bw / 2} y={cy + 10} textAnchor="middle" style={{ fill: '#888', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>dim {bottleneck}</text>

      <rect x={xDec} y={cy - hDec / 2} width={wDec} height={hDec} rx={8} fill="url(#decFill)" stroke="#8b7aa8" strokeWidth="1.2" />
      <text x={xDec + wDec / 2} y={cy - hDec / 2 + 16} textAnchor="middle" style={{ fill: '#8b7aa8', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>DECODER</text>
      <text x={xDec + wDec / 2} y={cy - 2} textAnchor="middle" style={{ fill: '#888', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>{decLayers} blocks</text>
      <text x={xDec + wDec / 2} y={cy + hDec / 2 - 10} textAnchor="middle" style={{ fill: '#aaa', fontSize: '8px', fontFamily: 'var(--font-mono)' }}>masked + cross</text>

      <rect x={xOut} y={cy - hOut / 2} width={wOut} height={hOut} rx={8} fill="#2a2928" stroke="#444" strokeWidth="1" />
      <text x={xOut + wOut / 2} y={cy - hOut / 2 + 14} textAnchor="middle" style={{ fill: '#888', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>{outLabel}</text>
      <text x={xOut + wOut / 2} y={cy + 5} textAnchor="middle" style={{ fill: '#e7e5e2', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{`T′=${tgtEff}`}</text>
      <TokenTicks x={xOut} y={cy - hOut / 2} w={wOut} h={hOut} n={tgtEff} vertical={false} />

      <Arrow x1={x0 + wIn} y1={cy} x2={xEnc} y2={cy} />
      <Arrow x1={xEnc + wEnc} y1={cy} x2={xCtx} y2={cy} />
      <Arrow x1={xCtx + bw} y1={cy} x2={xDec} y2={cy} />
      <Arrow x1={xDec + wDec} y1={cy} x2={xOut} y2={cy} />

      <text x={svgWHoriz / 2} y={24 + maxH + 36} textAnchor="middle" style={{ fill: '#555', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
        Wider / taller boxes reflect longer sequences and deeper stacks (schematic, not to scale with FLOPs).
      </text>
    </svg>
  );

  const boxW = Math.min(200, Math.max(118, 96 + bw * 0.35));
  const vGap = 18;
  const vy = 20;
  const vCx = 24 + boxW / 2;
  const svgWVert = boxW + 48;
  const hCtxV = 56;

  const yEncV = vy + hIn + vGap;
  const yCtxV = yEncV + hEnc + vGap;
  const yDecV = yCtxV + hCtxV + vGap;
  const yOutV = yDecV + hDec + vGap;
  const vertTotalH = yOutV + hOut + 40;

  const verticalDiagramFinal = (
    <svg width={svgWVert} height={vertTotalH} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="encFillVf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(91,163,181,0.35)" />
          <stop offset="100%" stopColor="rgba(91,163,181,0.08)" />
        </linearGradient>
        <linearGradient id="decFillVf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(139,122,168,0.35)" />
          <stop offset="100%" stopColor="rgba(139,122,168,0.08)" />
        </linearGradient>
      </defs>

      <rect x={vCx - wIn / 2} y={vy} width={wIn} height={hIn} rx={8} fill="#2a2928" stroke="#444" strokeWidth="1" />
      <text x={vCx} y={vy + 14} textAnchor="middle" style={{ fill: '#888', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>{inLabel}</text>
      <text x={vCx} y={vy + hIn / 2 + 4} textAnchor="middle" style={{ fill: '#e7e5e2', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>T={srcTokens}</text>
      <TokenTicks x={vCx - wIn / 2} y={vy} w={wIn} h={hIn} n={srcTokens} vertical />
      <Arrow x1={vCx} y1={vy + hIn} x2={vCx} y2={yEncV} />

      <rect x={vCx - wEnc / 2} y={yEncV} width={wEnc} height={hEnc} rx={8} fill="url(#encFillVf)" stroke="#5ba3b5" strokeWidth="1.2" />
      <text x={vCx} y={yEncV + 16} textAnchor="middle" style={{ fill: '#5ba3b5', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>ENCODER</text>
      <text x={vCx} y={yEncV + hEnc / 2 + 2} textAnchor="middle" style={{ fill: '#888', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>{encLayers} blocks</text>
      <text x={vCx} y={yEncV + hEnc - 10} textAnchor="middle" style={{ fill: '#aaa', fontSize: '8px', fontFamily: 'var(--font-mono)' }}>self-attn + FFN</text>
      <Arrow x1={vCx} y1={yEncV + hEnc} x2={vCx} y2={yCtxV} />

      <rect x={vCx - bw / 2} y={yCtxV} width={bw} height={hCtxV} rx={8} fill="rgba(224,112,96,0.12)" stroke="#e07060" strokeWidth="1.5" />
      <text x={vCx} y={yCtxV + 20} textAnchor="middle" style={{ fill: '#e07060', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{ctxLabel}</text>
      <text x={vCx} y={yCtxV + 40} textAnchor="middle" style={{ fill: '#888', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>dim {bottleneck}</text>
      <Arrow x1={vCx} y1={yCtxV + hCtxV} x2={vCx} y2={yDecV} />

      <rect x={vCx - wDec / 2} y={yDecV} width={wDec} height={hDec} rx={8} fill="url(#decFillVf)" stroke="#8b7aa8" strokeWidth="1.2" />
      <text x={vCx} y={yDecV + 16} textAnchor="middle" style={{ fill: '#8b7aa8', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>DECODER</text>
      <text x={vCx} y={yDecV + hDec / 2 + 2} textAnchor="middle" style={{ fill: '#888', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>{decLayers} blocks</text>
      <text x={vCx} y={yDecV + hDec - 10} textAnchor="middle" style={{ fill: '#aaa', fontSize: '8px', fontFamily: 'var(--font-mono)' }}>masked + cross</text>
      <Arrow x1={vCx} y1={yDecV + hDec} x2={vCx} y2={yOutV} />

      <rect x={vCx - wOut / 2} y={yOutV} width={wOut} height={hOut} rx={8} fill="#2a2928" stroke="#444" strokeWidth="1" />
      <text x={vCx} y={yOutV + 14} textAnchor="middle" style={{ fill: '#888', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>{outLabel}</text>
      <text x={vCx} y={yOutV + hOut / 2 + 4} textAnchor="middle" style={{ fill: '#e7e5e2', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{`T′=${tgtEff}`}</text>
      <TokenTicks x={vCx - wOut / 2} y={yOutV} w={wOut} h={hOut} n={tgtEff} vertical />

      <text x={vCx} y={vertTotalH - 8} textAnchor="middle" style={{ fill: '#555', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>Vertical flow when panel is narrow</text>
    </svg>
  );

  return (
    <div style={{ padding: '32px 40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.3px', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Encoder–Decoder Architecture
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '640px' }}>
          Two stacks with different roles: the encoder maps an input into a compact representation; the decoder consumes that representation to produce an output sequence or structure. Box sizes react to sequence length and depth; the diagram flips vertical when space is tight.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'stretch', minHeight: '520px' }}>
        <div ref={vizRef} style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {narrow ? 'Information flow (vertical)' : 'Information flow (horizontal)'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#e07060', opacity: 0.9 }}>
              {isAe ? 'Symmetric T' : `T=${srcTokens} → T′=${tgtEff}`}
            </span>
          </div>

          <div style={{ overflowX: narrow ? 'visible' : 'auto', overflowY: narrow ? 'auto' : 'visible' }}>
            {narrow ? verticalDiagramFinal : horizontalDiagram}
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
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }} htmlFor="ed-task">Architecture preset</label>
            <select
              id="ed-task"
              value={task}
              onChange={e => {
                const t = e.target.value as Task;
                setTask(t);
                if (t === 'autoencoder') setTgtTokens(srcTokens);
              }}
              style={selectStyle}
            >
              <option value="seq2seq">Seq2seq (different input / output)</option>
              <option value="autoencoder">Autoencoder (compress & reconstruct)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{isAe ? 'Sequence length T' : 'Source length T'}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#e07060' }}>{srcTokens}</span>
            </div>
            <input
              type="range"
              min={8}
              max={128}
              step={4}
              value={srcTokens}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                setSrcTokens(v);
                if (isAe) setTgtTokens(v);
              }}
              style={{ width: '100%', accentColor: '#e07060', cursor: 'pointer' }}
            />
          </div>

          {!isAe && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target length T′</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#5ba3b5' }}>{tgtTokens}</span>
              </div>
              <input type="range" min={8} max={128} step={4} value={tgtTokens}
                onChange={e => setTgtTokens(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#5ba3b5', cursor: 'pointer' }} />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bottleneck dim</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#e07060' }}>{bottleneck}</span>
            </div>
            <input type="range" min={64} max={512} step={32} value={bottleneck}
              onChange={e => setBottleneck(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#e07060', cursor: 'pointer' }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#555', lineHeight: 1.4, margin: 0 }}>
              Wider bottleneck widens the context box; deeper stacks grow encoder/decoder height.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666' }}>Encoder depth</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#5ba3b5' }}>{encLayers}</span>
            </div>
            <input type="range" min={2} max={12} step={1} value={encLayers}
              onChange={e => setEncLayers(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#5ba3b5', cursor: 'pointer' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666' }}>Decoder depth</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#8b7aa8' }}>{decLayers}</span>
            </div>
            <input type="range" min={2} max={12} step={1} value={decLayers}
              onChange={e => setDecLayers(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#8b7aa8', cursor: 'pointer' }} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '100px' }}>
            {infoBox(
              'Why two stacks?',
              'The encoder builds a representation that discards irrelevant detail. The decoder is free to be autoregressive or structured differently from the encoder — essential when T and T′ differ.',
              '#5ba3b5',
            )}
            {infoBox(
              'Vision analogy',
              'Segmentation models often use encoder–decoder U-shapes: encoder downsamples feature maps; decoder upsamples with skip connections. Same information asymmetry idea as in NLP.',
              '#8b7aa8',
            )}
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>At a glance</span>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#888', lineHeight: 1.5, margin: 0 }}>
              Encoder: <strong style={{ color: '#5ba3b5' }}>{encLayers}</strong> blocks · Decoder: <strong style={{ color: '#8b7aa8' }}>{decLayers}</strong> blocks · Bottleneck: <strong style={{ color: '#e07060' }}>{bottleneck}</strong>-dim {ctxLabel}. Sequences <strong style={{ color: '#e07060' }}>T={srcTokens}</strong>
              {!isAe && <> · <strong style={{ color: '#5ba3b5' }}>T′={tgtTokens}</strong></>}.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { title: 'Bottleneck & inductive bias', desc: 'A narrow bottleneck forces the model to compress — only structure that repeats or predicts well survives. That is an explicit architectural choice, not something the optimizer invents.', color: '#e07060' },
          { title: 'Cross-attention interface', desc: 'Each decoder layer can query all encoder positions, so every generated token can attend to the entire source. That is the glue between the two stacks in the original transformer.', color: '#5ba3b5' },
          { title: 'Training objectives', desc: 'Seq2seq is often trained with teacher forcing and a token-level loss. Autoencoders may use reconstruction loss in input space or a latent regularizer.', color: '#8b7aa8' },
        ].map(({ title, desc, color }) => (
          <div key={title} style={{ padding: '14px 16px', background: 'transparent', borderRadius: '8px', border: '1px solid var(--grid-line)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color, marginBottom: '6px' }}>{title}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #333' }}>
        <Link href="/chapters/regularization" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e07060', textDecoration: 'none' }}>
          ← Regularization
        </Link>
        <Link href="/chapters/residual-connections" style={{ padding: '8px 18px', borderRadius: '6px', background: '#e07060', color: '#1a1210', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Next: Residual & Skips →
        </Link>
      </div>
    </div>
  );
}
