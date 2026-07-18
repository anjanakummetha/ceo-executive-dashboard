'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [username, setUsername] = useState('kory');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Login failed');
      }
      router.push(from);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm p-8 rounded-2xl"
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid rgba(201,160,68,0.25)',
      }}
    >
      <p
        style={{
          color: 'var(--gold-primary)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Iconic Founders Group
      </p>
      <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        CEO Executive Dashboard
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 24 }}>Sign in to continue</p>

      {error && (
        <p
          className="mb-4 px-3 py-2 rounded-lg"
          style={{
            background: 'rgba(224,82,82,0.1)',
            border: '1px solid rgba(224,82,82,0.3)',
            color: '#e8a0a0',
            fontSize: 12,
          }}
        >
          {error}
        </p>
      )}

      <label style={{ display: 'block', marginBottom: 14 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>Username</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          className="mt-1 w-full px-3 py-2.5 rounded-lg outline-none"
          style={{
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: 14,
          }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 20 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="mt-1 w-full px-3 py-2.5 rounded-lg outline-none"
          style={{
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: 14,
          }}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg font-semibold"
        style={{
          background: 'linear-gradient(135deg, #c9a044, #d4af60)',
          color: '#1a1a1a',
          fontSize: 14,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-page)' }}
    >
      <Suspense fallback={<div style={{ color: 'var(--text-muted)' }}>Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
