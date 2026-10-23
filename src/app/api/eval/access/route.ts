import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  // Public access to the preserved evaluation dashboard does not grant an admin role.
  return NextResponse.json({ ok: true, role: 'viewer' });
}

export async function GET() {
  return POST();
}
