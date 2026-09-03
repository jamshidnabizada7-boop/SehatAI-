import type { CorpusItem } from '@/lib/types';

// ============================================================
// SehatAI — Offline Clinical Guidance Knowledge Base (Corpus)
// 120+ verified, trilingual (English, Urdu Nastaliq, Roman Urdu) primary
// care, specialist medicine, and emergency topics across 20 medical domains.
// Provenance: WHO, UNICEF, Pakistan MoNHSRC, IFRC, IDF, UMANG, FAST.
// ============================================================

export const CORPUS: CorpusItem[] = [
  {
    "id": "fever-adult",
    "topic": "fever",
    "title": {
      "en": "Fever in adults — care and when to seek help",
      "ur": "بڑوں میں بخار — دیکھ بھال اور ڈاکٹر کو کب دکھائیں",
      "roman": "Baron mein bukhar — dekh bhaal aur doctor ko kab dikhayein"
    },
    "content": {
      "en": "• Rest and drink extra fluids (water, soup, ORS if sweating a lot)\n• A fever above 38°C (100.4°F) is a raised temperature; most healthy adults recover in 3–4 days\n• Ask a pharmacist or doctor about fever-reducing medicine — never exceed the label instructions and never self-adjust doses\n• Lukewarm sponging can help comfort; avoid ice-cold baths\nSEE A DOCTOR IF: fever lasts more than 3 days, temperature above 39.5°C, severe headache or stiff neck, rash, confusion, breathing difficulty, or fever after visiting a malaria/dengue area.\nGO IMMEDIATELY if: confusion, blue lips, breathing difficulty, no urine — these are emergency signs.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• آرام کریں اور زیادہ مائعات لیں (پانی، سوپ، پسینے کی صورت میں او آر ایس)\n• 38°C (100.4°F) سے اوپر درجہ حرارت بخار ہے؛ زیادہ تر صحتمند بالغ 3-4 دن میں ٹھیک ہو جاتے ہیں\n• بخار کم کرنے کی دوا کے بارے میں فارماسسٹ یا ڈاکٹر سے پوچھیں — لیبل کی ہدایات سے زیادہ خوراک ہرگز نہ لیں\n• ہلکے گنڈے پانی سے جسم پونچھنا آرام دیتا ہے؛ برفیلے پانی سے نہانے سے گریز کریں\nڈاکٹر کو دکھائیں: بخار 3 دن سے زیادہ رہے، درجہ حرارت 39.5°C سے زیادہ ہو، شدید سر درد یا گردن سخت ہو، دانے نکلیں، حواس کھوئے، سانس لینے میں مشکل، یا ملیریا/ڈینگی والے علاقے کے سفر کے بعد بخار آئے۔\nفوراً جائیں اگر: حواس الجھن، نیلے ہونٹ، سانس لینے میں مشکل، پیشاب نہ آنا — یہ ایمرجنسی علامات ہیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Aaraam karein aur zyada maayeaat lein (paani, soup, paseene ke soorat mein ORS)\n• 38°C (100.4°F) se oopar hararat bukhar hai; zyada tar sehatmand baray 3-4 din mein theek ho jate hain\n• Bukhar kam karne ki dawa ke baray mein pharmacist ya doctor se poochein — label ki hidayat se zyada khoraak hargiz na lein\n• Halkay gungunay pani se jism ponchhna aaraam deta hai; barfailay pani se nahane se parhez karein\nDOCTOR KO DIKHAYEIN agar: bukhar 3 din se zyada rahe, hararat 39.5°C se zyada ho, sakht sar dard ya gardan sakht ho, danay niklein, hawas kholen, saans lene mein mushkil, ya malaria/dengue walay ilaqay ke safar ke baad bukhar aaye.\nFORI JAYEIN agar: hawas uljhan, neele hont, saans lene mein mushkil, peshab na aana — yeh emergency alamaat hain.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard."
    },
    "tags": [
      "fever",
      "bukhar",
      "bukhaar",
      "tez bukhar",
      "high temperature",
      "بخار",
      "تیز بخار",
      "temperature",
      "hararat",
      "جسم گرم",
      "bukhar aur sar dard",
      "fever and headache"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Fever-related health guidance",
      "url": "https://www.who.int/news-room/questions-and-answers/item/fever",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "fever-child",
    "topic": "fever",
    "title": {
      "en": "Fever in children — safe care at home",
      "ur": "بچوں میں بخار — گھر پر محفوظ دیکھ بھال",
      "roman": "Bachon mein bukhar — ghar par mehfooz dekh bhaal"
    },
    "content": {
      "en": "• Offer fluids frequently — breast milk for infants, water/ORS for older children\n• Keep the child lightly dressed; do NOT bundle up in thick blankets\n• Ask a health worker or pharmacist about child-appropriate fever medicine — never give adult medicines or aspirin to children\n• Lukewarm sponging helps comfort\nSEE A HEALTH FACILITY SAME DAY IF: child under 3 months with any fever, fever above 39°C, refusing to drink, very sleepy/irritable, fever more than 2 days.\nEMERGENCY / GO IMMEDIATELY: cannot drink, fast or hard breathing, chest pulling in, blue lips, convulsions, unresponsive, rash that does not fade when pressed.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• بار بار مائعات دیں — شیرخوار بچوں کو دودھ، بڑے بچوں کو پانی/او آر ایس\n• بچے کو ہلکے کپڑوں میں رکھیں؛ موٹی کمبل میں نہ لپیٹیں\n• بچوں کے بخار کی دوا کے بارے میں ہیلتھ ورکر یا فارماسسٹ سے پوچھیں — بچوں کو بڑوں کی دوا یا اسپرین کبھی نہ دیں\n• ہلکے گنڈے پانی سے پونچھنا آرام دیتا ہے\nاُسی دن ڈاکٹر کو دکھائیں: بچہ 3 مہینے سے چھوٹا ہو اور کسی بھی درجے کا بخار ہو، بخار 39°C سے زیادہ ہو، پینے سے انکار کرے، بہت سستا یا بےچین ہو، بخار 2 دن سے زیادہ ہو۔\nایمرجنسی (فوراً جائیں): کچھ نہ پی سکے، تیز یا مشکل سانس، سینہ اندر کو کھنچے، نیلے ہونٹ، دورے، ہوش نہ ہو، دباؤ سے مٹنے والا دانے۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• Baar baar maayeaat dein — shir-khwar bachon ko doodh, baray bachon ko paani/ORS\n• Bachay ko halkay kapron mein rakhein; moti kambal mein na lapein\n• Bachon ke bukhar ki dawa ke baray mein health worker ya pharmacist se poochein — bachon ko baron ki dawa ya aspirin kabhi na dein\n• Halkay gungunay pani se ponchhna aaraam deta hai\nUSI DIN DOCTOR KO DIKHAYEIN agar: bacha 3 mahine se chhota ho aur kisi bhi darjay ka bukhar ho, bukhar 39°C se zyada ho, peene se inkaar kare, bohot susta ya bechain ho, bukhar 2 din se zyada ho.\nEMERGENCY (FORI JAYEIN): kuch na pee sake, tez ya mushkil saans, seena andar ko khinche, neele hont, doray, hosh na ho, dabaao se mitne wala danay.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "child fever",
      "bachay ko bukhar",
      "bacha bukhar",
      "بچے کو بخار",
      "بچہ بخار",
      "teeka bukhar",
      "infant fever",
      "fever in kids"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "child",
    "source": {
      "publisher": "WHO / UNICEF",
      "title": "Child health: managing fever at home",
      "url": "https://www.who.int/tools/child-health",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "diarrhea-ors",
    "topic": "diarrhea",
    "title": {
      "en": "Diarrhoea — ORS and zinc are the key treatment",
      "ur": "دست — او آر ایس اور زنک اہم علاج ہیں",
      "roman": "Dast — ORS aur zinc aham ilaaj hain"
    },
    "content": {
      "en": "• The biggest danger of diarrhoea is dehydration — start ORS (oral rehydration salts) from the first loose motion\n• Prepare ORS: mix one sachet in the stated amount of clean water, drink in small sips continuously\n• Continue eating light foods and keep breastfeeding infants\n• WHO recommends zinc supplements for children with diarrhoea for 10–14 days (ask a health worker for the right product)\nSEE A DOCTOR IF: diarrhoea more than 2 days, blood in stool, high fever, or signs of dehydration.\nEMERGENCY SIGNS: sunken eyes, no urine for 8+ hours, extreme sleepiness, unable to drink — go to a facility immediately.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• دست کا سب سے بڑا خطرہ پانی کی کمی ہے — پہلے دست سے ہی او آر ایس شروع کریں\n• او آر ایس تیار کریں: ایک پیکٹ بتائی گئی مقدار میں صاف پانی میں حل کر کے مسلسل تھوڑے گھونٹ پیں\n• ہلکا کھانا کھاتے رہیں اور شیرخوار بچوں کو دودھ پلاتے رہیں\n• عالمی ادارہ صحت بچوں کو دست میں 10-14 دن زنک دینے کی سفارش کرتا ہے (درست پروڈکٹ کے لیے ہیلتھ ورکر سے پوچھیں)\nڈاکٹر کو دکھائیں: دست 2 دن سے زیادہ، پاخانے میں خون، تیز بخار، یا پانی کی کمی کی علامات۔\nایمرجنسی علامات: آنکھیں دھنس جانا، 8 گھنٹے سے زیادہ پیشاب نہ آنا، شدید سستی، پینے کے قابل نہ ہونا — فوراً ہسپتال جائیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Dast ka sab se bara khatra pani ki kami hai — pehle dast se hi ORS shuru karein\n• ORS tayyar karein: aik packet bataye gaye miqdaar mein saaf paani mein hal kar ke musalsal thhoray ghoont peein\n• Halka khana khaate rahein aur shir-khwar bachon ko doodh pilate rahein\n• WHO bachon ko dast mein 10-14 din zinc dene ki sifarish karta hai (durust product ke liye health worker se poochein)\nDOCTOR KO DIKHAYEIN agar: dast 2 din se zyada, paikhane mein khoon, tez bukhar, ya pani ki kami ki alamaat.\nEMERGENCY ALAMAAT: aankhein dhans jana, 8 ghanton se zyada peshab na aana, shadeed susti, peene ke qabil na hona — fori hospital jayein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard."
    },
    "tags": [
      "diarrhea",
      "diarrhoea",
      "dast",
      "dast lag gaye",
      "loose motions",
      "دست",
      "دست لگنا",
      "ORS",
      "oral rehydration",
      "zinc",
      "زنک",
      " motions"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Diarrhoeal disease fact sheet — ORS & zinc",
      "url": "https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "dehydration-signs",
    "topic": "dehydration",
    "title": {
      "en": "Dehydration — how to spot it and respond",
      "ur": "پانی کی کمی — پہچان اور اقدام",
      "roman": "Pani ki kami — pehchaan aur iqdam"
    },
    "content": {
      "en": "• MILD/MODERATE signs: thirsty, dry mouth, urinating less, dark urine, mild weakness → increase fluids, use ORS after each loose stool or vomiting.\n• SEVERE signs (EMERGENCY): sunken eyes, no urine for 8+ hours, very dry mouth, extreme sleepiness or confusion, skin pinch returns slowly, unable to drink, rapid breathing in children.\nWHAT TO DO for severe dehydration: go to a health facility immediately — IV fluids may be needed. Keep giving ORS sips on the way if the person can drink. Continue breastfeeding infants.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• ہلکی/درمیانی علامات: پیاس، سوکھا منہ، پیشاب کم، گہرا پیشاب، ہلکی کمزوری → مائعات بڑھائیں، ہر دست یا الٹی کے بعد او آر ایس لیں۔\n• شدید علامات (ایمرجنسی): آنکھیں دھنسنا، 8 گھنٹے سے زیادہ پیشاب نہ آنا، بہت سوکھا منہ، شدید سستی یا الجھن، جلد اٹھانے پر دیر سے سدھرنا، پینے کے قابل نہ ہونا، بچوں میں تیز سانس۔\n• شدید کمی کا اقدام: فوراً ہسپتال جائیں — ڈرپ کی ضرورت ہو سکتی ہے۔\n• راستے میں اگر مریض پی سکتا ہو تو او آر ایس کے گھونٹ دیتے رہیں۔\n• شیرخوار بچوں کا دودھ جاری رکھیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Halki/darmiyani alamaat: pyaas, sookha munh, peshab kam, gehra peshab, halki kamzori → maayeaat barhayein, har dast ya ulti ke baad ORS lein.\n• Shadeed alamaat (EMERGENCY): aankhein dhansna, 8 ghanton se zyada peshab na aana, bohot sookha munh, shadeed susti ya uljhan, jild uthane par dair se sudharna, peene ke qabil na hona, bachon mein tez saans.\n• Shadeed kami ka iqdam: fori hospital jayein — drip ki zaroorat ho sakti hai.\n• Rastay mein agar mareez pee sakta ho to ORS ke ghoont dete rahein.\n• Shir-khwar bachon ka doodh jari rakhein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard."
    },
    "tags": [
      "dehydration",
      "pani ki kami",
      "پانی کی کمی",
      "sunken eyes",
      "aankhein dhans",
      "thirst",
      "pyaas",
      "پیاس",
      "no urine",
      "peshaab nahi"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Treatment of diarrhoea — dehydration assessment",
      "url": "https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "dengue",
    "topic": "dengue",
    "title": {
      "en": "Dengue — signs and when it becomes severe",
      "ur": "ڈینگی — علامات اور شدت کب ہوتی ہے",
      "roman": "Dengue — alamaat aur shiddat kab hoti hai"
    },
    "content": {
      "en": "• Dengue is spread by day-biting mosquitoes.\n• Symptoms: high fever (40°C), severe headache, pain behind eyes, muscle/joint pain (\"breakbone\"), nausea, rash — appears 4–10 days after the bite.\n• CARE: rest, plenty of fluids, ask a doctor/pharmacist about paracetamol for fever/pain.\n• AVOID ibuprofen, aspirin and similar medicines (bleeding risk) unless a doctor advises.\nEMERGENCY / GO IMMEDIATELY: severe abdominal pain, persistent vomiting, bleeding gums/nose, blood in vomit/stool, extreme fatigue, restlessness, cold clammy skin.\nPREVENT: remove standing water, use repellent, full-sleeve clothing.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• ڈینگی دن میں کاٹنے والے مچھر سے پھیلتی ہے۔\n• علامات: تیز بخار (40°C)، شدید سر درد، آنکھوں کے پیچھے درد، عضلوں/جوڑوں کا درد، متلی، دانے — کاٹنے کے 4-10 دن بعد ظاہر ہوتے ہیں۔\n• دیکھ بھال: آرام، کافی مائعات، بخار/درد کے لیے ڈاکٹر/فارماسسٹ سے پیراسیٹامول کے بارے میں پوچھیں۔\n• ابن پروفین، اسپرین جیسی دوائیں (خون کا خطرہ) ڈاکٹر کے مشورے کے بغیر نہ لیں۔\n• ایمرجنسی (فوراً جائیں): شدید پیٹ درد، مسلسل الٹی، مسوڑھوں/ناک سے خون، الٹی/پاخانے میں خون، شدید تھکاوٹ، بےچینی، ٹھنڈی اور پسینے سے بھیگی جلد۔\nبچاؤ: کھڑا پانی ختم کریں، مچھر بھگاؤ استعمال کریں، پورے بازو والے کپڑے پہنیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Dengue din mein kaatne walay machhar se phailti hai.\n• Alamaat: tez bukhar (40°C), sakht sar dard, aankhon ke peechay dard, azlaaton/joron ka dard, matli, danay — kaatne ke 4-10 din baad zahir hote hain.\n• Dekh bhaal: aaraam, kaafi maayeaat, bukhar/dard ke liye doctor/pharmacist se paracetamol ke baray mein poochein.\n• Ibuprofen, aspirin jaisi dawayain (khoon ka khatra) doctor ke mashwaray ke baghair na lein.\n• EMERGENCY (FORI JAYEIN): sakht pet dard, musalsal ulti, masoorhon/naak se khoon, ulti/paikhane mein khoon, shadeed thakaan, bechaini, thandi aur paseenay se bheegi jild.\n• Bachao: khara paani khatam karein, machhar bhagao istemal karein, poore baazu walay kapray pehnein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "dengue",
      "ڈینگی",
      "dengue fever",
      "breakbone",
      "mosquito",
      "machhar",
      "مچھر",
      "bone pain",
      "haddi dard",
      "pain behind eyes",
      "eye pain fever",
      "aankhon ke peechay dard",
      "آنکھوں کے پیچھے درد",
      "fever 5 days",
      "5 din se bukhar",
      "body ache fever",
      "jism dard bukhar"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Dengue and severe dengue fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "malaria",
    "topic": "malaria",
    "title": {
      "en": "Malaria — fever after mosquito bites needs a test",
      "ur": "ملیریا — مچھر کے کاٹنے کے بعد بخار پر ٹیسٹ ضروری",
      "roman": "Malaria — machhar ke kaatne ke baad bukhar par test zaroori"
    },
    "content": {
      "en": "• Malaria causes fever with chills/shivering and sweating, often in cycles, plus headache and body ache.\n• Symptoms appear 10–15 days after an infective bite.\n• ANY fever in a malaria area (or after visiting one) should be tested with a rapid test or blood smear at the nearest facility the SAME DAY — early treatment is simple and effective; delay can make malaria severe.\n• SEVERE MALARIA IS AN EMERGENCY / GO IMMEDIATELY: confusion, convulsions, dark urine, yellow eyes, inability to drink, unconsciousness.\nPREVENT: mosquito nets (especially insecticide-treated), repellents, removing standing water. Malaria mosquitoes bite mostly at night.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• ملیریا سے ٹھنڈ کے ساتھ بخار، کپکپی اور پسینہ آتا ہے، اکثر دوروں میں، نیز سر درد اور جسم درد۔\n• علامات کاٹنے کے 10-15 دن بعد ظاہر ہوتی ہیں۔\n• ملیریا کے علاقے میں (یا وہاں کے سفر کے بعد) کوئی بھی بخار اُسی دن قریب ترین لیبارٹری میں تیز ٹیسٹ یا خون کے ٹیسٹ سے جانچ لیں — ابتدائی علاج آسان اور مؤثر ہے؛ تاخیر سے ملیریا شدید ہو سکتا ہے۔\n• شدید ملیریا ایمرجنسی ہے: الجھن، دورے، گہرا پیشاب، پیلی آنکھیں، پینے کے قابل نہ ہونا، بےہوشی۔\nبچاؤ: مچھر دانی (خصوصاً ادویات والی)، مچھر بھگاؤ، کھڑا پانی ختم کرنا۔ ملیریا کا مچھر زیادہ تر رات میں کاٹتا ہے۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Malaria se thand ke saath bukhar, kapkapi aur paseena aata hai, aksar doron mein, niaz sar dard aur jism dard.\n• Alamaat kaatne ke 10-15 din baad zahir hoti hain.\n• Malaria ke ilaqay mein (ya wahan ke safar ke baad) koi bhi bukhar usi din qareeb tareen lab test ya khoon ke test se jaanch lein — ibtidai ilaaj aasan aur moassar hai; taakheer se malaria shadeed ho sakta hai.\n• Shadeed malaria emergency hai: uljhan, doray, gehra peshab, peeli aankhein, peene ke qabil na hona, behoshi.\n• Bachao: machhar daani (khaas tor par dawai wali), machhar bhagao, khara paani khatam karna.\n• Malaria ka machhar zyada tar raat mein kaatta hai.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "malaria",
      "ملیریا",
      "malaria fever",
      "chills",
      "kapkapi",
      "کپکپی",
      "shivering",
      "mosquito bite",
      "mangla",
      "mangla dam",
      "dam gaya",
      "منگلا",
      "bukhar pichlay hafte",
      "fever after travel",
      "travel fever",
      "pichlay hafte bukhar",
      "bukhar hafte"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Malaria fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/malaria",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "typhoid",
    "topic": "typhoid",
    "title": {
      "en": "Typhoid — fever that keeps rising needs a test",
      "ur": "ٹائیفائیڈ — مسلسل بڑھتا بخار ٹیسٹ کا متقاضی",
      "roman": "Typhoid — musalsal barhta bukhar test ke mutaqazi"
    },
    "content": {
      "en": "• Typhoid spreads through contaminated food and water.\n• Signs: fever that increases step-wise over several days, headache, abdominal pain, constipation or diarrhoea, poor appetite, sometimes a rose-coloured rash.\n• Diagnosis needs a blood test — see a doctor; typhoid is treated with prescribed antibiotics and full course completion matters.\nSEE A DOCTOR SAME DAY for suspected typhoid. EMERGENCY signs: severe abdominal swelling/pain, continuous vomiting, confusion or heavy drowsiness — possible intestinal perforation.\nPREVENT: clean water, handwashing before eating and after toilet, properly cooked food.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• ٹائیفائیڈ گندے کھانے اور پانی سے پھیلتا ہے۔\n• علامات: کئی دنوں میں رفتہ رفتہ بڑھتا بخار، سر درد، پیٹ درد، قبض یا دست، بھوک کم، کبھی گلابی دانے۔\n• تشخیص خون کے ٹیسٹ سے ہوتی ہے — ڈاکٹر کو دکھائیں؛ علاج تجویز شدہ اینٹی بائیوٹک سے ہوتا ہے اور مکمل کورس مکمل کرنا ضروری ہے۔\n• ٹائیفائیڈ کے شبے پر اُسی دن ڈاکٹر کو دکھائیں۔\nایمرجنسی علامات: شدید پیٹ پھولنا/درد، مسلسل الٹی، الجھن یا شدید نیند — آنتوں میں سوراخ کا خطرہ۔\nبچاؤ: صاف پانی، کھانے سے پہلے اور ٹوائلٹ کے بعد ہاتھ دھونا، اچھی طرح پکا کھانا۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Typhoid ganday khane aur paani se phailta hai.\n• Alamaat: kai dinon mein rafta rafta barhta bukhar, sar dard, pet dard, qabz ya dast, bhook kam, kabhi gulabi danay.\n• Tashkhees khoon ke test se hoti hai — DOCTOR KO DIKHAYEIN; ilaaj tayoon shuda antibiotic se hota hai aur mukammal course mukammal karna zaroori hai.\n• Typhoid ke shubay par usi din DOCTOR KO DIKHAYEIN.\nEMERGENCY alamaat: shadeed pet phoolna/dard, musalsal ulti, uljhan ya shadeed neend — aanton mein sorakh ka khatra.\n• Bachao: saaf paani, khane se pehle aur toilet ke baad haath dhona, achi tarah paka khana.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard."
    },
    "tags": [
      "typhoid",
      "ٹائیفائیڈ",
      "typhoid fever",
      "motapa bukhar",
      "stepwise fever",
      "dirty water fever"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Typhoid fever — health topic",
      "url": "https://www.who.int/news-room/fact-sheets/detail/typhoid",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "tuberculosis",
    "topic": "tb",
    "title": {
      "en": "Tuberculosis (TB) — cough lasting 2+ weeks needs checking",
      "ur": "تپِ دق — دو ہفتے سے زیادہ کھانسی جانچ کی ضرورت",
      "roman": "TB — do hafte se zyada khansi jaanch ki zaroorat"
    },
    "content": {
      "en": "• TB spreads through the air when a sick person coughs.\n• Key sign: cough lasting more than 2 weeks, sometimes with blood; plus night sweats, fever, weight loss, poor appetite.\n• TB is CURABLE with a full course of free government-provided medicines (6+ months) — stopping early causes drug resistance, which is much harder to treat.\n• If you have a 2+ week cough: get a sputum test at the nearest government TB centre (diagnosis and treatment are free in Pakistan).\n• Protect your family: cover coughs, keep rooms ventilated, and have household contacts screened.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• تپِ دق مریض کے کھانسنے سے ہوا میں پھیلتی ہے۔\n• اہم علامت: دو ہفتے سے زیادہ کھانسی، کبھی خون کے ساتھ؛ نیز رات کا پسینہ، بخار، وزن کم، بھوک کم۔\n• تپِ دق حکومت کی مفت ادویات کے مکمل کورس سے بالکل قابلِ علاج ہے (6+ مہینے) — جلد بند کرنے سے دوا کے خلاف مزاحمت پیدا ہوتی ہے جس کا علاج بہت مشکل ہے۔\n• اگر دو ہفتے سے زیادہ کھانسی ہو تو قریب ترین سرکاری تپِ دق مرکز سے بلغم ٹیسٹ کروائیں (پاکستان میں تشخیص اور علاج مفت ہے)۔\n• خاندان کا تحفظ: کھانسی پر منہ ڈھانپیں، کمروں میں ہوا کا راستہ رکھیں، گھر کے ساتھ رہنے والوں کی جانچ کروائیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• TB mareez ke khansne se hawa mein phailti hai.\n• Aham alamat: do hafte se zyada khansi, kabhi khoon ke saath; niaz raat ka paseena, bukhar, wazan kam, bhook kam.\n• TB hukoomat ki muft dawaiyon ke mukammal course se bilkul qabil-e-ilaaj hai (6+ mahine) — jald band karne se dawa ke khilaaf muzahamat peda hoti hai jis ka ilaaj bohot mushkil hai.\n• Agar do hafte se zyada khansi ho to qareeb tareen sarkari TB markaz se balgham test karwayein (Pakistan mein tashkhees aur ilaaj muft hai).\n• Khandan ka hifazat: khansi par munh dhanpein, kamron mein hawa ka rasta rakhein, ghar ke saath rehne walon ki jaanch karwayein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "tuberculosis",
      "TB",
      "تپ دق",
      "ٹی بی",
      "tb cough",
      "cough 2 weeks",
      "two weeks cough",
      "do hafte khansi",
      "2 hafte khansi",
      "do haftay se khansi",
      "raat ko paseena",
      "paseena raat ko",
      "raat ka paseena",
      "night sweats cough",
      "رات کو پسینہ",
      "دو ہفتے کھانسی",
      "weight loss tb",
      "tb test",
      "chronic cough tb"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Tuberculosis fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/tuberculosis",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "pregnancy-danger-signs",
    "topic": "maternal",
    "title": {
      "en": "Danger signs in pregnancy — go to a facility at once",
      "ur": "حمل کے خطرے کے اشارے — فوراً ہسپتال جائیں",
      "roman": "Hamal ke khatray ke isharay — fori hospital jayein"
    },
    "content": {
      "en": "GO TO A HEALTH FACILITY IMMEDIATELY if any of these occur during pregnancy:\n• Vaginal bleeding\n• Severe headache with blurred vision or swelling of face/hands (possible pre-eclampsia)\n• Severe abdominal pain\n• Fever with rash or feeling very unwell\n• Fluid leaking before labour\n• Convulsions\n• The baby moving much less than usual\n• Severe vomiting where you cannot keep any food or fluids down\nThese are WHO maternal danger signs. In later pregnancy, keep the phone number of your nearest emergency-ready hospital saved, and always arrange transport in advance.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "حمل کے دوران یہ کوئی بھی علامت ہو تو فوراً ہسپتال جائیں:\n• اندامِ نہانی سے خون آنا\n• شدید سر درد کے ساتھ دھندلا دکھنا یا چہرے/ہاتھوں کی سوجن (پری ایکلامپسیا ممکن)\n• شدید پیٹ درد\n• بخار کے ساتھ دانے یا بہت زیادہ بیمہ محسوس ہونا\n• زچگی سے پہلے پانی کا اخراج\n• دورے\n• بچے کی حرکت معمول سے بہت کم ہونا\n• شدید الٹی جس میں کھانا پانی حلق سے اترے نہیں\nیہ عالمی ادارہ صحت کے حمل کے خطرے کے اشارے ہیں۔ حمل کے آخری مہینوں میں قریب ترین ایمرجنسی ہسپتال کا نمبر محفوظ رکھیں اور سواری کا انتظام پہلے سے کریں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "Hamal ke doran yeh koi bhi alamat ho to fori hospital jayein:\n• Andam-e-nahani se khoon aana\n• Sakht sar dard ke saath dhundla dekhna ya chehre/haathon ki soojan (pre-eclampsia mumkin)\n• Sakht pet dard\n• Bukhar ke saath danay ya bohot zyada bemeh mehsoos hona\n• Zachgi se pehle paani ka ikhraj\n• Doray\n• Bachay ki harkat mamool se bohot kam hona\n• Shadeed ulti jis mein khana paani halaq se utre nahi\nYeh WHO ke hamal ke khatray ke isharay hain. Hamal ke aakhri mahinon mein qareeb tareen emergency hospital ka number mehfooz rakhein aur sawari ka intezam pehle se karein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "pregnancy danger",
      "hamal",
      "حمل",
      "pregnant",
      "pregnancy bleeding",
      "preeclampsia",
      "maternal",
      "زچگی",
      "bleeding pregnancy"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "maternal",
    "source": {
      "publisher": "WHO",
      "title": "Pregnancy danger signs — maternal health",
      "url": "https://www.who.int/health-topics/maternal-health",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "antenatal-care",
    "topic": "maternal",
    "title": {
      "en": "Antenatal care — check-up schedule for a safe pregnancy",
      "ur": "حمل کی دیکھ بھال — محفوظ حمل کے معائنے کا شیڈول",
      "roman": "Hamal ki dekh bhaal — mehfooz hamal ke muaine ka schedule"
    },
    "content": {
      "en": "• WHO recommends at least 8 antenatal contacts: first before 12 weeks, then around 20, 26, 30, 34, 36, 38 and 40 weeks.\n• Each visit: blood pressure, weight, urine test, belly examination, iron/folate support, tetanus vaccination doses, and screening for danger signs.\n• ALSO IMPORTANT: eat an extra meal a day with protein (dal, eggs, meat, milk), take iron/folate as advised, sleep under a mosquito net, and plan your delivery place and transport in advance.\n• FIRST CONTACT EARLY: booking in the first 3 months catches problems like anaemia, blood pressure issues and infections early.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• عالمی ادارہ صحت کم از کم 8 حمل کے معائنوں کی سفارش کرتا ہے: پہلا 12 ہفتوں سے پہلے، پھر تقریباً 20، 26، 30، 34، 36، 38 اور 40 ہفتوں پر۔\n• ہر معائنے میں: بلڈ پریشر، وزن، پیشاب ٹیسٹ، پیٹ کا معائنہ، آئرن/فولک سپلیمنٹ، ٹٹنس کے ٹیکے، اور خطرے کی علامات کی جانچ۔\n• بھی ضروری: دن میں ایک اور کھانا پروٹین کے ساتھ کھائیں (دال، انڈے، گوشت، دودھ)، ڈاکٹر کی ہدایت پر آئرن/فولک لیں، مچھر دانی میں سوئیں، اور زچگی کی جگہ اور سواری کا انتظام پہلے سے کریں۔\n• پہلا معائنہ جلد: پہلے تین مہینوں میں رجسٹریشن سے خون کی کمی، بلڈ پریشر اور انفیکشن جیسے مسائل جلد پکڑے جاتے ہیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• WHO kam az kam 8 hamal ke muainon ki sifarish karta hai: pehla 12 hafton se pehle, phir taqreeban 20, 26, 30, 34, 36, 38 aur 40 hafton par.\n• Har muaine mein: blood pressure, wazan, peshab test, pet ka muaina, iron/folate supplement, tetanus ke teekay, aur khatray ki alamaat ki jaanch.\n• Bhi zaroori: din mein aik aur khana protein ke saath khayein (daal, anday, gosht, doodh), doctor ki hidayat par iron/folate lein, machhar daani mein soyein, aur zachgi ki jagah aur sawari ka intezam pehle se karein.\n• Pehla muaina jald: pehle teen mahinon mein registration se khoon ki kami, blood pressure aur infection jaisay masail jald pakray jate hain.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "antenatal care",
      "ANC",
      "hamal checkup",
      "حمل کا معائنہ",
      "pregnancy checkup",
      "pregnancy visit",
      "8 visits",
      "anc-schedule",
      "anc schedule"
    ],
    "baseLevel": "ROUTINE",
    "audience": "maternal",
    "source": {
      "publisher": "WHO",
      "title": "WHO recommendations on antenatal care (2016)",
      "url": "https://www.who.int/publications/i/item/9789241549912",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "pregnancy-nutrition",
    "topic": "maternal",
    "title": {
      "en": "Eating well in pregnancy",
      "ur": "حمل میں اچھی غذا",
      "roman": "Hamal mein achi ghiza"
    },
    "content": {
      "en": "• Eat one extra meal or snack each day — you need more energy and protein in pregnancy\n• Good protein: lentils (dal), beans, eggs, milk, yoghurt, chicken, meat, nuts\n• Iron-rich: meat, spinach and other leafy greens, dried fruit — pair with vitamin C (lemon, orange) to absorb iron better; avoid tea right after meals\n• Take iron and folic acid tablets as your health worker advises — they prevent anaemia and birth defects\n• Calcium: milk, yoghurt, cheese\n• AVOID: raw/undercooked meat, unpasteurized milk, too much tea/coffee with meals\n• Use iodized salt.\nDANGER SIGNS while pregnant (bleeding, severe headache, swelling, fever) = go to a facility immediately.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• دن میں ایک اور کھانا یا ناشتہ کریں — حمل میں زیادہ توانائی اور پروٹین درکار ہے\n• اچھا پروٹین: دال، لوبیا، انڈے، دودھ، دہی، مرغی، گوشت، مغلزات\n• آئرن سے بھرپور: گوشت، پالک اور دیگر سبز پتوں والی سبزیاں، خشک میوے — وٹامن سی (لیموں، مالٹا) کے ساتھ لیں تاکہ آئرن اچھی طرح جذب ہو؛ کھانے کے فوراً بعد چائے نہ پیں\n• ہیلتھ ورکر کے کہنے پر آئرن اور فولک ایسڈ کی گولیاں لیں — یہ خون کی کمی اور پیدائشی نقص روکتے ہیں\n• کیلشیم: دودھ، دہی، پنیر\n• پرہیز: کچا/ادھا پکا گوشت، غیر پیسچورائزڈ دودھ، کھانے کے ساتھ زیادہ چائے/کافی\n• آیوڈائزڈ نمک استعمال کریں۔\nحمل میں خطرے کی علامات (خون، شدید سر درد، سوجن، بخار) = فوراً ہسپتال جائیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• Din mein aik aur khana ya nashta karein — hamal mein zyada tawanai aur protein darkar hai\n• Acha protein: daal, lobia, anday, doodh, dahi, murghi, gosht, mughazat\n• Iron se bharpoor: gosht, palak aur deegar sabz paton wali sabziyan, khushk miwe — vitamin C (lemon, malta) ke saath lein taakay iron achi tarah jazb ho; khane ke fori baad chai na peein\n• Health worker ke kehne par iron aur folic acid ki goliyan lein — yeh khoon ki kami aur paidaishi nuqs rokte hain\n• Calcium: doodh, dahi, paneer\n• Parhez: kacha/adha paka gosht, ghair-pasteurized doodh, khane ke saath zyada chai/coffee\n• Iodized namak istemal karein.\nHamal mein khatray ki alamaat (khoon, sakht sar dard, soojan, bukhar) = fori hospital jayein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "pregnancy diet",
      "pregnancy food",
      "hamal khana",
      "حمل میں کھانا",
      "pregnancy nutrition",
      "hamal ki ghiza",
      "حمل کی غذا",
      "iron pregnancy",
      "folic acid",
      "what to eat pregnant",
      "vitamins pregnancy",
      "maternal nutrition",
      "hamal diet",
      "pregnancy meals",
      "pregnancy eating"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "maternal",
    "source": {
      "publisher": "WHO",
      "title": "Healthy diet during pregnancy",
      "url": "https://www.who.int/news-room/questions-and-answers/item/healthy-diet-pregnancy",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "breastfeeding",
    "topic": "maternal",
    "title": {
      "en": "Breastfeeding — the best start for your baby",
      "ur": "ماں کا دودھ — بچے کے لیے بہترین آغاز",
      "roman": "Maa ka doodh — bachay ke liye behtareen aaghaz"
    },
    "content": {
      "en": "• Start breastfeeding within 1 hour of birth (first yellow milk — colostrum — is protective)\n• Exclusive breastfeeding for the first 6 months: no water, no other food needed\n• Feed on demand, day and night — 8+ times in 24 hours; frequent feeding builds supply\n• Good attachment: mouth wide, more areola visible above baby’s top lip, no pain\n• Signs baby gets enough: 6+ wet nappies a day, gaining weight, alert when awake\nGET HELP IF: sore cracked nipples, baby not latching, baby passing very little urine, or you feel unwell.\nEat and drink well yourself — you need about one extra meal and plenty of fluids while breastfeeding.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• پیدائش کے ایک گھنٹے کے اندر دودھ پلانا شروع کریں (پہلا پیلا دودھ — کولوسٹرم — بچے کی حفاظت کرتا ہے)\n• پہلے 6 مہینے صرف ماں کا دودھ: نہ پانی، نہ کوئی اور غذا درکار\n• مانگ پر دن رات پلائیں — 24 گھنٹے میں 8 بار سے زیادہ؛ بار بار پلانے سے دودھ بڑھتا ہے\n• درست لگن: منہ کھلا، ہونٹ سے اوپر زیادہ گہرا حصہ نظر آئے، درد نہ ہو\n• بچے کو کافی دودھ ملنے کی علامات: دن میں 6 سے زیادہ بھیگے ڈائپر، وزن بڑھنا، جاگتے وقت چوکنا\n• مدد لیں اگر: چوٹیلے/زخم گڑھے، بچہ دودھ نہ پکڑے، بچہ بہت کم پیشاب کرے، یا آپ بیمہ محسوس کریں\n• خود اچھا کھائیں پئیں — دودھ پلاتے وقت ایک اور کھانا اور کافی مائعات درکار ہیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Paidaish ke aik ghantay ke andar doodh pilana shuru karein (pehla peela doodh — colostrum — bachay ki hifazat karta hai)\n• Pehlay 6 mahine sirf maa ka doodh: na paani, na koi aur ghiza darkar\n• Maang par din raat pilayein — 24 ghanton mein 8 baar se zyada; baar baar pilane se doodh barhta hai\n• Durust lagna: munh khula, hont se oopar zyada gehra hissa nazar aaye, dard na ho\n• Bachay ko kaafi doodh milne ki alamaat: din mein 6 se zyada bheegay diaper, wazan barhna, jaagtay waqt chokna\n• Madad lein agar: chootilay/zakham ghaṛay, bacha doodh na pakde, bacha bohot kam peshab kare, ya aap bemeh mehsoos karein\n• Khud acha khayein peein — doodh pilate waqt aik aur khana aur kaafi maayeaat darkar hain.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "breastfeeding",
      "doodh pilana",
      "دودھ پلانا",
      "milk baby",
      "colostrum",
      "exclusive breastfeeding",
      "latching"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "maternal",
    "source": {
      "publisher": "WHO / UNICEF",
      "title": "Breastfeeding recommendations",
      "url": "https://www.who.int/health-topics/breastfeeding",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "epi-schedule",
    "topic": "vaccination",
    "title": {
      "en": "Pakistan EPI — free vaccination schedule for your child",
      "ur": "پاکستان ای پی آئی — بچوں کی مفت ویکسینیشن شیڈول",
      "roman": "Pakistan EPI — bachon ki muft vaccination schedule"
    },
    "content": {
      "en": "All EPI vaccines are FREE at government centres:\n• At birth: BCG (TB), OPV-0 (polio), Hepatitis B birth dose\n• 6 weeks: Penta-1 (DPT+HepB+Hib), OPV-1, Rota-1, PCV-1 (pneumonia)\n• 10 weeks: Penta-2, OPV-2, Rota-2, PCV-2\n• 14 weeks: Penta-3, OPV-3, PCV-3, IPV\n• 9 months: Measles-1, Typhoid conjugate vaccine\n• 15 months: Measles-2\nTIPS: carry the vaccination card to every visit; a mild cold is NOT a reason to delay vaccination; missed doses should be given as soon as possible — the centre will guide you.\nPREGNANT WOMEN: tetanus (TT) doses protect mother and newborn.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "تمام ای پی آئی ویکسینز سرکاری مراکز میں مفت ہیں:\n• پیدائش پر: بی سی جی (ٹی بی)، او پی وی-0 (پولیو)، ہیپاٹائٹس بی پیدائشی خوراک\n• 6 ہفتے: پینٹا-1 (ڈی پی ٹی+ہیپ بی+ہب)، او پی وی-1، روٹا-1، پی سی وی-1 (نمونیا)\n• 10 ہفتے: پینٹا-2، او پی وی-2، روٹا-2، پی سی وی-2\n• 14 ہفتے: پینٹا-3، او پی وی-3، پی سی وی-3، آئی پی وی\n• 9 مہینے: خسرہ-1، ٹائیفائیڈ ویکسین\n• 15 مہینے: خسرہ-2\n• حمل میں: ٹٹنس کی خوراکیں ماں اور نوزائیدہ کی حفاظت کرتی ہیں\nنصیحتیں: ہر ویزٹ پر ویکسینیشن کارڈ ساتھ رکھیں؛ ہلکی زکام ویکسین میں تاخیر کی وجہ نہیں؛ چھوٹی ہوئی خوراک جلد سے جلد دلوائیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "Tamam EPI vaccines sarkari markaz mein muft hain:\n• Paidaish par: BCG (TB), OPV-0 (polio), Hepatitis B paidaishi khoraak\n• 6 hafte: Penta-1 (DPT+HepB+Hib), OPV-1, Rota-1, PCV-1 (namonia)\n• 10 hafte: Penta-2, OPV-2, Rota-2, PCV-2\n• 14 hafte: Penta-3, OPV-3, PCV-3, IPV\n• 9 mahine: Khasra-1 (measles), Typhoid vaccine\n• 15 mahine: Khasra-2\n• Hamal mein: Tetanus (TT) khoraakein maa aur nuzaida bachay ki hifazat karti hain\nNasihatein: har visit par vaccination card saath rakhein; halki zukaam vaccine mein taakheer ki wajah nahi; chhooti hui khoraak jald se jald dilwayein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "vaccination",
      "teeka",
      "ٹیکہ",
      "EPI",
      "immunization",
      "polio",
      "پولیو",
      "measles vaccine",
      "khasra teeka",
      "child vaccine schedule"
    ],
    "baseLevel": "ROUTINE",
    "audience": "child",
    "source": {
      "publisher": "Pakistan MoNHSRC (EPI)",
      "title": "Expanded Programme on Immunization schedule",
      "url": "https://www.nih.org.pk/?page_id=1182",
      "license": "Public information",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "vaccine-side-effects",
    "topic": "vaccination",
    "title": {
      "en": "Normal reactions after vaccination",
      "ur": "ٹیکے کے بعد معمول کی علامات",
      "roman": "Teekay ke baad mamool ki alamaat"
    },
    "content": {
      "en": "• It is NORMAL for 1–2 days after a vaccine to have: mild fever, soreness/redness where the injection was given, mild fussiness or reduced appetite.\n• WHAT HELPS: extra cuddles and fluids, cool clean cloth on the injection site, feeding as usual.\n• Ask a health worker about fever medicine suitable for age if needed.\n• SEE A DOCTOR IF: fever above 39°C for more than 48 hours, the child cries continuously for 3+ hours, becomes limp/unresponsive, or has a convulsion (rare).\n• These normal reactions mean the immune system is learning — they are not a reason to skip future doses.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• ٹیکے کے بعد 1-2 دن تک معمول ہے: ہلکا بخار، انجیکشن والی جگہ درد/سرخی، ہلکی بےچینی یا بھوک کم ہونا۔\n• کيا فائدہ دیتا ہے: زیادہ پیار اور مائعات، انجیکشن والی جگہ ٹھنڈا صاف کپڑا، معمول کی طرح دودھ/کھانا۔\n• ضرورت ہو تو عمر کے مطابق بخار کی دوا کے لیے ہیلتھ ورکر سے پوچھیں۔\n• ڈاکٹر کو دکھائیں: بخار 39°C سے زیادہ اور 48 گھنٹے سے زیادہ رہے، بچہ مسلسل 3 گھنٹے سے زیادہ روئے، سست/بےہوش ہو جائے، یا دورہ پڑے (نادر)۔\n• یہ معمول کی علامات بتاتی ہیں کہ مدافعت سیکھ رہی ہے — آئندہ خوراک چھوڑنے کی وجہ نہیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• Teekay ke baad 1-2 din tak mamool hai: halka bukhar, injection wali jagah dard/surkhi, halki bechaini ya bhook kam hona.\n• Kya faida deta hai: zyada pyar aur maayeaat, injection wali jagah thanda saaf kapra, mamool ki tarah doodh/khana.\n• Zaroorat ho to umar ke mutabiq bukhar ki dawa ke liye health worker se poochein.\n• DOCTOR KO DIKHAYEIN agar: bukhar 39°C se zyada aur 48 ghanton se zyada rahe, bacha musalsal 3 ghanton se zyada roye, sust/behosh ho jaye, ya dora paray (nadar).\n• Yeh mamool ki alamaat batati hain ke mudafiat seekh rahi hai — aainda khoraak chhorne ki wajah nahin.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "vaccine side effects",
      "teeka bukhar",
      "ٹیکے کے بعد بخار",
      "vaccine fever",
      "after vaccination",
      "injection site"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "child",
    "source": {
      "publisher": "WHO / UNICEF",
      "title": "Vaccine safety — common reactions",
      "url": "https://www.who.int/news-room/spotlight/ten-threats-to-global-health-in-2019",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "newborn-danger-signs",
    "topic": "newborn",
    "title": {
      "en": "Newborn danger signs — take the baby to a facility NOW",
      "ur": "نوزائیدہ کے خطرے کی علامات — فوراً ہسپتال لے جائیں",
      "roman": "Nuzaida bachay ke khatray ki alamaat — fori hospital le jayein"
    },
    "content": {
      "en": "A newborn (0–2 months) with ANY of these must be seen by a health worker the same day — do not wait:\n• Not feeding or unable to suck\n• Fast breathing (60+ breaths/minute) or chest pulling in\n• Fever (38°C+) or unusually cold body\n• Yellow palms and soles (jaundice getting worse)\n• Umbilical cord redness spreading or pus\n• Fewer than 3 feeds or very few wet nappies in 24 hours\n• Convulsions, stiff body, or excessive sleepiness\nA newborn’s condition can change fast — when unsure, get the baby checked. Keep the baby warm (skin-to-skin), breastfeed exclusively.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "نوزائیدہ بچے (0-2 مہینے) میں ان میں سے کوئی بھی علامت ہو تو اُسی دن ہیلتھ ورکر کو دکھائیں — انتظار نہ کریں:\n• دودھ نہ پینا یا چوسی نہ لینا\n• تیز سانس (منٹ میں 60 سے زیادہ) یا سینہ اندر کو کھنچنا\n• بخار (38°C+) یا جسم غیرمعمولی ٹھنڈا\n• ہتھیلیوں اور تلووں کی پیلی (یرقان بڑھنا)ن• ناڑ سرخی پھیلنا یا مادہ نکلنا\n• 24 گھنٹے میں 3 سے کم فیڈ یا بہت کم بھیگے ڈائپر\n• دورے، جسم سخت، یا زیادہ نیند\nنوزائیدہ کی حالت جلد بدل سکتی ہے — شک ہو تو معائنہ کروائیں۔ بچے کو گرم رکھیں (جلد سے جلد)، صرف دودھ پلائیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "Nuzaida bachay (0-2 mahine) mein in mein se koi bhi alamat ho to usi din health worker ko dikhayein — intezar na karein:\n• Doodh na peena ya choosi na lena\n• Tez saans (minute mein 60 se zyada) ya seena andar ko khinchna\n• Bukhar (38°C+) ya jism ghair-mamooli thanda\n• Hathelion aur talvon ki peeli (yarqan barhna)\n• Naar surkhi phailna ya mada nikalna\n• 24 ghanton mein 3 se kam feed ya bohot kam bheegay diaper\n• Doray, jism sakht, ya zyada neend\nNuzaida ki haalat jald badal sakti hai — shak ho to muaina karwayein. Bachay ko garam rakhein (jild se jild), sirf doodh pilayein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "newborn",
      "nuzaida",
      "نوزائیدہ",
      "newborn danger",
      "baby not feeding",
      "baby yellow",
      "jaundice baby",
      "yellow baby"
    ],
    "baseLevel": "URGENT",
    "audience": "child",
    "source": {
      "publisher": "WHO",
      "title": "Newborn care: danger signs (PSBI guidelines)",
      "url": "https://www.who.int/publications/i/item/9789241548269",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "pneumonia-child",
    "topic": "child-respiratory",
    "title": {
      "en": "Child cough with fast breathing — check for pneumonia",
      "ur": "بچے کو کھانسی کے ساتھ تیز سانس — نمونیا کی جانچ",
      "roman": "Bachay ko khansi ke saath tez saans — namonia ki jaanch"
    },
    "content": {
      "en": "Pneumonia is a leading cause of child deaths — and it is treatable when caught early.\nCOUNT THE BREATHS in one minute when the child is calm:\n• 0–2 months: fast breathing = 60+ breaths/minute → EMERGENCY, go now\n• 2–12 months: 50+ → go to a facility today\n• 1–5 years: 40+ → go to a facility today\nOTHER DANGER SIGNS: chest pulling in between ribs (indrawing), nostrils flaring, grunting sound, refusing to drink, blueness, convulsions, unconsciousness — GO IMMEDIATELY.\nMild cough without fast breathing: keep feeding, keep the child warm, watch breathing — most recover. Bring the child for a check-up if coughing lasts 2+ weeks.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "نمونیا بچوں کی اموات کی بڑی وجہ ہے — جلد پکڑ لی جائے تو علاج ممکن ہے۔\nبچے کو پرسکون حالت میں ایک منٹ سانس گنیں:\n• 0-2 مہینے: تیز سانس = منٹ میں 60 سے زیادہ → ایمرجنسی، فوراً جائیں\n• 2-12 مہینے: 50 سے زیادہ → آج ہی ہسپتال جائیں\n• 1-5 سال: 40 سے زیادہ → آج ہی ہسپتال جائیں\nدیگر خطرے کی علامات: پسلیوں کے بیچ سینہ اندر کو کھنچنا، ناک کے جھاگ، آہیں، پینے سے انکار، نیلا پن، دورے، بےہوشی — فوراً جائیں۔\nتیز سانس کے بغیر ہلکی کھانسی: کھانا جاری رکھیں، بچے کو گرم رکھیں، سانس پر نظر رکھیں — زیادہ تر ٹھیک ہو جاتے ہیں۔ کھانسی 2 ہفتے سے زیادہ رہے تو معائنہ کروائیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "Namonia bachon ki amwaat ki bari wajah hai — jald pakar li jaye to ilaaj mumkin hai.\nBachay ko pursakoon haalat mein aik minute saans ginein:\n• 0-2 mahine: tez saans = minute mein 60 se zyada → EMERGENCY, fori jayein\n• 2-12 mahine: 50 se zyada → aaj hi hospital jayein\n• 1-5 saal: 40 se zyada → aaj hi hospital jayein\nDeegar khatray ki alamaat: pasliyon ke beech seena andar ko khinchna, naak ke jhaag, aahen, peene se inkaar, neela pan, doray, behoshi — fori jayein.\nTez saans ke baghair halki khansi: khana jari rakhein, bachay ko garam rakhein, saans par nazar rakhein — zyada tar theek ho jate hain. Khansi 2 hafte se zyada rahe to muaina karwayein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard."
    },
    "tags": [
      "pneumonia",
      "namonia",
      "نمونیا",
      "child breathing",
      "fast breathing",
      "tez saans",
      "saans tez",
      "saans bohot tez",
      "بچے سانس",
      "سانس تیز",
      "child cough",
      "bachay ko khansi",
      "chest infection"
    ],
    "baseLevel": "URGENT",
    "audience": "child",
    "source": {
      "publisher": "WHO / UNICEF",
      "title": "Pneumonia in children — counting breaths (IMCI)",
      "url": "https://www.who.int/news-room/fact-sheets/detail/pneumonia",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "measles-child",
    "topic": "child-rash",
    "title": {
      "en": "Fever with rash in a child — could be measles",
      "ur": "بچے کو بخار کے ساتھ دانے — خسرہ ہو سکتا ہے",
      "roman": "Bachay ko bukhar ke saath danay — khasra ho sakta hai"
    },
    "content": {
      "en": "• Measles usually starts with fever, cough, runny nose and red watery eyes; a red blotchy rash appears 2–4 days later, starting behind the ears and face, then the body.\n• DANGER SIGNS — take the child to a facility NOW: unable to drink, fast/hard breathing, chest pulling in, convulsions, confusion, eyes becoming cloudy/discharging, severe diarrhoea.\n• CARE: continue feeding and fluids (danger is dehydration and complications), keep eyes clean with water, keep the child cool not cold, vitamin A is given at health facilities per WHO guidance.\nPREVENT: two doses of measles vaccine (9 and 15 months) — free at government centres. A child with measles should stay away from school/nursery and unvaccinated children for 4 days after the rash appears.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• خسرہ عام طور پر بخار، کھانسی، ناک بہنا اور سرخ پانی والی آنکھوں سے شروع ہوتا ہے؛ 2-4 دن بعد سرخ دانے نکلتے ہیں، کانوں اور چہرے سے شروع ہو کر جسم پر پھیلتے ہیں۔\n• خطرے کی علامات — فوراً ہسپتال لے جائیں: پینے کے قابل نہ ہونا، تیز/مشکل سانس، سینہ اندر کو کھنچنا، دورے، الجھن، آنکھیں دھندلی/بات گزرنا، شدید دست۔\n• دیکھ بھال: کھانا اور مائعات جاری رکھیں (خطرہ پانی کی کمی اور پیچیدگیوں سے ہے)، آنکھیں پانی سے صاف رکھیں، بچے کو ٹھنڈا نہیں معتدل رکھیں، عالمی ادارہ صحت کے مطابق ہیلتھ فیسلٹی پر وٹامن اے دیا جاتا ہے۔\nبچاؤ: خسرہ کی دو خوراکیں (9 اور 15 مہینے) — سرکاری مراکز میں مفت۔ خسرہ والا بچہ دانے نکلنے کے 4 دن بعد تک اسکول/غیر ویکسین شدہ بچوں سے دور رہے۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Khasra aam tor par bukhar, khansi, naak behna aur surkh paani wali aankhon se shuru hota hai; 2-4 din baad surkh danay nikalte hain, kanon aur chehray se shuru ho kar jism par phailte hain.\n• Khatray ki alamaat — FORI hospital le jayein: peene ke qabil na hona, tez/mushkil saans, seena andar ko khinchna, doray, uljhan, aankhein dhundli/baat guzarna, shadeed dast.\n• Dekh bhaal: khana aur maayeaat jari rakhein (khatra pani ki kami aur peechidgiyon se hai), aankhein paani se saaf rakhein, bachay ko thanda nahi moatadil rakhein, WHO ke mutabiq health facility par vitamin A diya jata hai.\n• Bachao: khasra ki do khoraakein (9 aur 15 mahine) — sarkari markaz mein muft.\n• Khasra wala bacha danay nikalne ke 4 din baad tak school/ghair-vaccine bachon se door rahe.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "measles",
      "khasra",
      "خسرہ",
      "rash fever child",
      "danay bukhar",
      "دانے بخار",
      "bukhar danay",
      "rash child",
      "measles rash"
    ],
    "baseLevel": "URGENT",
    "audience": "child",
    "source": {
      "publisher": "WHO",
      "title": "Measles fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/measles",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "burns-first-aid",
    "topic": "first-aid",
    "title": {
      "en": "Burns and scalds — first aid",
      "ur": "جلنے کے زخم — ابتدائی امداد",
      "roman": "Jalne ke zakhm — ibtidai imdad"
    },
    "content": {
      "en": "• 1.\n• COOL: run clean, cool water over the burn for 10–20 minutes.\n• Never use ice.\n• 2.\n• COVER: loosely with clean cloth or cling film.\n• Do not apply toothpaste, ghee, oil, henna, egg or any home remedy.\n• 3.\n• COMFORT: remove jewellery/tight items near the burn before swelling; give sips of water if fully awake.\n• GO TO HOSPITAL IF: the burn is larger than the person’s palm, on face/hands/feet/genitals/joints, deep, white or charred, caused by electricity or chemicals, or the person is a child or elderly, or smoke was inhaled (coughing, hoarse voice, soot).\n• WHAT NOT TO DO: do not burst blisters, do not peel clothing stuck to the skin.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• 1.\n• ٹھنڈا کریں: صاف ٹھنڈا بہتا پانی 10-20 منٹ زخم پر ڈالیں۔\n• برف کبھی نہ استعمال کریں۔\n• 2.\n• ڈھانپیں: صاف کپڑے یا کلنگ فلم سے ڈھیلا۔\n• ٹوتھ پیسٹ، گھی، تیل، مہندی، انڈا یا کوئی گھریلو نسخہ ہرگز نہ لگائیں۔\n• 3.\n• آرام: سوجن سے پہلے زخم کے قریب انگوٹھی/تنگ چیزیں اتاریں؛ ہوش میں ہو تو پانی کے گھونٹ دیں۔\n• ڈاکٹر کو دکھائیں: زخم ہتھیلی سے بڑا ہو، چہرے/ہاتھوں/پیروں/جسم کے نازک حصوں/جوڑوں پر ہو، گہرا ہو، سفید یا جلا ہوا ہو، بجلی یا کیمیکل سے ہو، بچہ یا بوڑھا شخص ہو، یا دھواں اندر گیا ہو (کھانسی، بدلتی آواز، کالک)۔\n• نہ کریں: پھوسیاں نہ پھوڑیں، جلد سے چپکی کپڑے نہ اتاریں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• 1.\n• Thanda karein: saaf thanda bahta paani 10-20 minute zakhm par dalein.\n• Barf kabhi na istemal karein.\n• 2.\n• Dhaanpein: saaf kapray ya cling film se dheela.\n• Toothpaste, ghee, tail, mehndi, anda ya koi gharelu nuskha hargiz na lagayein.\n• 3.\n• Aaraam: soojan se pehle zakhm ke qareeb angoothi/tang cheezain utarein; hosh mein ho to paani ke ghoont dein.\n• DOCTOR KO DIKHAYEIN agar: zakhm hatheli se bara ho, chehray/haathon/peron/jism ke nazuk hisson/joron par ho, gehra ho, safaid ya jala hua ho, bijli ya chemical se ho, bacha ya borha shakhs ho, ya dhuaan andar gaya ho (khansi, badalti aawaz, kaalak).\n• NA KAREIN: phosiyan na phodein, jild se chipkay kapray na utarein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "burn",
      "burns",
      "jala",
      "جل گیا",
      "burn first aid",
      "bohot jala",
      "scald",
      "garam pani",
      "chemical burn",
      "bijli",
      "severe-burns",
      "severe burns"
    ],
    "baseLevel": "URGENT",
    "audience": "emergency",
    "source": {
      "publisher": "IFRC",
      "title": "First aid for burns",
      "url": "https://www.ifrc.org/first-aid",
      "license": "Public education material",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "bleeding-first-aid",
    "topic": "first-aid",
    "title": {
      "en": "Severe bleeding — first aid",
      "ur": "شدید خون بہنا — ابتدائی امداد",
      "roman": "Shadeed khoon behna — ibtidai imdad"
    },
    "content": {
      "en": "• 1.\n• PRESS hard and directly on the wound with a clean cloth (use your hand with a barrier if nothing else).\n• 2.\n• DO NOT LIFT the cloth when it soaks — add more cloth on top and keep pressing.\n• 3.\n• RAISE the injured limb above heart level (if not broken).\n• 4.\n• LAY the person down and keep them warm.\n• 5.\n• CALL 1122 — heavy blood loss is life-threatening.\n• IF blood is SPURTING or will not stop after 10 minutes of firm pressure, or the person becomes pale/dizzy/sleepy — treat as an emergency and keep pressure on until help arrives.\n• NOSEBLEED: sit leaning slightly forward, pinch the soft part of the nose for 10 minutes without releasing.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• 1.\n• صاف کپڑے سے زخم پر سیدھا اور زور سے دباؤ ڈالیں (کچھ نہ ہو تو ہاتھ سے)۔\n• 2.\n• کپڑا بھیگ جائے تو نہ ہٹائیں — اوپر مزید کپڑا رکھیں اور دباؤ جاری رکھیں۔\n• 3.\n• زخمی حصہ دل کی سطح سے اوپر اٹھائیں (اگر ٹوٹا نہ ہو)۔\n• 4.\n• شخص کو لٹائیں اور گرم رکھیں۔\n• 5.\n• 1122 پر کال کریں — زیادہ خون کا ضیاع جان لیوا ہے۔\n• اگر خون فوارے کی طرح اُبل رہا ہو یا 10 منٹ مسلسل دباؤ کے باوجود نہ رکے، یا شخص پیلا/چکر کھاتا/سستا ہو جائے — ایمرجنسی سمجھیں اور مدد آنے تک دباؤ جاری رکھیں۔\n• ناک سے خون: تھوڑا آگے جھک کر بیٹھیں، ناک کے نرم حصے کو 10 منٹ بغیر چھوڑے دبائیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• 1.\n• Saaf kapray se zakhm par seedha aur zor se dabao dalayein (kuch na ho to haath se).\n• 2.\n• Kapra bheeg jaye to na hatayein — oopar mazeed kapra rakhein aur dabao jari rakhein.\n• 3.\n• Zakhmi hissa dil ki satah se oopar uthayein (agar toota na ho).\n• 4.\n• Shakhs ko litayein aur garam rakhein.\n• 5.\n• 1122 par call karein — zyada khoon ka ziya jaan lewa hai.\n• Agar khoon fawaray ki tarah ubal raha ho ya 10 minute musalsal dabao ke bawajood na ruke, ya shakhs peela/chakkar khata/susta ho jaye — emergency samjhein aur madad aane tak dabao jari rakhein.\n• Naak se khoon: thora aagay jhuk kar baithay, naak ke naram hissay ko 10 minute baghair chhoray dabayein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard."
    },
    "tags": [
      "heavy bleeding",
      "severe bleeding",
      "bleeding first aid",
      "uncontrolled bleeding",
      "bleeding wont stop",
      "khoon beh raha",
      "khoon nahi ruk raha",
      "khoon behna",
      "خون بہہ رہا",
      "خون نہیں رک رہا",
      "wound bleeding",
      "nose bleed",
      "nak se khoon",
      "blood loss",
      "haemorrhage"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "emergency",
    "source": {
      "publisher": "IFRC",
      "title": "First aid for severe bleeding",
      "url": "https://www.ifrc.org/first-aid",
      "license": "Public education material",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "choking-cpr",
    "topic": "first-aid",
    "title": {
      "en": "Choking and CPR — basic life support",
      "ur": "گلا پھنسنا اور سی پی آر — بنیادی زندگی بچاؤ",
      "roman": "Gala phansna aur CPR — bunyadi zindagi bachao"
    },
    "content": {
      "en": "• CHOKING (adult/child over 1 year): ask “Are you choking?” If they cannot speak/cough: give up to 5 firm back blows between shoulder blades, then up to 5 abdominal thrusts (above navel).\n• Alternate until the object comes out or they collapse.\n• For infants under 1: 5 back blows + 5 chest thrusts, never abdominal.\n• IF UNRESPONSIVE: shout for help, call 1122, start CPR — push hard and fast in the centre of the chest, about 2 per second, 30 pushes then 2 breaths if trained.\n• Keep going until help arrives or the person responds.\n• Learning CPR from a certified trainer is strongly recommended — this guidance is a reminder, not a course.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• گلا پھنسنا (بالغ/1 سال سے بڑا بچہ): پوچھیں \"گلا پھنسا ہے؟\" اگر بول/کھانسی نہ سکے: کندھے کی ہڈیوں کے بیچ 5 زور دار تھپڑ لگائیں، پھر ناف کے اوپر 5 بار پیٹ پر جھٹکا دیں۔\n• چیز نکلنے یا بےہوشی تک دہرائیں۔\n• 1 سال سے چھوٹے بچے: 5 پیٹھ کے تھپڑ + 5 سینے کے دھکے، پیٹ پر کبھی نہیں۔\n• بےہوش ہو جائے تو: مدد پکارے، 1122 پر کال کرے، سی پی آر شروع کرے — سینے کے درمیان سخت اور تیز دباؤ، سیکنڈ میں تقریباً 2، 30 دباؤ پھر 2 سانسیں (تربیت ہو تو)۔\n• مدد آنے یا ہوش آنے تک جاری رکھیں۔\n• سند یافتہ ٹرینر سے سی پی آر سیکھنا بہت ضروری ہے — یہ یاد دہانی ہے، کورس نہیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Gala phansna (baray/1 saal se bara bacha): poochein \"gala phansa hai?\" Agar bol/khansi na sake: kandhay ki hadiyon ke beech 5 zor-dar thapar lagayein, phir naaf ke oopar 5 baar pet par jhatka dein.\n• Cheez nikalne ya behoshi tak dohrayein.\n• 1 saal se chhota bacha: 5 peeth ke thapar + 5 seenay ke dhakay, pet par kabhi nahin.\n• Behosh ho jaye to: madad pukare, 1122 par call kare, CPR shuru kare — seenay ke darmiyan sakht aur tez dabao, second mein taqreeban 2, 30 dabao phir 2 saansein (tarbiyat ho to).\n• Madad aane ya hosh aane tak jari rakhein.\n• Sanad-yafta trainer se CPR seekhna bohot zaroori hai — yeh yaad-dehwani hai, course nahin.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "choking",
      "gala phans gaya",
      "گلا پھنس",
      "CPR",
      "dil ka dorah",
      "cardiac arrest",
      "unresponsive",
      "back blows",
      "heimlich"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "emergency",
    "source": {
      "publisher": "IFRC",
      "title": "Basic life support — choking & CPR",
      "url": "https://www.ifrc.org/first-aid",
      "license": "Public education material",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "snake-dog-bites",
    "topic": "bites",
    "title": {
      "en": "Snake and dog bites — what to do",
      "ur": "سانپ اور کتے کے کاٹنے پر کیا کریں",
      "roman": "Saanp aur kutte ke kaatne par kya karein"
    },
    "content": {
      "en": "• SNAKE BITE: keep the person and bitten limb COMPLETELY still, lower than the heart.\n• Remove rings/tight items.\n• Go to hospital fast — anti-venom is the treatment and is only in hospitals.\n• Do NOT cut, suck, apply tourniquet or ice, and do not give any medicine or alcohol.\n• Call 1122 for transport.\n• DOG BITE / SCRATCH / LICK ON BROKEN SKIN: wash the wound under running water with soap for a full 15 minutes, apply antiseptic, and SEE A DOCTOR THE SAME DAY for rabies vaccination — rabies is 100% fatal once symptoms start but 100% preventable with timely vaccination.\n• Report the animal if possible and observe it for 10 days.\n• Also ask about tetanus protection.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• سانپ کا کاٹنا: شخص اور کٹا ہوا حصہ بالکل ساکن رکھیں، دل سے نیچے۔\n• انگوٹھی/تنگ چیزیں اتاریں۔\n• جلد ہسپتال پہنچیں — علاج اینٹی وینم سے ہے جو صرف ہسپتال میں ہوتا ہے۔\n• زخم کو نہ کاٹیں، نہ چوسیں، نہ پٹی کسیں، نہ برف لگائیں، نہ کوئی دوا یا شراب دیں۔\n• سواری کے لیے 1122 پر کال کریں۔\n• کتے کا کاٹنا/خراڑ/زخم پر لیس: زخم کو صابن سے بہتے پانی میں پورے 15 منٹ دھوئیں، اینٹی سیپٹک لگائیں، اور ریبیز ویکسین کے لیے اُسی دن ڈاکٹر کو دکھائیں — ریبیز علامات شروع ہونے پر 100% جان لیوا مگر بروقت ویکسین سے 100% قابلِ روک تھام۔\n• ممکن ہو تو جانور کی اطلاع دیں اور 10 دن مشاہدہ کریں۔\n• ٹٹنس کا تحفظ بھی پوچھیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• Saanp ka kaatna: shakhs aur kata hua hissa bilkul sakin rakhein, dil se neeche.\n• Angoothi/tang cheezain utarein.\n• Jald hospital pohanchein — ilaaj anti-venom se hai jo sirf hospital mein hota hai.\n• Zakhm ko na kaatein, na choosein, na patti kasein, na barf lagayein, na koi dawa ya sharaab dein.\n• Sawari ke liye 1122 par call karein.\n• Kutte ka kaatna/kharaar/zakhm par lees: zakhm ko sabun se bahta paani mein poore 15 minute dhoyein, antiseptic lagayein, aur rabies vaccine ke liye usi din DOCTOR KO DIKHAYEIN — rabies alamaat shuru hone par 100% jaan lewa magar bar waqt vaccine se 100% qabil-e-rok thaam.\n• Mumkin ho to janwar ki ittila dein aur 10 din mushahida karein.\n• Tetanus ka hifazat bhi poochein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "snake bite",
      "saanp ne kaata",
      "سانپ",
      "dog bite",
      "kutta kaat gaya",
      "کتے نے کاٹا",
      "rabies",
      "ريبيز",
      "animal bite",
      "antivenom",
      "snakebite"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "emergency",
    "source": {
      "publisher": "WHO",
      "title": "Snakebite envenoming / Rabies fact sheets",
      "url": "https://www.who.int/news-room/fact-sheets/detail/rabies",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "heat-illness",
    "topic": "environment",
    "title": {
      "en": "Heat exhaustion and heat stroke",
      "ur": "لو کی تھکن اور لُو لگنا (ہیٹ اسٹروک)",
      "roman": "Lou ki thakaan aur lou lagna (heat stroke)"
    },
    "content": {
      "en": "• HEAT EXHAUSTION: heavy sweating, weakness, dizziness, headache, nausea, cramps — move to shade, lie down, cool with wet cloths, sip ORS/water.\n• Usually improves in 30–60 minutes.\n• HEAT STROKE IS AN EMERGENCY / GO IMMEDIATELY: body temperature very high, skin HOT and often DRY, confusion, fainting, fast breathing, convulsions.\n• Call 1122 immediately; move to shade/cold room, remove excess clothing, wet the skin and fan continuously until help arrives.\n• Give sips only if fully awake.\nPREVENT in hot months: drink water every 20–30 minutes even without thirst, avoid outdoor work 11am–3pm, wear light loose clothing, never leave children in parked vehicles.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• لو کی تھکن: بہت پسینہ، کمزوری، چکر، سر درد، متلی، اکڑن — چھاؤں میں جائیں، لیٹ جائیں، گیلی تولیے سے ٹھنڈا کریں، او آر ایس/پانی کے گھونٹ لیں۔\n• عام طور پر 30-60 منٹ میں بہتری۔\n• لو لگنا (ہیٹ اسٹروک) ایمرجنسی ہے: جسم کا درجہ حرارت بہت زیادہ، جلد گرم اور اکثر خشک، الجھن، بےہوشی، تیز سانس، دورے۔\n• فوراً 1122 پر کال کریں؛ چھاؤں/ٹھنڈی جگہ لے جائیں، زیادہ کپڑے اتاریں، جلد گیلی کریں اور مدد آنے تک مسلسل ہوا کریں۔\n• پورے ہوش میں ہو تو صرف گھونٹ دیں۔\n• گرم مہینوں میں بچاؤ: پیاس نہ ہو تب بھی ہر 20-30 منٹ پر پانی پیں، 11 سے 3 بجے دھوپ کا کام نہ کریں، ہلکے ڈھیلے کپڑے پہنیں، بچوں کو بند گاڑی میں کبھی نہ چھوڑیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Lou ki thakaan: bohot paseena, kamzori, chakkar, sar dard, matli, akarrhan — chhaon mein jayein, lait jayein, geeli toliyon se thanda karein, ORS/paani ke ghoont lein.\n• Aam tor par 30-60 minute mein behtari.\n• Lou lagna (heat stroke) EMERGENCY hai: jism ka darja-e-hararat bohot zyada, jild garam aur aksar khushk, uljhan, behoshi, tez saans, doray.\n• Fori tor par 1122 par call karein; chhaon/thandi jagah le jayein, zyada kapray utaarein, jild geeli karein aur madad aane tak musalsal hawa karein.\n• Poore hosh mein ho to sirf ghoont dein.\n• Garm mahinon mein bachao: pyaas na ho tab bhi har 20-30 minute par paani peein, 11 se 3 bajay dhoop ka kaam na karein, halkay dheelay kapray pehnein, bachon ko band gaari mein kabhi na chhorhein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard."
    },
    "tags": [
      "heat stroke",
      "heat exhaustion",
      "loo",
      "لو",
      "garmi lagna",
      "گرمی لگنا",
      "dehydrated hot",
      "heat illness",
      "loo lagna"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Heat and health guidance",
      "url": "https://www.who.int/health-topics/heatwaves",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "wound-care",
    "topic": "first-aid",
    "title": {
      "en": "Cuts, wounds and tetanus protection",
      "ur": "زخم، کٹوٹ اور ٹٹنس سے بچاؤ",
      "roman": "Zakhm, katot aur tetanus se bachao"
    },
    "content": {
      "en": "• CLEAN: wash small cuts with clean running water and soap for several minutes; remove visible dirt.\n• Do not pour undiluted antiseptics deep into wounds.\n• COVER: apply a clean dressing; change daily or when wet/dirty.\n• Watch for infection: increasing redness, swelling, warmth, pus, fever — see a health facility if these appear.\n• TETANUS: any wound contaminated with soil/rust/manure — especially deep puncture wounds — needs a same-day check-up for tetanus vaccination.\n• Ensure your whole family’s tetanus shots are up to date (booster every 10 years for adults).\n• HEAVY BLEEDING, deep wounds, foreign objects stuck inside, or wounds from bites → seek care immediately; do not remove deeply embedded objects.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• صفائی: چھوٹے زخم کو صاف بہتے پانی اور صابن سے کئی منٹ دھوئیں؛ نظر آنے والی گندگی نکالیں۔\n• گہرے زخم میں متوازن اینٹی سیپٹک نہ ڈالیں۔\n• ڈھانپ: صاف پٹی لگائیں؛ روزانہ یا گیلی/گندا ہونے پر بدلیں۔\n• انفیکشن کی علامات: بڑھتی سرخی، سوجن، گرمی، مادہ، بخار — یہ نظر آئیں تو ہیلتھ فیسلٹی جائیں۔\n• ٹٹنس: مٹی/زنگ/کھاد سے آلودہ کوئی بھی زخم — خصوصاً گہرے سوراخ والے — اُسی دن ٹٹنس ویکسین کے لیے معائنہ کروائیں۔\n• پورے خاندان کی ٹٹنس ویکسین اپ ڈیٹ رکھیں (بالغوں کو ہر 10 سال بوسٹر)۔\n• شدید خون، گہرے زخم، اندر کوئی چیز پھنسی، یا کاٹنے والے زخم → فوری طبی امداد؛ اندر دھنسے اشیاء نہ نکالیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Safai: chhotay zakhm ko saaf bahta paani aur sabun se kai minute dhoyein; nazar aane wali gandagi nikalein.\n• Gehray zakhm mein ghair-mutawazan antiseptic na dalein.\n• Dhaanp: saaf patti lagayein; rozana ya geeli/ganda hone par badlein.\n• Infection ki alamaat: barhti surkhi, soojan, garmi, mada, bukhar — yeh nazar aayein to health facility jayein.\n• Tetanus: mitti/zang/khaad se aalood koi bhi zakhm — khaas tor par gehray soorakh walay — usi din tetanus vaccine ke liye muaina karwayein.\n• Poore khandan ki tetanus vaccine update rakhein (baron ko har 10 saal booster).\n• Shadeed khoon, gehray zakhm, andar koi cheez phansi, ya kaatne walay zakhm → fori tibbi imdad; andar dhansay ashya na nikalein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "wound",
      "cut",
      "zakhm",
      "زخم",
      "katot",
      "tetanus",
      "ٹٹنس",
      "infection wound",
      "zang laga",
      "rusty",
      "injury",
      "accident",
      "hit by car",
      "hit by bike",
      "road accident",
      "chot",
      "choat lagi",
      "minor injury"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "IFRC / WHO",
      "title": "Wound care and tetanus prevention",
      "url": "https://www.who.int/immunization/diseases/tetanus",
      "license": "Public education material",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "water-hygiene",
    "topic": "prevention",
    "title": {
      "en": "Safe water and handwashing",
      "ur": "صاف پانی اور ہاتھ دھونا",
      "roman": "Saaf paani aur haath dhona"
    },
    "content": {
      "en": "• SAFE WATER: drink water that is boiled (rolling boil 1 minute) or filtered/chemically treated — especially for children, elderly and in monsoon/after floods.\n• Store in a clean covered container with a tap or ladle; do not dip hands in drinking water.\n• HANDWASHING (20 seconds with soap) protects your whole family: before eating or feeding a child, before cooking, after using the toilet, after changing nappies, after touching animals, and after coughing/sneezing.\n• FOOD: wash fruit/vegetables in safe water, cook food thoroughly and reheat until steaming, avoid leftover food kept at room temperature for hours.\n• These simple habits prevent diarrhoea, typhoid, hepatitis A/E, cholera and polio — major illnesses in Pakistan.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• صاف پانی: ابلا ہوا (مکمل ابلاؤ 1 منٹ)، فلٹر شدہ یا کیمیائی طور پر صاف پانی پیں — خاص طور پر بچوں، بوڑھوں کے لیے اور مون سون/سیلاب کے بعد۔\n• صاف ڈھکن والے برتن میں محفوظ کریں جس میں ٹونٹی یا کفگیر ہو؛ پیڑا پانی میں ہاتھ نہ ڈالیں۔\n• ہاتھ دھونا (صابن سے 20 سیکنڈ) پورے خاندان کو بچاتا ہے: کھانے یا بچے کو کھلانے سے پہلے، کھانا پکانے سے پہلے، ٹوائلٹ کے بعد، ڈائپر بدلنے کے بعد، جانوروں کو چھونے کے بعد، اور کھانسی/چھینک کے بعد۔\n• کھانا: پھل/سبزیاں صاف پانی میں دھوئیں، کھانا اچھی طرح پکائیں اور بھاپ اٹھنے تک دوبارہ گرم کریں، گھنٹوں کمرے کے درجہ حرارت پر رکھا کھانا نہ کھائیں۔\n• یہ آسان عادیتیں دست، ٹائیفائیڈ، ہیپاٹائٹس اے/ای، ہیضہ اور پولیو جیسی بڑی بیماریوں سے بچاتی ہیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Saaf paani: ubla hua (mukammal ublaao 1 minute), filter shuda ya chemically saaf paani peein — khaas tor par bachon, borhon ke liye aur monsoon/selaab ke baad.\n• Saaf dhakkan walay bartan mein mehfooz karein jis mein tonti ya kafgeer ho; peene ke paani mein haath na dalein.\n• Haath dhona (sabun se 20 second) poore khandan ko bachata hai: khane ya bachay ko khilane se pehle, khana pakane se pehle, toilet ke baad, diaper badalne ke baad, janwaron ko chhone ke baad, aur khansi/chheenk ke baad.\n• Khana: phal/sabziyan saaf paani mein dhoyein, khana achi tarah pakayein aur bhaap uthne tak dobara garam karein, ghanton kamray ke darja-e-hararat par rakha khana na khayein.\n• Yeh aasan aadatein dast, typhoid, hepatitis A/E, heza aur polio jaisi bari bimariyon se bachati hain.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "safe water",
      "saaf paani",
      "صاف پانی",
      "handwashing",
      "haath dhona",
      "ہاتھ دھونا",
      "hygiene",
      "boil water",
      "food safety"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Guidelines for drinking-water quality / hand hygiene",
      "url": "https://www.who.int/teams/environment-climate-change-and-health/water-sanitation-and-health",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "headache",
    "topic": "headache",
    "title": {
      "en": "Headache — care at home and warning signs",
      "ur": "سر درد — گھر پر دیکھ بھال اور خطرے کی علامات",
      "roman": "Sar dard — ghar par dekh bhaal aur khatray ki alamaat"
    },
    "content": {
      "en": "• Most headaches get better with rest, drinking water, sleep and less screen time\n• Common triggers: stress and tension, skipped meals, dehydration, too much sun, eye strain\n• Ask a pharmacist or doctor about simple pain relief — follow the label, never take more than it says\n• A cool cloth on the forehead and a quiet, dim room help many people\nSEE A DOCTOR IF: headaches keep returning for weeks, wake you from sleep, come with fever and a stiff neck, vomiting or vision changes, or start after a head injury.\nGO IMMEDIATELY if: this is the worst headache of your life, it starts suddenly like a thunderclap, or follows a head injury with vomiting, drowsiness or confusion.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• زیادہ تر سر درد آرام، پانی، نیند اور کم اسکرین ٹائم سے بہتر ہو جاتے ہیں\n• عام محرکات: پریشانی اور ذہنی دباؤ، کھانا چھوڑنا، پانی کی کمی، زیادہ دھوپ، آنکھوں پر بوجھ\n• سادہ درد کم کرنے والی دوا کے بارے میں فارماسسٹ یا ڈاکٹر سے پوچھیں — لیبل کی ہدایت پر چلیں، اس سے زیادہ کبھی نہ لیں\n• ماتھے پر ٹھنڈا کپڑا اور خاموش، مدھم روشنی والا کمرہ بہت سوں کو آرام دیتا ہے\nڈاکٹر کو دکھائیں: سر درد ہفتوں تک بار بار آئے، نیند سے جگائیں، بخار اور سخت گردن کے ساتھ ہو، الٹی یا نظر بدلنے کے ساتھ ہو، یا سر کی چوٹ کے بعد شروع ہو۔\nفوراً جائیں اگر: یہ زندگی کا سب سے شدید سر درد ہو، اچانک بجلی کی کڑک کی طرح شروع ہو، یا سر کی چوٹ کے بعد الٹی، سستی یا الجھن کے ساتھ ہو۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Zyada tar sar dard aaraam, paani, neend aur kam screen time se behtar ho jate hain\n• Aam muharrikaat: pareshani aur tension, khana chhorna, pani ki kami, zyada dhoop, aankhon par boojh\n• Sada dard kam karne wali dawa ke baray mein pharmacist ya doctor se poochein — label ki hidayat par chalein, us se zyada kabhi na lein\n• Mathay par thanda kapra aur khamosh, madham roshni wala kamra bohot logon ko aaraam deta hai\nDOCTOR KO DIKHAYEIN agar: sar dard hafton tak baar baar aaye, neend se jagayen, bukhar aur sakht gardan ke saath ho, ulti ya nazar badalne ke saath ho, ya sir ki chot ke baad shuru ho.\nFORAN JAYEIN agar: yeh zindagi ka sab se sakht sar dard ho, achanak bijli ki kadak ki tarah shuru ho, ya sir ki chot ke baad ulti, susti ya uljhan ke saath ho.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "headache",
      "headeach",
      "head ache",
      "hedache",
      "sar dard",
      "سر درد",
      "mild headache",
      "head pain",
      "worst headache",
      "sudden headache",
      "migraine",
      "tension headache",
      "sar dard aur bukhar",
      "headache after screen"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Migraine and other headache disorders — fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/headache-disorders",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "sore-throat",
    "topic": "sore-throat",
    "title": {
      "en": "Sore throat — home care and when it needs a doctor",
      "ur": "گلے کا درد — گھریلو دیکھ بھال اور ڈاکٹر کب ضروری",
      "roman": "Gale ka dard — gharelu dekh bhaal aur doctor kab zaroori"
    },
    "content": {
      "en": "• Most sore throats are viral and improve in 3–7 days without antibiotics\n• Drink warm fluids (soup, tea; honey is fine for adults and children over 1 year) and keep the throat moist\n• Gargling with warm salt water several times a day soothes pain — spit it out, do not swallow\n• Rest your voice; avoid smoke, dust and very cold drinks\n• Ask a pharmacist or doctor about lozenges or pain relief — never take leftover antibiotics\nSEE A DOCTOR IF: severe throat pain with high fever, white patches or pus on the tonsils, swollen neck glands, difficulty swallowing or breathing, a rash, drooling in a child, or no improvement after one week.\nUntreated strep throat can later harm the heart (rheumatic heart disease) — always have a child with fever and throat pain checked.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• زیادہ تر گلے کے درد وائرس سے ہوتے ہیں اور اینٹی بائیوٹک کے بغیر 3-7 دن میں بہتر ہو جاتے ہیں\n• گرم مائعات پیں (سوپ، چائے؛ شہد بڑوں اور ایک سال سے بڑے بچوں کے لیے ٹھیک ہے) اور گلا نم رکھیں\n• دن میں کئی بار گرم نمک والے پانی سے غرارے کریں — پیٹ میں نہ جائے، تھوک دیں\n• آواز کو آرام دیں؛ دھوئیں، مٹی اور بہت ٹھنڈے مشروبات سے بچیں\n• گلے کی گولیاں یا درد کی دوا کے بارے میں فارماسسٹ یا ڈاکٹر سے پوچھیں — بچی ہوئی اینٹی بائیوٹک کبھی نہ لیں\nڈاکٹر کو دکھائیں: شدید گلے کے درد کے ساتھ تیز بخار، ٹاسلز پر سفید دانے یا مادہ، گردن کی گلٹیاں، نگلنے یا سانس لینے میں مشکل، جسم پر دانے نکل آئیں، بچے کا لار ٹپکنا، یا ایک ہفتے میں بہتری نہ ہو۔\nبغیر علاج کا اسٹریپ انفیکشن بعد میں دل کو نقصان پہنچا سکتا ہے (ریمیٹک ہارٹ ڈیزیز) — بخار اور گلے کے درد والے بچے کو ضرور دکھائیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Zyada tar gale ke dard virus se hote hain aur antibiotic ke baghair 3-7 din mein behtar ho jate hain\n• Garm maayeaat peein (soup, chai; shehad baron aur aik saal se baray bachon ke liye theek hai) aur gala num rakhein\n• Din mein kai baar garam namak wale paani se ghararay karein — peit mein na jaye, thook dein\n• Aawaz ko aaraam dein; dhuen, mitti aur bohot thanday mashroobaat se bachein\n• Gale ki goliyan ya dard ki dawa ke baray mein pharmacist ya doctor se poochein — bachi hui antibiotic kabhi na lein\nDOCTOR KO DIKHAYEIN agar: sakht gale ke dard ke saath tez bukhar, tonsils par safaid danay ya mada, gardan ki giltiyan, nigalne ya saans lene mein mushkil, jism par danay nikal aayein, bachay ka laar tapakna, ya aik hafte mein behtari na ho.\nBaghair ilaaj ka strep infection baad mein dil ko nuksan pohancha sakta hai (rheumatic heart disease) — bukhar aur gale ke dard walay bachay ko zaroor dikhayein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "sore throat",
      "gala kharab",
      "گلا خراب",
      "gale mein dard",
      "throat pain",
      "گلے میں درد",
      "throat infection",
      "gala sujna",
      "tonsils",
      "difficulty swallowing",
      "strep throat"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Rheumatic heart disease fact sheet — strep sore throat",
      "url": "https://www.who.int/news-room/fact-sheets/detail/rheumatic-heart-disease",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "covid-flu",
    "topic": "respiratory",
    "title": {
      "en": "COVID-19 and flu — care at home and urgent warning signs",
      "ur": "کووڈ-19 اور فلو — گھر پر دیکھ بھال اور فوری خطرے کی علامات",
      "roman": "COVID-19 aur flu — ghar par dekh bhaal aur fori khatray ki alamaat"
    },
    "content": {
      "en": "• COVID-19 and flu spread through cough and sneeze droplets — most people recover safely at home\n• Stay home, rest and drink plenty of fluids; ask a pharmacist or doctor about fever and pain relief\n• Protect the family: wear a mask around household members, let fresh air in, wash hands often, keep utensils separate\n• Cover coughs and sneezes; clean commonly touched surfaces daily\nSEE A DOCTOR IF: fever lasts more than 3 days, symptoms worsen after first improving, or the patient is pregnant, elderly, or has diabetes, heart or lung disease.\nGO IMMEDIATELY if: difficulty breathing, chest pain or pressure, blue lips or face, confusion, inability to drink, or no urine for 8+ hours — call 1122 if breathing becomes hard.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• کووڈ-19 اور فلو کھانسی اور چھینک کے قطرات سے پھیلتے ہیں — زیادہ تر لوگ گھر پر ہی محفوظ طریقے سے صحتیاب ہو جاتے ہیں\n• گھر پر رہیں، آرام کریں اور کافی مائعات لیں؛ بخار اور درد کی دوا کے بارے میں فارماسسٹ یا ڈاکٹر سے پوچھیں\n• خاندان کی حفاظت کریں: گھر والوں کے ساتھ ماسک لگائیں، کمروں میں تازہ ہوا لائیں، بار بار ہاتھ دھوئیں، برتن الگ رکھیں\n• کھانسی اور چھینک ڈھانپیں؛ روزانہ عام چھوئی جانے والی چیزیں صاف کریں\nڈاکٹر کو دکھائیں: بخار 3 دن سے زیادہ رہے، علامات پہلے کم ہو کر پھر بڑھ جائیں، یا مریض حاملہ، بوڑھا ہو یا ذیابیطس، دل یا پھیپھڑوں کی بیماری ہو۔\nفوراً جائیں اگر: سانس لینے میں مشکل، سینے میں درد یا دباؤ، نیلے ہونٹ یا چہرہ، الجھن، پینے کے قابل نہ ہونا، یا 8 گھنٹے سے زیادہ پیشاب نہ آنا — سانس مشکل ہو تو 1122 پر کال کریں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• COVID-19 aur flu khansi aur chheenk ke qatron se phailte hain — zyada tar log ghar par hi mehfooz tareeqe se theek ho jate hain\n• Ghar par rahein, aaraam karein aur kaafi maayeaat lein; bukhar aur dard ki dawa ke baray mein pharmacist ya doctor se poochein\n• Khandan ki hifazat karein: ghar walon ke saath mask lagayein, kamron mein taaza hawa layein, baar baar haath dhoyein, bartan alag rakhein\n• Khansi aur chheenk dhanpein; rozana aam chhue jane wali cheezein saaf karein\nDOCTOR KO DIKHAYEIN agar: bukhar 3 din se zyada rahe, alamaat pehle kam ho kar phir barh jayen, ya mareez hamal wali, borha ho ya sugar, dil ya phaingron ki bimari ho.\nFORAN JAYEIN agar: saans lene mein mushkil, seene mein dard ya dabao, neele hont ya chehra, uljhan, peene ke qabil na hona, ya 8 ghanton se zyada peshab na aana — saans mushkil ho to 1122 par call karein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "covid",
      "covid-19",
      "corona",
      "کورونا",
      "flu",
      "influenza",
      "zukaam",
      "flu bukhar",
      "coronavirus",
      "isolation",
      "cough fever"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Coronavirus disease (COVID-19) fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/coronavirus-disease-(covid-19)",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "hepatitis-a",
    "topic": "hepatitis",
    "title": {
      "en": "Hepatitis A and E — jaundice from food and water",
      "ur": "ہیپاٹائٹس اے اور ای — کھانے پینے سے ہونے والا یرقان",
      "roman": "Hepatitis A aur E — khane pine se hone wala yarqan"
    },
    "content": {
      "en": "• Hepatitis A and E spread through contaminated water and food — common in Pakistan, especially in summer and after floods\n• Signs: tiredness, loss of appetite, nausea, fever, then yellowing of eyes and skin (jaundice), dark urine and pale stools\n• There is no specific medicine — recovery needs rest, plenty of fluids and avoiding fatty food; most people recover fully in a few weeks\n• Avoid alcohol and unnecessary medicines while the liver heals\nSEE A DOCTOR early for any jaundice — a blood test shows which type it is.\nGO IMMEDIATELY if: confusion or extreme sleepiness, bleeding gums or nose, a swollen abdomen, or jaundice in a pregnant woman.\nPREVENT: boiled or filtered water, handwashing, properly cooked food — a hepatitis A vaccine also exists, ask a doctor.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• ہیپاٹائٹس اے اور ای گندے پانی اور کھانے سے پھیلتے ہیں — پاکستان میں عام، خاص طور پر گرمیوں اور سیلاب کے بعد\n• علامات: تھکاوٹ، بھوک کم ہونا، متلی، بخار، پھر آنکھوں اور جلد کا پیلا ہونا (یرقان)، گہرا پیشاب اور ہلکے رنگ کا پاخانہ\n• کوئی خاص دوا نہیں — بحالی کے لیے آرام، کافی مائعات اور چکنی غذا سے پرہیز؛ زیادہ تر لوگ چند ہفتوں میں مکمل ٹھیک ہو جاتے ہیں\n• جگر ٹھیک ہو رہا ہو تو شراب اور غیر ضروری دوائیوں سے پرہیز کریں\nکسی بھی یرقان پر ابتدا میں ڈاکٹر کو دکھائیں — خون کا ٹیسٹ قسم بتاتا ہے۔\nفوراً جائیں اگر: الجھن یا حد سے زیادہ نیند، مسوڑھوں یا ناک سے خون، پیٹ پھولنا، یا حاملہ عورت کو یرقان ہو۔\nبچاؤ: ابلا یا فلٹر شدہ پانی، ہاتھ دھونا، اچھی طرح پکا کھانا — ہیپاٹائٹس اے کی ویکسین بھی موجود ہے، ڈاکٹر سے پوچھیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Hepatitis A aur E ganday paani aur khane se phailte hain — Pakistan mein aam, khaas tor par garmiyon aur selaab ke baad\n• Alamaat: thakaan, bhook kam hona, matli, bukhar, phir aankhon aur jild ka peela hona (yarqan), gehra peshab aur halkay rang ka paikhana\n• Koi khaas dawa nahin — bahali ke liye aaraam, kaafi maayeaat aur chikni ghiza se parhez; zyada tar log chand hafton mein mukammal theek ho jate hain\n• Jigar theek ho raha ho to sharab aur ghair-zaroori dawayon se parhez karein\nKisi bhi yarqan par ibtidah mein DOCTOR KO DIKHAYEIN — khoon ka test qism batata hai.\nFORAN JAYEIN agar: uljhan ya had se zyada neend, masoorhon ya naak se khoon, pet phoolna, ya hamal wali khatoon ko yarqan ho.\nBachao: ubla ya filter shuda paani, haath dhona, achi tarah paka khana — Hepatitis A ki vaccine bhi maujood hai, doctor se poochein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "hepatitis a",
      "hepatitis e",
      "yarqan",
      "یرقان",
      "jaundice",
      "yellow eyes",
      "peeli aankhein",
      "پیلی آنکھیں",
      "کملی",
      "jigar ki sozish",
      "liver jaundice"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Hepatitis A fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/hepatitis-a",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "hepatitis-b",
    "topic": "hepatitis",
    "title": {
      "en": "Hepatitis B and C — how they spread and why testing matters",
      "ur": "ہیپاٹائٹس بی اور سی — پھیلاؤ اور ٹیسٹ کیوں ضروری",
      "roman": "Hepatitis B aur C — phelao aur test kyun zaroori"
    },
    "content": {
      "en": "• Hepatitis B and C spread through BLOOD: re-used needles and syringes, unsterilized dental or barber tools, unsafe transfusion, shared razors, or from mother to baby at birth — NOT through sharing food, hugging or mosquito bites\n• Many people carry the virus for years without signs; long-term infection can quietly damage the liver\n• A simple blood test shows past or present infection — get tested after unsafe injections, transfusions or dental work, or if a family member is positive\n• Hepatitis B is vaccine-preventable — 3 doses; newborns get the free birth dose under the Pakistan EPI schedule\nSEE A DOCTOR if a test is positive — effective treatment exists for hepatitis B and C. Never share needles or razors; avoid alcohol.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• ہیپاٹائٹس بی اور سی خون سے پھیلتے ہیں: دوبارہ استعمال ہونے والی سوئیاں، بغیر جراثیم کشی کے ڈینٹل یا حجامت کے اوزار، غیر محفوظ خون، مشترکہ ریزر، یا پیدائش کے وقت ماں سے بچے کو — کھانا کھلانے، گلے ملنے یا مچھر کے کاٹنے سے نہیں\n• بہت سے لوگ برسوں تک بغیر علامت کے وائرس لے کر رہتے ہیں؛ طویل انفیکشن چپکے سے جگر کو نقصان پہنچا سکتا ہے\n• سادہ خون کا ٹیسٹ بتا دیتا ہے — غیر محفوظ انجیکشن، خون یا ڈینٹل ورک کے بعد، یا گھر میں کوئی مثبت ہو تو ٹیسٹ کروائیں\n• ہیپاٹائٹس بی سے ویکسین بچاتی ہے — 3 خوراکیں؛ پاکستان ای پی آئی کے تحت نوزائیدہ کو پیدائشی خوراک مفت ملتی ہے\nٹیسٹ مثبت ہو تو ڈاکٹر کو دکھائیں — بی اور سی کا مؤثر علاج موجود ہے۔ سوئیاں اور ریزر کبھی شیئر نہ کریں؛ شراب سے پرہیز کریں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• Hepatitis B aur C khoon se phailte hain: dobara istemal hone wali sooiyan, baghair jaraseem-kashi ke dental ya hajamat ke auzaar, ghair-mehfooz khoon, mushtarka razor, ya paidaish ke waqt maa se bachay ko — khana khilane, galay milne ya machhar ke kaatne se nahin\n• Bohot log barson tak bina alamaat ke virus le kar rehte hain; taweel infection chupke se jigar ko nuksan pohancha sakta hai\n• Sada khoon ka test bata deta hai — ghair-mehfooz injection, khoon ya dental work ke baad, ya ghar mein koi musbat ho to test karwayein\n• Hepatitis B se vaccine bachati hai — 3 khoraakein; Pakistan EPI ke tahat nuzaida bachay ko paidaishi khoraak muft milti hai\nTEST MUSBAT ho to DOCTOR KO DIKHAYEIN — B aur C ka moassar ilaaj maujood hai. Sooiyan aur razor kabhi share na karein; sharab se parhez karein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "hepatitis b",
      "hepatitis c",
      "ہیپاٹائٹس بی",
      "ہیپاٹائٹس سی",
      "hepatitis b vaccine",
      "jigar ki bimari",
      "جگر کی بیماری",
      "blood test hepatitis",
      "syringe infection",
      "hepatitis test"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Hepatitis B fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/hepatitis-b",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "conjunctivitis",
    "topic": "eye",
    "title": {
      "en": "Eye flu (conjunctivitis) — hygiene and when eyes need a doctor",
      "ur": "آئی فلو (آنکھوں کا انفیکشن) — صفائی اور ڈاکٹر کب ضروری",
      "roman": "Eye flu (aankhon ka infection) — safai aur doctor kab zaroori"
    },
    "content": {
      "en": "• Eye flu makes one or both eyes red, watery, itchy or gritty, often with sticky discharge — it spreads easily through hands, towels and pillows\n• Wash hands often, use a separate clean towel, avoid touching or rubbing the eyes, and keep children home from school while discharge is heavy\n• Clean discharge with clean water and a fresh piece of cotton — wipe from the inner to the outer corner, one wipe per piece\n• Do not share eye makeup, sunglasses or pillows; most viral cases clear in 1–2 weeks\nSEE A DOCTOR IF: eye pain, sensitivity to light, vision changes, or symptoms worsening after 3–4 days.\nGO IMMEDIATELY if: a NEWBORN has red or discharging eyes, or a chemical splashed into the eye — newborns need same-day care.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• آئی فلو سے ایک یا دونوں آنکھیں سرخ، پانی بہتی، خارش والی یا میلی محسوس ہوتی ہیں، اکثر چپچپا اخراج کے ساتھ — یہ ہاتھ، تولیے اور تکیے سے آسانی سے پھیلتا ہے\n• بار بار ہاتھ دھوئیں، الگ صاف تولیہ رکھیں، آنکھوں کو ہاتھ لگانے یا رگڑنے سے بچیں، اور اخراج زیادہ ہو تو بچوں کو چند دن اسکول سے آرام دیں\n• اخراج صاف پانی اور نئے سوتی کپڑے سے صاف کریں — آنکھ کے اندر سے باہر کی طرف پونچھیں، ایک بار ایک کپڑا\n• آئی میک اپ، چشمے یا تکیے شیئر نہ کریں؛ زیادہ تر وائرل کیس 1-2 ہفتوں میں صاف ہو جاتے ہیں\nڈاکٹر کو دکھائیں: آنکھ میں درد، روشنی چبھنا، نظر میں تبدیلی، یا 3-4 دن بعد علامات بڑھ جائیں۔\nفوراً جائیں اگر: نوزائیدہ بچے کی آنکھیں سرخ ہوں یا اخراج ہو، یا آنکھ میں کیمیکل چھلک جائے — نوزائیدہ کو اُسی دن دکھانا ضروری ہے۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Eye flu se aik ya dono aankhein surkh, paani bahti, khujli wali ya meeli mehsoos hoti hain, aksar chichpra ikhraj ke saath — yeh haath, toliye aur takiye se aasani se phailta hai\n• Baar baar haath dhoyein, alag saaf toliya rakhein, aankhon ko haath lagane ya ragarhne se bachein, aur ikhraj zyada ho to bachon ko chand din school se aaraam dein\n• Ikhraj saaf paani aur naye sooti kapray se saaf karein — aankh ke andar se bahar ki taraf ponchein, aik baar aik kapra\n• Eye makeup, chashme ya takiye share na karein; zyada tar viral case 1-2 hafton mein saaf ho jate hain\nDOCTOR KO DIKHAYEIN agar: aankh mein dard, roshni chubhna, nazar mein tabdeeli, ya 3-4 din baad alamaat barh jayen.\nFORAN JAYEIN agar: nuzaida bachay ki aankhein surkh hon ya ikhraj ho, ya aankh mein chemical chhalak jaye — nuzaida ko usi din dikhana zaroori hai.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "conjunctivitis",
      "eye flu",
      "red eyes",
      "surkh aankhein",
      "سرخ آنکھیں",
      "aankhon ka pani",
      "آنکھوں سے پانی",
      "itchy eyes",
      "eye discharge",
      "pink eye",
      "eye infection",
      "aankh aana",
      "آنکھ آنا",
      "aankhon ki infection"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Eye care and common eye conditions — health topic",
      "url": "https://www.who.int/health-topics/blindness-and-vision-loss",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "scabies",
    "topic": "skin",
    "title": {
      "en": "Scabies — intense itching that spreads in the household",
      "ur": "سکیبیز (خارش کی بیماری) — شدید خارش جو گھر میں پھیلتی ہے",
      "roman": "Scabies (khujli ki bimari) — shadeed khujli jo ghar mein phailti hai"
    },
    "content": {
      "en": "• Scabies is caused by a tiny mite — intense itching, worse at night, with thin wavy lines and small bumps between the fingers, on wrists, waist and feet\n• It spreads through prolonged skin contact and sharing clothes or beds — often several family members itch at the same time\n• Creams and lotions for scabies must be chosen and explained by a doctor or health worker — treat EVERYONE in the household at the same time, not just one person\n• Wash clothes, bed sheets and towels of all family members in hot water and dry them in the sun; do not share garments\nSEE A DOCTOR for any itching that is worse at night and affects the family — a check confirms the cause.\nSEE A DOCTOR SOON if sores become red, painful or filled with pus — a skin infection may have set in.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• سکیبیز ننے کیڑے (مائیٹ) سے ہونے والی جلد کی بیماری ہے — شدید خارش، رات میں زیادہ، انگلیوں کے درمیان، کلائیوں، کمر اور پیروں پر باریک لکیروں اور چھوٹے دانوں کے ساتھ\n• طویل جسمانی رابطے اور کپڑوں یا بستر کی شراکت سے پھیلتی ہے — اکثر گھر کے کئی افراد کو بیک وقت خارش ہوتی ہے\n• خارش کی کریم اور لوشن ڈاکٹر یا ہیلتھ ورکر ہی چن کر بتائیں — گھر کے سبھی افراد کا علاج بیک وقت کروائیں، صرف ایک شخص کا نہیں\n• سب کے کپڑے، چادریں اور تولیے گرم پانی میں دھو کر دھوپ میں سکھائیں؛ کپڑے شیئر نہ کریں\nرات بڑھنے والی اور پورے گھر کو متاثر کرنے والی خارش ڈاکٹر کو دکھائیں — معائنے سے وجہ واضح ہوتی ہے۔\nزخم سرخ، دردناک یا مادہ سے بھر جائیں تو جلد ڈاکٹر کو دکھائیں — جلد کا انفیکشن لگ سکتا ہے۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• Scabies nunay keeray (mite) se hone wali jild ki bimari hai — shadeed khujli, raat mein zyada, ungliyon ke darmiyan, kalaiyon, kamar aur peron par bareek lakeeron aur chhotay danon ke saath\n• Taweel jismani rabtay aur kapron ya bistar ki shirakat se phailti hai — aksar ghar ke kai afraad ko aik waqt khujli hoti hai\n• Khujli ki cream aur lotion doctor ya health worker hi chun kar batayein — ghar ke SABHI afraad ka ilaaj aik waqt karwayein, sirf aik shakhs ka nahin\n• Sab ke kapray, chadray aur toliye garam paani mein dho kar dhoop mein sukhayein; kapray share na karein\nRaat barhne wali aur poore ghar ko mutasir karne wali khujli DOCTOR KO DIKHAYEIN — muainay se wajah wazeh hoti hai.\nZakhm surkh, dardnaak ya mada se bhar jayen to jald DOCTOR KO DIKHAYEIN — jild ka infection lag sakta hai.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "scabies",
      "khujli",
      "خارش",
      "itching between fingers",
      "khujli raat ko",
      "ungliyon ke darmiyan khujli",
      "skin rash itching",
      "jild ki khujli",
      "scabies infection",
      "scabies rash"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Scabies fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/scabies",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "asthma",
    "topic": "asthma",
    "title": {
      "en": "Asthma — managing triggers and knowing attack warning signs",
      "ur": "دما (ایسمہ) — محرکات سے بچاؤ اور دورے کی خطرے کی علامات",
      "roman": "Dama (asthma) — muharrikaat se bachao aur doray ke khatray ki alamaat"
    },
    "content": {
      "en": "• In asthma the airways are sensitive — episodes of cough, wheeze (whistling sound), chest tightness and breathlessness\n• Common triggers in Pakistan: dust, smoke (including wood and crop smoke), pollen, strong smells, cold air, respiratory infections and some pain medicines — learn your triggers and avoid them\n• Use the reliever inhaler exactly as planned with your doctor, and check your technique — ask a doctor or health worker to demonstrate\n• Never stop or change preventer medicine on your own; carry the inhaler everywhere\nSEE A DOCTOR IF: cough or wheeze keeps waking you at night, or you need the reliever more often than usual.\nEMERGENCY — call 1122 / go NOW if: the reliever is not helping, speaking full sentences is hard, lips or face turn blue, or the person is drowsy and exhausted.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• دمے میں سانس کی نالیاں حساس ہو جاتی ہیں — کھانسی، سیٹی جیسی آواز، سینے میں جکڑن اور سانس کی تکلیف کے دورے\n• پاکستان میں عام محرکات: مٹی، دھواں (لکڑی اور فصل کا دھواں بھی)، پولن، تیز خوشبو، ٹھنڈی ہوا، سانس کے انفیکشن اور کچھ درد کی دوائیں — اپنے محرک پہچانیں اور ان سے بچیں\n• ریلیور انہیلر بالکل اسی طرح استعمال کریں جیسا ڈاکٹر کے ساتھ طے ہوا ہے، اور اپنا طریقہ جانچتے رہیں — ڈاکٹر یا ہیلتھ ورکر سے دکھوا لیں\n• روکنے والی دوا اپنی مرضی سے کبھی نہ چھوڑیں نہ بدلیں؛ انہیلر ہر جگہ ساتھ رکھیں\nڈاکٹر کو دکھائیں: کھانسی یا سیٹی رات کو بار بار جگاتی رہے، یا ریلیور پہلے سے زیادہ لگنے لگے۔\nایمرجنسی — 1122 پر کال / فوراً جائیں اگر: ریلیور فائدہ نہ دے، مکمل جملے بولنا مشکل ہو، ہونٹ یا چہرہ نیلا ہو، یا مریض بہت سستا اور تھکا ہوا ہو۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Damay mein saans ki naliyan hassas ho jati hain — khansi, seeti jaisi aawaz, seene mein jakrran aur saans ki takleef ke doray\n• Pakistan mein aam muharrikaat: mitti, dhuaan (lakri aur fasl ka dhuaan bhi), pollen, tez khushbu, thandi hawa, saans ke infection aur kuch dard ki dawayain — apnay muharrik pehchanain aur un se bachain\n• Reliever inhaler bilkul usi tarah istemal karein jaisa doctor ke saath tay hua hai, aur apna tareeqa jaanchtay rahein — doctor ya health worker se dikhwa lein\n• Rokne wali dawa apni marzi se kabhi na chhorein na badlein; inhaler har jagah saath rakhein\nDOCTOR KO DIKHAYEIN agar: khansi ya seeti raat ko baar baar jagati rahe, ya reliever pehle se zyada lagne lage.\nEMERGENCY — 1122 par call / FORAN JAYEIN agar: reliever faida na de, mukammal jumlay bolna mushkil ho, hont ya chehra neela ho, ya mareez bohot susta aur thaka hua ho.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard."
    },
    "tags": [
      "asthma",
      "damah",
      "damay",
      "damay ka dora",
      "دما",
      "دمہ",
      "دمے",
      "wheezing",
      "seeti ki aawaz",
      "seeti",
      "inhaler",
      "saans phoolna",
      "asthma attack"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Asthma fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/asthma",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "diabetes-basics",
    "topic": "diabetes",
    "title": {
      "en": "Type 2 diabetes — early signs and staying healthy",
      "ur": "ٹائپ 2 ذیابیطس — ابتدائی علامات اور صحت مند رہنا",
      "roman": "Type 2 sugar (diabetes) — ibtidai alamaat aur sehatmand rehna"
    },
    "content": {
      "en": "• Type 2 diabetes is very common in Pakistan. Signs can include: constant thirst, urinating a lot (especially at night), unexplained weight loss, tiredness, blurred vision, slow-healing wounds and repeated skin or gum infections\n• A simple blood test (fasting sugar or HbA1c) at any laboratory confirms it — get tested if you have these signs or diabetes in the family\n• If diagnosed: follow the plan your doctor gives you — balanced portions, a 30-minute daily walk, and medicines exactly as prescribed; never skip or change doses yourself\n• Check the feet daily for cuts, blisters or colour changes — diabetes reduces sensation and small wounds can worsen quietly\nSEE A DOCTOR IF: thirst and urination keep increasing, weight keeps falling, or a wound is not healing.\nGO IMMEDIATELY if: confusion, deep fast breathing, fruity-smelling breath, extreme drowsiness, or a foot wound turning black — these are danger signs.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• ٹائپ 2 ذیابیطس پاکستان میں بہت عام ہے۔ علامات میں شامل ہو سکتے ہیں: مسلسل پیاس، بہت پیشاب (خاص طور پر رات کو)، بغیر وجہ وزن کم ہونا، تھکاوٹ، دھندلی نظر، دیر سے بھرنے والے زخم اور بار بار جلد یا مسوڑھوں کا انفیکشن\n• کسی بھی لیبارٹری میں سادہ خون کا ٹیسٹ (فاسٹنگ شوگر یا HbA1c) تصدیق کرتا ہے — یہ علامات ہوں یا خاندان میں ذیابیطس ہو تو ٹیسٹ کروائیں\n• تشخیص ہو جائے تو ڈاکٹر کے دیے پلان پر چلیں — متوازن کھانا، روزانہ 30 منٹ واک، اور دوائیں بالکل ویسے جیسے تجویز ہوئیں؛ خوراک اپنی مرضی سے نہ چھوڑیں نہ بدلیں\n• روزانہ پیروں کو دیکھیں — کٹ، چھالے یا رنگ کی تبدیلی — ذیابیطس میں احساس کم ہو جاتا ہے اور چھوٹے زخم چپکے سے بڑھ سکتے ہیں\nڈاکٹر کو دکھائیں: پیاس اور پیشاب مسلسل بڑھتا رہے، وزن گرتا رہے، یا زخم بھر رہا نہ ہو۔\nفوراً جائیں اگر: الجھن، گہری تیز سانس، پھل جیسی بو، حد سے زیادہ سستی، یا پیر کا زخم کالا پڑ رہا ہو — یہ خطرے کی علامات ہیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Type 2 sugar (diabetes) Pakistan mein bohot aam hai. Alamaat mein shamil ho sakte hain: musalsal pyaas, bohot peshab (khaas tor par raat ko), baghair wajah wazan kam hona, thakaan, dhundli nazar, dair se bharnay walay zakhm aur baar baar jild ya masoorhon ka infection\n• Kisi bhi lab mein sada khoon ka test (fasting sugar ya HbA1c) tasdeeq karta hai — yeh alamaat hon ya khandan mein sugar ho to test karwayein\n• Tashkhees ho jaye to doctor ke diye plan par chalein — mutawazan khana, rozana 30 minute walk, aur dawayain bilkul waisay jaisay tajweez huin; khoraak apni marzi se na chhorein na badlein\n• Rozana peron ko dekhein — kaat, chhalay ya rang ki tabdeeli — sugar mein ehsas kam ho jata hai aur chhotay zakhm chupke se barh sakte hain\nDOCTOR KO DIKHAYEIN agar: pyaas aur peshab musalsal barhta rahe, wazan girta rahe, ya zakhm bhar raha na ho.\nFORAN JAYEIN agar: uljhan, gehri tez saans, phal jaisi boo, had se zyada susti, ya per ka zakhm kaala par raha ho — yeh khatray ki alamaat hain.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "diabetes",
      "sugar",
      "sugar ki bimari",
      "ذیابیطس",
      "شوگر",
      "thirst",
      "urinates a lot",
      "zyada peshab",
      "frequent urination",
      "weight loss",
      "blood sugar",
      "shugar"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Diabetes fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/diabetes",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "hypertension-basics",
    "topic": "hypertension",
    "title": {
      "en": "High blood pressure — the silent condition you can control",
      "ur": "ہائی بلڈ پریشر — خاموش بیماری جسے قابو کیا جا سکتا ہے",
      "roman": "High blood pressure — khamosh bimari jise qaboo kiya ja sakta hai"
    },
    "content": {
      "en": "• High blood pressure usually has NO symptoms — the only way to know is a check, available free at government facilities and for a small fee at pharmacies\n• Uncontrolled high blood pressure quietly damages the heart, brain (stroke), kidneys and eyes over the years\n• Every adult should know their numbers — check at least yearly, more often if advised, or during pregnancy, diabetes or family history\n• Cut salt: no extra salt at the table, fewer pickles, papad and processed snacks; more vegetables and fruit, daily walking, healthy weight, no smoking\n• If a doctor has started medicine, take it EVERY DAY as advised — blood pressure medicine is usually long-term, and stopping on your own is risky\nSEE A DOCTOR IF: headaches, dizziness or blurred vision occur, or readings stay high.\nEMERGENCY — go NOW if: chest pain, severe headache with vomiting, weakness of one side, or trouble speaking — call 1122.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• ہائی بلڈ پریشر اکثر کوئی علامت نہیں دیتا — پتا لگانے کا واحد طریقہ چیک ہے، جو سرکاری مراکز میں مفت اور فارمیسی پر معمولی فیس پر ہوتا ہے\n• بے قابو بلڈ پریشر برسوں میں چپکے سے دل، دماغ (فالج)، گردوں اور آنکھوں کو نقصان پہنچاتا ہے\n• ہر بالغ کو اپنی ریڈنگ معلوم ہونی چاہیے — سال میں کم از کم ایک بار چیک کریں؛ مشورہ ہو، حمل، ذیابیطس یا خاندانی تاریخ ہو تو زیادہ بار\n• نمک کم کریں: کھانے پر اوپر سے نمک نہ ڈالیں، اچار، پاپڑ اور پیکٹ والی چیزیں کم؛ سبزیاں اور پھل زیادہ، روزانہ واک، متوازن وزن، تمباکو نہیں\n• ڈاکٹر نے دوا شروع کی ہو تو روز لینا ضروری ہے — بلڈ پریشر کی دوا عموماً طویل مدتی ہوتی ہے، اپنی مرضی سے چھوڑنا خطرناک ہے\nڈاکٹر کو دکھائیں: سر درد، چکر یا دھندلی نظر آئے، یا ریڈنگ مسلسل زیادہ رہے۔\nایمرجنسی — فوراً جائیں اگر: سینے میں درد، شدید سر درد کے ساتھ الٹی، ایک طرف کمزوری، یا بولنے میں مشکل — 1122 پر کال کریں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• High blood pressure aksar koi alamat nahin deta — pata lagane ka wahid tareeqa check hai, jo sarkari markazon mein muft aur pharmacy par mamooli fees par hota hai\n• Be-qaboo blood pressure barson mein chupke se dil, dimagh (faalij), gurdon aur aankhon ko nuqsan pohanchata hai\n• Har baray ko apni reading maloom honi chahiye — saal mein kam az kam aik baar check karein; mashwara ho, hamal, sugar ya khandani tareekh ho to zyada baar\n• Namak kam karein: khane par oopar se namak na dalein, achaar, paapar aur packet wali cheezein kam; sabziyan aur phal zyada, rozana walk, mutawazan wazan, tambaku nahin\n• Doctor ne dawa shuru ki ho to roz lena zaroori hai — blood pressure ki dawa aam tor par taweel muddati hoti hai, apni marzi se chhorna khatarnak hai\nDOCTOR KO DIKHAYEIN agar: sar dard, chakkar ya dhundli nazar aayein, ya reading musalsal zyada rahe.\nEMERGENCY — FORAN JAYEIN agar: seene mein dard, sakht sar dard ke saath ulti, aik taraf kamzori, ya bolne mein mushkil — 1122 par call karein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard."
    },
    "tags": [
      "blood pressure",
      "high bp",
      "hypertension",
      "بلڈ پریشر",
      "ہائی بلڈ پریشر",
      "bp high",
      "blood pressure high",
      "bp control",
      "namak kam",
      "bp ki dawa",
      "silent killer"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Hypertension fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/hypertension",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "diabetes-low-sugar",
    "topic": "hypoglycemia",
    "title": {
      "en": "Low sugar (hypoglycaemia) — recognise it and act fast",
      "ur": "شوگر کا گرنا (ہائپوگلائسیمیا) — پہچانیں اور فوراً اقدام کریں",
      "roman": "Sugar ka girna (hypoglycemia) — pehchanain aur foran iqdaam karein"
    },
    "content": {
      "en": "• Low sugar can happen to anyone taking diabetes medicine — especially after skipping a meal, extra work, or an unintentionally high dose. Early signs: sweating, trembling/shakiness, sudden hunger, fast heartbeat, weakness, blurred vision, irritability\n• If conscious and able to swallow — the rule of 15: take 15 grams of fast sugar NOW (half a glass of juice or regular (not diet) soft drink, 3 teaspoons of sugar, or glucose tablets), wait 15 minutes, then eat a small snack with starch (biscuit, bread) if the next meal is far\n• Re-check sugar after 15 minutes; if still low signs, repeat the fast sugar once more\n• Always carry sugar or glucose with you — a pocket pack of glucose, sugar sachets or sweet biscuits\n• Tell the family: someone with low sugar may act confused or drunk — it is the sugar, not their behaviour\nEMERGENCY — call 1122 / go NOW if: the person is unconscious, having a fit (seizure), or too confused to swallow safely. NEVER put food or drink into an unconscious person’s mouth. Turn them on their side and stay with them.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• شوگر کا گرنا ذیابیطس کی دوا لینے والے کسی کے ساتھ بھی ہو سکتا ہے — خاص طور پر کھانا چھوڑنے، زیادہ محنت یا غلط خوراک کے بعد۔ ابتدائی علامات: پسینہ، کانپنا، اچانک بھوک، تیز دھڑکن، کمزوری، دھندلی نظر، بےچینی\n• اگر ہوش ہو اور نگل سکتا ہو — 15 کا اصول: ابھی 15 گرام تیز شوگر لیں (آدھا گلاس جوس یا عام سافٹ ڈرنک، 3 چمچ چینی، یا گلوکوز ٹیبلٹ)، 15 منٹ انتظار کریں، پھر اگر اگلا کھانا دور ہو تو ہلکا نشاستہ والا ناشتہ کریں (بسکٹ، روٹی)\n• 15 منٹ بعد شوگر دوبارہ جانچیں؛ اگر علامات اب بھی ہوں تو تیز شوگر ایک بار پھر لیں\n• ہمیشہ ساتھ چینی یا گلوکوز رکھیں — جیب میں گلوکوز پیک، چینی کی پوٹھی یا میٹھی بسکٹ\n• گھر والوں کو بتائیں: شوگر کم ہونے پر آدمی الجھا ہوا یا نشے میں لگ سکتا ہے — یہ شوگر کا اثر ہے، مزاج نہیں\nایمرجنسی — 1122 پر کال / فوراً جائیں اگر: شخص بےہوش ہو، دورہ پڑ رہا ہو، یا اتنا الجھا ہو کہ نگل نہ سکے۔ بےہوش شخص کے منہ میں کبھی کچھ نہ ڈالیں۔ اسے کروٹ پر لٹائیں اور ساتھ رہیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Sugar ka girna diabetes ki dawa lene walay kisi ke saath bhi ho sakta hai — khaas tor par khana chhorne, zyada mehnat ya ghalt khoraak ke baad. Ibtidai alamaat: paseena, kanpna, achanak bhook, tez dharkan, kamzori, dhundli nazar, bechaini\n• Agar hosh ho aur nigal sakta ho — 15 ka usool: abhi 15 gram tez sugar lein (aadha glass juice ya aam soft drink, 3 chamach cheeni, ya glucose tablet), 15 minute intezar karein, phir agar agla khana door ho to halka nashasta wala nashta karein (biscuit, roti)\n• 15 minute baad sugar dobara jaanchein; agar alamaat ab bhi hon to tez sugar aik baar phir lein\n• Hamesha saath cheeni ya glucose rakhein — jeb mein glucose pack, cheeni ki pothi ya meethi biscuit\n• Ghar walon ko batayein: sugar kam hone par aadmi uljha hua ya nashay mein lag sakta hai — yeh sugar ka asar hai, mizaj nahin\nEMERGENCY — 1122 par call / FORAN JAYEIN agar: shakhs behosh ho, dora par raha ho, ya itna uljha ho ke nigal na sake. Behosh shakhs ke munh mein kabhi kuch na dalein. Use karwat par litayein aur saath rahein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard."
    },
    "tags": [
      "low sugar",
      "sugar kam",
      "sugar girna",
      "shugar gir gayi",
      "hypoglycemia",
      "hypoglycaemia",
      "sweating shakiness",
      "kanpana",
      "glucose low",
      "sugar neeche",
      "hypo",
      "tezi se bhook",
      "haath kanp",
      "pasina kanp",
      "شوگر کم",
      "شوگر گرنا",
      "کانپنا",
      "low blood sugar"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "International Diabetes Federation",
      "title": "Hypoglycaemia — how to recognise and treat",
      "url": "https://idf.org/about-diabetes/diabetes-complications/hypoglycaemia/",
      "license": "Public information",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "diabetes-ramadan-fasting",
    "topic": "diabetes-ramadan",
    "title": {
      "en": "Diabetes and Ramadan fasting — plan before you fast",
      "ur": "ذیابیطس اور رمضان کا روزہ — روزے سے پہلے منصوبہ بنائیں",
      "roman": "Diabetes aur Ramzan ka roza — rozay se pehle mansooba banayein"
    },
    "content": {
      "en": "• Fasting with diabetes is possible for many people — but it changes how your body handles sugar and medicine, so plan 4–8 weeks BEFORE Ramadan with your doctor; do not change medicine timing or dose on your own\n• Suhoor: choose slow-release foods — whole-wheat roti, dhal, beans, oats, yoghurt, eggs; avoid very sweet drinks and paratha-fried items that spike then crash sugar\n• Iftar: break the fast with 1–2 dates and water, then a balanced plate — avoid a single huge sugary meal; drink 8–10 glasses of water between iftar and suhoor\n• CHECK YOUR SUGAR MORE OFTEN — checking does not break the fast. Check at suhoor, mid-morning, midday, mid-afternoon and 2 hours after iftar\n• You MUST break the fast immediately if: sugar falls below 70 mg/dL, sugar rises above 300 mg/dL, or you feel low-sugar signs (sweating, trembling, confusion) — Islamic scholars agree that preserving health comes first for the sick\n• Breaking a fast for a medical reason is not a failure — make it up later as your doctor and scholar advise\nSEE A DOCTOR IF: take insulin, have had recent low sugar episodes, kidney problems, or are pregnant.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• ذیابیطس کے ساتھ روزہ بہت سے لوگوں کے لیے ممکن ہے — لیکن روزہ جسم کی شوگر اور دوا کے اثر کو بدل دیتا ہے، اس لیے رمضان سے 4-8 ہفتے پہلے ڈاکٹر کے ساتھ منصوبہ بنائیں؛ دوا کا وقت یا خوراک اپنی مرضی سے نہ بدلیں\n• سحری: آہستہ ضائع ہونے والی غذائیں چنیں — ساگرا آٹے کی روٹی، دال، لوبیا، اوٹس، دہی، انڈے؛ بہت میٹھے مشروبات اور پراٹھا جیسی تلنی والی چیزیں نہ لیں جو شوگر اچانک بڑھا کر گرا دیتی ہیں\n• افطاری: 1-2 کھجور اور پانی سے افطار کریں، پھر متوازن کھانا — ایک ہی بار بہت میٹھا کھانا نہ کریں؛ افطاری اور سحری کے درمیان 8-10 گلاس پانی پییں\n• شوگر زیادہ بار جانچیں — جانچنا روزہ نہیں توڑتا۔ سحری، دوپہر سے پہلے، دوپہر، سہ پہر اور افطار کے 2 گھنٹے بعد جانچیں\n• روزہ فوراً توڑنا ضروری ہے اگر: شوگر 70 سے کم ہو جائے، شوگر 300 سے بڑھ جائے، یا کم شوگر کی علامات ہوں (پسینہ، کانپنا، الجھن) — علماء کا اتفاق ہے کہ مریض کی صحت بچانا اول ہے\n• طبی وجہ سے روزہ توڑنا ناکامی نہیں — بعد میں ڈاکٹر اور عالم کے مشورے سے پورا کریں\n• رمضان سے پہلے ڈاکٹر کو دیکھیں اگر: انسولین لیتے ہوں، حال ہی میں شوگر کم ہوئی ہو، گردوں کا مسئلہ ہو، یا حاملہ ہوں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Diabetes ke saath roza bohot logon ke liye mumkin hai — lekin roza jism ki sugar aur dawa ke asar ko badal deta hai, is liye Ramzan se 4-8 hafte pehle doctor ke saath mansooba banayein; dawa ka waqt ya khoraak apni marzi se na badlein\n• Sehri: aahista zakha hoti khana chunein — sagar aattay ki roti, daal, lobia, oats, dahi, anday; bohot meethay mashroobaat aur paratha jaisi talni wali cheezein na lein jo sugar achanak barha kar gira deti hain\n• Iftari: 1-2 khajoor aur paani se iftar karein, phir mutawazan khana — aik hi baar bohot meetha khana na karein; iftari aur sehri ke darmiyan 8-10 glass paani piyein\n• Sugar zyada baar jaanchein — jaanch na rozah nahin torta. Sehri, dopahar se pehle, dopahar, sa pehar aur iftar ke 2 ghantay baad jaanchein\n• Roza FORAN torna zaroori hai agar: sugar 70 se kam ho jaye, sugar 300 se barh jaye, ya kam sugar ki alamaat hon (paseena, kanpna, uljhan) — ulama ka ittefaq hai ke mareez ki sehat bachana awwal hai\n• Tibbi wajah se roza torna nakami nahin — baad mein doctor aur aalim ke mashwaray se poora karein\nRamzan se pehle doctor ko dikhein agar: insulin lete hon, haal hi mein sugar kam hui ho, gurdon ka masla ho, ya haamla ho.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "ramadan fasting diabetes",
      "roza sugar",
      "roze diabetes",
      "fasting diabetes",
      "sehri sugar",
      "suhoor diabetes",
      "iftar sugar",
      "iftari diabetes",
      "rozay mein sugar",
      "fasting sugar",
      "diabetes roza",
      "رمضان شوگر",
      "روزہ شوگر"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO EMRO",
      "title": "Diabetes and Ramadan — practical guidance",
      "url": "https://www.emro.who.int/noncommunicable-diseases/publications/diabetes-and-ramadan.html",
      "license": "Public information",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "stroke-fast",
    "topic": "stroke",
    "title": {
      "en": "Stroke (faalij) — spot the signs, every minute counts",
      "ur": "فالج (سٹروک) — علامات پہچانیں، ہر منٹ قیمتی ہے",
      "roman": "Faalij (stroke) — alamaat pehchanain, har minute qeemti hai"
    },
    "content": {
      "en": "• A stroke happens when blood flow to part of the brain stops — treatment works best within the FIRST HOURS, so recognising it fast saves the brain\n• Learn FAST: FACE — does one side of the face droop when smiling? ARM — does one arm drift down or go weak when both are raised? SPEECH — is speech slurred, confused or lost? TIME — if ANY one sign is there, call 1122 NOW\n• Other sudden signs: numbness or weakness of one side of the body, trouble seeing in one or both eyes, severe headache like never before, loss of balance or falling, sudden confusion\n• While waiting for help: note the exact time symptoms started (doctors ask), lay the person on their side if drowsy or vomiting, loosen tight clothes, NOTHING to eat or drink\n• Do NOT wait \"to see if it gets better\", do NOT give any home remedy, aspirin or ghee — let the hospital decide the cause first\n• High blood pressure, diabetes, smoking and heart disease raise stroke risk — control them to prevent the next one\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• فالج اس وقت ہوتا ہے جب دماغ کے کسی حصے میں خون کا بہاؤ رک جائے — علاج پہلے چند گھنٹوں میں سب سے زیادہ کام کرتا ہے، اس لیے جلدی پہچان دماغ بچاتی ہے\n• FAST یاد کریں: چہرہ — مسکراتے وقت کیا چہرے کا ایک طرف لٹک جاتا ہے؟ بازو — دونوں بازو اٹھانے پر کیا ایک بازو نیچے جھک جاتا یا کمزور ہوتا ہے؟ بات — کیا بات کہنے میں لڑکھڑاہٹ، الجھن یا گم صمیری ہے؟ وقت — اگر کوئی ایک بھی علامت ہو تو ابھی 1122 پر کال کریں\n• دیگر اچانک علامات: جسم کے ایک طرف سن ہونا یا کمزوری، ایک یا دونوں آنکھوں میں دیکھنے میں مشکل، پہلے کبھی نہ ہونے والا شدید سر درد، توازن کا ختم ہونا یا گرنا، اچانک الجھن\n• مدد آنے تک: علامات شروع ہونے کا درست وقت یاد رکھیں (ڈاکٹر پوچھتے ہیں)، سست یا الٹی کرنے والے شخص کو کروٹ پر لٹائیں، تنگ کپڑے ڈھیلے کریں، کچھ کھلائیں یا پلائیں نہیں\n• \"شاید ٹھیک ہو جائے\" کے انتظار میں وقت نہ گنوائیں، کوئی گھریلو نسخہ، aspirin یا گھی نہ دیں — وجہ پہلے ہسپتال معلوم کرے\n• ہائی بلڈ پریشر، ذیابیطس، تمباکو اور دل کی بیماری فالج کا خطرہ بڑھاتی ہیں — انہیں قابو کریں تاکہ اگلا فالج نہ ہو\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Faalij us waqt hota hai jab dimagh ke kisi hissay mein khoon ka bahao ruk jaye — ilaaj pehlay chand ghanton mein sab se zyada kaam karta hai, is liye jaldi pehchan dimagh bachati hai\n• FAST yaad karein: CHEHRA — muskurate waqt kya chehray ka aik taraf latak jata hai? BAAZU — dono baazu uthane par kya aik baazu neechay jhuk jata ya kamzor hota hai? BAAT — kya baat karne mein larkharahat, uljhan ya gum sumari hai? WAQT — agar koi aik bhi alamat ho to abhi 1122 par call karein\n• Deegar achanak alamaat: jism ke aik taraf sun hona ya kamzori, aik ya dono aankhon mein dekhne mein mushkil, pehlay kabhi na hone wala sakht sar dard, tawazun ka khatam hona ya girna, achanak uljhan\n• Madad aane tak: alamaat shuru hone ka sahi waqt yaad rakhein (doctor poochtay hain), sust ya ulti karne walay shakhs ko karwat par litayein, tang kapray dheelay karein, kuch khilayein ya pilayein NAHIN\n• \"Shayad theek ho jaye\" ke intezar mein waqt na ganwayein, koi gharlu nuskha, aspirin ya ghee na dein — wajah pehlay hospital maloom kare\n• High blood pressure, diabetes, tambaku aur dil ki bimari faalij ka khatra barhati hain — inhein qaboo karein taakay agla faalij na ho\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "stroke",
      "faalij",
      "falij",
      "فالج",
      "face droop",
      "slurred speech",
      "aik taraf kamzori",
      "paralysis",
      "paralysis attack",
      "brain attack",
      "jismani kamzori ek taraf",
      "munh terha hona"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Stroke fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/stroke",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "asthma-child",
    "topic": "asthma-child",
    "title": {
      "en": "Childhood asthma — night cough and play limits are warning signs",
      "ur": "بچوں کا دما — رات کی کھانسی اور کھیل میں رکاوٹ خبردار کرنے والی علامات ہیں",
      "roman": "Bachon ka dama — raat ki khansi aur khel mein rukawat khabardar karne wali alamaat hain"
    },
    "content": {
      "en": "• In children, asthma often shows as a cough that keeps coming back — especially at night, after running or playing, or with colds — along with wheeze (whistling sound) and chest tightness\n• Big warning signs that asthma is NOT controlled: night cough waking the child repeatedly, stopping play or running to catch breath, needing the reliever inhaler more than 2 times a week (apart from before exercise)\n• Household triggers to remove: wood/cigarette/crop smoke inside the house, dust from carpets and stuffed toys (wash weekly, sun-dry), mosquito coils and strong sprays, damp walls with mould\n• A SPACER (plastic tube) makes the inhaler far more effective in young children — ask a health worker to demonstrate the technique and check it at every visit\n• Reliever (usually blue) opens the airways during an attack; preventer (usually brown/orange) must be taken DAILY even when the child is well — never stop it on your own\nEMERGENCY — call 1122 / go NOW if: the child cannot speak or feed, is too breathless to finish a sentence, the reliever is not helping, lips or face turn blue, nostrils flare with each breath, or the child becomes drowsy and quiet.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• بچوں میں دما اکثر بار بار آنے والی کھانسی سے ظاہر ہوتا ہے — خاص طور پر رات کو، دوڑنے یا کھیلنے کے بعد، یا زکام کے ساتھ — سیٹی جیسی آواز اور سینے میں جکڑن کے ساتھ\n• بڑی خبردار کرنے والی علامات کہ دما قابو نہیں: رات کی کھانسی بچے کو بار بار جگائے، کھیل یا دوڑ میں سانس کے لیے رکنا، ہفتے میں 2 بار سے زیادہ ریلیور انہیلر کی ضرورت (ورزش سے پہلے کے علاوہ)\n• گھر سے ہٹانے والے محرک: گھر کے اندر لکڑی/سگرٹ/فصل کا دھواں، قالین اور کھلونوں کی دھول (ہفتہ وار دھوئیں، دھوپ میں سکھائیں)، مچھر کی اگربتیاں اور تیز اسپرے، نم دیواروں پر فنگس\n• سپیسر (پلاسٹک ٹیوب) چھوٹے بچوں میں انہیلر کا اثر کئی گنا بڑھا دیتا ہے — ہیلتھ ورکر سے طریقہ دکھوائیں اور ہر وزٹ پر جانچتے رہیں\n• ریلیور (عموماً نیلا) دورے کے دوران نالیاں کھولتا ہے؛ روکنے والی دوا (عموماً بھوری/نارنجی) بچے کے ٹھیک ہونے پر بھی روز لینی ضروری ہے — اپنی مرضی سے کبھی نہ چھوڑیں\nایمرجنسی — 1122 پر کال / فوراً جائیں اگر: بچہ بول یا کھا نہ سکے، اتنا بےدماغ ہو کہ ایک جملہ پورا نہ کر سکے، ریلیور فائدہ نہ دے، ہونٹ یا چہرہ نیلا ہو، ہر سانس کے ساتھ ناک کے سوراخ پھیلنے لگیں، یا بچہ سست اور خاموش ہو جائے۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Bachon mein dama aksar baar baar aane wali khansi se zahir hota hai — khaas tor par raat ko, daurne ya khelne ke baad, ya zukam ke saath — seeti jaisi aawaz aur seene mein jakrran ke saath\n• Bari khabardar karne wali alamaat ke dama qaboo nahin: raat ki khansi bachay ko baar baar jagaye, khel ya daur mein saans ke liye rukna, hafte mein 2 baar se zyada reliever inhaler ki zaroorat (warsh se pehle ke ilaawa)\n• Ghar se hatane walay muharrik: ghar ke andar lakri/cigarette/fasl ka dhuaan, qaleen aur khilonon ki dhool (hafta-war dhoyein, dhoop mein sukhaayen), machhar ki agarbatiyan aur tez spray, nam deewaron par fungus\n• Spacer (plastic tube) chhotay bachon mein inhaler ka asar kai guna barha deta hai — health worker se tareeqa dikhwayein aur har visit par jaanchtay rahein\n• Reliever (aam tor par neela) doray ke dauran naliyan kholta hai; rokne wali dawa (aam tor par bhoori/narangi) bachay ke theek hone par bhi roz lena zaroori hai — apni marzi se kabhi na chhorein\nEMERGENCY — 1122 par call / FORAN JAYEIN agar: bacha bol ya kha na sake, itna bedamagh ho ke aik jumla poora na kar sake, reliever faida na de, hont ya chehra neela ho, har saans ke saath naak ke sorakh phailna shuru kar dein, ya bacha sust aur khamosh ho jaye.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard."
    },
    "tags": [
      "child asthma",
      "bachay ka dama",
      "bachon ka dama",
      "bachay ki khansi raat",
      "night cough child",
      "wheeze child",
      "bacha saans",
      "child inhaler",
      "spacer",
      "بچوں کا دمہ",
      "bachay dam",
      "bacha khansi",
      "bachay khansi",
      "bachon ki khansi",
      "child asthma attack"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Asthma fact sheet (children)",
      "url": "https://www.who.int/news-room/fact-sheets/detail/asthma",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "anemia",
    "topic": "anemia",
    "title": {
      "en": "Anaemia (lack of blood) — tiredness you can fix",
      "ur": "خون کی کمی (انیمیا) — تھکاوٹ جسے دور کیا جا سکتا ہے",
      "roman": "Khoon ki kami (anemia) — thakaan jise door kiya ja sakta hai"
    },
    "content": {
      "en": "• Anaemia means too little haemoglobin in the blood — very common in Pakistani women and children. Signs can include: tiredness, pale inner eyelids, nails or palms, breathlessness on effort, dizziness and headaches\n• A simple blood test (CBC) at any laboratory confirms it and shows how severe it is\n• Iron-rich eating: meat, chicken, fish, liver, eggs, chickpeas, beans, spinach and other leafy greens, dried fruits — add lemon or other vitamin C foods to plant meals so iron absorbs better; avoid tea right after meals\n• Iron tablets (often with folic acid) are widely available — ask a doctor or health worker for the right course, especially in pregnancy; do not keep self-medicating long term\nSEE A DOCTOR IF: breathlessness, chest discomfort, a fast heartbeat, paleness with fever, black stools, or no improvement after 4–6 weeks of treatment.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• خون کی کمی کا مطلب ہیموگلوبن کا کم ہونا ہے — پاکستانی خواتین اور بچوں میں بہت عام۔ علامات میں شامل ہو سکتے ہیں: تھکاوٹ، پلکوں کے اندر، ناخنوں یا ہتھیلیوں کا زرد پن، محنت پر سانس پھولنا، چکر اور سر درد\n• کسی بھی لیبارٹری میں سادہ خون کا ٹیسٹ (سی بی سی) تصدیق کرتا اور شدت بتاتا ہے\n• آئرن سے بھرپور خوراک: گوشت، مرغی، مچھلی، کلیجی، انڈے، چنے، لوبیا، پالک اور دیگر سبز پتوں والی سبزیاں، خشک میوے — سبزی والے کھانے کے ساتھ لیموں یا وٹامن سی والی چیزیں لیں تاکہ آئرن زیادہ جذب ہو؛ کھانے کے فوراً بعد چائے سے پرہیز\n• آئرن کی گولیاں (اکثر فولک ایسڈ کے ساتھ) آسانی سے ملتی ہیں — مناسب کورس ڈاکٹر یا ہیلتھ ورکر سے پوچھیں، خاص طور پر حمل میں؛ طویل مدت تک اپنی مرضی سے جاری نہ رکھیں\nڈاکٹر کو دکھائیں: سانس پھولنا، سینے میں بےچینی، تیز دھڑکن، زردی کے ساتھ بخار، کالا پاخانہ، یا علاج کے 4-6 ہفتے بعد بھی بہتری نہ ہو۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Khoon ki kami ka matlab haemoglobin ka kam hona hai — Pakistani khawateen aur bachon mein bohot aam. Alamaat mein shamil ho sakte hain: thakaan, palkon ke andar, nakhunon ya hathelion ka zard pan, mehnat par saans phoolna, chakkar aur sar dard\n• Kisi bhi lab mein sada khoon ka test (CBC) tasdeeq karta aur shiddat batata hai\n• Iron se bharpoor khurak: gosht, murghi, machhli, kaleji, anday, channay, lobia, palak aur deegar sabz paton wali sabziyan, khushk miwe — sabzi walay khane ke saath lemon ya vitamin C wali cheezein lein taakay iron zyada jazb ho; khane ke foran baad chai se parhez\n• Iron ki goliyan (aksar folic acid ke saath) aasani se milti hain — munasib course doctor ya health worker se poochein, khaas tor par hamal mein; taweel muddat tak apni marzi se jari na rakhein\nDOCTOR KO DIKHAYEIN agar: saans phoolna, seene mein bechaini, teiz dharkan, zardi ke saath bukhar, kaala paikhana, ya ilaaj ke 4-6 hafte baad bhi behtari na ho.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "anemia",
      "anaemia",
      "khoon ki kami",
      "خون کی کمی",
      "iron deficiency",
      "iron deficiency anemia",
      "anemia in women",
      "anemia-women",
      "khawateen me khoon ki kami",
      "خواتین میں خون کی کمی",
      "pale skin",
      "thakan kamzori",
      "blood deficiency",
      "anemia weakness"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Anaemia — health topic",
      "url": "https://www.who.int/health-topics/anaemia",
      "license": "Public information",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "mental-health",
    "topic": "mental-health",
    "title": {
      "en": "Stress, anxiety and low mood — support that helps",
      "ur": "ذہنی دباؤ، گھبراہٹ اور اداسی — مددگار قدم",
      "roman": "Stress, ghabrahat aur udaasi — madadgaar qadam"
    },
    "content": {
      "en": "• Feeling stressed, anxious or low is common — money pressures, exams, family conflict and illness all weigh on the mind; it is not a personal weakness\n• What helps: regular sleep and wake times, a daily walk or exercise, prayer or meditation, talking to someone you trust, and meeting people — isolation feeds low mood\n• Cut down extra chai, energy drinks, tobacco and late-night scrolling — they worsen anxiety and disturb sleep\n• Plan small, doable tasks each day and get some morning daylight\nSEE A DOCTOR IF: low mood, worry or loss of interest lasts more than 2 weeks, disturbs sleep, appetite, work or studies, or brings hopelessness.\nCall the Umang mental health helpline 0311-7786264 (24/7, free, confidential) if you feel overwhelmed — and 1122 in any emergency. Talking helps.\nEMERGENCY / GO IMMEDIATELY: severe thoughts of self-harm, suicidal feelings, extreme agitation, or loss of consciousness.",
      "ur": "• ذہنی دباؤ، گھبراہٹ یا اداسی محسوس کرنا عام بات ہے — پیسوں کا دباؤ، امتحانات، گھریلو جھگڑے اور بیماری ذہن پر بوجھ ڈالتے ہیں؛ یہ کوئی کمزوری نہیں\n• کیا مدد دیتی ہے: ایک وقت سونا اور اٹھنا، روزانہ واک یا ورزش، نماز یا مراقبہ، کسی قابل بھروسہ شخص سے بات کرنا اور لوگوں سے ملنا — تنہائی اداسی بڑھاتی ہے\n• زیادہ چائے، انرجی ڈرنکس، تمباکو اور رات گئے موبائل چلانے سے پرہیز کریں — یہ گھبراہٹ اور نیند دونوں بگاڑتے ہیں\n• روز چھوٹے آسان کاموں کی فہرست بنائیں اور صبح کی دھوپ ضرور لیں\nڈاکٹر کو دکھائیں: اداسی، فکر یا دلچسپی کی کمی 2 ہفتے سے زیادہ رہے، نیند، بھوک، کام یا پڑھائی متاثر ہو، یا مایوسی چھائی ہو۔\nاگر خود کو بوجھ محسوس ہو تو اُمنگ ذہنی صحت ہیلپ لائن 0311-7786264 پر کال کریں (24 گھنٹے، مفت، رازدارانہ) — اور کسی بھی ایمرجنسی میں 1122۔ بات کرنے سے سکون ملتا ہے۔\nایمرجنسی (فوراً جائیں): خود کو نقصان پہنچانے کے شدید خیالات، ہوش کھونا، یا شدید گھبراہٹ۔",
      "roman": "• Stress, ghabrahat ya udaasi mehsoos karna aam baat hai — paisay ka dabao, imtihanat, gharelu jhagray aur bimari zehan par boojh dalte hain; yeh koi kamzori nahin\n• Kya madad deti hai: aik waqt sona aur uthna, rozana walk ya warzish, namaaz ya muraqba, kisi qabil-e-bharosa shakhs se baat karna aur logon se milna — tanhai udaasi barhati hai\n• Zyada chai, energy drinks, tambaku aur raat gaye mobile chalane se parhez karein — yeh ghabrahat aur neend dono bigaarte hain\n• Roz chhotay aasan kaamon ki fehrist banayein aur subah ki dhoop zaroor lein\nDOCTOR KO DIKHAYEIN: udaasi, fikar ya dilchaspi ki kami 2 hafte se zyada rahe, neend, bhook, kaam ya parhai mutasir ho, ya mayoosi chhai ho.\nAgar khud ko boojh mehsoos ho to Umang mental health helpline 0311-7786264 par call karein (24 ghantay, muft, raazdaarana) — aur kisi bhi emergency mein 1122. Baat karne se sukoon milta hai.\nEMERGENCY (FORI JAYEIN): khud ko nuqsan pohanchane ke shadeed khayalat ya behoshi."
    },
    "tags": [
      "stress",
      "stressed",
      "anxiety",
      "depression",
      "mental health",
      "ghabrahat",
      "pareshani",
      "udaas",
      "ذہنی صحت",
      "ڈپریشن",
      "counselling",
      "anxiety stress"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Depression fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/depression",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "head-injury",
    "topic": "head-injury",
    "title": {
      "en": "Head injury — first aid and signs to watch afterwards",
      "ur": "سر کی چوٹ — ابتدائی امداد اور بعد میں دیکھنے والی علامات",
      "roman": "Sir ki chot — ibtidai imdad aur baad mein dekhne wali alamaat"
    },
    "content": {
      "en": "• For a knock to the head: sit the person down, place a cold wet cloth on the bump for 15–20 minutes, rest and observe — most minor bumps are not serious\n• Do NOT press any sunken part of the skull, do not force off a helmet, and do not give food or drink to a drowsy person\n• Watch closely for 24–48 hours: repeated vomiting, growing drowsiness or being hard to wake, confusion or strange behaviour, unequal pupils, weakness or numbness of a limb, slurred speech, fits, clear fluid or blood from the ear or nose, worsening headache\nANY of these = GO TO HOSPITAL IMMEDIATELY / CALL 1122 — bleeding or swelling inside the head can appear hours after the injury\n• Keep watch through the first night, gently wake once or twice to check response; no alcohol, driving or sports for 24 hours\nBabies, elderly people, people on blood-thinning medicine and anyone who was knocked out should ALWAYS be checked at a facility.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• سر پر چوٹ لگنے پر: شخص کو بٹھائیں، سوج پر 15-20 منٹ ٹھنڈا گیلا کپڑا رکھیں، آرام اور نظر — زیادہ تر ہلکی چوٹیں سنگین نہیں ہوتیں\n• کھوپڑی کے دھنسے حصے پر دباؤ نہ دیں، ہیلمٹ زبردستی نہ اتاریں، اور سستے شخص کو کھانا پانی نہ دیں\n• 24-48 گھنٹے دیکھیں: بار بار الٹی، بڑھتی ہوئی نیند یا جگانا مشکل، الجھن یا عجیب رویہ، دونوں پتلیوں کا بے ترتیب ہونا، کسی حصے کی کمزوری یا سن ہونا، لڑتا ہوا بولنا، دورے، کان یا ناک سے صاف مادہ یا خون، بڑھتا سر درد\nان میں سے کوئی بھی علامت = فوراً ہسپتال / 1122 پر کال — چوٹ کے کئی گھنٹے بعد بھی سر کے اندر خون یا سوجن بن سکتی ہے\n• پہلی رات نظر رکھیں، ایک دو بار آہستہ جگا کر جواب جانچیں؛ 24 گھنٹے تک نہ شراب، نہ گاڑی، نہ کھیل\nنوزائیدہ بچے، بوڑھے افراد، خون پتلا کرنے والی دوا لینے والے اور جو بےہوش ہو چکا ہو — ہر صورت میں فیسلٹی سے معائنہ کروائیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Sir par chot lagnay par: shakhs ko bithayein, sooj par 15-20 minute thanda geela kapra rakhein, aaraam aur nazar — zyada tar halki chotein sangeen nahin hotin\n• Khopri ke dhansay hissay par dabao na dein, helmet zabardasti na utaarein, aur sustay shakhs ko khana paani na dein\n• 24-48 ghantay dekhein: baar baar ulti, barhti hui neend ya jagana mushkil, uljhan ya ajeeb rawayya, dono putliyon ka be-tarteeb hona, kisi hissay ki kamzori ya sun hona, larta hua bolna, doray, kaan ya naak se saaf mada ya khoon, barhta sar dard\nIN mein se koi bhi alamat = FORI HOSPITAL / 1122 par call — chot ke kai ghanton baad bhi sir ke andar khoon ya soojan ban sakti hai\n• Pehli raat nazar rakhein, aik do baar aahista jaga kar jawab jaanchein; 24 ghantay tak na sharab, na gaari, na khel\nNuzaida bachay, borhay afraad, khoon patla karne wali dawa lene walay aur jo behosh ho chuka ho — har soorat mein facility se muaina karwayein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "head injury",
      "hit my head",
      "hit his head",
      "sar par chot",
      "سر پر چوٹ",
      "concussion",
      "sar gir gaya",
      "head bump",
      "khopri chot",
      "head trauma"
    ],
    "baseLevel": "URGENT",
    "audience": "emergency",
    "source": {
      "publisher": "IFRC",
      "title": "First aid for head injury",
      "url": "https://www.ifrc.org/first-aid",
      "license": "Public education material",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "fracture-first-aid",
    "topic": "first-aid",
    "title": {
      "en": "Suspected broken bone — first aid",
      "ur": "ہڈی ٹوٹنے کا شبہ — ابتدائی امداد",
      "roman": "Haddi tootne ka shubha — ibtidai imdad"
    },
    "content": {
      "en": "• Do NOT move or straighten the limb yourself, and never make the person walk or \"test\" a suspected broken leg\n• Keep it still as found: pad around with soft cloth and support with a firm board or rolled newspaper tied loosely along the limb\n• Apply a cold pack wrapped in cloth for 15–20 minutes to reduce swelling — never ice directly on skin\n• Remove rings, watches and tight bangles before swelling grows; keep the limb raised if possible\n• Cover any open wound with a clean cloth and press gently if it bleeds\nGO TO A HOSPITAL / CALL 1122 for every suspected fracture — only an X-ray can decide. For head, neck or back injuries: keep the person completely still, do not let them walk or twist, and call 1122 for transport\nWatch the limb: cold, blue or numb fingers or toes beyond the injury = go to hospital urgently.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• ہاتھ پاؤں کو خود نہ ہلائیں نہ سیدھا کریں، اور شک کی ٹوٹی ٹانگ پر کبھی چل کر \"آزمائش\" نہ کروائیں\n• جیسا ہے ویسا ساکن رکھیں: چاروں طرف نرم کپڑا لگائیں اور مضبوط تختی یا لپٹے ہوئے اخبار سے ڈھیلا سہارا باندھیں\n• سوجن کم کرنے کے لیے کپڑے میں لپٹی ٹھنڈی چیز 15-20 منٹ رکھیں — برف براہِ راست جلد پر کبھی نہیں\n• سوجن بڑھنے سے پہلے انگوٹھیاں، گھڑیاں اور تنگ چوڑیاں اتار لیں؛ ممکن ہو تو حصہ اونچا رکھیں\n• کھلا زخم صاف کپڑے سے ڈھانپیں اور خون آئے تو ہلکا دباؤ دیں\nہر شک کی ہڈی ٹوٹنے پر ہسپتال / 1122 — فیصلہ صرف ایکس رے کرتا ہے۔ سر، گردن یا کمر کی چوٹ پر: شخص کو بالکل ساکن رکھیں، نہ چلنے دیں نہ موڑنے، اور سواری کے لیے 1122 پر کال کریں\nحصہ دیکھیں: زخم سے آگے انگلیاں ٹھنڈی، نیلی یا سن ہوں = فوری ہسپتال۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Haath pair ko khud na hilayein na seedha karein, aur shak ki tooti taang par kabhi chal kar \"aazmaish\" na karwayein\n• Jaisa hai waisa sakin rakhein: charon taraf naram kapra lagayein aur mazboot takhti ya lapte huay akhbar se dheela sahara baandhein\n• Soojan kam karne ke liye kapray mein lapti thandi cheez 15-20 minute rakhein — barf baraah-e-raast jild par kabhi nahin\n• Soojan barhne se pehle angothiyan, ghariyan aur tang chooriyan utaar lein; mumkin ho to hissa ooncha rakhein\n• Khula zakhm saaf kapray se dhaanpein aur khoon aaye to halka dabao dein\nHar shak ki haddi tootne par HOSPITAL / 1122 — faisla sirf X-ray karta hai. Sir, gardan ya kamar ki chot par: shakhs ko bilkul sakin rakhein, na chalne dein na murne, aur sawari ke liye 1122 par call karein\nHissa dekhein: zakhm se aagay ungliyan thandi, neeli ya sun hon = fori hospital.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "fracture",
      "broken bone",
      "haddi toot gayi",
      "haddi tootna",
      "ہڈی ٹوٹ",
      "broken arm",
      "broken leg",
      "toti hui haddi",
      "fracture first aid",
      "broken limb",
      "deformed limb",
      "haddi fracture",
      "fractures"
    ],
    "baseLevel": "URGENT",
    "audience": "emergency",
    "source": {
      "publisher": "IFRC",
      "title": "First aid for suspected fractures",
      "url": "https://www.ifrc.org/first-aid",
      "license": "Public education material",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "seizure-first-aid",
    "topic": "seizure",
    "title": {
      "en": "Seizure (fits) — first aid and when to call 1122",
      "ur": "دورہ (مرگی) — ابتدائی امداد اور 1122 پر کب کال کریں",
      "roman": "Dora (mirgi) — ibtidai imdad aur 1122 par kab call karein"
    },
    "content": {
      "en": "STAY CALM and note the time — most fits stop on their own within 1–2 minutes.\n• Protect: lay the person on the floor, clear away hard or sharp objects, put something soft under the head\n• DO NOT hold the person down and DO NOT put anything (spoon, cloth, medicine, water) in the mouth — objects break teeth and cause choking\n• Once the shaking stops, roll the person onto their side (recovery position) so the tongue and fluids drain, loosen tight clothing, and stay until fully alert\nCALL 1122 IMMEDIATELY if: the fit lasts more than 5 minutes, a second fit begins, it happened in water, the person is injured, pregnant or diabetic, has never had fits before, or does not wake up and breathe normally afterwards\n• People with repeated fits (epilepsy) should keep taking the medicines their doctor prescribed and avoid triggers like missed sleep.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "سکون رکھیں اور وقت یاد رکھیں — زیادہ تر دورے خود بخود 1-2 منٹ میں رک جاتے ہیں۔\n• تحفظ: شخص کو زمین پر لٹائیں، سخت یا تیز چیزیں ہٹائیں، سر کے نیچے نرم چیز رکھیں\n• شخص کو دبائیں نہیں اور منہ میں کچھ بھی (چمچ، کپڑا، دوا، پانی) نہ ڈالیں — چیزیں دانت توڑتی اور گلا گھونٹتی ہیں\n• جھٹکے رکنے کے بعد شخص کو کروٹ پر لٹائیں (ریکوری پوزیشن) تاکہ زبان اور رقیق چیزیں باہر آ جائیں، تنگ کپڑے ڈھیلے کریں اور پورے ہوش آنے تک ساتھ رہیں\n1122 پر فوراً کال کریں اگر: دورہ 5 منٹ سے زیادہ چلے، دوسرا دورہ شروع ہو، پانی میں گرے، شخص زخمی، حاملہ یا شوگر کا مریض ہو، پہلے کبھی دورہ نہ پڑا ہو، یا بعد میں ہوش نہ آئے اور سانس عام نہ ہو\n• بار بار دورے پڑنے والے (مرگی) ڈاکٹر کی تجویز کردہ دوا جاری رکھیں اور نیند کی کمی جیسے محرکوں سے بچیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "Sukoon rakhein aur waqt yaad rakhein — zyada tar doray khud-ba-khud 1-2 minute mein ruk jate hain.\n• Hifazat: shakhs ko zameen par litayein, sakht ya tez cheezein hatayein, sar ke neeche naram cheez rakhein\n• Shakhs ko dabayein nahin aur munh mein kuch bhi (chamach, kapra, dawa, paani) na dalein — cheezein daant todti aur gala ghoontti hain\n• Jhatkon rukne ke baad shakhs ko karwat par litayein (recovery position) taakay zaban aur raqueeq cheezein bahar aa jayen, tang kapray dheelay karein aur poore hosh aane tak saath rahein\n1122 PAR FORI CALL karein agar: dora 5 minute se zyada chale, doosra dora shuru ho, paani mein gire, shakhs zakhmi, hamal wali ya sugar ka mareez ho, pehle kabhi dora na para ho, ya baad mein hosh na aaye aur saans aam na ho\n• Baar baar doray parnay walay (mirgi) doctor ki tajweez karda dawa jari rakhein aur neend ki kami jaisay muharrikaat se bachain.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "seizure",
      "fits",
      "dora",
      "mirgi",
      "مرگی",
      "دورہ",
      "seizure first aid",
      "fit attack",
      "jhatke",
      "epilepsy",
      "recovery position"
    ],
    "baseLevel": "URGENT",
    "audience": "emergency",
    "source": {
      "publisher": "WHO",
      "title": "Epilepsy fact sheet — seizure first aid",
      "url": "https://www.who.int/news-room/fact-sheets/detail/epilepsy",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "family-planning",
    "topic": "family-planning",
    "title": {
      "en": "Birth spacing — a healthy choice for mother and child",
      "ur": "بچوں کے درمیان وقفہ — ماں اور بچے کے لیے صحت مند انتخاب",
      "roman": "Bachon ke darmiyan waqfa — maa aur bachay ke liye sehatmand ikhtiyar"
    },
    "content": {
      "en": "• Spacing pregnancies at least 2 years apart protects the health of the mother — she rebuilds her blood and strength — and the next baby is born healthier\n• Many safe methods are available in Pakistan, FREE at government facilities: pills, injections, condoms, the IUD (coil), implants, and permanent options for couples who have completed their family\n• Lady Health Workers (LHWs) give private counselling at home — ask your LHW or the nearest BHU/RHC; husbands can also discuss options with a male doctor\n• Natural spacing: exclusive breastfeeding can delay the return of fertility in the first 6 months (not fully reliable on its own)\n• The choice belongs to the couple — no judgment, and privacy is respected\nSEE A DOCTOR IF: irregular bleeding, severe headaches, or any concern after starting a method — alternatives always exist.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• کم از کم 2 سال کا وقفہ رکھنے سے ماں کی صحت محفوظ رہتی ہے — خون اور طاقت دوبارہ بنتی ہے — اور اگلا بچہ زیادہ صحت مند پیدا ہوتا ہے\n• پاکستان میں کئی محفوظ طریقے موجود ہیں، سرکاری مراکز میں مفت: گولیاں، انجیکشن، کنڈوم، آئی یو ڈی (کوائل)، امپلانٹ، اور خاندان مکمل کر لینے والے جوڑوں کے لیے مستقل طریقے\n• لیڈی ہیلتھ ورکر گھر آ کر نجی مشورہ دیتی ہیں — اپنی LHW یا قریب ترین BHU/RHC سے رابطہ کریں؛ شوہر مرد ڈاکٹر سے بھی مشورہ لے سکتے ہیں\n• قدرتی وقفہ: صرف ماں کا دودھ پہلے 6 مہینوں میں دوبارہ حمل کو تاخیر دے سکتا ہے (تنہا مکمل بھروسا نہیں)\n• انتخاب جوڑے کا حق ہے — بغیر کسی تبصرے کے، رازداری کا پوری طرح خیال رکھا جاتا ہے\nڈاکٹر کو دکھائیں: بے ترتیب خون آئے، شدید سر درد ہو، یا کوئی طریقہ شروع کرنے کے بعد کوئی تکلیف ہو — متبادل ہمیشہ موجود ہیں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Kam az kam 2 saal ka waqfa rakhnay se maa ki sehat mehfooz rehti hai — khoon aur taqat dobara banti hai — aur agla bacha zyada sehatmand paida hota hai\n• Pakistan mein kai mehfooz tareeqay maujood hain, sarkari markazon mein muft: goliyan, injection, condom, IUD (coil), implant, aur khandan mukammal kar lenay walay joron ke liye mustaqil tareeqay\n• Lady Health Worker ghar aa kar niji mashwara deti hain — apni LHW ya qareeb tareen BHU/RHC se raabta karein; shohar mard doctor se bhi mashwara le sakta hai\n• Qudrati waqfa: sirf maa ka doodh pehlay 6 mahinon mein dobara hamal ko taakheer de sakta hai (akela mukammal bharosa nahin)\n• Intikhab joray ka haq hai — baghair kisi tabassray ke, raazdari ka poori tarah khayal rakha jata hai\nDOCTOR KO DIKHAYEIN agar: be-tarteeb khoon aaye, sakht sar dard ho, ya koi tareeqa shuru karne ke baad koi takleef ho — mazeed tareeqay hamesha maujood hain.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "family planning",
      "birth spacing",
      "bachon ke darmiyan waqfa",
      "خاندانی بہبودگی",
      "contraception",
      "contraceptive pills",
      "planning pregnancy",
      "lhw",
      "condom",
      "iud",
      "family planning methods"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "maternal",
    "source": {
      "publisher": "WHO",
      "title": "Family planning / contraception fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/family-planning-contraception",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "back-pain",
    "topic": "musculoskeletal",
    "title": {
      "en": "Back pain — safe care and warning signs",
      "ur": "کمر کا درد — محفوظ دیکھ بھال اور خطرے کی علامات",
      "roman": "Kamar ka dard — mehfooz dekh bhaal aur khatray ki alamaat"
    },
    "content": {
      "en": "• Most back pain improves in 1–2 weeks with gentle movement — long bed rest actually slows recovery\n• Keep moving as comfort allows; avoid heavy lifting, sudden twisting and poor posture\n• A warm compress or warm shower on the sore area helps many people\n• Ask a pharmacist or doctor about simple pain relief — follow the label, never take more than it says\n• Sleep on a firm mattress; a pillow under the knees when lying on your back can ease strain\nSEE A DOCTOR IF: pain is severe, lasts more than 2 weeks, or comes with fever, unexplained weight loss, or pain running down the leg below the knee.\nGO IMMEDIATELY if: back pain comes with loss of bladder or bowel control, numbness in the groin/inner thighs, or leg weakness — these need emergency care (call 1122).\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• زیادہ تر کمر کا درد ہلکی وزن چالانے سے 1-2 ہفتوں میں بہتر ہو جاتا ہے — لمبی بستر رہنا بہتری کو سب سے دھیمی کرتا ہے\n• جو تک آسانی ہو چلتے رہیں؛ بہاری چیز اٹھانے، اچانک مڑانے اور برا محرت سے بچیں\n• درد والی جگہ پر گرم سینی یا گرم پانی کا حمام بہت سے آرام دیتا ہے\n• سادہ درد کم کرنے والی دوا کے بارے میں فارماسسٹ یا ڈاکٹر سے پوچھیں — لیبل کی ہدایت پر چلیں، اس سے زیادہ کبھی نہ لیں\n• سخت بستر پر سوئیں؛ پست کے بال بچھڑ کے درمیان تکیة کے نیچے تے ابھر کو آرام دیتا ہے\nڈاکٹر کو دکھائیں: درد شدید ہو، 2 ہفتوں سے زیادہ رے، یا بخار، بے وجہ وزن کا گپٹا، یا پڈونے تک تنگ جانے والا درد ہو۔\nفوراً جائیں اگر: کمر کے درد کے ساتھ پیشاب یا پخانے پر قبو طسلّ چلے جانے، اندری رانے پر سنس ختم ہو، یا پڈونی کمزور ہو — این الامات فوری امجنسی ڈاکٹر پر لازمی ہیں (1122 پر کال کریں)۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Zyada tar kamar ka dard halki wazan chalane se 1-2 hafton mein behtar ho jata hai — lambi bistar rehna behtari ko sab se dheemi karta hai\n• Jo tak aasani ho chaltay rahein; bhaari cheez uthanay, achanak mudna aur bara mehrt se bachein\n• Dard wali jagah par garm seeni ya garam paani ka nahaan bohat logon ko aaraam deta hai\n• Sada dard kam karne wali dawa ke baray mein pharmacist ya doctor se poochein — label ki hidayat par chalein, us se zyada kabhi na lein\n• Sakht bistar par soyein; peeth ke bal letnay kay darmiyan takiye ke neechay takia aaraam deta hai\nDOCTOR KO DIKHAYEIN agar: dard shadeed ho, 2 hafton se zyada rahe, ya bukhar, bay wajah wazan ka ghatna, ya ghutnay ke neechay taang tak jane wala dard ke saath ho.\nFORAN JAYEIN agar: kamar ke dard ke saath peshab ya pakhany par qaboo chalay jaye, andri ranay par sens khatam ho, ya paon kamzor ho — yeh alamaat fori emergency darkar hain (1122 par call karein).\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard."
    },
    "tags": [
      "back pain",
      "backache",
      "kamar dard",
      "کمر درد",
      "کمر کا درد",
      "kamar ka dard",
      "lower back pain",
      "waist pain",
      "kamar ki dard",
      "muscle pain back",
      "chronic back pain",
      "back pain relief"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Low back pain fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/low-back-pain",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "nausea-vomiting",
    "topic": "digestive",
    "title": {
      "en": "Nausea and vomiting — care and warning signs",
      "ur": "متلی اور الٹی — دیکھ بھال اور خطرے کی علامات",
      "roman": "Matli aur ulti — dekh bhaal aur khatray ki alamaat"
    },
    "content": {
      "en": "• Most nausea and vomiting is caused by a short stomach upset, food that disagreed with you, or heat — it usually settles in a few hours to a day\n• Sip ORS or water slowly and often — small sips stay down better than large drinks\n• Rest the stomach for 30–60 minutes after vomiting, then start with dry food like plain toast, khichri, rice or bananas\n• Avoid oily, spicy food, milk, tea and carbonated drinks until you feel better\n• The biggest risk is dehydration — keep sipping ORS: signs of dehydration are dry mouth, sunken eyes, passing very little urine\nSEE A DOCTOR IF: vomiting lasts more than 24 hours, you cannot keep any fluids down, there is blood in the vomit, severe stomach pain, high fever, or a stiff neck with headache.\nGO IMMEDIATELY (call 1122) if: vomit contains blood or looks like coffee grounds, there is sudden severe stomach pain, the person becomes confused or very drowsy, or a baby under 3 months vomits repeatedly.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.",
      "ur": "• زیادہ تر متلی اور الٹی پیٹ کے معمولی اپسٹ، مناسب نہ ڈلنے والی خوراک، یا گرمی سے ہوتی ہے — عام طور پر چند گھنٹوں سے ایک دن میں اپنا آجاتی ہے\n• ORS یا پانی آہستا آہستا کر کے پیتے رہیں — چُک چُک پی ڈے چیز بڑی بہتر رہتی ہے\n• الٹی کے بعد 30-60 منٹ پیٹ کو آرام دیں، پھر خشک خوراک سے شروع کریں جیسے سادہ ٹوسٹ، کچچڑی، چاول یا کیلا\n• بہتری ہونے تک تلخ، مرعا خوراک، دودپشت، چائے اور سودا والے مشروبات سے بچیں\n• سب سے بڑا خطر پانی کی کمی ہے — ORS پیتے رہیں: پانی کی کمی کی علامات خشک منہ، دھندی آنکھیں، بہت کم پیشاب ہونا\nڈاکٹر کو دکھائیں: الٹی 24 گھنٹوں سے زیادہ رے، کوئی مائع پیٹ میں نہ رہ تا، الٹی میں خون ہو، شدید پیٹ کا درد، تیز بخار، یا سخت گردن کے ساتھ سر درد ہو۔\nفوراً جائیں (1122 پر کال کریں) اگر: الٹی میں خون ہو یا کافی کے دانے جیسی لٹے، اچانک شدید پیٹ کا درد ہو، بندے الجھن یا بہت سستی ہو جائے، یا 3 مہینے سے کم عمر کا بچا بار بار الٹی کرے۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔",
      "roman": "• Zyada tar matli aur ulti peit ki mamooli upset, munasib nah dalne wali khurak, ya garmi se hoti hai — aam tor par chand ghanton se aik din mein apni aa jati hai\n• ORS ya paani aahista aahista kar ke peetay rahein — chuk chuk pi di cheez bari behtar rehti hai\n• Ulti ke baad 30-60 mint peit ko aaraam dein, phir khushk khurak se shuru karein jaisay sada toast, khichri, chawal ya keela\n• Behtar hone tak telhi, mirch wali khurak, doodh, chai aur soda walay mashroobaat se bachein\n• Sab se bara khatra pani ki kami hai — ORS peetay rahein: pani ki kami ki alamaat khush munh, dhundhi aankhein, bohat kam peshab hona\nDOCTOR KO DIKHAYEIN agar: ulti 24 ghanton se zyada rahe, koi maayea peit mein na reh raha ho, ulti mein khoon ho, shadeed peit ka dard ho, tez bukhar ho, ya sakht gardan ke saath sar dard ho.\nFORAN JAYEIN (1122 par call karein) agar: ulti mein khoon ho ya kaafi ke danay jaisi lage, achanak shadeed peit ka dard ho, banday mein uljhan ya bohat susti aajaye, ya 3 mahinay se kam umar ka bacha baar baar ulti kare.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "nausea",
      "vomiting",
      "matli",
      "ulti",
      "متلی",
      "الٹی",
      "feel like vomiting",
      "feel sick",
      "vomit",
      "nauseous",
      "throwing up",
      "puking",
      "pet kharab",
      "motion sickness",
      "vomiting nausea"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Diarrhoeal disease / ORS rehydration guidance",
      "url": "https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "antibiotic-awareness",
    "topic": "medication-safety",
    "title": {
      "en": "Antibiotics and safe medicine use",
      "ur": "اینٹی بائیوٹک اور محفوظ دوا کا استعمال",
      "roman": "Antibiotic aur mehfooz dawa ka istemal"
    },
    "content": {
      "en": "• Antibiotics fight bacterial infections only — they do NOT work against viruses, so they cannot cure most coughs, colds, flu, sore throats or simple fevers\n• Which antibiotic is needed, for how long and at what dose depends on the infection, your age, weight, kidney/liver health, other medicines and allergies — a doctor or pharmacist must decide this after examining you\n• Never take antibiotics (or any prescription medicine) that were prescribed for someone else, or left over from an old illness\n• If a doctor has prescribed an antibiotic, take it exactly as prescribed — do not stop early because you feel better, and do not save leftovers for later\n• Taking antibiotics when they are not needed causes antibiotic resistance — a real danger in Pakistan — where infections stop responding to these medicines\n• For a child, a pregnant woman or an elderly person, medicine choices and doses are different and MUST come from a doctor — never adapt an adult’s medicine for them\nSEE A DOCTOR to find out whether an infection needs an antibiotic at all. If you have already taken someone else’s medicine or too much of any medicine, contact a doctor or the Health Helpline 1166.\nEMERGENCY / GO IMMEDIATELY: severe shortness of breath, loss of consciousness, uncontrolled bleeding, or extreme chest pain.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• اینٹی بائیوٹک صرف بیکٹیریل انفیکشن پر کام کرتے ہیں — وائرس پر نہیں، اس لیے عام کھانسی، زکام، فلو، گلے کی خرابی یا سادہ بخار کو ٹھیک نہیں کرتے\n• کون سی اینٹی بائیوٹک، کتنی دن اور کتنی خوراک — یہ انفیکشن، آپ کی عمر، وزن، گردے/جگر کی صحت، دیگر ادویات اور الرجی پر منحصر ہے — یہ ڈاکٹر یا فارماسسٹ ہی معائنے کے بعد طے کر سکتا ہے\n• کسی اور کے لیے تجویز کردہ یا پرانی بیماری کی بچی ہوئی اینٹی بائیوٹک (یا کوئی بھی نسخے والی دوا) کبھی نہ لیں\n• اگر ڈاکٹر نے اینٹی بائیوٹک تجویز کی ہے تو بالکل اسی طرح لیں — بہتر محسوس ہونے پر جلدی بند نہ کریں اور بچی ہوئی دوا بعد کے لیے نہ رکھیں\n• بغیر ضرورت اینٹی بائیوٹک لینے سے اینٹی بائیوٹک ریزیسٹنس پیدا ہوتا ہے — پاکستان میں یہ حقیقی خطرہ ہے — جس سے انفیکشن ان ادویات پر اثر نہیں کرتے\n• بچے، حاملہ خاتون یا بزرگ کے لیے دوا کا انتخاب اور خوراک مختلف ہوتی ہے اور یہ صرف ڈاکٹر سے ہونی چاہیے — کبھی بڑے کی دوا کم کر کے نہ دیں\n\nجاننے کے لیے ڈاکٹر کو دکھائیں کہ انفیکشن کو اینٹی بائیوٹک درکار ہے بھی یا نہیں۔ اگر آپ نے کسی اور کی دوا لی ہے یا کسی بھی دوا زیادہ لی ہے تو ڈاکٹر یا ہیلتھ ہیلپ لائن 1166 سے رابطہ کریں۔\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، بے ہوشی، خون کا نہ رکنا، یا شدید سینے کا درد۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• Antibiotic sirf bacterial infection par kaam karte hain — virus par nahin, is liye aam khansi, zukaam, flu, gale ki kharabi ya sada bukhar ko theek nahin karte\n• Kaun si antibiotic, kitne din aur kitni khoraak — yeh infection, aap ki umar, wazan, gurde/jigar ki sehat, doosri adwiyat aur allergy par munhasir hai — yeh doctor ya pharmacist hi muaine ke baad tay kar sakta hai\n• Kisi aur ke liye tajweez shudah ya purani bimari ki bachi hui antibiotic (ya koi bhi nuskay wali dawa) kabhi na lein\n• Agar doctor ne antibiotic tajweez ki hai to bilkul usi tarah lein — behtar mehsoos hone par jaldi band na karein aur bachi hui dawa baad ke liye na rakhein\n• Baghair zaroorat antibiotic lene se antibiotic resistance paida hoti hai — Pakistan mein yeh haqeeqi khatra hai — jis se infection in adwiyat par asar nahin karte\n• Bachay, haamila khatoon ya buzurg ke liye dawa ka intikhab aur khoraak mukhtalif hoti hai aur yeh sirf doctor se honi chahiye — kabhi baray ki dawa kam kar ke na dein\n\nJanne ke liye DOCTOR KO DIKHAYEIN ke infection ko antibiotic darkar hai bhi ya nahin. Agar aap ne kisi aur ki dawa li hai ya kisi bhi dawa zyada li hai to doctor ya Health Helpline 1166 se raabta karein.\nEMERGENCY (FORI JAYEIN): saans lene mein shadeed dushwari, behoshi, khoon na rukna, ya sakht seenay ka dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "antibiotic",
      "antibiotics",
      "antibiotic resistance",
      "antibiotic course",
      "prescription antibiotic",
      "antibiotic dose",
      "self medication antibiotic",
      "اینٹی بائیوٹک",
      "اینٹی بایوٹک",
      "antibiotics without prescription",
      "antibiotic misuse",
      "which antibiotic"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Antimicrobial resistance / rational use of medicines",
      "url": "https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "toothache-dental",
    "topic": "toothache",
    "title": {
      "en": "Toothache and dental pain — temporary relief and care",
      "ur": "دانت کا درد — عارضی آرام اور دیکھ بھال",
      "roman": "Daant ka dard — aarzi aaram aur dekh bhaal"
    },
    "content": {
      "en": "• Rinse gently with warm salt water (half teaspoon salt in warm water) to reduce irritation and swelling\n• Use a cold compress or ice pack wrapped in a cloth on the outside of your cheek for 15 minutes\n• Ask a pharmacist about simple pain relief (such as paracetamol) — never place aspirin directly on the tooth or gum as it burns the tissue\n• Avoid very hot, cold, or sugary foods and drinks that trigger pain\nSEE A DENTIST: A toothache indicates tooth decay, gum infection, or a cracked tooth that requires professional dental treatment.\nEMERGENCY / GO IMMEDIATELY: Severe swelling spreading to your face, jaw, or neck, difficulty swallowing or breathing, or high fever with dental pain — these are signs of a spreading infection.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• گرم نمکین پانی سے کلیاں کریں (آدھا چمچ نمک نیم گرم پانی میں) تاکہ سوزش کم ہو\n• گال کے باہر کپڑے میں لپٹی برف کی ٹکور کریں (15 منٹ)\n• فارماسسٹ سے درد کم کرنے کی عام دوا (جیسے پیراسیٹامول) پوچھیں — اسپرین کو براہ راست دانت یا مسوڑھے پر نہ رکھیں\n• بہت گرم، ٹھنڈے یا میٹھے کھانوں اور مشروبات سے پرہیز کریں\nڈینٹسٹ کو دکھائیں: دانت کا درد دانت کے کیڑے، مسوڑھوں کے انفیکشن یا دانت ٹوٹنے کی علامت ہے جس کا باقاعدہ علاج ضروری ہے۔\nایمرجنسی (فوراً جائیں): اگر چہرے، جبڑے یا گردن پر سوجن پھیل جائے، نگلنے یا سانس لینے میں دشواری ہو، یا دانت کے درد کے ساتھ تیز بخار ہو۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• Gungunay namkeen paani se kulliyan karein (aadha chamach namak paani mein) taake soojan kam ho\n• Gaal ke bahar kapray mein lipti barf se 15 minute thandak dein\n• Pharmacist se dard kam karne ki aam dawa (paracetamol) poochein — aspirin ko direct daant par kabhi na rakhein kyunke yeh masoorhay ko jala sakti hai\n• Bohat garam, thhande ya meethay khanay peenay se parhez karein\nDENTIST KO DIKHAYEIN: Daant ka dard keera lagne ya infection ki alamat hai jiska ilaaj dentist hi kar sakta hai.\nEMERGENCY (FORI JAYEIN): Agar soojan chehray, jabray ya gardan par phail jaye, nigalne ya saans mein mushkil ho, ya tez bukhar ho.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "toothache",
      "tootheach",
      "tooth ache",
      "dental pain",
      "dant dard",
      "daant dard",
      "دانت درد",
      "دانت کا درد",
      "tooth pain",
      "teeth pain"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Oral health / toothache home care guidance",
      "url": "https://www.who.int/news-room/fact-sheets/detail/oral-health",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "gerd-heartburn",
    "topic": "gerd-heartburn",
    "title": {
      "en": "Heartburn, acid reflux and acidity — home relief",
      "ur": "سینے کی جلن، تیزابیت اور معدے کی تکلیف — گھریلو رہنمائی",
      "roman": "Seene ki jalan, tezaabiyat aur maiday ki takleef — gharelu rahnumai"
    },
    "content": {
      "en": "• Eat smaller, more frequent meals; avoid lying down for at least 2 to 3 hours after eating\n• Cut down on oily/fried foods, heavy spices, tea, coffee, and carbonated sodas\n• Elevate the head of your bed by 6 inches if nighttime heartburn disturbs your sleep\n• Drink plain water or cold milk for temporary relief; ask a pharmacist about over-the-counter antacids\nSEE A DOCTOR IF: Symptoms happen more than twice a week, make swallowing painful, or cause unexplained weight loss.\nEMERGENCY / GO IMMEDIATELY: If burning pain radiates to your left arm, shoulder, jaw, or comes with sweating, shortness of breath, or dizziness — this could be a heart condition, NOT simple acidity.",
      "ur": "• کم مقدار میں بار بار کھانا کھائیں؛ کھانے کے بعد کم از کم 2 سے 3 گھنٹے لیٹنے سے پرہیز کریں\n• تلی ہوئی، چکنائی والی، تیز مصالحہ دار غذائیں، چائے، کافی اور کولڈ ڈرنکس کم کریں\n• رات کو جلن ہو تو بستر کا سرہانہ 6 انچ اونچا رکھیں\n• عارضی آرام کے لیے سادہ پانی یا ٹھنڈا دودھ پیئیں؛ فارماسسٹ سے اینٹاسڈ (antacid) شربت کے بارے میں پوچھیں\nڈاکٹر کو دکھائیں: جلن ہفتے میں 2 بار سے زیادہ ہو، نوالہ نگلنے میں تکلیف ہو، یا وزن کم ہو رہا ہو\nایمرجنسی (فوراً جائیں): اگر جلن والا درد بائیں بازو، کندھے یا جبڑے تک جائے، یا پسینے اور سانس پھولنے کے ساتھ ہو — یہ دل کا مسئلہ ہو سکتا ہے، صرف تیزابیت نہیں۔",
      "roman": "• Thori thori miqdar mein khana khayein; khanay ke baad 2-3 ghantay laitne se parhez karein\n• Tali hui cheezein, tez mirch masalay, chai, coffee aur cold drinks kam karein\n• Raat ko jalan ho to takiya ooncha karein\n• Aarzi aaram ke liye sada paani ya thanda doodh piyein; pharmacist se antacid syrup poochein\nDOCTOR KO DIKHAYEIN agar: jalan hafte mein 2 baar se zyada ho ya nigalne mein takleef ho\nEMERGENCY (FORI JAYEIN): Agar dard bayen baazu, kandhay ya jabray tak jaye, paseena aaye ya saans phoolay — yeh dil ka dard ho sakta hai, siraf acidity nahin.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "acidity",
      "acid reflux",
      "heartburn",
      "gerd",
      "seene ki jalan",
      "سینے کی جلن",
      "تیزابیت",
      "tezaabiyat",
      "khatti dakar",
      "stomach burning",
      "pait me jalan",
      "indigestion",
      "badhazmi"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO EMRO",
      "title": "Digestive health and lifestyle guidance",
      "url": "https://www.emro.who.int/noncommunicable-diseases/publications/index.html",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "constipation-diet",
    "topic": "constipation",
    "title": {
      "en": "Constipation — safe dietary relief and warning signs",
      "ur": "قبض — محفوظ غذائی علاج اور احتیاطی تدابیر",
      "roman": "Qabz — mehfooz ghizai ilaaj aur ehtiyati tadabeer"
    },
    "content": {
      "en": "• Increase dietary fiber: eat whole wheat roti, lentils (daal), green vegetables, apples, pears, and prunes or ispaghol husk in warm water/milk\n• Drink 8 to 10 glasses of clean water daily and maintain light physical activity/walking\n• Do not delay or ignore the urge to use the bathroom\n• Ask a pharmacist before using laxatives — avoid long-term reliance on stimulant laxatives\nSEE A DOCTOR IF: Constipation lasts more than 2 weeks, or comes with blood in the stool, unexplained weight loss, or pencil-thin stools.\nEMERGENCY / GO IMMEDIATELY: Severe, sudden abdominal pain with vomiting and inability to pass gas or stool (possible bowel obstruction).",
      "ur": "• خوراک میں فائبر بڑھائیں: چکی کے آٹے کی روٹی، دالیں، سبزیاں، اسبغول کا چھلکا نیم گرم دودھ یا پانی میں لیں\n• روزانہ 8 سے 10 گلاس صاف پانی پیئیں اور چہل قدمی کریں\n• رفع حاجت کی حاجت کو مت روکیں\n• قبض کشا ادویات (laxatives) کے عادی نہ بنیں — پہلے ڈاکٹر یا فارماسسٹ سے مشورہ کریں\nڈاکٹر کو دکھائیں: قبض 2 ہفتے سے زیادہ رہے، پاخانے میں خون آئے، یا بغیر وجہ وزن کم ہو\nایمرجنسی (فوراً جائیں): اگر پیٹ میں اچانک شدید درد ہو، الٹی آئے اور گیس یا پاخانہ بالکل خارج نہ ہو (آنتوں کی بندش کا خطرہ)۔",
      "roman": "• Fiber wali ghiza khayein: chakki ka aata, daalein, sabziyan, ispaghol ka chilka gungunay doodh mein lein\n• Rozana 8-10 glass saaf paani piyein aur daily walk karein\n• Qabz kusha dawaon ke aadi na banein — pehle pharmacist se poochein\nDOCTOR KO DIKHAYEIN agar: qabz 2 haftay se zyada ho ya pakhana mein khoon aaye\nEMERGENCY (FORI JAYEIN): Agar pait mein achanak shadeed dard ho, ulti aaye aur gas/stool bilkul band ho jaye.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "constipation",
      "qabz",
      "qabaz",
      "قبض",
      "hard stool",
      "pet saaf na hona",
      "ispaghol",
      "bowel movement"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Nutrition and gastrointestinal health",
      "url": "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "ear-infection",
    "topic": "ear-pain",
    "title": {
      "en": "Ear pain and infection — home care and precautions",
      "ur": "کان کا درد اور انفیکشن — گھریلو دیکھ بھال اور احتیاط",
      "roman": "Kaan ka dard aur infection — gharelu dekh bhaal aur ehtiyat"
    },
    "content": {
      "en": "• Apply a warm, dry washcloth against the affected ear for 15 minutes to soothe pain\n• Keep the ear canal clean and dry — do NOT insert cotton buds, matchsticks, needles, or unprescribed oils\n• Ask a pharmacist about simple pain relief (paracetamol)\n• Avoid getting water in the ear while bathing\nSEE A DOCTOR IF: Pain lasts more than 2 to 3 days, fluid/pus/blood discharges from the ear, hearing becomes muffled, or in a child with fever and ear pulling.\nEMERGENCY / GO IMMEDIATELY: Swelling and redness spreading behind the ear, facial weakness, or stiff neck with fever.",
      "ur": "• آرام کے لیے کان پر گرم، خشک کپڑے کی ٹکور کریں (15 منٹ)\n• کان کو خشک رکھیں — ماچس کی تیلی، کاٹن بڈ، تیل یا کوئی چیز کان میں ہرگز نہ ڈالیں\n• درد کے لیے فارماسسٹ سے پیراسیٹامول پوچھیں\n• نہاتے وقت کان میں پانی جانے سے بچائیں\nڈاکٹر کو دکھائیں: درد 2-3 دن سے زیادہ رہے، کان سے پیپ، پانی یا خون بہے، یا بچے کو بخار کے ساتھ کان میں درد ہو\nایمرجنسی (فوراً جائیں): اگر کان کے پیچھے سوجن اور سرخی ہو جائے، چہرہ ٹیڑھا ہو، یا بخار کے ساتھ گردن اکڑ جائے۔",
      "roman": "• Aaram ke liye kaan par garam kapray se saik karein (15 minute)\n• Kaan ko khushk rakhein — teeli, cotton bud ya koi tail kaan mein hargiz na daalein\n• Dard ke liye paracetamol lein\nDOCTOR KO DIKHAYEIN agar: dard 2-3 din se zyada ho, kaan se peep/paani/khoon behay ya sunai kam de\nEMERGENCY (FORI JAYEIN): Kaan ke peechay soojan phail jaye ya bukhar ke saath gardan sakht ho.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "ear pain",
      "earache",
      "kaan dard",
      "kaan me dard",
      "کان کا درد",
      "ear infection",
      "otitis media",
      "otitis-media",
      "otitis",
      "kaan ka infection",
      "کان کا انفیکشن",
      "kaan behna",
      "pus from ear",
      "ear discharge"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Deafness and hearing loss / ear care",
      "url": "https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "uti-burning",
    "topic": "uti",
    "title": {
      "en": "Burning urination and urinary symptoms — guidance",
      "ur": "پیشاب میں جلن اور پیشاب کی نالی کا انفیکشن — رہنمائی",
      "roman": "Peshab mein jalan aur infection — rahnumai"
    },
    "content": {
      "en": "• Drink plenty of clean water (at least 2.5 to 3 liters daily) to help flush out the urinary tract\n• Do not hold urine for long periods; empty your bladder fully\n• Avoid excessive spices, acidic citrus drinks, and caffeine while symptoms persist\n• Proper hygiene: wipe from front to back to prevent bacteria from entering the urethra\nSEE A DOCTOR IF: A urinary tract infection (UTI) requires a simple urine test and appropriate prescribed antibiotics to prevent kidney infection.\nEMERGENCY / GO IMMEDIATELY: High fever with chills, severe back or flank pain (side of back), vomiting, or visible blood in the urine.",
      "ur": "• خوب پانی پیئیں (روزانہ ڈھائی سے 3 لیٹر صاف پانی) تاکہ پیشاب کی نالی صاف ہو\n• پیشاب کو زیادہ دیر نہ روکیں\n• جب تک جلن رہے تیز مصالحوں اور چائے/کافی سے پرہیز کریں\n• صفائی کا خاص خیال رکھیں\nڈاکٹر کو دکھائیں: پیشاب میں جلن اکثر انفیکشن (UTI) کی وجہ سے ہوتی ہے جس کے لیے پیشاب کا ٹیسٹ اور ڈاکٹر کی تجویز کردہ اینٹی بائیوٹک ضروری ہوتی ہے\nایمرجنسی (فوراً جائیں): تیز بخار اور لرزہ، کمر کے نچلے حصے یا پہلو میں شدید درد، الٹیاں، یا پیشاب میں سرخ خون آنا۔",
      "roman": "• Khoob paani piyein (2.5 se 3 liter rozana) taake peshab ki nali saaf ho\n• Peshab ko zyada der mat rokein\n• Tez mirch masalay aur chai/coffee kam karein\nDOCTOR KO DIKHAYEIN: Peshab mein jalan aksar infection (UTI) ki wajah se hoti hai jiske liye urine test aur doctor ki dawa zaroori hai\nEMERGENCY (FORI JAYEIN): Tez bukhar, kamar ke pehloo (flank) mein shadeed dard, ulti, ya peshab mein khoon aana."
    },
    "tags": [
      "burning urination",
      "uti",
      "urinary infection",
      "peshab me jalan",
      "پیشاب میں جلن",
      "peshab bar bar",
      "urine burning",
      "urine infection"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Urinary tract and kidney health guidance",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "hives-urticaria",
    "topic": "skin-allergy",
    "title": {
      "en": "Skin allergy, hives (pitti) and itching — home care",
      "ur": "جلد کی الرجی، پتی اچھلنا اور خارش — گھریلو رہنمائی",
      "roman": "Jild ki allergy, pitti uchhalna aur kharish — gharelu rahnumai"
    },
    "content": {
      "en": "• Apply cool, damp cloths or take a lukewarm shower to soothe itchy, swollen welts\n• Wear loose, light cotton clothing; avoid tight, synthetic, or wool fabrics\n• Avoid scratching the skin, which can break the skin and cause bacterial infection\n• Ask a pharmacist about non-drowsy over-the-counter antihistamines\n• Identify and avoid suspected triggers (certain foods, drugs, insect bites, or strong detergents)\nSEE A DOCTOR IF: Hives last more than a few days or keep returning regularly.\nEMERGENCY / GO IMMEDIATELY: If hives/itching occur alongside difficulty breathing, swelling of the lips/tongue/throat, voice hoarseness, dizziness, or vomiting (signs of severe anaphylaxis).",
      "ur": "• خارش اور سوجن کم کرنے کے لیے ٹھنڈے پانی کی پٹیاں رکھیں یا نیم گرم پانی سے نہائیں\n• ڈھیلے اور نرم سوتی کپڑے پہنیں؛ ریشمی یا تنگ کپڑوں سے پرہیز کریں\n• خارش کرنے سے پرہیز کریں تاکہ جلد پر زخم نہ بنے\n• فارماسسٹ سے الرجی کی دوا (antihistamine) کے بارے میں پوچھیں\n• الرجی کی وجہ (کوئی خاص خوراک، دوا، یا صابن) تلاش کر کے اس سے بچیں\nڈاکٹر کو دکھائیں: پتی یا خارش کئی دن تک رہے اور ٹھیک نہ ہو\nایمرجنسی (فوراً جائیں): اگر پتی کے ساتھ سانس لینے میں دشواری ہو، ہونٹ، زبان یا گلے میں سوجن ہو، آواز بیٹھ جائے، یا چکر آئیں (شدید انفیلیکسس الرجی کی علامت)۔",
      "roman": "• Kharish aur soojan par thanday paani ki patti rakhein ya taaza paani se nahayein\n• Dheelay sooti (cotton) kapray pehnein\n• Kharish na karein taake zakhm na banay\n• Pharmacist se anti-allergy dawa poochein\n• Jis cheez se allergy hui ho (khas khana, dawa ya powder) us se bachein\nDOCTOR KO DIKHAYEIN agar: kharish kai din tak theek na ho\nEMERGENCY (FORI JAYEIN): Agar pitti ke saath saans lene mein takleef ho, hont/zaban/gala sooj jaye ya chakkar aayein (anaphylaxis ka khatra).\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "allergy",
      "hives",
      "urticaria",
      "pitti",
      "پتی",
      "kharish",
      "خارش",
      "skin allergy",
      "itching",
      "danay",
      "skin rash",
      "khujli"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Allergic conditions and skin care guidance",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "hemorrhoids-piles",
    "topic": "hemorrhoids",
    "title": {
      "en": "Piles & hemorrhoids (bawaseer) — home care, diet and warning signs",
      "ur": "بواسیر اور مقعد کی سوزش — گھریلو تدابیر، پرہیز اور خطرے کی علامات",
      "roman": "Bawaseer (hemorrhoids) — gharelu tadbeer, parhez aur khatray ki alamaat"
    },
    "content": {
      "en": "• Eat a high-fiber diet: increase whole grains, lentils, fresh vegetables, fruits, and use ispaghol husk daily with water\n• Drink at least 8–10 glasses of water daily to keep stools soft and prevent straining during bowel movements\n• Take warm sitz baths (sit in a tub of warm water for 15–20 minutes, 2–3 times a day) to soothe swelling and anal pain\n• Avoid prolonged sitting on the toilet and do not delay the urge to pass stool\nSEE A DOCTOR IF: Bleeding during bowel movements persists, pain becomes severe, or hemorrhoids protrude and cannot be pushed back.\nEMERGENCY / GO IMMEDIATELY: Heavy continuous rectal bleeding, feeling faint/dizzy, or passing large blood clots with bowel movements.",
      "ur": "• زیادہ فائبر والی غذا لیں: دالیں، کچی سبزیاں، پھل اور روزانہ رات کو اسبغول کا چھلکا پانی کے ساتھ استعمال کریں\n• روزانہ کم از کم 8-10 گلاس پانی پئیں تاکہ پاخانہ نرم رہے اور زور نہ لگانا پڑے\n• نیم گرم پانی کا ٹب باتھ (sitz bath) لیں (دن میں 2-3 بار 15-20 منٹ گرم پانی میں بیٹھیں) جس سے درد اور سوجن میں آرام ملتا ہے\n• بیت الخلاء میں زیادہ دیر بیٹھنے سے پرہیز کریں اور حاجت کو ہرگز نہ روکیں\nڈاکٹر کو دکھائیں: پاخانے میں مسلسل خون آئے، درد بہت بڑھ جائے، یا مسے باہر نکل آئیں اور اندر نہ جائیں۔\nایمرجنسی (فوراً جائیں): مقعد سے مسلسل زیادہ خون بہنا، چکر آنا یا بےہوشی محسوس ہونا، یا پاخانے میں خون کے بڑے لوتھڑے آنا۔",
      "roman": "• Zyada fiber wali ghiza lein: daalein, sabziyan, phal aur rozana raat ko ispaghol ka chilka paani ke sath lein\n• Rozana kam az kam 8-10 glass paani piyein taake pakhana narm rahe aur zor na lagana paray\n• Neem garam paani ka sitz bath lein (din mein 2-3 baar 15-20 minute garam paani mein baithein) jis se dard aur sujan mein aaram milta hai\n• Toilet mein zyada dair baithne se parhez karein aur haajat ko na rokein\nDOCTOR KO DIKHAYEIN agar: pakhane mein musalsal khoon aaye ya masay bahir nikal aayein\nEMERGENCY (FORI JAYEIN): Pakhane ke sath musalsal zyada khoon behna, chakkar aana ya behoshi mehsoos hona.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "hemorrhoids",
      "piles",
      "bawaseer",
      "بواسیر",
      "bawasir",
      "bawaser",
      "khooni bawaseer",
      "badi bawaseer",
      "masay",
      "rectal bleeding",
      "pakhane me khoon",
      "paikhane me khoon",
      "anal pain",
      "anorectal"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Colorectal and gastrointestinal primary care guidelines",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "gallstones-cholecystitis",
    "topic": "gallstones",
    "title": {
      "en": "Gallbladder stones (pitte ki pathri) — symptoms, diet and emergency triggers",
      "ur": "پتے کی پتھری اور درد (کولیسسٹائٹس) — علامات، غذا اور خطرے کے اشارے",
      "roman": "Pitte ki pathri (gallstones) — alamaat, parhez aur emergency triggers"
    },
    "content": {
      "en": "• Gallstones are hardened deposits in the gallbladder that can trigger severe upper right abdominal pain (biliary colic)\n• Avoid fried, oily, and heavy fatty foods (parathas, biryani, samosas) which trigger strong gallbladder contractions and pain\n• Eat smaller, regular meals with lean protein, vegetables, and plenty of fluids\n• Rest and apply a warm heating pad to the upper abdomen during mild pain episodes\nSEE A DOCTOR IF: You experience recurrent right-sided upper abdominal pain lasting >30 minutes, especially after eating fatty meals.\nEMERGENCY / GO IMMEDIATELY: Severe unrelenting pain >4 hours, high fever with chills, persistent vomiting, or yellowing of eyes and skin (jaundice).",
      "ur": "• پتے کی پتھری چکنائی کے جمع ہونے سے بنتی ہے جو پیٹ کے دائیں اوپری حصے میں شدید درد کا سبب بنتی ہے\n• زیادہ تلی ہوئی اور چکنائی والی غذاؤں (پراٹھے، بریانی، سموسے) سے سخت پرہیز کریں کیونکہ یہ درد کو بڑھاتی ہیں\n• دن میں ہلکا کھانا کھائیں اور سبزیوں اور پانی کا استعمال زیادہ کریں\n• درد کے دوران آرام کریں اور پیٹ کے اوپری حصے پر گرم پانی کی بوتل سے ہلکا سینک کریں\nڈاکٹر کو دکھائیں: چکنائی والا کھانا کھانے کے بعد پیٹ کے دائیں طرف آدھے گھنٹے سے زیادہ درد رہے\nایمرجنسی (فوراً جائیں): اگر درد 4 گھنٹے سے زیادہ مستقل رہے، تیز بخار کے ساتھ کپکپی ہو، مسلسل الٹیاں آئیں، یا آنکھیں پیلی ہو جائیں۔",
      "roman": "• Pitte ki pathri pait ke dayen oopri hissay mein shadeed dard peda karti hai\n• Tali hui aur chiknai wali cheezon (paratha, biryani, samosey) se sakht parhez karein\n• Halka khana khayein aur paani zyada piyein\n• Dard ke doran aaraam karein aur pait par garam bottle se saik karein\nDOCTOR KO DIKHAYEIN agar: oily khana khane ke baad bar bar pait mein dard uthay\nEMERGENCY (FORI JAYEIN): Shadeed dard 4 ghantay se zyada rahe, kapkapi ke sath tez bukhar ho, ya aankhein peeli ho jayein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "gallstones",
      "gallbladder",
      "pitte ki pathri",
      "پتے کی پتھری",
      "cholecystitis",
      "pitta pathri",
      "pitte me pathri",
      "pitta dard",
      "gall bladder pain",
      "pit ki pathri",
      "right abdominal pain"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO / Pakistan MoNHSRC",
      "title": "Management of biliary colic and gallbladder diseases",
      "url": "https://www.nhsrc.gov.pk",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "peptic-ulcer",
    "topic": "peptic-ulcer",
    "title": {
      "en": "Stomach & peptic ulcer (meday ka ulcer) — care, triggers and red flags",
      "ur": "معدے کا السر اور تیزابیت — دیکھ بھال، اسباب اور خطرے کی علامات",
      "roman": "Meday ka ulcer (peptic ulcer) — dekh bhaal, asbaab aur khatray ki alamaat"
    },
    "content": {
      "en": "• Peptic ulcers cause a burning or gnawing ache in the stomach between meals or during the night\n• Avoid painkiller overuse (NSAIDs like diclofenac, aspirin, brufen), which irritate and erode the stomach lining\n• Eat smaller, frequent meals; avoid smoking, tobacco, excessive tea/coffee, and highly spiced chili dishes\n• Antacids can provide temporary relief, but persistent ulcers require medical evaluation for H. pylori infection\nSEE A DOCTOR IF: Burning stomach pain recurs daily, causes unexplained weight loss, or difficulty swallowing food.\nEMERGENCY / GO IMMEDIATELY: Sudden excruciating knife-like stomach pain (perforation), vomiting red blood or coffee-ground material, or passing black sticky stools (internal bleeding).",
      "ur": "• معدے کا السر کھانے کے درمیان یا رات کو پیٹ میں جلن اور شدید درد پیدا کرتا ہے\n• درد کش گولیوں (ڈیکلوفینیک، بروفین، اسپرین) کے بے دریغ استعمال سے سخت پرہیز کریں کیونکہ یہ معدے کی دیوار کو چھلتی ہیں\n• تھوڑا تھوڑا کر کے دن میں کئی بار کھانا کھائیں؛ سگریٹ، نسوار، کالی چائے اور تیز مرچ مسالوں سے پرہیز کریں\n• اینٹاسڈ سے وقتی آرام آتا ہے لیکن مستقل علاج کے لیے ڈاکٹر سے ٹیسٹ کروائیں\nڈاکٹر کو دکھائیں: جلن اور درد روزانہ ہو، وزن کم ہو رہا ہو، یا کھانا نگلنے میں دشواری ہو\nایمرجنسی (فوراً جائیں): پیٹ میں اچانک نیزے جیسا شدید درد (معدے میں سوراخ)، خون کی یا کافی کے رنگ کی الٹی، یا سیاہ تارکول جیسا پاخانہ آئے۔",
      "roman": "• Meday ka ulcer khana khane ke darmiyan ya raat ko pait mein jalan aur dard peda karta hai\n• Dard kusha goliyon (Brufen, Diclofenac, Aspirin) se sakht parhez karein kyunke yeh meday ko chhelti hain\n• Thora thora kar ke khayein; sigrat, naswar, chai aur tez mirch se parhez karein\n• Antacid se waqti aaram aata hai lekin mustaqil ilaaj ke liye doctor ko dikhayein\nDOCTOR KO DIKHAYEIN agar: jalan rozana ho ya wazan kam ho raha ho\nEMERGENCY (FORI JAYEIN): Pait mein achanak shadeed dard ho, khoon ki ulti aaye ya siyah (black) pakhana aaye.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "peptic ulcer",
      "stomach ulcer",
      "meday ka ulcer",
      "معدے کا السر",
      "gastric ulcer",
      "pait ka ulcer",
      "pet me jalan",
      "stomach burning",
      "ulcer"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Digestive diseases and gastric health guidance",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "irritable-bowel-ibs",
    "topic": "ibs",
    "title": {
      "en": "Irritable bowel syndrome (IBS) — dietary management and flare relief",
      "ur": "آنتوں کی سوزش اور مروڑ (IBS) — غذائی علاج اور ذہنی سکون",
      "roman": "Aanton ki sozish aur maror (IBS) — ghizai ilaaj aur zehni sukoon"
    },
    "content": {
      "en": "• IBS is a common gut disorder causing bloating, abdominal cramps, gas, and alternating bouts of constipation and diarrhea\n• Identify and avoid individual food triggers: reduce raw onions, garlic, excess dairy, carbonated sodas, and greasy foods\n• Increase soluble fiber (ispaghol husk) gradually with plenty of water; practice relaxation and stress-reducing exercises\n• Eat meals at regular times without skipping or rushing; drink soothing peppermint or fennel (saunf) warm tea\nSEE A DOCTOR IF: Symptoms do not improve after dietary changes or disrupt your daily work and sleep.\nEMERGENCY / GO IMMEDIATELY: Blood in stool, unintentional rapid weight loss, persistent fever, or chronic diarrhea starting after age 50.",
      "ur": "• آئی بی ایس (IBS) آنتوں کا ایک عام مسئلہ ہے جس میں پیٹ پھولنا، مروڑ، گیس اور کبھی قبض تو کبھی دست ہوتے ہیں\n• محرک غذاؤں کی پہچان کریں: کچا پیاز، لہسن، کولڈ ڈرنکس اور زیادہ تلی ہوئی چیزیں کم کریں\n• اسبغول کا چھلکا نیم گرم پانی کے ساتھ استعمال کریں؛ ذہنی دباؤ کم کرنے کے لیے ورزش اور گہرے سانس لیں\n• باقاعدہ وقت پر کھانا کھائیں؛ سونف یا پودینے کا قہوہ گیس اور مروڑ میں آرام دیتا ہے\nڈاکٹر کو دکھائیں: غذائی تبدیلی کے باوجود علامات ٹھیک نہ ہوں یا نیند خراب ہو\nایمرجنسی (فوراً جائیں): پاخانے میں خون آنا، تیزی سے بغیر وجہ وزن گرنا، مسلسل بخار، یا 50 سال کی عمر کے بعد نیا دست کا مسئلہ شروع ہونا۔",
      "roman": "• IBS aanton ka masla hai jismein pait phoolna, maror, gas aur qabz/dast ki shikayat hoti hai\n• Jin cheezon se gas ya maror barhay un se parhez karein: kacha pyaz, cold drinks aur tali hui cheezein\n• Ispaghol ka chilka paani ke sath lein aur zehni dabao kam karein\n• Saunf ya podinay ka qehwa pait ke maror mein mufeed hai\nDOCTOR KO DIKHAYEIN agar: khaney mein parhez ke bawajood aaram na aaye\nEMERGENCY (FORI JAYEIN): Pakhane mein khoon, achanak wazan kam hona ya musalsal bukhar.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "ibs",
      "irritable bowel",
      "pait maror",
      "آنتوں کی سوزش",
      "pait me gas",
      "bloating",
      "stomach cramps",
      "antriyon ka masla",
      "cramping"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Functional gastrointestinal disorders guidance",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "sinusitis-sinus-infection",
    "topic": "sinusitis",
    "title": {
      "en": "Sinusitis and sinus pain — home steam care and warning signs",
      "ur": "سائنس کا انفیکشن اور پیشانی کا درد — بھاپ، دیکھ بھال اور علامات",
      "roman": "Sinusitis aur sinus dard — bhaap, dekh bhaal aur alamaat"
    },
    "content": {
      "en": "• Inhale warm steam 2–3 times daily to loosen trapped mucus in the nasal passages and facial cavities\n• Use sterile saline nasal spray or neti rinse to flush irritants and clear blocked sinuses\n• Stay well hydrated with warm water, soups, and herbal teas; apply a warm damp washcloth over your forehead and cheeks\n• Most sinus infections are viral and resolve within 7–10 days without antibiotics\nSEE A DOCTOR IF: Symptoms last >10 days without improvement, facial pain becomes severe, or fever spikes after initial improvement (double sickening).\nEMERGENCY / GO IMMEDIATELY: Swelling, redness, or pain around one or both eyes, vision changes / double vision, severe stiff neck, or confusion.",
      "ur": "• ناک اور پیشانی کی بند نالیوں کو کھولنے کے لیے دن میں 2-3 بار گرم پانی کی بھاپ لیں\n• نمکین پانی کے ڈراپس یا اسپرے (saline nasal spray) سے ناک صاف کریں\n• گرم پانی، سوپ اور قہوے سے جسم میں پانی کی کمی نہ ہونے دیں؛ پیشانی اور گالوں پر نیم گرم گیلے کپڑے کی ٹکور کریں\n• زیادہ تر سائنس کا انفیکشن وائرل ہوتا ہے اور 7-10 دن میں اینٹی بائیوٹک کے بغیر ٹھیک ہو جاتا ہے\nڈاکٹر کو دکھائیں: علامات 10 دن سے زیادہ رہیں، چہرے کا درد شدید ہو، یا بخار دوبارہ چڑھ جائے\nایمرجنسی (فوراً جائیں): اگر آنکھوں کے گرد سوجن یا سرخی آ جائے، دھندلا یا دوہرا دکھائی دے، گردن سخت ہو، یا شدید غنودگی اور الجھن ہو۔",
      "roman": "• Naak aur peshani kholne ke liye din mein 2-3 baar garam paani ki bhaap lein\n• Saline nasal spray se naak saaf rakhein\n• Khoob garam maayeaat (soup, qehwa, paani) piyein; peshani par garam kapray se saik karein\n• Zyada tar sinusitis viral hota hai aur 7-10 din mein theek ho jata hai\nDOCTOR KO DIKHAYEIN agar: takleef 10 din se zyada rahe ya chehre ka dard barh jaye\nEMERGENCY (FORI JAYEIN): Aankh ke gird soojan ya laali, nazar mein kharabi, gardan sakht hona ya behoshi.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "sinusitis",
      "sinus",
      "sinus infection",
      "sinus pain",
      "sinus dard",
      "سائنس",
      "پیشانی کا درد",
      "peshani me dard",
      "naak band",
      "facial pressure",
      "blocked nose"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO / Pakistan MoNHSRC",
      "title": "Respiratory and upper airway infections guidance",
      "url": "https://www.nhsrc.gov.pk",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "allergic-rhinitis",
    "topic": "allergic-rhinitis",
    "title": {
      "en": "Allergic rhinitis & dust/pollen allergies — relief and prevention",
      "ur": "الرجی نزلہ، چھینکیں اور گرد و غبار — بچاؤ اور گھریلو علاج",
      "roman": "Allergic rhinitis, cheenkay aur gard allergy — bachao aur ilaaj"
    },
    "content": {
      "en": "• Minimize exposure to triggers: wear a mask during dusty weather, smog, sweeping, or high pollen seasons\n• Keep living areas clean; wash bedsheets weekly in hot water and avoid keeping heavy dust-collecting carpets in bedrooms\n• Flush nasal passages daily with saline nasal wash to rinse out trapped dust, pollutants, and allergens\n• Consult a pharmacist for non-drowsy oral antihistamines or steroid nasal sprays for seasonal flare-ups\nSEE A DOCTOR IF: Nasal congestion interferes with sleep or work, or leads to recurrent sinus or ear infections.\nEMERGENCY / GO IMMEDIATELY: Sudden facial swelling, wheezing, tight chest, or difficulty breathing (signs of severe allergic reaction / anaphylaxis).",
      "ur": "• الرجی کی وجوہات سے بچیں: گرد و غبار، سموگ، جھاڑو دیتے وقت یا پولن سیزن میں ماسک پہنیں\n• بستر کی چادریں باقاعدگی سے گرم پانی میں دھوئیں اور کمروں میں گرد جمع کرنے والے قالینوں سے پرہیز کریں\n• نمکین پانی (saline spray) سے روزانہ ناک دھوئیں تاکہ گرد اور الرجن صاف ہوں\n• اینٹی الرجی دوا کے بارے میں ڈاکٹر یا فارماسسٹ سے پوچھیں\nڈاکٹر کو دکھائیں: ناک بند ہونے سے نیند یا روزمرہ کے کام متاثر ہوں یا کان میں درد ہو\nایمرجنسی (فوراً جائیں): اگر چہرے یا ہونٹوں پر اچانک سوجن ہو، سانس میں سیٹی بجے یا سانس رکنے لگے (شدید الرجک ایمرجنسی)۔",
      "roman": "• Gard o ghubar, smog aur pollen ke mausam mein mask pehnein\n• Bistar ki chaadrein garam paani se dhoiyein aur kamray mein mitti jama na hone dein\n• Saline spray se naak saaf karein taake allergen nikal jayein\n• Pharmacist se mashwara kar ke anti-allergy dawa lein\nDOCTOR KO DIKHAYEIN agar: naak band hone se neend kharab ho ya kaan mein dard ho\nEMERGENCY (FORI JAYEIN): Agar chehra/hont sooj jayein, seene mein jakdan ho ya saans na aaye.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "allergic rhinitis",
      "dust allergy",
      "cheenk",
      "cheenkay",
      "cheenkain",
      "الرجی",
      "چھینکیں",
      "sneezing",
      "runny nose",
      "naak behna",
      "smog allergy",
      "pollen allergy"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Allergic rhinitis and chronic respiratory disease guidance",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "tonsillitis-throat",
    "topic": "tonsillitis",
    "title": {
      "en": "Tonsillitis & severe sore throat — home soothing and red flags",
      "ur": "ٹانسلز کی سوزش اور گلے کا درد — گھریلو تدابیر اور خطرے کی علامات",
      "roman": "Tonsillitis aur galay ke tonsils — gharelu dekh bhaal aur alamaat"
    },
    "content": {
      "en": "• Gargle with warm salt water (half teaspoon salt in warm water) 3–4 times daily to reduce throat inflammation\n• Drink warm soothing liquids: honey with lemon water, clear broths, and green tea\n• Rest your voice, stay hydrated, and use throat lozenges to soothe swallowing discomfort\n• Most tonsillitis cases are viral; antibiotics are only effective for confirmed bacterial (strep) infection prescribed by a doctor\nSEE A DOCTOR IF: Severe sore throat lasts >3–4 days, accompanied by high fever, white pus patches on tonsils, or tender neck glands.\nEMERGENCY / GO IMMEDIATELY: Inability to swallow fluids or saliva (drooling), difficulty breathing or stridor, or severe difficulty opening the mouth (lockjaw/peritonsillar abscess).",
      "ur": "• نیم گرم نمک ملے پانی سے دن میں 3-4 بار غرارے کریں جس سے گلے کی سوجن کم ہوتی ہے\n• نیم گرم مائعات لیں: شہد ملا لیموں پانی، سوپ، اور یخنی گلے کو سکون دیتی ہے\n• آواز کو آرام دیں، پانی زیادہ پئیں، اور گلے کی خراش کے لیے لوزینجز چوسیں\n• زیادہ تر ٹانسلز وائرل ہوتے ہیں، ڈاکٹر کے مشورے کے بغیر اینٹی بائیوٹک ہرگز نہ لیں\nڈاکٹر کو دکھائیں: گلے کا شدید درد 3 دن سے زیادہ رہے، تیز بخار ہو، ٹانسلز پر سفید پیپ کے دانے ہوں یا گردن کی گلٹیاں سوج جائیں۔\nایمرجنسی (فوراً جائیں): اگر تھوک یا پانی نگلنا ناممکن ہو جائے، سانس لینے میں سیٹی کی آواز آئے یا منہ کھولنے میں شدید دشواری ہو۔",
      "roman": "• Neem garam namak ke paani se din mein 3-4 baar ghararay karein\n• Garam maayeaat (shehd mila paani, soup, yakhni) piyein jis se galay ko sukoon milta hai\n• Aawaz ko aaraam dein aur paani khoob piyein\n• Zyada tar tonsils viral hote hain, doctor ke mashwaray ke baghair antibiotic na lein\nDOCTOR KO DIKHAYEIN agar: galay ka dard 3 din se zyada rahe, tez bukhar ho ya tonsils par safeed peep nazar aaye\nEMERGENCY (FORI JAYEIN): Thook nigalna mushkil ho, saans lene mein rukawat aaye ya munh na khul sakay.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "tonsillitis",
      "tonsils",
      "galay ke tonsils",
      "ٹانسلز",
      "gale me sujan",
      "swollen tonsils",
      "strep throat",
      "galay ka dard",
      "white spots throat"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO / Pakistan MoNHSRC",
      "title": "Integrated management of childhood illness: pharyngitis and tonsillitis",
      "url": "https://www.who.int/teams/maternal-newborn-child-adolescent-health",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "epistaxis-nosebleed",
    "topic": "nosebleed",
    "title": {
      "en": "Nosebleed (nakseer) — correct first aid pinching and warning signs",
      "ur": "نکسیر پھوٹنا (ناک سے خون) — ابتدائی طبی امداد اور احتیاطی تدابیر",
      "roman": "Nakseer phootna (nosebleed) — first aid aur zaroori hidayat"
    },
    "content": {
      "en": "• Lean SLIGHTLY FORWARD with head tilted down — do NOT tilt the head backward (swallowing blood causes nausea and vomiting)\n• Firmly pinch the soft part of the nose (just below the nasal bone) for 10–15 full minutes without letting go\n• Breathe through the mouth and spit out any blood that collects in the throat\n• Apply an ice pack or cold damp cloth across the bridge of the nose and forehead to constrict bleeding vessels\nSEE A DOCTOR IF: Nosebleeds recur frequently (several times a week) or follow starting blood thinner medications.\nEMERGENCY / GO IMMEDIATELY: Bleeding does not stop after 20 minutes of firm continuous pressure, bleeding is rapid and heavy, causes dizziness/fainting, or occurs after severe head/facial trauma.",
      "ur": "• سر کو ہلکا سا آگے کی طرف جھکائیں — سر پیچھے ہرگز نہ کریں کیونکہ خون معدے میں جانے سے الٹی آ سکتی ہے\n• ناک کے نرم حصے کو انگوٹھے اور انگلی سے 10-15 منٹ تک مسلسل مضبوطی سے دبا کر رکھیں اور بیچ میں چھوڑ کر نہ دیکھیں\n• منہ سے سانس لیں اور گلے میں آنے والے خون کو تھوک دیں\n• ناک کی ہڈی اور پیشانی پر برف یا ٹھنڈے کپڑے کی ٹکور کریں تاکہ خون کی نالیاں سکڑیں\nڈاکٹر کو دکھائیں: نکسیر ہفتے میں کئی بار بار بار پھوٹے یا خون پتلا کرنے والی ادویات کے بعد شروع ہو\nایمرجنسی (فوراً جائیں): اگر 20 منٹ تک مسلسل دبانے کے باوجود خون بند نہ ہو، چکر یا بےہوشی آئے، یا ناک سے خون کسی شدید چوٹ کے بعد ہو۔",
      "roman": "• Sar ko thora aagay jhukayein — sar peechay hargiz na karein kyunke khoon halaq mein ja sakta hai\n• Naak ke narm hissay ko 10-15 minute tak musalsal daba kar rakhein\n• Munh se saans lein aur halaq mein aane wala khoon thook dein\n• Naak aur peshani par barf ki takore karein\nDOCTOR KO DIKHAYEIN agar: nakseer baar baar phootay\nEMERGENCY (FORI JAYEIN): Agar 20 minute lagataar dabane ke bawajood khoon na rukay ya behoshi mehsoos ho.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "nosebleed",
      "nakseer",
      "نکسیر",
      "epistaxis",
      "naak se khoon",
      "bleeding nose",
      "nakseer phootna",
      "nose injury"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "IFRC / WHO",
      "title": "First aid guidelines for epistaxis and minor bleeding",
      "url": "https://www.ifrc.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "bronchitis-acute",
    "topic": "bronchitis",
    "title": {
      "en": "Acute bronchitis & chest cold — airway soothing and red flags",
      "ur": "سینے کی جکڑن اور شدید کھانسی (برونکائٹس) — گھریلو دیکھ بھال",
      "roman": "Seenay ki jakdan aur balghami khansi (bronchitis) — dekh bhaal"
    },
    "content": {
      "en": "• Acute bronchitis is an inflammation of the airways usually following a cold or viral upper respiratory infection\n• Inhale warm moist steam 2–3 times daily and drink plenty of warm fluids (honey-lemon water, herbal teas, warm broth)\n• Elevate head on extra pillows while sleeping to ease coughing bouts; avoid tobacco smoke and dusty/smoky air\n• Antibiotics are NOT recommended for acute bronchitis in otherwise healthy individuals as >90% are viral\nSEE A DOCTOR IF: Cough lasts >3 weeks, produces rust-colored or foul mucus, or occurs in individuals with chronic lung/heart disease.\nEMERGENCY / GO IMMEDIATELY: Severe shortness of breath, chest pain when inhaling, coughing up bright red blood, high fever (>39°C) with shaking chills, or blue lips.",
      "ur": "• شدید برونکائٹس سانس کی نالیوں کی سوزش ہے جو اکثر نزلہ زکام کے بعد ہوتی ہے اور بلغم والی کھانسی پیدا کرتی ہے\n• دن میں 2-3 بار بھاپ لیں اور نیم گرم مائعات (شہد ملا لیموں پانی، یخنی) زیادہ پئیں\n• رات کو سوتے وقت سر کے نیچے دو تکیے رکھیں اور سگریٹ کے دھوئیں اور گرد سے پرہیز کریں\n• 90 فیصد سے زیادہ برونکائٹس وائرل ہوتا ہے اور اینٹی بائیوٹک کے بغیر ٹھیک ہوتا ہے\nڈاکٹر کو دکھائیں: کھانسی 3 ہفتے سے زیادہ رہے، یا دمے اور دل کے مریضوں کو ہو\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید تنگی، کھانسی میں تازہ خون آنا، تیز بخار کے ساتھ کپکپی، یا ہونٹ نیلے پڑ جانا۔",
      "roman": "• Bronchitis saans ki naliyon ki sozish hai jo balghami khansi aur seene me jakdan peda karti hai\n• Bhaap lein aur garam maayeaat (soup, yakhni, shehd) piyein\n• Sote waqt sar ooncha rakhein aur sigrat ke dhuen se bachein\n• Zyada tar bronchitis viral hota hai aur khud theek hota hai\nDOCTOR KO DIKHAYEIN agar: khansi 3 hafte se zyada rahe\nEMERGENCY (FORI JAYEIN): Saans lene mein shadeed dushwari, khansi mein khoon aana ya neelay hont.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "bronchitis",
      "chest cold",
      "balghami khansi",
      "برونکائٹس",
      "seenay me jakdan",
      "acute bronchitis",
      "phlegm cough",
      "cough with phlegm",
      "chest congestion"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Clinical management of acute respiratory infections",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "hyperlipidemia-cholesterol",
    "topic": "hyperlipidemia",
    "title": {
      "en": "High cholesterol & triglycerides — diet, lifestyle and cardiovascular protection",
      "ur": "خون میں کولیسٹرول اور چربی (Hyperlipidemia) — پرہیز، ورزش اور علاج",
      "roman": "High cholesterol aur khoon me chiknai — parhez, warzish aur ilaaj"
    },
    "content": {
      "en": "• High LDL cholesterol and triglycerides silently build plaque inside arteries, increasing risk of heart attacks and stroke\n• Replace saturated & trans fats (banaspati ghee, dalda, deep-fried foods) with heart-healthy oils (olive, mustard, canola) in small amounts\n• Increase soluble dietary fiber: daily oats, lentils, beans, apples, and ispaghol husk help lower blood cholesterol levels\n• Engage in at least 30 minutes of brisk walking or moderate aerobic exercise 5 days a week; stop smoking\nSEE A DOCTOR IF: You have a family history of early heart disease or your fasting lipid profile blood test shows elevated numbers requiring statin therapy.\nEMERGENCY / GO IMMEDIATELY: Sudden crushing chest pressure, pain radiating to left arm/jaw, sudden shortness of breath, cold sweat, or sudden slurred speech / facial drooping.",
      "ur": "• خون میں کولیسٹرول اور ٹرائی گلسرائیڈز کی زیادتی خاموشی سے دل کی شریانوں کو بند کر کے ہارٹ اٹیک اور فالج کا خطرہ بڑھاتی ہے\n• بناسپتی گھی، ڈالڈا، بیکری کی اشیاء اور تلی ہوئی چیزوں سے پرہیز کریں اور سرسوں یا زیتون کا تیل استعمال کریں\n• فائبر والی غذائیں زیادہ کھائیں: دلیہ، دالیں، پھل، اور اسبغول کا چھلکا کولیسٹرول کو کم کرنے میں مدد دیتے ہیں\n• ہفتے میں کم از کم 5 دن روزانہ 30 منٹ تیز واک کریں اور سگریٹ نوشی ترک کریں\nڈاکٹر کو دکھائیں: خاندان میں دل کی بیماری کی تاریخ ہو یا لپڈ پروفائل ٹیسٹ میں کولیسٹرول زیادہ آئے\nایمرجنسی (فوراً جائیں): سینے پر اچانک شدید بوجھ یا درد، بائیں بازو یا جبڑے میں درد، ٹھنڈے پسینے، یا بولنے میں دشواری (فالج/ہارٹ اٹیک)۔",
      "roman": "• Khoon mein cholesterol barhna dil ki sharyanon ko band karta hai jis se heart attack ka khatra hota hai\n• Banaspati ghee, dalda aur tali hui cheezon se sakht parhez karein\n• Daliya, daalein, phal aur ispaghol ka istemal barhayein\n• Rozana 30 minute tez walk karein aur sigrat noshi chhor dein\nDOCTOR KO DIKHAYEIN agar: lipid profile test mein cholesterol zyada aaye\nEMERGENCY (FORI JAYEIN): Seene par achanak shadeed bojh, baen baazu mein dard, paseenay ya behoshi.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "hyperlipidemia",
      "cholesterol",
      "high cholesterol",
      "کولیسٹرول",
      "chiknai",
      "charbi",
      "triglycerides",
      "lipid profile",
      "khoon me chiknai",
      "heart health"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Prevention of cardiovascular disease: lipid management",
      "url": "https://www.who.int/cardiovascular_diseases/guidelines",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "gout-uric-acid",
    "topic": "gout",
    "title": {
      "en": "Gout & high uric acid (naqras) — joint flare relief and dietary triggers",
      "ur": "یورک ایسڈ اور جوڑوں کا درد (نقرس) — گھریلو تدابیر، پرہیز اور علاج",
      "roman": "Gout (uric acid) aur joron ka dard — gharelu tadbeer aur parhez"
    },
    "content": {
      "en": "• Gout causes sudden, excruciating joint pain, redness, and swelling — most commonly in the big toe, ankle, or knee\n• Avoid high-purine dietary triggers: red meat (beef, mutton), organ meats (liver, kidneys), spinach, seafood, and sugary sodas\n• Drink 10–12 glasses of water daily to help kidneys flush excess uric acid; eat low-fat dairy and cherries\n• During an acute flare: rest and elevate the affected joint; apply cold ice packs wrapped in a towel for 15 minutes\nSEE A DOCTOR IF: You have repeated painful joint attacks or blood tests show persistent high serum uric acid.\nEMERGENCY / GO IMMEDIATELY: Joint pain accompanied by high fever, shaking chills, and warm redness extending up the limb (must rule out septic joint infection).",
      "ur": "• یورک ایسڈ بڑھنے سے پیر کے انگوٹھے یا جوڑوں میں اچانک شدید درد، سرخی اور سوجن ہو جاتی ہے جسے نقرس کہتے ہیں\n• زیادہ پیورین والی غذاؤں سے پرہیز کریں: بڑا گوشت (بیف، مٹن)، کلیجی، مغز، پالک، اور میٹھی کولڈ ڈرنکس\n• روزانہ 10-12 گلاس پانی پئیں تاکہ گردے اضافی یورک ایسڈ کو خارج کر سکیں\n• درد کے دوران جوڑ کو آرام دیں اور برف کی ٹکور کریں\nڈاکٹر کو دکھائیں: جوڑوں میں بار بار درد اٹھے یا خون میں یورک ایسڈ زیادہ ہو\nایمرجنسی (فوراً جائیں): اگر جوڑ کے درد کے ساتھ تیز بخار اور کپکپی ہو (انفیکشن کا خطرہ)۔",
      "roman": "• Uric acid barhne se pao ke angoothay ya joron mein achanak shadeed dard aur soojan hoti hai\n• Barray gosht (beef, mutton), kaleji, paalak aur meethi drinks se parhez karein\n• Khoob paani piyein taake gurday uric acid nikaal sakein\n• Dard ke waqt jor par barf ki takore karein\nDOCTOR KO DIKHAYEIN agar: joron mein bar bar dard uthay\nEMERGENCY (FORI JAYEIN): Jor ke dard ke sath tez bukhar aur kapkapi ho.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "gout",
      "uric acid",
      "high uric acid",
      "یورک ایسڈ",
      "نقرس",
      "naqras",
      "angoothay ka dard",
      "big toe joint",
      "podagra",
      "joint swelling",
      "joint flare"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO / Pakistan MoNHSRC",
      "title": "Musculoskeletal and metabolic primary care clinical guidelines",
      "url": "https://www.nhsrc.gov.pk",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "fatty-liver",
    "topic": "fatty-liver",
    "title": {
      "en": "Fatty liver disease (NAFLD) — lifestyle reversal, diet and liver protection",
      "ur": "جگر پر چربی (فیٹی لیور) — غذائی پرہیز، وزن میں کمی اور دیکھ بھال",
      "roman": "Jigar par charbi (fatty liver) — ghizai parhez aur dekh bhaal"
    },
    "content": {
      "en": "• Non-alcoholic fatty liver disease (NAFLD) is the accumulation of excess fat in liver cells, closely linked to obesity and diabetes\n• Gradual weight loss (5–10% of body weight over 6 months) through calorie reduction is the most effective proven treatment\n• Eliminate refined sugars, sweetened beverages, fruit juices with added sugar, and deep-fried fast foods\n• Base your diet on vegetables, whole grains, pulses, healthy nuts, and moderate black coffee (which has liver-protective antioxidants)\nSEE A DOCTOR IF: Ultrasound or liver enzyme blood tests (ALT/AST) indicate fatty liver progression or hepatitis.\nEMERGENCY / GO IMMEDIATELY: Yellowing of skin and eyes (jaundice), swelling in both legs, accumulation of fluid in the abdomen (ascites), or mental confusion.",
      "ur": "• فیٹی لیور میں جگر کے خلیوں میں اضافی چربی جمع ہو جاتی ہے، جس کا تعلق موٹاپے، شوگر اور چکنائی سے ہے\n• وزن میں بتدریج 5-10 فیصد کمی اس کا سب سے بہترین اور آزمودہ علاج ہے\n• چینی، میٹھے شربت، کولڈ ڈرنکس اور تلی ہوئی چیزوں سے مکمل پرہیز کریں\n• سبزیاں، دالیں، اناج اور سلاد کا استعمال زیادہ کریں؛ کالی چائے/کافی بغیر چینی جگر کے لیے مفید ہے\nڈاکٹر کو دکھائیں: الٹراساؤنڈ یا جگر کے خون کے ٹیسٹ (ALT/AST) میں چربی یا خرابی آئے\nایمرجنسی (فوراً جائیں): آنکھیں یا جلد پیلی ہو جانا (یرقان)، پیٹ میں پانی بھرنا، ٹانگوں پر شدید سوجن، یا بےہوشی۔",
      "roman": "• Fatty liver jigar ke khaliyon mein charbi jama hone se hota hai\n• Wazan mein aahista aahista 5-10% kami iska sab se behtareen ilaaj hai\n• Cheeni, cold drinks aur tali hui cheezon se parhez karein\n• Sabziyan, daalein aur saaf paani zyada lein\nDOCTOR KO DIKHAYEIN agar: ultrasound mein fatty liver aaye\nEMERGENCY (FORI JAYEIN): Pait mein paani parna, peeli aankhein ya behoshi.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "fatty liver",
      "jigar par charbi",
      "فیٹی لیور",
      "liver fat",
      "jigar ki charbi",
      "nafld",
      "liver enzymes",
      "alt ast",
      "hepatic steatosis"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Prevention and control of noncommunicable diseases and liver health",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "angina-heart-disease",
    "topic": "angina",
    "title": {
      "en": "Angina & ischemic heart disease — recognizing chest pain and emergency protocol",
      "ur": "انجائنا اور دل کی شریانوں کی تنگی — علامات، ادویات اور ہنگامی اقدامات",
      "roman": "Angina (dil ki takleef) — seene ka dard, asbaab aur emergency protocol"
    },
    "content": {
      "en": "• Stable angina is chest discomfort (tightness, heaviness, squeezing) caused by temporary reduced blood flow to heart muscle during exertion or stress\n• Rest immediately when pain starts; angina typically eases within 3–5 minutes of resting or taking prescribed sublingual nitroglycerin\n• Manage underlying risk factors: strictly control blood pressure, blood sugar, cholesterol, avoid smoking, and reduce emotional stress\n• Never ignore changes in your usual angina pattern\nSEE A CARDIOLOGIST: For regular assessment, ECG checkups, and adjustment of preventive heart medications.\nEMERGENCY / GO IMMEDIATELY: Chest pain that occurs at rest, lasts >10 minutes, does not improve with rest/nitroglycerin, or spreads to jaw, neck, left arm with sweating and nausea (Heart Attack).\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• انجائنا دل کی شریانوں میں خون کی روانی کم ہونے سے ہوتا ہے، جس میں چلنے یا بوجھ اٹھانے پر سینے پر دباؤ اور درد ہوتا ہے\n• درد شروع ہوتے ہی فوراً بیٹھ جائیں اور آرام کریں؛ آرام کرنے یا زبان کے نیچے گولی رکھنے سے درد 3-5 منٹ میں ٹھیک ہو جاتا ہے\n• بلڈ پریشر، شوگر اور کولیسٹرول کو قابو میں رکھیں اور سگریٹ نوشی بالکل ترک کریں\n• ڈاکٹر کی تجویز کردہ دل کی ادویات باقاعدگی سے لیں\nڈاکٹر کو دکھائیں: دل کے معائنے اور ای سی جی (ECG) کے لیے باقاعدگی سے چیک اپ کروائیں\nایمرجنسی (فوراً جائیں): اگر سینے کا درد آرام کرنے کے باوجود 10 منٹ سے زیادہ رہے، بائیں بازو یا جبڑے میں پھیلے، اور ساتھ ٹھنڈے پسینے اور سانس میں تنگی ہو (ہارٹ اٹیک)۔",
      "roman": "• Angina mein chalne ya exertion par seene mein dabao aur dard mehsoos hota hai\n• Dard shuru hote hi aaraam se baith jayein aur prescribed goli zaban ke neechay rakhein\n• BP, sugar aur cholesterol control rakhein\nDOCTOR KO DIKHAYEIN: Dil ke regular checkup aur ECG ke liye\nEMERGENCY (FORI JAYEIN): Agar seene ka dard 10 minute se zyada rahe, baen baazu ya jabray mein jaye, aur paseenay aayein (Heart Attack)."
    },
    "tags": [
      "angina",
      "angina pectoris",
      "heart pain",
      "انجائنا",
      "dil ki bimari",
      "ischemic heart disease",
      "chest heaviness",
      "coronary artery",
      "sublingual",
      "nitroglycerin"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Prevention and management of ischemic heart disease",
      "url": "https://www.who.int/cardiovascular_diseases/guidelines",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "migraine-headache",
    "topic": "migraine",
    "title": {
      "en": "Migraine & one-sided headaches — trigger management and dark room care",
      "ur": "آدھے سر کا درد (مائیگرین) — وجوہات، گھریلو دیکھ بھال اور علامات",
      "roman": "Aadha sar dard (migraine) — asbaab, dekh bhaal aur bachao"
    },
    "content": {
      "en": "• Migraine causes moderate-to-severe throbbing pain, typically on one side of the head, worsened by movement, light, and sound\n• Rest in a quiet, dark room at the earliest onset of symptoms; place a cool damp cloth or ice pack on forehead or temples\n• Identify individual triggers: skipped meals, irregular sleep, dehydration, stress, bright screens, and strong artificial scents\n• Stay well hydrated and maintain consistent sleep and eating schedules\nSEE A DOCTOR IF: Migraine attacks occur more than 2–3 times a month, interfere with work, or do not respond to over-the-counter pain relievers.\nEMERGENCY / GO IMMEDIATELY: Sudden \"thunderclap\" headache reaching maximum agonizing intensity in seconds, fever with stiff neck, vision loss, or arm/leg weakness.",
      "ur": "• مائیگرین میں سر کے ایک طرف شدید کسک والا درد ہوتا ہے جو روشنی، شور اور حرکت سے بڑھتا ہے\n• درد شروع ہوتے ہی پرسکون، اندھیرے کمرے میں لیٹ جائیں اور پیشانی پر ٹھنڈے کپڑے یا برف کی ٹکور کریں\n• وجوہات سے بچیں: بھوکا رہنا، نیند کی کمی، ذہنی دباؤ، تیز روشنی اور خوشبوئیں مائیگرین کو متحرک کرتی ہیں\n• پانی مناسب مقدار میں پئیں اور وقت پر کھانا کھائیں\nڈاکٹر کو دکھائیں: سر درد مہینے میں 2-3 بار سے زیادہ ہو یا عام درد کی دوا سے آرام نہ آئے\nایمرجنسی (فوراً جائیں): اچانک شدید دھماکے جیسا سر درد جو چند سیکنڈ میں شدت پر پہنچ جائے، گردن کی سختی، یا جسم کے ایک حصے میں کمزوری۔",
      "roman": "• Migraine mein adhe sar mein shadeed dard hota hai jo roshni aur aawaz se barhta hai\n• Andheray pur-sukoon kamray mein aaraam karein aur peshani par thandi patti rakhein\n• Neend poori karein, waqt par khana khayein aur zehni dabao kam karein\nDOCTOR KO DIKHAYEIN agar: mahine mein 2-3 baar se zyada sar dard ho\nEMERGENCY (FORI JAYEIN): Achanak intehai shadeed sar dard, gardan sakht hona ya jism ka sunn hona.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "migraine",
      "adhe sar ka dard",
      "مائیگرین",
      "aadha sar dard",
      "adhkapaari",
      "half head pain",
      "throbbing headache",
      "one sided headache",
      "light sensitivity"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Headache disorders fact sheet — Migraine",
      "url": "https://www.who.int/news-room/fact-sheets/detail/headache-disorders",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "vertigo-dizziness",
    "topic": "vertigo",
    "title": {
      "en": "Vertigo & dizziness (chakkar) — vestibular care, safety and warning signs",
      "ur": "چکر آنا اور سر گھومنا (ورٹائگو) — گھریلو احتیاط اور خطرے کی علامات",
      "roman": "Chakkar aana aur sar ghoomna (vertigo) — hifazat aur alamaat"
    },
    "content": {
      "en": "• Vertigo creates a false sensation that you or your surroundings are spinning, tilting, or rocking, often due to inner ear issues (BPPV)\n• Sit or lie down immediately during spinning episodes to prevent falls; avoid sudden head turns and keep eyes fixed on a stationary object\n• Move slowly when getting out of bed: sit upright for 1 minute before standing up; ensure rooms are well lit\n• Stay hydrated with water and avoid caffeine, alcohol, and excess salt which can alter inner ear fluid pressure\nSEE A DOCTOR IF: Episodes recur frequently, cause ringing in ears (tinnitus), hearing loss, or nausea.\nEMERGENCY / GO IMMEDIATELY: Vertigo accompanied by double vision, slurred speech, facial drooping, numbness/weakness in arms or legs, or severe headache (must rule out stroke).",
      "ur": "• ورٹائگو میں ایسا محسوس ہوتا ہے جیسے پورا کمرہ یا انسان خود گول گھوم رہا ہے، جو اکثر اندرونی کان کی خرابی سے ہوتا ہے\n• چکر آتے ہی فوراً بیٹھ یا لیٹ جائیں تاکہ گرنے اور چوٹ لگنے سے بچا جا سکے؛ سر کو اچانک نہ جھٹکیں\n• بستر سے اٹھتے وقت جلدی نہ کریں: پہلے ایک منٹ بیٹھیں پھر کھڑے ہوں\n• پانی مناسب مقدار میں پئیں اور زیادہ نمک اور کیفین سے پرہیز کریں\nڈاکٹر کو دکھائیں: چکر بار بار آئیں، کان میں گھنٹیاں بجیں (tinnitus) یا سننے میں کمی ہو\nایمرجنسی (فوراً جائیں): چکر کے ساتھ دوہرا دکھائی دینا، بولنے میں لڑکھڑاہٹ، چہرے یا بازو کا سن ہونا، یا شدید سر درد (فالج کا خطرہ)۔",
      "roman": "• Vertigo mein aisa lagta hai jaise sab kuch ghoom raha hai\n• Chakkar aate hi baith ya lait jayein taake girnay se bachein\n• Achanak jhatkay se na uthein, pehle baith kar sahara lein\n• Paani khoob piyein\nDOCTOR KO DIKHAYEIN agar: chakkar bar bar aayein ya kaan mein aawazein aayein\nEMERGENCY (FORI JAYEIN): Chakkar ke sath zuban ladkharana, dhundla dekhna ya aadha jism kamzor hona.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "vertigo",
      "dizziness",
      "chakkar",
      "چکر",
      "chakkar aana",
      "sar ghoomna",
      "spinning sensation",
      "balance loss",
      "inner ear",
      "lightheadedness"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Neurological disorders and vestibular balance management",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "insomnia-sleep-hygiene",
    "topic": "insomnia",
    "title": {
      "en": "Insomnia & sleep trouble — sleep hygiene practices and relaxation steps",
      "ur": "بے خوابی اور نیند نہ آنا (Insomnia) — نیند کے اصول اور گھریلو تدابیر",
      "roman": "Neend na aana (insomnia) — pur-sukoon neend ke asool aur ilaaj"
    },
    "content": {
      "en": "• Maintain a fixed sleep schedule: go to bed and wake up at the same time every day, including weekends\n• Keep your bedroom quiet, dark, and comfortably cool; avoid watching TV or working in bed\n• Stop screen use (smartphones, tablets, laptops) at least 1 hour before bedtime — blue light suppresses melatonin sleep hormone\n• Avoid tea, coffee, energy drinks, and heavy meals within 4–6 hours of bedtime; take a warm bath or practice deep breathing\nSEE A DOCTOR IF: Sleeplessness lasts >3–4 weeks and severely impairs daytime energy, concentration, or mood.\nEMERGENCY / GO IMMEDIATELY: Severe insomnia accompanied by severe depression, hallucinations, extreme panic attacks, or thoughts of self-harm.",
      "ur": "• سونے اور جاگنے کا ایک مستقل وقت مقرر کریں، چاہے چھٹی کا دن ہی کیوں نہ ہو\n• سونے سے کم از کم ایک گھنٹہ پہلے موبائل، لیپ ٹاپ اور ٹی وی بند کر دیں کیونکہ نیلی روشنی نیند کے ہارمون کو روکتی ہے\n• شام کے بعد چائے، کافی اور کولڈ ڈرنکس سے پرہیز کریں اور رات کو ہلکی غذا کھائیں\n• سونے سے پہلے گہرے سانس کی مشق کریں یا پاؤں دھو کر بستر پر جائیں\nڈاکٹر کو دکھائیں: نیند نہ آنے کا مسئلہ ایک مہینے سے زیادہ رہے اور روزمرہ زندگی متاثر ہو\nایمرجنسی (فوراً جائیں): شدید مایوسی، وہم، یا خود کو نقصان پہنچانے کے خیالات آنا۔",
      "roman": "• Rozana aik hi waqt par sone aur uthne ki aadat banayein\n• Sone se 1 ghanta pehle mobile screen band kar dein\n• Shaam ke baad chai, coffee aur heavy khaney se parhez karein\n• Kamray mein andhera aur khamoshi rakhein\nDOCTOR KO DIKHAYEIN agar: neend na aane ka masla 3-4 hafte se zyada rahe\nEMERGENCY (FORI JAYEIN): Shadeed mayoosi ya zehni dabao.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "insomnia",
      "sleeplessness",
      "neend na aana",
      "بے خوابی",
      "neend ki kami",
      "sleep hygiene",
      "cant sleep",
      "sleep trouble",
      "poor sleep"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Mental health and sleep hygiene guidelines",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "panic-attack-anxiety",
    "topic": "panic-attack",
    "title": {
      "en": "Panic attacks & acute anxiety — grounding techniques and breathing control",
      "ur": "گھبراہٹ اور شدید پریشانی (پینک اٹیک) — فوری پرسکون تدابیر اور سانس پر قابو",
      "roman": "Ghabrahat aur panic attack — fori saans par qabu aur pur-sukoon tareeqay"
    },
    "content": {
      "en": "• A panic attack causes sudden intense fear, racing heart (palpitations), shortness of breath, trembling, and a feeling of impending doom\n• Practice box breathing: inhale slowly through nose for 4 counts, hold for 4, exhale through mouth for 4, hold for 4 — repeat 5 times\n• Use the 5-4-3-2-1 grounding technique: name 5 things you see, 4 things you feel, 3 things you hear, 2 things you smell, 1 thing you taste\n• Remind yourself: \"This feeling is intense, but it will pass in a few minutes and is not physically dangerous\"\nSEE A DOCTOR IF: Panic attacks occur repeatedly or cause chronic fear of leaving home (agoraphobia).\nEMERGENCY / GO IMMEDIATELY: First-time severe chest tightness or breathlessness in a person with cardiac risk factors (must rule out heart attack).",
      "ur": "• پینک اٹیک میں اچانک شدید گھبراہٹ، دل کی دھڑکن تیز ہونا، سانس پھولنا، اور خوف کا احساس ہوتا ہے\n• گہرے سانس لیں (Box Breathing): 4 سیکنڈ ناک سے سانس اندر کھینچیں، 4 سیکنڈ روکیں، 4 سیکنڈ منہ سے نکالیں\n• 5-4-3-2-1 طریقہ استعمال کریں: اپنے اردگرد 5 چیزیں دیکھیں، 4 کو چھوئیں، 3 کو سنیں، 2 کو سونگھیں\n• خود کو یاد دلائیں: \"یہ گھبراہٹ چند منٹ میں گزر جائے گی اور جان لیوا نہیں ہے\"\nڈاکٹر کو دکھائیں: گھبراہٹ کے دورے بار بار پڑیں اور معمولاتِ زندگی متاثر ہوں\nایمرجنسی (فوراً جائیں): سینے میں شدید دباؤ یا درد اگر پہلی بار ہو اور دل کے مریضوں میں ہو (ہارٹ اٹیک کا خطرہ)۔",
      "roman": "• Panic attack mein achanak dil tez dharakta hai, saans phoolti hai aur shadeed bechaini hoti hai\n• Aahista aahista gehre saans lein aur munh se hawa bahir nikalein\n• Apne dhyan ko kisi cheez par markooz karein aur paani ke ghoont piyein\n• Khud ko tasalli dein ke yeh waqti hai aur theek ho jaye ga\nDOCTOR KO DIKHAYEIN agar: ghabrahat ke doray bar bar aayein\nEMERGENCY (FORI JAYEIN): Seene mein shadeed dard ya saans band hona.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "panic attack",
      "anxiety attack",
      "ghabrahat",
      "گھبراہٹ",
      "bechaini",
      "dil ghabrana",
      "dil ki dharkan tez",
      "palpitations",
      "breathless anxiety",
      "rapid heartbeat",
      "panic-disorder",
      "panic disorder"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Mental health and anxiety disorders clinical guidance",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "jaundice-general",
    "topic": "jaundice",
    "title": {
      "en": "Jaundice & hepatitis signs (yarqan) — causes, rest and urgent medical testing",
      "ur": "یرقان اور پیلیا (Jaundice) — اسباب، احتیاط، آرام اور لیبارٹری ٹیسٹ",
      "roman": "Yarqan aur peeliya (jaundice) — asbaab, aaraam aur zaroori test"
    },
    "content": {
      "en": "• Jaundice causes yellowing of the sclera (white of eyes) and skin, dark tea-colored urine, and pale clay-colored stools\n• Rest completely; avoid heavy fatty foods, alcohol, and unverified herbal medicines or powders which can cause acute liver toxicity\n• Drink plenty of clean boiled water, fresh fruit juices, and sugarcane juice prepared hygienically with clean water\n• Get urgent blood tests: Liver Function Tests (LFTs), Viral Hepatitis Serology (Hepatitis A, B, C, E)\nSEE A DOCTOR SAME DAY: To confirm the underlying cause (viral hepatitis, biliary blockage, or hemolysis) and get medical management.\nEMERGENCY / GO IMMEDIATELY: Severe abdominal swelling, confusion, extreme drowsiness / altered mental state (hepatic encephalopathy), or vomiting blood.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• یرقان میں آنکھیں اور جلد پیلی ہو جاتی ہیں، پیشاب سرسوں کے تیل جیسا گہرا آتا ہے اور پاخانہ سفید یا مٹی کے رنگ کا ہو جاتا ہے\n• مکمل آرام کریں؛ چکنائی والی غذاؤں اور نام نہاد غیر تصدیق شدہ دیسی پڑیوں سے سخت پرہیز کریں جو جگر کو مزید تباہ کرتی ہیں\n• ابلا ہوا صاف پانی، تازہ گنے کا رس (صاف جگہ سے) اور پھلوں کے جوس پئیں\n• خون کے ٹیسٹ کروائیں: ایل ایف ٹی (LFTs) اور ہیپاٹائٹس اسکریننگ (A, B, C, E)\nڈاکٹر کو دکھائیں: اسی دن ڈاکٹر سے معائنہ کروائیں تاکہ جگر کی بیماری کا بروقت علاج ہو سکے\nایمرجنسی (فوراً جائیں): پیٹ میں شدید سوجن یا پانی پڑنا، مریض کا بے ربط بولنا یا ہوش کھونا (جگر کی شدید خرابی)، یا خون کی الٹی آنا۔",
      "roman": "• Yarqan mein aankhein aur jild peeli hoti hain aur peshab gehra peela aata hai\n• Mukammal aaraam karein aur tali hui cheezon se parhez karein\n• Saaf ubla hua paani aur taza juice piyein\n• LFTs aur Hepatitis test karwayein\nDOCTOR KO DIKHAYEIN: Usi din doctor ko dikhayein taake sahi ilaaj shuru ho sakay\nEMERGENCY (FORI JAYEIN): Pait phoolna, behoshi ya ulti mein khoon aana."
    },
    "tags": [
      "jaundice",
      "yarqan",
      "yerqan",
      "یرقان",
      "peeliya",
      "peelia",
      "peeli aankhein",
      "yellow eyes",
      "dark urine",
      "jaundice fever",
      "liver inflammation"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO / Pakistan MoNHSRC",
      "title": "Hepatitis and liver diseases clinical management",
      "url": "https://www.nhsrc.gov.pk",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "cholera-waterborne",
    "topic": "cholera",
    "title": {
      "en": "Cholera & acute watery diarrhea (haiza) — rapid rehydration protocol",
      "ur": "ہیضہ اور شدید پتلے دست (Cholera) — فوری او آر ایس اور جان بچانے والی تدابیر",
      "roman": "Haiza (cholera) aur shadeed dast — fori ORS aur paani ki bahaali"
    },
    "content": {
      "en": "• Cholera causes sudden, painless profuse watery diarrhea (\"rice-water stools\") with vomiting, causing lethal dehydration in hours\n• IMMEDIATELY START ORS: Drink a cup of Oral Rehydration Salts solution after every single loose motion; do not wait for dehydration\n• Continue breastfeeding infants; prepare ORS only with clean boiled water\n• Maintain strict hygiene: wash hands with soap after toilet and before eating; boil all drinking water\nSEE A HEALTH FACILITY SAME DAY: For clinical evaluation and zinc supplementation (in children).\nEMERGENCY / GO IMMEDIATELY: Sunken eyes, skin pinch takes >2 seconds to return, unable to drink, no urine for >6 hours, or extreme lethargy / coma (requires urgent IV fluids).\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• ہیضے میں چاول کے مانڈ جیسے پتلے دست اور الٹیاں آتی ہیں جن سے چند گھنٹوں میں جسم کا سارا پانی ختم ہو سکتا ہے\n• فوراً او آر ایس (ORS) شروع کریں: ہر دست کے بعد ایک گلاس او آر ایس کا گھونٹ گھونٹ کر کے پئیں\n• او آر ایس ہمیشہ ابلے ہوئے صاف پانی میں بنائیں اور ہاتھ صابن سے دھوئیں\n• بچوں کو ماں کا دودھ جاری رکھیں\nڈاکٹر کو دکھائیں: اُسی دن قریبی ہیلتھ سنٹر لے جائیں تاکہ بیماری قابو میں رہے\nایمرجنسی (فوراً جائیں): آنکھیں اندر دھنس جائیں، جلد سست واپس جائے، پیشاب بند ہو جائے، یا بچہ بےہوش ہونے لگے۔",
      "roman": "• Haiza mein achanak paani jaise dast aur ultiyan aati hain jis se dehydration ho sakti hai\n• Foran ORS shuru karein: har dast ke baad aik glass ORS piyein\n• Saaf ubla hua paani istemal karein aur haath dhoiyein\nDOCTOR KO DIKHAYEIN: Usi din clinic jayein\nEMERGENCY (FORI JAYEIN): Aankhein dhans jana, peshab na aana ya behoshi."
    },
    "tags": [
      "cholera",
      "haiza",
      "ہیضہ",
      "rice water stool",
      "shadeed dast",
      "acute watery diarrhea",
      "waterborne disease",
      "profuse diarrhea",
      "cholera outbreak"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO / UNICEF",
      "title": "Cholera outbreak response and clinical case management",
      "url": "https://www.who.int/news-room/fact-sheets/detail/cholera",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "chickenpox-varicella",
    "topic": "chickenpox",
    "title": {
      "en": "Chickenpox (lakra kakra) — itchy blister care and child isolation",
      "ur": "چیچک اور چھالے (لکڑا کاکڑا) — خارش کا علاج، گھریلو تدابیر اور خطرے کی علامات",
      "roman": "Lakra kakra (chickenpox) — kharish ka ilaaj aur dekh bhaal"
    },
    "content": {
      "en": "• Chickenpox causes an itchy red rash that turns into fluid-filled blisters, accompanied by fever and fatigue\n• Relieve itching: apply calamine lotion to blisters, take cool/lukewarm oatmeal baths, and keep fingernails cut short to avoid scratching\n• Give paracetamol for fever if advised by a pharmacist; NEVER GIVE ASPIRIN to children with chickenpox (risk of Reye’s syndrome)\n• Isolate the patient at home until all blisters have completely crusted over (usually 5–7 days after rash appears)\nSEE A DOCTOR IF: The rash spreads to eyes, blisters become infected (warm, red, draining yellow pus), or in pregnant women / infants.\nEMERGENCY / GO IMMEDIATELY: High persistent fever, severe breathing difficulty / persistent cough, extreme drowsiness, unsteady walking, or seizures.",
      "ur": "• لکڑا کاکڑا (چکن پاکس) میں جسم پر سرخ دانے بنتے ہیں جو پانی والے چھالوں میں تبدیل ہو جاتے ہیں اور شدید خارش ہوتی ہے\n• خارش میں آرام کے لیے کیلامائن لوشن (calamine lotion) لگائیں اور ناخن چھوٹے رکھیں تاکہ کھجانے سے زخم نہ بنیں\n• بخار کے لیے پیراسیٹامول دیں؛ چکن پاکس میں بچوں کو اسپرین (Aspirin) ہرگز نہ دیں (جان لیوا خطرہ)\n• مریض کو گھر پر الگ رکھیں جب تک تمام چھالے سوکھ کر کھرنڈ نہ بن جائیں (5-7 دن)\nڈاکٹر کو دکھائیں: دانے آنکھ کے اندر نکلیں، چھالوں میں پیپ پڑ جائے، یا حاملہ خواتین میں ہو\nایمرجنسی (فوراً جائیں): سانس لینے میں شدید دشواری، کھانسی، مسلسل تیز بخار، شدید غنودگی یا دورے پڑنا۔",
      "roman": "• Lakra kakra mein jism par paani walay danay bante hain aur kharish hoti hai\n• Calamine lotion lagayein aur naakhun chhotay rakhein\n• Bukhar ke liye paracetamol lein; bachon ko aspirin hargiz na dein\n• Mareez ko alag kamray mein rakhein jab tak danay sookh na jayein\nDOCTOR KO DIKHAYEIN agar: danay aankh mein hon ya un mein peep parh jaye\nEMERGENCY (FORI JAYEIN): Saans lene mein takleef, bukhar barhna ya doray parna.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "chickenpox",
      "chicken pox",
      "lakra kakra",
      "لکڑا کاکڑا",
      "چیچک",
      "cheechak",
      "choti mata",
      "water blisters",
      "itchy blisters",
      "varicella",
      "calamine"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "child",
    "source": {
      "publisher": "WHO",
      "title": "Varicella and herpes zoster vaccines WHO position paper",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "rabies-prevention",
    "topic": "rabies",
    "title": {
      "en": "Rabies & animal bites (bawla kutta) — immediate wound washing and PEP vaccine",
      "ur": "باؤلے کتے کا کاٹنا اور ریبیز — زخم کی فوری دھلائی اور ویکسین کا شیڈول",
      "roman": "Kutte ka katna aur rabies — fori sabun se dhona aur anti-rabies vaccine"
    },
    "content": {
      "en": "• Rabies is 100% FATAL once symptoms develop, but 100% PREVENTABLE with immediate post-exposure treatment\n• STEP 1 (IMMEDIATE): Wash the bite/scratch wound thoroughly with soap and running water for at least 15 continuous minutes\n• STEP 2: Apply antiseptic (povidone iodine or 70% alcohol); do NOT apply chilies, oils, leaves, or bandage the wound tightly\n• STEP 3 (GO IMMEDIATELY): Go to the nearest anti-rabies vaccination center / hospital for Post-Exposure Prophylaxis (PEP vaccine + Rabies Immunoglobulin for deep wounds)\nEMERGENCY / GO IMMEDIATELY: Every dog, cat, monkey, or bat bite/scratch requires immediate medical evaluation — rabies PEP must begin on Day 0 without delay.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• ریبیز ایک جان لیوا بیماری ہے جس کی علامات ظاہر ہونے کے بعد کوئی علاج نہیں، لیکن کاٹنے کے فوراً بعد ویکسین سے 100 فیصد بچاؤ ممکن ہے\n• پہلا قدم (فوری): کاٹنے والی جگہ کو بہتے ہوئے پانی اور صابن سے کم از کم 15 منٹ تک مسلسل اچھی طرح دھوئیں\n• دوسرا قدم: پائیوڈین یا اینٹی سیپٹک لگائیں؛ مرچیں، پتے، تیل یا چونہ ہرگز نہ لگائیں اور زخم کو ٹانکے یا پٹی سے بند نہ کریں\n• تیسرا قدم (فوراً جائیں): قریبی اینٹی ریبیز ویکسین سنٹر / سرکاری ہسپتال جا کر پہلے دن (Day 0) کی ویکسین لگوائیں\nایمرجنسی (فوراً جائیں): کتے، بلی یا کسی بھی جانور کے کاٹنے پر فوراً ہسپتال جائیں — ویکسین میں تاخیر جان لیوا ہو سکتی ہے۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• Rabies kutte ke kaatne se phailti hai jo jan leva hai, lekin fori vaccine se mukammal bachao mumkin hai\n• Pehla kaam (FORAN): Zakhm ko saaf behate paani aur sabun se 15 minute tak khoob dhoiyein\n• Pyodine lagayein; mirch ya patti na bandhein\n• Fori qareeb tareen hospital ja kar anti-rabies vaccine lagwayein\nEMERGENCY (FORI JAYEIN): Janwar ke kaatne par bina taakheer usi din hospital jayein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "rabies",
      "kutte ka katna",
      "باؤلا کتا",
      "bawla kutta",
      "dog bite",
      "anti rabies",
      "rabies vaccine",
      "animal bite",
      "pep vaccine",
      "cat bite",
      "hydrophobia"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": {
      "publisher": "WHO / Pakistan MoNHSRC",
      "title": "Rabies vaccines and post-exposure prophylaxis guidance",
      "url": "https://www.who.int/news-room/fact-sheets/detail/rabies",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "knee-osteoarthritis",
    "topic": "osteoarthritis",
    "title": {
      "en": "Knee osteoarthritis & joint pain (ghutno ka dard) — joint care and exercises",
      "ur": "گھٹنوں اور جوڑوں کا درد (Osteoarthritis) — دیکھ بھال، ورزش اور احتیاط",
      "roman": "Ghutno ka dard (knee osteoarthritis) — dekh bhaal, warzish aur parhez"
    },
    "content": {
      "en": "• Osteoarthritis is the gradual wear-and-tear of joint cartilage, causing pain, stiffness, and cracking sounds in knees during movement\n• Maintain a healthy body weight: every 1 kg weight loss relieves ~4 kg of pressure on your knee joints\n• Perform low-impact strengthening exercises: quadriceps leg raises, stationary cycling, and swimming; avoid deep squatting and cross-legged floor sitting\n• Apply warm compresses before exercise for stiffness, and cold packs after activity if swelling occurs\nSEE A DOCTOR IF: Knee pain limits walking, causes persistent nocturnal pain, or does not improve with simple paracetamol.\nEMERGENCY / GO IMMEDIATELY: Sudden severe joint swelling with heat, intense redness, inability to bear any weight, accompanied by high fever.",
      "ur": "• گھٹنوں کا گھسنا (آرتھرائٹس) عمر کے ساتھ جوڑوں کی گدی ختم ہونے سے ہوتا ہے، جس سے چلنے اور نماز میں درد اور سوجن ہوتی ہے\n• وزن کم کریں: جسم کے وزن میں کمی سے گھٹنوں پر بوجھ کئی گنا کم ہو جاتا ہے\n• زمین پر آلتی پالتی مار کر بیٹھنے اور اڑوں کڑوں بیٹھنے سے پرہیز کریں؛ کرسی پر نماز پڑھیں\n• گھٹنے کے پٹھوں کی ہلکی ورزشیں کریں اور نیم گرم پانی کی ٹکور کریں\nڈاکٹر کو دکھائیں: گھٹنے کے درد کی وجہ سے چلنا پھرنا مشکل ہو جائے یا رات کو درد جاگنے پر مجبور کرے\nایمرجنسی (فوراً جائیں): گھٹنے پر اچانک شدید سوجن، گرمی، سرخی اور ساتھ تیز بخار ہو (انفیکشن کا خطرہ)۔",
      "roman": "• Ghutno ka dard joron ki gaddi ghisne se hota hai jo chalne aur charhne mein takleef deta hai\n• Wazan kam karein aur zameen par baithne se parhez karein; kursi par namaz parhein\n• Pathon ki halki warzish karein aur garam paani se saik karein\nDOCTOR KO DIKHAYEIN agar: chalna phirna mushkil ho jaye\nEMERGENCY (FORI JAYEIN): Ghutnay par achanak shadeed soojan, laali aur tez bukhar ho.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "osteoarthritis",
      "knee oa",
      "knee-oa",
      "knee osteoarthritis",
      "نی اوسٹیوآرتھرائٹس",
      "ghutno ka dard",
      "گھٹنوں کا درد",
      "knee pain",
      "joron ka dard",
      "joint pain",
      "arthritis",
      "knee stiffness",
      "crepitus"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Musculoskeletal health and osteoarthritis management",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "neck-strain-pain",
    "topic": "neck-pain",
    "title": {
      "en": "Neck pain & cervical strain — posture correction and gentle stretches",
      "ur": "گردن میں درد اور کھچاؤ (سروائیکل) — درست انداز، ورزش اور احتیاط",
      "roman": "Gardan me dard aur khichao (neck strain) — posture aur dekh bhaal"
    },
    "content": {
      "en": "• Neck strain is commonly caused by prolonged looking down at smartphones (\"text neck\"), poor desk ergonomics, or sleeping on thick pillows\n• Maintain good posture: position computer screens and phones at eye level; avoid slumping forward\n• Apply a warm heating pad or warm towel to neck muscles for 15–20 minutes to relax tight spasms\n• Perform gentle neck stretches: slowly tilt head toward each shoulder, turn side-to-side, and gently tuck chin; take breaks every 45 minutes\nSEE A DOCTOR IF: Neck pain persists >1–2 weeks, radiates down your arm, or causes tingling/numbness in fingers.\nEMERGENCY / GO IMMEDIATELY: Neck pain following a high-speed vehicle crash or fall, accompanied by arm/leg paralysis, loss of bladder control, or severe fever with stiff neck.",
      "ur": "• گردن کا کھچاؤ موبائل کے زیادہ استعمال، کمپیوٹر پر غلط بیٹھنے یا موٹے تکیے پر سونے سے ہوتا ہے\n• موبائل اور اسکرین کو آنکھوں کے سامنے رکھیں تاکہ گردن جھکانی نہ پڑے\n• گرم کپڑے یا ہیٹنگ پیڈ سے گردن کے پٹھوں کی 15-20 منٹ ٹکور کریں\n• ہلکی ورزشیں کریں: گردن کو آہستہ آہستہ دائیں بائیں گھمائیں اور کندھوں کو ڈھیلا چھوڑیں\nڈاکٹر کو دکھائیں: درد ایک ہفتے سے زیادہ رہے یا درد بازو اور انگلیوں میں سن پن لائے\nایمرجنسی (فوراً جائیں): کسی حادثے یا گرنے کے بعد گردن کا درد، بازوؤں میں فالج جیسا کمزوری، یا تیز بخار کے ساتھ گردن سخت ہو جانا۔",
      "roman": "• Mobile ke zyada istemal aur galat posture se gardan mein khichao hota hai\n• Screen ko aankhon ke samnay rakhein aur mota takiya istemal na karein\n• Garam kapray se gardan ki takore karein aur halki stretch karein\nDOCTOR KO DIKHAYEIN agar: dard baazu ya haath mein jaye ya sunn pan ho\nEMERGENCY (FORI JAYEIN): Haadsa ke baad gardan dard ya baazuon mein kamzori.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "neck pain",
      "neck strain",
      "gardan me dard",
      "گردن کا درد",
      "gardan ka khichao",
      "cervical pain",
      "stiff neck",
      "text neck",
      "cervical spondylosis",
      "cervical-spondylosis"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Musculoskeletal disorders: neck and spinal strain guidance",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "sprain-strain-rice",
    "topic": "sprain",
    "title": {
      "en": "Sprains, strains & twisted ankle — R.I.C.E. protocol first aid",
      "ur": "موچ اور پٹھوں کا کھچاؤ — R.I.C.E ابتدائی طبی امداد اور بحالی",
      "roman": "Moch aur muscle strain — R.I.C.E first aid aur dekh bhaal"
    },
    "content": {
      "en": "• A sprain is a stretched or torn ligament (commonly ankle or wrist) causing pain, swelling, and bruising after a sudden twist\n• Follow the R.I.C.E. protocol immediately for the first 48 hours:\n  - REST: Stop activity and protect the injured joint\n  - ICE: Apply cold ice packs wrapped in a cloth for 15–20 minutes every 2–3 hours (never apply ice directly to skin)\n  - COMPRESSION: Wrap with an elastic crepe bandage snugly (not too tight to cut circulation)\n  - ELEVATION: Keep the injured limb propped up on pillows above heart level to drain swelling\nSEE A DOCTOR IF: Severe swelling/bruising occurs or you cannot bear any weight on the foot after 2–3 days.\nEMERGENCY / GO IMMEDIATELY: Obvious bone deformity, inability to feel toes/fingers, or severe agonizing pain indicating a bone fracture.",
      "ur": "• پاؤں مڑنے یا جھٹکے سے جوڑ کی موچ میں سوجن، نیلاہٹ اور درد ہو جاتا ہے\n• پہلے 48 گھنٹے R.I.C.E اصول پر عمل کریں:\n  - REST (آرام): پاؤں پر بوجھ نہ ڈالیں\n  - ICE (برف): کپڑے میں لپٹی برف سے دن میں 3-4 بار 15-20 منٹ ٹکور کریں\n  - COMPRESSION (پٹی): کریپ بینڈیج (crepe bandage) مناسب طریقے سے لپیٹیں\n  - ELEVATION (اونچائی): پاؤں کو تکیے پر اونچا رکھیں تاکہ سوجن اترے\nڈاکٹر کو دکھائیں: 2-3 دن بعد بھی پاؤں پر وزن ڈالنا ناممکن ہو یا سوجن بہت زیادہ ہو\nایمرجنسی (فوراً جائیں): اگر ہڈی ٹیڑھی نظر آئے یا انگلیاں سن ہو جائیں (فریکچر کا شبہ)۔",
      "roman": "• Paon murnay se moch aur sujan ho jati hai\n• Pehle 2 din R.I.C.E tareeqa apnayein:\n  - REST: Paon par zor na dalein\n  - ICE: Barf ki patti se 15 minute takore karein\n  - COMPRESSION: Crepe bandage baandhein\n  - ELEVATION: Paon takiye par oopar rakhein\nDOCTOR KO DIKHAYEIN agar: 2 din baad bhi paon par khara na hua jaye\nEMERGENCY (FORI JAYEIN): Haddi teerhi nazar aaye ya behoshi ho.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "sprain",
      "strain",
      "moch",
      "موچ",
      "moch aana",
      "twisted ankle",
      "ligament injury",
      "crepe bandage",
      "rice protocol",
      "ankle swelling",
      "swollen ankle"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "IFRC / WHO",
      "title": "First aid guidelines for soft tissue injuries, sprains and strains",
      "url": "https://www.ifrc.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "eczema-dermatitis",
    "topic": "eczema",
    "title": {
      "en": "Eczema & atopic dermatitis (chambal) — skin barrier hydration and itch control",
      "ur": "چمبل اور ایگزیما (Eczema) — جلد کی نمی، خارش کا علاج اور احتیاط",
      "roman": "Chambal aur eczema — jild ki nami, kharish aur dekh bhaal"
    },
    "content": {
      "en": "• Eczema causes dry, red, intensely itchy skin patches, commonly in elbow creases, behind knees, and on hands/face\n• Moisturize generously: apply thick plain petroleum jelly or fragrance-free emollient cream within 3 minutes after bathing to lock in moisture\n• Take short lukewarm baths (5–10 minutes); avoid harsh scented soaps, detergents, wool clothes, and chemical cleansers\n• Keep fingernails trimmed and wear soft breathable cotton clothing\nSEE A DOCTOR IF: Skin flares do not improve with daily moisturizers or itch severely disrupts sleep.\nEMERGENCY / GO IMMEDIATELY: Skin develops spreading golden crusts, oozing yellow pus, painful blisters, or fever (signs of secondary bacterial/viral infection requiring medical antibiotics).",
      "ur": "• چمبل (ایگزیما) میں جلد خشک، سرخ اور شدید خارش والی ہو جاتی ہے، خاص طور پر کہنیوں، گھٹنوں کے پیچھے اور چہرے پر\n• جلد کی نمی بحال رکھیں: نہانے کے فوراً بعد ویزلین یا بغیر خوشبو والی کولڈ کریم لگائیں\n• نیم گرم پانی سے نہائیں اور خوشبودار صابن، سرف اور کیمیکل والی مصنوعات سے پرہیز کریں\n• نرم سوتی (cotton) کپڑے پہنیں اور ناخن چھوٹے رکھیں تاکہ کھجانے سے انفیکشن نہ ہو\nڈاکٹر کو دکھائیں: کریموں کے باوجود خارش ٹھیک نہ ہو یا نیند خراب ہو\nایمرجنسی (فوراً جائیں): اگر جلد پر پیلے کھرنڈ، پیپ والے دانے، چھالے بن جائیں یا بخار چڑھے (شدید انفیکشن)۔",
      "roman": "• Chambal mein jild khushk aur kharish wali ho jati hai\n• Nahanay ke baad foran vaseline ya moisturizing cream lagayein\n• Khushbodaar sabun aur surf se parhez karein aur narm cotton kapray pehnein\n• Naakhun chhotay rakhein\nDOCTOR KO DIKHAYEIN agar: kharish theek na ho\nEMERGENCY (FORI JAYEIN): Jild par peep wale danay banna ya bukhar aana.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "eczema",
      "chambal",
      "چمبل",
      "atopic dermatitis",
      "dry skin itch",
      "chambal ki bimari",
      "eczima",
      "skin rash",
      "emollient",
      "moisturizer"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Dermatological disorders and atopic eczema management",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "fungal-ringworm",
    "topic": "fungal-infection",
    "title": {
      "en": "Fungal skin infection & ringworm (daad) — hygiene and antifungal care",
      "ur": "داد اور فنگل انفیکشن (Ringworm) — صفائی، گھریلو تدابیر اور علاج",
      "roman": "Daad aur fungal infection (ringworm) — safai aur dekh bhaal"
    },
    "content": {
      "en": "• Fungal infections (ringworm/tinea) cause ring-shaped, raised red scaly itchy patches on groin (dhobi itch), feet (athlete’s foot), or body\n• Keep affected areas clean and completely dry; pat dry with a dedicated towel and do not share towels, clothes, or bedding\n• Wear loose, light, breathable cotton underwear and clothing; change socks and undergarments daily\n• Apply over-the-counter antifungal cream (clotrimazole, terbinafine) as directed by a pharmacist, continuing for 1–2 weeks after rash clears\nSEE A DOCTOR IF: Fungal rash spreads extensively, affects the scalp/beard with hair loss, or does not improve after 2 weeks of topical treatment.\nEMERGENCY / GO IMMEDIATELY: Severe secondary bacterial infection with rapidly spreading redness, intense pain, red streaks on skin, or high fever.",
      "ur": "• داد اور فنگس میں جلد پر گول دائرے دار، سرخی مائل اور خارش والے دانے بنتے ہیں جو بغلوں، رانوں اور پاؤں کی انگلیوں میں زیادہ ہوتے ہیں\n• متاثرہ جگہ کو دھو کر بالکل خشک رکھیں اور اپنا تولیہ اور کپڑے دوسروں سے الگ رکھیں\n• ڈھیلے اور سوتی کپڑے پہنیں اور پسینے والے گیلے کپڑے فوراً بدلیں\n• فارماسسٹ کے مشورے سے اینٹی فنگل کریم (Clotrimazole) لگائیں اور دانے ٹھیک ہونے کے بعد بھی ایک ہفتہ جاری رکھیں\nڈاکٹر کو دکھائیں: داد 2 ہفتے میں ٹھیک نہ ہو، سر کے بالوں میں ہو جہاں بال جھڑ رہے ہوں، یا ناخنوں میں ہو\nایمرجنسی (فوراً جائیں): اگر دانے پر شدید سوجن، سرخ دھاریاں اور تیز بخار ہو جائے۔",
      "roman": "• Daad mein jild par gol dairey dar kharish wale nishan bante hain\n• Jagah ko saaf aur khushk rakhein aur apna tauliya alag rakhein\n• Dheelay cotton kapray pehnein\n• Pharmacist ke mashwaray se antifungal cream lagayein\nDOCTOR KO DIKHAYEIN agar: 2 hafte mein aaram na aaye\nEMERGENCY (FORI JAYEIN): Zakhm mein shadeed peep aur bukhar aana.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "fungal infection",
      "ringworm",
      "daad",
      "داد",
      "chambal daad",
      "dhobi itch",
      "fungus",
      "skin fungus",
      "athletes foot",
      "tinea",
      "clotrimazole"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Superficial fungal infections and community dermatology",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "acne-vulgaris",
    "topic": "acne",
    "title": {
      "en": "Acne & facial pimples (keel muhasay) — gentle skincare and treatment steps",
      "ur": "کیل مہاسے اور چہرے کے دانے (Acne) — جلد کی صفائی، پرہیز اور علاج",
      "roman": "Keel muhasay aur chehre ke dane (acne) — safai, parhez aur ilaaj"
    },
    "content": {
      "en": "• Acne occurs when hair follicles are clogged by excess sebum oil and dead skin cells, leading to blackheads, whiteheads, and inflamed pimples\n• Wash face gently twice daily with mild soap/cleanser and lukewarm water; do NOT scrub harshly\n• NEVER squeeze, pick, or pop pimples — popping forces bacteria deeper, worsening inflammation and causing permanent scars\n• Use non-comedogenic (oil-free) face creams and sunscreens; avoid heavy greasy hair oils dripping onto forehead\nSEE A DOCTOR IF: Acne causes painful deep cysts/nodules, leaves dark pitted scars, or causes severe emotional distress.\nEMERGENCY / GO IMMEDIATELY: Rapidly spreading facial swelling, intense redness around eyes/cheeks, or fever accompanying severe inflamed cystic facial lesions.",
      "ur": "• چہرے کے دانے اور کیل مہاسے مساموں میں چکنائی اور مٹی جمع ہونے سے بنتے ہیں\n• دن میں 2 بار نیم گرم پانی اور ہلکے صابن سے چہرہ دھوئیں؛ رگڑ کر نہ دھوئیں\n• دانوں کو کبھی ہاتھ سے مت دبائیں اور نہ ہی پھوڑیں — اس سے چہرے پر گڑھے اور نشانات پڑ جاتے ہیں\n• آئل فری (oil-free) مصنوعات استعمال کریں اور بالوں کا تیل ماتھے پر نہ لگنے دیں\nڈاکٹر کو دکھائیں: چہرے پر موٹے گانٹھ نما دانے ہوں، نشان پڑ رہے ہوں، یا عام فیس واش سے فرق نہ پڑے\nایمرجنسی (فوراً جائیں): اگر چہرے پر اچانک شدید سوجن، آنکھوں کے گرد سرخی اور تیز بخار ہو۔",
      "roman": "• Chehre par keel muhasay chiknai aur mitti jama hone se bante hain\n• Din mein 2 baar narm sabun se chehra dhoiyein\n• Danon ko hargiz na nichorein aur na phorein kyunke nishan parh jate hain\n• Oil-free cream lagayein\nDOCTOR KO DIKHAYEIN agar: motay dard wale danay hon\nEMERGENCY (FORI JAYEIN): Chehre par achanak shadeed soojan aur bukhar.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "acne",
      "pimples",
      "keel muhasay",
      "کیل مہاسے",
      "chehre ke danay",
      "chehre par dane",
      "pimple",
      "blackheads",
      "whiteheads",
      "cystic acne"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Adolescent and primary skin health: acne vulgaris guidance",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "kidney-stones",
    "topic": "kidney-stones",
    "title": {
      "en": "Kidney stones (gurde ki pathri) — pain management, hydration and red flags",
      "ur": "گردے کی پتھری اور درد (Renal Stones) — پانی کی فراوانی، پرہیز اور علامات",
      "roman": "Gurde me pathri (kidney stones) — hydration, gharelu dekh bhaal aur alamaat"
    },
    "content": {
      "en": "• Kidney stones cause severe sharp cramping pain in the lower back/flank radiating to groin, accompanied by painful or pink urine\n• Drink 2.5 to 3 liters of water daily (unless restricted by a doctor) to help flush out small stones and prevent new crystal formation\n• Add fresh lemon juice to water — natural citrate helps dissolve and prevent calcium oxalate stones\n• Reduce dietary salt and excess animal protein; take pharmacist-approved paracetamol for pain relief\nSEE A DOCTOR IF: Flank pain recurs, or if you have blood in urine or past history of stones requiring ultrasound assessment.\nEMERGENCY / GO IMMEDIATELY: Inability to pass any urine (anuria), severe pain with intractable vomiting, or flank pain accompanied by high fever and chills (infected blocked kidney).",
      "ur": "• گردے کی پتھری میں کمر کے نچلے حصے یا پہلو میں شدید مروڑ والا درد ہوتا ہے جو پیٹ اور پیشاب کی نالی کی طرف جاتا ہے\n• روزانہ 10-12 گلاس (2.5 سے 3 لیٹر) پانی پئیں تاکہ چھوٹی پتھری پیشاب کے راستے خارج ہو سکے\n• پانی میں لیموں کا رس ملا کر پئیں — اس میں موجود سٹریٹ پتھری گھلانے میں مدد دیتا ہے\n• کھانے میں نمک کم کریں اور گوشت کا استعمال متوازن رکھیں\nڈاکٹر کو دکھائیں: کمر میں بار بار درد اٹھے، پیشاب میں خون آئے یا ٹیسٹ کی ضرورت ہو\nایمرجنسی (فوراً جائیں): پیشاب کا بالکل رک جانا، ناقابل برداشت درد کے ساتھ مسلسل الٹیاں، یا درد کے ساتھ تیز بخار اور کپکپی ہونا۔",
      "roman": "• Gurde ki pathri kamar aur pehloo mein shadeed dard peda karti hai jo paishab ki nali tak jata hai\n• Rozana 10-12 glass paani piyein taake pathri nikal sakay\n• Paani mein leemo nichor kar piyein aur namak kam karein\nDOCTOR KO DIKHAYEIN agar: pehloo mein dard bar bar uthay ya paishab mein khoon aaye\nEMERGENCY (FORI JAYEIN): Paishab bilkul band ho jaye ya dard ke sath tez bukhar aur kapkapi ho.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "kidney stones",
      "kidney stone",
      "gurde ki pathri",
      "گردے کی پتھری",
      "gurde me pathri",
      "gurdy me pathri",
      "renal stones",
      "flank pain",
      "renal colic",
      "urinary stones"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO / Pakistan MoNHSRC",
      "title": "Renal and urological primary care clinical guidelines",
      "url": "https://www.nhsrc.gov.pk",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "prostate-enlargement",
    "topic": "prostate",
    "title": {
      "en": "Enlarged prostate (BPH) — urinary symptoms, lifestyle adjustments and warnings",
      "ur": "پروسٹیٹ غدود کا بڑھنا (BPH) — پیشاب کے مسائل، پرہیز اور علامات",
      "roman": "Prostate gadood ka barhna (BPH) — peshab ke masail aur rehnumai"
    },
    "content": {
      "en": "• Benign Prostatic Hyperplasia (BPH) is an age-related non-cancerous prostate enlargement causing weak urinary stream and frequent night urination\n• Limit fluids 2 hours before bedtime to reduce nocturnal waking; avoid caffeine and alcohol which irritate the bladder\n• Practice double voiding: urinate, relax for a few seconds, and try to urinate again to empty the bladder completely\n• Stay physically active; avoid over-the-counter decongestants which can tighten the bladder neck\nSEE A DOCTOR IF: Urinary hesitation, weak stream, or frequent urination disrupts sleep and daily life.\nEMERGENCY / GO IMMEDIATELY: Complete inability to urinate (acute urinary retention with excruciating lower belly pain), high fever with burning urine, or passing visible blood clots.",
      "ur": "• عمر بڑھنے کے ساتھ پروسٹیٹ غدود بڑھ جاتا ہے جس سے پیشاب کی دھار کمزور ہو جاتی ہے اور رات کو بار بار اٹھنا پڑتا ہے\n• سونے سے 2 گھنٹے پہلے پانی اور چائے کم پئیں تاکہ رات کو بار بار پیشاب کے لیے نہ اٹھنا پڑے\n• پیشاب کرتے وقت زور نہ لگائیں اور اطمینان سے مثانہ خالی کریں\n• روزانہ ہلکی واک کریں اور ٹھنڈ سے بچیں\nڈاکٹر کو دکھائیں: پیشاب رک رک کر آئے، دھار کمزور ہو یا رات کو نیند خراب ہو\nایمرجنسی (فوراً جائیں): پیشاب کا اچانک بالکل بند ہو جانا اور پیٹ کے نچلے حصے میں شدید درد ہونا، یا پیشاب میں خون کے لوتھڑے آنا۔",
      "roman": "• Prostate gadood barhne se paishab ki dhaar kamzor hoti hai aur raat ko bar bar peshab aata hai\n• Sone se pehle paani kam piyein aur chai se parhez karein\n• Peshab karte waqt zor na lagayein\nDOCTOR KO DIKHAYEIN agar: paishab mein rukawat ho\nEMERGENCY (FORI JAYEIN): Peshab bilkul band ho jaye aur pait mein shadeed dard ho.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "prostate",
      "bph",
      "gadood",
      "پروسٹیٹ",
      "peshab me rukawat",
      "peshab ruk ruk kar",
      "enlarged prostate",
      "frequent urination",
      "weak stream",
      "nocturia"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Men’s health and benign prostatic conditions guidance",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "postpartum-care",
    "topic": "postpartum",
    "title": {
      "en": "Postpartum recovery & newborn mother care — healing and warning signs",
      "ur": "زچگی کے بعد ماں کی دیکھ بھال — صحت یابی، احتیاط اور خطرے کی علامات",
      "roman": "Wiladat ke baad maa ki dekh bhaal (postpartum) — sehat yaabi aur alamaat"
    },
    "content": {
      "en": "• Rest adequately, eat nutrient-rich warm meals with iron, calcium, protein, and plenty of fluids to support recovery and breastmilk production\n• Maintain perineal hygiene: wash gently with warm water from front to back after using the toilet and pat dry; change pads frequently\n• Lochia (normal vaginal bleeding/discharge) gradually changes from red to pink to yellowish-white over 4–6 weeks\n• Support mental wellness: talk openly about postpartum mood changes (\"baby blues\"); seek family support for infant care\nSEE A HEALTHCARE WORKER: Attend scheduled 6-week postnatal checkups for pelvic healing, blood count, and family planning counseling.\nEMERGENCY / GO IMMEDIATELY: Soaking >1 heavy sanitary pad per hour (postpartum hemorrhage), passing golf-ball sized blood clots, foul-smelling discharge, high fever with lower abdominal pain, severe headache with vision changes, or thoughts of harming yourself or baby.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• زچگی کے بعد مکمل آرام کریں، پروٹین اور آئرن والی غذائیں لیں اور دودھ کی فراوانی کے لیے پانی اور دودھ زیادہ پئیں\n• صفائی کا خاص خیال رکھیں: بیت الخلاء کے بعد نیم گرم پانی سے صفائی کریں اور پیڈز باقاعدگی سے تبدیل کریں\n• زچگی کے بعد خون کا اخراج (نفاس) 4-6 ہفتوں میں رفتہ رفتہ کم ہو کر ختم ہو جاتا ہے\n• ذہنی سکون کا خیال رکھیں اور ڈپریشن یا گھبراہٹ ہونے پر گھر والوں اور ڈاکٹر سے بات کریں\nڈاکٹر کو دکھائیں: زچگی کے 6 ہفتے بعد معمول کا فالو اپ چیک اپ ضرور کروائیں\nایمرجنسی (فوراً جائیں): ایک گھنٹے میں ایک سے زیادہ بڑا پیڈ خون سے بھر جانا، خون کے بڑے لوتھڑے آنا، بدبودار پانی، پیٹ کے نچلے حصے میں شدید درد کے ساتھ تیز بخار، یا شدید سر درد۔",
      "roman": "• Delivery ke baad aaraam karein, taaqatwar khana khayein aur paani khoob piyein\n• Safai ka khaas khayal rakhein aur pads waqt par badlein\n• Zehni dabao mehsoos ho to khandan se baat karein\nDOCTOR KO DIKHAYEIN: 6 hafte baad doctor se checkup karwayein\nEMERGENCY (FORI JAYEIN): 1 ghantay mein aik se zyada pad geela hona (shadeed khoon), badbodaar paani ya tez bukhar."
    },
    "tags": [
      "postpartum",
      "wiladat ke baad",
      "ولادت کے بعد",
      "zichgi",
      "delivery ke baad",
      "lochia",
      "after birth care",
      "postnatal",
      "maternal recovery",
      "postpartum bleeding"
    ],
    "baseLevel": "ROUTINE",
    "audience": "maternal",
    "source": {
      "publisher": "WHO / UNICEF",
      "title": "WHO recommendations on maternal and newborn care for a positive postnatal experience",
      "url": "https://www.who.int/publications/i/item/9789240045989",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "infant-colic",
    "topic": "infant-colic",
    "title": {
      "en": "Infant colic & excessive crying — soothing techniques and red flags",
      "ur": "شیرخوار بچوں میں پیٹ کا درد اور گیس (کولک) — تسکین کی تدابیر اور علامات",
      "roman": "Bachay ke pet me dard aur rona (infant colic) — dekh bhaal aur tadbeer"
    },
    "content": {
      "en": "• Infant colic is frequent, prolonged, intense crying in a healthy infant, commonly peaking between 6 weeks and 3–4 months of age\n• Burp baby thoroughly during and after every feeding; hold the baby upright for 20 minutes after feeds\n• Soothe using gentle motion: rock baby rhythmically, hold baby tummy-down across your forearm (\"colic carry\"), or do gentle bicycle leg movements\n• Give tummy time when awake and supervised; check that the diaper is clean and clothes are not too tight or too warm\n• Never shake a baby — if feeling overwhelmed, place baby safely on their back in the crib and step away for a few minutes to calm down\nSEE A DOCTOR IF: Crying is accompanied by poor weight gain, vomiting feeds forcefully, or loose watery stools.\nEMERGENCY / GO IMMEDIATELY: Fever in an infant <3 months, vomiting green bile, blood in stool, swollen/distended hard abdomen, extreme lethargy, or high-pitched weak whimper.",
      "ur": "• شیرخوار بچوں میں شام کے وقت پیٹ کے مروڑ اور گیس سے مسلسل رونا عام ہے جو 3-4 ماہ کی عمر تک ٹھیک ہو جاتا ہے\n• بچے کو دودھ پلانے کے دوران اور بعد میں اچھی طرح ڈکار (burp) دلائیں اور 20 منٹ سیدھا گود میں رکھیں\n• پیٹ کے بل اپنے بازو پر لٹائیں یا ہلکی سی پیٹھ پر تھپکی دیں، اور ٹانگوں کو سائیکل کی طرح آہستہ حرکت دیں\n• بچے کو کبھی زور سے مت جھنجھوڑیں (never shake a baby)\nڈاکٹر کو دکھائیں: بچہ دودھ نہ پیے، وزن کم ہو رہا ہو، یا موشن لگے ہوں\nایمرجنسی (فوراً جائیں): 3 ماہ سے چھوٹے بچے کو بخار، سبز رنگ کی الٹی، پاخانے میں خون، پیٹ کا سخت اور پھولا ہونا، یا بچہ بالکل بے سدھ پڑا ہو۔",
      "roman": "• Chhotay bachay ka shaam ko pet dard se rona aam tor par gas (colic) ki wajah se hota hai\n• Doodh pilane ke baad bache ko dakar (burp) zaroor dilayein\n• Bachay ki peeth par halki thapki dein aur aaram se godi mein jhulayein\n• Bachay ko hargiz na jhanjhorhein\nDOCTOR KO DIKHAYEIN agar: bacha doodh na piye ya wazan na barhay\nEMERGENCY (FORI JAYEIN): Chhotay bache ko bukhar, sabz ulti, pakhane mein khoon ya behoshi.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "infant colic",
      "baby colic",
      "bachay ke pet me dard",
      "بچے کے پیٹ میں درد",
      "chhotay bachay ke pet me dard",
      "bacha bohot rota hai",
      "infant gas",
      "colic",
      "baby crying",
      "burping baby"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "child",
    "source": {
      "publisher": "WHO / UNICEF",
      "title": "Pocket book of hospital care for children: infant crying and colic",
      "url": "https://www.who.int/publications/i/item/9789241548373",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "diaper-rash",
    "topic": "diaper-rash",
    "title": {
      "en": "Diaper rash & nappy irritation — skin barrier care and prevention",
      "ur": "ڈائپر کے دانے اور ریش (Diaper Rash) — جلد کا تحفظ، گھریلو علاج اور پرہیز",
      "roman": "Diaper ke danay aur rash (nappy rash) — dekh bhaal aur bachao"
    },
    "content": {
      "en": "• Change wet or soiled diapers immediately; do not leave a baby in a dirty diaper\n• Clean baby’s bottom gently with warm water and soft cotton cloth; pat dry gently without rubbing\n• Allow bare-bottom diaper-free time for 15–30 minutes several times a day so fresh air can heal the skin\n• Apply a generous layer of zinc oxide barrier cream or plain petroleum jelly at every diaper change\n• Fasten diapers loosely to allow air circulation and prevent friction\nSEE A DOCTOR IF: Rash does not improve within 3–4 days, develops bright red satellite spots with peeling (suggests Candida fungal diaper infection requiring antifungal cream).\nEMERGENCY / GO IMMEDIATELY: Rash develops open bleeding ulcers, draining yellow pus blisters, or is accompanied by high fever.",
      "ur": "• گیلے یا گندے ڈائپر کو فوراً تبدیل کریں اور بچے کو زیادہ دیر گندے ڈائپر میں نہ رہنے دیں\n• نیم گرم پانی اور نرم سوتی کپڑے سے صفائی کریں اور رگڑے بغیر نرمی سے سکھائیں\n• دن میں کئی بار 15-30 منٹ بغیر ڈائپر کے کھلا رکھیں تاکہ ہوا لگنے سے جلد قدرتی طور پر ٹھیک ہو سکے\n• ہر ڈائپر بدلتے وقت زنک آکسائیڈ والی ریش کریم (Zinc oxide cream) یا سادہ ویزلین کی تہہ لگائیں\nڈاکٹر کو دکھائیں: ریش 3-4 دن میں ٹھیک نہ ہو یا سرخ چمکدار چھالے بن جائیں (فنگل ریش)\nایمرجنسی (فوراً جائیں): اگر دانوں میں پیپ پڑ جائے، خون نکلے یا بچے کو تیز بخار ہو۔",
      "roman": "• Geelay diaper ko foran badlein\n• Saaf paani se dho kar narm kapray se aaram se khushk karein\n• Din mein kuch dair bache ko bina diaper ke rakhein taake hawa lagay\n• Har diaper change par zinc oxide cream ya vaseline lagayein\nDOCTOR KO DIKHAYEIN agar: 3-4 din mein rash theek na ho\nEMERGENCY (FORI JAYEIN): Danon se peep ya khoon nikalna ya bukhar aana.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "diaper rash",
      "nappy rash",
      "diaper ke danay",
      "ڈائپر ریش",
      "potray ke rash",
      "baby rash",
      "diaper ke dane",
      "rash cream",
      "zinc oxide"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "child",
    "source": {
      "publisher": "WHO / UNICEF",
      "title": "Child and infant skin health guidance: napkin dermatitis",
      "url": "https://www.who.int/teams/maternal-newborn-child-adolescent-health",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "mouth-ulcers-canker",
    "topic": "mouth-ulcers",
    "title": {
      "en": "Mouth ulcers & canker sores (munh ke chhale) — soothing home care",
      "ur": "منہ کے چھالے اور زخم (Canker Sores) — گھریلو علاج اور پرہیز",
      "roman": "Munh ke chhale (mouth ulcers) — gharelu aasan ilaaj aur parhez"
    },
    "content": {
      "en": "• Mouth ulcers (aphthous stomatitis) are painful small shallow sores inside the cheeks, lips, tongue, or gums\n• Rinse mouth with warm salt water (half teaspoon salt in warm water) or baking soda rinse 3–4 times daily\n• Avoid spicy foods, acidic citrus fruits, very hot drinks, and rough crunchy snacks that sting and aggravate raw ulcers\n• Apply a drop of pure honey, glycerin, or pharmacist-approved soothing oral gel directly to the sore for pain relief\n• Eat soft, cool foods (yogurt, khichdi, porridge) and ensure adequate intake of Vitamin B-complex, iron, and folic acid\nSEE A DOCTOR IF: Ulcers last longer than 10–14 days, grow unusually large (>1 cm), or keep returning constantly.\nEMERGENCY / GO IMMEDIATELY: Ulcers cause complete inability to swallow fluids resulting in dehydration, or a non-healing hard ulcer with swollen neck lymph node.",
      "ur": "• منہ کے چھالے گالوں کے اندر، ہونٹوں یا زبان پر چھوٹے اور دردناک زخم ہوتے ہیں\n• نیم گرم نمک ملے پانی سے دن میں 3-4 بار کلیاں کریں جس سے ورم اور جلن میں آرام ملتا ہے\n• تیز مرچ مسالے، ترش پھل اور بہت گرم چائے سے پرہیز کریں جو چھالوں میں جلن پیدا کرتے ہیں\n• چھالوں پر اصلی شہد، گلیسرین، یا فارماسسٹ کی بتائی ہوئی مسکن جیل لگائیں\n• نرم اور ٹھنڈی غذائیں لیں (دہی، کھچڑی، دلیہ) اور وٹامن بی اور فولک ایسڈ کا استعمال کریں\nڈاکٹر کو دکھائیں: چھالے 10-14 دن سے زیادہ رہیں، بڑے سائز کے ہوں، یا بار بار نکلیں\nایمرجنسی (فوراً جائیں): چھالوں کی وجہ سے پانی نگلنا بالکل ناممکن ہو جائے، یا کوئی ایسا چھالا جو مہینوں سے نہ بھر رہا ہو اور سخت ہو۔",
      "roman": "• Munh mein chhale gaalon ya zaban par dardnak zakhm hote hain\n• Neem garam namak ke paani se din mein 3-4 baar kulliyan karein\n• Tez mirch masalay aur garam cheezon se parhez karein\n• Chhalon par shehd ya glycerin lagayein aur dahi/khichdi khayein\nDOCTOR KO DIKHAYEIN: chhale 10-14 din se zyada rahein\nEMERGENCY (FORI JAYEIN): Paani nigalna na mumkin ho jaye ya sakht zakhm ho jo na bharay."
    },
    "tags": [
      "mouth ulcers",
      "mouth ulcer",
      "canker sore",
      "منہ کے چھالے",
      "munh ke chhale",
      "munh me chhale",
      "munh pakna",
      "zaban par chhale",
      "muh ke chhale",
      "chhale",
      "aphthous",
      "oral ulcer"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Oral health surveys: basic methods and primary oral lesions",
      "url": "https://www.who.int/news-room/fact-sheets/detail/oral-health",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "gingivitis-gum-disease",
    "topic": "gingivitis",
    "title": {
      "en": "Gingivitis & bleeding gums — oral hygiene and dental care",
      "ur": "مسوڑھوں سے خون آنا اور سوزش (Gingivitis) — دانتوں کی صفائی اور بچاؤ",
      "roman": "Masoorhon se khoon aana (gingivitis) — daant ki safai aur hidayat"
    },
    "content": {
      "en": "• Gingivitis is an early gum inflammation caused by bacterial plaque buildup, making gums swollen, red, and prone to bleeding while brushing\n• Brush teeth thoroughly twice daily for 2 full minutes using a soft-bristled toothbrush and fluoride toothpaste\n• Clean between teeth daily with dental floss to remove trapped food and plaque that brushes cannot reach\n• Rinse with warm salt water daily; avoid betel nut (chalia/supari), gutka, paan, and smoking, which cause severe periodontal destruction\n• Replace your toothbrush every 3 months or as soon as bristles become frayed\nSEE A DENTIST: Every 6–12 months for professional scaling and cleaning to prevent irreversible bone and tooth loss.\nEMERGENCY / GO IMMEDIATELY: Severe throbbing toothache with rapid facial swelling, fever, difficulty opening mouth, or difficulty swallowing (dental abscess requiring urgent drainage).\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• مسوڑھوں کی سوزش (جنجیوائٹس) دانتوں پر پلاک اور میل جمع ہونے سے ہوتی ہے جس سے برش کرتے وقت خون آتا ہے\n• دن میں 2 بار نرم برش سے 2 منٹ تک باقاعدگی سے دانت صاف کریں\n• دانتوں کے درمیان خلال (floss) کا استعمال کریں تاکہ پھنسے ہوئے ذرات نکلیں\n• چھالیہ، سپاری، گٹکا، پان اور نسوار سے مکمل پرہیز کریں جو مسوڑھوں اور دانتوں کو تباہ کرتے ہیں\n• ہر 3 ماہ بعد ٹوتھ برش تبدیل کریں\nڈاکٹر کو دکھائیں: ہر 6 سے 12 ماہ بعد دانتوں کے ڈاکٹر سے معائنہ کروائیں\nایمرجنسی (فوراً جائیں): چہرے پر اچانک شدید سوجن، دانت میں شدید درد کے ساتھ تیز بخار اور منہ نہ کھلنا (دانت کا خطرناک انفیکشن)۔",
      "roman": "• Masoorhon se khoon aana aur soojan daant par mail jamne se hoti hai\n• Din mein 2 baar narm brush se daant saaf karein\n• Chalia, gutka, paan aur naswar se sakht parhez karein\n• Har 3 mahine baad toothbrush badlein\nDOCTOR KO DIKHAYEIN: Dentist se saal mein checkup karwayein\nEMERGENCY (FORI JAYEIN): Chehre par shadeed soojan, daant ka sakht dard aur bukhar."
    },
    "tags": [
      "gingivitis",
      "masoorhay",
      "مسوڑھوں سے خون",
      "gums bleeding",
      "bleeding gums",
      "masoorhay sujan",
      "masoro se khoon",
      "gum disease",
      "periodontitis",
      "oral hygiene"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Oral health and periodontal disease prevention guidelines",
      "url": "https://www.who.int/news-room/fact-sheets/detail/oral-health",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "electric-shock-first-aid",
    "topic": "electric-shock",
    "title": {
      "en": "Electric shock first aid (bijli ka current) — safety and emergency protocol",
      "ur": "بجلی کا کرنٹ لگنا — فوری حفاظتی اقدامات اور ابتدائی طبی امداد",
      "roman": "Bijli ka current lagna — fori hifazat aur emergency first aid"
    },
    "content": {
      "en": "• SCENE SAFETY FIRST: Do NOT touch the victim with your bare hands while they are still in contact with the electrical source\n• Immediately switch off the main circuit breaker / power switch; if unable, separate the victim using a dry non-conductive object (dry wooden stick, broom handle, or plastic rod)\n• Once safe, check responsiveness and breathing; if not breathing, call 1122 and begin CPR immediately (hard fast chest compressions at 100–120/min)\n• Cool entrance and exit electrical burns with clean cool running water; cover loosely with a clean sterile cloth (do not apply oils or pastes)\n• Even victims who appear unharmed must undergo an emergency hospital ECG check, as electric current can disrupt cardiac rhythm hours later\nEMERGENCY / GO IMMEDIATELY: All high-voltage shocks, loss of consciousness, burns, difficulty breathing, or irregular heartbeat.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• سب سے پہلے اپنی حفاظت: جب تک بجلی کا ذریعہ بند نہ ہو مریض کو اپنے ننگے ہاتھوں سے ہرگز نہ چھوئیں\n• فوراً مین سوئچ یا بریکر بند کریں؛ اگر ممکن نہ ہو تو سوکھی لکڑی یا پلاسٹک کے ڈنڈے سے مریض کو تار سے الگ کریں\n• الگ کرنے کے بعد نبض اور سانس چیک کریں؛ اگر سانس نہ آ رہی ہو تو 1122 پر کال کریں اور سینے کو دبانے والی سی پی آر (CPR) شروع کریں\n• جلی ہوئی جگہ پر صاف ٹھنڈا پانی ڈالیں اور صاف کپڑے سے ڈھانپیں (تیل، ٹوتھ پیسٹ ہرگز نہ لگائیں)\n• کرنٹ لگنے والے ہر مریض کو ای سی جی (ECG) کے لیے ہسپتال لے جانا ضروری ہے\nایمرجنسی (فوراً جائیں): کرنٹ لگنے کا ہر واقعہ، بےہوشی، جلنا، یا سانس میں رکاوٹ۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• Pehle apni hifazat: Mareez ko nangay haathon se na chhuwein jab tak current on ho\n• Foran main power switch band karein ya sookhi lakri se alag karein\n• Saans check karein; saans na ho to 1122 call karein aur CPR shuru karein\n• Jali jagah par saaf thanda paani dalein\n• ECG checkup ke liye hospital zaroor jayein\nEMERGENCY (FORI JAYEIN): Current lagne par fori emergency hospital jayein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "electric shock",
      "bijli ka current",
      "بجلی کا کرنٹ",
      "bijli lagna",
      "current lagna",
      "electrical burn",
      "electrocution",
      "high voltage",
      "cpr electrical"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": {
      "publisher": "IFRC / WHO",
      "title": "First aid and emergency response for electrical injuries",
      "url": "https://www.ifrc.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "heatstroke-loo-lagna",
    "topic": "heatstroke",
    "title": {
      "en": "Severe heatstroke & sunstroke (loo lagna) — rapid cooling and emergency care",
      "ur": "لو لگنا اور شدید ہیٹ اسٹروک — فوری ٹھنڈک پہنچانے کی تدابیر اور ایمرجنسی",
      "roman": "Loo lagna aur shadeed heatstroke — fori jism thanda karne ke tareeqay"
    },
    "content": {
      "en": "• Heatstroke is a life-threatening emergency where body temperature surges above 40°C (104°F) with hot dry skin (or heavy sweat), confusion, seizures, or unconsciousness\n• CALL 1122 IMMEDIATELY and start rapid active cooling on the spot:\n  1. Move the person to a cool, shaded area or air-conditioned room\n  2. Remove excess outer clothing\n  3. Spray or sponge whole body with cool/tap water and fan vigorously\n  4. Place cold wet packs or ice bags on neck, armpits, and groin where major blood vessels run\n• Do NOT give fluids by mouth if the person is confused, vomiting, or drowsy (aspiration risk)\nEMERGENCY / GO IMMEDIATELY: Heatstroke is a medical emergency — rapid cooling while waiting for rescue saves life and prevents permanent brain damage.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• لو لگنا (ہیٹ اسٹروک) ایک جان لیوا ایمرجنسی ہے جس میں جسم کا درجہ حرارت 40°C (104°F) سے اوپر چلا جاتا ہے، گرم خشک جلد، الجھن، یا بےہوشی ہوتی ہے\n• فوراً 1122 پر کال کریں اور موقع پر ہی مریض کو ٹھنڈا کرنا شروع کریں:\n  1. مریض کو فوراً چھاؤں یا ٹھنڈے کمرے میں منتقل کریں\n  2. اضافی کپڑے اتار دیں\n  3. پورے جسم پر نلکے کا ٹھنڈا پانی ڈالیں اور پنکھے سے تیز ہوا دیں\n  4. گردن، بغلوں اور رانوں کے درمیان برف یا ٹھنڈے گیلے تولیے رکھیں\n• اگر مریض غنودگی میں ہو تو منہ سے پانی ہرگز نہ پلائیں (دم گھٹنے کا خطرہ)\nایمرجنسی (فوراً جائیں): ہیٹ اسٹروک فوری ہسپتال لے جانے والی ایمرجنسی ہے — ٹھنڈا کرنے سے جان بچتی ہے۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• Loo lagna aik jan leva emergency hai jismein bukhar 104°F se oopar chala jata hai aur behoshi hoti hai\n• Foran 1122 call karein aur mareez ko thanda karein:\n  1. Chhaon ya AC kamray mein le jayein\n  2. Faltu kapray utaar dein\n  3. Jism par thanda paani dalein aur pankha chalayein\n  4. Gardan aur baghalon mein barf ki patti rakhein\n• Behosh mareez ko paani na pilayein\nEMERGENCY (FORI JAYEIN): Loo lagne par foran rescue bulayein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "heatstroke",
      "heat stroke",
      "loo lagna",
      "لو لگنا",
      "loo lag gayi",
      "shadeed garmi bukhar",
      "sunstroke",
      "loo",
      "heat exhaustion",
      "hyperthermia",
      "cooling first aid"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": {
      "publisher": "WHO / Pakistan MoNHSRC",
      "title": "Heatwave and heat health guidelines for Pakistan",
      "url": "https://www.nhsrc.gov.pk",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "eye-injury-chemical",
    "topic": "eye-injury",
    "title": {
      "en": "Eye injuries & chemical splashes — emergency irrigation and first aid",
      "ur": "آنکھ میں کیمیکل یا چوٹ — فوری دھلائی اور ہنگامی طبی امداد",
      "roman": "Aankh me chemical ya chot — fori dhoona aur emergency first aid"
    },
    "content": {
      "en": "• FOR CHEMICAL SPLASHES (acid, alkali, bleach, battery fluid, lime): Flush the eye IMMEDIATELY with clean running water for at least 15–20 continuous minutes holding eyelids open with fingers\n• Do NOT rub the eye, do NOT press on the eyeball, and do NOT attempt to neutralize with other chemicals or drops\n• FOR FOREIGN OBJECTS (dust, eyelash): Rinse with clean saline or water; do NOT use tweezers or sharp objects to pluck anything embedded in the eye\n• FOR BLUNT TRAUMA / CUTS: Cover the eye loosely with a clean rigid shield or paper cup without applying direct pressure on the globe\nEMERGENCY / GO IMMEDIATELY: Go immediately to the nearest eye hospital / emergency room after chemical splash, puncture wound, sudden loss of vision, or severe pain.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• کیمیکل یا تیزاب گرنے پر: فوراً آنکھ کو نلکے کے صاف بہتے پانی سے کم از کم 15-20 منٹ تک مسلسل دھوئیں اور انگلیوں سے پلکیں کھلی رکھیں\n• آنکھ کو ہرگز نہ مسلیں، دباؤ نہ ڈالیں، اور کوئی دوا یا قطرے خود سے نہ ڈالیں\n• مٹی یا تنکا پڑنے پر: صاف پانی سے دھوئیں۔ آنکھ میں پیوست چیز کو سوئی یا چمٹی سے نکالنے کی ہرگز کوشش نہ کریں\n• چوٹ لگنے پر: آنکھ پر صاف کپڑا یا کاغذ کا کپ رکھ کر ڈھانپیں لیکن دباؤ نہ ڈالیں\nایمرجنسی (فوراً جائیں): کیمیکل گرنے، آنکھ میں گہرا زخم ہونے، یا اچانک نظر بند ہونے پر فوراً آنکھوں کے ہسپتال جائیں۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• Chemical ya tezaab girnay par: Foran 15-20 minute tak behate paani se aankh ko khoob dhoiyein\n• Aankh ko hargiz na malein aur koi drop na dalein\n• Tinka nikalne ke liye sooi ya chimti istemal na karein\n• Aankh par hifazati cover rakhein\nEMERGENCY (FORI JAYEIN): Chemical girne ya shadeed chot par fori eye hospital jayein.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "eye injury",
      "chemical splash in eye",
      "آنکھ میں چوٹ",
      "aankh me tezaab",
      "aankh par chot",
      "aankh me kuch girna",
      "acid in eye",
      "eye flush",
      "corneal foreign body",
      "eye-trauma",
      "eye trauma"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": {
      "publisher": "IFRC / WHO",
      "title": "Emergency eye care and chemical splash first aid",
      "url": "https://www.ifrc.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "heart-failure",
    "topic": "heart-failure",
    "title": {
      "en": "Heart failure & fluid retention — daily weights, salt restriction and red flags",
      "ur": "دل کی کمزوری (ہارٹ فیلئیر) — نمک کا پرہیز، وزن کا ریکارڈ اور علامات",
      "roman": "Dil ki kamzori (heart failure) — namak ka parhez aur dekh bhaal"
    },
    "content": {
      "en": "• Weigh yourself every morning after urinating; report a sudden weight gain of 1.5–2 kg in 2 days to your doctor\n• Restrict dietary salt/sodium (<2 g/day) and avoid heavy salty gravies, pickles, and processed snacks\n• Elevate legs on pillows when sitting to reduce ankle and foot swelling (edema)\n• Take prescribed diuretics (water pills) and heart medications consistently; do NOT skip doses\nSEE A DOCTOR IF: Increasing swelling in feet, ankles, legs, or needing extra pillows to breathe while sleeping (orthopnea).\nEMERGENCY / GO IMMEDIATELY: Sudden severe breathlessness while resting, coughing pink frothy sputum (pulmonary edema), crushing chest pain, or fainting.",
      "ur": "• روزانہ صبح پیشاب کے بعد وزن چیک کریں؛ اگر 2 دن میں ڈیڑھ سے دو کلو وزن اچانک بڑھے تو ڈاکٹر کو بتائیں\n• نمک کا استعمال سخت کم کریں (<2 گرام روزانہ)؛ اچار، پاپڑ اور نمکین سالن سے پرہیز کریں\n• بیٹھتے وقت پاؤں کے نیچے تکیہ رکھ کر اونچا رکھیں تاکہ سوجن کم ہو\n• ڈاکٹر کی تجویز کردہ دل اور پیشاب آور ادویات باقاعدگی سے لیں؛ کوئی خوراک نہ چھوڑیں\nڈاکٹر کو دکھائیں: پاؤں اور ٹانگوں میں سوجن بڑھے یا رات کو سوتے وقت سانس پھولے\nایمرجنسی (فوراً جائیں): بیٹھے ہوئے اچانک شدید سانس بند ہونا، گلابی جھاگ دار بلغم، سینے میں شدید درد، یا بےہوشی۔",
      "roman": "• Rozana subah wazan check karein; agar 2 din mein 1.5-2 kg wazan barhay to doctor ko batayein\n• Namak ka istemal kam karein (<2g rozana) aur achar/namkeen cheezon se parhez karein\n• Baithte waqt paon takiye par oopar rakhein taake sujan kam ho\n• Doctor ki di hui dil ki dawaiyan waqt par lein\nDOCTOR KO DIKHAYEIN agar: paon mein sujan barhay ya sote waqt saans phoolay\nEMERGENCY (FORI JAYEIN): Achanak shadeed saans ki takleef, gulabi jhaag wali balgham ya seene me dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "heart failure",
      "dil ki kamzori",
      "congestive heart failure",
      "chf",
      "dil ka barhna",
      "sujan pairon me",
      "paon me sujan",
      "saans phoolna",
      "دل کی کمزوری",
      "ہارٹ فیلئیر",
      "fluid overload",
      "swollen feet",
      "edema legs"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Prevention and management of cardiovascular disease: heart failure",
      "url": "https://www.who.int/cardiovascular_diseases/guidelines",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "arrhythmia-palpitations",
    "topic": "arrhythmia",
    "title": {
      "en": "Heart palpitations & arrhythmia — identifying irregular beats and triggers",
      "ur": "دل کی بے ترتیب دھڑکن (Arrhythmia) — وجوہات، احتیاط اور علامات",
      "roman": "Dil ki dharkan ki be-tarteebi (arrhythmia) — asbaab aur alamaat"
    },
    "content": {
      "en": "• Palpitations feel like a racing, pounding, fluttering, or skipping heartbeat\n• Eliminate stimulants: stop caffeine, energy drinks, nicotine/smoking, and decongestant cold syrups\n• Practice slow deep belly breathing during sudden rapid pounding episodes to stimulate the vagus nerve\n• Stay well hydrated with water and maintain balanced electrolyte intake (bananas, coconut water)\nSEE A DOCTOR IF: Palpitations occur frequently, last more than a few minutes, or pulse is persistently >100 bpm at rest.\nEMERGENCY / GO IMMEDIATELY: Palpitations accompanied by chest pressure, shortness of breath, dizziness, sudden weakness, or loss of consciousness (syncope).",
      "ur": "• دھڑکن کا بے قابو ہونا یا پھڑکنا دل کی بے ترتیبی (Arrhythmia) کی علامت ہو سکتا ہے\n• کیفین، چائے، انرجی ڈرنکس اور سگریٹ نوشی سے مکمل پرہیز کریں\n• دھڑکن تیز ہونے پر پرسکون ہو کر بیٹھ جائیں اور ناک سے گہرے لمبے سانس لیں\n• پانی مناسب مقدار میں پئیں اور پوٹاشیم والی غذائیں (کیلا، ناریل پانی) لیں\nڈاکٹر کو دکھائیں: دل کی دھڑکن بار بار بے ترتیب ہو یا آرام میں نبض 100 سے زیادہ رہے\nایمرجنسی (فوراً جائیں): دھڑکن تیز ہونے کے ساتھ سینے میں درد، سانس گھٹنا، چکر آنا یا بےہوش ہو جانا۔",
      "roman": "• Dharkan tez hona ya pharakna dil ki be-tarteebi (arrhythmia) ho sakti hai\n• Chai, coffee, energy drinks aur sigrat se parhez karein\n• Dharkan tez ho to baith kar gehre saans lein aur paani piyein\nDOCTOR KO DIKHAYEIN agar: dharkan bar bar be-tarteeb ho ya nabz 100 se tez ho\nEMERGENCY (FORI JAYEIN): Dharkan tez hone ke sath seene mein dard, saans phoolna ya behoshi.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "arrhythmia",
      "palpitations",
      "dil ki dharkan tez",
      "دل کی دھڑکن",
      "dil ghabrana",
      "irregular heartbeat",
      "fluttering heart",
      "pulse tez",
      "tachycardia",
      "bradycardia",
      "dil ki be-tarteebi",
      "palpitation"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Clinical assessment of cardiac rhythm disorders",
      "url": "https://www.who.int/cardiovascular_diseases/guidelines",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "dvt-deep-vein-thrombosis",
    "topic": "dvt",
    "title": {
      "en": "Deep vein thrombosis (DVT) & leg clot — recognition, risk factors and warning signs",
      "ur": "ٹانگ کی ورید میں خون کا لوتھڑا (DVT) — علامات، خطرات اور ابتدائی تدابیر",
      "roman": "Taang ki naari me khoon jamna (DVT) — alamaat aur fori hidayat"
    },
    "content": {
      "en": "• Deep vein thrombosis (DVT) is a blood clot forming in deep calf or thigh veins after prolonged bed rest, surgery, or travel\n• DO NOT MASSAGE OR RUB a swollen painful calf (massaging can break the clot loose into the lungs)\n• Keep the affected leg gently elevated; avoid long uninterrupted periods of sitting or bed confinement\n• Stay well hydrated and perform gentle ankle pump exercises during long journeys\nSEE A DOCTOR SAME DAY: Sudden one-sided calf or leg swelling, localized heat, redness, and deep cramping calf pain.\nEMERGENCY / GO IMMEDIATELY: Sudden unexplained breathlessness, sharp stabbing chest pain when breathing in, coughing blood, or fainting (Pulmonary Embolism).\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• ٹانگ کی گہری رگ میں خون کا لوتھڑا جمنے کو ڈی وی ٹی (DVT) کہتے ہیں جو زیادہ دیر لیٹے رہنے یا سفر سے ہو سکتا ہے\n• سوجی ہوئی پنڈلی کی مالش ہرگز نہ کریں (مالش کرنے سے لوتھڑا پھیپھڑوں میں جا سکتا ہے جو جان لیوا ہے)\n• ٹانگ کو تکیے پر اونچا رکھیں اور سفر کے دوران پاؤں کو وقفے وقفے سے حرکت دیں\n• پانی زیادہ پئیں اور بلاوجہ بستر پر پڑے رہنے سے پرہیز کریں\nڈاکٹر کو دکھائیں: ایک ٹانگ یا پنڈلی میں اچانک سوجن، گرمی، سرخی اور درد ہونے پر اسی دن معائنہ کروائیں\nایمرجنسی (فوراً جائیں): اچانک سانس کا شدید پھولنا، سانس لینے پر سینے میں نیزے جیسا درد، یا کھانسی میں خون آنا (پلمونری ایمبولزم)۔",
      "roman": "• Taang ki naari mein khoon jamna (DVT) pait ya pindli mein sujan aur dard peda karta hai\n• Pindli ki maalish hargiz na karein kyunke clot phail sakta hai\n• Taang ko ooncha rakhein aur paani zyada piyein\nDOCTOR KO DIKHAYEIN: Aik taang mein achanak sujan aur shadeed dard par usi din clinic jayein\nEMERGENCY (FORI JAYEIN): Achanak saans phoolna, seene mein chubhata dard ya khansi mein khoon aana."
    },
    "tags": [
      "dvt",
      "deep vein thrombosis",
      "leg blood clot",
      "pindli me sujan",
      "taang me sujan",
      "calf swelling",
      "khoon ka lothra",
      "پنڈلی میں سوجن",
      "ڈی وی ٹی",
      "pulmonary embolism",
      "calf clot",
      "swollen calf"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Venous thromboembolism prevention and primary care diagnosis",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "copd-chronic-bronchitis",
    "topic": "copd",
    "title": {
      "en": "Chronic Obstructive Pulmonary Disease (COPD) — breathing support, inhaler use and flare-ups",
      "ur": "پھیپھڑوں کی پرانی بیماری (COPD) — سانس کی مشقیں، انہیلر اور احتیاط",
      "roman": "Phaiphrron ki purani bimari (COPD) — saans ki mashq aur dekh bhaal"
    },
    "content": {
      "en": "• COPD causes long-term airway damage and chronic cough primarily from smoking, biomass cooking smoke, or air pollution\n• Completely stop smoking and avoid exposure to firewood/dung cooking smoke; use well-ventilated stoves\n• Take prescribed maintenance bronchodilator inhalers with a spacer device daily as directed\n• Practice pursed-lip breathing (inhale through nose 2 sec, exhale slowly through pursed lips 4 sec) to clear trapped air\nSEE A DOCTOR IF: Sputum color changes to yellow/green, cough frequency increases, or ankles swell.\nEMERGENCY / GO IMMEDIATELY: Inability to speak in full sentences due to gasping, blue lips/fingernails, severe confusion, or extreme drowsiness.",
      "ur": "• سی او پی ڈی (COPD) پھیپھڑوں کی مستقل بیماری ہے جو سگریٹ، حقہ، یا لکڑی کے دھوئیں سے ہوتی ہے\n• سگریٹ اور دھوئیں سے مکمل پرہیز کریں اور ہوا دار جگہ پر کھانا پکائیں\n• ڈاکٹر کے بتائے ہوئے انہیلر (Inhaler) کو اسپیسر کے ساتھ روزانہ باقاعدگی سے استعمال کریں\n• ہونٹ گول کر کے آہستہ آہستہ سانس باہر نکالنے کی مشق کریں تاکہ پھیپھڑوں سے گندی ہوا نکلے\nڈاکٹر کو دکھائیں: بلغم کا رنگ پیلا یا سبز ہو جائے، کھانسی بڑھے، یا ٹخنوں پر سوجن آئے\nایمرجنسی (فوراً جائیں): سانس نہ آنے کی وجہ سے بات نہ کر سکنا، ہونٹ یا ناخن نیلے پڑنا، یا شدید غنودگی۔",
      "roman": "• COPD phaiphrron ki purani bimari hai jo sigrat aur dhuen se saans band karti hai\n• Sigrat noshi foran chhor dein aur dhuen se bachein\n• Prescribed inhaler spacer ke sath rozana lein\n• Pursed-lip saans lene ki mashq karein\nDOCTOR KO DIKHAYEIN agar: balgham ka rang badal jaye ya khansi barh jaye\nEMERGENCY (FORI JAYEIN): Saans lene mein intehai dushwari, neelay hont ya behoshi.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "copd",
      "chronic bronchitis",
      "emphysema",
      "purani khansi",
      "dama aur copd",
      "سی او پی ڈی",
      "smoking cough",
      "huqqa",
      "dhuen ki khansi",
      "saans ki takleef",
      "inhaler",
      "pursed lip breathing"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Chronic obstructive pulmonary disease (COPD) fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/chronic-obstructive-pulmonary-disease-(copd)",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "pleural-chest-pain",
    "topic": "pleural-pain",
    "title": {
      "en": "Pleurisy & sharp chest pain with breathing — recognition and red flags",
      "ur": "پھیپھڑوں کی جھلی کا درد (Pleurisy) — سانس لینے پر درد اور خطرے کے اشارے",
      "roman": "Saans lene par seene ka dard (pleurisy) — dekh bhaal aur alamaat"
    },
    "content": {
      "en": "• Pleurisy is inflammation of the lung lining causing sharp, stabbing chest pain that worsens with deep breathing, coughing, or sneezing\n• Rest in a comfortable position; lying on the painful side may splint the chest wall and reduce friction pain\n• Take pharmacist-approved pain relief (paracetamol) and stay well hydrated with warm fluids\n• Avoid smoking and cold dry air exposure\nSEE A DOCTOR IF: Breathing-related chest pain lasts >24 hours or accompanies mild fever, cough, or recent viral infection.\nEMERGENCY / GO IMMEDIATELY: Sudden severe shortness of breath, coughing up bright red blood, high fever with shaking chills, or pain spreading to left arm/jaw.",
      "ur": "• پلوریسی میں پھیپھڑوں کے گرد جھلی میں سوزش ہوتی ہے جس سے سانس اندر کھینچنے، کھانسنے یا چھینکنے پر سوئی جیسا تیز درد ہوتا ہے\n• درد والی سائیڈ پر کروٹ لے کر لیٹنے سے وقتی طور پر درد کی شدت میں کمی آ سکتی ہے\n• نیم گرم مائعات پئیں اور فارماسسٹ کے مشورے سے درد کش دوا لیں\n• سگریٹ اور ٹھنڈی ہوا سے پرہیز کریں\nڈاکٹر کو دکھائیں: سانس لینے پر سینے کا درد 24 گھنٹے سے زیادہ رہے یا ساتھ کھانسی اور ہلکا بخار ہو\nایمرجنسی (فوراً جائیں): اچانک شدید سانس پھولنا، کھانسی میں سرخ خون آنا، تیز لرزہ خیز بخار، یا درد بائیں بازو میں جانا۔",
      "roman": "• Pleurisy mein saans lene ya khansne par seene mein chubhata hua tez dard hota hai\n• Dard wali side par letne se aaraam mil sakta hai\n• Garam paani piyein aur paracetamol lein\nDOCTOR KO DIKHAYEIN agar: saans lene par dard 24 ghante se zyada rahe\nEMERGENCY (FORI JAYEIN): Saans mein shadeed takleef, khansi mein khoon ya baen baazu mein dard.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "pleurisy",
      "pleural pain",
      "pleuritic chest pain",
      "saans lene par dard",
      "seene me chubhata dard",
      "پھیپھڑوں کا درد",
      "stabbing chest pain",
      "chest pain on breathing",
      "dry cough chest pain",
      "lung lining"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Respiratory signs and clinical case management guidelines",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "food-poisoning",
    "topic": "food-poisoning",
    "title": {
      "en": "Food poisoning & bacterial gastroenteritis — fluid replacement and recovery",
      "ur": "خراب خوراک کا زہر (Food Poisoning) — مائعات کی بحالی اور گھریلو علاج",
      "roman": "Kharab khana aur food poisoning — paani ki bahaali aur parhez"
    },
    "content": {
      "en": "• Food poisoning causes sudden nausea, severe vomiting, watery diarrhea, and stomach cramps within hours of contaminated food/water\n• START ORS IMMEDIATELY: Take frequent small sips of clean ORS solution to replenish vital fluids and electrolytes\n• Rest stomach for the first few hours; then introduce bland foods: bananas, rice, toast, khichdi, and clear soups\n• Avoid dairy, greasy fast foods, caffeine, and spicy curries for 3–4 days; do NOT take anti-motility drugs if fever is present\nSEE A DOCTOR IF: Diarrhea lasts >3 days, inability to keep liquids down for >24 hours, or high fever >38.5°C.\nEMERGENCY / GO IMMEDIATELY: Stool containing visible blood/pus, signs of severe dehydration (no urine >8h, sunken eyes, extreme dizziness), or rigid agonizing belly pain.",
      "ur": "• خراب یا باسی کھانا کھانے سے چند گھنٹوں میں الٹیاں، پتلے دست، پیٹ میں شدید مروڑ اور کمزوری ہو جاتی ہے\n• فوراً او آر ایس (ORS) شروع کریں اور گھونٹ گھونٹ کر کے پئیں تاکہ پانی اور نمکیات کی کمی نہ ہو\n• پہلے چند گھنٹے معدے کو آرام دیں پھر ہلکی غذا کھائیں (کیلا، کھچڑی، دلیہ، ابلے چاول)\n• دودھ، چکنائی اور مرچ مسالوں سے پرہیز کریں؛ بخار ہونے کی صورت میں موشن روکنے والی گولیاں نہ لیں\nڈاکٹر کو دکھائیں: دست 3 دن سے زیادہ رہیں، پانی بالکل نہ ٹھہرے، یا تیز بخار ہو\nایمرجنسی (فوراً جائیں): پاخانے میں سرخ خون یا پیپ آنا، 8 گھنٹے پیشاب نہ آنا، آنکھیں دھنس جانا، یا شدید چکر۔",
      "roman": "• Kharab ya baasi khana khane se ulti, dast aur pet mein maror uthti hai\n• Foran ORS shuru karein aur thora thora kar ke piyein\n• Khichdi, daliya aur kela khayein; tali hui cheezon se parhez karein\nDOCTOR KO DIKHAYEIN agar: dast 3 din se zyada rahein ya ulti na rukay\nEMERGENCY (FORI JAYEIN): Pakhane mein khoon aana, peshab bilkul band hona ya behoshi.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "food poisoning",
      "kharab khana",
      "baasi khana",
      "food contamination",
      "qay aur dast",
      "الٹی دست",
      "فوڈ پوائزننگ",
      "stomach bug",
      "bacterial diarrhea",
      "gastro",
      "tainted food",
      "vomiting diarrhea"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Food safety and foodborne disease guidance",
      "url": "https://www.who.int/news-room/fact-sheets/detail/food-safety",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "celiac-disease",
    "topic": "celiac",
    "title": {
      "en": "Celiac disease & gluten intolerance — gluten-free nutrition and digestive care",
      "ur": "سیلیک کی بیماری اور گندم کی الرجی (Celiac) — پرہیز، علامات اور غذائی رہنمائی",
      "roman": "Gandam aur gluten se allergy (celiac disease) — parhez aur dekh bhaal"
    },
    "content": {
      "en": "• Celiac disease is an autoimmune condition where gluten (wheat, barley, rye) damages the small intestine, causing chronic diarrhea, bloating, and poor growth\n• STRICT 100% LIFELONG GLUTEN-FREE DIET is the only treatment: eliminate all wheat roti, naan, bread, biscuits, and pasta\n• Safe traditional alternatives: rice (chawal), corn (makki), millet (bajra), lentils (daal), potatoes, fresh fruits, vegetables, and meat\n• Prevent kitchen cross-contamination: use dedicated clean utensils and tawa for gluten-free cooking\nSEE A DOCTOR IF: For anti-tTG IgA blood testing and intestinal biopsy BEFORE starting a gluten-free diet.\nEMERGENCY / GO IMMEDIATELY: Severe pediatric malnutrition (extreme wasting, swollen belly), severe dehydration from chronic watery diarrhea, or intractable vomiting.",
      "ur": "• سیلیک کی بیماری میں گندم، جو اور گلوٹین والی خوراک سے آنتیں خراب ہو جاتی ہیں جس سے پرانے دست، پیٹ پھولنا اور خون کی کمی ہوتی ہے\n• 100 فیصد گلوٹین فری پرہیز ہی اس کا واحد علاج ہے: گندم کی روٹی، نان، بیکری، اور بسکٹ سے مکمل پرہیز کریں\n• متبادل غذائیں: چاول، مکئی کی روٹی، باجرہ، دالیں، سبزیاں، پھل اور دودھ کا استعمال کریں\n• کھانا بناتے وقت گندم کے برتن الگ رکھیں تاکہ آٹے کے ذرات شامل نہ ہوں\nڈاکٹر کو دکھائیں: گلوٹین فری خوراک شروع کرنے سے پہلے خون کا ٹیسٹ (anti-tTG) اور ڈاکٹر سے تصدیق ضروری ہے\nایمرجنسی (فوراً جائیں): بچے کا شدید سوکھا پن، پیٹ کا غیر معمولی پھولنا، یا مسلسل پانی جیسے دست سے بےہوشی۔",
      "roman": "• Celiac mein gandam (gluten) se aanton mein sozish hoti hai jis se purane dast aur kamzori hoti hai\n• Gandam ki roti aur bakery se mukammal parhez karein\n• Chawal, makki aur bajray ki roti khayein; daalein aur sabziyan lein\nDOCTOR KO DIKHAYEIN: Parhez shuru karne se pehle anti-tTG test karwayein\nEMERGENCY (FORI JAYEIN): Shadeed sukha pan, bache ka wazan achanak girna ya behoshi."
    },
    "tags": [
      "celiac",
      "celiac disease",
      "gluten allergy",
      "gandam se allergy",
      "wheat allergy",
      "گندم سے الرجی",
      "سیلیک",
      "gluten free",
      "chronic diarrhea",
      "bloating child",
      "malabsorption",
      "makki ki roti"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Gastrointestinal disorders: celiac disease and malabsorption",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "bells-palsy",
    "topic": "bells-palsy",
    "title": {
      "en": "Bell's palsy & facial nerve weakness — eye protection, recovery and medical timeline",
      "ur": "چہرے کا فالج اور لقوہ (Bell's Palsy) — آنکھ کی حفاظت، بحالی اور علاج",
      "roman": "Chehre ka falij aur laqwa (Bell's palsy) — aankh ki hifazat aur ilaaj"
    },
    "content": {
      "en": "• Bell's palsy causes sudden weakness or paralysis of muscles on one side of the face, mouth drooping, and inability to close one eye\n• CRITICAL EYE PROTECTION: Because the eye cannot blink or close, use lubricating artificial tear drops every 2 hours by day and lubricating ointment with an eye patch at night to prevent corneal ulcers\n• Perform gentle facial massage and facial expression exercises (smiling, wrinkling forehead) as movement returns\n• Eat soft foods and chew on the unaffected side of the mouth\nSEE A DOCTOR IF: Early prescription steroid treatment (prednisolone within 72h) greatly improves full recovery odds.\nEMERGENCY / GO IMMEDIATELY: Facial weakness accompanied by arm or leg weakness, numbness on one side of body, slurred speech, or confusion (signs of STROKE).",
      "ur": "• لقوہ (Bell's Palsy) میں چہرے کی ایک طرف کے پٹھے اچانک کمزور ہو جاتے ہیں، منہ ٹیڑھا ہو جاتا ہے اور آنکھ بند نہیں ہوتی\n• آنکھ کی حفاظت سب سے اہم ہے: آنکھ کھلی رہنے سے خشک ہو کر زخم بن سکتا ہے، لہٰذا دن میں ہر 2 گھنٹے بعد آنکھ کے قطرے ڈالیں اور رات کو پٹی باندھ کر سوئیں\n• چہرے پر ہلکی مالش کریں اور نرم غذا کھائیں\nڈاکٹر کو دکھائیں: پہلے 72 گھنٹے کے اندر اندر ڈاکٹر کو دکھائیں تاکہ اسٹیرائڈ دوا سے جلد اور مکمل بحالی ہو سکے\nایمرجنسی (فوراً جائیں): اگر منہ ٹیڑھا ہونے کے ساتھ بازو یا ٹانگ میں کمزوری ہو، بولنے میں دشواری ہو، یا آدھا جسم سن ہو (فالج کا خطرہ)۔",
      "roman": "• Laqwa (Bell's palsy) mein chehra aik taraf se dhalak jata hai aur aankh band nahi hoti\n• Aankh mein har 2 ghante baad drops dalein aur raat ko patti bandhein taake zakhm na banay\n• Narm khana khayein aur chehre ki halki warzish karein\nDOCTOR KO DIKHAYEIN: Pehle 72 ghanton mein doctor se steroid ka ilaaj shuru karwayein\nEMERGENCY (FORI JAYEIN): Chehre ke sath baazu/taang mein kamzori ya zuban ladkharana (Stroke)."
    },
    "tags": [
      "bells palsy",
      "facial palsy",
      "laqwa",
      "falij chehra",
      "لقوہ",
      "چہرے کا فالج",
      "facial drooping",
      "one sided face weak",
      "eye wont close",
      "mouth drooping",
      "facial nerve",
      "steroid 72 hours"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Neurological disorders and cranial nerve neuropathies",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "peripheral-neuropathy",
    "topic": "neuropathy",
    "title": {
      "en": "Peripheral neuropathy & diabetic nerve pain — foot care, sensation loss and protection",
      "ur": "ہاتھ پاؤں کا سن ہونا اور جلن (Neuropathy) — شوگر، پاؤں کی دیکھ بھال اور علاج",
      "roman": "Haath paon ka sunn hona aur jalan (neuropathy) — paon ki hifazat aur dekh bhaal"
    },
    "content": {
      "en": "• Peripheral neuropathy causes burning, tingling ('pins and needles'), numbness, or sharp pains in feet and hands, most commonly from diabetes\n• Strictly maintain blood sugar control (HbA1c <7%) to prevent progressive permanent nerve damage\n• DAILY FOOT INSPECTION: Check soles and between toes with a mirror for cuts, blisters, redness, or cracks you cannot feel\n• Never walk barefoot; wash feet daily with lukewarm water, dry thoroughly, and wear comfortable seamless cotton socks and properly fitted shoes\nSEE A DOCTOR IF: Numbness spreads up the legs or pain interferes with nighttime sleep.\nEMERGENCY / GO IMMEDIATELY: Non-healing diabetic foot ulcer, black discoloration of toe (gangrene), spreading redness with foul pus, or high fever with foot wound.",
      "ur": "• پاؤں اور ہاتھوں میں سوئیاں چبھنا، سن ہونا یا شدید جلن ہونا اعصابی کمزوری (Neuropathy) کی علامات ہیں جو شوگر کی زیادتی سے ہوتی ہیں\n• شوگر کو سختی سے قابو میں رکھیں تاکہ اعصاب مزید خراب نہ ہوں\n• روزانہ پاؤں کا معائنہ کریں: شیشے سے تلووں اور انگلیوں کے درمیان دیکھیں کہ کوئی زخم یا چھالا تو نہیں بنا\n• ننگے پاؤں کبھی نہ چلیں؛ پاؤں نیم گرم پانی سے دھو کر انگلیوں کے درمیان اچھی طرح خشک کریں اور نرم جوتے پہنیں\nڈاکٹر کو دکھائیں: سن پن ٹانگوں میں اوپر چڑھے یا رات کو جلن سے نیند نہ آئے\nایمرجنسی (فوراً جائیں): پاؤں پر کالا نشان (گینگرین)، پیپ والا نہ بھرنے والا زخم، یا زخم کے ساتھ تیز بخار۔",
      "roman": "• Haath paon mein jalan, suiyan chubhina aur sunn hona sugar ki wajah se neuropathy ho sakti hai\n• Sugar control rakhein taake nasain mehfooz rahein\n• Rozana paon ke talway check karein aur nange paon hargiz na chalein\n• Paon saaf aur narm rakhein\nDOCTOR KO DIKHAYEIN agar: jalan barh jaye ya paon sunn rahein\nEMERGENCY (FORI JAYEIN): Paon par kala nishan (gangrene), peep wala zakhm ya bukhar.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "peripheral neuropathy",
      "neuropathy",
      "diabetic neuropathy",
      "paon me jalan",
      "haath paon sunn",
      "پاؤں میں جلن",
      "ہاتھ پاؤں سن",
      "tingling feet",
      "burning sensation",
      "pins and needles",
      "foot numbness",
      "diabetic foot"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO / IDF",
      "title": "Prevention and management of diabetic neuropathy and foot complications",
      "url": "https://www.idf.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "concussion-head-injury",
    "topic": "concussion",
    "title": {
      "en": "Concussion & mild head trauma — physical rest, screen limits and red flags",
      "ur": "سر کی چوٹ اور جھٹکا (Concussion) — آرام، اسکرین سے پرہیز اور خطرے کی علامات",
      "roman": "Sar ki chot aur concussion — aaraam, screen se parhez aur alamaat"
    },
    "content": {
      "en": "• A concussion is a mild traumatic brain injury caused by a blow or jolt to the head, causing headache, dizziness, mild nausea, and confusion\n• REST COMPLETELY for the first 24–48 hours: avoid physical sports, running, and heavy chores\n• Limit cognitive strain: minimize screen time (smartphones, TV, video games) and bright lights\n• Apply a cold ice pack wrapped in a cloth to head bumps for 15 minutes; do NOT take aspirin or ibuprofen in first 24h (increases bleeding risk — use paracetamol)\nSEE A DOCTOR IF: Headache worsens, dizziness persists >3 days, or concentration/memory problems linger.\nEMERGENCY / GO IMMEDIATELY: Repeated vomiting (>2 times), unequal pupil sizes, worsening drowsiness / inability to awaken, seizures, fluid or blood from nose/ears, or limb weakness.",
      "ur": "• سر پر چوٹ لگنے کے بعد ہلکا چکر، سر درد، متلی اور دھندلا پن کنکشن (دماغ کا جھٹکا) کی علامات ہیں\n• پہلے 24 سے 48 گھنٹے مکمل جسمانی اور ذہنی آرام کریں: کھیل کود، بھاگ دوڑ اور وزنی کام بند کریں\n• موبائل اسکرین، ٹی وی اور کمپیوٹر کا استعمال سخت کم کریں تاکہ دماغ پر بوجھ نہ پڑے\n• چوٹ کی جگہ پر کپڑے میں لپٹی برف سے ٹکور کریں؛ پہلے 24 گھنٹے اسپرین یا بروفین ہرگز نہ لیں (پیراسیٹامول لیں)\nڈاکٹر کو دکھائیں: سر درد مسلسل رہے یا چکر 3 دن بعد بھی ٹھیک نہ ہوں\nایمرجنسی (فوراً جائیں): بار بار الٹیاں آنا، مریض کا ہوش کھونا، دورہ پڑنا، کان یا ناک سے خون/پانی بہنا، یا ایک آنکھ کی پتلی بڑی ہونا۔",
      "roman": "• Sar par chot ke baad sar dard, ulti aur chakkar aana concussion ho sakta hai\n• Pehle 2 din mukammal aaraam karein aur mobile/TV screen band rakhein\n• Chot par barf se saik karein; aspirin na lein\nDOCTOR KO DIKHAYEIN agar: sar dard barhta jaye ya chakkar aayein\nEMERGENCY (FORI JAYEIN): Baar baar ulti aana, behoshi, doray parna ya kaan/naak se khoon aana.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "concussion",
      "head injury",
      "sar par chot",
      "سر پر چوٹ",
      "سر کا جھٹکا",
      "brain injury",
      "mild tbi",
      "bump on head",
      "vomiting after head injury",
      "head trauma",
      "ghum chot",
      "dizziness after fall"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO / IFRC",
      "title": "Guidelines for essential trauma care and head injury management",
      "url": "https://www.who.int/publications/i/item/9789241546409",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "tetanus-lockjaw",
    "topic": "tetanus",
    "title": {
      "en": "Tetanus (dhanakbaad & lockjaw) — rusty wound cleaning and booster vaccine",
      "ur": "تشنج اور جبڑا بند ہونا (Tetanus) — زنگ آلود چوٹ، صفائی اور ٹاکسائیڈ ویکسین",
      "roman": "Dhanakbaad aur tetanus (lockjaw) — zang aalood zakhm aur vaccine"
    },
    "content": {
      "en": "• Tetanus is a life-threatening bacterial infection from Clostridium tetani spores found in soil, animal dung, and rusty iron entering through broken skin\n• IMMEDIATE WOUND FIRST AID: Wash puncture wounds, dirty cuts, or rusty nail injuries thoroughly with clean running water and soap for 10 minutes\n• Apply antiseptic (povidone iodine); do NOT seal puncture wounds with dirty cloths or apply dung/ashes\n• Receive a Tetanus Toxoid (TT) vaccine booster within 48 hours of injury if not vaccinated in the last 5–10 years\nSEE A DOCTOR SAME DAY: Every deep puncture wound, animal bite, or soil-contaminated cut requires medical assessment.\nEMERGENCY / GO IMMEDIATELY: Jaw muscle stiffness / lockjaw (trismus), neck stiffness, painful whole-body muscle spasms arching the back (dhanakbaad), or difficulty swallowing.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• تشنج (Tetanus) زنگ آلود لوہے، مٹی یا گوبر کے جراثیم سے زخم کے راستے جسم میں داخل ہو کر پٹھوں کو اکڑا دیتا ہے\n• ابتدائی طبی امداد: زنگ آلود یا گندے زخم کو فوری طور پر صابن اور صاف پانی سے 10 منٹ تک اچھی طرح دھوئیں\n• پائیوڈین لگائیں؛ زخم پر مٹی، راکھ، یا گوبر ہرگز نہ لگائیں\n• چوٹ لگنے کے 48 گھنٹے کے اندر اندر قریبی ہسپتال جا کر ٹیٹنس کا ٹیکہ (Tetanus Toxoid) لگوائیں\nڈاکٹر کو دکھائیں: ہر گہرے کٹ، زنگ آلود کیل یا جانور کے کاٹنے پر اسی دن ڈاکٹر کو دکھائیں\nایمرجنسی (فوراً جائیں): جبڑے کا جکڑ جانا (Lockjaw)، گردن کا اکڑنا، پورے جسم میں جھٹکے اور کمان کی طرح مڑنا (دھنک باد)۔",
      "roman": "• Tetanus zang aalood cheez ya mitti ke zakhm se phailta hai jo pathon ko akra deta hai\n• Zakhm ko foran sabun aur behate paani se 10 minute tak dhoiyein\n• Pyodine lagayein aur 48 ghante mein Tetanus ka teeka lagwayein\nDOCTOR KO DIKHAYEIN: Zang aalood keel ya gehre zakhm par usi din hospital jayein\nEMERGENCY (FORI JAYEIN): Jabra band hona (lockjaw), gardan sakht hona ya doray parna."
    },
    "tags": [
      "tetanus",
      "lockjaw",
      "dhanakbaad",
      "tashannuj",
      "تشنج",
      "دھنک باد",
      "zang aalood chot",
      "rusty nail",
      "puncture wound",
      "tetanus toxoid",
      "tt vaccine",
      "muscle spasms",
      "jaw stiffness"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": {
      "publisher": "WHO / Pakistan MoNHSRC",
      "title": "Tetanus vaccines: WHO position paper",
      "url": "https://www.who.int/news-room/fact-sheets/detail/tetanus",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "leishmaniasis-cutaneous",
    "topic": "leishmaniasis",
    "title": {
      "en": "Cutaneous leishmaniasis (sal-dana & kaal-azar) — sandfly bites, wound care and medical therapy",
      "ur": "سال دانہ اور لیشمینیاسس (Sal-dana) — ریت کی مکھی، جلد کے زخم اور علاج",
      "roman": "Sal-dana aur leishmaniasis — sandfly bite, zakhm aur medical ilaaj"
    },
    "content": {
      "en": "• Cutaneous leishmaniasis is a parasitic infection transmitted by female sandflies, causing chronic non-healing volcanic crater-like skin ulcers ('Sal-dana')\n• PREVENT SANDFLY BITES: Sleep under insecticide-treated bed nets, use mosquito repellent (DEET), and wear long-sleeved clothing in endemic areas (KP, Balochistan, rural Punjab/Sindh)\n• Keep open sores clean with mild soap and water; cover loosely with clean sterile gauze\n• DO NOT cauterize, burn, acid-treat, or apply unregulated corrosive herbal pastes to the sore\nSEE A DOCTOR IF: For slit skin smear diagnosis and specialized antimonial injections (Glucantime) directly into or around the lesion.\nEMERGENCY / GO IMMEDIATELY: Ulcers developing severe spreading bacterial cellulitis, high fever, or visceral signs (prolonged fever, huge spleen/liver, severe weight loss — Kala-azar).",
      "ur": "• سال دانہ (Leishmaniasis) ریت کی مکھی (Sandfly) کے کاٹنے سے ہوتا ہے جس سے جلد پر نہ بھرنے والا گہرا زخم بن جاتا ہے\n• مکھی سے بچاؤ: مچھر دانی کا استعمال کریں، فل بازو کے کپڑے پہنیں اور مچھر بھگاؤ لوشن لگائیں\n• زخم کو صابن اور صاف پانی سے دھو کر صاف پٹی سے ڈھانپیں\n• زخم پر تیزاب، چونہ، جلانے یا خطرناک دیسی مرہم لگانے سے سخت پرہیز کریں جس سے جلد ضائع ہو سکتی ہے\nڈاکٹر کو دکھائیں: سال دانے کے ٹیسٹ اور مخصوص ٹیکوں (Glucantime) کے لیے جلد کے ماہر ڈاکٹر کو دکھائیں\nایمرجنسی (فوراً جائیں): زخم کے گرد شدید پیپ اور سرخی پھیلنا، یا کالازار کی علامات (مسلسل بخار، تلی بڑھنا اور شدید کمزوری)۔",
      "roman": "• Sal-dana sandfly ke kaatne se hota hai jo jild par purana zakhm bana deta hai\n• Machhardani aur mosquito lotion istemal karein\n• Zakhm ko saaf rakhein; tezaab ya desi teekha marham hargiz na lagayein\nDOCTOR KO DIKHAYEIN: Glucantime injection aur sahi ilaaj ke liye skin specialist ko dikhayein\nEMERGENCY (FORI JAYEIN): Zakhm mein shadeed infection ya kaal azar ke alamaat."
    },
    "tags": [
      "leishmaniasis",
      "cutaneous leishmaniasis",
      "sal dana",
      "kal dana",
      "سال دانہ",
      "لیشمینیاسس",
      "sandfly bite",
      "non healing ulcer",
      "kaal azar",
      "makhi ka katna",
      "skin ulcer",
      "tropical ulcer"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO / Pakistan MoNHSRC",
      "title": "Control of leishmaniasis: report of a WHO expert committee",
      "url": "https://www.who.int/news-room/fact-sheets/detail/leishmaniasis",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "polio-eradication",
    "topic": "polio",
    "title": {
      "en": "Polio (poliomyelitis) — transmission, oral vaccine drops and paralysis prevention",
      "ur": "پولیو اور فالج سے بچاؤ — پولیو کے قطرے، علامات اور حفاظتی اقدامات",
      "roman": "Polio se bachao — polio drops, bachon ki hifazat aur alamaat"
    },
    "content": {
      "en": "• Polio is a highly infectious viral disease that attacks the nervous system and can cause irreversible flaccid paralysis within hours\n• POLIO HAS NO CURE, ONLY LIFELONG IMMUNIZATION: Ensure every child under 5 receives Oral Polio Vaccine (OPV) drops during every national campaign plus routine IPV injections\n• Strict hygiene: Wash hands thoroughly with soap after using toilet and before preparing food; boil all drinking water\n• Support community health teams and vaccinate all children on time without exception\nSEE A DOCTOR IF: To inspect and complete your child's routine vaccination schedule card.\nEMERGENCY / GO IMMEDIATELY: Sudden onset of floppy weakness or paralysis in a child's arm or leg (Acute Flaccid Paralysis - AFP), or difficulty swallowing and breathing.",
      "ur": "• پولیو ایک انتہائی متعدی وائرل بیماری ہے جو چند گھنٹوں میں بچے کو عمر بھر کے لیے معذور اور مفلوج کر سکتی ہے\n• پولیو کا کوئی علاج نہیں، صرف ویکسین سے بچاؤ ممکن ہے: ہر مہم میں 5 سال سے کم عمر ہر بچے کو پولیو کے قطرے (OPV) ضرور پلوائیں\n• صفائی کا خاص خیال رکھیں: ہاتھ صابن سے دھوئیں اور ابلا ہوا پانی استعمال کریں\n• حفاظتی ٹیکوں کے کورس (EPI کارڈ) کو مکمل کروائیں\nڈاکٹر کو دکھائیں: بچے کی ویکسی نیشن کارڈ کی جانچ کے لیے ڈاکٹر یا ہیلتھ ورکر سے رابطہ کریں\nایمرجنسی (فوراً جائیں): بچے کی ٹانگ یا بازو میں اچانک کمزوری، لنگڑاہٹ یا فالج ظاہر ہونا (AFP)، یا سانس لینے میں رکاوٹ۔",
      "roman": "• Polio aik khatarnak bimari hai jo bachon ko umar bhar ke liye maazoor karti hai\n• Har polio campaign mein 5 saal tak ke bache ko polio drops zaroor pilayein\n• Haath sabun se dhoiyein aur saaf ubla paani istemal karein\nDOCTOR KO DIKHAYEIN: EPI vaccination card complete karwayein aur clinic jayein\nEMERGENCY (FORI JAYEIN): Bache ki taang ya baazu mein achanak kamzori ya falij aana."
    },
    "tags": [
      "polio",
      "poliomyelitis",
      "polio drops",
      "polio ke qatray",
      "پولیو",
      "فالج سے بچاؤ",
      "opv",
      "ipv",
      "flaccid paralysis",
      "child paralysis",
      "vaccine drops",
      "polio eradication",
      "floppy limb"
    ],
    "baseLevel": "ROUTINE",
    "audience": "child",
    "source": {
      "publisher": "WHO / UNICEF / Pakistan MoNHSRC",
      "title": "Poliomyelitis eradication and routine immunization guidelines",
      "url": "https://www.who.int/news-room/fact-sheets/detail/poliomyelitis",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "rheumatoid-arthritis",
    "topic": "rheumatoid-arthritis",
    "title": {
      "en": "Rheumatoid arthritis (gathiya) — joint morning stiffness, warmth and DMARD care",
      "ur": "جوڑوں کی سوزش اور گٹھیا (Rheumatoid Arthritis) — صبح کی سختی اور دیکھ بھال",
      "roman": "Gathiya aur joron ki sozish (rheumatoid arthritis) — dekh bhaal aur ilaaj"
    },
    "content": {
      "en": "• Rheumatoid arthritis is an autoimmune condition causing symmetrical swelling, heat, pain, and morning stiffness (>1 hour) in finger, wrist, and toe joints\n• Apply warm moist compresses or take a warm morning bath to loosen stiff joints; use cold ice packs during hot acute flares\n• Perform gentle daily range-of-motion stretching exercises; balance light activity with joint rest\n• Eat anti-inflammatory foods (omega-3 fatty fish, olive oil, walnuts, lentils, greens); strictly adhere to prescribed DMARD medications to prevent joint deformities\nSEE A DOCTOR IF: For early blood tests (Rheumatoid Factor RF, Anti-CCP, ESR/CRP) and timely disease-modifying therapy.\nEMERGENCY / GO IMMEDIATELY: A single joint becomes red hot, agonizingly swollen, and immobile accompanied by high fever and chills (Septic Joint Infection).",
      "ur": "• گٹھیا (Rheumatoid Arthritis) مدافعتی نظام کی خرابی سے ہوتا ہے جس میں ہاتھوں، کلائیوں اور پیروں کے جوڑوں میں سوزش، درد اور صبح کے وقت ایک گھنٹے سے زیادہ سختی رہتی ہے\n• صبح گرم پانی سے نہائیں یا گرم ٹکور کریں تاکہ جوڑوں کی سختی کھلے؛ زیادہ سوجن کے وقت برف لگائیں\n• روزانہ انگلیوں اور جوڑوں کی ہلکی ورزشیں کریں\n• ڈاکٹر کی تجویز کردہ گٹھیا کی ادویات (DMARDs) مستقل لیں تاکہ ہڈیاں ٹیڑھی ہونے سے بچیں\nڈاکٹر کو دکھائیں: خون کے ٹیسٹ (RA Factor, Anti-CCP) اور بروقت علاج کے لیے جوڑوں کے ماہر ڈاکٹر سے رجوع کریں\nایمرجنسی (فوراً جائیں): کسی ایک جوڑ کا اچانک شدید گرم، لال، سوج جانا اور ساتھ تیز بخار ہونا (سیپٹک انفیکشن)۔",
      "roman": "• Gathiya mein haath paon ke joron mein soojan, dard aur subah sakhti hoti hai\n• Subah garam paani se saik karein aur halki warzish karein\n• Doctor ki batayi hui dawaiyan (DMARDs) musalsal lein taake jor teerhay na hon\nDOCTOR KO DIKHAYEIN: Anti-CCP aur RA factor test ke liye specialist doctor ko dikhayein\nEMERGENCY (FORI JAYEIN): Aik jor par achanak shadeed soojan, laali aur tez bukhar."
    },
    "tags": [
      "rheumatoid arthritis",
      "gathiya",
      "joron ki sozish",
      "گٹھیا",
      "جوڑوں کا درد",
      "joint stiffness",
      "morning stiffness",
      "swollen fingers",
      "autoimmune arthritis",
      "anti ccp",
      "dmards",
      "symmetric arthritis"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Musculoskeletal conditions: rheumatoid arthritis management",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "frozen-shoulder",
    "topic": "frozen-shoulder",
    "title": {
      "en": "Frozen shoulder (adhesive capsulitis) — stages, gentle stretching and pendulum exercises",
      "ur": "کندھے کا جام ہونا (Frozen Shoulder) — نرم ورزشیں اور حرکت کی بحالی",
      "roman": "Kandhay ka jamna (frozen shoulder) — aaraam, pendulum warzish aur ilaaj"
    },
    "content": {
      "en": "• Frozen shoulder causes severe stiffness and pain that gradually limits arm movement in all directions, common in diabetes and after arm immobilization\n• Perform gentle daily pendulum exercises: lean forward, let affected arm dangle loose, and swing it in small gentle circles\n• Do gentle wall-climbing finger stretches: walk fingers up a wall to stretch shoulder overhead without forcing sharp pain\n• Apply warm moist heat for 15 minutes before stretching to relax the stiff shoulder capsule; take simple paracetamol for pain\nSEE A DOCTOR IF: For guided rehabilitation, targeted physical therapy, or anti-inflammatory treatment.\nEMERGENCY / GO IMMEDIATELY: Sudden severe shoulder pain radiating down the left arm, jaw, or chest with sweating and breathlessness (Heart Attack warning).",
      "ur": "• فروزن شولڈر میں کندھے کا جوڑ جام ہو جاتا ہے اور ہاتھ اوپر یا پیچھے لے جانا ناممکن ہو جاتا ہے، خاص کر شوگر کے مریضوں میں\n• پینڈولم ورزش کریں: آگے جھک کر کندھے کو ڈھیلا چھوڑیں اور بازو کو دائرے میں ہلائیں\n• انگلیوں کو دیوار پر اوپر چڑھانے والی ہلکی اسٹریچنگ کریں\n• ورزش سے پہلے 15 منٹ گرم ٹکور کریں تاکہ پٹھے نرم ہوں؛ زبردستی جھٹکا مت دیں\nڈاکٹر کو دکھائیں: فزیوتھراپی اور حرکت کی بحالی کے لیے ڈاکٹر سے رہنمائی لیں\nایمرجنسی (فوراً جائیں): بائیں کندھے میں اچانک شدید درد جو سینے، جبڑے اور بازو میں پھیلے اور ساتھ پسینے آئیں (ہارٹ اٹیک)۔",
      "roman": "• Frozen shoulder mein kandha jam jata hai aur baazu oopar uthana mushkil hota hai\n• Pendulum exercise karein: aagay jhuk kar baazu ko aahista gol ghumayein\n• Deewar par ungliyan oopar le jane wali stretch karein aur garam saik karein\nDOCTOR KO DIKHAYEIN: Physiotherapy ke liye doctor se mashwara karein\nEMERGENCY (FORI JAYEIN): Baen kandhay ka dard jo seene ya jabray mein jaye (Heart Attack)."
    },
    "tags": [
      "frozen shoulder",
      "adhesive capsulitis",
      "kandha jam hona",
      "kandhay ka dard",
      "کندھے کا جام ہونا",
      "کندھے کا درد",
      "shoulder stiffness",
      "arm lifting pain",
      "pendulum exercise",
      "rotator cuff",
      "shoulder mobility"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Rehabilitation in primary care: shoulder disorders",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "carpal-tunnel",
    "topic": "carpal-tunnel",
    "title": {
      "en": "Carpal tunnel syndrome — wrist splinting, nerve relief and ergonomics",
      "ur": "کلائی میں نس کا دباؤ (Carpal Tunnel) — انگلیوں کا سن ہونا اور کلائی کی دیکھ بھال",
      "roman": "Kalaai me nas ka dabao (carpal tunnel) — haath sunn hona aur ilaaj"
    },
    "content": {
      "en": "• Carpal tunnel syndrome occurs when the median nerve is compressed at the wrist, causing numbness, tingling, and pain in thumb, index, and middle fingers\n• WEAR A NEUTRAL WRIST SPLINT: Wear a rigid wrist brace at night to keep wrist straight during sleep and prevent nerve pinching\n• Take regular 5-minute rest breaks during repetitive hand tasks (typing, phone texting, chopping, stitching)\n• Adjust workplace ergonomics so forearms and wrists rest parallel to the floor without resting on sharp desk edges\nSEE A DOCTOR IF: Numbness becomes constant or thumb grip weakens (dropping glasses/pens).\nEMERGENCY / GO IMMEDIATELY: Sudden complete loss of hand sensation and power following wrist trauma or severe swelling.",
      "ur": "• کارپل ٹنل میں کلائی کے اندر نس دبنے سے انگوٹھے، شہادت اور درمیانی انگلی میں سوئیاں چبھتی ہیں، جلن اور سن پن ہوتا ہے\n• رات کو سوتے وقت کلائی پر اسپلنٹ (Wrist brace) باندھیں تاکہ کلائی مڑے نہیں اور نس پر دباؤ نہ پڑے\n• کمپیوٹر ٹائپنگ، سلائی یا موبائل کے زیادہ استعمال کے دوران ہر آدھے گھنٹے بعد ہاتھوں کو آرام دیں\n• کلائی کو سیدھا رکھیں اور تیز رگڑ سے بچائیں\nڈاکٹر کو دکھائیں: انگلیوں میں سن پن مستقل ہو جائے یا ہاتھ سے چیزیں چھوٹنے لگیں\nایمرجنسی (فوراً جائیں): کسی چوٹ یا سوجن کے بعد ہاتھ کا اچانک بالکل بے حس یا مفلوج ہو جانا۔",
      "roman": "• Carpal tunnel mein kalaai ki nas dabne se ungliyan sunn hoti hain aur suiyan chubhti hain\n• Raat ko wrist splint pehnein taake kalaai seedhi rahe\n• Typing ya phone istemal ke doran haathon ko waqfa dein\nDOCTOR KO DIKHAYEIN agar: ungliyon ka sunn pan musalsal rahe ya pakar kamzor ho\nEMERGENCY (FORI JAYEIN): Chot ke baad achanak pura haath be-hiss ho jana.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "carpal tunnel",
      "carpal tunnel syndrome",
      "kalaai me dard",
      "haath sunn hona",
      "median nerve",
      "کلائی میں درد",
      "کارپل ٹنل",
      "thumb tingling",
      "typing pain wrist",
      "wrist brace",
      "nerve compression"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Musculoskeletal and occupational disorders: nerve entrapment syndromes",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "psoriasis-care",
    "topic": "psoriasis",
    "title": {
      "en": "Psoriasis & silvery skin plaques — moisturizing, sun exposure and flare care",
      "ur": "چنبل اور چاندنی چھلکے (Psoriasis) — جلد کی نمی، دھوپ اور دیکھ بھال",
      "roman": "Psoriasis (chambal) — chandi jaise chhilkay, nami aur dekh bhaal"
    },
    "content": {
      "en": "• Psoriasis is an autoimmune skin condition causing raised red plaques covered with thick silvery-white scales, commonly on elbows, knees, scalp, and back\n• Keep skin deeply moisturized: apply thick petroleum jelly or fragrance-free emollient cream within 3 minutes after bathing to lock in moisture\n• Take short lukewarm baths; moderate brief sunlight exposure (10–15 min) helps improve plaques\n• Avoid picking, peeling, or harsh scratching of scales which triggers new plaques (Koebner phenomenon); avoid smoking and stress\nSEE A DOCTOR IF: For prescription topical treatments (vitamin D analogues, topical corticosteroids, keratolytics) or systemic therapy.\nEMERGENCY / GO IMMEDIATELY: Sudden widespread fiery redness and peeling covering >80% of body (erythrodermic psoriasis) or generalized pus-filled blisters with high fever.",
      "ur": "• پسوریاسس (چنبل) میں جلد پر سرخ ابھرے ہوئے نشان بنتے ہیں جن پر چاندی جیسے سفید چھلکے اترتے ہیں، خاص طور پر کہنیوں، گھٹنوں اور سر پر\n• جلد کی نمی بحال رکھیں: نہانے کے فوراً بعد ویزلین یا موٹی موئسچرائزنگ کریم لگائیں\n• نیم گرم پانی سے نہائیں؛ روزانہ 10-15 منٹ ہلکی دھوپ لینا چھلکوں کو کم کرتا ہے\n• چھلکوں کو ناخن سے ہرگز مت نوچیں کیونکہ نوچنے سے زخم اور نیا دانہ بنتا ہے (Koebner)\nڈاکٹر کو دکھائیں: جلد کے ماہر ڈاکٹر (Dermatologist) سے مخصوص مرہم اور علاج کے لیے رجوع کریں\nایمرجنسی (فوراً جائیں): اگر پورے جسم پر آگ جیسی سرخی اور چھلکے پھیل جائیں یا چھالوں میں پیپ کے ساتھ تیز بخار ہو۔",
      "roman": "• Psoriasis mein jild par laal nishan bante hain jin par chandi jaise safeed chhilkay aate hain\n• Nahanay ke baad foran vaseline lagayein taake nami barqrar rahe\n• Chhilkon ko hargiz na nochain aur dhoop lein\nDOCTOR KO DIKHAYEIN: Specialist doctor se skin ointment aur prescription ilaaj lein\nEMERGENCY (FORI JAYEIN): Pure jism par aag jaisi laali phailna ya bukhar aana."
    },
    "tags": [
      "psoriasis",
      "silvery scales",
      "chandi jaise chhilkay",
      "چنبل",
      "پسوریاسس",
      "red skin plaques",
      "elbow rash",
      "scalp psoriasis",
      "skin scaling",
      "emollient",
      "thick dry skin",
      "koebner"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Global report on psoriasis",
      "url": "https://www.who.int/publications/i/item/9789241565189",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "melasma-chloasma",
    "topic": "melasma",
    "title": {
      "en": "Melasma & dark facial patches (jhainiyan) — strict sun protection and skincare",
      "ur": "چہرے کی چھائیاں اور جھائیاں (Melasma) — دھوپ سے بچاؤ، احتیاط اور علاج",
      "roman": "Chehre ki jhainiyan aur chhayian (melasma) — dhoop se bachao aur dekh bhaal"
    },
    "content": {
      "en": "• Melasma causes brown or grey-brown hyperpigmented patches on cheeks, forehead, nose bridge, and upper lip, worsened by sunlight and hormones\n• BROAD-SPECTRUM SUN PROTECTION IS ESSENTIAL: Apply SPF 50+ sunscreen every 2–3 hours when outdoors, wear a wide-brimmed hat, and carry an umbrella\n• Avoid harsh unverified fairness/bleaching creams containing illegal mercury or high-potency steroids which cause permanent skin thinning and dark rebound ochronosis\n• Use gentle, fragrance-free facial cleansers; avoid vigorous scrubbing\nSEE A DOCTOR IF: For safe prescription brightening agents (azelaic acid, topical retinoids, tranexamic acid, vitamin C).\nEMERGENCY / GO IMMEDIATELY: A dark skin mole that rapidly changes in size, irregular borders, multiple colors, or begins bleeding (must rule out melanoma).",
      "ur": "• چہرے پر جھائیاں اور چھائیاں (Melasma) دھوپ، ہارمونز کی تبدیلی یا حمل کے دوران گالوں، ماتھے اور ناک پر براؤن دھبوں کی شکل میں ہوتی ہیں\n• دھوپ سے سخت بچاؤ کریں: روزانہ SPF 50 سن بلاک لگائیں، چھتری استعمال کریں اور دوپہر کی دھوپ سے بچیں\n• سستی رنگ گورا کرنے والی کیمیکل اور اسٹیرائڈ کریموں سے سخت پرہیز کریں جو جلد کو جلا اور پتلا کر دیتی ہیں\n• ہلکے فیس واش سے چہرہ دھوئیں اور رگڑنے سے گریز کریں\nڈاکٹر کو دکھائیں: جلد کے ڈاکٹر سے محفوظ اور تصدیق شدہ دوا (Azelaic acid) کے لیے مشورہ کریں\nایمرجنسی (فوراً جائیں): چہرے پر کوئی تل یا کالا نشان جو اچانک تیزی سے بڑھے، رنگ بدلے یا خون نکلے۔",
      "roman": "• Chehre ki jhainiyan dhoop aur hormonal tabdeeli se gaalon aur maathay par banti hain\n• Rozana SPF 50 sunblock lagayein aur dhoop se bachein\n• Steroid wali gora karne wali creamon se sakht parhez karein\nDOCTOR KO DIKHAYEIN: Dermatologist doctor se safe ilaaj karwayein\nEMERGENCY (FORI JAYEIN): Koi til ya daagh achanak barhay ya khoon nikalay."
    },
    "tags": [
      "melasma",
      "chloasma",
      "jhainiyan",
      "chhayian",
      "چھائیاں",
      "جھائیاں",
      "dark facial spots",
      "hyperpigmentation",
      "sun spots",
      "pregnancy mask",
      "sunscreen spf",
      "skin brightening",
      "chehre ke daagh"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Primary dermatology and skin health guidance",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "cellulitis-infection",
    "topic": "cellulitis",
    "title": {
      "en": "Cellulitis & spreading skin infection — recognizing bacterial infection and emergency signs",
      "ur": "جلد کا شدید بیکٹیریل انفیکشن (Cellulitis) — سرخی، سوجن اور اینٹی بائیوٹک کی ضرورت",
      "roman": "Jild ka shadeed infection (cellulitis) — soojan, laali aur fori ilaaj"
    },
    "content": {
      "en": "• Cellulitis is a serious, deep bacterial skin infection commonly affecting the lower legs after a cut, scratch, crack, or insect bite\n• PROMPT MEDICAL EVALUATION IS REQUIRED: Cellulitis requires prescription oral or intravenous antibiotics from a doctor\n• Draw a clean pen line around the red border to track whether infection is spreading\n• Keep the affected limb elevated on pillows above heart level to reduce swelling, throbbing, and pain\nSEE A DOCTOR SAME DAY: Any rapidly expanding area of warm, red, tender, swollen skin, especially on lower legs or face.\nEMERGENCY / GO IMMEDIATELY: Redness spreading rapidly within hours, red streaks travelling up the leg, high fever with shaking chills, skin blistering or turning purple/black, or confusion.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• سیلولائٹس (Cellulitis) جلد کا خطرناک اور گہرا بیکٹیریل انفیکشن ہے جو کٹ، رگڑ یا کیڑے کے کاٹنے کے بعد ٹانگ پر تیزی سے پھیلتا ہے\n• ڈاکٹر سے فوری اینٹی بائیوٹک لینا ضروری ہے — گھریلو ٹوٹکوں میں وقت ضائع نہ کریں\n• سرخی کے گرد پین سے دائرہ لگا لیں تاکہ معلوم ہو سکے کہ انفیکشن پھیل رہا ہے یا رک گیا ہے\n• متاثرہ ٹانگ کو تکیے پر اونچا رکھیں تاکہ سوجن اور درد کم ہو\nڈاکٹر کو دکھائیں: جلد پر لال، گرم اور سوجی ہوئی جگہ بننے پر اسی دن ڈاکٹر کو دکھائیں\nایمرجنسی (فوراً جائیں): سرخی کا تیزی سے اوپر پھیلنا، لال دھاریاں بننا، کپکپی کے ساتھ تیز بخار، یا جلد کالی پڑنا۔",
      "roman": "• Cellulitis jild ka gehra infection hai jo taang par laali aur shadeed sujan peda karta hai\n• Usi din doctor ko dikha kar antibiotic shuru karein\n• Laali ke gird pen se nishan lagayein aur taang ko ooncha rakhein\nDOCTOR KO DIKHAYEIN: Laal garam sujan par foran doctor ke paas jayein\nEMERGENCY (FORI JAYEIN): Laali tezi se phailna, tez bukhar aur kapkapi aana."
    },
    "tags": [
      "cellulitis",
      "skin infection",
      "jild ki sujan",
      "سرخ جلد",
      "سیلولائٹس",
      "spreading redness",
      "red streaks",
      "hot swollen leg",
      "bacterial infection",
      "deep skin infection",
      "leg cellulitis"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Community dermatology and bacterial skin infection management",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "warts-hpv",
    "topic": "warts",
    "title": {
      "en": "Warts & skin verrucas (masse & mohkay) — hygiene, safe care and transmission prevention",
      "ur": "مسے اور موہکے (Warts) — وجوہات، گھریلو دیکھ بھال اور پھیلنے سے بچاؤ",
      "roman": "Masse aur mohkay (warts) — safai, dekh bhaal aur bachao"
    },
    "content": {
      "en": "• Warts are harmless non-cancerous rough skin growths caused by Human Papillomavirus (HPV), common on fingers, hands, and soles of feet (plantar warts)\n• DO NOT PICK, CUT, OR CLIP WARTS with nail clippers, blades, or scissors — this spreads the virus to other areas and causes serious bacterial infection\n• Keep warts clean and dry; wash hands thoroughly after touching\n• Wear flip-flops in public showers, gym locker rooms, and swimming pools to prevent catching or spreading foot warts; do NOT share towels or socks\nSEE A DOCTOR IF: For painful, bleeding, rapidly spreading warts (treatable with cryotherapy freezing, salicylic acid, or minor procedure).\nEMERGENCY / GO IMMEDIATELY: Warts in the genital/anal area, rapidly bleeding growths, or rapidly growing pigmented lesions in immunocompromised persons.",
      "ur": "• مسے اور موہکے (Warts) وائرل انفیکشن کی وجہ سے جلد پر ابھرتے ہیں جو ہاتھوں، انگلیوں اور پاؤں کے تلووں پر عام ہوتے ہیں\n• مسوں کو بلیڈ، قینچی یا نیل کٹر سے ہرگز مت کاٹیں اور نہ چھیڑیں — اس سے وائرس باقی جسم پر پھیلتا ہے اور زخم بنتا ہے\n• اپنے ہاتھ صابن سے دھوئیں اور تولیہ، جرابیں یا جوتے کسی سے شیئر نہ کریں\n• پبلک باتھ روم اور سوئمنگ پول میں چپل پہنیں تاکہ پاؤں کے مسوں سے بچا جا سکے\nڈاکٹر کو دکھائیں: اگر مسے میں درد ہو، خون آئے، یا تعداد بڑھ رہی ہو تو ڈاکٹر کو دکھائیں\nایمرجنسی (فوراً جائیں): شرمگاہ کے مسے یا مسے سے مسلسل خون بہنا۔",
      "roman": "• Masse (warts) viral infection se haath aur paon par bante hain\n• Masson ko blade ya cutter se hargiz na kaatein kyunke yeh phailte hain\n• Haath saaf rakhein aur apna tauliya alag rakhein\nDOCTOR KO DIKHAYEIN: Dard ya barhne par skin specialist doctor se cryotherapy karwayein\nEMERGENCY (FORI JAYEIN): Musalsal khoon aana ya sharamgah par masse hona."
    },
    "tags": [
      "warts",
      "verruca",
      "masse",
      "mohkay",
      "مسے",
      "موہکے",
      "skin growths",
      "hpv warts",
      "plantar wart",
      "hand warts",
      "foot verruca",
      "masa",
      "chhalni"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Human papillomavirus and superficial viral skin conditions",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "chronic-kidney-disease",
    "topic": "ckd",
    "title": {
      "en": "Chronic Kidney Disease (CKD) — early signs, blood pressure control and renal protection",
      "ur": "گردے کی پرانی بیماری (CKD) — علامات، بلڈ پریشر، شوگر اور پرہیز",
      "roman": "Gurday ki purani bimari (CKD) — alamaat, BP aur parhez"
    },
    "content": {
      "en": "• Chronic kidney disease is the gradual, progressive loss of kidney filtering capacity, primarily caused by uncontrolled diabetes and hypertension\n• Strictly control BP (<130/80 mmHg) and blood glucose (HbA1c <7%); reduce dietary sodium/salt (<2 g/day)\n• Avoid high-protein excess diets and stop smoking\n• NEVER TAKE REGULAR OVER-THE-COUNTER NSAID PAINKILLERS (diclofenac, ibuprofen, meloxicam) which directly damage nephron filters; check serum creatinine, eGFR, and urine protein regularly\nSEE A DOCTOR IF: For staging CKD, managing anemia, and adjusting kidney-safe medications.\nEMERGENCY / GO IMMEDIATELY: Complete cessation of urination (anuria), severe breathlessness while lying flat (pulmonary fluid overload), persistent vomiting with ammonia breath odor, severe confusion, or seizures (uremia).",
      "ur": "• گردے کی پرانی بیماری (CKD) میں گردوں کے فلٹر آہستہ آہستہ کام چھوڑ دیتے ہیں، جس کی بڑی وجہ شوگر اور ہائی بلڈ پریشر ہے\n• بلڈ پریشر اور شوگر کو سختی سے قابو میں رکھیں اور نمک کم کریں (<2 گرام روزانہ)\n• درد کش گولیوں (ڈیکلوفینیک، بروفین) کے بے دریغ استعمال سے سخت پرہیز کریں جو گردوں کو تباہ کرتی ہیں (پیراسیٹامول محفوظ ہے)\n• باقاعدگی سے سیرم کریٹینین اور پیشاب میں پروٹین کا ٹیسٹ کروائیں\nڈاکٹر کو دکھائیں: گردوں کے ماہر ڈاکٹر (Nephrologist) سے باقاعدہ معائنہ اور ادویات کی ایڈجسٹمنٹ کروائیں\nایمرجنسی (فوراً جائیں): پیشاب کا بالکل بند ہو جانا، لیٹنے پر شدید دم گھٹنا، الٹیاں اور منہ سے پیشاب جیسی بو آنا، یا بےہوشی۔",
      "roman": "• CKD mein gurday aahista aahista kamzor hote hain jis ki wajah sugar aur high BP hai\n• BP aur sugar control rakhein aur namak kam karein\n• Brufen aur painkiller se sakht parhez karein jo gurdy tabah karti hain\nDOCTOR KO DIKHAYEIN: Creatinine aur urine test ke sath specialist doctor ko dikhayein\nEMERGENCY (FORI JAYEIN): Paishab bilkul band hona, saans phoolna ya behoshi."
    },
    "tags": [
      "ckd",
      "chronic kidney disease",
      "gurday ki bimari",
      "گردے کی بیماری",
      "renal failure",
      "creatinine high",
      "egfr",
      "kidney damage",
      "swollen ankles kidney",
      "protein in urine",
      "uremia"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Prevention and control of chronic kidney disease",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "hematuria-blood-urine",
    "topic": "hematuria",
    "title": {
      "en": "Blood in urine (hematuria) — causes, investigation and urgent medical testing",
      "ur": "پیشاب میں خون آنا (Hematuria) — اسباب، لیبارٹری ٹیسٹ اور رہنمائی",
      "roman": "Peshab me khoon aana (hematuria) — asbaab aur zaroori test"
    },
    "content": {
      "en": "• Hematuria is the presence of red blood cells in urine, making it look pink, red, or cola-colored\n• NEVER IGNORE BLOOD IN URINE even if it only happens once and disappears without pain\n• Stay well hydrated by drinking 2.5–3 liters of clean water daily\n• Avoid strenuous heavy lifting until assessed; get an urgent complete urine examination (Urine R/E) and renal ultrasound\nSEE A DOCTOR IF: To identify the source (urinary tract infection, kidney stones, bladder lesion, or enlarged prostate).\nEMERGENCY / GO IMMEDIATELY: Inability to pass urine due to blood clots blocking the urethra (painful acute retention), severe flank pain with vomiting and fever, or following severe blunt abdominal/kidney trauma.",
      "ur": "• پیشاب میں خون آنا (ہیمیچوریا) پیشاب کی نالی میں انفیکشن، گردے کی پتھری، پروسٹیٹ، یا مثانے کی خرابی کی علامت ہے\n• پیشاب میں خون کو کبھی نظر انداز نہ کریں چاہے یہ بغیر درد کے ایک بار ہی کیوں نہ آیا ہو\n• روزانہ ڈھائی سے 3 لیٹر صاف پانی پئیں تاکہ نالی صاف رہے\n• پیشاب کا تفصیلی ٹیسٹ (Urine R/E) اور الٹراساؤنڈ کروائیں\nڈاکٹر کو دکھائیں: پیشاب میں سرخی یا خون آنے پر اسی دن یورولوجسٹ یا ڈاکٹر کو دکھائیں\nایمرجنسی (فوراً جائیں): خون کے لوتھڑوں کی وجہ سے پیشاب کا رک جانا، پہلو میں شدید درد کے ساتھ بخار، یا چوٹ کے بعد خون آنا۔",
      "roman": "• Paishab mein khoon aana infection, pathri ya rasoli ki alamat ho sakta hai\n• Ise kabhi nazar-andaz na karein chahe dard na bhi ho\n• Paani khoob piyein aur Urine R/E test karwayein\nDOCTOR KO DIKHAYEIN: Usi din urologist doctor ko dikhayein\nEMERGENCY (FORI JAYEIN): Paishab bilkul band ho jaye ya clot phans jaye."
    },
    "tags": [
      "hematuria",
      "blood in urine",
      "peshab me khoon",
      "پیشاب میں خون",
      "red urine",
      "cola colored urine",
      "urine bleeding",
      "bladder bleeding",
      "kidney bleeding",
      "peshab me laali"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Primary urological guidelines: hematuria diagnosis",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "hydrocele-testicular",
    "topic": "hydrocele",
    "title": {
      "en": "Hydrocele & scrotal swelling — recognition, care and medical examination",
      "ur": "فوطوں میں پانی بھرنا (Hydrocele) — سوجن، احتیاط اور ڈاکٹر سے معائنہ",
      "roman": "Fauton me paani bharna (hydrocele) — sujan aur dekh bhaal"
    },
    "content": {
      "en": "• A hydrocele is a painless accumulation of clear fluid around the testicle, causing swelling of one or both sides of the scrotum\n• Wear a snug supportive athletic supporter or briefs to reduce heavy dragging discomfort\n• Avoid heavy lifting and strenuous straining\n• NEVER ATTEMPT TO DRAIN OR PIERCE THE SCROTUM WITH A NEEDLE AT HOME (causes catastrophic infection and bleeding)\nSEE A DOCTOR IF: For scrotal ultrasound and physical transillumination to rule out testicular hernia or tumor and plan safe minor surgery if large.\nEMERGENCY / GO IMMEDIATELY: Sudden agonizingly severe testicular pain, rapid swelling, nausea, and vomiting (Testicular Torsion — a surgical emergency requiring operation within 6 hours).",
      "ur": "• ہائیڈروسیل میں فوطوں کی تھیلی میں پانی بھر جاتا ہے جس سے ایک یا دونوں طرف سوجن ہو جاتی ہے لیکن عام طور پر درد نہیں ہوتا\n• تنگ انڈرویئر یا سپورٹر پہنیں تاکہ بوجھ کا احساس کم ہو\n• وزنی بوجھ اٹھانے سے پرہیز کریں\n• گھر پر سوئی یا ٹیکے سے پانی نکالنے کی ہرگز کوشش نہ کریں (اس سے خطرناک انفیکشن اور خون بہہ سکتا ہے)\nڈاکٹر کو دکھائیں: الٹراساؤنڈ کروانے اور ہرنیا یا رسولی کو خارج از امکان قرار دینے کے لیے سرجن یا ڈاکٹر کو دکھائیں\nایمرجنسی (فوراً جائیں): فوطے میں اچانک ناقابل برداشت شدید درد، الٹی اور سوجن (ٹیسٹیکولر ٹارشن — 6 گھنٹے میں ایمرجنسی آپریشن ضروری ہوتا ہے)۔",
      "roman": "• Hydrocele mein fauton ke gird paani jama hone se sujan hoti hai\n• Supporter pehnein aur wazan na uthayein\n• Sui se paani nikalne ki koshish hargiz na karein\nDOCTOR KO DIKHAYEIN: Ultrasound aur doctor ke checkup ke liye jayein\nEMERGENCY (FORI JAYEIN): Fautay mein achanak intehai shadeed dard aur ulti (Torsion)."
    },
    "tags": [
      "hydrocele",
      "scrotal swelling",
      "fauton me sujan",
      "فوطوں میں سوجن",
      "testicular swelling",
      "scrotum fluid",
      "painless testicular swelling",
      "hydrocele bacha",
      "testicle lump",
      "testicular torsion"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Urological and male reproductive health guidance",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "morning-sickness",
    "topic": "morning-sickness",
    "title": {
      "en": "Morning sickness & pregnancy nausea — dietary remedies and dehydration warning",
      "ur": "حمل میں متلی اور الٹیاں (Morning Sickness) — غذائی تدابیر اور دیکھ بھال",
      "roman": "Hamal me ulti aur matli (morning sickness) — gharelu nuskhe aur parhez"
    },
    "content": {
      "en": "• Pregnancy nausea and vomiting ('morning sickness') is common in the 1st trimester due to hormonal surges\n• Eat small, frequent dry meals throughout the day (crackers, dry toast, boiled rice) instead of large heavy meals\n• Keep dry plain biscuits by your bed and eat one before getting up in the morning\n• Sip ginger water or sniff fresh lemon slices to soothe nausea; drink fluids between meals rather than with meals\nSEE A DOCTOR IF: Inability to keep any fluids or food down for >24 hours, losing weight, or severe dizziness (Hyperemesis Gravidarum).\nEMERGENCY / GO IMMEDIATELY: Signs of severe dehydration (no urine for >8 hours, dark brown urine, fainting), vomiting blood, or severe abdominal pain.",
      "ur": "• حمل کے ابتدائی 3 مہینوں میں متلی اور الٹی آنا عام ہے جو ہارمونز کے بڑھنے سے ہوتا ہے\n• دن میں 3 بڑے کھانوں کے بجائے تھوڑا تھوڑا کر کے 5-6 بار خشک غذا لیں (رس، خشک ٹوسٹ، ابلے چاول)\n• صبح بستر سے اٹھنے سے پہلے خشک بسکٹ یا رس کھائیں\n• ادرک کا قہوہ یا لیموں کا رس متلی میں آرام دیتا ہے؛ کھانا کھاتے وقت پانی نہ پئیں بلکہ کھانے کے درمیان پئیں\nڈاکٹر کو دکھائیں: 24 گھنٹے تک پانی بھی پیٹ میں نہ ٹھہرے، وزن گر رہا ہو، یا شدید کمزوری ہو (Hyperemesis)\nایمرجنسی (فوراً جائیں): 8 گھنٹے پیشاب نہ آنا، چکر آ کر گر جانا، الٹی میں خون آنا، یا پیٹ میں شدید درد۔",
      "roman": "• Hamal ke shuru mein ulti aur matli aana morning sickness kehlata hai\n• Thora thora kar ke khayein: sookha toast, rus aur ublay chawal lein\n• Subah uthne se pehle biscuit khayein aur adrak ka qehwa piyein\nDOCTOR KO DIKHAYEIN agar: paani bilkul na thehre ya wazan kam ho\nEMERGENCY (FORI JAYEIN): Peshab bilkul band hona, behoshi ya ulti mein khoon.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "morning sickness",
      "pregnancy nausea",
      "hamal me ulti",
      "حمل میں الٹی",
      "matli hamal",
      "hyperemesis gravidarum",
      "nausea pregnancy",
      "ginger for nausea",
      "first trimester vomiting"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "maternal",
    "source": {
      "publisher": "WHO",
      "title": "WHO recommendations on antenatal care for a positive pregnancy experience: common symptoms",
      "url": "https://www.who.int/publications/i/item/9789241549912",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "preeclampsia-warning",
    "topic": "preeclampsia",
    "title": {
      "en": "Preeclampsia & high blood pressure in pregnancy — danger signs and emergency care",
      "ur": "حمل میں ہائی بلڈ پریشر (Preeclampsia) — خطرے کی علامات اور فوری ہنگامی اقدامات",
      "roman": "Hamal me high BP (preeclampsia) — khatray ki alamaat aur fori hospital"
    },
    "content": {
      "en": "• Preeclampsia is a serious pregnancy disorder marked by high blood pressure (>140/90 mmHg) and protein in urine developing after 20 weeks\n• Attend all scheduled antenatal checkups to monitor BP and urine protein regularly\n• Rest on your left side to maximize blood and oxygen flow to the placenta and baby\n• NEVER IGNORE SEVERE HEADACHES OR VISION BLURRING in the second half of pregnancy\nSEE A DOCTOR IF: New high blood pressure reading or sudden rapid swelling of face, hands, and eyelids.\nEMERGENCY / GO IMMEDIATELY: Severe persistent headache not relieved by paracetamol, visual disturbances (flashing lights, spots, blurring), severe pain under right ribs/upper abdomen, difficulty breathing, or convulsions/fits (Eclampsia).",
      "ur": "• حمل کے 20 ہفتے بعد بلڈ پریشر کا بڑھنا (140/90 سے اوپر) اور پیشاب میں پروٹین آنا پری ایکلیمپسیا کہلاتا ہے جو جان لیوا ہو سکتا ہے\n• تمام اینٹی نیٹل چیک اپ باقاعدگی سے کروائیں اور بی پی چیک کروائیں\n• بائیں کروٹ پر لیٹیں تاکہ بچے اور آنول کو خون کی فراہمی بہتر رہے\n• حمل کے دوران شدید سر درد، آنکھوں کے آگے اندھیرا آنے کو کبھی نظر انداز نہ کریں\nڈاکٹر کو دکھائیں: چہرے، ہاتھوں اور پلکوں پر اچانک سوجن یا بی پی بڑھنے پر اسی دن ڈاکٹر کے پاس جائیں\nایمرجنسی (فوراً جائیں): شدید سر درد، آنکھوں کے آگے چنگاریاں یا دھندلا پن، پسلیوں کے نیچے دائیں طرف شدید درد، یا جھٹکے/دورے پڑنا (ایکلیمپسیا)۔",
      "roman": "• Hamal mein BP barhna (preeclampsia) maa aur bachay dono ke liye khatarnak hai\n• Regular antenatal checkup karwayein aur baen karwat lait kar aaraam karein\n• Sar dard aur nazar dhundli hone par foran doctor ko batayein\nDOCTOR KO DIKHAYEIN: Chehre par achanak sujan ya BP high hone par usi din clinic jayein\nEMERGENCY (FORI JAYEIN): Shadeed sar dard, aankhon ke aagay andhera, pasli ke neechay dard ya doray parna."
    },
    "tags": [
      "preeclampsia",
      "hamal me bp",
      "high blood pressure pregnancy",
      "پری ایکلیمپسیا",
      "حمل میں بی پی",
      "protein urine pregnancy",
      "swollen face pregnancy",
      "eclampsia",
      "pregnancy danger signs"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "maternal",
    "source": {
      "publisher": "WHO / Pakistan MoNHSRC",
      "title": "WHO recommendations for prevention and treatment of pre-eclampsia and eclampsia",
      "url": "https://www.who.int/publications/i/item/9789241548335",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "gestational-diabetes",
    "topic": "gestational-diabetes",
    "title": {
      "en": "Gestational diabetes (hamal ki sugar) — blood glucose control, diet and baby health",
      "ur": "حمل کی شوگر (Gestational Diabetes) — بلڈ شوگر، خوراک اور بچے کی حفاظت",
      "roman": "Hamal ki sugar (gestational diabetes) — parhez, glucose control aur dekh bhaal"
    },
    "content": {
      "en": "• Gestational diabetes is elevated blood sugar diagnosed during pregnancy that can cause excessive fetal weight (macrosomia) and birth complications\n• Manage blood sugar through structured meal planning: eliminate white sugar, sweet mithai, soft drinks, and refined bakery flour\n• Base meals on whole grains (chakki roti), lentils, leafy vegetables, salads, and healthy lean proteins across 3 balanced meals and 2 small snacks\n• Walk for 20–30 minutes daily after meals; monitor blood glucose levels (fasting and 2 hours post-meals) as prescribed\nSEE A DOCTOR IF: For regular glucose profiling, fetal growth ultrasound scans, and insulin therapy if diet alone does not meet targets.\nEMERGENCY / GO IMMEDIATELY: Greatly reduced or absent fetal movements, severe abdominal pain, persistent vomiting, or rapid deep breathing with fruity breath.",
      "ur": "• حمل کے دوران شوگر بڑھنے کو Gestational Diabetes کہتے ہیں، جس سے بچہ ضرورت سے زیادہ بڑا ہو سکتا ہے اور زچگی میں پیچیدگی ہوتی ہے\n• میٹھی چیزیں، مٹھائی، کولڈ ڈرنکس اور سفید آٹے سے مکمل پرہیز کریں\n• چکی کے آٹے کی روٹی، دالیں، کچی سبزیاں اور سلاد زیادہ کھائیں اور کھانا وقت پر لیں\n• کھانے کے بعد 20-30 منٹ ہلکی واک کریں اور گلوکو میٹر سے شوگر باقاعدگی سے چیک کریں\nڈاکٹر کو دکھائیں: شوگر کی مانیٹرنگ اور بچے کے الٹراساؤنڈ کے لیے ڈاکٹر سے مسلسل رابطے میں رہیں\nایمرجنسی (فوراً جائیں): بچے کی حرکت کا اچانک بہت کم یا بند ہو جانا، پیٹ میں شدید درد، یا مسلسل الٹیاں۔",
      "roman": "• Hamal ki sugar se bachay ka wazan zyada barh sakta hai aur delivery mein mushkil hoti hai\n• Meethi cheezon, cold drinks aur bakery se parhez karein\n• Chakki ki roti, daalein aur sabziyan khayein aur rozana walk karein\nDOCTOR KO DIKHAYEIN: Sugar checkup aur ultrasound ke liye doctor ko dikhayein\nEMERGENCY (FORI JAYEIN): Bachay ki harkat band hona ya pait mein shadeed dard."
    },
    "tags": [
      "gestational diabetes",
      "hamal ki sugar",
      "pregnancy diabetes",
      "حمل کی شوگر",
      "gdm",
      "high sugar pregnancy",
      "glucose tolerance test",
      "fetal movements",
      "insulin in pregnancy"
    ],
    "baseLevel": "ROUTINE",
    "audience": "maternal",
    "source": {
      "publisher": "WHO / IDF",
      "title": "Diagnostic criteria and classification of gestational diabetes",
      "url": "https://www.idf.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "ectopic-pregnancy",
    "topic": "ectopic-pregnancy",
    "title": {
      "en": "Ectopic pregnancy warning — recognizing tube pregnancy and internal bleeding signs",
      "ur": "حمل کا نالی میں ٹھہرنا (Ectopic Pregnancy) — خطرے کی علامات اور فوری ایمرجنسی",
      "roman": "Hamal ka nali me thehrna (ectopic pregnancy) — khatray ki alamaat aur fori emergency"
    },
    "content": {
      "en": "• An ectopic pregnancy occurs when a fertilized egg implants outside the uterus (usually in the fallopian tube), risking life-threatening rupture and internal hemorrhage\n• Any woman with a positive pregnancy test and one-sided lower abdominal or pelvic pain requires urgent ultrasound evaluation\n• Do NOT take painkillers to mask severe pelvic pain in early pregnancy\nSEE A DOCTOR IF: For early pregnancy ultrasound to confirm intrauterine pregnancy location.\nEMERGENCY / GO IMMEDIATELY: Sudden excruciating sharp one-sided pelvic/abdominal pain, dark vaginal bleeding, fainting or severe dizziness, pale cold clammy skin, or sharp pain at the tip of the shoulder.",
      "ur": "• ایکٹوپک پریگنینسی میں حمل بچہ دانی کے بجائے نالی (ٹیوب) میں ٹھہر جاتا ہے، جس کے پھٹنے سے پیٹ کے اندر جان لیوا خون بہہ سکتا ہے\n• حمل ٹیسٹ مثبت آنے کے بعد اگر پیٹ کے نچلے حصے میں ایک طرف درد یا ہلکا خون آئے تو فوراً الٹراساؤنڈ کروائیں\n• درد کو دبانے کے لیے درد کش گولیاں نہ لیں\nڈاکٹر کو دکھائیں: حمل کے ابتدائی ہفتوں میں الٹراساؤنڈ سے تصدیق کروائیں کہ بچہ دانی میں حمل صحیح جگہ پر ہے\nایمرجنسی (فوراً جائیں): پیٹ کے نچلے حصے میں اچانک نیزے جیسا شدید درد، اندام نہانی سے خون، چکر آ کر بےہوش ہونا، یا کندھے کے اوپر نوک پر شدید درد۔",
      "roman": "• Ectopic pregnancy mein hamal tube mein thehar jata hai jo phatne par jan leva khoon behata hai\n• Pregnancy test positive hone par agar pait ke aik taraf dard ho to foran check karwayein\n• Painkiller kha kar dard ko mat dabayein\nDOCTOR KO DIKHAYEIN: Ultrasound se hamal ki sahi jagah ki tasdeeq ke liye doctor ko dikhayein\nEMERGENCY (FORI JAYEIN): Pait mein achanak shadeed dard, khoon aana, behoshi ya kandhay ki nok par dard."
    },
    "tags": [
      "ectopic pregnancy",
      "tube pregnancy",
      "hamal nali me",
      "ٹیوب پریگنینسی",
      "حمل کا نالی میں ٹھہرنا",
      "ruptured ectopic",
      "shoulder tip pain",
      "early pregnancy bleeding",
      "pelvic pain pregnancy"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "maternal",
    "source": {
      "publisher": "WHO",
      "title": "Managing complications in pregnancy and childbirth: ectopic pregnancy",
      "url": "https://www.who.int/publications/i/item/9789241545877",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "postpartum-hemorrhage",
    "topic": "postpartum-hemorrhage",
    "title": {
      "en": "Postpartum hemorrhage (PPH) — severe bleeding after delivery and emergency resuscitation",
      "ur": "زچگی کے بعد شدید خون بہنا (PPH) — جان بچانے والی تدابیر اور فوری ہسپتال",
      "roman": "Zichgi ke baad shadeed khoon behna (PPH) — fori hospital aur emergency"
    },
    "content": {
      "en": "• Postpartum hemorrhage (PPH) is heavy, rapid bleeding after childbirth (soaking >1 large sanitary pad in an hour) and is the leading cause of maternal mortality\n• CALL 1122 / RUSH TO EMERGENCY HOSPITAL IMMEDIATELY\n• Perform firm circular massage of the lower abdomen (uterine fundal massage) to help the relaxed uterus contract and clamp bleeding vessels\n• Keep the mother lying flat with legs elevated to maintain blood supply to vital organs; keep warm with blankets; put baby to breast to release natural oxytocin\nSEE A DOCTOR IF: Bleeding remains heavier than normal menstrual flow or is accompanied by abdominal tenderness.\nEMERGENCY / GO IMMEDIATELY: Heavy continuous vaginal bleeding soaking >1 pad/hour, passing large blood clots, pale cold clammy skin, or loss of consciousness.",
      "ur": "• زچگی کے بعد بہت زیادہ خون کا اخراج (PPH) ایک جان لیوا ہنگامی صورتحال ہے جس میں ایک گھنٹے میں ایک سے زیادہ بڑا پیڈ خون سے بھر جاتا ہے\n• فوراً 1122 پر کال کریں یا قریبی ہسپتال لے جائیں\n• پیٹ کے نچلے حصے پر دونوں ہاتھوں سے گولائی میں مضبوطی سے مالش کریں تاکہ بچہ دانی سکڑے اور خون رکے\n• ماں کو سیدھا لٹا کر ٹانگیں تکیے پر اونچی رکھیں اور کمبل اوڑھا کر گرم رکھیں؛ بچے کو دودھ پلائیں تاکہ قدرتی ہارمون سے بچہ دانی سکڑے\nڈاکٹر کو دکھائیں: ہنگامی خون کی منتقلی اور آپریشن کے لیے فوری ہسپتال پہنچیں\nایمرجنسی (فوراً جائیں): خون کا مسلسل تیز بہنا، خون کے بڑے لوتھڑے آنا، مریض کا رنگ زرد پڑنا، نبض تیز اور کمزور ہونا، یا بےہوشی۔",
      "roman": "• Delivery ke baad shadeed khoon behna (PPH) jan leva ho sakta hai\n• Foran 1122 call karein ya emergency hospital le jayein\n• Pait ke nichlay hissay par dono haathon se maalish karein taake bacha-daani sukray\n• Maa ki taangein oonchi rakhein aur garam rakhein; bachay ko doodh pilayein\nDOCTOR KO DIKHAYEIN: Fori emergency blood aur treatment ke liye hospital jayein\nEMERGENCY (FORI JAYEIN): 1 ghantay mein 1 se zyada pad geela hona, khoon ke baray lothray aana ya behoshi."
    },
    "tags": [
      "postpartum hemorrhage",
      "pph",
      "zichgi khoon",
      "ولادت کے بعد خون",
      "delivery bleeding",
      "heavy bleeding after birth",
      "uterine massage",
      "maternal emergency",
      "lochia excessive",
      "bleeding after delivery"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "maternal",
    "source": {
      "publisher": "WHO / UNICEF",
      "title": "WHO recommendations for the prevention and treatment of postpartum haemorrhage",
      "url": "https://www.who.int/publications/i/item/9789241548502",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "dysmenorrhea-period-pain",
    "topic": "period-pain",
    "title": {
      "en": "Period pain & menstrual cramps (dysmenorrhea) — home relief, heat and warning signs",
      "ur": "حیض کا درد اور مروڑ (Dysmenorrhea) — گرم ٹکور، آرام اور گھریلو علاج",
      "roman": "Haiz ka dard aur maror (period pain) — garam takore aur dekh bhaal"
    },
    "content": {
      "en": "• Dysmenorrhea is cramping lower abdominal pain during menstruation caused by uterine muscle contractions\n• Apply a warm heating pad or hot water bottle over the lower abdomen for 15–20 minutes to relax uterine muscles\n• Take a warm bath and practice gentle lower back and pelvic stretching\n• Drink warm chamomile or cinnamon tea; ask a pharmacist about over-the-counter pain relief (mefenamic acid or paracetamol) taken with food at the earliest onset of cramps\nSEE A DOCTOR IF: Cramps become progressively worse each month, start days before bleeding, or standard pain medicine fails.\nEMERGENCY / GO IMMEDIATELY: Sudden agonizing pelvic pain with fever, severe dizziness, vomiting, or heavy bleeding requiring changing pads every hour.",
      "ur": "• ماہواری کے دوران پیٹ کے نچلے حصے میں مروڑ اور درد بچہ دانی کے پٹھوں کے سکڑنے کی وجہ سے ہوتا ہے\n• گرم پانی کی بوتل یا ہیٹنگ پیڈ سے پیٹ کے نچلے حصے کی 15-20 منٹ ٹکور کریں جس سے پٹھے پرسکون ہوتے ہیں\n• نیم گرم پانی سے نہائیں اور ہلکی پھلکی چہل قدمی کریں\n• دار چینی یا کیمومائل کا قہوہ پئیں اور فارماسسٹ کے مشورے سے درد شروع ہوتے ہی پین کلر (Mefenamic acid) لیں\nڈاکٹر کو دکھائیں: درد ہر ماہ شدید تر ہوتا جائے یا عام گولیوں سے بالکل آرام نہ آئے\nایمرجنسی (فوراً جائیں): پیٹ میں اچانک شدید ناقابل برداشت درد، تیز بخار، الٹیاں، یا ہر گھنٹے پیڈ بدلنے جتنا خون آنا۔",
      "roman": "• Mahwari (periods) mein pait ke nichlay hissay mein dard aur maror aam hai\n• Garam bottle se pait par saik karein aur neem garam paani se nahayein\n• Darchini ka qehwa piyein aur pharmacist ke mashwaray se mefenamic acid lein\nDOCTOR KO DIKHAYEIN agar: dard har mahine barhta jaye ya doctor ki dawa asar na kare\nEMERGENCY (FORI JAYEIN): Pait mein achanak intehai shadeed dard, bukhar ya shadeed khoon aana.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "dysmenorrhea",
      "period pain",
      "haiz ka dard",
      "حیض کا درد",
      "menstrual cramps",
      "mahwari dard",
      "pait me maror period",
      "heating pad periods",
      "mefenamic acid",
      "painful periods"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Women’s health and primary gynecological care",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "pcos-polycystic-ovary",
    "topic": "pcos",
    "title": {
      "en": "Polycystic Ovary Syndrome (PCOS) — insulin resistance, weight management and hormonal care",
      "ur": "پولی سسٹک اووری سنڈروم (PCOS) — وزن میں کمی، ہارمونز اور غذائی رہنمائی",
      "roman": "PCOS (polycystic ovary) — wazan kam karna, ghiza aur ilaaj"
    },
    "content": {
      "en": "• PCOS is a hormonal condition causing irregular/missed periods, excess facial/body hair (hirsutism), acne, weight gain, and polycystic ovaries on ultrasound\n• LIFESTYLE CHANGES ARE THE FOUNDATION: Reduce refined carbohydrates, bakery sweets, and fried fast foods to lower insulin resistance\n• Eat high-fiber, high-protein meals with lentils (daal), green vegetables, and whole grains; do 30–45 minutes of brisk walking 5 days weekly\n• Even a 5–10% weight reduction significantly restores regular ovulation and menstrual cycles\nSEE A DOCTOR IF: For hormone blood tests (LH/FSH, testosterone, fasting insulin), pelvic ultrasound, and cycle-regulating treatments.\nEMERGENCY / GO IMMEDIATELY: Sudden severe sharp one-sided lower abdominal pain (ovarian cyst rupture or ovarian torsion).",
      "ur": "• پی سی او ایس (PCOS) ہارمونز کی خرابی ہے جس میں ماہواری بے قاعدہ ہوتی ہے، چہرے پر غیر ضروری بال آتے ہیں، کیل مہاسے اور وزن بڑھتا ہے\n• طرزِ زندگی میں تبدیلی اس کا بنیادی علاج ہے: چینی، بیکری، مٹھائی اور تلی ہوئی چیزیں بند کریں تاکہ انسولین کنٹرول میں آئے\n• چکی کا آٹا، دالیں، سبزیاں اور سلاد کھائیں اور ہفتے میں 5 دن 30-45 منٹ تیز واک کریں\n• وزن میں 5 سے 10 فیصد کمی سے ماہواری قدرتی طور پر باقاعدہ ہونا شروع ہو جاتی ہے\nڈاکٹر کو دکھائیں: ہارمونز کے ٹیسٹ اور الٹراساؤنڈ کے لیے گائناکالوجسٹ یا ڈاکٹر سے رجوع کریں\nایمرجنسی (فوراً جائیں): پیٹ کے نچلے حصے میں ایک طرف اچانک شدید نیزے جیسا درد (پانی کی تھیلی پھٹنا یا مڑنا)۔",
      "roman": "• PCOS mein mahwari be-qaida hoti hai, chehre par baal aate hain aur wazan barhta hai\n• Cheeni, bakery aur fast food band karein aur rozana 30 minute walk karein\n• Wazan mein 5-10% kami se periods regular ho jate hain\nDOCTOR KO DIKHAYEIN: Hormones test aur ultrasound ke liye gynecologist doctor ko dikhayein\nEMERGENCY (FORI JAYEIN): Pait ke nichlay hissay mein achanak shadeed dard (cyst rupture)."
    },
    "tags": [
      "pcos",
      "polycystic ovary syndrome",
      "irregular periods",
      "پی سی او ایس",
      "ماہواری کی بے قاعدگی",
      "facial hair women",
      "hirsutism",
      "insulin resistance",
      "mahwari band",
      "ovarian cysts",
      "pcod"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Polycystic ovary syndrome fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "vaginal-candidiasis-thrush",
    "topic": "vaginal-candidiasis",
    "title": {
      "en": "Vaginal yeast infection (candidiasis) — hygiene, antifungal care and prevention",
      "ur": "خواتین میں فنگل انفیکشن (Yeast Infection) — صفائی، پرہیز اور اینٹی فنگل علاج",
      "roman": "Vaginal infection aur safeed paani (yeast infection) — safai aur ilaaj"
    },
    "content": {
      "en": "• Vaginal candidiasis is a common fungal infection causing intense itching, burning redness, and thick white odorless discharge resembling curd/cottage cheese\n• Keep the genital area clean and dry; wear loose, breathable 100% cotton underwear; avoid tight synthetic leggings\n• Avoid scented soaps, bubble baths, feminine sprays, and vaginal douches which strip healthy protective vaginal bacteria\n• Wipe from front to back after using the toilet; ask a pharmacist about over-the-counter clotrimazole vaginal pessaries or cream\nSEE A DOCTOR IF: Symptoms do not improve within 7 days, keep recurring frequently (>4 times/year), or occur during pregnancy.\nEMERGENCY / GO IMMEDIATELY: Severe pelvic pain with high fever, foul-smelling green/yellow discharge, or open painful genital blisters/ulcers.",
      "ur": "• خواتین میں فنگل انفیکشن (Yeast infection) سے شدید خارش، جلن اور دہی جیسا گاڑھا سفید پانی خارج ہوتا ہے\n• جگہ کو دھو کر خشک رکھیں اور سوتی (cotton) کے ڈھیلے انڈرویئر پہنیں؛ تنگ پینٹ سے پرہیز کریں\n• خوشبودار صابن، پرفیوم، اور کیمیکل والے واش ہرگز استعمال نہ کریں جو قدرتی جراثیم کو ختم کرتے ہیں\n• بیت الخلاء کے بعد صفائی آگے سے پیچھے کی طرف کریں؛ فارماسسٹ کے مشورے سے اینٹی فنگل کریم یا ٹیبلٹ (Clotrimazole pessary) لیں\nڈاکٹر کو دکھائیں: خارش ایک ہفتے میں ٹھیک نہ ہو، بار بار ہو یا دورانِ حمل ہو\nایمرجنسی (فوراً جائیں): پیٹ کے نچلے حصے میں شدید درد کے ساتھ تیز بخار، بدبودار پیلا/سبز پانی، یا چھالے بننا۔",
      "roman": "• Yeast infection mein shadeed kharish, jalan aur dahi jaisa safeed paani aata hai\n• Cotton underwear pehnein aur khushk rakhein; khushbodaar sabun na lagayein\n• Pharmacist ke mashwaray se clotrimazole vaginal tablet lagayein\nDOCTOR KO DIKHAYEIN agar: 1 hafte mein aaram na aaye ya baar baar ho\nEMERGENCY (FORI JAYEIN): Pait mein dard, tez bukhar ya badbodaar peep jaisa paani.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "vaginal candidiasis",
      "yeast infection",
      "safeed paani",
      "سفید پانی",
      "vaginal itching",
      "thrush",
      "clotrimazole pessary",
      "discharge cottage cheese",
      "vaginal burning",
      "kharish women"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Sexually transmitted and reproductive tract infections guidelines",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "endometriosis-care",
    "topic": "endometriosis",
    "title": {
      "en": "Endometriosis & chronic pelvic pain — recognition, pain management and fertility care",
      "ur": "اینڈومیٹریوسس اور پیٹ کا پرانا درد (Endometriosis) — علامات اور رہنمائی",
      "roman": "Endometriosis aur pait ka shadeed dard — alamaat aur dekh bhaal"
    },
    "content": {
      "en": "• Endometriosis occurs when tissue similar to the uterine lining grows outside the uterus (on ovaries, fallopian tubes, bowel), causing chronic pelvic pain, severe period cramps, and pain during intercourse\n• Apply warm heating pads over the lower abdomen to ease muscle spasms\n• Practice gentle pelvic stretching, yoga, and regular light walking\n• Eat an anti-inflammatory diet rich in green vegetables, fruits, fiber, and omega-3; keep a detailed pain and symptom diary\nSEE A DOCTOR IF: For specialized pelvic ultrasound/MRI, hormonal suppression therapies, and fertility guidance.\nEMERGENCY / GO IMMEDIATELY: Sudden acute excruciating pelvic pain, high fever with lower belly tenderness, or uncontrolled heavy vaginal bleeding.",
      "ur": "• اینڈومیٹریوسس میں بچہ دانی کی اندرونی جھلی جیسے خلیے باہر (بیضہ دانی یا آنتوں پر) اگ آتے ہیں جس سے ماہواری میں شدید ناقابل برداشت درد اور مروڑ ہوتا ہے\n• پیٹ کے نچلے حصے پر گرم ہیٹنگ پیڈ سے ٹکور کریں\n• ہلکی ورزش، اسٹریچنگ اور گہرے سانس لینے کی مشق کریں\n• سبزیوں، پھلوں اور اومیگا 3 والی غذائیں لیں\nڈاکٹر کو دکھائیں: الٹراساؤنڈ، ایم آر آئی اور ہارمونل علاج کے لیے گائناکالوجسٹ یا ڈاکٹر سے رجوع کریں\nایمرجنسی (فوراً جائیں): پیٹ کے نچلے حصے میں اچانک شدید ناقابل برداشت درد، تیز بخار یا شدید خون آنا۔",
      "roman": "• Endometriosis mein mahwari ke doran pait mein shadeed dard aur maror hota hai\n• Garam saik karein aur halki stretch karein\n• Daalein, sabziyan aur phal khayein\nDOCTOR KO DIKHAYEIN: Gynecologist doctor ko dikha kar ultrasound aur ilaaj karwayein\nEMERGENCY (FORI JAYEIN): Pait mein achanak intehai shadeed dard ya behoshi."
    },
    "tags": [
      "endometriosis",
      "chronic pelvic pain",
      "shadeed haiz dard",
      "اینڈومیٹریوسس",
      "pelvic pain",
      "painful intercourse",
      "painful bowel period",
      "infertility endometriosis",
      "chocolate cyst"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Endometriosis fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/endometriosis",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "menopause-symptoms",
    "topic": "menopause",
    "title": {
      "en": "Menopause & perimenopause — managing hot flashes, mood changes and bone health",
      "ur": "سنِ یاس اور ماہواری کا بند ہونا (Menopause) — گرمی کے جھٹکے، ہڈیوں کی مضبوطی اور دیکھ بھال",
      "roman": "Mahwari ka band hona (menopause) — hot flashes, haddiyan aur dekh bhaal"
    },
    "content": {
      "en": "• Menopause is the permanent cessation of menstrual periods for 12 consecutive months (usually ages 45–55), often accompanied by hot flashes, night sweats, mood shifts, and sleep disturbance\n• Manage hot flashes: dress in breathable layers of cotton, keep bedrooms cool, and sip cold water when a flash begins\n• Reduce triggers: spicy foods, hot tea/coffee, caffeine, and emotional stress\n• Protect bone density: consume calcium-rich foods (milk, yogurt, sesame seeds, greens) and Vitamin D with daily 30-minute weight-bearing walks\nSEE A DOCTOR IF: To discuss Menopause Hormone Therapy (MHT) or non-hormonal options for severe disruptive symptoms and bone DEXA scans.\nEMERGENCY / GO IMMEDIATELY: ANY VAGINAL BLEEDING OR SPOTTING THAT OCCURS AFTER MENOPAUSE (postmenopausal bleeding must always be investigated promptly to rule out uterine cancer).",
      "ur": "• مینوپاز (سن یاس) میں 45 سے 55 سال کی عمر کے درمیان ماہواری مستقل بند ہو جاتی ہے جس سے گرمی کے جھٹکے (Hot flashes)، رات کو پسینے، اور چڑچڑاپن ہوتا ہے\n• گرمی لگنے پر ڈھیلے سوتی کپڑے پہنیں، کمرہ ٹھنڈا رکھیں اور ٹھنڈا پانی پئیں\n• تیز مرچ مسالے، چائے اور کافی کم کریں\n• ہڈیوں کو مضبوط رکھنے کے لیے دودھ، دہی، تل اور کیلشیم والی غذائیں لیں اور روزانہ واک کریں\nڈاکٹر کو دکھائیں: ہڈیوں کے ٹیسٹ (DEXA scan) اور شدید علامات کی دوا کے لیے ڈاکٹر سے مشورہ کریں\nایمرجنسی (فوراً جائیں): ماہواری بند ہونے کے مہینوں یا سالوں بعد اگر دوبارہ کسی بھی قسم کا خون یا داغ آئے تو فوری معائنہ ضروری ہے (کینسر کو خارج کرنے کے لیے)۔",
      "roman": "• Menopause mein 45-55 saal ki umar mein periods band ho jate hain aur achanak garmi lagti hai\n• Dheelay cotton kapray pehnein aur dhoop/garam chai se bachein\n• Doodh, dahi aur calcium wali ghiza lein taake haddiyan kamzor na hon\nDOCTOR KO DIKHAYEIN: Haddiyon ke checkup ke liye doctor ko dikhayein\nEMERGENCY (FORI JAYEIN): Periods band hone ke baad agar dobara khoon aaye to foran doctor ko dikhayein."
    },
    "tags": [
      "menopause",
      "perimenopause",
      "hot flashes",
      "سن یاس",
      "ماہواری کا بند ہونا",
      "night sweats",
      "vaginal dryness",
      "bone health menopause",
      "postmenopausal bleeding",
      "mood swings menopause"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Menopause fact sheet",
      "url": "https://www.who.int/news-room/fact-sheets/detail/menopause",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "neonatal-jaundice",
    "topic": "neonatal-jaundice",
    "title": {
      "en": "Neonatal jaundice in newborns (peelia) — feeding frequency and phototherapy timeline",
      "ur": "نوزائیدہ بچے میں پیلیا اور یرقان — دودھ پلانے کے اوقات اور خطرے کی علامات",
      "roman": "Nawzaida bachay ka peelia (newborn jaundice) — dekh bhaal aur alamaat"
    },
    "content": {
      "en": "• Mild physiological jaundice appears on days 2–4 in many newborns as yellow skin/eyes and fades within 1–2 weeks\n• FEED FREQUENTLY: Breastfeed baby 8–12 times every 24 hours — frequent bowel movements help excrete bilirubin pigment\n• Keep baby warm and well hydrated\n• DO NOT PUT NAKED NEWBORNS IN DIRECT SUNLIGHT (causes dangerous sunburn and dehydration without providing calibrated medical phototherapy)\nSEE A DOCTOR IF: Any jaundice appearing in the first 24 hours of life is always pathological and needs urgent bilirubin testing.\nEMERGENCY / GO IMMEDIATELY: Jaundice spreading down to palms and soles, baby refuses all feeds, extreme sleepiness / baby cannot be woken up, high-pitched weak cry, or arching back stiffly.",
      "ur": "• نوزائیدہ بچوں میں پیدائش کے دوسرے یا تیسرے دن آنکھوں اور جلد کا پیلا ہونا (پیلیا) عام ہے جو 1-2 ہفتے میں ٹھیک ہو جاتا ہے\n• بچے کو بار بار دودھ پلائیں: 24 گھنٹے میں 8 سے 12 بار ماں کا دودھ دیں تاکہ پاخانے کے راستے پیلا مادہ خارج ہو\n• بچے کو گرم اور پرسکون رکھیں\n• ننگے بچے کو تیز دھوپ میں مت لٹائیں (اس سے جلد جل سکتی ہے اور پانی کی کمی ہو جاتی ہے)\nڈاکٹر کو دکھائیں: اگر پیدائش کے پہلے ہی دن پیلیا آ جائے تو اسی دن ہسپتال لے جا کر بلیروبن ٹیسٹ کروائیں\nایمرجنسی (فوراً جائیں): پیلاہٹ پاؤں کے تلووں اور ہتھیلیوں تک پہنچ جائے، بچہ دودھ نہ پیے، بالکل بے سدھ پڑا رہے، یا جسم کو پیچھے کی طرف اکڑائے۔",
      "roman": "• Nawzaida bache ka peelia aam tor par 2-3 din baad aata hai aur khud theek hota hai\n• Bache ko baar baar doodh pilayein (din mein 8-12 baar)\n• Bache ko dhoop mein na litayein\nDOCTOR KO DIKHAYEIN: Pehle hi din peelia aane par usi din clinic le jayein\nEMERGENCY (FORI JAYEIN): Peelia hath paon tak pohnch jaye, bacha doodh na piye ya behosh parha rahe."
    },
    "tags": [
      "neonatal jaundice",
      "newborn jaundice",
      "bache ko peelia",
      "نوزائیدہ کا پیلیا",
      "yarqan bacha",
      "yellow baby",
      "bilirubin",
      "phototherapy",
      "infant jaundice",
      "new born yellow eyes"
    ],
    "baseLevel": "URGENT",
    "audience": "child",
    "source": {
      "publisher": "WHO / UNICEF",
      "title": "Pocket book of hospital care for children: neonatal jaundice management",
      "url": "https://www.who.int/publications/i/item/9789241548373",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "croup-stridor",
    "topic": "croup",
    "title": {
      "en": "Croup & barking cough in children — cool mist, calm posture and emergency stridor signs",
      "ur": "بچوں میں کتے جیسی کھانسی اور کروپ (Croup) — بھاپ، تسکین اور خطرے کی علامات",
      "roman": "Bachon me kuttay jaisi khansi (croup) — thandi bhaap aur emergency"
    },
    "content": {
      "en": "• Croup is a viral airway infection causing vocal cord swelling, producing a harsh 'barking cough' (like a seal), hoarseness, and noisy breathing\n• KEEP CHILD CALM: Crying worsens airway swelling — hold child upright against your chest and comfort them calmly\n• Expose child to cool moist night air for 10 minutes or sit in a steamy bathroom with hot water running\n• Offer frequent small sips of warm water or clear fluids; do NOT give over-the-counter cough syrups\nSEE A DOCTOR IF: For pediatric evaluation and a single dose of oral dexamethasone steroid to rapidly reduce swelling.\nEMERGENCY / GO IMMEDIATELY: High-pitched squeaking whistle when resting quietly (stridor at rest), chest sucking in deeply under ribs, blue/pale lips, struggling for breath, or drooling saliva and unable to swallow.",
      "ur": "• کروپ (Croup) بچوں کی سانس کی نالی کا وائرل انفیکشن ہے جس میں کتے کے بھونکنے یا سیل مچھلی جیسی کھانسی، بیٹھی ہوئی آواز اور سانس میں سیٹی بجتی ہے\n• بچے کو پرسکون رکھیں: رونے سے سانس کی نالی مزید بند ہوتی ہے — بچے کو گود میں سیدھا بٹھائیں اور تسلی دیں\n• رات کی ٹھنڈی ہوا میں 10 منٹ لے جائیں یا باتھ روم میں گرم پانی کا شاور چلا کر بھاپ دیں\n• تھوڑا تھوڑا کر کے نیم گرم پانی پلائیں؛ کھانسی کے شربت خود سے نہ دیں\nڈاکٹر کو دکھائیں: اسی دن کلینک لے جائیں تاکہ ڈاکٹر کی دی گئی دوا (Dexamethasone) سے نالی کی سوجن کم ہو\nایمرجنسی (فوراً جائیں): پرسکون حالت میں بھی سانس کے ساتھ سیٹی کی آواز آنا (Stridor)، سینہ اندر کو دھنسنا، ہونٹ نیلے پڑنا، یا تھوک نگل نہ سکنا۔",
      "roman": "• Croup mein bachay ko kuttay jaisi khansi aati hai aur saans mein seeti bajti hai\n• Bachay ko godi mein seedha bitha kar pur-sukoon rakhein (rone se takleef barhti hai)\n• Thandi hawa ya garam bhaap dein aur paani pilayein\nDOCTOR KO DIKHAYEIN: Usi din clinic ja kar doctor se steroid dawa lagwayein\nEMERGENCY (FORI JAYEIN): Saans mein seeti ki aawaz (stridor), seena andar khinchna ya neelay hont."
    },
    "tags": [
      "croup",
      "barking cough",
      "stridor",
      "کروپ",
      "کتے جیسی کھانسی",
      "bachon ki khansi",
      "noisy breathing child",
      "chest pulling in bacha",
      "seal cough",
      "dexamethasone croup",
      "airway swelling"
    ],
    "baseLevel": "URGENT",
    "audience": "child",
    "source": {
      "publisher": "WHO / UNICEF",
      "title": "Integrated Management of Childhood Illness (IMCI): acute respiratory infections and croup",
      "url": "https://www.who.int/teams/maternal-newborn-child-adolescent-health",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "febrile-seizures",
    "topic": "febrile-seizures",
    "title": {
      "en": "Febrile seizures in children (bukhar ke doray) — seizure first aid and fever care",
      "ur": "بچے کو بخار کے جھٹکے اور دورے (Febrile Seizure) — ابتدائی طبی امداد اور احتیاط",
      "roman": "Bukhar ke jhatkay aur doray (febrile seizure) — fori first aid aur bukhar"
    },
    "content": {
      "en": "• Febrile seizures are convulsions triggered by a sudden rapid fever spike in children aged 6 months to 5 years\n• SEIZURE FIRST AID: Stay calm; place child on their side in the recovery position on a soft flat surface to keep airway open and clear vomitus\n• NEVER PUT ANYTHING IN THE CHILD'S MOUTH (no fingers, spoons, water, or medicine)\n• Do NOT restrain or hold the child's shaking limbs; clear away hard or sharp objects; time the seizure\n• After convulsions stop, sponge gently with lukewarm water and give pharmacist-approved paracetamol\nSEE A DOCTOR SAME DAY: Every child having a seizure must be evaluated to rule out serious infections like meningitis.\nEMERGENCY / GO IMMEDIATELY: Seizure lasts longer than 5 minutes, repeated seizures in 24 hours, child does not wake up or remains unresponsive, stiff neck, or purple spotty rash.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• چھوٹے بچوں (6 ماہ سے 5 سال) میں تیز بخار چڑھنے پر جسم میں جھٹکے اور دورہ پڑ سکتا ہے\n• دورے کی ابتدائی طبی امداد: پرسکون رہیں؛ بچے کو فرش پر نرم جگہ پر ایک کروٹ پر لٹائیں تاکہ سانس کی نالی کھلی رہے\n• بچے کے منہ میں کوئی چیز ہرگز نہ ڈالیں (نہ چمچ، نہ پانی، نہ انگلیاں)\n• بچے کے ہاتھ پاؤں کو زبردستی مت پکڑیں اور دورے کا وقت نوٹ کریں\n• دورہ رکنے کے بعد نیم گرم گیلے کپڑے سے جسم پونچھیں اور پیراسیٹامول دیں\nڈاکٹر کو دکھائیں: دورہ ختم ہونے کے بعد اسی دن ڈاکٹر کو دکھائیں تاکہ گردن توڑ بخار کو خارج کیا جا سکے\nایمرجنسی (فوراً جائیں): دورہ 5 منٹ سے لمبا ہو جائے، 24 گھنٹے میں دوبارہ پڑے، بچہ ہوش میں نہ آئے، یا گردن اکڑ جائے۔",
      "roman": "• Tez bukhar mein bache ko jhatkay ya doray parh sakte hain\n• Bache ko aaram se aik karwat par litayein taake saans saaf rahe\n• Munh mein chamach ya ungli hargiz na dalein\n• Jhatkay rukne ke baad neem garam paani se patti karein aur paracetamol dein\nDOCTOR KO DIKHAYEIN: Usi din doctor se checkup karwayein\nEMERGENCY (FORI JAYEIN): Dora 5 minute se lamba ho, bacha hosh mein na aaye ya gardan sakht ho."
    },
    "tags": [
      "febrile seizures",
      "febrile seizure",
      "bukhar ke doray",
      "bukhar ke jhatkay",
      "بخار کے جھٹکے",
      "jhatkay bacha",
      "jhatkay",
      "doray",
      "fits fever child",
      "child convulsion",
      "seizure first aid",
      "tez bukhar dora",
      "recovery position child"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "child",
    "source": {
      "publisher": "WHO / UNICEF",
      "title": "Pocket book of hospital care for children: management of convulsions and fever",
      "url": "https://www.who.int/publications/i/item/9789241548373",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "rickets-vitamin-d",
    "topic": "rickets",
    "title": {
      "en": "Rickets & Vitamin D deficiency in children — bow legs, sunlight and nutritional care",
      "ur": "بچوں میں ہڈیوں کا ٹیڑھا پن (Rickets) — وٹامن ڈی، دھوپ اور خوراک",
      "roman": "Bachon me haddiyon ka teerha pan (rickets) — vitamin d, dhoop aur ghiza"
    },
    "content": {
      "en": "• Rickets is a softening and weakening of growing bones in children due to lack of Vitamin D and calcium, causing bow legs, knock knees, and swollen wrists\n• SUNLIGHT EXPOSURE: Let child play in gentle morning sunlight with arms and legs exposed for 15–20 minutes daily\n• Provide calcium and Vitamin D rich foods: milk, yogurt, eggs, fortified cereals, and fish\n• Breastfed infants should receive daily pediatric Vitamin D drop supplements (400 IU/day) as recommended by child health guidelines\nSEE A DOCTOR IF: For wrist X-rays, blood calcium and alkaline phosphatase tests, and prescribed therapeutic Vitamin D doses.\nEMERGENCY / GO IMMEDIATELY: Muscle spasms, whole-body twitching, or seizures in a child (signs of severe acute low blood calcium / hypocalcemia).",
      "ur": "• ریکٹس (Rickets) میں وٹامن ڈی اور کیلشیم کی کمی سے بچوں کی ہڈیاں نرم اور ٹیڑھی ہو جاتی ہیں، ٹانگیں کمان کی طرح مڑ جاتی ہیں اور کلائیاں موٹی ہو جاتی ہیں\n• روزانہ صبح بچے کو 15-20 منٹ دھوپ میں بٹھائیں تاکہ جسم میں قدرتی وٹامن ڈی بنے\n• خوراک میں دودھ، دہی، انڈے، مچھلی اور دلیہ شامل کریں\n• ماں کا دودھ پینے والے بچوں کو ڈاکٹر کے مشورے سے وٹامن ڈی کے قطرے (Drops) پلائیں\nڈاکٹر کو دکھائیں: ہڈیوں کے ایکسرے اور وٹامن ڈی کے درست علاج کے لیے بچوں کے ڈاکٹر کو دکھائیں\nایمرجنسی (فوراً جائیں): پٹھوں کا شدید کھچاؤ، جھٹکے یا دورے پڑنا (کیلشیم کی خطرناک کمی)۔",
      "roman": "• Rickets mein vitamin D aur calcium ki kami se bachay ki taangein teerhi ho jati hain\n• Rozana bache ko 15-20 minute subah ki dhoop mein bithayein\n• Doodh, dahi, anday aur machhli khilayein aur vitamin D drops dein\nDOCTOR KO DIKHAYEIN: Pediatrician doctor se X-ray aur ilaaj karwayein\nEMERGENCY (FORI JAYEIN): Jhatkay parna ya pathon ka sakht khichao."
    },
    "tags": [
      "rickets",
      "vitamin d child",
      "bowed legs",
      "ریکٹس",
      "ہڈیوں کا ٹیڑھا پن",
      "knock knees",
      "swollen wrists bacha",
      "haddiyan narm",
      "calcium deficiency child",
      "sunlight babies"
    ],
    "baseLevel": "ROUTINE",
    "audience": "child",
    "source": {
      "publisher": "WHO / UNICEF",
      "title": "Nutritional rickets and vitamin D deficiency in children guidelines",
      "url": "https://www.who.int/publications/i/item/9789241548373",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "malnutrition-child",
    "topic": "malnutrition",
    "title": {
      "en": "Child malnutrition & wasting (sukha pan) — nutritious feeding, MUAC and growth monitoring",
      "ur": "بچوں میں غذائی قلت اور کمزوری (Malnutrition) — مقوی خوراک، وزن اور دیکھ بھال",
      "roman": "Bachon me sukha pan aur kamzori (malnutrition) — taaqatwar ghiza aur dekh bhaal"
    },
    "content": {
      "en": "• Malnutrition in children causes wasting (low weight-for-height), stunting (short stature), weakness, and severe vulnerability to infections\n• Continue breastfeeding up to 2 years; after 6 months, provide nutrient-dense energy-rich complementary food (khichdi with ghee, mashed bananas, eggs, lentils, yogurt)\n• Deworm children every 6 months after age 1 with pharmacist-approved deworming syrup\n• Track child's growth monthly using child health card / Mid-Upper Arm Circumference (MUAC) band at local Basic Health Unit (BHU)\nSEE A DOCTOR IF: If child's arm measurement falls in yellow or red MUAC zone.\nEMERGENCY / GO IMMEDIATELY: Severe swelling of both feet and legs (Kwashiorkor edema), skin-and-bones appearance (Marasmus), child refuses all food/therapeutic paste, hypothermia (cold body), or severe watery diarrhea.",
      "ur": "• غذائی قلت (سوکھا پن) میں بچے کا وزن اور قد نہیں بڑھتا، پسلیاں نظر آنے لگتی ہیں اور بچہ بار بار بیمار پڑتا ہے\n• 2 سال تک ماں کا دودھ جاری رکھیں؛ 6 ماہ کے بعد نرم اور مقوی غذا شروع کریں (کھچڑی میں گھی/تیل ڈال کر، کیلا، انڈا، دہی، دالیں)\n• ہر 6 ماہ بعد پیٹ کے کیڑوں کی دوا پلائیں\n• ہر ماہ قریبی بنیادی مرکزِ صحت (BHU) لے جا کر بچے کا وزن اور بازو کی پیمائش (MUAC) کروائیں\nڈاکٹر کو دکھائیں: اگر بچے کا وزن گر رہا ہو تو فوری طور پر نیوٹریشن سنٹر یا ڈاکٹر کے پاس لے جائیں\nایمرجنسی (فوراً جائیں): دونوں پاؤں اور ٹانگوں پر سوجن آنا (کواشیورکور)، بچہ بالکل سوکھ کر ہڈیوں کا ڈھانچہ بن جانا، کچھ نہ کھانا، یا جسم ٹھنڈا پڑ جانا۔",
      "roman": "• Sukha pan (malnutrition) mein bacha kamzor hota hai aur wazan nahi barhta\n• 2 saal tak maa ka doodh dein aur 6 mahine baad taaqatwar khana khilayein (khichdi, anda, dahi)\n• Har 6 mahine baad pet ke keerhon ki dawa dein aur MUAC check karwayein\nDOCTOR KO DIKHAYEIN: Basic Health Unit clinic aur doctor se nutrition supplements lein\nEMERGENCY (FORI JAYEIN): Paon par sujan aana, bache ka thanda parh jana ya behoshi."
    },
    "tags": [
      "malnutrition",
      "child wasting",
      "sukha pan",
      "غذائی قلت",
      "سوکھا پن",
      "stunting",
      "muac",
      "rutf",
      "weak child",
      "low weight baby",
      "khichdi complementary food",
      "kwashiorkor"
    ],
    "baseLevel": "URGENT",
    "audience": "child",
    "source": {
      "publisher": "WHO / UNICEF",
      "title": "Guideline: updates on the management of severe acute malnutrition in infants and children",
      "url": "https://www.who.int/publications/i/item/9789241506328",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "hyperglycemia-dka",
    "topic": "hyperglycemia",
    "title": {
      "en": "High blood sugar & DKA crisis — hydration, insulin checks and ketoacidosis emergency",
      "ur": "خون میں شوگر کی زیادتی اور ڈی کے اے (DKA) — پانی، انسولین اور ہنگامی علامات",
      "roman": "High blood sugar aur DKA — paani, insulin aur emergency alamaat"
    },
    "content": {
      "en": "• Hyperglycemia is high blood sugar (>200–250 mg/dL) causing extreme thirst, frequent urination, dry mouth, blurred vision, and fatigue\n• Drink plenty of plain water to help kidneys flush excess glucose and prevent dehydration\n• Check blood sugar levels every 2–4 hours; take prescribed insulin or diabetes medication strictly as directed (never stop basal insulin during illness)\n• Check urine for ketones if blood sugar is persistently >250 mg/dL\nSEE A DOCTOR IF: Blood sugar remains consistently >250–300 mg/dL despite usual doses.\nEMERGENCY / GO IMMEDIATELY: Diabetic Ketoacidosis (DKA) signs: deep rapid heavy breathing (Kussmaul breathing), sweet fruity-smelling breath, persistent vomiting, severe abdominal pain, confusion, or extreme drowsiness.",
      "ur": "• خون میں شوگر 250 سے اوپر جانا خطرناک ہے جس سے پیاس کی زیادتی، بار بار پیشاب، منہ کی خشکی اور تھکاوٹ ہوتی ہے\n• خوب سادہ پانی پئیں تاکہ گردے اضافی شوگر کو خارج کر سکیں اور پانی کی کمی نہ ہو\n• ہر 2 سے 4 گھنٹے بعد شوگر چیک کریں؛ ڈاکٹر کی بتائی ہوئی انسولین باقاعدگی سے لگائیں (بیماری میں بھی انسولین بند نہ کریں)\n• اگر شوگر 250 سے زیادہ رہے تو پیشاب میں کیٹونز (Ketones) چیک کریں\nڈاکٹر کو دکھائیں: شوگر مسلسل 250-300 سے زیادہ رہے اور دوا سے کم نہ ہو\nایمرجنسی (فوراً جائیں): ڈی کے اے (DKA) کی علامات: تیز اور گہرے سانس لینا، منہ سے پھل جیسی میٹھی بو آنا، مسلسل الٹیاں، پیٹ میں شدید درد، یا غنودگی اور بےہوشی۔",
      "roman": "• High blood sugar (250 se oopar) mein shadeed pyaas aur bar bar peshab aata hai\n• Saaf paani khoob piyein aur insulin waqt par lagayein\n• Har 2-4 ghante baad sugar test karein\nDOCTOR KO DIKHAYEIN agar: sugar 250 se oopar rahe\nEMERGENCY (FORI JAYEIN): DKA ki alamaat: saans mein meethi boo, ultiyan, pait dard ya behoshi.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "hyperglycemia",
      "high blood sugar",
      "dka",
      "diabetic ketoacidosis",
      "شوگر کی زیادتی",
      "ڈی کے اے",
      "high glucose",
      "fruity breath",
      "ketones in urine",
      "insulin missed",
      "kussmaul breathing"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO / IDF",
      "title": "IDF clinical practice recommendations: acute complications of diabetes",
      "url": "https://www.idf.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "hypothyroidism",
    "topic": "hypothyroidism",
    "title": {
      "en": "Hypothyroidism & underactive thyroid — fatigue, weight gain and levothyroxine timing",
      "ur": "تھائی رائیڈ کی سستی (Hypothyroidism) — تھکاوٹ، وزن میں اضافہ اور دوا کا وقت",
      "roman": "Thyroid ki susti (hypothyroidism) — thakan, wazan barhna aur thyroxine"
    },
    "content": {
      "en": "• Hypothyroidism occurs when the thyroid gland produces insufficient hormone, slowing metabolism and causing fatigue, weight gain, cold intolerance, constipation, dry skin, and depression\n• TAKE LEVOTHYROXINE CORRECTLY: Take prescribed thyroxine tablet first thing in the morning on an empty stomach with plain water, at least 30–60 minutes before breakfast, tea, or coffee\n• Do NOT take iron, calcium, or antacids within 4 hours of your thyroxine tablet (they block absorption)\n• Use iodized salt in daily cooking and eat a balanced diet\nSEE A DOCTOR IF: For blood thyroid testing (TSH, Free T4) every 6–12 months to adjust medication dose.\nEMERGENCY / GO IMMEDIATELY: Severe hypothermia (dangerously low body temperature), profound confusion, extreme unresponsiveness, or swelling of face/neck with breathing difficulty (Myxedema Coma).",
      "ur": "• تھائی رائیڈ کی سستی (Hypothyroidism) میں جسمانی نظام سست ہو جاتا ہے جس سے مستقل تھکاوٹ، وزن بڑھنا، سردی لگنا، قبض، بال گرنا اور اداسی ہوتی ہے\n• تھائی رائیڈ کی گولی (Thyroxine) کا درست طریقہ: روزانہ صبح نہار منہ ناشتے اور چائے سے کم از کم آدھا گھنٹہ پہلے ایک گلاس پانی کے ساتھ لیں\n• گولی کے 4 گھنٹے کے اندر آئرن، کیلشیم یا معدے کے شربت ہرگز نہ لیں کیونکہ یہ دوا کے اثر کو روکتے ہیں\n• کھانے میں آیوڈین ملا نمک استعمال کریں\nڈاکٹر کو دکھائیں: ہر 6 سے 12 ماہ بعد خون کا ٹیسٹ (TSH) کروائیں تاکہ دوا کی مقدار درست رہے\nایمرجنسی (فوراً جائیں): جسم کا انتہائی ٹھنڈا پڑ جانا، شدید غنودگی، چہرے اور گلے پر شدید سوجن کے ساتھ سانس رکنا۔",
      "roman": "• Thyroid ki susti mein thakan, wazan barhna, sardi lagna aur qabz hoti hai\n• Thyroxine ki goli rozana subah nahar munh nashtay se 30 minute pehle paani ke sath lein\n• Calcium ya iron ki goli iske sath na lein\nDOCTOR KO DIKHAYEIN: TSH test karwa kar doctor ko dikhayein\nEMERGENCY (FORI JAYEIN): Jism intehai thanda hona, behoshi ya saans mein rukawat."
    },
    "tags": [
      "hypothyroidism",
      "underactive thyroid",
      "thyroid ki susti",
      "تھائی رائیڈ",
      "تھائی رائیڈ کی سستی",
      "tsh high",
      "levothyroxine",
      "thyroxine empty stomach",
      "weight gain thyroid",
      "cold intolerance",
      "thakan thyroid"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Thyroid disorders and iodine deficiency elimination guidelines",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "hyperthyroidism",
    "topic": "hyperthyroidism",
    "title": {
      "en": "Hyperthyroidism & overactive thyroid — rapid heartbeat, heat intolerance and thyroid storm",
      "ur": "تھائی رائیڈ کی تیزی (Hyperthyroidism) — دل کی تیز دھڑکن، وزن میں کمی اور دیکھ بھال",
      "roman": "Thyroid ki tezi (hyperthyroidism) — dharkan tez, wazan girna aur ilaaj"
    },
    "content": {
      "en": "• Hyperthyroidism occurs when the thyroid gland overproduces hormone, speeding metabolism: rapid heart rate, unexplained weight loss despite big appetite, trembling hands, sweating, and bulging eyes (Graves' disease)\n• Rest adequately and avoid strenuous heavy exertion during active flares\n• Stay well hydrated with water; avoid caffeine, energy drinks, and excess dietary iodine\n• Take prescribed antithyroid medications (carbimazole) and beta-blockers strictly as directed\nSEE A DOCTOR IF: For thyroid profile tests (TSH, Free T3/T4, thyroid antibody/scan) and structured medical management.\nEMERGENCY / GO IMMEDIATELY: High fever, extremely rapid heart rate (>140 bpm), severe agitation, delirium, diarrhea, or yellow jaundice (Thyroid Storm — life-threatening emergency).",
      "ur": "• تھائی رائیڈ کی تیزی (Hyperthyroidism) میں میٹابولزم تیز ہو جاتا ہے: دل کی تیز دھڑکن، زیادہ کھانے کے باوجود وزن گرنا، ہاتھوں میں لرزہ، شدید گرمی اور آنکھیں باہر کو ابھرنا\n• زیادہ محنت اور بھاگ دوڑ سے پرہیز کریں اور مکمل آرام کریں\n• چائے، کافی، انرجی ڈرنکس سے پرہیز کریں اور پانی زیادہ پئیں\n• ڈاکٹر کی بتائی ہوئی اینٹی تھائی رائیڈ دوا (Carbimazole) باقاعدگی سے لیں\nڈاکٹر کو دکھائیں: خون کے ٹیسٹ (TSH, Free T4) اور مکمل علاج کے لیے ڈاکٹر یا اینڈوکرائنولوجسٹ کو دکھائیں\nایمرجنسی (فوراً جائیں): تیز بخار، دل کی دھڑکن کا انتہائی تیز ہونا (140 سے اوپر)، شدید بےچینی، پاگل پن یا یرقان (تھائی رائیڈ اسٹارم)۔",
      "roman": "• Thyroid ki tezi mein dharkan tez hoti hai, wazan girta hai aur haath kaanpte hain\n• Chai, coffee band karein aur aaraam karein\n• Doctor ki di hui carbimazole dawa waqt par lein\nDOCTOR KO DIKHAYEIN: Endocrinologist doctor se thyroid test karwayein\nEMERGENCY (FORI JAYEIN): Tez bukhar, intehai tez dharkan aur behoshi (Thyroid storm)."
    },
    "tags": [
      "hyperthyroidism",
      "overactive thyroid",
      "thyroid ki tezi",
      "تھائی رائیڈ کی تیزی",
      "graves disease",
      "rapid pulse thyroid",
      "weight loss appetite",
      "trembling hands",
      "heat intolerance",
      "thyroid storm"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Thyroid disorders clinical diagnosis and management",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "vitamin-d-deficiency",
    "topic": "vitamin-d",
    "title": {
      "en": "Vitamin D deficiency in adults — bone ache, sunlight and supplementation guidance",
      "ur": "وٹامن ڈی کی کمی اور ہڈیوں کا درد — دھوپ، خوراک اور سپلیمنٹ کی رہنمائی",
      "roman": "Vitamin D ki kami aur jism dard — dhoop, ghiza aur supplements"
    },
    "content": {
      "en": "• Vitamin D deficiency is extremely common, causing generalized bone aches, lower back pain, muscle weakness, and chronic fatigue\n• SUNLIGHT EXPOSURE: Spend 15–20 minutes in direct midday sun with face and arms exposed 3 times weekly (glass windows block the UVB rays needed to synthesize Vitamin D)\n• Consume dietary sources: egg yolks, fortified milk, yogurt, and fatty fish\n• Take prescribed Vitamin D3 supplements (e.g. 200,000 IU monthly or 50,000 IU weekly) with a meal containing healthy fats for optimal absorption\nSEE A DOCTOR IF: To check blood 25-hydroxy Vitamin D levels and receive correct therapeutic replacement dosing.\nEMERGENCY / GO IMMEDIATELY: Severe muscle tetany, involuntary hand/foot cramping spasms, or numbness around mouth (acute severe hypocalcemia).",
      "ur": "• وٹامن ڈی کی کمی سے ہڈیوں میں مستقل درد، کمر کا درد، پٹھوں کی کمزوری اور سستی ہوتی ہے\n• دھوپ میں بیٹھیں: ہفتے میں 3 بار 15-20 منٹ چہرے اور بازوؤں پر براہِ راست دھوپ لگوائیں (کھڑکی کے شیشے کے پیچھے دھوپ کام نہیں کرتی)\n• انڈے کی زردی، دودھ، دہی اور مچھلی کا استعمال کریں\n• ڈاکٹر کے مشورے سے وٹامن ڈی کا کیپسول یا انجکشن (Vitamin D3) چکنائی والی غذا کے ساتھ لیں تاکہ بہتر جذب ہو\nڈاکٹر کو دکھائیں: خون کا ٹیسٹ (25-OH Vitamin D) کروا کر ڈاکٹر سے مقدار طے کروائیں\nایمرجنسی (فوراً جائیں): پٹھوں کا بری طرح اکڑ جانا، ہاتھوں کا مڑنا، یا ہونٹوں کے گرد سن پن (کیلشیم کی شدید کمی)۔",
      "roman": "• Vitamin D ki kami se haddiyon aur kamar mein dard aur thakan rehti hai\n• Rozana 15-20 minute dhoop mein baithein\n• Anday ki zardi, doodh aur dahi lein aur doctor ke mashwaray se vitamin D capsule lein\nDOCTOR KO DIKHAYEIN: Vitamin D test karwa kar doctor ko dikhayein\nEMERGENCY (FORI JAYEIN): Pathon ka shadeed khichao ya haathon ka murna."
    },
    "tags": [
      "vitamin d",
      "vitamin d deficiency",
      "vitamin d ki kami",
      "وٹامن ڈی کی کمی",
      "haddiyon me dard",
      "bone ache",
      "muscle weakness",
      "sunlight vitamin d",
      "vitamin d capsule",
      "sunshine vitamin",
      "jism me dard"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Vitamin and mineral nutrition information system: vitamin D",
      "url": "https://www.who.int/teams/nutrition-and-food-safety",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "metabolic-syndrome",
    "topic": "metabolic-syndrome",
    "title": {
      "en": "Metabolic syndrome — abdominal obesity, insulin resistance and lifestyle reversal",
      "ur": "میٹابولک سنڈروم — پیٹ کی چربی، شوگر، بی پی اور طرزِ زندگی میں تبدیلی",
      "roman": "Metabolic syndrome — pait ki charbi, BP aur sugar se bachao"
    },
    "content": {
      "en": "• Metabolic syndrome is a cluster of conditions (waist >90 cm in men, >80 cm in women, elevated blood pressure, high triglycerides, low HDL, raised fasting glucose) that multiplies heart disease and stroke risk\n• LIFESTYLE REVERSAL: Engage in 150 minutes of moderate aerobic exercise (brisk walking 30 min, 5 days/week)\n• Adopt a healthy diet: eliminate banaspati ghee, bakery goods, sweetened beverages, and refined white flour; replace with whole grains, lentils, fresh salads, and nuts\n• Target 5–10% gradual body weight reduction\nSEE A DOCTOR IF: For regular metabolic panel tests (fasting lipid profile, HbA1c, liver enzymes, blood pressure tracking).\nEMERGENCY / GO IMMEDIATELY: Crushing central chest pain, pain radiating to left arm/jaw, sudden breathlessness, facial drooping, or slurred speech.",
      "ur": "• میٹابولک سنڈروم میں پیٹ پر چربی (مردوں میں 90 سینٹی میٹر اور خواتین میں 80 سینٹی میٹر سے زیادہ)، ہائی بلڈ پریشر، خون میں چکنائی اور شوگر کی زیادتی شامل ہے جو ہارٹ اٹیک کا خطرہ بڑھاتی ہے\n• طرزِ زندگی بدلیں: ہفتے میں 5 دن روزانہ 30 منٹ تیز واک کریں\n• گھی، ڈالڈا، بیکری، کولڈ ڈرنکس اور چینی سے مکمل پرہیز کریں؛ دالیں، سبزیاں، چکی کا آٹا اور سلاد استعمال کریں\n• وزن میں 5 سے 10 فیصد کمی سے یہ تمام مسائل حل ہو سکتے ہیں\nڈاکٹر کو دکھائیں: لپڈ پروفائل، شوگر اور بی پی کے باقاعدہ چیک اپ کے لیے ڈاکٹر کے پاس جائیں\nایمرجنسی (فوراً جائیں): سینے میں شدید بوجھ یا درد، بائیں بازو میں درد، سانس کا اکھڑنا، یا بولنے میں دشواری (ہارٹ اٹیک/فالج)۔",
      "roman": "• Metabolic syndrome mein pait ki charbi, high BP aur sugar mil kar heart attack ka khatra barhate hain\n• Rozana 30 minute tez walk karein aur wazan kam karein\n• Ghee, cheeni aur bakery se sakht parhez karein; sabziyan aur daalein khayein\nDOCTOR KO DIKHAYEIN: BP, sugar aur lipid profile test karwayein\nEMERGENCY (FORI JAYEIN): Seene par shadeed bojh, baen baazu mein dard ya behoshi."
    },
    "tags": [
      "metabolic syndrome",
      "abdominal obesity",
      "pait ki charbi",
      "میٹابولک سنڈروم",
      "insulin resistance",
      "waist fat",
      "high triglycerides",
      "heart disease prevention",
      "lifestyle medicine",
      "bp sugar cholesterol"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Cardiovascular disease prevention and control: metabolic risk factors",
      "url": "https://www.who.int/cardiovascular_diseases/guidelines",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "stye-chalazion",
    "topic": "stye",
    "title": {
      "en": "Eye stye & chalazion (anjanari / guhanjani) — warm compresses and eyelid hygiene",
      "ur": "آنکھ کی گہانجنی اور پھنسی (Stye) — گرم ٹکور، صفائی اور احتیاط",
      "roman": "Aankh ki anjanari aur phinsi (stye) — garam saik aur safai"
    },
    "content": {
      "en": "• A stye (hordeolum) is a tender red bump on the eyelid edge caused by a blocked and infected eyelash follicle or oil gland\n• APPLY WARM COMPRESSES: Soak a clean cloth in warm water, wring out, and hold against closed eye for 10–15 minutes, 3–4 times daily to melt trapped oils and speed drainage\n• Keep eyelids clean; do NOT wear eye makeup or contact lenses while stye is active\n• NEVER SQUEEZE, POP, OR PIERCE A STYE WITH A NEEDLE (this spreads infection into the eye socket)\nSEE A DOCTOR IF: The stye does not improve within 7–10 days, becomes a hard painless lump (chalazion), or interferes with vision.\nEMERGENCY / GO IMMEDIATELY: Redness and swelling spreading to the entire eyelid and cheek (orbital cellulitis), high fever, or eye bulging forward.",
      "ur": "• آنکھ کی گہانجنی (Stye) پلک کے کنارے پر غدود میں انفیکشن سے بننے والی دردناک پھنسی ہے\n• گرم پانی کی ٹکور کریں: صاف کپڑے کو نیم گرم پانی میں بھگو کر دن میں 3-4 بار 10-15 منٹ آنکھ پر رکھیں تاکہ پھنسی قدرتی طور پر کھل جائے\n• آنکھ کو صاف رکھیں؛ کاجل، سرمہ اور کانٹیکٹ لینز کا استعمال بند کریں\n• پھنسی کو سوئی سے پھوڑنے یا ہاتھ سے دبانے کی ہرگز کوشش نہ کریں (انفیکشن آنکھ میں پھیل سکتا ہے)\nڈاکٹر کو دکھائیں: گہانجنی 7-10 دن میں ٹھیک نہ ہو، سخت گٹھلی بن جائے یا نظر متاثر ہو\nایمرجنسی (فوراً جائیں): سوجن پوری آنکھ اور گال پر پھیل جانا، آنکھ کا باہر کو ابلنا، یا تیز بخار۔",
      "roman": "• Guhanjani (stye) palkon par dardnak phinsi hoti hai\n• Garam saaf kapray se din mein 3-4 baar 15 minute takore karein\n• Phinsi ko hargiz na nichorein aur na phorein; lens na pehnein\nDOCTOR KO DIKHAYEIN agar: 7-10 din mein theek na ho ya gaanth ban jaye\nEMERGENCY (FORI JAYEIN): Aankh aur gaal par shadeed soojan phailna ya bukhar.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "stye",
      "chalazion",
      "anjanari",
      "guhanjani",
      "گہانجنی",
      "آنکھ کی پھنسی",
      "eye bump",
      "eyelid pimple",
      "eyelid swelling",
      "hordeolum",
      "warm compress eye",
      "phinsi aankh par"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Primary eye care: eyelid lesions and common external eye diseases",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "cataract-motia",
    "topic": "cataract",
    "title": {
      "en": "Cataract (safaid motia) — vision clouding, glare and surgical restoration",
      "ur": "سفید موتیا (Cataract) — دھندلا دکھائی دینا، علامات اور آپریشن کی معلومات",
      "roman": "Safaid motia (cataract) — dhundli nazar, asbaab aur ilaaj"
    },
    "content": {
      "en": "• Cataract is the gradual clouding of the eye's natural crystalline lens, causing foggy/blurry vision, poor night vision, and halos around lights\n• Protect eyes from UV radiation: wear UV-blocking sunglasses outdoors\n• Ensure good bright reading lighting; manage diabetes strictly to slow progression\n• Eye drops or medications CANNOT dissolve cataracts — safe modern outpatient surgery (Phacoemulsification with intraocular lens) is the only definitive cure\nSEE A DOCTOR IF: For visual acuity testing and cataract evaluation when blurry vision interferes with daily tasks (reading, driving).\nEMERGENCY / GO IMMEDIATELY: Sudden severe eye pain, sudden redness, or sudden blackout of vision.",
      "ur": "• سفید موتیا میں آنکھ کا قدرتی لینز دھندلا ہو جاتا ہے جس سے دھندلا دکھائی دیتا ہے، رات کو گاڑی چلاتے ہوئے بتیاں چمکتی ہیں اور رنگ مدہم لگتے ہیں\n• دھوپ میں نکلتے وقت دھوپ کے چشمے (Sunglasses) پہنیں اور شوگر کنٹرول رکھیں\n• پڑھتے وقت تیز روشنی کا استعمال کریں\n• قطرے یا دوائیاں سفید موتیے کو ختم نہیں کر سکتیں — فیکو آپریشن (Phaco) اور لینز ڈلوانا ہی اس کا واحد اور محفوظ علاج ہے\nڈاکٹر کو دکھائیں: نظر کا معائنہ کروانے اور آپریشن کے مشورے کے لیے آنکھوں کے ڈاکٹر کو دکھائیں\nایمرجنسی (فوراً جائیں): آنکھ میں اچانک شدید درد، سرخی یا بینائی کا اچانک غائب ہو جانا۔",
      "roman": "• Safaid motia mein nazar dhundli ho jati hai aur raat ko roshni phailti hai\n• Dhoop ke chashmay pehnein aur sugar control rakhein\n• Drop ya dawa se motia theek nahi hota — phaco operation se naya lens lagwayein\nDOCTOR KO DIKHAYEIN: Eye specialist doctor se nazar check karwayein\nEMERGENCY (FORI JAYEIN): Aankh mein achanak shadeed dard ya nazar band hona."
    },
    "tags": [
      "cataract",
      "safaid motia",
      "سفید موتیا",
      "cloudy vision",
      "blurred vision elderly",
      "night glare",
      "halos lights",
      "phaco surgery",
      "intraocular lens",
      "motia operation",
      "motiya"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Blindness and vision impairment: cataract guidance",
      "url": "https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "glaucoma-emergency",
    "topic": "glaucoma",
    "title": {
      "en": "Acute glaucoma (kaala motia) — high intraocular pressure and sight-saving emergency",
      "ur": "کالا موتیا اور آنکھ کا دباؤ (Glaucoma) — اچانک درد اور ہنگامی طبی امداد",
      "roman": "Kaala motia (glaucoma) — achanak aankh dard aur fori hospital"
    },
    "content": {
      "en": "• Acute angle-closure glaucoma is a medical EMERGENCY where fluid drainage in the eye is blocked, causing eye pressure to spike dangerously and destroy the optic nerve within hours\n• SYMPTOMS: Sudden severe eye pain, intense headache on the same side, rainbow halos around lights, red eye, and nausea/vomiting\n• GO TO AN EYE HOSPITAL EMERGENCY ROOM IMMEDIATELY; do NOT rub the eye; do NOT take pupil-dilating eye drops\n• Chronic open-angle glaucoma develops silently without early pain — adults over 40 should get regular routine eye pressure checkups\nSEE A DOCTOR IF: Immediately for urgent pressure-lowering drops, intravenous acetazolamide, and laser iridotomy.\nEMERGENCY / GO IMMEDIATELY: Sudden excruciating eye pain with headache, vomiting, rainbow halos, and hazy vision.",
      "ur": "• کالا موتیا (Glaucoma) ایک ایمرجنسی ہے جس میں آنکھ کا اندرونی دباؤ اچانک بہت زیادہ بڑھ جاتا ہے جو چند گھنٹوں میں بینائی کی نس کو تباہ کر سکتا ہے\n• علامات: آنکھ میں اچانک شدید درد، سر کا آدھا درد، روشنی کے گرد قوسِ قزح کے دائرے، آنکھ کی سرخی اور الٹی آنا\n• فوراً آنکھوں کے ایمرجنسی ہسپتال جائیں؛ آنکھ کو مت مسلیں اور کوئی ڈراپ نہ ڈالیں\n• 40 سال سے زیادہ عمر کے افراد باقاعدگی سے آنکھ کا پریشر چیک کروائیں\nڈاکٹر / ہسپتال ایمرجنسی جائیں: آنکھ کے اندرونی دباؤ کو کم کرنے والے فوری علاج کے لیے ہسپتال پہنچیں\nایمرجنسی (فوراً جائیں): آنکھ میں اچانک ناقابل برداشت درد، سر درد، الٹیاں اور نظر کا دھندلا ہونا۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• Kaala motia (glaucoma) mein aankh ka pressure achanak barh kar nazar khatam kar sakta hai\n• Alamaat: Aankh mein achanak shadeed dard, ulti, roshni ke gird rang aur laali\n• Foran eye hospital emergency jayein aur koi drop na dalein\nDOCTOR / EYE HOSPITAL EMERGENCY JAYEIN: Fori pressure kam karne wali dawai ke liye clinic jayein\nEMERGENCY (FORI JAYEIN): Aankh mein achanak intehai shadeed dard aur nazar dhundli hona.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "glaucoma",
      "acute glaucoma",
      "kaala motia",
      "کالا موتیا",
      "high eye pressure",
      "eye pain nausea",
      "rainbow halos",
      "optic nerve",
      "angle closure",
      "eye emergency",
      "motia emergency"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Glaucoma: priority eye disease guidelines",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "dry-eye-syndrome",
    "topic": "dry-eye",
    "title": {
      "en": "Dry eye syndrome — artificial tears, 20-20-20 screen rule and environmental care",
      "ur": "آنکھوں کی خشکی (Dry Eye) — قطرے، اسکرین کے اوقات اور گھریلو دیکھ بھال",
      "roman": "Aankhon ki khushki (dry eye) — artificial tears aur dekh bhaal"
    },
    "content": {
      "en": "• Dry eye syndrome occurs when tears are insufficient or evaporate too quickly, causing a gritty/sandy feeling, burning, stinging, redness, and paradoxically watery eyes\n• PRACTICE THE 20-20-20 RULE: Every 20 minutes of screen use, look at an object 20 feet away for 20 seconds and blink deliberately\n• Use preservative-free artificial tear lubricating eye drops 3–4 times daily\n• Avoid fans or air conditioners blowing directly into your face; wear wraparound sunglasses in dusty windy weather; place a warm damp cloth on closed eyes for 5 minutes daily\nSEE A DOCTOR IF: Eye redness and burning persist despite artificial tears, or vision becomes blurred.\nEMERGENCY / GO IMMEDIATELY: Severe sharp eye pain, sudden loss of vision, thick yellow pus, or a white opaque spot on the clear cornea (corneal ulcer).",
      "ur": "• آنکھوں کی خشکی میں آنکھ میں ریت کا احساس، جلن، چبھن اور بار بار پانی آتا ہے جو موبائل اسکرین کے زیادہ استعمال یا پنکھے کی ہوا سے ہوتا ہے\n• 20-20-20 اصول اپنائیں: ہر 20 منٹ اسکرین دیکھنے کے بعد 20 سیکنڈ کے لیے 20 فٹ دور دیکھیں اور آنکھیں جھپکیں\n• ڈاکٹر کے مشورے سے مصنوعی آنسو والے قطرے (Artificial tears) دن میں 3-4 بار ڈالیں\n• پنکھے یا اے سی کی ہوا براہِ راست چہرے پر نہ لگنے دیں اور دھوپ کے چشمے استعمال کریں\nڈاکٹر کو دکھائیں: قطروں کے باوجود جلن اور سرخی ٹھیک نہ ہو یا روشنی چبھتی ہو\nایمرجنسی (فوراً جائیں): آنکھ میں شدید چبھتا ہوا درد، بینائی کا اچانک کم ہونا، یا کالی پتلی پر سفید داغ بننا (کارنیا کا السر)۔",
      "roman": "• Aankhon ki khushki mein jalan, chubhan aur ret jaisa mehsoos hota hai\n• 20-20-20 rule apnayein: har 20 minute screen ke baad 20 second door dekhein\n• Artificial tears eye drops dalein aur pankhay ki seedhi hawa se bachein\nDOCTOR KO DIKHAYEIN agar: drops ke bawajood jalan theek na ho\nEMERGENCY (FORI JAYEIN): Aankh mein shadeed dard ya safeed daagh ban jana.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "dry eye",
      "dry eye syndrome",
      "aankhon ki khushki",
      "آنکھوں کی خشکی",
      "burning eyes",
      "gritty eyes",
      "artificial tears",
      "20 20 20 rule",
      "screen eye strain",
      "watery burning eyes"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Primary eye health and digital eye strain guidelines",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "tinnitus-ringing-ears",
    "topic": "tinnitus",
    "title": {
      "en": "Tinnitus & ringing in ears — sound masking, hearing protection and medical evaluation",
      "ur": "کان میں گھنٹیاں اور آوازیں (Tinnitus) — وجوہات، کان کی حفاظت اور رہنمائی",
      "roman": "Kaan me aawazein aur ghanti (tinnitus) — asbaab aur dekh bhaal"
    },
    "content": {
      "en": "• Tinnitus is hearing ringing, buzzing, hissing, or whistling sounds with no external sound source, often linked to earwax blockage, loud noise exposure, or hearing loss\n• USE SOUND MASKING: Play gentle background white noise, low fan sounds, or soft music, especially when trying to sleep in quiet rooms\n• Protect hearing: wear earplugs around loud machinery, weddings, power tools, and keep headphone volumes below 60%\n• Reduce dietary salt, caffeine, nicotine, and stress; check blood pressure\nSEE A DOCTOR IF: For earwax removal, formal audiometry hearing test, and medical assessment.\nEMERGENCY / GO IMMEDIATELY: Tinnitus accompanied by sudden unilateral hearing loss, severe spinning vertigo, facial numbness, or rhythmic whooshing sounds matching your heartbeat (pulsatile tinnitus).",
      "ur": "• کان میں سیٹیاں، گھنٹیاں یا شور کی آوازیں آنا ٹنائٹس (Tinnitus) کہلاتا ہے جو کان کے میل، اونچی آواز کے نقصان یا بلڈ پریشر سے ہو سکتا ہے\n• ساؤنڈ ماسکنگ کریں: سوتے وقت مدہم پنکھے کی آواز یا وائٹ نائز چلائیں تاکہ کان کی آواز پر دھیان نہ جائے\n• کانوں کی حفاظت کریں: اونچی آواز، شوروغل، اور اونچے والیوم پر ہیڈ فون کے استعمال سے پرہیز کریں\n• نمک، چائے اور سگریٹ کم کریں اور بی پی چیک کروائیں\nڈاکٹر کو دکھائیں: کان کے معائنے (میل صاف کرنے) اور سماعت کے ٹیسٹ (Audiometry) کے لیے ای این ٹی ڈاکٹر کو دکھائیں\nایمرجنسی (فوراً جائیں): ایک کان کی بینائی/سماعت کا اچانک بالکل بند ہو جانا، شدید چکر، یا دل کی دھڑکن کے ساتھ کان میں چھپ چھپ کی آواز آنا۔",
      "roman": "• Kaan mein ghanti ya seeti ki aawaz aana tinnitus hota hai\n• Sote waqt halka pankha ya music chalayein taake dhyan na jaye\n• Headphone ka volume kam rakhein aur shor se bachein\nDOCTOR KO DIKHAYEIN: ENT specialist doctor se kaan check karwayein aur hearing test karwayein\nEMERGENCY (FORI JAYEIN): Achanak sunai dena band hona ya shadeed chakkar aana."
    },
    "tags": [
      "tinnitus",
      "ringing ears",
      "kaan me aawaz",
      "kaan me ghanti",
      "کان میں گھنٹیاں",
      "ٹنائٹس",
      "buzzing ear",
      "ear ringing",
      "sound masking",
      "ear noise",
      "pulsatile tinnitus"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Deafness and hearing loss: prevention and tinnitus management",
      "url": "https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "foreign-body-ear-nose",
    "topic": "foreign-body",
    "title": {
      "en": "Foreign object in ear or nose — safe removal limits and emergency ENT retrieval",
      "ur": "کان یا ناک میں چیز پھنسنا — ابتدائی احتیاط، خطرات اور ڈاکٹر سے مدد",
      "roman": "Kaan ya naak me cheez phansna — hifazat aur ENT doctor"
    },
    "content": {
      "en": "• Children frequently place beads, seeds, buttons, or small batteries into nostrils or ears\n• FOR NOSE: Have the child gently blow out through the blocked nostril while pressing the clear nostril closed with a finger (do NOT blow hard)\n• FOR LIVE INSECT IN EAR: Tilt head with affected ear upward and instill a few drops of baby oil or olive oil to suffocate the insect, then tilt down to drain\n• DO NOT USE TWEEZERS, MATCHSTICKS, OR PINS (this pushes objects deeper, perforates eardrum, or causes airway inhalation)\nSEE A DOCTOR IF: For safe illuminated medical removal with proper instrumentation.\nEMERGENCY / GO IMMEDIATELY: BUTTON BATTERIES IN NOSE OR EAR (button batteries discharge electric current and leak alkaline chemicals, causing tissue necrosis and septal/eardrum perforation in 2 hours), choking, or severe bleeding.",
      "ur": "• بچے اکثر ناک یا کان میں موتی، دانہ، ماچس کا مصالحہ یا بٹن سیل ڈال لیتے ہیں\n• ناک میں چیز ہو تو: دوسرا نتھنا انگلی سے بند کر کے بچے کو آہستہ سے ناک چھنکنے کو کہیں\n• کان میں کیڑا ہو تو: کان میں بے بی آئل یا زیتون کے تیل کے چند قطرے ڈالیں تاکہ کیڑا بے دم ہو کر باہر نکل آئے\n• سوئی، چمٹی، ماچس کی تیلی یا سیفٹی پن کان میں ہرگز نہ ڈالیں (اس سے کان کا پردہ پھٹ سکتا ہے یا چیز سانس کی نالی میں جا سکتی ہے)\nڈاکٹر کو دکھائیں: ای این ٹی ڈاکٹر کے پاس جا کر محفوظ طریقے سے چیز نکلوائیں\nایمرجنسی (فوراً جائیں): ناک یا کان میں بٹن سیل (Button Battery) کا پھنسنا (یہ 2 گھنٹے میں نالی کو جلا دیتا ہے)، سانس رکنا، یا شدید خون بہنا۔",
      "roman": "• Naak ya kaan mein koi cheez phans jaye to chimti ya teeli hargiz na dalein\n• Naak mein ho to doosra nathna daba kar aahista se phoonk marein\n• Kaan mein keera ho to tail ke drop dalein\nDOCTOR KO DIKHAYEIN: ENT doctor se safe tareeqay se nikloyein\nEMERGENCY (FORI JAYEIN): Kaan ya naak mein battery (cell) phansna fori emergency hai."
    },
    "tags": [
      "foreign body",
      "foreign object in ear",
      "object in nose",
      "kaan me cheez",
      "naak me cheez",
      "ناک میں چیز",
      "کان میں چیز",
      "button battery nose",
      "insect in ear",
      "nose foreign object",
      "kaan me keera",
      "ent emergency"
    ],
    "baseLevel": "URGENT",
    "audience": "child",
    "source": {
      "publisher": "WHO / IFRC",
      "title": "First aid guidelines for foreign body in ear and nose",
      "url": "https://www.ifrc.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "periapical-abscess",
    "topic": "dental-abscess",
    "title": {
      "en": "Dental abscess & tooth infection (dant me peep) — pain relief and emergency drainage",
      "ur": "دانت کا پھوڑا اور پیپ (Dental Abscess) — سوجن، درد اور فوری علاج",
      "roman": "Dant me peep aur danbal (tooth abscess) — sujan aur dental ilaaj"
    },
    "content": {
      "en": "• A dental abscess is a bacterial pus collection at the tooth root or gum, causing severe throbbing toothache radiating to jaw, ear, and neck\n• Rinse with warm salt water (half tsp salt in warm water) every 2 hours to soothe gums and draw out fluid\n• Take pharmacist-approved pain relief (paracetamol or ibuprofen); apply an ice pack to the outside of the cheek\n• Do NOT apply hot heating pads to the cheek (heat accelerates swelling and pus expansion); NEVER try to pop or lance an abscess with a needle\nSEE A DOCTOR IF: An abscess requires professional dental drainage, root canal treatment, or extraction along with prescribed antibiotics.\nEMERGENCY / GO IMMEDIATELY: Rapidly expanding facial or cheek swelling, swelling spreading to neck/under jaw (Ludwig's angina), high fever, difficulty opening mouth, or difficulty swallowing and breathing.",
      "ur": "• دانت کی جڑ میں پیپ پڑنے (Dental Abscess) سے جبڑے، کان اور گردن تک شدید کسک والا درد اور چہرے پر سوجن ہو جاتی ہے\n• نیم گرم نمک ملے پانی سے دن میں کئی بار کلیاں کریں جس سے مسوڑھوں کو سکون ملتا ہے\n• گال کے باہر برف کی ٹکور کریں؛ گرم پانی کی ٹکور ہرگز نہ کریں (گرمی سے پیپ پھیلتی ہے)\n• سوئی سے پیپ نکالنے کی ہرگز کوشش نہ کریں\nڈاکٹر کو دکھائیں: اسی دن دانتوں کے ڈاکٹر (Dentist) کو دکھائیں تاکہ پیپ نکالی جائے اور روٹ کینال یا علاج ہو سکے\nایمرجنسی (فوراً جائیں): چہرے، گال یا گردن کے نیچے تیزی سے شدید سوجن پھیلنا، منہ نہ کھلنا، تیز بخار، یا نگلنے اور سانس لینے میں دشواری۔",
      "roman": "• Dant ki jarh mein peep parhne se shadeed dard aur gaal par sujan hoti hai\n• Neem garam namak ke paani se kulliyan karein aur gaal par barf lagayein\n• Garam saik na karein aur sui se peep na nikalein\nDOCTOR KO DIKHAYEIN: Usi din dentist doctor se root canal ya ilaaj karwayein\nEMERGENCY (FORI JAYEIN): Chehre ya gardan par shadeed soojan phailna ya saans lene mein takleef."
    },
    "tags": [
      "dental abscess",
      "tooth abscess",
      "dant me peep",
      "دانت کا پھوڑا",
      "دانت میں پیپ",
      "periapical abscess",
      "tooth infection",
      "throbbing tooth pain",
      "swollen cheek",
      "gum boil",
      "root canal",
      "dental pus"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Oral health and dental emergency management",
      "url": "https://www.who.int/news-room/fact-sheets/detail/oral-health",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "dental-trauma-knocked-out",
    "topic": "dental-trauma",
    "title": {
      "en": "Knocked-out tooth & dental trauma — immediate preservation and 30-minute reimplantation",
      "ur": "ٹوٹا ہوا دانت اور چوٹ (Dental Trauma) — فوری حفاظت اور 30 منٹ میں دوبارہ لگانا",
      "roman": "Dant tootna ya nikal jana (knocked out tooth) — fori first aid aur dentist"
    },
    "content": {
      "en": "• A knocked-out permanent tooth (avulsed tooth) can be saved if reimplanted within 30–60 minutes\n• STEP 1: Pick up tooth ONLY BY THE CROWN (white chewing top) — NEVER touch the tooth root\n• STEP 2: If dirty, rinse gently in cold milk or saline for 10 seconds (do NOT scrub, wash with soap, or dry with tissue)\n• STEP 3: If possible, gently insert tooth back into socket and hold in place by biting on clean gauze\n• STEP 4: If unable to reinsert, store tooth immediately in a cup of COLD MILK or patient's own saliva (do NOT store in plain water or dry air)\nSEE A DOCTOR IF: Any dental trauma or tooth fracture occurs, within 30–60 minutes for best salvage.\nEMERGENCY / GO IMMEDIATELY: Rush directly to an emergency dentist or hospital within 30–60 minutes with the tooth in milk.",
      "ur": "• چوٹ لگنے سے پورا دانت جڑ سمیت نکل جائے تو 30 سے 60 منٹ میں دوبارہ لگایا جا سکتا ہے\n• دانت کو صرف اوپر کے سفید حصے سے پکڑیں — نیچے جڑ کو ہاتھ ہرگز نہ لگائیں\n• اگر مٹی لگی ہو تو ٹھنڈے دودھ یا نارمل سلائن سے 10 سیکنڈ دھوئیں (صابن یا رگڑ سے صاف نہ کریں)\n• اگر ممکن ہو تو دانت کو واپس اسی جگہ بٹھا کر صاف کپڑے سے ہلکا سا دبا کر رکھیں\n• اگر واپس نہ بٹھا سکیں تو دانت کو ٹھنڈے دودھ کے کپ میں یا اپنے تھوک میں رکھیں (سادہ پانی یا سوکھے کپڑے میں نہ رکھیں)\nڈاکٹر کو دکھائیں: دانت لے کر 30 سے 60 منٹ کے اندر دانتوں کے ڈاکٹر کے پاس جائیں\nایمرجنسی (فوراً جائیں): 30 سے 60 منٹ کے اندر قریبی ہسپتال یا ڈینٹل ایمرجنسی پہنچیں تاکہ دانت دوبارہ لگ سکے۔",
      "roman": "• Dant nikal jaye to 30-60 minute mein dentist ke paas le ja kar dobara lagwaya ja sakta hai\n• Dant ko sirf oopri safeed hissay se pakrein; jarh ko haath na lagayein\n• Dant ko thanday doodh mein dhoiyein aur doodh ke cup mein rakh kar le jayein\n• Saada paani ya khushk kapray mein na rakhein\nDOCTOR KO DIKHAYEIN: Fori checkup ke liye clinic jayein\nEMERGENCY (FORI JAYEIN): 30 minute ke andar emergency hospital dentist ke paas jayein."
    },
    "tags": [
      "knocked out tooth",
      "dental trauma",
      "dant tootna",
      "avulsed tooth",
      "ٹوٹا ہوا دانت",
      "tooth knocked out",
      "milk for tooth",
      "tooth first aid",
      "broken tooth",
      "tooth in socket"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": {
      "publisher": "WHO / IFRC",
      "title": "First aid guidelines for dental trauma and avulsed teeth",
      "url": "https://www.ifrc.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "oral-thrush-candidiasis",
    "topic": "oral-thrush",
    "title": {
      "en": "Oral thrush & white mouth patches (candidiasis) — antifungal drops and mouth care",
      "ur": "منہ میں سفید پھپھوندی (Oral Thrush) — وجوہات، صفائی اور اینٹی فنگل علاج",
      "roman": "Munh me safeed phaphoondi (oral thrush) — safai aur nystatin drops"
    },
    "content": {
      "en": "• Oral thrush is a fungal Candida infection causing creamy white curd-like patches on tongue, inner cheeks, and palate that leave red raw areas when wiped, common in infants, denture wearers, and inhaler users\n• RINSE AFTER ASTHMA INHALERS: Always rinse mouth thoroughly with water and spit out after using steroid inhalers (or use a spacer)\n• Sterilize baby feeding bottles, nipples, pacifiers, and toys daily\n• Remove dentures at night and disinfect in cleansing solution; clean mouth with soft brush\nSEE A DOCTOR IF: For prescription antifungal oral drops (Nystatin suspension or miconazole gel) used for 7–14 days.\nEMERGENCY / GO IMMEDIATELY: Thrush spreading down into throat causing painful inability to swallow fluids, severe dehydration, or high fever.",
      "ur": "• منہ میں سفید پھپھوندی (Oral Thrush) فنگس کی وجہ سے ہوتی ہے جس سے زبان اور گالوں کے اندر دہی جیسے سفید چھالے بنتے ہیں\n• انہیلر کے بعد کلی کریں: اسٹیرائڈ انہیلر کے استعمال کے فوراً بعد پانی سے اچھی طرح کلی کر کے تھوکیں\n• بچوں کے فیڈر، چوسنی اور کھلونے روزانہ ابلتے پانی سے صاف کریں\n• رات کو دانتوں کی بتیسی (Dentures) نکال کر صاف پانی میں رکھیں\nڈاکٹر کو دکھائیں: اینٹی فنگل ڈراپس (Nystatin drops) کے لیے ڈاکٹر یا ڈینٹسٹ کو دکھائیں\nایمرجنسی (فوراً جائیں): گلے میں سفید دانے پھیلنے سے پانی نگلنا ناممکن ہو جانا یا تیز بخار۔",
      "roman": "• Munh mein safeed phaphoondi (oral thrush) zaban par dahi jaise chhale banati hai\n• Inhaler ke baad paani se kulli karein aur feeder ko rozana ubaal kar saaf karein\n• Raat ko bateezi (dentures) nikaal kar rakhein\nDOCTOR KO DIKHAYEIN: Nystatin drops ke liye doctor ko dikhayein\nEMERGENCY (FORI JAYEIN): Halaq mein phail kar paani nigalna band ho jana."
    },
    "tags": [
      "oral thrush",
      "candidiasis mouth",
      "munh me phaphoondi",
      "منہ میں پھپھوندی",
      "white tongue",
      "nystatin drops",
      "oral fungus",
      "denture thrush",
      "steroid inhaler thrush",
      "safeed zaban"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Oral health surveys and management of oral fungal infections",
      "url": "https://www.who.int/news-room/fact-sheets/detail/oral-health",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "thalassemia-guidance",
    "topic": "thalassemia",
    "title": {
      "en": "Thalassemia trait & major — premarital screening, iron caution and transfusion care",
      "ur": "تھیلیسیمیا اور خون کی پیدائش کا نقص — شادی سے پہلے ٹیسٹ، خون کی منتقلی اور دیکھ بھال",
      "roman": "Thalassemia (khoon ki bimari) — screening, blood transfusion aur dekh bhaal"
    },
    "content": {
      "en": "• Thalassemia is an inherited blood disorder with reduced hemoglobin production; Thalassemia Minor (Trait) is a mild carrier state, while Thalassemia Major requires lifelong blood transfusions every 2–4 weeks\n• PREMARITAL SCREENING: Mandatory Hb Electrophoresis blood testing before marriage prevents two carriers from having children with Thalassemia Major\n• DO NOT TAKE UNPRESCRIBED IRON PILLS: Iron does NOT cure thalassemia and causes dangerous toxic iron overload in heart and liver\n• Thalassemia Major patients must adhere to regular iron chelation therapy (deferasirox/desferal) and receive screened, washed packed red blood cells\nSEE A DOCTOR IF: For accurate hemoglobin electrophoresis interpretation and registration with a certified thalassemia transfusion center.\nEMERGENCY / GO IMMEDIATELY: High fever with shaking chills in a transfused patient, severe sudden pallor with rapid pulse, dark tea-colored urine with yellow jaundice, or severe abdominal pain (splenic crisis).",
      "ur": "• تھیلیسیمیا خون کی پیدائشی بیماری ہے جس میں ہیموگلوبن نہیں بنتا؛ تھیلیسیمیا مائنر بے ضرر ہے جبکہ میجر میں ہر ماہ خون لگوانا پڑتا ہے\n• شادی سے پہلے خون کا ٹیسٹ (Hb Electrophoresis) لازمی کروائیں تاکہ بچوں کو تھیلیسیمیا میجر سے بچایا جا سکے\n• ڈاکٹر کے مشورے کے بغیر فولاد (Iron) کی گولیاں ہرگز نہ لیں — تھیلیسیمیا میں آئرن دل اور جگر میں زہر بن کر جمع ہو جاتا ہے\n• تھیلیسیمیا میجر کے مریض خون لگوانے کے ساتھ اضافی لوہا نکالنے کی دوائیاں (Chelation) باقاعدگی سے لیں\nڈاکٹر کو دکھائیں: خون کے ماہر ڈاکٹر (Hematologist) سے ٹیسٹ اور تھیلیسیمیا سنٹر میں رجسٹریشن کروائیں\nایمرجنسی (فوراً جائیں): خون لگنے کے بعد تیز بخار اور کپکپی، بچہ اچانک بہت پیلا پڑ جانا، پیشاب گہرا آنا یا پیٹ میں شدید درد۔",
      "roman": "• Thalassemia khoon ki maurusi bimari hai; shadi se pehle Hb Electrophoresis test zaroor karwayein\n• Iron ki goliyan hargiz na lein kyunke iron jigar mein jama hota hai\n• Thalassemia major ke mareez safe blood lagwayein aur chelation dawa lein\nDOCTOR KO DIKHAYEIN: Specialist doctor se mashwara karein aur registration karwayein\nEMERGENCY (FORI JAYEIN): Khoon lagne ke baad tez bukhar, peelia ya shadeed pait dard."
    },
    "tags": [
      "thalassemia",
      "thalassemia trait",
      "thalassemia major",
      "تھیلیسیمیا",
      "خون کی کمی",
      "hb electrophoresis",
      "premarital screening",
      "iron overload",
      "blood transfusion child",
      "chelation therapy",
      "inherited anemia"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO / Pakistan MoNHSRC",
      "title": "Guidelines for the clinical management of thalassaemia",
      "url": "https://www.nhsrc.gov.pk",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "bleeding-bruising-disorders",
    "topic": "bruising",
    "title": {
      "en": "Easy bruising & abnormal bleeding — platelet disorders, hemophilia and red flags",
      "ur": "جسم پر نیل پڑنا اور غیر معمولی خون بہنا — وجوہات، احتیاط اور علامات",
      "roman": "Jism par neel parna aur bleeding disorders — dekh bhaal aur test"
    },
    "content": {
      "en": "• Easy bruising or prolonged bleeding occurs when blood clotting is impaired by low platelets (ITP, dengue), clotting factor deficiencies (hemophilia), or blood thinner medications\n• Protect skin and limbs from trauma, falls, and contact sports\n• Avoid aspirin, NSAIDs (brufen/diclofenac), and unverified blood-thinning herbal pills which worsen bleeding\n• Use a soft-bristled toothbrush to prevent gum bleeding; apply firm continuous direct pressure for 15 full minutes to any bleeding cut\nSEE A DOCTOR IF: For complete blood count (CBC with platelet count) and coagulation profile (PT/INR, APTT).\nEMERGENCY / GO IMMEDIATELY: Uncontrolled bleeding not stopping after 15 minutes of direct pressure, spontaneous large painful joint swellings (hemarthrosis), coughing/vomiting blood, black tarry stools, or sudden pinpoint purple rash (petechiae/purpura) with high fever.",
      "ur": "• جسم پر بغیر چوٹ کے نیل پڑنا، مسوڑھوں سے خون آنا، یا خون کا نہ رکنا پلیٹلیٹس کی کمی (ITP/ڈینگی) یا ہیموفیلیا کی علامت ہو سکتا ہے\n• چوٹ اور گرنے سے بچیں اور سخت کھیل کود سے پرہیز کریں\n• اسپرین، بروفین اور خون پتلا کرنے والی ادویات ہرگز نہ لیں جو خون کو مزید بہاتی ہیں\n• نرم برش استعمال کریں اور کٹ لگنے پر 15 منٹ تک کپڑے سے مسلسل دبا کر رکھیں\nڈاکٹر کو دکھائیں: خون کے ٹیسٹ (CBC پلیٹلیٹس اور PT/APTT) کے لیے ڈاکٹر کو دکھائیں\nایمرجنسی (فوراً جائیں): دباؤ کے باوجود خون کا نہ رکنا، جوڑوں کے اندر خون بھرنا، الٹی یا پاخانے میں خون، یا جسم پر جامنی باریک نقطے (Purpura)۔",
      "roman": "• Jism par neel parna ya khoon na rukna platelets ki kami ya bleeding disorder ho sakta hai\n• Chot se bachein aur aspirin ya brufen na lein\n• Zakhm par 15 minute musalsal dabao dalein\nDOCTOR KO DIKHAYEIN: Platelets aur clotting test ke liye doctor ko dikhayein\nEMERGENCY (FORI JAYEIN): 15 minute dabane par bhi khoon na rukay ya joron mein khoon bhar jaye."
    },
    "tags": [
      "bleeding disorder",
      "easy bruising",
      "neel parna",
      "جسم پر نیل پڑنا",
      "platelets",
      "itp",
      "hemophilia",
      "blood clotting",
      "purpura",
      "petechiae",
      "spontaneous bleeding"
    ],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Guidelines for the management of hemophilia and bleeding disorders",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "lymph-node-swelling",
    "topic": "lymph-node",
    "title": {
      "en": "Swollen lymph nodes & glands (gilti) — infection signs versus warning red flags",
      "ur": "گردن اور بغل کی گلٹیاں (Lymph Nodes) — انفیکشن بمقابلہ خطرے کی علامات",
      "roman": "Gardan aur baghal me gilti (lymph nodes) — alamaat aur dekh bhaal"
    },
    "content": {
      "en": "• Lymph nodes are small immune filters in neck, armpits, and groin that swell and become tender during common infections (colds, tonsillitis, tooth abscess)\n• Reactive nodes are typically soft, tender, movable, and shrink back within 2–3 weeks as infection heals\n• Apply a warm moist compress to sore neck nodes for comfort; stay hydrated and rest\n• DO NOT squeeze, knead, or vigorously massage swollen nodes\nSEE A DOCTOR IF: A lymph node remains swollen for >3–4 weeks, is larger than 2 cm, feels hard, painless, and fixed in place, or is located in the collarbone hollow (supraclavicular).\nEMERGENCY / GO IMMEDIATELY: Swollen lymph nodes accompanied by unexplained fever >2 weeks, drenching night sweats, rapid unintentional weight loss, or difficulty swallowing/breathing.",
      "ur": "• گردن، بغلوں اور رانوں کی گلٹیاں (Lymph nodes) گلے کی خرابی، نزلہ زکام یا دانت کے انفیکشن میں سوج جاتی ہیں اور نرم و دردناک ہوتی ہیں\n• انفیکشن ٹھیک ہونے پر یہ گلٹیاں 2-3 ہفتوں میں خود بخود سکڑ کر ٹھیک ہو جاتی ہیں\n• گلٹی پر نیم گرم کپڑے کی ٹکور کریں؛ اسے انگلیوں سے زور سے مت دبائیں اور نہ مسلیں\n• پانی زیادہ پئیں اور آرام کریں\nڈاکٹر کو دکھائیں: گلٹی 3-4 ہفتے سے زیادہ رہے، پتھر کی طرح سخت ہو، بغیر درد کے ہو اور جگہ سے نہ ہلے، یا ہنسلی کی ہڈی (Collarbone) کے اوپر ہو\nایمرجنسی (فوراً جائیں): گلٹی کے ساتھ مسلسل بخار، رات کو کپڑے بھیگنے جتنا پسینہ آنا، تیزی سے وزن گرنا یا سانس میں رکاوٹ۔",
      "roman": "• Gardan ya baghal mein gilti galay ke infection ya daant ke dard se sooj jati hai\n• Yeh aam tor par 2-3 hafte mein theek ho jati hai; ise zor se na dabayein\n• Garam kapray se saik karein\nDOCTOR KO DIKHAYEIN agar: gilti 3-4 hafte se zyada rahe ya sakht ho\nEMERGENCY (FORI JAYEIN): Gilti ke sath raat ko paseenay aana, wazan kam hona ya musalsal bukhar.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "lymph node",
      "swollen glands",
      "gilti",
      "swollen lymph nodes",
      "گلٹیاں",
      "گردن کی گلٹی",
      "rasoli warning",
      "swollen neck nodes",
      "collarbone node",
      "night sweats weight loss",
      "lymphoma warning",
      "supraclavicular node",
      "tender gland"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Early cancer diagnosis and primary care lymphadenopathy evaluation",
      "url": "https://www.who.int/news-room/fact-sheets",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "generalized-anxiety-gad",
    "topic": "gad",
    "title": {
      "en": "Generalized Anxiety Disorder (GAD) — cognitive calming, lifestyle steps and professional help",
      "ur": "مسلسل فکر اور بے چینی (Generalized Anxiety) — ذہنی سکون، ورزش اور علاج",
      "roman": "Musalsal fikar aur bechaini (anxiety) — zehni sukoon aur dekh bhaal"
    },
    "content": {
      "en": "• Generalized anxiety disorder involves excessive, uncontrollable worry about everyday issues lasting months, with muscle tension, restlessness, fatigue, and poor concentration\n• PRACTICE PROGRESSIVE RELAXATION: Tense and release muscle groups from toes to neck, combined with slow deep breathing\n• Set a dedicated 15-minute 'worry time' each afternoon to contain wandering anxious thoughts\n• Stop caffeine, energy drinks, and nicotine which trigger physical racing heart and tremors; do 30 minutes of daily aerobic walking\nSEE A DOCTOR IF: For evidence-based Cognitive Behavioral Therapy (CBT) and medical evaluation.\nEMERGENCY / GO IMMEDIATELY: Call 1166 Mental Health Helpline / 1122 for extreme panic crisis, severe distress, or thoughts of self-harm / suicide.",
      "ur": "• ہر وقت بلاوجہ پریشانی، بےچینی، پٹھوں کا کھچاؤ، دل کی دھڑکن تیز ہونا اور گھبراہٹ رہنا اینزائٹی (GAD) کی علامات ہیں\n• گہرے سانس لیں اور پٹھوں کو ڈھیلا چھوڑنے کی مشقیں کریں\n• دن میں صرف 15 منٹ کا وقت فکر کرنے کے لیے رکھیں اور باقی وقت اپنے معمول کے کاموں پر توجہ دیں\n• چائے، کافی، کولڈ ڈرنکس اور سگریٹ بالکل بند کریں اور روزانہ 30 منٹ واک کریں\nڈاکٹر کو دکھائیں: ماہر نفسیات یا ڈاکٹر سے کاؤنسلنگ اور تھراپی (CBT) کے لیے رجوع کریں\nایمرجنسی (فوراً جائیں): 1166 ہیلپ لائن / 1122 پر رابطہ کریں: شدید گھبراہٹ، ذہنی بحران یا خود کو نقصان پہنچانے کے خیالات آنا۔",
      "roman": "• Musalsal fikar, ghabrahat aur bechaini anxiety ki alamat hai\n• Gehre saans lein aur rozana 30 minute walk karein\n• Chai, coffee aur sigrat band karein\nDOCTOR KO DIKHAYEIN: Psychologist ya doctor se counseling karwayein\nEMERGENCY (FORI JAYEIN): 1166 helpline / 1122 par call karein agar shadeed ghabrahat ya khud ko nuqsan pohanchane ke khayal hon."
    },
    "tags": [
      "generalized anxiety",
      "gad",
      "chronic worry",
      "musalsal fikar",
      "مسلسل فکر",
      "بے چینی",
      "شدید پریشانی",
      "tension anxiety",
      "mental health calms",
      "cbt anxiety",
      "restlessness",
      "bechaini"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO / Umang",
      "title": "Mental health action plan and anxiety disorder interventions",
      "url": "https://www.umangpk.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "depression-major",
    "topic": "depression",
    "title": {
      "en": "Depression & low mood — daily structure, physical activity and support helplines",
      "ur": "شدید اداسی اور ڈپریشن (Depression) — معمولات، ورزش اور مدد حاصل کرنا",
      "roman": "Shadeed udaasi aur depression — rozana routine, warzish aur helpline"
    },
    "content": {
      "en": "• Major depression is characterized by persistent sadness, emptiness, loss of interest in all activities, sleep disturbances, appetite changes, and low energy for >2 weeks\n• Maintain a daily structure: get out of bed at a set hour, shower, dress, and get 20 minutes of morning outdoor sunlight\n• Engage in daily 30-minute physical walking; break overwhelming chores into small, achievable steps\n• Stay connected with family or trusted friends; avoid self-isolation and avoid alcohol\nSEE A DOCTOR IF: For formal assessment, psychological therapy (CBT), and safe medical antidepressant therapy.\nEMERGENCY / GO IMMEDIATELY: Call Helpline 1166 / Umang / 1122 immediately for any thoughts of suicide, plans for self-harm, or feeling unable to keep oneself safe.",
      "ur": "• ڈپریشن میں 2 ہفتے سے زیادہ شدید اداسی، مایوسی، کسی کام میں دل نہ لگنا، نیند کی خرابی اور شدید بے ہمتی ہوتی ہے\n• روزمرہ معمول بنائیں: مقررہ وقت پر بستر سے اٹھیں، نہائیں، کپڑے بدلیں اور صبح کی دھوپ میں بیٹھیں\n• روزانہ 30 منٹ واک کریں اور کاموں کو چھوٹے چھوٹے حصوں میں تقسیم کریں\n• اکیلے کمرے میں بند رہنے سے پرہیز کریں اور گھر والوں یا دوستوں سے بات چیت جاری رکھیں\nڈاکٹر کو دکھائیں: ماہرِ نفسیات یا ڈاکٹر سے معائنہ کروائیں تاکہ تھراپی اور علاج ہو سکے\nایمرجنسی (فوراً جائیں): 1166 ہیلپ لائن / 1122 پر کال کریں: خودکشی یا خود کو نقصان پہنچانے کے خیالات آنے پر فوراً مدد لیں۔",
      "roman": "• 2 hafte se zyada shadeed udaasi aur mayoosi depression ho sakta hai\n• Rozana waqt par uthein, walk karein aur dhoop mein baithein\n• Apno se baat karein aur akele mat rahein\nDOCTOR KO DIKHAYEIN: Psychiatrist doctor se counseling aur ilaaj karwayein\nEMERGENCY (FORI JAYEIN): 1166 helpline par foran call karein agar khud-kushi ya khud ko nuqsan ke khayal hon."
    },
    "tags": [
      "depression",
      "major depression",
      "shadeed udaasi",
      "mayoosi",
      "ڈپریشن",
      "شدید اداسی",
      "loss of interest",
      "feeling hopeless",
      "mental health depression",
      "suicide prevention",
      "1166 helpline"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO / Umang",
      "title": "Comprehensive mental health action plan: depression",
      "url": "https://www.who.int/news-room/fact-sheets/detail/depression",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "postpartum-depression",
    "topic": "postpartum-depression",
    "title": {
      "en": "Postpartum depression (PPD) — maternal mood screening, bonding and family support",
      "ur": "زچگی کے بعد شدید ڈپریشن (PPD) — علامات، دیکھ بھال اور خاندانی مدد",
      "roman": "Wiladat ke baad depression (PPD) — alamaat, maa ki dekh bhaal aur helpline"
    },
    "content": {
      "en": "• Postpartum depression (PPD) is severe, lasting depression developing after childbirth (distinct from mild 1–2 week 'baby blues'), with crying spells, extreme fatigue, severe anxiety, and detachment from baby\n• FAMILY SUPPORT IS ESSENTIAL: Family members must share nighttime baby feeds and household chores so the mother gets uninterrupted rest\n• Talk openly with loved ones without shame; eat nourishing meals and take short walks outdoors\n• Never suffer in silence — PPD is a medical illness, not a personal failing or lack of love for baby\nSEE A DOCTOR IF: For screening (Edinburgh Postnatal Depression Scale) and breastfeeding-safe counseling or treatment.\nEMERGENCY / GO IMMEDIATELY: Call 1122 / 1166 immediately for thoughts of harming oneself or the baby, severe hallucinations, or complete detachment from reality (Postpartum Psychosis).",
      "ur": "• زچگی کے بعد شدید اداسی، رونا، بچے سے لگاؤ نہ ہونا، شدید تھکاوٹ اور گھبراہٹ پوسٹ پارٹم ڈپریشن (PPD) ہے\n• خاندانی مدد لازمی ہے: گھر والے بچے کی دیکھ بھال اور رات کے کاموں میں ہاتھ بٹائیں تاکہ ماں کی نیند پوری ہو سکے\n• شرمائے بغیر اپنے گھر والوں سے بات کریں اور مقوی غذا کھائیں\n• یہ کوئی کمزوری نہیں بلکہ ہارمونز کی تبدیلی سے ہونے والی بیماری ہے جو علاج سے بالکل ٹھیک ہو جاتی ہے\nڈاکٹر کو دکھائیں: گائناکالوجسٹ یا ڈاکٹر سے رابطہ کریں\nایمرجنسی (فوراً جائیں): 1122 / 1166 پر فوراً کال کریں: خود کو یا بچے کو نقصان پہنچانے کا خیال آنا، غیر حقیقی آوازیں سنائی دینا (سائیکوسس)۔",
      "roman": "• Delivery ke baad shadeed udaasi aur bachay se be-taalluqi postpartum depression (PPD) hai\n• Khandan wale maa ki neend aur bachay ki dekh bhaal mein madad karein\n• Sharmaye baghair doctor se baat karein\nDOCTOR KO DIKHAYEIN: Doctor ya gynecologist se checkup karwayein\nEMERGENCY (FORI JAYEIN): 1122 / 1166 par foran call karein agar khud ko ya bachay ko nuqsan ke khayal hon."
    },
    "tags": [
      "postpartum depression",
      "ppd",
      "zichgi depression",
      "baby blues",
      "زچگی کے بعد ڈپریشن",
      "maternal mental health",
      "after birth depression",
      "mother exhausted",
      "harming baby thoughts",
      "postpartum psychosis"
    ],
    "baseLevel": "URGENT",
    "audience": "maternal",
    "source": {
      "publisher": "WHO / UNICEF / Umang",
      "title": "Maternal mental health and postnatal depression guidelines",
      "url": "https://www.who.int/publications/i/item/9789240045989",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "chest-pain-triage",
    "topic": "chestpain",
    "title": {
      "en": "Emergency chest pain triage — distinguishing cardiac crisis from benign pain",
      "ur": "سینے کے درد کا ہنگامی فیصلہ (Chest Pain) — ہارٹ اٹیک بمقابلہ عام درد اور فوری اقدام",
      "roman": "Seene ke dard ka emergency faisla — heart attack ya aam dard"
    },
    "content": {
      "en": "• CRITICAL TRIAGE: Central crushing, heavy, squeezing chest pain radiating to left arm, neck, jaw, or back with sweating and shortness of breath is a LIFE-THREATENING HEART ATTACK UNTIL PROVEN OTHERWISE\n• CALL 1122 IMMEDIATELY; rest in a semi-upright seated position with knees bent; loosen tight collars\n• Chew one 300 mg adult aspirin (or four 75 mg baby aspirins) if not allergic\n• Non-emergency musculoskeletal pain is strictly reproducible by pressing on a tender rib bone with a finger, or worsens only with arm movement without breathlessness\nSEE A DOCTOR IF: Mild chest wall soreness or musculoskeletal discomfort persists without red flags.\nEMERGENCY / GO IMMEDIATELY: Any sudden crushing chest tightness, pressure, or breathlessness spreading to arm/jaw (call 1122).",
      "ur": "• ہنگامی فیصلہ: سینے کے درمیان شدید دباؤ، بوجھ یا درد جو بائیں بازو، جبڑے، گردن یا کمر میں جائے اور ساتھ پسینے اور سانس کی تنگی ہو تو یہ ہارٹ اٹیک کی علامت ہے\n• فوراً 1122 پر کال کریں؛ ٹیک لگا کر نیم بیٹھی حالت میں آرام کریں اور تنگ کپڑے ڈھیلے کریں\n• الرجی نہ ہونے کی صورت میں فوری طور پر 300 ملی گرام اسپرین کی گولی چبا کر نگل لیں\n• عام پٹھوں کا درد انگلی سے پسلی دبانے پر محسوس ہوتا ہے اور اس میں سانس نہیں پھولتا\nڈاکٹر کو دکھائیں: پسلیوں یا پٹھوں کے عام کھنچاؤ کے معائنے کے لیے\nایمرجنسی (فوراً جائیں): سینے پر اچانک شدید بوجھ، درد، ٹھنڈے پسینے اور سانس میں تنگی (1122 پر کال کریں)۔",
      "roman": "• Seene par shadeed dabao, bojh ya dard jo baen baazu ya jabray mein jaye heart attack ho sakta hai\n• Foran 1122 call karein aur baith kar aaraam karein\n• 300mg aspirin ki goli chaba lein\n• Ungli dabane par dard hona aam pathon ka dard hota hai\nDOCTOR KO DIKHAYEIN: Pathon ke aam dard ke checkup ke liye\nEMERGENCY (FORI JAYEIN): Seene par achanak bojh, paseenay aur saans phoolne par fori emergency 1122 bulayein."
    },
    "tags": [
      "chest pain",
      "heart attack",
      "seene me dard",
      "سینے میں درد",
      "chest pain triage",
      "myocardial infarction",
      "crushing chest pain",
      "1122 chest pain",
      "aspirin heart attack",
      "seene par bojh"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "emergency",
    "source": {
      "publisher": "WHO / IFRC",
      "title": "First aid and emergency resuscitation guidelines for acute coronary syndromes",
      "url": "https://www.ifrc.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "anaphylaxis-emergency",
    "topic": "anaphylaxis",
    "title": {
      "en": "Anaphylaxis emergency — severe allergic reaction, adrenaline timing and airway first aid",
      "ur": "شدید جان لیوا الرجی (Anaphylaxis) — فوری طبی امداد اور سانس کی بحالی",
      "roman": "Shadeed jaan-leva allergy (anaphylaxis) — fori 1122 aur epinephrine"
    },
    "content": {
      "en": "• Anaphylaxis is a severe, life-threatening allergic reaction developing within minutes of exposure to an allergen (insect sting, peanuts, seafood, penicillin/antibiotic)\n• CALL 1122 IMMEDIATELY; INJECT ADRENALINE (EpiPen / Auto-injector) into the outer mid-thigh muscle immediately if available\n• Lie the person flat on their back with legs elevated (if breathing is difficult, allow them to sit up); do NOT stand or walk\n• If caused by an insect sting, scrape the stinger away sideways with a fingernail or card (do NOT pinch with tweezers)\nSEE A DOCTOR IF: For emergency airway support, oxygen, and continuous monitoring.\nEMERGENCY / GO IMMEDIATELY: Difficulty breathing, wheezing, swelling of tongue/throat/lips, hoarse voice, tightness in throat, dizziness, or collapse.",
      "ur": "• انفیلیکسس ایک شدید اور جان لیوا الرجک ری ایکشن ہے جو کسی دوا (پینسلین)، کیڑے کے کاٹنے، یا خوراک (مونگ پھلی، مچھلی) کے بعد چند منٹ میں ہوتا ہے\n• فوراً 1122 پر کال کریں؛ اگر ایپی پین (Adrenaline/EpiPen) موجود ہو تو فوراً ران کے بیرونی پٹھے میں لگائیں\n• مریض کو سیدھا لٹا کر ٹانگیں اونچی رکھیں (سانس میں تنگی ہو تو سہارا دے کر بٹھائیں)؛ مریض کو کھڑا نہ کریں\n• کیڑے کا ڈنک ہو تو ناخن یا کارڈ سے احتیاط سے کھرچ کر نکالیں\nڈاکٹر / 1122 کو فوری کال کریں: ایمرجنسی سانس کی بحالی کے لیے ہسپتال جائیں\nایمرجنسی (فوراً جائیں): زبان، ہونٹوں یا گلے کا سوج جانا، سانس میں سیٹی بجنا، دم گھٹنا، چکر آنا یا بےہوش ہو جانا۔\nڈاکٹر کو دکھائیں: علامات 2 سے 3 دن میں بہتر نہ ہوں، بڑھ جائیں، یا روزمرہ کے کاموں میں رکاوٹ بنیں۔",
      "roman": "• Anaphylaxis aik jan leva allergy hai jo dawa ya keeray ke kaatne ke baad saans band karti hai\n• Foran 1122 call karein aur agar Epipen ho to fori taang par lagayein\n• Mareez ko seedha lita kar taangein oonchi rakhein\nDOCTOR KO DIKHAYEIN: Oxygen aur clinic emergency ke liye jayein\nEMERGENCY (FORI JAYEIN): Gala ya zaban sooj jana, saans na aana aur behoshi.\nDOCTOR KO DIKHAYEIN agar: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "anaphylaxis",
      "severe allergy",
      "jaan leva allergy",
      "epipen",
      "شدید الرجی",
      "adrenaline",
      "swollen throat allergy",
      "peanut allergy",
      "penicillin allergy",
      "insect sting anaphylaxis",
      "1122 allergy"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "emergency",
    "source": {
      "publisher": "WHO / IFRC",
      "title": "Anaphylaxis emergency management and first aid guidelines",
      "url": "https://www.ifrc.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "major-hemorrhage-tourniquet",
    "topic": "bleeding",
    "title": {
      "en": "Major arterial hemorrhage & tourniquet care — rapid bleeding control and wound packing",
      "ur": "شدید خون کا اخراج اور ٹورنیکیٹ (Severe Bleeding) — خون روکنے کی فوری تدابیر",
      "roman": "Shadeed khoon behna aur tourniquet — fori dabao aur jaan bachana"
    },
    "content": {
      "en": "• Major arterial bleeding (spurting or rapidly pooling bright red blood) can cause fatal shock within 3–5 minutes\n• STEP 1: Apply direct, continuous, heavy pressure directly over the wound using a clean cloth, gauze, or bare hands with full body weight\n• STEP 2: For severe limb bleeding where direct pressure fails, apply a commercial or improvised TOURNIQUET 2–3 inches above the wound (never over a joint) and tighten until bleeding stops; note the exact time\n• STEP 3: Keep victim warm and lying flat with legs elevated\nSEE A DOCTOR IF: Bleeding has stopped but the wound is deep, gaping, or requires stitches and tetanus booster.\nEMERGENCY / GO IMMEDIATELY: Any spurting, heavy, continuous bleeding that does not stop with direct pressure, or causes pale cold clammy skin (call 1122).",
      "ur": "• شریان کا گہرا کٹ جس سے خون فوارے کی طرح ابلے 3 سے 5 منٹ میں جان لیوا ثابت ہو سکتا ہے\n• پہلا قدم: صاف کپڑے، گوز یا ننگے ہاتھوں سے اپنے پورے وزن کے ساتھ زخم کے عین اوپر 15 منٹ تک مسلسل زور دار دباؤ ڈالیں\n• دوسرا قدم: اگر بازو یا ٹانگ سے خون نہ رکے تو زخم سے 2-3 انچ اوپر مضبوط کپڑا یا ٹورنیکیٹ (Tourniquet) باندھ کر لکڑی کی مدد سے کس دیں تاکہ خون بند ہو جائے؛ ٹورنیکیٹ کا وقت نوٹ کریں\n• مریض کو سیدھا لٹا کر ٹانگیں اونچی رکھیں اور گرم کمبل اوڑھائیں\nڈاکٹر کو دکھائیں: ٹانکے لگوانے اور ٹیٹنس کے ٹیکے کے لیے\nایمرجنسی (فوراً جائیں): فوارے کی طرح نکلتا خون، شدید خون بہنا، مریض کا زرد پڑ جانا یا بےہوش ہونا (1122 پر کال کریں)۔",
      "roman": "• Fuware ki tarah khoon nikalna jan leva hai; foran 1122 call karein\n• Zakhm par kapray se pure wazan ke sath dabao dalein\n• Taang ya baazu se khoon na rukay to zakhm se oopar tourniquet kas kar baandhein\nDOCTOR KO DIKHAYEIN: Taankay lagwane aur tetanus ke injection ke liye\nEMERGENCY (FORI JAYEIN): Shadeed khoon behna aur mareez ka behosh hona."
    },
    "tags": [
      "major hemorrhage",
      "severe bleeding",
      "tourniquet",
      "شدید خون بہنا",
      "arterial bleeding",
      "spurting blood",
      "pressure dressing",
      "bleeding control",
      "stop the bleed",
      "hemorrhagic shock"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "emergency",
    "source": {
      "publisher": "IFRC / WHO",
      "title": "International first aid, resuscitation, and education guidelines: severe bleeding",
      "url": "https://www.ifrc.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "scorpion-sting",
    "topic": "scorpion-sting",
    "title": {
      "en": "Scorpion sting (bichhoo ka dang) — first aid, ice application and antivenom warning",
      "ur": "بچھو کا ڈنک (Scorpion Sting) — ابتدائی طبی امداد اور خطرے کی علامات",
      "roman": "Bichhoo ka dang (scorpion sting) — first aid aur ilaaj"
    },
    "content": {
      "en": "• Scorpion stings cause immediate intense localized burning pain, redness, and swelling\n• FIRST AID: Wash sting site with soap and water; apply an ice pack wrapped in a washcloth for 10–15 minutes to reduce pain and slow toxin absorption\n• Keep the stung limb immobilized below heart level; give paracetamol for pain\n• DO NOT CUT, SUCK, INCISE, OR APPLY ACID OR TIGHT TOURNIQUETS TO THE WOUND\nSEE A DOCTOR IF: For medical observation and antivenom assessment, especially for black or yellow scorpions.\nEMERGENCY / GO IMMEDIATELY: Young children stung by scorpions (high risk of cardiac toxicity), severe muscle twitching/spasms, difficulty breathing, excessive salivation/frothing at mouth, severe vomiting, or heart palpitations.",
      "ur": "• بچھو کے ڈنک سے فوری طور پر شدید جلن، درد، سرخی اور سوجن ہو جاتی ہے\n• ابتدائی طبی امداد: ڈنک والی جگہ کو صابن اور پانی سے دھوئیں اور کپڑے میں لپٹی برف سے 10-15 منٹ ٹکور کریں تاکہ درد اور زہر کا پھیلاؤ رکے\n• متاثرہ ہاتھ یا پاؤں کو حرکت نہ دیں اور دل کی سطح سے نیچے رکھیں؛ درد کے لیے پیراسیٹامول لیں\n• کٹ لگانا، منہ سے چوسنا، تیزاب، جلانا یا سخت پٹی باندھنا سخت نقصان دہ ہے\nڈاکٹر کو دکھائیں: بچھو کے زہر کے تریاق (Antivenom) کے معائنے کے لیے ہسپتال جائیں\nایمرجنسی (فوراً جائیں): چھوٹے بچوں کو بچھو کاٹنا (جان لیوا خطرہ)، پٹھوں کا پھڑکنا، سانس میں تنگی، منہ سے جھاگ نکلنا، یا مسلسل الٹیاں۔",
      "roman": "• Bichhoo ke dang se shadeed jalan aur dard hota hai\n• Sabun paani se dhoiyein aur barf ki patti rakhein\n• Cut na lagayein aur choosne ki koshish na karein\nDOCTOR KO DIKHAYEIN: Antivenom checkup ke liye hospital jayein\nEMERGENCY (FORI JAYEIN): Chhotay bachon ko katna, munh se jhaag aana ya saans phoolna."
    },
    "tags": [
      "scorpion sting",
      "bichhoo ka dang",
      "bichhoo",
      "scorpion bite",
      "بچھو کا ڈنک",
      "بچھو",
      "sting first aid",
      "ice pack sting",
      "scorpion antivenom",
      "muscle twitching sting",
      "child scorpion sting"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": {
      "publisher": "WHO / Pakistan MoNHSRC",
      "title": "Guidelines for the management of scorpion stings and envenomation",
      "url": "https://www.nhsrc.gov.pk",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "pesticide-poisoning",
    "topic": "pesticide-poisoning",
    "title": {
      "en": "Agricultural pesticide poisoning (keeray mar dawa) — skin decontamination and atropine emergency",
      "ur": "کیڑے مار ادویات کا زہر (Pesticide Poisoning) — ہنگامی صفائی اور فوری طبی امداد",
      "roman": "Keeray mar dawa ka zahar (pesticide poisoning) — fori decontamination aur hospital"
    },
    "content": {
      "en": "• Organophosphate and carbamate agricultural spray poisons are rapidly absorbed through skin, lungs, or mouth during farming\n• RESCUER SAFETY FIRST: Wear protective gloves; immediately strip off all contaminated clothing from the victim\n• Wash entire body and hair thoroughly with soap and copious running water for at least 15 minutes\n• If swallowed, DO NOT INDUCE VOMITING (causes chemical aspiration into lungs); bring the pesticide bottle/label to the hospital\nSEE A DOCTOR IF: Any minor pesticide exposure or skin contact occurs without severe toxicity signs.\nEMERGENCY / GO IMMEDIATELY: Pinpoint constricted pupils, excessive drooling/salivation, heavy sweating, wheezing, muscle twitching, seizures, or coma (requires urgent IV Atropine, call 1122).",
      "ur": "• فصلوں پر اسپرے کی جانے والی کیڑے مار ادویات (Pesticides) جلد، سانس یا نگلنے سے جسم میں جذب ہو کر شدید زہر بنتی ہیں\n• سب سے پہلے مریض کے تمام گندے کپڑے فوراً اتار دیں\n• پورے جسم اور بالوں کو صابن اور بہتے پانی سے کم از کم 15 منٹ تک اچھی طرح دھوئیں\n• اگر زہر پیا ہو تو الٹی کروانے کی ہرگز کوشش نہ کریں (زہر پھیپھڑوں میں جا سکتا ہے)؛ دوا کا ڈبہ ساتھ ہسپتال لے جائیں\nڈاکٹر کو دکھائیں: کیڑے مار دوا سے ہلکے رابطے یا جلد کی سرخی کے معائنے کے لیے\nایمرجنسی (فوراً جائیں): آنکھ کی پتلیاں باریک ہونا، منہ سے جھاگ بہنا، شدید پسینے، سانس میں سیٹیاں، یا بےہوشی (1122 پر کال کریں)۔",
      "roman": "• Keeray mar dawa ka zahar jild ya saans se jism mein jata hai\n• Faltu kapray utaar kar mareez ko 15 minute sabun paani se dhoiyein\n• Ulti na karwayein aur dawa ka dabba sath hospital le jayein\nDOCTOR KO DIKHAYEIN: Dawa ke asar ke checkup ke liye clinic jayein\nEMERGENCY (FORI JAYEIN): Aankh ki putliyan chhoti hona, munh se jhaag/raal behna ya behoshi (1122)."
    },
    "tags": [
      "pesticide poisoning",
      "pesticide",
      "keeray mar dawa",
      "organophosphate",
      "کیڑے مار دوا کا زہر",
      "کیڑے مار دوا",
      "agricultural poisoning",
      "fasal ki dawa",
      "pesticide spray",
      "atropine",
      "drooling pesticide"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "emergency",
    "source": {
      "publisher": "WHO / Pakistan MoNHSRC",
      "title": "Clinical management of acute organophosphate and pesticide poisoning",
      "url": "https://www.who.int/publications/i/item/9789241547499",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "acid-ingestion-poisoning",
    "topic": "acid-ingestion",
    "title": {
      "en": "Acid & caustic chemical ingestion (tezaab) — immediate DO NOTs and emergency protocol",
      "ur": "تیزاب یا کیمیکل پینا — انتہائی اہم احتیاطیں اور فوری ہنگامی امداد",
      "roman": "Tezaab ya caustic chemical peena — fori hifazat aur hospital"
    },
    "content": {
      "en": "• Ingestion of strong acids (toilet cleaner, battery acid) or alkalis (caustic soda, bleach) severely burns lips, mouth, esophagus, and stomach\n• CRITICAL DO NOTS:\n  1. NEVER INDUCE VOMITING (vomiting re-burns the food pipe and destroys airway)\n  2. NEVER GIVE VINEGAR OR CHEMICAL NEUTRALIZERS (acid-base reactions release extreme heat causing fatal perforation)\n  3. NEVER give large amounts of water or milk (induces vomiting)\n• If conscious, rinse mouth with cold water and spit out; bring container to hospital\nSEE A DOCTOR IF: Any skin or oral contact with diluted cleaning chemicals occurs.\nEMERGENCY / GO IMMEDIATELY: Chemical ingestion requires immediate emergency airway management and ICU resuscitation (call 1122).",
      "ur": "• تیزاب (Toilet cleaner, Battery acid) یا کاسٹک سوڈا پینے سے منہ، حلق، خوراک کی نالی اور معدہ بری طرح جل جاتے ہیں\n• انتہائی اہم احتیاطیں:\n  1. الٹی کروانے کی ہرگز کوشش نہ کریں (الٹی سے گلا دوبارہ جلتا ہے)\n  2. سرکہ، لیموں یا کوئی نیوٹرلائز کرنے والی چیز مت پلائیں (کیمیکل ری ایکشن سے گرمی پیدا ہو کر معدہ پھٹ سکتا ہے)\n  3. زیادہ پانی یا دودھ نہ پلائیں\n• اگر مریض ہوش میں ہو تو صرف ٹھنڈے پانی سے کلیاں کروا کر تھوک دیں اور بوتل ساتھ لے کر ہسپتال بھاگیں\nڈاکٹر کو دکھائیں: جلد پر تیزاب گرنے یا معمولی کیمیکل جلن کے علاج کے لیے\nایمرجنسی (فوراً جائیں): تیزاب یا کیمیکل پینا فوری طور پر ہسپتال لے جانے والی ایمرجنسی ہے (1122 پر کال کریں)۔",
      "roman": "• Tezaab ya caustic soda peene par ulti hargiz na karwayein kyunke gala dobara jalta hai\n• Sirka ya koi aur cheez na pilayein aur zyada paani na dein\n• Hosh mein ho to saaf paani se kulli karwayein aur dabba sath le jayein\nDOCTOR KO DIKHAYEIN: Jild par tezaab girne ya chemical jalan ke liye\nEMERGENCY (FORI JAYEIN): Tezaab peene par foran emergency hospital le jayein (1122)."
    },
    "tags": [
      "acid ingestion",
      "tezaab peena",
      "tezaab",
      "caustic soda",
      "تیزاب پینا",
      "تیزاب",
      "chemical poisoning",
      "corrosive poison",
      "toilet cleaner ingestion",
      "bleach poisoning",
      "do not induce vomiting"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "emergency",
    "source": {
      "publisher": "WHO / IFRC",
      "title": "Guidelines for the management of caustic ingestion and chemical injuries",
      "url": "https://www.ifrc.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "carbon-monoxide-poisoning",
    "topic": "carbon-monoxide",
    "title": {
      "en": "Carbon monoxide poisoning & gas heater suffocation — ventilation, oxygen and warning signs",
      "ur": "کاربن مونو آکسائیڈ اور گیس ہیٹر کا زہر — تازہ ہوا اور ہنگامی اقدامات",
      "roman": "Geyser aur gas heater ka zahar (carbon monoxide) — taaza hawa aur emergency"
    },
    "content": {
      "en": "• Carbon monoxide (CO) is an invisible, odorless, toxic gas emitted by gas geysers, unventilated room heaters, coal stoves (angithi), and generators in enclosed spaces\n• IMMEDIATE RESCUE: Move victim into fresh outdoor air immediately; open all doors and windows; turn off gas heater/appliance\n• If victim is not breathing, call 1122 and begin CPR immediately\n• Never run gas geysers inside enclosed bathrooms without outdoor flue vents; never sleep with burning coal stoves or gas heaters on in bedrooms\nSEE A DOCTOR IF: Mild headache or lightheadedness occurs after using gas appliances in poorly ventilated spaces.\nEMERGENCY / GO IMMEDIATELY: Throbbing headache, dizziness, nausea, confusion, cherry-red lips, unconsciousness, or multiple drowsy people in one room (call 1122).",
      "ur": "• کاربن مونو آکسائیڈ بے رنگ اور بے بو زہریلی گیس ہے جو گیس گیزر، بند کمرے میں ہیٹر یا کوئلوں کی انگیٹھی جلانے سے بنتی ہے اور خاموشی سے دم گھونٹ دیتی ہے\n• فوری اقدام: مریض کو فوراً کھلی تازہ ہوا میں نکالیں؛ تمام کھڑکیاں اور دروازے کھول دیں اور گیس بند کریں\n• اگر سانس نہ آ رہی ہو تو 1122 پر کال کریں اور سینے کو دبانے والی سی پی آر (CPR) شروع کریں\n• بند باتھ روم میں گیزر نہ لگائیں اور رات کو کمرے میں ہیٹر یا کوئلے جلا کر ہرگز نہ سوئیں\nڈاکٹر کو دکھائیں: گیس کی بو یا ہلکے سر درد کے بعد مکمل چیک اپ کے لیے\nایمرجنسی (فوراً جائیں): سر درد، چکر، متلی، ہونٹوں کا سرخ ہونا، بےہوشی، یا کمرے میں تمام افراد کا غنودگی میں ہونا (1122 پر کال کریں)۔",
      "roman": "• Geyser aur heater ki gas (carbon monoxide) be-rang aur be-boo zahar hai jo jaan leti hai\n• Mareez ko foran khuli taaza hawa mein le jayein aur darwazay khol dein\n• Raat ko heater ya koyle jala kar na soyein\nDOCTOR KO DIKHAYEIN: Gas heater ke baad sar dard ke checkup ke liye\nEMERGENCY (FORI JAYEIN): Chakkar aana, sar dard, behoshi ya saans band hona (1122 call karein)."
    },
    "tags": [
      "carbon monoxide",
      "geyser gas",
      "geyser ka dhuwan",
      "geyser dhuwan",
      "koyle ka dhuwan",
      "gas heater poisoning",
      "coal stove",
      "کاربن مونو آکسائیڈ",
      "گیس ہیٹر",
      "گیزر کا دھواں",
      "گیس گیزر",
      "coal stove poisoning",
      "unventilated heater",
      "winter gas poison",
      "suffocation heater",
      "100 percent oxygen"
    ],
    "baseLevel": "EMERGENCY",
    "audience": "emergency",
    "source": {
      "publisher": "WHO / IFRC",
      "title": "First aid guidelines for toxic gas inhalation and carbon monoxide poisoning",
      "url": "https://www.ifrc.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "falls-in-elderly",
    "topic": "falls-elderly",
    "title": {
      "en": "Falls in older adults — home hazard removal, balance exercises and post-fall assessment",
      "ur": "بزرگوں میں گرنے سے بچاؤ — گھر کی حفاظت، توازن کی ورزشیں اور چوٹ کی جانچ",
      "roman": "Bazurgon me girna aur bachao (elderly falls) — ghar ki hifazat aur dekh bhaal"
    },
    "content": {
      "en": "• Falls in older adults frequently result in debilitating hip fractures, head trauma, and loss of mobility\n• REMOVE HOME HAZARDS: Remove loose rugs, secure electrical cords, ensure bright lighting in hallways and stairwells, and install sturdy grab bars near toilet and shower\n• Wear non-slip, properly fitted supportive footwear; keep a walking stick/walker within easy reach\n• Perform gentle daily balance and leg strengthening exercises (heel-to-toe walking, chair stands); have a doctor review sedating medications that cause dizziness\nSEE A DOCTOR: If an older adult experiences recurrent dizziness, unsteady gait, or frequent near-falls.\nEMERGENCY / GO IMMEDIATELY: Inability to stand after a fall, severe hip/groin pain with shortened leg rotated outward (hip fracture), loss of consciousness, or head impact with vomiting.\nSEE A DOCTOR IF: symptoms do not improve after 2–3 days, worsen, or interfere with daily activities.",
      "ur": "• بزرگوں کے گرنے سے کولہے کی ہڈی کا فریکچر اور سر پر خطرناک چوٹ آ سکتی ہے\n• گھر کو محفوظ بنائیں: پھسلنے والی چٹائیاں ہٹا دیں، راستوں اور سیڑھیوں پر تیز روشنی رکھیں، اور باتھ روم میں پکڑنے والے ہینڈل (Grab bars) لگائیں\n• ننگے پاؤں یا چکنی چپل مت پہنیں؛ لاٹھی یا واکر کا سہارا لیں\n• کرسی سے اٹھنے بیٹھنے کی ہلکی ورزش کریں اور چکر لانے والی ادویات کا ڈاکٹر سے معائنہ کروائیں\nڈاکٹر کو دکھائیں: اگر بزرگ کو بار بار چکر آئیں یا چلتے ہوئے لڑکھڑاہٹ ہو\nایمرجنسی (فوراً جائیں): گرنے کے بعد کھڑے نہ ہو سکنا، کولہے میں شدید درد اور ٹانگ کا ٹیڑھا ہونا (فریکچر)، یا سر پر چوٹ اور بےہوشی۔",
      "roman": "• Bazurgon ke girnay se hip fracture aur sar par chot ka khatra hota hai\n• Ghar se phisalney wali cheezein hatayein aur bathroom mein handle lagayein\n• Non-slip jootay pehnein aur laathi ka sahara lein\nDOCTOR KO DIKHAYEIN agar: bar bar chakkar aayein ya chalne mein ladkharahat ho\nEMERGENCY (FORI JAYEIN): Girnay ke baad kharay na ho sakna ya kolhay ki haddi tootna.\nDOCTOR KO DIKHAYEIN: alamaat 2 se 3 din mein behtar na hon, barh jayein, ya rozmarrah ke kaamon mein rukawat banein."
    },
    "tags": [
      "falls in elderly",
      "bazurgon me girna",
      "elderly fall",
      "بزرگوں میں گرنا",
      "hip fracture fall",
      "bathroom grab bars",
      "balance exercises",
      "unsteady walking",
      "non slip shoes",
      "elderly care"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Step safely: strategies for preventing and managing falls across the life-course",
      "url": "https://www.who.int/publications/i/item/9789240021914",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "dementia-alzheimers",
    "topic": "dementia",
    "title": {
      "en": "Dementia & Alzheimer's disease — recognizing memory loss, safe environment and caregiver support",
      "ur": "ڈیمینشیا اور یادداشت کی کمزوری (Alzheimer's) — علامات، دیکھ بھال اور خاندانی رہنمائی",
      "roman": "Bhoolne ki bimari (dementia) — yaaddasht, ghar ki hifazat aur dekh bhaal"
    },
    "content": {
      "en": "• Dementia is a progressive brain disorder (most commonly Alzheimer's) causing memory loss, confusion about time and place, language difficulty, and personality changes\n• CAREGIVER SUPPORT STRATEGIES: Maintain a calm, predictable daily routine with clocks and calendars clearly visible\n• Speak in short, clear, gentle sentences with eye contact; do NOT argue or aggressively correct forgotten facts\n• Ensure home safety: lock front doors to prevent wandering, secure medicines and gas appliances, and keep rooms well lit\nSEE A DOCTOR IF: For formal memory evaluation (MMSE), brain MRI, and cognitive stabilizer therapies.\nEMERGENCY / GO IMMEDIATELY: Sudden rapid confusion developing over hours or days (Delirium, often triggered by a hidden UTI or pneumonia), extreme aggression, or wandering outside alone.",
      "ur": "• ڈیمینشیا (الزائمر) میں دماغ کے خلیے کمزور ہونے سے یادداشت، راستے، وقت اور نام بھول جاتے ہیں اور مزاج بدل جاتا ہے\n• دیکھ بھال کے طریقے: روزمرہ کے کاموں کا ایک پرسکون معمول بنائیں، کمرے میں گھڑی اور کیلنڈر سامنے رکھیں\n• مریض سے نرمی اور مختصر جملوں میں بات کریں؛ بھولی ہوئی باتوں پر بحث یا جھگڑا نہ کریں\n• گھر کی حفاظت: باہر جانے والا دروازہ بند رکھیں تاکہ بزرگ راستہ نہ بھول جائیں، اور ادویات اور گیس محفوظ رکھیں\nڈاکٹر کو دکھائیں: یادداشت کے ٹیسٹ اور دماغ کے معائنے کے لیے نیورولوجسٹ یا ڈاکٹر کو دکھائیں\nایمرجنسی (فوراً جائیں): اچانک ایک دو دن میں شدید بے ربط بولنا یا پاگل پن (Delirium — جو اندرونی انفیکشن سے ہو سکتا ہے) یا گھر سے نکل کر لاپتہ ہونا۔",
      "roman": "• Dementia (bhoolne ki bimari) mein yaaddasht aur pehchan kamzor hoti hai\n• Rozana aik routine banayein aur narm aawaz mein mukhtasar baat karein\n• Mareez se behes na karein aur bahir ka darwaza band rakhein\nDOCTOR KO DIKHAYEIN: Neurologist doctor se memory test aur checkup karwayein\nEMERGENCY (FORI JAYEIN): Achanak shadeed behki baatein karna ya rasta bhool kar gum hona."
    },
    "tags": [
      "dementia",
      "alzheimers",
      "yaaddasht ki kami",
      "bhoolne ki bimari",
      "ڈیمینشیا",
      "بھولنے کی بیماری",
      "memory loss elderly",
      "wandering dementia",
      "caregiver support",
      "cognitive decline",
      "delirium elderly"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Global action plan on the public health response to dementia",
      "url": "https://www.who.int/news-room/fact-sheets/detail/dementia",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "bedsores-pressure-ulcers",
    "topic": "bed-sores",
    "title": {
      "en": "Bed sores & pressure ulcers (bistar ke zakhm) — 2-hour repositioning, skin barrier and wound care",
      "ur": "بستر کے زخم اور دباؤ کی چھالیں (Bed Sores) — پوزیشن بدلنا، صفائی اور علاج",
      "roman": "Bistar ke zakhm (bed sores) — 2 ghantay me karwat aur dekh bhaal"
    },
    "content": {
      "en": "• Bed sores (pressure ulcers) develop over bony areas (tailbone, hips, heels, shoulders) from prolonged pressure cutting off skin blood supply in bedridden patients\n• REPOSITION EVERY 2 HOURS: Turn and change position of bedridden patients at least every 2 hours day and night\n• Use pressure-relieving ripple air mattresses or specialized foam cushions\n• Keep skin clean and dry; apply barrier moisturizers; place pillows under calves to float heels off the mattress\n• Provide high-protein nutrition (eggs, lentils, milk) to fuel wound healing\nSEE A DOCTOR IF: For persistent non-healing red skin patches or broken open sores requiring sterile dressings.\nEMERGENCY / GO IMMEDIATELY: Deep open wound exposing muscle/bone, black dead tissue (gangrene), spreading foul-smelling pus with heat, or high fever with chills (sepsis).",
      "ur": "• بستر کے زخم (Bed sores) زیادہ دیر ایک ہی کروٹ لیٹے رہنے سے کولہے کی ہڈی، ایڑیوں اور کمر پر دباؤ کی وجہ سے بنتے ہیں\n• ہر 2 گھنٹے بعد کروٹ بدلیں: مریض کی پوزیشن دن رات ہر 2 گھنٹے بعد لازمی تبدیل کریں\n• ہوا والا میٹریس (Air mattress) استعمال کریں تاکہ دباؤ کم ہو\n• جلد کو صاف اور خشک رکھیں اور ایڑیوں کے نیچے تکیہ رکھ کر بستر سے اونچا رکھیں\n• مریض کو پروٹین والی خوراک دیں (انڈے، دالیں، دودھ، یخنی) تاکہ زخم جلدی بھرے\nڈاکٹر کو دکھائیں: جلد لال ہونے یا چھالا بننے پر ڈریسنگ اور علاج کے لیے نرس یا ڈاکٹر کو دکھائیں\nایمرجنسی (فوراً جائیں): گہرا زخم جس میں ہڈی نظر آئے، کالا گلا ہوا گوشت (گینگرین)، بدبودار پیپ، یا تیز بخار۔",
      "roman": "• Zyada dair letne se kamar aur kolhay par bistar ke zakhm (bed sores) bante hain\n• Har 2 ghante baad mareez ki karwat badlein\n• Air mattress istemal karein aur jild saaf khushk rakhein\n• Anda, daal aur doodh khilayein taake zakhm bharay\nDOCTOR KO DIKHAYEIN: Zakhm banne par doctor se dressing karwayein\nEMERGENCY (FORI JAYEIN): Zakhm kala parhna, peep aana ya tez bukhar."
    },
    "tags": [
      "bed sores",
      "bedsores",
      "pressure ulcers",
      "bistar ke zakhm",
      "بستر کے زخم",
      "tailbone sores",
      "pressure mattress",
      "turning bedridden patient",
      "decubitus ulcer",
      "heel sores",
      "wound care elderly"
    ],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": {
      "publisher": "WHO / IFRC",
      "title": "Guidelines for the prevention and management of pressure injuries",
      "url": "https://www.ifrc.org",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "polypharmacy-elderly",
    "topic": "polypharmacy",
    "title": {
      "en": "Polypharmacy in older adults — medication safety, drug interactions and deprescribing",
      "ur": "بزرگوں میں زیادہ ادویات کے خطرات (Polypharmacy) — ادویات کی جانچ اور احتیاط",
      "roman": "Bazurgon me zyada dawaiyan (polypharmacy) — dawaiyon ka record aur hidayat"
    },
    "content": {
      "en": "• Polypharmacy is the concurrent use of 5 or more medications in older adults, significantly raising risks of falls, confusion, drug interactions, and kidney injury\n• KEEP A MASTER MEDICATION LIST: Maintain an accurate list of all prescribed pills, vitamins, and herbal syrups with exact doses and timings\n• Use a weekly 7-day pill organizer dispenser box to prevent double-dosing or missed tablets\n• NEVER start new over-the-counter painkillers (NSAIDs) or sleeping pills without consulting your doctor\nSEE A DOCTOR IF: Every 6 months for a comprehensive 'brown bag medication review' to discontinue unnecessary or duplicate drugs (deprescribing).\nEMERGENCY / GO IMMEDIATELY: Sudden confusion/delirium, extreme dizziness with falling, severe bleeding, or allergic reaction after starting a new medicine.",
      "ur": "• بزرگوں میں 5 یا اس سے زیادہ دوائیوں کا ایک ساتھ استعمال (Polypharmacy) چکر آنے، گرنے، گردے خراب ہونے اور ادویاتی ری ایکشن کا خطرہ بڑھاتا ہے\n• تمام ادویات کی ایک مکمل فہرست بنائیں جس میں صبح شام کے اوقات اور خوراک لکھی ہو\n• 7 دن والا گولیوں کا باکس (Pill organizer) استعمال کریں تاکہ کوئی گولی چھوٹ نہ جائے اور نہ ڈبل لی جائے\n• درد کش یا نیند کی گولیاں ڈاکٹر سے پوچھے بغیر کبھی شروع نہ کریں\nڈاکٹر کو دکھائیں: ہر 6 ماہ بعد تمام دوائیاں ایک تھیلے میں ڈال کر ڈاکٹر کو دکھائیں تاکہ غیر ضروری ادویات بند کی جا سکیں\nایمرجنسی (فوراً جائیں): نئی دوا شروع کرنے کے بعد اچانک شدید چکر، گرنا، بےہوشی، یا خون بہنا۔",
      "roman": "• Bazurgon mein bohot zyada dawaiyan lene se chakkar, girna aur side effects hote hain\n• Dawaiyon ka chart banayein aur pill box istemal karein\n• Doctor ke mashwaray ke baghair painkiller na lein\nDOCTOR KO DIKHAYEIN: Har 6 mahine baad sari dawaiyan doctor ko check karwayein\nEMERGENCY (FORI JAYEIN): Dawa lene ke baad achanak behoshi, girna ya shadeed allergy."
    },
    "tags": [
      "polypharmacy",
      "zyada dawaiyan",
      "multiple medications",
      "بزرگوں کی ادویات",
      "drug interactions",
      "pill organizer",
      "medication review elderly",
      "elderly drug safety",
      "deprescribing"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Medication safety in polypharmacy: technical report",
      "url": "https://www.who.int/publications/i/item/WHO-UHC-SDS-2019.11",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  },
  {
    "id": "osteoporosis-bone-thinning",
    "topic": "osteoporosis",
    "title": {
      "en": "Osteoporosis & bone thinning — calcium, Vitamin D, DEXA scans and fracture prevention",
      "ur": "ہڈیوں کی کمزوری اور بھربھرا پن (Osteoporosis) — کیلشیم، وٹامن ڈی اور حفاظت",
      "roman": "Haddiyon ki kamzori aur bhurbhurapan (osteoporosis) — calcium aur dekh bhaal"
    },
    "content": {
      "en": "• Osteoporosis is a silent reduction in bone mineral density, making bones porous and fragile so that minor bumps or falls cause serious fractures (hip, spine, wrist)\n• Ensure adequate daily calcium intake (1000–1200 mg/day from milk, yogurt, paneer, sesame, and leafy greens) and Vitamin D\n• Engage in regular weight-bearing physical activity (brisk walking, light stair climbing) to stimulate bone mineral retention\n• Eliminate fall hazards at home; avoid smoking and heavy caffeine which leach calcium from bones\nSEE A DOCTOR IF: For a bone mineral density DEXA scan and prescription anti-resorptive therapies (bisphosphonates) if at risk.\nEMERGENCY / GO IMMEDIATELY: Sudden agonizing back pain after minor bending/lifting (vertebral compression fracture), or severe hip/groin pain with inability to bear weight after a slip.",
      "ur": "• ہڈیوں کا بھربھرا پن (Osteoporosis) ہڈیوں کی کثافت کم کر دیتا ہے جس سے ہلکی سی چوٹ یا گرنے سے کولہے، کلائی یا ریڑھ کی ہڈی ٹوٹ سکتی ہے\n• روزانہ کیلشیم والی غذائیں لیں (دودھ، دہی، پنیر، تل اور ہری سبزیاں) اور وٹامن ڈی پورا رکھیں\n• روزانہ 30 منٹ واک کریں جس سے ہڈیوں کی مضبوطی بحال رہتی ہے\n• سگریٹ نوشی اور زیادہ چائے/کافی سے پرہیز کریں جو ہڈیوں سے کیلشیم چراتے ہیں\nڈاکٹر کو دکھائیں: ہڈیوں کی مضبوطی کے ٹیسٹ (DEXA scan) اور ہڈی مضبوط کرنے والی ادویات کے لیے ڈاکٹر سے رجوع کریں\nایمرجنسی (فوراً جائیں): جھکنے یا وزن اٹھانے پر کمر میں اچانک شدید نیزے جیسا درد، یا گرنے کے بعد پاؤں پر کھڑے نہ ہو سکنا۔",
      "roman": "• Osteoporosis mein haddiyan kamzor aur bhurbhuri ho kar asani se toot jati hain\n• Doodh, dahi aur calcium wali ghiza lein aur rozana walk karein\n• Sigrat aur zyada chai se parhez karein\nDOCTOR KO DIKHAYEIN: DEXA scan karwa kar haddiyon ka ilaaj karwayein\nEMERGENCY (FORI JAYEIN): Girnay ke baad kolhay ya kamar ki haddi tootna."
    },
    "tags": [
      "osteoporosis",
      "haddiyon ki kamzori",
      "bhurbhurapan",
      "bone thinning",
      "ہڈیوں کی کمزوری",
      "dexa scan",
      "calcium bones",
      "bisphosphonates",
      "hip fracture elderly",
      "bone density"
    ],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": {
      "publisher": "WHO",
      "title": "Prevention and management of osteoporosis: report of a WHO scientific group",
      "url": "https://www.who.int/publications/i/item/9241209216",
      "license": "CC BY-NC-SA 3.0 IGO",
      "verifiedAt": "2026-08"
    }
  }
  // ============================================================
  // EXPANDED CORPUS — 80+ new topics (Sept 2026 expansion)
  // Acute emergencies, chronic conditions, maternal, pediatric,
  // mental health, infectious diseases, Pakistan-specific
  // ============================================================
  ,
  {
    "id": "appendicitis",
    "topic": "appendicitis",
    "title": { "en": "Appendicitis — when abdominal pain is an emergency", "ur": "زائدہ کی سوزش — جب پیٹ کا درد ایمرجنسی ہو", "roman": "Zaida ki sozish — jab pait ka dard emergency ho" },
    "content": { "en": "Appendicitis is inflammation of the appendix. Symptoms: pain starting around the navel that moves to the lower right abdomen, worsens with movement/coughing, loss of appetite, nausea, mild fever.\nSEE A DOCTOR IMMEDIATELY if you have these symptoms — appendicitis can rupture and become life-threatening.\nDO NOT eat, drink, or take painkillers/laxatives — go to the hospital immediately.\nEMERGENCY: severe right-lower abdominal pain with fever and vomiting = go to hospital NOW. Call 1122 if no transport.", "ur": "زائدہ کی سوزش ایک خطرناک حالت ہے۔ علامات: ناف کے پاس درد شروع ہو کر نیچے دائیں طرف منتقل ہو، حرکت سے بڑھے، بھوک نہ لگے، متلی، ہلکا بخار۔\nفوراً ڈاکٹر کو دکھائیں — زائدہ پھٹ سکتا ہے اور جان لیوا ہو سکتا ہے۔\nکچھ کھائیں/پییں نہیں، درد کی دوا/لینٹ نہ لیں — فوراً ہسپتال جائیں۔\nایمرجنسی: دائیں نیچے پیٹ میں شدید درد + بخار + متلی = فوراً ہسپتال جائیں۔ ٹرانسپورٹ نہ ہو تو 1122 کال کریں۔", "roman": "Appendicitis ek khatarnak halat hai. Alamaat: naaf ke paas dard shuru ho kar neechay dayain taraf muntaqil ho, harkat se barhe, bhook na lagay, matli, halka bukhar.\nFori doctor ko dikhayein — zaida phat sakta hai aur jan lewa ho sakta hai.\nKuch khayein/peeyein nahi, dard ki dawa/lent na lein — fori hospital jayein.\nEmergency: dayain neechay pait mein shadeed dard + bukhar + matli = fori hospital jayein. Transport na ho to 1122 call karein." },
    "tags": ["appendicitis", "appendix", "zaida", "pet dard", "right lower abdomen pain", "abdominal pain emergency", "پیٹ کا درد", "زائدہ"],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Acute abdominal pain — emergency triage", "url": "https://www.who.int/publications", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "sepsis",
    "topic": "sepsis",
    "title": { "en": "Sepsis — a life-threatening infection response", "ur": "سیپسس — جان لیوا انفیکشن کا ردعمل", "roman": "Sepsis — jan lewa infection ka radd-e-amal" },
    "content": { "en": "Sepsis is the body's extreme response to an infection. It is a MEDICAL EMERGENCY.\nSymptoms: high fever or very low temperature, rapid heartbeat, rapid breathing, confusion or drowsiness, cold/clammy skin, reduced urine.\nCAUSED BY: any infection (pneumonia, urinary tract, abdominal, wound).\nEMERGENCY: Call 1122 immediately. Go to the hospital NOW. Sepsis can cause death within hours if untreated. Every hour of delay increases mortality by 8%.", "ur": "سیپسس جسم کا انفیکشن کے خلاف شدید ردعمل ہے۔ یہ میڈیکل ایمرجنسی ہے۔\nعلامات: تیز بخار یا بہت کم درجہ حرارت، تیز دھڑکن، تیز سانس، الجھن یا نیند، سرد/گیلی جلد، کم پیشاب۔\nوجہ: کوئی بھی انفیکشن (نمونیہ، پیشاب کی نالی، پیٹ، زخم)۔\nایمرجنسی: فوراً 1122 کال کریں۔ فوراً ہسپتال جائیں۔ علاج نہ کرنے سے گھنٹوں میں موت ہو سکتی ہے۔", "roman": "Sepsis jism ka infection ke khilaf shadeed radd-e-amal hai. Yeh medical emergency hai.\nAlamaat: tez bukhar ya bohot kam hararat, tez dharkan, tez saans, uljhan ya neend, sard/geeli jild, kam peshab.\nWajah: koi bhi infection (namonia, peshab ki nali, pait, zakhm).\nEmergency: fori 1122 call karein. Fori hospital jayein. Ilaaj na karne se ghanton mein maut ho sakti hai." },
    "tags": ["sepsis", "septic shock", "blood poisoning", "infection emergency", "سپتی شاک", "انفیکشن", "tez bukhar", "confusion"],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Sepsis — fact sheet", "url": "https://www.who.int/news-room/fact-sheets/detail/sepsis", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "meningitis",
    "topic": "meningitis",
    "title": { "en": "Meningitis — brain infection emergency", "ur": "میننجائٹس — دماغ کے انفیکشن کی ایمرجنسی", "roman": "Meningitis — dimagh ke infection ki emergency" },
    "content": { "en": "Meningitis is inflammation of the membranes around the brain and spinal cord. It is a MEDICAL EMERGENCY.\nSymptoms: sudden high fever, severe headache, stiff neck (can't touch chin to chest), sensitivity to light, confusion, vomiting, rash that doesn't fade when pressed with a glass.\nIn babies: bulging fontanelle (soft spot), high-pitched cry, refusing to eat, lethargy.\nEMERGENCY: Call 1122. Go to hospital IMMEDIATELY. Meningitis can cause death or brain damage within hours. Do NOT wait.", "ur": "میننجائٹس دماغ کی جھلیوں کی سوزش ہے۔ یہ میڈیکل ایمرجنسی ہے۔\nعلامات: اچانک تیز بخار، شدید سر درد، گردن سخت (ٹھوڑی سینے تک نہ لگے)، روشنی سے تکلیف، الجھن، الٹی، دانے جو شیشے دبانے سے غائب نہ ہوں۔\nبچوں میں: کھلہ سر نرم، تیز رویا، کھانا نہ کھانا، سستی۔\nایمرجنسی: 1122 کال کریں۔ فوراً ہسپتال جائیں۔ میننجائٹس گھنٹوں میں موت یا دماغی نقصان کر سکتا ہے۔ انتظار نہ کریں۔", "roman": "Meningitis dimagh ki jhaliyon ki sozish hai. Yeh medical emergency hai.\nAlamaat: achanak tez bukhar, shadeed sar dard, gardan sakht (thodi seene tak na lagay), roshni se takleef, uljhan, ulti, danay jo sheeshe dabane se ghayab na hon.\nBachon mein: khula sar naram, tez roya, khana na khana, susti.\nEmergency: 1122 call karein. Fori hospital jayein. Meningitis ghanton mein maut ya dimaghi nuqsan kar sakta hai. Intezar na karein." },
    "tags": ["meningitis", "stiff neck", "brain infection", "gardan sakht", "سر درد بخار", "دانے", "meningococcal", "bacterial meningitis"],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Meningococcal meningitis — fact sheet", "url": "https://www.who.int/news-room/fact-sheets/detail/meningococcal-meningitis", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "pneumonia-adult",
    "topic": "pneumonia-adult",
    "title": { "en": "Pneumonia in adults — lung infection", "ur": "بالغوں میں نمونیہ — پھیپھڑوں کا انفیکشن", "roman": "Baragon mein namonia — phphron ka infection" },
    "content": { "en": "Pneumonia is an infection of the lungs. Symptoms: cough (may produce green/yellow phlegm), fever, shortness of breath, rapid breathing, chest pain when breathing deeply, fatigue.\nSEE A DOCTOR within 24 hours if: fever above 38.5°C, breathing difficulty, chest pain, confusion, or coughing blood.\nEMERGENCY: severe shortness of breath, blue lips, confusion, or very low blood pressure = call 1122.\nPrevention: pneumococcal vaccine, flu vaccine, hand hygiene, avoid smoking.", "ur": "نمونیہ پھیپھڑوں کا انفیکشن ہے۔ علامات: کھانسی (سبز/پیلا بلغم)، بخار، سانس لینے میں مشکل، تیز سانس، سانس لینے پر سینے میں درد، تھکاوٹ۔\n24 گھنٹے میں ڈاکٹر کو دکھائیں اگر: بخار 38.5°C سے زیادہ، سانس لینے میں مشکل، سینے کا درد، الجھن، یا کھانسی میں خون۔\nایمرجنسی: شدید سانس کی مشکل، نیلے ہونٹ، الجھن، یا بہت کم بلڈ پریشر = 1122 کال کریں۔\nبچاؤ: نمونوکوکل ویکسین، فلو ویکسین، ہاتھ صاف رکھیں، سگریف نہ پییں۔", "roman": "Namonia phphron ka infection hai. Alamaat: khansi (sabz/piela balgham), bukhar, saans lene mein mushkil, tez saans, saans lene par seene mein dard, thakawat.\n24 ghante mein doctor ko dikhayein agar: bukhar 38.5°C se zyada, saans lene mein mushkil, seene ka dard, uljhan, ya khansi mein khoon.\nEmergency: shadeed saans ki mushkil, neele hont, uljhan, ya bohot kam BP = 1122 call karein.\nBachao: pneumococcal vaccine, flu vaccine, haath saaf rakhein, cigarette na peeyein." },
    "tags": ["pneumonia", "lung infection", "namonia", "phphron", "cough fever", "سینہ بند", "بلغم", "khansi bukhar", "chest infection"],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Pneumonia — fact sheet", "url": "https://www.who.int/news-room/fact-sheets/detail/pneumonia", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "pneumonia-child",
    "topic": "pneumonia-child",
    "title": { "en": "Pneumonia in children — WHO IMCI guidelines", "ur": "بچوں میں نمونیہ — WHO IMCI ہدایات", "roman": "Bachon mein namonia — WHO IMCI hidayat" },
    "content": { "en": "Pneumonia is the #1 killer of children under 5 worldwide. Symptoms: cough, fast breathing, chest indrawing (skin between ribs sucks in when breathing), refusal to eat, fever.\nFAST BREATHING: count breaths per minute — if >60 (age <2mo), >50 (2-11mo), >40 (1-5yr) = pneumonia.\nSEVERE PNEUMONIA: chest indrawing, grunting, head nodding, not drinking, convulsions, lethargy.\nEMERGENCY: chest indrawing or any danger sign = go to hospital IMMEDIATELY. Call 1122.\nTreatment: antibiotics (amoxicillin) prescribed by a doctor. Never self-medicate children.", "ur": "نمونیہ دنیا بھر میں 5 سال سے کم عمر بچوں کی موت کی سب سے بڑی وجہ ہے۔ علامات: کھانسی، تیز سانس، سینے کا دھنسنا، کھانا نہ کھانا، بخار۔\nتیز سانس: ایک منٹ میں سانیوں کی گنتی کریں — 60 سے زیادہ (2 مہینہ سے کم)، 50 سے زیادہ (2-11 مہینہ)، 40 سے زیادہ (1-5 سال) = نمونیہ۔\nشدید نمونیہ: سینے کا دھنسنا، گھرگھراہٹ، سر ہلنا، پانی نہ پینا، دورے، سستی۔\nایمرجنسی: سینے کا دھنسنا یا کوئی بھی خطرے کی علامت = فوراً ہسپتال جائیں۔ 1122 کال کریں۔", "roman": "Namonia duniya bhar mein 5 saal se kam umar bachon ki maut ki sab se bari wajah hai. Alamaat: khansi, tez saans, seene ka dhansna, khana na khana, bukhar.\nTez saans: ek minute mein saanson ki ginti karein — 60 se zyada (2 mahina se kam), 50 se zyada (2-11 mahina), 40 se zyada (1-5 saal) = namonia.\nShadeed namonia: seene ka dhansna, gharagharahat, sar hilna, pani na peena, doray, susti.\nEmergency: seene ka dhansna ya koi bhi khatre ki alamat = fori hospital jayein. 1122 call karein." },
    "tags": ["pneumonia child", "child cough", "fast breathing", "chest indrawing", "baccha khansi", "tez saans bacha", "بچے کو کھانسی", "سینہ دھنسنا", "IMCI"],
    "baseLevel": "EMERGENCY",
    "audience": "child",
    "source": { "publisher": "WHO", "title": "Integrated Management of Childhood Illness (IMCI)", "url": "https://www.who.int/publications/i/item/9789240010649", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "stroke-fast",
    "topic": "stroke-fast",
    "title": { "en": "Stroke — FAST warning signs (brain attack)", "ur": "اسٹروک — FAST خطرے کی علامات", "roman": "Stroke — FAST khatre ki alamaat" },
    "content": { "en": "A stroke is a brain attack — blood flow to part of the brain stops. It is a MEDICAL EMERGENCY. Act FAST:\nF — FACE: Is one side of the face drooping? Ask them to smile.\nA — ARMS: Can they raise both arms? Does one drift down?\nS — SPEECH: Is speech slurred or strange? Ask them to repeat a sentence.\nT — TIME: If ANY sign is present, call 1122 IMMEDIATELY. Every minute counts.\nOther signs: sudden severe headache, sudden vision loss, sudden dizziness, loss of balance.\nDo NOT give food, water, or medication. Note the time symptoms started. Go to hospital IMMEDIATELY.", "ur": "اسٹروک دماغ پر حملہ ہے — دماغ کے کسی حصے میں خون کا بہاؤ بند ہو جاتا ہے۔ یہ میڈیکل ایمرجنسی ہے۔ FAST عمل کریں:\nF — چہرہ: کیا چہرے کا ایک طرفہ گر رہا ہے؟ مسکرانے کو کہیں۔\nA — بازو: کیا دونوں بازو اٹھا سکتے ہیں؟ ایک نیچے گرتا ہے؟\nS — بات: کیا بات الٹی ہے؟ ایک جملہ دہرائیں۔\nT — وقت: کوئی بھی علامت ہو تو فوراً 1122 کال کریں۔ ہر منٹ اہم ہے۔\nفوراً ہسپتال جائیں۔ کچھ کھانے/پینے/دوا نہ دیں۔ علامات شروع ہونے کا وقت نوٹ کریں۔", "roman": "Stroke dimagh par hamla hai — dimagh ke kisi hisay mein khoon ka bahao band ho jata hai. Yeh medical emergency hai. FAST amal karein:\nF — Chehra: kya chehre ka ek tarfa gir raha hai? Muskurane ko kahein.\nA — Baazu: kya dono baazu utha sakte hain? Ek neechay girta hai?\nS — Baat: kya baat ulti hai? Ek jumla duhrayein.\nT — Waqt: koi bhi alamat ho to fori 1122 call karein. Har minute ahem hai.\nFori hospital jayein. Kuch khane/peene/dawa na dein. Alamaat shuru hone ka waqt note karein." },
    "tags": ["stroke", "FAST", "brain attack", "face drooping", "slurred speech", "falij", "فالج", "dimagh ki nali", "stroke urdu", "أچانک کمزوری"],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Stroke — fact sheet", "url": "https://www.who.int/news-room/fact-sheets/detail/stroke", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "heart-attack",
    "topic": "heart-attack",
    "title": { "en": "Heart attack — chest pain emergency", "ur": "دل کا دورہ — سینے کے درد کی ایمرجنسی", "roman": "Dil ka dora — seene ke dard ki emergency" },
    "content": { "en": "A heart attack happens when blood flow to the heart is blocked. It is a MEDICAL EMERGENCY.\nSymptoms: central chest pain or pressure (feels like heavy weight on chest), pain spreading to left arm/jaw/back, shortness of breath, cold sweat, nausea, dizziness.\nWOMEN may have different symptoms: fatigue, nausea, jaw pain without chest pain.\nEMERGENCY: Call 1122 IMMEDIATELY. Chew an aspirin (300mg) if available and not allergic. Sit still, do NOT exert. Time = muscle — every minute of delay damages heart muscle.\nDo NOT drive yourself — get someone to drive or call an ambulance.", "ur": "دل کا دورہ خون کی نالی بند ہونے سے ہوتا ہے۔ یہ میڈیکل ایمرجنسی ہے۔\nعلامات: سینے کے وسط میں درد یا دباؤ (جیسے سینے پر بوجھ)، درد بائیں بازو/جبڑے/پیٹھ تک پھیلنا، سانس کی کمی، سرد پسینہ، متلی، چکر۔\nخواتین میں علامات مختلف ہو سکتی ہیں: تھکاوٹ، متلی، جبڑے کا درد۔\nایمرجنسی: فوراً 1122 کال کریں۔ اگر دستیاب ہو اور الرجی نہ ہو تو ایک سپرن (300mg) چبائیں۔ خاموش بیٹھیں، محنت نہ کریں۔ ہر منٹ کا نقصان ہوتا ہے۔\nخود ڈرائیو نہ کریں — کسی اور کو ڈرائیو کریں یا ایمبولینس بلائیں۔", "roman": "Dil ka dora khoon ki nali band hone se hota hai. Yeh medical emergency hai.\nAlamaat: seene ke wast mein dard ya dabao (jaise seene par boojh), dard bain baazu/jabray/pith tak phailna, saans ki kami, sard paseena, matli, chakar.\nAuraton mein alamaat mukhtalif ho sakti hain: thakawat, matli, jabray ka dard.\nEmergency: fori 1122 call karein. Agar dastiyab ho aur allergy na ho to ek aspirin (300mg) chubayein. Khamosh baithein, mehnat na karein. Har minute ka nuqsan hota hai.\nKhud drive na karein — kisi aur ko drive karein ya ambulance bulayein." },
    "tags": ["heart attack", "myocardial infarction", "MI", "chest pain", "seene ka dard", "dil ka dora", "دل کا درد", "سینہ درد", "left arm pain", "cardiac emergency"],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Cardiovascular diseases — fact sheet", "url": "https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "diabetic-ketoacidosis",
    "topic": "dka",
    "title": { "en": "Diabetic Ketoacidosis (DKA) — diabetes emergency", "ur": "ذیابیطس کیٹواسائڈوسس — شوگر کی ایمرجنسی", "roman": "Diabetes ketoacidosis — sugar ki emergency" },
    "content": { "en": "DKA is a life-threatening complication of diabetes. It happens when blood sugar is very high and the body produces ketones.\nSymptoms: extreme thirst, very frequent urination, nausea/vomiting, abdominal pain, fruity-smelling breath, rapid breathing, confusion, drowsiness.\nCAUSED BY: missed insulin doses, infection, stress.\nEMERGENCY: Go to hospital IMMEDIATELY. DKA can cause coma and death. Check blood sugar if possible (usually >250 mg/dL). Check ketones if possible.\nDo NOT stop insulin without medical advice — sick days may need MORE insulin.", "ur": "DKA ذیابیطس کی جان لیوا پیچیدگی ہے۔ خون میں شوگر بہت زیادہ ہونے سے کیٹون بنتے ہیں۔\nعلامات: شدید پیاس، بہت زیادہ پیشاب، متلی/الٹی، پیٹ کا درد، میٹھی سانس، تیز سانس، الجھن، نیند۔\nوجہ: انسولین نہ لینا، انفیکشن، ذہنی دباؤ۔\nایمرجنسی: فوراً ہسپتال جائیں۔ DKA سے کوما اور موت ہو سکتی ہے۔ اگر ہو تو بلڈ شوگر چیک کریں (عام طور پر 250 سے زیادہ)۔", "roman": "DKA diabetes ki jan lewa pechidgi hai. Khoon mein sugar bohot zyada hone se ketone bantay hain.\nAlamaat: shadeed pyas, bohot zyada peshab, matli/ulti, pait ka dard, meethi saans, tez saans, uljhan, neend.\nWajah: insulin na lena, infection, zahni dabao.\nEmergency: fori hospital jayein. DKA se coma aur maut ho sakti hai. Agar ho to blood sugar check karein (amom tor par 250 se zyada)." },
    "tags": ["DKA", "ketoacidosis", "diabetes emergency", "high blood sugar", "sugar emergency", "meethi saans", "شوگر زیادہ", "ذیابیطس ایمرجنسی", "fruity breath"],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Diabetes — fact sheet", "url": "https://www.who.int/news-room/fact-sheets/detail/diabetes", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "snake-bite",
    "topic": "snake-bite",
    "title": { "en": "Snake bite — first aid and emergency", "ur": "سانپ کا کاٹنا — ابتدائی امداد اور ایمرجنسی", "roman": "Saamp ka kaatna — ibtidai imdaad aur emergency" },
    "content": { "en": "Pakistan has many venomous snakes (cobra, krait, vipers). Snake bite is a MEDICAL EMERGENCY.\nFirst aid:\n1. Keep the person CALM and STILL — movement spreads venom faster.\n2. Remove jewelry/tight clothing near the bite (swelling will occur).\n3. Keep the bitten limb BELOW heart level.\n4. DO NOT: cut the wound, suck out venom, apply ice, apply tourniquet, or give alcohol.\n5. Note the snake's appearance if possible (color, size) — DO NOT try to catch it.\n6. Go to hospital IMMEDIATELY for anti-venom. Call 1122.\nSymptoms of venom: swelling, pain, bleeding, nausea, blurred vision, drooping eyelids, difficulty breathing, muscle weakness.\nTIME IS CRITICAL — anti-venom works best within 4-6 hours.", "ur": "پاکستان میں زہریلے سانپ ہیں (کوبرا، کریٹ، وائپر)۔ سانپ کا کاٹنا میڈیکل ایمرجنسی ہے۔\nابتدائی امداد:\n1. مریض کو پرسکون اور خاموش رکھیں — حرکت زہر تیزی سے پھیلاتی ہے۔\n2. کاٹے والی جگہ کے قریب زیورات/تنگ کپڑے اتاریں۔\n3. کاٹا ہوا حصہ دل سے نیچے رکھیں۔\n4. زخم نہ کاٹیں، زہر نہ چوسیں، برف نہ لگائیں، ٹورنیکیٹ نہ باندھیں۔\n5. سانپ کی شکل نوٹ کریں — پکڑنے کی کوشش نہ کریں۔\n6. اینٹی وینم کے لیے فوراً ہسپتال جائیں۔ 1122 کال کریں۔\nزہر کی علامات: سوجن، درد، خون بہنا، متلی، دھندلا نظر، پلک گرنا، سانس مشکل، پٹھوں کی کمزوری۔", "roman": "Pakistan mein zahrilay saamp hain (cobra, krait, viper). Saamp ka kaatna medical emergency hai.\nIbtidai imdaad:\n1. Mareez ko pursukoon aur khamosh rakhein — harkat zahr tezi se phelati hai.\n2. Kaate wali jagah ke qareeb zewarat/tang kapre utarein.\n3. Kaata hua hissa dil se neechay rakhein.\n4. Zakham na kaatein, zahr na choosein, barf na lagayein, tourniquet na bandhein.\n5. Saamp ki shakal note karein — pakarne ki koshish na karein.\n6. Anti-venom ke liye fori hospital jayein. 1122 call karein.\nZahr ki alamaat: sojan, dard, khoon behna, matli, dhundla nazar, palak girna, saans mushkil, pathon ki kamzori." },
    "tags": ["snake bite", "saamp kaat", "snake venom", "antivenom", "سانپ", "زہر", "snakebite first aid", "krait", "cobra", "viper bite"],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Snakebite envenoming — fact sheet", "url": "https://www.who.int/news-room/fact-sheets/detail/snakebite-envenoming", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "rabies-bite",
    "topic": "rabies-bite",
    "title": { "en": "Dog bite and rabies — urgent prevention", "ur": "کتے کے کاٹنے اور ریبیز — فوری بچاؤ", "roman": "Kutte ke kaatne aur rabies — fori bachao" },
    "content": { "en": "Rabies is 100% fatal once symptoms appear but 100% preventable with prompt vaccination. ANY dog/animal bite that breaks the skin = potential rabies exposure.\nIMMEDIATE steps:\n1. Wash the wound with soap and running water for 15 MINUTES. This is the most important step.\n2. Apply antiseptic (povidone-iodine or alcohol) if available.\n3. Go to a hospital or vaccination center IMMEDIATELY for rabies vaccine + immunoglobulin.\n4. Report the bite — observe the animal for 10 days if possible.\nDO NOT: stitch the wound, apply home remedies, or wait to see if symptoms develop.\nVACCINE SCHEDULE: Day 0, 3, 7, 14, 28 (5 doses). Must complete all doses.\nEMERGENCY: If the bite is on the face/neck/head, go to hospital IMMEDIATELY — rabies reaches the brain faster from these areas.", "ur": "ریبیز کی علامات ظاہر ہونے کے بعد 100% جان لیوا ہے لیکن فوری ویکسین سے 100% قابلِ بچاؤ ہے۔ کسی بھی جانور کا کاٹ = ریبیز کا خطرہ۔\nفوری اقدامات:\n1. زخم کو صابن اور بہتے پانی سے 15 منٹ دھوئیں۔ یہ سب سے اہم قدم ہے۔\n2. اینٹی سیپٹک لگائیں۔\n3. فوراً ہسپتال یا ویکسینیشن سینٹر جائیں۔\n4. جانور کو 10 دن تک دیکھیں۔\nزخم کو سی نہ دیں، گھریلو علاج نہ کریں۔\nویکسین: دن 0، 3، 7، 14، 28 (5 خوراکیں)۔ سب مکمل کرنیں۔", "roman": "Rabies ki alamaat zahir hone ke baad 100% jan lewa hai lekin fori vaccine se 100% qabil-e-bachao hai. Kisi bhi janwar ka kaat = rabies ka khatra.\nFori iqdamat:\n1. Zakham ko sabun aur behte pani se 15 minute dhoyein. Yeh sab se ahem qadam hai.\n2. Antiseptic lagayein.\n3. Fori hospital ya vaccination center jayein.\n4. Janwar ko 10 din tak dekhein.\nZakham ko se na dein, gharelu ilaaj na karein.\nVaccine: din 0, 3, 7, 14, 28 (5 khoraakein). Sab mukammal karein." },
    "tags": ["rabies", "dog bite", "animal bite", "kutta kaat", "کتے کا کاٹنا", "ریبیز", "rabies vaccine", "anti-rabies", "zahar ilaaj"],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Rabies — fact sheet", "url": "https://www.who.int/news-room/fact-sheets/detail/rabies", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "heat-exhaustion",
    "topic": "heat-exhaustion",
    "title": { "en": "Heat exhaustion — summer heat (50°C in Pakistan)", "ur": "گرمی کی تھکاوٹ — گرمیوں کا موسم", "roman": "Garmi ki thakawat — garmiyon ka mausam" },
    "content": { "en": "Pakistan's summers can reach 50°C. Heat exhaustion is the body's warning that it's overheating.\nSymptoms: heavy sweating, weakness, dizziness, headache, nausea, muscle cramps, rapid pulse, cool/moist skin.\nFirst aid:\n1. Move to a cool/shaded place IMMEDIATELY.\n2. Remove excess clothing.\n3. Drink cool water with a pinch of salt (or ORS).\n4. Apply cool wet cloths to skin.\n5. Rest for at least 30 minutes.\nSEE A DOCTOR if: symptoms don't improve in 30 minutes, vomiting, confusion.\nEMERGENCY (HEAT STROKE): NO sweating, hot/dry skin, body temperature above 40°C, confusion, unconsciousness, seizure = call 1122 IMMEDIATELY. Heat stroke can kill within minutes.", "ur": "پاکستان کی گرمیوں میں درجہ حرارت 50°C تک پہنچ سکتا ہے۔ گرمی کی تھکاوٹ جسم کا انتباہ ہے۔\nعلامات: زیادہ پسینہ، کمزوری، چکر، سر درد، متلی، پٹھوں میں درد، تیز نبض، ٹھنڈی/گیلی جلد۔\nابتدائی امداد:\n1. فوراً ٹھنڈی/سائی والی جگہ جائیں۔\n2. اضافی کپڑے اتاریں۔\n3. ٹھنڈا پانی نمک کے ساتھ (یا ORS) پییں۔\n4. جسم پر ٹھنڈے گیلا کپڑے رکھیں۔\n5. کم از کم 30 منٹ آرام کریں۔\nایمرجنسی (ہیٹ اسٹروک): پسینہ نہ ہونا، گرم/خشک جلد، درجہ حرارت 40°C سے زیادہ، الجھن، بے ہوشی، دورہ = فوراً 1122 کال کریں۔", "roman": "Pakistan ki garmiyon mein hararat 50°C tak pahunch sakta hai. Garmi ki thakawat jism ka intibah hai.\nAlamaat: zyada paseena, kamzori, chakar, sar dard, matli, pathon mein dard, tez nabz, thandi/geeli jild.\nIbtidai imdaad:\n1. Fori thandi/saye wali jagah jayein.\n2. Izaafi kapre utarein.\n3. Thanda pani namak ke saath (ya ORS) peeyein.\n4. Jism par thande geela kapre rakhein.\n5. Kam az kam 30 minute aaraam karein.\nEmergency (heat stroke): paseena na hona, garam/khushk jild, hararat 40°C se zyada, uljhan, behoshi, dora = fori 1122 call karein." },
    "tags": ["heat exhaustion", "heat stroke", "garmi", "lu", "گرمی لگنا", "لو", "heat emergency", "sun stroke", "dehydration heat", "50 degrees"],
    "baseLevel": "URGENT",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Heat and health", "url": "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "pesticide-poisoning-data",
    "topic": "pesticide-poisoning",
    "title": { "en": "Pesticide poisoning — agricultural emergency", "ur": "کیمیائی زہر کھانے کی ایمرجنسی", "roman": "Chemical zahr khane ki emergency" },
    "content": { "en": "Pesticide/organophosphate poisoning is common in Pakistan's agricultural areas. It is a MEDICAL EMERGENCY.\nSymptoms: excessive salivation, tearing, sweating, small pupils, muscle twitching, difficulty breathing, vomiting, diarrhea, confusion, seizures.\nIf ingested (swallowed):\n1. Do NOT induce vomiting.\n2. Call 1122 IMMEDIATELY.\n3. Take the pesticide container to the hospital — doctors need to know what chemical it is.\nIf on skin: remove contaminated clothing, wash skin with lots of water for 15 minutes.\nIf inhaled: move to fresh air immediately.\nEMERGENCY: Go to hospital IMMEDIATELY. Atropine is the antidote — must be given by medical professionals. Delay = death.\nPrevention: wear protective gear, store pesticides safely, never transfer to food containers.", "ur": "کیمیائی زہر پاکستان کی زرعی علاقوں میں عام ہے۔ یہ میڈیکل ایمرجنسی ہے۔\nعلامات: زیادہ تھوک، آنسو، پسینہ، چھوٹی پتیاں، پٹھوں کا کھنچاؤ، سانس مشکل، الٹی، دستاب، الجھن، دورے۔\nکھانے کی صورت میں: الٹی نہ کرائیں، فوراً 1122 کال کریں، زہر کی بوتل ہسپتال لے جائیں۔\nجلد پر: کپڑے اتاریں، 15 منٹ پانی سے دھوئیں۔\nسانس میں: تازہ ہوا میں جائیں۔\nایمرجنسی: فوراً ہسپتال جائیں۔ ایٹروپائن تریاق ہے۔", "roman": "Chemical zahr Pakistan ki zrai ilaqon mein aam hai. Yeh medical emergency hai.\nAlamaat: zyada thook, ansoo, paseena, chhoti pattian, pathon ka khinchaoo, saans mushkil, ulti, dastab, uljhan, doray.\nKhane ki soorat mein: ulti na karayein, fori 1122 call karein, zahr ki bottle hospital le jayein.\nJild par: kapre utarein, 15 minute pani se dhoyein.\nSaans mein: taza hawa mein jayein.\nEmergency: fori hospital jayein. Atropine tiryaaq hai." },
    "tags": ["pesticide poisoning", "organophosphate", "chemical poisoning", "zahr", "زراعت زہر", "atropine", "agricultural poisoning", "کیمیائی", "self harm pesticide"],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Pesticide poisoning — prevention and management", "url": "https://www.who.int/publications", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "schizophrenia",
    "topic": "schizophrenia",
    "title": { "en": "Schizophrenia — understanding psychosis", "ur": "شیزوفرینیا — ذہنی بیماری کی سمجھ", "roman": "Schizophrenia — dimaghi bimari ki samajh" },
    "content": { "en": "Schizophrenia is a chronic mental health condition affecting how a person thinks, feels, and behaves.\nSymptoms: hearing voices or seeing things that aren't there (hallucinations), false beliefs (delusions), disorganized speech, social withdrawal, lack of motivation, reduced emotional expression.\nSEE A PSYCHIATRIST: Early treatment improves outcomes. Medication (antipsychotics) is essential.\nEMERGENCY: If the person is a danger to themselves or others, hearing command hallucinations to harm, or unable to care for basic needs — seek immediate help. Call 1166 (mental health helpline).\nDo NOT: argue with delusions, mock, or force them. Stay calm, listen, and encourage professional help.\nTreatment is available and effective. Many people with schizophrenia lead productive lives with proper care.", "ur": "شیزوفرینیا ایک دائمی ذہنی بیماری ہے جو سوچنے، محسوس کرنے اور رویے کو متاثر کرتی ہے۔\nعلامات: آوازیں سنا یا چیزیں دیکھنا جو نہیں ہیں، غلط یقین، بے ترتیب بات چیت، سماعت سے الگ ہونا، حوصلے کی کمی۔\n ماہرِ امراضِ نفسیات سے رابطہ کریں: ابتدائی علاج بہتر نتائج دیتا ہے۔ دوا ضروری ہے۔\nایمرجنسی: خود یا دوسروں کو نقصان پہنچانے کا خطرہ ہو تو فوری مدد لیں۔ 1166 کال کریں۔\nغلط یقین سے بحث نہ کریں، مضحکہ نہ بنائیں۔ پرسکون رہیں اور پیشہ ورانہ مدد کی ترغیب دیں۔", "roman": "Schizophrenia ek daimi dimaghi bimari hai jo sochne, mehsoos karne aur rawayya ko mutaasir karti hai.\nAlamaat: aawazein suna ya cheezein dekhna jo nahi hain, ghalat yaqeen, be tarteeb baat cheet, samajat se alag hona, hoslay ki kami.\nMaahir-e-amraaz-e-nafsiyat se rabta karein: ibtidai ilaaj behtar nataij deta hai. Dawa zaroori hai.\nEmergency: khud ya doosron ko nuksan pahunchane ka khatra ho to fori madad lein. 1166 call karein.\nGhalat yaqeen se behas na karein, mazaka na banayein. Pursukoon rahein aur peshawarana madad ki targheeb dein." },
    "tags": ["schizophrenia", "psychosis", "hallucinations", "delusions", "hearing voices", "mental illness", "ذہنی بیماری", "آوازیں", "dimaghi bimari", "psychiatry"],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Schizophrenia — fact sheet", "url": "https://www.who.int/news-room/fact-sheets/detail/schizophrenia", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "bipolar-disorder",
    "topic": "bipolar",
    "title": { "en": "Bipolar disorder — mood swings", "ur": "بائی پولر ڈس آرڈر — موڈ کی تبدیلیاں", "roman": "Bipolar disorder — mood ki tabdeeliyan" },
    "content": { "en": "Bipolar disorder causes extreme mood swings between mania (high) and depression (low).\nMANIA symptoms: very high energy, little need for sleep, rapid speech, racing thoughts, impulsive/risky behavior, grandiose ideas, irritability.\nDEPRESSION symptoms: low mood, loss of interest, fatigue, sleep changes, hopelessness, suicidal thoughts.\nSEE A PSYCHIATRIST: Treatment includes mood stabilizers (lithium, valproate) and therapy. With treatment, people lead stable lives.\nEMERGENCY: Suicidal thoughts during depression, or dangerous behavior during mania (reckless spending, risky driving) = seek immediate help. Call 1166.\nDo NOT stop medication suddenly — this can trigger worse episodes.", "ur": "بائی پولر ڈس آرڈر موڈ کی شدید تبدیلیاں پیدا کرتا ہے — مینیا (اونچا) اور ڈپریشن (نیچا)۔\nمانیا علامات: بہت زیادہ توانائی، کم نیند، تیز بات، جلد جلد خیالات، خطرناک رویہ، بڑے خیالات، جھنجھلاہٹ۔\nڈپریشن علامات: اداس موڈ، دلچسپی کی کمی، تھکاوٹ، نیند کی تبدیلی، مایوسی، خودکشی کے خیالات۔\nماہرِ نفسیات سے ملیں: علاج میں موڈ سٹیبلائزر اور تھراپی شامل ہے۔\nایمرجنسی: خودکشی کے خیالات یا خطرناک رویہ = فوری مدد لیں۔ 1166 کال کریں۔\nدوا اچانک نہ بند کریں۔", "roman": "Bipolar disorder mood ki shadeed tabdeeliyan paida karta hai — mania (ooncha) aur depression (neechay).\nMania alamaat: bohot zyada tawanai, kam neend, tez baat, jald jald khayalat, khatarnak rawayya, baray khayalat, jhanjhlahaat.\nDepression alamaat: udaas mood, dilchaspi ki kami, thakawat, neend ki tabdeeli, mayoosi, khudkushi ke khayalat.\nMaahir-e-nafsiyat se mulein: ilaaj mein mood stabilizer aur therapy shamil hai.\nEmergency: khudkushi ke khayalat ya khatarnak rawayya = fori madad lein. 1166 call karein.\nDawa achanak na band karein." },
    "tags": ["bipolar", "mania", "mood swings", "bipolar disorder", "moood changes", "مانیا", "ڈپریشن", "خودکشی خیالات", "psychiatry mood"],
    "baseLevel": "ROUTINE",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Bipolar disorder", "url": "https://www.who.int/news-room/fact-sheets/detail/bipolar-disorder", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "domestic-violence",
    "topic": "domestic-violence",
    "title": { "en": "Domestic violence — safety and support", "ur": "گھریلو تشدد — حفاظت اور مدد", "roman": "Gharelo tashadud — hifazat aur madad" },
    "content": { "en": "Domestic violence is a serious problem. You are not alone and it is not your fault.\nIf you are in immediate danger: Call 15 (Police) or 1122 (Rescue).\nSafety planning:\n1. Keep important documents (ID, money, phone) in a safe place you can access quickly.\n2. Memorize emergency numbers: 15 (Police), 1122 (Rescue), 1099 (Women Helpline).\n3. Identify a safe place to go (family, friend, shelter).\n4. Tell someone you trust what is happening.\n5. Keep a record of incidents (dates, photos of injuries).\nResources in Pakistan:\n- Women Helpline: 1099\n- Madadgar National Helpline: 1099\n- Women Shelter homes available in major cities\nSEE A DOCTOR if injured — your medical record is important evidence.\nYou deserve to be safe. Seeking help is a sign of strength.", "ur": "گھریلو تشدد ایک سنگین مسئلہ ہے۔ آپ اکیلے نہیں ہیں اور یہ آپ کی غلطی نہیں ہے۔\nاگر فوری خطرہ ہو: 15 (پولیس) یا 1122 (ریسکیو) پر کال کریں۔\nحفاظتی منصوبہ:\n1. اہم دستاویزات محفوظ جگہ رکھیں۔\n2. ایمرجنسی نمبر یاد رکھیں: 15، 1122، 1099۔\n3. محفوظ جگہ متعین کریں۔\n4. کسی قابلِ اعتماد کو بتائیں۔\n5. واقعات کا ریکارڈ رکھیں۔\nپاکستان میں وسائل: خواتین ہیلپ لائن 1099۔\nزخمی ہونے پر ڈاکٹر کو دکھائیں۔", "roman": "Gharelo tashadud ek sangin masla hai. Aap akele nahi hain aur yeh aap ki ghalati nahi hai.\nAgar fori khatra ho: 15 (Police) ya 1122 (Rescue) par call karein.\nHifazati mansuba:\n1. Ahem dastavezat mehfooz jagah rakhein.\n2. Emergency number yaad rakhein: 15, 1122, 1099.\n3. Mehfooz jagah mutayyan karein.\n4. Kisi qabil-e-aitmad ko batayein.\n5. Waqiyat ka record rakhein.\nPakistan mein wasail: Khawateen helpline 1099.\nZakhi hone par doctor ko dikhayein." },
    "tags": ["domestic violence", "abuse", "women safety", "tashadud", "تشدد", "gharelo tashadud", "women helpline", "1099", "safety planning", "protection"],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Violence against women", "url": "https://www.who.int/news-room/fact-sheets/detail/violence-against-women", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "scabies",
    "topic": "scabies",
    "title": { "en": "Scabies — itchy skin infection", "ur": "خارش — جلد کا انفیکشن", "roman": "Khaarish — jild ka infection" },
    "content": { "en": "Scabies is a skin infestation by tiny mites. It spreads easily in crowded households.\nSymptoms: intense itching (especially at night), red bumps/burrows between fingers, wrists, waist, armpits, genitals.\nTreatment:\n1. Apply permethrin 5% cream (available at pharmacy) from neck down to toes.\n2. Leave on for 8-14 hours (apply at night, wash off in morning).\n3. Wash all clothes, bed sheets, towels in hot water.\n4. Treat ALL family members at the same time — even those without symptoms.\n5. Repeat treatment after 1 week.\nSEE A DOCTOR if: itching persists after 2 weeks, signs of infection (pus, fever), or in young babies.\nPrevention: avoid sharing clothes/towels, maintain personal hygiene.", "ur": "خارش مائیٹ نامی جراسیم کی وجہ سے ہوتی ہے۔ یہ بھیڑ بھڑے گھروں میں آسانی سے پھیلتی ہے۔\nعلامات: شدید خارش (خصوصاً رات کو)، انگلیوں کے درمیان، کلائی، کمر، بغل پر سرخ دانے۔\nعلاج:\n1. پرمیتھرین 5% کریم گردن سے پاؤں تک لگائیں۔\n2. 8-14 گھنٹے چھوڑیں (رات کو لگائیں، صبح دھوئیں)۔\n3. تمام کپڑے، چادرے گرم پانی سے دھوئیں۔\n4. خاندان کے تمام افراد کا یکجا علاج کریں۔\n5. ایک ہفتے بعد دہرائیں۔\nڈاکٹر کو دکھائیں اگر: 2 ہفتے بعد بھی خارش رہے، انفیکشن کی علامات۔", "roman": "Khaarish mite nami jaraseem ki wajah se hoti hai. Yeh bheer bhare gharon mein aasani se phailti hai.\nAlamaat: shadeed khaarish (khususan raat ko), ungliyon ke darmiyan, kalai, kamar, baghal par surkh danay.\nIlaaj:\n1. Permethrin 5% cream gardan se paon tak lagayein.\n2. 8-14 ghante chhodein (raat ko lagayein, subah dhoyein).\n3. Tamam kapre, chadaray garam pani se dhoyein.\n4. Khandan ke tamam afraad ka ikja ilaaj karein.\n5. Ek haftay baad duhrayein.\nDoctor ko dikhayein agar: 2 haftay baad bhi khaarish rahay, infection ki alamaat." },
    "tags": ["scabies", "itchy skin", "khaarish", "خارش", "mites", "skin infection", "permethrin", "night itching", "danay", "جھنگل"],
    "baseLevel": "SELF_CARE",
    "audience": "general",
    "source": { "publisher": "WHO", "title": "Scabies", "url": "https://www.who.int/news-room/fact-sheets/detail/scabies", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "measles",
    "topic": "measles",
    "title": { "en": "Measles — vaccine-preventable disease", "ur": "خسرہ — ویکسین سے قابلِ بچاؤ بیماری", "roman": "Khasra — vaccine se qabil-e-bachao bimari" },
    "content": { "en": "Measles is a highly contagious viral disease. It can cause serious complications including pneumonia, encephalitis, and death.\nSymptoms: high fever, cough, runny nose, red/watery eyes, white spots inside cheeks (Koplik spots), followed by a red rash that starts on the face and spreads downward.\nSEE A DOCTOR: if you suspect measles, especially in children under 5, pregnant women, or malnourished children.\nEMERGENCY: difficulty breathing, seizures, severe dehydration, confusion, or loss of consciousness = call 1122.\nTreatment: supportive care — fluids, fever management, vitamin A (prevents complications). No specific antiviral.\nPrevention: MMR vaccine at 9 months and 15 months. Vaccination is the BEST prevention. Pakistan has measles outbreaks due to low vaccination rates.", "ur": "خسرہ ایک انتہائی متعدی وائرس کی بیماری ہے۔ یہ نمونیا، دماغی سوزش اور موت کا سبب بن سکتی ہے۔\nعلامات: تیز بخار، کھانسی، ناک بہنا، سرخ/پانی والی آنکھیں، گال کے اندر سفید دانے، پھر سرخ دانے جو چہرے سے شروع ہو کر نیچے پھلیں۔\nڈاکٹر کو دکھائیں: خاص طور پر 5 سال سے کم بچوں، حاملہ خواتین، یا کمزور بچوں میں۔\nایمرجنسی: سانس مشکل، دورے، شدید پانی کی کمی، الجھن = 1122 کال کریں۔\nعلاج: مائعات، بخار کا انتظام، وٹامن اے۔\nبچاؤ: MMR ویکسین 9 اور 15 مہینے پر۔ ویکسین بہترین بچاؤ ہے۔", "roman": "Khasra ek intehai mutaadi virus ki bimari hai. Yeh namonia, dimaghi sozish aur maut ka sabab ban sakti hai.\nAlamaat: tez bukhar, khansi, naak behna, surkh/pani wali aankhein, gaal ke andar safaid danay, phir surkh danay jo chehre se shuru ho kar neechay phailain.\nDoctor ko dikhayein: khasoosan 5 saal se kam bachon, haamila khawateen, ya kamzor bachon mein.\nEmergency: saans mushkil, doray, shadeed pani ki kami, uljhan = 1122 call karein.\nIlaaj: mayeaat, bukhar ka intezam, vitamin A.\nBachao: MMR vaccine 9 aur 15 mahine par. Vaccine behtareen bachao hai." },
    "tags": ["measles", "khasra", "خسرہ", "mmr vaccine", "rash fever", "koplik spots", "childhood disease", "danay", "بچوں کا بخار", "vaccine preventable"],
    "baseLevel": "URGENT",
    "audience": "child",
    "source": { "publisher": "WHO", "title": "Measles — fact sheet", "url": "https://www.who.int/news-room/fact-sheets/detail/measles", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "infant-fever-3mo",
    "topic": "infant-fever-3mo",
    "title": { "en": "Fever in babies under 3 months — emergency", "ur": "3 مہینے سے کم بچوں میں بخار — ایمرجنسی", "roman": "3 mahine se kam bachon mein bukhar — emergency" },
    "content": { "en": "ANY fever (38°C / 100.4°F or higher) in a baby under 3 months old is a MEDICAL EMERGENCY. Do NOT wait.\nYoung babies have immature immune systems — a simple fever can mean a serious bacterial infection (urinary tract infection, meningitis, sepsis).\nWHAT TO DO:\n1. Take the baby's temperature (rectal is most accurate for infants).\n2. If 38°C or higher = go to hospital IMMEDIATELY. Call 1122.\n3. Do NOT give paracetamol/ibuprofen without a doctor's advice for this age.\n4. Do NOT sponge with cold water.\n5. Do NOT overdress or underdress the baby.\nThe hospital will do blood tests, urine tests, and possibly a spinal tap to rule out serious infection. This is standard and necessary.\nTRUST YOUR INSTINCTS — if the baby looks unwell (not feeding, lethargic, floppy, unusual cry) even without fever = seek medical help immediately.", "ur": "3 مہینے سے کم عمر بچے میں کوئی بھی بخار (38°C یا زیادہ) میڈیکل ایمرجنسی ہے۔ انتظار نہ کریں۔\nننھے بچوں کا مدافعتی نظام نادھن ہوتا ہے — بخار کا مطلب سنگین انفیکشن ہو سکتا ہے۔\nاقدامات:\n1. بچے کا درجہ حرارت لیں۔\n2. 38°C یا زیادہ = فوراً ہسپتال جائیں۔ 1122 کال کریں۔\n3. اس عمر میں بغیر ڈاکٹر کے مشورے پیراسٹامول/آئبوپروفین نہ دیں۔\n4. ٹھنڈے پانی سے نہ نہلائیں۔\n5. بچے کو زیادہ یا کم کپڑے نہ پہنائیں۔\nہسپتال خون، پیشاب اور ممکنہ طور پر سپائنل ٹیسٹ کرے گا۔", "roman": "3 mahine se kam umar bachay mein koi bhi bukhar (38°C ya zyada) medical emergency hai. Intezar na karein.\nNanhe bachon ka mudaafiyati system nadhon hota hai — bukhar ka matlab sangin infection ho sakta hai.\nIqdamat:\n1. Bachay ka hararat lein.\n2. 38°C ya zyada = fori hospital jayein. 1122 call karein.\n3. Isumar mein bina doctor ke mashware paracetamol/ibuprofen na dein.\n4. Thande pani se na nahlayein.\n5. Bachay ko zyada ya kam kapre na pehnayein.\nHospital khoon, peshab aur mumkin tor par spinal test kare ga." },
    "tags": ["infant fever", "baby fever", "newborn fever", "3 months fever", "baccha bukhar", "ننھا بچہ بخار", "infant emergency", "neonatal fever", "baby under 3 months"],
    "baseLevel": "EMERGENCY",
    "audience": "child",
    "source": { "publisher": "WHO", "title": "Integrated Management of Childhood Illness (IMCI) — young infant", "url": "https://www.who.int/publications/i/item/9789240010649", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "near-drowning",
    "topic": "near-drowning",
    "title": { "en": "Near drowning — water safety emergency", "ur": "ڈوبنے کا خطرہ — پانی میں حفاظت", "roman": "Doobne ka khatra — pani mein hifazat" },
    "content": { "en": "Near drowning is a common emergency during Pakistan's monsoon floods and swimming accidents.\nRESCUE: Only enter water if it's safe and you can swim. Use a stick/rope/floatation device if possible.\nAFTER RESCUE:\n1. Check if the person is breathing. If not, start CPR immediately (30 chest compressions : 2 rescue breaths).\n2. If breathing, place in recovery position (on their side).\n3. Keep them warm — remove wet clothes, cover with dry blanket.\n4. Go to hospital EVEN IF they seem fine — 'secondary drowning' can occur hours later.\nEMERGENCY: Call 1122. Continue CPR until help arrives or the person starts breathing.\nDO NOT: give mouth-to-mouth while the person is still in water, put the person face down to 'drain water' (this is a myth and dangerous), or give food/drink.\nPrevention: never swim alone, supervise children near water, don't swim in flooded rivers/canals.", "ur": "ڈوبنے کا خطرہ پاکستان کے سیلابوں اور تیراکی کے حادثوں میں عام ہے۔\nبچاؤ: صرف تب پانی میں جائیں جب محفوظ ہو اور تیراکی آتی ہو۔ چھڑی/رسی/بہاؤ کا آلہ استعمال کریں۔\nبچاؤ کے بعد:\n1. سانس لے رہا ہے؟ اگر نہیں، فوراً CPR شروع کریں (30 دباؤ : 2 سانسیں)۔\n2. اگر سانس ہے توٹھنے کی پوزیشن میں رکھیں۔\n3. گرم رکھیں — گیلا کپڑے اتاریں، خشک کمبل لپیٹیں۔\n4. ہسپتال جائیں — بعد میں پیچیدگیاں ہو سکتی ہیں۔\nایمرجنسی: 1122 کال کریں۔ CPR جاری رکھیں۔\nکھانا/پانی نہ دیں۔", "roman": "Doobne ka khatra Pakistan ke selabon aur teraki ke hadson mein aam hai.\nBachao: sirf tab pani mein jayein jab mehfooz ho aur teraki aati ho. Chhadi/rassi/bahao ka aala istemal karein.\nBachao ke baad:\n1. Saans le raha hai? Agar nahi, fori CPR shuru karein (30 dabao : 2 saansein).\n2. Agar saans hai to thande ki position mein rakhein.\n3. Garam rakhein — gila kapra utarein, khushk kambal lypayein.\n4. Hospital jayein — baad mein pechidgiyan ho sakti hain.\nEmergency: 1122 call karein. CPR jari rakhein.\nKhana/pani na dein." },
    "tags": ["drowning", "near drowning", "water safety", "flood", "selab", "سیلاب", "doobna", "ڈوبنا", "CPR", "water rescue", "monsoon flood"],
    "baseLevel": "EMERGENCY",
    "audience": "general",
    "source": { "publisher": "IFRC", "title": "First aid for drowning", "url": "https://www.ifrc.org", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "placenta-previa",
    "topic": "placenta-previa",
    "title": { "en": "Placenta previa — painless bleeding in pregnancy", "ur": "پلیسینٹا پریویا — حمل میں بغیر درد کا خون", "roman": "Placenta previa — hamal mein bina dard ka khoon" },
    "content": { "en": "Placenta previa is when the placenta covers the cervix. It causes painless vaginal bleeding, usually after 20 weeks.\nSymptoms: sudden, painless, bright red vaginal bleeding (can be light or heavy). NO pain.\nEMERGENCY: ANY bleeding during pregnancy = go to hospital IMMEDIATELY. Call 1122.\nDO NOT: do a vaginal exam, use tampons, have sexual intercourse, or do heavy lifting.\nHospital will do an ultrasound to check the placenta position. Treatment depends on severity:\n- Minor: bed rest, avoid heavy activity, monitor.\n- Major: hospital admission, possibly C-section delivery.\nWith proper care, most women with placenta previa deliver safely.", "ur": "پلیسینٹا پریویا میں ناہ پلیسینٹا رحم کے منہ کو ڈھانپ لیتی ہے۔ 20 ہفتے بعد بغیر درد خون آتا ہے۔\nعلامات: اچانک، بغیر درد، سرخ خون بہنا۔ کوئی درد نہیں۔\nایمرجنسی: حمل میں کوئی بھی خون بہنا = فوراً ہسپتال جائیں۔ 1122 کال کریں۔\nاندرونی معائنہ نہ کریں، ٹیمپون نہ استعمال کریں، جنسی تعلق نہ بنائیں۔\nہسپتال الٹراساؤنڈ کرے گا۔ علاج سنگینی پر منحصر ہے۔\nبہتر نگہداشت سے اکثر محفوظ ڈیلیوری ہوتی ہے۔", "roman": "Placenta previa mein naali placenta reham ke mun ko dhanap leti hai. 20 hafte baad bina dard khoon aata hai.\nAlamaat: achanak, bina dard, surkh khoon behna. Koi dard nahi.\nEmergency: hamal mein koi bhi khoon behna = fori hospital jayein. 1122 call karein.\nAndrooni muaina na karein, tampon na istemal karein, jinsi talluq na banayein.\nHospital ultrasound kare ga. Ilaaj sangini par munhasir hai.\nBehtar nighehdasht se aksar mehfooz delivery hoti hai." },
    "tags": ["placenta previa", "painless bleeding pregnancy", "hamal mein khoon", "حمل میں خون", "vaginal bleeding pregnancy", "antepartum hemorrhage", "placenta low"],
    "baseLevel": "EMERGENCY",
    "audience": "maternal",
    "source": { "publisher": "WHO", "title": "Pregnancy care — antenatal bleeding", "url": "https://www.who.int/publications", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  },
  {
    "id": "malnutrition-severe",
    "topic": "severe-malnutrition",
    "title": { "en": "Severe acute malnutrition (SAM) in children", "ur": "بچوں میں شدید غذائی قلت", "roman": "Bachon mein shadeed ghizai qillat" },
    "content": { "en": "Severe Acute Malnutrition (SAM) affects millions of Pakistani children. It is life-threatening.\nSigns of SAM:\n- Severe wasting (very thin arms/legs, visible ribs)\n- Mid-Upper Arm Circumference (MUAC) < 11.5 cm (use MUAC tape)\n- Swelling of both feet (edema — kwashiorkor)\n- Weight-for-height below -3 z-score\n- Lethargy, not feeding, weak cry\nSEE A DOCTOR IMMEDIATELY. Treatment requires therapeutic feeding (RUTF — Plumpy'Nut) under medical supervision.\nEMERGENCY: child not eating at all, unconscious, severe dehydration, or infection = call 1122.\nDO NOT: give regular food suddenly — can be dangerous. Refeeding must be gradual under medical supervision.\nPrevention: exclusive breastfeeding for 6 months, complementary feeding from 6 months, balanced diet, vaccination, treat infections promptly.", "ur": "شدید غذائی قلت لاکھوں پاکستانی بچوں کو متاثر کرتی ہے۔ یہ جان لیوا ہے۔\nعلامات:\n- شدید دبلا پن (پتلے بازو/ٹانگیں، پسلیاں نظر آنا)\n- بازو کا گھیرا 11.5 سینٹی میٹر سے کم\n- دونوں پیروں میں سوجن\n- بچہ کمزور، نہ کھانا، کمزور رویا\n- فوراً ڈاکٹر کو دکھائیں۔ علاج میں تھراپیوٹک کھانا (RUTF) طبی نگرانی میں دینا ضروری ہے۔\nایمرجنسی: بچہ بالکل نہ کھانا، بے ہوشی، شدید پانی کی کمی = 1122 کال کریں۔\nفوراً عام کھانا نہ دیں — خطرناک ہو سکتا ہے۔ آہستہ آہستہ دیں۔", "roman": "Shadeed ghizai qillat lakhon Pakistani bachon ko mutaasir karti hai. Yeh jan lewa hai.\nAlamaat:\n- Shadeed dubla pan (patlay baazu/taangein, pasliyan nazar aana)\n- Baazu ka gheera 11.5 cm se kam\n- Dono peron mein sojan\n- Bacha kamzor, na khana, kamzor roya\n- Fori doctor ko dikhayein. Ilaaj mein therapeutic khana (RUTF) tibbi nigrani mein dena zaroori hai.\nEmergency: bacha bilkul na khana, behoshi, shadeed pani ki kami = 1122 call karein.\nFori aam khana na dein — khatarnak ho sakta hai. Aahista aahista dein." },
    "tags": ["malnutrition", "SAM", "severe malnutrition", "wasting", "stunting", "khwashiorkor", "marasmus", "bacha kamzor", "بچہ دبلا", "غذائی قلت", "MUAC", "RUTF"],
    "baseLevel": "EMERGENCY",
    "audience": "child",
    "source": { "publisher": "WHO", "title": "Management of severe acute malnutrition", "url": "https://www.who.int/publications/i/item/9789241506328", "license": "CC BY-NC-SA 3.0 IGO", "verifiedAt": "2026-09" }
  }
];
