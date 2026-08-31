// ============================================================
// SehatAI — WHO SMART Guidelines Digital Adaptation Kit (Phase 3)
// Encodes WHO DAK L2 decision tables for maternal, child, and
// immunization care. These are the content standards that make
// SehatAI interoperable with WHO-aligned systems (DHIS2, CHT).
//
// Source: WHO SMART Guidelines (https://smart.who.int)
// ============================================================

import type { TriText } from '@/lib/types';

export interface DAKDecision {
  id: string;
  domain: 'maternal' | 'child' | 'immunization';
  condition: string;
  action: TriText;
  priority: 'emergency' | 'urgent' | 'routine';
  source: string;
}

// Maternal care decisions (WHO antenatal care guidelines)
export const MATERNAL_DAK: DAKDecision[] = [
  {
    id: 'm1',
    domain: 'maternal',
    condition: 'Severe headache + blurred vision (possible preeclampsia)',
    action: { en: 'Check blood pressure immediately. If ≥140/90, refer to hospital.', ur: 'فوراً بلڈ پریشر چیک کریں۔ اگر ≥140/90 ہو تو ہسپتال بھیجیں۔', roman: 'Fori BP check karein. Agar ≥140/90 ho to hospital bhejein.' },
    priority: 'urgent',
    source: 'WHO ANC Guidelines 2016',
  },
  {
    id: 'm2',
    domain: 'maternal',
    condition: 'Vaginal bleeding during pregnancy',
    action: { en: 'Refer to hospital immediately — do not wait.', ur: 'فوراً ہسپتال بھیجیں — انتظار نہ کریں۔', roman: 'Fori hospital bhejein — intezar na karein.' },
    priority: 'emergency',
    source: 'WHO ANC Guidelines 2016',
  },
  {
    id: 'm3',
    domain: 'maternal',
    condition: 'Reduced fetal movements',
    action: { en: 'Assess fetal heart rate. Refer if abnormal.', ur: 'بچے کی دھڑکن چیک کریں۔ غیر معیاری ہو تو بھیجیں۔', roman: 'Bachay ki dharkan check karein. Ghair mayari ho to bhejein.' },
    priority: 'urgent',
    source: 'WHO ANC Guidelines 2016',
  },
  {
    id: 'm4',
    domain: 'maternal',
    condition: 'High fever during pregnancy (>38.5°C)',
    action: { en: 'Assess for infection. Start antipyretic. Refer if no improvement in 48h.', ur: 'انفیکشن کی جانچ کریں۔ بخار کم کرنے کی دوا دیں۔ 48 گھنٹے میں بہتری نہ ہو تو بھیجیں۔', roman: 'Infection ki jaanch karein. Bukhar kam karne ki dawa dein. 48 ghante mein behtari na ho to bhejein.' },
    priority: 'urgent',
    source: 'WHO ANC Guidelines 2016',
  },
  {
    id: 'm5',
    domain: 'maternal',
    condition: 'Convulsions during pregnancy (eclampsia)',
    action: { en: 'EMERGENCY: Give magnesium sulfate. Refer to hospital immediately.', ur: 'ایمرجنسی: میگنیشیم سلفیٹ دیں۔ فوراً ہسپتال بھیجیں۔', roman: 'Emergency: Magnesium sulfate dein. Fori hospital bhejein.' },
    priority: 'emergency',
    source: 'WHO Eclampsia Management',
  },
];

// Child health decisions (WHO IMCI)
export const CHILD_DAK: DAKDecision[] = [
  {
    id: 'c1',
    domain: 'child',
    condition: 'Child unable to drink or breastfeed',
    action: { en: 'EMERGENCY: Refer to hospital immediately.', ur: 'ایمرجنسی: فوراً ہسپتال بھیجیں۔', roman: 'Emergency: Fori hospital bhejein.' },
    priority: 'emergency',
    source: 'WHO IMCI Guidelines',
  },
  {
    id: 'c2',
    domain: 'child',
    condition: 'Child with fast breathing (>60/min infant, >40/min 1-5yr)',
    action: { en: 'Likely pneumonia. Refer for antibiotic treatment.', ur: 'نمونیہ ممکن ہے۔ اینٹی بائیوٹک علاج کے لیے بھیجیں۔', roman: 'Pneumonia mumkin hai. Antibiotic ilaaj ke liye bhejein.' },
    priority: 'urgent',
    source: 'WHO IMCI Guidelines',
  },
  {
    id: 'c3',
    domain: 'child',
    condition: 'Fever in infant under 3 months',
    action: { en: 'EMERGENCY: Refer to hospital. Do not wait.', ur: 'ایمرجنسی: ہسپتال بھیجیں۔ انتظار نہ کریں۔', roman: 'Emergency: Hospital bhejein. Intezar na karein.' },
    priority: 'emergency',
    source: 'WHO IMCI Guidelines',
  },
  {
    id: 'c4',
    domain: 'child',
    condition: 'Child with chest indrawing',
    action: { en: 'Severe pneumonia. Refer urgently.', ur: 'شدید نمونیہ۔ فوراً بھیجیں۔', roman: 'Shadeed pneumonia. Fori bhejein.' },
    priority: 'emergency',
    source: 'WHO IMCI Guidelines',
  },
  {
    id: 'c5',
    domain: 'child',
    condition: 'Child with severe wasting (visible severe acute malnutrition)',
    action: { en: 'Refer for therapeutic feeding program.', ur: 'علاج معالجہ کھانے کے پروگرام کے لیے بھیجیں۔', roman: 'Ilaaj moalija khane ke program ke liye bhejein.' },
    priority: 'urgent',
    source: 'WHO IMCI Guidelines',
  },
];

// Immunization decisions (Pakistan EPI)
export const IMMUNIZATION_DAK: DAKDecision[] = [
  {
    id: 'i1',
    domain: 'immunization',
    condition: 'Child at birth — BCG due',
    action: { en: 'Give BCG vaccine at birth.', ur: 'پیدائش پر BCG ویکسین دیں۔', roman: 'Paidaish par BCG vaccine dein.' },
    priority: 'routine',
    source: 'Pakistan EPI Schedule',
  },
  {
    id: 'i2',
    domain: 'immunization',
    condition: 'Child at 6 weeks — OPV-1, Penta-1, PCV-1, Rota-1 due',
    action: { en: 'Give OPV-1, Pentavalent-1, PCV-1, Rotavirus-1 simultaneously.', ur: 'OPV-1, Penta-1, PCV-1, Rota-1 ایک ساتھ دیں۔', roman: 'OPV-1, Penta-1, PCV-1, Rota-1 ek saath dein.' },
    priority: 'routine',
    source: 'Pakistan EPI Schedule',
  },
  {
    id: 'i3',
    domain: 'immunization',
    condition: 'Child at 9 months — Measles-1 due',
    action: { en: 'Give Measles-1 vaccine.', ur: 'Measles-1 ویکسین دیں۔', roman: 'Measles-1 vaccine dein.' },
    priority: 'routine',
    source: 'Pakistan EPI Schedule',
  },
  {
    id: 'i4',
    domain: 'immunization',
    condition: 'Pregnant woman — Tetanus toxoid due',
    action: { en: 'Give tetanus toxoid. Ensure 2 doses before delivery.', ur: 'ٹیٹنس ٹاکسائڈ دیں۔ پیدائش سے پہلے 2 خوراکی یقینی بنائیں۔', roman: 'Tetanus toxoid dein. Paidaish se pehle 2 khoraia yaqini banayein.' },
    priority: 'routine',
    source: 'WHO ANC Guidelines + Pakistan EPI',
  },
];

export const ALL_DAK: DAKDecision[] = [...MATERNAL_DAK, ...CHILD_DAK, ...IMMUNIZATION_DAK];

export function getDAKForDomain(domain: string): DAKDecision[] {
  return ALL_DAK.filter((d) => d.domain === domain);
}
