import { runOfflineEngine, retrieveCorpus } from '../src/lib/engine/safety-engine';
import { damerauLevenshteinDistance, stringSimilarity, fuzzyFindMedicalConcept } from '../src/lib/engine/fuzzy-matcher';
import { CORPUS } from '../src/data/corpus';

let passed = 0;
let total = 0;

function assert(condition: boolean, msg: string) {
  total++;
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  } else {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  }
}

console.log('============================================================');
console.log('  SehatAI — Offline Intelligence & Fuzzy Matching Suite');
console.log('============================================================\n');

// 1. Damerau-Levenshtein Distance & Similarity Tests
console.log('[Test Group 1] Damerau-Levenshtein String Metric');
const d1 = damerauLevenshteinDistance('headache', 'headeach');
assert(d1 <= 2, `damerauLevenshteinDistance('headache', 'headeach') <= 2 (got ${d1})`);

const d2 = damerauLevenshteinDistance('toothache', 'tootheach');
assert(d2 <= 2, `damerauLevenshteinDistance('toothache', 'tootheach') <= 2 (got ${d2})`);

const sim1 = stringSimilarity('headeach', 'headache');
assert(sim1 >= 0.75, `stringSimilarity('headeach', 'headache') >= 0.75 (got ${sim1})`);

const sim2 = stringSimilarity('vomting', 'vomiting');
assert(sim2 >= 0.75, `stringSimilarity('vomting', 'vomiting') >= 0.75 (got ${sim2})`);

// 2. Fuzzy Medical Concept Resolution (Canonical + Newly Added Clinical Topics)
console.log('\n[Test Group 2] Fuzzy Medical Concept Resolution');
const f1 = fuzzyFindMedicalConcept('I AM HEADEACH');
assert(f1 !== null && f1.canonical === 'headache', 'Fuzzy finds "headache" from "I AM HEADEACH"');

const f2 = fuzzyFindMedicalConcept('I AM TOOTHEACH');
assert(f2 !== null && f2.canonical === 'toothache', 'Fuzzy finds "toothache" from "I AM TOOTHEACH"');

const f3 = fuzzyFindMedicalConcept('bachay ko diaria lag gaye hain');
assert(f3 !== null && f3.canonical === 'diarrhea', 'Fuzzy finds "diarrhea" from "diaria"');

const f4 = fuzzyFindMedicalConcept('vomting ho rahi hai subah se');
assert(f4 !== null && f4.canonical === 'vomiting', 'Fuzzy finds "vomiting" from "vomting"');

const f5 = fuzzyFindMedicalConcept('mujhe tez bukaar hai');
assert(f5 !== null && f5.canonical === 'fever', 'Fuzzy finds "fever" from "bukaar"');

const f6 = fuzzyFindMedicalConcept('mujhe bawaseer ka masla hai');
assert(f6 !== null && f6.canonical === 'hemorrhoids', 'Fuzzy finds "hemorrhoids" from "bawaseer"');

const f7 = fuzzyFindMedicalConcept('yarqan ho gaya hai peeli aankhein');
assert(f7 !== null && f7.canonical === 'jaundice', 'Fuzzy finds "jaundice" from "yarqan"');

const f8 = fuzzyFindMedicalConcept('pitte ki pathri ka masla');
assert(f8 !== null && f8.canonical === 'gallstones', 'Fuzzy finds "gallstones" from "pitte ki pathri"');

const f9 = fuzzyFindMedicalConcept('gurde me pathri aur shadeed dard');
assert(f9 !== null && f9.canonical === 'kidney-stones', 'Fuzzy finds "kidney-stones" from "gurde me pathri"');

const f10 = fuzzyFindMedicalConcept('sinus dard aur naak band');
assert(f10 !== null && f10.canonical === 'sinusitis', 'Fuzzy finds "sinusitis" from "sinus dard"');

const f11 = fuzzyFindMedicalConcept('munh me chhale nikal aaye hain');
assert(f11 !== null && f11.canonical === 'mouth-ulcers', 'Fuzzy finds "mouth-ulcers" from "munh me chhale"');

const f12 = fuzzyFindMedicalConcept('jild par chambal ki kharish');
assert(f12 !== null && f12.canonical === 'eczema', 'Fuzzy finds "eczema" from "chambal"');

const f13 = fuzzyFindMedicalConcept('uric acid barh gaya hai');
assert(f13 !== null && f13.canonical === 'gout', 'Fuzzy finds "gout" from "uric acid"');

const f14 = fuzzyFindMedicalConcept('garmi me loo lagna');
assert(f14 !== null && f14.canonical === 'heatstroke', 'Fuzzy finds "heatstroke" from "loo lagna"');

const f15 = fuzzyFindMedicalConcept('bijli ka current lag gaya');
assert(f15 !== null && f15.canonical === 'electric-shock', 'Fuzzy finds "electric-shock" from "bijli ka current"');

// Required specific aliases from user specifications
const fPcos = fuzzyFindMedicalConcept('pcos problem irregular periods');
assert(fPcos !== null && fPcos.canonical === 'pcos', 'Fuzzy finds "pcos"');

const fThal = fuzzyFindMedicalConcept('thalassemia trait blood test');
assert(fThal !== null && fThal.canonical === 'thalassemia', 'Fuzzy finds "thalassemia"');

const fFalij = fuzzyFindMedicalConcept('falij ka asar ho gaya');
assert(fFalij !== null && fFalij.canonical === 'stroke', 'Fuzzy finds "stroke" from "falij"');

const fBph = fuzzyFindMedicalConcept('bph prostate gadood problem');
assert(fBph !== null && fBph.canonical === 'prostate', 'Fuzzy finds "prostate" from "bph"');

const fLeish = fuzzyFindMedicalConcept('leishmaniasis sal dana skin sore');
assert(fLeish !== null && fLeish.canonical === 'leishmaniasis', 'Fuzzy finds "leishmaniasis"');

const fPeelia = fuzzyFindMedicalConcept('bachay ko peelia ho gaya hai');
assert(fPeelia !== null && (fPeelia.canonical === 'jaundice' || fPeelia.canonical === 'neonatal-jaundice'), 'Fuzzy finds jaundice/peelia from "peelia"');

const fMotia = fuzzyFindMedicalConcept('safaid motia ki bimari');
assert(fMotia !== null && fMotia.canonical === 'cataract', 'Fuzzy finds "cataract" from "motia"');

const fGardan = fuzzyFindMedicalConcept('gardan ka dard aur khichao');
assert(fGardan !== null && fGardan.canonical === 'neck-pain', 'Fuzzy finds "neck-pain" from "gardan ka dard"');

const fPesticide = fuzzyFindMedicalConcept('pesticide poisoning keeray mar dawa');
assert(fPesticide !== null && fPesticide.canonical === 'pesticide-poisoning', 'Fuzzy finds "pesticide-poisoning"');

const fDvt = fuzzyFindMedicalConcept('dvt pindli me khoon ka lothra');
assert(fDvt !== null && fDvt.canonical === 'dvt', 'Fuzzy finds "dvt"');

const fCopd = fuzzyFindMedicalConcept('copd purani khansi huqqa');
assert(fCopd !== null && fCopd.canonical === 'copd', 'Fuzzy finds "copd"');

const fDementia = fuzzyFindMedicalConcept('dementia alzheimers yaaddasht');
assert(fDementia !== null && fDementia.canonical === 'dementia', 'Fuzzy finds "dementia"');

const fAnaphylaxis = fuzzyFindMedicalConcept('anaphylaxis severe allergic reaction');
assert(fAnaphylaxis !== null && fAnaphylaxis.canonical === 'anaphylaxis', 'Fuzzy finds "anaphylaxis"');

// 3. Offline Engine Retrieval with Typo & Colloquial Inputs
console.log('\n[Test Group 3] Offline Engine Typo & Colloquial Grounding');
const resHeadache = runOfflineEngine('I AM HEADEACH', 'en');
assert(!resHeadache.content.includes('does not cover'), 'Offline engine successfully grounds "I AM HEADEACH"');
assert(resHeadache.citations.length > 0, 'Headache citations attached');

const resToothache = runOfflineEngine('I AM TOOTHEACH', 'en');
assert(!resToothache.content.includes('does not cover'), 'Offline engine successfully grounds "I AM TOOTHEACH"');
assert(resToothache.content.includes('Toothache') || resToothache.content.includes('toothache'), 'Toothache title included');

const resGerd = runOfflineEngine('seene ki jalan aur khatti dakar', 'roman');
assert(!resGerd.content.includes('seedha jawab maujood nahin'), 'Offline engine successfully grounds GERD / Acidity');

const resQabz = runOfflineEngine('mujhe 3 din se qabz hai', 'roman');
assert(!resQabz.content.includes('seedha jawab maujood nahin'), 'Offline engine successfully grounds Constipation');

const resEar = runOfflineEngine('kaan me shadeed dard hai', 'roman');
assert(!resEar.content.includes('seedha jawab maujood nahin'), 'Offline engine successfully grounds Ear Infection');

const resUti = runOfflineEngine('peshab me jalan ho rahi hai', 'roman');
assert(!resUti.content.includes('seedha jawab maujood nahin'), 'Offline engine successfully grounds UTI');

const resBawaseer = runOfflineEngine('mujhe bawaseer aur piles ka masla hai', 'roman');
assert(!resBawaseer.content.includes('seedha jawab maujood nahin'), 'Offline engine successfully grounds Bawaseer / Piles');
assert(resBawaseer.citations.length > 0, 'Bawaseer citations attached');

const resYarqan = runOfflineEngine('yarqan aur peeli aankhein', 'roman');
assert(!resYarqan.content.includes('seedha jawab maujood nahin'), 'Offline engine successfully grounds Yarqan / Jaundice');

const resPitta = runOfflineEngine('pitte ki pathri ka dard ho raha hai', 'roman');
assert(!resPitta.content.includes('seedha jawab maujood nahin'), 'Offline engine successfully grounds Pitte ki pathri / Gallstones');

const resGurda = runOfflineEngine('gurde me pathri aur pehloo me dard', 'roman');
assert(!resGurda.content.includes('seedha jawab maujood nahin'), 'Offline engine successfully grounds Gurde ki pathri / Kidney stones');

const resSinus = runOfflineEngine('sinus dard aur peshani me shadeed dabao', 'roman');
assert(!resSinus.content.includes('seedha jawab maujood nahin'), 'Offline engine successfully grounds Sinusitis');

const resChhale = runOfflineEngine('munh me chhale aur zaban par zakhm', 'roman');
assert(!resChhale.content.includes('seedha jawab maujood nahin'), 'Offline engine successfully grounds Mouth ulcers / Munh ke chhale');

const resDiaper = runOfflineEngine('diaper ke danay nappy rash', 'roman');
assert(!resDiaper.content.includes('seedha jawab maujood nahin'), 'Offline engine successfully grounds Diaper rash');

const resLoo = runOfflineEngine('loo lag gayi shadeed bukhar', 'roman');
assert(!resLoo.content.includes('seedha jawab maujood nahin'), 'Offline engine successfully grounds Loo lagna / Heatstroke');

const resCurrent = runOfflineEngine('bijli ka current lag gaya', 'roman');
assert(!resCurrent.content.includes('seedha jawab maujood nahin'), 'Offline engine successfully grounds Electric shock');

const resPcosGrounding = runOfflineEngine('PCOS and irregular periods home care', 'en');
assert(!resPcosGrounding.content.includes('does not cover'), 'Offline engine successfully grounds PCOS');
assert(resPcosGrounding.citations.length > 0, 'PCOS citations attached');

const resThalGrounding = runOfflineEngine('thalassemia major and blood transfusion care', 'en');
assert(!resThalGrounding.content.includes('does not cover'), 'Offline engine successfully grounds Thalassemia');

const resPesticideGrounding = runOfflineEngine('keeray mar dawa pesticide poisoning first aid', 'en');
assert(!resPesticideGrounding.content.includes('does not cover'), 'Offline engine successfully grounds Pesticide Poisoning');

// 4. Multi-Turn Offline Context Inheritance
console.log('\n[Test Group 4] Multi-Turn Offline Context Inheritance');
const historyBackache = [
  { role: 'user', content: 'I have severe backache' },
  { role: 'assistant', content: '**Back pain — safe care and warning signs**\n\n• Most back pain improves in 1–2 weeks with gentle movement' }
];

const followUp1 = runOfflineEngine('How can I prevent this at home?', 'en', historyBackache);
assert(!followUp1.content.includes('does not cover'), 'Follow-up "How can I prevent this at home?" inherits backache context');
assert(followUp1.citations.length > 0, 'Follow-up attached citations from inherited topic');

const followUp2 = runOfflineEngine('What are the danger signs to watch for?', 'en', historyBackache);
assert(!followUp2.content.includes('does not cover'), 'Follow-up "What are the danger signs to watch for?" inherits backache context');
assert(followUp2.content.includes('SEE A DOCTOR') || followUp2.content.includes('warning') || followUp2.content.includes('pain'), 'Danger signs emphasized in response');

const followUpUrdu = runOfflineEngine('گھر پر دیکھ بھال کے طریقے بتائیں', 'ur', historyBackache);
assert(!followUpUrdu.content.includes('اس سوال کا براہِ راست جواب موجود نہیں'), 'Urdu follow-up inherits previous topic context');

const historyKidney = [
  { role: 'user', content: 'mujhe gurde me pathri hai' },
  { role: 'assistant', content: '**Gurde ki pathri (kidney stones)**\n\n• Khoob paani piyein' }
];

const followUpRemedies = runOfflineEngine('What are the home remedies?', 'en', historyKidney);
assert(!followUpRemedies.content.includes('does not cover'), 'Follow-up "What are the home remedies?" inherits kidney stones context');
assert(followUpRemedies.citations.length > 0, 'Follow-up remedies attached citations');

const followUpDoc = runOfflineEngine('When to see doctor?', 'en', historyKidney);
assert(!followUpDoc.content.includes('does not cover'), 'Follow-up "When to see doctor?" inherits kidney stones context');
assert(followUpDoc.content.includes('doctor') || followUpDoc.content.includes('hospital') || followUpDoc.content.includes('guidance'), 'When to see doctor guidance returned');

const historyHeadache = [
  { role: 'user', content: 'I AM HEADEACH' },
  { role: 'assistant', content: '**Headache — care at home and warning signs**\n\n• Most headaches get better with rest' }
];
const followUpHeadacheDanger = runOfflineEngine('What are the danger signs to watch for?', 'en', historyHeadache);
assert(followUpHeadacheDanger.content.toLowerCase().includes('headache'), 'Follow-up "What are the danger signs to watch for?" stays on Headache');
assert(!followUpHeadacheDanger.content.includes('Pregnancy danger signs'), 'Follow-up on headache does NOT drift to pregnancy');

const historyPcos = [
  { role: 'user', content: 'PCOS and ovarian cysts' },
  { role: 'assistant', content: '**Polycystic Ovary Syndrome (PCOS)**\n\n• Lifestyle modifications' }
];
const followUpPcos = runOfflineEngine('What are the home remedies?', 'en', historyPcos);
assert(!followUpPcos.content.includes('does not cover'), 'Multi-turn follow-up on PCOS inherits PCOS context');

// 5. Longest-Alias Precedence & Substring Collision Invariance
console.log('\n[Test Group 5] Longest-Alias Precedence & Substring Collision Invariance');
const fDiaper = fuzzyFindMedicalConcept('diaper ke danay nappy rash');
assert(fDiaper !== null && fDiaper.canonical === 'diaper-rash', 'Multi-word "diaper ke danay" beats single word "danay" (allergy)');

const fSinus = fuzzyFindMedicalConcept('sinusitis naak band sar dard');
assert(fSinus !== null && fSinus.canonical === 'sinusitis', '"sinusitis" correctly resolved in presence of secondary symptom "sar dard"');

const fColic = fuzzyFindMedicalConcept('chhotay bachay ke pet me dard colic');
assert(fColic !== null && fColic.canonical === 'infant-colic', '"chhotay bachay ke pet me dard" beats general "pet dard"');

const fLoo = fuzzyFindMedicalConcept('loo lag gayi shadeed bukhar');
assert(fLoo !== null && fLoo.canonical === 'heatstroke', '"loo lag gayi" beats general "bukhar"');

// 6. Perso-Arabic Urdu Fuzzy Concept Resolution
console.log('\n[Test Group 6] Perso-Arabic Urdu Fuzzy Concept Resolution');
const fUrdu1 = fuzzyFindMedicalConcept('مجھے بواسیر ہے');
assert(fUrdu1 !== null && fUrdu1.canonical === 'hemorrhoids', 'Perso-Arabic "مجھے بواسیر ہے" resolves to "hemorrhoids"');

const fUrdu2 = fuzzyFindMedicalConcept('یرقانن');
assert(fUrdu2 !== null && fUrdu2.canonical === 'jaundice', 'Perso-Arabic typo "یرقانن" resolves to "jaundice"');

const fUrdu3 = fuzzyFindMedicalConcept('پتے کی پتھری کا مسئلہ');
assert(fUrdu3 !== null && fUrdu3.canonical === 'gallstones', 'Perso-Arabic "پتے کی پتھری" resolves to "gallstones"');

const fUrdu4 = fuzzyFindMedicalConcept('گردے میں پتھری');
assert(fUrdu4 !== null && fUrdu4.canonical === 'kidney-stones', 'Perso-Arabic "گردے میں پتھری" resolves to "kidney-stones"');

const fUrdu5 = fuzzyFindMedicalConcept('منہ کے چھالے');
assert(fUrdu5 !== null && fUrdu5.canonical === 'mouth-ulcers', 'Perso-Arabic "منہ کے چھالے" resolves to "mouth-ulcers"');

const fUrduPcos = fuzzyFindMedicalConcept('پی سی او ایس کا مسئلہ');
assert(fUrduPcos !== null && fUrduPcos.canonical === 'pcos', 'Perso-Arabic "پی سی او ایس" resolves to "pcos"');

const fUrduThal = fuzzyFindMedicalConcept('تھیلیسیمیا خون کی بیماری');
assert(fUrduThal !== null && fUrduThal.canonical === 'thalassemia', 'Perso-Arabic "تھیلیسیمیا" resolves to "thalassemia"');

const fUrduFalij = fuzzyFindMedicalConcept('فالج کا جھٹکا');
assert(fUrduFalij !== null && fUrduFalij.canonical === 'stroke', 'Perso-Arabic "فالج" resolves to "stroke"');

const fUrduSalDana = fuzzyFindMedicalConcept('سال دانہ لیشمینیاسس');
assert(fUrduSalDana !== null && fUrduSalDana.canonical === 'leishmaniasis', 'Perso-Arabic "سال دانہ" resolves to "leishmaniasis"');

const fUrduMotia = fuzzyFindMedicalConcept('سفید موتیا کا آپریشن');
assert(fUrduMotia !== null && fUrduMotia.canonical === 'cataract', 'Perso-Arabic "سفید موتیا" resolves to "cataract"');

// 7. Corpus Size, 20 Domains & Completeness Verification
console.log('\n[Test Group 7] Verified Clinical Health Corpus Scale (120+ Topics across 20 Domains)');
assert(CORPUS.length >= 120, `CORPUS size must be >= 120 topics across 20 domains (actual: ${CORPUS.length})`);

const trilingualComplete = CORPUS.every(
  (item) => item.title.en && item.title.ur && item.title.roman && item.content.en && item.content.ur && item.content.roman && item.source.publisher
);
assert(trilingualComplete, 'Every corpus topic contains verified trilingual titles, content, and valid publishers');

const bulletsComplete = CORPUS.every(
  (item) => item.content.en.includes('•') && item.content.ur.includes('•') && item.content.roman.includes('•')
);
assert(bulletsComplete, 'Every corpus topic contains bulleted home care steps in all 3 languages');

const triggersComplete = CORPUS.every(
  (item) =>
    /SEE A DOCTOR|SEE A HEALTH FACILITY|SAME DAY|GO TO A CLINIC|DOCTOR|EMERGENCY|CALL 1122|IMMEDIATELY/i.test(item.content.en) &&
    /ڈاکٹر|ہسپتال|کلینک|ایمرجنسی|فوراً|1122/i.test(item.content.ur) &&
    /DOCTOR|HOSPITAL|CLINIC|SAME DAY|EMERGENCY|FORI|1122/i.test(item.content.roman)
);
assert(triggersComplete, 'Every corpus topic contains structured doctor warning & emergency triggers in all 3 languages');

const uniqueIds = new Set(CORPUS.map(c => c.id));
assert(uniqueIds.size === CORPUS.length, `All ${CORPUS.length} topic IDs are unique`);

// Verify 20 Domains Representation
const DOMAINS_20 = [
  { name: '1. Cardiology & Vascular', topics: ['hypertension', 'angina', 'chestpain', 'heart-failure', 'arrhythmia', 'dvt'] },
  { name: '2. Pulmonology', topics: ['asthma', 'pneumonia', 'bronchitis', 'copd', 'pleural-pain'] },
  { name: '3. Gastroenterology & Hepatology', topics: ['diarrhea', 'cholera', 'gerd', 'constipation', 'peptic-ulcer', 'ibs', 'gallstones', 'fatty-liver', 'food-poisoning', 'celiac'] },
  { name: '4. Neurology', topics: ['stroke', 'migraine', 'headache', 'vertigo', 'bells-palsy', 'neuropathy', 'concussion'] },
  { name: '5. Infectious & Tropical', topics: ['fever', 'dengue', 'malaria', 'typhoid', 'chickenpox', 'rabies', 'tetanus', 'leishmaniasis', 'polio'] },
  { name: '6. Orthopedics & Rheumatology', topics: ['backache', 'osteoarthritis', 'gout', 'neck-pain', 'sprain', 'fracture', 'rheumatoid-arthritis', 'frozen-shoulder', 'carpal-tunnel'] },
  { name: '7. Dermatology', topics: ['eczema', 'fungal-infection', 'acne', 'allergy', 'burn', 'psoriasis', 'melasma', 'cellulitis', 'warts'] },
  { name: '8. Nephrology & Urology', topics: ['kidney-stones', 'uti', 'prostate', 'ckd', 'hematuria', 'hydrocele'] },
  { name: '9. Obstetrics & Maternal', topics: ['postpartum', 'morning-sickness', 'preeclampsia', 'gestational-diabetes', 'ectopic-pregnancy', 'postpartum-hemorrhage'] },
  { name: '10. Gynecology & Women Health', topics: ['period-pain', 'pcos', 'vaginal-candidiasis', 'endometriosis', 'menopause'] },
  { name: '11. Pediatrics & Neonatology', topics: ['infant-colic', 'diaper-rash', 'neonatal-jaundice', 'croup', 'febrile-seizures', 'rickets', 'malnutrition'] },
  { name: '12. Endocrinology & Metabolism', topics: ['diabetes', 'hypoglycemia', 'hyperglycemia', 'hypothyroidism', 'hyperthyroidism', 'vitamin-d', 'metabolic-syndrome'] },
  { name: '13. Ophthalmology / Eye Care', topics: ['eye-injury', 'stye', 'cataract', 'glaucoma', 'dry-eye'] },
  { name: '14. Otorhinolaryngology (ENT)', topics: ['sinusitis', 'allergic-rhinitis', 'tonsillitis', 'nosebleed', 'earache', 'tinnitus', 'foreign-body'] },
  { name: '15. Dental & Oral', topics: ['toothache', 'gingivitis', 'mouth-ulcers', 'dental-abscess', 'dental-trauma', 'oral-thrush'] },
  { name: '16. Hematology & Oncology', topics: ['anemia', 'thalassemia', 'bruising', 'lymph-node'] },
  { name: '17. Psychiatry & Mental Health', topics: ['insomnia', 'panic-attack', 'gad', 'depression', 'postpartum-depression'] },
  { name: '18. Emergency & Resuscitation', topics: ['electric-shock', 'heatstroke', 'bleeding', 'anaphylaxis'] },
  { name: '19. Toxicology & Environmental', topics: ['poisoning', 'snakebite', 'scorpion-sting', 'pesticide-poisoning', 'acid-ingestion', 'carbon-monoxide'] },
  { name: '20. Geriatrics & Palliative', topics: ['falls-elderly', 'dementia', 'bed-sores', 'polypharmacy', 'osteoporosis'] }
];

for (const d of DOMAINS_20) {
  const matches = CORPUS.filter(item => d.topics.some(t => item.topic.includes(t) || item.id.includes(t)));
  assert(matches.length > 0, `Domain "${d.name}" represented in corpus (${matches.length} topics)`);
}

console.log('\n============================================================');
console.log(`  ALL OFFLINE INTELLIGENCE TESTS PASSED (${passed}/${total})!`);
console.log('============================================================\n');
