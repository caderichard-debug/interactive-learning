import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#21201e' }}>
      {/* Navigation Bar */}
      <nav className="border-b px-6 py-4" style={{ borderColor: '#333333' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold hover-overlay" style={{ color: '#e07060' }}>
            DB Internals
          </Link>
          <div className="flex gap-6">
            <Link href="/chapters/b-trees" className="hover-overlay" style={{ color: '#888888' }}>
              Chapters
            </Link>
            <Link
              href="/chapters/b-trees"
              className="px-4 py-2 rounded text-white font-medium hover-overlay"
              style={{ background: '#e07060' }}
            >
              Start Learning →
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="mb-16">
          <h1 className="text-5xl font-bold mb-4" style={{ color: '#e7e5e2' }}>
            Interactive Database Internals
          </h1>
          <p className="text-xl mb-6" style={{ color: '#888888' }}>
            Understand B-Trees, write-ahead logging, and query planning through hands-on exploration.
          </p>
          <div className="flex gap-4">
            <Link
              href="/chapters/b-trees"
              className="px-6 py-3 text-white text-lg font-semibold rounded-lg hover-overlay"
              style={{ background: '#e07060' }}
            >
              Start Learning →
            </Link>
            <a
              href="#chapters"
              className="px-6 py-3 rounded-lg font-medium hover-overlay"
              style={{ background: '#1a1918', color: '#888888', border: '1px solid #333333' }}
            >
              View Chapters ↓
            </a>
          </div>
        </div>

        {/* Chapters Preview */}
        <div id="chapters" className="mb-16">
          <h2 className="text-3xl font-bold mb-8" style={{ color: '#e7e5e2' }}>
            Available Chapters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'B-Tree Indexing',
                href: '/chapters/b-trees',
                description: 'Interactive B-Tree with insert, delete, and search operations.',
                icon: '🌳',
                color: '#e07060'
              },
              {
                title: 'Write-Ahead Logging',
                href: '/chapters/wal',
                description: 'Understand how databases maintain ACID properties with WAL.',
                icon: '📝',
                color: '#10b981'
              },
              {
                title: 'Query Planning',
                href: '/chapters/query-planning',
                description: 'See how databases optimize and execute your queries.',
                icon: '🔍',
                color: '#8b5cf6'
              }
            ].map((chapter) => (
              <Link
                key={chapter.href}
                href={chapter.href}
                className="p-6 rounded-lg border-2 hover-overlay transition-all block"
                style={{
                  background: '#21201e',
                  borderColor: '#333333',
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                <div className="text-3xl mb-3">{chapter.icon}</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#e7e5e2' }}>
                  {chapter.title}
                </h3>
                <p className="text-sm mb-4" style={{ color: '#888888' }}>
                  {chapter.description}
                </p>
                <div className="text-sm font-medium" style={{ color: chapter.color }}>
                  Explore →
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Why Interactive? */}
        <div className="mb-16 p-8 rounded-lg" style={{ background: '#1a1918', border: '1px solid #333333' }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#e7e5e2' }}>
            Why Interactive?
          </h2>
          <p className="leading-relaxed mb-4" style={{ color: '#888888' }}>
            Database internals are often explained with static diagrams and complex terminology. These visualizations let you <strong style={{ color: '#e07060' }}>watch B-Trees rebalance in real-time</strong>, <strong style={{ color: '#10b981' }}>step through query execution plans</strong>, and <strong style={{ color: '#8b5cf6' }}>see how MVCC prevents dirty reads</strong>.
          </p>
          <p className="leading-relaxed" style={{ color: '#888888' }}>
            Each chapter pairs concise explanations with interactive demos you can manipulate. Insert a key and watch the tree split. Adjust the isolation level and see how concurrent transactions interact.
          </p>
        </div>

        {/* How to Use */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#e7e5e2' }}>
            How to Use
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg" style={{ background: '#1a1918', border: '1px solid #333333' }}>
              <div className="text-2xl mb-2" style={{ color: '#e07060' }}>1</div>
              <h3 className="font-semibold mb-2" style={{ color: '#e7e5e2' }}>Choose a Chapter</h3>
              <p className="text-sm" style={{ color: '#888888' }}>Start with B-Trees if you're new, or jump to any topic that interests you.</p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: '#1a1918', border: '1px solid #333333' }}>
              <div className="text-2xl mb-2" style={{ color: '#10b981' }}>2</div>
              <h3 className="font-semibold mb-2" style={{ color: '#e7e5e2' }}>Interact & Explore</h3>
              <p className="text-sm" style={{ color: '#888888' }}>Insert keys, run queries, and experiment with the visualizations.</p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: '#1a1918', border: '1px solid #333333' }}>
              <div className="text-2xl mb-2" style={{ color: '#8b5cf6' }}>3</div>
              <h3 className="font-semibold mb-2" style={{ color: '#e7e5e2' }}>Build Intuition</h3>
              <p className="text-sm" style={{ color: '#888888' }}>Learn by doing. See how database operations work under the hood.</p>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#e7e5e2' }}>
            Built With
          </h2>
          <div className="flex flex-wrap gap-3">
            {['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'SVG', 'Framer Motion'].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ background: '#1a1918', color: '#888888', border: '1px solid #333333' }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#e7e5e2' }}>
            Ready to Learn?
          </h2>
          <p className="text-lg mb-6" style={{ color: '#888888' }}>
            Start with interactive B-Trees and build your understanding step by step.
          </p>
          <Link
            href="/chapters/b-trees"
            className="inline-block px-8 py-4 text-white text-lg font-semibold rounded-lg hover-overlay"
            style={{ background: '#e07060' }}
          >
            Start with B-Trees →
          </Link>
        </div>

        {/* Quick Access to All Chapters */}
        <div className="mt-16 pt-8 border-t" style={{ borderColor: '#333333' }}>
          <h3 className="text-xl font-bold mb-6" style={{ color: '#e7e5e2' }}>
            Quick Access
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/chapters/b-trees" className="p-4 rounded-lg hover-overlay block" style={{ background: '#1a1918', border: '1px solid #333333', textDecoration: 'none' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌳</span>
                <div>
                  <div className="font-semibold" style={{ color: '#e7e5e2' }}>B-Tree Indexing</div>
                  <div className="text-sm" style={{ color: '#888888' }}>Interactive tree with insert/delete operations</div>
                </div>
              </div>
            </Link>
            <Link href="/chapters/wal" className="p-4 rounded-lg hover-overlay block" style={{ background: '#1a1918', border: '1px solid #333333', textDecoration: 'none' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <div className="font-semibold" style={{ color: '#e7e5e2' }}>Write-Ahead Logging</div>
                  <div className="text-sm" style={{ color: '#888888' }}>ACID properties and crash recovery</div>
                </div>
              </div>
            </Link>
            <Link href="/chapters/query-planning" className="p-4 rounded-lg hover-overlay block" style={{ background: '#1a1918', border: '1px solid #333333', textDecoration: 'none' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔍</span>
                <div>
                  <div className="font-semibold" style={{ color: '#e7e5e2' }}>Query Planning</div>
                  <div className="text-sm" style={{ color: '#888888' }}>EXPLAIN ANALYZE visualization</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-8 mt-16" style={{ borderColor: '#333333' }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm" style={{ color: '#666666' }}>
            Interactive educational platform inspired by{' '}
            <a href="https://brrrviz.com" target="_blank" rel="noopener noreferrer" className="hover-overlay" style={{ color: '#e07060' }}>
              BrrrViz
            </a>
            {' '}with coral CTAs and dark-first design.
          </p>
        </div>
      </footer>
    </div>
  );
}
