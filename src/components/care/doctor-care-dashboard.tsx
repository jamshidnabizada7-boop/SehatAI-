'use client';

// ============================================================
// Care Connect §73 — doctor dashboard: TODAY, waiting patients,
// earnings (ledger-derived wallet §13), services & fees config (§4),
// availability schedule (§46), go-online toggle (§47), payouts.
// Clinical work first, financials secondary.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { formatMoney } from '@/lib/care/money';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Wallet, Clock, Bell, CircleDot } from 'lucide-react';

type TFn = (key: Parameters<typeof t>[1]) => string;

interface Earnings {
  currency: string;
  availableMinor: number;
  pendingMinor: number;
  paidThisMonthMinor: number;
  lifetimePaidMinor: number;
  upcomingPayoutMinor: number;
}
interface ServiceRow { id: string; type: string; priceMinor: number; currency: string; durationMinutes: number; windowHours: number | null; enabled: boolean }
interface WindowRow { id: string; weekday: number; startMinute: number; endMinute: number; slotMinutes: number }
interface ConsultationRow { id: string; status: string; type: string; patient: { name: string }; updatedAt: string }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DoctorCareDashboard({ T, onOpenConsultation }: { T: TFn; onOpenConsultation: (id: string) => void }) {
  const langPref = useAppStore((s) => s.langPref);
  void resolveUiLang(langPref);

  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [schedule, setSchedule] = useState<WindowRow[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [onlineNow, setOnlineNow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newType, setNewType] = useState('TEXT');
  const [newPrice, setNewPrice] = useState('500');
  const [newWindow, setNewWindow] = useState<{ weekday: number; start: string; end: string }>({ weekday: 1, start: '09:00', end: '17:00' });

  const load = useCallback(async () => {
    try {
      const [e, s, a, c] = await Promise.all([
        fetch('/api/doctor/care/earnings').then((r) => r.json()).catch(() => ({})),
        fetch('/api/care/services').then((r) => r.json()).catch(() => ({})),
        fetch('/api/care/availability-manage').then((r) => r.json()).catch(() => ({})),
        fetch('/api/care/consultations?role=doctor').then((r) => r.json()).catch(() => ({})),
      ]);
      setEarnings(e.earnings ?? null);
      setServices(s.services ?? []);
      setSchedule(a.schedule ?? []);
      setOnlineNow(a.onlineNow === true);
      setConsultations(c.consultations ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function saveService() {
    await fetch('/api/care/services', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: newType, priceMajor: Number(newPrice), currency: 'PKR' }),
    });
    await load();
  }

  async function addWindow() {
    const [sh, sm] = newWindow.start.split(':').map(Number);
    const [eh, em] = newWindow.end.split(':').map(Number);
    await fetch('/api/care/availability-manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addWindow', weekday: newWindow.weekday, startMinute: sh * 60 + sm, endMinute: eh * 60 + em }),
    });
    await load();
  }

  async function toggleOnline() {
    await fetch('/api/care/availability-manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setOnlineNow', online: !onlineNow, minutes: 120 }),
    });
    await load();
  }

  async function requestPayout() {
    await fetch('/api/doctor/care/payouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    await load();
  }

  if (loading) return <Skeleton className="h-48 w-full rounded-2xl" />;

  const waiting = consultations.filter((c) => ['REQUESTED', 'WAITING'].includes(c.status));
  const unreadPending = consultations.filter((c) => ['DOCTOR_ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'].includes(c.status));

  return (
    <div className="flex flex-col gap-3">
      {/* TODAY */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4" />} label={T('care.waitingPatients')} value={String(waiting.length)} />
        <StatCard icon={<Bell className="h-4 w-4" />} label={T('care.unreadMessages')} value={String(unreadPending.length)} />
        <StatCard icon={<Wallet className="h-4 w-4" />} label={T('care.availableBalance')} value={earnings ? formatMoney({ amountMinor: earnings.availableMinor, currency: earnings.currency }) : '—'} />
        <StatCard icon={<Clock className="h-4 w-4" />} label={T('care.pendingPayouts')} value={earnings ? formatMoney({ amountMinor: earnings.pendingMinor, currency: earnings.currency }) : '—'} />
      </div>

      {/* Waiting patients */}
      <Card>
        <CardContent className="p-3">
          <h2 className="mb-2 text-sm font-bold">{T('care.waitingPatients')}</h2>
          {waiting.length === 0 ? (
            <p className="text-xs text-muted-foreground">—</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {waiting.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-2 text-xs">
                  <span><b>{c.patient.name}</b> · {c.type} · {c.status}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="min-h-11" onClick={() => onOpenConsultation(c.id)}>{T('care.accept')}</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Services & fees (§4) */}
      <Card>
        <CardContent className="p-3">
          <h2 className="mb-2 text-sm font-bold">{T('care.myServices')}</h2>
          <ul className="mb-2 flex flex-col gap-1 text-xs">
            {services.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1">
                <span>{s.type} · {s.durationMinutes}m{s.windowHours ? ` · ${s.windowHours}h` : ''}</span>
                <span className="font-semibold">{formatMoney({ amountMinor: s.priceMinor, currency: s.currency })}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-1">
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="min-h-11 w-24 text-xs" aria-label="type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TEXT">TEXT</SelectItem>
                <SelectItem value="AUDIO">AUDIO</SelectItem>
                <SelectItem value="VIDEO">VIDEO</SelectItem>
              </SelectContent>
            </Select>
            <Input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="min-h-11 w-24 text-xs" aria-label={T('care.setPrice')} />
            <Button size="sm" className="min-h-11" onClick={() => void saveService()}>{T('care.setPrice')}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Availability (§46) + online now (§47) */}
      <Card>
        <CardContent className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">{T('care.availability')}</h2>
            <Button size="sm" variant={onlineNow ? 'default' : 'outline'} className="min-h-11" onClick={() => void toggleOnline()}>
              <CircleDot className={onlineNow ? 'me-1 h-4 w-4 text-green-400' : 'me-1 h-4 w-4'} />
              {onlineNow ? T('care.goOffline') : T('care.goOnline')}
            </Button>
          </div>
          <ul className="mb-2 flex flex-wrap gap-1 text-2xs">
            {schedule.map((w) => (
              <li key={w.id} className="rounded bg-muted/50 px-2 py-1">
                {DAYS[w.weekday]} {String(Math.floor(w.startMinute / 60)).padStart(2, '0')}:{String(w.startMinute % 60).padStart(2, '0')}–
                {String(Math.floor(w.endMinute / 60)).padStart(2, '0')}:{String(w.endMinute % 60).padStart(2, '0')} UTC
              </li>
            ))}
            {schedule.length === 0 ? <li className="text-muted-foreground">—</li> : null}
          </ul>
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <Select value={String(newWindow.weekday)} onValueChange={(v) => setNewWindow((w) => ({ ...w, weekday: Number(v) }))}>
              <SelectTrigger className="min-h-11 w-24" aria-label="day"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAYS.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="time" value={newWindow.start} onChange={(e) => setNewWindow((w) => ({ ...w, start: e.target.value }))} className="min-h-11 w-28 text-xs" aria-label="start" />
            <Input type="time" value={newWindow.end} onChange={(e) => setNewWindow((w) => ({ ...w, end: e.target.value }))} className="min-h-11 w-28 text-xs" aria-label="end" />
            <Button size="sm" variant="outline" className="min-h-11" onClick={() => void addWindow()}>+</Button>
            <Badge variant="outline" className="text-2xs">UTC · rendered in local tz</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Earnings (§13) */}
      {earnings ? (
        <Card>
          <CardContent className="p-3">
            <h2 className="mb-2 text-sm font-bold">{T('care.availableBalance')}</h2>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div className="rounded bg-muted/50 p-2"><div className="text-muted-foreground">Available</div><b>{formatMoney({ amountMinor: earnings.availableMinor, currency: earnings.currency })}</b></div>
              <div className="rounded bg-muted/50 p-2"><div className="text-muted-foreground">Pending</div><b>{formatMoney({ amountMinor: earnings.pendingMinor, currency: earnings.currency })}</b></div>
              <div className="rounded bg-muted/50 p-2"><div className="text-muted-foreground">This month (paid)</div><b>{formatMoney({ amountMinor: earnings.paidThisMonthMinor, currency: earnings.currency })}</b></div>
              <div className="rounded bg-muted/50 p-2"><div className="text-muted-foreground">Lifetime</div><b>{formatMoney({ amountMinor: earnings.lifetimePaidMinor, currency: earnings.currency })}</b></div>
            </div>
            <Button size="sm" className="mt-2 min-h-11" disabled={earnings.availableMinor <= 0} onClick={() => void requestPayout()}>
              Request payout
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2 p-3">
        <span className="text-primary">{icon}</span>
        <div className="min-w-0">
          <div className="truncate text-2xs text-muted-foreground">{label}</div>
          <div className="truncate text-sm font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
