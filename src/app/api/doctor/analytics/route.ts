// SehatAI — Doctor Analytics Dashboard API
// GET /api/doctor/analytics → doctor's patient trends, triage distribution, appointment stats
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireDoctor } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  let user;
  try { user = await requireDoctor(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Forbidden' }, { status: (e as { status?: number }).status ?? 401 });
  }
  const profile = await db.doctorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

  // Patient stats
  const conversations = await db.conversation.findMany({
    where: { userId: { not: null } },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      user: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  // Triage distribution
  const triageDistribution: Record<string, number> = { EMERGENCY: 0, URGENT: 0, ROUTINE: 0, SELF_CARE: 0 };
  for (const conv of conversations) {
    const lastMsg = conv.messages[0];
    if (lastMsg?.triageLevel) {
      triageDistribution[lastMsg.triageLevel] = (triageDistribution[lastMsg.triageLevel] ?? 0) + 1;
    }
  }

  // Appointment stats
  const appointments = await db.appointment.findMany({
    where: { doctorProfileId: profile.id },
    include: { patient: { select: { name: true } } },
    orderBy: { scheduledAt: 'desc' },
    take: 50,
  });
  const apptStats = {
    total: appointments.length,
    requested: appointments.filter(a => a.status === 'requested').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    declined: appointments.filter(a => a.status === 'declined').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  // Reviews stats
  const reviews = await db.doctorReview.findMany({ where: { doctorProfileId: profile.id } });
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  // Consent stats
  const consents = await db.patientConsentForDoctor.findMany({
    where: { doctorId: profile.id, revokedAt: null },
  });

  // Recent activity (audit log)
  const recentActivity = await db.auditLog.findMany({
    where: { userId: user.id, action: { startsWith: 'doctor.' } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return NextResponse.json({
    overview: {
      totalPatients: conversations.length,
      totalAppointments: apptStats.total,
      totalReviews: reviews.length,
      avgRating: Math.round(avgRating * 10) / 10,
      activeConsents: consents.length,
    },
    triageDistribution,
    appointmentStats: apptStats,
    recentActivity: recentActivity.map(a => ({
      action: a.action,
      resource: a.resource,
      at: a.createdAt.toISOString(),
      meta: a.meta ? (() => { try { return JSON.parse(a.meta); } catch { return a.meta; } })() : null,
    })),
    upcomingAppointments: appointments
      .filter(a => a.status === 'confirmed' && new Date(a.scheduledAt) > new Date())
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        patientName: a.patient.name ?? 'Unknown',
        scheduledAt: a.scheduledAt.toISOString(),
        reason: a.reason,
      })),
  });
}
