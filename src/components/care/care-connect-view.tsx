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
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden p-4 pb-20" role="main">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" aria-hidden />
          <div>
            <h1 className="text-lg font-bold">{T('care.title')}</h1>
            <p className="text-xs text-muted-foreground">{T('care.subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-1" role="tablist">
          <Button size="sm" variant={tab === 'find' ? 'default' : 'outline'} className="min-h-10 text-xs font-semibold" role="tab" aria-selected={tab === 'find'} onClick={() => setTab('find')}>
            <Search className="mr-1 h-3.5 w-3.5" />{T('care.findDoctors')}
          </Button>
          <Button size="sm" variant={tab === 'consultations' ? 'default' : 'outline'} className="min-h-10 text-xs font-semibold" role="tab" aria-selected={tab === 'consultations'} onClick={() => setTab('consultations')}>
            <Users className="mr-1 h-3.5 w-3.5" />{T('care.myConsultations')}
          </Button>
          {role === 'doctor' ? (
            <Button size="sm" variant={tab === 'dashboard' ? 'default' : 'outline'} className="min-h-10 text-xs font-semibold" role="tab" aria-selected={tab === 'dashboard'} onClick={() => setTab('dashboard')}>
              <LayoutDashboard className="mr-1 h-3.5 w-3.5" />{T('care.todaysSchedule')}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        {tab === 'find' ? <FindDoctors T={T} uiLang={uiLang} isLoggedIn={session?.user != null} onOpenConsultation={setOpenConsultationId} onGoChat={() => setView('chat')} /> : null}
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

  function getDoctorPhoto(name: string): string {
    if (name.includes('Ayesha')) return '/assets/doctor_ayesha.png';
    if (name.includes('Tariq')) return '/assets/doctor_tariq.png';
    if (name.includes('Samina')) return '/assets/doctor_samina.png';
    return '/assets/doctor_ayesha.png';
  }

  const displayedDoctors = doctors.length > 0 ? doctors : DEMO_DOCTORS;

  return (
    <div className="space-y-4">
      {/* High-Fidelity Mint/Sky Hero Banner (§ references/02_Care_Connect_Marketplace.png) */}
      <div className="hero-banner hero-care relative min-h-[220px] rounded-2xl p-6 sm:p-8 flex items-center justify-between overflow-hidden shadow-xs">
        <div className="max-w-[580px] z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            Connect with <span className="text-[#008d6d]">Verified<br />Pakistani Doctors</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2.5 max-w-lg leading-relaxed">
            Online consultations with licensed doctors across Pakistan — safe, affordable and in your language.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-5">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <div className="iconbox h-9 w-9 bg-white shadow-2xs rounded-xl">
                <Shield className="h-4 w-4 text-[#009b78]" />
              </div>
              <span>PMDC Verified<br />Doctors</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <div className="iconbox h-9 w-9 bg-white shadow-2xs rounded-xl">
                <Video className="h-4 w-4 text-amber-500" />
              </div>
              <span>Video, Audio<br />or Chat</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <div className="iconbox h-9 w-9 bg-white shadow-2xs rounded-xl">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <span>Upfront<br />Consultation Fees</span>
            </div>
          </div>
        </div>
        <img
          src="/assets/doctor_hero.png"
          alt="Care Connect clinician"
          className="hidden md:block absolute right-0 top-0 h-full w-auto max-w-[42%] object-cover object-left-top pointer-events-none"
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
              className="min-h-12 px-6 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shrink-0"
            >
              {matching ? '…' : 'Find Doctors'}
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
                    <a href={`tel:${n.number}`} className="inline-flex min-h-11 items-center rounded-lg bg-destructive px-4 font-bold text-white">
                      📞 {n.number}
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
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />
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
          <div className="flex items-center justify-between pt-1">
            <div>
              <h3 className="text-base font-bold text-foreground">Find the right doctor for you</h3>
              <p className="text-xs text-muted-foreground">Doctor listings below are synthetic design samples, not live bookable profiles.</p>
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger aria-label={T('care.sort')} className="h-8 w-36 rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Recommended ⌄" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Recommended</SelectItem>
                <SelectItem value="price_asc">Fee: Low to High</SelectItem>
                <SelectItem value="price_desc">Fee: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* High-Fidelity Doctor Rows List (§ references/02_Care_Connect_Marketplace.png) */}
          <div className="space-y-3.5">
            {loading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
            ) : (
              displayedDoctors.map((d) => {
                const photoUrl = getDoctorPhoto(d.name);
                const videoService = d.services.find((s) => s.type === 'VIDEO') ?? d.services[0];
                const feeText = videoService ? `${formatMoney({ amountMinor: videoService.priceMinor, currency: videoService.currency })}` : 'PKR 1,500';

                return (
                  <div
                    key={d.doctorProfileId}
                    className="doctor-row surface"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(d)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(d); }}
                  >
                    <img
                      src={photoUrl}
                      alt={d.name}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-border/80"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">{d.name}</h3>
                        <span className="chip blue text-[10px]">✓ PMDC verification demo</span>
                      </div>
                      <p className="text-xs text-foreground/80 font-medium">
                        <b>{d.specialty}</b> · {d.yearsExperience ?? 10} years experience
                      </p>
                      <p className="text-xs text-muted-foreground">{d.bio?.split('·')[1]?.trim() || d.facilityCity || 'Punjab Institute of Cardiology, Lahore'}</p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(d.languages.length > 0 ? d.languages : ['Urdu', 'English']).map((l) => (
                          <span key={l} className="chip stroke text-[10px]">{l}</span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-xs pt-1">
                        <span className="font-bold text-amber-600 flex items-center gap-1">
                          ★ {d.rating.average} ({d.rating.count} reviews)
                        </span>
                        <span className="text-muted-foreground">
                          · {d.completedConsultations}+ consultations
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between self-stretch shrink-0 min-w-[150px] border-s border-border/60 ps-4">
                      <span className={cn('chip text-[10px]', d.onlineNow ? 'green' : 'orange')}>
                        {d.onlineNow ? '● Available now' : 'Next: 2:00 PM'}
                      </span>
                      <div className="text-right my-1">
                        <div className="text-lg font-extrabold text-[#008d6d]">
                          {feeText}
                        </div>
                        <span className="text-[10px] text-muted-foreground">Consultation fee</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(d);
                        }}
                        className="w-full h-9 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs"
                      >
                        {d.onlineNow ? 'Book Video Consult' : 'Schedule Consultation'}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: High-Fidelity Trust Rail */}
        <aside className="w-80 shrink-0 hidden lg:flex flex-col gap-4">
          <div className="surface pad p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-foreground">Why Choose Care Connect?</h3>
            <div className="space-y-3">
              {[
                { icon: Shield, title: 'Verified Clinician Credentials', desc: 'Only after authoritative verification' },
                { icon: Video, title: 'Video, Audio or Chat', desc: 'Choose your preferred format' },
                { icon: FileText, title: 'Transparent Fees', desc: 'Review costs before booking' },
                { icon: MapPin, title: 'Doctors Across Pakistan', desc: 'Find appropriate specialists' },
                { icon: Lock, title: 'Health Information Privacy', desc: 'Review our actual privacy policy' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="iconbox h-8 w-8 rounded-lg bg-emerald-500/10 text-[#009b78] mt-0.5">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="text-foreground block">{item.title}</strong>
                    <span className="text-muted-foreground">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface pad p-5 space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wide">
              <div className="iconbox iconbox-blue h-8 w-8 rounded-lg">
                <Sparkles className="h-4 w-4" />
              </div>
              <span>Need Help Choosing?</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Not sure which specialist to consult? Explore the AI Health Guide for evidence-based specialty guidance.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onGoChat}
              className="w-full h-9 rounded-xl border-border font-bold hover:bg-accent mt-1 text-xs"
            >
              Get AI Recommendation →
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

  const feeMap = useMemo(() => ({
    VIDEO: '1,500',
    AUDIO: '1,200',
    TEXT: '800',
  }), []);

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
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-border/80 shadow-2xl rounded-2xl max-h-[90vh]">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Main Booking Wizard Column */}
          <div className="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar">
            <div>
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                ← Back to Doctor Profile
              </button>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground mt-2">
                Book a <span className="text-[#008d6d]">Telemedicine Consultation</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Consult with {doctor.name} (demo clinician) from the comfort of your home.
              </p>
            </div>

            {/* 4 Steps Indicator */}
            <div className="grid grid-cols-4 gap-2 border-y border-border/70 py-3">
              {[
                { label: 'Consultation Type', num: 1 },
                { label: 'Date & Time', num: 2 },
                { label: 'Your Information', num: 3 },
                { label: 'Review & Book', num: 4 },
              ].map((s, idx) => (
                <div
                  key={s.num}
                  className={cn(
                    'flex flex-col sm:flex-row items-center sm:items-start gap-1.5 text-center sm:text-left text-[11px] font-bold transition-colors',
                    step === idx ? 'text-[#008d6d]' : 'text-muted-foreground/70'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                      step === idx
                        ? 'bg-[#009b78] text-white'
                        : step > idx
                        ? 'bg-emerald-500/20 text-[#009b78]'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {step > idx ? '✓' : s.num}
                  </span>
                  <span className="truncate">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Step 0: Modality & Consents */}
            {step === 0 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">1. Select Consultation Modality</h3>
                  <p className="text-xs text-muted-foreground">Choose the most suitable way to connect to the doctor.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'VIDEO', icon: Video, name: 'Video Call (HD)', desc: 'Face-to-face consultation', fee: '1,500' },
                    { id: 'AUDIO', icon: Phone, name: 'Audio Call', desc: 'Voice consultation without video', fee: '1,200' },
                    { id: 'TEXT', icon: MessageSquare, name: 'Secure Chat', desc: 'Text-based consultation', fee: '800' },
                  ].map((m) => {
                    const sel = mode === m.id;
                    return (
                      <div
                        key={m.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setMode(m.id as 'VIDEO' | 'AUDIO' | 'TEXT')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMode(m.id as 'VIDEO' | 'AUDIO' | 'TEXT'); }}
                        className={cn(
                          'modality-card transition-all',
                          sel ? 'selected border-2 border-[#009b78] bg-[#f1fdf8] dark:bg-emerald-950/20' : 'hover:border-primary/40'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <m.icon className={cn('h-5 w-5', sel ? 'text-[#009b78]' : 'text-primary')} />
                          {sel ? <span className="chip green text-[10px]">Selected</span> : null}
                        </div>
                        <div>
                          <strong className="text-sm text-foreground block">{m.name}</strong>
                          <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                        </div>
                        <div className="mt-auto pt-2">
                          <span className="text-base font-extrabold text-[#008d6d]">PKR {m.fee}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-bold text-foreground">2. Consent & Important Information</h3>
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
                        className="mt-0.5 h-4 w-4 rounded border-border text-[#009b78] focus:ring-[#009b78]"
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
                        className="mt-0.5 h-4 w-4 rounded border-border text-amber-600 focus:ring-amber-500"
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
                        className="mt-0.5 h-4 w-4 rounded border-border text-[#009b78] focus:ring-[#009b78]"
                      />
                      <span className="leading-relaxed">
                        <b>Fee Transparency</b><br />
                        Selected illustrative consultation fee: PKR {feeMap[mode]}. No actual payment is collected in this test mode.
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
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        {new Date(s.startUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="inset inset-amber p-4 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2 font-bold text-amber-800 text-xs">
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
                        <SelectItem value="PK">🇵🇰 Pakistan (Punjab, Sindh, KPK, Balochistan, ICT)</SelectItem>
                        <SelectItem value="AF">🇦🇫 Afghanistan (Direct cross-border disabled)</SelectItem>
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

                <div className="inset inset-green p-4 rounded-xl border border-emerald-200 space-y-2">
                  <b className="text-xs text-emerald-900 font-bold uppercase tracking-wider">Demonstration Booking Summary</b>
                  <p className="text-xs text-foreground/90">
                    <b>Modality:</b> {mode} Call · <b>Fee:</b> PKR {feeMap[mode]} · <b>Status:</b> DEMO STAGING PREVIEW
                  </p>
                </div>

                <div className="inset inset-red p-4 rounded-xl border border-red-200 space-y-1.5">
                  <b className="text-xs text-red-800 font-bold uppercase tracking-wider">Staging Gate Hard-Block</b>
                  <p className="text-xs text-red-700/90 leading-relaxed">
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
                    ← Back
                  </Button>
                ) : null}

                {step < 3 ? (
                  <Button
                    size="sm"
                    disabled={step === 0 && !canProceedStep0}
                    onClick={() => setStep((s) => s + 1)}
                    className="h-9 px-5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs"
                  >
                    Proceed →
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled
                    className="h-9 px-5 rounded-xl bg-muted text-muted-foreground font-bold text-xs cursor-not-allowed"
                  >
                    Booking Disabled in Staging
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Summary Sidebar (§ references/08_Booking_Consent.png) */}
          <aside className="w-full md:w-80 shrink-0 bg-muted/20 border-t md:border-t-0 md:border-s border-border p-6 space-y-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/assets/doctor_booking.png"
                alt={doctor.name}
                className="h-20 w-20 rounded-full object-cover shrink-0 border-2 border-emerald-500/20 shadow-xs"
              />
              <div className="min-w-0">
                <b className="text-base text-foreground block">{doctor.name}</b>
                <span className="text-xs font-semibold text-[#008d6d] block">{doctor.specialty} · sample</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {doctor.yearsExperience ?? 12} years experience
                </p>
                <span className="chip orange text-[9px] mt-1">Demo credential</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[#009b78] font-bold">✓</span>
                <span>Illustrative PMDC profile — verification required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#009b78] font-bold">✓</span>
                <span>Punjab Institute of Cardiology, Lahore (sample)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#009b78] font-bold">✓</span>
                <span>English, Urdu, Punjabi (sample)</span>
              </div>
            </div>

            <hr className="border-border/60" />

            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-foreground">Consultation Fee</span>
              <span className="text-xl font-extrabold text-[#008d6d]">PKR {feeMap[mode]}</span>
            </div>
            <span className="chip green text-[10px] uppercase font-bold">{mode} consultation</span>

            <hr className="border-border/60" />

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">What’s Included?</h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {[
                  'Example consultation (15–20 minutes)',
                  'Share reports and images when supported',
                  'Clinician-authored prescriptions, if appropriate',
                  'Consultation summary',
                  'Privacy controls per real policy',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#009b78] font-bold">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Hotline Alert */}
            <div className="inset inset-red p-3.5 rounded-xl border border-red-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span>Not for emergencies</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                For a serious medical emergency in Pakistan, immediately call Rescue 1122.
              </p>
              <a
                href="tel:1122"
                className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors shadow-2xs"
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
    return <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">No consultations scheduled yet.</p>;
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
