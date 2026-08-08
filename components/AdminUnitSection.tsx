'use client';

import { useMemo, useState, FormEvent } from 'react';
import { Unit, BlockedRange } from '@/lib/types';
import { formatPHP } from '@/lib/rates';
import { nightsBetween } from '@/lib/dates';

export type AdminBooking = {
  id: string;
  unitId?: string;
  unitName: string;
  customer: { name: string; email: string; phone: string };
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  paymentMethod: string | null;
  proofUrl: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'done' | 'refunded';
  createdAt?: { toDate: () => Date };
};

type Props = {
  unit: Unit;
  bookings: AdminBooking[];
  blockedRanges: BlockedRange[];
  onSetStatus: (id: string, status: AdminBooking['status']) => void;
  onPreviewProof: (url: string) => void;
  onAddBlock: (unitId: string, unitName: string, startDate: string, endDate: string, reason: string) => Promise<void>;
  onRemoveBlock: (id: string) => void;
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const WEEK_DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function cellKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function todayStr() { return new Date().toISOString().slice(0, 10); }

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ARCHIVE_STATUSES: ReadonlyArray<AdminBooking['status']> = ['done', 'cancelled', 'refunded'];

function isRecent(b: AdminBooking): boolean {
  if (!b.createdAt) return false;
  return Date.now() - b.createdAt.toDate().getTime() < ONE_DAY_MS;
}

type Tab = 'active' | 'archive';

export default function AdminUnitSection({
  unit, bookings, blockedRanges, onSetStatus, onPreviewProof, onAddBlock, onRemoveBlock,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calYear,  setCalYear]  = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [tab,      setTab]      = useState<Tab>('active');

  // Block-dates form state
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockStart,    setBlockStart]    = useState('');
  const [blockEnd,      setBlockEnd]      = useState('');
  const [blockReason,   setBlockReason]   = useState('Booked on Airbnb');
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [blockError,    setBlockError]    = useState<string | null>(null);

  // Pending bookings are surfaced in the global PendingPanel — exclude here.
  const visibleBookings = useMemo(
    () => bookings.filter(b => b.status !== 'pending'),
    [bookings],
  );

  // ── Calendar grid ────────────────────────────────────────────────
  const firstDow  = new Date(calYear, calMonth, 1).getDay();
  const daysInMon = new Date(calYear, calMonth + 1, 0).getDate();
  const cells: Array<string | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(cellKey(calYear, calMonth, d));
  while (cells.length % 7 !== 0) cells.push(null);

  // Calendar dots / blocked-out cells reflect confirmed bookings only.
  const confirmedBookings = useMemo(
    () => bookings.filter(b => b.status === 'confirmed'),
    [bookings],
  );
  const checkInDates  = useMemo(() => new Set(confirmedBookings.map(b => b.checkIn)),  [confirmedBookings]);
  const checkOutDates = useMemo(() => new Set(confirmedBookings.map(b => b.checkOut)), [confirmedBookings]);

  const confirmedDates = useMemo(() => {
    const dates = new Set<string>();
    confirmedBookings.forEach(b => {
      nightsBetween(b.checkIn, b.checkOut).forEach(night => dates.add(night));
    });
    return dates;
  }, [confirmedBookings]);

  // Manually blocked nights (e.g. booked on Airbnb directly) — distinct from real bookings.
  const manualBlockedDates = useMemo(() => {
    const dates = new Set<string>();
    blockedRanges.forEach(r => {
      nightsBetween(r.startDate, r.endDate).forEach(night => dates.add(night));
    });
    return dates;
  }, [blockedRanges]);

  // ── Tab-filtered list, then optional date filter ────────────────
  const tabBookings = useMemo(() => {
    if (tab === 'active') return visibleBookings.filter(b => b.status === 'confirmed');
    return visibleBookings.filter(b => ARCHIVE_STATUSES.includes(b.status));
  }, [visibleBookings, tab]);

  const filteredBookings = useMemo(() => {
    if (!selectedDate) return tabBookings;
    return tabBookings.filter(b => b.checkIn === selectedDate || b.checkOut === selectedDate);
  }, [tabBookings, selectedDate]);

  // ── Per-unit stats ───────────────────────────────────────────────
  const stats = useMemo(() => ({
    confirmed: visibleBookings.filter(b => b.status === 'confirmed').length,
    archive:   visibleBookings.filter(b => ARCHIVE_STATUSES.includes(b.status)).length,
    revenue:   confirmedBookings.reduce((s, b) => s + b.totalAmount, 0),
  }), [visibleBookings, confirmedBookings]);

  function overlapsConfirmedOrBlocked(start: string, end: string): boolean {
    return nightsBetween(start, end).some(n => confirmedDates.has(n) || manualBlockedDates.has(n));
  }

  async function handleAddBlock(e: FormEvent) {
    e.preventDefault();
    setBlockError(null);
    if (!blockStart || !blockEnd) {
      setBlockError('Both start and end dates are required.');
      return;
    }
    if (blockEnd <= blockStart) {
      setBlockError('End date must be after start date.');
      return;
    }
    if (overlapsConfirmedOrBlocked(blockStart, blockEnd)) {
      setBlockError('These dates overlap an existing booking or block.');
      return;
    }
    setBlockSubmitting(true);
    try {
      await onAddBlock(unit.id, unit.name, blockStart, blockEnd, blockReason);
      setBlockStart('');
      setBlockEnd('');
      setBlockReason('Booked on Airbnb');
      setShowBlockForm(false);
    } catch (err) {
      setBlockError(err instanceof Error ? err.message : 'Could not add block.');
    } finally {
      setBlockSubmitting(false);
    }
  }

  return (
    <section className="mb-10">
      {/* Unit header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-brand-light">
        <div>
          <h2 className="font-display text-xl sm:text-2xl text-brand-primary">{unit.name}</h2>
          <p className="text-xs text-brand-secondary">{unit.address}</p>
        </div>
        <div className="text-right text-xs text-brand-secondary">
          <p><span className="font-semibold text-green-700">{stats.confirmed}</span> active</p>
          <p><span className="font-semibold text-brand-primary">{formatPHP(stats.revenue)}</span> revenue</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">

        {/* ── Calendar ─────────────────────────────────────────── */}
        <div className="card lg:sticky lg:top-20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-brand-primary">Calendar</h3>
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)}
                className="text-xs text-brand-accent hover:underline">
                Clear filter
              </button>
            )}
          </div>

          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => { if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); } else setCalMonth(m => m-1); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-bg transition-colors">
              <svg className="w-3.5 h-3.5 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-brand-primary">{MONTH_NAMES[calMonth]} {calYear}</span>
            <button onClick={() => { if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); } else setCalMonth(m => m+1); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-bg transition-colors">
              <svg className="w-3.5 h-3.5 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 text-center mb-1">
            {WEEK_DAYS.map(d => (
              <div key={d} className="text-[10px] font-medium text-brand-secondary py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 text-center gap-y-0.5">
            {cells.map((ds, i) => {
              const isCI       = ds ? checkInDates.has(ds)    : false;
              const isCO       = ds ? checkOutDates.has(ds)   : false;
              const isBooked   = ds ? confirmedDates.has(ds)  : false;
              const isBlocked  = ds ? manualBlockedDates.has(ds) : false;
              const isSel      = ds === selectedDate;
              return (
                <button
                  key={i}
                  disabled={!ds}
                  onClick={() => ds && setSelectedDate(ds === selectedDate ? null : ds)}
                  className={`relative flex flex-col items-center justify-center py-1.5 text-xs rounded-lg transition-colors
                    ${!ds ? 'invisible' : ''}
                    ${isSel
                      ? 'bg-brand-primary text-white font-semibold'
                      : isBooked
                        ? 'bg-red-50 text-red-400 hover:bg-red-100'
                        : isBlocked
                          ? 'bg-brand-light/70 text-brand-secondary hover:bg-brand-light'
                          : 'hover:bg-brand-bg text-brand-primary'}
                  `}
                >
                  <span className={(isBooked || isBlocked) && !isSel ? 'line-through' : ''}>
                    {ds ? parseInt(ds.slice(8)) : ''}
                  </span>
                  {(isCI || isCO) && (
                    <span className="flex gap-0.5 mt-0.5">
                      {isCI && <span className={`w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-green-500'}`} />}
                      {isCO && <span className={`w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-orange-400'}`} />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 pt-3 border-t border-brand-light flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-brand-secondary">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Check-in</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" />Check-out</span>
            <span className="flex items-center gap-1"><span className="w-4 h-2 rounded bg-red-50 border border-red-200" />Booked</span>
            <span className="flex items-center gap-1"><span className="w-4 h-2 rounded bg-brand-light border border-brand-light" />Blocked</span>
          </div>

          {/* ── Manual block-dates management ───────────────────── */}
          <div className="mt-4 pt-4 border-t border-brand-light">
            <button
              type="button"
              onClick={() => setShowBlockForm(v => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold text-brand-accent hover:text-brand-accentHover transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Block dates
              </span>
              <svg className={`w-3.5 h-3.5 transition-transform ${showBlockForm ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {showBlockForm && (
              <form onSubmit={handleAddBlock} className="mt-3 space-y-2 animate-[fadeIn_120ms_ease-out]">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-brand-secondary uppercase tracking-wide font-medium mb-1">Start date</label>
                    <input
                      type="date"
                      value={blockStart}
                      min={todayStr()}
                      onChange={e => setBlockStart(e.target.value)}
                      className="field text-xs py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-brand-secondary uppercase tracking-wide font-medium mb-1">End date</label>
                    <input
                      type="date"
                      value={blockEnd}
                      min={blockStart || todayStr()}
                      onChange={e => setBlockEnd(e.target.value)}
                      className="field text-xs py-1.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-brand-secondary uppercase tracking-wide font-medium mb-1">Reason (optional)</label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    placeholder="e.g. Booked on Airbnb"
                    maxLength={200}
                    className="field text-xs py-1.5"
                  />
                </div>
                {blockError && (
                  <p className="text-[11px] text-red-600">{blockError}</p>
                )}
                <button
                  type="submit"
                  disabled={blockSubmitting}
                  className="btn-primary w-full justify-center text-xs py-1.5 disabled:opacity-60"
                >
                  {blockSubmitting ? 'Adding...' : 'Add block'}
                </button>
              </form>
            )}

            {/* Active manual blocks list */}
            {blockedRanges.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {blockedRanges.map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-2 bg-brand-bg/60 border border-brand-light rounded-lg px-2.5 py-1.5">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-brand-primary truncate">{r.startDate} → {r.endDate}</p>
                      <p className="text-[10px] text-brand-secondary truncate">{r.reason}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveBlock(r.id)}
                      title="Remove this block"
                      className="text-brand-secondary hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Bookings list ────────────────────────────────────── */}
        <div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-3 border-b border-brand-light">
            {([
              { id: 'active'  as const, label: 'Active',  count: stats.confirmed },
              { id: 'archive' as const, label: 'Archive', count: stats.archive },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors
                  ${tab === t.id
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-brand-secondary hover:text-brand-primary'}
                `}
              >
                {t.label}
                <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold ${
                  tab === t.id ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-light text-brand-secondary'
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {selectedDate && (
            <p className="text-xs text-brand-accent font-medium mb-2">
              Filtered to {selectedDate} · <button onClick={() => setSelectedDate(null)} className="underline">show all</button>
            </p>
          )}

          {filteredBookings.length === 0 && (
            <div className="card text-center py-10 text-brand-secondary text-sm">
              {selectedDate
                ? 'No bookings on this date.'
                : tab === 'active'
                  ? `No active bookings for ${unit.name}.`
                  : 'No archived bookings yet.'}
            </div>
          )}

          <div className="space-y-2">
          {filteredBookings.map((b) => {
            const today       = new Date().toISOString().slice(0, 10);
            const stayStarted = today >= b.checkIn;
            const stayEnded   = today > b.checkOut;
            const fresh       = isRecent(b);

            return (
              <div key={b.id}
                className={`card p-0 overflow-hidden border-l-4 ${
                  b.status === 'confirmed' ? 'border-l-green-500'
                  : b.status === 'cancelled' ? 'border-l-gray-400'
                  : b.status === 'done'      ? 'border-l-blue-500'
                  : b.status === 'refunded'  ? 'border-l-purple-400'
                  : 'border-l-gray-300'
                } ${fresh ? 'ring-1 ring-amber-300' : ''}`}
              >
                <div className="flex gap-3 p-4">

                  {b.proofUrl ? (
                    <button
                      onClick={() => onPreviewProof(b.proofUrl)}
                      className="relative w-16 flex-shrink-0 rounded-lg overflow-hidden border border-brand-light
                                 hover:border-brand-accent hover:shadow-sm transition-all self-start"
                      style={{ aspectRatio: '9/16' }}
                      title="View payment proof"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.proofUrl} alt="Proof" className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="w-16 flex-shrink-0 rounded-lg bg-brand-bg border border-dashed border-brand-light
                                    flex items-center justify-center self-start" style={{ aspectRatio: '9/16' }}>
                      <span className="text-[9px] text-brand-secondary text-center leading-tight px-1">No proof</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-brand-primary text-sm leading-tight truncate">{b.customer.name}</p>
                          {fresh && (
                            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500 text-white">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-brand-accent font-medium">{b.unitName}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-700'
                        : b.status === 'cancelled' ? 'bg-gray-100 text-gray-500'
                        : b.status === 'done'      ? 'bg-blue-100 text-blue-700'
                        : b.status === 'refunded'  ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-500'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-brand-secondary mb-2">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {b.checkIn} → {b.checkOut}
                      </span>
                      <span className="font-semibold text-brand-primary">{formatPHP(b.totalAmount)}</span>
                      <span>{b.customer.email}</span>
                      <span>{b.customer.phone}</span>
                      {b.paymentMethod && (
                        <span className="col-span-2 capitalize text-brand-secondary">{b.paymentMethod}</span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {b.status === 'confirmed' && stayStarted && !stayEnded && (
                        <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Guest is currently checked in
                        </p>
                      )}

                      {b.status === 'confirmed' && (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => onSetStatus(b.id, 'cancelled')}
                            disabled={stayStarted}
                            title={stayStarted ? 'Cannot cancel — stay already started' : 'Cancel this booking'}
                            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors
                              ${stayStarted
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                            Cancel
                          </button>
                          <button onClick={() => onSetStatus(b.id, 'refunded')}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors">
                            Refunded
                          </button>
                          {stayEnded && (
                            <button onClick={() => onSetStatus(b.id, 'done')}
                              className="w-full text-xs py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors">
                              Mark as Done
                            </button>
                          )}
                        </div>
                      )}

                      {b.status === 'cancelled' && (
                        <button onClick={() => onSetStatus(b.id, 'refunded')}
                          className="w-full text-xs py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors">
                          Refunded
                        </button>
                      )}

                      {(b.status === 'done' || b.status === 'refunded') && (
                        <p className="text-[10px] text-brand-secondary italic">No further actions available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}
