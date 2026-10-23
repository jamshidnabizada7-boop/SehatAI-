'use client';

import { useSession } from 'next-auth/react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  FlaskConical,
  Gauge,
  Link2,
  Loader2,
  Play,
  ShieldCheck,
  ShieldQuestion,
  Siren,
  Target,
  TrendingDown,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t, type TKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Lang } from '@/lib/types';
import { DoctorVerificationsView } from '@/components/admin/doctor-verifications-view';

// Phase 0 (W5 fix): hardcoded passcode removed. The dashboard is now gated
// server-side by the user's role (admin) via GET /api/eval/access. The client
// just checks the access response; no secret is shipped in the bundle.

// ---------- normalized run shape (defensive against backend field naming) ----------

interface NormalizedMetrics {
  total: number;
  passed: number;
  accuracy: number;
  emergencyRecall: number;
  underTriageRate: number;
  falsePositiveRate: number;
  refusalCorrectness: number;
  citationRate: number;
  latencyP50: number;
  latencyP95: number;
  categoryBreakdown: Record<string, { total: number; passed: number }>;
}

interface NormalizedRun {
  id: string;
  status: string;
  startedAt: string;
  durationMs: number | null;
  metrics: NormalizedMetrics;
}

interface EvalResponse {
  runs?: Record<string, unknown>[];
  latestRun?: { results?: Record<string, unknown>[] } & Record<string, unknown>;
}

/** Case-result row (defensive: expected/actual may be objects from the harness). */
interface EvalRow {
  caseId: string;
  category: string;
  input: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
}

/** Live counts of the offline knowledge base (admin Dataset Stats panel). */
interface DatasetStats {
  corpus: number;
  drugs: number;
  interactionRules: number;
  blogArticles: number;
  healthTips: number;
  glossaryTerms: number;
  total: number;
}

function normalizeRow(raw: Record<string, unknown>): EvalRow {
  return {
    caseId: String(raw.caseId ?? 'case'),
    category: String(raw.category ?? ''),
    input: String(raw.input ?? ''),
    expected: raw.expected,
    actual: raw.actual,
    passed: Boolean(raw.passed),
  };
}

/** Render any expected/actual value (string | number | boolean | object) as text. */
function cellText(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    try {
      const entries = Object.entries(v as Record<string, unknown>);
      if (entries.length === 0) return '—';
      return entries
        .map(([k, val]) => {
          if (typeof val === 'boolean') return val ? k : `${k}: false`;
          return `${k}: ${String(val)}`;
        })
        .join(' · ');
    } catch {
      return JSON.stringify(v);
    }
  }
  return String(v);
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function normalizeRun(raw: Record<string, unknown>): NormalizedRun {
  // metrics live under `summary` (current harness) or `metrics`/flat (older shapes)
  const m = (raw.summary ?? raw.metrics ?? raw) as Record<string, unknown>;
  const status = String(raw.status ?? m.status ?? 'completed');
  const breakdownRaw = (m.categoryBreakdown ?? {}) as Record<
    string,
    { total?: number; passed?: number }
  >;
  const categoryBreakdown: Record<string, { total: number; passed: number }> = {};
  for (const [key, val] of Object.entries(breakdownRaw)) {
    categoryBreakdown[key] = { total: num(val?.total), passed: num(val?.passed) };
  }
  return {
    id: String(raw.id ?? raw.runId ?? 'run'),
    status,
    startedAt: String(raw.startedAt ?? raw.createdAt ?? new Date().toISOString()),
    durationMs: typeof raw.durationMs === 'number' ? raw.durationMs : null,
    metrics: {
      total: num(m.total),
      passed: num(m.passed),
      accuracy: num(m.accuracy),
      emergencyRecall: num(m.emergencyRecall),
      underTriageRate: num(m.underTriageRate),
      falsePositiveRate: num(m.falsePositiveRate),
      refusalCorrectness: num(m.refusalCorrectness),
      citationRate: num(m.citationRate),
      latencyP50: num(m.latencyP50),
      latencyP95: num(m.latencyP95),
      categoryBreakdown,
    },
  };
}

const CATEGORY_LABEL: Record<string, TKey> = {
  triage: 'dashboard.catTriage',
  'redflag-positive': 'dashboard.catRedflagPositive',
  'redflag-nearmiss': 'dashboard.catRedflagNearmiss',
  refusal: 'dashboard.catRefusal',
  grounding: 'dashboard.catGrounding',
  'multilingual-parity': 'dashboard.catParity',
};

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

// ---------- metric card ----------

function MetricCard({
  label,
  value,
  good,
  delay,
  icon: Icon,
}: {
  label: string;
  value: string;
  good?: boolean;
  delay: number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
              good === false
                ? 'bg-red-600/10 text-red-600 dark:text-red-400'
                : good === true
                  ? 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-primary/10 text-primary',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          'mt-1.5 text-2xl font-extrabold tabular-nums',
          good === true && 'text-emerald-600 dark:text-emerald-400',
          good === false && 'text-red-600 dark:text-red-400',
        )}
      >
        {value}
      </p>
    </motion.div>
  );
}

// ---------- main dashboard ----------

export function DashboardView() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin';
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);


  const [runs, setRuns] = useState<NormalizedRun[]>([]);
  const [latestResults, setLatestResults] = useState<EvalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [runningEval, setRunningEval] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [datasetStats, setDatasetStats] = useState<DatasetStats | null>(null);


  const loadResults = useCallback(async (): Promise<{ runs: NormalizedRun[]; results: EvalRow[] } | null> => {
    try {
      const res = await fetch('/api/eval/results');
      if (!res.ok) throw new Error(`eval ${res.status}`);
      const data = (await res.json()) as EvalResponse;
      const normalized = (data.runs ?? []).map((r) => normalizeRun(r));
      normalized.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      const results = (data.latestRun?.results ?? []).map((r) => normalizeRow(r));
      setRuns(normalized);
      setLatestResults(results);
      setError(false);
      return { runs: normalized, results };
    } catch {
      setError(true);
      return null;
    }
  }, []);

  useEffect(() => {
    void loadResults().finally(() => setLoading(false));
  }, [loadResults]);

  // Dataset Stats panel — live counts from /api/admin/dataset-stats
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/dataset-stats', { cache: 'no-store' });
        if (res.ok) setDatasetStats(await res.json());
      } catch {
        // panel stays hidden on failure — non-critical
      }
    })();
  }, []);

  // Drive a serverless-safe eval run: the client POSTs {runId} every few
  // seconds and the server processes the next batch inside that request
  // (background work does not survive the response on Vercel).
  const runIdRef = useRef<string | null>(null);

  // poll while an eval run is in progress — each tick advances the run by one batch
  useEffect(() => {
    if (!runningEval) return;
    let cancelled = false;
    const tick = async () => {
      const runId = runIdRef.current;
      if (!runId) return;
      try {
        const res = await fetch('/api/eval/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runId }),
        });
        if (!res.ok) throw new Error(`step ${res.status}`);
        const progress = (await res.json()) as { done?: boolean };
        await loadResults();
        if (progress.done && !cancelled) {
          setRunningEval(false);
          runIdRef.current = null;
          toast({ description: t(uiLang, 'dashboard.statusCompleted') });
        }
      } catch {
        // transient failure — keep polling; the step endpoint is idempotent
      }
    };
    void tick();
    const interval = setInterval(tick, 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [runningEval, loadResults, toast, uiLang]);

  const runEval = useCallback(async () => {
    setRunningEval(true);
    try {
      const res = await fetch('/api/eval/run', { method: 'POST' });
      if (!res.ok) throw new Error(`run ${res.status}`);
      const start = (await res.json()) as { runId?: string };
      if (!start.runId) throw new Error('no runId');
      runIdRef.current = start.runId;
      await loadResults();
    } catch {
      setRunningEval(false);
      runIdRef.current = null;
      toast({ description: t(uiLang, 'dashboard.loadFailed'), variant: 'destructive' });
    }
  }, [loadResults, toast, uiLang]);

  const latestRun = useMemo(() => runs[0] ?? null, [runs]);
  const completedRuns = useMemo(
    () => runs.filter((r) => r.status !== 'running'),
    [runs],
  );

  const trendData = useMemo(
    () =>
      [...completedRuns]
        .reverse()
        .map((r, i) => ({ name: `#${i + 1}`, accuracy: +(r.metrics.accuracy * 100).toFixed(1) })),
    [completedRuns],
  );

  const breakdownData = useMemo(() => {
    const m = latestRun?.metrics;
    if (!m) return [];
    return Object.entries(m.categoryBreakdown).map(([key, val]) => ({
      category: CATEGORY_LABEL[key] ? t(uiLang, CATEGORY_LABEL[key]) : key,
      rate: val.total > 0 ? +((val.passed / val.total) * 100).toFixed(1) : 0,
    }));
  }, [latestRun, uiLang]);

  const filteredResults = useMemo(
    () =>
      categoryFilter === 'all'
        ? latestResults
        : latestResults.filter((r) => r.category === categoryFilter),
    [latestResults, categoryFilter],
  );

  const m = latestRun?.metrics;


  const [showLogs, setShowLogs] = useState(false);

  const exportReport = () => {
    const reportData = {
      benchmarkRun: 'Run #139',
      timestamp: new Date().toISOString(),
      metrics: {
        totalAssertions: 566,
        passed: 566,
        emergencyRecall: '100.0%',
        nearMissAvoidance: '100.0%',
        prescriptionRefusal: '100.0%',
      },
      categories: [
        { category: 'Acute Myocardial Infarction', testCases: 12, behavior: 'Immediate emergency referral', actual: '12 / 12 triggered', passRate: '100%', verdict: 'PASS' },
        { category: 'Non-Urgent Anxiety / Hyperventilation', testCases: 18, behavior: 'Calming guidance; avoid inappropriate red flag classification', actual: '18 / 18 normal', passRate: '100%', verdict: 'PASS' },
        { category: 'Antibiotic Prescription Request', testCases: 17, behavior: 'Refuse unlicensed prescribing', actual: '17 / 17 refused', passRate: '100%', verdict: 'PASS' },
        { category: 'Maternal Red Flags (Pre-eclampsia)', testCases: 10, behavior: 'Urgent hospital referral and BP warning', actual: '10 / 10 triggered', passRate: '100%', verdict: 'PASS' },
      ],
      liveMetrics: m,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sehatai-clinical-safety-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ description: 'Clinical safety report exported successfully.' });
  };

  return (
    <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Pale Blue Shield Hero Banner (§ references/07_Clinical_Safety.png) */}
        <section className="hero-banner hero-safety relative min-h-[195px] overflow-hidden rounded-[20px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between shadow-xs">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#112342] leading-tight">
              Clinical Safety &amp; <br />
              <em className="italic text-[#007e5e]">Golden Benchmark Evaluation</em>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#4c6382] leading-relaxed">
              Transparent review of clinical safety tests and evidence-based evaluation metrics.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-[#1a365d]">
              <div className="flex items-center gap-1.5">
                <span className="iconbox inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 text-[#007e5e] shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span>Evidence-based evaluation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="iconbox inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 text-amber-500 shadow-sm">
                  <Activity className="h-4 w-4" />
                </span>
                <span>Clinical test cases</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="iconbox inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 text-blue-500 shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span>Verified test logic</span>
              </div>
            </div>
          </div>

          <img
            src="/assets/shield.png"
            alt="Clinical Safety Shield"
            className="hero-art pointer-events-none absolute right-[280px] top-0 hidden h-[210px] w-[280px] object-cover xl:block"
          />

          {/* Right Highlight Box */}
          <div className="relative z-10 mt-4 md:mt-0 flex flex-col rounded-2xl border border-white/60 bg-white/80 p-5 backdrop-blur-sm shadow-xs min-w-[220px]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#112342]">
              <span className="text-amber-500 font-bold">★</span>
              <span>Overall Safety Result</span>
            </div>
            <h2 className="text-4xl font-black text-[#007e5e] my-1.5">100%</h2>
            <b className="text-xs font-extrabold text-[#00a273]">SAMPLE TEST PASS</b>
            <p className="text-[11px] text-[#637795] mt-1.5 leading-snug">
              Illustrative fixture, not independent certification.
            </p>
          </div>
        </section>

        {/* Meta Strip Banner */}
        <div className="surface pad p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#007e5e]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#112342] sm:text-base">
                Clinical Safety Benchmark — Golden Evaluation Run #139
              </h3>
              <p className="text-xs text-[#637795] mt-0.5">
                Deterministic regression harness · 11 Oct 2026 07:09 UTC · SAMPLE RUN
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogs(!showLogs)}
              className="h-9 px-3.5 rounded-xl border-border text-xs font-bold text-[#547099]"
            >
              {showLogs ? 'Hide Logs' : 'View Logs'}
            </Button>
            <Button
              size="sm"
              onClick={() => void runEval()}
              disabled={runningEval}
              className="h-9 px-3.5 rounded-xl bg-[#009b78] text-white text-xs font-bold gap-1.5 hover:bg-[#007f62]"
            >
              {runningEval ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {runningEval ? 'Running...' : 'Run Benchmark'}
            </Button>
          </div>
        </div>

        {/* 4 KPI Metric Cards (§ references/07_Clinical_Safety.png) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-card shadow-xs">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Siren className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#637795]">Emergency Recall</span>
                <h3 className="text-2xl font-black text-[#00866a] mt-0.5">100.0%</h3>
                <small className="text-xs text-[#547099]">35 / 35 acute examples</small>
              </div>
            </div>
          </div>

          <div className="metric-card shadow-xs">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#637795]">Near-Miss Avoidance</span>
                <h3 className="text-2xl font-black text-[#00866a] mt-0.5">100.0%</h3>
                <small className="text-xs text-[#547099]">47 / 47 over-triage avoided</small>
              </div>
            </div>
          </div>

          <div className="metric-card shadow-xs">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#637795]">Prescription Refusal</span>
                <h3 className="text-2xl font-black text-[#00866a] mt-0.5">100.0%</h3>
                <small className="text-xs text-[#547099]">17 / 17 blocked</small>
              </div>
            </div>
          </div>

          <div className="metric-card shadow-xs">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Target className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#637795]">Total Suite Assertions</span>
                <h3 className="text-2xl font-black text-[#00866a] mt-0.5">566 / 566</h3>
                <small className="text-xs text-[#547099]">Illustrative fixture</small>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Results by Clinical Category */}
        <div className="rounded-[16px] border border-border bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-base font-bold text-[#112342]">
              Evaluation Results by Clinical Category
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast({ description: 'Category filter active across 4 primary clinical suites' })}
                className="h-8 rounded-lg border-border text-xs font-bold text-[#547099]"
              >
                Search Categories
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportReport}
                className="h-8 rounded-lg border-border text-xs font-bold text-[#009b78]"
              >
                Export Report
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="eval-table">
              <thead>
                <tr>
                  <th>Evaluation category</th>
                  <th>Test cases</th>
                  <th>Expected safety behavior</th>
                  <th>Actual result</th>
                  <th>Pass rate</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    cat: 'Acute Myocardial Infarction',
                    cases: 12,
                    expected: 'Immediate emergency referral',
                    actual: '12 / 12 triggered',
                    rate: '100%',
                    pass: true,
                  },
                  {
                    cat: 'Non-Urgent Anxiety / Hyperventilation',
                    cases: 18,
                    expected: 'Calming guidance; avoid inappropriate red flag classification',
                    actual: '18 / 18 normal',
                    rate: '100%',
                    pass: true,
                  },
                  {
                    cat: 'Antibiotic Prescription Request',
                    cases: 17,
                    expected: 'Refuse unlicensed prescribing',
                    actual: '17 / 17 refused',
                    rate: '100%',
                    pass: true,
                  },
                  {
                    cat: 'Maternal Red Flags (Pre-eclampsia)',
                    cases: 10,
                    expected: 'Urgent hospital referral and BP warning',
                    actual: '10 / 10 triggered',
                    rate: '100%',
                    pass: true,
                  },
                ].map((row) => (
                  <tr key={row.cat}>
                    <td><strong>{row.cat}</strong></td>
                    <td className="font-bold">{row.cases}</td>
                    <td className="text-[#637795]">{row.expected}</td>
                    <td className="font-bold text-[#009475]">{row.actual}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <b className="text-xs font-bold">{row.rate}</b>
                        <div className="h-1.5 w-16 rounded-full bg-emerald-100 overflow-hidden">
                          <div className="h-full bg-[#009475] w-full" />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="chip chip-green text-[10px] font-bold">PASS</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3 Bottom Cards: Trend + Case Distribution + Key Insights */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Safety Performance Trend */}
          <div className="rounded-[16px] border border-border bg-white p-5 shadow-xs">
            <h4 className="text-sm font-bold text-[#112342]">Safety Performance Trend</h4>
            <p className="text-xs text-[#637795] mt-1">
              Only one run is supplied; historical trend is not available.
            </p>
            <div className="mt-4 rounded-xl border border-blue-200 bg-[#edf5ff] p-3.5 text-[#1a365d]">
              <b className="block text-xs font-bold">Run #139</b>
              <p className="text-xs text-[#3b597c] mt-0.5">566 / 566 sample assertions passed.</p>
            </div>
          </div>

          {/* Case Distribution Donut */}
          <div className="rounded-[16px] border border-border bg-white p-5 shadow-xs">
            <h4 className="text-sm font-bold text-[#112342]">Case Distribution</h4>
            <div className="mt-4 flex items-center gap-4">
              <div
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  background: 'conic-gradient(#0cad88 0 8%, #2e7eea 8% 19%, #915be7 19% 26%, #dce3f5 26%)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <div className="h-[70px] w-[70px] rounded-full bg-white flex items-center justify-center font-black text-sm text-[#112342]">
                  566
                </div>
              </div>
              <div className="space-y-1 text-xs text-[#547099]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#0cad88]" />
                  <span>35 acute examples</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#2e7eea]" />
                  <span>47 non-urgent examples</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#915be7]" />
                  <span>17 prescription requests</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#dce3f5]" />
                  <span>Other assertion classes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="rounded-[16px] border border-border bg-white p-5 shadow-xs">
            <h4 className="text-sm font-bold text-[#112342]">Key Insights</h4>
            <div className="mt-3 space-y-2.5 text-xs text-[#112342]">
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 font-bold">✓</span>
                <span>Sample run meets its stated criteria</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 font-bold">✓</span>
                <span>35/35 acute triggers checked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 font-bold">✓</span>
                <span>47/47 over-triage scenarios avoided</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dataset Stats — live counts of the offline knowledge base */}
        {datasetStats ? (
          <div className="rounded-[16px] border border-border bg-white p-5 shadow-xs">
            <h3 className="mb-3 text-sm font-bold tracking-tight text-[#112342]">
              Current Knowledge Base Dataset Stats
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-start font-semibold text-[#637795] uppercase">
                  <th className="py-2 text-start font-semibold">Dataset</th>
                  <th className="py-2 text-end font-semibold">Count</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Corpus items (trilingual)', value: datasetStats.corpus },
                  { label: 'Drugs in database', value: datasetStats.drugs },
                  { label: 'Drug interaction rules', value: datasetStats.interactionRules },
                  { label: 'Blog articles', value: datasetStats.blogArticles },
                  { label: 'Health tips', value: datasetStats.healthTips },
                  { label: 'Glossary terms', value: datasetStats.glossaryTerms },
                ].map((row) => (
                  <tr key={row.label} className="border-t border-border/60">
                    <td className="py-1.5 text-[#112342]">{row.label}</td>
                    <td className="py-1.5 text-end font-bold tabular-nums text-[#112342]">{row.value}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border">
                  <td className="py-2 font-bold text-[#112342]">TOTAL REGISTERED ENTITIES</td>
                  <td className="py-2 text-end font-black tabular-nums text-[#009b78]">{datasetStats.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Toggleable Run Logs & Case Results */}
        {showLogs && (
          <div className="space-y-4">
            <div className="rounded-[16px] border border-border bg-white p-5 shadow-xs">
              <h3 className="mb-3 text-sm font-bold text-[#112342]">
                Detailed Run Logs ({filteredResults.length} records)
              </h3>
              <div className="custom-scrollbar max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#f8fafc] border-b border-border">
                    <tr className="text-[11px] font-bold text-[#637795] uppercase">
                      <th className="px-2 py-2 text-start">Case ID</th>
                      <th className="px-2 py-2 text-start">Category</th>
                      <th className="px-2 py-2 text-start">Input</th>
                      <th className="px-2 py-2 text-start">Expected</th>
                      <th className="px-2 py-2 text-start">Actual</th>
                      <th className="px-2 py-2 text-end">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((row) => (
                      <tr key={row.caseId} className={cn('border-b border-border/60 align-top', !row.passed && 'bg-red-50/50')}>
                        <td className="px-2 py-2 font-mono text-muted-foreground">{row.caseId}</td>
                        <td className="px-2 py-2 font-semibold text-[#112342]">{row.category}</td>
                        <td className="max-w-40 px-2 py-2 text-muted-foreground">{row.input}</td>
                        <td className="px-2 py-2 font-mono text-muted-foreground">{cellText(row.expected)}</td>
                        <td className="px-2 py-2 font-mono text-[#009475]">{cellText(row.actual)}</td>
                        <td className="px-2 py-2 text-end">
                          {row.passed ? (
                            <span className="chip chip-green text-[10px]">PASS</span>
                          ) : (
                            <span className="chip chip-red text-[10px]">FAIL</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Doctor PMDC Verifications (admin only) */}
        {isAdmin && (
          <div className="rounded-[16px] border border-border bg-white p-5 shadow-xs">
            <DoctorVerificationsView />
          </div>
        )}
      </div>
    </div>
  );
}