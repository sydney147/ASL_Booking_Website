'use client';

import { Suspense, useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatPHP } from '@/lib/rates';

type LookupBooking = {
  id: string;
  unitName: string;
  unitAddress?: string;
  unitLocation?: string;
  customer: { name: string; email: string; phone: string };
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  paymentMethod: string | null;
  paymentOption?: 'reservation' | 'full';
  reservationFee?: number;
  balanceDue?: number;
  proofUrl: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'done' | 'refunded';
  createdAt?: string | null;
};

function MyBookingInner() {
  const params  = useSearchParams();
  const urlId    = params.get('id')    ?? '';
  const urlEmail = params.get('email') ?? '';

  const [bookingId, setBookingId] = useState(urlId);
  const [email,     setEmail]     = useState(urlEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [booking,    setBooking]    = useState<LookupBooking | null>(null);

  const submit = useCallback(async (id: string, em: string) => {
    setError(null);
    setBooking(null);
    setSubmitting(true);
    try {
      const res  = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id, email: em }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Lookup failed.');
      setBooking(data as LookupBooking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setSubmitting(false);
    }
  }, []);

  // Magic-link auto-submit
  useEffect(() => {
    if (urlId && urlEmail) {
      submit(urlId, urlEmail);
    }
  }, [urlId, urlEmail, submit]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit(bookingId.trim(), email.trim());
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-brand-primary mb-2">Find My Booking</h1>
      <p className="text-sm text-gray-500 mb-6">
        Enter your booking ID and the email address you used to book.
      </p>

      <form onSubmit={onSubmit} className="card space-y-4 mb-6">
        <div>
          <label htmlFor="bookingId" className="label">Booking ID</label>
          <input
            id="bookingId"
            type="text"
            required
            value={bookingId}
            onChange={e => setBookingId(e.target.value)}
            placeholder="e.g. aB3xKqL9wMnP7vQrZsT2"
            className="field w-full font-mono"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="field w-full"
            autoComplete="email"
          />
        </div>
        {error && (
          <div className="rounded-xl bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full justify-center disabled:opacity-60"
        >
          {submitting ? 'Looking up...' : 'View my booking'}
        </button>
      </form>

      {booking && <BookingCard b={booking} />}
    </div>
  );
}

function BookingCard({ b }: { b: LookupBooking }) {
  const isPartial = b.paymentOption === 'reservation';
  const reservationFee = b.reservationFee ?? 0;
  const balanceDue     = b.balanceDue     ?? 0;

  return (
    <div className="card">
      {/* Status header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-brand-light">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Status</p>
          <p className={`text-lg font-bold capitalize ${
            b.status === 'confirmed' ? 'text-green-600'
            : b.status === 'cancelled' ? 'text-gray-500'
            : b.status === 'done'      ? 'text-blue-600'
            : b.status === 'refunded'  ? 'text-purple-600'
            : 'text-amber-600'
          }`}>
            {b.status}
          </p>
        </div>
        <p className="text-xs font-mono text-gray-400">{b.id}</p>
      </div>

      {/* Status message */}
      <StatusMessage status={b.status} />

      {/* Booking details */}
      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Unit</p>
          <p className="font-semibold text-gray-800">{b.unitName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Guest</p>
          <p className="font-semibold text-gray-800">{b.customer.name}</p>
        </div>
        {b.unitLocation && (
          <div className="col-span-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Location</p>
            <p className="font-semibold text-gray-800">{b.unitLocation}</p>
          </div>
        )}
        {b.unitAddress && (
          <div className="col-span-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Address</p>
            <p className="font-semibold text-gray-800">{b.unitAddress}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Check-in</p>
          <p className="font-semibold text-gray-800">{b.checkIn} · 2:00 PM</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Check-out</p>
          <p className="font-semibold text-gray-800">{b.checkOut} · 12:00 Noon</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Nights</p>
          <p className="font-semibold text-gray-800">{b.nights}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
          <p className="font-semibold text-gray-800">{formatPHP(b.totalAmount)}</p>
        </div>
      </div>

      {/* Payment block */}
      <div className="mt-5 pt-4 border-t border-brand-light">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Payment</p>
        {isPartial ? (
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Reservation fee paid:</span>
              <span className="font-semibold text-amber-800">{formatPHP(reservationFee)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-amber-100">
              <span className="text-gray-700 font-medium">Balance due at check-in:</span>
              <span className="font-bold text-amber-900">{formatPHP(balanceDue)}</span>
            </div>
            <p className="text-[11px] text-amber-700/80 mt-2">
              Please bring the balance in cash or have it ready to transfer on {b.checkIn}.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Paid in full:</span>
              <span className="font-bold text-green-800">{formatPHP(b.totalAmount)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusMessage({ status }: { status: LookupBooking['status'] }) {
  if (status === 'pending') {
    return (
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
        We&apos;ve received your booking and are verifying your payment. You&apos;ll get an email once it&apos;s confirmed — usually within 24 hours.
      </p>
    );
  }
  if (status === 'confirmed') {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
        Your booking is confirmed. We can&apos;t wait to host you!
      </p>
    );
  }
  if (status === 'cancelled') {
    return (
      <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
        This booking has been cancelled. If you have questions, please contact us.
      </p>
    );
  }
  if (status === 'refunded') {
    return (
      <p className="text-sm text-purple-700 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
        Your refund has been processed. Funds should appear within 3–5 business days.
      </p>
    );
  }
  if (status === 'done') {
    return (
      <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
        Thanks for staying with us! We hope you enjoyed your visit.
      </p>
    );
  }
  return null;
}

export default function MyBookingPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-10 text-gray-400 text-sm">Loading...</div>}>
      <MyBookingInner />
    </Suspense>
  );
}
