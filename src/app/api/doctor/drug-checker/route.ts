// SehatAI — Doctor Portal: bulk drug-interaction checker
// POST /api/doctor/drug-checker { medications, allergies?, pregnant?, breastfeeding?, ageBand?, conditions? }
// Returns the full DrugCheckResult from the deterministic rules engine.
import { NextRequest, NextResponse } from 'next/server';
import { checkDrugSafety } from '@/lib/drug-interactions';
import { requireDoctor } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireDoctor(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  let body: {
    medications?: unknown;
    allergies?: unknown;
    pregnant?: unknown;
    breastfeeding?: unknown;
    ageBand?: unknown;
    conditions?: unknown;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const medications = Array.isArray(body.medications) ? body.medications.filter((x): x is string => typeof x === 'string') : [];
  if (medications.length === 0) {
    return NextResponse.json({ error: 'At least one medication is required' }, { status: 400 });
  }
  const allergies = Array.isArray(body.allergies) ? body.allergies.filter((x): x is string => typeof x === 'string') : [];
  const conditions = Array.isArray(body.conditions) ? body.conditions.filter((x): x is string => typeof x === 'string') : [];
  const result = checkDrugSafety({
    text: medications.join(', '),
    allergies,
    currentMedications: medications,
    pregnant: body.pregnant === true,
    breastfeeding: body.breastfeeding === true,
    ageBand: typeof body.ageBand === 'string' ? body.ageBand : 'undisclosed',
    conditions,
  });
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'doctor.drug-checker.run',
      resource: 'copilot',
      meta: JSON.stringify({ medicationCount: medications.length, severity: result.overallSeverity }),
    },
  });
  return NextResponse.json({ result });
}
