// Care Connect §39/§40/§41 — prescriptions (jurisdiction-gated).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authorizeConsultationAccess, CareAuthzError } from '@/lib/care/care-auth';
import {
  createPrescriptionDraft, signPrescription, cancelPrescription, PrescriptionError,
} from '@/server/care/prescription-service';
import { careFlag } from '@/lib/care/flags';
export const runtime = 'nodejs';

function err(e: unknown) {
  if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof PrescriptionError) return NextResponse.json({ error: e.code }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'prescription.view');
    const prescriptions = await db.prescription.findMany({
      where: { consultationId: id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ prescriptions });
  } catch (e) {
    return err(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await careFlag('CARE_PRESCRIPTIONS_ENABLED'))) {
      return NextResponse.json({ error: 'PRESCRIPTIONS_DISABLED_BY_FLAG' }, { status: 403 });
    }
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'prescription.sign');
    if (access.kind !== 'participant' || access.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'DOCTOR_ONLY' }, { status: 403 });
    }
    const body = await req.json();
    const items = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
    if (items.length === 0) return NextResponse.json({ error: 'ITEMS_REQUIRED' }, { status: 400 });

    const result = await createPrescriptionDraft({
      consultationId: id,
      doctorUserId: access.session.id,
      input: {
        consultationId: id,
        items: items.map((i: Record<string, unknown>) => ({
          medicine: String(i.medicine ?? '').slice(0, 200),
          form: i.form ? String(i.form) : undefined,
          strength: i.strength ? String(i.strength) : undefined,
          frequency: i.frequency ? String(i.frequency) : undefined,
          durationDays: i.durationDays != null ? Number(i.durationDays) : undefined,
          instructions: i.instructions ? String(i.instructions) : undefined,
        })),
        indication: body.indication ? String(body.indication) : undefined,
        instructions: body.instructions ? String(body.instructions) : undefined,
      },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return err(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await careFlag('CARE_PRESCRIPTIONS_ENABLED'))) {
      return NextResponse.json({ error: 'PRESCRIPTIONS_DISABLED_BY_FLAG' }, { status: 403 });
    }
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'prescription.sign');
    if (access.kind !== 'participant' || access.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'DOCTOR_ONLY' }, { status: 403 });
    }
    const body = await req.json();
    const action = String(body.action ?? 'sign');
    if (action === 'sign') {
      const signed = await signPrescription({
        prescriptionId: String(body.prescriptionId ?? ''),
        doctorUserId: access.session.id,
        overrideReason: body.overrideReason ? String(body.overrideReason) : undefined,
      });
      return NextResponse.json({ prescription: { id: signed.id, status: signed.status, issuedAt: signed.issuedAt } });
    }
    if (action === 'cancel') {
      const cancelled = await cancelPrescription({
        prescriptionId: String(body.prescriptionId ?? ''),
        doctorUserId: access.session.id,
      });
      return NextResponse.json({ prescription: { id: cancelled.id, status: cancelled.status } });
    }
    return NextResponse.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (e) {
    return err(e);
  }
}
