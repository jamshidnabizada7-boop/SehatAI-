// SehatAI — Phase 0: Data deletion ("delete my data")
// DELETE /api/user/delete  -> cascades: User delete removes all related rows
// (Account, Session, PatientProfile, OutcomeEntry, AuditLog, Conversations, Messages).
// Records a final "data.delete" audit log entry BEFORE the cascade.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function DELETE(_req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Record the deletion intent in audit log BEFORE cascade
  await db.auditLog.create({
    data: { userId: user.id, action: 'data.delete', meta: JSON.stringify({ requestedAt: new Date().toISOString() }) },
  });

  // Cascade delete the user — all related rows (Account, Session, PatientProfile,
  // OutcomeEntry, AuditLog, Conversations → Messages → TriageEvent → Feedback) are
  // configured with onDelete: Cascade in the Prisma schema.
  await db.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true, deleted: true });
}

// Also support POST for clients that can't send DELETE
export async function POST(req: NextRequest) {
  return DELETE(req);
}
