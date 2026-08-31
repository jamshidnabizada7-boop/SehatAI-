import type { EmergencyTemplate } from '@/lib/types';

// ============================================================
// SehatAI — Emergency response templates
// PRE-WRITTEN AND REVIEWED. These are the ONLY content shown
// for emergencies — the LLM is NEVER involved (Decision D3).
// Deterministic, sub-second, never hallucinated.
// ============================================================

export const EMERGENCY_TEMPLATES: EmergencyTemplate[] = [
  {
    patternCategory: 'cardiac',
    title: {
      en: 'Possible heart emergency — act now',
      ur: 'ممکنہ دل کی ایمرجنسی — فوری اقدام کریں',
      roman: 'Mumkina dil ki emergency — fori iqdam karein',
    },
    reasonIntro: {
      en: 'Chest pain with breathing difficulty matches WHO emergency warning signs.',
      ur: 'سینے کا درد اور سانس لینے میں مشکل عالمی ادارہ صحت کی ایمرجنسی علامات سے ملتے ہیں۔',
      roman: 'Seene ka dard aur saans lene mein mushkil WHO ki emergency alamaat se milti hain.',
    },
    immediateActions: [
      {
        en: 'Call 1122 (Rescue) or 1023 (Alkhidmat Ambulance) immediately — do not drive yourself.',
        ur: 'فوراً 1122 (ریسکیو) یا 1023 (الخدمت ایمبولینس) پر کال کریں — خود گاڑی نہ چلائیں۔',
        roman: 'Fori tor par 1122 (Rescue) ya 1023 (Alkhidmat Ambulance) par call karein — khud gaari na chalayein.',
      },
      {
        en: 'Sit down, stay calm and loosen tight clothing.',
        ur: 'بیٹھ جائیں، پرسکون رہیں اور تنگ کپڑے ڈھیلیے کریں۔',
        roman: 'Baith jayein, pursakoon rahein aur tang kapray dheelay karein.',
      },
      {
        en: 'If previously prescribed aspirin for heart disease, follow medical advice; do not start any new medicine on your own.',
        ur: 'اگر پہلے سے دل کی بیماری کی دوا تجویز ہو تو ڈاکٹر کی ہدایت پر عمل کریں؛ اپنی مرضی سے کوئی نئی دوا نہ لیں۔',
        roman: 'Agar pehle se dil ki bimari ki dawa tayoon ho to doctor ki hidayat par amal karein; apni marzi se koi nayi dawa na lein.',
      },
      {
        en: 'If breathing stops, someone trained should begin CPR.',
        ur: 'اگر سانس رک جائے تو تربیت یافتہ شخص سی پی آر شروع کرے۔',
        roman: 'Agar saans ruk jaye to tarbiyat-yafta shakhs CPR shuru kare.',
      },
    ],
    doNot: [
      {
        en: 'Do not walk around or exert yourself.',
        ur: 'اِدھر اُدھر مت پھریں اور زور نہ لگائیں۔',
        roman: 'Idhar udhar mat phirein aur zor na lagayein.',
      },
      {
        en: 'Do not ignore it or wait for it to pass.',
        ur: 'اسے نظرانداز نہ کریں اور خود بخود ٹھیک ہونے کا انتظار نہ کریں۔',
        roman: 'Ise nazar-andaz na karein aur khud-ba-khud theek hone ka intezar na karein.',
      },
    ],
    sources: ['WHO — Cardiovascular diseases', 'WHO EMRO — Emergency care'],
  },
  {
    patternCategory: 'stroke',
    title: {
      en: 'Possible stroke — every minute matters',
      ur: 'ممکنہ فالج (اسٹروک) — ہر منٹ اہم ہے',
      roman: 'Mumkina faalij (stroke) — har minute aham hai',
    },
    reasonIntro: {
      en: 'Sudden face drooping, arm weakness or speech difficulty are FAST stroke signs.',
      ur: 'اچانک چہرہ ٹیڑھا ہونا، بازو کی کمزوری یا بولنے میں مشکل — یہ فالج کی علامات ہیں۔',
      roman: 'Achanak chehra tedha hona, baazu ki kamzori ya bolne mein mushkil — yeh faalij ki alamaat hain.',
    },
    immediateActions: [
      {
        en: 'Call 1122 or 1023 (Alkhidmat Ambulance) immediately and say you suspect a stroke.',
        ur: 'فوراً 1122 یا 1023 (الخدمت ایمبولینس) پر کال کریں اور بتائیں کہ آپ کو فالج کا شبہ ہے۔',
        roman: 'Fori tor par 1122 ya 1023 (Alkhidmat Ambulance) par call karein aur batayein ke aap ko faalij ka shuba hai.',
      },
      {
        en: 'Note the exact time symptoms started — this affects treatment.',
        ur: 'علامات شروع ہونے کا صحیح وقت یاد رکھیں — علاج پر اثر انداز ہوتا ہے۔',
        roman: 'Alamaat shuru hone ka sahi waqt yaad rakhein — ilaaj par asar andaaz hota hai.',
      },
      {
        en: 'Lay the person on their side, keep them calm and nothing by mouth.',
        ur: 'مریض کو کروٹ پر لٹائیں، پرسکون رکھیں اور منہ میں کچھ نہ دیں۔',
        roman: 'Mareez ko karwat par litayein, pursakoon rakhein aur moonh mein kuch na dein.',
      },
    ],
    doNot: [
      {
        en: 'Do not give food, water or medicines by mouth.',
        ur: 'منہ سے کھانا، پانی یا دوا نہ دیں۔',
        roman: 'Moonh se khana, paani ya dawa na dein.',
      },
      {
        en: 'Do not wait to see if it improves on its own.',
        ur: 'خود بخود بہتری کا انتظار نہ کریں۔',
        roman: 'Khud-ba-khud behtari ka intezar na karein.',
      },
    ],
    sources: ['WHO — Stroke key facts', 'FAST criteria'],
  },
  {
    patternCategory: 'bleeding',
    title: {
      en: 'Severe bleeding — control it now',
      ur: 'شدید خون بہنا — فوری قابو کریں',
      roman: 'Shadeed khoon behna — fori qaboo karein',
    },
    reasonIntro: {
      en: 'Heavy or uncontrolled bleeding can become life-threatening within minutes.',
      ur: 'بہت زیادہ یا بےقابو خون منٹوں میں جان لیوا ہو سکتا ہے۔',
      roman: 'Bohot zyada ya be-qaboo khoon minute mein jaan lewa ho sakta hai.',
    },
    immediateActions: [
      {
        en: 'Press hard on the wound with a clean cloth and keep pressing.',
        ur: 'صاف کپڑے سے زخم پر زور سے دباؤ ڈالیں اور دباؤ جاری رکھیں۔',
        roman: 'Saaf kapray se zakhm par zor se dabao dalayein aur dabao jari rakhein.',
      },
      {
        en: 'Raise the injured limb above heart level if possible.',
        ur: 'اگر ممکن ہو تو زخمی حصہ دل کی سطح سے اوپر اٹھائیں۔',
        roman: 'Agar mumkin ho to zakhmi hissa dil ki satah se oopar uthayein.',
      },
      {
        en: 'Call 1122 or 1023 (Alkhidmat Ambulance) and keep the person warm and lying down.',
        ur: '1122 یا 1023 (الخدمت ایمبولینس) پر کال کریں اور مریض کو گرم رکھیں اور لٹائیں۔',
        roman: '1122 ya 1023 (Alkhidmat Ambulance) par call karein aur mareez ko garam rakhein aur litayein.',
      },
    ],
    doNot: [
      {
        en: 'Do not remove soaked dressings — add new cloth on top.',
        ur: 'خون سے بھیگے کپڑے نہ ہٹائیں — اوپر نیا کپڑا باندھیں۔',
        roman: 'Khoon se bheegay kapray na hatayein — oopar naya kapra bandhein.',
      },
    ],
    sources: ['IFRC — First aid for severe bleeding'],
  },
  {
    patternCategory: 'unconscious',
    title: {
      en: 'Unresponsive person — emergency',
      ur: 'بےہوش شخص — ایمرجنسی',
      roman: 'Behosh shakhs — emergency',
    },
    reasonIntro: {
      en: 'Loss of consciousness always needs immediate medical assessment.',
      ur: 'بےہوشی ہمیشہ فوری طبی معائنے کی ضرورت رکھتی ہے۔',
      roman: 'Behoshi hamesha fori tibbi muaine ki zaroorat rakhti hai.',
    },
    immediateActions: [
      {
        en: 'Check breathing; if absent or abnormal, call 1122 or 1023 (Alkhidmat Ambulance) and start CPR if trained.',
        ur: 'سانس چیک کریں؛ اگر نہ ہو یا غیرمعمولی ہو تو 1122 یا 1023 (الخدمت ایمبولینس) پر کال کریں اور تربیت ہو تو سی پی آر شروع کریں۔',
        roman: 'Saans check karein; agar na ho ya ghair-mamooli ho to 1122 ya 1023 (Alkhidmat Ambulance) par call karein aur tarbiyat ho to CPR shuru karein.',
      },
      {
        en: 'If breathing, roll the person onto their side (recovery position).',
        ur: 'اگر سانس چل رہی ہو تو شخص کو کروٹ پر لٹائیں (ریکوری پوزیشن)۔',
        roman: 'Agar saans chal rahi ho to shakhs ko karwat par litayein (recovery position).',
      },
      {
        en: 'Loosen tight clothing and keep the airway clear.',
        ur: 'تنگ کپڑے ڈھیلے کریں اور سانس کی نالی صاف رکھیں۔',
        roman: 'Tang kapray dheelay karein aur saans ki nali saaf rakhein.',
      },
    ],
    doNot: [
      {
        en: 'Do not give any food or water to an unconscious person.',
        ur: 'بےہوش شخص کو کھانا یا پانی نہ دیں۔',
        roman: 'Behosh shakhs ko khana ya paani na dein.',
      },
    ],
    sources: ['WHO EMRO — Emergency care', 'IFRC — Basic life support'],
  },
  {
    patternCategory: 'convulsions',
    title: {
      en: 'Seizure — protect the person',
      ur: 'دورہ — شخص کی حفاظت کریں',
      roman: 'Dora — shakhs ki hifazat karein',
    },
    reasonIntro: {
      en: 'A seizure needs emergency evaluation, especially if prolonged or repeated.',
      ur: 'دورے کے لیے ایمرجنسی معائنہ ضروری ہے، خاص طور پر طویل یا بار بار ہونے پر۔',
      roman: 'Doray ke liye emergency muaina zaroori hai, khaas tor par taweel ya baar baar hone par.',
    },
    immediateActions: [
      {
        en: 'Time the seizure; call 1122 if it lasts over 5 minutes or repeats.',
        ur: 'دورے کا وقت نوٹ کریں؛ اگر 5 منٹ سے زیادہ رہے یا دہرائے تو 1122 پر کال کریں۔',
        roman: "Doray ka waqt note karein; agar 5 minute se zyada rahe ya dohraye to 1122 par call karein.",
      },
      {
        en: 'Cushion the head, clear hard/sharp objects away.',
        ur: 'سر کے نیچے کچھ نرم رکھیں، سخت اور تیز چیزیں دور کریں۔',
        roman: 'Sar ke neeche kuch naram rakhein, sakht aur teez cheezain door karein.',
      },
      {
        en: 'After it stops, roll the person onto their side.',
        ur: 'دورہ رکنے کے بعد شخص کو کروٹ پر لٹا دیں۔',
        roman: 'Dora rukne ke baad shakhs ko karwat par lita dein.',
      },
    ],
    doNot: [
      {
        en: 'Do NOT hold the person down or put anything in their mouth.',
        ur: 'شخص کو زبردستی نہ روکیں اور منہ میں کچھ نہ ڈالیں۔',
        roman: 'Shakhs ko zabardasti na rokein aur moonh mein kuch na dalein.',
      },
    ],
    sources: ['WHO — Epilepsy', 'IFRC — First aid for seizures'],
  },
  {
    patternCategory: 'obstetric-bleeding',
    title: {
      en: 'Bleeding in pregnancy — go to a facility NOW',
      ur: 'حمل میں خون آنا — فوراً ہسپتال جائیں',
      roman: 'Hamal mein khoon aana — fori hospital jayein',
    },
    reasonIntro: {
      en: 'Bleeding during pregnancy is a WHO maternal danger sign.',
      ur: 'حمل کے دوران خون کا آنا عالمی ادارہ صحت کا خطرے کا اشارہ ہے۔',
      roman: 'Hamal ke doran khoon ka aana WHO ka khatre ka ishara hai.',
    },
    immediateActions: [
      {
        en: 'Go to the nearest hospital or maternity unit immediately — take transport, do not walk far.',
        ur: 'قریب ترین ہسپتال یا میٹرنٹی ہوم فوراً جائیں — سواری لیں، زیادہ پیدل نہ چلیں۔',
        roman: 'Qareeb tareen hospital ya maternity home fori jayein — sawari lein, zyada paidal na chalein.',
      },
      {
        en: 'Call 1122 if you cannot arrange transport.',
        ur: 'اگر سواری کا انتظام نہ ہو سکے تو 1122 پر کال کریں۔',
        roman: 'Agar sawari ka intezam na ho sake to 1122 par call karein.',
      },
      {
        en: 'Rest lying on your side; note if bleeding is heavy or with clots.',
        ur: 'کروٹ پر لیٹ کر آرام کریں؛ نوٹ کریں خون زیادہ ہے یا لوتھڑوں کے ساتھ۔',
        roman: 'Karwat par lait kar aaraam karein; note karein khoon zyada hai ya lothron ke saath.',
      },
    ],
    doNot: [
      {
        en: 'Do not wait for bleeding to stop on its own.',
        ur: 'خون کے خود بخود رکنے کا انتظار نہ کریں۔',
        roman: 'Khoon ke khud-ba-khud rukne ka intezar na karein.',
      },
    ],
    sources: ['WHO — Maternal danger signs', 'WHO — Pregnancy complications'],
  },
  {
    patternCategory: 'obstetric-preeclampsia',
    title: {
      en: 'Danger signs of high blood pressure in pregnancy — get checked NOW',
      ur: 'حمل میں بلڈ پریشر کے خطرے کے признаки — فوراً معائنہ کروائیں',
      roman: 'Hamal mein blood pressure ke khatre ki alamaat — fori muaina karwayein',
    },
    reasonIntro: {
      en: 'Severe headache, blurred vision or swelling of face/hands in pregnancy can mean pre-eclampsia.',
      ur: 'حمل میں شدید سر درد، دھندلا دکھنا یا چہرے/ہاتھوں کی سوجن پری ایکلامپسیا کی علامت ہو سکتی ہے۔',
      roman: 'Hamal mein sakht sar dard, dhundla dekhna ya chehre/haathon ki soojan pre-eclampsia ki alamat ho sakti hai.',
    },
    immediateActions: [
      {
        en: 'Go to the nearest health facility today for blood pressure and urine testing.',
        ur: 'آج ہی قریب ترین ہسپتال جائیں اور بلڈ پریشر اور پیشاب کا ٹیسٹ کروائیں۔',
        roman: 'Aaj hi qareeb tareen hospital jayein aur blood pressure aur peshab ka test karwayein.',
      },
      {
        en: 'If headache is severe, vision changes or pain under ribs — treat as emergency, call 1122.',
        ur: 'اگر سر درد شدید ہو، نظر میں تبدیلی یا پسلیوں کے نیچے درد ہو — اسے ایمرجنسی سمجھیں، 1122 پر کال کریں۔',
        roman: 'Agar sar dard shadeed ho, nazar mein tabdeeli ya pasliyon ke neeche dard ho — ise emergency samjhein, 1122 par call karein.',
      },
    ],
    doNot: [
      {
        en: 'Do not take any medicine (including painkillers) without a doctor’s advice in pregnancy.',
        ur: 'حمل میں ڈاکٹر کے مشورے کے بغائر کوئی دوا (بشمول درد کی گولی) نہ لیں۔'.replace('بغائر', 'بغیر'),
        roman: 'Hamal mein doctor ke mashwaray ke baghair koi dawa (bashamool dard ki goli) na lein.',
      },
    ],
    sources: ['WHO — Pre-eclampsia and eclampsia'],
  },
  {
    patternCategory: 'pediatric',
    title: {
      en: 'Child danger sign — take the child to a facility NOW',
      ur: 'بچے میں خطرے کی علامت — فوراً ہسپتال لے جائیں',
      roman: 'Bachay mein khatre ki alamat — fori hospital le jayein',
    },
    reasonIntro: {
      en: 'WHO/UNICEF list these as child danger signs requiring immediate care.',
      ur: 'عالمی ادارہ صحت/یونیسیف کے مطابق یہ بچوں کے خطرے کی علامات ہیں جن کے لیے فوری طبی امداد ضروری ہے۔',
      roman: 'WHO/UNICEF ke mutabiq yeh bachon ke khatre ki alamaat hain jin ke liye fori tibbi imdad zaroori hai.',
    },
    immediateActions: [
      {
        en: 'Take the child to the nearest health facility or call 1122 immediately.',
        ur: 'بچے کو قریب ترین ہسپتال لے جائیں یا فوراً 1122 پر کال کریں۔',
        roman: 'Bachay ko qareeb tareen hospital le jayein ya fori tor par 1122 par call karein.',
      },
      {
        en: 'Keep the child calm, sitting upright if breathing is hard; continue breastfeeding if the child can drink.',
        ur: 'بچے کو پرسکون رکھیں، اگر سانس مشکل ہو تو سیدھا بٹھائیں؛ اگر بچہ پی سکتا ہے تو دودھ جاری رکھیں۔',
        roman: 'Bachay ko pursakoon rakhein, agar saans mushkil ho to seedha bithayein; agar bacha pee sakta hai to doodh jari rakhein.',
      },
      {
        en: 'If the child cannot drink at all, turns blue or is unresponsive — this is a maximum emergency.',
        ur: 'اگر بچہ بالکل نہ پی سکے، نیلا پڑ جائے یا ہوش میں نہ ہو — یہ انتہائی ایمرجنسی ہے۔',
        roman: 'Agar bacha bilkul na pee sake, neela par jaye ya hosh mein na ho — yeh intehai emergency hai.',
      },
    ],
    doNot: [
      {
        en: 'Do not give any medicine without a health worker’s guidance.',
        ur: 'ہیلتھ ورکر کی ہدایت کے بغیر کوئی دوا نہ دیں۔',
        roman: 'Health worker ki hidayat ke baghair koi dawa na dein.',
      },
    ],
    sources: ['WHO/UNICEF — Danger signs in children', 'WHO IMCI'],
  },
  {
    patternCategory: 'dehydration',
    title: {
      en: 'Severe dehydration — urgent care needed',
      ur: 'شدید پانی کی کمی — فوری طبی امداد درکار',
      roman: 'Shadeed pani ki kami — fori tibbi imdad darkar',
    },
    reasonIntro: {
      en: 'Sunken eyes, no urine or extreme lethargy indicate severe dehydration.',
      ur: 'آنکھوں کا دھنسنا، پیشاب نہ آنا یا شدید سستی شدید پانی کی کمی ظاہر کرتے ہیں۔',
      roman: 'Aankhon ka dhansna, peshab na aana ya shadeed susti shadeed pani ki kami zahir karte hain.',
    },
    immediateActions: [
      {
        en: 'Start ORS (oral rehydration salts) in small, frequent sips right away.',
        ur: 'فوراً او آر ایس (نمکیات کا شربت) تھوڑا تھوڑا کر کے بار بار پلائیں۔',
        roman: 'Fori tor par ORS (namkiyat ka sharbat) thora thora kar ke baar baar pilayein.',
      },
      {
        en: 'Go to a health facility urgently — a drip may be needed. If you cannot get there quickly, call 1122 (Rescue).',
        ur: 'فوری طور پر ہسپتال جائیں — ڈرپ کی ضرورت ہو سکتی ہے۔ اگر جلد پہنچ نہیں سکتے تو 1122 (ریسکیو) پر کال کریں۔',
        roman: 'Fori tor par hospital jayein — drip ki zaroorat ho sakti hai. Agar jald pohanch nahin sakte to 1122 (Rescue) par call karein.',
      },
      {
        en: 'Continue breastfeeding for infants.',
        ur: 'شیرخوار بچوں کے لیے دودھ جاری رکھیں۔',
        roman: 'Shir-khwar bachon ke liye doodh jari rakhein.',
      },
    ],
    doNot: [
      {
        en: 'Do not give only plain water in large amounts — use ORS.',
        ur: 'صرف سادہ پانی زیادہ مقدار میں نہ دیں — او آر ایس استعمال کریں۔',
        roman: 'Sirf sada paani zyada miqdaar mein na dein — ORS istemal karein.',
      },
    ],
    sources: ['WHO — Diarrhoea treatment: ORS'],
  },
  {
    patternCategory: 'poisoning',
    title: {
      en: 'Possible poisoning — emergency',
      ur: 'ممکنہ زہر آلودگی — ایمرجنسی',
      roman: 'Mumkina zeher aaloodgi — emergency',
    },
    reasonIntro: {
      en: 'Swallowed poison or medicine overdose needs immediate hospital care.',
      ur: 'زہر یا زیادہ دوا کھانے کے لیے فوری ہسپتال کی ضرورت ہے۔',
      roman: 'Zeher ya zyada dawa khane ke liye fori hospital ki zaroorat hai.',
    },
    immediateActions: [
      {
        en: 'Call 1122 or 1023 (Alkhidmat Ambulance) or go to the nearest emergency room immediately.',
        ur: 'فوراً 1122 یا 1023 (الخدمت ایمبولینس) پر کال کریں یا قریب ترین ایمرجنسی وارڈ جائیں۔',
        roman: 'Fori tor par 1122 ya 1023 (Alkhidmat Ambulance) par call karein ya qareeb tareen emergency ward jayein.',
      },
      {
        en: 'Take the container/strip of what was swallowed with you.',
        ur: 'جو چیزیں کھائی گئی تھی اس کا ڈبہ/سٹرپ اپنے ساتھ لے جائیں۔',
        roman: 'Jo cheez khayi gayi thi us ka dabba/strip apne saath le jayein.',
      },
      {
        en: 'Keep the person on their side if drowsy or vomiting.',
        ur: 'اگر شخص سستی محسوس کرے یا متلی ہو تو اسے کروٹ پر لٹائیں۔',
        roman: 'Agar shakhs susti mehsoos kare ya matli ho to use karwat par litayein.',
      },
    ],
    doNot: [
      {
        en: 'Do NOT induce vomiting or give milk/salt water unless medical staff instruct.',
        ur: 'طبی عملے کے کہنے کے بغیر متلی نہ کریں نہ دودھ/نمکین پانی دیں۔',
        roman: 'Tibbi amlay ke kehne ke baghair matli na karein na doodh/namkeen paani dein.',
      },
    ],
    sources: ['IFRC — First aid for poisoning'],
  },
  {
    patternCategory: 'snakebite',
    title: {
      en: 'Snake bite — hospital now',
      ur: 'سانپ کا کاٹنا — فوراً ہسپتال',
      roman: 'Saanp ka kaatna — fori hospital',
    },
    reasonIntro: {
      en: 'Snake bites need anti-venom, which is only available at hospitals.',
      ur: 'سانپ کے کاٹنے کا علاج اینٹی وینم سے ہوتا ہے جو صرف ہسپتال میں دستیاب ہے۔',
      roman: 'Saanp ke kaatne ka ilaaj anti-venom se hota hai jo sirf hospital mein dastiyab hai.',
    },
    immediateActions: [
      {
        en: 'Keep the bitten limb COMPLETELY still and lower than the heart.',
        ur: 'کٹا ہوا حصہ بالکل ساکن اور دل سے نیچے رکھیں۔',
        roman: 'Kata hua hissa bilkul sakin aur dil se neeche rakhein.',
      },
      {
        en: 'Remove rings/tight items, go to the hospital fast — call 1122.',
        ur: 'انگوٹھی/تنگ چیزیں اتار دیں، جلد ہسپتال پہنچیں — 1122 پر کال کریں۔',
        roman: 'Angoothi/tang cheezain utaar dein, jald hospital pohanchein — 1122 par call karein.',
      },
      {
        en: 'If safe, note the snake’s appearance — do not try to catch it.',
        ur: 'اگر محفوظ ہو تو سانپ کی شکل نوٹ کریں — اسے پکڑنے کی کوشش نہ کریں۔',
        roman: 'Agar mehfooz ho to saanp ki shakal note karein — use pakarne ki koshish na karein.',
      },
    ],
    doNot: [
      {
        en: 'Do NOT cut, suck, or apply a tourniquet or ice to the bite.',
        ur: 'زخم کو کاٹیں نہیں، چوسیں نہیں، نہ پٹی کسے یا برف لگائیں۔',
        roman: 'Zakhm ko kaatein nahi, choosein nahi, na patti kase ya barf lagayein.',
      },
    ],
    sources: ['WHO — Snakebite envenoming'],
  },
  {
    patternCategory: 'burns',
    title: {
      en: 'Severe burn — cool it and get help',
      ur: 'شدید جلن — ٹھنڈا کریں اور مدد لیں',
      roman: 'Shadeed jaln — thanda karein aur madad lein',
    },
    reasonIntro: {
      en: 'Large or deep burns need emergency medical treatment.',
      ur: 'بڑے یا گہرے جلنے کے زخم ایمرجنسی طبی علاج کے متقاضی ہیں۔',
      roman: 'Baray ya gehray jalne ke zakhm emergency tibbi ilaaj ke mutaqazi hain.',
    },
    immediateActions: [
      {
        en: 'Cool the burn under clean running water for 10–20 minutes.',
        ur: 'صاف بہتے پانی کے نیچے 10 سے 20 منٹ زخم ٹھنڈا کریں۔',
        roman: 'Saaf bahta pani ke neeche 10 se 20 minute zakhm thanda karein.',
      },
      {
        en: 'Remove jewellery near the burn before swelling starts.',
        ur: 'سوجن شروع ہونے سے پہلے زخم کے قریب کے زیورات اتار دیں۔',
        roman: 'Soojan shuru hone se pehle zakhm ke qareeb ke zewar utaar dein.',
      },
      {
        en: 'Cover loosely with clean cloth or cling film; go to a hospital — call 1122 or 1023 (Alkhidmat Ambulance) for large burns.',
        ur: 'صاف کپڑے یا کلنگ فلم سے ڈھیلے ڈھانپ دیں؛ ہسپتال جائیں — بڑے زخموں پر 1122 یا 1023 (الخدمت ایمبولینس) پر کال کریں۔',
        roman: 'Saaf kapray ya cling film se dheelay dhaanp dein; hospital jayein — baray zakham par 1122 ya 1023 (Alkhidmat Ambulance) par call karein.',
      },
    ],
    doNot: [
      {
        en: 'Do NOT apply toothpaste, ghee, oil, henna or ice.',
        ur: 'ٹوتھ پیسٹ، گھی، تیل، مہندی یا برف ہرگز نہ لگائیں۔',
        roman: 'Toothpaste, ghee, tail, mehndi ya barf hargiz na lagayein.',
      },
      {
        en: 'Do not burst blisters.',
        ur: 'پھوسیاں پھوڑیں نہیں۔',
        roman: 'Phosiyan phodein nahi.',
      },
    ],
    sources: ['IFRC — First aid for burns'],
  },
  {
    patternCategory: 'meningitis',
    title: {
      en: 'Stiff neck with fever — emergency assessment',
      ur: 'گردن کی سختی اور بخار — فوری معائنہ',
      roman: 'Gardan ki sakhti aur bukhar — fori muaina',
    },
    reasonIntro: {
      en: 'A stiff neck with fever and headache can indicate meningitis.',
      ur: 'بخار اور سر درد کے ساتھ گردن کی سختی میننجائٹس کی علامت ہو سکتی ہے۔',
      roman: 'Bukhar aur sar dard ke saath gardan ki sakhti meningitis ki alamat ho sakti hai.',
    },
    immediateActions: [
      {
        en: 'Go to a hospital emergency department immediately.',
        ur: 'فوراً ہسپتال کے ایمرجنسی وارڈ جائیں۔',
        roman: 'Fori tor par hospital ke emergency ward jayein.',
      },
      {
        en: 'Call 1122 for transport if you cannot reach a hospital quickly.',
        ur: 'اگر جلد ہسپتال نہیں پہنچ سکتے تو سواری کے لیے 1122 پر کال کریں۔',
        roman: 'Agar jald hospital nahi pohanch sakte to sawari ke liye 1122 par call karein.',
      },
    ],
    doNot: [
      {
        en: 'Do not delay — meningitis can worsen within hours.',
        ur: 'تاخیر نہ کریں — میننجائٹس گھنٹوں میں بگڑ سکتا ہے۔',
        roman: 'Taakheer na karein — meningitis ghanton mein bigar sakta hai.',
      },
    ],
    sources: ['WHO — Meningitis fact sheet'],
  },
  {
    patternCategory: 'mental-health',
    title: {
      en: 'You matter — support is available right now',
      ur: 'آپ اہم ہیں — مدد ابھی دستیاب ہے',
      roman: 'Aap aham hain — madad abhi dastiyab hai',
    },
    reasonIntro: {
      en: 'Thank you for sharing this. Your safety comes first.',
      ur: 'یہ بتانے کے لیے شکریہ۔ آپ کی حفاظت سب سے پہلے ہے۔',
      roman: 'Yeh batane ke liye shukriya. Aap ki hifazat sab se pehle hai.',
    },
    immediateActions: [
      {
        en: 'Talk to someone you trust right now — a family member, friend, or neighbour — and ask them to stay with you.',
        ur: 'ابھی کسی قابلِ بھروسہ شخص سے بات کریں — گھر والا، دوست یا پڑوسی — اور ان سے کہیں کہ آپ کے ساتھ رہیں۔',
        roman: 'Abhi kisi qabil-e-bharosa shakhs se baat karein — ghar wala, dost ya parosi — aur un se kahein ke aap ke saath rahein.',
      },
      {
        en: 'Call Pakistan Health & Polio Helpline 1166 (free, 24/7) — they can listen and guide you.',
        ur: 'پاکستان ہیلتھ اینڈ پولیو ہیلپ لائن 1166 پر کال کریں (مفت، 24/7) — وہ آپ کی بات سنتے ہیں اور رہنمائی کرتے ہیں۔',
        roman: 'Pakistan Health & Polio Helpline 1166 par call karein (muft, 24/7) — woh aap ki baat sunte hain aur rahnumai karte hain.',
      },
      {
        en: 'For women in distress, call Madadgar Women Helpline 1099 (free). For a child, call Umang 1152.',
        ur: 'پریشان خواتین کے لیے مددگار ویمن ہیلپ لائن 1099 (مفت) پر کال کریں۔ بچے کے لیے امان 1152 پر کال کریں۔',
        roman: 'Preshan khwateen ke liye Madadgar Women Helpline 1099 (muft) par call karein. Bachay ke liye Umang 1152 par call karein.',
      },
      {
        en: 'If you feel you may act on these thoughts right now, call 1122 or go to the nearest emergency room.',
        ur: 'اگر آپ کو لگتا ہے کہ آپ ابھی یہ قدم اٹھا سکتے ہیں تو 1122 پر کال کریں یا قریب ترین ایمرجنسی وارڈ جائیں۔',
        roman: 'Agar aap ko lagta hai ke aap abhi yeh qadam utha sakte hain to 1122 par call karein ya qareeb tareen emergency ward jayein.',
      },
      {
        en: 'Remove access to means (medicines, sharp objects) if you can do so safely.',
        ur: 'اگر محفوظ طریقے سے ہو سکے تو آلات (دوائیں، تیز اشیاء) دور کر دیں۔',
        roman: 'Agar mehfooz tareeqe se ho sake to aalaat (dawayein, tez ashia) door kar dein.',
      },
    ],
    doNot: [
      {
        en: 'You do not have to face this alone. Please reach out — people want to help.',
        ur: 'آپ کو یہ اکیلے نہیں جھیلنا۔ براہ کرم کسی سے رابطہ کریں — لوگ مدد کرنا چاہتے ہیں۔',
        roman: 'Aap ko yeh akele nahin jhelna. Barah-e-karam kisi se rabta karein — log madad karna chahte hain.',
      },
      {
        en: 'Do not use alcohol or other substances to cope with these feelings.',
        ur: 'ان احساسات سے نمٹنے کے لیے شراب یا دیگر مادے استعمال نہ کریں۔',
        roman: 'In ehsasat se niptane ke liye sharaab ya deegar maaday istemal na karein.',
      },
    ],
    sources: ['WHO — Suicide prevention', 'Umang Mental Health Helpline 1152', 'Madadgar Women Helpline 1099', 'Pakistan Health Helpline 1166'],
  },
  {
    patternCategory: 'anaphylaxis',
    title: {
      en: 'Severe allergic reaction — emergency',
      ur: 'شدید الرجی — ایمرجنسی',
      roman: 'Shadeed allergy — emergency',
    },
    reasonIntro: {
      en: 'Swelling with breathing difficulty can be anaphylaxis — it can worsen very fast.',
      ur: 'سوجن کے ساتھ سانس لینے میں مشکل شدید الرجی ہو سکتی ہے — یہ بہت تیزی سے بڑھ سکتی ہے۔',
      roman: 'Soojan ke saath saans lene mein mushkil shadeed allergy ho sakti hai — yeh bohot tezi se barh sakti hai.',
    },
    immediateActions: [
      {
        en: 'Call 1122 immediately — say “severe allergic reaction”.',
        ur: 'فوراً 1122 پر کال کریں — بتائیں "شدید الرجی" ہے۔',
        roman: 'Fori tor par 1122 par call karein — batayein "shadeed allergy" hai.',
      },
      {
        en: 'If an adrenaline auto-injector was prescribed before, use it as directed on the outer thigh.',
        ur: 'اگر پہلے سے ایڈرینالین انجیکٹر تجویز ہے تو ران کے باہری حصے پر ہدایت کے مطابق استعمال کریں۔',
        roman: 'Agar pehle se adrenaline injector tayoon hai to raan ke bahari hissay par hidayat ke mutabiq istemal karein.',
      },
      {
        en: 'Sit the person upright; lie flat only if breathing is very hard or faint.',
        ur: 'شخص کو سیدھا بٹھائیں؛ صرف اگر سانس بہت مشکل ہو یا بےہوشی آئے تو لٹائیں۔',
        roman: 'Shakhs ko seedha bithayein; sirf agar saans bohot mushkil ho ya behoshi aaye to litayein.',
      },
    ],
    doNot: [
      {
        en: 'Do not wait to see if swelling settles — go to hospital even if it improves.',
        ur: 'سوجن کے اترنے کا انتظار نہ کریں — بہتری کے باوجود ہسپتال جائیں۔',
        roman: 'Soojan ke utarne ka intezar na karein — behtari ke bawajood hospital jayein.',
      },
    ],
    sources: ['WHO — Anaphylaxis', 'IFRC — Allergic reactions'],
  },
  {
    patternCategory: 'head-injury',
    title: {
      en: 'Head injury with warning signs — emergency',
      ur: 'سر کی چوٹ کے ساتھ خطرے کی علامات — ایمرجنسی',
      roman: 'Sar ki chot ke saath khatray ki alamaat — emergency',
    },
    reasonIntro: {
      en: 'Vomiting, drowsiness or confusion after a head injury can mean bleeding or swelling in the brain.',
      ur: 'سر کی چوٹ کے بعد الٹی، سستی یا الجھن دماغ میں خون کی رسی یا سوجن کی علامت ہو سکتی ہے۔',
      roman: 'Sar ki chot ke baad ulti, susti ya uljhan dimagh mein khoon ki rassi ya soojan ki alamat ho sakti hai.',
    },
    immediateActions: [
      {
        en: 'Call 1122 or 1023 (Alkhidmat Ambulance) or go to the nearest emergency department NOW.',
        ur: 'فوراً 1122 پر کال کریں یا قریب ترین ایمرجنسی وارڈ جائیں۔',
        roman: 'Fori tor par 1122 par call karein ya qareeb tareen emergency ward jayein.',
      },
      {
        en: 'Keep the person still; if drowsy but breathing, roll them onto their side.',
        ur: 'شخص کو ساکن رکھیں؛ اگر سستا ہو مگر سانس چل رہی ہو تو کروٹ پر لٹائیں۔',
        roman: 'Shakhs ko sakin rakhein; agar susta ho magar saans chal rahi ho to karwat par litayein.',
      },
      {
        en: 'Watch breathing and wakefulness until help arrives.',
        ur: 'مدد آنے تک سانس اور ہوش پر نظر رکھیں۔',
        roman: 'Madad aane tak saans aur hosh par nazar rakhein.',
      },
    ],
    doNot: [
      {
        en: 'Do NOT give food, water or medicine if the person is drowsy.',
        ur: 'شخص سستا ہو تو کھانا، پانی یا دوا نہ دیں۔',
        roman: 'Shakhs susta ho to khana, paani ya dawa na dein.',
      },
      {
        en: 'Do not move the person unnecessarily and do not apply pressure to the head wound.',
        ur: 'شخص کو بے ضرورت نہ ہلائیں اور زخم پر دباؤ نہ دیں۔',
        roman: 'Shakhs ko bay-zaroorat na hilayein aur zakhm par dabao na dein.',
      },
    ],
    sources: ['WHO — Traumatic brain injury', 'IFRC — Head injury first aid'],
  },
  {
    patternCategory: 'abdominal',
    title: {
      en: 'Severe abdominal pain — urgent evaluation',
      ur: 'شدید پیٹ درد — فوری معائنہ',
      roman: 'Shadeed pet dard — fori muaina',
    },
    reasonIntro: {
      en: 'Unbearable abdominal pain can signal conditions needing urgent treatment.',
      ur: 'ناقابل برداشت پیٹ درد ایسی حالت کی علامت ہو سکتا ہے جس کے لیے فوری علاج درکار ہے۔',
      roman: 'Na-qabil-e-bardasht pet dard aisi halat ki alamat ho sakta hai jis ke liye fori ilaaj darkar hai.',
    },
    immediateActions: [
      {
        en: 'Arrange to reach a hospital emergency today — call 1122 for transport if needed.',
        ur: 'آج ہی ہسپتال ایمرجنسی پہنچنے کا انتظام کریں — ضرورت ہو تو 1122 پر کال کریں۔',
        roman: 'Aaj hi hospital emergency pohanchne ka intezam karein — zaroorat ho to 1122 par call karein.',
      },
      {
        en: 'Do not eat or drink until a doctor has examined you.',
        ur: 'ڈاکٹر کے معائنے تک کچھ کھائیں یا پییں نہیں۔',
        roman: 'Doctor ke muaine tak kuch khayein ya piyein nahi.',
      },
      {
        en: 'Note where the pain is, when it started and what makes it worse.',
        ur: 'نوٹ کریں درد کہاں ہے، کب شروع ہوا اور کس چیز سے بڑھتا ہے۔',
        roman: 'Note karein dard kahan hai, kab shuru hua aur kis cheez se barhta hai.',
      },
    ],
    doNot: [
      {
        en: 'Do not take painkillers before examination — they can mask the diagnosis.',
        ur: 'معائنے سے پہلے درد کی گولیاں نہ لیں — یہ تشخیص چھپا سکتی ہیں۔',
        roman: 'Muaine se pehle dard ki goliyan na lein — yeh tashkhees chhupa sakti hain.',
      },
    ],
    sources: ['WHO EMRO — Emergency care'],
  },
  {
    // Spinal / neck trauma after an accident or fall — movement can worsen
    // spinal cord injury. Selected whenever trauma mechanism co-occurs with
    // neck/back injury or numbness/paralysis signs.
    patternCategory: 'spine-trauma',
    title: {
      en: 'Possible neck or spine injury — keep still',
      ur: 'گردن یا ریڑھ کی ہڈی کی ممکنہ چوٹ — بالکل ساکن رہیں',
      roman: 'Gardan ya reedh ki haddi ki mumkina chot — bilkul saakin rahein',
    },
    reasonIntro: {
      en: 'After a fall or accident, neck or back pain, numbness, or being unable to move/feel limbs can mean a spine injury — moving the wrong way can make it permanent.',
      ur: 'گرنے یا حادثے کے بعد گردن یا کمر کا درد، سن پن، یا ہاتھ پاؤں نہ ہلانا/محسوس نہ کرنا ریڑھ کی ہڈی کی چوٹ کی علامت ہو سکتا ہے — غلط حرکت اسے مستقل نقصان بنا سکتی ہے۔',
      roman: 'Girne ya hadse ke baad gardan ya kamar ka dard, sun pan, ya haath paon na hilana/mehsoos na karna reedh ki haddi ki chot ki alamat ho sakti hai — galt harkat ise mustaqil nuqsan bana sakti hai.',
    },
    immediateActions: [
      {
        en: 'Call 1122 (Rescue) or 1023 (Alkhidmat Ambulance) now — do not try to travel by yourself.',
        ur: 'ابھی 1122 (ریسکیو) یا 1023 (الخدمت ایمبولینس) پر کال کریں — خود سفر کرنے کی کوشش نہ کریں۔',
        roman: 'Abhi 1122 (Rescue) ya 1023 (Alkhidmat Ambulance) par call karein — khud safar karne ki koshish na karein.',
      },
      {
        en: 'Stay exactly where you are and keep your neck and back completely still.',
        ur: 'بالکل وہیں رکے رہیں اور گردن اور کمر کو مکمل طور پر ساکن رکھیں۔',
        roman: 'Bilkul wahin ruke rahein aur gardan aur kamar ko mukammal tor par saakin rakhein.',
      },
      {
        en: 'If someone is with you, ask them to gently support your head and neck in the position found.',
        ur: 'اگر کوئی آپ کے ساتھ ہے تو اس سے کہیں کہ آپ کے سر اور گردن کو اسی حالت میں نرمی سے سہارا دے۔',
        roman: 'Agar koi aap ke saath hai to us se kahein ke aap ke sar aur gardan ko isi halat mein narmi se sahara de.',
      },
      {
        en: 'If breathing stops, a trained person should start CPR, moving the head as little as possible.',
        ur: 'اگر سانس رک جائے تو تربیت یافتہ شخص سی پی آر شروع کرے، سر کو جتنا ہو سکے کم ہلائے۔',
        roman: 'Agar saans ruk jaye to tarbiyat-yafta shakhs CPR shuru kare, sar ko jitna ho sake kam hilaye.',
      },
    ],
    doNot: [
      {
        en: 'Do NOT move, twist, sit up or walk — no matter how much it hurts.',
        ur: 'حرکت نہ کریں، نہ مڑیں، نہ بیٹھیں، نہ چلیں — خواہ درد کتنا ہی ہو۔',
        roman: 'Harkat na karein, na mudrein, na baithen, na chalen — khawah dard kitna hi ho.',
      },
      {
        en: 'Do not massage or apply heat/ointment to the neck or back.',
        ur: 'گردن یا کمر پر مالش یا گرمی/مرہم نہ لگائیں۔',
        roman: 'Gardan ya kamar par maalish ya garmi/maraham na lagayein.',
      },
      {
        en: 'Do not eat or drink in case surgery is needed.',
        ur: 'کسی صورت آپریشن کی ضرورت ہو سکتی ہے — کچھ کھائیں یا پییں نہیں۔',
        roman: 'Kisi soorat operation ki zaroorat ho sakti hai — kuch khayein ya piyein nahi.',
      },
    ],
    sources: ['WHO — Trauma care guidance', 'IFRC — Spinal injury first aid'],
  },
  {
    // Blunt chest trauma (vehicle impact, fall, blow to the chest) — risk of
    // pneumothorax, cardiac contusion, rib fractures.
    patternCategory: 'chest-trauma',
    title: {
      en: 'Chest injury — emergency assessment needed',
      ur: 'سینے کی چوٹ — فوری طبی معائنہ ضروری',
      roman: 'Seene ki chot — fori tibbi muaina zaroori',
    },
    reasonIntro: {
      en: 'Chest pain after an accident, fall or blow can mean injured ribs, a bruised lung or heart — this needs a hospital assessment now.',
      ur: 'حادثے، گرنے یا ضرب کے بعد سینے کا درد پسلیوں، پھیپھڑے یا دل کی چوٹ کی علامت ہو سکتا ہے — ابھی ہسپتال میں معائنہ ضروری ہے۔',
      roman: 'Hadse, girne ya zarb ke baad seene ka dard pasliyon, phaingron ya dil ki chot ki alamat ho sakta hai — abhi hospital mein muaina zaroori hai.',
    },
    immediateActions: [
      {
        en: 'Call 1122 (Rescue) or 1023 (Alkhidmat Ambulance) now and tell them it is a chest injury after an accident.',
        ur: 'ابھی 1122 (ریسکیو) یا 1023 (الخدمت ایمبولینس) پر کال کریں اور بتائیں کہ حادثے کے بعد سینے کی چوٹ ہے۔',
        roman: 'Abhi 1122 (Rescue) ya 1023 (Alkhidmat Ambulance) par call karein aur batayein ke hadse ke baad seene ki chot hai.',
      },
      {
        en: 'Sit upright, leaning slightly forward — this usually makes breathing easiest.',
        ur: 'سیدھے بیٹھیں اور ہلکا سا آگے جھکیں — اس سے سانس لینا عام طور پر آسان ہوتا ہے۔',
        roman: 'Seedhay baithen aur halka sa aagay jhukhein — is se saans lena aam tor par aasan hota hai.',
      },
      {
        en: 'Breathe gently and rest; loosen tight clothing.',
        ur: 'آرام سے سانس لیں اور آرام کریں؛ تنگ کپڑے ڈھیلے کریں۔',
        roman: 'Aaraam se saans lein aur aaraam karein; tang kapray dheelay karein.',
      },
      {
        en: 'If breathing becomes very difficult or stops, call again and have someone trained start CPR.',
        ur: 'اگر سانس لینا بہت مشکل ہو جائے یا رک جائے تو دوبارہ کال کریں اور تربیت یافتہ شخص سی پی آر شروع کرے۔',
        roman: 'Agar saans lena bohot mushkil ho jaye ya ruk jaye to dobara call karein aur tarbiyat-yafta shakhs CPR shuru kare.',
      },
    ],
    doNot: [
      {
        en: 'Do not lie flat or walk around.',
        ur: 'چٹ کے نہ لیٹیں اور ادھر اُدھر نہ پھریں۔',
        roman: 'Chit ke na letein aur idhar udhar na phirein.',
      },
      {
        en: 'Do not eat or drink in case surgery is needed.',
        ur: 'آپریشن کی صورت میں کچھ کھائیں یا پییں نہیں۔',
        roman: 'Operation ki soorat mein kuch khayein ya piyein nahi.',
      },
      {
        en: 'Do not take painkillers before being examined.',
        ur: 'معائنے سے پہلے درد کی دوا نہ لیں۔',
        roman: 'Muaine se pehle dard ki dawa na lein.',
      },
    ],
    sources: ['WHO — Trauma care guidance', 'IFRC — Chest injury first aid'],
  },
  {
    // Diabetic emergency: very high/low glucose with confusion or extreme
    // sleepiness (DKA / hypoglycemia patterns).
    patternCategory: 'diabetic-emergency',
    title: {
      en: 'Possible diabetic emergency — act now',
      ur: 'ممکنہ ذیابیطس ایمرجنسی — فوری اقدام کریں',
      roman: 'Mumkina diabetes emergency — fori iqdam karein',
    },
    reasonIntro: {
      en: 'Confusion or extreme sleepiness in someone with diabetes (or a very high/low sugar reading) can be a diabetic emergency — it needs treatment now, not later.',
      ur: 'ذیابیطس میں الجھن یا حد سے زیادہ نیند (یا بہت زیادہ/کم شوگر ریڈنگ) ذیابیطس ایمرجنسی ہو سکتی ہے — اسے ابھی علاج چاہیے، بعد میں نہیں۔',
      roman: 'Diabetes mein uljhan ya had se zyada neend (ya bohot zyada/kam sugar reading) diabetic emergency ho sakti hai — ise abhi ilaaj chahiye, baad mein nahi.',
    },
    immediateActions: [
      {
        en: 'Call 1122 (Rescue) or go to the emergency department now — do not wait or sleep it off.',
        ur: 'ابھی 1122 (ریسکیو) پر کال کریں یا ایمرجنسی نشست جائیں — انتظار نہ کریں اور نہ ہی سو کر ٹھیک ہونے کی امید رکھیں۔',
        roman: 'Abhi 1122 (Rescue) par call karein ya emergency department jayein — intezar na karein aur na hi so kar theek hone ki umeed rakhein.',
      },
      {
        en: 'If the person is fully awake and able to swallow safely, give sips of water.',
        ur: 'اگر شخص مکمل ہوش میں ہو اور محفوظ طریقے سے نگل سکتا ہو تو گھونٹ گھونٹ پانی دیں۔',
        roman: 'Agar shakhs mukammal hosh mein ho aur mehfooz tareeqe se nigal sakta ho to ghoont ghoont paani dein.',
      },
      {
        en: 'If you suspect LOW sugar (sweating, shakiness, sudden confusion) and the person can swallow, a small sugary drink may help while waiting for the ambulance.',
        ur: 'اگر آپ کو کم شوگر کا شبہ ہو (پسینہ، کپکپی، اچانک الجھن) اور شخص نگل سکتا ہو تو ایمبولینس کے انتظار میں تھوڑی میٹھی چیز دینا مددگار ہو سکتا ہے۔',
        roman: 'Agar aap ko kam sugar ka shuba ho (paseena, kapkapi, achanak uljhan) aur shakhs nigal sakta ho to ambulance ke intezar mein thori meethi cheez dena madadgar ho sakta hai.',
      },
      {
        en: 'If a glucose meter is available, check and write down the reading — tell it to the medics.',
        ur: 'اگر شوگر میٹر موجود ہو تو ریڈنگ چیک کریں اور لکھ لیں — طبی عملے کو بتائیں۔',
        roman: 'Agar sugar meter maujood ho to reading check karein aur likh lein — tibbi amlay ko batayein.',
      },
    ],
    doNot: [
      {
        en: 'Do NOT give any food, drink or sugar if the person is very drowsy or cannot swallow.',
        ur: 'اگر شخص بہت سست ہو یا نگل نہ سکے تو کچھ بھی کھانا، پانی یا چینی نہ دیں۔',
        roman: 'Agar shakhs bohot sust ho ya nigal na sake to kuch bhi khana, paani ya cheeni na dein.',
      },
      {
        en: 'Do not take extra insulin or medicines on your own now.',
        ur: 'اپنی مرضی سے ابھی اضافی انسولین یا دوا نہ لیں۔',
        roman: 'Apni marzi se abhi izafi insulin ya dawa na lein.',
      },
    ],
    sources: ['WHO — Diabetes emergency care', 'International Diabetes Federation — DKA/hypoglycemia'],
  },
  {
    // Generic emergency fallback: used when emergency signs are detected but
    // the scenario is not specific. Never gives instructions that assume an
    // unconscious person unless the person actually reported unconsciousness.
    patternCategory: 'general-emergency',
    title: {
      en: 'Emergency signs — get help now',
      ur: 'ایمرجنسی علامات — ابھی مدد حاصل کریں',
      roman: 'Emergency alamaat — abhi madad haasil karein',
    },
    reasonIntro: {
      en: 'What you describe may be a medical emergency. It needs immediate professional assessment.',
      ur: 'جو آپ بتا رہے ہیں وہ طبی ایمرجنسی ہو سکتی ہے۔ اس کے لیے فوری پیشہ ورانہ معائنہ ضروری ہے۔',
      roman: 'Jo aap bata rahein hain woh tibbi emergency ho sakti hai. Is ke liye fori peshawarana muaina zaroori hai.',
    },
    immediateActions: [
      {
        en: 'Call 1122 (Rescue) now — or have someone take you to the nearest emergency department.',
        ur: 'ابھی 1122 (ریسکیو) پر کال کریں — یا کسی سے کہیں کہ آپ کو قریب ترین ایمرجنسی نشست لے جائے۔',
        roman: 'Abhi 1122 (Rescue) par call karein — ya kisi se kahein ke aap ko qareeb tareen emergency department le jaye.',
      },
      {
        en: 'Stay with the person; keep them still and comfortable.',
        ur: 'مریض کے ساتھ رہیں؛ اسے ساکن اور آرام دہ رکھیں۔',
        roman: 'Mareez ke saath rahein; ise saakin aur aaraam-dah rakhein.',
      },
      {
        en: 'Tell the medics exactly what happened, when it started and what the person can or cannot do.',
        ur: 'طبی عملے کو بالکل بتائیں کہ کیا ہوا، کب شروع ہوا اور مریض کیا کر سکتا ہے اور کیا نہیں۔',
        roman: 'Tibbi amlay ko bilkul batayein ke kya hua, kab shuru hua aur mareez kya kar sakta hai aur kya nahi.',
      },
      {
        en: 'If the person becomes unconscious and stops breathing normally, someone trained should start CPR.',
        ur: 'اگر مریض بےہوش ہو جائے اور سانس رک جائے تو تربیت یافتہ شخص سی پی آر شروع کرے۔',
        roman: 'Agar mareez behosh ho jaye aur saans ruk jaye to tarbiyat-yafta shakhs CPR shuru kare.',
      },
    ],
    doNot: [
      {
        en: 'Do not wait to see if it improves on its own.',
        ur: 'خود بخود بہتری کا انتظار نہ کریں۔',
        roman: 'Khud-ba-khud behtari ka intezar na karein.',
      },
      {
        en: 'Do not give food, drink or medicines unless professionals advise it.',
        ur: 'ماہرین کے کہنے پر ہی کھانا، پانی یا دوا دیں۔',
        roman: 'Mahireen ke kehne par hi khana, paani ya dawa dein.',
      },
    ],
    sources: ['WHO EMRO — Emergency care'],
  },
  {
    // Choking / blocked airway. Covers BOTH states honestly: the first
    // action tells a person who can still cough to keep coughing; back
    // blows + abdominal thrusts follow for complete obstruction. It never
    // assumes unconsciousness, but the last action covers that transition.
    patternCategory: 'choking',
    title: {
      en: 'Choking — act now',
      ur: 'گلا پھنسا — فوری اقدام کریں',
      roman: 'Gala phansa — fori iqdam karein',
    },
    reasonIntro: {
      en: 'A blocked airway from choking is immediately life-threatening — first aid must start right now.',
      ur: 'گلے میں کچھ پھنس جانے سے سانس کی نالی بند ہو سکتی ہے — یہ فوراً جان لیوا ہے، ابتدائی امداد ابھی شروع کریں۔',
      roman: 'Galay mein kuch phans jane se saans ki nali band ho sakti hai — yeh fori tor par jaan lewa hai, ibtidai imdad abhi shuru karein.',
    },
    immediateActions: [
      {
        en: 'If the person can still cough, speak or breathe — encourage them to keep coughing hard and stay calm.',
        ur: 'اگر شخص کھانسی کر سکتا ہے، بول سکتا ہے یا سانس لے سکتا ہے — اسے زور سے کھانسی جاری رکھنے کی ترغیب دیں اور پرسکون رکھیں۔',
        roman: 'Agar shakhs khansi kar sakta hai, bol sakta hai ya saans le sakta hai — ise zor se khansi jari rakhne ki targheeb dein aur pursakoon rakhein.',
      },
      {
        en: 'If they cannot cough, speak or breathe: give 5 firm back blows between the shoulder blades with the heel of your hand.',
        ur: 'اگر کھانسی، بولنے یا سانس نہ لے سکے: ہاتھ کی ایڑی سے کندھوں کی ہڈیوں کے درمیان 5 مضبوط ضربیں پیٹھ پر لگائیں۔',
        roman: 'Agar khansi, bolne ya saans na le sake: haath ki airi se kandhon ki haddiyon ke darmiyan 5 mazboot zarbain peeth par lagayein.',
      },
      {
        en: 'Then give 5 abdominal thrusts (above the navel, pulling inward and upward). For a child under 1 year, use chest thrusts instead.',
        ur: 'پھر پیٹ پر 5 دھچکے دیں (ناف کے اوپر، اندر اور اوپر کی طرف)۔ ایک سال سے کم بچے کے لیے سینے پر دھچکے دیں۔',
        roman: 'Phir pet par 5 dhachke dein (naaf ke oopar, andar aur oopar ki taraf). Aik saal se kam bachay ke liye seenay par dhachke dein.',
      },
      {
        en: 'Call 1122 (Rescue) immediately — keep alternating back blows and abdominal thrusts until help arrives or the object comes out.',
        ur: 'فوراً 1122 (ریسکیو) پر کال کریں — مدد پہنچنے یا چیزیں نکلنے تک پیٹھ کی ضربیں اور پیٹ کے دھچکے بدلتے رہیں۔',
        roman: 'Fori tor par 1122 (Rescue) par call karein — madad pohanchne ya cheez nikalne tak peeth ki zarbain aur pet ke dhachke badalte rahein.',
      },
      {
        en: 'If the person becomes unconscious and is not breathing normally, someone trained should begin CPR.',
        ur: 'اگر شخص بےہوش ہو جائے اور سانس معمول سے نہ لے رہا ہو تو تربیت یافتہ شخص سی پی آر شروع کرے۔',
        roman: 'Agar shakhs behosh ho jaye aur saans mamool se na le raha ho to tarbiyat-yafta shakhs CPR shuru kare.',
      },
    ],
    doNot: [
      {
        en: 'Do not slap the back of someone who is upright and coughing effectively.',
        ur: 'جوش سے کھانسی کرنے والے کھڑے شخص کی پیٹھ پر تھپڑ نہ ماریں۔',
        roman: 'Zor se khansi karne wale khare shakhs ki peeth par thapar na marein.',
      },
      {
        en: 'Do not try to pull the object out with fingers — you can push it deeper.',
        ur: 'انگلیوں سے چیزیں نکالنے کی کوشش نہ کریں — یہ مزید اندر جا سکتی ہے۔',
        roman: 'Ungliyon se cheez nikalne ki koshish na karein — yeh mazeed andar ja sakti hai.',
      },
      {
        en: 'Do not give water or food while the airway may still be blocked.',
        ur: 'جب تک نالی بند ہو سکتی ہے پانی یا کھانا نہ دیں۔',
        roman: 'Jab tak nali band ho sakti hai paani ya khana na dein.',
      },
    ],
    sources: ['IFRC — First aid for choking', 'WHO — Basic emergency care'],
  },
  {
    // Non-bleeding maternal danger signs: reduced fetal movement, leaking
    // fluid (PPROM risk), severe pain in pregnancy. Bleeding in pregnancy
    // uses the obstetric-bleeding template; headache/vision/swelling uses
    // obstetric-preeclampsia.
    patternCategory: 'obstetric-emergency',
    title: {
      en: 'Possible pregnancy emergency — go now',
      ur: 'ممکنہ حمل کی ایمرجنسی — ابھی جائیں',
      roman: 'Mumkina hamal ki emergency — abhi jayein',
    },
    reasonIntro: {
      en: 'What you describe matches maternal danger signs (reduced baby movement, leaking fluid, or severe pain) — this needs emergency assessment now.',
      ur: 'جو آپ بتا رہی ہیں وہ حمل کے خطرے کی علامات سے ملتا ہے (بچے کی حرکت کم، پانی کا اٹھنا، یا شدید درد) — اس کے لیے فوری ایمرجنسی معائنہ ضروری ہے۔',
      roman: 'Jo aap bata rahi hain woh hamal ke khatre ki alamaat se milta hai (bachay ki harkat kam, pani ka uthna, ya shadeed dard) — is ke liye fori emergency muaina zaroori hai.',
    },
    immediateActions: [
      {
        en: 'Go to the nearest hospital with maternity services NOW, or call 1122 (Rescue) — do not wait for it to improve.',
        ur: 'ابھی قریب ترین میٹرنٹی سہولت والے ہسپتال جائیں، یا 1122 (ریسکیو) پر کال کریں — بہتری کا انتظار نہ کریں۔',
        roman: 'Abhi qareeb tareen maternity sahoolat wale hospital jayein, ya 1122 (Rescue) par call karein — behtari ka intezar na karein.',
      },
      {
        en: 'Note what time the symptom started and how it has changed — the medical team will need this.',
        ur: 'نوٹ کریں کہ علامت کب شروع ہوئی اور کیسے بدلی — طبی ٹیم کو یہ معلومات درکار ہوں گی۔',
        roman: 'Note karein ke alamat kab shuru hui aur kaisay badli — tibbi team ko yeh maloomat darkar hongi.',
      },
      {
        en: 'If you feel the baby moving, count the movements on the way and tell the staff.',
        ur: 'اگر بچے کی حرکت محسوس ہو راستے میں اس کی گنتی کریں اور عملے کو بتائیں۔',
        roman: 'Agar bachay ki harkat mehsoos ho raastay mein is ki ginti karein aur amlay ko batayein.',
      },
      {
        en: 'Do not eat or drink in case urgent examination or treatment is needed.',
        ur: 'کیونکہ فوری معائنہ یا علاج درکار ہو سکتا ہے، کچھ کھائیں یا پییں نہیں۔',
        roman: 'Kyunke fori muaina ya ilaaj darkar ho sakta hai, kuch khayein ya piyein nahin.',
      },
    ],
    doNot: [
      {
        en: 'Do not try to treat this at home or wait until the next day.',
        ur: 'اسے گھر پر ٹھیک کرنے کی کوشش نہ کریں اور اگلے دن کا انتظار نہ کریں۔',
        roman: 'Ise ghar par theek karne ki koshish na karein aur aglay din ka intezar na karein.',
      },
      {
        en: 'Do not take any medicine unless the hospital staff gives it.',
        ur: 'ہسپتال کے عملے کے دیے بغیر کوئی دوا نہ لیں۔',
        roman: 'Hospital ke amlay ke diye baghair koi dawa na lein.',
      },
    ],
    sources: ['WHO — Maternal danger signs', 'WHO — Pregnancy, childbirth guideline'],
  },
  // ============================================================
  // Phase 0/1 — EXPANDED EMERGENCY TEMPLATES (W10 + emergency red-team)
  // ============================================================
  {
    patternCategory: 'seizure',
    title: {
      en: 'Seizure — keep them safe',
      ur: 'دورہ — انہیں محفوظ رکھیں',
      roman: 'Dorra — inhein mehfooz rakhein',
    },
    reasonIntro: {
      en: 'An active seizure, one lasting over 5 minutes, repeated seizures, or a first-ever seizure needs emergency care.',
      ur: 'مستقل دورہ، 5 منٹ سے زیادہ دورہ، بار بار دورے، یا پہلا دورہ — ایمرجنسی درکار۔',
      roman: 'Mustaqil dorra, 5 minute se zyada dorra, baar baar doray, ya pehla dorra — emergency darkaar.',
    },
    immediateActions: [
      {
        en: 'Clear the area of hard/sharp objects; cushion the head.',
        ur: 'سخت/تیز اشیاء ہٹا دیں؛ سر کے نیچے کمرا رکھیں۔',
        roman: 'Sakht/tez ashia hata dein; sar ke neechay kamar rakhein.',
      },
      {
        en: 'Time the seizure — call 1122 if it lasts over 5 minutes, repeats, or is the first ever.',
        ur: 'دورے کا وقت نوٹ کریں — 5 منٹ سے زیادہ، دہرایا، یا پہلا ہو تو 1122 پر کال کریں۔',
        roman: 'Dorray ka waqt note karein — 5 minute se zyada, dohraya, ya pehla ho to 1122 par call karein.',
      },
      {
        en: 'Once shaking stops, roll them onto their side (recovery position).',
        ur: 'جب کانپنا رک جائے تو بائیں کرو پھیر دیں۔',
        roman: 'Jab kaanpna ruk jaye to baen karou phir dein.',
      },
    ],
    doNot: [
      {
        en: 'Do not restrain them or hold them down.',
        ur: 'انہیں نہ روکیں اور نہ دبائیں۔',
        roman: 'Inhein na rokein aur na dabayein.',
      },
      {
        en: 'Do not put anything in their mouth.',
        ur: 'ان کے منہ میں کچھ نہ ڈالیں۔',
        roman: 'Un ke munh mein kuch na daalein.',
      },
      {
        en: 'Do not give food or water until fully alert.',
        ur: 'پوری طرح ہوش میں آنے تک کھانا یا پانی نہ دیں۔',
        roman: 'Poori tarah hosh mein anay tak khana ya pani na dein.',
      },
    ],
    sources: ['WHO — Epilepsy management', 'ILAE — First-aid for seizures'],
  },
  {
    patternCategory: 'sepsis',
    title: {
      en: 'Possible sepsis — act now',
      ur: 'ممکنہ سیپسس — فوری اقدام کریں',
      roman: 'Mumkina sepsis — fori iqdam karein',
    },
    reasonIntro: {
      en: 'Fever with confusion, fast breathing, cold extremities, mottled skin, or a non-blanching rash are sepsis warning signs.',
      ur: 'بخار کے ساتھ الجھن، تیز سانس، ٹھنڈے ہاتھ، دھبے دار جلد، یا دباؤ سے نہ مٹنے والا دانہ — سیپسس کی علامات۔',
      roman: 'Bukhar ke saath uljhan, tez saans, thande haath, dhabay-daar jild, ya dabao se na mitne wala daana — sepsis ki alamaat.',
    },
    immediateActions: [
      {
        en: 'Call 1122 now — say "I think this could be sepsis."',
        ur: 'فوراً 1122 پر کال کریں — بتائیں "مجھے سیپسس کا شبہ ہے۔"',
        roman: 'Fori 1122 par call karein — batayein "mujhe sepsis ka shuba hai."',
      },
      {
        en: 'Keep the person warm; if shivering, cover them.',
        ur: 'مریض کو گرم رکھیں؛ اگر کانپ رہا ہو تو ڈھانپ دیں۔',
        roman: 'Mareez ko garam rakhein; agar kaanp raha ho to dhaanp dein.',
      },
      {
        en: 'Note the time symptoms started — tell the ambulance crew.',
        ur: 'علامات کا شروع وقت نوٹ کریں — ایمبولینس عملے کو بتائیں۔',
        roman: 'Alamaat ka shuru waqt note karein — ambulance amlay ko batayein.',
      },
    ],
    doNot: [
      {
        en: 'Do not wait to see if symptoms improve on their own.',
        ur: 'علامات خود ٹھیک ہونے کا انتظار نہ کریں۔',
        roman: 'Alamaat khud theek hone ka intezar na karein.',
      },
    ],
    sources: ['WHO — Sepsis', 'Surviving Sepsis Campaign — qSOFA'],
  },
  {
    patternCategory: 'domestic-violence',
    title: {
      en: 'You deserve to be safe',
      ur: 'آپ حفاظت کی حقدار ہیں',
      roman: 'Aap hifazat ki haqdaar hain',
    },
    reasonIntro: {
      en: 'If you are being hurt or threatened, you are not alone and it is not your fault.',
      ur: 'اگر آپ کو نقصان پہنچایا جا رہا ہے یا دھمکی دی جا رہی ہے، آپ اکیلی نہیں ہیں اور یہ آپ کی غلطی نہیں۔',
      roman: 'Agar aap ko nuksan pahunchaya ja raha hai ya dhamki di ja rahi hai, aap akeeli nahin hain aur yeh aap ki ghalati nahin.',
    },
    immediateActions: [
      {
        en: 'If you are in immediate danger, call 15 (Police) now.',
        ur: 'اگر فوری خطرے میں ہیں تو فوراً 15 (پولیس) پر کال کریں۔',
        roman: 'Agar fori khatre mein hain to fori 15 (Police) par call karein.',
      },
      {
        en: 'For women, call Madadgar Women Helpline 1099.',
        ur: 'خواتین کے لیے مددگار ویمن ہیلپ لائن 1099 پر کال کریں۔',
        roman: 'Khwateen ke liye Madadgar Women Helpline 1099 par call karein.',
      },
      {
        en: 'For a child in danger, call Umang 1152.',
        ur: 'بچے کو خطرے میں دیکھیں تو امان 1152 پر کال کریں۔',
        roman: 'Bachay ko khatre mein dekhein to Umang 1152 par call karein.',
      },
      {
        en: 'Reach a safe place first — a neighbour, a family member you trust, or a public place.',
        ur: 'پہلے محفوظ جگہ پہنچیں — کسی پڑوسی، قابل بھروسہ رشتہ دار، یا عوامی جگہ۔',
        roman: 'Pehle mehfooz jagah pahunchain — kisi parosi, qaabil-e-bharoosa rishtedaar, ya awaami jagah.',
      },
    ],
    doNot: [
      {
        en: 'Do not put yourself in further danger to confront the abuser.',
        ur: 'مزید خطرے میں نہ پڑیں — زیادتی کرنے والے سے سامنا نہ کریں۔',
        roman: 'Mazeed khatre mein na parhein — zyadati karne wale se saamna na karein.',
      },
    ],
    sources: ['UN Women — Violence against women', 'WHO — Intimate partner violence'],
  },
  {
    patternCategory: 'pediatric-imci',
    title: {
      en: 'Danger sign in a child — go to hospital now',
      ur: 'بچے میں خطرے کی علامت — فوراً ہسپتال جائیں',
      roman: 'Bachay mein khatre ki alamat — fori hospital jayein',
    },
    reasonIntro: {
      en: 'These are WHO IMCI danger signs in a child.',
      ur: 'یہ بچے میں عالمی ادارہ صحت (IMCI) کے خطرے کی علامات ہیں۔',
      roman: 'Yeh bachay mein WHO (IMCI) ke khatre ki alamaat hain.',
    },
    immediateActions: [
      {
        en: 'Take the child to a health facility NOW — even if they look better.',
        ur: 'بچے کو فوراً ہسپتال لے جائیں — چاہے وہ ٹھیک دکھے۔',
        roman: 'Bachay ko fori hospital le jayein — chahey woh theek dikhe.',
      },
      {
        en: 'Keep the child warm during transport.',
        ur: 'سفر کے دوران بچے کو گرم رکھیں۔',
        roman: 'Safar ke doran bachay ko garam rakhein.',
      },
      {
        en: 'If the child is breastfeeding, continue.',
        ur: 'اگر بچہ دودھ پی رہا ہے تو جاری رکھیں۔',
        roman: 'Agar bacha doodh pi raha hai to jari rakhein.',
      },
      {
        en: 'Note when symptoms started and what the child last ate/drank.',
        ur: 'نوٹ کریں علامات کب شروع ہوئے اور بچے نے آخری بار کیا کھایا پیا۔',
        roman: 'Note karein alamaat kab shuru huey aur bachay ne aakhri baar kya khaya piya.',
      },
    ],
    doNot: [
      {
        en: 'Do not give the child any medicine without a doctor or nurse saying so.',
        ur: 'ڈاکٹر یا نرس کے کہے بغیر بچے کو کوئی دوا نہ دیں۔',
        roman: 'Doctor ya nurse ke kahe baghair bachay ko koi dawa na dein.',
      },
      {
        en: 'Do not give food or drink if the child is unconscious or convulsing.',
        ur: 'اگر بچہ بےہوش ہو یا دورہ پڑ رہا ہو تو کھانا یا پانی نہ دیں۔',
        roman: 'Agar bacha behosh ho ya dorra par raha ho to khana ya pani na dein.',
      },
    ],
    sources: ['WHO — Integrated Management of Childhood Illness (IMCI)'],
  },
];

export function getEmergencyTemplate(category: string): EmergencyTemplate | undefined {
  return EMERGENCY_TEMPLATES.find((t) => t.patternCategory === category);
}
