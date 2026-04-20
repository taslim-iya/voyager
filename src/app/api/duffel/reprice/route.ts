import { NextResponse } from 'next/server';
import { repriceOffer } from '@/lib/duffel/book';

export async function POST(request: Request) {
  const { offerId } = await request.json();
  if (!offerId) return NextResponse.json({ error: 'Missing offerId' }, { status: 400 });

  const result = await repriceOffer(offerId);
  return NextResponse.json(result);
}
