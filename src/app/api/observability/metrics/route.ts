// SehatAI — Phase 1: Observability metrics endpoint.
// GET  /api/observability/metrics -> aggregated, privacy-preserving triage distribution
// POST /api/observability/metrics?action=reset -> reset (admin only)
//
// Returns NO individual data — only aggregated counts. PHI never appears.
import { NextRequest, NextResponse } from 'next/server';
import { getMetricsSnapshot, resetMetrics } from '@/lib/observability';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const snap = getMetricsSnapshot();
  // Add system stats
  const mem = process.memoryUsage();
  return NextResponse.json({
    ...snap,
    system: {
      memoryMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      uptimeSec: Math.floor(process.uptime()),
      nodeVersion: process.version,
    },
    generatedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  if (action !== 'reset') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
  // Admin only
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  resetMetrics();
  await db.auditLog.create({
    data: { userId: user.id, action: 'metrics.reset' },
  });
  return NextResponse.json({ ok: true });
}
