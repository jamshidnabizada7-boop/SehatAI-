// Care Connect §19 — AI doctor matching, integrated with existing triage.
// Flow: patient text → EXISTING L0 safety engine FIRST → emergency? YES:
// return emergency instructions, NO paid funnel (§85/§86). NO: deterministic
// specialty classifier → ranked eligible verified doctors (§20 ranking).
// The AI recommends a SPECIALTY — never "Dr X is medically guaranteed".
import { NextRequest, NextResponse } from 'next/server';
import { runL0Triage, matchRedFlags } from '@/lib/engine/safety-engine';
import { classifyFromPipelineSignals } from '@/lib/care/specialties';
import { listMarketplaceDoctors } from '@/server/care/marketplace';
import { getCareSession } from '@/lib/care/care-auth';
import { rateLimit, clientIpFrom, RATE_LIMITS } from '@/lib/care/rate-limit';
import { getEmergencyNumbers } from '@/data/lexicon';
export const runtime = 'nodejs';

const afLocationRegex = /(?:^|[^\p{L}\p{N}])(afghanistan|kabul|herat|kandahar|mazar|jalalabad|افغانستان|کابل|هرات|ہرات|قندھار|قندهار|مزار|جلال\s*آباد|جلال\s*اباد)(?:$|[^\p{L}\p{N}])/iu;
const afRegionRegex = /(?:^|[^\p{L}\p{N}])(kabul|herat|kandahar|mazar|jalalabad|کابل|هرات|ہرات|قندھار|قندهار|مزار|جلال\s*آباد|جلال\s*اباد)(?:$|[^\p{L}\p{N}])/iu;

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`care-match:${clientIpFrom(req)}`, RATE_LIMITS.aiEndpoints.limit, RATE_LIMITS.aiEndpoints.windowSeconds);
  if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

  let body: { text?: string; consultationType?: string; country?: string; city?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
  }
  const text = String(body.text ?? '').slice(0, 4000).trim();
  if (!text) return NextResponse.json({ error: 'TEXT_REQUIRED' }, { status: 400 });

  // Declared physical location takes strict precedence for emergency guidance and jurisdiction decisions (§17)
  const declaredCountry = body.country && typeof body.country === 'string' ? body.country.trim().toUpperCase() : null;
  const declaredCity = body.city && typeof body.city === 'string' ? body.city.trim() : null;
  const resolvedCountry = declaredCountry ?? (afLocationRegex.test(text) ? 'AF' : 'PK');
  const resolvedRegion = declaredCity ?? (text.match(afRegionRegex)?.[1] ?? undefined);

  // §85/§86 — existing deterministic emergency detection runs FIRST and is
  // upstream of any commercial surface. Never "pay $10 to speak with doctor"
  // after an emergency is detected.
  const l0 = runL0Triage(text);
  const redFlags = matchRedFlags(text);
  if (l0.level === 'EMERGENCY') {
    const emergencyNumbers = getEmergencyNumbers(resolvedCountry, resolvedRegion);

    return NextResponse.json({
      emergency: true,
      triage: { level: l0.level, reason: l0.reason, signals: redFlags.map((r) => r.pattern.category) },
      emergencyNumbers,
      message: 'Emergency detected — call emergency services now. No booking required.',
    });
  }

  // Deterministic specialty classification over the intake text + L0 signals.
  const matches = classifyFromPipelineSignals({
    intakeText: text,
    redFlagCategories: redFlags.map((r) => r.pattern.category),
  });

  const session = await getCareSession();
  const type = (body.consultationType ?? 'VIDEO').toUpperCase();
  const validType = ['TEXT', 'AUDIO', 'VIDEO'].includes(type) ? type : 'VIDEO';

  // Eligible doctors for the top specialty (with fallback to Family Medicine).
  const top = matches[0];
  let doctors = await listMarketplaceDoctors({
    specialty: top.specialty,
    consultationType: validType as 'TEXT' | 'AUDIO' | 'VIDEO',
    patientId: session?.id ?? null,
    country: declaredCountry ?? undefined,
  });
  if (doctors.length === 0 && top.specialty !== 'Family Medicine') {
    doctors = await listMarketplaceDoctors({
      consultationType: validType as 'TEXT' | 'AUDIO' | 'VIDEO',
      patientId: session?.id ?? null,
      country: declaredCountry ?? undefined,
    });
  }

  return NextResponse.json({
    emergency: false,
    triage: { level: l0.level, reason: l0.reason },
    suggestedSpecialty: top.specialty,
    specialtyMatches: matches.slice(0, 3).map((m) => ({ specialty: m.specialty, score: m.score })),
    matchedTerms: top.matchedTerms,
    doctors: doctors.slice(0, 10),
    disclaimer:
      'SehatAI suggests a care category based on what you described. It does not diagnose or guarantee any doctor is the best choice for you.',
  });
}
