import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAdmin } from '@/lib/firebase-admin';
import {
  sendBookingCancelled,
  sendBookingConfirmed,
  sendBookingRefunded,
} from '@/lib/email';

export const runtime = 'nodejs';

type Body = { status?: string };
const VALID = ['pending', 'confirmed', 'cancelled', 'done', 'refunded'] as const;
type Status = typeof VALID[number];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: Body;
  try { body = await req.json(); } catch { body = {}; }

  const status = body.status as Status | undefined;
  if (!status || !VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  const id = params.id;
  const ref = adminDb().collection('bookings').doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }

  await ref.update({ status });

  const data = snap.data()!;
  const baseArgs = {
    bookingId: id,
    to: String(data.customer?.email ?? ''),
    name: String(data.customer?.name ?? ''),
    unitName: String(data.unitName ?? ''),
    unitAddress: data.unitAddress ? String(data.unitAddress) : undefined,
    unitLocation: data.unitLocation ? String(data.unitLocation) : undefined,
    checkIn: String(data.checkIn ?? ''),
    checkOut: String(data.checkOut ?? ''),
    totalAmount: Number(data.totalAmount ?? 0),
  };

  // Fire and forget — UI returns to admin without waiting for email.
  if (status === 'confirmed') {
    void sendBookingConfirmed({
      ...baseArgs,
      paymentOption: data.paymentOption === 'full' ? 'full' : 'reservation',
      reservationFee: Number(data.reservationFee ?? 0),
      balanceDue:     Number(data.balanceDue ?? 0),
    });
  } else if (status === 'cancelled') {
    void sendBookingCancelled(baseArgs);
  } else if (status === 'refunded') {
    void sendBookingRefunded(baseArgs);
  }
  // 'pending' and 'done' don't trigger an email by design.

  return NextResponse.json({ ok: true, status });
}
