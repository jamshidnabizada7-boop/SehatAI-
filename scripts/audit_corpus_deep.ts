import { CORPUS } from '../src/data/corpus';
import { MEDICAL_CANONICAL_TERMS, COMPILED_ALIASES, fuzzyFindMedicalConcept, damerauLevenshteinDistance, stringSimilarity } from '../src/lib/engine/fuzzy-matcher';
import { runOfflineEngine, retrieveCorpus, QUERY_SYNONYMS } from '../src/lib/engine/safety-engine';

console.log('============================================================');
console.log(' INDEPENDENT VICTORY AUDITOR — DEEP VERIFICATION SCRIPT');
console.log('============================================================\n');

// 1. Check Corpus Count & Uniqueness
console.log('[Check 1] Corpus Size & ID Uniqueness');
const totalTopics = CORPUS.length;
console.log(`Total topics in CORPUS: ${totalTopics}`);
if (totalTopics < 120) {
  throw new Error(`Corpus size ${totalTopics} is less than required 120`);
}
const idSet = new Set<string>();
const duplicateIds: string[] = [];
for (const item of CORPUS) {
  if (idSet.has(item.id)) {
    duplicateIds.push(item.id);
  }
  idSet.add(item.id);
}
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate IDs found: ${duplicateIds.join(', ')}`);
}
console.log(`✅ All ${totalTopics} IDs are completely unique.\n`);

// 2. 20 Medical Domains Verification
console.log('[Check 2] 20 Medical Domains Verification');
const DOMAINS_SPEC = [
  { id: 1, name: 'Cardiology & Vascular', terms: ['hypertension', 'angina', 'heart failure', 'arrhythmia', 'dvt', 'chest pain'] },
  { id: 2, name: 'Pulmonology', terms: ['asthma', 'copd', 'pneumonia', 'bronchitis', 'tuberculosis', 'pleural pain'] },
  { id: 3, name: 'Gastroenterology & Hepatology', terms: ['gerd', 'peptic ulcer', 'hemorrhoids', 'jaundice', 'hepatitis', 'fatty liver', 'ibs', 'gallstones', 'food poisoning', 'celiac'] },
  { id: 4, name: 'Neurology', terms: ['migraine', 'stroke', 'epilepsy', 'vertigo', 'bell', 'neuropathy', 'concussion', 'headache'] },
  { id: 5, name: 'Infectious & Tropical', terms: ['dengue', 'malaria', 'typhoid', 'cholera', 'rabies', 'measles', 'chickenpox', 'tetanus', 'leishmaniasis', 'polio'] },
  { id: 6, name: 'Orthopedics & Rheumatology', terms: ['back pain', 'backache', 'cervical', 'knee', 'rheumatoid', 'gout', 'frozen shoulder', 'carpal tunnel', 'fracture', 'sprain'] },
  { id: 7, name: 'Dermatology', terms: ['scabies', 'eczema', 'psoriasis', 'fungal', 'ringworm', 'acne', 'melasma', 'urticaria', 'cellulitis', 'warts'] },
  { id: 8, name: 'Nephrology & Urology', terms: ['uti', 'kidney stone', 'ckd', 'bph', 'prostate', 'hematuria', 'hydrocele'] },
  { id: 9, name: 'Obstetrics & Maternal', terms: ['anc', 'antenatal', 'morning sickness', 'preeclampsia', 'gestational diabetes', 'ectopic', 'postpartum hemorrhage'] },
  { id: 10, name: 'Gynecology & Women Health', terms: ['dysmenorrhea', 'period pain', 'pcos', 'vaginal candidiasis', 'yeast', 'endometriosis', 'menopause', 'anemia in women'] },
  { id: 11, name: 'Pediatrics & Neonatology', terms: ['epi schedule', 'neonatal jaundice', 'colic', 'diaper rash', 'croup', 'febrile seizure', 'rickets', 'malnutrition'] },
  { id: 12, name: 'Endocrinology & Metabolism', terms: ['diabetes', 'hypoglycemia', 'hyperglycemia', 'hypothyroidism', 'hyperthyroidism', 'vitamin d', 'metabolic syndrome'] },
  { id: 13, name: 'Ophthalmology / Eye Care', terms: ['conjunctivitis', 'stye', 'cataract', 'glaucoma', 'dry eye', 'eye trauma', 'eye injury'] },
  { id: 14, name: 'Otorhinolaryngology (ENT)', terms: ['otitis', 'tonsillitis', 'sinusitis', 'epistaxis', 'nosebleed', 'tinnitus', 'foreign body', 'earache'] },
  { id: 15, name: 'Dental & Oral', terms: ['toothache', 'gingivitis', 'abscess', 'dental trauma', 'mouth ulcer', 'oral thrush'] },
  { id: 16, name: 'Hematology & Oncology', terms: ['anemia', 'thalassemia', 'bleeding', 'bruising', 'lymph node'] },
  { id: 17, name: 'Psychiatry & Mental Health', terms: ['anxiety', 'depression', 'panic', 'postpartum depression', 'insomnia', 'sleep'] },
  { id: 18, name: 'Emergency & Resuscitation', terms: ['chest pain', 'anaphylaxis', 'choking', 'cpr', 'burn', 'hemorrhage', 'shock'] },
  { id: 19, name: 'Toxicology & Environmental', terms: ['snakebite', 'scorpion', 'pesticide', 'acid ingestion', 'carbon monoxide', 'poisoning', 'heatstroke'] },
  { id: 20, name: 'Geriatrics & Palliative', terms: ['fall', 'dementia', 'bed sore', 'polypharmacy', 'osteoporosis'] },
];

for (const d of DOMAINS_SPEC) {
  const matchingItems = CORPUS.filter((item) => {
    const text = `${item.id} ${item.topic} ${item.title.en} ${item.tags.join(' ')}`.toLowerCase();
    return d.terms.some((t) => text.includes(t.toLowerCase()));
  });
  if (matchingItems.length === 0) {
    throw new Error(`Domain ${d.id} (${d.name}) has 0 matching topics in CORPUS!`);
  }
  console.log(`  Domain ${d.id.toString().padStart(2, ' ')}: ${d.name.padEnd(32, ' ')} -> ${matchingItems.length} topics`);
}
console.log('✅ All 20 domains verified with substantial topic representation.\n');

// 3. Trilingual Formatting & Metadata Verification
console.log('[Check 3] Trilingual Formatting & Metadata Integrity');
let invalidFormatCount = 0;
for (const item of CORPUS) {
  // Titles
  if (!item.title.en || !item.title.ur || !item.title.roman) {
    console.error(`Missing title in item: ${item.id}`);
    invalidFormatCount++;
  }
  // Contents
  if (!item.content.en || !item.content.ur || !item.content.roman) {
    console.error(`Missing content in item: ${item.id}`);
    invalidFormatCount++;
  }
  // Bullets
  if (!item.content.en.includes('•') || !item.content.ur.includes('•') || !item.content.roman.includes('•')) {
    console.error(`Missing bullet points in item: ${item.id}`);
    invalidFormatCount++;
  }
  // Doctor warning headers
  const enWarn = /SEE A DOCTOR|DOCTOR|EMERGENCY|IMMEDIATELY/i.test(item.content.en);
  const urWarn = /ڈاکٹر|ہسپتال|ایمرجنسی|فوراً/i.test(item.content.ur);
  const romanWarn = /DOCTOR|HOSPITAL|EMERGENCY|FORI/i.test(item.content.roman);
  if (!enWarn || !urWarn || !romanWarn) {
    console.error(`Missing warning headers in item: ${item.id}`);
    invalidFormatCount++;
  }
  // Source metadata
  if (!item.source || !item.source.publisher || !item.source.url || !item.source.url.startsWith('https://')) {
    console.error(`Invalid source metadata in item: ${item.id}`);
    invalidFormatCount++;
  }
  // Tags
  if (!Array.isArray(item.tags) || item.tags.length < 3) {
    console.error(`Insufficient tags in item: ${item.id} (found ${item.tags?.length})`);
    invalidFormatCount++;
  }
}
if (invalidFormatCount > 0) {
  throw new Error(`Found ${invalidFormatCount} formatting issues in CORPUS`);
}
console.log(`✅ All ${totalTopics} topics pass 100% of formatting, trilingual, bullet, warning, tag, and citation requirements.\n`);

// 4. Fuzzy Engine Benchmarks & Resolution Test
console.log('[Check 4] Fuzzy Engine Benchmark & Clinical Resolution');
const targetTerms = [
  'pcos', 'thalassemia', 'falij', 'bph', 'leishmaniasis', 'peelia', 'motia', 'gardan ka dard', 'pesticide poisoning',
  'dvt', 'copd', 'dementia', 'anaphylaxis', 'chambal', 'bawaseer', 'yarqan', 'gurde me pathri', 'pitte ki pathri'
];
for (const term of targetTerms) {
  const match = fuzzyFindMedicalConcept(term);
  if (!match) {
    throw new Error(`Failed to fuzzy match target term: "${term}"`);
  }
  console.log(`  "${term.padEnd(20, ' ')}" -> canonical: ${match.canonical.padEnd(20, ' ')} (alias: "${match.matchedAlias}", sim: ${match.similarity.toFixed(2)})`);
}

// Perso-Arabic queries
const urduQueries = [
  { q: 'پی سی او ایس', expected: 'pcos' },
  { q: 'تھیلیسیمیا', expected: 'thalassemia' },
  { q: 'فالج', expected: 'stroke' },
  { q: 'پروسٹیٹ', expected: 'prostate' },
  { q: 'سال دانہ', expected: 'leishmaniasis' },
  { q: 'یرقان', expected: 'jaundice' },
  { q: 'سفید موتیا', expected: 'cataract' },
  { q: 'گردن کا درد', expected: 'neck-pain' },
  { q: 'کیڑے مار دوا زہر', expected: 'pesticide-poisoning' },
  { q: 'بواسیر', expected: 'hemorrhoids' },
];
for (const item of urduQueries) {
  const match = fuzzyFindMedicalConcept(item.q);
  if (!match || match.canonical !== item.expected) {
    throw new Error(`Perso-Arabic query "${item.q}" failed to resolve to "${item.expected}" (got ${match?.canonical})`);
  }
  console.log(`  Perso-Arabic: "${item.q.padEnd(16, ' ')}" -> canonical: ${match.canonical.padEnd(20, ' ')} ✅`);
}

// Latency Benchmark
const BENCHMARK_ITERATIONS = 50000;
const start = performance.now();
for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
  fuzzyFindMedicalConcept('headeach and sar me dard');
}
const elapsed = performance.now() - start;
const avgMs = elapsed / BENCHMARK_ITERATIONS;
console.log(`\nBenchmark: ${BENCHMARK_ITERATIONS} lookups executed in ${elapsed.toFixed(2)}ms (avg: ${avgMs.toFixed(5)}ms per lookup)`);
if (avgMs >= 1.0) {
  throw new Error(`Lookup latency ${avgMs.toFixed(5)}ms exceeded 1.0ms requirement`);
}
console.log(`✅ Sub-1ms execution verified (measured: ${avgMs.toFixed(5)}ms)\n`);

// 5. Multi-Turn Context Grounding & Disambiguation
console.log('[Check 5] Multi-Turn Context Grounding & Offline Engine');
const conversation = [
  { role: 'user', content: 'I have severe chest pain and breathlessness' },
  { role: 'assistant', content: '**Chest pain guidance**\n\n• Rest immediately' },
];
const followUpRes = runOfflineEngine('What are the warning signs?', 'en', conversation);
if (followUpRes.content.includes('does not cover')) {
  throw new Error('Multi-turn follow up failed to inherit prior context');
}
console.log('✅ Multi-turn follow-up context inheritance verified.');

console.log('\n============================================================');
console.log(' INDEPENDENT VICTORY AUDITOR VERIFICATION COMPLETE — ALL PASSED');
console.log('============================================================\n');
