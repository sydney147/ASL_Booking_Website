'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db, firebaseConfigured } from '@/lib/firebase';
import { formatPHP } from '@/lib/rates';
import { useAuth } from '@/lib/useAuth';
import { fetchUnits } from '@/lib/units';
import { Unit } from '@/lib/types';
import AdminUnitSection, { AdminBooking } from '@/components/AdminUnitSection';
import PendingPanel from '@/components/PendingPanel';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading, error: authError } = useAuth();

  const [units,      setUnits]      = useState<Unit[]>([]);
  const [bookings,   setBookings]   = useState<AdminBooking[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!firebaseConfigured) {
      setError('Firebase is not configured. Add .env.local to read bookings.');
      setLoading(false);
      return;
    }
    try {
      const [unitsData, snap] = await Promise.all([
        fetchUnits(),
        getDocs(query(collection(db(), 'bookings'), orderBy('createdAt', 'desc'))),
      ]);
      setUnits(unitsData);
      setBookings(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminBooking, 'id'>) })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/admin/login'); return; }
    if (!isAdmin) { setLoading(false); return; }
    load();
  }, [authLoading, user, isAdmin, router, load]);

  async function setStatus(id: string, status: AdminBooking['status']) {
    if (!firebaseConfigured || !user) return;
    const previous = bookings.find(b => b.id === id)?.status;
    // Optimistic update
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status } : b)));
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Status update failed.');
    } catch (err) {
      console.error('setStatus failed:', err);
      // Roll back optimistic update
      if (previous) {
        setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: previous } : b)));
      }
      setError(err instanceof Error ? err.message : 'Could not update status.');
    }
  }

  async function handleSignOut() {
    await signOut(auth());
    router.replace('/admin/login');
  }

  // Group bookings by unit
  const bookingsByUnit = useMemo(() => {
    const map = new Map<string, AdminBooking[]>();
    units.forEach(u => map.set(u.id, []));
    bookings.forEach(b => {
      const key = b.unitId ?? '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return map;
  }, [bookings, units]);

  // Overall stats (across all units)
  const totalStats = useMemo(() => ({
    total:     bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    revenue:   bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.totalAmount, 0),
  }), [bookings]);

  const pendingBookings = useMemo(
    () => bookings.filter(b => b.status === 'pending'),
    [bookings],
  );

  // ── Auth guards ──────────────────────────────────────────────────
  if (authLoading) {
    return <div className="max-w-6xl mx-auto px-4 py-8"><p className="text-gray-500">Checking access…</p></div>;
  }
  if (authError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{authError}</div>
      </div>
    );
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="font-display text-3xl text-brand-primary mb-2">Not Authorized</h1>
        <p className="text-sm text-gray-600 mb-4">
          You&apos;re signed in as <span className="font-mono">{user.email}</span>, but this account
          doesn&apos;t have admin access.
        </p>
        <button onClick={handleSignOut} className="btn-outline">Sign out</button>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-brand-primary mb-0.5">Bookings Dashboard</h1>
          <p className="text-xs text-gray-400">Signed in as <span className="font-mono">{user.email}</span></p>
        </div>
        <button onClick={handleSignOut} className="btn-outline text-sm px-4 py-2">Sign out</button>
      </div>

      {/* Overall stats strip — three quiet cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total',     value: totalStats.total },
          { label: 'Confirmed', value: totalStats.confirmed },
          { label: 'Revenue',   value: formatPHP(totalStats.revenue) },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-brand-light bg-brand-bg/40 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mb-0.5">{s.label}</p>
            <p className="text-lg sm:text-xl font-bold text-brand-primary">{s.value}</p>
          </div>
        ))}
      </div>

      {loading && <p className="text-gray-500 mb-4">Loading…</p>}
      {error   && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 mb-4">{error}</div>}

      {/* Bookings that need confirm/cancel decisions */}
      {!loading && !error && (
        <PendingPanel
          bookings={pendingBookings}
          onSetStatus={setStatus}
          onPreviewProof={setPreviewUrl}
        />
      )}

      {/* One section per unit */}
      {!loading && !error && units.map(unit => (
        <AdminUnitSection
          key={unit.id}
          unit={unit}
          bookings={bookingsByUnit.get(unit.id) ?? []}
          onSetStatus={setStatus}
          onPreviewProof={setPreviewUrl}
        />
      ))}

      {/* Proof lightbox */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-lg w-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Payment proof"
              className="max-w-full max-h-[88vh] rounded-xl shadow-2xl object-contain" />
            <button onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-gray-700
                         flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer"
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs bg-white text-brand-primary
                         font-medium px-4 py-1.5 rounded-full shadow hover:bg-brand-bg transition-colors whitespace-nowrap"
              onClick={e => e.stopPropagation()}>
              Open full image ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
