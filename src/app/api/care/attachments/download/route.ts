// Care Connect §38 — signed download. Verifies the HMAC grant issued
// by the attachment endpoint (authorization happened BEFORE signing).
import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/server/care/storage';
import { db } from '@/lib/db';
import { getCareSession } from '@/lib/care/care-auth';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key') ?? '';
  const expiresAt = Number(url.searchParams.get('expiresAt') ?? '0');
  const signature = url.searchParams.get('signature') ?? '';
  if (!key || !expiresAt || !signature) return NextResponse.json({ error: 'INVALID_GRANT' }, { status: 400 });

  const storage = getStorage();
  if (!storage.verifySignedRead(key, signature, expiresAt)) {
    return NextResponse.json({ error: 'GRANT_EXPIRED_OR_INVALID' }, { status: 403 });
  }
  // Defense in depth: the requester must still be an authenticated
  // participant of the consultation owning this storage key.
  const session = await getCareSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const keyMatch = key.match(/^care\/([^/]+)\//);
  const consultationId = keyMatch?.[1];
  if (consultationId) {
    const c = await db.consultation.findUnique({
      where: { id: consultationId },
      select: { patientId: true, doctorUserId: true },
    });
    if (!c || (c.patientId !== session.id && c.doctorUserId !== session.id)) {
      return NextResponse.json({ error: 'NOT_A_PARTICIPANT' }, { status: 403 });
    }
  }

  try {
    const data = await storage.get(key);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="secure-file"',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'OBJECT_NOT_FOUND' }, { status: 404 });
  }
}
