// Care Connect §62 — notifications: list + mark read. Texts are
// privacy-safe by construction (see notifications service).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCareSession, CareAuthzError } from '@/lib/care/care-auth';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await requireCareSession();
    const unreadOnly = new URL(req.url).searchParams.get('unread') === 'true';
    const notifications = await db.notification.findMany({
      where: { userId: session.id, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unread = await db.notification.count({ where: { userId: session.id, readAt: null } });
    return NextResponse.json({ notifications, unread });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireCareSession();
    const body = await req.json().catch(() => ({}));
    if (body.id) {
      await db.notification.updateMany({
        where: { id: String(body.id), userId: session.id },
        data: { readAt: new Date(), state: 'READ' },
      });
    } else {
      await db.notification.updateMany({
        where: { userId: session.id, readAt: null },
        data: { readAt: new Date(), state: 'READ' },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}
