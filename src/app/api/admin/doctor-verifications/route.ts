// SehatAI — Admin: list doctors awaiting verification
// GET /api/admin/doctor-verifications?status=pending|active|suspended → list of doctor profiles + their docs + user info
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  let admin;
  try { admin = await requireAdmin(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: (e as { status?: number }).status ?? 401 });
  }
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status') ?? 'pending_verification';

  const where: { accountStatus?: string } = {};
  if (statusFilter !== 'all') where.accountStatus = statusFilter;

  const doctors = await db.doctorProfile.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, accountStatus: true, createdAt: true } },
      verificationDocs: { orderBy: { uploadedAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Filter by user accountStatus (since accountStatus lives on User, not DoctorProfile)
  const filtered = statusFilter === 'all' ? doctors : doctors.filter((d) => d.user.accountStatus === statusFilter);

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: 'admin.doctor-verifications.list',
      resource: 'admin',
      meta: JSON.stringify({ filter: statusFilter, count: filtered.length }),
    },
  });

  return NextResponse.json({
    doctors: filtered.map((d) => ({
      id: d.id,
      userId: d.userId,
      name: d.user.name,
      email: d.user.email,
      accountStatus: d.user.accountStatus,
      pmdcNumber: d.pmdcNumber,
      pmdcVerifiedAt: d.pmdcVerifiedAt?.toISOString() ?? null,
      specialty: d.specialty,
      subSpecialty: d.subSpecialty,
      facilityName: d.facilityName,
      facilityCity: d.facilityCity,
      yearsExperience: d.yearsExperience,
      languages: (() => { try { return JSON.parse(d.languages); } catch { return []; } })(),
      bio: d.bio,
      createdAt: d.createdAt.toISOString(),
      docs: d.verificationDocs.map((doc) => ({
        id: doc.id,
        docType: doc.docType,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        mimeType: doc.mimeType,
        uploadedAt: doc.uploadedAt.toISOString(),
        status: doc.status,
        reviewedAt: doc.reviewedAt?.toISOString() ?? null,
        notes: doc.notes,
      })),
    })),
  });
}
