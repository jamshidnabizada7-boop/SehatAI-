'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, MapPin, Search, Loader2, Briefcase, Languages, Clock, ShieldCheck, Filter, Star, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DoctorReviews } from './doctor-reviews';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Doctor { id: string; name: string; pmdcNumber: string; specialty: string; subSpecialty: string | null; facilityName: string | null; facilityCity: string | null; yearsExperience: number | null; languages: string[]; bio: string | null; }
const SPECIALTIES = ['Family Medicine', 'Internal Medicine', 'Cardiology', 'Pediatrics', 'Obstetrics & Gynecology', 'Dermatology', 'Psychiatry', 'Orthopedics', 'ENT', 'Ophthalmology', 'General Surgery', 'Pulmonology', 'Gastroenterology', 'Neurology', 'Urology', 'Nephrology', 'Endocrinology'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot'];
const LANG_LABELS: Record<string, string> = { en: 'English', ur: 'اردو', roman: 'Roman Urdu', pa: 'پنجابی', sd: 'Sindhi', ps: 'Pashto' };

export function DoctorDirectory() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(''); const [city, setCity] = useState(''); const [specialty, setSpecialty] = useState('');
  const [showReviews, setShowReviews] = useState<string | null>(null);

  const load = useCallback(async () => { setLoading(true); try { const p = new URLSearchParams(); if (q) p.set('q', q); if (city) p.set('city', city); if (specialty) p.set('specialty', specialty); const r = await fetch(`/api/doctors?${p}`, { cache: 'no-store' }); if (r.ok) setDoctors((await r.json()).doctors ?? []); } catch {} finally { setLoading(false); } }, [q, city, specialty]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  return (
    <div className="space-y-4">
      <div><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15"><Stethoscope className="h-5 w-5 text-emerald-600" /></span><div><h2 className="text-base font-bold text-foreground">Find a Doctor</h2><p className="text-xs text-muted-foreground">Browse PMDC-verified specialists.</p></div></div></div>
      <div className="space-y-2">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, facility, or specialty…" className="h-11 rounded-xl pl-10" /></div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={specialty} onValueChange={v => setSpecialty(v === 'all' ? '' : v)}><SelectTrigger className="h-10 rounded-xl text-xs"><Filter className="mr-1 h-3.5 w-3.5" /><SelectValue placeholder="All specialties" /></SelectTrigger><SelectContent><SelectItem value="all">All specialties</SelectItem>{SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          <Select value={city} onValueChange={v => setCity(v === 'all' ? '' : v)}><SelectTrigger className="h-10 rounded-xl text-xs"><MapPin className="mr-1 h-3.5 w-3.5" /><SelectValue placeholder="All cities" /></SelectTrigger><SelectContent><SelectItem value="all">All cities</SelectItem>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{loading ? 'Searching…' : `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''} found`}</span>{(q || city || specialty) && <button onClick={() => { setQ(''); setCity(''); setSpecialty(''); }} className="font-semibold text-primary hover:underline">Clear</button>}</div>
      {loading ? <div className="space-y-2">{[0,1,2].map(i => <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card/50" />)}</div> : doctors.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-2 p-8 text-center"><Stethoscope className="h-8 w-8 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No doctors found.</p></CardContent></Card>
      ) : (
        <ul className="space-y-2">{doctors.map((d, i) => (
          <motion.li key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="shadow-sm transition-all hover:border-emerald-500/30 hover:shadow-md"><CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-bold text-emerald-700">{d.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2"><h3 className="text-sm font-bold text-foreground">{d.name}</h3><Badge className="gap-1 bg-emerald-500/10 text-[9px] font-bold text-emerald-700"><ShieldCheck className="h-2.5 w-2.5" /> PMDC {d.pmdcNumber}</Badge></div>
                  <p className="mt-0.5 text-xs font-semibold text-foreground/85">{d.specialty}{d.subSpecialty ? ` · ${d.subSpecialty}` : ''}</p>
                  {d.facilityName && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Briefcase className="h-3 w-3" /> {d.facilityName}{d.facilityCity ? `, ${d.facilityCity}` : ''}</p>}
                  {d.bio && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{d.bio}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">{d.yearsExperience != null && <span className="inline-flex items-center gap-0.5"><Clock className="h-3 w-3" /> {d.yearsExperience}y exp</span>}{d.languages.length > 0 && <span className="inline-flex items-center gap-0.5"><Languages className="h-3 w-3" /> {d.languages.map(l => LANG_LABELS[l] ?? l).join(' · ')}</span>}</div>
                  <Button variant="ghost" size="sm" onClick={() => setShowReviews(showReviews === d.id ? null : d.id)} className="mt-2 min-h-8 gap-1 px-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-500/5 dark:text-emerald-400"><Star className="h-3 w-3" /> {showReviews === d.id ? 'Hide reviews' : 'View reviews'}<ChevronDown className={cn('h-3 w-3 transition-transform', showReviews === d.id && 'rotate-180')} /></Button>
                </div>
              </div>
              <AnimatePresence>{showReviews === d.id && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="mt-3 border-t border-border pt-3"><DoctorReviews doctorProfileId={d.id} doctorName={d.name} /></div></motion.div>)}</AnimatePresence>
            </CardContent></Card>
          </motion.li>
        ))}</ul>
      )}
    </div>
  );
}
