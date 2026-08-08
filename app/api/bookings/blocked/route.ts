import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { firebaseConfigured } from '@/lib/firebase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const unitId = req.nextUrl.searchParams.get('unitId');
  if (!unitId) return NextResponse.json({ ranges: [] });
  if (!firebaseConfigured) return NextResponse.json({ ranges: [] });

  try {
    const [bookingsSnap, blocksSnap] = await Promise.all([
      adminDb().collection('bookings').where('unitId', '==', unitId).get(),
      adminDb().collection('blockedRanges').where('unitId', '==', unitId).get(),
    ]);

    const bookingRanges = bookingsSnap.docs
      .map(d => d.data())
      .filter(d => d.status === 'confirmed' || d.status === 'done')
      .map(d => ({ checkIn: d.checkIn as string, checkOut: d.checkOut as string }));

    // Manually blocked ranges (e.g. booked directly on Airbnb) count as unavailable too.
    const manualRanges = blocksSnap.docs
      .map(d => d.data())
      .map(d => ({ checkIn: d.startDate as string, checkOut: d.endDate as string }));

    return NextResponse.json({ ranges: [...bookingRanges, ...manualRanges] });
  } catch (err) {
    console.error('blocked-dates query failed:', err);
    return NextResponse.json({ ranges: [] });
  }
}
