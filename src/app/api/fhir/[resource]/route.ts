// SehatAI — Phase 3: FHIR R4 API endpoint
// GET /api/fhir/[resource]/{id} → FHIR resources
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const resourceType = segments[segments.length - 2];
  const resourceId = segments[segments.length - 1];

  if (resourceType === 'Patient') {
    return getPatient(resourceId);
  } else if (resourceType === 'Observation') {
    return getObservations(url.searchParams.get('patient'));
  } else if (resourceType === 'Bundle') {
    return getBundle(resourceId);
  }

  return NextResponse.json({
    resourceType: 'CapabilityStatement',
    status: 'active',
    software: { name: 'SehatAI', version: '2.0' },
    fhirVersion: '4.0',
    format: ['json'],
    rest: [{ mode: 'read', resource: ['Patient', 'Observation', 'Bundle'] }],
  }, { headers: { 'Content-Type': 'application/fhir+json' } });
}

async function getPatient(id: string) {
  if (!id) return NextResponse.json({ error: 'Patient ID required' }, { status: 400 });
  const profile = await db.patientProfile.findUnique({ where: { userId: id } });
  if (!profile) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  const parseArr = (s: string | null) => { if (!s) return []; try { const p = JSON.parse(s); return Array.isArray(p) ? p : []; } catch { return []; } };
  return NextResponse.json({
    resourceType: 'Patient', id, active: true,
    gender: profile.sex === 'female' ? 'female' : profile.sex === 'male' ? 'male' : 'unknown',
    extension: [
      ...(profile.ageBand && profile.ageBand !== 'undisclosed' ? [{ url: 'http://sehatai.pk/fhir/StructureDefinition/age-band', valueString: profile.ageBand }] : []),
      ...(parseArr(profile.conditions).length ? [{ url: 'http://sehatai.pk/fhir/StructureDefinition/conditions', valueString: parseArr(profile.conditions).join(', ') }] : []),
      ...(parseArr(profile.allergies).length ? [{ url: 'http://sehatai.pk/fhir/StructureDefinition/allergies', valueString: parseArr(profile.allergies).join(', ') }] : []),
      ...(profile.pregnant ? [{ url: 'http://sehatai.pk/fhir/StructureDefinition/pregnant', valueBoolean: true }] : []),
    ],
  }, { headers: { 'Content-Type': 'application/fhir+json' } });
}

async function getObservations(patientId: string | null) {
  if (!patientId) return NextResponse.json({ error: 'patient parameter required' }, { status: 400 });
  const conversations = await db.conversation.findMany({ where: { userId: patientId }, include: { messages: { where: { role: 'assistant' }, take: 10 } } });
  const observations = conversations.flatMap((conv) => conv.messages.filter((m) => m.triageLevel).map((m) => ({
    resourceType: 'Observation', id: m.id, status: 'final',
    code: { text: `Triage: ${m.triageLevel}` },
    effectiveDateTime: m.createdAt.toISOString(),
    valueString: m.content.slice(0, 200),
  })));
  return NextResponse.json({ resourceType: 'Bundle', type: 'searchset', total: observations.length, entry: observations.map((obs) => ({ resource: obs })) }, { headers: { 'Content-Type': 'application/fhir+json' } });
}

async function getBundle(conversationId: string) {
  if (!conversationId) return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
  const conversation = await db.conversation.findUnique({ where: { id: conversationId }, include: { messages: true } });
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    resourceType: 'Bundle', type: 'document', id: conversationId, timestamp: new Date().toISOString(),
    entry: conversation.messages.map((m) => ({
      resource: {
        resourceType: 'DocumentReference', id: m.id, status: 'current',
        type: { text: m.role === 'user' ? 'Patient message' : 'SehatAI response' },
        content: [{ attachment: { data: Buffer.from(m.content).toString('base64'), contentType: 'text/plain' } }],
        created: m.createdAt.toISOString(),
      },
    })),
  }, { headers: { 'Content-Type': 'application/fhir+json' } });
}
