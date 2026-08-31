import type { RedFlagPattern, ModifierTerm } from '@/lib/types';

// ============================================================
// SehatAI — Red-flag lexicon (single source of truth)
// Consumed by BOTH the server pipeline (L0) and the client
// offline engine. Never duplicated. Drift caught by eval suite.
//
// Matching semantics:
//   A pattern fires when EVERY group has at least one term
//   present in the normalized input text (case-insensitive,
//   diacritics stripped). Single-group patterns are simple
//   keyword matches with terms chosen to be inherently severe.
//
// Sources: WHO emergency signs, UNICEF/WHO child danger signs,
// WHO maternal danger signs, FAST stroke criteria.
// ============================================================

export const RED_FLAG_PATTERNS: RedFlagPattern[] = [
  {
    id: 'chest_pain_dyspnea',
    category: 'cardiac',
    groups: [
      {
        terms: [
          'chest pain', 'pain in my chest', 'chest is hurting', 'pressure in my chest', 'seene mein dard', 'seene me dard', 'seenay mein dard', 'seene ka dard', 'سینے میں درد', 'سینے میں تکلیف', 'سینے کا درد',
        ],
      },
      {
        terms: [
          'difficulty breathing', 'shortness of breath', 'cant breathe', "can't breathe", 'trouble breathing', 'breathless', 'saans lene mein mushkil', 'saans lene mein takleef', 'saans nahi aa rahi', 'saans nhi aa rahi', 'saans nahi aa rhi', 'saans nahi arahi', 'sanse nahi aa rahi', 'saans phool rahi hai', 'saans phool rhi', 'saans ki takleef', 'سانس لینے میں مشکل', 'سانس لینے میں تکلیف', 'سانس نہیں آ رہی', 'سانس پھول رہی ہے',
        ],
      },
    ],
    terms_en: ['chest pain', 'difficulty breathing'],
    terms_ur: ['سینے میں درد', 'سانس لینے میں مشکل'],
    terms_roman: ['seene mein dard', 'saans lene mein mushkil'],
    reason_template: {
      en: 'Chest pain together with breathing difficulty matches WHO emergency warning signs for a possible heart or lung emergency.',
      ur: 'سینے کا درد اور سانس لینے میں مشکل مل کر عالمی ادارہ صحت کے ایمرجنسی علامات سے ملتے ہیں — یہ دل یا پھیپھڑوں کی ایمرجنسی ہو سکتی ہے۔',
      roman: 'Seene ka dard aur saans lene mein mushkil milkar WHO ke emergency warning signs se milti hain — yeh dil ya phaingron ki emergency ho sakti hai.',
    },
    sources: ['WHO — Cardiovascular diseases: warning signs', 'WHO EMRO — Emergency care'],
  },
  {
    id: 'stroke_fast',
    category: 'stroke',
    groups: [
      {
        terms: [
          'face droop', 'face is drooping', 'face looks twisted', 'face feels weird', 'face feels weird on one side', 'face feels strange', 'face feels strange on one side', 'face looks uneven', 'face looks lopsided', 'smile looks crooked', 'crooked smile', 'smile is crooked', 'smile is uneven', 'one side of my face feels weird', 'one side of face feels weird', 'chehra teda ho gaya', 'chehra jhuk raha', 'munh tedha', 'چہرہ ٹیڑھا', 'چہرہ جھک رہا', 'منہ ٹیڑھا', 'arm weakness', 'arm went numb', 'arm is weak', 'arm suddenly became weak', 'arm went weak', 'arm feels heavy', 'arm feels heavy and weak', 'arm feels weird', 'arm feels strange', 'arm feels dead', 'cant feel my arm', 'cant feel my hand', 'cant feel one arm', 'leg suddenly became weak', 'leg went weak', 'leg feels heavy', 'leg feels weak', 'baazu kamzor', 'baazu sun ho gaya', 'haath kamzor ho gaya', 'haath achanak kamzor', 'haath sun ho gaya', 'haath bhari ho gaya', 'pair achanak kamzor', 'بازو کمزور', 'بازو سن ہو گیا', 'ہاتھ کمزور', 'ہاتھ سن ہو گیا', 'slurred speech', 'speech is slurred', 'cant speak properly', "can't speak", 'cannot speak', 'cannot speak properly', 'suddenly cannot speak', 'cannot understand speech', 'cannot understand', 'words coming out wrong', 'words are coming out wrong', 'words come out wrong', 'talking funny', 'speech is strange', 'speech sounds strange', 'cant get words out', 'words are slurred', 'bol nahi paa raha', 'bol nahi pa raha', 'bol nahi paa rahe', 'bol nahi pa rahe', 'bol nahi pa rahi', 'bol nahi paa rahi', 'bolne mein dikkat', 'bolna ajeeb ho gaya', 'بولنے میں مشکل', 'بول نہیں پا رہا', 'بول نہیں پا رہے', 'بول نہیں پا رہی', 'sudden severe headache', 'worst headache of my life', 'achanak bohot sakht sar dard', 'اچانک شدید سر درد', 'sudden numbness one side', 'aik taraf sun', 'one side of my body is numb', 'one side is numb', 'numb on one side', 'half of my body is numb', 'jism ka aik taraf sun', 'aik taraf jism sun', 'sudden weakness', 'suddenly became weak', 'weak on one side', 'side of my face is weak', 'one side of his face is weak', 'one side not working', 'one side is not working', 'one side stopped working', 'aik taraf kaam nahi', 'aik taraf kaam nahi kar raha', 'aik taraf kaam nahi kar rahi', 'side not working', 'not working on one side', 'one side isnt working', "one side isn't working", 'cant move one side', "can't move one side", 'cant move my arm', "can't move my arm", 'cant move my leg', "can't move my leg", 'half of body not working', 'chehre ka aik taraf kamzor', 'chehra achanak kamzor', 'aik taraf kamzori', 'aik taraf kaam', 'طرف کمزور', 'طرف کام نہیں', 'sudden vision loss', 'suddenly cannot see', 'suddenly lost my vision', 'cannot see suddenly', 'ایک طرف سن ہو گیا',
        ],
      },
    ],
    terms_en: ['face drooping', 'arm weakness', 'slurred speech', 'sudden severe headache'],
    terms_ur: ['چہرہ ٹیڑھا', 'بازو کمزور', 'بولنے میں مشکل', 'اچانک شدید سر درد'],
    terms_roman: ['chehra teda', 'baazu kamzor', 'bolne mein dikkat', 'achanak sakht sar dard'],
    reason_template: {
      en: 'Sudden face drooping, arm weakness, speech difficulty or a worst-ever headache are FAST stroke warning signs — this needs emergency care now.',
      ur: 'اچانک چہرہ ٹیڑھا ہونا، بازو کی کمزوری، بولنے میں مشکل یا زندگی کا شدید ترین سر درد — یہ فالج (اسٹروک) کی علامات ہیں، فوری ایمرجنسی ضروری ہے۔',
      roman: 'Achanak chehra tedha hona, baazu ki kamzori, bolne mein mushkil ya zindagi ka sab se sakht sar dard — yeh stroke (faalij) ki alamaat hain, fori emergency zaroori hai.',
    },
    sources: ['WHO — Stroke: key facts', 'FAST stroke criteria'],
  },
  {
    id: 'severe_bleeding',
    category: 'bleeding',
    groups: [
      {
        terms: [
          'heavy bleeding', 'severe bleeding', 'bleeding wont stop', "bleeding won't stop", 'bleeding will not stop', 'bleeding does not stop', 'bleeding a lot', 'bleeding heavily', 'blood is pouring', 'blood pouring', 'blood is spurting', 'blood spurting', 'spurting blood', 'spurting from the wound', 'losing a lot of blood', 'lots of blood', 'lot of blood', 'vomiting blood', 'vomiting up blood', 'coughing up blood', 'coughing blood', 'blood in vomit', 'nosebleed wont stop', "nosebleed won't stop", 'nosebleed will not stop', 'swallowed some medicine', 'swallowed my medicine', 'swallowed pills', 'swallowed tablets', 'dont know what pills', "don't know what pills", 'dont know what i swallowed', "don't know what i swallowed", 'pata nahi kya goli', 'bohot khoon beh raha', 'khoon nahi ruk raha', 'khoon beh kar nahi ruk raha', 'zyada khoon', 'khoon ki ulti', 'khoon ki qay', 'khansi mein khoon', 'nak se khoon nahi ruk', 'خون بہت زیادہ بہہ رہا', 'خون نہیں رک رہا', 'خون بہہ کر نہیں رک رہا', 'خون کی الٹی', 'خون کی قے',
        ],
      },
    ],
    terms_en: ['heavy bleeding', "bleeding won't stop"],
    terms_ur: ['خون نہیں رک رہا', 'خون بہت زیادہ'],
    terms_roman: ['bohot khoon beh raha', 'khoon nahi ruk raha'],
    reason_template: {
      en: 'Uncontrolled or heavy bleeding is a life-threatening emergency — immediate pressure and emergency care are needed.',
      ur: 'خون کا بےقابو یا بہت زیادہ بہنا جان لیوا ایمرجنسی ہے — فوری دباؤ اور ایمرجنسی علاج ضروری ہے۔',
      roman: 'Khoon ka be-qaboo ya bohot zyada behna jaan lewa emergency hai — fori dabao aur emergency ilaaj zaroori hai.',
    },
    sources: ['IFRC — First aid for severe bleeding'],
  },
  {
    id: 'unconscious',
    category: 'unconscious',
    groups: [
      {
        terms: [
          'unconscious', 'not waking up', 'wont wake up', "won't wake up", 'passed out', 'collapsed', 'no response', 'fainted', 'lost consciousness', 'became unconscious', 'behosh', 'hosh nahi aa raha', 'hosh nahi hai', 'gir kar behosh', 'behosh ho gaya', 'behosh ho gayi', 'بےہوش', 'بے ہوش', 'ہوش نہیں ہے', 'ہوش نہیں آ رہا', 'گر کر بےہوش', 'بےہوش ہو گیا', 'بےہوش ہو گئی',
        ],
      },
    ],
    terms_en: ['unconscious', "won't wake up", 'no response'],
    terms_ur: ['بےہوش', 'ہوش نہیں آ رہا'],
    terms_roman: ['behosh', 'hosh nahi aa raha'],
    reason_template: {
      en: 'Loss of consciousness or unresponsiveness is an emergency — the person needs immediate medical assessment.',
      ur: 'بےہوشی یا ہوش کا نہ آنا ایک ایمرجنسی ہے — مریض کو فوری طبی معائنہ درکار ہے۔',
      roman: 'Behoshi ya hosh ka na aana ek emergency hai — mareez ko fori tibbi muaina darkar hai.',
    },
    sources: ['WHO EMRO — Emergency care'],
  },
  {
    id: 'convulsions',
    category: 'convulsions',
    groups: [
      {
        terms: [
          'convulsion', 'convulsions', 'seizure', 'seizures', 'having fits', 'fit attack', 'dora parey', 'doray par rahe', 'dora padh raha', 'jhatke par rahe', 'mirgi ka dorah', 'دورہ', 'دورے پڑ رہے', 'جھٹکے پڑ رہے', 'مرگی کا دورہ',
        ],
      },
    ],
    terms_en: ['convulsions', 'seizure', 'fits'],
    terms_ur: ['دورے پڑ رہے', 'مرگی کا دورہ'],
    terms_roman: ['dora parey', 'jhatke par rahe'],
    reason_template: {
      en: 'A seizure or convulsion requires emergency evaluation, especially if it lasts more than 5 minutes or repeats.',
      ur: 'دورہ یا جھٹکوں کے لیے ایمرجنسی معائنہ ضروری ہے، خاص طور پر اگر پانچ منٹ سے زیادہ رہے یا بار بار آئے۔',
      roman: 'Dora ya jhatkon ke liye emergency muaina zaroori hai, khaas tor par agar paanch minute se zyada rahe ya baar baar aayein.',
    },
    sources: ['WHO — Epilepsy key facts', 'IFRC — First aid for seizures'],
  },
  {
    id: 'pregnancy_bleeding',
    category: 'obstetric-bleeding',
    groups: [
      {
        terms: [
          'khoon beh raha', 'khoon aa raha', 'bleeding', 'blood loss', 'spotting', 'خون بہہ رہا', 'خون آ رہا', 'khoon ja raha', 'khoon gir raha',
        ],
      },
      {
        terms: [
          'pregnant', 'pregnancy', 'hamal', 'hamela', 'hamail', 'mawjuda hamal', 'hamal ke doran', 'hamal hai', 'haamla', 'pregnancy mein', 'حاملہ', 'حمل', 'حمل ہے', 'حمل کے دوران', 'maa banne wali', 'ماں بننے والی',
        ],
      },
    ],
    terms_en: ['bleeding during pregnancy'],
    terms_ur: ['حمل میں خون بہنا'],
    terms_roman: ['hamal mein khoon behna'],
    reason_template: {
      en: 'Bleeding during pregnancy is a WHO maternal danger sign — go to a health facility immediately.',
      ur: 'حمل کے دوران خون کا آنا عالمی ادارہ صحت کے مطابق خطرے کی علامت ہے — فوری طور پر ہسپتال جائیں۔',
      roman: 'Hamal ke doran khoon ka aana WHO ke mutabiq khatre ki alamat hai — fori tor par hospital jayein.',
    },
    sources: ['WHO — Maternal danger signs', 'WHO — Pregnancy, childbirth guideline'],
  },
  {
    id: 'pregnancy_preeclampsia',
    category: 'obstetric-preeclampsia',
    groups: [
      {
        terms: [
          'pregnant', 'pregnancy', 'hamal', 'mawjuda hamal', 'hamal ke doran', 'hamal hai', 'pregnancy mein', 'حمل', 'حمل ہے', 'حمل کے دوران',
        ],
      },
      {
        terms: [
          'severe headache', 'worst headache', 'blurred vision', 'blurry vision', 'vision is blurry', 'swollen face', 'swollen hands', 'face is swollen', 'hands are swollen', 'bohot sakht sar dard', 'aankhon ke aage dhundhla', 'ankhon main dhundlapan', 'chehra sooj gaya', 'haath pair sooj gaye', 'haath sooj', 'pet ke upar dard', 'شدید سر درد', 'دھندلا دکھنا', 'چہرہ سوج گیا', 'ہاتھ پیر سوج گئے', 'آنکھوں کے آگے دھندلاہٹ',
        ],
      },
    ],
    terms_en: ['severe headache / blurred vision / swelling during pregnancy'],
    terms_ur: ['حمل میں شدید سر درد، دھندلا دکھنا یا سوج'],
    terms_roman: ['hamal mein sakht sar dard, dhundla dekhna ya sooj'],
    reason_template: {
      en: 'Severe headache, blurred vision or swelling of face and hands in pregnancy can signal dangerously high blood pressure (pre-eclampsia) — this is a maternal emergency.',
      ur: 'حمل میں شدید سر درد، آنکھوں کے آگے دھندلاہٹ یا چہرے اور ہاتھوں کی سوجن خطرناک بلڈ پریشر (پری ایکلامپسیا) کی علامت ہو سکتی ہے — یہ ایمرجنسی ہے۔',
      roman: 'Hamal mein sakht sar dard, aankhon ke aage dhundlahat ya chehre aur haathon ki soojan khatarnak blood pressure (pre-eclampsia) ki alamat ho sakti hai — yeh emergency hai.',
    },
    sources: ['WHO — Pre-eclampsia & eclampsia', 'WHO — Maternal danger signs'],
  },
  {
    id: 'child_danger',
    category: 'pediatric',
    groups: [
      {
        terms: [
          'my child', 'my baby', 'my son', 'my daughter', 'child', 'children', 'baby', 'babies', 'bacha', 'bache', 'bacche', 'bcha', 'shishu', 'nanna bacha', 'bete ko', 'beti ko', 'bachay ko', 'bachay ki', 'bachay ka', 'bachon', 'mere bachay', 'mere bacha', 'بچہ', 'بچے کو', 'بچے کی', 'بچے کا', 'بچی', 'میرا بچہ', 'میرے بچے', 'newborn', 'infant', 'toddler', 'kid', 'kids', '1 year old', '2 year old', '3 year old', '4 year old', '5 year old', 'saal ka bacha', 'mahine ka bacha', 'beta', 'mera beta', 'meri beti', 'bachi', 'mera shishu', 'chhota bacha', 'chota bacha',
        ],
      },
      {
        terms: [
          'cant drink', "can't drink", 'cannot drink', 'not drinking', 'wont drink', "won't drink", 'refusing to drink', 'unable to drink', 'not feeding', 'cant breathe', "can't breathe", 'cannot breathe', 'unable to breathe', 'struggling to breathe', 'struggling for breath', 'chest indrawing', 'chest pulling in', 'blue lips', 'turning blue', 'unconscious', 'not responding', 'unresponsive', 'wont respond', "won't respond", 'cant wake', "can't wake", 'cant wake up', "can't wake up", 'floppy', 'baby is floppy', 'child is floppy', 'is floppy', 'gone limp', 'is limp', 'limp and not moving', 'limp and wont respond', 'floppy and wont respond', 'floppy and unresponsive', 'too weak to move', 'cant move', "can't move", 'not moving', 'barely moving', 'convulsion', 'convulsions', 'seizure', 'seizures', 'doray', 'dora', 'behosh', 'bohot kamzor', 'limp and unresponsive', 'doodh nahi pee raha', 'doodh nahi peeta', 'dawa nahi pee raha', 'paani nahi pee raha', 'kuch nahi kha raha', 'kuch nahi pee raha', 'pee nahi raha', 'pee nahi sakta', 'kuch nahi pee sakta', 'kuch nahi pi raha', 'kuch nahi pi sakta', 'pi nahi raha', 'pi nahi sakta', 'kuch nahi pii raha', 'ni pee raha', 'saans lene mein mushkil', 'hont neelay', 'neele hont', 'neela ho raha', 'neela ho gaya', 'neele ho rahe', 'hoth neele', 'hont neela', 'rang neela', 'neeli ho rahi', 'behosh ho gaya', 'dora parey', 'doray par rahe', 'بہت کمزور', 'سانس بہت تیز', 'ہونٹ نیلے', 'بےہوش', 'دورہ', 'دورے پڑ رہے', 'کچھ نہیں کھا رہا', 'کچھ نہیں پی رہا', 'نہیں پی رہا', 'پی نہیں سکتا', 'دودھ نہیں پی رہا', 'پانی نہیں پی رہا', 'سانس لینے میں مشکل', 'nhin hil raha', 'nahi hil raha', 'bilkul sust', 'sust ho gaya', 'jwab nahi de raha',
        ],
      },
    ],
    terms_en: ["child can't drink/breathe, fast breathing, blue lips, convulsions"],
    terms_ur: ['بچے کے لیے عالمی ادارہ صحت کے خطرے کی علامات'],
    terms_roman: ['bacha kuch nahi pee raha, saans tez, doray'],
    reason_template: {
      en: 'These match WHO/UNICEF child danger signs (unable to drink, fast or difficult breathing, blue lips, convulsions, unresponsiveness) — a child with any of these needs a health facility NOW.',
      ur: 'یہ علامات عالمی ادارہ صحت/یونیسیف کے بچوں کے خطرے کی علامات سے ملاتی ہیں (کچھ نہ پی سکنا، تیز یا مشکل سانس، نیلے ہونٹ، دورے، بےہوشی) — ایسا بچہ فوراً ہسپتال لے جائیں۔',
      roman: 'Yeh alamaat WHO/UNICEF ke bachon ke khatre ki alamaat se milti hain (kuch na pe sakna, tez ya mushkil saans, neele hont, doray, behoshi) — aisa bacha fori tor par hospital le jayein.',
    },
    sources: ['WHO/UNICEF — Danger signs in children', 'WHO IMCI guidelines'],
  },
  {
    id: 'severe_dehydration',
    category: 'dehydration',
    groups: [
      {
        terms: [
          'sunken eyes', 'eyes are sunken', 'very dry mouth', 'extremely dry', 'no urine', 'hasnt urinated', "hasn't urinated", 'not passing urine', 'not urinated', 'no urination', 'very lethargic', 'lethargic and limp', 'urinating very little', 'very little urine', 'severely dehydrated', 'severe dehydration', 'aankhein dhanas', 'aankhen andar dhanas gayi', 'ankhen dhans gayi', 'aankhein dhans gayi', 'aankhein dhans gayin', 'aankhon mein dhanas', 'munh booth sookha', 'peshaab nahi ho raha', 'peshaab bilkul nahi', 'peshaab nahi hua', 'peshaab nahi aa raha', 'peshaab bohot kam', 'booth sust', 'bilkul sust ho gaya', 'aankhein dhanssi', 'آنکھیں دھنس گئیں', 'پیشاب نہیں ہو رہا', 'پیشاب نہیں ہوا', 'بہت سوکھا منہ', 'بہت سست', 'بہت کم پیشاب',
        ],
      },
    ],
    terms_en: ['sunken eyes, no urine, extreme lethargy'],
    terms_ur: ['آنکھیں دھنس گئیں', 'پیشاب نہیں ہو رہا'],
    terms_roman: ['aankhein dhans gayi', 'peshaab nahi ho raha'],
    reason_template: {
      en: 'Sunken eyes, no urine for many hours, or extreme lethargy are signs of severe dehydration — this can become life-threatening, especially in children, and needs urgent medical care.',
      ur: 'آنکھوں کا دھنسنا، کئی گھنٹے سے پیشاب نہ آنا یا شدید سستی — یہ شدید پانی کی کمی (ڈی ہائیڈریشن) کی علامات ہیں، خاص طور پر بچوں میں یہ جان لیوا ہو سکتا ہے — فوری طبی امداد ضروری ہے۔',
      roman: 'Aankhon ka dhansna, kai ghanton se peshab na aana ya shadeed susti — yeh shadeed pani ki kami (dehydration) ki alamaat hain, khaas tor par bachon mein yeh jaan lewa ho sakta hai — fori tibbi imdad zaroori hai.',
    },
    sources: ['WHO — Diarrhoea & dehydration in children'],
  },
  {
    id: 'poisoning',
    category: 'poisoning',
    groups: [
      {
        terms: [
          'swallowed poison', 'drank poison', 'ate poison', 'poisoning', 'overdose', 'overdosed', 'took too many', 'taken too many', 'too many pills', 'extra pills', 'extra tablets', 'swallowed chemical', 'drank chemical', 'swallowed a cleaning chemical', 'drank pesticide', 'swallowed pesticide', 'drank insecticide', 'rat poison', 'too much insulin', 'took too much insulin', 'insulin overdose', 'chemical in my eye', 'chemical got in my eye', 'chemical got into my eye', 'got into medicine', 'got into the medicine', 'got into medicine cabinet', 'got into pills', 'child got into medicine', 'found child with pills', 'found pills missing', 'child ate unknown pills', 'dont know what they swallowed', "don't know what they swallowed", 'dont know what he swallowed', 'dont know what she swallowed', 'swallowed something', 'swallowed something unknown', 'drank something unknown', 'drank something from a bottle', 'found empty bottle', 'found empty pill bottle', 'may have swallowed', 'might have swallowed', 'zeher', 'zeher kha liya', 'zeher pee liya', 'galti se dawa kha li', 'zyada goliyan kha li', 'bohot goliyan kha li', 'zyada dawa kha li', 'keeda maar dawa', 'zeher khaya hai', 'dawaiyan kha li', 'goliyan kha li', 'pata nahi kya kha gaya', 'pata nahin kya pee liya', 'pata nahi kya nigat gaya', 'اوور ڈوز', 'زیادہ گولیاں کھا لیں', 'زہر', 'زہر کھا لیا', 'زہر پی لیا', 'دوا کھا لی', 'کیڑا مار دوا', 'پتہ نہیں کیا کھا گیا',
        ],
      },
    ],
    terms_en: ['poisoning', 'overdose'],
    terms_ur: ['زہر کھانا', 'مضر دوا'],
    terms_roman: ['zeher kha liya', 'zeher pee liya'],
    reason_template: {
      en: 'Possible poisoning or medicine overdose is an emergency — do NOT induce vomiting unless told by medical staff; call for help immediately.',
      ur: 'زہر یا زیادہ دوا کھانا ایمرجنسی ہے — طبی عملے کے کہنے کے بغیر متلی نہ کریں، فوراً مدد کے لیے کال کریں۔',
      roman: 'Zeher ya zyada dawa khana emergency hai — tibbi amlay ke kehne baghair matli na karayein, fori tor par madad ke liye call karein.',
    },
    sources: ['IFRC — First aid for poisoning', 'WHO — Poisoning prevention'],
  },
  {
    id: 'snake_bite',
    category: 'snakebite',
    groups: [
      {
        terms: [
          'snake bite', 'snakebite', 'bitten by a snake', 'snake bit', 'saanp ne kaata', 'saanp kaat gaya', 'saanp ne dasa', 'sanp ne kata', 'سانپ نے کاٹا', 'سانپ نے کاٹا ہے',
        ],
      },
    ],
    terms_en: ['snake bite'],
    terms_ur: ['سانپ نے کاٹا'],
    terms_roman: ['saanp ne kaata'],
    reason_template: {
      en: 'A snake bite needs urgent medical care — keep the bitten limb still and lower than the heart, and get to a hospital with anti-venom as fast as possible.',
      ur: 'سانپ کے کاٹنے پر فوری طبی امداد ضروری ہے — کٹا ہوا حصہ ساکن اور دل سے نیچے رکھیں اور جلد از جلد اینٹی وینم موجود ہسپتال پہنچیں۔',
      roman: 'Saanp ke kaatne par fori tibbi imdad zaroori hai — kata hua hissa sakin aur dil se neeche rakhein aur jald az jald anti-venom maujood hospital pohanchein.',
    },
    sources: ['WHO — Snakebite envenoming'],
  },
  {
    id: 'severe_burns',
    category: 'burns',
    groups: [
      {
        terms: [
          'severe burn', 'severe burns', 'large burn', 'large burns', 'deep burn', 'deep burns', 'badly burned', 'badly burnt', 'burn is white', 'white and charred', 'charred', 'burned black', 'chemical burn', 'burned by a chemical', 'chemical burns', 'electrical burn', 'burned by electricity', 'bohot jala', 'zyada jala', 'bara hissa jala', 'poora haath jala', 'poora hath jala', 'bada area jala', 'بہت جل گیا', 'زیادہ جل گیا', 'بڑا حصہ جل گیا', 'پورا ہاتھ جل گیا', 'بڑا علاقہ جلا',
        ],
      },
    ],
    terms_en: ['severe or large burns'],
    terms_ur: ['بہت جل گیا', 'بڑا حصہ جل گیا'],
    terms_roman: ['bohot jala', 'bara hissa jala'],
    reason_template: {
      en: 'A severe or large burn is an emergency — cool the burn with clean running water for 10–20 minutes and get medical help; do NOT apply toothpaste, ghee or ice.',
      ur: 'شدید یا بڑے جلنے کا زخم ایمرجنسی ہے — 10 سے 20 منٹ صاف بہتے پانی سے ٹھنڈا کریں اور طبی امداد لیں؛ ٹوتھ پیسٹ، گھی یا برف نہ لگائیں۔',
      roman: 'Shadeed ya bare jalne ka zakhm emergency hai — 10 se 20 minute saaf bahta pani se thanda karein aur tibbi imdad lein; toothpaste, ghee ya barf na lagayein.',
    },
    sources: ['IFRC — First aid for burns'],
  },
  {
    id: 'meningitis_stiff_neck',
    category: 'meningitis',
    groups: [
      {
        terms: [
          'stiff neck', 'neck stiffness', 'neck is rigid', 'cant touch chin to chest', "can't touch chin", 'gardan sakht', 'gardan mein sakhti', 'garadan sakht hai', 'gardan nahi hil pa rahi', 'گردن سخت', 'گردن میں سختی', 'گردن نہیں ہل پا رہی',
        ],
      },
      {
        terms: [
          'fever', 'high fever', 'bukhar', 'bukhaar', 'tez bukhar', 'bukhar hai', 'بخار', 'تیز بخار', 'headache', 'severe headache', 'sar dard', 'sar dard hai', 'سر درد', 'شدید سر درد',
        ],
      },
    ],
    terms_en: ['stiff neck with fever or headache'],
    terms_ur: ['گردن کی سختی اور بخار'],
    terms_roman: ['gardan sakht aur bukhar'],
    reason_template: {
      en: 'A stiff neck with fever can be a sign of meningitis — this is an emergency and needs immediate medical assessment.',
      ur: 'بخار کے ساتھ گردن کی سختی میننجائٹس کی علامت ہو سکتی ہے — یہ ایمرجنسی ہے اور فوری طبی معائنہ درکار ہے۔',
      roman: 'Bukhar ke saath gardan ki sakhti meningitis ki alamat ho sakti hai — yeh emergency hai aur fori tibbi muaina darkar hai.',
    },
    sources: ['WHO — Meningitis fact sheet'],
  },
  {
    id: 'suicidal_ideation',
    category: 'mental-health',
    groups: [
      {
        terms: [
          'kill myself', 'killing myself', 'end my life', 'want to die', 'wish to die', 'suicide', 'suicidal', 'better off dead', "don't want to live", 'dont want to live', 'do not want to live', 'do not want to live anymore', 'no will to live', 'want to hurt myself', 'want to harm myself', 'hurt myself', 'harm myself', 'wants to hurt himself', 'wants to hurt herself', 'hurt himself', 'hurt herself', 'threatening suicide', 'khudkushi', 'khud kushi', 'khudkashi', 'marna chahta hoon', 'marna chahti hoon', 'jeena nahi chahta', 'jeena nahi chahti', 'mar jaunga', 'mar jaungi', 'zindagi khatam karna chahta', 'apne aap ko chot', 'khud ko nuksan', 'خودکشی', 'مرنا چاہتا ہوں', 'مرنا چاہتی ہوں', 'جینا نہیں چاہتا', 'جینا نہیں چاہتی', 'زندگی ختم کرنا چاہتا', 'خود کو نقصان',
        ],
      },
    ],
    terms_en: ['suicidal statements'],
    terms_ur: ['خودکشی کے ارادے'],
    terms_roman: ['khudkushi ka irada', 'marna chahta hoon'],
    reason_template: {
      en: 'You are not alone and your life matters. Please reach out right now — help is available. If you are in immediate danger, call 1122 or contact a trusted person who can stay with you.',
      ur: 'آپ اکیلے نہیں ہیں اور آپ کی زندگی قیمتی ہے۔ براہ کرم ابھی مدد کے لیے رابطہ کریں — اگر فوری خطرہ ہے تو 1122 پر کال کریں یا کسی قابل بھروسہ شخص کو بتائیں جو آپ کے ساتھ رہ سکے۔',
      roman: 'Aap akele nahi hain aur aap ki zindagi qeemti hai. Barah-e-karam abhi madad ke liye raabta karein — agar fori khatra hai to 1122 par call karein ya kisi qabil-e-bharosa shakhs ko batayein jo aap ke saath reh sake.',
    },
    sources: ['WHO — Suicide prevention', 'Umang Mental Health Helpline (Pakistan)'],
  },
  {
    id: 'anaphylaxis',
    category: 'anaphylaxis',
    groups: [
      {
        terms: [
          'face swelling', 'face is swelling', 'lips swollen', 'lips are swelling', 'lips swelled', 'lips suddenly swelled', 'throat swelling', 'throat is closing', 'throat feels closed', 'throat closing', 'tongue swelling', 'tongue is swollen', 'tongue is swelling', 'allergic reaction', 'severe allergy', 'hives', 'chehra phool raha', 'chehra sooj raha', 'hont phool gaye', 'hont sooj gaye', 'gala sooj raha', 'gala phool raha', 'zaban sooj gayi', 'zaban sooj rahi', 'allergy ho gayi', 'الرجی', 'چہرہ سوج رہا', 'ہونٹ سوج گئے', 'گلا سوج رہا', 'زبان سوج گئی', 'شدید الرجی',
        ],
      },
      {
        terms: [
          'difficulty breathing', 'cant breathe', "can't breathe", 'cannot breathe', 'unable to breathe', 'struggling to breathe', 'trouble breathing', 'breathing difficulty', 'saans lene mein mushkil', 'saans nahi aa rahi', 'saans nhi aa rahi', 'saans phool rahi', 'saans mein takleef', 'سانس لینے میں مشکل', 'سانس نہیں آ رہی', 'سانس پھول رہی',
        ],
      },
    ],
    terms_en: ['face/throat swelling with breathing difficulty (severe allergic reaction)'],
    terms_ur: ['چہرے یا گلے کی سوجن کے ساتھ سانس لینے میں مشکل'],
    terms_roman: ['chehre ya galay ki soojan ke saath saans lene mein mushkil'],
    reason_template: {
      en: 'Swelling of the face, lips, tongue or throat with breathing difficulty can be anaphylaxis — a severe allergic reaction that is life-threatening. Get emergency help immediately.',
      ur: 'چہرے، ہونٹوں، زبان یا گلے کی سوجن کے ساتھ سانس لینے میں مشکل شدید الرجی (اینا فیلیکسس) ہو سکتی ہے — یہ جان لیوا ہے، فوری ایمرجنسی مدد لیں۔',
      roman: 'Chehre, honton, zaban ya galay ki soojan ke saath saans lene mein mushkil shadeed allergy (anaphylaxis) ho sakti hai — yeh jaan lewa hai, fori emergency madad lein.',
    },
    sources: ['WHO — Anaphylaxis guidance', 'IFRC — First aid for allergic reactions'],
  },
  {
    id: 'head_injury_danger',
    category: 'head-injury',
    groups: [
      {
        terms: [
          'head injury', 'hit his head', 'hit her head', 'hit my head', 'hurt his head', 'hurt her head', 'fell on his head', 'fell on her head', 'banged his head', 'banged her head', 'head wound', 'sar par chot', 'sir par chot', 'sir ki chot', 'sar se chot lagi', 'gir kar sir lagi', 'gir kar sar pe chot', 'سر پر چوٹ', 'سر سے چوٹ', 'سر کی چوٹ', 'گر کر سر پر چوٹ', 'head ka zakhm',
        ],
      },
      {
        terms: [
          'keeps vomiting', 'repeated vomiting', 'vomiting repeatedly', 'constant vomiting', 'cant stop vomiting', "can't stop vomiting", 'very drowsy', 'extremely sleepy', 'very sleepy', 'unconscious', 'not responding', 'confused', 'confusion', 'seizure', 'convulsion', 'blood from ear', 'fluid from ear', 'unequal pupils', 'lost consciousness', 'was unconscious', 'passed out', 'fainted', 'behosh ho gaya tha', 'behosh ho gayi thi', 'hosh gaya tha', 'bar bar ulti', 'ultiyan ho rahi hain', 'musalsal ulti', 'bohot sust', 'sust ho gaya', 'behosh', 'uljhan', 'gala daba', 'دورہ', 'بےہوش', 'الجھن', 'بہت سست', 'بار بار الٹی', 'مسلسل الٹی', 'کان سے خون', 'بےہوش ہو گیا تھا', 'ہوش نہیں رہا',
        ],
      },
    ],
    terms_en: ['head injury with vomiting / drowsiness / confusion'],
    terms_ur: ['سر کی چوٹ کے ساتھ الٹی، سستی یا الجھن'],
    terms_roman: ['sar ki chot ke saath ulti, susti ya uljhan'],
    reason_template: {
      en: 'A head injury followed by repeated vomiting, drowsiness or confusion can mean brain injury — this is an emergency that needs a hospital now.',
      ur: 'سر کی چوٹ کے بعد بار بار الٹی، سستی یا الجھن دماغی چوٹ کی علامت ہو سکتی ہے — یہ ایمرجنسی ہے، فوری ہسپتال لے جائیں۔',
      roman: 'Sar ki chot ke baad baar baar ulti, susti ya uljhan dimaghi chot ki alamat ho sakti hai — yeh emergency hai, fori hospital le jayein.',
    },
    sources: ['WHO — Traumatic brain injury', 'IFRC — Head injury first aid'],
  },
  {
    id: 'severe_abdominal_pain',
    category: 'abdominal',
    groups: [
      {
        terms: [
          'unbearable pain', 'worst pain ever', 'excruciating pain', 'severe abdominal pain', 'severe stomach pain', 'extreme stomach pain', 'severe pain in belly', 'severe belly pain', 'severe pain in stomach', 'severe pain in abdomen', 'extreme pain in belly', 'extreme abdominal pain', 'worst belly pain', 'worst stomach pain', 'unbearable stomach pain', 'unbearable belly pain', 'unbearable abdominal pain', 'pet ka dard bardasht nahi ho raha', 'pet mein bohot sakht dard', 'pet mein shadeed dard', 'pet dard bardasht nahi', 'dard bardasht nahi ho raha', 'pet ka shadeed dard', 'pet ka sakht dard', 'پیٹ میں بہت شدید درد', 'درد برداشت نہیں ہو رہا', 'پیٹ کا درد برداشت نہیں ہو رہا', 'پیٹ کا شدید درد',
        ],
      },
    ],
    terms_en: ['unbearable / worst-ever abdominal pain'],
    terms_ur: ['پیٹ میں بہت شدید درد'],
    terms_roman: ['pet mein bohot sakht dard', 'dard bardasht nahi ho raha'],
    reason_template: {
      en: 'Unbearable or worst-ever abdominal pain needs urgent evaluation — several emergency conditions can present this way.',
      ur: 'ناقابل برداشت پیٹ درد کے لیے فوری معائنہ ضروری ہے — کئی ایمرجنسی حالتیں اس طرح ظاہر ہو سکتی ہیں۔',
      roman: 'Na-qabil-e-bardasht pet dard ke liye fori muaina zaroori hai — kai emergency halatein is tarah zahir ho sakti hain.',
    },
    sources: ['WHO EMRO — Emergency care: abdominal pain'],
  },
  {
    id: 'choking',
    category: 'choking',
    groups: [
      {
        terms: [
          'choking', 'choked on', 'choking on something', 'something stuck in my throat', 'food stuck in my throat', 'cant breathe because something is stuck', 'gala phans gaya', 'gala phans raha hai', 'gale mein kuch phans gaya', 'khana phans gaya', 'chok gaya', 'گلا پھنس گیا', 'گلے میں کچھ پھنس گیا', 'چوک',
        ],
      },
    ],
    terms_en: ['choking', 'airway blocked'],
    terms_ur: ['گلا پھنس گیا'],
    terms_roman: ['gala phans gaya'],
    reason_template: {
      en: 'Choking means the airway may be blocked — this is immediately life-threatening. Start first aid now and call 1122.',
      ur: 'گلا پھنسنا سانس کی نالی کے بند ہونے کا نام ہے — یہ فوراً جان لیوا ہے۔ ابھی ابتدائی امداد شروع کریں اور 1122 پر کال کریں۔',
      roman: 'Gala phansna saans ki nali ke band hone ka naam hai — yeh fori tor par jaan lewa hai. Abhi ibtidai imdad shuru karein aur 1122 par call karein.',
    },
    sources: ['IFRC — First aid for choking', 'WHO — Basic emergency care'],
  },
  {
    id: 'airway_swelling',
    category: 'anaphylaxis',
    groups: [
      {
        terms: [
          'tongue is swelling', 'tongue swelling', 'tongue is swollen', 'tongue swollen', 'throat is closing', 'throat feels closed', 'throat closing', 'throat feels tight and closing', 'throat is swelling', 'throat swelling', 'throat is swollen', 'gala band ho raha', 'gala band ho gaya', 'zaban sooj gayi', 'zaban sooj rahi hai', 'zaban phool gayi', 'زبان سوج گئی', 'زبان سوج رہی ہے', 'گلا بند ہو رہا', 'گلا بند ہو گیا',
        ],
      },
    ],
    terms_en: ['tongue/throat swelling (airway obstruction risk)'],
    terms_ur: ['زبان یا گلے کی سوجن'],
    terms_roman: ['zaban ya galay ki soojan'],
    reason_template: {
      en: 'Swelling of the tongue or throat can block the airway — this is a life-threatening emergency (possible anaphylaxis). Get emergency help immediately.',
      ur: 'زبان یا گلے کی سوجن سانس کی نالی کو بند کر سکتی ہے — یہ جان لیوا ایمرجنسی ہے (ممکنہ شدید الرجی)۔ فوری ایمرجنسی مدد لیں۔',
      roman: 'Zaban ya galay ki soojan saans ki nali ko band kar sakti hai — yeh jaan lewa emergency hai (mumkina shadeed allergy). Fori emergency madad lein.',
    },
    sources: ['WHO — Anaphylaxis guidance', 'IFRC — First aid for allergic reactions'],
  },
  {
    id: 'cardiac_arrest_claim',
    category: 'cardiac',
    groups: [
      {
        terms: [
          'having a heart attack', 'am having a heart attack', 'is having a heart attack', 'are having a heart attack', 'heart attack right now', 'cardiac arrest', 'dil ka dora aa raha', 'dil ka dora parey', 'دل کا دورہ آ رہا', 'دل کا دورہ پڑے',
        ],
      },
    ],
    terms_en: ['stated active heart attack'],
    terms_ur: ['دل کا دورہ آ رہا'],
    terms_roman: ['dil ka dora aa raha'],
    reason_template: {
      en: 'A heart attack described as happening now is an emergency — call 1122 immediately and sit down, do not exert yourself.',
      ur: 'ابھی ہو رہا دل کا دورہ ایک ایمرجنسی ہے — فوراً 1122 پر کال کریں اور بیٹھ جائیں، زور نہ لگائیں۔',
      roman: 'Abhi ho raha dil ka dora ek emergency hai — fori tor par 1122 par call karein aur baith jayein, zor na lagayein.',
    },
    sources: ['WHO — Cardiovascular diseases: warning signs'],
  },
  {
    id: 'cardiac_pressure_severe',
    category: 'cardiac',
    groups: [
      {
        terms: [
          'crushing chest', 'crushing chest pain', 'crushing feeling in my chest', 'crushing feeling in chest', 'crushing sensation in my chest', 'crushing sensation in chest', 'crushing pain in chest', 'crushing pain in my chest', 'squeezing in my chest', 'squeezing in chest', 'squeezing sensation in my chest', 'squeezing sensation in chest', 'squeezing chest pain', 'squeezing feeling in chest', 'squeezing feeling in my chest', 'squeezing chest', 'elephant on my chest', 'elephant is sitting', 'elephant sitting on my chest', 'elephant sitting on', 'elephant on chest', 'someone sitting on my chest', 'feels like someone sitting on my chest', 'feels like someone is sitting on my chest', 'heavy weight on my chest', 'heavy weight on chest', 'tight band around my chest', 'tight band around chest', 'band around my chest', 'band around chest', 'chest being squeezed', 'chest feels like its being squeezed', 'vice around my chest', 'vice on my chest', 'chest feels really tight and heavy', 'chest feels really heavy', 'seene par bhaari bojh', 'seene par wazan', 'seene ko dabao', 'seene mein dabao', 'seena daba raha hai', 'seena dab raha hai', 'seene dab raha', 'seena par dabao', 'seene par dabao', 'seena daba', 'seene mein bharipan', 'سینے پر بھاری بوجھ', 'سینے پر دباؤ', 'سینہ دبا رہا ہے', 'سینے میں بھراپن', 'سینے میں دباؤ',
        ],
      },
    ],
    terms_en: ['crushing/squeezing chest pressure (cardiac sign)'],
    terms_ur: ['سینے میں دباؤ یا بھاری پن'],
    terms_roman: ['seene mein dabao ya bhaari pan'],
    reason_template: {
      en: 'A crushing, squeezing or heavy pressure sensation in the chest is a classic heart-attack warning sign — this needs emergency care now, especially with sweating, nausea or pain spreading to the arm or jaw.',
      ur: 'سینے میں دبانے، بھاری پن یا جکڑنے کا احساس دل کے دورے کی کلاسیکی علامت ہے — اس کے لیے فوری ایمرجنسی ضروری ہے، خاص طور پر اگر پسینہ، متلی یا درد بازو یا جبھ تک پھیل رہا ہو۔',
      roman: 'Seene mein dabanay, bhaari pan ya jakarnay ka ehsas dil ke doray ki classic alamat hai — is ke liye fori emergency zaroori hai, khaas tor par agar paseena, matli ya dard baazu ya jabh tak phail raha ho.',
    },
    sources: ['WHO — Cardiovascular diseases: warning signs', 'ACC — Heart attack symptoms'],
  },
  {
    id: 'severe_breathing_distress',
    category: 'cardiac',
    groups: [
      {
        terms: [
          'cannot breathe', 'cant breathe', "can't breathe", 'unable to breathe', 'struggling to breathe', 'severe breathing distress', 'severe breathing difficulty', 'cannot catch my breath', 'cant catch my breath', "can't catch my breath", 'cant catch breath', "can't catch breath", 'cannot catch breath', 'cannot breath', 'gasping for air', 'gasping', 'cant get air', "can't get air", 'cant get enough air', "can't get enough air", 'cant get a full breath', "can't get a full breath", 'suffocating', 'suffocation', 'suffocate', 'choking on air', 'air wont go in', "air won't go in", 'cant fill my lungs', "can't fill my lungs", 'wheezing badly', 'wheezing severe', 'wheezing a lot', 'severe wheezing', 'breathing is really hard', 'really hard to breathe', 'very hard to breathe', 'breathless walking', 'breathless just walking', 'breathless on exertion', 'breathless on minimal exertion', 'cant breathe walking', "can't breathe walking", 'saans nahi aa rahi', 'saans nahi arahi', 'saans phool gayi', 'saans ruk rahi', 'ghutan ho rahi', 'ghutan ho rahi hai', 'سانس نہیں آ رہی', 'سانس رک رہی', 'سانس لینے میں شدید دشواری', 'سانس میں شدید دشواری', 'سانس لینے میں دشواری', 'سانس میں دشواری', 'شدید دشواری', 'گھٹن ہو رہی ہے', 'گھٹن ہو رہی',
        ],
      },
    ],
    terms_en: ['severe breathing distress (cannot catch breath / gasping)'],
    terms_ur: ['شدید سانس کی تکلیف (سانس نہ آنا یا پھولنا)'],
    terms_roman: ['shadeed saans ki takleef (saans na aana ya phoolna)'],
    reason_template: {
      en: 'Being unable to catch your breath or gasping for air is a severe breathing emergency — call 1122 immediately and sit upright.',
      ur: 'سانس نہ پہنچنا یا ہانپنا شدید سانس کی ایمرجنسی ہے — فوراً 1122 پر کال کریں اور سیدھا بیٹھیں۔',
      roman: 'Saans na pahunchna ya haanpna shadeed saans ki emergency hai — fori tor par 1122 par call karein aur seedha baithin.',
    },
    sources: ['WHO — Emergency care: breathing difficulty', 'WHO EMRO — Emergency care'],
  },
  {
    id: 'acute_allergic_reaction',
    category: 'anaphylaxis',
    groups: [
      {
        terms: [
          'face swelling', 'face is swelling', 'lips swollen', 'lips are swelling', 'lips swelled', 'lips suddenly swelled', 'lips swelling up', 'lips swelled up', 'swelling of lips', 'swollen lips', 'face swelled up', 'face is swelling up', 'cheeks swelling', 'eyes swelling shut', 'throat swelling', 'throat is closing', 'throat feels closed', 'throat closing', 'tongue swelling', 'tongue is swollen', 'tongue is swelling', 'allergic reaction', 'severe allergy', 'hives all over', 'breaking out in hives', 'covered in hives', 'hives spreading', 'rash spreading fast', 'swelling spreading', 'chehra phool raha', 'chehra sooj raha', 'hont phool gaye', 'hont sooj gaye', 'hont sooj rahe', 'gala sooj raha', 'gala phool raha', 'zaban sooj gayi', 'zaban sooj rahi', 'allergy ho gayi', 'chehra sooj gaya', 'الرجی', 'چہرہ سوج رہا', 'چہرہ سوج گیا', 'ہونٹ سوج گئے', 'گلا سوج رہا', 'زبان سوج گئی', 'شدید الرجی',
        ],
      },
      {
        terms: [
          'after eating', 'after i ate', 'after medicine', 'after taking medicine', 'after a tablet', 'after a pill', 'after food', 'after a sting', 'after insect sting', 'after bee sting', 'after wasp sting', 'after injection', 'after a shot', 'after antibiotic', 'after penicillin', 'after brufen', 'after aspirin', 'medicine', 'dawa', 'dawai', 'tablet', 'goli', 'capsule', 'injection', 'khana', 'khaya', 'sting', 'das', 'dasa', 'کھانے کے بعد', 'دوا کے بعد', 'گولی کے بعد', 'ڈنک کے بعد',
        ],
      },
    ],
    terms_en: ['face/lip/tongue swelling or hives after food/medicine/sting (anaphylaxis risk)'],
    terms_ur: ['کھانے، دوا یا ڈنک کے بعد چہرے/ہونٹوں کی سوجن یا چھپڑی'],
    terms_roman: ['khaane, dawa ya dank ke baad chehre/honton ki soojan ya chhapri'],
    reason_template: {
      en: 'Swelling of the face, lips or tongue — or hives spreading — after food, medicine or a sting can be anaphylaxis, a severe allergic reaction that can rapidly become life-threatening. Get emergency help now, especially if breathing becomes difficult.',
      ur: 'کھانے، دوا یا ڈنک کے بعد چہرے، ہونٹوں یا زبان کی سوجن — یا پھیلتی چھپڑی — شدید الرجی (اینا فیلیکسس) ہو سکتی ہے جو تیزی سے جان لیوا ہو سکتی ہے۔ فوری ایمرجنسی مدد لیں، خاص طور پر اگر سانس لینا مشکل ہو۔',
      roman: 'Khaane, dawa ya dank ke baad chehre, honton ya zaban ki soojan — ya phailti chhapri — shadeed allergy (anaphylaxis) ho sakti hai jo tezi se jaan lewa ho sakti hai. Fori emergency madad lein, khaas tor par agar saans lena mushkil ho.',
    },
    sources: ['WHO — Anaphylaxis guidance', 'IFRC — First aid for allergic reactions'],
  },
  {
    id: 'stroke_claim',
    category: 'stroke',
    groups: [
      {
        terms: [
          'having a stroke', 'am having a stroke', 'is having a stroke', 'are having a stroke', 'has a stroke', 'having strokes', 'faalij aa gaya', 'faalij aa raha hai', 'فالج آ گیا', 'فالج آ رہا ہے',
        ],
      },
    ],
    terms_en: ['stated active stroke'],
    terms_ur: ['فالج آ گیا'],
    terms_roman: ['faalij aa gaya'],
    reason_template: {
      en: 'A stroke described as happening now is an emergency — note the time symptoms started and call 1122 immediately.',
      ur: 'ابھی ہو رہا فالج ایک ایمرجنسی ہے — علامات کے شروع ہونے کا وقت یاد رکھیں اور فوراً 1122 پر کال کریں۔',
      roman: 'Abhi ho raha faalij ek emergency hai — alamaat ke shuru hone ka waqt yaad rakhein aur fori tor par 1122 par call karein.',
    },
    sources: ['WHO — Stroke: key facts', 'FAST stroke criteria'],
  },
  {
    id: 'pregnancy_danger',
    category: 'obstetric-emergency',
    groups: [
      {
        terms: [
          'pregnant', 'pregnancy', 'hamal', 'hamela', 'hamail', 'mawjuda hamal', 'hamal ke doran', 'hamal hai', 'haamla', 'pregnancy mein', 'حاملہ', 'حمل', 'حمل ہے', 'حمل کے دوران', 'maa banne wali', 'ماں بننے والی',
        ],
      },
      {
        terms: [
          'baby is moving much less', 'baby moving less', 'baby movements decreased', 'reduced fetal movement', 'no fetal movement', 'baby is not moving', 'baby not moving', 'baby stopped moving', 'baby has stopped moving', 'baby stopped kicking', 'baby stopped moving around', 'no movement from baby', 'baby isnt moving', "baby isn't moving", 'cant feel baby moving', "can't feel baby moving", 'cant feel baby', "can't feel baby", 'baby not kicking', 'baby hasnt moved', "baby hasn't moved", 'baby not active', 'leaking fluid', 'water broke', 'my water broke', 'waters broke', 'pani beh raha', 'pani gir raha', 'bachay ki harkat kam', 'bachay ki harkat nahi', 'bacha harkat nahi', 'bachay ki harkat bohat kam', 'bacha harkat band', 'bachay ki harkat band ho gayi', 'bacha hil nahi raha', 'bachay ki harkat nahi ho rahi', 'پانی اٹھ گیا', 'پانی آ رہا', 'بچہ حرکت نہیں', 'بچے کی حرکت کم', 'بچے کی حرکت بند', 'بچہ حرکت نہیں کر رہا',
        ],
      },
    ],
    terms_en: ['reduced fetal movement / leaking fluid in pregnancy'],
    terms_ur: ['حمل میں بچے کی حرکت کم یا پانی کا اٹھنا'],
    terms_roman: ['hamal mein bachay ki harkat kam ya pani ka uthna'],
    reason_template: {
      en: 'Reduced baby movement or leaking fluid during pregnancy are WHO maternal danger signs — go to a health facility immediately.',
      ur: 'حمل کے دوران بچے کی حرکت کا کم ہونا یا پانی کا اٹھنا عالمی ادارہ صحت کے خطرے کی علامات ہیں — فوری ہسپتال جائیں۔',
      roman: 'Hamal ke doran bachay ki harkat ka kam hona ya pani ka uthna WHO ke khatre ki alamaat hain — fori hospital jayein.',
    },
    sources: ['WHO — Maternal danger signs', 'WHO — Pregnancy, childbirth guideline'],
  },
  {
    id: 'infant_fever',
    category: 'pediatric',
    groups: [
      {
        terms: [
          'newborn', 'new born', 'infant', 'shishu', 'nanna bacha', '1 month old', '2 month old', 'one month old', 'two month old', '3 month old', 'three month old', 'نو مولود', 'شیر خوار',
        ],
      },
      {
        terms: [
          'fever', 'high fever', 'bukhar', 'bukhaar', 'tez bukhar', 'بخار', 'تیز بخار',
        ],
      },
    ],
    terms_en: ['fever in a newborn/young infant'],
    terms_ur: ['نو مولود بچے کو بخار'],
    terms_roman: ['nannay bachay ko bukhar'],
    reason_template: {
      en: 'Fever in a newborn or very young infant is a danger sign — a baby this age needs a health facility NOW, even if they look well.',
      ur: 'نو مولود یا ننھے بچے کو بخار خطرے کی علامت ہے — اس عمر کے بچے کو فوراً ہسپتال لے جائیں، چاہے وہ ٹھیک دکھتا ہو۔',
      roman: 'Nou-moloud ya nannay bachay ko bukhar khatre ki alamat hai — is umar ke bachay ko fori hospital le jayein, chahey woh theek dikhta ho.',
    },
    sources: ['WHO/UNICEF — Danger signs in children', 'WHO IMCI guidelines'],
  },
  // ============================================================
  // Phase 0/1 — EXPANDED EMERGENCY COVERAGE (W10 + emergency red-team)
  // ============================================================
  {
    id: 'severe_burns',
    category: 'burns',
    groups: [
      {
        terms: [
          'spilled boiling oil', 'boiling oil on', 'hot oil burn', 'boiling water on', 'hot water spilled', 'scalded', 'scald', 'steam burn', 'severe burn', 'large burn', 'burn on face', 'burn on hands', 'burn on genitals', 'burnt arm', 'burnt leg', 'burnt face', 'burnt hand', 'boiling chai', 'garam chai', 'garam pani', 'garam tel', 'aablagi se', 'aag se jala', 'jala hua', 'jala diya', 'jala liya', 'daahak', 'daahak se', 'جل گیا', 'جلنے لگا', 'آبلے', 'آبلہ', 'گرم پانی', 'گرم تیل', 'گرم چائے', 'آگ سے جلا',
        ],
      },
    ],
    terms_en: ['severe burn / scald'],
    terms_ur: ['شدید جلن'],
    terms_roman: ['shadeed jalan / daahak'],
    reason_template: {
      en: 'Severe burns — especially on face, hands, genitals, or large areas — need emergency care. Cool with running water for 20 minutes, do not apply pastes/creams, and call 1122.',
      ur: 'شدید جلن — خاص طور پر چہرے، ہاتھوں، شرمگاہ یا بڑے حصے پر — کو فوری ہسپتال لے جانا ضروری ہے۔ 20 منٹ بہتے پانی سے ٹھنڈا کریں، کریم یا پیسٹ نہ لگائیں، اور 1122 پر کال کریں۔',
      roman: 'Shadeed jalan — khaas tor par chehre, haathon, sharmgah ya bare hissay par — ko fori hospital le jana zaroori hai. 20 minute bahte pani se thanda karein, cream ya paste na lagayein, aur 1122 par call karein.',
    },
    sources: ['IFRC — First aid for burns', 'WHO — Burn prevention and care'],
  },
  {
    id: 'head_injury_red_flags',
    category: 'head-injury',
    groups: [
      {
        terms: [
          'hit my head', 'hit his head', 'hit her head', 'fell and hit head', 'bumped head hard', 'head injury', 'head trauma', 'knocked out', 'knocked unconscious', 'lost consciousness after fall', 'vomited after hitting head', 'vomiting after fall', 'confused after fall', 'cant remember the fall', "can't remember the fall", 'unequal pupils', 'pupils different sizes', 'one pupil bigger', 'seizure after fall', 'seizure after head injury', 'blood from ear', 'fluid from ear', 'fluid from nose', 'clear fluid from nose after fall', 'sir par chot', 'sar par chot', 'sar gira', 'girte hue sar laga', 'sar lag kar gir gaya', 'sar par chot ke baad ulti', 'ulti ke baad sar', 'sar dard ke baad ulti', 'yaad nahi gira', 'behosh gir gaya', 'behosh ho gaya gir kar', 'سر پر چوٹ', 'سر گر کر بےہوش', 'گرنے کے بعد الٹی', 'گرنے کے بعد ہوش نہیں',
        ],
      },
    ],
    terms_en: ['head injury with red flags'],
    terms_ur: ['سر کی چوٹ کی خطرے کی علامات'],
    terms_roman: ['sar ki chot ke khatre ki alamaat'],
    reason_template: {
      en: 'Head injury with vomiting, confusion, unequal pupils, seizure, or fluid from ear/nose is a brain injury emergency — do not move the neck, call 1122 now.',
      ur: 'سر کی چوٹ کے ساتھ الٹی، الجھن، بے برابر پتلیاں، دورہ، یا کان/ناک سے پانی آنے کا صورتحال دماغ کی چوٹ کی ایمرجنسی ہے — گردن کو ہلانا نہیں، فوراً 1122 پر کال کریں۔',
      roman: 'Sar ki chot ke saath ulti, uljhan, be-barabar putliyan, dorah, ya kaan/naak se pani anay ki soorat dimagh ki chot ki emergency hai — gardan ko hilana nahin, fori 1122 par call karein.',
    },
    sources: ['WHO — Trauma guidelines', 'NICE — Head injury assessment'],
  },
  {
    id: 'seizure_active',
    category: 'seizure',
    groups: [
      {
        terms: [
          'convulsing', 'having a seizure', 'seizure wont stop', "seizure won't stop", 'seizure over 5 minutes', 'seizure lasting', 'multiple seizures', 'repeated seizures', 'first seizure', 'first ever seizure', 'shaking uncontrollably', 'whole body shaking', 'body jerking', 'jerking movements', 'eyes rolled back', 'biting tongue', 'foaming at mouth', 'doray ka hamla', 'dorah', 'mirgi ka hamla', 'jism ka kaanpna', 'jism hil raha', 'pur jism kaanp raha', 'aankhein palat gayi', 'dorra padh gaya', 'dorra par gaya', 'دورہ پڑ گیا', 'مرگی کا حملہ', 'جسم کانپ رہا', 'آنکھیں پلٹ گئیں',
        ],
      },
    ],
    terms_en: ['active or prolonged seizure'],
    terms_ur: ['دورہ یا مرگی کا حملہ'],
    terms_roman: ['dorah ya mirgi ka hamla'],
    reason_template: {
      en: 'Active seizure, seizure over 5 minutes, repeated seizures, or first-ever seizure is an emergency — protect from injury, do not restrain, time the seizure, and call 1122.',
      ur: 'مستقل دورہ، 5 منٹ سے زیادہ دورہ، بار بار دورے، یا پہلا دورہ — ایمرجنسی ہے۔ زخم سے بچائیں، روکے نہیں، دورے کا وقت نوٹ کریں، اور 1122 پر کال کریں۔',
      roman: 'Mustaqil dorra, 5 minute se zyada dorra, baar baar doray, ya pehla dorra — emergency hai. Zakhm se bachayein, rokein nahin, dorray ka waqt note karein, aur 1122 par call karein.',
    },
    sources: ['WHO — Epilepsy management', 'ILAE — First-aid for seizures'],
  },
  {
    id: 'poisoning',
    category: 'poisoning',
    groups: [
      {
        terms: [
          'drank cleaning liquid', 'drank the cleaning', 'swallowed bleach', 'drank bleach', 'swallowed detergent', 'drank detergent', 'drank pesticide', 'swallowed pesticide', 'insecticide swallowed', 'rat poison', 'swallowed poison', 'took poison', 'snake bite', 'snakebite', 'scorpion sting', 'scorpion bite', 'spider bite', 'wasp sting on mouth', 'stung by bee on mouth', 'chemical splash in eye', 'inhaled chemical', 'carbon monoxide', 'gas leak', 'zahar khaya', 'zehr piya', 'zehr khaya', 'saanp kaat gaya', 'saanp ne kaata', 'bichhoo ne kaata', 'machar ne kaata', 'zeher pe gaya', 'khatmal ka zahar', 'zeher', 'cleaner pee gaya', 'saaf karne wala pe gaya', 'زہر کھا لیا', 'زہر پی گیا', 'زہر', 'سانپ نے کاٹا', 'بچھو نے کاٹا', 'کیمیکل پی گیا', 'صفائی والی چیز پی گئی',
        ],
      },
    ],
    terms_en: ['poisoning / snakebite / chemical ingestion'],
    terms_ur: ['زہر، سانپ کا کاٹا، یا کیمیکل کا استعمال'],
    terms_roman: ['zehr, saanp ka kaata, ya chemical ka istemal'],
    reason_template: {
      en: 'Poisoning, snakebite, or chemical ingestion is an emergency. Do NOT induce vomiting unless told by Poison Control. Call 1166 (Health Helpline) or 1122 now, and bring the container/bottle.',
      ur: 'زہر، سانپ کا کاٹا، یا کیمیکل کا استعمال ایمرجنسی ہے۔ زہر قے نہ کرائیں جب تک ہیلتھ ہیلپ لائن نہ کہے۔ فوراً 1166 (ہیلتھ ہیلپ لائن) یا 1122 پر کال کریں، اور بوتل/ڈبہ ساتھ لائیں۔',
      roman: 'Zehr, saanp ka kaata, ya chemical ka istemal emergency hai. Zehr qay na karayein jab tak health helpline na kahe. Fori 1166 (Health Helpline) ya 1122 par call karein, aur bottle/dabba saath layein.',
    },
    sources: ['WHO — Poisoning management', 'WHO — Snakebite envenoming'],
  },
  {
    id: 'anaphylaxis_severe',
    category: 'anaphylaxis',
    groups: [
      {
        terms: [
          'lips swelling', 'lip is swelling', 'lips are swelling', 'throat swelling', 'throat is closing', 'throat closing up', 'tongue swelling', 'tongue is swelling', 'tongue swelled up', 'face swelling rapidly', 'eyes swollen shut', 'widespread hives', 'hives all over', 'hives spreading fast', 'throat tight', 'throat feels tight', 'throat feels closed', 'cant swallow', "can't swallow", 'lips swollen hont phool', 'galay mein soojan', 'zabaan phool gayi', 'chehra phool gaya', 'galay mein khichao', 'galay ka band hona', 'ہونٹ پھول گئے', 'گلے میں سوجن', 'زبان پھول گئی', 'چہرہ پھول گیا', 'گلے میں کھنچاؤ',
        ],
      },
      {
        terms: [
          'after eating', 'after taking', 'food allergy', 'medicine allergy', 'peanut', 'shrimp', 'shellfish', 'bee sting', 'insect sting', 'khanay ke baad', 'dawai ke baad', 'kha kar', 'peenay ke baad', 'dawai lenay ke baad', 'کھانے کے بعد', 'دوا لینے کے بعد',
        ],
      },
    ],
    terms_en: ['anaphylaxis — lip/throat/tongue swelling after exposure'],
    terms_ur: ['کھانے یا دوا کے بعد ہونٹ/گلے/زبان کی سوجن'],
    terms_roman: ['khanay ya dawai ke baad hont/galay/zabaan ki soojan'],
    reason_template: {
      en: 'Rapid lip/throat/tongue swelling with trouble swallowing or breathing is anaphylaxis — a life-threatening allergic reaction. Call 1122, use an EpiPen if prescribed, lie flat with legs raised (unless breathing is hard, then sit up).',
      ur: 'کھانے یا دوا کے بعد ہونٹ، گلا یا زبان کی تیزی سے سوجن اور نگلنے یا سانس لینے میں مشکل — یہ جان لیوا الرجک ردعمل (انا فلیکسس) ہے۔ 1122 پر کال کریں، تجویز شدہ EpiPen استعمال کریں، لیٹ جائیں اور پاؤں اوپر اٹھائیں (اگر سانس مشکل ہو تو بیٹھ جائیں)۔',
      roman: 'Khanay ya dawai ke baad hont, gala ya zabaan ki tezi se soojan aur nigalne ya saans lene mein mushkil — yeh jaan lewa allergic reaction (anaphylaxis) hai. 1122 par call karein, tajweez-shuda EpiPen istemal karein, leit jayein aur paon oopar uthayein (agar saans mushkil ho to baith jayein).',
    },
    sources: ['WHO — Anaphylaxis', 'WAO — Anaphylaxis guidance'],
  },
  {
    id: 'sepsis_qsofa',
    category: 'sepsis',
    groups: [
      {
        terms: [
          'confused and fever', 'fever and confused', 'fever and drowsy', 'drowsy with fever', 'shivering uncontrollably', 'rigors', 'shaking with fever', 'very high fever and confused', 'fever and breathing fast', 'fast breathing with fever', 'fever and cold hands', 'cold hands with fever', 'mottled skin', 'skin looks mottled', 'rash that doesnt fade', "rash that doesn't fade", 'non-blanching rash', 'glass test rash', 'fever and not passing urine', 'no urine with fever', 'bukhar ke saath uljhan', 'bukhar aur neend', 'bukhar mein behosh', 'bukhar mein ghabrayi', 'bukhar aur tez saans', 'bukhar aur thande haath', 'بخار کے ساتھ الجھن', 'بخار اور نیند', 'بخار اور تیز سانس', 'بخار اور ٹھنڈے ہاتھ',
        ],
      },
    ],
    terms_en: ['sepsis signs — fever + confusion / fast breathing / cold extremities / non-blanching rash'],
    terms_ur: ['سیپسس کی علامات — بخار + الجھن / تیز سانس / ٹھنڈے ہاتھ / داغ نہ مٹنا'],
    terms_roman: ['sepsis ki alamaat — bukhar + uljhan / tez saans / thande haath / daagh na mitna'],
    reason_template: {
      en: 'Fever with confusion, fast breathing, cold hands, mottled skin, or a rash that does not fade under pressure are sepsis warning signs — a life-threatening infection. Call 1122 now.',
      ur: 'بخار کے ساتھ الجھن، تیز سانس، ٹھنڈے ہاتھ، دھبے دار جلد، یا دباؤ سے نہ مٹنے والا دانہ — یہ سیپسس (جان لیوا انفیکشن) کی علامات ہیں۔ فوراً 1122 پر کال کریں۔',
      roman: 'Bukhar ke saath uljhan, tez saans, thande haath, dhabay-daar jild, ya dabao se na mitne wala daana — yeh sepsis (jaan lewa infection) ki alamaat hain. Fori 1122 par call karein.',
    },
    sources: ['WHO — Sepsis', 'Surviving Sepsis Campaign — qSOFA'],
  },
  {
    id: 'domestic_violence',
    category: 'domestic-violence',
    groups: [
      {
        terms: [
          'my husband hits me', 'husband beats me', 'beats me', 'he hits me', 'she hits me', 'my wife hits me', 'physically abusive', 'domestic violence', 'im scared of my husband', "i'm scared of my husband", 'im scared of my wife', "i'm scared of my wife", 'he threatens me', 'she threatens me', 'threatened with a weapon', 'forced to', ' marital rape', ' controlling husband', 'controlling wife', 'mujhe marta hai', 'mujhe peetta hai', 'peet-ta hai', 'peetti hai', 'mujhe peet-ti hai', 'shohar peet-ta', 'biwi peet-ti', 'mujhe dhamki', 'mujhe dhamki di', 'haath uthata hai', 'haath uthati hai', 'mujhe maar dalega', 'mujhe maar dalegi', 'ghar mein tashadud', 'tashadud', 'مجھے مارتا ہے', 'مجھے پیٹتا ہے', 'شوہر پیٹتا ہے', 'مجھے دھمکی', 'گھر میں تشدد', 'تشدد',
        ],
      },
    ],
    terms_en: ['domestic violence disclosure'],
    terms_ur: ['گھریلو تشدد کا انکشاف'],
    terms_roman: ['gharelu tashadud ka inkishaf'],
    reason_template: {
      en: 'If you are being hurt or threatened, you are not alone and it is not your fault. In immediate danger, call 15 (Police). For women, call Madadgar 1099 (Women Helpline). Reach a safe place first. Your safety is the priority.',
      ur: 'اگر آپ کو نقصان پہنچایا جا رہا ہے یا دھمکی دی جا رہی ہے، تو آپ اکیلی نہیں ہیں اور یہ آپ کی غلطی نہیں۔ فوری خطرے میں 15 (پولیس) پر کال کریں۔ خواتین کے لیے مددگار 1099 (ویمن ہیلپ لائن) پر کال کریں۔ پہلے محفوظ جگہ پہنچیں۔ آپ کی حفاظت اولین ترجیح ہے۔',
      roman: 'Agar aap ko nuksan pahunchaya ja raha hai ya dhamki di ja rahi hai, to aap akeeli nahin hain aur yeh aap ki ghalati nahin. Fori khatre mein 15 (Police) par call karein. Khwateen ke liye Madadgar 1099 (Women Helpline) par call karein. Pehle mehfooz jagah pahunchain. Aap ki hifazat awwaleen tarjeeh hai.',
    },
    sources: ['UN Women — Violence against women', 'WHO — Intimate partner violence'],
  },
  {
    id: 'pediatric_imci_danger',
    category: 'pediatric-imci',
    groups: [
      {
        terms: [
          'child unable to drink', 'baby unable to drink', 'child not drinking', 'baby not drinking', 'refusing to drink', 'child is lethargic', 'baby is lethargic', 'child wont wake', "child won't wake", 'baby wont wake', "baby won't wake", 'child is limp', 'baby is limp', 'floppy baby', 'child vomits everything', 'baby vomits everything', 'convulsion in child', 'convulsion in baby', 'child had a convulsion', 'baby had a convulsion', 'child chest in-drawing', 'chest in-drawing', 'child breathing fast', 'baby breathing fast', 'grunting baby', 'grunting child', 'nasal flaring baby', 'child severe chest indrawing', 'baccha peena nahi peeta', 'bacha peene se inkaar', 'bacha behosh', 'bacha son nahi', 'baccha bimaar', 'bachay ka dorra', 'bachay mein dorra', 'bachay ki saans tez', 'bacha kamzor', 'بچہ پینا نہیں پیتا', 'بچہ بےہوش', 'بچے کا دورہ', 'بچے کی سانس تیز', 'بچہ کمزور',
        ],
      },
    ],
    terms_en: ['WHO IMCI child danger sign'],
    terms_ur: ['بچے کے عالمی ادارہ صحت کے خطرے کی علامت'],
    terms_roman: ['bachay ke WHO khatre ki alamat (IMCI)'],
    reason_template: {
      en: 'These are WHO IMCI danger signs in a child — unable to drink, lethargic, convulsion, chest in-drawing, fast breathing, or vomiting everything. Take the child to a health facility NOW.',
      ur: 'یہ بچے میں عالمی ادارہ صحت (IMCI) کے خطرے کی علامات ہیں — پینے سے انکار، سستی، دورہ، چھاتی دھنسنا، تیز سانس، یا سب کچھ الٹنا۔ بچے کو فوراً ہسپتال لے جائیں۔',
      roman: 'Yeh bachay mein WHO (IMCI) ke khatre ki alamaat hain — peene se inkaar, susti, dorra, chhaati dhansna, tez saans, ya sab kuch ultana. Bachay ko fori hospital le jayein.',
    },
    sources: ['WHO — Integrated Management of Childhood Illness (IMCI)'],
  },
  {
    id: 'pregnancy_severe_emergency',
    category: 'obstetric-emergency',
    groups: [
      {
        terms: [
          'pregnant and bleeding', 'pregnant bleeding', 'bleeding in pregnancy', 'bleeding while pregnant', 'pregnant with severe headache', 'pregnant severe headache', 'pregnant and blurry vision', 'pregnant vision change', 'pregnant and seizure', 'seizure in pregnancy', 'pregnant and convulsion', 'pregnant and severe abdominal pain', 'pregnant severe belly pain', 'pregnant and fever', 'high fever in pregnancy', 'pregnant water broke with meconium', 'pregnant and reduced movement', 'hamal ke saath khoon', 'hamla aur khoon', 'hamal mein khoon behna', 'hamal mein sakht sar dard', 'hamal mein dorra', 'hamal mein nazar dhundla', 'حمل کے ساتھ خون', 'حمل میں شدید سر درد', 'حمل میں دورہ', 'حمل میں نظر دھندلا',
        ],
      },
    ],
    terms_en: ['severe pregnancy emergency — bleeding / severe headache / seizure / vision change'],
    terms_ur: ['شدید حمل ایمرجنسی — خون / شدید سر درد / دورہ / نظر بدلنا'],
    terms_roman: ['shadeed hamal emergency — khoon / sakht sar dard / dorra / nazar badalna'],
    reason_template: {
      en: 'Bleeding, severe headache with vision change, seizure, or severe abdominal pain in pregnancy are obstetric emergencies — call 1122, lie on your left side, do not insert anything vaginally.',
      ur: 'حمل میں خون بہنا، نظر کے ساتھ شدید سر درد، دورہ، یا شدید پیٹ کا درد— ایمرجنسی ہے۔ 1122 پر کال کریں، بائیں کرو لیٹ جائیں، اندر کچھ نہ ڈالیں۔',
      roman: 'Hamal mein khoon behna, nazar ke saath sakht sar dard, dorra, ya sakht pait ka dard — emergency hai. 1122 par call karein, baen karou leit jayein, andar kuch na daalein.',
    },
    sources: ['WHO — Maternal danger signs', 'WHO — Managing complications in pregnancy'],
  },
];

// Severity modifiers — raise urgency when present
export const SEVERITY_MODIFIERS: ModifierTerm[] = [
  {
    id: 'duration_long',
    terms: ['3 din se', '3 dinon se', 'teen din se', 'char din se', '4 din se', '5 din se', 'paanch din se', 'chhe din se', '6 din se', 'hafte se', 'haftay se', 'ek hafta', 'one week', 'two weeks', 'do hafte', '3 دن سے', 'چار دن سے', 'پانچ دن سے', 'ایک ہفتے سے', 'دو ہفتے سے', 'many days', 'kai dinon se', '3 days', '4 days', '5 days', '6 days', '7 days'],
    boost: 1,
  },
  {
    id: 'intensity_severe',
    terms: ['bohot sakht', 'bohat sakht', 'bohot zyada', 'bohat zyada', 'bardasht nahi', 'unbearable', 'excruciating', 'severe', 'بہت شدید', 'برداشت نہیں', 'بہت زیادہ'],
    boost: 1,
  },
  {
    id: 'bleeding_present',
    terms: ['khoon aa raha', 'khoon beh raha', 'khoon gir raha', 'khoon beh', 'bleeding heavily', 'bleeding a lot', 'is bleeding', 'bleeding wont stop', 'blood in stool', 'blood in the stool', 'bloody diarrhea', 'black stool', 'stool is black', 'vomiting blood', 'khoon ki ulti', 'pet se khoon', 'khoon ki dast', 'kaali peshab', 'خون آ رہا', 'خون بہہ رہا', 'خون کی الٹی', 'خون کی دست'],
    boost: 1,
  },
  {
    id: 'breathing_severe',
    terms: ['saans nahi aa rahi', 'saans nhi aa rahi', 'saans nahi aa rhi', 'saans phool gayi', 'saans ruk rahi hai', 'cant breathe', "can't breathe", 'cannot breathe', 'unable to breathe', 'struggling to breathe', 'struggling to breath', 'gasping', 'gasping for air', 'cant catch my breath', "can't catch my breath", 'cant catch breath', "can't catch breath", 'cant get air', "can't get air", 'cant get enough air', "can't get enough air", 'breathing is really hard', 'really hard to breathe', 'very hard to breathe', 'hard to breathe', 'wheezing badly', 'wheezing severe', 'wheezing a lot', 'severe wheezing', 'bad wheezing', 'severe breathing difficulty', 'severe difficulty breathing', 'severe shortness of breath', 'blue lips', 'lips are blue', 'lips turned blue', 'turning blue', 'face turning blue', 'cyanosis', 'inhaled smoke', 'smoke inhalation', 'hont neelay', 'neele hont', 'neela ho raha', 'neeli ho rahi', 'سانس نہیں آ رہی', 'سانس پھول گئی', 'ہونٹ نیلے', 'چہرہ نیلا'],
    boost: 2,
  },
  {
    id: 'high_risk_person',
    terms: ['hamal', 'pregnant', 'pregnancy', 'حمل', 'mujhe sugar hai', 'diabetes', 'sugar ka mareez', 'blood pressure hai', 'bp ka mareez', 'hypertension', 'heart patient', 'dil ka mareez', 'دل کا مریض'],
    boost: 1,
  },
];

export const EMERGENCY_NUMBERS = [
  { label: 'Rescue 1122 (Ambulance)', number: '1122' },
  { label: 'Alkhidmat Ambulance', number: '1023' },
  { label: 'Edhi Ambulance', number: '115' },
  // Phase 0 (W10 fix) — mental-health crisis lines
  { label: 'Pakistan Health & Polio Helpline', number: '1166' },
  { label: 'Madadgar Women Helpline', number: '1099' },
  { label: 'Umang Child Protection Line', number: '1152' },
  { label: 'Police Emergency', number: '15' },
  // Pakistan Association for Mental Health (PAMH) — varies by city; surfaced in the
  // mental-health template's "encourage professional help" line rather than a single
  // national number. Local crisis-line DB is a future enhancement (P1).
];
