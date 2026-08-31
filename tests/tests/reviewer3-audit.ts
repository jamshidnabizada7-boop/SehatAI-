import { CORPUS } from '../src/data/corpus';
import {
  fuzzyFindMedicalConcept,
  MEDICAL_CANONICAL_TERMS,
  damerauLevenshteinDistance,
  stringSimilarity,
} from '../src/lib/engine/fuzzy-matcher';
import { runOfflineEngine, retrieveCorpus } from '../src/lib/engine/safety-engine';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const failedTestNames: string[] = [];

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${msg}`);
  } else {
    failedTests++;
    failedTestNames.push(msg);
    console.error(`  ❌ FAIL: ${msg}`);
  }
}

console.log('============================================================');
console.log('  SehatAI — Reviewer 3 Adversarial Deep Audit Suite');
console.log('============================================================\n');

// ------------------------------------------------------------
// Group 1: 80+ Topics & 12 Clinical Domains Integrity
// ------------------------------------------------------------
console.log('[Audit Group 1] Clinical Corpus Scale, Uniqueness & 12 Domains');

assert(CORPUS.length >= 80, `Corpus size must be >= 80 topics (actual: ${CORPUS.length})`);

const seenIds = new Set<string>();
let duplicateCount = 0;
for (const item of CORPUS) {
  if (seenIds.has(item.id)) duplicateCount++;
  seenIds.add(item.id);
}
assert(duplicateCount === 0, `All topic IDs must be globally unique (found: ${duplicateCount})`);

// Define 12 clinical domains and map topics
const domainMap: Record<string, string[]> = {
  'Gastrointestinal': [
    'diarrhea', 'cholera', 'vomiting', 'gerd', 'constipation',
    'hemorrhoids', 'gallstones', 'peptic-ulcer', 'ibs', 'nausea-vomiting',
  ],
  'Respiratory/ENT': [
    'asthma', 'pneumonia', 'sinusitis', 'allergic-rhinitis', 'tonsillitis',
    'nosebleed', 'bronchitis', 'ear-infection', 'cough-cold', 'covid-flu',
    'sore-throat', 'conjunctivitis',
  ],
  'Cardiovascular/Metabolic': [
    'hypertension', 'hypoglycemia', 'diabetes', 'hyperlipidemia', 'cholesterol',
    'gout', 'fatty-liver', 'angina', 'chestpain',
  ],
  'Neurological/Mental Health': [
    'stroke', 'vertigo', 'insomnia', 'panic-attack', 'migraine',
    'headache', 'head-injury', 'seizure', 'mental-health',
  ],
  'Infectious/Vector-Borne': [
    'fever', 'dengue', 'malaria', 'typhoid', 'jaundice',
    'chickenpox', 'rabies', 'tuberculosis', 'measles', 'scabies',
    'antibiotic-awareness',
  ],
  'Musculoskeletal/Trauma': [
    'backache', 'osteoarthritis', 'neck-pain', 'sprain', 'fracture',
    'head-injury',
  ],
  'Dermatological/Burns': [
    'eczema', 'fungal-infection', 'acne', 'allergy', 'burn',
    'hives-urticaria', 'scabies',
  ],
  'Urological/Renal': [
    'kidney-stones', 'uti', 'prostate',
  ],
  'Maternal/Antenatal': [
    'postpartum', 'family-planning', 'anemia', 'pregnancy-care',
    'preeclampsia-warning',
  ],
  'Pediatric/Neonatal': [
    'fever-child', 'infant-colic', 'diaper-rash', 'child-nutrition',
    'immunization-schedule', 'newborn-danger-signs',
  ],
  'Dental/Oral': [
    'toothache', 'gingivitis', 'mouth-ulcers',
  ],
  'Environmental/First Aid': [
    'heatstroke', 'electric-shock', 'eye-injury', 'poisoning',
    'snakebite', 'bleeding', 'choking', 'cpr-basic',
  ],
};

const domains = Object.keys(domainMap);
assert(domains.length === 12, 'Must have exactly 12 medical domains specified in R1');

for (const [domain, topicKeys] of Object.entries(domainMap)) {
  const matchingItems = CORPUS.filter((item) =>
    topicKeys.some((k) => item.topic.toLowerCase().includes(k) || item.id.toLowerCase().includes(k))
  );
  assert(
    matchingItems.length > 0,
    `Domain [${domain}] has verified coverage in corpus (${matchingItems.length} topics found: ${matchingItems.map(i => i.id).join(', ')})`
  );
}

// ------------------------------------------------------------
// Group 2: Trilingual Formatting & Metadata Strict Invariant
// ------------------------------------------------------------
console.log('\n[Audit Group 2] Trilingual Formatting, Warning Signs & Citation Verification');

let missingTitles = 0;
let missingContents = 0;
let missingBullets = 0;
let missingDoctorTriggers = 0;
let missingEmergencyTriggers = 0;
let invalidPublishers = 0;
let invalidUrls = 0;
let invalidLicenses = 0;
let invalidVerifiedDates = 0;
let invalidAudiences = 0;
let invalidSeverities = 0;

const validAudiences = new Set(['general', 'maternal', 'child', 'emergency']);
const validSeverities = new Set(['SELF_CARE', 'ROUTINE', 'URGENT', 'EMERGENCY']);

const missingBulletIds: string[] = [];
const missingDoctorIds: string[] = [];
const missingEmergencyIds: string[] = [];

for (const item of CORPUS) {
  if (!item.title?.en || !item.title?.ur || !item.title?.roman) missingTitles++;
  if (!item.content?.en || !item.content?.ur || !item.content?.roman) missingContents++;

  const enContent = item.content?.en || '';
  const urContent = item.content?.ur || '';
  const romanContent = item.content?.roman || '';

  if (!enContent.includes('•') || !urContent.includes('•') || !romanContent.includes('•')) {
    missingBullets++;
    missingBulletIds.push(item.id);
  }

  const enDoc = /SEE A DOCTOR|SEE A HEALTH FACILITY|SAME DAY|GO TO A CLINIC|DOCTOR/i.test(enContent);
  const urDoc = /ڈاکٹر|ہسپتال|کلینک/i.test(urContent);
  const romanDoc = /DOCTOR|HOSPITAL|CLINIC|SAME DAY/i.test(romanContent);
  if (!enDoc || !urDoc || !romanDoc) {
    missingDoctorTriggers++;
    missingDoctorIds.push(item.id);
  }

  const enEmerg = /EMERGENCY|GO IMMEDIATELY|IMMEDIATELY|IMMEDIATE|1122|DANGER/i.test(enContent);
  const urEmerg = /ایمرجنسی|فوراً جائیں|فوری طور پر|فوری|1122|خطرہ/i.test(urContent);
  const romanEmerg = /EMERGENCY|FORI JAYEIN|FORI|1122|KHATRA/i.test(romanContent);
  if (!enEmerg || !urEmerg || !romanEmerg) {
    missingEmergencyTriggers++;
    missingEmergencyIds.push(item.id);
  }

  if (!item.source?.publisher || item.source.publisher.trim().length === 0) invalidPublishers++;
  if (!item.source?.url || !item.source.url.startsWith('https://')) invalidUrls++;
  if (!item.source?.license || item.source.license.trim().length === 0) invalidLicenses++;
  if (!item.source?.verifiedAt || !/^\d{4}-\d{2}$/.test(item.source.verifiedAt)) invalidVerifiedDates++;

  if (!validAudiences.has(item.audience)) invalidAudiences++;
  if (!validSeverities.has(item.baseLevel)) invalidSeverities++;
}

assert(missingTitles === 0, `All ${CORPUS.length} topics have complete trilingual titles (missing: ${missingTitles})`);
assert(missingContents === 0, `All ${CORPUS.length} topics have complete trilingual content (missing: ${missingContents})`);
assert(missingBullets === 0, `All ${CORPUS.length} topics have bulleted care steps (missing: ${missingBullets}: ${missingBulletIds.join(', ')})`);
assert(missingDoctorTriggers === 0, `All ${CORPUS.length} topics have doctor warning triggers (missing: ${missingDoctorTriggers}: ${missingDoctorIds.join(', ')})`);
assert(missingEmergencyTriggers === 0, `All ${CORPUS.length} topics have emergency red-flag triggers (missing: ${missingEmergencyTriggers}: ${missingEmergencyIds.join(', ')})`);
assert(invalidPublishers === 0, `All ${CORPUS.length} topics have valid publishers (invalid: ${invalidPublishers})`);
assert(invalidUrls === 0, `All ${CORPUS.length} topics have valid https URLs (invalid: ${invalidUrls})`);
assert(invalidLicenses === 0, `All ${CORPUS.length} topics have valid licenses (invalid: ${invalidLicenses})`);
assert(invalidVerifiedDates === 0, `All ${CORPUS.length} topics have YYYY-MM verified dates (invalid: ${invalidVerifiedDates})`);
assert(invalidAudiences === 0, `All ${CORPUS.length} topics have valid audience types (invalid: ${invalidAudiences})`);
assert(invalidSeverities === 0, `All ${CORPUS.length} topics have valid baseLevel types (invalid: ${invalidSeverities})`);

// ------------------------------------------------------------
// Group 3: Sub-1ms Damerau-Levenshtein Benchmark & Typo Resilience
// ------------------------------------------------------------
console.log('\n[Audit Group 3] Algorithmic Fuzzy Matcher Performance & Typo Coverage');

const benchmarkStart = performance.now();
const BENCHMARK_ITERS = 1000;
for (let i = 0; i < BENCHMARK_ITERS; i++) {
  fuzzyFindMedicalConcept('mujhe pitte ki pathri ka dard hai');
}
const benchmarkDuration = (performance.now() - benchmarkStart) / BENCHMARK_ITERS;
assert(benchmarkDuration < 1.0, `Average fuzzy lookup must be sub-1ms (got: ${benchmarkDuration.toFixed(4)}ms)`);

const testTypoCases = [
  // Newly expanded topics (R2 requirements)
  { input: 'mujhe bawaseer ki takleef hai', expected: 'hemorrhoids' },
  { input: 'bawaser ka ilaj', expected: 'hemorrhoids' },
  { input: 'bawasir bleeding', expected: 'hemorrhoids' },
  { input: 'aankhein peeli yarqan lagta hai', expected: 'jaundice' },
  { input: 'yerqan ka bukhar', expected: 'jaundice' },
  { input: 'pitte ki pathri dard', expected: 'gallstones' },
  { input: 'pitta pathri', expected: 'gallstones' },
  { input: 'gurde me pathri hai', expected: 'kidney-stones' },
  { input: 'gurde ki pathri', expected: 'kidney-stones' },
  { input: 'gurdy me pathri', expected: 'kidney-stones' },
  { input: 'sinusitis infection naak band', expected: 'sinusitis' },
  { input: 'sinus dard peshani', expected: 'sinusitis' },
  { input: 'chambal ki bimari', expected: 'eczema' },
  { input: 'eczima on skin', expected: 'eczema' },
  { input: 'uric acid barh gaya', expected: 'gout' },
  { input: 'naqras joron me', expected: 'gout' },
  { input: 'munh ke chhale canker', expected: 'mouth-ulcers' },
  { input: 'munh me chhale dard', expected: 'mouth-ulcers' },
  { input: 'garmi me loo lag gayi', expected: 'heatstroke' },
  { input: 'loo lagna shadeed bukhar', expected: 'heatstroke' },
  { input: 'bijli ka current lag gaya', expected: 'electric-shock' },
  { input: 'current lagna first aid', expected: 'electric-shock' },
  // General typo resilience
  { input: 'headeach', expected: 'headache' },
  { input: 'tootheach', expected: 'toothache' },
  { input: 'diaria', expected: 'diarrhea' },
  { input: 'vomting', expected: 'vomiting' },
  { input: 'bukaar', expected: 'fever' },
  { input: 'dengu', expected: 'dengue' },
  { input: 'maleria', expected: 'malaria' },
  { input: 'tifoid', expected: 'typhoid' },
  { input: 'namonia', expected: 'pneumonia' },
  { input: 'asthama', expected: 'asthma' },
  { input: 'shugar', expected: 'diabetes' },
  // Perso-Arabic Urdu inputs
  { input: 'بواسیر', expected: 'hemorrhoids' },
  { input: 'یرقان', expected: 'jaundice' },
  { input: 'پتے کی پتھری', expected: 'gallstones' },
  { input: 'گردے میں پتھری', expected: 'kidney-stones' },
  { input: 'سائنس کا درد', expected: 'sinusitis' },
  { input: 'چمبل', expected: 'eczema' },
  { input: 'یورک ایسڈ', expected: 'gout' },
  { input: 'منہ کے چھالے', expected: 'mouth-ulcers' },
  { input: 'لو لگنا', expected: 'heatstroke' },
  { input: 'بجلی کا کرنٹ', expected: 'electric-shock' },
];

for (const tc of testTypoCases) {
  const result = fuzzyFindMedicalConcept(tc.input);
  assert(
    result !== null && result.canonical === tc.expected,
    `Fuzzy match for "${tc.input}" -> expected "${tc.expected}" (got: "${result?.canonical}")`
  );
}

// ------------------------------------------------------------
// Group 4: Multi-Turn Context Inheritance Exhaustive Verification
// ------------------------------------------------------------
console.log('\n[Audit Group 4] Multi-Turn Offline Context Inheritance Across Target Topics');

const multiTurnTopics = [
  { initial: 'I have severe kidney stones', topicId: 'kidney-stones' },
  { initial: 'pitte ki pathri ka masla hai', topicId: 'gallstones' },
  { initial: 'mujhe bawaseer hai khoon aata hai', topicId: 'hemorrhoids' },
  { initial: 'munh me chhale ho gaye hain', topicId: 'mouth-ulcers' },
  { initial: 'garmi me loo lag gayi', topicId: 'heatstroke' },
  { initial: 'sinus dard peshani bojh', topicId: 'sinusitis' },
  { initial: 'chambal ki bimari hai kharish', topicId: 'eczema' },
  { initial: 'uric acid barh gaya hai naqras', topicId: 'gout' },
  { initial: 'aankhein peeli yarqan lagta hai', topicId: 'jaundice' },
  { initial: 'bijli ka current lag gaya', topicId: 'electric-shock' },
];

const followUpPrompts = [
  'What are the home remedies?',
  'When to see a doctor?',
  'What danger signs to watch for?',
  'How to prevent this?',
  'گھر پر کیا دیکھ بھال کریں؟',
  'khatray ki alamaat kya hain?',
];

for (const mtt of multiTurnTopics) {
  const history = [
    { role: 'user', content: mtt.initial },
    { role: 'assistant', content: 'Here is some initial guidance on your condition.' },
  ];

  for (const followUp of followUpPrompts) {
    const response = runOfflineEngine(followUp, 'en', history);
    assert(
      response.citations.length > 0 &&
      response.citations.some(c => c.id.toLowerCase().includes(mtt.topicId) || c.title.toLowerCase().includes(mtt.topicId)),
      `Multi-turn follow-up "${followUp}" inherits context for "${mtt.topicId}" (citations: ${response.citations.map(c => c.id).join(', ')})`
    );
  }
}

// ------------------------------------------------------------
// Group 5: Red Flag Emergency Short-Circuiting Invariance
// ------------------------------------------------------------
console.log('\n[Audit Group 5] Red Flag Emergency Short-Circuiting Invariance');

const emergencyQueries = [
  'Crushing central chest pain radiating to left arm and sweating',
  'My mother face is drooping and arm is numb',
  'Child is completely unresponsive and having seizures',
  'Severe heavy bleeding in 8th month of pregnancy',
  'Cannot breathe gasping for air blue lips',
];

for (const eq of emergencyQueries) {
  const resp = runOfflineEngine(eq, 'en');
  assert(
    resp.triage.level === 'EMERGENCY',
    `Emergency query "${eq.slice(0, 40)}..." triggered EMERGENCY (got: ${resp.triage.level})`
  );
  assert(
    resp.content.includes('1122'),
    `Emergency response contains 1122 Rescue emergency contact`
  );
}

// ------------------------------------------------------------
// Group 6: Edge Cases & Boundary Handling
// ------------------------------------------------------------
console.log('\n[Audit Group 6] Boundary & Malformed Inputs');

assert(fuzzyFindMedicalConcept('') === null, 'Empty string returns null');
assert(fuzzyFindMedicalConcept('    ') === null, 'Whitespace returns null');
assert(fuzzyFindMedicalConcept('!@#$%^&*()') === null, 'Symbols return null');
assert(fuzzyFindMedicalConcept('1234567890') === null, 'Numbers return null');

const offlineEmpty = runOfflineEngine('', 'en');
assert(offlineEmpty.citations.length === 0, 'Offline empty query produces no invalid citations');

console.log('\n============================================================');
console.log(`  AUDIT RESULTS: ${passedTests} PASSED / ${failedTests} FAILED (TOTAL: ${totalTests})`);
if (failedTests > 0) {
  console.log('\n  FAILURES:');
  failedTestNames.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
}
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
