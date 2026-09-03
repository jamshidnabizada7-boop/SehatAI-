// SehatAI — Chronic Disease Program API
// GET /api/chronic-programs → user's programs
// POST /api/chronic-programs { programType } → enroll in a program
// PATCH /api/chronic-programs { id, taskId } → mark task complete
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

const PROGRAMS = {
  diabetes: {
    name: 'Diabetes Management',
    weeks: [
      { week: 1, title: 'Understanding Diabetes', tasks: ['Learn about blood sugar levels', 'Check your HbA1c', 'Start a food diary'] },
      { week: 2, title: 'Nutrition Basics', tasks: ['Learn carb counting', 'Plan a desi diabetic meal', 'Reduce sugary drinks'] },
      { week: 3, title: 'Exercise & Activity', tasks: ['Walk 30 min daily', 'Learn about post-meal walks', 'Try yoga for diabetes'] },
      { week: 4, title: 'Medication Adherence', tasks: ['Set medication reminders', 'Learn about metformin', "Track your blood sugar"] },
      // ... weeks 5-12 would continue
    ],
  },
  hypertension: {
    name: 'Hypertension Control',
    weeks: [
      { week: 1, title: 'Understanding Blood Pressure', tasks: ['Learn BP readings', 'Check your BP', 'Start a BP diary'] },
      { week: 2, title: 'DASH Diet', tasks: ['Reduce salt intake', 'Add potassium foods (bananas)', 'Limit caffeine'] },
      { week: 3, title: 'Exercise', tasks: ['Walk 30 min daily', 'Try breathing exercises', 'Limit alcohol'] },
      { week: 4, title: 'Stress Management', tasks: ['Learn meditation', 'Sleep 7-8 hours', 'Reduce screen time'] },
    ],
  },
};

export async function GET() {
  let user;
  try { user = await requireUser(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  const programs = await db.chronicProgram.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({
    programs: programs.map(p => ({
      ...p,
      completedTasks: JSON.parse(p.completedTasks),
      startDate: p.startDate.toISOString(),
      programName: (PROGRAMS as any)[p.programType]?.name ?? p.programType,
      currentWeekData: (PROGRAMS as any)[p.programType]?.weeks?.[p.currentWeek - 1] ?? null,
    })),
    availablePrograms: Object.entries(PROGRAMS).map(([key, val]) => ({ type: key, name: val.name, totalWeeks: val.weeks.length })),
  });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  let body: { programType?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const type = body.programType ?? '';
  if (!PROGRAMS[type as keyof typeof PROGRAMS]) {
    return NextResponse.json({ error: 'Invalid program type' }, { status: 400 });
  }
  // Check if already enrolled
  const existing = await db.chronicProgram.findFirst({
    where: { userId: user.id, programType: type, status: 'active' },
  });
  if (existing) return NextResponse.json({ error: 'Already enrolled in this program' }, { status: 409 });

  const program = await db.chronicProgram.create({
    data: { userId: user.id, programType: type },
  });
  return NextResponse.json({ ok: true, programId: program.id });
}

export async function PATCH(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  let body: { id?: string; taskId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.id || !body.taskId) return NextResponse.json({ error: 'id and taskId are required' }, { status: 400 });

  const program = await db.chronicProgram.findUnique({ where: { id: body.id } });
  if (!program || program.userId !== user.id) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 });
  }
  const completed = JSON.parse(program.completedTasks) as string[];
  if (!completed.includes(body.taskId)) completed.push(body.taskId);

  // Advance week if all tasks done
  const programData = (PROGRAMS as any)[program.programType];
  const currentWeekData = programData?.weeks?.[program.currentWeek - 1];
  let newWeek = program.currentWeek;
  let newStatus = program.status;
  if (currentWeekData && currentWeekData.tasks.every((t: string) => completed.includes(`${program.currentWeek}-${t}`))) {
    newWeek = Math.min(program.currentWeek + 1, program.totalWeeks);
    if (newWeek >= program.totalWeeks) newStatus = 'completed';
  }

  await db.chronicProgram.update({
    where: { id: body.id },
    data: { completedTasks: JSON.stringify(completed), currentWeek: newWeek, status: newStatus },
  });
  return NextResponse.json({ ok: true, currentWeek: newWeek, status: newStatus });
}
