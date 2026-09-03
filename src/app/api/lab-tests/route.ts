// SehatAI — Lab Test Booking API
// GET /api/lab-tests → user's lab tests
// POST /api/lab-tests { labName, testName, scheduledAt? } → book a lab test
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

const PARTNER_LABS = [
  { name: 'Chughtai Lab', cities: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad'] },
  { name: 'Aga Khan Lab', cities: ['Karachi', 'Hyderabad', 'Sukkur'] },
  { name: 'Dow Diagnostic', cities: ['Karachi'] },
  { name: 'Shifa Lab', cities: ['Islamabad', 'Rawalpindi'] },
];

const COMMON_TESTS = [
  'Complete Blood Count (CBC)', 'Lipid Profile', 'Blood Sugar (Fasting)', 'HbA1c',
  'Liver Function Test (LFT)', 'Thyroid Profile', 'Urine Routine', 'Vitamin D',
  'COVID-19 PCR', 'Dengue NS1 Antigen', 'Blood Group', 'Pregnancy Test',
];

export async function GET() {
  let user;
  try { user = await requireUser(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  const tests = await db.labTest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return NextResponse.json({
    tests: tests.map(t => ({ ...t, scheduledAt: t.scheduledAt?.toISOString() ?? null, createdAt: t.createdAt.toISOString() })),
    partnerLabs: PARTNER_LABS,
    commonTests: COMMON_TESTS,
  });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  let body: { labName?: string; testName?: string; scheduledAt?: string; notes?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.labName || !body.testName) {
    return NextResponse.json({ error: 'labName and testName are required' }, { status: 400 });
  }
  const test = await db.labTest.create({
    data: {
      userId: user.id,
      labName: body.labName,
      testName: body.testName,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      notes: body.notes ?? null,
    },
  });
  await db.auditLog.create({
    data: { userId: user.id, action: 'patient.labtest.booked', resource: test.id, meta: JSON.stringify({ labName: body.labName, testName: body.testName }) },
  });
  return NextResponse.json({ ok: true, testId: test.id, status: 'requested' });
}
