'use client';

import { useMemo } from 'react';
import { Unit } from '@/lib/types';
import { formatPHP } from '@/lib/rates';
import { nightsBetween } from '@/lib/dates';
import { AdminBooking } from './AdminUnitSection';

type Props = {
  bookings: AdminBooking[];
  units: Unit[];
};

// Bookings in these statuses represent realized (or soon-to-be-realized) revenue.
const REVENUE_STATUSES: ReadonlyArray<AdminBooking['status']> = ['confirmed', 'done'];

const STATUS_META: Record<AdminBooking['status'], { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: '#D97706' }, // amber-600
  confirmed: { label: 'Confirmed', color: '#16A34A' }, // green-600
  done:      { label: 'Done',      color: '#2563EB' }, // blue-600
  cancelled: { label: 'Cancelled', color: '#9CA3AF' }, // gray-400
  refunded:  { label: 'Refunded',  color: '#9333EA' }, // purple-600
};

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // 'YYYY-MM'
}

export default function AdminStats({ bookings, units }: Props) {
  const revenueBookings = useMemo(
    () => bookings.filter(b => REVENUE_STATUSES.includes(b.status)),
    [bookings],
  );

  // ── KPIs ──────────────────────────────────────────────────────────
  const totalRevenue = useMemo(
    () => revenueBookings.reduce((s, b) => s + b.totalAmount, 0),
    [revenueBookings],
  );

  const avgBookingValue = revenueBookings.length > 0
    ? totalRevenue / revenueBookings.length
    : 0;

  const occupancyRate = useMemo(() => {
    if (units.length === 0) return 0;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    let bookedNights = 0;
    revenueBookings.forEach(b => {
      nightsBetween(b.checkIn, b.checkOut).forEach(night => {
        if (night.startsWith(monthPrefix)) bookedNights++;
      });
    });

    const totalUnitNights = units.length * daysInMonth;
    return totalUnitNights > 0 ? (bookedNights / totalUnitNights) * 100 : 0;
  }, [revenueBookings, units]);

  // ── Revenue by month (last 6 months, including current) ───────────
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTH_SHORT[d.getMonth()], amount: 0 });
    }
    const byKey = new Map(buckets.map(b => [b.key, b]));
    revenueBookings.forEach(b => {
      const key = monthKey(b.checkIn);
      const bucket = byKey.get(key);
      if (bucket) bucket.amount += b.totalAmount;
    });
    return buckets;
  }, [revenueBookings]);

  const maxMonthlyRevenue = Math.max(1, ...monthlyRevenue.map(m => m.amount));

  // ── Bookings + revenue by unit ─────────────────────────────────────
  const byUnit = useMemo(() => {
    return units.map(u => {
      const unitBookings = revenueBookings.filter(b => b.unitId === u.id);
      return {
        unit: u,
        count: unitBookings.length,
        revenue: unitBookings.reduce((s, b) => s + b.totalAmount, 0),
      };
    });
  }, [revenueBookings, units]);

  const maxUnitCount = Math.max(1, ...byUnit.map(u => u.count));

  // ── Status breakdown ────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<AdminBooking['status'], number> = {
      pending: 0, confirmed: 0, done: 0, cancelled: 0, refunded: 0,
    };
    bookings.forEach(b => { counts[b.status]++; });
    return counts;
  }, [bookings]);

  const totalBookingsCount = bookings.length;

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-brand-primary mb-3 uppercase tracking-wide">Overview</h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Total Revenue" value={formatPHP(totalRevenue)} />
        <KpiCard label="Total Bookings" value={String(totalBookingsCount)} />
        <KpiCard label="Occupancy (this month)" value={`${occupancyRate.toFixed(0)}%`} />
        <KpiCard label="Avg. Booking Value" value={formatPHP(avgBookingValue)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">

        {/* Revenue by month */}
        <div className="card">
          <h3 className="text-xs font-semibold text-brand-secondary uppercase tracking-wide mb-3">Revenue — last 6 months</h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {monthlyRevenue.map(m => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  className="w-full max-w-[28px] rounded-t-md bg-brand-accent transition-all"
                  style={{ height: `${Math.max(4, (m.amount / maxMonthlyRevenue) * 100)}%` }}
                  title={formatPHP(m.amount)}
                />
                <span className="text-[10px] text-brand-secondary">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bookings by unit */}
        <div className="card">
          <h3 className="text-xs font-semibold text-brand-secondary uppercase tracking-wide mb-3">Bookings by unit</h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {byUnit.map(({ unit, count }) => (
              <div key={unit.id} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-semibold text-brand-primary">{count}</span>
                <div
                  className="w-full max-w-[28px] rounded-t-md bg-brand-secondary/60 transition-all"
                  style={{ height: `${Math.max(4, (count / maxUnitCount) * 100)}%` }}
                  title={`${unit.name}: ${count} bookings`}
                />
                <span className="text-[10px] text-brand-secondary truncate max-w-full">{unit.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="card">
        <h3 className="text-xs font-semibold text-brand-secondary uppercase tracking-wide mb-3">Bookings by status</h3>
        {totalBookingsCount === 0 ? (
          <p className="text-sm text-brand-secondary text-center py-4">No bookings yet.</p>
        ) : (
          <>
            <div className="flex h-3 rounded-full overflow-hidden border border-brand-light">
              {(Object.keys(STATUS_META) as AdminBooking['status'][]).map(status => {
                const count = statusCounts[status];
                if (count === 0) return null;
                const pct = (count / totalBookingsCount) * 100;
                return (
                  <div
                    key={status}
                    style={{ width: `${pct}%`, backgroundColor: STATUS_META[status].color }}
                    title={`${STATUS_META[status].label}: ${count}`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
              {(Object.keys(STATUS_META) as AdminBooking['status'][]).map(status => (
                <span key={status} className="flex items-center gap-1.5 text-xs text-brand-secondary">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_META[status].color }} />
                  {STATUS_META[status].label} <span className="font-semibold text-brand-primary">{statusCounts[status]}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand-light bg-brand-white px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-brand-secondary mb-0.5">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-brand-primary truncate">{value}</p>
    </div>
  );
}
