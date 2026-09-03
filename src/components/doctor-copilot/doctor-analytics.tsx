'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Users, Calendar, Star, ShieldCheck, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  overview: { totalPatients: number; totalAppointments: number; totalReviews: number; avgRating: number; activeConsents: number; };
  triageDistribution: Record<string, number>;
  appointmentStats: { total: number; requested: number; confirmed: number; completed: number; declined: number; cancelled: number; };
  recentActivity: { action: string; resource: string | null; at: string; meta: unknown }[];
  upcomingAppointments: { id: string; patientName: string; scheduledAt: string; reason: string | null }[];
}

export function DoctorAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const r = await fetch('/api/doctor/analytics', { cache: 'no-store' }); if (r.ok) setData(await r.json()); } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="h-32 animate-pulse rounded-xl bg-card/50" />;
  if (!data) return <p className="text-sm text-muted-foreground">Failed to load analytics.</p>;

  const triageColors: Record<string, string> = { EMERGENCY: 'bg-red-500', URGENT: 'bg-orange-500', ROUTINE: 'bg-amber-500', SELF_CARE: 'bg-emerald-500' };
  const totalTriage = Object.values(data.triageDistribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-3">
      <div><h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><BarChart3 className="h-4 w-4 text-emerald-600" /> Analytics Dashboard</h3><p className="text-xs text-muted-foreground">Patient trends, triage distribution, appointment stats.</p></div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          { label: 'Patients', value: data.overview.totalPatients, icon: Users, color: 'text-primary' },
          { label: 'Appointments', value: data.overview.totalAppointments, icon: Calendar, color: 'text-emerald-600' },
          { label: 'Reviews', value: data.overview.totalReviews, icon: Star, color: 'text-amber-500' },
          { label: 'Rating', value: data.overview.avgRating + '★', icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Consents', value: data.overview.activeConsents, icon: ShieldCheck, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-2.5 text-center shadow-sm">
            <s.icon className={cn('mx-auto h-4 w-4', s.color)} />
            <p className="mt-1 text-lg font-black text-foreground">{s.value}</p>
            <p className="text-[9px] font-semibold text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Triage distribution */}
      <Card className="shadow-sm"><CardContent className="p-3">
        <p className="mb-2 text-xs font-bold text-foreground">Triage Distribution</p>
        <div className="space-y-1.5">
          {Object.entries(data.triageDistribution).map(([level, count]) => (
            <div key={level} className="flex items-center gap-2 text-xs">
              <span className="w-20 text-muted-foreground">{level}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full transition-all', triageColors[level] ?? 'bg-muted')} style={{ width: `${(count / totalTriage) * 100}%` }} />
              </div>
              <span className="w-8 text-right font-semibold text-foreground">{count}</span>
            </div>
          ))}
        </div>
      </CardContent></Card>

      {/* Appointment stats */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {[
          { label: 'Requested', value: data.appointmentStats.requested, color: 'bg-amber-500/15 text-amber-700' },
          { label: 'Confirmed', value: data.appointmentStats.confirmed, color: 'bg-emerald-500/15 text-emerald-700' },
          { label: 'Completed', value: data.appointmentStats.completed, color: 'bg-primary/15 text-primary' },
          { label: 'Declined', value: data.appointmentStats.declined, color: 'bg-red-500/15 text-red-700' },
          { label: 'Cancelled', value: data.appointmentStats.cancelled, color: 'bg-muted text-muted-foreground' },
          { label: 'Total', value: data.appointmentStats.total, color: 'bg-slate-500/15 text-slate-700' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border p-2 text-center">
            <p className="text-lg font-black text-foreground">{s.value}</p>
            <Badge className={cn('mt-0.5 text-[8px]', s.color)}>{s.label}</Badge>
          </div>
        ))}
      </div>

      {/* Upcoming appointments */}
      {data.upcomingAppointments.length > 0 && (
        <Card className="shadow-sm"><CardContent className="p-3">
          <p className="mb-2 text-xs font-bold text-foreground">Upcoming Appointments</p>
          <ul className="space-y-1">
            {data.upcomingAppointments.map(a => (
              <li key={a.id} className="flex items-center gap-2 text-xs">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold text-foreground">{a.patientName}</span>
                <span className="text-muted-foreground">{new Date(a.scheduledAt).toLocaleString()}</span>
                {a.reason && <span className="truncate text-muted-foreground">· {a.reason}</span>}
              </li>
            ))}
          </ul>
        </CardContent></Card>
      )}

      {/* Recent activity */}
      <Card className="shadow-sm"><CardContent className="p-3">
        <p className="mb-2 text-xs font-bold text-foreground">Recent Activity</p>
        <ul className="max-h-40 space-y-1 overflow-y-auto custom-scrollbar">
          {data.recentActivity.map((a, i) => (
            <li key={i} className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Activity className="h-2.5 w-2.5 shrink-0 text-primary" />
              <span className="font-semibold text-foreground/70">{a.action}</span>
              <span>· {new Date(a.at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </CardContent></Card>
    </div>
  );
}
