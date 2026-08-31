import { CORPUS } from '../src/data/corpus';
import { runOfflineEngine, retrieveCorpus } from '../src/lib/engine/safety-engine';
import { damerauLevenshteinDistance, stringSimilarity, fuzzyFindMedicalConcept } from '../src/lib/engine/fuzzy-matcher';

let total = 0;
let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  total++;
  if (!condition) {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  } else {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  }
}

console.log('============================================================');
console.log('  SehatAI — Reviewer 2 Adversarial Deep Audit Suite');
console.log('============================================================\n');

// ------------------------------------------------------------
// Audit Group 1: Corpus Scale, Integrity & Structure (90 Topics)
// ------------------------------------------------------------
console.log('[Audit Group 1] Corpus Size & Domain Distribution');
assert(CORPUS.length >= 80, `CORPUS has >= 80 topics (actual: ${CORPUS.length})`);

const idSet = new Set<string>();
let dupCount = 0;
for (const item of CORPUS) {
  if (idSet.has(item.id)) dupCount++;
  idSet.add(item.id);
}
assert(dupCount === 0, `All topic IDs must be unique (found ${dupCount} duplicates)`);

let missingTitle = 0;
let missingContent = 0;
let missingPublisher = 0;
let missingTags = 0;
let missingUrduTags = 0;

for (const item of CORPUS) {
  if (!item.title.en || !item.title.ur || !item.title.roman) missingTitle++;
  if (!item.content.en || !item.content.ur || !item.content.roman) missingContent++;
  if (!item.source.publisher || !item.source.url || !item.source.verifiedAt) missingPublisher++;
  if (!item.tags || item.tags.length < 3) missingTags++;
  if (!item.tags.some(t => /[\u0600-\u06FF]/.test(t))) missingUrduTags++;
}

assert(missingTitle === 0, `All topics have complete trilingual titles (missing: ${missingTitle})`);
assert(missingContent === 0, `All topics have complete trilingual content (missing: ${missingContent})`);
assert(missingPublisher === 0, `All topics have verified publisher citations (missing: ${missingPublisher})`);
assert(missingTags === 0, `All topics have rich search tags (missing: ${missingTags})`);
assert(missingUrduTags === 0, `All topics have Perso-Arabic Urdu search tags (missing: ${missingUrduTags})`);

// ------------------------------------------------------------
// Audit Group 2: Pakistan Disease Burdens Retrieval Test
// ------------------------------------------------------------
console.log('\n[Audit Group 2] Retrieval of Target Pakistan Disease Burden Topics');

const targetRetrievals = [
  { q: 'mujhe bawaseer ki takleef hai khoon aata hai', target: 'hemorrhoids-piles', name: 'Bawaseer / Piles' },
  { q: 'aankhein peeli ho gayi yarqan lagta hai', target: 'jaundice-general', name: 'Yarqan / Jaundice' },
  { q: 'pitte ki pathri ka dard ho raha hai', target: 'gallstones-cholecystitis', name: 'Pitte ki pathri / Gallstones' },
  { q: 'gurde me pathri hai shadeed dard', target: 'kidney-stones', name: 'Gurde me pathri / Kidney stones' },
  { q: 'sinus dard naak band peshani par bojh', target: 'sinusitis-sinus-infection', name: 'Sinusitis / Sinus dard' },
  { q: 'chambal ki bimari hai kharish hoti hai', target: 'eczema-dermatitis', name: 'Chambal / Eczema' },
  { q: 'uric acid barh gaya hai naqras', target: 'gout-uric-acid', name: 'Uric acid / Gout' },
  { q: 'munh me chhale nikal aaye hain canker sores', target: 'mouth-ulcers-canker', name: 'Munh me chhale / Mouth ulcers' },
  { q: 'garmi me loo lag gayi shadeed bukhar', target: 'heatstroke-loo-lagna', name: 'Loo lagna / Heatstroke' },
  { q: 'bijli ka current lag gaya foran kya karein', target: 'electric-shock-first-aid', name: 'Bijli ka current / Electric shock' },
  { q: 'bachay ko diaper ke danay nappy rash', target: 'diaper-rash', name: 'Diaper rash' },
  { q: 'chhotay bachay ke pet me dard colic', target: 'infant-colic', name: 'Infant colic' },
  { q: 'meday ka ulcer pait me jalan', target: 'peptic-ulcer', name: 'Peptic ulcer' },
  { q: 'antriyon me pait maror ibs', target: 'irritable-bowel-ibs', name: 'IBS' },
  { q: 'peshab me rukawat gadood prostate', target: 'prostate-enlargement', name: 'Prostate enlargement' },
  { q: 'wiladat ke baad dekh bhaal postpartum', target: 'postpartum-care', name: 'Postpartum care' },
  { q: 'jigar par charbi fatty liver', target: 'fatty-liver', name: 'Fatty liver' },
  { q: 'khoon me chiknai high cholesterol', target: 'hyperlipidemia-cholesterol', name: 'Cholesterol / Hyperlipidemia' },
  { q: 'haiza lag gaya loose motions pani ki kami', target: 'cholera-waterborne', name: 'Haiza / Cholera' },
  { q: 'lakra kakra jism par danay chickenpox', target: 'chickenpox-varicella', name: 'Lakra kakra / Chickenpox' },
  { q: 'bawla kutta kaat gaya rabies vaccine', target: 'rabies-prevention', name: 'Bawla kutta / Rabies' },
  { q: 'naak se khoon nakseer phoot gayi', target: 'epistaxis-nosebleed', name: 'Nakseer / Nosebleed' },
  { q: 'galay me tonsils soojh gaye hain', target: 'tonsillitis-throat', name: 'Tonsillitis' },
  { q: 'subah uth kar cheenk aati hai dust allergy', target: 'allergic-rhinitis', name: 'Allergic rhinitis' },
  { q: 'ghutno me shadeed dard knee osteoarthritis', target: 'knee-osteoarthritis', name: 'Osteoarthritis' },
  { q: 'pao me moch aa gayi ankle sprain', target: 'sprain-strain-rice', name: 'Sprain' },
  { q: 'gardan me dard khichao neck pain', target: 'neck-strain-pain', name: 'Neck pain' },
  { q: 'raat ko neend na aana insomnia', target: 'insomnia-sleep-hygiene', name: 'Insomnia' },
  { q: 'dil ghabrana bechaini panic attack', target: 'panic-attack-anxiety', name: 'Panic attack' },
  { q: 'sar ghoomna chakkar aana vertigo', target: 'vertigo-dizziness', name: 'Vertigo' },
  { q: 'masoorhay sujan khoon gingivitis', target: 'gingivitis-gum-disease', name: 'Gingivitis' },
  { q: 'jild par daad fungal ringworm', target: 'fungal-ringworm', name: 'Fungal ringworm' },
  { q: 'chehre par keel muhasay acne pimples', target: 'acne-vulgaris', name: 'Acne vulgaris' },
  { q: 'aankh me chemical gir gaya eye injury', target: 'eye-injury-chemical', name: 'Eye injury' },
];

for (const t of targetRetrievals) {
  const hits = retrieveCorpus(t.q, 5);
  const matched = hits.some(h => h.item.id === t.target);
  assert(matched, `Target topic [${t.name}] retrieved for query "${t.q}"`);
}

// ------------------------------------------------------------
// Audit Group 3: Typos & Transliteration Resilience
// ------------------------------------------------------------
console.log('\n[Audit Group 3] Typos & Transliteration Resilience');

const typoCases = [
  { input: 'headeach', target: 'headache' },
  { input: 'tootheach', target: 'toothache' },
  { input: 'diaria', target: 'diarrhea' },
  { input: 'vomting', target: 'vomiting' },
  { input: 'bukaar', target: 'fever' },
  { input: 'dengu', target: 'dengue' },
  { input: 'maleria', target: 'malaria' },
  { input: 'tifoid', target: 'typhoid' },
  { input: 'namonia', target: 'pneumonia' },
  { input: 'asthama', target: 'asthma' },
  { input: 'shugar', target: 'diabetes' },
  { input: 'bawaser', target: 'hemorrhoids' },
  { input: 'yerqan', target: 'jaundice' },
  { input: 'eczima', target: 'eczema' },
  { input: 'qabaz', target: 'constipation' },
];

for (const tc of typoCases) {
  const f = fuzzyFindMedicalConcept(tc.input);
  assert(f !== null && f.canonical === tc.target, `Typo "${tc.input}" resolves to "${tc.target}" (got: ${f?.canonical})`);
}

// ------------------------------------------------------------
// Audit Group 4: Multi-Turn Offline Inheritance
// ------------------------------------------------------------
console.log('\n[Audit Group 4] Multi-Turn Offline Inheritance');

const multiTurnTests = [
  {
    priorTopic: 'gallstones',
    history: [
      { role: 'user', content: 'pitte ki pathri ka dard hai' },
      { role: 'assistant', content: '**Pitte ki pathri (gallstones)**\n\n• Parhez karein' }
    ],
    followUps: [
      'What are the home remedies?',
      'When to see a doctor?',
      'How to manage the pain at home?',
      'khatray ki alamaat kya hain?',
      'diet aur khana kya hona chahiye?'
    ]
  },
  {
    priorTopic: 'mouth-ulcers',
    history: [
      { role: 'user', content: 'munh me chhale hain bohot' },
      { role: 'assistant', content: '**Mouth ulcers (munh ke chhale)**\n\n• Rinse mouth' }
    ],
    followUps: [
      'How can I treat this at home?',
      'What steps should I take?',
      'Tips for recovery',
      'gharelu totkay batayein'
    ]
  },
  {
    priorTopic: 'heatstroke',
    history: [
      { role: 'user', content: 'garmi me loo lag gayi' },
      { role: 'assistant', content: '**Heatstroke (loo lagna)**\n\n• Thanda paani dalein' }
    ],
    followUps: [
      'Immediate first aid steps',
      'doctor ko kab dikhana hai?',
      'kya parhez karein?'
    ]
  }
];

for (const mt of multiTurnTests) {
  for (const q of mt.followUps) {
    const res = runOfflineEngine(q, 'en', mt.history as any);
    assert(
      !res.content.includes('does not cover') && !res.content.includes('seedha jawab maujood nahin'),
      `Multi-turn follow-up "${q}" inherited context for "${mt.priorTopic}" (got citations: ${res.citations.map(c => c.id).join(', ')})`
    );
  }
}

// ------------------------------------------------------------
// Audit Group 5: Edge Cases & Boundaries
// ------------------------------------------------------------
console.log('\n[Audit Group 5] Boundary & Edge Cases');
assert(fuzzyFindMedicalConcept('') === null, 'Empty string returns null');
assert(fuzzyFindMedicalConcept('   ') === null, 'Whitespace-only returns null');
assert(fuzzyFindMedicalConcept('!@#$%^&*()') === null, 'Punctuation-only returns null');
assert(fuzzyFindMedicalConcept('??? HEADEACH !!!')?.canonical === 'headache', 'Punctuation and uppercase handled');

console.log('\n============================================================');
console.log(`  AUDIT SUMMARY: ${passed} PASSED / ${failed} FAILED`);
console.log('============================================================\n');

if (failed > 0) {
  process.exit(1);
}
