// Care Connect §55 — TOTP enrollment + disable (2FA for privileged roles).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCareSession, CareAuthzError } from '@/lib/care/care-auth';
import { generateTotpSecret, otpauthUrl, verifyTotp } from '@/lib/care/totp';
import { auditCare } from '@/server/care/audit';
export const runtime = 'nodejs';

const PRIVILEGED = new Set(['doctor', 'admin', 'finance', 'support', 'clinical_admin', 'super_admin']);

export async function POST(req: NextRequest) {
  try {
    const session = await requireCareSession();
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? 'setup');

    if (action === 'setup') {
      if (!PRIVILEGED.has(session.role)) {
        return NextResponse.json({ error: '2FA_NOT_REQUIRED_FOR_ROLE' }, { status: 403 });
      }
      const secret = generateTotpSecret();
      // Store immediately but disabled until verified (enrollment window).
      await db.user.update({ where: { id: session.id }, data: { totpSecret: secret, totpEnabledAt: null } });
      return NextResponse.json({ otpauthUrl: otpauthUrl(secret, session.email) });
    }

    if (action === 'verify') {
      const user = await db.user.findUnique({ where: { id: session.id }, select: { totpSecret: true } });
      if (!user?.totpSecret) {
        return NextResponse.json({ error: 'NO_PENDING_SECRET' }, { status: 400 });
      }
      if (!verifyTotp(user.totpSecret!, String(body.code ?? ''))) {
        return NextResponse.json({ error: 'INVALID_CODE' }, { status: 400 });
      }
      await db.user.update({ where: { id: session.id }, data: { totpEnabledAt: new Date() } });
      await auditCare({ actorId: session.id, actorRole: session.role, action: 'totp.enabled' });
      return NextResponse.json({ ok: true });
    }

    if (action === 'disable') {
      // Disabling requires a valid current code (step-down auth, §54).
      const user = await db.user.findUnique({ where: { id: session.id }, select: { totpSecret: true, totpEnabledAt: true } });
      if (user?.totpEnabledAt && user.totpSecret && !verifyTotp(user.totpSecret, String(body.code ?? ''))) {
        return NextResponse.json({ error: 'INVALID_CODE' }, { status: 400 });
      }
      await db.user.update({ where: { id: session.id }, data: { totpSecret: null, totpEnabledAt: null } });
      await auditCare({ actorId: session.id, actorRole: session.role, action: 'totp.disabled' });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}
