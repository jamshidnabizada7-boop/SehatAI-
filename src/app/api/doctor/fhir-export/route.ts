// SehatAI — Doctor Portal: FHIR Bundle export for a patient
// GET /api/doctor/fhir-export?patientId=... → returns a FHIR R4 Bundle (Patient + Condition + MedicationStatement resources)
// Generated from the patient's PatientProfile + conversations (consent-gated).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireDoctor } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  let user;
  try { user = await requireDoctor(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  const url = new URL(req.url);
  const patientId = url.searchParams.get('patientId');
  if (!patientId) {
    return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
  }
  const patientUser = await db.user.findUnique({
    where: { id: patientId },
    select: { id: true, name: true, email: true, consentAt: true },
  });
  if (!patientUser) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  const profile = await db.patientProfile.findUnique({ where: { userId: patientId } });
  const conversations = await db.conversation.findMany({
    where: { userId: patientId },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
    orderBy: { startedAt: 'desc' },
    take: 5,
  });

  const parseArr = (s: string | null): string[] => {
    if (!s) return [];
    try { const p = JSON.parse(s); return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : []; } catch { return []; }
  };

  const conditions = parseArr(profile?.conditions ?? null);
  const medications = parseArr(profile?.medications ?? null);
  const allergies = parseArr(profile?.allergies ?? null);

  const fhirBundle = {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: [
      {
        fullUrl: `urn:uuid:${patientId}`,
        resource: {
          resourceType: 'Patient',
          id: patientId,
          name: [{ text: patientUser.name ?? 'Unknown' }],
          telecom: [{ system: 'email', value: patientUser.email }],
          extension: [
            { url: 'https://sehatai.pk/fhir/extension/consentAt', valueDateTime: patientUser.consentAt?.toISOString() },
          ],
        },
      },
      ...conditions.map((c, i) => ({
        fullUrl: `urn:uuid:condition-${i}`,
        resource: {
          resourceType: 'Condition',
          id: `condition-${i}`,
          subject: { reference: `Patient/${patientId}` },
          clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
          code: { text: c },
        },
      })),
      ...medications.map((m, i) => ({
        fullUrl: `urn:uuid:med-${i}`,
        resource: {
          resourceType: 'MedicationStatement',
          id: `med-${i}`,
          subject: { reference: `Patient/${patientId}` },
          status: 'active',
          medicationCodeableConcept: { text: m },
        },
      })),
      ...allergies.map((a, i) => ({
        fullUrl: `urn:uuid:allergy-${i}`,
        resource: {
          resourceType: 'AllergyIntolerance',
          id: `allergy-${i}`,
          patient: { reference: `Patient/${patientId}` },
          code: { text: a },
        },
      })),
      ...conversations.map((conv, i) => ({
        fullUrl: `urn:uuid:encounter-${i}`,
        resource: {
          resourceType: 'Encounter',
          id: `encounter-${i}`,
          status: 'finished',
          class: { system: 'https://sehatai.pk/fhir/encounter-class', code: 'ai-chat', display: 'SehatAI chat consultation' },
          subject: { reference: `Patient/${patientId}` },
          period: { start: conv.startedAt.toISOString(), end: conv.updatedAt.toISOString() },
          reason: conv.messages.find((m) => m.role === 'user') ? [{ text: conv.messages.find((m) => m.role === 'user')!.content.slice(0, 200) }] : [],
        },
      })),
    ],
  };

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'doctor.fhir.export',
      resource: patientId,
      meta: JSON.stringify({ resourceCount: fhirBundle.entry.length }),
    },
  });

  return NextResponse.json(fhirBundle);
}
