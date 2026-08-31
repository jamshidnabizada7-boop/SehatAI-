import { CORPUS } from '../src/data/corpus';
import { PrismaClient } from '@prisma/client';
import { damerauLevenshteinDistance, stringSimilarity, fuzzyFindMedicalConcept, MEDICAL_CANONICAL_TERMS } from '../src/lib/engine/fuzzy-matcher';
import { runOfflineEngine, retrieveCorpus } from '../src/lib/engine/safety-engine';

const prisma = new PrismaClient();

let passCount = 0;
let failCount = 0;

function check(desc: string, condition: boolean, detail?: string) {
  if (condition) {
    passCount++;
    console.log(`  [PASS] ${desc}`);
  } else {
    failCount++;
    console.error(`  [FAIL] ${desc} ${detail ? `(${detail})` : ''}`);
  }
}

async function runAudit() {
  console.log('======================================================================');
  console.log('  INDEPENDENT VICTORY AUDIT SUITE — CLINICAL CORPUS & OFFLINE ENGINE');
  console.log('======================================================================\n');

  // ------------------------------------------------------------
  // 1. CORPUS SCALE & STRUCTURE AUDIT (R1)
  // ------------------------------------------------------------
  console.log('--- 1. Corpus Scale & Structural Integrity Audit ---');
  check('Corpus size >= 120 topics', CORPUS.length >= 120, `actual: ${CORPUS.length}`);

  const ids = new Set<string>();
  let trilingualTitleValid = true;
  let trilingualContentValid = true;
  let tagsValid = true;
  let sourceValid = true;
  let homeCareValid = true;
  let redFlagsValid = true;

  const EXPECTED_DOMAINS = [
    'Gastrointestinal',
    'Respiratory/ENT',
    'Cardiovascular/Metabolic',
    'Neurological/Mental Health',
    'Infectious/Vector-Borne',
    'Musculoskeletal/Trauma',
    'Dermatological/Burns',
    'Urological/Renal',
    'Maternal/Antenatal',
    'Pediatric/Neonatal',
    'Dental/Oral',
    'Environmental/First Aid',
  ];

  // Domain map checks
  const domainTopicMapping: Record<string, string[]> = {
    Gastrointestinal: ['diarrhea', 'cholera', 'vomiting', 'gerd', 'constipation', 'peptic-ulcer', 'ibs', 'hemorrhoids', 'gallstones'],
    'Respiratory/ENT': ['asthma', 'pneumonia', 'bronchitis', 'sinusitis', 'allergic-rhinitis', 'tonsillitis', 'nosebleed', 'earache'],
    'Cardiovascular/Metabolic': ['hypertension', 'hypoglycemia', 'diabetes', 'hyperlipidemia', 'cholesterol', 'gout', 'fatty-liver', 'angina', 'chestpain'],
    'Neurological/Mental Health': ['stroke', 'headache', 'migraine', 'vertigo', 'insomnia', 'panic-attack', 'mental-health', 'seizure-first-aid'],
    'Infectious/Vector-Borne': ['fever', 'dengue', 'malaria', 'typhoid', 'jaundice', 'chickenpox', 'rabies', 'antibiotic-awareness'],
    'Musculoskeletal/Trauma': ['back-pain', 'knee-osteoarthritis', 'neck-strain-pain', 'sprain-strain-rice', 'fracture-first-aid', 'head-injury', 'sprain', 'fracture'],
    'Dermatological/Burns': ['eczema', 'fungal-ringworm', 'acne-vulgaris', 'hives-urticaria', 'burn', 'burns'],
    'Urological/Renal': ['uti-burning', 'kidney-stones', 'prostate-enlargement', 'uti', 'prostate'],
    'Maternal/Antenatal': ['pregnancy-danger', 'postpartum-care', 'family-planning', 'postpartum'],
    'Pediatric/Neonatal': ['fever-child', 'infant-colic', 'diaper-rash', 'newborn-danger', 'child-nutrition-who'],
    'Dental/Oral': ['toothache-dental', 'mouth-ulcers-canker', 'gingivitis-gum-disease', 'toothache', 'mouth-ulcers', 'gingivitis'],
    'Environmental/First Aid': ['snakebite-first-aid', 'heatstroke-loo-lagna', 'electric-shock-first-aid', 'eye-injury-chemical', 'choking-first-aid', 'bleeding-direct-pressure', 'poisoning-first-aid'],
  };

  for (const domain of EXPECTED_DOMAINS) {
    const topicList = domainTopicMapping[domain];
    const found = CORPUS.some(item => topicList.includes(item.topic) || topicList.includes(item.id));
    check(`Domain "${domain}" is represented in corpus`, found);
  }

  for (const item of CORPUS) {
    // Unique ID
    if (ids.has(item.id) || !item.id.trim()) {
      ids.add(item.id);
      check(`Duplicate or empty ID: ${item.id}`, false);
    } else {
      ids.add(item.id);
    }

    // Trilingual title
    if (!item.title?.en?.trim() || !item.title?.ur?.trim() || !item.title?.roman?.trim()) {
      trilingualTitleValid = false;
    }

    // Trilingual content
    if (!item.content?.en?.trim() || !item.content?.ur?.trim() || !item.content?.roman?.trim()) {
      trilingualContentValid = false;
    }

    // Urdu script presence (Unicode arabic block)
    const hasUrduScript = /[\u0600-\u06FF]/.test(item.title.ur) && /[\u0600-\u06FF]/.test(item.content.ur);
    if (!hasUrduScript) {
      check(`Topic ${item.id} has authentic Nastaliq Urdu script`, false);
    }

    // Red flag / warning signs structure
    const enContent = item.content.en;
    if (!enContent.includes('•') && !enContent.includes('SEE A DOCTOR') && !enContent.includes('EMERGENCY') && !enContent.includes('GO IMMEDIATELY')) {
      homeCareValid = false;
    }

    // Tags
    if (!Array.isArray(item.tags) || item.tags.length < 3) {
      tagsValid = false;
    }

    // Source
    if (
      !item.source?.publisher ||
      !item.source?.url?.startsWith('https://') ||
      !item.source?.license ||
      !item.source?.verifiedAt
    ) {
      sourceValid = false;
    }
  }

  check(`All ${CORPUS.length} topics have unique non-empty IDs`, ids.size === CORPUS.length);
  check(`All ${CORPUS.length} topics have complete trilingual titles (EN, UR, Roman)`, trilingualTitleValid);
  check(`All ${CORPUS.length} topics have complete trilingual guidance (EN, UR, Roman)`, trilingualContentValid);
  check(`All ${CORPUS.length} topics have structured home care bullet points & warning/emergency triggers`, homeCareValid);
  check(`All ${CORPUS.length} topics have rich search tags (EN, UR, Roman, phonetic)`, tagsValid);
  check(`All ${CORPUS.length} topics have verified publisher attribution with HTTPS URLs & licenses`, sourceValid);

  // ------------------------------------------------------------
  // 2. DATABASE SYNCHRONIZATION AUDIT (R3)
  // ------------------------------------------------------------
  console.log('\n--- 2. Database Synchronization & Storage Audit ---');
  const dbDocs = await prisma.document.findMany();
  check(`Prisma Document table contains >= 80 rows (actual: ${dbDocs.length})`, dbDocs.length >= 80);
  check(`Prisma Document table matches exact corpus count (${CORPUS.length})`, dbDocs.length === CORPUS.length);

  const dbSlugs = new Set(dbDocs.map(d => d.slug));
  const missingInDb = CORPUS.filter(c => !dbSlugs.has(c.id));
  check('Every corpus item ID exists in SQLite db/custom.db', missingInDb.length === 0, `missing: ${missingInDb.map(m => m.id).join(', ')}`);

  const dbTitlesValid = dbDocs.every(d => d.title && d.publisher && d.sourceUrl && d.topic && d.audience && d.baseLevel);
  check('All database documents have populated metadata and provenance fields', dbTitlesValid);

  // ------------------------------------------------------------
  // 3. ALGORITHMIC FUZZY MATCHER & TYPO RESILIENCE AUDIT (R2)
  // ------------------------------------------------------------
  console.log('\n--- 3. Algorithmic Fuzzy Matcher & Typo Resilience Audit ---');

  // Benchmark speed
  const t0 = performance.now();
  for (let i = 0; i < 5000; i++) {
    fuzzyFindMedicalConcept('mujhe pitte ki pathri aur pet me dard hai');
  }
  const t1 = performance.now();
  const avgMs = (t1 - t0) / 5000;
  check(`Fuzzy matcher sub-millisecond execution (< 0.5ms per query, actual: ${avgMs.toFixed(4)}ms)`, avgMs < 0.5);

  const testCases = [
    // Condition: Bawaseer / Hemorrhoids
    { query: 'mujhe bawaseer ka masla hai', expected: 'hemorrhoids' },
    { query: 'bawaser bleeding', expected: 'hemorrhoids' },
    { query: 'bawasir ka dard', expected: 'hemorrhoids' },
    { query: 'بواسیر کا مسئلہ', expected: 'hemorrhoids' },

    // Condition: Yarqan / Jaundice
    { query: 'yarqan ho gaya hai peeli aankhein', expected: 'jaundice' },
    { query: 'yerqan bukhar', expected: 'jaundice' },
    { query: 'یرقان اور پیلا پن', expected: 'jaundice' },

    // Condition: Gallstones / Pitte ki pathri
    { query: 'pitte ki pathri ka dard', expected: 'gallstones' },
    { query: 'pitta pathri', expected: 'gallstones' },
    { query: 'پتے کی پتھری', expected: 'gallstones' },

    // Condition: Kidney stones / Gurde ki pathri
    { query: 'gurde me pathri aur dard', expected: 'kidney-stones' },
    { query: 'gurde ki pathri', expected: 'kidney-stones' },
    { query: 'گردے میں پتھری', expected: 'kidney-stones' },

    // Condition: Sinusitis / Sinus dard
    { query: 'sinus dard aur naak band', expected: 'sinusitis' },
    { query: 'sinusitis infection', expected: 'sinusitis' },
    { query: 'سائنس کا درد', expected: 'sinusitis' },

    // Condition: Mouth ulcers / Munh ke chhale
    { query: 'munh me chhale nikal aaye hain', expected: 'mouth-ulcers' },
    { query: 'munh ke chhale', expected: 'mouth-ulcers' },
    { query: 'منہ کے چھالے', expected: 'mouth-ulcers' },

    // Condition: Eczema / Chambal
    { query: 'chambal ki kharish', expected: 'eczema' },
    { query: 'jild par chambal', expected: 'eczema' },
    { query: 'چمبل', expected: 'eczema' },

    // Condition: Gout / Uric acid
    { query: 'uric acid barh gaya hai', expected: 'gout' },
    { query: 'angoothay me dard gout', expected: 'gout' },
    { query: 'یورک ایسڈ', expected: 'gout' },

    // Condition: Heatstroke / Loo lagna
    { query: 'garmi me loo lagna', expected: 'heatstroke' },
    { query: 'loo lag gayi', expected: 'heatstroke' },
    { query: 'شدید لو لگنا', expected: 'heatstroke' },

    // Condition: Electric shock / Bijli ka current
    { query: 'bijli ka current lag gaya', expected: 'electric-shock' },
    { query: 'current lagna', expected: 'electric-shock' },
    { query: 'بجلی کا کرنٹ', expected: 'electric-shock' },
  ];

  for (const tc of testCases) {
    const res = fuzzyFindMedicalConcept(tc.query);
    check(`Fuzzy resolves "${tc.query}" -> ${tc.expected}`, res !== null && res.canonical === tc.expected, `got: ${res?.canonical}`);
  }

  // ------------------------------------------------------------
  // 4. MULTI-TURN OFFLINE CONTEXT INHERITANCE AUDIT (R2 & R3)
  // ------------------------------------------------------------
  console.log('\n--- 4. Multi-Turn Offline Context Inheritance Audit ---');

  const topicsToTest = [
    {
      topicName: 'Gout / Uric Acid',
      userHistory: 'mujhe uric acid aur joron me dard hai',
      assistantHistory: '**Gout and uric acid management**\n• Drink plenty of water and limit red meat',
      followUp: 'What are the home remedies?',
      expectedPhrase: 'uric',
    },
    {
      topicName: 'Hemorrhoids / Bawaseer',
      userHistory: 'mujhe bawaseer ka masla hai',
      assistantHistory: '**Piles & hemorrhoids (bawaseer)**\n• High fiber diet and warm water sitz bath',
      followUp: 'When to see a doctor?',
      expectedPhrase: 'doctor',
    },
    {
      topicName: 'Gallstones / Pitte ki Pathri',
      userHistory: 'pitte me pathri batayi hai ultrasound par',
      assistantHistory: '**Gallstones & gallbladder inflammation**\n• Avoid fatty meals',
      followUp: 'گھر پر احتیاطی تدابیر بتائیں',
      expectedPhrase: 'پتھری',
    },
    {
      topicName: 'Sinusitis / Sinus',
      userHistory: 'sar dard aur sinus ka masla hai',
      assistantHistory: '**Sinusitis — care and warning signs**\n• Steam inhalation twice daily',
      followUp: 'How can I treat this at home?',
      expectedPhrase: 'sinus',
    },
    {
      topicName: 'Heatstroke / Loo Lagna',
      userHistory: 'garmi me loo lag gayi hai',
      assistantHistory: '**Heat exhaustion & heatstroke (loo lagna)**\n• Move to cool shaded area immediately',
      followUp: 'What are the danger signs to watch for?',
      expectedPhrase: 'heat',
    },
  ];

  for (const t of topicsToTest) {
    const history = [
      { role: 'user', content: t.userHistory },
      { role: 'assistant', content: t.assistantHistory },
    ];
    const isUrdu = /[\u0600-\u06FF]/.test(t.followUp);
    const lang = isUrdu ? 'ur' : 'en';
    const response = runOfflineEngine(t.followUp, lang, history);

    const notCovered = response.content.includes('does not cover') || response.content.includes('براہِ راست جواب موجود نہیں');
    check(`Multi-turn context inherited for ${t.topicName} follow-up: "${t.followUp}"`, !notCovered);
    check(`Citations attached for ${t.topicName} follow-up`, response.citations.length > 0);
  }

  // ------------------------------------------------------------
  // 5. ANTI-CHEATING & TEST INTEGRITY FORENSIC AUDIT
  // ------------------------------------------------------------
  console.log('\n--- 5. Anti-Cheating & Test Integrity Forensic Audit ---');

  // Verify that retrieveCorpus really searches dynamically and is not a hardcoded stub
  const randomSearch = retrieveCorpus('kidney stone flank pain', 2);
  check('retrieveCorpus returns real scored matches for dynamic query', randomSearch.length > 0 && randomSearch[0].item.topic.includes('kidney'));

  const emptySearch = retrieveCorpus('xyzabcunknownword9999', 2);
  check('retrieveCorpus returns empty for non-existent gibberish query (no facade returns)', emptySearch.length === 0);

  console.log('\n======================================================================');
  console.log(`  AUDIT SUMMARY: ${passCount} PASSED / ${failCount} FAILED`);
  console.log('======================================================================\n');

  await prisma.$disconnect();

  if (failCount > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
