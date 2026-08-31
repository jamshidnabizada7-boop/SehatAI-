import { CORPUS } from '../src/data/corpus';
import { MEDICAL_CANONICAL_TERMS, fuzzyFindMedicalConcept, damerauLevenshteinDistance, stringSimilarity } from '../src/lib/engine/fuzzy-matcher';
import { QUERY_SYNONYMS, retrieveCorpus, runOfflineEngine, expandQuerySynonyms } from '../src/lib/engine/safety-engine';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function runReviewer4Suite() {
  console.log('============================================================');
  console.log('  SehatAI — Reviewer 4 Deep Adversarial Quality & Security Suite');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  function assert(condition: boolean, message: string, details?: any) {
    if (condition) {
      passed++;
    } else {
      failed++;
      failures.push(`FAILED: ${message} ${details ? JSON.stringify(details) : ''}`);
      console.error(`  ❌ FAIL: ${message}`, details || '');
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 1: Corpus Scale, Integrity & 20 Medical Domains
  // -------------------------------------------------------------
  console.log('[Test Group 1] Corpus Scale, Integrity & 20 Medical Domains');

  assert(CORPUS.length >= 120, `Corpus must contain >= 120 topics (actual: ${CORPUS.length})`);

  const uniqueIds = new Set<string>();
  const validPublishers = ['WHO', 'UNICEF', 'Pakistan MoNHSRC', 'IFRC', 'International Diabetes Federation', 'UMANG Pakistan', 'FAST Stroke Coalition'];

  const domainMap: Record<string, string[]> = {
    'Cardiology & Vascular': ['hypertension', 'angina', 'heart failure', 'arrhythmia', 'dvt'],
    'Pulmonology': ['asthma', 'copd', 'pneumonia', 'bronchitis', 'tuberculosis', 'pleural pain'],
    'Gastroenterology & Hepatology': ['gerd', 'peptic ulcer', 'hemorrhoids', 'jaundice', 'fatty liver', 'ibs', 'gallstones', 'food poisoning', 'celiac'],
    'Neurology': ['migraine', 'stroke', 'epilepsy', 'vertigo', 'bells palsy', 'neuropathy', 'concussion'],
    'Infectious & Tropical': ['dengue', 'malaria', 'typhoid', 'cholera', 'rabies', 'measles', 'chickenpox', 'tetanus', 'leishmaniasis', 'polio'],
    'Orthopedics & Rheumatology': ['back pain', 'cervical spondylosis', 'knee oa', 'rheumatoid arthritis', 'gout', 'frozen shoulder', 'carpal tunnel', 'fracture'],
    'Dermatology': ['scabies', 'eczema', 'psoriasis', 'fungal', 'acne', 'melasma', 'urticaria', 'cellulitis', 'warts'],
    'Nephrology & Urology': ['uti', 'kidney stone', 'ckd', 'bph', 'hematuria', 'hydrocele'],
    'Obstetrics & Maternal': ['anc schedule', 'morning sickness', 'preeclampsia', 'gestational diabetes', 'ectopic', 'postpartum hemorrhage'],
    'Gynecology & Women\'s Health': ['dysmenorrhea', 'pcos', 'vaginal candidiasis', 'endometriosis', 'menopause', 'anemia in women'],
    'Pediatrics & Neonatology': ['epi schedule', 'neonatal jaundice', 'infant colic', 'diaper rash', 'croup', 'febrile seizures', 'rickets', 'malnutrition'],
    'Endocrinology & Metabolism': ['diabetes', 'hypoglycemia', 'hyperglycemia', 'hypothyroidism', 'hyperthyroidism', 'vitamin d', 'metabolic syndrome'],
    'Ophthalmology / Eye Care': ['conjunctivitis', 'stye', 'cataract', 'glaucoma', 'dry eye', 'eye trauma'],
    'Otorhinolaryngology (ENT)': ['otitis media', 'tonsillitis', 'sinusitis', 'epistaxis', 'tinnitus', 'foreign body'],
    'Dental & Oral': ['toothache', 'gingivitis', 'abscess', 'dental trauma', 'mouth ulcers', 'oral thrush'],
    'Hematology & Oncology': ['iron deficiency anemia', 'thalassemia', 'bleeding', 'lymph node'],
    'Psychiatry & Mental Health': ['generalized anxiety', 'depression', 'panic disorder', 'postpartum depression', 'sleep disorders'],
    'Emergency & Resuscitation': ['chest pain triage', 'anaphylaxis', 'choking', 'cpr', 'burns', 'major hemorrhage'],
    'Toxicology & Environmental': ['snakebite', 'scorpion sting', 'pesticide poisoning', 'acid ingestion', 'carbon monoxide'],
    'Geriatrics & Palliative': ['falls in elderly', 'dementia', 'bed sores', 'polypharmacy', 'osteoporosis']
  };

  const coveredDomains = new Set<string>();

  for (const item of CORPUS) {
    // Unique ID
    assert(!uniqueIds.has(item.id), `Duplicate ID in corpus: ${item.id}`);
    uniqueIds.add(item.id);

    // Title checks
    assert(!!item.title.en && item.title.en.trim().length > 0, `Topic ${item.id} missing EN title`);
    assert(!!item.title.ur && item.title.ur.trim().length > 0, `Topic ${item.id} missing UR title`);
    assert(!!item.title.roman && item.title.roman.trim().length > 0, `Topic ${item.id} missing Roman title`);

    // Publisher checks
    assert(item.source && validPublishers.some(p => item.source.publisher.includes(p) || p.includes(item.source.publisher)),
      `Topic ${item.id} publisher ${item.source?.publisher} not in approved list`);
    assert(!!item.source.url && item.source.url.startsWith('https://'), `Topic ${item.id} invalid URL: ${item.source.url}`);
    assert(!!item.source.verifiedAt && item.source.verifiedAt.startsWith('2026'), `Topic ${item.id} verifiedAt not 2026: ${item.source.verifiedAt}`);

    // Tags check
    assert(Array.isArray(item.tags) && item.tags.length >= 3, `Topic ${item.id} must have >= 3 tags (got ${item.tags.length})`);

    // Content structural checks across all 3 languages
    const en = item.content.en;
    const ur = item.content.ur;
    const roman = item.content.roman;

    assert(en.includes('•'), `Topic ${item.id} EN missing bullet point`);
    assert(en.includes('SEE A DOCTOR IF:'), `Topic ${item.id} EN missing "SEE A DOCTOR IF:" header`);
    assert(en.includes('EMERGENCY / GO IMMEDIATELY:'), `Topic ${item.id} EN missing "EMERGENCY / GO IMMEDIATELY:" header`);

    assert(ur.includes('•'), `Topic ${item.id} UR missing bullet point`);
    assert(ur.includes('ڈاکٹر کو دکھائیں:'), `Topic ${item.id} UR missing "ڈاکٹر کو دکھائیں:" header`);
    assert(ur.includes('ایمرجنسی (فوراً جائیں):'), `Topic ${item.id} UR missing "ایمرجنسی (فوراً جائیں):" header`);

    assert(roman.includes('•'), `Topic ${item.id} Roman missing bullet point`);
    assert(roman.includes('DOCTOR KO DIKHAYEIN:'), `Topic ${item.id} Roman missing "DOCTOR KO DIKHAYEIN:" header`);
    assert(roman.includes('EMERGENCY (FORI JAYEIN):'), `Topic ${item.id} Roman missing "EMERGENCY (FORI JAYEIN):" header`);

    // Check if topic maps to 20 domains
    for (const [domain, keywords] of Object.entries(domainMap)) {
      const match = keywords.some(k => 
        item.id.toLowerCase().includes(k.toLowerCase()) || 
        item.topic.toLowerCase().includes(k.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(k.toLowerCase()))
      );
      if (match) {
        coveredDomains.add(domain);
      }
    }
  }

  assert(coveredDomains.size === 20, `All 20 medical domains must be covered (covered: ${coveredDomains.size}/20)`);
  for (const domain of Object.keys(domainMap)) {
    assert(coveredDomains.has(domain), `Domain "${domain}" must be covered in corpus`);
  }

  console.log(`  ✅ Corpus integrity verified across ${CORPUS.length} topics and 20 domains.\n`);

  // -------------------------------------------------------------
  // TEST GROUP 2: Fuzzy Matcher & NLP Canonical Resolution
  // -------------------------------------------------------------
  console.log('[Test Group 2] Fuzzy Matcher & NLP Canonical Resolution');

  const testCases: [string, string][] = [
    // Typos & Roman variations
    ['headeach', 'headache'],
    ['tootheach', 'toothache'],
    ['diaria', 'diarrhea'],
    ['vomting', 'vomiting'],
    ['bukaar', 'fever'],
    ['bawaser', 'hemorrhoids'],
    ['bawasir', 'hemorrhoids'],
    ['yarqan', 'jaundice'],
    ['yerqan', 'jaundice'],
    ['peelia', 'jaundice'],
    ['peeliya', 'jaundice'],
    ['pitte ki pathri', 'gallstones'],
    ['gurde me pathri', 'kidney-stones'],
    ['sinus dard', 'sinusitis'],
    ['munh me chhale', 'mouth-ulcers'],
    ['chambal', 'eczema'],
    ['uric acid', 'gout'],
    ['loo lagna', 'heatstroke'],
    ['bijli ka current', 'electric-shock'],
    ['falij', 'stroke'],
    ['bph', 'prostate'],
    ['gadood', 'prostate'],
    ['pcos', 'pcos'],
    ['thalassemia', 'thalassemia'],
    ['leishmaniasis', 'leishmaniasis'],
    ['sal dana', 'leishmaniasis'],
    ['motia', 'cataract'],
    ['safaid motia', 'cataract'],
    ['gardan ka dard', 'neck-pain'],
    ['pesticide poisoning', 'pesticide-poisoning'],
    ['keeray mar dawa', 'pesticide-poisoning'],
    ['dvt', 'dvt'],
    ['copd', 'copd'],
    ['dementia', 'dementia'],
    ['anaphylaxis', 'anaphylaxis'],
    ['bichhoo ka dang', 'scorpion-sting'],
    ['scorpion sting', 'scorpion-sting'],
    ['acid ingestion', 'acid-ingestion'],
    ['tezaab peena', 'acid-ingestion'],
    ['carbon monoxide', 'carbon-monoxide'],
    ['geyser ka dhuwan', 'carbon-monoxide'],
    ['bed sores', 'bed-sores'],
    ['bistar ke zakham', 'bed-sores'],
    ['tb', 'tuberculosis'],
    ['tap e diq', 'tuberculosis'],
    ['mirgi', 'epilepsy'],
    ['khasra', 'measles'],
    ['aankh aana', 'conjunctivitis'],
    ['eye flu', 'conjunctivitis'],
    ['scabies', 'scabies'],
    ['khujli', 'scabies'],
    ['cervical spondylosis', 'cervical-spondylosis'],
    ['knee osteoarthritis', 'knee-oa'],
    ['ghutno ka dard', 'knee-oa'],
    ['anc schedule', 'antenatal-care'],
    ['khawateen me khoon ki kami', 'anemia-women'],
    ['hifazati teekay', 'epi-schedule'],
    ['otitis media', 'otitis-media'],
    ['kaan ka infection', 'otitis-media'],
    ['choking', 'choking'],
    ['heimlich', 'choking'],
    ['cpr', 'cpr'],
    ['chest compressions', 'cpr'],

    // Urdu Nastaliq & Perso-Arabic queries
    ['سر کا درد', 'headache'],
    ['دانت درد', 'toothache'],
    ['بواسیر', 'hemorrhoids'],
    ['خونی بواسیر', 'hemorrhoids'],
    ['یرقان', 'jaundice'],
    ['پتے کی پتھری', 'gallstones'],
    ['گردے میں پتھری', 'kidney-stones'],
    ['منہ کے چھالے', 'mouth-ulcers'],
    ['چمبل', 'eczema'],
    ['یورک ایسڈ', 'gout'],
    ['فالج', 'stroke'],
    ['پروسٹیٹ', 'prostate'],
    ['پی سی او ایس', 'pcos'],
    ['تھیلیسیمیا', 'thalassemia'],
    ['سال دانہ', 'leishmaniasis'],
    ['سفید موتیا', 'cataract'],
    ['گردن کا درد', 'neck-pain'],
    ['کیڑے مار دوا زہر', 'pesticide-poisoning'],
    ['ڈی وی ٹی', 'dvt'],
    ['سی او پی ڈی', 'copd'],
    ['ڈیمینشیا', 'dementia'],
    ['شدید الرجی', 'anaphylaxis'],
    ['بچھو کا ڈنک', 'scorpion-sting'],
    ['تیزاب پینا', 'acid-ingestion'],
    ['گیزر کا دھواں', 'carbon-monoxide'],
    ['بستر کے زخم', 'bed-sores'],
    ['تپ دق', 'tuberculosis'],
    ['ٹی بی', 'tuberculosis'],
    ['مرگی', 'epilepsy'],
    ['خسرہ', 'measles'],
    ['آشوب چشم', 'conjunctivitis'],
    ['آنکھ آنا', 'conjunctivitis'],
    ['اسکبیز', 'scabies'],
    ['سروائیکل', 'cervical-spondylosis'],
    ['نی اوسٹیوآرتھرائٹس', 'knee-oa'],
    ['دوران حمل معائنہ', 'antenatal-care'],
    ['خواتین میں خون کی کمی', 'anemia-women'],
    ['حفاظتی ٹیکے', 'epi-schedule'],
    ['کان کا انفیکشن', 'otitis-media'],
    ['گلے میں پھنسنا', 'choking'],
    ['مصنوعی سانس', 'cpr'],
    ['سی پی آر', 'cpr']
  ];

  for (const [input, expectedCanonical] of testCases) {
    const res = fuzzyFindMedicalConcept(input);
    assert(res !== null && res.canonical === expectedCanonical,
      `fuzzyFindMedicalConcept("${input}") should resolve to "${expectedCanonical}" (got: ${res ? res.canonical : 'null'})`);
  }

  // Performance benchmark
  const start = performance.now();
  const iterations = 5000;
  for (let i = 0; i < iterations; i++) {
    const tc = testCases[i % testCases.length];
    fuzzyFindMedicalConcept(tc[0]);
  }
  const duration = performance.now() - start;
  const avgMs = duration / iterations;
  assert(avgMs < 0.05, `Average fuzzy lookup time should be < 0.05ms (got: ${avgMs.toFixed(5)}ms)`);

  console.log(`  ✅ Fuzzy matcher tested across ${testCases.length} conditions with average speed ${avgMs.toFixed(5)}ms/query.\n`);

  // -------------------------------------------------------------
  // TEST GROUP 3: RAG Retrieval & Calibrated Grounding
  // -------------------------------------------------------------
  console.log('[Test Group 3] RAG Retrieval & Calibrated Grounding');

  // Verify that for all 160 topics in the corpus, searching its primary title/tag finds the topic
  for (const item of CORPUS) {
    // Search by title.en
    const hitsEn = retrieveCorpus(item.title.en, 3);
    assert(hitsEn.some(h => h.item.id === item.id),
      `retrieveCorpus should find topic "${item.id}" using English title "${item.title.en}"`);

    // Search by title.ur
    const hitsUr = retrieveCorpus(item.title.ur, 3);
    assert(hitsUr.some(h => h.item.id === item.id),
      `retrieveCorpus should find topic "${item.id}" using Urdu title "${item.title.ur}"`);

    // Search by title.roman
    const hitsRoman = retrieveCorpus(item.title.roman, 3);
    assert(hitsRoman.some(h => h.item.id === item.id),
      `retrieveCorpus should find topic "${item.id}" using Roman title "${item.title.roman}"`);
  }

  console.log(`  ✅ All ${CORPUS.length} topics retrieved via trilingual titles with high confidence.\n`);

  // -------------------------------------------------------------
  // TEST GROUP 4: Multi-Turn Context Inheritance
  // -------------------------------------------------------------
  console.log('[Test Group 4] Multi-Turn Context Inheritance');

  const followUpQueries = [
    'How can I treat this at home?',
    'What are the home remedies?',
    'What precautions should we take?',
    'When to see a doctor?',
    'What should I eat?',
    'Tell me more details',
    'Gharelu ilaj kya hai?',
    'Doctor ko kab dikhana chahiye?',
    'Bachao ke tareeqay kya hain?',
    'Khorak me kya parhez karein?',
    'گھر پر دیکھ بھال کا طریقہ بتائیں',
    'ڈاکٹر کو کب دکھانا ضروری ہے؟',
    'احتیاطی تدابیر کیا ہیں؟'
  ];

  // Test multi-turn inheritance across a diverse sample of clinical topics from all domains
  const sampleTopics = [
    { query: 'I have severe backache and cannot bend', expectedId: 'back-pain' },
    { query: 'Mujhe pcos ka masla hai aur periods irregular hain', expectedId: 'pcos-polycystic-ovary' },
    { query: 'Baby has severe infant colic and cries constantly', expectedId: 'infant-colic' },
    { query: 'I was diagnosed with DVT in my calf', expectedId: 'dvt-deep-vein-thrombosis' },
    { query: 'Kaan me shadeed infection aur peep beh rahi hai', expectedId: 'ear-infection' },
    { query: 'Pesticide spray inhale kar liya aur vomiting ho rahi hai', expectedId: 'pesticide-poisoning' },
    { query: 'Doctor told me I have cataracts in my eye', expectedId: 'cataract-motia' },
    { query: 'Bed sores ho gaye hain kamar par', expectedId: 'bedsores-pressure-ulcers' },
    { query: 'Child has croup with barking cough', expectedId: 'croup-stridor' },
    { query: 'How can we prevent falls in elderly at home?', expectedId: 'falls-in-elderly' }
  ];

  for (const sample of sampleTopics) {
    // Initial turn
    const firstRes = runOfflineEngine(sample.query, 'en');
    assert(firstRes.citations.some(c => c.id === sample.expectedId),
      `First turn "${sample.query}" should cite "${sample.expectedId}" (got: ${firstRes.citations.map(c=>c.id).join(', ')})`);

    const history = [
      { role: 'user', content: sample.query },
      { role: 'assistant', content: firstRes.content }
    ];

    // Follow-up turns
    for (const fu of followUpQueries) {
      const fuRes = runOfflineEngine(fu, 'en', history);
      assert(fuRes.citations.some(c => c.id === sample.expectedId),
        `Follow-up "${fu}" following "${sample.expectedId}" should inherit topic context (got: ${fuRes.citations.map(c=>c.id).join(', ')})`);
      assert(!fuRes.content.includes('offline pack does not cover'),
        `Follow-up "${fu}" should NOT return generic pack refusal`);
    }
  }

  console.log(`  ✅ Multi-turn inheritance verified across topics and multi-lingual follow-up queries.\n`);

  // -------------------------------------------------------------
  // TEST GROUP 5: SQLite Database Provenance & Seed Verification
  // -------------------------------------------------------------
  console.log('[Test Group 5] SQLite Database Provenance & Seed Verification');

  const dbDocs = await db.document.findMany();
  assert(dbDocs.length >= 120, `Database must contain >= 120 documents (actual: ${dbDocs.length})`);
  assert(dbDocs.length === CORPUS.length, `Database doc count (${dbDocs.length}) must match CORPUS size (${CORPUS.length})`);

  const dbDocMap = new Map(dbDocs.map(d => [d.slug, d]));
  for (const item of CORPUS) {
    const dbDoc = dbDocMap.get(item.id);
    assert(!!dbDoc, `Database must contain slug "${item.id}"`);
    if (dbDoc) {
      assert(dbDoc.title === item.title.en, `Doc "${item.id}" title mismatch: DB "${dbDoc.title}" vs Code "${item.title.en}"`);
      assert(dbDoc.publisher === item.source.publisher, `Doc "${item.id}" publisher mismatch`);
      assert(dbDoc.sourceUrl === item.source.url, `Doc "${item.id}" sourceUrl mismatch`);
      assert(dbDoc.topic === item.topic, `Doc "${item.id}" topic mismatch`);
      assert(dbDoc.audience === item.audience, `Doc "${item.id}" audience mismatch`);
      assert(dbDoc.baseLevel === item.baseLevel, `Doc "${item.id}" baseLevel mismatch`);
    }
  }

  console.log(`  ✅ SQLite custom.db has full 1-to-1 provenance match for all ${CORPUS.length} topics.\n`);

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('============================================================');
  console.log(`  REVIEWER 4 TEST RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    console.error('Failure summary:');
    failures.forEach(f => console.error(' ', f));
    process.exit(1);
  }
}

runReviewer4Suite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
}).finally(() => {
  db.$disconnect();
});
