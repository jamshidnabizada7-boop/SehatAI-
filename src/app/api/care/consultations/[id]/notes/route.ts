// Care Connect §42 — clinical notes. PRIVATE notes are doctor-only;
// PATIENT_SUMMARY notes visible to the patient. AI-assisted drafts
// keep provenance.
import { NextRequest, NextResponse } from 'next/server';
import { authorizeConsultationAccess, CareAuthzError } from '@/lib/care/care-auth';
import { db } from '@/lib/db';
import { ConsultationError } from '@/server/care/messaging-service';
export const runtime = 'nodejs';

const NOTE_TYPES = new Set(['SOAP', 'SUMMARY', 'ASSESSMENT', 'FOLLOW_UP', 'REFERRAL']);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'consultation.view');
    const isPatient = access.kind === 'participant' && access.role === 'PATIENT';
    const notes = await db.clinicalNote.findMany({
      where: { consultationId: id, ...(isPatient ? { visibility: 'PATIENT_SUMMARY' } : {}) },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ notes });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'note.write');
    if (access.kind !== 'participant' || access.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'DOCTOR_ONLY' }, { status: 403 });
    }
    const body = await req.json();
    const type = String(body.type ?? 'SOAP').toUpperCase();
    const visibility = String(body.visibility ?? 'PRIVATE_NOTE').toUpperCase();
    if (!NOTE_TYPES.has(type) || !['PRIVATE_NOTE', 'PATIENT_SUMMARY'].includes(visibility)) {
      return NextResponse.json({ error: 'INVALID_NOTE_FIELDS' }, { status: 400 });
    }
    if (!body.content?.trim()) return NextResponse.json({ error: 'CONTENT_REQUIRED' }, { status: 400 });

    const note = await db.clinicalNote.create({
      data: {
        consultationId: id,
        type,
        visibility,
        content: String(body.content).slice(0, 20000),
        authoredById: access.session.id,
        aiAssisted: body.aiAssisted === true,
        aiProvenanceJson: body.aiProvenance ? JSON.stringify(body.aiProvenance) : undefined,
      },
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof ConsultationError) return NextResponse.json({ error: e.code }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}
