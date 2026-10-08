// SehatAI — Admin: serve a verification document (admin-only)
// GET /api/admin/doctor-doc?id={docId} → returns the file bytes (image or PDF).
// Admin-only — never exposed publicly. The fileUrl stored on the doc is internal.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getStorage } from '@/server/care/storage';
import path from 'node:path';
import { promises as fs } from 'node:fs';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try { await requireAdmin(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: (e as { status?: number }).status ?? 401 });
  }
  const url = new URL(req.url);
  const docId = url.searchParams.get('id');
  if (!docId) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const doc = await db.doctorVerificationDoc.findUnique({ where: { id: docId } });
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  let buf: Buffer;
  try {
    const storage = getStorage();
    if (!doc.fileUrl.startsWith('/')) {
      buf = await storage.get(doc.fileUrl);
    } else {
      // Legacy disk fallback
      const absPath = doc.fileUrl.startsWith('/uploads/')
        ? path.join(process.cwd(), 'public', doc.fileUrl)
        : path.join(process.cwd(), doc.fileUrl.replace(/^\//, ''));
      try {
        buf = await fs.readFile(absPath);
      } catch {
        buf = await storage.get(doc.fileUrl.replace(/^\//, ''));
      }
    }
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': doc.mimeType,
        'Content-Disposition': `inline; filename="${doc.fileName}"`,
        'Cache-Control': 'private, no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found on disk or storage' }, { status: 404 });
  }
}
