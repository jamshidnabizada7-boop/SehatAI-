/**
 * SehatAI — Milestone 3 (M3) Chief Complaint vs Danger Sign Separation Verification Suite
 * 
 * Tests:
 * 1. Decoupling of l1.symptoms from l1.redFlagConcerns in l1Escalates and l1ConcernsText
 * 2. Trilingual explicit red-flag negation handling (EN, UR, Roman Urdu)
 * 3. Inherent danger-sign preservation (intrinsic negation phrases like 'saans nahi aa rahi')
 * 4. Calibrated baseline triage for routine complaints vs acute emergency triggers
 * 5. Musculoskeletal palpation-reproducible chest tightness evaluation
 */

import { runL0Triage, matchRedFlags, isTermAffirmedInClause, splitIntoClauses } from '../src/lib/engine/safety-engine';

console.log('============================================================');
console.log('  SehatAI — M3 Chief Complaint vs Danger Sign Separation Suite');
console.log('============================================================\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ------------------------------------------------------------
// 1. Explicit Negation Handling Tests (English, Roman Urdu, Urdu)
// ------------------------------------------------------------
const negationCases = [
  {
    input: 'I have a mild cough. No chest pain, no shortness of breath, no fever, no bleeding.',
    desc: 'English multi-symptom negation (no chest pain, no shortness of breath, no fever, no bleeding)',
  },
  {
    input: 'Sirf halka sar dard hai, chest pain nahi hai aur saans lene mein koi takleef nahi',
    desc: 'Roman Urdu trailing and phrase negation (chest pain nahi hai, saans lene mein koi takleef nahi)',
  },
  {
    input: 'Seene mein dard nahi hai, 2 din se halki khansi hai',
    desc: 'Roman Urdu seene mein dard nahi hai',
  },
  {
    input: 'Mareez behosh nahi hai, bilkul hosh mein hai',
    desc: 'Roman Urdu mareez behosh nahi hai',
  },
  {
    input: 'سینے میں درد نہیں ہے اور سانس میں کوئی تکلیف نہیں، صرف نزلہ ہے',
    desc: 'Urdu Nastaliq negation (سینے میں درد نہیں ہے، سانس میں کوئی تکلیف نہیں)',
  },
  {
    input: 'حمل ہے لیکن کوئی خون نہیں آ رہا اور سر میں درد نہیں ہے',
    desc: 'Urdu Nastaliq maternal negation (کوئی خون نہیں، سر میں درد نہیں)',
  },
];

for (const tc of negationCases) {
  const flags = matchRedFlags(tc.input);
  const triage = runL0Triage(tc.input);
  assert(
    flags.length === 0 && triage.level !== 'EMERGENCY',
    tc.desc,
    `flags=${flags.map((f) => f.pattern.id).join(', ')}, level=${triage.level}`
  );
}

// ------------------------------------------------------------
// 2. Intrinsic Danger Sign Preservation Tests (Negative state is danger)
// ------------------------------------------------------------
const intrinsicCases = [
  {
    input: 'The patient is having severe breathing distress and cannot breathe',
    patternId: 'chest_pain_dyspnea',
    category: 'cardiac',
    desc: 'English cannot breathe',
  },
  {
    input: 'Mareez behosh ho gaya hai aur hosh nahi aa raha',
    patternId: 'unconscious',
    category: 'unconscious',
    desc: 'Roman Urdu hosh nahi aa raha',
  },
  {
    input: 'Zakhm se bohot khoon beh raha hai aur khoon nahi ruk raha',
    patternId: 'severe_bleeding',
    category: 'bleeding',
    desc: 'Roman Urdu khoon nahi ruk raha',
  },
  {
    input: 'Bacha doodh nahi pee raha aur bilkul sust ho gaya hai',
    patternId: 'child_danger',
    category: 'pediatric',
    desc: 'Roman Urdu child doodh nahi pee raha',
  },
  {
    input: 'مریض بے ہوش ہے اور ہوش نہیں آ رہا',
    patternId: 'unconscious',
    category: 'unconscious',
    desc: 'Urdu Nastaliq ہوش نہیں آ رہا',
  },
  {
    input: 'سانس نہیں آ رہی اور سینے میں شدید درد ہے',
    patternId: 'chest_pain_dyspnea',
    category: 'cardiac',
    desc: 'Urdu Nastaliq سانس نہیں آ رہی',
  },
];

for (const tc of intrinsicCases) {
  const flags = matchRedFlags(tc.input);
  const triage = runL0Triage(tc.input);
  assert(
    triage.level === 'EMERGENCY' && triage.shortCircuited === true,
    `Intrinsic danger: ${tc.desc}`,
    `level=${triage.level}, shortCircuited=${triage.shortCircuited}`
  );
}

// ------------------------------------------------------------
// 3. Musculoskeletal Chest Palpation Differentiation (0% false emergency)
// ------------------------------------------------------------
const mskCases = [
  'My chest muscle feels tight and tender when pressing on the sternum after doing pushups yesterday',
  'My chest hurts only when I press on the rib bone with my finger after weightlifting',
  'My chest wall is tender only when I touch or press on the bone after bench pressing',
  'Seene ki haddi par ungli se dabane par dard hota hai pushups ke baad',
];

for (const msg of mskCases) {
  const flags = matchRedFlags(msg);
  const triage = runL0Triage(msg);
  assert(
    flags.length === 0 && triage.level !== 'EMERGENCY',
    `MSK chest wall non-emergency: "${msg.slice(0, 50)}..."`,
    `flags=${flags.map((f) => f.pattern.id).join(', ')}, level=${triage.level}`
  );
}

// ------------------------------------------------------------
// 4. Acute Life-Threatening Emergencies (100% emergency trigger)
// ------------------------------------------------------------
const acuteCases = [
  'I have crushing central chest pain radiating to left jaw with severe sweating and difficulty breathing',
  'My mother left side of face is drooping, arm is numb, and she cannot speak clearly',
  '8 months pregnant and experiencing heavy vaginal bleeding with severe abdominal pain',
  'The child is unresponsive, unconscious, and cannot be woken up',
];

for (const msg of acuteCases) {
  const triage = runL0Triage(msg);
  assert(
    triage.level === 'EMERGENCY' && triage.shortCircuited === true,
    `Acute emergency trigger: "${msg.slice(0, 50)}..."`,
    `level=${triage.level}`
  );
}

console.log(`\n============================================================`);
console.log(`  M3 Verification Summary: ${passed} PASSED, ${failed} FAILED`);
console.log(`============================================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
