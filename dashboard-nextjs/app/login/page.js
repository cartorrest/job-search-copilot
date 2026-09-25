'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('Wrong password.');
    }
  }

  return (
    <div className="blueprint-bg min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-blueprint-100 rounded-xl shadow-sm p-8 w-full max-w-sm"
      >
        <h1 className="font-display font-semibold text-xl text-ink mb-1">Job Search Copilot</h1>
        <p className="text-sm text-ink/60 mb-6">Private access</p>

        <label className="block text-sm font-medium text-ink mb-1" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="w-full rounded-lg border border-blueprint-100 px-3 py-2 mb-3 outline-none focus:border-blueprint-500 transition-colors"
        />

        {error && <p className="text-sm text-status-rejected mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blueprint-500 hover:bg-blueprint-700 transition-colors text-white font-medium rounded-lg py-2 disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
