import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { EvalRunSummary } from '@/lib/types';

export const runtime = 'nodejs';

interface StoredSummary extends EvalRunSummary {
  status?: 'running' | 'complete' | 'interrupted';
  completed?: number;
}

interface EvalRunDto {
  id: string;
  startedAt: string;
  suiteVersion: string;
  durationMs: number;
  summary: StoredSummary;
}

interface EvalResultDto {
  id: string;
  caseId: string;
  category: string;
  input: string;
  language: string;
  expected: Record<string, unknown> | null;
  actual: Record<string, unknown> | null;
  passed: boolean;
  metric: Record<string, unknown> | null;
}

function safeParse(text: string | null): Record<string, unknown> | null {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** GET /api/eval/results?runId — latest 20 runs + the latest (or requested) run's case rows */
export async function GET(req: NextRequest) {
  try {
    const runId = (req.nextUrl.searchParams.get('runId') ?? '').trim();

    const runRows = await db.evalRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    // a "running" run whose process died would be stuck forever — mark stale ones
    const staleCutoff = Date.now() - 30 * 60 * 1000;
    for (const row of runRows) {
      const summary = safeParse(row.summary);
      const isRunning = (summary?.status as string | undefined) === 'running';
      if (isRunning && row.startedAt.getTime() < staleCutoff) {
        const fixed = { ...summary, status: 'interrupted' };
        await db.evalRun
          .update({ where: { id: row.id }, data: { summary: JSON.stringify(fixed) } })
          .catch(() => undefined);
        row.summary = JSON.stringify(fixed);
      }
    }

    const runs: EvalRunDto[] = runRows.map((r) => ({
      id: r.id,
      startedAt: r.startedAt.toISOString(),
      suiteVersion: r.suiteVersion,
      durationMs: r.durationMs,
      summary: (safeParse(r.summary) ?? {}) as unknown as StoredSummary,
    }));

    const target = runId ? runs.find((r) => r.id === runId) ?? null : runs[0] ?? null;

    let latestRun: (EvalRunDto & { results: EvalResultDto[] }) | null = null;
    if (target) {
      const resultRows = await db.evalResult.findMany({
        where: { runId: target.id },
        orderBy: { caseId: 'asc' },
      });
      latestRun = {
        ...target,
        results: resultRows.map((r) => ({
          id: r.id,
          caseId: r.caseId,
          category: r.category,
          input: r.input,
          language: r.language,
          expected: safeParse(r.expected),
          actual: safeParse(r.actual),
          passed: r.passed,
          metric: safeParse(r.metric),
        })),
      };
    }

    return NextResponse.json({ runs, latestRun });
  } catch {
    return NextResponse.json({ runs: [], latestRun: null, error: 'failed to load eval results' });
  }
}
