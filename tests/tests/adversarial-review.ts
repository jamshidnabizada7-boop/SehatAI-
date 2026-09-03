import { CORPUS } from '../src/data/corpus';
import { MEDICAL_CANONICAL_TERMS, fuzzyFindMedicalConcept, stringSimilarity, damerauLevenshteinDistance } from '../src/lib/engine/fuzzy-matcher';
import { retrieveCorpus, runOfflineEngine } from '../src/lib/engine/safety-engine';
import { PrismaClient } from '@prisma/client';

async function runAdversarialAudit() {
  console.log('============================================================');
  console.log('  SehatAI — Adversarial Reviewer Comprehensive Audit Suite');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, msg: string, details?: any) {
    if (cond) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      if (details !== undefined) console.error('     Details:', details);
      failed++;
    }
  }

  // --- Group 1: Scale & Required 20 Domains Coverage ---
  console.log('[Audit Group 1] Scale & 20 Medical Domains Verification');
  assert(CORPUS.length >= 120, `Corpus must contain >= 120 topics (actual: ${CORPUS.length})`);

  const REQUIRED_DOMAINS_TOPICS: Record<string, string[]> = {
    '1. Cardiology & Vascular': ['hypertension', 'angina', 'heart-failure', 'arrhythmia', 'dvt'],
    '2. Pulmonology': ['asthma', 'copd', 'pneumonia', 'bronchitis', 'tuberculosis', 'pleural-pain'],
    '3. Gastroenterology & Hepatology': ['gerd', 'peptic-ulcer', 'hemorrhoids', 'jaundice', 'fatty-liver', 'ibs', 'gallstones', 'food-poisoning', 'celiac'],
    '4. Neurology': ['migraine', 'stroke', 'epilepsy', 'vertigo', 'bells-palsy', 'neuropathy', 'concussion'],
    '5. Infectious & Tropical': ['dengue', 'malaria', 'typhoid', 'cholera', 'rabies', 'measles', 'chickenpox', 'tetanus', 'leishmaniasis', 'polio'],
    '6. Orthopedics & Rheumatology': ['back-pain', 'cervical-spondylosis', 'osteoarthritis', 'rheumatoid-arthritis', 'gout', 'frozen-shoulder', 'carpal-tunnel', 'fracture'],
    '7. Dermatology': ['scabies', 'eczema', 'psoriasis', 'ringworm', 'acne', 'melasma', 'urticaria', 'cellulitis', 'warts'],
    '8. Nephrology & Urology': ['uti', 'kidney-stones', 'ckd', 'bph', 'hematuria', 'hydrocele'],
    '9. Obstetrics & Maternal': ['antenatal-care', 'morning-sickness', 'preeclampsia', 'gestational-diabetes', 'ectopic', 'postpartum-hemorrhage'],
    '10. Gynecology & Women': ['dysmenorrhea', 'pcos', 'vaginal-candidiasis', 'endometriosis', 'menopause', 'anemia'],
    '11. Pediatrics & Neonatology': ['epi-schedule', 'neonatal-jaundice', 'infant-colic', 'diaper-rash', 'croup', 'febrile-seizures', 'rickets', 'malnutrition'],
    '12. Endocrinology & Metabolism': ['diabetes', 'hypoglycemia', 'hyperglycemia', 'hypothyroidism', 'hyperthyroidism', 'vitamin-d', 'metabolic-syndrome'],
    '13. Ophthalmology / Eye Care': ['conjunctivitis', 'stye', 'cataract', 'glaucoma', 'dry-eye', 'eye-injury'],
    '14. Otorhinolaryngology (ENT)': ['ear-infection', 'tonsillitis', 'sinusitis', 'epistaxis', 'tinnitus', 'foreign-body'],
    '15. Dental & Oral': ['toothache', 'gingivitis', 'dental-abscess', 'dental-trauma', 'mouth-ulcers', 'oral-thrush'],
    '16. Hematology & Oncology': ['anemia', 'thalassemia', 'bleeding-bruising', 'lymph-node'],
    '17. Psychiatry & Mental Health': ['generalized-anxiety', 'depression', 'panic-attack', 'postpartum-depression', 'insomnia'],
    '18. Emergency & Resuscitation': ['chest-pain', 'anaphylaxis', 'choking', 'cpr', 'burns', 'hemorrhage'],
    '19. Toxicology & Environmental': ['bites', 'scorpion-sting', 'pesticide-poisoning', 'acid-ingestion', 'carbon-monoxide'],
    '20. Geriatrics & Palliative': ['falls-elderly', 'dementia', 'bed-sores', 'polypharmacy', 'osteoporosis'],
  };

  for (const [domain, topics] of Object.entries(REQUIRED_DOMAINS_TOPICS)) {
    // check each topic in domain
    for (const top of topics) {
      const found = CORPUS.some(c => c.id.toLowerCase().includes(top) || c.topic.toLowerCase().includes(top) || c.tags.some(t => t.toLowerCase().includes(top)));
      assert(found, `Topic "${top}" in domain "${domain}" must exist in corpus`);
    }
  }

  // --- Group 2: Structural Integrity & Trilingual Content ---
  console.log('\n[Audit Group 2] Structural Trilingual Integrity & Clinical Formatting');
  const seenIds = new Set<string>();

  for (const item of CORPUS) {
    // Unique ID
    assert(!seenIds.has(item.id), `Corpus ID "${item.id}" must be unique`);
    seenIds.add(item.id);

    // Trilingual titles
    assert(Boolean(item.title && item.title.en && item.title.ur && item.title.roman), `Item "${item.id}" must have trilingual titles`);

    // Trilingual contents
    assert(Boolean(item.content && item.content.en && item.content.ur && item.content.roman), `Item "${item.id}" must have trilingual contents`);

    // Home care bullets
    assert(item.content.en.includes('•'), `Item "${item.id}" EN content must have bullets '•'`);
    assert(item.content.ur.includes('•'), `Item "${item.id}" UR content must have bullets '•'`);
    assert(item.content.roman.includes('•'), `Item "${item.id}" Roman content must have bullets '•'`);

    // Doctor warning
    const enDoc = item.content.en.includes('SEE A DOCTOR') || item.content.en.includes('DOCTOR');
    const urDoc = item.content.ur.includes('ڈاکٹر') || item.content.ur.includes('طبیب');
    const roDoc = item.content.roman.includes('DOCTOR') || item.content.roman.includes('Doctor');
    assert(enDoc && urDoc && roDoc, `Item "${item.id}" must have Doctor warning in EN, UR, Roman`);

    // Emergency warning
    const enEm = item.content.en.includes('EMERGENCY') || item.content.en.includes('IMMEDIATELY') || item.content.en.includes('1122');
    const urEm = item.content.ur.includes('ایمرجنسی') || item.content.ur.includes('فوراً') || item.content.ur.includes('1122');
    const roEm = item.content.roman.includes('EMERGENCY') || item.content.roman.includes('FORI') || item.content.roman.includes('1122');
    assert(enEm && urEm && roEm, `Item "${item.id}" must have Emergency trigger in EN, UR, Roman`);

    // Tags
    assert(Array.isArray(item.tags) && item.tags.length >= 5, `Item "${item.id}" must have >= 5 rich search tags (found ${item.tags?.length})`);

    // Source
    assert(item.source.url.startsWith('https://'), `Item "${item.id}" source URL must be https`);
    assert(Boolean(item.source.publisher && item.source.title && item.source.license), `Item "${item.id}" source metadata complete`);
  }

  // --- Group 3: Fuzzy Concept Mapping & Algorithmic Resilience ---
  console.log('\n[Audit Group 3] Perso-Arabic & Roman Urdu Fuzzy Resolution');
  const REQUIRED_FUZZY_TESTS = [
    { query: 'pcos', expected: 'pcos' },
    { query: 'پی سی او ایس', expected: 'pcos' },
    { query: 'thalassemia', expected: 'thalassemia' },
    { query: 'تھیلیسیمیا', expected: 'thalassemia' },
    { query: 'falij', expected: 'stroke' },
    { query: 'فالج', expected: 'stroke' },
    { query: 'bph', expected: 'prostate' },
    { query: 'پروسٹیٹ', expected: 'prostate' },
    { query: 'leishmaniasis', expected: 'leishmaniasis' },
    { query: 'سال دانہ', expected: 'leishmaniasis' },
    { query: 'peelia', expected: 'jaundice' },
    { query: 'یرقان', expected: 'jaundice' },
    { query: 'motia', expected: 'cataract' },
    { query: 'سفید موتیا', expected: 'cataract' },
    { query: 'gardan ka dard', expected: 'neck-pain' },
    { query: 'گردن کا درد', expected: 'neck-pain' },
    { query: 'pesticide poisoning', expected: 'pesticide-poisoning' },
    { query: 'کیڑے مار دوا زہر', expected: 'pesticide-poisoning' },
    { query: 'dvt', expected: 'dvt' },
    { query: 'copd', expected: 'copd' },
    { query: 'dementia', expected: 'dementia' },
    { query: 'anaphylaxis', expected: 'anaphylaxis' },
    { query: 'scorpion sting', expected: 'scorpion-sting' },
    { query: 'bichhoo ka dang', expected: 'scorpion-sting' },
    { query: 'acid ingestion', expected: 'acid-ingestion' },
    { query: 'tezaab peena', expected: 'acid-ingestion' },
    { query: 'carbon monoxide', expected: 'carbon-monoxide' },
    { query: 'geyser ka dhuwan', expected: 'carbon-monoxide' },
    { query: 'bed sores', expected: 'bed-sores' },
    { query: 'bistar ke zakham', expected: 'bed-sores' },
  ];

  for (const test of REQUIRED_FUZZY_TESTS) {
    const res = fuzzyFindMedicalConcept(test.query);
    assert(res !== null && (res.canonical.includes(test.expected) || test.expected.includes(res.canonical)), `Fuzzy query "${test.query}" resolves to "${test.expected}" (got: ${res?.canonical})`);
  }

  // --- Group 4: RAG Corpus Retrieval Invariance ---
  console.log('\n[Audit Group 4] Calibrated RAG Retrieval Verification');
  for (const test of REQUIRED_FUZZY_TESTS) {
    const hits = retrieveCorpus(test.query, 3);
    assert(hits.length > 0, `retrieveCorpus retrieves documents for "${test.query}" (hits: ${hits.length}, top: ${hits[0]?.item?.id})`);
  }

  // Sub-1ms Benchmark
  console.log('\n[Audit Group 5] Algorithmic Speed Benchmark (< 1ms)');
  const start = performance.now();
  const iterations = 1000;
  for (let i = 0; i < iterations; i++) {
    const q = REQUIRED_FUZZY_TESTS[i % REQUIRED_FUZZY_TESTS.length].query;
    fuzzyFindMedicalConcept(q);
  }
  const avgMs = (performance.now() - start) / iterations;
  assert(avgMs < 0.5, `Average fuzzy lookup time must be < 0.5ms (actual: ${avgMs.toFixed(4)}ms)`);

  // --- Group 6: Conversational Offline Grounding & Multi-Turn Context Inheritance ---
  console.log('\n[Audit Group 6] Conversational Grounding & Multi-Turn Inheritance');
  const conversationalQueries = [
    { query: 'I have severe backache and cannot bend', lang: 'en', expectedCitation: 'back-pain' },
    { query: 'Mujhe pcos ka masla hai aur periods ruk gaye hain', lang: 'roman', expectedCitation: 'pcos' },
    { query: 'تھیلیسیمیا کے مریض کے لیے کیا احتیاطیں ہیں؟', lang: 'ur', expectedCitation: 'thalassemia' },
    { query: 'I was diagnosed with DVT in my right calf', lang: 'en', expectedCitation: 'dvt' },
    { query: 'کمرے میں گیزر کا دھواں بھر گیا اور چکر آ رہے ہیں', lang: 'ur', expectedCitation: 'carbon-monoxide' },
    { query: 'Bistar ke zakhm ka gharelu ilaj kya hai?', lang: 'roman', expectedCitation: 'bedsores' },
    { query: 'Doctor told me I have cataract in left eye', lang: 'en', expectedCitation: 'cataract' },
  ];

  for (const cq of conversationalQueries) {
    const res = runOfflineEngine(cq.query, cq.lang as any);
    assert(res.citations.length > 0, `Offline engine answers conversational query: "${cq.query}" (citation: ${res.citations[0]?.id})`);
  }

  // Multi-Turn Context Inheritance
  const multiTurns = [
    { first: 'I am suffering from severe backache', follow: 'How can I treat this at home?', expectedId: 'back-pain' },
    { first: 'Kidney stones in ultrasound', follow: 'What are the home remedies?', expectedId: 'kidney-stones' },
    { first: 'PCOS symptoms and periods', follow: 'When to see a doctor?', expectedId: 'pcos' },
    { first: 'Thalassemia minor guidance', follow: 'What are the danger signs to watch for?', expectedId: 'thalassemia' },
    { first: 'DVT leg swelling and redness', follow: 'How to prevent this?', expectedId: 'dvt' },
    { first: 'Pesticide sprayed without mask', follow: 'What are the emergency signs?', expectedId: 'pesticide-poisoning' },
    { first: 'Bistar ke zakham ka masla hai', follow: 'Ghar par kya dekh bhaal karein?', expectedId: 'bedsores' },
  ];

  for (const mt of multiTurns) {
    const history = [{ role: 'user', content: mt.first }, { role: 'assistant', content: 'Here is information...' }];
    const followRes = runOfflineEngine(mt.follow, 'en', history);
    assert(followRes.citations.length > 0 && followRes.citations[0].id.includes(mt.expectedId), `Multi-turn follow-up for "${mt.expectedId}" inherits correct topic context`);
  }

  // --- Group 7: Database Invariant Verification ---
  console.log('\n[Audit Group 7] SQLite Prisma Database Verification');
  const prisma = new PrismaClient();
  try {
    const docCount = await prisma.document.count();
    assert(docCount >= 120, `Database Document table count >= 120 (actual: ${docCount})`);
    assert(docCount === CORPUS.length, `Database Document table matches corpus count exactly (${docCount} === ${CORPUS.length})`);
    
    // Check documents for complete provenance metadata
    const docs = await prisma.document.findMany({ take: 20 });
    for (const doc of docs) {
      assert(Boolean(doc.slug && doc.title && doc.publisher && doc.license && doc.sourceUrl && doc.topic), `DB Doc "${doc.slug}" has complete provenance fields`);
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n============================================================');
  console.log(`  AUDIT COMPLETE: ${passed} PASSED / ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) process.exit(1);
}

runAdversarialAudit().catch(err => {
  console.error('Audit crashed:', err);
  process.exit(1);
});
