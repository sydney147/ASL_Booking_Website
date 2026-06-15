import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { firebaseConfigured } from '@/lib/firebase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const unitId = req.nextUrl.searchParams.get('unitId');
  if (!unitId) return NextResponse.json({ ranges: [] });
  if (!firebaseConfigured) return NextResponse.json({ ranges: [] });

  try {
    const snap = await adminDb()
      .collection('bookings')
      .where('unitId', '==', unitId)
      .get();
    const ranges = snap.docs
      .map(d => d.data())
      .filter(d => d.status === 'confirmed' || d.status === 'done')
      .map(d => ({ checkIn: d.checkIn as string, checkOut: d.checkOut as string }));
    return NextResponse.json({ ranges });
  } catch (err) {
    console.error('blocked-dates query failed:', err);
    return NextResponse.json({ ranges: [] });
  }
}
