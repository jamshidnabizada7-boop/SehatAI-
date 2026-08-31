'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wind,
  MapPin,
  AlertTriangle,
  Leaf,
  ChevronDown,
  ChevronUp,
  Activity,
  ShieldAlert,
  Droplet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Lang } from '@/lib/types';
import {
  CITY_AQI,
  aqiBand,
  POLLEN_SEASONS,
  ASTHMA_TRIGGERS,
} from '@/data/air-quality';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Air Quality + Environmental Health (Phase 2)
// Shows current AQI for major Pakistan cities, seasonal pollen
// risk, and asthma trigger avoidance guide.
//
// Critical for Pakistan: Lahore consistently ranks among
// world's most polluted cities (AQI >300 in winter smog season).
// ============================================================

interface AirQualityTrackerProps {
  lang: Lang;
  className?: string;
}

export function AirQualityTracker({ lang, className }: AirQualityTrackerProps) {
  const [selectedCity, setSelectedCity] = useState(CITY_AQI[0]);
  const [showTriggers, setShowTriggers] = useState(false);
  const [showPollen, setShowPollen] = useState(false);

  const band = useMemo(() => aqiBand(selectedCity.aqi), [selectedCity]);
  const isHighRisk = band.asthmaRisk === 'high' || band.asthmaRisk === 'very-high' || band.asthmaRisk === 'extreme';

  // Current month for pollen season check
  const currentMonth = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[new Date().getMonth()];
  }, []);

  const activePollenSeason = useMemo(() => {
    return POLLEN_SEASONS.find((s) => {
      const [start, end] = s.months.split('-');
      const monthNum = (m: string) => { const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return months.indexOf(m); };
      const sNum = monthNum(start);
      const eNum = monthNum(end);
      const cNum = monthNum(currentMonth);
      if (sNum <= eNum) return cNum >= sNum && cNum <= eNum;
      return cNum >= sNum || cNum <= eNum; // wraps around year
    });
  }, [currentMonth]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-2xl border border-cyan-500/30 bg-cyan-50/30 p-4 shadow-sm dark:bg-cyan-950/10', className)}
      aria-label={lang === 'ur' ? 'ہوا کا معیار' : lang === 'roman' ? 'Hawa ka mayar' : 'Air quality + environmental health'}
    >
      {/* header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
          <Wind className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'ہوا کا معیار' : lang === 'roman' ? 'Hawa ka mayar' : 'Air quality'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {lang === 'ur' ? 'پاکستان کے شہروں کا AQI' : lang === 'roman' ? 'Pakistan ke shehron ka AQI' : 'Pakistan city AQI + allergy risk'}
          </p>
        </div>
      </div>

      {/* city selector */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {CITY_AQI.slice(0, 6).map((c) => {
          const isActive = c.city === selectedCity.city;
          const cBand = aqiBand(c.aqi);
          return (
            <button
              key={c.city}
              type="button"
              onClick={() => setSelectedCity(c)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                isActive ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' : 'border-border text-muted-foreground hover:bg-accent/30',
              )}
              aria-pressed={isActive}
            >
              <MapPin className="h-2.5 w-2.5" aria-hidden />
              {lang === 'ur' ? c.cityUr : c.city}
            </button>
          );
        })}
      </div>

      {/* AQI gauge */}
      <div className={cn('mb-3 rounded-xl border p-4', band.bgColor)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <MapPin className="h-3 w-3" aria-hidden />
              {lang === 'ur' ? selectedCity.cityUr : selectedCity.city}
            </p>
            <p className={cn('mt-1 text-3xl font-bold', band.color)}>{selectedCity.aqi}</p>
            <p className="text-[10px] text-muted-foreground">AQI · {selectedCity.dominant}</p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className={cn('text-[10px] font-bold', band.color, 'bg-white/50 dark:bg-black/20')}>
              {band.label[lang]}
            </Badge>
            {isHighRisk ? (
              <p className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400">
                <ShieldAlert className="h-3 w-3" aria-hidden />
                {lang === 'ur' ? 'دمہ خطرہ' : lang === 'roman' ? 'Dama khatra' : 'Asthma risk'}
              </p>
            ) : null}
          </div>
        </div>

        {/* AQI scale bar */}
        <div className="mt-3">
          <div className="relative h-2 overflow-hidden rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 via-orange-400 via-red-400 via-purple-500 to-rose-600">
            <div
              className="absolute top-1/2 h-3.5 w-1 -translate-y-1/2 rounded-full border-2 border-background bg-foreground"
              style={{ left: `${Math.min(100, (selectedCity.aqi / 500) * 100)}%` }}
              aria-hidden
            />
          </div>
          <div className="mt-1 flex justify-between text-[8px] text-muted-foreground">
            <span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>300</span><span>500</span>
          </div>
        </div>

        {/* advice */}
        <p className={cn('mt-2 text-[11px] leading-relaxed', band.color)}>{band.advice[lang]}</p>
      </div>

      {/* high-risk callout */}
      {isHighRisk ? (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-50/40 p-2.5 dark:bg-red-950/20">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
          <span className="text-[10px] leading-relaxed text-red-700 dark:text-red-400">
            {lang === 'ur'
              ? 'آپ کے شہر میں ہوا کا معیار خراب ہے۔ دمہ یا دل/پھیپھڑوں کی بیماری والے باہر نہ جائیں۔ N95 ماسک پہنیں۔ سانس کی تکلیف ہو تو 1122 پر کال کریں۔'
              : lang === 'roman'
                ? 'Aap ke shehar mein hawa ka mayar kharab hai. Dama ya dil/phaingron ki bimari wale bahar na jayein. N95 mask pehnein. Saans ki takleef ho to 1122 par call karein.'
                : 'Air quality in your city is poor. People with asthma or heart/lung disease should stay indoors. Wear N95 mask. Call 1122 if breathing difficulty.'}
          </span>
        </div>
      ) : null}

      {/* active pollen season */}
      {activePollenSeason ? (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-50/40 p-2.5 dark:bg-amber-950/20">
          <div className="flex items-center gap-1.5">
            <Leaf className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
              {lang === 'ur' ? 'موجودہ سیزن' : lang === 'roman' ? 'Mojooda season' : 'Active season'}: {activePollenSeason.name[lang]}
            </p>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{activePollenSeason.advice[lang]}</p>
        </div>
      ) : null}

      {/* expandable: all pollen seasons */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPollen((v) => !v)}
        className="mb-2 w-full gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
      >
        <Leaf className="h-3 w-3" aria-hidden />
        {lang === 'ur' ? 'تمام سیزن' : lang === 'roman' ? 'Tamam season' : 'All pollen seasons'}
        {showPollen ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />}
      </Button>
      <AnimatePresence>
        {showPollen ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mb-3 space-y-1.5">
              {POLLEN_SEASONS.map((s, i) => (
                <div key={i} className="rounded-lg border border-border/60 bg-card p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-foreground">{s.name[lang]}</span>
                    <span className="text-[10px] text-muted-foreground">{s.months}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{s.advice[lang]}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* expandable: asthma triggers */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowTriggers((v) => !v)}
        className="w-full gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
      >
        <Activity className="h-3 w-3" aria-hidden />
        {lang === 'ur' ? 'دمہ کے محرکات' : lang === 'roman' ? 'Dama ke muharrikaat' : 'Asthma triggers guide'}
        {showTriggers ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />}
      </Button>
      <AnimatePresence>
        {showTriggers ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-2 space-y-1.5">
              {ASTHMA_TRIGGERS.map((t, i) => (
                <div key={i} className="rounded-lg border border-border/60 bg-card p-2">
                  <p className="text-[11px] font-bold text-foreground">{t.trigger[lang]}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{t.avoidance[lang]}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {lang === 'ur' ? 'AQI ڈیٹا نمونہ ہے — لائیو API انضمام Phase 3 میں' : lang === 'roman' ? 'AQI data nimonah hai — live API Phase 3' : 'AQI data is sample — live API integration is Phase 3'}
      </p>
    </motion.section>
  );
}
