// SehatAI — Admin: serve a verification document (admin-only)
// GET /api/admin/doctor-doc?id={docId} → returns the file bytes (image or PDF).
// Admin-only — never exposed publicly. The fileUrl stored on the doc is internal.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
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

  // The fileUrl is a relative path like /uploads/doctor-docs/{userId}/...-{filename}
  // We map it to the absolute path on disk
  const absPath = path.join(process.cwd(), 'public', doc.fileUrl);
  try {
    const buf = await fs.readFile(absPath);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': doc.mimeType,
        'Content-Disposition': `inline; filename="${doc.fileName}"`,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
  }
}
