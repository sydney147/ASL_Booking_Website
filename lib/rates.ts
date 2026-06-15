import { Unit, Guests, RateBreakdown } from './types';

export const RESERVATION_PCT = 0.35;

export function calcReservationFee(totalAmount: number): number {
  return Math.ceil(totalAmount * RESERVATION_PCT);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

// First 2 guests (adults first, then children) are free.
// Beyond that: adults ₱300/night, children ₱200/night, infants free.
export function calcExtraGuestFee(guests: Guests, nights: number): number {
  const { adults, children } = guests;
  const extraAdults   = Math.max(0, adults - 2);
  const freeChildren  = Math.max(0, 2 - adults);
  const extraChildren = Math.max(0, children - freeChildren);
  return (extraAdults * 300 + extraChildren * 200) * nights;
}

export function calculateRates(
  unit: Unit,
  checkIn: string,
  checkOut: string,
  guests: Guests
): RateBreakdown {
  const nights      = nightsBetween(checkIn, checkOut);
  const roomTotal   = nights * unit.standardRate;
  const cleaningFee = nights > 0 ? unit.cleaningFee : 0;
  const extraGuestFee = calcExtraGuestFee(guests, nights);

  return {
    nights,
    roomTotal,
    cleaningFee,
    extraGuestFee,
    totalAmount: roomTotal + cleaningFee + extraGuestFee,
  };
}

export function formatPHP(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}
