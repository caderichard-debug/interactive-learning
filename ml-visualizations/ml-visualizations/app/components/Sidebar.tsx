'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import { homeChapters } from './HomeChapters';

const chapters = [...homeChapters];

export default function Sidebar() {
  const pathname = usePathname();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [learningHubHref, setLearningHubHref] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('completedChapters');
    if (saved) setCompleted(new Set(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    const envHub = process.env.NEXT_PUBLIC_LEARNING_HUB_HREF?.trim();
    if (envHub) {
      setLearningHubHref(envHub);
      return;
    }
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[1] === 'ml-visualizations') {
      setLearningHubHref(`/${parts[0]}/index.html`);
    }
  }, []);

  const progress = (completed.size / chapters.length) * 100;

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minWidth: 'var(--sidebar-width)',
      height: '100%',
      background: 'var(--surface)',
      borderRight: '1px solid var(--grid-line)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>

      <div style={{ padding: '14px 12px 16px', borderBottom: '1px solid var(--grid-line)', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', textDecoration: 'none', letterSpacing: '1.5px' }}>
          ML VIZ
        </Link>
        {learningHubHref ? (
          <a
            href={learningHubHref}
            title="Back to home"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent-coral)',
              textDecoration: 'none',
              lineHeight: 1.35,
              letterSpacing: '0.02em',
            }}
          >
            ← Back to home
          </a>
        ) : null}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 0' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', padding: '8px 12px 6px', opacity: 0.6 }}>
          Chapters
        </div>
        {chapters.map((ch) => {
          const isActive    = pathname === ch.href;
          const isCompleted = completed.has(ch.href);
          return (
            <Link key={ch.href} href={ch.href} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 12px',
                background: isActive ? 'var(--active-overlay)' : 'none',
                color: isActive ? 'var(--accent-coral)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)', fontSize: '13px',
                cursor: 'pointer', position: 'relative',
                transition: 'color 0.15s, background 0.15s',
              }}>
                {/* Active indicator bar */}
                {isActive && (
                  <div style={{ position: 'absolute', left: 0, top: '4px', bottom: '4px', width: '2px', background: 'var(--accent-coral)', borderRadius: '0 1px 1px 0' }} />
                )}
                {/* Chapter number */}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', opacity: 0.5, minWidth: '22px', flexShrink: 0 }}>
                  {ch.num}
                </span>
                {/* Title */}
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ch.title}
                </span>
                {/* Completed check */}
                {isCompleted && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Progress + footer */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--grid-line)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Progress</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-coral)' }}>{completed.size}/{chapters.length}</span>
        </div>
        <div style={{ height: '2px', background: 'var(--surface-elevated)', borderRadius: '1px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-coral)', borderRadius: '1px', transition: 'width 0.3s ease' }} />
        </div>
      </div>
    </aside>
  );
}
