// Care Connect §34/§35 — translate a consultation message.
import { NextRequest, NextResponse } from 'next/server';
import { authorizeConsultationAccess, CareAuthzError } from '@/lib/care/care-auth';
import { translateMessage, confirmTranslation } from '@/server/care/translation-service';
import { ConsultationError } from '@/server/care/messaging-service';
import { rateLimit, RATE_LIMITS } from '@/lib/care/rate-limit';
import { careFlag } from '@/lib/care/flags';
export const runtime = 'nodejs';

const LANGS = new Set(['en', 'ur', 'roman', 'ps', 'fa']);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await careFlag('CARE_TRANSLATION_ENABLED'))) {
      return NextResponse.json({ error: 'CARE_DISABLED' }, { status: 404 });
    }
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'consultation.view');
    if (access.kind !== 'participant') return NextResponse.json({ error: 'REQUIRES_PARTICIPANT' }, { status: 403 });
    const rl = await rateLimit(`care-tr:${access.session.id}`, RATE_LIMITS.translation.limit, RATE_LIMITS.translation.windowSeconds);
    if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

    const body = await req.json();
    const messageId = String(body.messageId ?? '');
    const targetLanguage = String(body.targetLanguage ?? 'en');
    if (!LANGS.has(targetLanguage)) return NextResponse.json({ error: 'INVALID_LANGUAGE' }, { status: 400 });

    const { translation, cached } = await translateMessage({
      messageId,
      requesterId: access.session.id,
      targetLanguage: targetLanguage as 'en' | 'ur' | 'roman' | 'ps' | 'fa',
    });
    return NextResponse.json({
      translation: {
        id: translation.id,
        originalText: translation.originalText, // §34 — original always viewable
        translatedText: translation.translatedText,
        targetLanguage: translation.targetLanguage,
        needsConfirmation: translation.needsConfirmation, // §35
        riskTerms: JSON.parse(translation.riskTermsJson ?? '[]'),
        confirmed: translation.confirmedById != null,
      },
      cached,
    });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof ConsultationError) return NextResponse.json({ error: e.code }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'translation.confirm');
    if (access.kind !== 'participant') return NextResponse.json({ error: 'REQUIRES_PARTICIPANT' }, { status: 403 });
    const body = await req.json();
    const updated = await confirmTranslation({ translationId: String(body.translationId ?? ''), confirmerId: access.session.id });
    return NextResponse.json({ ok: true, confirmedAt: updated.confirmedAt });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}
