'use client';

import { useEffect } from 'react';

export default function MasterOpsError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Master Ops boundary caught error:', error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#030509',
        color: 'rgba(230,245,255,0.93)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'Sora', system-ui, sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: 480,
          padding: '24px 28px',
          background: 'rgba(10,14,40,0.50)',
          border: '1px solid rgba(255,59,48,0.30)',
          borderRadius: 18
        }}
      >
        <h1
          style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            margin: '0 0 12px',
            color: '#FF3B30'
          }}
        >
          Master Ops Error
        </h1>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: 'rgba(180,215,245,.78)',
            margin: '0 0 16px',
            lineHeight: 1.6,
            wordBreak: 'break-word'
          }}
        >
          {error.message || 'Unknown error'}
          {error.digest ? ` · digest=${error.digest}` : ''}
        </p>
        <button
          onClick={reset}
          style={{
            padding: '10px 16px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            background: '#2563EB',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    </main>
  );
}
