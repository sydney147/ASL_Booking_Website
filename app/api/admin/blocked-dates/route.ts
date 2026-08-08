import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, verifyAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

// GET — list every manually blocked range, across all units.
// The admin page groups these client-side by unitId, same pattern as bookings.
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const snap = await adminDb().collection('blockedRanges').orderBy('startDate', 'asc').get();
    const ranges = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        unitId: data.unitId,
        unitName: data.unitName,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        createdBy: data.createdBy,
      };
    });
    return NextResponse.json({ ranges });
  } catch (err) {
    console.error('list blocked-dates failed:', err);
    return NextResponse.json({ error: 'Could not load blocked dates.' }, { status: 500 });
  }
}

type Body = {
  unitId?: string;
  unitName?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
};

// POST — create a manual block. Only usable by a signed-in admin.
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { unitId, unitName, startDate, endDate } = body;
  const reason = (body.reason ?? '').trim().slice(0, 200) || 'Blocked';

  if (!unitId || !unitName || !startDate || !endDate) {
    return NextResponse.json({ error: 'unitId, unitName, startDate, and endDate are required.' }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return NextResponse.json({ error: 'Dates must be in YYYY-MM-DD format.' }, { status: 400 });
  }
  if (endDate <= startDate) {
    return NextResponse.json({ error: 'End date must be after start date.' }, { status: 400 });
  }

  try {
    const doc = {
      unitId,
      unitName,
      startDate,
      endDate,
      reason,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: admin.email ?? admin.uid,
    };
    const ref = await adminDb().collection('blockedRanges').add(doc);
    return NextResponse.json({
      id: ref.id,
      unitId,
      unitName,
      startDate,
      endDate,
      reason,
      createdAt: new Date().toISOString(),
      createdBy: doc.createdBy,
    });
  } catch (err) {
    console.error('create blocked-date failed:', err);
    return NextResponse.json({ error: 'Could not save blocked date.' }, { status: 500 });
  }
}
