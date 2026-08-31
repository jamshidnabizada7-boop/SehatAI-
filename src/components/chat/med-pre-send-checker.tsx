'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, AlertTriangle, Check } from 'lucide-react';
import type { Lang } from '@/lib/types';
import { messageMentionsDrug, resolveDrugName } from '@/lib/drug-interactions';
import { loadProfile } from '@/lib/profile';
import { allergyCrossCheck } from '@/lib/profile-server';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Medication Pre-Send Checker (Phase 2)
// Client-side pre-send drug detection that shows a warning
// banner BEFORE the user sends a message containing a drug name.
// Checks against:
//   - Known drug names (from the drug-interaction engine)
//   - User's recorded allergies (from localStorage profile)
//   - User's current medications (for interaction preview)
//
// This is a CLIENT-SIDE preview — the server pipeline already
// runs the full checkDrugSafety() engine. This just gives the
// user an early warning + reassurance that the check will happen.
// ============================================================

interface MedPreSendCheckerProps {
  text: string;
  lang: Lang;
  className?: string;
}

interface DetectedDrug {
  name: string;
  canonical: string;
  /** matched allergy if any */
  allergyHit?: { allergy: string; class: string };
}

export function MedPreSendChecker({ text, lang, className }: MedPreSendCheckerProps) {
  const [profile, setProfile] = useState(loadProfile());

  // Reload profile when the text changes (in case user updated their profile)
  useEffect(() => {
    const handler = () => setProfile(loadProfile());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const detected = useMemo<DetectedDrug[]>(() => {
    if (!text || text.trim().length < 3) return [];
    if (!messageMentionsDrug(text)) return [];

    // Extract specific drug names mentioned
    const drugs: DetectedDrug[] = [];
    const lower = text.toLowerCase();

    // Use resolveDrugName on each word to find drug mentions
    const words = lower.split(/\s+/);
    const seen = new Set<string>();

    for (const word of words) {
      // Clean the word of punctuation
      const clean = word.replace(/[^a-z0-9-]/g, '');
      if (clean.length < 3) continue;
      const entry = resolveDrugName(clean);
      if (entry && !seen.has(entry.canonical)) {
        seen.add(entry.canonical);
        const drug: DetectedDrug = {
          name: clean,
          canonical: entry.canonical,
        };
        drugs.push(drug);
      }
    }

    // Also try multi-word phrases (e.g. "amoxicillin 500")
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = words[i].replace(/[^a-z0-9-]/g, '');
      if (phrase.length < 3) continue;
      const entry = resolveDrugName(phrase);
      if (entry && !seen.has(entry.canonical)) {
        seen.add(entry.canonical);
        drugs.push({ name: phrase, canonical: entry.canonical });
      }
    }

    // Cross-check against allergies
    if (profile && profile.allergies.length > 0) {
      const allergyHits = allergyCrossCheck(profile, text);
      for (const hit of allergyHits) {
        const existing = drugs.find((d) => d.canonical === hit.trigger || d.name === hit.trigger);
        if (existing) {
          existing.allergyHit = { allergy: hit.allergy, class: hit.drugClass };
        } else {
          drugs.push({
            name: hit.trigger,
            canonical: hit.trigger,
            allergyHit: { allergy: hit.allergy, class: hit.drugClass },
          });
        }
      }
    }

    return drugs;
  }, [text, profile]);

  if (detected.length === 0) return null;

  const hasAllergyHit = detected.some((d) => d.allergyHit);
  const drugNames = detected.map((d) => d.canonical).join(', ');
  const currentMeds = profile?.medications ?? [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={cn(
          'overflow-hidden rounded-lg border p-2.5 text-xs',
          hasAllergyHit
            ? 'border-red-500/40 bg-red-50/60 dark:bg-red-950/20'
            : 'border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/15',
          className,
        )}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle
            className={cn(
              'mt-0.5 h-3.5 w-3.5 shrink-0',
              hasAllergyHit ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400',
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className={cn('font-bold', hasAllergyHit ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400')}>
              {hasAllergyHit
                ? (lang === 'ur'
                    ? `⚠️ الرجی الرٹ: ${drugNames}`
                    : lang === 'roman'
                      ? `⚠️ Allergy alert: ${drugNames}`
                      : `⚠️ Allergy alert: ${drugNames}`)
                : (lang === 'ur'
                    ? `دوا کا پتہ چلا: ${drugNames}`
                    : lang === 'roman'
                      ? `Dawa ka pata chala: ${drugNames}`
                      : `Drug detected: ${drugNames}`)}
            </p>
            {hasAllergyHit ? (
              <p className="mt-0.5 text-[10px] leading-relaxed text-red-600 dark:text-red-400">
                {lang === 'ur'
                  ? 'آپ کی الرجی اس دوا سے میل کھاتی ہے۔ بھیجنے پر سی ایچ اے آئی پوری چیک کرے گا۔'
                  : lang === 'roman'
                    ? 'Aap ki allergy is dawa se milkhati hai. Bhejne par SehatAI poori check karega.'
                    : 'Your recorded allergy matches this drug. SehatAI will run a full check when you send.'}
              </p>
            ) : currentMeds.length > 0 ? (
              <p className="mt-0.5 text-[10px] leading-relaxed text-amber-700 dark:text-amber-400">
                {lang === 'ur'
                  ? `آپ کی موجودہ ادویات (${currentMeds.join(', ')}) کے ساتھ تعامل چیک کیا جائے گا۔`
                  : lang === 'roman'
                    ? `Aap ki mojooda adwayaat (${currentMeds.join(', ')}) ke saath taamul check kiya jayega.`
                    : `Will check against your current medications (${currentMeds.join(', ')}).`}
              </p>
            ) : (
              <p className="mt-0.5 text-[10px] leading-relaxed text-amber-700 dark:text-amber-400">
                {lang === 'ur'
                  ? 'بھیجنے پر سی ایچ اے آئی تعامل کی جانچ کرے گا۔'
                  : lang === 'roman'
                    ? 'Bhejne par SehatAI taamul ki jaanch karega.'
                    : 'SehatAI will check for interactions when you send.'}
              </p>
            )}
          </div>
          <Pill className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', hasAllergyHit ? 'text-red-500' : 'text-amber-500')} aria-hidden />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
