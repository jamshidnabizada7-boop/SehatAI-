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
  Shield, Video, Phone, MessageSquare, Lock, Sparkles, Check, ArrowRight, CheckCircle2,
  FileText, MapPin,
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
  isTestProfile?: boolean;
  testDisclaimer?: string | null;
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
  const setView = useAppStore((s) => s.setView);
  const uiLang = resolveUiLang(langPref);
  const T = useCallback((key: Parameters<typeof t>[1]) => t(uiLang, key), [uiLang]);
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? 'guest';

  const [tab, setTab] = useState<Tab>(role === 'doctor' ? 'consultations' : 'find');
  const [openConsultationId, setOpenConsultationId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return new URL(window.location.href).searchParams.get('consultationId');
    } catch {
      return null;
    }
  });

  if (openConsultationId) {
    return (
      <div className="h-full">
        <ConsultationWorkspace consultationId={openConsultationId} onBack={() => setOpenConsultationId(null)} />
      </div>
    );
  }

  return (
    <div className={cn('mx-auto flex h-full w-full max-w-7xl flex-1 flex-col overflow-hidden px-4 pt-4 sm:px-6', uiLang === 'ur' && 'font-urdu')}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{T('care.title')}</h1>
          <p className="text-sm text-muted-foreground">{T('care.subtitle')}</p>
        </div>
        <div className="tabrow w-full sm:w-auto" role="tablist" aria-label={T('care.title')}>
          <button type="button" className="tab-custom" role="tab" aria-selected={tab === 'find'} onClick={() => setTab('find')}>
            <Search className="h-4 w-4" aria-hidden />{T('care.findDoctors')}
          </button>
          <button type="button" className="tab-custom" role="tab" aria-selected={tab === 'consultations'} onClick={() => setTab('consultations')}>
            <Users className="h-4 w-4" aria-hidden />{T('care.myConsultations')}
          </button>
          {role === 'doctor' ? (
            <button type="button" className="tab-custom" role="tab" aria-selected={tab === 'dashboard'} onClick={() => setTab('dashboard')}>
              <LayoutDashboard className="h-4 w-4" aria-hidden />{T('care.todaysSchedule')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-8 custom-scrollbar">
        {tab === 'find' ? <FindDoctors T={T} uiLang={uiLang} isLoggedIn={session?.user != null} onOpenConsultation={setOpenConsultationId} onGoChat={() => setView('chat')} /> : null}
        {tab === 'consultations' ? <MyConsultations T={T} onOpen={setOpenConsultationId} /> : null}
        {tab === 'dashboard' && role === 'doctor' ? <DoctorCareDashboard T={T} onOpenConsultation={setOpenConsultationId} /> : null}
      </div>
    </div>
  );
}

type TFn = (key: Parameters<typeof t>[1]) => string;

function getDoctorPhoto(name: string): string {
  if (name.includes('Ayesha')) return '/assets/doctor_ayesha.png';
  if (name.includes('Tariq')) return '/assets/doctor_tariq.png';
  if (name.includes('Samina')) return '/assets/doctor_samina.png';
  return '/assets/doctor_ayesha.png';
}

// ------------------------------------------------------------
// Find doctors tab — AI match + filters + cards + booking dialog
// ------------------------------------------------------------
function FindDoctors({ T, uiLang, isLoggedIn, onOpenConsultation, onGoChat }: {
  T: TFn;
  uiLang: 'en' | 'ur' | 'roman';
  isLoggedIn: boolean;
  onOpenConsultation: (id: string) => void;
  onGoChat?: () => void;
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

  const DEMO_DOCTORS: DoctorCardData[] = useMemo(() => [
    {
      doctorProfileId: 'doc-ayesha-malik-demo',
      name: 'Dr. Ayesha Malik',
      specialty: 'Cardiologist',
      subSpecialty: 'Preventive Cardiology',
      bio: 'MBBS, FCPS (Cardiology) · 12 years experience · Punjab Institute of Cardiology, Lahore',
      yearsExperience: 12,
      facilityCity: 'Lahore',
      country: 'PK',
      languages: ['Urdu', 'English', 'Punjabi'],
      onlineNow: true,
      pmdcVerified: true,
      licenseVerified: true,
      licensingAuthority: 'PMDC',
      services: [
        { type: 'VIDEO', priceMinor: 150000, currency: 'PKR', durationMinutes: 20 },
        { type: 'AUDIO', priceMinor: 120000, currency: 'PKR', durationMinutes: 15 },
        { type: 'TEXT', priceMinor: 80000, currency: 'PKR', durationMinutes: 24, windowHours: 24 },
      ],
      rating: { average: 4.9, robustScore: 4.88, count: 148 },
      completedConsultations: 1240,
      consultedBefore: false,
      favorite: false,
      sponsoredLabel: null,
      isTestProfile: true,
      testDisclaimer: 'Demo clinician profile',
    },
    {
      doctorProfileId: 'doc-tariq-mahmood-demo',
      name: 'Dr. Tariq Mahmood',
      specialty: 'Interventional Cardiologist',
      subSpecialty: 'Coronary Angioplasty',
      bio: 'MBBS, MRCP (UK) · 16 years experience · Aga Khan University Hospital, Karachi',
      yearsExperience: 16,
      facilityCity: 'Karachi',
      country: 'PK',
      languages: ['English', 'Urdu', 'Sindhi'],
      onlineNow: false,
      pmdcVerified: true,
      licenseVerified: true,
      licensingAuthority: 'PMDC',
      services: [
        { type: 'VIDEO', priceMinor: 200000, currency: 'PKR', durationMinutes: 20 },
        { type: 'AUDIO', priceMinor: 150000, currency: 'PKR', durationMinutes: 15 },
        { type: 'TEXT', priceMinor: 100000, currency: 'PKR', durationMinutes: 24, windowHours: 24 },
      ],
      rating: { average: 4.95, robustScore: 4.92, count: 210 },
      completedConsultations: 2100,
      consultedBefore: false,
      favorite: false,
      sponsoredLabel: null,
      isTestProfile: true,
      testDisclaimer: 'Demo clinician profile',
    },
    {
      doctorProfileId: 'doc-samina-khan-demo',
      name: 'Dr. Samina Khan',
      specialty: 'General Physician',
      subSpecialty: 'Internal Medicine',
      bio: 'MBBS, FCPS (Medicine) · 8 years experience · Shifa International Hospital, Islamabad',
      yearsExperience: 8,
      facilityCity: 'Islamabad',
      country: 'PK',
      languages: ['Urdu', 'English', 'Pashto'],
      onlineNow: true,
      pmdcVerified: true,
      licenseVerified: true,
      licensingAuthority: 'PMDC',
      services: [
        { type: 'VIDEO', priceMinor: 80000, currency: 'PKR', durationMinutes: 20 },
        { type: 'AUDIO', priceMinor: 60000, currency: 'PKR', durationMinutes: 15 },
        { type: 'TEXT', priceMinor: 50000, currency: 'PKR', durationMinutes: 24, windowHours: 24 },
      ],
      rating: { average: 4.8, robustScore: 4.79, count: 96 },
      completedConsultations: 980,
      consultedBefore: false,
      favorite: false,
      sponsoredLabel: null,
      isTestProfile: true,
      testDisclaimer: 'Demo clinician profile',
    },
  ], []);

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
      const list = json.doctors ?? [];
      setDoctors(list.length > 0 ? list : DEMO_DOCTORS);
    } catch {
      setDoctors(DEMO_DOCTORS);
    } finally {
      setLoading(false);
    }
  }, [specialty, gender, consultType, sort, onlineOnly, DEMO_DOCTORS]);

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

  const displayedDoctors = doctors.length > 0 ? doctors : DEMO_DOCTORS;

  return (
    <div className="space-y-4">
      {/* High-Fidelity Mint/Sky Hero Banner (§ references/02_Care_Connect_Marketplace.png) */}
      {/* Intro band: what Care Connect offers, kept short so the doctor list is the focus */}
      <div className="hero-banner hero-care relative flex items-center overflow-hidden">
        <div className="z-10 max-w-xl md:max-w-[56%]">
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.7rem]">
            Connect with <span className="text-primary">verified Pakistani doctors</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Online consultations with licensed doctors across Pakistan — safe, affordable and in your language.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-foreground">
            <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" aria-hidden />PMDC-verified doctors</li>
            <li className="flex items-center gap-2"><Video className="h-4 w-4 text-primary" aria-hidden />Video, audio or chat</li>
            <li className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" aria-hidden />Upfront fees</li>
          </ul>
        </div>
        <img
          src="/assets/doctor_hero.png"
          alt=""
          className="pointer-events-none absolute end-0 top-0 hidden h-full w-auto max-w-[40%] object-cover object-left-top md:block"
        />
      </div>

      {/* Main 2-column layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Column: Search, filters, doctor cards */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Search bar */}
          <div className="flex gap-2">
            <Input
              id="care-describe"
              value={describe}
              onChange={(e) => setDescribe(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void runMatch(); }}
              placeholder="Search doctor name, specialty, hospital or condition..."
              className="min-h-12 text-sm rounded-xl bg-background"
            />
            <Button
              onClick={() => void runMatch()}
              disabled={matching}
              className="min-h-12 shrink-0 rounded-xl px-5 font-semibold"
              aria-busy={matching}
            >
              <Search className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{matching ? 'Searching…' : 'Find doctors'}</span>
            </Button>
          </div>

          {match?.emergency ? (
            <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5">
              <div className="flex items-center gap-2 font-bold text-destructive">
                <AlertTriangle className="h-5 w-5" aria-hidden />
                {T('care.emergencyTitle')}
              </div>
              <p className="mt-1 text-sm">{T('care.emergencyBody')}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {(match.emergencyNumbers ?? []).map((n) => (
                  <li key={n.number}>
                    <a href={`tel:${n.number}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-700 px-4 font-bold text-white hover:bg-red-800">
                      <Phone className="h-4 w-4" aria-hidden /> {n.number}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : match && !match.emergency ? (
            <div className="rounded-xl border bg-muted/40 p-3.5 text-sm">
              <span className="font-semibold">{T('care.suggestedSpecialty')}: </span>
              <Badge variant="secondary">{match.suggestedSpecialty}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">{T('care.matchingDisclaimer')}</p>
            </div>
          ) : null}

          {/* Horizontal specialty filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
            <Button
              variant={specialty === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSpecialty('all')}
              className="h-8 rounded-xl text-xs font-semibold shrink-0"
            >
              All Specialties
            </Button>
            <Button
              variant={onlineOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOnlineOnly((v) => !v)}
              className="h-8 rounded-xl text-xs font-semibold shrink-0"
            >
              <span className="me-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Available Now
            </Button>
            <Button
              variant={consultType === 'VIDEO' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setConsultType('VIDEO')}
              className="h-8 rounded-xl text-xs font-semibold shrink-0"
            >
              Video Consultation
            </Button>
            <Button
              variant={consultType === 'AUDIO' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setConsultType('AUDIO')}
              className="h-8 rounded-xl text-xs font-semibold shrink-0"
            >
              Audio Consultation
            </Button>
            {CARE_SPECIALTIES.slice(0, 4).map((s) => (
              <Button
                key={s}
                variant={specialty === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSpecialty(s)}
                className="h-8 rounded-xl text-xs font-semibold shrink-0"
              >
                {s}
              </Button>
            ))}
          </div>

          {/* Section header and sort */}
          <div className="flex flex-wrap items-end justify-between gap-2 pt-1">
            <h3 className="text-base font-semibold text-foreground">Find the right doctor for you</h3>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger aria-label={T('care.sort')} className="h-9 w-40 rounded-xl text-xs font-medium">
                <SelectValue placeholder="Recommended" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Recommended</SelectItem>
                <SelectItem value="price_asc">Fee: Low to High</SelectItem>
                <SelectItem value="price_desc">Fee: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Synthetic-data notice: these are not real clinicians */}
          <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning" role="note">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            DEMO / SYNTHETIC — NOT A REAL CLINICIAN. Doctor listings below are synthetic design samples, not live bookable profiles.
          </p>

          {/* High-Fidelity Doctor Rows List (§ references/02_Care_Connect_Marketplace.png) */}
          <div className="space-y-3">
            {loading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
            ) : (
              displayedDoctors.map((d) => {
                const photoUrl = getDoctorPhoto(d.name);
                const videoService = d.services.find((s) => s.type === 'VIDEO') ?? d.services[0];
                const feeText = videoService ? `${formatMoney({ amountMinor: videoService.priceMinor, currency: videoService.currency })}` : 'PKR 1,500';
                // bio is "degrees · N years experience · facility" — show the
                // facility only (experience already has its own line).
                const facility = (d.bio ?? '').split('·').map((s) => s.trim()).filter((s) => s && !/experience/i.test(s))[1] || d.facilityCity || null;

                return (
                  <div
                    key={d.doctorProfileId}
                    className="doctor-row cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    role="button"
                    tabIndex={0}
                    aria-label={`${d.name}, ${d.specialty}`}
                    onClick={() => setSelected(d)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(d); } }}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <img
                        src={photoUrl}
                        alt=""
                        className="shrink-0 border border-border object-cover"
                      />

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="me-1 text-base font-semibold text-foreground">{d.name}</h3>
                          <span className="chip">PMDC · demo</span>
                          <span className="chip orange">Demo / synthetic — not a real clinician</span>
                        </div>
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{d.specialty}</span>
                          <span className="text-muted-foreground"> · {d.yearsExperience ?? 10} years experience</span>
                        </p>
                        {facility ? <p className="text-xs text-muted-foreground">{facility}</p> : null}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-xs">
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                            {d.rating.average}
                            <span className="font-normal text-muted-foreground">({d.rating.count} reviews)</span>
                          </span>
                          <span className="text-muted-foreground">{d.completedConsultations}+ consultations</span>
                          <span className="flex flex-wrap gap-1">
                            {(d.languages.length > 0 ? d.languages : ['Urdu', 'English']).map((l) => (
                              <span key={l} className="chip stroke">{l}</span>
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border pt-3 sm:min-w-[160px] sm:flex-col sm:items-end sm:self-stretch sm:border-t-0 sm:border-s sm:ps-4 sm:pt-0">
                      <span className={cn('chip', d.onlineNow ? 'green' : 'orange')}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', d.onlineNow ? 'bg-emerald-600' : 'bg-amber-600')} aria-hidden />
                        {d.onlineNow ? 'Available now' : 'Next: 2:00 PM'}
                      </span>
                      <div className="text-end">
                        <div className="text-lg font-semibold text-foreground tabular">{feeText}</div>
                        <span className="text-2xs text-muted-foreground">Consultation fee</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(d);
                        }}
                        className="h-9 rounded-lg px-3 text-xs font-semibold sm:w-full"
                      >
                        {d.onlineNow ? 'Book video consult' : 'Schedule consultation'}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column (desktop): what is not already said in the intro band */}
        <aside className="hidden w-80 shrink-0 flex-col gap-4 lg:flex">
          <div className="surface space-y-3 p-5">
            <h3 className="text-sm font-semibold text-foreground">Why Care Connect?</h3>
            <ul className="space-y-3">
              {[
                { icon: Shield, title: 'Verified clinician credentials', desc: 'Only after authoritative verification' },
                { icon: MapPin, title: 'Doctors across Pakistan', desc: 'Find appropriate specialists' },
                { icon: Lock, title: 'Health information privacy', desc: 'Review our actual privacy policy' },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-2.5">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <div className="text-xs">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface space-y-2.5 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              Need help choosing?
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Not sure which specialist to consult? Describe your symptoms to the AI Health Guide first.
            </p>
            <Button variant="outline" size="sm" onClick={onGoChat} className="mt-1 h-9 w-full rounded-lg text-xs font-semibold">
              Ask the AI Health Guide
            </Button>
          </div>
        </aside>
      </div>

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
    </div>
  );
}

// ------------------------------------------------------------
// Doctor detail: high-fidelity 4-step booking wizard (§ references/08_Booking_Consent.png)
// ------------------------------------------------------------
function DoctorDetailDialog({ doctor, uiLang, T, onClose, isLoggedIn, onBooked }: {
  doctor: DoctorCardData;
  uiLang: 'en' | 'ur' | 'roman';
  T: TFn;
  onClose: () => void;
  isLoggedIn: boolean;
  onBooked: (consultationId: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'VIDEO' | 'AUDIO' | 'TEXT'>('VIDEO');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [country, setCountry] = useState('PK');

  // Hard safety rules: all checkboxes unchecked by default!
  const [telemedicineConsent, setTelemedicineConsent] = useState(false);
  const [sandboxAck, setSandboxAck] = useState(false);
  const [feeAck, setFeeAck] = useState(false);

  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Fee per modality from this doctor's own services; the fixed map is only
  // a fallback (it used to be shown for every doctor, contradicting the card).
  const feeMap = useMemo(() => {
    const out: Record<'VIDEO' | 'AUDIO' | 'TEXT', string> = { VIDEO: 'PKR 1,500', AUDIO: 'PKR 1,200', TEXT: 'PKR 800' };
    for (const svc of doctor.services) {
      out[svc.type] = formatMoney({ amountMinor: svc.priceMinor, currency: svc.currency });
    }
    return out;
  }, [doctor.services]);
  const facility = (doctor.bio ?? '').split('·').map((x) => x.trim()).filter((x) => x && !/experience/i.test(x))[1] || doctor.facilityCity || null;

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/care/availability?doctorId=${doctor.doctorProfileId}&type=${mode}&days=14`);
      const json = await res.json();
      setSlots(json.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [doctor.doctorProfileId, mode]);

  useEffect(() => {
    if (step === 1) {
      void loadSlots();
    }
  }, [step, loadSlots]);

  const canProceedStep0 = telemedicineConsent && sandboxAck && feeAck;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="block max-w-4xl overflow-y-auto p-0 md:overflow-hidden">
        <div className="flex flex-col md:max-h-[calc(100dvh-2rem)] md:flex-row">
          {/* Main Booking Wizard Column */}
          <div className="custom-scrollbar flex-1 space-y-5 p-5 sm:p-6 md:overflow-y-auto">
            <div className="pe-8">
              <DialogHeader className="pe-0">
                <DialogTitle className="text-xl font-semibold tracking-tight">Book a telemedicine consultation</DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground mt-0.5">
                Consult with {doctor.name} (demo clinician) from the comfort of your home.
              </p>
            </div>

            {/* 4 Steps Indicator */}
            <ol className="grid grid-cols-4 gap-2 border-y border-border py-3" aria-label="Booking steps">
              {[
                { label: 'Consultation Type', num: 1 },
                { label: 'Date & Time', num: 2 },
                { label: 'Your Information', num: 3 },
                { label: 'Review & Book', num: 4 },
              ].map((s, idx) => (
                <li
                  key={s.num}
                  aria-current={step === idx ? 'step' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-1.5 text-center text-2xs font-semibold transition-colors sm:flex-row sm:text-start',
                    step === idx ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                      step === idx
                        ? 'bg-primary text-primary-foreground'
                        : step > idx
                        ? 'bg-accent text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {step > idx ? <Check className="h-3.5 w-3.5" aria-hidden /> : s.num}
                  </span>
                  <span className="leading-tight">{s.label}</span>
                </li>
              ))}
            </ol>

            {/* Step 0: Modality & Consents */}
            {step === 0 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Consultation type</h3>
                  <p className="text-xs text-muted-foreground">Choose the most suitable way to connect to the doctor.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'VIDEO', icon: Video, name: 'Video call', desc: 'Face-to-face consultation' },
                    { id: 'AUDIO', icon: Phone, name: 'Audio call', desc: 'Voice consultation without video' },
                    { id: 'TEXT', icon: MessageSquare, name: 'Secure chat', desc: 'Text-based consultation' },
                  ].map((m) => {
                    const sel = mode === m.id;
                    return (
                      <div
                        key={m.id}
                        role="radio"
                        aria-checked={sel}
                        tabIndex={0}
                        onClick={() => setMode(m.id as 'VIDEO' | 'AUDIO' | 'TEXT')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMode(m.id as 'VIDEO' | 'AUDIO' | 'TEXT'); }}
                        className={cn(
                          'modality-card transition-all',
                          sel && 'selected'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <m.icon className="h-5 w-5 text-primary" aria-hidden />
                          {sel ? <Check className="h-4 w-4 text-primary" aria-label="Selected" /> : null}
                        </div>
                        <div>
                          <strong className="text-sm text-foreground block">{m.name}</strong>
                          <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                        </div>
                        <div className="mt-auto pt-2">
                          <span className="text-base font-semibold text-foreground tabular">{feeMap[m.id as 'VIDEO' | 'AUDIO' | 'TEXT']}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-foreground">Consent and important information</h3>
                  <p className="text-xs text-muted-foreground">Read and acknowledge the applicable documents before continuing.</p>
                </div>

                <div className="space-y-2.5">
                  {/* Telemedicine Consent Checkbox */}
                  <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={telemedicineConsent}
                        onChange={(e) => setTelemedicineConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                      />
                      <span className="leading-relaxed">
                        <b>Telemedicine Consent (2026.10 draft)</b><br />
                        I have read and agree to the consent for non-emergency telemedicine care.{' '}
                        <a
                          href="/docs/legal/telemedicine-consent"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-emerald-700 underline underline-offset-2 dark:text-emerald-400"
                        >
                          Read full consent
                        </a>
                      </span>
                    </label>
                  </div>

                  {/* Staging Safety Gate Checkbox */}
                  <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20 p-3.5 text-xs text-muted-foreground transition-colors">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sandboxAck}
                        onChange={(e) => setSandboxAck(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                      />
                      <span className="leading-relaxed">
                        <b className="text-amber-800 dark:text-amber-300">Staging Safety Gate</b><br />
                        I understand that real payment processing and clinical bookings are disabled. This is a demonstration environment.
                      </span>
                    </label>
                  </div>

                  {/* Fee Transparency Checkbox */}
                  <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={feeAck}
                        onChange={(e) => setFeeAck(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                      />
                      <span className="leading-relaxed">
                        <b>Fee Transparency</b><br />
                        Selected illustrative consultation fee: {feeMap[mode]}. No actual payment is collected in this test mode.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Step 1: Date & Time */}
            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Select Date & Time</h3>
                  <p className="text-xs text-muted-foreground">Select an available consultation time slot.</p>
                </div>

                {loadingSlots ? (
                  <Skeleton className="h-32 w-full rounded-xl" />
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar p-1">
                    {slots.map((s) => (
                      <Button
                        key={s.startUtc}
                        size="sm"
                        variant={selectedSlot?.startUtc === s.startUtc ? 'default' : 'outline'}
                        className="h-10 text-xs font-semibold"
                        onClick={() => setSelectedSlot(s)}
                      >
                        <Clock className="me-1.5 h-3.5 w-3.5" />
                        {new Date(s.startUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="inset inset-amber rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-warning">
                      <Clock className="h-4 w-4" />
                      <span>No Live Schedule Connected</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      There are no verified live appointment slots in this demo environment. You can preview the next step for verification.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Step 2: Your Information */}
            {step === 2 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Your Information</h3>
                  <p className="text-xs text-muted-foreground">Patient identity and declared jurisdiction.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="patient-country" className="block text-xs font-bold text-foreground mb-1">Declared Jurisdiction</label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger id="patient-country" className="h-10 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PK">Pakistan (Punjab, Sindh, KPK, Balochistan, ICT)</SelectItem>
                        <SelectItem value="AF">Afghanistan (direct cross-border disabled)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="inset inset-blue p-3.5 rounded-xl text-xs space-y-1">
                    <b>Authenticated Patient Profile</b>
                    <p className="text-muted-foreground">
                      Session data is used directly from your authenticated profile. No sensitive health information is transferred over insecure channels.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Step 3: Review & Book */}
            {step === 3 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Review & Book</h3>
                  <p className="text-xs text-muted-foreground">Review your consultation details before finalizing.</p>
                </div>

                <div className="inset inset-green space-y-2 rounded-xl p-4">
                  <b className="text-xs font-semibold text-foreground">Demonstration booking summary</b>
                  <p className="text-xs text-foreground/90">
                    <b>Modality:</b> {mode} · <b>Fee:</b> {feeMap[mode]} · <b>Status:</b> DEMO STAGING PREVIEW
                  </p>
                </div>

                <div className="inset inset-red space-y-1.5 rounded-xl p-4">
                  <b className="text-xs font-semibold text-danger">Staging gate: booking blocked</b>
                  <p className="text-xs leading-relaxed text-foreground">
                    Live booking and financial transactions are strictly blocked in this demonstration environment. No appointment will be recorded or billed.
                  </p>
                </div>
              </div>
            ) : null}

            {bookingError ? (
              <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-center text-xs text-destructive font-medium">
                {bookingError}
              </p>
            ) : null}

            {/* Wizard Navigation Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border/70">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 px-4 rounded-xl text-xs font-semibold text-muted-foreground"
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                {step > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    className="h-9 px-4 rounded-xl text-xs font-semibold"
                  >
                    Back
                  </Button>
                ) : null}

                {step < 3 ? (
                  <Button
                    size="sm"
                    disabled={step === 0 && !canProceedStep0}
                    onClick={() => setStep((s) => s + 1)}
                    className="h-9 rounded-lg px-5 text-xs font-semibold"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled
                    className="h-9 cursor-not-allowed rounded-lg bg-muted px-4 text-xs font-semibold text-muted-foreground"
                  >
                    Booking Disabled in Staging
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Summary Sidebar (§ references/08_Booking_Consent.png) */}
          <aside className="custom-scrollbar w-full shrink-0 space-y-4 border-t border-border bg-muted/40 p-5 sm:p-6 md:w-80 md:overflow-y-auto md:border-s md:border-t-0">
            <div className="flex items-center gap-3.5">
              <img
                src={getDoctorPhoto(doctor.name)}
                alt=""
                className="h-16 w-16 shrink-0 rounded-2xl border border-border object-cover"
              />
              <div className="min-w-0">
                <b className="text-base text-foreground block">{doctor.name}</b>
                <span className="block text-xs font-medium text-foreground">{doctor.specialty}</span>
                <p className="text-2xs text-muted-foreground mt-0.5">
                  {doctor.yearsExperience ?? 12} years experience
                </p>
                <span className="chip orange mt-1 whitespace-normal">Demo / synthetic — not a real clinician</span>
              </div>
            </div>

            <ul className="space-y-1.5 pt-1 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5"><BadgeCheck className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />Illustrative PMDC profile — verification required</li>
              {facility ? <li className="flex items-start gap-1.5"><MapPin className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />{facility} (sample)</li> : null}
              <li className="flex items-start gap-1.5"><Languages className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />{(doctor.languages.length ? doctor.languages : ['Urdu', 'English']).join(', ')} (sample)</li>
            </ul>

            <hr className="border-border/60" />

            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-foreground">Consultation fee · {mode.toLowerCase()}</span>
              <span className="text-xl font-semibold text-foreground tabular">{feeMap[mode]}</span>
            </div>

            <hr className="border-border/60" />

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground">What’s included</h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {[
                  'Example consultation (15–20 minutes)',
                  'Share reports and images when supported',
                  'Clinician-authored prescriptions, if appropriate',
                  'Consultation summary',
                  'Privacy controls per real policy',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <Check className="mt-px h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Hotline Alert */}
            <div className="inset inset-red space-y-2 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-danger">
                <AlertTriangle className="h-4 w-4" />
                <span>Not for emergencies</span>
              </div>
              <p className="text-xs leading-snug text-foreground">
                For a serious medical emergency in Pakistan, immediately call Rescue 1122.
              </p>
              <a
                href="tel:1122"
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-red-700 text-xs font-bold text-white transition-colors hover:bg-red-800"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Call Rescue 1122</span>
              </a>
            </div>
          </aside>
        </div>
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
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-10 text-center">
        <CalendarClock className="h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">No consultations yet</p>
        <p className="max-w-sm text-xs text-muted-foreground">Booked and past consultations appear here. Use “Find doctors” to book one.</p>
      </div>
    );
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
                  {c.scheduledAt ? ` · Scheduled ${new Date(c.scheduledAt).toLocaleString()}` : ''}
                </div>
              </div>
              <Badge variant={c.status === 'COMPLETED' ? 'secondary' : 'default'} className="text-2xs">{c.status}</Badge>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
