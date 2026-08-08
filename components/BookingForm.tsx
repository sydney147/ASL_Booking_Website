'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Unit, Guests, PaymentMethod } from '@/lib/types';
import { formatPHP } from '@/lib/rates';
import { nightsBetween } from '@/lib/dates';
import GuestCounter from './GuestCounter';
import GuestInfoDialog from './GuestInfoDialog';
import PaymentModal from './PaymentModal';
import SuccessModal from './SuccessModal';

type Props = { unit: Unit };

// ── constants ─────────────────────────────────────────────────────
const WEEK_DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
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

// ── main component: compact sticky booking widget ─────────────────
export default function BookingForm({ unit }: Props) {
  const TODAY    = todayStr();
  const TOMORROW = addDays(TODAY, 1);

  // dates + calendar
  const [checkIn,     setCheckIn]     = useState(TODAY);
  const [checkOut,    setCheckOut]    = useState(TOMORROW);
  const [calYear,     setCalYear]     = useState(() => new Date().getFullYear());
  const [calMonth,    setCalMonth]    = useState(() => new Date().getMonth());
  const [pickingDate, setPickingDate] = useState<'checkIn' | 'checkOut'>('checkIn');
  const [calendarOpen, setCalendarOpen] = useState(false);

  // guests
  const [guests,       setGuests]      = useState<Guests>({ adults: 1, children: 0, infants: 0, pets: 0 });
  const [guestsOpen,   setGuestsOpen]  = useState(false);

  // contact
  const [info, setInfo] = useState({ name: '', email: '', phone: '' });
  const [specialRequests, setSpecialRequests] = useState('');

  // payment
  const [payOption,    setPayOption]    = useState<'reservation' | 'full'>('reservation');
  const [dialogStep,   setDialogStep]   = useState<'guestInfo' | 'payment' | null>(null);
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
    if (stayNights < 1)                          e.push('Check-out must be after check-in.');
    if (rangeOverlapsBlocked(checkIn, checkOut)) e.push('Selected dates overlap with an existing booking.');
    if (totalGuests > MAX_GUESTS)                e.push(`Maximum ${MAX_GUESTS} guests allowed.`);
    return e;
  }, [stayNights, totalGuests, checkIn, checkOut]);

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

  function handleDayClick(ds: string) {
    if (ds < TODAY) return;
    if (blockedDates.has(ds)) return;

    if (pickingDate === 'checkIn') {
      // Set check-in. If the existing checkout is now invalid (same day or earlier,
      // or now crosses a booked date), silently bump it forward by one night so the
      // range stays valid. User will still explicitly click Check-out to adjust.
      setCheckIn(ds);
      if (ds >= checkOut || rangeOverlapsBlocked(ds, checkOut)) {
        setCheckOut(addDays(ds, 1));
      }
      // Close the calendar — user must click Check-out card separately to pick end date.
      setCalendarOpen(false);
    } else {
      // pickingDate === 'checkOut'
      // Ignore invalid clicks silently — user has to pick a date that's valid given check-in.
      if (ds <= checkIn) return;
      if (rangeOverlapsBlocked(checkIn, ds)) return;
      setCheckOut(ds);
      setCalendarOpen(false);
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
    if (inRange)          return 'bg-brand-primary/10 text-brand-primary cursor-pointer';
    return `cursor-pointer hover:bg-brand-bg rounded-lg${isToday ? ' font-bold text-brand-secondary' : ' text-gray-700'}`;
  }

  const cells: Array<string | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(cellKey(calYear, calMonth, d));
  while (cells.length % 7 !== 0) cells.push(null);

  // Dynamic counter maxes
  const adultsMax   = Math.max(1, MAX_GUESTS - guests.children - guests.infants);
  const childrenMax = Math.max(0, MAX_GUESTS - guests.adults   - guests.infants);
  const infantsMax  = Math.max(0, MAX_GUESTS - guests.adults   - guests.children);

  // ── submit flow ─────────────────────────────────────────────────
  function handleReserveClick() {
    if (!canProceed) return;
    setSubmitError(null);
    setDialogStep('guestInfo');
  }

  function handleGuestInfoContinue(newInfo: typeof info, newRequests: string) {
    setInfo(newInfo);
    setSpecialRequests(newRequests);
    setDialogStep('payment');
  }

  async function submitBooking(method: PaymentMethod, proofUrl: string) {
    setSubmitError(null);
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitId: unit.id, unitName: unit.name,
        customer: info, checkIn, checkOut, guests,
        paymentMethod: method, paymentOption: payOption, proofUrl,
        specialRequests,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Booking failed.');
    setDialogStep(null);
    setSuccess(data.bookingId);
  }

  // ── render ──────────────────────────────────────────────────────
  const guestSummary =
    totalGuests === 0
      ? 'Select guests'
      : `${totalGuests} guest${totalGuests === 1 ? '' : 's'}${guests.infants ? ` · ${guests.infants} infant${guests.infants === 1 ? '' : 's'}` : ''}`;

  return (
    <div className="card space-y-3">

      {/* Price header */}
      <div className="flex items-baseline gap-1.5 pb-3 border-b border-brand-light">
        <span className="text-brand-primary font-bold text-2xl">{formatPHP(unit.standardRate)}</span>
        <span className="text-xs text-brand-secondary">/night</span>
        <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          4.9 <span className="text-gray-300">·</span> 24
        </span>
      </div>

      {/* Compact date fields (open popover calendar) */}
      <div className="grid grid-cols-2 gap-2">
        {([
          { id: 'checkIn'  as const, label: 'CHECK-IN',  date: checkIn,  time: '2:00 PM',    dotColor: 'bg-green-500' },
          { id: 'checkOut' as const, label: 'CHECK-OUT', date: checkOut, time: '12:00 Noon', dotColor: 'bg-red-400' },
        ]).map(field => (
          <button
            key={field.id}
            type="button"
            onClick={() => { setPickingDate(field.id); setCalendarOpen(true); }}
            className={`text-left rounded-xl border-2 px-3 py-2 transition-colors ${
              calendarOpen && pickingDate === field.id
                ? 'border-brand-primary bg-brand-primary/5'
                : 'border-brand-light bg-brand-bg hover:border-brand-secondary'
            }`}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${field.dotColor}`} />
              <p className="text-[10px] text-brand-secondary uppercase tracking-wide font-medium">{field.label}</p>
            </div>
            <p className="text-xs font-semibold text-brand-primary leading-tight truncate">{displayDate(field.date)}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{field.time}</p>
          </button>
        ))}
      </div>

      {/* Calendar popover */}
      {calendarOpen && (
        <div className="border border-brand-light rounded-xl overflow-hidden animate-[fadeIn_120ms_ease-out]">
          <div className="flex items-center justify-between px-2 py-1.5 bg-brand-primary/5 border-b border-brand-light">
            <p className="text-[11px] font-medium text-brand-primary pl-1">
              {pickingDate === 'checkIn'
                ? 'Tap a date to set check-in'
                : 'Tap a date to set check-out'}
            </p>
            <button
              type="button"
              onClick={() => setCalendarOpen(false)}
              className="text-xs text-gray-500 hover:text-brand-primary px-1"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between px-3 py-2 bg-brand-bg border-b border-brand-light">
            <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-light">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-semibold text-gray-800">{MONTH_NAMES[calMonth]} {calYear}</span>
            <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-light">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 text-center border-b border-brand-light">
            {WEEK_DAYS.map(d => (
              <div key={d} className="py-1.5 text-[10px] font-medium text-brand-secondary">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 text-center px-1 py-1.5 gap-y-0.5">
            {cells.map((ds, i) => (
              <div
                key={i}
                className={`py-2 text-xs select-none text-center transition-colors ${ds ? dayCls(ds) : ''}`}
                onClick={() => ds && handleDayClick(ds)}
              >
                {ds ? parseInt(ds.slice(8)) : ''}
              </div>
            ))}
          </div>

          {blockedDates.size > 0 && (
            <div className="px-3 py-1.5 border-t border-brand-light flex items-center gap-1.5 text-[10px] text-brand-secondary">
              <span className="w-3 h-3 rounded bg-red-50 border border-red-200 flex-shrink-0" />
              Dates crossed out are already booked
            </div>
          )}
        </div>
      )}

      {/* Guests — expandable */}
      <div className="border border-brand-light rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setGuestsOpen(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 bg-brand-bg hover:bg-brand-light/50 transition-colors"
        >
          <div className="text-left">
            <p className="text-[10px] text-brand-secondary uppercase tracking-wide font-medium">Guests</p>
            <p className="text-xs font-semibold text-brand-primary">{guestSummary}</p>
          </div>
          <svg className={`w-4 h-4 text-gray-500 transition-transform ${guestsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {guestsOpen && (
          <div className="divide-y divide-brand-light animate-[fadeIn_120ms_ease-out]">
            <GuestCounter label="Adults"   hint="Age 13+"   value={guests.adults}   min={1} max={adultsMax}
              onChange={n => setGuests(g => ({ ...g, adults: n }))} />
            <GuestCounter label="Children" hint="Ages 2-12" value={guests.children} max={childrenMax}
              onChange={n => setGuests(g => ({ ...g, children: n }))} />
            <GuestCounter label="Infants"  hint="Under 2"   value={guests.infants}  max={infantsMax}
              onChange={n => setGuests(g => ({ ...g, infants: n }))} />
          </div>
        )}
      </div>

      {/* Payment option */}
      <div>
        <p className="text-[10px] text-brand-secondary uppercase tracking-wide font-medium mb-1.5">Payment Option</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { val: 'reservation' as const, title: 'Reserve now', desc: `Pay ${Math.round(RESERVATION_PCT * 100)}% now` },
            { val: 'full'        as const, title: 'Pay in full', desc: 'One-time payment' },
          ]).map(opt => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setPayOption(opt.val)}
              className={`text-left rounded-xl border-2 px-2.5 py-2 transition-colors ${
                payOption === opt.val
                  ? 'border-brand-primary bg-brand-primary/5'
                  : 'border-brand-light hover:border-brand-secondary'
              }`}
            >
              <p className="text-xs font-semibold text-gray-800">{opt.title}</p>
              <p className="text-[10px] text-gray-500">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Price breakdown */}
      {stayNights > 0 && (
        <div className="rounded-xl bg-brand-bg/60 border border-brand-light px-3 py-2.5 space-y-1.5 text-xs">
          <SummaryRow label={`${formatPHP(unit.standardRate)} × ${stayNights} night${stayNights === 1 ? '' : 's'}`}>
            {formatPHP(roomTotal)}
          </SummaryRow>
          {extraGuestFee > 0 && (
            <SummaryRow label={`Extra guests${extraAdults ? ` · ${extraAdults} adult` : ''}${extraChildren ? ` · ${extraChildren} child` : ''}`}>
              {formatPHP(extraGuestFee)}
            </SummaryRow>
          )}
          <div className="pt-1.5 border-t border-brand-light">
            <SummaryRow label={<span className="font-semibold text-gray-700">Total</span>}>
              <span className="font-bold text-brand-primary">{formatPHP(totalAmount)}</span>
            </SummaryRow>
            <SummaryRow label={<span className="text-[10px] text-gray-500">Due now ({payOption === 'reservation' ? `${Math.round(RESERVATION_PCT * 100)}%` : 'Full'})</span>}>
              <span className="text-[10px] font-semibold text-brand-secondary">{formatPHP(totalDueNow)}</span>
            </SummaryRow>
            {payOption === 'reservation' && (
              <SummaryRow label={<span className="text-[10px] text-gray-500">Balance at check-in</span>}>
                <span className="text-[10px] text-gray-500">{formatPHP(balanceAtCI)}</span>
              </SummaryRow>
            )}
          </div>
        </div>
      )}

      {/* Validation errors */}
      {!canProceed && validations.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2">
          <ul className="space-y-1 text-[11px] text-red-600">
            {validations.map(v => <li key={v}>• {v}</li>)}
          </ul>
        </div>
      )}

      {submitError && (
        <div className="rounded-xl bg-red-50 text-red-700 text-xs px-3 py-2">{submitError}</div>
      )}

      {/* Reserve button */}
      <button
        type="button"
        onClick={handleReserveClick}
        disabled={!canProceed}
        className="btn-primary w-full justify-center"
      >
        Reserve
      </button>

      {/* Cancellation policy */}
      <div className="rounded-xl bg-brand-cream/60 border border-brand-light px-3 py-2 text-[10px] text-gray-600 leading-relaxed">
        <p className="font-semibold text-gray-700 mb-0.5">Free cancellation up to 48 hours before check-in</p>
        <p className="text-gray-500">You won&apos;t be charged yet — payment happens in the next step.</p>
      </div>

      {/* Step 1 dialog: Guest Info */}
      <GuestInfoDialog
        open={dialogStep === 'guestInfo'}
        initial={{ ...info, specialRequests }}
        onCancel={() => setDialogStep(null)}
        onContinue={handleGuestInfoContinue}
      />

      {/* Step 2 dialog: Payment */}
      <PaymentModal
        open={dialogStep === 'payment'}
        totalAmount={totalDueNow}
        onCancel={() => setDialogStep(null)}
        onSubmit={submitBooking}
      />

      {/* Success */}
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

function SummaryRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 items-baseline">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 text-right whitespace-nowrap">{children}</span>
    </div>
  );
}
