import {
  tokenizeText,
  hasTokenBoundaryMatch,
  expandQuerySynonyms,
  retrieveCorpus,
  MIN_CORPUS_SCORE_THRESHOLD,
} from '../src/lib/engine/safety-engine';
import { CORPUS } from '../src/data/corpus';
import { extractCitations } from '../src/server/pipeline/run';

console.log('=== RUNNING M2 VERIFICATION SUITE ===\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

// 1. Tokenizer tests
console.log('1. Testing tokenizeText():');
assert(
  JSON.stringify(tokenizeText('I have a high fever!')) ===
    JSON.stringify(['i', 'have', 'a', 'high', 'fever']),
  'Tokenizes English with punctuation stripping'
);
assert(
  JSON.stringify(tokenizeText('sar dard, bukhar aur ulti...')) ===
    JSON.stringify(['sar', 'dard', 'bukhar', 'aur', 'ulti']),
  'Tokenizes Roman Urdu with punctuation stripping'
);
assert(
  JSON.stringify(tokenizeText('مجھے تیز بخار ہے اور سر درد')) ===
    JSON.stringify(['مجھے', 'تیز', 'بخار', 'ہے', 'اور', 'سر', 'درد']),
  'Tokenizes Perso-Arabic Urdu characters accurately'
);

// 2. Token-boundary matching tests
console.log('\n2. Testing hasTokenBoundaryMatch():');
assert(hasTokenBoundaryMatch('I have tb', 'tb') === true, 'Exact match "tb" isolated');
assert(hasTokenBoundaryMatch('I sat at the table', 'tb') === false, 'False match "tb" inside "table" rejected');
assert(hasTokenBoundaryMatch('Check my bp now', 'bp') === true, 'Exact match "bp" isolated');
assert(hasTokenBoundaryMatch('Subpart of the book', 'bp') === false, 'False match "bp" inside "subpart" rejected');
assert(hasTokenBoundaryMatch('sar dard ho raha hai', 'dard') === true, 'Exact match "dard" isolated');
assert(hasTokenBoundaryMatch('dardanelles strait', 'dard') === false, 'False match "dard" inside "dardanelles" rejected');
assert(hasTokenBoundaryMatch('blood sugar is high', 'sugar') === true, 'Exact match "sugar" isolated');
assert(hasTokenBoundaryMatch('sugary syrup', 'sugar') === false, 'False match "sugar" inside "sugary" rejected');
assert(hasTokenBoundaryMatch('مجھے تپ دق کا شبہ ہے', 'تپ دق') === true, 'Perso-Arabic Urdu phrase matched');
assert(hasTokenBoundaryMatch('شدید خارش ہو رہی ہے', 'خارش') === true, 'Perso-Arabic Urdu word matched');

// 3. Synonym expansion tests
console.log('\n3. Testing expandQuerySynonyms():');
assert(!expandQuerySynonyms('table').includes('tuberculosis'), '"table" does not expand to tb/tuberculosis');
assert(!expandQuerySynonyms('nobody').includes('hypertension'), '"nobody" does not expand to bp/hypertension');
assert(expandQuerySynonyms('I have diabetis').includes('diabetes'), '"diabetis" misspelling expands to diabetes');
assert(expandQuerySynonyms('I have feever').includes('fever'), '"feever" misspelling expands to fever');
assert(expandQuerySynonyms('I have tb').includes('tuberculosis'), '"tb" expands to tuberculosis');

// 4. In-corpus retrieval tests
console.log('\n4. Testing in-corpus retrieveCorpus():');
const feverHits = retrieveCorpus('mujhe do din se bukhar hai aur sar dard', 3);
assert(feverHits.length > 0 && feverHits.map((h) => h.item.id).includes('fever-adult'), 'Fever query retrieves fever-adult');

const dengueHits = retrieveCorpus('I have fever since 5 days with pain behind my eyes and body ache', 3);
assert(dengueHits.length > 0 && dengueHits.map((h) => h.item.id).includes('dengue'), 'Dengue query retrieves dengue');

const diabetesHits = retrieveCorpus('I have diabetis', 3);
assert(diabetesHits.length > 0 && diabetesHits.map((h) => h.item.id).includes('diabetes-basics'), 'Diabetis misspelling retrieves diabetes-basics');

const antibioticHits = retrieveCorpus('which antibiotic should I take for fever', 3);
assert(antibioticHits.length > 0 && antibioticHits.map((h) => h.item.id).includes('antibiotic-awareness'), 'Antibiotic query retrieves antibiotic-awareness');

const hypoHits = retrieveCorpus('sugar gir gayi hai haath kanp rahe hain', 3);
assert(hypoHits.length > 0 && hypoHits[0].item.id === 'diabetes-low-sugar', 'Hypoglycemia query top-ranks diabetes-low-sugar');

const measlesHits = retrieveCorpus('bachay ko bukhar aur danay khasra', 3);
assert(measlesHits.length > 0 && measlesHits.map((h) => h.item.id).includes('measles-child'), 'Measles query retrieves measles-child');

const fractureHits = retrieveCorpus('haddi toot gayi gir gaya tha broken bone', 3);
assert(fractureHits.length > 0 && fractureHits.map((h) => h.item.id).includes('fracture-first-aid'), 'Fracture query retrieves fracture-first-aid');

const backPainHits = retrieveCorpus('kamar mein sakht dard hai lower back pain', 3);
assert(backPainHits.length > 0 && backPainHits.map((h) => h.item.id).includes('back-pain'), 'Back pain query retrieves back-pain');

// 5. Out-of-corpus abstention tests (Must strictly return 0 hits -> citations: [])
console.log('\n5. Testing out-of-corpus retrieveCorpus() abstention:');
const alopeciaHits = retrieveCorpus('I have male pattern baldness and diffuse hair loss alopecia', 5);
assert(alopeciaHits.length === 0, `Alopecia / hair loss query returns 0 hits (got ${alopeciaHits.length})`);

const eyeFatigueHits = retrieveCorpus('My eyes are dry and tired from looking at computer screens all day', 5);
assert(eyeFatigueHits.length === 0, `Dry eyes / screen fatigue query returns 0 hits (got ${eyeFatigueHits.length})`);

const psoriasisHits = retrieveCorpus('I have scaly silvery plaques and thick skin patches on my elbows psoriasis', 5);
assert(psoriasisHits.length === 0, `Psoriasis / plaques query returns 0 hits (got ${psoriasisHits.length})`);

const toenailHits = retrieveCorpus('I have an ingrown toenail on my big toe with corner nail pain', 5);
assert(toenailHits.length === 0, `Ingrown toenail query returns 0 hits (got ${toenailHits.length})`);

const dinnerFoodHits = retrieveCorpus('What food should I cook and eat for dinner tonight?', 5);
assert(dinnerFoodHits.length === 0, `Generic food/dinner query returns 0 hits (got ${dinnerFoodHits.length})`);

const genericMedicineHits = retrieveCorpus('Where can I buy generic tablets medicine from pharmacist?', 5);
assert(genericMedicineHits.length === 0, `Generic medicine/tablet query returns 0 hits (got ${genericMedicineHits.length})`);

// 6. Corpus metadata integrity
console.log('\n6. Testing CORPUS integrity:');
assert(CORPUS.length >= 80, `Corpus has at least 80 documents (found ${CORPUS.length})`);
for (const item of CORPUS) {
  assert(item.source.publisher.length > 1, `Item ${item.id} has publisher`);
  assert(item.source.url.startsWith('https://'), `Item ${item.id} has valid HTTPS URL`);
  assert(/^\d{4}-\d{2}$/.test(item.source.verifiedAt), `Item ${item.id} has valid verification date`);
}

// 7. Threshold export check
console.log('\n7. Testing exported constants:');
assert(MIN_CORPUS_SCORE_THRESHOLD === 2.5, 'MIN_CORPUS_SCORE_THRESHOLD is 2.5');

// 8. Citation extraction & isolation tests
console.log('\n8. Testing extractCitations() isolation:');
const { citations: validCites } = extractCitations('drink fluids [fever-adult] and rest [diarrhea-ors]');
assert(
  validCites.map((c) => c.id).sort().join(',') === 'diarrhea-ors,fever-adult',
  'Valid corpus IDs extracted into citation objects'
);

const { citations: strippedCites, stripped, sanitized } = extractCitations(
  'fever needs fluids [fever-adult] per the famous study [made-up-study-99]'
);
assert(stripped.includes('made-up-study-99'), 'Invented ID recorded in stripped list');
assert(!strippedCites.map((c) => c.id).includes('made-up-study-99'), 'Invented ID excluded from citations');
assert(!sanitized.includes('made-up-study-99'), 'Invented ID stripped from sanitized text');

// Context-restricted allowedIds
const restrictedAllowed = new Set(['fever-adult']);
const { citations: restrictedCites, stripped: restrictedStripped } = extractCitations(
  'guidance [fever-adult] and more [dengue]',
  restrictedAllowed
);
assert(restrictedCites.length === 1 && restrictedCites[0].id === 'fever-adult', 'Only allowed retrieved IDs are cited');
assert(restrictedStripped.includes('dengue'), 'Non-retrieved IDs are stripped');

// Abstention scenario (empty allowedIds)
const emptyAllowed = new Set<string>();
const { citations: emptyCites } = extractCitations('dental advice [fever-adult]', emptyAllowed);
assert(emptyCites.length === 0, 'Empty context yields citations: []');

console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED PERFECTLY!');
}

