'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Point { x: number; y: number; }
interface State  { path: Point[]; cur: Point; iter: number; running: boolean; vel: Point; m: Point; v: Point; }
type Opt = 'sgd' | 'momentum' | 'adam';

const CFG = {
  sgd:      { color: '#e07060', label: 'SGD',      desc: 'Vanilla gradient descent — simple, no memory' },
  momentum: { color: '#5ba3b5', label: 'Momentum', desc: 'Builds velocity to escape shallow minima' },
  adam:     { color: '#8b7aa8', label: 'Adam',     desc: 'Adaptive per-parameter learning rates' },
};

const loss = (x: number, y: number) => x * x + 2 * y * y + 0.3 * x * y;
const grad = (x: number, y: number) => ({ dx: 2 * x + 0.3 * y, dy: 4 * y + 0.3 * x });

export default function GradientDescentPage() {
  const [opt, setOpt]       = useState<Opt>('sgd');
  const [lr, setLr]         = useState(0.1);
  const [beta1, setBeta1]   = useState(0.9);
  const [start, setStart]   = useState<Point>({ x: -2, y: 2 });
  const [state, setState]   = useState<State>({ path: [], cur: { x: -2, y: 2 }, iter: 0, running: false, vel: { x:0,y:0 }, m: { x:0,y:0 }, v: { x:0,y:0 } });
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned]   = useState<string | null>(null);
  const intRef = useRef<NodeJS.Timeout | null>(null);
  const B2 = 0.999, EPS = 1e-8;

  const reset = useCallback(() => {
    if (intRef.current) clearInterval(intRef.current);
    setState({ path: [{ ...start }], cur: { ...start }, iter: 0, running: false, vel: { x:0,y:0 }, m: { x:0,y:0 }, v: { x:0,y:0 } });
  }, [start]);

  const step = useCallback(() => {
    setState(prev => {
      if (prev.iter >= 100) return { ...prev, running: false };
      const { cur, vel, m, v, iter } = prev;
      const g = grad(cur.x, cur.y);
      let nx: Point, nv = vel, nm = m, nv2 = v;

      if (opt === 'sgd') {
        nx = { x: cur.x - lr * g.dx, y: cur.y - lr * g.dy };
      } else if (opt === 'momentum') {
        nv = { x: beta1 * vel.x - lr * g.dx, y: beta1 * vel.y - lr * g.dy };
        nx = { x: cur.x + nv.x, y: cur.y + nv.y };
      } else {
        const t = iter + 1;
        nm = { x: beta1 * m.x + (1-beta1)*g.dx, y: beta1 * m.y + (1-beta1)*g.dy };
        nv2 = { x: B2*v.x + (1-B2)*g.dx*g.dx, y: B2*v.y + (1-B2)*g.dy*g.dy };
        const mh = { x: nm.x/(1-Math.pow(beta1,t)), y: nm.y/(1-Math.pow(beta1,t)) };
        const vh = { x: nv2.x/(1-Math.pow(B2,t)), y: nv2.y/(1-Math.pow(B2,t)) };
        nx = { x: cur.x - lr*mh.x/(Math.sqrt(vh.x)+EPS), y: cur.y - lr*mh.y/(Math.sqrt(vh.y)+EPS) };
      }
      return { ...prev, path: [...prev.path, nx], cur: nx, iter: iter+1, vel: nv, m: nm, v: nv2 };
    });
  }, [opt, lr, beta1]);

  useEffect(() => {
    if (state.running && state.iter < 100) {
      intRef.current = setInterval(() => {
        setState(p => { if (p.iter >= 99) return { ...p, running: false }; return p; });
        step();
      }, 80);
      return () => { if (intRef.current) clearInterval(intRef.current); };
    }
  }, [state.running, state.iter, step]);

  useEffect(() => { reset(); }, [start, opt, reset]);

  const curLoss = loss(state.cur.x, state.cur.y);
  const cfg = CFG[opt];

  // Contour lines
  const contours = [];
  for (let lvl = 0.5; lvl <= 15; lvl += 0.5) {
    const pts = [];
    for (let a = 0; a < 360; a += 3) {
      const r = (a * Math.PI) / 180;
      pts.push({ x: Math.sqrt(lvl)*Math.cos(r)*25+200, y: -Math.sqrt(lvl)*Math.sin(r)/Math.sqrt(2)*25+200 });
    }
    contours.push({ lvl, pts });
  }

  const pointInfo: Record<string, { title: string; content: string }> = {
    start:   { title: 'Start', content: `(${start.x.toFixed(2)}, ${start.y.toFixed(2)})\nloss = ${loss(start.x, start.y).toFixed(4)}` },
    current: { title: 'Current', content: `(${state.cur.x.toFixed(4)}, ${state.cur.y.toFixed(4)})\nloss = ${curLoss.toFixed(5)}\niter = ${state.iter}` },
    minimum: { title: 'Global Minimum', content: '(0.00, 0.00)\nloss = 0.0' },
  };
  const activePoint = pinned || hovered;

  return (
    <div style={{ padding: '32px 40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.3px', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Gradient Descent
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '640px' }}>
          Watch SGD, Momentum, and Adam navigate a loss landscape. Adjust the learning rate to see how it affects convergence.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', minHeight: '460px' }}>

        {/* Visualization */}
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Loss Landscape
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: cfg.color }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: cfg.color }}>{cfg.label}</span>
            </div>
          </div>

          <svg viewBox="0 0 400 400" style={{ width: '100%', height: 'auto' }}>
            {contours.map(c => (
              <polygon key={c.lvl}
                points={c.pts.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={`rgba(224,112,96,${0.03 + (c.lvl/15)*0.12})`}
                strokeWidth="0.8" />
            ))}

            {/* Path */}
            {state.path.length > 1 && (
              <polyline
                points={state.path.map(p => `${p.x*25+200},${-p.y*25+200}`).join(' ')}
                fill="none" stroke={cfg.color} strokeWidth="2.5" opacity="0.85"
                strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Start */}
            <circle cx={start.x*25+200} cy={-start.y*25+200} r="7"
              fill="rgba(224,112,96,0.35)" stroke="#e07060" strokeWidth="1.5"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered('start')} onMouseLeave={() => setHovered(null)}
              onClick={() => setPinned(pinned === 'start' ? null : 'start')} />
            <text x={start.x*25+215} y={-start.y*25+204}
              style={{ fill: '#e07060', fontSize: '10px', fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>start</text>

            {/* Current point */}
            {state.path.length > 0 && (
              <circle cx={state.cur.x*25+200} cy={-state.cur.y*25+200} r="9"
                fill={cfg.color}
                style={{ cursor: 'pointer', transition: 'cx 0.05s, cy 0.05s' }}
                onMouseEnter={() => setHovered('current')} onMouseLeave={() => setHovered(null)}
                onClick={() => setPinned(pinned === 'current' ? null : 'current')} />
            )}

            {/* Minimum */}
            <circle cx="200" cy="200" r="5"
              fill="#c75a5a" stroke="rgba(199,90,90,0.4)" strokeWidth="5"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered('minimum')} onMouseLeave={() => setHovered(null)}
              onClick={() => setPinned(pinned === 'minimum' ? null : 'minimum')} />
            <text x="213" y="204"
              style={{ fill: '#c75a5a', fontSize: '10px', fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>min</text>

            <text x="8" y="16" style={{ fill: '#444', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>loss increases outward →</text>
          </svg>

          {/* Point info */}
          {activePoint && pointInfo[activePoint] && (
            <div style={{ background: 'rgba(26,25,24,0.97)', border: '1px solid rgba(224,112,96,0.25)', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e07060', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{pointInfo[activePoint].title}</span>
                {pinned && <button onClick={() => setPinned(null)} style={{ color: '#666', fontSize: '13px', background: 'none', cursor: 'pointer' }}>✕</button>}
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#e7e5e2', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{pointInfo[activePoint].content}</p>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: '28px', borderTop: '1px solid #2a2928', paddingTop: '14px' }}>
            {[
              { label: 'Iteration', value: String(state.iter), color: '#e7e5e2' },
              { label: 'Loss',      value: curLoss.toFixed(4),  color: curLoss < 0.01 ? '#5a9a6e' : '#e7e5e2' },
              { label: 'LR',        value: lr.toFixed(3),        color: '#e07060' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color }}>{value}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div style={{ background: 'var(--visual-box)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Controls
          </span>

          {/* Optimizer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Optimizer</span>
            {(Object.entries(CFG) as [Opt, typeof CFG.sgd][]).map(([key, info]) => (
              <button key={key} onClick={() => setOpt(key)}
                style={{ padding: '8px 10px', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', border: opt === key ? `1px solid ${info.color}40` : '1px solid #333', background: opt === key ? `${info.color}15` : 'none', transition: 'all 0.15s' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: opt === key ? info.color : '#888', marginBottom: '1px' }}>{info.label}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#555', lineHeight: 1.3 }}>{info.desc}</div>
              </button>
            ))}
          </div>

          {/* LR slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>Learning Rate</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#e07060' }}>{lr.toFixed(3)}</span>
            </div>
            <input type="range" min="0.01" max="0.3" step="0.005" value={lr} onChange={e => setLr(+e.target.value)}
              style={{ width: '100%', accentColor: '#e07060', cursor: 'pointer' }} />
          </div>

          {/* Momentum beta */}
          {opt === 'momentum' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>Momentum β</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#5ba3b5' }}>{beta1.toFixed(2)}</span>
              </div>
              <input type="range" min="0.5" max="0.99" step="0.01" value={beta1} onChange={e => setBeta1(+e.target.value)}
                style={{ width: '100%', accentColor: '#5ba3b5', cursor: 'pointer' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#555' }}>higher = more momentum</span>
            </div>
          )}

          {/* Start position */}
          <div style={{ borderTop: '1px solid #2a2928', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Start Position</span>
            {(['x', 'y'] as const).map(ax => (
              <div key={ax} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>{ax.toUpperCase()}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#e7e5e2' }}>{start[ax].toFixed(1)}</span>
                </div>
                <input type="range" min="-3" max="3" step="0.1" value={start[ax]}
                  onChange={e => setStart(p => ({ ...p, [ax]: +e.target.value }))}
                  style={{ width: '100%', accentColor: '#e07060', cursor: 'pointer' }} />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', borderTop: '1px solid #2a2928', paddingTop: '14px' }}>
            {!state.running ? (
              <button onClick={() => setState(p => ({ ...p, running: true }))}
                style={{ padding: '8px 12px', borderRadius: '6px', border: `1px solid ${cfg.color}40`, background: `${cfg.color}15`, color: cfg.color, fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                ▶ Run
              </button>
            ) : (
              <button onClick={() => setState(p => ({ ...p, running: false }))}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(199,90,90,0.4)', background: 'rgba(199,90,90,0.1)', color: '#c75a5a', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                ⏸ Stop
              </button>
            )}
            <button onClick={reset}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #333', background: 'none', color: '#666', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
              ↺ Reset
            </button>
          </div>

          {/* Position readout */}
          {state.path.length > 1 && (
            <div style={{ borderTop: '1px solid #2a2928', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Position</span>
              {(['x', 'y'] as const).map(ax => (
                <div key={ax} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>{ax.toUpperCase()}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#e7e5e2' }}>{state.cur[ax].toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Optimizer comparison */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Optimizer Comparison
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {(Object.entries(CFG) as [Opt, typeof CFG.sgd][]).map(([key, info]) => (
            <div key={key} onClick={() => setOpt(key)}
              style={{ padding: '14px 16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', border: opt === key ? `1px solid ${info.color}40` : '1px solid var(--grid-line)', background: opt === key ? `${info.color}08` : 'transparent' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: info.color, marginBottom: '6px' }}>{info.label}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#888', lineHeight: 1.5 }}>
                {key === 'sgd'      && <><strong style={{ color: '#e7e5e2' }}>Pro:</strong> Simple, no extra state<br/><strong style={{ color: '#e7e5e2' }}>Con:</strong> Slow on ill-conditioned surfaces</>}
                {key === 'momentum' && <><strong style={{ color: '#e7e5e2' }}>Pro:</strong> Faster, escapes shallow minima<br/><strong style={{ color: '#e7e5e2' }}>Con:</strong> Can overshoot minimum</>}
                {key === 'adam'     && <><strong style={{ color: '#e7e5e2' }}>Pro:</strong> Adaptive, fast convergence<br/><strong style={{ color: '#e7e5e2' }}>Con:</strong> May generalize worse than SGD</>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--grid-line)' }}>
        <a href="/chapters/backpropagation" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e07060', textDecoration: 'none' }}>← Backpropagation</a>
        <a href="/chapters/attention" style={{ padding: '8px 18px', borderRadius: '6px', background: '#e07060', color: '#1a1210', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Next: Attention →
        </a>
      </div>
    </div>
  );
}
