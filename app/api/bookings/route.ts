import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { firebaseConfigured } from '@/lib/firebase';
import { fetchUnit } from '@/lib/units';
import { calcReservationFee, calculateRates } from '@/lib/rates';
import { BookingInput } from '@/lib/types';
import { sendBookingReceived } from '@/lib/email';

export const runtime = 'nodejs';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  let body: BookingInput;
  try {
    body = (await req.json()) as BookingInput;
  } catch {
    return badRequest('Invalid JSON.');
  }

  // ---- validate required fields ----
  if (!body.unitId || !body.unitName) return badRequest('Missing unit.');
  if (!body.customer?.name || !body.customer?.email || !body.customer?.phone)
    return badRequest('Customer name, email, and phone are required.');
  if (!/^\S+@\S+\.\S+$/.test(body.customer.email)) return badRequest('Invalid email.');
  const phoneDigits = body.customer.phone.replace(/\D/g, '');
  if (phoneDigits.length !== 11 || !phoneDigits.startsWith('09')) {
    return badRequest('Phone must be a valid Philippine mobile number (e.g. 0945 392 1991).');
  }
  if (!body.checkIn || !body.checkOut) return badRequest('Dates are required.');
  if (new Date(body.checkOut) <= new Date(body.checkIn))
    return badRequest('Check-out must be after check-in.');

  const paymentOption = body.paymentOption === 'full' ? 'full' : 'reservation';

  const unit = await fetchUnit(body.unitId);
  if (!unit) return badRequest('Unknown unit.');

  // ---- recalculate rates server-side (do not trust the client) ----
  const rates = calculateRates(unit, body.checkIn, body.checkOut, body.guests);
  if (rates.nights < 1) return badRequest('Invalid date range.');

  if (!unit.petsFriendly && (body.guests.pets ?? 0) > 0)
    return badRequest('This unit does not allow pets.');

  if (!firebaseConfigured) {
    return NextResponse.json(
      {
        error:
          'Firebase is not configured. Add Firebase keys to .env.local to save bookings.',
      },
      { status: 503 }
    );
  }

  // ---- check for overlapping active bookings ----
  const existingSnap = await adminDb()
    .collection('bookings')
    .where('unitId', '==', unit.id)
    .get();
  const hasOverlap = existingSnap.docs
    .map(d => d.data())
    .filter(d => d.status === 'confirmed' || d.status === 'done')
    .some(d => body.checkIn < d.checkOut && body.checkOut > d.checkIn);

  if (hasOverlap) {
    return badRequest('The selected dates are no longer available. Please choose different dates.');
  }

  const reservationFee = calcReservationFee(rates.totalAmount);
  const balanceDue     = paymentOption === 'full' ? 0 : rates.totalAmount - reservationFee;

  const bookingDoc = {
    unitId: unit.id,
    unitName: unit.name,
    unitAddress: unit.address ?? '',
    unitLocation: unit.location ?? '',
    customer: body.customer,
    checkIn: body.checkIn,
    checkOut: body.checkOut,
    guests: body.guests,
    nights: rates.nights,
    roomTotal: rates.roomTotal,
    cleaningFee: rates.cleaningFee,
    extraGuestFee: rates.extraGuestFee,
    totalAmount: rates.totalAmount,
    paymentMethod: body.paymentMethod ?? null,
    paymentOption,
    reservationFee,
    balanceDue,
    proofUrl: body.proofUrl ?? '',
    status: 'pending' as const,
    createdAt: FieldValue.serverTimestamp(),
  };

  try {
    const ref = await adminDb().collection('bookings').add(bookingDoc);

    void sendBookingReceived({
      bookingId: ref.id,
      to: body.customer.email,
      name: body.customer.name,
      unitName: unit.name,
      unitAddress: unit.address ?? '',
      unitLocation: unit.location ?? '',
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      totalAmount: rates.totalAmount,
      paymentOption,
      reservationFee,
      balanceDue,
    });

    return NextResponse.json({ bookingId: ref.id, ...rates });
  } catch (err) {
    console.error('saveBooking failed:', err);
    return NextResponse.json({ error: 'Could not save booking.' }, { status: 500 });
  }
}
