// SehatAI — Phase 1: Observability metrics endpoint.
// GET  /api/observability/metrics -> aggregated, privacy-preserving pipeline metrics
// POST /api/observability/metrics?action=reset -> reset (admin only)
//
// Metrics are aggregated from the DATABASE (audit log rows written by every
// pipeline run, guests included) and merged with the in-memory counters of
// this server instance. In-memory-only counters are always zero on serverless
// (each request may land on a fresh instance) — the DB is the source of truth.
// Returns NO individual data — only aggregated counts. PHI never appears.
import { NextRequest, NextResponse } from 'next/server';
import { getMetricsSnapshot, resetMetrics } from '@/lib/observability';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface PipelineMeta {
  triageLevel?: string;
  confidenceBand?: string;
  engine?: string;
  latencyMs?: number;
  injectionAttempt?: boolean;
  drugCheckSeverity?: string;
  path?: string;
}

const MAX_DB_ROWS = 500;

async function getDbSnapshot() {
  const rows = await db.auditLog.findMany({
    where: { action: 'pipeline.run' },
    orderBy: { createdAt: 'desc' },
    take: MAX_DB_ROWS,
    select: { meta: true, createdAt: true },
  });

  const snap = {
    startedAt: rows.length ? rows[rows.length - 1].createdAt.toISOString() : null,
    totalRuns: 0,
    triageCounts: { EMERGENCY: 0, URGENT: 0, ROUTINE: 0, SELF_CARE: 0, INFORMATIONAL: 0 } as Record<string, number>,
    confidenceBands: { HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<string, number>,
    engineCounts: { L0: 0, L1: 0, combined: 0, offline: 0, fallback: 0 } as Record<string, number>,
    injectionAttempts: 0,
    drugCheckSeverity: { HIGH: 0, MODERATE: 0, LOW: 0, NONE: 0 } as Record<string, number>,
    latencies: [] as number[],
    errors: 0,
  };

  for (const row of rows) {
    let m: PipelineMeta;
    try {
      m = JSON.parse(row.meta ?? '{}') as PipelineMeta;
    } catch {
      continue;
    }
    snap.totalRuns++;
    if (m.triageLevel) snap.triageCounts[m.triageLevel] = (snap.triageCounts[m.triageLevel] ?? 0) + 1;
    if (m.confidenceBand) snap.confidenceBands[m.confidenceBand] = (snap.confidenceBands[m.confidenceBand] ?? 0) + 1;
    if (m.engine) snap.engineCounts[m.engine] = (snap.engineCounts[m.engine] ?? 0) + 1;
    if (m.injectionAttempt) snap.injectionAttempts++;
    if (m.drugCheckSeverity) snap.drugCheckSeverity[m.drugCheckSeverity] = (snap.drugCheckSeverity[m.drugCheckSeverity] ?? 0) + 1;
    if (typeof m.latencyMs === 'number') snap.latencies.push(m.latencyMs);
    if (!m.path || m.path === 'error') snap.errors++;
  }

  snap.latencies.sort((a, b) => a - b);
  return snap;
}

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
}

function addCounts(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v;
  return out;
}

export async function GET() {
  const mem = getMetricsSnapshot();
  let dbSnap: Awaited<ReturnType<typeof getDbSnapshot>> | null = null;
  try {
    dbSnap = await getDbSnapshot();
  } catch {
    dbSnap = null; // DB unavailable — fall back to instance metrics
  }

  // Merge DB (all traffic, all instances) with in-memory (this instance).
  const totalRuns = (dbSnap?.totalRuns ?? 0) + mem.totalRuns;
  const allLatencies = [...(dbSnap?.latencies ?? [])];
  if (mem.latency.count) allLatencies.push(mem.latency.p50);
  allLatencies.sort((a, b) => a - b);
  const errors = (dbSnap?.errors ?? 0) + mem.errors;

  const snap = {
    ...mem,
    startedAt: dbSnap?.startedAt ?? mem.startedAt,
    totalRuns,
    triageCounts: addCounts(dbSnap?.triageCounts ?? {}, mem.triageCounts),
    confidenceBands: addCounts(dbSnap?.confidenceBands ?? {}, mem.confidenceBands),
    engineCounts: addCounts(dbSnap?.engineCounts ?? {}, mem.engineCounts),
    injectionAttempts: (dbSnap?.injectionAttempts ?? 0) + mem.injectionAttempts,
    drugCheckSeverity: addCounts(dbSnap?.drugCheckSeverity ?? {}, mem.drugCheckSeverity),
    latency: {
      count: allLatencies.length,
      avgMs: allLatencies.length ? Math.round(allLatencies.reduce((s, n) => s + n, 0) / allLatencies.length) : 0,
      p50: pct(allLatencies, 0.5),
      p95: pct(allLatencies, 0.95),
      max: allLatencies.length ? allLatencies[allLatencies.length - 1] : 0,
    },
    errors,
    errorRate: totalRuns ? errors / totalRuns : 0,
    source: dbSnap ? 'database+instance' : 'instance',
  };

  const proc = process.memoryUsage();
  return NextResponse.json({
    ...snap,
    system: {
      memoryMB: Math.round(proc.rss / 1024 / 1024),
      heapUsedMB: Math.round(proc.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(proc.heapTotal / 1024 / 1024),
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
