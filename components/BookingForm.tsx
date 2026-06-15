'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Unit, Guests, PaymentMethod } from '@/lib/types';
import { formatPHP } from '@/lib/rates';
import { nightsBetween } from '@/lib/dates';
import GuestCounter from './GuestCounter';
import PaymentModal from './PaymentModal';
import SuccessModal from './SuccessModal';

type Props = { unit: Unit };

// ── constants ─────────────────────────────────────────────────────
const WEEK_DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MAX_GUESTS      = 5;
const ADULT_EXTRA     = 300;
const CHILD_EXTRA     = 200;
const RESERVATION_PCT = 0.35;

// ── date helpers ──────────────────────────────────────────────────
function todayStr()                        { return new Date().toISOString().slice(0, 10); }
function addDays(d: string, n: number)     { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); }
function countNights(a: string, b: string) { return Math.max(0, Math.round((+new Date(b) - +new Date(a)) / 86_400_000)); }
function cellKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function displayDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── phone helpers (Philippine mobile: 11 digits, format XXXX XXX XXXX) ──
function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}
function isValidPHMobile(formatted: string): boolean {
  const digits = formatted.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('09');
}

// ── fee helpers ───────────────────────────────────────────────────
function guestFeeBreakdown(g: Guests, nights: number) {
  const extraAdults   = Math.max(0, g.adults - 2);
  const freeChildren  = Math.max(0, 2 - g.adults);
  const extraChildren = Math.max(0, g.children - freeChildren);
  return {
    extraAdults,
    extraChildren,
    fee: (extraAdults * ADULT_EXTRA + extraChildren * CHILD_EXTRA) * nights,
  };
}

// ── main component ────────────────────────────────────────────────
export default function BookingForm({ unit }: Props) {
  const TODAY    = todayStr();
  const TOMORROW = addDays(TODAY, 1);

  // dates
  const [checkIn,    setCheckIn]    = useState(TODAY);
  const [checkOut,   setCheckOut]   = useState(TOMORROW);
  const [calYear,    setCalYear]    = useState(() => new Date().getFullYear());
  const [calMonth,   setCalMonth]   = useState(() => new Date().getMonth());
  const [pickingEnd, setPickingEnd] = useState(false);

  // guests
  const [guests, setGuests] = useState<Guests>({ adults: 1, children: 0, infants: 0, pets: 0 });

  // contact
  const [info, setInfo] = useState({ name: '', email: '', phone: '' });

  // payment
  const [payOption,    setPayOption]    = useState<'reservation' | 'full'>('reservation');
  const [showPayment,  setShowPayment]  = useState(false);
  const [success,      setSuccess]      = useState<string | null>(null);
  const [submitError,  setSubmitError]  = useState<string | null>(null);

  // confirmed bookings for this unit — used to block dates
  const [bookedRanges, setBookedRanges] = useState<Array<{ checkIn: string; checkOut: string }>>([]);

  useEffect(() => {
    fetch(`/api/bookings/blocked?unitId=${unit.id}`)
      .then(r => r.json())
      .then((data: { ranges: Array<{ checkIn: string; checkOut: string }> }) =>
        setBookedRanges(data.ranges ?? []))
      .catch(() => {});
  }, [unit.id]);

  // Set of individual nights occupied by existing bookings
  const blockedDates = useMemo(() => {
    const s = new Set<string>();
    bookedRanges.forEach(r => {
      nightsBetween(r.checkIn, r.checkOut).forEach(night => s.add(night));
    });
    return s;
  }, [bookedRanges]);

  // True if any night in [start, end) is blocked
  function rangeOverlapsBlocked(start: string, end: string): boolean {
    return nightsBetween(start, end).some(night => blockedDates.has(night));
  }

  // ── derived ─────────────────────────────────────────────────────
  const stayNights    = countNights(checkIn, checkOut);
  const roomTotal     = unit.standardRate * stayNights;
  const cleaningFee   = 0;

  const { extraAdults, extraChildren, fee: extraGuestFee } = useMemo(
    () => guestFeeBreakdown(guests, stayNights),
    [guests, stayNights],
  );

  const totalAmount    = roomTotal + cleaningFee + extraGuestFee;
  const reservationFee = Math.ceil(totalAmount * RESERVATION_PCT);
  const totalDueNow    = payOption === 'reservation' ? reservationFee : totalAmount;
  const balanceAtCI    = totalAmount - reservationFee;

  const totalGuests = guests.adults + guests.children + guests.infants;

  const validations = useMemo(() => {
    const e: string[] = [];
    if (!info.name.trim())                       e.push('Full name is required.');
    if (!/^\S+@\S+\.\S+$/.test(info.email))      e.push('Valid email is required.');
    if (!info.phone.trim())                      e.push('Contact number is required.');
    else if (!isValidPHMobile(info.phone))       e.push('Phone must be an 11-digit number starting with 09 (e.g. 0945 392 1991).');
    if (stayNights < 1)                          e.push('Check-out must be after check-in.');
    if (rangeOverlapsBlocked(checkIn, checkOut)) e.push('Selected dates overlap with an existing booking.');
    if (totalGuests > MAX_GUESTS)                e.push(`Maximum ${MAX_GUESTS} guests allowed.`);
    if (!unit.petsFriendly && guests.pets > 0)   e.push('This unit does not allow pets.');
    return e;
  }, [info, stayNights, totalGuests, unit.petsFriendly, guests.pets]);

  const canProceed = validations.length === 0;

  // ── calendar logic ───────────────────────────────────────────────
  const firstDow  = new Date(calYear, calMonth, 1).getDay();
  const daysInMon = new Date(calYear, calMonth + 1, 0).getDate();

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }
  function goToday() {
    setCalYear(new Date().getFullYear());
    setCalMonth(new Date().getMonth());
  }

  function handleDayClick(ds: string) {
    if (ds < TODAY) return;
    if (blockedDates.has(ds)) return;
    if (!pickingEnd) {
      setCheckIn(ds);
      setCheckOut(addDays(ds, 1));
      setPickingEnd(true);
    } else {
      if (ds <= checkIn) {
        setCheckIn(ds);
        setCheckOut(addDays(ds, 1));
      } else {
        // If the range crosses a blocked date, restart from clicked date
        if (rangeOverlapsBlocked(checkIn, ds)) {
          setCheckIn(ds);
          setCheckOut(addDays(ds, 1));
        } else {
          setCheckOut(ds);
          setPickingEnd(false);
        }
      }
    }
  }

  function dayCls(ds: string): string {
    const past      = ds < TODAY;
    const blocked   = blockedDates.has(ds);
    const isStart   = ds === checkIn;
    const isEnd     = ds === checkOut;
    const inRange   = ds > checkIn && ds < checkOut;
    const isToday   = ds === TODAY;

    if (past)             return 'text-gray-300 cursor-not-allowed';
    if (blocked)          return 'bg-red-100 text-red-400 line-through cursor-not-allowed select-none font-medium';
    if (isStart || isEnd) return 'bg-brand-primary text-white font-semibold rounded-lg cursor-pointer';
    if (inRange)          return blockedDates.has(ds)
                            ? 'bg-red-100 text-red-400 line-through cursor-not-allowed font-medium'
                            : 'bg-brand-primary/10 text-brand-primary cursor-pointer';
    return `cursor-pointer hover:bg-brand-bg rounded-lg${isToday ? ' font-bold text-brand-secondary' : ' text-gray-700'}`;
  }

  // Build grid cells
  const cells: Array<string | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(cellKey(calYear, calMonth, d));
  while (cells.length % 7 !== 0) cells.push(null);

  // ── submit ──────────────────────────────────────────────────────
  async function submitBooking(method: PaymentMethod, proofUrl: string) {
    setSubmitError(null);
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitId: unit.id, unitName: unit.name,
        customer: info, checkIn, checkOut, guests,
        paymentMethod: method, paymentOption: payOption, proofUrl,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Booking failed.');
    setShowPayment(false);
    setSuccess(data.bookingId);
  }

  // Dynamic counter maxes
  const adultsMax   = Math.max(1, MAX_GUESTS - guests.children - guests.infants);
  const childrenMax = Math.max(0, MAX_GUESTS - guests.adults   - guests.infants);
  const infantsMax  = Math.max(0, MAX_GUESTS - guests.adults   - guests.children);

  // ── render ──────────────────────────────────────────────────────
  return (
    <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">

      {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-5">

        {/* Guest Information */}
        <section className="card">
          <CardHeader icon="person">Guest Information</CardHeader>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name <Ast /></label>
              <input
                className="field" placeholder="Your full name"
                value={info.name}
                onChange={e => setInfo({ ...info, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Contact Number <Ast /></label>
              <input
                type="tel"
                inputMode="numeric"
                className="field"
                placeholder="0000 000 0000"
                maxLength={13}
                value={info.phone}
                onChange={e => setInfo({ ...info, phone: formatPhone(e.target.value) })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Email Address <Ast /></label>
              <input
                type="email" className="field" placeholder="Your email address"
                value={info.email}
                onChange={e => setInfo({ ...info, email: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* Booking Dates */}
        <section className="card">
          <CardHeader icon="calendar">Booking Dates</CardHeader>

          {/* Calendar widget */}
          <div className="border border-brand-light rounded-xl overflow-hidden mb-4">

            {/* Month nav */}
            <div className="flex items-center justify-between px-4 py-3 bg-brand-bg border-b border-brand-light">
              <button type="button" onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-light transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-gray-800">
                {MONTH_NAMES[calMonth]} {calYear}
              </span>
              <div className="flex gap-1">
                <button type="button" onClick={nextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-light transition-colors">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button type="button" onClick={goToday} title="Go to today"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-light text-sm text-gray-400 transition-colors">
                  ↺
                </button>
              </div>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 text-center border-b border-brand-light">
              {WEEK_DAYS.map(d => (
                <div key={d} className="py-2 text-xs font-medium text-gray-400">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 text-center px-1 sm:px-2 py-2 gap-y-0.5">
              {cells.map((ds, i) => (
                <div
                  key={i}
                  className={`py-2.5 sm:py-2 text-sm select-none text-center transition-colors ${ds ? dayCls(ds) : ''}`}
                  onClick={() => ds && handleDayClick(ds)}
                >
                  {ds ? parseInt(ds.slice(8)) : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Check-in / Check-out pills */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 bg-brand-bg border border-brand-light rounded-xl px-3 py-2.5">
              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Check-in</p>
                <p className="text-xs font-semibold text-brand-primary">{displayDate(checkIn)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-brand-bg border border-brand-light rounded-xl px-3 py-2.5">
              <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Check-out</p>
                <p className="text-xs font-semibold text-brand-primary">{displayDate(checkOut)}</p>
              </div>
            </div>
          </div>

          {/* Stay details */}
          <div className="rounded-xl bg-brand-bg border border-brand-light px-4 py-3 space-y-2 text-sm">
            <SummaryRow label="Total Nights:">
              <span className="font-semibold text-brand-primary">{stayNights}</span>
            </SummaryRow>
            <SummaryRow label="Check-in Time:">2:00 PM</SummaryRow>
            <SummaryRow label="Check-out Time:">12:00 Noon</SummaryRow>
            <SummaryRow label="Selected Dates:">
              <span className="text-right">{displayDate(checkIn)} — {displayDate(checkOut)} ({stayNights} {stayNights === 1 ? 'night' : 'nights'})</span>
            </SummaryRow>
          </div>

          {blockedDates.size > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="w-3 h-3 rounded bg-red-50 border border-red-200 flex-shrink-0" />
              Dates crossed out are already booked
            </div>
          )}
          {pickingEnd && (
            <p className="mt-2 text-xs text-brand-secondary text-center">
              Now select your check-out date
            </p>
          )}
        </section>

        {/* Guest Details */}
        <section className="card">
          <CardHeader icon="group">Guest Details</CardHeader>
          <div className="divide-y divide-brand-light">
            <GuestCounter label="Adults"   hint="Age 13+"   value={guests.adults}   min={1} max={adultsMax}
              onChange={n => setGuests(g => ({ ...g, adults: n }))} />
            <GuestCounter label="Children" hint="Ages 2-12" value={guests.children} max={childrenMax}
              onChange={n => setGuests(g => ({ ...g, children: n }))} />
            <GuestCounter label="Infants"  hint="Under 2"   value={guests.infants}  max={infantsMax}
              onChange={n => setGuests(g => ({ ...g, infants: n }))} />
            <GuestCounter
              label="Pets"
              hint={unit.petsFriendly ? 'Furry friends' : 'Not allowed at this unit'}
              value={guests.pets}
              max={unit.petsFriendly ? 3 : 0}
              onChange={n => setGuests(g => ({ ...g, pets: n }))}
            />
          </div>
          {/* Extra guest fee info note */}
          <div className="mt-3 rounded-xl bg-brand-bg border border-brand-light px-3 py-2.5 text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-gray-600 mb-1">
              <svg className="w-3.5 h-3.5 text-brand-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Extra Guest Fee Policy
            </div>
            <p>First 2 guests are complimentary (adults counted first, then children).</p>
            <ul className="space-y-0.5 pl-1">
              <li>• Additional adults (13+): <span className="font-medium text-gray-700">₱{ADULT_EXTRA}/night</span></li>
              <li>• Additional children (2–12): <span className="font-medium text-gray-700">₱{CHILD_EXTRA}/night</span></li>
              <li>• Infants (under 2): <span className="font-medium text-gray-700">Always free</span></li>
            </ul>
            {extraGuestFee > 0 && (
              <p className="mt-1 pt-1.5 border-t border-brand-light font-medium text-brand-secondary">
                Current extra fee: {formatPHP(extraGuestFee / Math.max(1, stayNights))}/night × {stayNights} night(s) = {formatPHP(extraGuestFee)}
              </p>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-brand-light flex items-center justify-between text-sm">
            <span className="text-gray-500">Total Guests:</span>
            <span className="font-semibold text-gray-800">
              {totalGuests}
              {totalGuests >= MAX_GUESTS && (
                <span className="ml-1 text-xs text-amber-500">(maximum reached)</span>
              )}
            </span>
          </div>
        </section>
      </div>

      {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
      <aside className="lg:col-span-1">
        <div className="card sticky top-20 space-y-0">

          {/* Booking Summary */}
          <CardHeader icon="clipboard">Booking Summary</CardHeader>
          <div className="space-y-2 text-sm pb-5 border-b border-brand-light">
            <SummaryRow label="Unit:">          {unit.id}</SummaryRow>
            <SummaryRow label="Rate per Night:">{formatPHP(unit.standardRate)}</SummaryRow>
            <SummaryRow label="Total Nights:">  {stayNights}</SummaryRow>
            <SummaryRow label="Room Total:">{formatPHP(roomTotal)}</SummaryRow>
            <div>
              <SummaryRow label="Extra Guest Fee:">{formatPHP(extraGuestFee)}</SummaryRow>
              {extraGuestFee > 0 && (
                <p className="text-[10px] text-gray-400 text-right mt-0.5">
                  {[
                    extraAdults   > 0 ? `${extraAdults} adult(s) × ₱${ADULT_EXTRA}`    : '',
                    extraChildren > 0 ? `${extraChildren} child(ren) × ₱${CHILD_EXTRA}` : '',
                  ].filter(Boolean).join(' + ')} × {stayNights} night(s)
                </p>
              )}
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-brand-light">
              <span className="text-gray-700">Total Amount:</span>
              <span className="text-brand-primary">{formatPHP(totalAmount)}</span>
            </div>
          </div>

          {/* Payment Option */}
          <div className="py-5 border-b border-brand-light">
            <CardHeader icon="card">Payment Option</CardHeader>
            <div className="space-y-2">
              {([
                { val: 'reservation' as const, title: 'Reservation Fee Only', desc: 'Pay 35% now, balance upon check-in' },
                { val: 'full'        as const, title: 'Pay in Full',           desc: 'Pay total amount now' },
              ]).map(opt => (
                <label key={opt.val}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    payOption === opt.val
                      ? 'border-brand-primary bg-brand-primary/5'
                      : 'border-brand-light hover:border-brand-secondary'
                  }`}
                >
                  <input
                    type="radio" name="payOption"
                    className="mt-0.5 accent-[#41224A]"
                    checked={payOption === opt.val}
                    onChange={() => setPayOption(opt.val)}
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{opt.title}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="py-5 border-b border-brand-light">
            <CardHeader icon="receipt">Payment Summary</CardHeader>
            <div className="bg-brand-bg rounded-xl p-3 space-y-2 text-sm">
              <SummaryRow label="Booking Amount:">{formatPHP(totalAmount)}</SummaryRow>
              <div className="flex justify-between border-t border-brand-light pt-2">
                <span className="font-semibold text-gray-700">Total Amount:</span>
                <span className="font-semibold text-gray-800">{formatPHP(totalAmount)}</span>
              </div>
              <SummaryRow label={payOption === 'reservation' ? `Reservation (${Math.round(RESERVATION_PCT * 100)}%):` : 'Full Payment:'}>
                {formatPHP(payOption === 'reservation' ? reservationFee : totalAmount)}
              </SummaryRow>
              <div className="flex justify-between border-t border-brand-light pt-2">
                <span className="font-bold text-gray-700">Total Due Now:</span>
                <span className="font-bold text-brand-primary">{formatPHP(totalDueNow)}</span>
              </div>
              {payOption === 'reservation' && (
                <SummaryRow label="Balance Due at Check-in:">{formatPHP(balanceAtCI)}</SummaryRow>
              )}
            </div>
          </div>

          {/* Validation + button */}
          <div className="pt-5 space-y-4">
            {!canProceed && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-xs font-semibold text-red-600 mb-2">Please fix the following:</p>
                <ul className="space-y-1.5">
                  {validations.map(v => (
                    <li key={v} className="flex items-start gap-2 text-xs text-red-500">
                      <span className="mt-px flex-shrink-0 text-red-400">•</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {submitError && (
              <div className="rounded-xl bg-red-50 text-red-700 text-sm px-3 py-2">{submitError}</div>
            )}
            <button
              className="btn-primary w-full justify-center"
              disabled={!canProceed}
              onClick={() => setShowPayment(true)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Confirm Booking
            </button>
          </div>
        </div>
      </aside>

      <PaymentModal
        open={showPayment}
        totalAmount={totalDueNow}
        onCancel={() => setShowPayment(false)}
        onSubmit={submitBooking}
      />
      <SuccessModal
        open={!!success}
        bookingId={success ?? ''}
        email={info.email}
        onClose={() => setSuccess(null)}
      />
    </div>
  );
}

// ── shared micro-components ───────────────────────────────────────

function Ast() {
  return <span className="text-red-400">*</span>;
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 items-start">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 text-right min-w-0 break-words">{children}</span>
    </div>
  );
}

type IconKey = 'person' | 'calendar' | 'group' | 'clipboard' | 'card' | 'receipt';

const ICON_PATHS: Record<IconKey, string> = {
  person:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  calendar:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  group:     'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  card:      'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  receipt:   'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
};

function CardHeader({ icon, children }: { icon: IconKey; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-brand-light">
      <svg className="w-4 h-4 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON_PATHS[icon]} />
      </svg>
      <h2 className="text-sm font-semibold text-gray-700">{children}</h2>
    </div>
  );
}
