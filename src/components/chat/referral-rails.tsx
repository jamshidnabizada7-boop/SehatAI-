'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Ambulance,
  Hospital,
  Stethoscope,
  ExternalLink,
  ShieldPlus,
} from 'lucide-react';
import type { TriageLevel, Lang, TriText } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Referral Rails (Phase 2)
// One-tap deep-links to Pakistan emergency, hospital, and
// telemedicine services. Shown in the chat view when triage
// is URGENT or EMERGENCY. Always available in a "Get care now"
// expandable section for SELF_CARE/ROUTINE.
//
// Sources: official org sites (oladoc.com, marham.pk, akuh.org,
// skmch.org.pk, indushospital.org.pk, shifa.com.pk, sehatsahulat).
// ============================================================

interface RailItem {
  id: string;
  icon: typeof Phone;
  label: TriText;
  desc: TriText;
  href: string;
  /** tel: for phone, https: for website, sms: for SMS booking */
  kind: 'tel' | 'web' | 'sms';
  /** highlight for emergency-tier items */
  emergency?: boolean;
}

const RAILS: RailItem[] = [
  // ----- Emergency tier (always shown first) -----
  {
    id: 'rescue-1122',
    icon: Ambulance,
    label: { en: 'Rescue 1122', ur: 'ریسکیو 1122', roman: 'Rescue 1122' },
    desc: { en: 'Free ambulance — nationwide', ur: 'مفت ایمبولینس — پورے ملک میں', roman: 'Muft ambulance — pore mulk mein' },
    href: 'tel:1122',
    kind: 'tel',
    emergency: true,
  },
  {
    id: 'edhi-115',
    icon: Ambulance,
    label: { en: 'Edhi 115', ur: 'ایڈی 115', roman: 'Edhi 115' },
    desc: { en: 'Edhi ambulance + welfare', ur: 'ایڈی ایمبولینس اور فلاحی مدد', roman: 'Edhi ambulance aur falahi madad' },
    href: 'tel:115',
    kind: 'tel',
    emergency: true,
  },
  {
    id: 'health-helpline-1166',
    icon: Phone,
    label: { en: 'Health Helpline 1166', ur: 'ہیلتھ ہیلپ لائن 1166', roman: 'Health Helpline 1166' },
    desc: { en: 'Free 24/7 health advice', ur: 'مفت 24/7 صحت مشورہ', roman: 'Muft 24/7 sehat mashwara' },
    href: 'tel:1166',
    kind: 'tel',
    emergency: true,
  },
  {
    id: 'women-helpline-1099',
    icon: Phone,
    label: { en: 'Women Helpline 1099', ur: 'ویمن ہیلپ لائن 1099', roman: 'Women Helpline 1099' },
    desc: { en: 'Madadgar — women in distress', ur: 'مددگار — پریشان خواتین', roman: 'Madadgar — preshan khwateen' },
    href: 'tel:1099',
    kind: 'tel',
    emergency: true,
  },
  // ----- Hospital tier -----
  {
    id: 'akuh',
    icon: Hospital,
    label: { en: 'Aga Khan Hospital', ur: 'آغاخان ہسپتال', roman: 'Agha Khan Hospital' },
    desc: { en: 'Karachi + nationwide clinics', ur: 'کراچی + پورے ملک میں کلینک', roman: 'Karachi + pore mulk mein clinic' },
    href: 'https://thecharitywalk.com.pk/aku-hospital',
    kind: 'web',
  },
  {
    id: 'skmch',
    icon: Hospital,
    label: { en: 'Shaukat Khanum', ur: 'شوکت خانم', roman: 'Shaukat Khanum' },
    desc: { en: 'Cancer hospital — Lahore, Peshawar, Karachi', ur: 'کینسر ہسپتال — لاہور، پشاور، کراچی', roman: 'Cancer hospital — Lahore, Peshawar, Karachi' },
    href: 'https://shaukatkhanum.org.pk/contact-us/',
    kind: 'web',
  },
  {
    id: 'indus',
    icon: Hospital,
    label: { en: 'Indus Hospital', ur: 'سندھ ہسپتال', roman: 'Indus Hospital' },
    desc: { en: 'Free care — Karachi + network', ur: 'مفت علاج — کراچی + نیٹورک', roman: 'Muft ilaaj — Karachi + network' },
    href: 'https://indushospital.org.pk/',
    kind: 'web',
  },
  {
    id: 'shifa',
    icon: Hospital,
    label: { en: 'Shifa International', ur: 'شفاء انٹرنیشنل', roman: 'Shifa International' },
    desc: { en: 'Islamabad — multi-specialty', ur: 'اسلام آباد — ملٹی اسپیشلٹی', roman: 'Islamabad — multi-specialty' },
    href: 'https://shifa.com.pk/',
    kind: 'web',
  },
  // ----- Telemedicine tier -----
  {
    id: 'oladoc',
    icon: Stethoscope,
    label: { en: 'oladoc', ur: 'اولاڈاک', roman: 'oladoc' },
    desc: { en: 'Book a doctor online — video consult', ur: 'آن لائن ڈاکٹر بک کریں — ویڈیو مشورہ', roman: 'Online doctor book karein — video mashwara' },
    href: 'https://www.oladoc.com/pakistan',
    kind: 'web',
  },
  {
    id: 'marham',
    icon: Stethoscope,
    label: { en: 'Marham.pk', ur: 'مرہم', roman: 'Marham.pk' },
    desc: { en: 'Find + book doctors near you', ur: 'قریب ڈاکٹر تلاش اور بکنگ', roman: 'Qareeb doctor talash aur booking' },
    href: 'https://www.marham.pk/',
    kind: 'web',
  },
  {
    id: 'instacare',
    icon: Stethoscope,
    label: { en: 'InstaCare', ur: 'انسٹاکئر', roman: 'InstaCare' },
    desc: { en: 'Telemedicine + home sample', ur: 'ٹیلی میڈیسن + ہوم سمپل', roman: 'Telemedicine + home sample' },
    href: 'https://instacare.com.pk/',
    kind: 'web',
  },
];

interface ReferralRailsProps {
  triageLevel: TriageLevel | null | undefined;
  lang: Lang;
  className?: string;
}

export function ReferralRails({ triageLevel, lang, className }: ReferralRailsProps) {
  const isEmergency = triageLevel === 'EMERGENCY';
  const isUrgent = triageLevel === 'URGENT';
  const showExpanded = isEmergency || isUrgent;

  const emergencyRails = useMemo(() => RAILS.filter((r) => r.emergency), []);
  const hospitalRails = useMemo(() => RAILS.filter((r) => !r.emergency), []);

  return (
    <AnimatePresence>
      {showExpanded ? (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className={cn(
            'overflow-hidden border-y border-red-600/30 bg-red-50/60 dark:bg-red-950/20',
            className,
          )}
          aria-label={lang === 'ur' ? 'فوری مدد حاصل کریں' : lang === 'roman' ? 'Fori madad hasool karein' : 'Get care now'}
        >
          <div className="mx-auto max-w-3xl px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <ShieldPlus className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
              <h3 className="text-sm font-bold text-red-700 dark:text-red-400">
                {isEmergency
                  ? lang === 'ur'
                    ? 'فوری مدد حاصل کریں — ابھی کال کریں'
                    : lang === 'roman'
                      ? 'Fori madad hasool karein — abhi call karein'
                      : 'Get help now — call immediately'
                  : lang === 'ur'
                    ? 'آج ہی ڈاکٹر سے رجوع کریں'
                    : lang === 'roman'
                      ? 'Aaj hi doctor se rujoo karein'
                      : 'See a doctor today'}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {emergencyRails.map((rail) => (
                <RailButton key={rail.id} rail={rail} lang={lang} />
              ))}
            </div>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

function RailButton({ rail, lang }: { rail: RailItem; lang: Lang }) {
  const Icon = rail.icon;
  const isExternal = rail.kind === 'web';
  return (
    <a
      href={rail.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={cn(
        'group flex flex-col items-start gap-1 rounded-xl border bg-card p-2.5 shadow-sm transition-all hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring',
        rail.emergency
          ? 'border-red-600/40 hover:border-red-600/60 hover:bg-red-50 dark:hover:bg-red-950/30'
          : 'border-border hover:border-primary/40 hover:bg-accent/50',
      )}
    >
      <span className="flex w-full items-center justify-between">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
            rail.emergency
              ? 'bg-red-600/15 text-red-600 dark:bg-red-500/20 dark:text-red-400'
              : 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {isExternal ? (
          <ExternalLink className="h-3 w-3 text-muted-foreground/60 transition-colors group-hover:text-foreground" aria-hidden />
        ) : null}
      </span>
      <span className="text-xs font-bold leading-tight text-foreground">{rail.label[lang]}</span>
      <span className="text-[10px] leading-tight text-muted-foreground">{rail.desc[lang]}</span>
    </a>
  );
}

// ----- Compact always-available version for the chat sidebar / facilities view -----

export function ReferralRailsCompact({ lang, className }: { lang: Lang; className?: string }) {
  const emergencyRails = RAILS.filter((r) => r.emergency);
  return (
    <section className={cn('rounded-2xl border border-border bg-card p-4 shadow-sm', className)} aria-label="Get care now">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
        <Phone className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
        {lang === 'ur' ? 'فوری مدد کے نمبر' : lang === 'roman' ? 'Fori madad ke number' : 'Emergency numbers'}
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {emergencyRails.map((rail) => (
          <RailButton key={rail.id} rail={rail} lang={lang} />
        ))}
      </div>
      <h3 className="mb-3 mt-5 flex items-center gap-2 text-sm font-bold text-foreground">
        <Hospital className="h-4 w-4 text-primary" aria-hidden />
        {lang === 'ur' ? 'ہسپتال اور ڈاکٹر تلاش کریں' : lang === 'roman' ? 'Hospital aur doctor talash karein' : 'Find a hospital or doctor'}
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {RAILS.filter((r) => !r.emergency).map((rail) => (
          <RailButton key={rail.id} rail={rail} lang={lang} />
        ))}
      </div>
    </section>
  );
}
