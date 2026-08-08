'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db, firebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { fetchUnits } from '@/lib/units';
import { BlockedRange, Unit } from '@/lib/types';
import AdminUnitSection, { AdminBooking } from '@/components/AdminUnitSection';
import PendingPanel from '@/components/PendingPanel';
import AdminStats from '@/components/AdminStats';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading, error: authError } = useAuth();

  const [units,         setUnits]         = useState<Unit[]>([]);
  const [bookings,      setBookings]      = useState<AdminBooking[]>([]);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [previewUrl,    setPreviewUrl]    = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!firebaseConfigured || !user) {
      setError('Firebase is not configured. Add .env.local to read bookings.');
      setLoading(false);
      return;
    }
    try {
      const token = await user.getIdToken();
      const [unitsData, snap, blockedRes] = await Promise.all([
        fetchUnits(),
        getDocs(query(collection(db(), 'bookings'), orderBy('createdAt', 'desc'))),
        fetch('/api/admin/blocked-dates', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setUnits(unitsData);
      setBookings(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminBooking, 'id'>) })));
      if (blockedRes.ok) {
        const blockedData = await blockedRes.json();
        setBlockedRanges(blockedData.ranges ?? []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [user]);

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

  async function addBlock(unitId: string, unitName: string, startDate: string, endDate: string, reason: string) {
    if (!user) throw new Error('Not signed in.');
    const token = await user.getIdToken();
    const res = await fetch('/api/admin/blocked-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ unitId, unitName, startDate, endDate, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Could not add block.');
    setBlockedRanges((rs) => [...rs, data as BlockedRange]);
  }

  async function removeBlock(id: string) {
    if (!user) return;
    const previous = blockedRanges;
    setBlockedRanges((rs) => rs.filter(r => r.id !== id));
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/blocked-dates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Could not remove block.');
    } catch (err) {
      console.error('removeBlock failed:', err);
      setBlockedRanges(previous);
      setError(err instanceof Error ? err.message : 'Could not remove block.');
    }
  }

  async function handleSignOut() {
    await signOut(auth());
    router.replace('/admin/login');
  }

  // Group bookings and blocked ranges by unit
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

  const blockedByUnit = useMemo(() => {
    const map = new Map<string, BlockedRange[]>();
    units.forEach(u => map.set(u.id, []));
    blockedRanges.forEach(r => {
      if (!map.has(r.unitId)) map.set(r.unitId, []);
      map.get(r.unitId)!.push(r);
    });
    return map;
  }, [blockedRanges, units]);

  const pendingBookings = useMemo(
    () => bookings.filter(b => b.status === 'pending'),
    [bookings],
  );

  // ── Auth guards ──────────────────────────────────────────────────
  if (authLoading) {
    return <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8"><p className="text-brand-secondary">Checking access…</p></div>;
  }
  if (authError) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{authError}</div>
      </div>
    );
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-8 py-12">
        <h1 className="font-display text-3xl text-brand-primary mb-2">Not Authorized</h1>
        <p className="text-sm text-brand-secondary mb-4">
          You&apos;re signed in as <span className="font-mono">{user.email}</span>, but this account
          doesn&apos;t have admin access.
        </p>
        <button onClick={handleSignOut} className="btn-outline">Sign out</button>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-brand-primary mb-0.5">Admin Dashboard</h1>
          <p className="text-xs text-brand-secondary">Signed in as <span className="font-mono">{user.email}</span></p>
        </div>
        <button onClick={handleSignOut} className="btn-outline text-sm px-4 py-2">Sign out</button>
      </div>

      {loading && <p className="text-brand-secondary mb-4">Loading…</p>}
      {error   && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 mb-4">{error}</div>}

      {/* Stats + charts overview */}
      {!loading && !error && (
        <AdminStats bookings={bookings} units={units} />
      )}

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
          blockedRanges={blockedByUnit.get(unit.id) ?? []}
          onSetStatus={setStatus}
          onPreviewProof={setPreviewUrl}
          onAddBlock={addBlock}
          onRemoveBlock={removeBlock}
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
