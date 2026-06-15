'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      router.replace('/admin');
    }
  }, [authLoading, user, isAdmin, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firebaseConfigured) {
      setError('Firebase is not configured. Add .env.local to enable login.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth(), email.trim(), password);
      router.replace('/admin');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Wrong email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        const msg = err instanceof Error ? err.message : 'Sign-in failed.';
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-8 py-12">
      <h1 className="font-display text-3xl text-brand-primary mb-2">Admin Login</h1>
      <p className="text-sm text-gray-500 mb-6">
        Sign in with your admin account to manage bookings.
      </p>

      {user && !isAdmin && (
        <div className="rounded-lg bg-amber-50 text-amber-800 text-sm px-3 py-2 mb-4">
          You&apos;re signed in as <span className="font-mono">{user.email}</span>, but this account
          is not an admin. Ask an existing admin to grant you the <code className="font-mono">admin</code> claim.
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field w-full"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field w-full"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting || authLoading}
          className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
