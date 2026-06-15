import { NextRequest, NextResponse } from 'next/server';
import { fetchUnit } from '@/lib/units';
import { calculateRates } from '@/lib/rates';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const unit = await fetchUnit(body.unitId);
  if (!unit) return NextResponse.json({ error: 'Unknown unit' }, { status: 404 });
  const rates = calculateRates(unit, body.checkIn, body.checkOut, body.guests);
  return NextResponse.json(rates);
}
