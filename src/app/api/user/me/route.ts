// SehatAI — Phase 0: current user info (for auth UI state)
// GET /api/user/me -> { user: { id, email, name, consented, retentionDays } | null }
// Lightweight, unauthenticated reads return 200 with { user: null } so the
// client can probe session state without triggering error toasts.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ user: null });
  }
  const row = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, consentAt: true, retentionDays: true },
  });
  if (!row) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      consented: !!row.consentAt,
      retentionDays: row.retentionDays,
    },
  });
}
