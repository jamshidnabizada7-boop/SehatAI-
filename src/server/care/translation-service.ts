// ============================================================
// Care Connect §34/§35 — translation with original ALWAYS preserved.
// Every translated clinical message stores originalText,
// originalLanguage, translatedText, targetLanguage, provider,
// model/version, timestamp (§34). High-risk terms (medicine names,
// doses, allergies, pregnancy, blood type, lab values, units,
// durations) require recipient confirmation (§35): "15 mg" must
// never silently become "50 mg".
// ============================================================
import { db } from '@/lib/db';
import { llmJSON } from '@/server/llm';
import { ConsultationError } from './consultation-service';

export const TRANSLATION_PROVIDER = process.env.CARE_TRANSLATION_PROVIDER ?? 'sehatai-llm';

const TRANSLATE_SYSTEM = `You are a medical message translator. Translate the user's message EXACTLY — preserve all medicine names, dose numbers, units, durations and lab values verbatim. If the message contains a number followed by a unit (e.g. "15 mg", "2 times a day"), copy the number and unit EXACTLY into the translation. Return ONLY the translated text, no explanations.`;

/** §35 — high-risk terms that require confirmation after translation. */
const RISK_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: 'dose_value', re: /\b\d+(?:\.\d+)?\s*(mg|ml|mcg|g|iu|units?|tablets?|drops?)\b/i },
  { label: 'frequency', re: /\b(\d+\s*(times|x)\s*(a|per)?\s*day|daily|twice|thrice|every\s+\d+\s*hours?)\b/i },
  { label: 'duration', re: /\b\d+\s*(day|days|week|weeks|month|months)\b/i },
  { label: 'medicine_name', re: /\b(warfarin|insulin|metformin|amoxicillin|paracetamol|ibuprofen|aspirin|prednisone|aspirin|glibenclamide|amlodipine|lisinopril|atorvastatin|omeprazole|azithromycin|ciprofloxacin)\b/i },
  { label: 'allergy', re: /\b(allerg\w*|anaphyla\w*|reaction to)\b/i },
  { label: 'pregnancy', re: /\b(pregnan\w*|haamla|حاملہ)\b/i },
  { label: 'lab_value', re: /\b\d+(?:\.\d+)?\s*(mmol|mg\/dl|%|mmhg|bpm)\b/i },
  { label: 'blood_type', re: /\b(blood type|blood group)\s*[abo+-]{1,3}\b/i },
];

export function scanRiskTerms(text: string): string[] {
  return RISK_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.label);
}

export async function translateMessage(opts: {
  messageId: string;
  requesterId: string;
  targetLanguage: 'en' | 'ur' | 'roman' | 'ps' | 'fa';
}) {
  const message = await db.consultationMessage.findUnique({
    where: { id: opts.messageId },
    include: { consultation: { select: { patientId: true, doctorUserId: true } } },
  });
  if (!message) throw new ConsultationError('MESSAGE_NOT_FOUND', 404);
  const c = message.consultation;
  if (c.patientId !== opts.requesterId && c.doctorUserId !== opts.requesterId) {
    throw new ConsultationError('NOT_A_PARTICIPANT', 403);
  }
  if (message.body.trim().length === 0) throw new ConsultationError('EMPTY_MESSAGE');

  const existing = await db.translation.findFirst({
    where: { messageId: message.id, targetLanguage: opts.targetLanguage },
  });
  if (existing) return { translation: existing, cached: true };

  // Primary: in-process LLM cascade (degrades to error without keys —
  // caller surfaces a message, never a silent bad translation).
  const translated = await llmJSON<{ translation?: string }>(
    TRANSLATE_SYSTEM,
    JSON.stringify({
      sourceLanguage: message.language,
      targetLanguage: opts.targetLanguage,
      message: message.body,
    }),
  );
  const text = typeof translated?.translation === 'string' ? translated.translation.trim() : null;
  if (!text) throw new ConsultationError('TRANSLATION_UNAVAILABLE', 503);

  const riskTerms = scanRiskTerms(message.body);
  const translation = await db.translation.create({
    data: {
      messageId: message.id,
      consultationId: message.consultationId,
      originalText: message.body, // §34 — original NEVER overwritten/lost
      originalLanguage: message.language,
      translatedText: text,
      targetLanguage: opts.targetLanguage,
      provider: TRANSLATION_PROVIDER,
      modelVersion: 'cascade-v1',
      needsConfirmation: riskTerms.length > 0, // §35
      riskTermsJson: JSON.stringify(riskTerms),
    },
  });
  return { translation, cached: false };
}

/** §35 — recipient confirms risky translations. */
export async function confirmTranslation(opts: { translationId: string; confirmerId: string }) {
  const translation = await db.translation.findUnique({ where: { id: opts.translationId } });
  if (!translation) throw new ConsultationError('TRANSLATION_NOT_FOUND', 404);
  return db.translation.update({
    where: { id: opts.translationId },
    data: { confirmedById: opts.confirmerId, confirmedAt: new Date() },
  });
}
