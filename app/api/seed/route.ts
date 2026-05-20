import { NextRequest, NextResponse } from 'next/server';
import { seedSheet } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const expected = `Bearer ${process.env.SEED_SECRET}`;
  if (!process.env.SEED_SECRET || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized — set SEED_SECRET env var and pass it as Bearer token' }, { status: 401 });
  }
  try {
    const counts = await seedSheet();
    return NextResponse.json({ ok: true, counts });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
