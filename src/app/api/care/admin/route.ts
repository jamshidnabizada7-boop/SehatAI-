// Care Connect §51/§78 — Admin Care Connect console (read) + actions.
// GET ?resource=... — overview | consultations | payments | payouts |
//   refunds | disputes | reviews | fraud | flags | commission | jurisdictions
// POST — staff actions (payout.process, dispute.update, review.moderate,
//   flag.set, commission.create, jurisdiction.upsert, fraud.review).
// Every access is capability-gated and AUDITED (least privilege, §52/§53).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCapability, CareAuthzError } from '@/lib/care/care-auth';
import { auditCare } from '@/server/care/audit';
import { clearFlagCache } from '@/lib/care/flags';
export const runtime = 'nodejs';

function err(e: unknown) {
  if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const resource = new URL(req.url).searchParams.get('resource') ?? 'overview';
    // Consultation-adjacent data → clinical_admin; money → finance/admin.
    const cap = ['payments', 'payouts', 'refunds', 'commission'].includes(resource)
      ? 'payment.viewAny' as const
      : ['reviews', 'jurisdictions', 'flags'].includes(resource)
        ? 'review.moderate' as const
        : 'consultation.viewAny' as const;
    const session = await requireCapability(cap);
    await auditCare({ actorId: session.id, actorRole: session.role, action: `care.admin.${resource}` });

    switch (resource) {
      case 'overview': {
        const [todayRevenue, gmv, refundsSum, pendingPayouts, completed, active, newPatients, newDoctors] = await Promise.all([
          db.platformFee.aggregate({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, _sum: { commissionMinor: true } }),
          db.payment.aggregate({ where: { status: 'PAID' }, _sum: { amountMinor: true } }),
          db.refund.aggregate({ where: { state: 'REFUNDED' }, _sum: { amountMinor: true } }),
          db.payout.aggregate({ where: { state: { in: ['PENDING', 'PROCESSING'] } }, _sum: { amountMinor: true } }),
          db.consultation.count({ where: { status: 'COMPLETED' } }),
          db.consultation.count({ where: { status: { in: ['PAID', 'REQUESTED', 'DOCTOR_ACCEPTED', 'SCHEDULED', 'WAITING', 'IN_PROGRESS'] } } }),
          db.user.count({ where: { role: 'user', createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } } }),
          db.user.count({ where: { role: 'doctor', createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } } }),
        ]);
        return NextResponse.json({
          todayCommissionMinor: todayRevenue._sum.commissionMinor ?? 0,
          gmvMinor: gmv._sum.amountMinor ?? 0,
          refundedMinor: refundsSum._sum.amountMinor ?? 0,
          pendingPayoutsMinor: pendingPayouts._sum.amountMinor ?? 0,
          completedConsultations: completed,
          activeConsultations: active,
          newPatients30d: newPatients,
          newDoctors30d: newDoctors,
          currency: 'mixed',
        });
      }
      case 'consultations':
        return NextResponse.json({
          consultations: await db.consultation.findMany({
            include: { patient: { select: { name: true } }, doctorProfile: { include: { user: { select: { name: true } } } } },
            orderBy: { updatedAt: 'desc' },
            take: 100,
          }),
        });
      case 'payments':
        return NextResponse.json({ payments: await db.payment.findMany({ include: { consultation: { select: { id: true, status: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }) });
      case 'payouts':
        return NextResponse.json({ payouts: await db.payout.findMany({ include: { doctorProfile: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' }, take: 100 }) });
      case 'refunds':
        return NextResponse.json({ refunds: await db.refund.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }) });
      case 'disputes':
        return NextResponse.json({ disputes: await db.dispute.findMany({ include: { consultation: { select: { id: true, status: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }) });
      case 'reviews':
        return NextResponse.json({ reviews: await db.review.findMany({ include: { patient: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }) });
      case 'fraud':
        return NextResponse.json({ signals: await db.fraudSignal.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }) });
      case 'flags':
        return NextResponse.json({ flags: await db.featureFlag.findMany({ orderBy: { key: 'asc' } }) });
      case 'commission':
        return NextResponse.json({ rules: await db.commissionRule.findMany({ orderBy: { effectiveFrom: 'desc' }, take: 50 }) });
      case 'jurisdictions':
        return NextResponse.json({ policies: await db.jurisdictionPolicy.findMany({ orderBy: { updatedAt: 'desc' }, take: 100 }) });
      default:
        return NextResponse.json({ error: 'UNKNOWN_RESOURCE' }, { status: 400 });
    }
  } catch (e) {
    return err(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? '');
    switch (action) {
      case 'payout.process': {
        const session = await requireCapability('payout.process');
        const { processPayout } = await import('@/server/care/payout-service');
        const payout = await processPayout({ payoutId: String(body.payoutId), actorId: session.id, actorRole: session.role });
        return NextResponse.json({ payout });
      }
      case 'review.moderate': {
        const session = await requireCapability('review.moderate');
        const { moderateReview } = await import('@/server/care/review-service');
        const review = await moderateReview({
          reviewId: String(body.reviewId), moderatorId: session.id,
          state: body.state as 'PUBLISHED' | 'HIDDEN' | 'FLAGGED', note: body.note,
        });
        return NextResponse.json({ review });
      }
      case 'flag.set': {
        const session = await requireCapability('flags.manage');
        await db.featureFlag.update({
          where: { key: String(body.key) },
          data: { enabled: body.enabled === true, updatedById: session.id },
        });
        clearFlagCache();
        await auditCare({ actorId: session.id, actorRole: session.role, action: 'care.flag.set', detail: { key: body.key, enabled: body.enabled === true } });
        return NextResponse.json({ ok: true });
      }
      case 'commission.create': {
        const session = await requireCapability('commission.manage');
        const rule = await db.commissionRule.create({
          data: {
            country: body.country ? String(body.country).toUpperCase() : null,
            consultationType: body.consultationType ? String(body.consultationType) : null,
            specialty: body.specialty ? String(body.specialty) : null,
            percentageBps: Math.min(10000, Math.max(0, Number(body.percentageBps ?? 2000))),
            fixedFeeMinor: Math.max(0, Number(body.fixedFeeMinor ?? 0)),
            effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : new Date(),
          },
        });
        await auditCare({ actorId: session.id, actorRole: session.role, action: 'care.commission.create', detail: { ruleId: rule.id } });
        return NextResponse.json({ rule }, { status: 201 });
      }
      case 'jurisdiction.upsert': {
        const session = await requireCapability('jurisdiction.manage');
        const policyVersion = String(body.policyVersion ?? '2026.10-initial');
        const data = {
          countryCode: String(body.countryCode ?? '').toUpperCase(),
          doctorCountry: String(body.doctorCountry ?? '').toUpperCase(),
          consultationAllowed: body.consultationAllowed === true,
          messagingAllowed: body.messagingAllowed === true,
          audioAllowed: body.audioAllowed === true,
          videoAllowed: body.videoAllowed === true,
          prescribingAllowed: body.prescribingAllowed === true,
          controlledDrugAllowed: body.controlledDrugAllowed === true,
          medicalCertificateAllowed: body.medicalCertificateAllowed === true,
          secondOpinionAllowed: body.secondOpinionAllowed === true,
          minorConsultationAllowed: body.minorConsultationAllowed === true,
          requiresGuardian: body.requiresGuardian === true,
          requiresLocalDoctor: body.requiresLocalDoctor === true,
          policyVersion,
        };
        if (!data.countryCode || !data.doctorCountry) {
          return NextResponse.json({ error: 'COUNTRY_CODES_REQUIRED' }, { status: 400 });
        }
        const policy = await db.jurisdictionPolicy.upsert({
          where: { countryCode_doctorCountry_policyVersion: { countryCode: data.countryCode, doctorCountry: data.doctorCountry, policyVersion } },
          create: data,
          update: data,
        });
        await auditCare({ actorId: session.id, actorRole: session.role, action: 'care.jurisdiction.upsert', detail: { key: `${data.countryCode}>${data.doctorCountry}` } });
        return NextResponse.json({ policy });
      }
      case 'fraud.review': {
        const session = await requireCapability('fraud.review');
        const signal = await db.fraudSignal.update({
          where: { id: String(body.signalId) },
          data: { state: String(body.state ?? 'REVIEWED'), reviewedById: session.id },
        });
        return NextResponse.json({ signal });
      }
      case 'doctor.suspend': {
        const session = await requireCapability('doctor.verify');
        await db.doctorProfile.update({
          where: { id: String(body.doctorProfileId) },
          data: { careStatus: body.suspend === true ? 'SUSPENDED' : 'ACTIVE' },
        });
        await auditCare({ actorId: session.id, actorRole: session.role, action: 'care.doctor.suspend', detail: { doctorProfileId: body.doctorProfileId, suspend: body.suspend === true } });
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
    }
  } catch (e) {
    return err(e);
  }
}
