'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, firebaseConfigured } from './firebase';

export type AuthState = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseConfigured) {
      setError('Firebase is not configured. Add .env.local to enable login.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth(),
      async (u) => {
        setUser(u);
        if (u) {
          try {
            const token = await u.getIdTokenResult();
            setIsAdmin(token.claims.admin === true);
          } catch {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { user, isAdmin, loading, error };
}
