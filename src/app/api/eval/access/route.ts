// SehatAI — Phase 0 (W5 fix): Server-side dashboard access check.
// POST /api/eval/access -> 200 if the session user has role 'admin', else 403.
// Replaces the old client-side hardcoded 'banoqabil' passcode.
//
// To grant a user admin access: update their User.role to 'admin' in the DB.
// In dev, you can also set SEHATAI_DEV_ADMIN_EMAIL to auto-promote that email
// on first request (one-time bootstrap, then unset the env var).
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Dev bootstrap: auto-promote a configured admin email
  const devAdmin = process.env.SEHATAI_DEV_ADMIN_EMAIL;
  if (devAdmin && user.email.toLowerCase() === devAdmin.toLowerCase() && user.role !== 'admin') {
    await db.user.update({ where: { id: user.id }, data: { role: 'admin' } });
    await db.auditLog.create({
      data: { userId: user.id, action: 'role.promote', resource: 'admin', meta: JSON.stringify({ via: 'dev-bootstrap' }) },
    });
    return NextResponse.json({ ok: true, role: 'admin', promoted: true });
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  await db.auditLog.create({
    data: { userId: user.id, action: 'dashboard.access', resource: 'eval' },
  });
  return NextResponse.json({ ok: true, role: 'admin' });
}

export async function GET() {
  return POST();
}
