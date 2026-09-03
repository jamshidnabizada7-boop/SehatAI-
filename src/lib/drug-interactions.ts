// ============================================================
// SehatAI — Phase 1: Drug-Interaction Engine (W4 fix)
// ============================================================
// Open-data drug-interaction + allergy cross-check engine.
// Sources: WHO Model List of Essential Medicines, open DrugBank
// subset, RxNorm open subset, plus Pakistan-specific OTC names
// (Panadol, Disprin, Brufen, Septran, Augmentin, etc.).
//
// Safety by design:
// - NEVER recommends a dosage.
// - NEVER prescribes.
// - Only flags risks and redirects to doctor/pharmacist/1166.
// - All interactions are severity-tagged (HIGH / MODERATE / LOW).
// - Allergy class cross-reactivity is checked.
// - Pregnancy/BF/renal/hepatic/pediatric/elderly flags are surfaced.
//
// This is a RULES ENGINE (deterministic), not an LLM. It runs as a
// specialist validator in the constellation.
// ============================================================

export type InteractionSeverity = 'HIGH' | 'MODERATE' | 'LOW';

export interface DrugInteractionHit {
  drugA: string;
  drugB: string;
  severity: InteractionSeverity;
  effect: string;
  action: string;
  source: string;
}

export interface AllergyHit {
  allergy: string;
  trigger: string;
  drugClass: string;
  severity: InteractionSeverity;
  action: string;
}

export interface FlagHit {
  type: 'pregnancy' | 'breastfeeding' | 'renal' | 'hepatic' | 'pediatric' | 'elderly' | 'duplicate';
  drug: string;
  message: string;
  severity: InteractionSeverity;
}

export interface DrugCheckResult {
  hits: DrugInteractionHit[];
  allergies: AllergyHit[];
  flags: FlagHit[];
  overallSeverity: InteractionSeverity | 'NONE';
  recommendation: string;
}

// ---------- Canonical drug database (open: WHO Model List + common PK OTC) ----------
// Keyed by lowercase canonical name. Each entry lists aliases (incl. brand names
// common in Pakistan) and the drug class for cross-reactivity.
interface DrugEntry {
  canonical: string;
  aliases: string[];
  drugClass: string;
  pregnancyCategory?: 'A' | 'B' | 'C' | 'D' | 'X';
  renalAdjust?: boolean;
  hepaticAdjust?: boolean;
  pediatricSafe?: boolean;
  elderlyCaution?: boolean;
}

const DRUG_DB: DrugEntry[] = [
  // Analgesics / antipyretics
  {
    canonical: 'paracetamol',
    aliases: ['paracetamol', 'acetaminophen', 'panadol', 'tylenol', 'calpol', 'crocin', 'doliprane'],
    drugClass: 'analgesic-antipyretic',
    pregnancyCategory: 'B',
    pediatricSafe: true,
    elderlyCaution: false,
  },
  {
    canonical: 'ibuprofen',
    aliases: ['ibuprofen', 'brufen', 'advil', 'motrin', 'nurofen'],
    drugClass: 'nsaid',
    pregnancyCategory: 'C',
    renalAdjust: true,
    elderlyCaution: true,
  },
  {
    canonical: 'aspirin',
    aliases: ['aspirin', 'asa', 'disprin', 'ecotrin', 'ascard', 'lopac'],
    drugClass: 'nsaid-antiplatelet',
    pregnancyCategory: 'C',
    renalAdjust: true,
    elderlyCaution: true,
  },
  {
    canonical: 'diclofenac',
    aliases: ['diclofenac', 'voltaren', 'voltarene', 'cataflam', 'dyclo'],
    drugClass: 'nsaid',
    pregnancyCategory: 'C',
    renalAdjust: true,
    elderlyCaution: true,
  },
  {
    canonical: 'naproxen',
    aliases: ['naproxen', 'aleve', 'naprosyn'],
    drugClass: 'nsaid',
    pregnancyCategory: 'C',
    renalAdjust: true,
    elderlyCaution: true,
  },
  // Antibiotics
  {
    canonical: 'amoxicillin',
    aliases: ['amoxicillin', 'amoxil', 'moxacil', 'augmentin', 'clamoxyl'],
    drugClass: 'beta-lactam-penicillin',
    pregnancyCategory: 'B',
    pediatricSafe: true,
    renalAdjust: true,
  },
  {
    canonical: 'ampicillin',
    aliases: ['ampicillin', 'penbritin'],
    drugClass: 'beta-lactam-penicillin',
    pregnancyCategory: 'B',
    renalAdjust: true,
  },
  {
    canonical: 'cotrimoxazole',
    aliases: ['cotrimoxazole', 'septran', 'septrin', 'bactrim', 'sulfamethoxazole-trimethoprim', 'sulfamethoxazole'],
    drugClass: 'sulfonamide',
    pregnancyCategory: 'D',
    renalAdjust: true,
  },
  {
    canonical: 'ciprofloxacin',
    aliases: ['ciprofloxacin', 'cipro', 'ciproxin', 'cifran'],
    drugClass: 'fluoroquinolone',
    pregnancyCategory: 'C',
    renalAdjust: true,
    elderlyCaution: true,
  },
  {
    canonical: 'metronidazole',
    aliases: ['metronidazole', 'flagyl', 'metrogyl'],
    drugClass: 'nitroimidazole',
    pregnancyCategory: 'B',
    renalAdjust: true,
  },
  {
    canonical: 'azithromycin',
    aliases: ['azithromycin', 'zithromax', 'azomax', 'zmax'],
    drugClass: 'macrolide',
    pregnancyCategory: 'B',
    hepaticAdjust: true,
  },
  // GI / antacid
  {
    canonical: 'omeprazole',
    aliases: ['omeprazole', 'prilosec', 'omecid', 'omez'],
    drugClass: 'ppi',
    pregnancyCategory: 'C',
    elderlyCaution: true,
  },
  {
    canonical: 'ranitidine',
    aliases: ['ranitidine', 'zantac', 'aciloc', 'rantac'],
    drugClass: 'h2-blocker',
    pregnancyCategory: 'B',
    renalAdjust: true,
  },
  // Anticoagulants
  {
    canonical: 'warfarin',
    aliases: ['warfarin', 'coumadin', 'marevan', 'aldocumar'],
    drugClass: 'anticoagulant-coumarin',
    pregnancyCategory: 'X',
    renalAdjust: true,
    hepaticAdjust: true,
    elderlyCaution: true,
  },
  // Antidiabetic
  {
    canonical: 'metformin',
    aliases: ['metformin', 'glucophage', 'glophage', 'metfo'],
    drugClass: 'biguanide',
    pregnancyCategory: 'B',
    renalAdjust: true,
    elderlyCaution: true,
  },
  {
    canonical: 'glimepiride',
    aliases: ['glimepiride', 'amaryl'],
    drugClass: 'sulfonylurea',
    pregnancyCategory: 'C',
    renalAdjust: true,
    elderlyCaution: true,
  },
  // Antihypertensives
  {
    canonical: 'amlodipine',
    aliases: ['amlodipine', 'norvasc', 'amlocard', 'lodip'],
    drugClass: 'ccb',
    pregnancyCategory: 'C',
    hepaticAdjust: true,
    elderlyCaution: true,
  },
  {
    canonical: 'lisinopril',
    aliases: ['lisinopril', 'zestril', 'lispril'],
    drugClass: 'ace-inhibitor',
    pregnancyCategory: 'D',
    renalAdjust: true,
  },
  // Asthma
  {
    canonical: 'salbutamol',
    aliases: ['salbutamol', 'ventolin', 'albuterol', 'asthalin'],
    drugClass: 'beta2-agonist',
    pregnancyCategory: 'B',
  },
  {
    canonical: 'prednisolone',
    aliases: ['prednisolone', 'prednisone', 'deltacortril'],
    drugClass: 'corticosteroid',
    pregnancyCategory: 'C',
    hepaticAdjust: true,
    elderlyCaution: true,
  },
  // CNS
  {
    canonical: 'diazepam',
    aliases: ['diazepam', 'valium', 'calmpose'],
    drugClass: 'benzodiazepine',
    pregnancyCategory: 'D',
    hepaticAdjust: true,
    elderlyCaution: true,
  },
  {
    canonical: 'phenytoin',
    aliases: ['phenytoin', 'dilantin', 'epanutin'],
    drugClass: 'anticonvulsant-hydantoin',
    pregnancyCategory: 'D',
    hepaticAdjust: true,
  },
  // Antimalarial
  {
    canonical: 'chloroquine',
    aliases: ['chloroquine', 'nivaquine', 'resochin'],
    drugClass: 'aminoquinoline',
    pregnancyCategory: 'C',
    hepaticAdjust: true,
  },
  // Iron / supplements
  {
    canonical: 'iron',
    aliases: ['iron', 'ferrous', 'folic acid', 'folate'],
    drugClass: 'supplement',
    pregnancyCategory: 'A',
    pediatricSafe: true,
  },
];

const ALIAS_INDEX: Map<string, DrugEntry> = (() => {
  const m = new Map<string, DrugEntry>();
  for (const d of DRUG_DB) {
    m.set(d.canonical, d);
    for (const a of d.aliases) m.set(a.toLowerCase(), d);
  }
  return m;
})();

export function resolveDrugName(raw: string): DrugEntry | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  // Try exact alias
  if (ALIAS_INDEX.has(lower)) return ALIAS_INDEX.get(lower)!;
  // Try contains (e.g. "amoxicillin 500" → "amoxicillin")
  for (const [alias, entry] of ALIAS_INDEX) {
    if (alias.length >= 4 && lower.includes(alias)) return entry;
  }
  return null;
}

// ---------- Drug-drug interactions (curated, severity-tagged) ----------
// Keyed by `${drugA}|${drugB}` (both lowercase canonical, sorted). Includes class-level rules.
interface InteractionRule {
  drugA: string;
  drugB: string;
  severity: InteractionSeverity;
  effect: string;
  action: string;
  source: string;
}

const INTERACTION_RULES: InteractionRule[] = [
  // Anticoagulant + NSAID = bleeding risk
  {
    drugA: 'warfarin',
    drugB: 'ibuprofen',
    severity: 'HIGH',
    effect: 'NSAIDs increase warfarin anticoagulant effect → significantly increased bleeding risk.',
    action: 'Avoid combination. Use paracetamol for pain/fever. Consult your doctor before any NSAID.',
    source: 'WHO Model List — anticoagulant interactions; drugbank.ca open subset',
  },
  {
    drugA: 'warfarin',
    drugB: 'aspirin',
    severity: 'HIGH',
    effect: 'Aspirin potentiates warfarin → increased bleeding risk, including GI bleeds.',
    action: 'Avoid combination unless specifically directed by your doctor (usually a cardiologist).',
    source: 'WHO Model List — anticoagulant interactions',
  },
  {
    drugA: 'warfarin',
    drugB: 'diclofenac',
    severity: 'HIGH',
    effect: 'NSAIDs increase warfarin bleeding risk.',
    action: 'Avoid combination. Use paracetamol. Consult your doctor.',
    source: 'WHO Model List — anticoagulant interactions',
  },
  {
    drugA: 'warfarin',
    drugB: 'naproxen',
    severity: 'HIGH',
    effect: 'NSAIDs increase warfarin bleeding risk.',
    action: 'Avoid combination. Use paracetamol. Consult your doctor.',
    source: 'WHO Model List — anticoagulant interactions',
  },
  // Warfarin + cotrimoxazole = increased INR
  {
    drugA: 'warfarin',
    drugB: 'cotrimoxazole',
    severity: 'HIGH',
    effect: 'Cotrimoxazole displaces warfarin from protein binding + CYP inhibition → markedly increased INR and bleeding risk.',
    action: 'Avoid combination. Notify your doctor; INR monitoring required if unavoidable.',
    source: 'WHO Model List — anticoagulant interactions',
  },
  // Warfarin + metronidazole = increased INR
  {
    drugA: 'warfarin',
    drugB: 'metronidazole',
    severity: 'HIGH',
    effect: 'Metronidazole inhibits warfarin metabolism → increased INR and bleeding risk.',
    action: 'Avoid combination or reduce warfarin dose with INR monitoring by your doctor.',
    source: 'WHO Model List — anticoagulant interactions',
  },
  // Warfarin + phenytoin = both affected
  {
    drugA: 'warfarin',
    drugB: 'phenytoin',
    severity: 'HIGH',
    effect: 'Mutual metabolism inhibition → increased phenytoin toxicity and warfarin bleeding risk.',
    action: 'Avoid combination; if needed, monitor levels closely under your doctor.',
    source: 'WHO Model List — anticonvulsant interactions',
  },
  // Metformin + cotrimoxazole = hypoglycemia risk
  {
    drugA: 'metformin',
    drugB: 'cotrimoxazole',
    severity: 'MODERATE',
    effect: 'Cotrimoxazole can potentiate metformin hypoglycemic effect.',
    action: 'Monitor blood sugar; consult your doctor before combining.',
    source: 'WHO Model List — antidiabetic interactions',
  },
  // Metformin + renal concern (handled in flags, not interactions)
  // ACE inhibitor + NSAID = renal risk + reduced antihypertensive
  {
    drugA: 'lisinopril',
    drugB: 'ibuprofen',
    severity: 'MODERATE',
    effect: 'NSAIDs reduce ACE inhibitor antihypertensive effect + add renal risk, especially in elderly.',
    action: 'Monitor BP; use paracetamol for pain; consult your doctor.',
    source: 'WHO Model List — antihypertensive interactions',
  },
  // ACE inhibitor + cotrimoxazole = hyperkalemia
  {
    drugA: 'lisinopril',
    drugB: 'cotrimoxazole',
    severity: 'MODERATE',
    effect: 'Both raise serum potassium → risk of hyperkalemia.',
    action: 'Monitor potassium; consult your doctor.',
    source: 'WHO Model List — antihypertensive interactions',
  },
  // Ciprofloxacin + NSAID = seizure risk
  {
    drugA: 'ciprofloxacin',
    drugB: 'ibuprofen',
    severity: 'MODERATE',
    effect: 'Fluoroquinolones + NSAIDs lower seizure threshold.',
    action: 'Use caution in seizure-prone patients; consult your doctor.',
    source: 'WHO Model List — fluoroquinolone interactions',
  },
  // Methotrexate + NSAID = toxicity (deferred; MTX not in essential list above)
  // Duplicate therapy: paracetamol appears in cold+fever combos
  {
    drugA: 'paracetamol',
    drugB: 'paracetamol',
    severity: 'MODERATE',
    effect: 'Duplicate paracetamol intake (often from cold/fever combination products) risks hepatotoxicity.',
    action: 'Check ALL cold/fever/flu product labels for paracetamol/acetaminophen. Do not exceed 4g/day (adult). Consult pharmacist.',
    source: 'WHO Model List — analgesic safety',
  },
  // Metronidazole + alcohol (patient context)
  {
    drugA: 'metronidazole',
    drugB: 'alcohol',
    severity: 'HIGH',
    effect: 'Metronidazole + alcohol causes disulfiram-like reaction (severe nausea, vomiting, flushing, hypotension).',
    action: 'Do not consume alcohol during and 48h after metronidazole.',
    source: 'WHO Model List — metronidazole interactions',
  },
  // Phenytoin + cotrimoxazole = phenytoin toxicity
  {
    drugA: 'phenytoin',
    drugB: 'cotrimoxazole',
    severity: 'HIGH',
    effect: 'Cotrimoxazole inhibits phenytoin metabolism → phenytoin toxicity (ataxia, nystagmus, sedation).',
    action: 'Avoid combination; if needed, monitor phenytoin levels under your doctor.',
    source: 'WHO Model List — anticonvulsant interactions',
  },
  // Diazepam + alcohol = CNS depression
  {
    drugA: 'diazepam',
    drugB: 'alcohol',
    severity: 'HIGH',
    effect: 'Benzodiazepines + alcohol → dangerous CNS/respiratory depression.',
    action: 'Do not consume alcohol while taking diazepam.',
    source: 'WHO Model List — benzodiazepine interactions',
  },
];

function interactionKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

// ---------- Allergy class cross-reactivity ----------
interface AllergyRule {
  allergyPattern: RegExp;
  triggerClass: string;
  triggers: string[]; // canonical drug names or aliases that cross-react
  severity: InteractionSeverity;
  action: string;
}

const ALLERGY_RULES: AllergyRule[] = [
  {
    allergyPattern: /penicillin|amoxicillin|ampicillin/i,
    triggerClass: 'beta-lactam-penicillin',
    triggers: ['amoxicillin', 'ampicillin', 'augmentin', 'amoxil', 'moxacil'],
    severity: 'HIGH',
    action: 'Do NOT take amoxicillin-class antibiotics — cross-reactivity with your penicillin allergy. Ask your doctor for a non-beta-lactam alternative.',
  },
  {
    allergyPattern: /sulfa|sulphonamide|sulfonamide|septran|septrin|cotrimoxazole/i,
    triggerClass: 'sulfonamide',
    triggers: ['cotrimoxazole', 'septran', 'septrin', 'sulfamethoxazole'],
    severity: 'HIGH',
    action: 'Do NOT take sulfa-class antibiotics — cross-reactivity with your sulfa allergy. Ask your doctor for an alternative.',
  },
  {
    allergyPattern: /aspirin|nsaid|ibuprofen|brufen|diclofenac|voltaren|naproxen/i,
    triggerClass: 'nsaid',
    triggers: ['ibuprofen', 'brufen', 'aspirin', 'disprin', 'naproxen', 'diclofenac', 'voltaren'],
    severity: 'MODERATE',
    action: 'Caution: cross-reactivity with your NSAID/aspirin allergy. Avoid OTC NSAIDs unless your doctor confirms safety. Paracetamol is usually safe.',
  },
];

// ---------- Main check function ----------
export interface DrugCheckInput {
  /** raw message text — used to extract drug mentions */
  text: string;
  /** patient profile: allergies, medications, pregnancy, age band, conditions */
  allergies: string[];
  currentMedications: string[];
  pregnant: boolean;
  breastfeeding: boolean;
  ageBand: string; // 'child' | 'adolescent' | 'young-adult' | 'middle-adult' | 'elderly' | 'undisclosed'
  conditions: string[]; // includes 'kidney' / heart etc for flagging
}

export function checkDrugSafety(input: DrugCheckInput): DrugCheckResult {
  const hits: DrugInteractionHit[] = [];
  const allergyHits: AllergyHit[] = [];
  const flagHits: FlagHit[] = [];

  // 1. Extract drug mentions from the message text + current medications
  const messageDrugs = extractDrugs(input.text);
  const allDrugs = uniq([...messageDrugs, ...input.currentMedications.map(resolveDrugName).filter(Boolean).map((d) => d!.canonical)]);

  // 2. Drug-drug interactions (allDrugs × allDrugs)
  for (let i = 0; i < allDrugs.length; i++) {
    for (let j = i + 1; j < allDrugs.length; j++) {
      const key = interactionKey(allDrugs[i], allDrugs[j]);
      const rule = INTERACTION_RULES.find(
        (r) => interactionKey(r.drugA, r.drugB) === key,
      );
      if (rule) {
        hits.push({
          drugA: rule.drugA,
          drugB: rule.drugB,
          severity: rule.severity,
          effect: rule.effect,
          action: rule.action,
          source: rule.source,
        });
      }
    }
    // Duplicate therapy check (same drug twice)
    if (allDrugs[i] === 'paracetamol' && messageDrugs.includes('paracetamol')) {
      // Only flag if currentMeds also has paracetamol — i.e. user is taking it both ways
      const inMeds = input.currentMedications.some((m) => resolveDrugName(m)?.canonical === 'paracetamol');
      if (inMeds) {
        hits.push({
          drugA: 'paracetamol',
          drugB: 'paracetamol',
          severity: 'MODERATE',
          effect: 'Duplicate paracetamol intake (often from cold/fever combination products) risks hepatotoxicity.',
          action: 'Check ALL cold/fever/flu product labels for paracetamol. Do not exceed 4g/day (adult). Consult pharmacist.',
          source: 'WHO Model List — analgesic safety',
        });
      }
    }
  }

  // 3. Allergy cross-check
  for (const allergy of input.allergies) {
    for (const rule of ALLERGY_RULES) {
      if (rule.allergyPattern.test(allergy)) {
        // Check if any of the triggers appear in message drugs or current meds
        const matched = allDrugs.filter((d) => rule.triggers.includes(d));
        if (matched.length > 0) {
          for (const m of matched) {
            allergyHits.push({
              allergy,
              trigger: m,
              drugClass: rule.triggerClass,
              severity: rule.severity,
              action: rule.action,
            });
          }
        }
      }
    }
  }

  // 4. Pregnancy / BF / renal / hepatic / pediatric / elderly flags
  const patientHas = (cond: string) => input.conditions.includes(cond);

  for (const drug of allDrugs) {
    const entry = resolveDrugName(drug);
    if (!entry) continue;

    // Pregnancy
    if (input.pregnant && entry.pregnancyCategory === 'D') {
      flagHits.push({
        type: 'pregnancy',
        drug: entry.canonical,
        message: `${entry.canonical} is pregnancy category D (evidence of fetal risk). Do NOT take during pregnancy without explicit doctor direction.`,
        severity: 'HIGH',
      });
    } else if (input.pregnant && entry.pregnancyCategory === 'X') {
      flagHits.push({
        type: 'pregnancy',
        drug: entry.canonical,
        message: `${entry.canonical} is pregnancy category X (contraindicated in pregnancy). Do NOT take.`,
        severity: 'HIGH',
      });
    }

    // Breastfeeding (simplified — D/X categories also flag for BF)
    if (input.breastfeeding && (entry.pregnancyCategory === 'D' || entry.pregnancyCategory === 'X')) {
      flagHits.push({
        type: 'breastfeeding',
        drug: entry.canonical,
        message: `${entry.canonical} may be excreted in breast milk. Consult your doctor before use while breastfeeding.`,
        severity: 'MODERATE',
      });
    }

    // Renal
    if (patientHas('kidney') && entry.renalAdjust) {
      flagHits.push({
        type: 'renal',
        drug: entry.canonical,
        message: `You have kidney disease — ${entry.canonical} requires dose adjustment. Consult your doctor before taking.`,
        severity: 'MODERATE',
      });
    }

    // Hepatic (treat heart disease as potential hepatic congestion marker — conservative)
    if ((patientHas('heart')) && entry.hepaticAdjust) {
      flagHits.push({
        type: 'hepatic',
        drug: entry.canonical,
        message: `You have a heart condition — ${entry.canonical} may require dose adjustment. Consult your doctor.`,
        severity: 'LOW',
      });
    }

    // Pediatric
    if (input.ageBand === 'child' && !entry.pediatricSafe && entry.canonical !== 'paracetamol') {
      flagHits.push({
        type: 'pediatric',
        drug: entry.canonical,
        message: `${entry.canonical} may not be safe for young children without a pediatrician's direction. Consult a pediatrician.`,
        severity: 'MODERATE',
      });
    }

    // Elderly
    if (input.ageBand === 'elderly' && entry.elderlyCaution) {
      flagHits.push({
        type: 'elderly',
        drug: entry.canonical,
        message: `For older adults, ${entry.canonical} requires extra caution (kidney function, bleeding risk, fall risk). Consult your doctor.`,
        severity: 'LOW',
      });
    }
  }

  // 5. Overall severity = highest of all hits
  const all = [...hits, ...allergyHits, ...flagHits];
  const overallSeverity: InteractionSeverity | 'NONE' =
    all.some((h) => h.severity === 'HIGH')
      ? 'HIGH'
      : all.some((h) => h.severity === 'MODERATE')
        ? 'MODERATE'
        : all.some((h) => h.severity === 'LOW')
          ? 'LOW'
          : 'NONE';

  const recommendation = buildRecommendation(overallSeverity, hits, allergyHits, flagHits);

  return { hits, allergies: allergyHits, flags: flagHits, overallSeverity, recommendation };
}

function buildRecommendation(
  severity: InteractionSeverity | 'NONE',
  hits: DrugInteractionHit[],
  allergyHits: AllergyHit[],
  flags: FlagHit[],
): string {
  if (severity === 'NONE') {
    return 'No known interactions flagged. Continue as directed by your doctor.';
  }
  const parts: string[] = [];
  if (severity === 'HIGH') {
    parts.push('⚠️ HIGH-SEVERITY interaction detected — DO NOT take this medication combination. Contact your doctor or call 1166 (Health Helpline) now.');
  } else if (severity === 'MODERATE') {
    parts.push('⚠️ Moderate interaction or caution flagged — consult your doctor or pharmacist before taking.');
  } else {
    parts.push('Minor caution noted — check with your pharmacist if unsure.');
  }
  if (allergyHits.length) {
    parts.push(`Allergy cross-reactivity: ${allergyHits.map((a) => `${a.allergy} → ${a.trigger} (${a.drugClass})`).join('; ')}.`);
  }
  if (hits.length) {
    parts.push(`Interactions: ${hits.map((h) => `${h.drugA} + ${h.drugB} (${h.severity})`).join('; ')}.`);
  }
  if (flags.length) {
    parts.push(`Cautions: ${flags.map((f) => `${f.drug} (${f.type})`).join('; ')}.`);
  }
  return parts.join(' ');
}

// ---------- Helpers ----------
function extractDrugs(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [alias, entry] of ALIAS_INDEX) {
    if (alias.length >= 4) {
      const re = new RegExp(`\\b${escapeRe(alias)}\\b`, 'i');
      if (re.test(lower)) {
        if (!found.includes(entry.canonical)) found.push(entry.canonical);
      }
    }
  }
  return found;
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------- Public API for the pipeline ----------
/** Returns true if the message mentions any drug in our DB (used to gate the medication-safety validator). */
export function messageMentionsDrug(text: string): boolean {
  return extractDrugs(text).length > 0;
}
