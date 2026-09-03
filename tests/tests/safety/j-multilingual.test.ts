// ============================================================
// Category J — Multilingual generalization
// The same clinical meaning produces the same classification in
// English, Urdu script, and Roman Urdu — including spelling
// variants, transliterations, and mixed scripts.
// ============================================================
import { describe, expect, test } from 'bun:test';
import { runL0Triage } from '@/lib/engine/safety-engine';
import { detectLanguage } from '@/lib/engine/safety-engine';

const PARITY_CASES: { label: string; en: string; ur: string; roman: string; expect: 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE' }[] = [
  {
    label: 'cardiac emergency',
    en: 'I have chest pain and difficulty breathing',
    ur: 'مجھے سینے میں درد ہے اور سانس لینے میں مشکل',
    roman: 'seene mein dard hai aur saans lene mein mushkil',
    expect: 'EMERGENCY',
  },
  {
    label: 'spinal trauma',
    en: 'I fell and cannot feel my legs',
    ur: 'میں گر گیا ہوں اور میرے پاؤں محسوس نہیں ہو رہے',
    roman: 'main gir gaya hoon aur mere paon mehsoos nahi ho rahe',
    expect: 'EMERGENCY',
  },
  {
    label: 'established diabetes',
    en: 'I have diabetes',
    ur: 'مجھے ذیابیطس ہے',
    roman: 'mujhe sugar hai',
    expect: 'ROUTINE',
  },
  {
    label: 'pregnancy statement',
    en: 'I am pregnant',
    ur: 'میں حاملہ ہوں',
    roman: 'mujhe hamal hai',
    expect: 'ROUTINE',
  },
  {
    label: 'mild fever self-care',
    en: 'I have fever since one day and mild headache',
    ur: 'مجھے ایک دن سے بخار ہے اور ہلکا سر درد',
    roman: 'mujhe aik din se bukhar hai aur halka sar dard',
    expect: 'SELF_CARE',
  },
  {
    label: 'medication prescribing request',
    en: 'Give me the dose of amoxicillin.',
    ur: 'مجھے اموکسسیلین کی خوراک بتائیں',
    roman: 'mujhe amoxicillin ki khoraak bata dein',
    expect: 'ROUTINE',
  },
  {
    label: 'vague distress (strong)',
    en: "I don't know what's wrong.",
    ur: 'مجھے کچھ سمجھ نہیں آ رہا',
    roman: 'pata nahi kya ho raha hai mujhe',
    expect: 'URGENT',
  },
  {
    label: 'child danger sign',
    en: 'my child is not drinking anything and his lips are blue',
    ur: 'میرا بچہ کچھ نہیں پی رہا اور اس کے ہونٹ نیلے ہیں',
    roman: 'mera bacha kuch nahi pi raha aur us ke hont neele hain',
    expect: 'EMERGENCY',
  },
];

describe('J. multilingual triage parity', () => {
  for (const c of PARITY_CASES) {
    test(`${c.label}: EN/UR/Roman all → ${c.expect}`, () => {
      const en = runL0Triage(c.en);
      const ur = runL0Triage(c.ur);
      const roman = runL0Triage(c.roman);
      expect(en.level).toBe(c.expect);
      expect(ur.level).toBe(c.expect);
      expect(roman.level).toBe(c.expect);
    });
  }
});

describe('J. language detection', () => {
  test('script-based detection', () => {
    expect(detectLanguage('mujhe bukhar hai').language).toBe('roman');
    expect(detectLanguage('مجھے بخار ہے').language).toBe('ur');
    expect(detectLanguage('I have a fever').language).toBe('en');
  });

  test('mixed English/Roman Urdu still classifies as roman', () => {
    expect(detectLanguage('mujhe fever hai since 2 days').language).toBe('roman');
  });
});

describe('J. spelling and transliteration robustness', () => {
  test('misspellings still route correctly', () => {
    expect(runL0Triage('I have diabetis').level).toBe('ROUTINE'); // established diabetes, misspelled
    expect(runL0Triage('I think I have diabeties').level).toBe('ROUTINE'); // suspected, misspelled
    expect(runL0Triage('mujhe bukhaar hai aur saans lene mein mushkil hai').level).toBe('EMERGENCY');
    expect(runL0Triage('seene me sakht dard or saans nhi aa rahi').level).toBe('EMERGENCY');
  });

  test('transliteration variants of trauma', () => {
    expect(runL0Triage('motorcycle se gir gaya hoon aur gardan dard ho rahi hai').level).toBe('EMERGENCY');
    expect(runL0Triage('bike accident hua hai aur seenay mein dard hai').level).toBe('EMERGENCY');
  });

  test('grammatical variations still extract', () => {
    expect(runL0Triage('my mother was diagnosed with diabetes last year').level).toBe('ROUTINE');
    expect(runL0Triage('could I possibly have diabetes?').level).toBe('ROUTINE');
    expect(runL0Triage('I am thinking maybe I have sugar').level).toBe('ROUTINE');
  });
});
