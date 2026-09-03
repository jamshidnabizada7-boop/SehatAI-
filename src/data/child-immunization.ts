// ============================================================
// SehatAI — Child Immunization Data (Phase 2)
// Pakistan Expanded Programme on Immunization (EPI) schedule.
//
// Sources: Pakistan EPI schedule (Federal Directorate of Immunization).
// This is the standard Pakistan schedule; province-specific
// variations may apply.
//
// All content is trilingual (EN / Urdu-Nastaliq / Roman-Urdu).
// ============================================================

import type { TriText } from '@/lib/types';

export interface VaccineDose {
  /** vaccine id */
  id: string;
  /** vaccine name */
  name: TriText;
  /** disease it prevents */
  disease: TriText;
  /** age when due (e.g. "Birth", "6 weeks", "10 weeks") */
  age: TriText;
  /** route (OPV = oral, IM = intramuscular, SC = subcutaneous) */
  route: 'OPV' | 'IM' | 'SC' | 'Oral' | 'ID';
  /** dose number in series (1, 2, 3, etc.) or 0 for single dose */
  dose: number;
  /** protects against */
  protectsAgainst: string;
}

/** Pakistan EPI immunization schedule (birth to 18 months). */
export const EPI_SCHEDULE: VaccineDose[] = [
  // ----- At birth -----
  {
    id: 'bcg-birth',
    name: { en: 'BCG', ur: 'بی سی جی', roman: 'BCG' },
    disease: { en: 'Tuberculosis', ur: 'ٹی بی', roman: 'TB' },
    age: { en: 'Birth', ur: 'پیدائش', roman: 'Paidaish' },
    route: 'ID',
    dose: 0,
    protectsAgainst: 'Tuberculosis (TB)',
  },
  {
    id: 'opv0-birth',
    name: { en: 'OPV-0', ur: 'پولیو 0', roman: 'Polio 0' },
    disease: { en: 'Polio', ur: 'پولیو', roman: 'Polio' },
    age: { en: 'Birth', ur: 'پیدائش', roman: 'Paidaish' },
    route: 'OPV',
    dose: 0,
    protectsAgainst: 'Poliomyelitis',
  },
  {
    id: 'hepb-birth',
    name: { en: 'Hep B (birth dose)', ur: 'ہیپاٹائٹس بی (پیدائش)', roman: 'Hep B (paidaish)' },
    disease: { en: 'Hepatitis B', ur: 'ہیپاٹائٹس بی', roman: 'Hepatitis B' },
    age: { en: 'Birth', ur: 'پیدائش', roman: 'Paidaish' },
    route: 'IM',
    dose: 0,
    protectsAgainst: 'Hepatitis B',
  },
  // ----- 6 weeks -----
  {
    id: 'opv1-6w',
    name: { en: 'OPV-1', ur: 'پولیو 1', roman: 'Polio 1' },
    disease: { en: 'Polio', ur: 'پولیو', roman: 'Polio' },
    age: { en: '6 weeks', ur: '6 ہفتے', roman: '6 hafte' },
    route: 'OPV',
    dose: 1,
    protectsAgainst: 'Poliomyelitis',
  },
  {
    id: 'penta1-6w',
    name: { en: 'Pentavalent-1', ur: 'پینٹاویلنٹ 1', roman: 'Pentavalent 1' },
    disease: { en: 'DTP + Hep B + Hib', ur: 'ڈی ٹی پی + ہیپ بی + ہب', roman: 'DTP + Hep B + Hib' },
    age: { en: '6 weeks', ur: '6 ہفتے', roman: '6 hafte' },
    route: 'IM',
    dose: 1,
    protectsAgainst: 'Diphtheria, Tetanus, Pertussis, Hepatitis B, Hib',
  },
  {
    id: 'pcv1-6w',
    name: { en: 'PCV-1', ur: 'پی سی وی 1', roman: 'PCV 1' },
    disease: { en: 'Pneumococcal', ur: 'نیوموکوکل', roman: 'Pneumococcal' },
    age: { en: '6 weeks', ur: '6 ہفتے', roman: '6 hafte' },
    route: 'IM',
    dose: 1,
    protectsAgainst: 'Pneumococcal pneumonia, meningitis',
  },
  {
    id: 'rota1-6w',
    name: { en: 'Rotavirus-1', ur: 'روٹا وائرس 1', roman: 'Rotavirus 1' },
    disease: { en: 'Rotavirus diarrhea', ur: 'روٹا وائرس دست', roman: 'Rotavirus dast' },
    age: { en: '6 weeks', ur: '6 ہفتے', roman: '6 hafte' },
    route: 'Oral',
    dose: 1,
    protectsAgainst: 'Rotavirus diarrhea',
  },
  // ----- 10 weeks -----
  {
    id: 'opv2-10w',
    name: { en: 'OPV-2', ur: 'پولیو 2', roman: 'Polio 2' },
    disease: { en: 'Polio', ur: 'پولیو', roman: 'Polio' },
    age: { en: '10 weeks', ur: '10 ہفتے', roman: '10 hafte' },
    route: 'OPV',
    dose: 2,
    protectsAgainst: 'Poliomyelitis',
  },
  {
    id: 'penta2-10w',
    name: { en: 'Pentavalent-2', ur: 'پینٹاویلنٹ 2', roman: 'Pentavalent 2' },
    disease: { en: 'DTP + Hep B + Hib', ur: 'ڈی ٹی پی + ہیپ بی + ہب', roman: 'DTP + Hep B + Hib' },
    age: { en: '10 weeks', ur: '10 ہفتے', roman: '10 hafte' },
    route: 'IM',
    dose: 2,
    protectsAgainst: 'Diphtheria, Tetanus, Pertussis, Hepatitis B, Hib',
  },
  {
    id: 'pcv2-10w',
    name: { en: 'PCV-2', ur: 'پی سی وی 2', roman: 'PCV 2' },
    disease: { en: 'Pneumococcal', ur: 'نیوموکوکل', roman: 'Pneumococcal' },
    age: { en: '10 weeks', ur: '10 ہفتے', roman: '10 hafte' },
    route: 'IM',
    dose: 2,
    protectsAgainst: 'Pneumococcal pneumonia, meningitis',
  },
  {
    id: 'rota2-10w',
    name: { en: 'Rotavirus-2', ur: 'روٹا وائرس 2', roman: 'Rotavirus 2' },
    disease: { en: 'Rotavirus diarrhea', ur: 'روٹا وائرس دست', roman: 'Rotavirus dast' },
    age: { en: '10 weeks', ur: '10 ہفتے', roman: '10 hafte' },
    route: 'Oral',
    dose: 2,
    protectsAgainst: 'Rotavirus diarrhea',
  },
  // ----- 14 weeks -----
  {
    id: 'opv3-14w',
    name: { en: 'OPV-3', ur: 'پولیو 3', roman: 'Polio 3' },
    disease: { en: 'Polio', ur: 'پولیو', roman: 'Polio' },
    age: { en: '14 weeks', ur: '14 ہفتے', roman: '14 hafte' },
    route: 'OPV',
    dose: 3,
    protectsAgainst: 'Poliomyelitis',
  },
  {
    id: 'penta3-14w',
    name: { en: 'Pentavalent-3', ur: 'پینٹاویلنٹ 3', roman: 'Pentavalent 3' },
    disease: { en: 'DTP + Hep B + Hib', ur: 'ڈی ٹی پی + ہیپ بی + ہب', roman: 'DTP + Hep B + Hib' },
    age: { en: '14 weeks', ur: '14 ہفتے', roman: '14 hafte' },
    route: 'IM',
    dose: 3,
    protectsAgainst: 'Diphtheria, Tetanus, Pertussis, Hepatitis B, Hib',
  },
  {
    id: 'pcv3-14w',
    name: { en: 'PCV-3', ur: 'پی سی وی 3', roman: 'PCV 3' },
    disease: { en: 'Pneumococcal', ur: 'نیوموکوکل', roman: 'Pneumococcal' },
    age: { en: '14 weeks', ur: '14 ہفتے', roman: '14 hafte' },
    route: 'IM',
    dose: 3,
    protectsAgainst: 'Pneumococcal pneumonia, meningitis',
  },
  // ----- 9 months -----
  {
    id: 'measles1-9m',
    name: { en: 'Measles-1', ur: 'خسرہ 1', roman: 'Khasra 1' },
    disease: { en: 'Measles', ur: 'خسرہ', roman: 'Khasra' },
    age: { en: '9 months', ur: '9 مہینے', roman: '9 mahine' },
    route: 'SC',
    dose: 1,
    protectsAgainst: 'Measles',
  },
  // ----- 15-18 months -----
  {
    id: 'measles2-15m',
    name: { en: 'Measles-2', ur: 'خسرہ 2', roman: 'Khasra 2' },
    disease: { en: 'Measles', ur: 'خسرہ', roman: 'Khasra' },
    age: { en: '15-18 months', ur: '15-18 مہینے', roman: '15-18 mahine' },
    route: 'SC',
    dose: 2,
    protectsAgainst: 'Measles',
  },
];

/** Group doses by age milestone. */
export const EPI_AGE_GROUPS = ['Birth', '6 weeks', '10 weeks', '14 weeks', '9 months', '15-18 months'] as const;

export function dosesForAge(age: string): VaccineDose[] {
  const ageMap: Record<string, string> = {
    Birth: 'Birth',
    '6 weeks': '6 weeks',
    '10 weeks': '10 weeks',
    '14 weeks': '14 weeks',
    '9 months': '9 months',
    '15-18 months': '15-18 months',
  };
  const target = ageMap[age] ?? age;
  return EPI_SCHEDULE.filter((d) => d.age.en === target);
}
