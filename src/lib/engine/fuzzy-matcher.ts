// ============================================================
// SehatAI — Pure TypeScript Damerau-Levenshtein & Trigram
// Algorithmic Fuzzy Matcher for Offline Medical NLP
// Sub-1ms execution, zero external dependencies.
// ============================================================

// Static matrix buffer to eliminate array allocations and GC overhead in hot paths
const STATIC_MATRIX_SIZE = 128;
const STATIC_MATRIX = new Int32Array(STATIC_MATRIX_SIZE * STATIC_MATRIX_SIZE);

/**
 * Calculates the Damerau-Levenshtein distance between two strings,
 * counting insertions, deletions, substitutions, and adjacent character transpositions.
 */
export function damerauLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  const lenA = a.length;
  const lenB = b.length;
  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  if (lenA + 2 > STATIC_MATRIX_SIZE || lenB + 2 > STATIC_MATRIX_SIZE) {
    // Dynamic fallback for unusually huge strings
    const matrix: number[][] = [];
    for (let i = 0; i <= lenA + 1; i++) {
      matrix[i] = new Array(lenB + 2).fill(0);
    }
    const maxDist = lenA + lenB;
    matrix[0][0] = maxDist;
    for (let i = 0; i <= lenA; i++) {
      matrix[i + 1][0] = maxDist;
      matrix[i + 1][1] = i;
    }
    for (let j = 0; j <= lenB; j++) {
      matrix[0][j + 1] = maxDist;
      matrix[1][j + 1] = j;
    }
    const lastCharPos: Record<string, number> = {};
    for (let i = 1; i <= lenA; i++) {
      let db = 0;
      for (let j = 1; j <= lenB; j++) {
        const charA = a[i - 1];
        const charB = b[j - 1];
        const i1 = lastCharPos[charB] || 0;
        const j1 = db;
        let cost = 0;
        if (charA === charB) {
          db = j;
        } else {
          cost = 1;
        }
        matrix[i + 1][j + 1] = Math.min(
          matrix[i][j + 1] + 1,
          matrix[i + 1][j] + 1,
          matrix[i][j] + cost,
          matrix[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1)
        );
      }
      lastCharPos[a[i - 1]] = i;
    }
    return matrix[lenA + 1][lenB + 1];
  }

  const stride = lenB + 2;
  const maxDist = lenA + lenB;
  STATIC_MATRIX[0] = maxDist;

  for (let i = 0; i <= lenA; i++) {
    STATIC_MATRIX[(i + 1) * stride + 0] = maxDist;
    STATIC_MATRIX[(i + 1) * stride + 1] = i;
  }
  for (let j = 0; j <= lenB; j++) {
    STATIC_MATRIX[0 * stride + (j + 1)] = maxDist;
    STATIC_MATRIX[1 * stride + (j + 1)] = j;
  }

  const lastCharPos: Record<string, number> = {};

  for (let i = 1; i <= lenA; i++) {
    let db = 0;
    for (let j = 1; j <= lenB; j++) {
      const charA = a[i - 1];
      const charB = b[j - 1];
      const i1 = lastCharPos[charB] || 0;
      const j1 = db;
      let cost = 0;
      if (charA === charB) {
        db = j;
      } else {
        cost = 1;
      }

      const del = STATIC_MATRIX[i * stride + (j + 1)] + 1;
      const ins = STATIC_MATRIX[(i + 1) * stride + j] + 1;
      const sub = STATIC_MATRIX[i * stride + j] + cost;
      const trans = STATIC_MATRIX[i1 * stride + j1] + (i - i1 - 1) + 1 + (j - j1 - 1);

      let minVal = del;
      if (ins < minVal) minVal = ins;
      if (sub < minVal) minVal = sub;
      if (trans < minVal) minVal = trans;

      STATIC_MATRIX[(i + 1) * stride + (j + 1)] = minVal;
    }
    lastCharPos[a[i - 1]] = i;
  }

  return STATIC_MATRIX[(lenA + 1) * stride + (lenB + 1)];
}

/**
 * Calculates normalized string similarity (0.0 = completely different, 1.0 = identical).
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = damerauLevenshteinDistance(a, b);
  return Math.max(0, (maxLen - dist) / maxLen);
}

/**
 * Common medical symptom aliases & roots for offline fuzzy normalization.
 */
export const MEDICAL_CANONICAL_TERMS: Record<string, string[]> = {
  headache: ['headache', 'headeach', 'hedache', 'headake', 'head ache', 'head pain', 'sar dard', 'sar me dard', 'sir dard', 'sar ghoomna', 'سر درد', 'سر کا درد'],
  migraine: ['migraine', 'migrain', 'adhe sar ka dard', 'aadha sar dard', 'adhkapaari', 'half head pain', 'آدھے سر کا درد', 'مائیگرین'],
  toothache: ['toothache', 'tootheach', 'tooth ache', 'tooth pain', 'teeth pain', 'teeth ache', 'dant dard', 'daant dard', 'dant me dard', 'دانت درد', 'دانت کا درد'],
  gingivitis: ['gingivitis', 'masoorhay', 'gums bleeding', 'bleeding gums', 'masoorhay sujan', 'masoro se khoon', 'gum disease', 'مسوڑھوں سے خون', 'مسوڑھے'],
  backache: ['backache', 'back ache', 'back pain', 'backpain', 'kamar dard', 'kamar me dard', 'spine pain', 'lower back pain', 'pathon ka dard', 'کمر درد', 'کمر میں درد'],
  stomachache: ['stomachache', 'stomach ache', 'stomach pain', 'belly pain', 'abdominal pain', 'pet dard', 'pet me dard', 'pait dard', 'cramps', 'پیٹ درد', 'پیٹ میں درد'],
  'peptic-ulcer': ['peptic ulcer', 'stomach ulcer', 'meday ka ulcer', 'pait ka ulcer', 'pet me chhale', 'ulcer', 'gastric ulcer', 'معدے کا السر', 'معدہ السر'],
  ibs: ['ibs', 'irritable bowel', 'pait maror', 'antriyon ka masla', 'cramping bowel', 'pet me ainthun', 'آنتوں کی سوزش', 'پیٹ مروڑ'],
  hemorrhoids: ['hemorrhoids', 'piles', 'piles problem', 'bleeding piles', 'piles bleeding', 'bawaseer', 'bawaser', 'bawasir', 'bawasir bleeding', 'bawaseer bleeding', 'bawaser bleeding', 'bawaseer ka masla', 'bawaseer ka khoon', 'bawasir ka khoon', 'bawaser ka ilaj', 'hemoroids', 'rectal bleeding', 'khooni bawaseer', 'badi bawaseer', 'masay', 'pakhane me khoon', 'بواسیر', 'خونی بواسیر', 'بادی بواسیر'],
  gallstones: ['gallstones', 'gallstone', 'cholecystitis', 'pitte ki pathri', 'pitta pathri', 'pitte me pathri', 'pitte ki pathri ka dard', 'pitte ki pathri dard', 'pitta pathri ka dard', 'gall bladder stone', 'gall bladder pain', 'pit ki pathri', 'پتے کی پتھری', 'پتہ پتھری'],
  'kidney-stones': ['kidney stones', 'kidney stone', 'renal stone', 'gurde ki pathri', 'gurde me pathri', 'gurdy me pathri', 'gurde me pathri hai', 'pathri ka dard', 'gurde me pathri aur shadeed dard', 'renal colic', 'flank pain', 'peshab me pathri', 'گردے کی پتھری', 'گردے میں پتھری'],
  sinusitis: ['sinusitis', 'sinus', 'sinus infection', 'sinus pain', 'sinus dard', 'peshani me dard', 'naak band', 'sinusitis infection', 'sinus dard peshani', 'سائنس', 'سائنس کا درد', 'پیشانی کا درد'],
  'allergic-rhinitis': ['allergic rhinitis', 'dust allergy', 'cheenk', 'cheenkay', 'cheenkain', 'seasonal allergy', 'pollen allergy', 'naak behna', 'nazla allergy', 'چھینکیں', 'گرد کی الرجی', 'الرجی'],
  tonsillitis: ['tonsillitis', 'tonsils', 'galay ke tonsils', 'tonsil', 'gale ke gland', 'galay me sujan', 'tonsil infection', 'ٹانسلز', 'گلے کے ٹانسلز'],
  nosebleed: ['nosebleed', 'nose bleed', 'epistaxis', 'nakseer', 'naak se khoon', 'nakseer phootna', 'نکسیر', 'ناک سے خون'],
  bronchitis: ['bronchitis', 'chest cold', 'balghami khansi', 'seenay me jakdan', 'acute bronchitis', 'بلغم والی کھانسی', 'برونکائٹس'],
  fever: ['fever', 'feever', 'faver', 'high temp', 'temperature', 'bukhar', 'bukhaar', 'bukaar', 'tez bukhar', 'hararat', 'jism garam', 'بخار', 'تیز بخار'],
  diarrhea: ['diarrhea', 'diarrhoea', 'diaria', 'diarhea', 'loose motions', 'loose motion', 'dast', 'patle dast', 'dast lag gaye', 'motions', 'دست', 'پتلے دست'],
  cholera: ['cholera', 'haiza', 'rice water stool', 'shadeed dast', 'extreme dehydration', 'ہیضہ', 'شدید ہیضہ'],
  vomiting: ['vomiting', 'vomting', 'vomitting', 'puking', 'throwing up', 'nausea', 'matli', 'ulti', 'qay', 'ulti aana', 'الٹی', 'متلی', 'قے'],
  dengue: ['dengue', 'denguey', 'dengi', 'dengu', 'dengue fever', 'haddiyon ka bukhar', 'platelets', 'ڈینگی', 'ڈینگی بخار'],
  malaria: ['malaria', 'maleria', 'maliria', 'thandi lag ke bukhar', 'chills', 'sardi bukhar', 'ملیریا', 'ملیریا بخار'],
  typhoid: ['typhoid', 'tifoid', 'tiphoid', 'moti jhara', 'typhoid fever', 'meadi bukhar', 'ٹائیفائیڈ', 'میعادی بخار'],
  pneumonia: ['pneumonia', 'pheumonia', 'pneumoniya', 'namonia', 'nimonia', 'chest congestion', 'seena jakadna', 'نمونیا', 'سینہ جکڑنا'],
  asthma: ['asthma', 'asthama', 'asmatic', 'dama', 'damah', 'saans phoolna', 'wheezing', 'seeti ki aawaz', 'دمہ', 'سانس کا پھولنا'],
  hypertension: ['hypertension', 'hyper tension', 'hyptension', 'high bp', 'blood pressure', 'bp high', 'ہائی بلڈ پریشر', 'بلڈ پریشر'],
  hypoglycemia: ['hypoglycemia', 'hypoglycaemia', 'low sugar', 'sugar drop', 'sugar girna', 'sugar kam', 'shugar kam', 'شوگر گرنا', 'شوگر کم'],
  diabetes: ['diabetes', 'shugar', 'sugar', 'diabetic', 'ziyabetus', 'sugar ki bimari', 'ذیابیطس', 'شوگر'],
  hyperlipidemia: ['hyperlipidemia', 'cholesterol', 'high cholesterol', 'chiknai', 'charbi', 'triglycerides', 'lipid profile', 'khoon me chiknai', 'کولیسٹرول', 'خون میں چکنائی'],
  cholesterol: ['cholesterol', 'high cholesterol', 'chiknai', 'charbi', 'triglycerides', 'lipid profile', 'کولیسٹرول'],
  gout: ['gout', 'uric acid', 'high uric acid', 'naqras', 'angoothay ka dard', 'joron me uric acid', 'joint swelling', 'یورک ایسڈ', 'نقرس'],
  'fatty-liver': ['fatty liver', 'jigar par charbi', 'jigar ki charbi', 'liver fat', 'فیٹی لیور', 'جگر پر چربی'],
  angina: ['angina', 'angina pectoris', 'heart pain', 'dil ki sharyan', 'dil ka dora', 'coronary artery', 'انجائنا', 'دل کی تکلیف'],
  chestpain: ['chest pain', 'chest heaviness', 'chest tightness', 'chest pressure', 'seene me dard', 'seene ka dard', 'dil ka dard', 'سینے میں درد', 'سینے پر بوجھ'],
  breathlessness: ['shortness of breath', 'cant breathe', 'difficulty breathing', 'saans lene me mushkil', 'saans phoolna', 'dam ghutna', 'سانس میں تکلیف', 'دم گھٹنا'],
  stroke: ['stroke', 'paralysis', 'facial drooping', 'falij', 'faalij', 'laqwa', 'aadha jism sunn', 'فالج', 'لقوہ'],
  vertigo: ['vertigo', 'dizziness', 'chakkar', 'chakkar aana', 'sar ghoomna', 'balance loss', 'lightheadedness', 'چکر', 'چکر آنا', 'سر گھومنا'],
  insomnia: ['insomnia', 'sleeplessness', 'neend na aana', 'neend ki kami', 'sleep trouble', 'بے خوابی', 'نیند نہ آنا'],
  'panic-attack': ['panic attack', 'anxiety attack', 'ghabrahat', 'bechaini', 'dil ghabrana', 'dil ki dharkan tez', 'palpitations', 'گھبراہٹ', 'بے چینی', 'دل کی دھڑکن'],
  jaundice: ['jaundice', 'yarqan', 'yerqan', 'yerqan ka bukhar', 'yarqan ka bukhar', 'yerqan bukhar', 'yarqan bukhar', 'peeliya', 'peelia', 'peeli aankhein', 'yellow eyes', 'jaundice fever', 'یرقان', 'پیلا یرقان'],
  chickenpox: ['chickenpox', 'chicken pox', 'lakra kakra', 'choti mata', 'cheechak', 'water blisters', 'چیچک', 'لکڑا کاکڑا'],
  rabies: ['rabies', 'kutte ka katna', 'bawla kutta', 'dog bite rabies', 'hydrophobia', 'anti rabies', 'ریبیز', 'باؤلا کتا'],
  anemia: ['anemia', 'khoon ki kami', 'iron deficiency', 'anemic', 'hemoglobin kam', 'peela rang', 'خون کی کمی', 'اینیمیا'],
  osteoarthritis: ['osteoarthritis', 'arthritis', 'joron ka dard', 'joint pain', 'جوڑوں کا درد'],
  'neck-pain': ['neck pain', 'neck strain', 'gardan me dard', 'gardan ka dard', 'gardan ka khichao', 'cervical pain', 'گردن میں درد', 'گردن کا درد', 'گردن کا کھنچاؤ'],
  sprain: ['sprain', 'muscle strain', 'moch', 'moch aana', 'twisted ankle', 'ligament injury', 'موچ', 'موچ آنا'],
  fracture: ['fracture', 'broken bone', 'haddi tootna', 'broken leg', 'broken arm', 'ہڈی ٹوٹنا', 'فریکچر'],
  burn: ['burn', 'burns', 'burnt', 'scalding', 'jala', 'jalan', 'aag se jalna', 'garam pani girna', 'جلنا', 'آگ سے جلنا'],
  bleeding: ['bleeding', 'heavy bleeding', 'khoon behna', 'khoon nikalna', 'خون بہنا', 'شدید خون'],
  poisoning: ['poison', 'poisoning', 'zeher', 'zeher peena', 'dawa zyada kha li', 'overdose', 'زہر', 'زہر خورانی'],
  snakebite: ['snakebite', 'snake bite', 'saanp ka katna', 'dasan', 'saanp', 'سانپ کا کاٹنا', 'سانپ کا زہر'],
  'electric-shock': ['electric shock', 'bijli ka current', 'bijli lagna', 'current lagna', 'electrical burn', 'بجلی کا کرنٹ', 'کرنٹ لگنا'],
  heatstroke: ['heatstroke', 'heat stroke', 'loo lagna', 'loo lag gayi', 'shadeed garmi bukhar', 'sunstroke', 'loo', 'لو لگنا', 'شدید لو'],
  'eye-injury': ['eye injury', 'chemical splash in eye', 'aankh me tezaab', 'aankh par chot', 'aankh me kuch girna', 'آنکھ میں چوٹ', 'آنکھ میں کیمیکل'],
  eczema: ['eczema', 'chambal', 'atopic dermatitis', 'dry skin itch', 'chambal ki bimari', 'eczima', 'چمبل', 'چھمبل'],
  'fungal-infection': ['fungal infection', 'ringworm', 'daad', 'chambal daad', 'dhobi itch', 'fungus', 'skin fungus', 'داد', 'فنگس'],
  acne: ['acne', 'pimples', 'keel muhasay', 'chehre ke danay', 'chehre par dane', 'pimple', 'کیل مہاسے', 'چہرے کے دانے'],
  gerd: ['acidity', 'acid reflux', 'heartburn', 'seene ki jalan', 'khatti dakar', 'tezaabiyat', 'gerd', 'تیزابیت', 'سینے کی جلن'],
  constipation: ['constipation', 'constipated', 'qabz', 'qabaz', 'pet saaf na hona', 'hard stool', 'قبض', 'شدید قبض'],
  earache: ['earache', 'ear pain', 'ear infection', 'kaan dard', 'kaan me dard', 'kaan behna', 'کان کا درد', 'کان میں درد'],
  uti: ['uti', 'urinary infection', 'burning urination', 'peshab me jalan', 'peshab bar bar aana', 'پیشاب میں جلن', 'یو ٹی آئی'],
  prostate: ['prostate', 'bph', 'gadood', 'peshab me rukawat', 'peshab ruk ruk kar', 'enlarged prostate', 'پروسٹیٹ', 'غدود'],
  allergy: ['allergy', 'allergic', 'hives', 'urticaria', 'pitti', 'kharish', 'danay', 'الرجی', 'پتی', 'چھپاکی'],
  'mouth-ulcers': ['mouth ulcers', 'mouth ulcer', 'canker sore', 'munh ke chhale', 'munh me chhale', 'munh pakna', 'zaban par chhale', 'muh ke chhale', 'chhale', 'منہ کے چھالے', 'چھالے'],
  postpartum: ['postpartum', 'wiladat ke baad', 'zichgi', 'delivery ke baad', 'lochia', 'after birth care', 'postnatal', 'ولادت کے بعد', 'زچگی'],
  'infant-colic': ['infant colic', 'baby colic', 'bachay ke pet me dard', 'chhotay bachay ke pet me dard', 'bacha bohot rota hai', 'infant gas', 'colic', 'بچے کے پیٹ میں درد', 'کولک'],
  'diaper-rash': ['diaper rash', 'nappy rash', 'diaper ke danay', 'potray ke rash', 'baby rash', 'diaper ke dane', 'ڈائپر ریش', 'ڈائپر کے دانے'],
  'heart-failure': ['heart failure', 'congestive heart failure', 'chf', 'dil ki kamzori', 'dil ka barhna', 'sujan pairon me', 'paon me sujan', 'دل کی کمزوری', 'ہارٹ فیلئیر'],
  arrhythmia: ['arrhythmia', 'palpitations', 'dil ki dharkan tez', 'irregular heartbeat', 'fluttering heart', 'dil ki be tarteebi', 'دل کی دھڑکن', 'دل کی بے ترتیبی'],
  dvt: ['dvt', 'deep vein thrombosis', 'leg blood clot', 'pindli me sujan', 'taang me sujan', 'calf swelling', 'khoon ka lothra', 'پنڈلی میں سوجن', 'ڈی وی ٹی'],
  copd: ['copd', 'chronic bronchitis', 'emphysema', 'purani khansi', 'purani saans ki bimari', 'huqqa khansi', 'سی او پی ڈی', 'پھیپھڑوں کی بیماری'],
  'pleural-pain': ['pleural pain', 'pleurisy', 'saans lene par dard', 'seene me chubhata dard', 'stabbing chest pain', 'پھیپھڑوں کا درد', 'پلوریسی'],
  'food-poisoning': ['food poisoning', 'kharab khana', 'baasi khana', 'food contamination', 'qay aur dast', 'فوڈ پوائزننگ', 'خراب کھانا'],
  celiac: ['celiac', 'celiac disease', 'gluten allergy', 'gandam se allergy', 'wheat allergy', 'گندم سے الرجی', 'سیلیک'],
  'bells-palsy': ['bells palsy', 'bell palsy', 'laqwa', 'facial palsy', 'chehre ka falij', 'facial drooping', 'لقوہ', 'چہرے کا فالج'],
  neuropathy: ['neuropathy', 'peripheral neuropathy', 'paon me jalan', 'haath paon sunn', 'diabetic neuropathy', 'پاؤں میں جلن', 'ہاتھ پاؤں سن', 'نیوروپیتھی'],
  concussion: ['concussion', 'sar par chot', 'head bump', 'sar ka jhatka', 'mild tbi', 'سر پر چوٹ', 'کنکشن'],
  tetanus: ['tetanus', 'lockjaw', 'dhanakbaad', 'zang aalood chot', 'tashannuj', 'تشنج', 'دھنک باد', 'ٹٹنس'],
  leishmaniasis: ['leishmaniasis', 'sal dana', 'kal dana', 'sandfly bite', 'kaal azar', 'سال دانہ', 'لیشمینیاسس'],
  polio: ['polio', 'poliomyelitis', 'polio drops', 'polio ke qatray', 'falij bacha', 'پولیو', 'پولیو کے قطرے'],
  'rheumatoid-arthritis': ['rheumatoid arthritis', 'gathiya', 'gathia', 'joron ki sozish', 'morning stiffness', 'گٹھیا', 'جوڑوں کی سوزش'],
  'frozen-shoulder': ['frozen shoulder', 'kandha jam hona', 'kandhay ka dard', 'adhesive capsulitis', 'کندھے کا جام ہونا', 'فروزن شولڈر'],
  'carpal-tunnel': ['carpal tunnel', 'carpal tunnel syndrome', 'kalaai me dard', 'haath sunn hona', 'median nerve', 'کلائی میں درد', 'کارپل ٹنل'],
  psoriasis: ['psoriasis', 'silvery scales', 'chandi jaise chhilkay', 'چنبل', 'پسوریاسس'],
  melasma: ['melasma', 'jhainiyan', 'chhayian', 'chloasma', 'dark facial spots', 'chehre ke daagh', 'جھائیاں', 'چھائیاں', 'میلازما'],
  cellulitis: ['cellulitis', 'spreading redness', 'jild ka infection', 'hot swollen leg', 'سرخ جلد', 'سیلولائٹس'],
  warts: ['warts', 'wart', 'masse', 'mohkay', 'verruca', 'مسے', 'موہکے'],
  ckd: ['ckd', 'chronic kidney disease', 'gurday ki bimari', 'creatinine', 'renal failure', 'گردے کی بیماری', 'سی کے ڈی'],
  hematuria: ['hematuria', 'blood in urine', 'peshab me khoon', 'red urine', 'پیشاب میں خون', 'ہیمیچوریا'],
  hydrocele: ['hydrocele', 'fauton me sujan', 'scrotal swelling', 'fauton me paani', 'فوطوں میں سوجن', 'ہائیڈروسیل'],
  'morning-sickness': ['morning sickness', 'hamal me ulti', 'pregnancy nausea', 'hyperemesis', 'حمل میں الٹی', 'مارننگ سکنس'],
  preeclampsia: ['preeclampsia', 'hamal me bp', 'high bp pregnancy', 'pregnancy preeclampsia', 'پری ایکلیمپسیا', 'حمل میں بی پی'],
  'gestational-diabetes': ['gestational diabetes', 'hamal ki sugar', 'gdm', 'pregnancy diabetes', 'حمل کی شوگر'],
  'ectopic-pregnancy': ['ectopic pregnancy', 'tube pregnancy', 'hamal nali me', 'ٹیوب پریگنینسی', 'حمل کا نالی میں ٹھہرنا'],
  'postpartum-hemorrhage': ['postpartum hemorrhage', 'pph', 'zichgi me khoon', 'delivery bleeding', 'ولادت کے بعد خون', 'پی پی ایچ'],
  'period-pain': ['dysmenorrhea', 'period pain', 'haiz ka dard', 'menstrual cramps', 'mahwari dard', 'حیض کا درد', 'ماہواری کا درد'],
  pcos: ['pcos', 'polycystic ovary', 'pcod', 'irregular periods', 'facial hair women', 'mahwari ki be tarteebi', 'پی سی او ایس', 'پولی سسٹک'],
  'vaginal-candidiasis': ['vaginal candidiasis', 'yeast infection', 'safeed paani', 'vaginal thrush', 'vaginal itching', 'سفید پانی', 'یسٹ انفیکشن'],
  endometriosis: ['endometriosis', 'chronic pelvic pain', 'chocolate cyst', 'اینڈومیٹریوسس', 'پیٹ کا شدید درد'],
  menopause: ['menopause', 'hot flashes', 'mahwari band hona', 'perimenopause', 'سن یاس', 'مینوپاز'],
  'neonatal-jaundice': ['neonatal jaundice', 'newborn jaundice', 'nawzaida peelia', 'nawzaida bachay ka peelia', 'bache ko peelia', 'نوزائیدہ کا پیلیا', 'بچے کا یرقان'],
  croup: ['croup', 'barking cough', 'stridor', 'kuttay jaisi khansi', 'کروپ', 'کتے جیسی کھانسی'],
  'febrile-seizures': ['febrile seizures', 'febrile seizure', 'bukhar ke jhatkay', 'bukhar ke doray', 'jhatkay bacha', 'بخار کے جھٹکے', 'دورے'],
  rickets: ['rickets', 'bowed legs', 'haddiyon ka teerha pan', 'ریکٹس', 'ہڈیوں کا ٹیڑھا پن'],
  malnutrition: ['malnutrition', 'child wasting', 'sukha pan', 'stunting', 'غذائی قلت', 'سوکھا پن'],
  hyperglycemia: ['hyperglycemia', 'high blood sugar', 'dka', 'ketoacidosis', 'شوگر کی زیادتی', 'ڈی کے اے'],
  hypothyroidism: ['hypothyroidism', 'underactive thyroid', 'thyroid ki susti', 'تھائی رائیڈ کی سستی', 'ہائپو تھائرائڈزم'],
  hyperthyroidism: ['hyperthyroidism', 'overactive thyroid', 'thyroid ki tezi', 'تھائی رائیڈ کی تیزی', 'ہائپر تھائرائڈزم'],
  'vitamin-d': ['vitamin d', 'vitamin d deficiency', 'vitamin d ki kami', 'haddiyon me dard', 'وٹامن ڈی کی کمی'],
  'metabolic-syndrome': ['metabolic syndrome', 'abdominal obesity', 'pait ki charbi', 'میٹابولک سنڈروم'],
  stye: ['stye', 'chalazion', 'anjanari', 'guhanjani', 'aankh ki phinsi', 'گہانجنی', 'آنکھ کی پھنسی'],
  cataract: ['cataract', 'cataracts', 'safaid motia', 'motia', 'motiya', 'cloudy vision', 'blurry vision', 'سفید موتیا', 'موتیا'],
  glaucoma: ['glaucoma', 'kaala motia', 'acute glaucoma', 'eye pressure', 'کالا موتیا'],
  'dry-eye': ['dry eye', 'dry eye syndrome', 'aankhon ki khushki', 'آنکھوں کی خشکی'],
  tinnitus: ['tinnitus', 'ringing ears', 'kaan me aawaz', 'kaan me ghanti', 'کان میں گھنٹیاں', 'ٹنئیٹس'],
  'foreign-body': ['foreign body', 'foreign object in ear', 'object in nose', 'kaan me cheez', 'naak me cheez', 'ناک میں چیز', 'کان میں چیز'],
  'dental-abscess': ['dental abscess', 'tooth abscess', 'dant me peep', 'periapical abscess', 'دانت کا پھوڑا', 'دانت میں پیپ'],
  'dental-trauma': ['knocked out tooth', 'dental trauma', 'dant tootna', 'avulsed tooth', 'ٹوٹا ہوا دانت'],
  'oral-thrush': ['oral thrush', 'thrush', 'munh me phaphoondi', 'white tongue', 'منہ میں پھپھوندی'],
  thalassemia: ['thalassemia', 'thalassemia trait', 'thalassemia major', 'thalasemia', 'blood transfusion', 'تھیلیسیمیا'],
  bruising: ['bleeding disorder', 'easy bruising', 'neel parna', 'platelets', 'جسم پر نیل پڑنا'],
  'lymph-node': ['lymph node', 'swollen glands', 'gilti', 'swollen lymph nodes', 'گلٹیاں', 'گردن کی گلٹی'],
  gad: ['generalized anxiety', 'gad', 'chronic worry', 'musalsal fikar', 'مسلسل فکر'],
  depression: ['depression', 'major depression', 'shadeed udaasi', 'mayoosi', 'ڈپریشن', 'شدید اداسی'],
  'postpartum-depression': ['postpartum depression', 'ppd', 'zichgi depression', 'baby blues', 'زچگی کے بعد ڈپریشن'],
  anaphylaxis: ['anaphylaxis', 'severe allergy', 'jaan leva allergy', 'epipen', 'شدید الرجی'],
  'scorpion-sting': ['scorpion sting', 'bichhoo ka dang', 'bichhoo', 'scorpion bite', 'بچھو کا ڈنک', 'بچھو'],
  'pesticide-poisoning': ['pesticide poisoning', 'pesticide', 'keeray mar dawa', 'keeray mar dawai', 'organophosphate', 'کیڑے مار دوا کا زہر', 'کیڑے مار دوا', 'کیڑے مار دوا زہر'],
  'acid-ingestion': ['acid ingestion', 'tezaab peena', 'tezaab', 'caustic soda', 'تیزاب پینا', 'تیزاب'],
  'carbon-monoxide': ['carbon monoxide', 'geyser gas', 'geyser ka dhuwan', 'geyser dhuwan', 'koyle ka dhuwan', 'gas heater poisoning', 'coal stove', 'کاربن مونو آکسائیڈ', 'گیس ہیٹر', 'گیزر کا دھواں', 'کوئلے کا دھواں'],
  'falls-elderly': ['falls in elderly', 'bazurgon me girna', 'elderly fall', 'elderly falls', 'gir jana', 'fell down', 'fall down', 'gir gaya', 'gir gaye', 'بزرگوں میں گرنا'],
  dementia: ['dementia', 'alzheimers', 'yaaddasht ki kami', 'bhoolne ki bimari', 'ڈیمینشیا', 'بھولنے کی بیماری'],
  'bed-sores': ['bed sores', 'bedsores', 'pressure ulcers', 'bistar ke zakham', 'bistar ke zakhm', 'bed sore', 'بستر کے زخم'],
  polypharmacy: ['polypharmacy', 'zyada dawaiyan', 'multiple medications', 'بزرگوں کی ادویات'],
  osteoporosis: ['osteoporosis', 'haddiyon ki kamzori', 'bhurbhurapan', 'bone thinning', 'ہڈیوں کی کمزوری'],
  tuberculosis: ['tuberculosis', 'tb', 't.b', 't b', 'tap e diq', 'tape diq', 'tap-e-diq', 'purani balgham khansi', 'ٹی بی', 'تپ دق', 'خون والی کھانسی'],
  epilepsy: ['epilepsy', 'seizure', 'seizures', 'fits', 'mirgi', 'mirgi ke doray', 'jhatkay', 'dora', 'مرگی', 'مرگی کے دورے', 'دورے'],
  measles: ['measles', 'khasra', 'khasrah', 'red spots rash', 'measels', 'خسرہ'],
  conjunctivitis: ['conjunctivitis', 'pink eye', 'eye flu', 'aankh aana', 'aankh lali', 'red eye', 'red eyes', 'surkh aankhein', 'conjunctivitus', 'آنکھ آنا', 'آشوب چشم', 'سرخ آنکھ'],
  scabies: ['scabies', 'scabies rash', 'khujli', 'raat ki kharish', 'scabies infection', 'خارش', 'اسکبیز', 'کھجلی'],
  'cervical-spondylosis': ['cervical spondylosis', 'cervical pain', 'gardan ka khichao', 'neck strain', 'neck spondylosis', 'گردن کا کھنچاؤ', 'سروائیکل'],
  'knee-oa': ['knee oa', 'knee osteoarthritis', 'ghutno ka dard', 'ghutne dard', 'ghutnay ka dard', 'knee pain', 'knee arthritis', 'گھٹنوں کا درد', 'نی اوسٹیوآرتھرائٹس'],
  'antenatal-care': ['antenatal care', 'anc schedule', 'anc', 'pregnancy checkup', 'hamal ke checkup', 'prenatal care', 'دوران حمل معائنہ', 'حمل کا معائنہ'],
  'anemia-women': ['anemia in women', 'khawateen me khoon ki kami', 'pregnancy anemia', 'خواتین میں خون کی کمی', 'عورتوں میں خون کی کمی'],
  'epi-schedule': ['epi schedule', 'vaccination chart', 'vaccination schedule', 'bachon ke teekay', 'hifazati teekay', 'حفاظتی ٹیکے', 'ویکسینیشن چارٹ'],
  'otitis-media': ['otitis media', 'middle ear infection', 'kaan ka infection', 'kaan behna', 'ear discharge', 'peep', 'کان کا انفیکشن'],
  choking: ['choking', 'choke', 'heimlich', 'gale me phansna', 'dam ghutna', 'گلے میں پھنسنا', 'چوکنگ'],
  cpr: ['cpr', 'chest compressions', 'cardiopulmonary resuscitation', 'dil ki pumping', 'artificial respiration', 'مصنوعی سانس', 'سی پی آر'],
};

interface CompiledAlias {
  canonical: string;
  alias: string;
  aliasNorm: string;
  isMultiWord: boolean;
  tokens: string[];
  regex: RegExp;
  length: number;
}

// Pre-compile alias regexes and index structures at load time for sub-1ms execution
const EXACT_ALIAS_MAP = new Map<string, { canonical: string; matchedAlias: string }>();
const COMPILED_ALIASES: CompiledAlias[] = [];

for (const [canonical, aliases] of Object.entries(MEDICAL_CANONICAL_TERMS)) {
  for (const alias of aliases) {
    const aliasNorm = alias.toLowerCase().trim();
    if (!aliasNorm) continue;

    if (!EXACT_ALIAS_MAP.has(aliasNorm)) {
      EXACT_ALIAS_MAP.set(aliasNorm, { canonical, matchedAlias: alias });
    }

    const escaped = aliasNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-z0-9\\u0600-\\u06FF])${escaped}(?:$|[^a-z0-9\\u0600-\\u06FF])`, 'i');
    const tokens = aliasNorm.split(/\s+/).filter(Boolean);

    COMPILED_ALIASES.push({
      canonical,
      alias,
      aliasNorm,
      isMultiWord: tokens.length > 1,
      tokens,
      regex,
      length: aliasNorm.length,
    });
  }
}

// Sort compiled aliases by length descending (longest phrase match takes precedence)
COMPILED_ALIASES.sort((a, b) => b.length - a.length);

/**
 * Fuzzy matches user tokens against canonical medical terms.
 * Prioritizes longest matching whole phrases to avoid short-alias substring collisions.
 */
export function fuzzyFindMedicalConcept(
  input: string,
  minSimilarity = 0.72
): { canonical: string; matchedAlias: string; similarity: number } | null {
  const normInput = input.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ').trim();
  if (!normInput) return null;

  // 1. Direct O(1) exact hash match
  const exactHit = EXACT_ALIAS_MAP.get(normInput);
  if (exactHit) {
    return { canonical: exactHit.canonical, matchedAlias: exactHit.matchedAlias, similarity: 1.0 };
  }

  const inputWords = normInput.split(/\s+/).filter(Boolean);
  if (inputWords.length === 0) return null;

  let bestExactMatch: { canonical: string; matchedAlias: string; similarity: number; length: number } | null = null;
  let bestFuzzyMatch: { canonical: string; matchedAlias: string; similarity: number; length: number } | null = null;

  // 2. Pre-compiled whole-phrase matching (longest phrase first)
  for (let i = 0; i < COMPILED_ALIASES.length; i++) {
    const item = COMPILED_ALIASES[i];

    if (item.regex.test(normInput)) {
      if (!bestExactMatch || item.length > bestExactMatch.length) {
        bestExactMatch = { canonical: item.canonical, matchedAlias: item.alias, similarity: 1.0, length: item.length };
        // If exact match is long (>= 6 chars), short-circuit immediately
        if (item.length >= 6) {
          return { canonical: item.canonical, matchedAlias: item.alias, similarity: 1.0 };
        }
      }
    }
  }

  if (bestExactMatch) {
    return { canonical: bestExactMatch.canonical, matchedAlias: bestExactMatch.matchedAlias, similarity: bestExactMatch.similarity };
  }

  // 3. Fuzzy match across tokens
  for (let i = 0; i < COMPILED_ALIASES.length; i++) {
    const item = COMPILED_ALIASES[i];

    if (item.isMultiWord) {
      let tokenMatchCount = 0;
      for (const aToken of item.tokens) {
        for (const iWord of inputWords) {
          if (stringSimilarity(iWord, aToken) >= minSimilarity) {
            tokenMatchCount++;
            break;
          }
        }
      }
      const phraseScore = tokenMatchCount / item.tokens.length;
      if (phraseScore >= 0.8) {
        if (
          !bestFuzzyMatch ||
          phraseScore > bestFuzzyMatch.similarity ||
          (phraseScore === bestFuzzyMatch.similarity && item.length > bestFuzzyMatch.length)
        ) {
          bestFuzzyMatch = { canonical: item.canonical, matchedAlias: item.alias, similarity: phraseScore, length: item.length };
        }
      }
    } else {
      for (const iWord of inputWords) {
        if (Math.abs(iWord.length - item.length) > 3) continue;
        const sim = stringSimilarity(iWord, item.aliasNorm);
        if (sim >= minSimilarity) {
          if (
            !bestFuzzyMatch ||
            sim > bestFuzzyMatch.similarity ||
            (sim === bestFuzzyMatch.similarity && item.length > bestFuzzyMatch.length)
          ) {
            bestFuzzyMatch = { canonical: item.canonical, matchedAlias: item.alias, similarity: sim, length: item.length };
          }
        }
      }
    }
  }

  if (bestFuzzyMatch) {
    return { canonical: bestFuzzyMatch.canonical, matchedAlias: bestFuzzyMatch.matchedAlias, similarity: bestFuzzyMatch.similarity };
  }

  return null;
}
