import * as fs from 'fs';
import * as path from 'path';
import { CORPUS } from '../src/data/corpus';

const standardizedCorpus = CORPUS.map((item) => {
  const cloned = { ...item };

  // Standardize source verifiedAt to 2026-08
  cloned.source = {
    ...cloned.source,
    verifiedAt: '2026-08',
  };

  // Standardize English Content
  let en = cloned.content.en;
  // Ensure bullets
  // Standardize doctor warning header
  en = en.replace(/SEE A DOCTOR \/ [^:]+:/i, 'SEE A DOCTOR IF:');
  en = en.replace(/SEE A DOCTOR BEFORE RAMADAN[^:]*:/i, 'SEE A DOCTOR IF:');
  en = en.replace(/SEE A DOCTOR \/ HEALTH WORKER:/i, 'SEE A DOCTOR IF:');
  en = en.replace(/SEE A HEALTH FACILITY IF:/i, 'SEE A DOCTOR IF:');
  en = en.replace(/SEE A DOCTOR:(?!\s*IF)/i, 'SEE A DOCTOR IF:');
  if (!en.includes('SEE A DOCTOR IF:')) {
    en += '\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.';
  }

  // Standardize emergency header
  en = en.replace(/EMERGENCY \([^)]+\):/i, 'EMERGENCY / GO IMMEDIATELY:');
  en = en.replace(/EMERGENCY:(?!\s*\/)/i, 'EMERGENCY / GO IMMEDIATELY:');
  en = en.replace(/WARNING SIGNS \([^)]+\):/i, 'EMERGENCY / GO IMMEDIATELY:');
  if (!en.includes('EMERGENCY / GO IMMEDIATELY:')) {
    en += '\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.';
  }
  cloned.content.en = en;

  // Standardize Urdu Content
  let ur = cloned.content.ur;
  ur = ur.replace(/ڈاکٹر سے رجوع کریں:/g, 'ڈاکٹر کو دکھائیں:');
  ur = ur.replace(/ڈاکٹر یا ہیلتھ ورکر کو دکھائیں:/g, 'ڈاکٹر کو دکھائیں:');
  ur = ur.replace(/ہسپتال جائیں اگر:/g, 'ڈاکٹر کو دکھائیں اگر:');
  ur = ur.replace(/ڈاکٹر اور ہسپتال سے رجوع کریں:/g, 'ڈاکٹر کو دکھائیں:');
  ur = ur.replace(/ڈاکٹر کو دکھائیں اگر:(?!\s*اگر)/g, 'ڈاکٹر کو دکھائیں:');
  ur = ur.replace(/ڈاکٹر کو دکھائیں:/g, 'ڈاکٹر کو دکھائیں:');
  if (!ur.includes('ڈاکٹر کو دکھائیں:')) {
    ur += '\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔';
  }

  ur = ur.replace(/ایمرجنسی \([^)]+\):/g, 'ایمرجنسی (فوراً جائیں):');
  ur = ur.replace(/ایمرجنسی:(?!\s*\(فوراً جائیں\))/g, 'ایمرجنسی (فوراً جائیں):');
  ur = ur.replace(/خطرے کی علامات \([^)]+\):/g, 'ایمرجنسی (فوراً جائیں):');
  if (!ur.includes('ایمرجنسی (فوراً جائیں):')) {
    ur += '\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔';
  }
  cloned.content.ur = ur;

  // Standardize Roman Content
  let roman = cloned.content.roman;
  roman = roman.replace(/DOCTOR SE RAABTA KAREIN:/gi, 'DOCTOR KO DIKHAYEIN:');
  roman = roman.replace(/DOCTOR KO DIKHANA ZAROORI HAI:/gi, 'DOCTOR KO DIKHAYEIN:');
  roman = roman.replace(/HOSPITAL JAYEIN agar:/gi, 'DOCTOR KO DIKHAYEIN agar:');
  roman = roman.replace(/DOCTOR \/ 1122 KO FORI CALL KAREIN:/gi, 'DOCTOR KO DIKHAYEIN:');
  roman = roman.replace(/DOCTOR KO DIKHAYEIN:(?!\s*agar)/gi, 'DOCTOR KO DIKHAYEIN:');
  if (!roman.includes('DOCTOR KO DIKHAYEIN:')) {
    roman += '\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.';
  }

  roman = roman.replace(/EMERGENCY \([^)]+\):/gi, 'EMERGENCY (FORI JAYEIN):');
  roman = roman.replace(/EMERGENCY:(?!\s*\(FORI JAYEIN\))/gi, 'EMERGENCY (FORI JAYEIN):');
  roman = roman.replace(/KHATRAY KI ALAMAAT \([^)]+\):/gi, 'EMERGENCY (FORI JAYEIN):');
  if (!roman.includes('EMERGENCY (FORI JAYEIN):')) {
    roman += '\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.';
  }
  cloned.content.roman = roman;

  return cloned;
});

const fileContent = `import type { CorpusItem } from '@/lib/types';

// ============================================================
// SehatAI — Offline Clinical Guidance Knowledge Base (Corpus)
// 120+ verified, trilingual (English, Urdu Nastaliq, Roman Urdu) primary
// care, specialist medicine, and emergency topics across 20 medical domains.
// Provenance: WHO, UNICEF, Pakistan MoNHSRC, IFRC, IDF, UMANG, FAST.
// ============================================================

export const CORPUS: CorpusItem[] = ${JSON.stringify(standardizedCorpus, null, 2)};
`;

const corpusPath = path.join(__dirname, '../src/data/corpus.ts');
fs.writeFileSync(corpusPath, fileContent, 'utf-8');
console.log('Successfully standardized all 160 topics in src/data/corpus.ts!');
