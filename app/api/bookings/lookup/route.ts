import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { firebaseConfigured } from '@/lib/firebase';

export const runtime = 'nodejs';

type Body = { bookingId?: string; email?: string };

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const bookingId = (body.bookingId ?? '').trim();
  const email     = (body.email ?? '').trim().toLowerCase();

  if (!bookingId || !email) {
    return NextResponse.json({ error: 'Booking ID and email are required.' }, { status: 400 });
  }

  if (!firebaseConfigured) {
    return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
  }

  try {
    const snap = await adminDb().collection('bookings').doc(bookingId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'No booking found with that ID and email.' }, { status: 404 });
    }
    const data = snap.data()!;
    const docEmail = String(data.customer?.email ?? '').trim().toLowerCase();
    if (docEmail !== email) {
      // Same vague error as not-found — don't leak whether the ID is valid.
      return NextResponse.json({ error: 'No booking found with that ID and email.' }, { status: 404 });
    }

    // Strip Firestore Timestamp before sending (not JSON-serializable in a nice way).
    const { createdAt, ...rest } = data;
    return NextResponse.json({
      id: snap.id,
      ...rest,
      createdAt: createdAt?.toDate?.()?.toISOString() ?? null,
    });
  } catch (err) {
    console.error('booking lookup failed:', err);
    return NextResponse.json({ error: 'Could not look up booking.' }, { status: 500 });
  }
}
