// Care Connect — consultation detail + actions.
// Authorization: participant membership (or audited staff viewAny) —
// never by consultation ID alone (§21/§53).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authorizeConsultationAccess, CareAuthzError } from '@/lib/care/care-auth';
import {
  doctorAccept, doctorDecline, startConsultation, completeConsultation, cancelConsultation, ConsultationError,
} from '@/server/care/consultation-service';
import { auditCare } from '@/server/care/audit';
export const runtime = 'nodejs';

function err(e: unknown) {
  if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof ConsultationError) return NextResponse.json({ error: e.code }, { status: e.status });
  const msg = e instanceof Error ? e.message : 'ERROR';
  const status = msg === 'ILLEGAL_TRANSITION' ? 409 : 500;
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'consultation.view');
    const c = await db.consultation.findUnique({
      where: { id },
      include: {
        doctorProfile: { include: { user: { select: { name: true } } } },
        patient: { select: { name: true } },
        service: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 5 },
        handoff: true,
        notes: access.kind === 'participant' && access.role === 'PATIENT'
          ? { where: { visibility: 'PATIENT_SUMMARY' } }
          : true,
        prescriptions: { include: { items: true } },
        calls: { orderBy: { createdAt: 'desc' }, take: 5 },
        statusEvents: { orderBy: { createdAt: 'asc' } },
        reviews: true,
      },
    });
    if (!c) return NextResponse.json({ error: 'CONSULTATION_NOT_FOUND' }, { status: 404 });

    const isPatient = access.kind === 'participant' && access.role === 'PATIENT';
    const isDoctor = access.kind === 'participant' && access.role === 'DOCTOR';

    if (access.kind === 'staff') {
      await auditCare({ actorId: access.session.id, actorRole: access.session.role, action: 'consultation.staff_view', consultationId: id });
    }

    return NextResponse.json({
      consultation: {
        id: c.id,
        type: c.type,
        status: c.status,
        priceMinor: c.priceMinor,
        currency: c.currency,
        scheduledAt: c.scheduledAt,
        windowOpensAt: c.windowOpensAt,
        windowClosesAt: c.windowClosesAt,
        graceClosesAt: c.graceClosesAt,
        patientCountry: c.patientCountry,
        jurisdictionKey: c.jurisdictionKey,
        instant: c.instant,
        createdAt: c.createdAt,
        doctor: { id: c.doctorProfileId, name: c.doctorProfile.user.name, specialty: c.doctorProfile.specialty, userId: c.doctorUserId },
        patient: { id: c.patientId, name: c.patient.name },
        service: c.service,
        payment: c.payments[0] ? { id: c.payments[0].id, status: c.payments[0].status, amountMinor: c.payments[0].amountMinor, currency: c.payments[0].currency, provider: c.payments[0].provider } : null,
        handoff: c.handoff ? {
          status: c.handoff.status,
          // Patient never sees the raw AI handoff; doctor does (§31)
          content: isPatient ? null : c.handoff.status === 'REJECTED' ? null : c.handoff.doctorEditedContent ?? c.handoff.generatedContent,
          label: isPatient ? null : c.handoff.label,
        } : null,
        notes: c.notes.map((n) => ({ id: n.id, type: n.type, visibility: n.visibility, content: n.content, aiAssisted: n.aiAssisted, updatedAt: n.updatedAt })),
        prescriptions: c.prescriptions.map((p) => ({ id: p.id, status: p.status, issuedAt: p.issuedAt, items: p.items, doctorName: p.doctorNameSnapshot })),
        calls: c.calls.map((call) => ({ id: call.id, state: call.state, provider: call.provider, roomId: call.roomId })),
        statusEvents: c.statusEvents.map((ev) => ({ from: ev.fromStatus, to: ev.toStatus, at: ev.createdAt, actorRole: ev.actorRole, reason: ev.reason })),
        review: c.reviews[0] ? { overall: c.reviews[0].overall, comment: c.reviews[0].comment } : null,
        viewerRole: access.kind === 'participant' ? access.role : 'STAFF',
        canMessage: isPatient || isDoctor,
      },
    });
  } catch (e) {
    return err(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'consultation.view');
    if (access.kind !== 'participant') {
      return NextResponse.json({ error: 'REQUIRES_PARTICIPANT' }, { status: 403 });
    }
    const body = await req.json();
    const action = String(body.action ?? '');
    const uid = access.session.id;
    const role = access.role;

    switch (action) {
      case 'accept': {
        if (role !== 'DOCTOR') return NextResponse.json({ error: 'REQUIRES_DOCTOR' }, { status: 403 });
        const updated = await doctorAccept(id, uid, body.scheduledAt);
        return NextResponse.json({ consultation: { id: updated.id, status: updated.status } });
      }
      case 'decline': {
        if (role !== 'DOCTOR') return NextResponse.json({ error: 'REQUIRES_DOCTOR' }, { status: 403 });
        const updated = await doctorDecline(id, uid, body.reason);
        return NextResponse.json({ consultation: { id: updated.id, status: updated.status } });
      }
      case 'start': {
        const updated = await startConsultation(id, uid, role);
        await auditCare({ actorId: uid, actorRole: role, action: 'consultation.start', consultationId: id });
        return NextResponse.json({ consultation: { id: updated.id, status: updated.status } });
      }
      case 'complete': {
        if (role !== 'DOCTOR') return NextResponse.json({ error: 'REQUIRES_DOCTOR' }, { status: 403 });
        const updated = await completeConsultation(id, uid);
        return NextResponse.json({ consultation: { id: updated.id, status: updated.status } });
      }
      case 'cancel': {
        const updated = await cancelConsultation({ consultationId: id, actorUserId: uid, actorRole: role, reason: body.reason ? String(body.reason).slice(0, 500) : undefined });
        return NextResponse.json({ consultation: { id: updated.id, status: updated.status } });
      }
      case 'markRead': {
        await db.consultationParticipant.updateMany({
          where: { consultationId: id, userId: uid },
          data: { lastReadAt: new Date() },
        });
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
    }
  } catch (e) {
    return err(e);
  }
}
