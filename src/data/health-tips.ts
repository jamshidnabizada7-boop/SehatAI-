import type { TriText } from '@/lib/types';

// ============================================================
// SehatAI — Daily health tips (trilingual, verified sources)
// Deterministic daily rotation: tip = TIPS[dayOfYear % TIPS.length]
// Content mirrors the curated corpus — safe, actionable,
// no doses, no diagnosis. Pure presentation data: the safety
// pipeline is NOT involved in any way.
// ============================================================

export interface HealthTip {
  id: string;
  title: TriText;
  text: TriText;
  publisher: string;
}

export const HEALTH_TIPS: HealthTip[] = [
  {
    id: 'handwashing',
    title: {
      en: 'Wash hands, stop germs',
      ur: 'ہاتھ دھوئیں، جراثیم روکیں',
      roman: 'Haath dhoyein, jaraseem rokein',
    },
    text: {
      en: 'Wash hands with soap for 20 seconds before eating and after the toilet — the cheapest way to prevent diarrhoea and flu.',
      ur: 'کھانے سے پہلے اور ٹائلٹ کے بعد صابن سے 20 سیکنڈ ہاتھ دھوئیں — دست اور فلو روکنے کا سب سے سستا طریقہ۔',
      roman: 'Khane se pehle aur toilet ke baad sabun se 20 second haath dhoyein — dast aur flu roknay ka sab se sasta tareeqa.',
    },
    publisher: 'WHO — Hand hygiene',
  },
  {
    id: 'ors',
    title: {
      en: 'ORS from the first loose motion',
      ur: 'پہلے دست سے او آر ایس',
      roman: 'Pehle dast se ORS',
    },
    text: {
      en: 'If diarrhoea starts, begin ORS immediately in small, continuous sips — it prevents the dehydration that makes diarrhoea dangerous.',
      ur: 'اگر دست شروع ہو جائیں تو فوراً او آر ایس تھوڑے گھونٹ مسلسل پینا شروع کریں — یہ پانی کی کمی کو روکتا ہے جو دست کو خطرناک بناتا ہے۔',
      roman: 'Agar dast shuru ho jayein to foran ORS thoray ghoont musalsal peena shuru karein — yeh pani ki kami ko rokta hai jo dast ko khatarnak banata hai.',
    },
    publisher: 'WHO — Diarrhoeal disease',
  },
  {
    id: 'bp-check',
    title: {
      en: 'Know your blood pressure',
      ur: 'اپنا بلڈ پریشر جانلیں',
      roman: 'Apna blood pressure jaanein',
    },
    text: {
      en: 'High blood pressure often has no symptoms. Adults should get it checked at least once a year — early detection saves hearts and kidneys.',
      ur: 'ہائی بلڈ پریشر کی اکثر کوئی علامت نہیں ہوتی۔ بالغ افراد سال میں کم از کم ایک بار چیک کروائیں — جلد پتہ چلنا دل اور گردے بچاتا ہے۔',
      roman: 'High blood pressure ki aksar koi alamat nahi hoti. Baray flraqad saal mein kam az kam aik baar check karwayein — jaldi pata chalna dil aur girday bachata hai.',
    },
    publisher: 'WHO — Noncommunicable diseases',
  },
  {
    id: 'mosquito',
    title: {
      en: 'Empty standing water weekly',
      ur: 'کھڑے پانی کو ہفتہ وار خالی کریں',
      roman: 'Kharay paani ko hafta-war khaali karein',
    },
    text: {
      en: 'Dengue and malaria mosquitoes breed in standing water. Empty pots, buckets and tyres at home weekly — and sleep under a net where malaria is common.',
      ur: 'ڈینگی اور ملیریا کے مچھر کھڑے پانی میں پلتے ہیں۔ گھر کے گملے، بالٹی اور ٹائروں کا پانی ہفتہ وار خالی کریں — اور ملیریا والے علاقوں میں مچھر دانی میں سوئیں۔',
      roman: 'Dengue aur malaria ke machhar kharay paani mein palte hain. Ghar ke gunday, baalti aur tairon ka paani hafta-war khaali karein — aur malaria walay ilaqon mein machhar daani mein soyein.',
    },
    publisher: 'WHO — Vector-borne diseases',
  },
  {
    id: 'vaccination',
    title: {
      en: 'Vaccines on time, every dose',
      ur: 'ویکسین وقت پر، ہر خوراک',
      roman: 'Vaccine waqt par, har khoraak',
    },
    text: {
      en: 'A child is fully protected only when every EPI vaccine dose is completed on schedule. Keep the vaccination card safe and never skip a due dose.',
      ur: 'بچہ مکمل محفوظ تب ہوتا ہے جب ای پی آئی کی ہر ویکسین خوراک شیڈول پر مکمل ہو۔ ویکسینیشن کارڈ محفوظ رکھیں اور کسی بھی خوراک سے نہ گریز کریں۔',
      roman: 'Bacha mukammal mehfooz tab hota hai jab EPI ki har vaccine khoraak schedule par mukammal ho. Vaccination card mehfooz rakhein aur kisi bhi khoraak se na guruz karein.',
    },
    publisher: 'Pakistan MoNHSRC — EPI',
  },
  {
    id: 'breastfeeding',
    title: {
      en: 'Breast milk: first 6 months',
      ur: 'ماں کا دودھ: پہلے 6 ماہ',
      roman: 'Maa ka doodh: pehle 6 mahine',
    },
    text: {
      en: 'WHO recommends exclusive breastfeeding for the first 6 months — no water, no other food. It protects babies from infections and gives the best nutrition.',
      ur: 'عالمی ادارہ صحت پہلے 6 ماہ صرف ماں کا دودھ تجویز کرتا ہے — نہ پانی، نہ کوئی اور غذا۔ یہ بچوں کو انفیکشن سے بچاتا ہے اور بہترین غذائیت دیتا ہے۔',
      roman: 'WHO pehle 6 mahine sirf maa ka doodh tajweez karta hai — na paani, na koi aur ghiza. Yeh bachon ko infection se bachata hai aur behtareen ghizaiyat deta hai.',
    },
    publisher: 'WHO / UNICEF — Child health',
  },
  {
    id: 'safe-water',
    title: {
      en: 'Boil or filter drinking water',
      ur: 'پینے کا پانی اُبالیں یا فلٹر کریں',
      roman: 'Peene ka paani ubalein ya filter karein',
    },
    text: {
      en: 'In areas with unsafe tap water, boil it for 1 minute or use a certified filter — clean water prevents hepatitis, typhoid and diarrhoea.',
      ur: 'جہاں نل کا پانی غیر محفوظ ہو وہاں 1 منٹ اُبالیں یا تصدیق شدہ فلٹر استعمال کریں — صاف پانی ہیپاٹائٹس، ٹائیفائیڈ اور دست سے بچاتا ہے۔',
      roman: 'Jahan nal ka paani ghair-mehfooz ho wahan 1 minute ubalein ya tasdeeq-shuda filter istemal karein — saaf paani hepatitis, typhoid aur dast se bachata hai.',
    },
    publisher: 'WHO — Drinking water quality',
  },
  {
    id: 'fever-fluids',
    title: {
      en: 'Fever? Fluids and rest first',
      ur: 'بخار؟ پہلے مائعات اور آرام',
      roman: 'Bukhar? Pehle maayeaat aur aaraam',
    },
    text: {
      en: 'For a common fever, rest and drink extra fluids. See a doctor if it lasts more than 3 days or comes with rash, stiff neck or confusion.',
      ur: 'عام بخار میں آرام کریں اور زیادہ مائعات لیں۔ اگر بخار 3 دن سے زیادہ رہے یا دانے، گردن سخت یا حواس الجھن ہو تو ڈاکٹر کو دکھائیں۔',
      roman: 'Aam bukhar mein aaraam karein aur zyada maayeaat lein. Agar bukhar 3 din se zyada rahe ya danay, gardan sakht ya hawas uljhan ho to doctor ko dikhayein.',
    },
    publisher: 'WHO — Fever guidance',
  },
  {
    id: 'activity',
    title: {
      en: '30 minutes of movement daily',
      ur: 'روزانہ 30 منٹ جسمانی حرکت',
      roman: 'Rozana 30 minute jismani harkat',
    },
    text: {
      en: 'Adults need just 30 minutes of brisk walking a day to cut the risk of diabetes, heart disease and stroke — start today.',
      ur: 'بالغوں کو ذیابیطس، دل کی بیماری اور فالج کا خطرہ کم کرنے کے لیے روزانہ صرف 30 منٹ تیز چہل قدمی کافی ہے — آج سے شروع کریں۔',
      roman: 'Baron ko diabetes, dil ki bimari aur faalij ka khatra kam karne ke liye rozana sirf 30 minute tez chehel qadmi kaafi hai — aaj se shuru karein.',
    },
    publisher: 'WHO — Physical activity',
  },
  {
    id: 'tobacco',
    title: {
      en: 'Tobacco harms from the first puff',
      ur: 'تمباکو پہلی کش سے نقصان دیتا ہے',
      roman: 'Tambaku pehli kash se nuqsan deta hai',
    },
    text: {
      en: 'There is no safe level of tobacco. Quitting works at any age — within a year your heart-attack risk already drops. Ask a health worker about support.',
      ur: 'تمباکو کا کوئی محفوظ مقدار نہیں۔ کسی بھی عمر میں چھوڑنا فائدہ دیتا ہے — ایک سال میں دل کا دورہ پڑنے کا خطرہ کم ہو جاتا ہے۔ مدد کے لیے ہیلتھ ورکر سے رجوع کریں۔',
      roman: 'Tambaku ka koi mehfooz miqdaar nahin. Kisi bhi umar mein chhorna faida deta hai — aik saal mein dil ka doray parnay ka khatra kam ho jata hai. Madad ke liye health worker se rujoo karein.',
    },
    publisher: 'WHO — Tobacco',
  },
  {
    id: 'maternal-signs',
    title: {
      en: 'Pregnant? Know the danger signs',
      ur: 'حاملہ؟ خطرے کی علامات جانیں',
      roman: 'Hamela? Khatray ki alamaat jaanein',
    },
    text: {
      en: 'Bleeding, severe headache with blurred vision, swelling of face/hands, or the baby moving less — any of these means go to a facility NOW.',
      ur: 'خون آنا، شدید سر درد اور دھندلی نظر، چہرے/ہاتھوں کی سوجن، یا بچے کی حرکت کم ہونا — ان میں سے کوئی بھی علامت ہو تو فوراً ہسپتال جائیں۔',
      roman: 'Khoon aana, sakht sar dard aur dhundli nazar, chehray/haathon ki soojan, ya bachay ki harkat kam hona — in mein se koi bhi alamat ho to foran hospital jayein.',
    },
    publisher: 'WHO — Maternal health',
  },
  {
    id: 'salt',
    title: {
      en: 'Cut the salt, save the heart',
      ur: 'نمک کم کریں، دل بچائیں',
      roman: 'Namak kam karein, dil bachayein',
    },
    text: {
      en: 'Less salt means lower blood pressure. Cook with less, check labels on packaged food, and keep the salt shaker off the table.',
      ur: 'کم نمک کا مطلب ہے کم بلڈ پریشر۔ کم نمک سے پکائیں، پیک شدہ خوراک کا لیبل دیکھیں، اور میز پر نمک دانچ رکھنا چھوڑ دیں۔',
      roman: 'Kam namak ka matlab hai kam blood pressure. Kam namak se pakayein, pack ki hui khurak ka label dekhein, aur mez par namak daani rakhna chhor dein.',
    },
    publisher: 'WHO — Sodium reduction',
  },
  {
    id: 'mental-health',
    title: {
      en: 'Talking helps mental health',
      ur: 'بات کرنا ذہنی صحت کے لیے مفید ہے',
      roman: 'Baat karna zehni sehat ke liye mufeed hai',
    },
    text: {
      en: 'Feeling persistently low, anxious or hopeless is a health issue — not a weakness. Talk to someone you trust or a health worker. Help works.',
      ur: 'مسلسل اداس، پریشان یا مایوس محسوس کرنا صحت کا مسئلہ ہے — کمزوری نہیں۔ اپنے بھروسے مند یا ہیلتھ ورکر سے بات کریں۔ مدد فائدہ دیتی ہے۔',
      roman: 'Musalsal udaas, pareshan ya mayoos mehsoos karna sehat ka masla hai — kamzori nahin. Apne bharosay-mand ya health worker se baat karein. Madad faida deti hai.',
    },
    publisher: 'WHO — Mental health',
  },
  {
    id: 'antibiotics',
    title: {
      en: 'Antibiotics are not for every illness',
      ur: 'اینٹی بائیوٹکس ہر بیماری کا علاج نہیں',
      roman: 'Antibiotics har bimari ka ilaaj nahin',
    },
    text: {
      en: 'Most colds, flu and sore throats are viral — antibiotics do not work on them. Taking them unnecessarily makes them fail when truly needed.',
      ur: 'زیادہ تر زکام، فلو اور گلے کی خرابی وائرل ہیں — اینٹی بائیوٹکس ان پر کام نہیں کرتے۔ بغیر ضرورت لینے سے یہ ضرورت کے وقت بیکار ہو جاتے ہیں۔',
      roman: 'Zyada tar zukaam, flu aur galay ki kharabi viral hain — antibiotics in par kaam nahin karte. Baghair zaroorat lene se yeh zaroorat ke waqt bekaar ho jate hain.',
    },
    publisher: 'WHO — Antimicrobial resistance',
  },
];

/** Deterministic tip for a given date (rotates daily). */
export function getDailyTip(date: Date = new Date()): HealthTip {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86_400_000);
  return HEALTH_TIPS[dayOfYear % HEALTH_TIPS.length];
}
