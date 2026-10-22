import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json({ ok: true, role: 'admin' });
}

export async function GET() {
  return POST();
}
