// SehatAI — Phase 2: Admin role assignment API
// POST /api/admin/promote { email, role } → updates user role
// Admin-only endpoint for assigning doctor/admin roles to users.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminUser = await db.user.findUnique({ where: { email } });
  if (!adminUser || adminUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  let body: { email?: unknown; role?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const targetEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = typeof body.role === 'string' ? body.role : '';

  if (!targetEmail) return NextResponse.json({ error: 'email is required' }, { status: 400 });
  if (!['user', 'doctor', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'role must be user | doctor | admin' }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { email: targetEmail } });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await db.user.update({
    where: { id: target.id },
    data: { role },
  });

  await db.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'admin.promote',
      resource: targetEmail,
      meta: JSON.stringify({ targetUserId: target.id, newRole: role }),
    },
  });

  return NextResponse.json({ ok: true, userEmail: targetEmail, role });
}
