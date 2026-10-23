import type { Lang } from '@/lib/types';

/** Unknown location must never imply a particular national emergency number works. */
export function emergencyActionForUnknownLocation(text: string, lang: Lang): string {
  const local = lang === 'ur' ? 'مقامی ایمرجنسی سروس' : lang === 'roman' ? 'local emergency service' : 'your local emergency service';
  return text.replace(/\b(?:1122|1023|115|1166|1099|1152)\b(?:\s*\([^)]*\))?/g, local);
}
