import { CORPUS } from '../src/data/corpus';
import { fuzzyFindMedicalConcept, damerauLevenshteinDistance, stringSimilarity, MEDICAL_CANONICAL_TERMS } from '../src/lib/engine/fuzzy-matcher';
import { retrieveCorpus, runOfflineEngine, runL0Triage, expandQuerySynonyms, QUERY_SYNONYMS } from '../src/lib/engine/safety-engine';
import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient();

async function runAdversarialR3() {
  console.log('============================================================');
  console.log('  SehatAI — Milestone Round 3 Adversarial Verification Suite');
  console.log('============================================================\n');

  let totalAssertions = 0;
  let passedAssertions = 0;
  const failures: string[] = [];

  function assert(condition: boolean, msg: string, details?: any) {
    totalAssertions++;
    if (condition) {
      passedAssertions++;
    } else {
      failures.push(msg + (details ? ` | Details: ${JSON.stringify(details)}` : ''));
      console.error(`  ❌ FAIL: ${msg}`);
    }
  }

  // -------------------------------------------------------------
  // Test Section 1: Corpus Scale & 20 Domains Verification
  // -------------------------------------------------------------
  console.log('[Audit Group 1] Corpus Scale & 20 Clinical Domains Verification');

  assert(CORPUS.length >= 120, `Corpus must contain >= 120 topics (actual: ${CORPUS.length})`);

  const DOMAINS_20 = [
    { name: '1. Cardiology & Vascular', topics: ['hypertension', 'angina', 'chestpain', 'heart-failure', 'arrhythmia', 'dvt'] },
    { name: '2. Pulmonology', topics: ['asthma', 'pneumonia', 'bronchitis', 'copd', 'pleural-pain', 'tuberculosis'] },
    { name: '3. Gastroenterology & Hepatology', topics: ['diarrhea', 'cholera', 'gerd', 'constipation', 'peptic-ulcer', 'ibs', 'gallstones', 'fatty-liver', 'food-poisoning', 'celiac'] },
    { name: '4. Neurology', topics: ['stroke', 'migraine', 'headache', 'vertigo', 'bells-palsy', 'neuropathy', 'concussion', 'seizure'] },
    { name: '5. Infectious & Tropical', topics: ['fever', 'dengue', 'malaria', 'typhoid', 'chickenpox', 'rabies', 'tetanus', 'leishmaniasis', 'polio', 'measles'] },
    { name: '6. Orthopedics & Rheumatology', topics: ['backache', 'osteoarthritis', 'gout', 'neck-pain', 'sprain', 'fracture', 'rheumatoid-arthritis', 'frozen-shoulder', 'carpal-tunnel', 'knee-oa'] },
    { name: '7. Dermatology', topics: ['scabies', 'eczema', 'fungal-infection', 'acne', 'allergy', 'burn', 'psoriasis', 'melasma', 'cellulitis', 'warts', 'hives'] },
    { name: '8. Nephrology & Urology', topics: ['kidney-stones', 'uti', 'prostate', 'ckd', 'hematuria', 'hydrocele'] },
    { name: '9. Obstetrics & Maternal', topics: ['postpartum', 'morning-sickness', 'preeclampsia', 'gestational-diabetes', 'ectopic-pregnancy', 'postpartum-hemorrhage', 'antenatal-care'] },
    { name: '10. Gynecology & Women Health', topics: ['period-pain', 'pcos', 'vaginal-candidiasis', 'endometriosis', 'menopause', 'anemia'] },
    { name: '11. Pediatrics & Neonatology', topics: ['infant-colic', 'diaper-rash', 'neonatal-jaundice', 'croup', 'febrile-seizures', 'rickets', 'malnutrition', 'epi-schedule'] },
    { name: '12. Endocrinology & Metabolism', topics: ['diabetes', 'hypoglycemia', 'hyperglycemia', 'hypothyroidism', 'hyperthyroidism', 'vitamin-d', 'metabolic-syndrome'] },
    { name: '13. Ophthalmology / Eye Care', topics: ['eye-injury', 'stye', 'cataract', 'glaucoma', 'dry-eye', 'conjunctivitis'] },
    { name: '14. Otorhinolaryngology (ENT)', topics: ['sinusitis', 'allergic-rhinitis', 'tonsillitis', 'nosebleed', 'earache', 'tinnitus', 'foreign-body', 'ear-infection'] },
    { name: '15. Dental & Oral', topics: ['toothache', 'gingivitis', 'mouth-ulcers', 'dental-abscess', 'dental-trauma', 'oral-thrush'] },
    { name: '16. Hematology & Oncology', topics: ['anemia', 'thalassemia', 'bruising', 'lymph-node'] },
    { name: '17. Psychiatry & Mental Health', topics: ['insomnia', 'panic-attack', 'gad', 'depression', 'postpartum-depression'] },
    { name: '18. Emergency & Resuscitation', topics: ['electric-shock', 'heatstroke', 'bleeding', 'anaphylaxis', 'choking-cpr', 'burns-first-aid'] },
    { name: '19. Toxicology & Environmental', topics: ['poisoning', 'snakebite', 'scorpion-sting', 'pesticide-poisoning', 'acid-ingestion', 'carbon-monoxide'] },
    { name: '20. Geriatrics & Palliative', topics: ['falls-elderly', 'dementia', 'bed-sores', 'polypharmacy', 'osteoporosis'] }
  ];

  for (const d of DOMAINS_20) {
    const matches = CORPUS.filter(item => d.topics.some(t => item.topic.includes(t) || item.id.includes(t) || item.tags.some(tag => tag.includes(t))));
    assert(matches.length > 0, `Domain "${d.name}" represented in corpus (${matches.length} topics)`);
  }

  // Check unique IDs and trilingual completeness
  const seenIds = new Set<string>();
  for (const item of CORPUS) {
    assert(!seenIds.has(item.id), `Topic ID "${item.id}" must be unique`);
    seenIds.add(item.id);

    // Trilingual completeness
    assert(!!item.title.en && item.title.en.trim().length > 0, `Topic ${item.id} missing EN title`);
    assert(!!item.title.ur && item.title.ur.trim().length > 0, `Topic ${item.id} missing UR title`);
    assert(!!item.title.roman && item.title.roman.trim().length > 0, `Topic ${item.id} missing Roman title`);

    assert(!!item.content.en && item.content.en.trim().length > 0, `Topic ${item.id} missing EN content`);
    assert(!!item.content.ur && item.content.ur.trim().length > 0, `Topic ${item.id} missing UR content`);
    assert(!!item.content.roman && item.content.roman.trim().length > 0, `Topic ${item.id} missing Roman content`);

    // Bullet points
    assert(item.content.en.includes('•'), `Topic ${item.id} EN content missing bullet points`);
    assert(item.content.ur.includes('•'), `Topic ${item.id} UR content missing bullet points`);
    assert(item.content.roman.includes('•'), `Topic ${item.id} Roman content missing bullet points`);

    // Doctor & Emergency triggers
    const hasDocEn = item.content.en.includes('SEE A DOCTOR') || item.content.en.includes('SEE A HEALTH');
    const hasEmergEn = item.content.en.includes('EMERGENCY') || item.content.en.includes('GO IMMEDIATELY') || item.content.en.includes('CALL 1122');
    assert(hasDocEn, `Topic ${item.id} EN content missing "SEE A DOCTOR" header`);
    assert(hasEmergEn, `Topic ${item.id} EN content missing "EMERGENCY / GO IMMEDIATELY" header`);

    const hasDocUr = item.content.ur.includes('ڈاکٹر کو دکھائیں') || item.content.ur.includes('ہسپتال جائیں');
    const hasEmergUr = item.content.ur.includes('ایمرجنسی') || item.content.ur.includes('فوراً جائیں') || item.content.ur.includes('1122');
    assert(hasDocUr, `Topic ${item.id} UR content missing "ڈاکٹر کو دکھائیں" header`);
    assert(hasEmergUr, `Topic ${item.id} UR content missing "ایمرجنسی / فوراً جائیں" header`);

    const hasDocRoman = item.content.roman.includes('DOCTOR KO DIKHAYEIN') || item.content.roman.includes('HOSPITAL JAYEIN');
    const hasEmergRoman = item.content.roman.includes('EMERGENCY') || item.content.roman.includes('FORI JAYEIN') || item.content.roman.includes('1122');
    assert(hasDocRoman, `Topic ${item.id} Roman content missing "DOCTOR KO DIKHAYEIN" header`);
    assert(hasEmergRoman, `Topic ${item.id} Roman content missing "EMERGENCY / FORI JAYEIN" header`);

    // Source provenance
    assert(!!item.source.publisher, `Topic ${item.id} missing publisher`);
    assert(!!item.source.title, `Topic ${item.id} missing source title`);
    assert(item.source.url.startsWith('https://') || item.source.url === '', `Topic ${item.id} URL must start with https://`);
    assert(!!item.source.license, `Topic ${item.id} missing source license`);

    // Tags
    assert(Array.isArray(item.tags) && item.tags.length >= 3, `Topic ${item.id} must have >= 3 tags (got ${item.tags.length})`);
  }

  console.log(`  Passed verification for all ${CORPUS.length} topics across 20 domains.`);

  // -------------------------------------------------------------
  // Test Section 2: Perso-Arabic & Fuzzy NLP Synonyms
  // -------------------------------------------------------------
  console.log('\n[Audit Group 2] Perso-Arabic, Roman Urdu & Algorithmic Fuzzy Matching');

  // Test speed benchmark across 500 lookups
  const testPhrases = [
    'pcos', 'thalassemia', 'falij', 'bph', 'leishmaniasis', 'peelia', 'motia',
    'gardan ka dard', 'pesticide poisoning', 'dvt', 'copd', 'dementia', 'anaphylaxis',
    'bichhoo ka dang', 'tezaab peena', 'geyser ka dhuwan', 'bistar ke zakham',
    'chambal', 'uric acid', 'gurde me pathri', 'pitte ki pathri', 'munh me chhale',
    'scabies', 'khasra', 'tb', 'mirgi', 'gathiya', 'jhainiyan', 'masse',
    'پی سی او ایس', 'تھیلیسیمیا', 'فالج', 'سال دانہ', 'سفید موتیا', 'گردن کا درد',
    'کیڑے مار دوا زہر', 'بچھو کا ڈنک', 'تیزاب پینا', 'گیزر کا دھواں', 'بستر کے زخم',
    'پتے کی پتھری', 'گردے میں پتھری', 'منہ کے چھالے', 'چمبل', 'یورک ایسڈ', 'خارش', 'مرگی'
  ];

  const t0 = performance.now();
  const iterations = 500;
  for (let i = 0; i < iterations; i++) {
    for (const phrase of testPhrases) {
      fuzzyFindMedicalConcept(phrase);
    }
  }
  const t1 = performance.now();
  const avgTimeMs = (t1 - t0) / (iterations * testPhrases.length);
  assert(avgTimeMs < 0.5, `Average fuzzy lookup time must be < 0.5ms (actual: ${avgTimeMs.toFixed(5)}ms)`);
  console.log(`  Algorithmic lookup speed: ${avgTimeMs.toFixed(5)}ms per query`);

  // Explicit query resolution tests
  const queryCases: [string, string][] = [
    ['pcos', 'pcos'],
    ['pcod', 'pcos'],
    ['irregular periods', 'pcos'],
    ['پی سی او ایس', 'pcos'],
    ['thalassemia', 'thalassemia'],
    ['thalasemia', 'thalassemia'],
    ['تھیلیسیمیا', 'thalassemia'],
    ['falij', 'stroke'],
    ['faalij', 'stroke'],
    ['فالج', 'stroke'],
    ['bph', 'prostate'],
    ['gadood', 'prostate'],
    ['پروسٹیٹ', 'prostate'],
    ['leishmaniasis', 'leishmaniasis'],
    ['sal dana', 'leishmaniasis'],
    ['kal dana', 'leishmaniasis'],
    ['سال دانہ', 'leishmaniasis'],
    ['peelia', 'jaundice'],
    ['peeliya', 'jaundice'],
    ['yarqan', 'jaundice'],
    ['یرقان', 'jaundice'],
    ['motia', 'cataract'],
    ['safaid motia', 'cataract'],
    ['سفید موتیا', 'cataract'],
    ['gardan ka dard', 'neck-pain'],
    ['گردن کا درد', 'neck-pain'],
    ['pesticide poisoning', 'pesticide-poisoning'],
    ['keeray mar dawa', 'pesticide-poisoning'],
    ['کیڑے مار دوا زہر', 'pesticide-poisoning'],
    ['dvt', 'dvt'],
    ['deep vein thrombosis', 'dvt'],
    ['copd', 'copd'],
    ['dementia', 'dementia'],
    ['yaaddasht ki kami', 'dementia'],
    ['ڈیمینشیا', 'dementia'],
    ['anaphylaxis', 'anaphylaxis'],
    ['jaan leva allergy', 'anaphylaxis'],
    ['scorpion sting', 'scorpion-sting'],
    ['bichhoo ka dang', 'scorpion-sting'],
    ['بچھو کا ڈنک', 'scorpion-sting'],
    ['acid ingestion', 'acid-ingestion'],
    ['tezaab peena', 'acid-ingestion'],
    ['تیزاب پینا', 'acid-ingestion'],
    ['carbon monoxide', 'carbon-monoxide'],
    ['geyser ka dhuwan', 'carbon-monoxide'],
    ['گیزر کا دھواں', 'carbon-monoxide'],
    ['bed sores', 'bed-sores'],
    ['bistar ke zakham', 'bed-sores'],
    ['bistar ke zakhm', 'bed-sores'],
    ['بستر کے زخم', 'bed-sores'],
    ['cervical spondylosis', 'cervical-spondylosis'],
    ['knee oa', 'knee-oa'],
    ['rheumatoid arthritis', 'rheumatoid-arthritis'],
    ['gathiya', 'rheumatoid-arthritis'],
    ['گٹھیا', 'rheumatoid-arthritis'],
    ['psoriasis', 'psoriasis'],
    ['melasma', 'melasma'],
    ['jhainiyan', 'melasma'],
    ['جھائیاں', 'melasma'],
    ['cellulitis', 'cellulitis'],
    ['warts', 'warts'],
    ['masse', 'warts'],
    ['mohkay', 'warts'],
    ['ckd', 'ckd'],
    ['creatinine', 'ckd'],
    ['hematuria', 'hematuria'],
    ['peshab me khoon', 'hematuria'],
    ['hydrocele', 'hydrocele'],
    ['morning sickness', 'morning-sickness'],
    ['hamal me ulti', 'morning-sickness'],
    ['preeclampsia', 'preeclampsia'],
    ['gestational diabetes', 'gestational-diabetes'],
    ['hamal ki sugar', 'gestational-diabetes'],
    ['ectopic pregnancy', 'ectopic-pregnancy'],
    ['postpartum hemorrhage', 'postpartum-hemorrhage'],
    ['pph', 'postpartum-hemorrhage'],
    ['dysmenorrhea', 'period-pain'],
    ['haiz ka dard', 'period-pain'],
    ['vaginal candidiasis', 'vaginal-candidiasis'],
    ['safeed paani', 'vaginal-candidiasis'],
    ['endometriosis', 'endometriosis'],
    ['menopause', 'menopause'],
    ['neonatal jaundice', 'neonatal-jaundice'],
    ['nawzaida peelia', 'neonatal-jaundice'],
    ['croup', 'croup'],
    ['kuttay jaisi khansi', 'croup'],
    ['febrile seizures', 'febrile-seizures'],
    ['bukhar ke doray', 'febrile-seizures'],
    ['rickets', 'rickets'],
    ['malnutrition', 'malnutrition'],
    ['sukha pan', 'malnutrition'],
    ['hyperglycemia', 'hyperglycemia'],
    ['hypothyroidism', 'hypothyroidism'],
    ['hyperthyroidism', 'hyperthyroidism'],
    ['vitamin d deficiency', 'vitamin-d'],
    ['metabolic syndrome', 'metabolic-syndrome'],
    ['stye', 'stye'],
    ['anjanari', 'stye'],
    ['guhanjani', 'stye'],
    ['dry eye', 'dry-eye'],
    ['tinnitus', 'tinnitus'],
    ['kaan me ghanti', 'tinnitus'],
    ['dental abscess', 'dental-abscess'],
    ['dant me peep', 'dental-abscess'],
    ['dental trauma', 'dental-trauma'],
    ['dant tootna', 'dental-trauma'],
    ['oral thrush', 'oral-thrush'],
    ['munh me phaphoondi', 'oral-thrush'],
    ['easy bruising', 'bruising'],
    ['neel parna', 'bruising'],
    ['lymph node', 'lymph-node'],
    ['gilti', 'lymph-node'],
    ['depression', 'depression'],
    ['shadeed udaasi', 'depression'],
    ['postpartum depression', 'postpartum-depression'],
    ['falls in elderly', 'falls-elderly'],
    ['bazurgon me girna', 'falls-elderly'],
    ['polypharmacy', 'polypharmacy'],
    ['osteoporosis', 'osteoporosis'],
    ['scabies', 'scabies'],
    ['tuberculosis', 'tuberculosis'],
    ['tb', 'tuberculosis'],
    ['epilepsy', 'epilepsy'],
    ['mirgi', 'epilepsy'],
    ['measles', 'measles'],
    ['khasra', 'measles'],
    ['conjunctivitis', 'conjunctivitis'],
    ['aankh aana', 'conjunctivitis'],
    ['otitis media', 'otitis-media'],
    ['choking', 'choking'],
    ['cpr', 'cpr'],
    ['antenatal care', 'antenatal-care'],
    ['anemia in women', 'anemia-women'],
    ['epi schedule', 'epi-schedule']
  ];

  for (const [input, expectedCanonical] of queryCases) {
    const res = fuzzyFindMedicalConcept(input);
    assert(res !== null && res.canonical === expectedCanonical, `Fuzzy query "${input}" should resolve to "${expectedCanonical}" (got: ${res ? res.canonical : 'null'})`);
  }

  // -------------------------------------------------------------
  // Test Section 3: RAG Retrieval & Offline Engine Grounding
  // -------------------------------------------------------------
  console.log('\n[Audit Group 3] RAG Retrieval & Offline Engine Grounding');

  for (const [input, expectedCanonical] of queryCases) {
    const hits = retrieveCorpus(input, 3);
    assert(hits.length > 0, `retrieveCorpus("${input}") should return at least 1 hit (got: ${hits.length})`);
    if (hits.length > 0) {
      assert(hits[0].score >= 2.0, `retrieveCorpus("${input}") top hit score should be >= 2.0 (got: ${hits[0].score})`);
    }
  }

  // Test offline engine with history inheritance for 10 domain conditions
  const multiTurnScenarios = [
    { initial: 'I have intense backache and spasms', topicId: 'back-pain', followUp: 'How can I treat this at home?' },
    { initial: 'Mujhe pcos ka masla hai', topicId: 'pcos-polycystic-ovary', followUp: 'What are the diet tips for this?' },
    { initial: 'Child has rickets and bowed legs', topicId: 'rickets-vitamin-d', followUp: 'What should we feed the child?' },
    { initial: 'Doctor says patient has DVT in calf', topicId: 'dvt-deep-vein-thrombosis', followUp: 'What are the danger signs to watch for?' },
    { initial: 'Kisan ne keeray mar dawa spray ki thi aur sar dard hai', topicId: 'pesticide-poisoning', followUp: 'When to see a doctor?' },
    { initial: 'Elderly person has bed sores on hip', topicId: 'bedsores-pressure-ulcers', followUp: 'گھر پر دیکھ بھال کے طریقے بتائیں' },
    { initial: 'Patient diagnosed with chronic kidney disease', topicId: 'chronic-kidney-disease', followUp: 'What precautions should we take?' },
    { initial: 'Mujhe preeclampsia ka masla hai', topicId: 'preeclampsia-warning', followUp: 'What are the red flags?' },
    { initial: 'Tooth abscess with swelling in jaw', topicId: 'periapical-abscess', followUp: 'How to manage pain until dentist appointment?' },
    { initial: 'Baby has barking cough and stridor', topicId: 'croup-stridor', followUp: 'What are the emergency signs?' },
  ];

  for (const s of multiTurnScenarios) {
    const initialRes = runOfflineEngine(s.initial, 'en');
    assert(initialRes.citations.length > 0, `Initial query "${s.initial}" should return citations`);
    const inheritedRes = runOfflineEngine(s.followUp, 'en', [
      { role: 'user', content: s.initial },
      { role: 'assistant', content: initialRes.content },
    ]);
    assert(inheritedRes.citations.length > 0, `Follow-up query "${s.followUp}" should inherit context and return citations`);
    if (inheritedRes.citations.length > 0) {
      assert(inheritedRes.citations[0].id === s.topicId, `Follow-up should inherit topic "${s.topicId}" (got: ${inheritedRes.citations[0].id})`);
    }
  }

  // -------------------------------------------------------------
  // Test Section 4: SQLite Database Invariants
  // -------------------------------------------------------------
  console.log('\n[Audit Group 4] SQLite Database Provenance & Synchronization');

  const dbDocs = await prisma.document.findMany();
  assert(dbDocs.length >= 120, `Database must contain >= 120 documents (actual: ${dbDocs.length})`);
  assert(dbDocs.length === CORPUS.length, `Database doc count (${dbDocs.length}) must match CORPUS count (${CORPUS.length})`);

  for (const corpusItem of CORPUS) {
    const dbDoc = dbDocs.find((d) => d.slug === corpusItem.id);
    assert(dbDoc !== undefined, `Database missing document with slug "${corpusItem.id}"`);
    if (dbDoc) {
      assert(dbDoc.title === corpusItem.title.en, `DB doc "${corpusItem.id}" title mismatch`);
      assert(dbDoc.publisher === corpusItem.source.publisher, `DB doc "${corpusItem.id}" publisher mismatch`);
      assert(dbDoc.topic === corpusItem.topic, `DB doc "${corpusItem.id}" topic mismatch`);
      assert(dbDoc.baseLevel === corpusItem.baseLevel, `DB doc "${corpusItem.id}" baseLevel mismatch`);
      assert(dbDoc.sourceUrl === corpusItem.source.url, `DB doc "${corpusItem.id}" sourceUrl mismatch`);
      assert(dbDoc.verifiedAt === corpusItem.source.verifiedAt, `DB doc "${corpusItem.id}" verifiedAt mismatch`);
    }
  }

  // Summary
  console.log('\n============================================================');
  if (failures.length === 0) {
    console.log(`  ALL AUDIT TESTS PASSED (${passedAssertions}/${totalAssertions})! 100% SUCCESS.`);
  } else {
    console.log(`  AUDIT FAILED: ${failures.length} issues found out of ${totalAssertions} assertions.`);
    for (const f of failures.slice(0, 20)) {
      console.log(`    - ${f}`);
    }
  }
  console.log('============================================================\n');

  await prisma.$disconnect();
  if (failures.length > 0) {
    process.exit(1);
  }
}

runAdversarialR3().catch((e) => {
  console.error('Audit run crashed:', e);
  process.exit(1);
});
