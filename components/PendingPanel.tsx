'use client';

import { AdminBooking } from './AdminUnitSection';
import { formatPHP } from '@/lib/rates';

type Props = {
  bookings: AdminBooking[];
  onSetStatus: (id: string, status: AdminBooking['status']) => void;
  onPreviewProof: (url: string) => void;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isRecent(b: AdminBooking): boolean {
  if (!b.createdAt) return false;
  return Date.now() - b.createdAt.toDate().getTime() < ONE_DAY_MS;
}

export default function PendingPanel({ bookings, onSetStatus, onPreviewProof }: Props) {
  if (bookings.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <h2 className="font-semibold text-amber-900">
              {bookings.length} booking{bookings.length === 1 ? '' : 's'} need your action
            </h2>
          </div>
          <p className="text-xs text-amber-700/70 hidden sm:block">
            Confirm or cancel below — these aren&apos;t holding any dates yet.
          </p>
        </div>

        {/* Pending booking cards */}
        <div className="space-y-2">
          {bookings.map((b) => {
            const fresh = isRecent(b);
            return (
              <div
                key={b.id}
                className="rounded-xl bg-white border border-amber-100 p-3 sm:p-4 flex gap-3"
              >
                {/* Proof thumbnail */}
                {b.proofUrl ? (
                  <button
                    onClick={() => onPreviewProof(b.proofUrl)}
                    className="relative w-14 flex-shrink-0 rounded-lg overflow-hidden border border-brand-light hover:border-brand-secondary transition-all self-start"
                    style={{ aspectRatio: '9/16' }}
                    title="View payment proof"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.proofUrl} alt="Proof" className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div
                    className="w-14 flex-shrink-0 rounded-lg bg-brand-bg border border-dashed border-brand-light flex items-center justify-center self-start"
                    style={{ aspectRatio: '9/16' }}
                  >
                    <span className="text-[9px] text-gray-400 text-center leading-tight px-1">No proof</span>
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{b.customer.name}</p>
                        {fresh && (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500 text-white">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-secondary font-medium">{b.unitName}</p>
                    </div>
                    <span className="text-sm font-bold text-brand-primary whitespace-nowrap">
                      {formatPHP(b.totalAmount)}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mb-2">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {b.checkIn} → {b.checkOut}
                    </span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span>{b.customer.email}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span>{b.customer.phone}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onSetStatus(b.id, 'confirmed')}
                      className="flex-1 sm:flex-none sm:px-6 text-xs py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => onSetStatus(b.id, 'cancelled')}
                      className="flex-1 sm:flex-none sm:px-6 text-xs py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
