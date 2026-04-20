'use client';

import { FormEvent, useState } from 'react';

type Variant = 'default' | 'compact';

type Props = {
  variant?: Variant;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim()) && email.length <= 320;
}

/**
 * Subscribe: uses NEXT_PUBLIC_FORMSPREE_FORM_ENDPOINT when set (direct POST from browser),
 * otherwise accepts valid emails and shows success (demo / static export).
 */
export default function EmailCapture({ variant = 'default' }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');

  const compact = variant === 'compact';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMsg('');
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setStatus('err');
      setMsg('Enter a valid email.');
      return;
    }

    const formspree = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ENDPOINT?.trim();

    try {
      if (formspree) {
        const res = await fetch(formspree, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ email: trimmed }),
        });
        if (!res.ok) {
          setStatus('err');
          setMsg('Newsletter service unavailable. Try again later.');
          return;
        }
      }

      setStatus('ok');
      setEmail('');
      setMsg(formspree ? 'Thanks — you’re on the list.' : 'Thanks — demo mode (no server); configure NEXT_PUBLIC_FORMSPREE_FORM_ENDPOINT to forward.');
    } catch {
      setStatus('err');
      setMsg('Network error. Try again in a moment.');
    }
  }

  const boxStyle = compact
    ? {
        padding: '16px 24px',
        background: 'var(--surface-elevated)',
        borderTop: '1px solid var(--grid-line)',
      }
    : {
        padding: '28px 32px',
        borderRadius: '12px',
        background: 'var(--surface-elevated)',
        border: '1px solid var(--grid-line)',
        marginBottom: '48px',
      };

  return (
    <section
      aria-labelledby="email-capture-heading"
      style={boxStyle}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: compact ? 'column' : 'row',
          flexWrap: 'wrap',
          gap: compact ? '12px' : '24px',
          alignItems: compact ? 'stretch' : 'flex-start',
          justifyContent: 'space-between',
          maxWidth: compact ? '100%' : '860px',
          margin: compact ? '0 auto' : '0',
          width: '100%',
        }}
      >
        <div style={{ flex: compact ? undefined : '0 1 280px', minWidth: compact ? undefined : 0 }}>
          <h2
            id="email-capture-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: compact ? '15px' : '20px',
              color: 'var(--text-primary)',
              marginBottom: '6px',
              letterSpacing: compact ? '0' : '-0.2px',
            }}
          >
            {compact ? 'Get chapter updates' : 'Stay in the loop'}
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: compact ? '12px' : '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Occasional emails when we add chapters or improve visualizations. No spam — unsubscribe anytime.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            flex: compact ? undefined : '1 1 320px',
            minWidth: compact ? undefined : '240px',
            display: 'flex',
            flexDirection: compact ? 'column' : 'row',
            gap: '10px',
            alignItems: compact ? 'stretch' : 'flex-end',
            width: compact ? '100%' : 'auto',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              htmlFor="ml-viz-email"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px',
                color: 'var(--text-muted)',
              }}
            >
              Email
            </label>
            <input
              id="ml-viz-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--grid-line)',
                background: '#141312',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: status === 'loading' ? 'wait' : 'pointer',
              background: 'linear-gradient(180deg, var(--accent-coral-bright), var(--accent-coral))',
              color: '#1a1210',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 600,
              flexShrink: 0,
              opacity: status === 'loading' ? 0.75 : 1,
            }}
          >
            {status === 'loading' ? '…' : 'Subscribe'}
          </button>
        </form>
      </div>

      {status === 'ok' && (
        <p
          role="status"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--success)',
            marginTop: '12px',
            marginBottom: 0,
          }}
        >
          {msg}
        </p>
      )}
      {status === 'err' && (
        <p
          role="alert"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--danger)',
            marginTop: '12px',
            marginBottom: 0,
          }}
        >
          {msg}
        </p>
      )}
    </section>
  );
}
