'use client';

import { useState, Suspense, type FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function LoginForm() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams.get('from') || '/master-ops';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (res.ok) {
        router.push(from);
        router.refresh();
      } else if (res.status === 503) {
        setError('Server misconfigured. Contact deployment operator.');
      } else {
        setError('Invalid access token.');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A1628',
        color: '#E5E7EB',
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        padding: '24px'
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#0F1F35',
          padding: '32px',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '360px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          border: '1px solid #1F2F45'
        }}
      >
        <h1 style={{ fontSize: '18px', margin: '0 0 6px', fontWeight: 600 }}>
          Acuterium Master Project Dashboard
        </h1>
        <p
          style={{
            fontSize: '12px',
            margin: '0 0 24px',
            color: '#7C8DA3',
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}
        >
          ACUTERIUM-INTERNAL // SOVEREIGN
        </p>
        <label
          htmlFor="token"
          style={{
            display: 'block',
            fontSize: '13px',
            color: '#9CA3AF',
            marginBottom: '6px'
          }}
        >
          Access token
        </label>
        <input
          id="token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            background: '#0A1628',
            border: '1px solid #2A3F58',
            borderRadius: '4px',
            color: '#E5E7EB',
            marginBottom: '16px',
            boxSizing: 'border-box',
            fontFamily: 'inherit'
          }}
        />
        <button
          type="submit"
          disabled={busy || !token}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            fontWeight: 500,
            background: busy || !token ? '#1F3050' : '#2563EB',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: busy || !token ? 'not-allowed' : 'pointer',
            transition: 'background 120ms ease'
          }}
        >
          {busy ? 'Verifying…' : 'Enter'}
        </button>
        {error && (
          <p
            role="alert"
            style={{
              marginTop: '14px',
              fontSize: '13px',
              color: '#F87171'
            }}
          >
            {error}
          </p>
        )}
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
