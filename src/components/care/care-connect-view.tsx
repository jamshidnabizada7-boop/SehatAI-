'use client';

// ============================================================
// Care Connect — patient marketplace view (§18/§19/§72) + role tabs.
// Patient: Find doctors | My consultations.
// Doctor:  Dashboard (today, earnings, services, availability §73).
// Primary patient flow: describe problem → safe AI guidance (specialty
// only) → pick verified doctor → type/time → pay → consult.
// Emergency detection is upstream (§85/§86): the match API refuses to
// funnel emergencies into booking and this view renders emergency
// instructions instead.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/care/money';
import { CARE_SPECIALTIES } from '@/lib/care/specialties';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ConsultationWorkspace } from './consultation-workspace';
import { DoctorCareDashboard } from './doctor-care-dashboard';
import {
  Stethoscope, Star, Clock, Languages,
  HeartHandshake, AlertTriangle, BadgeCheck, CalendarClock, Users, LayoutDashboard, Search,
} from 'lucide-react';

interface CareService { type: 'TEXT' | 'AUDIO' | 'VIDEO'; priceMinor: number; currency: string; durationMinutes: number; windowHours?: number | null }
interface DoctorCardData {
  doctorProfileId: string;
  name: string;
  specialty: string;
  subSpecialty?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  facilityCity?: string | null;
  country?: string | null;
  languages: string[];
  gender?: string | null;
  onlineNow: boolean;
  pmdcVerified: boolean;
  licenseVerified?: boolean;
  licensingAuthority?: string | null;
  services: CareService[];
  rating: { average: number; robustScore: number; count: number };
  completedConsultations: number;
  consultedBefore: boolean;
  favorite: boolean;
  sponsoredLabel: string | null;
}
interface MatchResponse {
  emergency: boolean;
  triage?: { level: string; reason: string };
  emergencyNumbers?: Array<{ number: string; label?: string }>;
  suggestedSpecialty?: string;
  doctors?: DoctorCardData[];
  disclaimer?: string;
}
interface Slot { startUtc: string; endUtc: string }
type Tab = 'find' | 'consultations' | 'dashboard';

export function CareConnectView() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const T = useCallback((key: Parameters<typeof t>[1]) => t(uiLang, key), [uiLang]);
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? 'guest';

  const [tab, setTab] = useState<Tab>(role === 'doctor' ? 'consultations' : 'find');
  const [openConsultationId, setOpenConsultationId] = useState<string | null>(null);

  if (openConsultationId) {
    return (
      <div className="h-full">
        <ConsultationWorkspace consultationId={openConsultationId} onBack={() => setOpenConsultationId(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden p-4 pb-20" role="main">
      <header className="mb-3 flex items-center gap-2">
        <Stethoscope className="h-6 w-6 text-primary" aria-hidden />
        <div>
          <h1 className="text-lg font-bold">{T('care.title')}</h1>
          <p className="text-xs text-muted-foreground">{T('care.subtitle')}</p>
        </div>
      </header>

      <div className="mb-3 flex gap-1" role="tablist">
        <Button size="sm" variant={tab === 'find' ? 'default' : 'outline'} className="min-h-11" role="tab" aria-selected={tab === 'find'} onClick={() => setTab('find')}>
          <Search className="mr-1 h-4 w-4" />{T('care.findDoctors')}
        </Button>
        <Button size="sm" variant={tab === 'consultations' ? 'default' : 'outline'} className="min-h-11" role="tab" aria-selected={tab === 'consultations'} onClick={() => setTab('consultations')}>
          <Users className="mr-1 h-4 w-4" />{T('care.myConsultations')}
        </Button>
        {role === 'doctor' ? (
          <Button size="sm" variant={tab === 'dashboard' ? 'default' : 'outline'} className="min-h-11" role="tab" aria-selected={tab === 'dashboard'} onClick={() => setTab('dashboard')}>
            <LayoutDashboard className="mr-1 h-4 w-4" />{T('care.todaysSchedule')}
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'find' ? <FindDoctors T={T} uiLang={uiLang} isLoggedIn={session?.user != null} onOpenConsultation={setOpenConsultationId} /> : null}
        {tab === 'consultations' ? <MyConsultations T={T} onOpen={setOpenConsultationId} /> : null}
        {tab === 'dashboard' && role === 'doctor' ? <DoctorCareDashboard T={T} onOpenConsultation={setOpenConsultationId} /> : null}
      </div>
    </div>
  );
}

type TFn = (key: Parameters<typeof t>[1]) => string;

// ------------------------------------------------------------
// Find doctors tab — AI match + filters + cards + booking dialog
// ------------------------------------------------------------
function FindDoctors({ T, uiLang, isLoggedIn, onOpenConsultation }: {
  T: TFn;
  uiLang: 'en' | 'ur' | 'roman';
  isLoggedIn: boolean;
  onOpenConsultation: (id: string) => void;
}) {
  const [describe, setDescribe] = useState('');
  const [matching, setMatching] = useState(false);
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [doctors, setDoctors] = useState<DoctorCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState('all');
  const [gender, setGender] = useState('any');
  const [consultType, setConsultType] = useState('VIDEO');
  const [sort, setSort] = useState('relevance');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [selected, setSelected] = useState<DoctorCardData | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (specialty !== 'all') params.set('specialty', specialty);
      if (gender !== 'any') params.set('gender', gender);
      if (consultType) params.set('type', consultType);
      params.set('sort', sort);
      if (onlineOnly) params.set('onlineNow', 'true');
      const res = await fetch(`/api/care/doctors?${params.toString()}`);
      const json = await res.json();
      setDoctors(json.doctors ?? []);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [specialty, gender, consultType, sort, onlineOnly]);

  useEffect(() => { void loadDoctors(); }, [loadDoctors]);

  useEffect(() => {
    void fetch('/api/care/favorites').then((r) => r.json()).then((j) => {
      setFavorites(new Set((j.doctors ?? []).map((d: { doctorProfileId: string }) => d.doctorProfileId)));
    }).catch(() => undefined);
  }, []);

  async function runMatch() {
    if (!describe.trim()) return;
    setMatching(true);
    setMatch(null);
    try {
      const res = await fetch('/api/care/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: describe, consultationType: consultType }),
      });
      setMatch(await res.json());
    } catch {
      setMatch(null);
    } finally {
      setMatching(false);
    }
  }

  async function toggleFavorite(doctorProfileId: string) {
    const saved = favorites.has(doctorProfileId);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (saved) next.delete(doctorProfileId);
      else next.add(doctorProfileId);
      return next;
    });
    await fetch('/api/care/favorites', {
      method: saved ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: saved ? `?doctorProfileId=${doctorProfileId}` : JSON.stringify({ doctorProfileId }),
    }).catch(() => undefined);
  }

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4">
          <label htmlFor="care-describe" className="mb-1 block text-sm font-semibold">{T('care.describeProblem')}</label>
          <p className="mb-2 text-xs text-muted-foreground">{T('care.describeHint')}</p>
          <div className="flex gap-2">
            <Input
              id="care-describe"
              value={describe}
              onChange={(e) => setDescribe(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void runMatch(); }}
              placeholder={T('care.searchPlaceholder')}
              className="min-h-11"
            />
            <Button onClick={() => void runMatch()} disabled={matching || !describe.trim()} className="min-h-11">
              {matching ? '…' : T('care.getSuggestion')}
            </Button>
          </div>

          {match?.emergency ? (
            <div role="alert" className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
              <div className="flex items-center gap-2 font-bold text-destructive">
                <AlertTriangle className="h-5 w-5" aria-hidden />
                {T('care.emergencyTitle')}
              </div>
              <p className="mt-1 text-sm">{T('care.emergencyBody')}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {(match.emergencyNumbers ?? []).map((n) => (
                  <li key={n.number}>
                    <a href={`tel:${n.number}`} className="inline-flex min-h-11 items-center rounded-lg bg-destructive px-4 font-bold text-white">
                      📞 {n.number}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : match && !match.emergency ? (
            <div className="mt-3 rounded-xl border bg-muted/40 p-3 text-sm">
              <span className="font-semibold">{T('care.suggestedSpecialty')}: </span>
              <Badge variant="secondary">{match.suggestedSpecialty}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">{T('care.matchingDisclaimer')}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label={T('care.findDoctors')}>
        <Select value={specialty} onValueChange={setSpecialty}>
          <SelectTrigger aria-label={T('care.specialty')} className="min-h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{T('care.allSpecialties')}</SelectItem>
            {CARE_SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={consultType} onValueChange={setConsultType}>
          <SelectTrigger aria-label={T('care.consultationType')} className="min-h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TEXT">{T('care.text')}</SelectItem>
            <SelectItem value="AUDIO">{T('care.audio')}</SelectItem>
            <SelectItem value="VIDEO">{T('care.video')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger aria-label={T('care.gender')} className="min-h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{T('care.anyGender')}</SelectItem>
            <SelectItem value="male">{T('care.male')}</SelectItem>
            <SelectItem value="female">{T('care.female')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger aria-label={T('care.sort')} className="min-h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">{T('care.sortRelevance')}</SelectItem>
            <SelectItem value="price_asc">{T('care.sortPriceAsc')}</SelectItem>
            <SelectItem value="price_desc">{T('care.sortPriceDesc')}</SelectItem>
            <SelectItem value="rating">{T('care.sortRating')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button
          variant={onlineOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOnlineOnly((v) => !v)}
          className="min-h-11"
          aria-pressed={onlineOnly}
        >
          <span className={cn('mr-1 inline-block h-2 w-2 rounded-full', onlineOnly ? 'bg-green-500' : 'bg-muted-foreground')} aria-hidden />
          {T('care.onlineNow')}
        </Button>
        <span className="text-xs text-muted-foreground">{doctors.length} doctors</span>
      </div>

      <ul className="flex flex-col gap-3">
        {loading
          ? [0, 1, 2].map((i) => <li key={i}><Skeleton className="h-28 w-full rounded-2xl" /></li>)
          : doctors.map((d) => (
              <li key={d.doctorProfileId}>
                <Card
                  className={cn('cursor-pointer transition-shadow hover:shadow-md', d.sponsoredLabel && 'border-amber-400/60')}
                  onClick={() => setSelected(d)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(d); }}
                  aria-label={`${d.name}, ${d.specialty}`}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary" aria-hidden>
                      {d.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold">{d.name}</span>
                        {(d.licenseVerified ?? d.pmdcVerified) ? (
                          <BadgeCheck
                            className="h-4 w-4 text-blue-600"
                            aria-label={d.pmdcVerified ? 'PMDC verified' : (d.licensingAuthority ? `${d.licensingAuthority} verified` : 'License verified')}
                          />
                        ) : null}
                        {d.onlineNow ? <Badge className="bg-green-600 text-[10px]">{T('care.onlineNow')}</Badge> : null}
                        {d.consultedBefore ? <Badge variant="secondary" className="text-[10px]">{T('care.consultedBefore')}</Badge> : null}
                        {d.sponsoredLabel ? <Badge variant="outline" className="text-[10px] text-amber-600">{d.sponsoredLabel}</Badge> : null}
                        <button
                          type="button"
                          className="ml-auto text-muted-foreground hover:text-primary"
                          onClick={(e) => { e.stopPropagation(); void toggleFavorite(d.doctorProfileId); }}
                          aria-label={favorites.has(d.doctorProfileId) ? T('care.saved') : T('care.save')}
                        >
                          <HeartHandshake className={cn('h-4 w-4', favorites.has(d.doctorProfileId) && 'text-primary')} />
                        </button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {d.specialty}{d.facilityCity ? ` · ${d.facilityCity}` : ''}
                        {d.yearsExperience ? ` · ${d.yearsExperience} ${T('care.yearsExperience')}` : ''}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                          {d.rating.count > 0 ? `${d.rating.average} (${d.rating.count})` : '—'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
                          {d.completedConsultations} {T('care.completedCount')}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Languages className="h-3.5 w-3.5" aria-hidden />
                          {d.languages.slice(0, 3).join(', ') || '—'}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {d.services.map((s) => (
                          <Badge key={s.type} variant="outline" className="text-[11px]">
                            {s.type === 'TEXT' ? T('care.text') : s.type === 'AUDIO' ? T('care.audio') : T('care.video')}
                            {' · '}{formatMoney({ amountMinor: s.priceMinor, currency: s.currency })}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
        {!loading && doctors.length === 0 ? (
          <li className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {T('care.noDoctors')}
          </li>
        ) : null}
      </ul>

      {selected ? (
        <DoctorDetailDialog
          doctor={selected}
          uiLang={uiLang}
          T={T}
          onClose={() => setSelected(null)}
          isLoggedIn={isLoggedIn}
          onBooked={onOpenConsultation}
        />
      ) : null}
    </>
  );
}

// ------------------------------------------------------------
// Doctor detail: services, slots (§46 UTC→local), location (§17).
// Booking creates the consultation and opens the workspace; when
// CARE_PAYMENTS_ENABLED the workspace/checkout flow collects payment.
// ------------------------------------------------------------
function DoctorDetailDialog({ doctor, uiLang, T, onClose, isLoggedIn, onBooked }: {
  doctor: DoctorCardData;
  uiLang: 'en' | 'ur' | 'roman';
  T: TFn;
  onClose: () => void;
  isLoggedIn: boolean;
  onBooked: (consultationId: string) => void;
}) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [country, setCountry] = useState('PK');
  const [chosen, setChosen] = useState<{ slot: Slot | null; service: CareService } | null>(null);

  const loadSlots = useCallback(async (service: CareService) => {
    if (service.type === 'TEXT') return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/care/availability?doctorId=${doctor.doctorProfileId}&type=${service.type}&days=14`);
      const json = await res.json();
      setSlots(json.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [doctor.doctorProfileId]);

  const [telemedicineConsent, setTelemedicineConsent] = useState(true);

  async function ensureConsent() {
    if (!telemedicineConsent) return;
    try {
      await fetch('/api/care/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'TELEMEDICINE', policyVersion: '2026.10-draft' }),
      });
    } catch { /* best effort */ }
  }

  async function book(service: CareService, slot?: Slot, instant = false) {
    if (!telemedicineConsent) {
      setBookingError('You must agree to the Telemedicine Consent to proceed.');
      return;
    }
    setBooking(true);
    setBookingError(null);
    try {
      // §83 — Telemedicine consent capture
      await ensureConsent();

      const res = await fetch('/api/care/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorProfileId: doctor.doctorProfileId,
          type: service.type,
          scheduledAt: slot?.startUtc,
          patientCountry: country,
          instant,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === 'TELEMEDICINE_CONSENT_REQUIRED') {
          await ensureConsent();
          const retryRes = await fetch('/api/care/consultations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              doctorProfileId: doctor.doctorProfileId,
              type: service.type,
              scheduledAt: slot?.startUtc,
              patientCountry: country,
              instant,
            }),
          });
          const retryJson = await retryRes.json();
          if (retryRes.ok) {
            onClose();
            onBooked(retryJson.consultation.id);
            return;
          }
        }
        setBookingError(json.error ?? 'ERROR');
        return;
      }
      onClose();
      onBooked(json.consultation.id);
    } catch {
      setBookingError('NETWORK');
    } finally {
      setBooking(false);
    }
  }

  const textService = useMemo(() => doctor.services.find((s) => s.type === 'TEXT'), [doctor.services]);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {doctor.name}
            {(doctor.licenseVerified ?? doctor.pmdcVerified) ? (
              <BadgeCheck
                className="h-5 w-5 text-blue-600"
                aria-label={doctor.pmdcVerified ? 'PMDC verified' : (doctor.licensingAuthority ? `${doctor.licensingAuthority} verified` : 'License verified')}
              />
            ) : null}
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          {doctor.specialty}{doctor.subSpecialty ? ` · ${doctor.subSpecialty}` : ''}
          {doctor.facilityCity ? ` · ${doctor.facilityCity}` : ''}
        </div>
        {doctor.bio ? <p className="mt-1 text-sm">{doctor.bio}</p> : null}

        {/* §47 Instant consultation ("Talk now") */}
        {doctor.onlineNow ? (
          <div className="mt-3 rounded-xl border border-green-500/40 bg-green-50/60 dark:bg-green-950/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-green-700 dark:text-green-400">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  {T('care.onlineNow')}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Doctor is online now. Available for instant consultation.</p>
              </div>
              <Button
                size="sm"
                className="min-h-11 bg-green-600 hover:bg-green-700 text-white font-semibold"
                disabled={booking || !isLoggedIn || !telemedicineConsent}
                onClick={() => {
                  const s = textService ?? doctor.services[0];
                  if (s) void book(s, undefined, true);
                }}
              >
                Talk now
              </Button>
            </div>
          </div>
        ) : null}

        <section aria-label={T('care.consultationType')} className="mt-3 flex flex-col gap-3">
          {doctor.services.map((s) => (
            <div key={s.type} className="rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  {s.type === 'TEXT' ? '💬' : s.type === 'AUDIO' ? '📞' : '📹'}
                  {s.type === 'TEXT' ? T('care.text') : s.type === 'AUDIO' ? T('care.audio') : T('care.video')}
                  <span className="text-xs font-normal text-muted-foreground">{s.durationMinutes} {T('care.perMin')}</span>
                </div>
                <span className="font-bold">{formatMoney({ amountMinor: s.priceMinor, currency: s.currency })}</span>
              </div>
              {s.type !== 'TEXT' ? (
                <Button variant="outline" size="sm" className="mt-2 min-h-11 w-full" onClick={() => { setChosen({ slot: null, service: s }); void loadSlots(s); }}>
                  <CalendarClock className="mr-1 h-4 w-4" aria-hidden />
                  {T('care.selectTime')}
                </Button>
              ) : (
                <Button size="sm" className="mt-2 min-h-11 w-full" disabled={booking || !isLoggedIn || !telemedicineConsent} onClick={() => void book(s)}>
                  {T('care.bookNow')}
                </Button>
              )}
            </div>
          ))}
        </section>

        {chosen && chosen.service.type !== 'TEXT' ? (
          <section aria-label={T('care.selectTime')} className="rounded-xl border p-3">
            {loadingSlots ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                {slots.map((slot) => (
                  <Button
                    key={slot.startUtc}
                    size="sm"
                    variant={chosen.slot?.startUtc === slot.startUtc ? 'default' : 'outline'}
                    className="min-h-11 text-xs"
                    onClick={() => setChosen({ ...chosen, slot })}
                  >
                    <Clock className="mr-1 h-3 w-3" aria-hidden />
                    {new Date(slot.startUtc).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                  </Button>
                ))}
                {slots.length === 0 ? (
                  <p className="col-span-full text-xs text-muted-foreground">{T('care.noDoctors')}</p>
                ) : null}
              </div>
            )}
            {chosen.slot ? (
              <Button className="mt-3 min-h-11 w-full" disabled={booking || !isLoggedIn || !telemedicineConsent} onClick={() => void book(chosen.service, chosen.slot ?? undefined)}>
                {T('care.payAndBook')} · {formatMoney({ amountMinor: chosen.service.priceMinor, currency: chosen.service.currency })}
              </Button>
            ) : null}
          </section>
        ) : null}

        {textService ? (
          <p className="text-center text-[11px] text-muted-foreground">
            {T('care.text')}: {textService.durationMinutes}{textService.windowHours ? ` · ${textService.windowHours}h window` : ''}
          </p>
        ) : null}

        {/* §17 patient location declaration — never inferred from IP */}
        <section aria-label={T('care.yourLocation')} className="rounded-xl border p-3">
          <label htmlFor="care-country" className="block text-sm font-semibold">{T('care.yourLocation')}</label>
          <p className="mb-2 text-xs text-muted-foreground">{T('care.locationHint')}</p>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger id="care-country" className="min-h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PK">🇵🇰 Pakistan</SelectItem>
              <SelectItem value="AF">🇦🇫 Afghanistan</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* §83 Telemedicine consent capture */}
        <div className="rounded-xl border p-3 text-xs text-muted-foreground bg-muted/40">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={telemedicineConsent}
              onChange={(e) => setTelemedicineConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300"
            />
            <span>
              I agree to the <a href="/docs/legal/telemedicine-consent.md" target="_blank" rel="noopener noreferrer" className="underline font-medium text-foreground">Telemedicine Consent (2026.10-draft)</a> and acknowledge that this consultation is for non-emergency medical care.
            </span>
          </label>
        </div>

        {!isLoggedIn ? (
          <p className="rounded-lg bg-muted p-2 text-center text-xs">Please sign in to book a consultation.</p>
        ) : null}
        {bookingError ? (
          <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-center text-xs text-destructive">{bookingError}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// My consultations list (patient + doctor)
// ------------------------------------------------------------
interface ConsultationListItem {
  id: string;
  type: string;
  status: string;
  priceMinor: number | null;
  currency: string | null;
  scheduledAt: string | null;
  updatedAt: string;
  doctor: { id: string; name: string; specialty: string };
  patient: { id: string; name: string };
}

function MyConsultations({ T, onOpen }: { T: TFn; onOpen: (id: string) => void }) {
  const [items, setItems] = useState<ConsultationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch('/api/care/consultations')
      .then((r) => r.json())
      .then((j) => setItems(j.consultations ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-32 w-full rounded-2xl" />;
  if (items.length === 0) {
    return <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{T('care.noDoctors')}</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((c) => (
        <li key={c.id}>
          <Card role="button" tabIndex={0} className="cursor-pointer hover:shadow-md" onClick={() => onOpen(c.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpen(c.id); }}>
            <CardContent className="flex items-center justify-between p-3">
              <div>
                <div className="text-sm font-semibold">
                  {c.doctor.name} <span className="font-normal text-muted-foreground">· {c.doctor.specialty}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.type} · {new Date(c.updatedAt).toLocaleString()}
                  {c.scheduledAt ? ` · 📅 ${new Date(c.scheduledAt).toLocaleString()}` : ''}
                </div>
              </div>
              <Badge variant={c.status === 'COMPLETED' ? 'secondary' : 'default'} className="text-[10px]">{c.status}</Badge>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
