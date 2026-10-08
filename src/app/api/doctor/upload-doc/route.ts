// SehatAI — Doctor/Patient identity separation
// POST /api/doctor/upload-doc (multipart/form-data: file, docType)
// Stores a verification document (PMDC card / CNIC / degree / experience letter) for the
// logged-in doctor. Files are saved to /public/uploads/doctor-docs/{userId}/... and a
// DoctorVerificationDoc row is created with status=pending.
//
// GET /api/doctor/upload-doc → returns the current doctor's uploaded docs.
//
// Files are NEVER served publicly browseable — they are read via /api/admin/doctor-doc/{id}
// (admin-only). We deliberately store them under /public so the dev server can find them
// for the admin preview; in production these would move to a private S3 bucket.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireDoctor } from '@/lib/auth';
import { getStorage } from '@/server/care/storage';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

const ALLOWED_DOC_TYPES = ['pmdc_card', 'cnic', 'degree', 'experience_letter'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

function validateMagicBytes(buf: Uint8Array, mime: string): boolean {
  if (buf.length < 12) return false;
  if (mime === 'image/jpeg') {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mime === 'image/png') {
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  }
  if (mime === 'application/pdf') {
    return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46; // %PDF
  }
  if (mime === 'image/webp') {
    const isRiff = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46; // RIFF
    const isWebp = buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50; // WEBP
    return isRiff && isWebp;
  }
  return false;
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireDoctor();
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file = formData.get('file');
  const docType = String(formData.get('docType') ?? '');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }
  if (!ALLOWED_DOC_TYPES.includes(docType)) {
    return NextResponse.json({ error: 'Invalid docType' }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 8 MB)' }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validateMagicBytes(bytes, file.type)) {
    return NextResponse.json({ error: 'File contents do not match declared file type' }, { status: 400 });
  }

  const profile = await db.doctorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
  }

  // Store encrypted file via Care Connect StorageProvider
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_').slice(-80);
  const rand = crypto.randomBytes(6).toString('hex');
  const storage = getStorage();
  const stored = await storage.put(`doctor-docs/${user.id}/${rand}-${safeName}`, Buffer.from(bytes), { kind: docType });
  const fileUrl = stored.storageKey;

  const doc = await db.doctorVerificationDoc.create({
    data: {
      doctorProfileId: profile.id,
      docType,
      fileName: file.name,
      fileUrl,
      mimeType: file.type,
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'doctor.doc.uploaded',
      resource: doc.id,
      meta: JSON.stringify({ docType, fileName: file.name }),
    },
  });

  return NextResponse.json({ ok: true, doc });
}

export async function GET() {
  let user;
  try {
    user = await requireDoctor();
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }
  const profile = await db.doctorProfile.findUnique({
    where: { userId: user.id },
    include: { verificationDocs: { orderBy: { uploadedAt: 'desc' } } },
  });
  if (!profile) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
  return NextResponse.json({
    docs: profile.verificationDocs.map((d) => ({
      id: d.id,
      docType: d.docType,
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      mimeType: d.mimeType,
      uploadedAt: d.uploadedAt.toISOString(),
      status: d.status,
      reviewedAt: d.reviewedAt?.toISOString() ?? null,
      notes: d.notes,
    })),
  });
}
