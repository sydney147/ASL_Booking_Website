import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    await adminDb().collection('blockedRanges').doc(params.id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('delete blocked-date failed:', err);
    return NextResponse.json({ error: 'Could not remove blocked date.' }, { status: 500 });
  }
}
