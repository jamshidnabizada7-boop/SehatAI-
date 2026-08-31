'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Cpu,
  Gauge,
  History,
  Loader2,
  Lock,
  RefreshCw,
  Server,
  ShieldAlert,
  Timer,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Lang } from '@/lib/types';

// ---------- metrics shape (matches /api/observability/metrics output) ----------

interface MetricsSnapshot {
  startedAt: string;
  uptimeSec: number;
  totalRuns: number;
  triageCounts: Record<string, number>;
  confidenceBands: Record<string, number>;
  engineCounts: Record<string, number>;
  injectionAttempts: number;
  drugCheckSeverity: Record<string, number>;
  latency: {
    count: number;
    avgMs: number;
    p50: number;
    p95: number;
    max: number;
  };
  errors: number;
  errorRate: number;
  system: {
    memoryMB: number;
    heapUsedMB: number;
    heapTotalMB: number;
    uptimeSec: number;
    nodeVersion: string;
  };
  generatedAt: string;
}

const TRIAGE_COLORS: Record<string, string> = {
  EMERGENCY: '#dc2626', // red-600
  URGENT: '#f97316', // orange-500
  ROUTINE: '#facc15', // yellow-400
  SELF_CARE: '#059669', // emerald-600 (primary)
  INFORMATIONAL: '#6b7280', // gray-500
};

const CONFIDENCE_COLORS: Record<string, string> = {
  HIGH: '#059669',
  MEDIUM: '#f59e0b',
  LOW: '#dc2626',
};

const DRUG_COLORS: Record<string, string> = {
  HIGH: '#dc2626',
  MODERATE: '#f59e0b',
  LOW: '#facc15',
  NONE: '#9ca3af',
};

function formatUptime(sec: number, lang: Lang): string {
  if (!sec || sec < 1) return '0s';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

// ---------- KPI card ----------

function KpiCard({
  label,
  value,
  sub,
  good,
  delay,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
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
      {sub ? <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p> : null}
    </motion.div>
  );
}

// ---------- chart card wrapper ----------

function ChartCard({
  title,
  lang,
  children,
}: {
  title: string;
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-foreground">{title}</h3>
      <div className={cn(lang === 'ur' && 'font-urdu')}>{children}</div>
    </div>
  );
}

// ---------- access gate ----------

function NotAdminCard({ lang }: { lang: Lang }) {
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
            {t(lang, 'nav.observability')}
          </p>
          <h1 className="text-lg font-bold text-foreground">
            {t(lang, 'observability.notAdminTitle')}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(lang, 'observability.notAdminBody')}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ---------- main view ----------

export function ObservabilityView() {
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const setView = useAppStore((s) => s.setView);

  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin';

  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMetrics = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch('/api/observability/metrics', { cache: 'no-store' });
      if (!res.ok) throw new Error(`metrics ${res.status}`);
      const data = (await res.json()) as MetricsSnapshot;
      setMetrics(data);
      setError(false);
      setLastUpdated(Date.now());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // initial + role-gated load
  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    void loadMetrics();
  }, [status, isAdmin, loadMetrics]);

  // auto-refresh every 10s (admin only)
  useEffect(() => {
    if (status !== 'authenticated' || !isAdmin) return;
    refreshTimer.current = setInterval(() => {
      void loadMetrics(true);
    }, 10_000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [status, isAdmin, loadMetrics]);

  const resetMetrics = useCallback(async () => {
    if (!isAdmin) return;
    const confirmed =
      typeof window !== 'undefined'
        ? window.confirm(t(uiLang, 'observability.resetConfirm'))
        : true;
    if (!confirmed) return;
    setResetting(true);
    try {
      const res = await fetch('/api/observability/metrics?action=reset', { method: 'POST' });
      if (!res.ok) throw new Error(`reset ${res.status}`);
      await loadMetrics();
      toast({ description: t(uiLang, 'observability.resetSuccess') });
    } catch {
      toast({ description: t(uiLang, 'observability.resetFailed'), variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  }, [isAdmin, uiLang, loadMetrics, toast]);

  const triageData = useMemo(() => {
    if (!metrics) return [];
    const counts = metrics.triageCounts ?? {};
    return Object.entries(counts)
      .filter(([, v]) => typeof v === 'number')
      .map(([k, v]) => ({ name: k, value: v }));
  }, [metrics]);

  const confidenceData = useMemo(() => {
    if (!metrics) return [];
    const counts = metrics.confidenceBands ?? {};
    return (['HIGH', 'MEDIUM', 'LOW'] as const)
      .map((k) => ({ name: k, value: counts[k] ?? 0 }));
  }, [metrics]);

  const engineData = useMemo(() => {
    if (!metrics) return [];
    const counts = metrics.engineCounts ?? {};
    const labelMap: Record<string, 'observability.engineL0' | 'observability.engineL1' | 'observability.engineCombined' | 'observability.engineOffline' | 'observability.engineFallback'> = {
      L0: 'observability.engineL0',
      L1: 'observability.engineL1',
      combined: 'observability.engineCombined',
      offline: 'observability.engineOffline',
      fallback: 'observability.engineFallback',
    };
    return Object.entries(counts)
      .filter(([, v]) => typeof v === 'number')
      .map(([k, v]) => ({
        name: labelMap[k] ? t(uiLang, labelMap[k]) : k,
        value: v,
        raw: k,
      }));
  }, [metrics, uiLang]);

  const drugData = useMemo(() => {
    if (!metrics) return [];
    const counts = metrics.drugCheckSeverity ?? {};
    return (['HIGH', 'MODERATE', 'LOW', 'NONE'] as const)
      .map((k) => ({
        name: k === 'NONE' ? t(uiLang, 'observability.severityNone') : k,
        value: counts[k] ?? 0,
        raw: k,
      }));
  }, [metrics, uiLang]);

  // Loading / session states
  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (status !== 'authenticated' || !isAdmin) {
    return <NotAdminCard lang={uiLang} />;
  }

  if (loading) {
    return (
      <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-5">
          <Skeleton className="h-16 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {t(uiLang, 'nav.observability')}
            </p>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              {t(uiLang, 'observability.title')}
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t(uiLang, 'observability.subtitle')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadMetrics()}
              disabled={refreshing}
              className="h-10 gap-1.5"
              aria-label={t(uiLang, 'observability.refresh')}
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} aria-hidden />
              <span className="hidden sm:inline">{t(uiLang, 'observability.refresh')}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void resetMetrics()}
              disabled={resetting}
              className="h-10 gap-1.5 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
              aria-label={t(uiLang, 'observability.reset')}
            >
              {resetting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <History className="h-4 w-4" aria-hidden />
              )}
              <span className="hidden sm:inline">{t(uiLang, 'observability.reset')}</span>
            </Button>
          </div>
        </div>

        {/* error banner */}
        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            {t(uiLang, 'observability.loadFailed')}
          </div>
        ) : null}

        {/* last updated + auto-refresh hint */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3 w-3" aria-hidden />
            {t(uiLang, 'observability.autoRefresh')}
          </span>
          {lastUpdated ? (
            <span suppressHydrationWarning>
              {t(uiLang, 'observability.lastUpdated')}: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          ) : null}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label={t(uiLang, 'observability.kpiTotalRuns')}
            value={String(metrics?.totalRuns ?? 0)}
            sub={t(uiLang, 'observability.unitsRuns')}
            good
            delay={0}
            icon={TrendingUp}
          />
          <KpiCard
            label={t(uiLang, 'observability.kpiErrorRate')}
            value={pct(metrics?.errorRate ?? 0)}
            sub={`${metrics?.errors ?? 0} ${t(uiLang, 'observability.unitsErrors')}`}
            good={(metrics?.errorRate ?? 0) < 0.05}
            delay={0.05}
            icon={ShieldAlert}
          />
          <KpiCard
            label={t(uiLang, 'observability.kpiAvgLatency')}
            value={`${metrics?.latency?.avgMs ?? 0}`}
            sub={t(uiLang, 'observability.unitsMs')}
            good={(metrics?.latency?.avgMs ?? 0) < 5000}
            delay={0.1}
            icon={Timer}
          />
          <KpiCard
            label={t(uiLang, 'observability.kpiP95Latency')}
            value={`${metrics?.latency?.p95 ?? 0}`}
            sub={t(uiLang, 'observability.unitsMs')}
            good={(metrics?.latency?.p95 ?? 0) < 15000}
            delay={0.15}
            icon={Gauge}
          />
        </div>

        {/* injection attempts banner (warning style if > 0) */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className={cn(
            'flex items-start gap-2.5 rounded-2xl border p-4',
            (metrics?.injectionAttempts ?? 0) > 0
              ? 'border-amber-500/40 bg-amber-50 dark:bg-amber-950/40'
              : 'border-border bg-card',
          )}
        >
          <ShieldAlert
            className={cn(
              'mt-0.5 h-5 w-5 shrink-0',
              (metrics?.injectionAttempts ?? 0) > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground',
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">
              {t(uiLang, 'observability.injectionAttempts')}
            </p>
            <p className="text-2xl font-extrabold tabular-nums text-foreground">
              {metrics?.injectionAttempts ?? 0}
            </p>
            {(metrics?.injectionAttempts ?? 0) > 0 ? (
              <p className="mt-0.5 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                {t(uiLang, 'observability.injectionAttemptsWarn')}
              </p>
            ) : null}
          </div>
        </motion.div>

        {/* charts grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* triage distribution donut */}
          <ChartCard title={t(uiLang, 'observability.triageDist')} lang={uiLang}>
            {triageData.length === 0 || triageData.every((d) => d.value === 0) ? (
              <p className="py-10 text-center text-xs text-muted-foreground">—</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={triageData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {triageData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={TRIAGE_COLORS[entry.name] ?? '#9ca3af'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border) / 0.5)',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* confidence bands */}
          <ChartCard title={t(uiLang, 'observability.confidenceBands')} lang={uiLang}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={confidenceData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border) / 0.4)" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border) / 0.5)',
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {confidenceData.map((entry) => (
                    <Cell key={entry.name} fill={CONFIDENCE_COLORS[entry.name] ?? '#9ca3af'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* engine distribution */}
          <ChartCard title={t(uiLang, 'observability.engineDist')} lang={uiLang}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={engineData} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.4)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  height={48}
                />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border) / 0.5)',
                  }}
                />
                <Bar dataKey="value" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* drug severity distribution */}
          <ChartCard title={t(uiLang, 'observability.drugSeverity')} lang={uiLang}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={drugData} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.4)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border) / 0.5)',
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {drugData.map((entry) => (
                    <Cell key={entry.raw} fill={DRUG_COLORS[entry.raw] ?? '#9ca3af'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* system stats footer card */}
        <ChartCard title={t(uiLang, 'observability.systemStats')} lang={uiLang}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-background/60 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                <Cpu className="h-3 w-3" aria-hidden />
                {t(uiLang, 'observability.memory')}
              </div>
              <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                {metrics?.system?.memoryMB ?? 0}
                <span className="ms-1 text-xs font-normal text-muted-foreground">MB</span>
              </p>
            </div>
            <div className="rounded-xl bg-background/60 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                <Server className="h-3 w-3" aria-hidden />
                {t(uiLang, 'observability.heap')}
              </div>
              <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                {metrics?.system?.heapUsedMB ?? 0}
                <span className="ms-1 text-xs font-normal text-muted-foreground">/ {metrics?.system?.heapTotalMB ?? 0} MB</span>
              </p>
            </div>
            <div className="rounded-xl bg-background/60 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                <Zap className="h-3 w-3" aria-hidden />
                {t(uiLang, 'observability.uptime')}
              </div>
              <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                {formatUptime(metrics?.system?.uptimeSec ?? 0, uiLang)}
              </p>
            </div>
            <div className="rounded-xl bg-background/60 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                <Activity className="h-3 w-3" aria-hidden />
                {t(uiLang, 'observability.nodeVersion')}
              </div>
              <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                {metrics?.system?.nodeVersion ?? '—'}
              </p>
            </div>
          </div>
          {metrics?.startedAt ? (
            <p className="mt-3 text-[11px] text-muted-foreground">
              {t(uiLang, 'observability.startedAt')}: {new Date(metrics.startedAt).toLocaleString()}
            </p>
          ) : null}
        </ChartCard>

        {/* back-to-dashboard shortcut for admins */}
        <div className="pb-2 pt-1 text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setView('dashboard')}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← {t(uiLang, 'nav.dashboard')}
          </Button>
        </div>
      </div>
    </div>
  );
}
