// ============================================================
// Care Connect §21/§22/§23/§24/§61 — secure consultation messaging.
// Authorization on every request: authenticated user + participant
// membership + consultation state + role permission (§21). Never by
// consultation ID alone.
// Record integrity (§23/§24): corrections point at immutable
// originals; deletion is visibility-removal only; no hard delete.
// Contact leakage (§61): detect + flag for review, never hostile
// censorship.
// ============================================================
import { db } from '@/lib/db';
import { ConsultationError } from './consultation-service';
export { ConsultationError };
import { getRealtime } from './realtime';
import { notify } from './notifications';
import { auditCare } from './audit';

export interface MessagingWindow {
  open: boolean;
  readOnly: boolean;
  reason: string;
}

/** §22 — messaging window for TEXT consultations; media types allowed while active. */
export async function messagingWindowFor(consultationId: string): Promise<MessagingWindow & { consultation: { id: string; status: string; type: string; patientId: string; doctorUserId: string } }> {
  const c = await db.consultation.findUnique({ where: { id: consultationId } });
  if (!c) throw new ConsultationError('CONSULTATION_NOT_FOUND', 404);
  const now = Date.now();

  if (['COMPLETED', 'DOCTOR_DECLINED', 'PATIENT_CANCELLED', 'DOCTOR_CANCELLED', 'EXPIRED', 'REFUND_PENDING', 'REFUNDED', 'DISPUTED'].includes(c.status)) {
    // §22 follow-up grace: read-only window after completion.
    if (c.status === 'COMPLETED' && c.graceClosesAt && new Date(c.graceClosesAt).getTime() > now) {
      return { open: true, readOnly: true, reason: 'GRACE_READ_ONLY', consultation: c };
    }
    return { open: false, readOnly: true, reason: 'CONSULTATION_ENDED', consultation: c };
  }
  if (c.type === 'TEXT' && c.windowClosesAt && new Date(c.windowClosesAt).getTime() < now) {
    return { open: false, readOnly: true, reason: 'WINDOW_CLOSED', consultation: c };
  }
  if (!['PAID', 'REQUESTED', 'DOCTOR_ACCEPTED', 'SCHEDULED', 'WAITING', 'IN_PROGRESS'].includes(c.status)) {
    return { open: false, readOnly: true, reason: `STATE_${c.status}`, consultation: c };
  }
  return { open: true, readOnly: false, reason: 'OPEN', consultation: c };
}

const CONTACT_PATTERNS: Array<{ re: RegExp; label: string }> = [
  // NOTE: no /g flag — stateful lastIndex makes .test() alternate results.
  { re: /(\+?92|0)?[\s-]?3\d{2}[\s-]?\d{7}|\+?\d[\d\s-]{9,14}\d/, label: 'phone_number' },
  { re: /\b(whats\s?app|wa\.me|telegram|t\.me|signal|imo|skype)\b/i, label: 'messaging_app' },
  { re: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/, label: 'email' },
];

/** §61 — flag-only detection (never censor medical conversations). */
export function scanContactInfo(text: string): { flagged: boolean; reasons: string[] } {
  const reasons: string[] = [];
  for (const p of CONTACT_PATTERNS) {
    if (p.re.test(text)) reasons.push(p.label);
  }
  return { flagged: reasons.length > 0, reasons };
}

export async function sendMessage(opts: {
  consultationId: string;
  senderId: string;
  senderRole: 'PATIENT' | 'DOCTOR';
  body: string;
  language?: string;
  kind?: 'text' | 'voice' | 'correction';
  correctedById?: string;
  attachmentMeta?: { kind: 'document' | 'image' | 'voice'; fileName: string; mimeType: string; sizeBytes: number; storageKey: string; checksumSha256: string };
}) {
  const window = await messagingWindowFor(opts.consultationId);
  if (!window.open) throw new ConsultationError(`MESSAGING_CLOSED:${window.reason}`, 409);
  if (window.readOnly) throw new ConsultationError('MESSAGING_READ_ONLY', 403);

  const isParticipant =
    window.consultation.patientId === opts.senderId || window.consultation.doctorUserId === opts.senderId;
  if (!isParticipant) throw new ConsultationError('NOT_A_PARTICIPANT', 403);

  const body = opts.body.slice(0, 8000);
  const contact = scanContactInfo(body);

  const message = await db.consultationMessage.create({
    data: {
      consultationId: opts.consultationId,
      senderId: opts.senderId,
      senderRole: opts.senderRole,
      kind: opts.kind ?? 'text',
      body,
      language: opts.language ?? 'en',
      correctedById: opts.correctedById,
      flagged: contact.flagged,
      flaggedReason: contact.flagged ? contact.reasons.join(',') : null,
      attachments: opts.attachmentMeta
        ? {
            create: {
              consultationId: opts.consultationId,
              kind: opts.attachmentMeta.kind,
              fileName: opts.attachmentMeta.fileName,
              mimeType: opts.attachmentMeta.mimeType,
              sizeBytes: opts.attachmentMeta.sizeBytes,
              storageKey: opts.attachmentMeta.storageKey,
              checksumSha256: opts.attachmentMeta.checksumSha256,
              uploadedById: opts.senderId,
            },
          }
        : undefined,
    },
    include: { attachments: true },
  });

  if (contact.flagged) {
    await auditCare({
      actorId: opts.senderId, actorRole: opts.senderRole, action: 'message.contact_flagged',
      consultationId: opts.consultationId, detail: { reasons: contact.reasons },
    });
  }

  // §62 — notify the other participant (privacy-safe text).
  const recipientId =
    opts.senderRole === 'PATIENT' ? window.consultation.doctorUserId : window.consultation.patientId;
  await notify({ userId: recipientId, type: 'message.received', consultationId: opts.consultationId }).catch(() => undefined);

  await getRealtime().publish({
    kind: 'message',
    consultationId: opts.consultationId,
    data: { messageId: message.id, senderRole: opts.senderRole, kind: message.kind },
    at: message.createdAt.toISOString(),
  });

  return message;
}

/** §23 — correction: the original is immutable; a pointer is added. */
export async function correctMessage(opts: { messageId: string; senderId: string; newBody: string }) {
  const original = await db.consultationMessage.findUnique({ where: { id: opts.messageId } });
  if (!original) throw new ConsultationError('MESSAGE_NOT_FOUND', 404);
  if (original.senderId !== opts.senderId) throw new ConsultationError('ONLY_SENDER_CAN_CORRECT', 403);
  if (original.correctedById) throw new ConsultationError('ALREADY_CORRECTED', 409);

  const correction = await sendMessage({
    consultationId: original.consultationId,
    senderId: opts.senderId,
    senderRole: original.senderRole as 'PATIENT' | 'DOCTOR',
    body: opts.newBody,
    kind: 'correction',
  });
  await db.consultationMessage.update({
    where: { id: original.id },
    data: { correctedById: correction.id },
  });
  return correction;
}

/** §24 — visibility removal only; the record is retained for medical/legal retention. */
export async function hideMessageFromMe(opts: { messageId: string; userId: string; role: 'PATIENT' | 'DOCTOR' }) {
  const message = await db.consultationMessage.findUnique({ where: { id: opts.messageId } });
  if (!message) throw new ConsultationError('MESSAGE_NOT_FOUND', 404);
  const field = opts.role === 'PATIENT' ? { hiddenForPatient: true } : { hiddenForDoctor: true };
  await db.consultationMessage.update({ where: { id: opts.messageId }, data: field });
  await auditCare({
    actorId: opts.userId, actorRole: opts.role, action: 'message.hidden',
    consultationId: message.consultationId, detail: { messageId: message.id },
  });
}

export async function listMessages(opts: {
  consultationId: string;
  viewerRole: 'PATIENT' | 'DOCTOR' | 'STAFF';
  before?: string; // cursor (ISO)
  limit?: number;
}) {
  const hiddenField = opts.viewerRole === 'PATIENT' ? 'hiddenForPatient' : opts.viewerRole === 'DOCTOR' ? 'hiddenForDoctor' : null;
  const messages = await db.consultationMessage.findMany({
    where: {
      consultationId: opts.consultationId,
      ...(opts.before ? { createdAt: { lt: new Date(opts.before) } } : {}),
    },
    include: { attachments: true, sender: { select: { name: true } }, translations: true },
    orderBy: { createdAt: 'desc' },
    take: Math.min(100, opts.limit ?? 50),
  });
  return messages
    .filter((m) => (hiddenField ? !m[hiddenField] : true))
    .map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender?.name ?? 'System',
      senderRole: m.senderRole,
      kind: m.kind,
      body: m.body,
      language: m.language,
      flagged: m.flagged,
      correctedById: m.correctedById,
      deletedAt: m.deletedAt,
      attachments: m.attachments.map((a) => ({ id: a.id, kind: a.kind, fileName: a.fileName, mimeType: a.mimeType, sizeBytes: a.sizeBytes })),
      translations: m.translations.map((tr) => ({
        id: tr.id, translatedText: tr.translatedText, targetLanguage: tr.targetLanguage,
        needsConfirmation: tr.needsConfirmation, originalText: tr.originalText,
      })),
      createdAt: m.createdAt,
    }))
    .reverse();
}

export async function markRead(opts: { consultationId: string; userId: string }) {
  await db.consultationParticipant.updateMany({
    where: { consultationId: opts.consultationId, userId: opts.userId },
    data: { lastReadAt: new Date() },
  });
  await getRealtime().publish({ kind: 'read', consultationId: opts.consultationId, data: { userId: opts.userId }, at: new Date().toISOString() });
}

export async function unreadCount(opts: { consultationId: string; userId: string }): Promise<number> {
  const me = await db.consultationParticipant.findUnique({
    where: { consultationId_userId: { consultationId: opts.consultationId, userId: opts.userId } },
    select: { lastReadAt: true },
  });
  const since = me?.lastReadAt ?? new Date(0);
  return db.consultationMessage.count({
    where: {
      consultationId: opts.consultationId,
      senderId: { not: opts.userId },
      createdAt: { gt: since },
      deletedAt: null,
    },
  });
}

export async function publishTyping(opts: { consultationId: string; userId: string; role: string }) {
  await getRealtime().publish({ kind: 'typing', consultationId: opts.consultationId, data: { userId: opts.userId, role: opts.role }, at: new Date().toISOString() });
}
