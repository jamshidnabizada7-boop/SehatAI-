'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Lock,
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
import { Input } from '@/components/ui/input';
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
const UNLOCK_KEY = 'sehatai.evalUnlocked';

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

// ---------- access gate (Phase 0 W5 fix: server-side role check, no client passcode) ----------

function PasscodeGate({ lang, onUnlock }: { lang: Lang; onUnlock: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const tryUnlock = async () => {
    setChecking(true);
    try {
      // Server-side check: user must be authenticated with role 'admin'.
      // The passcode field is now just a confirmation prompt (UX preserved),
      // but the real gate is the session role. Any value works for an admin user.
      const res = await fetch('/api/eval/access', { method: 'POST' });
      if (res.ok) {
        try {
          sessionStorage.setItem(UNLOCK_KEY, '1');
        } catch {
          // session storage blocked — stay unlocked for this render only
        }
        onUnlock();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-7 w-7 text-primary" aria-hidden />
          </span>
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {t(lang, 'dashboard.admin')}
          </p>
          <h1 className="text-lg font-bold text-foreground">{t(lang, 'dashboard.lockTitle')}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(lang, 'dashboard.lockDesc')}
          </p>
        </div>
        <div className="space-y-2">
          <Input
            type="password"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
            placeholder={t(lang, 'dashboard.passcode')}
            aria-label={t(lang, 'dashboard.passcode')}
            aria-invalid={error}
            className="min-h-11 text-center tracking-widest"
            dir="ltr"
          />
          {error ? (
            <p className="text-center text-xs font-medium text-red-600 dark:text-red-400">
              {t(lang, 'dashboard.wrongPasscode')}
            </p>
          ) : null}
          <Button
            onClick={tryUnlock}
            disabled={checking}
            className="min-h-11 w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {checking ? '…' : t(lang, 'dashboard.unlock')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
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
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);

  const [unlocked, setUnlocked] = useState(false);
  const [gateReady, setGateReady] = useState(false);

  const [runs, setRuns] = useState<NormalizedRun[]>([]);
  const [latestResults, setLatestResults] = useState<EvalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [runningEval, setRunningEval] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    try {
      setUnlocked(sessionStorage.getItem(UNLOCK_KEY) === '1');
    } catch {
      setUnlocked(false);
    }
    setGateReady(true);
  }, []);

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
    if (!unlocked) return;
    void loadResults().finally(() => setLoading(false));
  }, [unlocked, loadResults]);

  // poll while an eval run is in progress
  useEffect(() => {
    if (!runningEval) return;
    const interval = setInterval(async () => {
      const data = await loadResults();
      const stillRunning = (data?.runs ?? []).some(
        (r) => r.status === 'running' || r.status === 'pending',
      );
      if (!stillRunning) {
        setRunningEval(false);
        toast({ description: t(uiLang, 'dashboard.statusCompleted') });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [runningEval, loadResults, toast, uiLang]);

  const runEval = useCallback(async () => {
    setRunningEval(true);
    try {
      const res = await fetch('/api/eval/run', { method: 'POST' });
      if (!res.ok) throw new Error(`run ${res.status}`);
      await loadResults();
    } catch {
      setRunningEval(false);
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

  if (!gateReady) return null;

  if (!unlocked) {
    return <PasscodeGate lang={uiLang} onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {t(uiLang, 'dashboard.admin')}
            </p>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              {t(uiLang, 'dashboard.latest')}
            </h1>
          </div>
          <Button
            onClick={() => void runEval()}
            disabled={runningEval}
            className="min-h-11 gap-1.5 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            aria-label={t(uiLang, 'dashboard.runNow')}
          >
            {runningEval ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Play className="h-4 w-4" aria-hidden />
            )}
            {runningEval ? t(uiLang, 'dashboard.running') : t(uiLang, 'dashboard.runNow')}
          </Button>
        </div>

        {/* honesty banner */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <p className="text-sm leading-relaxed text-foreground/90">
            {t(uiLang, 'dashboard.banner')}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-red-50 px-6 py-10 text-center dark:bg-red-950/40">
            <p className="text-sm text-red-700 dark:text-red-300">
              {t(uiLang, 'dashboard.loadFailed')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadResults()}
              className="h-10 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300"
            >
              {t(uiLang, 'facilities.retry')}
            </Button>
          </div>
        ) : !latestRun ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
            <FlaskConical className="h-10 w-10 text-primary" aria-hidden />
            <p className="max-w-sm text-sm text-muted-foreground">
              {t(uiLang, 'dashboard.noRuns')}
            </p>
          </div>
        ) : (
          <>
            {/* metric cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard
                label={t(uiLang, 'dashboard.metricAccuracy')}
                value={pct(m?.accuracy ?? 0)}
                good={(m?.accuracy ?? 0) >= 0.9}
                delay={0}
                icon={Target}
              />
              <MetricCard
                label={t(uiLang, 'dashboard.metricEmergencyRecall')}
                value={pct(m?.emergencyRecall ?? 0)}
                good={(m?.emergencyRecall ?? 0) >= 0.95}
                delay={0.04}
                icon={Siren}
              />
              <MetricCard
                label={t(uiLang, 'dashboard.metricUnderTriage')}
                value={pct(m?.underTriageRate ?? 0)}
                good={(m?.underTriageRate ?? 1) <= 0.05}
                delay={0.08}
                icon={TrendingDown}
              />
              <MetricCard
                label={t(uiLang, 'dashboard.metricFalsePositive')}
                value={pct(m?.falsePositiveRate ?? 0)}
                delay={0.12}
                icon={ShieldQuestion}
              />
              <MetricCard
                label={t(uiLang, 'dashboard.metricRefusal')}
                value={pct(m?.refusalCorrectness ?? 0)}
                delay={0.16}
                icon={BadgeCheck}
              />
              <MetricCard
                label={t(uiLang, 'dashboard.metricCitation')}
                value={pct(m?.citationRate ?? 0)}
                delay={0.2}
                icon={Link2}
              />
              <MetricCard
                label={t(uiLang, 'dashboard.metricLatencyP50')}
                value={`${Math.round(m?.latencyP50 ?? 0)}ms`}
                delay={0.24}
                icon={Gauge}
              />
              <MetricCard
                label={t(uiLang, 'dashboard.metricLatencyP95')}
                value={`${Math.round(m?.latencyP95 ?? 0)}ms`}
                delay={0.28}
                icon={Activity}
              />
            </div>

            {/* trend + breakdown charts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <Activity className="h-4 w-4 text-primary" aria-hidden />
                  {t(uiLang, 'dashboard.trend')}
                </h2>
                <div className="h-48" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid stroke="rgba(120,113,108,0.2)" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: '#78716c' }}
                        tickFormatter={(v: number) => `${v}%`}
                      />
                      <Tooltip
                        formatter={(v: number | string) => [`${v}%`, 'Accuracy']}
                        contentStyle={{ fontSize: 12, borderRadius: 12 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#059669"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#059669' }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <BarChart3 className="h-4 w-4 text-primary" aria-hidden />
                  {t(uiLang, 'dashboard.categoryBreakdown')}
                </h2>
                <div className="h-48" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdownData}>
                      <CartesianGrid stroke="rgba(120,113,108,0.2)" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="category"
                        tick={{ fontSize: 10, fill: '#78716c' }}
                        interval={0}
                        angle={-18}
                        textAnchor="end"
                        height={44}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: '#78716c' }}
                        tickFormatter={(v: number) => `${v}%`}
                      />
                      <Tooltip
                        formatter={(v: number | string) => [`${v}%`, 'Pass rate']}
                        contentStyle={{ fontSize: 12, borderRadius: 12 }}
                      />
                      <Bar dataKey="rate" fill="#d97706" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* run history */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-foreground">
                {t(uiLang, 'dashboard.history')}
              </h2>
              <div className="custom-scrollbar max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-start text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                      <th className="px-2 py-2 text-start">{t(uiLang, 'dashboard.colStarted')}</th>
                      <th className="px-2 py-2 text-end">{t(uiLang, 'dashboard.colTotal')}</th>
                      <th className="px-2 py-2 text-end">{t(uiLang, 'dashboard.colPassed')}</th>
                      <th className="px-2 py-2 text-end">{t(uiLang, 'dashboard.colDuration')}</th>
                      <th className="px-2 py-2 text-start">{t(uiLang, 'dashboard.colStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((r) => (
                      <tr key={r.id} className="border-b border-border/60 last:border-0">
                        <td className="px-2 py-2 text-start text-muted-foreground" dir="ltr">
                          {new Date(r.startedAt).toLocaleString()}
                        </td>
                        <td className="px-2 py-2 text-end tabular-nums">{r.metrics.total}</td>
                        <td className="px-2 py-2 text-end font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                          {r.metrics.passed}
                        </td>
                        <td className="px-2 py-2 text-end tabular-nums" dir="ltr">
                          {r.durationMs != null
                            ? `${(r.durationMs / 1000).toFixed(1)}${t(uiLang, 'dashboard.seconds')}`
                            : '—'}
                        </td>
                        <td className="px-2 py-2 text-start">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                              r.status === 'running'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                : r.status === 'failed'
                                  ? 'bg-red-600/10 text-red-700 dark:text-red-400'
                                  : 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
                            )}
                          >
                            {r.status === 'running'
                              ? t(uiLang, 'dashboard.statusRunning')
                              : r.status === 'failed'
                                ? t(uiLang, 'dashboard.statusFailed')
                                : t(uiLang, 'dashboard.statusCompleted')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* latest run case results */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-foreground">
                {t(uiLang, 'dashboard.results')}
              </h2>
              <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="mb-3">
                <TabsList className="custom-scrollbar h-auto max-w-full flex-wrap justify-start gap-1 overflow-x-auto">
                  <TabsTrigger value="all" className="h-8 min-h-8 text-xs">
                    {t(uiLang, 'dashboard.filterAll')}
                  </TabsTrigger>
                  {Object.entries(CATEGORY_LABEL).map(([key, labelKey]) => (
                    <TabsTrigger key={key} value={key} className="h-8 min-h-8 text-xs">
                      {t(uiLang, labelKey)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="custom-scrollbar max-h-96 overflow-y-auto">
                {filteredResults.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">—</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-border text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        <th className="px-2 py-2 text-start">{t(uiLang, 'dashboard.colCase')}</th>
                        <th className="px-2 py-2 text-start">{t(uiLang, 'dashboard.colCategory')}</th>
                        <th className="px-2 py-2 text-start">{t(uiLang, 'dashboard.colInput')}</th>
                        <th className="px-2 py-2 text-start">{t(uiLang, 'dashboard.colExpected')}</th>
                        <th className="px-2 py-2 text-start">{t(uiLang, 'dashboard.colActual')}</th>
                        <th className="px-2 py-2 text-end">{t(uiLang, 'dashboard.colResult')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((row) => (
                        <tr
                          key={row.caseId}
                          className={cn(
                            'border-b border-border/60 align-top last:border-0',
                            !row.passed && 'bg-red-500/5',
                          )}
                        >
                          <td className="px-2 py-2 font-mono text-xs text-muted-foreground" dir="ltr">
                            {row.caseId}
                          </td>
                          <td className="px-2 py-2 text-xs">
                            {CATEGORY_LABEL[row.category]
                              ? t(uiLang, CATEGORY_LABEL[row.category])
                              : row.category}
                          </td>
                          <td className="max-w-40 px-2 py-2 text-xs" dir="auto">
                            <span className="line-clamp-2">{row.input}</span>
                          </td>
                          <td className="px-2 py-2 font-mono text-xs" dir="ltr">
                            {cellText(row.expected)}
                          </td>
                          <td className="px-2 py-2 font-mono text-xs" dir="ltr">
                            {cellText(row.actual)}
                          </td>
                          <td className="px-2 py-2 text-end">
                            {row.passed ? (
                              <CheckCircle2
                                className="ms-auto h-4 w-4 text-emerald-600"
                                aria-label={t(uiLang, 'dashboard.pass')}
                              />
                            ) : (
                              <XCircle
                                className="ms-auto h-4 w-4 text-red-600 dark:text-red-400"
                                aria-label={t(uiLang, 'dashboard.fail')}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {/* Doctor PMDC Verifications (admin only) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <DoctorVerificationsView />
        </div>
      </div>
    </div>
  );
}
