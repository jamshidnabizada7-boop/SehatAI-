// SehatAI — Phase 4: Continual Learning from Outcome Data
// GET /api/learning/analyze — admin only
// Analyzes outcome data to identify patterns in what treatments/advice worked
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const outcomes = await db.outcomeEntry.findMany({
    where: { status: { in: ['captured', 'resolved'] } },
    take: 500,
    orderBy: { createdAt: 'desc' },
  });

  const totalOutcomes = outcomes.length;
  const better = outcomes.filter((o) => o.outcome === 'better').length;
  const same = outcomes.filter((o) => o.outcome === 'same').length;
  const worse = outcomes.filter((o) => o.outcome === 'worse').length;
  const sawDoctor = outcomes.filter((o) => o.outcome === 'saw_doctor').length;
  const wentToEr = outcomes.filter((o) => o.outcome === 'went_to_er').length;

  const improvementRate = totalOutcomes > 0 ? ((better / totalOutcomes) * 100).toFixed(1) : '0';
  const deteriorationRate = totalOutcomes > 0 ? ((worse / totalOutcomes) * 100).toFixed(1) : '0';
  const escalationRate = totalOutcomes > 0 ? (((sawDoctor + wentToEr) / totalOutcomes) * 100).toFixed(1) : '0';

  return NextResponse.json({
    summary: {
      totalOutcomes,
      improvementRate: `${improvementRate}%`,
      deteriorationRate: `${deteriorationRate}%`,
      escalationRate: `${escalationRate}%`,
      distribution: { better, same, worse, sawDoctor, wentToEr },
    },
    insights: [
      Number(improvementRate) > 70
        ? 'Improvement rate is high (>70%) — current guidance approach is effective.'
        : Number(improvementRate) > 50
          ? 'Improvement rate is moderate (50-70%) — review cases that did not improve.'
          : 'Improvement rate is low (<50%) — consider reviewing triage accuracy.',
      Number(deteriorationRate) > 20
        ? 'Deterioration rate is high (>20%) — review escalation protocols.'
        : 'Deterioration rate is acceptable.',
      Number(escalationRate) > 40
        ? 'High escalation rate (>40%) — patients frequently need professional care after AI guidance.'
        : 'Escalation rate is reasonable.',
    ].filter(Boolean),
    timestamp: new Date().toISOString(),
  });
}
