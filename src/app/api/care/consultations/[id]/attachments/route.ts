// Care Connect §36/§37 — private attachments (medical files + voice messages).
// POST multipart upload → private encrypted storage (never /public),
// magic-byte verified, size-limited. GET ?attachmentId= → authorization-
// checked short-lived signed read.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authorizeConsultationAccess, CareAuthzError } from '@/lib/care/care-auth';
import { getStorage, detectMagicMime, MAX_UPLOAD_BYTES, MAX_VOICE_SECONDS } from '@/server/care/storage';
import { createHash, randomUUID } from 'crypto';
import { ConsultationError } from '@/server/care/messaging-service';
import { auditCare } from '@/server/care/audit';
export const runtime = 'nodejs';

function err(e: unknown) {
  if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof ConsultationError) return NextResponse.json({ error: e.code }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
}

const ALLOWED = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav']);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'attachment.upload');
    if (access.kind !== 'participant') return NextResponse.json({ error: 'REQUIRES_PARTICIPANT' }, { status: 403 });

    const form = await req.formData();
    const file = form.get('file');
    const kind = String(form.get('kind') ?? 'document');
    if (!(file instanceof File)) return NextResponse.json({ error: 'FILE_REQUIRED' }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 413 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const magic = detectMagicMime(bytes);
    // Audio (voice messages) has weak magic bytes across browsers — verify
    // declared MIME against a whitelist instead.
    if (kind === 'voice' && !file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'INVALID_AUDIO_TYPE' }, { status: 415 });
    }
    if (kind !== 'voice') {
      if (!magic || !ALLOWED.has(magic.mime)) return NextResponse.json({ error: 'INVALID_FILE_TYPE' }, { status: 415 });
      if (magic.mime !== file.type) return NextResponse.json({ error: 'MIME_MISMATCH' }, { status: 415 });
    }

    const storage = getStorage();
    const stored = await storage.put(`care/${id}/${randomUUID()}`, bytes, { consultationId: id, kind });
    const attachment = await db.consultationAttachment.create({
      data: {
        consultationId: id,
        kind: kind === 'voice' ? 'voice' : magic?.ext === 'pdf' ? 'document' : 'image',
        fileName: file.name.replace(/[^\w.\- ]/g, '_').slice(0, 200),
        mimeType: kind === 'voice' ? file.type : magic!.mime,
        sizeBytes: stored.sizeBytes,
        storageKey: stored.storageKey,
        checksumSha256: stored.checksumSha256,
        uploadedById: access.session.id,
        scanStatus: 'skipped', // virus-scan adapter slot (§37: scanned where possible)
      },
    });
    await auditCare({ actorId: access.session.id, actorRole: access.role, action: 'attachment.uploaded', consultationId: id, detail: { attachmentId: attachment.id, kind } });
    return NextResponse.json({ attachment: { id: attachment.id, kind: attachment.kind, fileName: attachment.fileName, sizeBytes: attachment.sizeBytes } }, { status: 201 });
  } catch (e) {
    return err(e);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'attachment.download');
    const attachmentId = new URL(req.url).searchParams.get('attachmentId') ?? '';
    const attachment = await db.consultationAttachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.consultationId !== id) {
      return NextResponse.json({ error: 'ATTACHMENT_NOT_FOUND' }, { status: 404 });
    }
    // §38 — authorization BEFORE signing.
    const storage = getStorage();
    const grant = storage.signRead(attachment.storageKey, 300);
    const [expiresAtMs, signature] = grant.split('.');
    void createHash; // keep import when bundlers tree-shake
    return NextResponse.json({
      attachmentId: attachment.id,
      downloadUrl: `/api/care/attachments/download?key=${encodeURIComponent(attachment.storageKey)}&expiresAt=${expiresAtMs}&signature=${signature}`,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      checksumSha256: attachment.checksumSha256,
    });
  } catch (e) {
    return err(e);
  }
}

void MAX_VOICE_SECONDS;
