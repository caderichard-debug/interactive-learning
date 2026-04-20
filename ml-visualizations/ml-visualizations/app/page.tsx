import Link from 'next/link';
import EmailCapture from './components/EmailCapture';
import { homeChapters } from './components/HomeChapters';

const firstChapter = homeChapters[0];

export default function Home() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 40px 80px', width: '100%' }}>

        {/* Hero — nav lives in STYLE-GUIDE shell: Sidebar */}
        <div style={{ marginBottom: '72px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e07060', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', opacity: 0.85 }}>
            Interactive Education
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '42px', letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.15 }}>
            Machine Learning<br />Visualizations
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '520px', marginBottom: '28px' }}>
            Explore implemented chapters from the sidebar — convolutions, losses, softmax, regularization, and more — through hands-on interactives.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href={firstChapter.href}
              style={{ padding: '10px 22px', borderRadius: '8px', background: 'linear-gradient(180deg, #ef8070, #e07060)', color: '#1a1210', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              Start with {firstChapter.title} →
            </Link>
            <a href="#chapters"
              style={{ padding: '10px 22px', borderRadius: '8px', border: '1px solid #333', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '14px', textDecoration: 'none' }}>
              View Chapters
            </a>
          </div>
        </div>

        {/* Chapters */}
        <div id="chapters" style={{ marginBottom: '64px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            Chapters (live)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {homeChapters.map((ch) => (
              <Link key={ch.href} href={ch.href} className="chapter-item">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e07060', opacity: 0.7, minWidth: '24px', flexShrink: 0 }}>{ch.num}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '3px' }}>{ch.title}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{ch.desc}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#e07060', flexShrink: 0 }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Why interactive */}
        <div id="why" style={{ padding: '28px 32px', borderRadius: '12px', background: '#1a1918', border: '1px solid #333', marginBottom: '64px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            Why Interactive?
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
            Traditional ML resources use static diagrams and equations. These visualizations let you{' '}
            <strong style={{ color: '#e07060', fontWeight: 600 }}>adjust parameters in real time</strong>,{' '}
            <strong style={{ color: '#5ba3b5', fontWeight: 600 }}>watch gradients flow backward</strong>, and{' '}
            <strong style={{ color: '#8b7aa8', fontWeight: 600 }}>compare optimizers side by side</strong>{' '}
            — building intuition that static content simply cannot.
          </p>
        </div>

        {/* How to use */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            How to Use
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { n: '01', title: 'Choose a Chapter',  desc: 'Use the left sidebar or the list below — pick any implemented topic.' },
              { n: '02', title: 'Interact & Explore', desc: 'Adjust sliders, click neurons, manipulate the visualization.' },
              { n: '03', title: 'Build Intuition',    desc: 'See how changes propagate through the network in real time.' },
            ].map(({ n, title, desc }) => (
              <div key={n} style={{ padding: '18px', background: '#1a1918', borderRadius: '10px', border: '1px solid #333' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: '#e07060', marginBottom: '10px' }}>{n}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '6px' }}>{title}</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <EmailCapture variant="default" />

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.3px', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Ready to explore?
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Open the first live chapter or jump ahead from the sidebar.
          </p>
          <Link href={firstChapter.href}
            style={{ display: 'inline-block', padding: '12px 28px', borderRadius: '8px', background: 'linear-gradient(180deg, #ef8070, #e07060)', color: '#1a1210', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
            Start with {firstChapter.title} →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #333', padding: '20px 40px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#555', margin: 0 }}>
          Interactive educational platform inspired by{' '}
          <a href="https://brrrviz.com" target="_blank" rel="noopener noreferrer" style={{ color: '#e07060', textDecoration: 'none' }}>BrrrViz</a>
          {' '}· Shell layout per <code style={{ color: '#666' }}>STYLE-GUIDE.md</code>
        </p>
      </footer>
    </div>
  );
}
