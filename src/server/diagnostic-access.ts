import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

/** Diagnostics are disabled by default, including in production, and require a fresh admin check. */
export async function diagnosticAccess(action: string): Promise<NextResponse | null> {
  if (process.env.ENABLE_INTERNAL_DIAGNOSTICS !== 'true') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const actor = await requireAdmin();
    await db.auditLog.create({ data: { userId: actor.id, action: `diagnostics.${action}`, resource: 'internal' } });
    return null;
  } catch (error) {
    const status = (error as { status?: number }).status;
    return NextResponse.json({ error: 'Diagnostics unavailable' }, { status: status === 401 || status === 403 ? status : 503 });
  }
}
