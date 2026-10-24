import type { DoctorSummary, Lang, TriageLevel } from '@/lib/types';
import { TRIAGE_ORDER } from '@/lib/types';
import { extractClinicalContext } from '@/lib/engine/context-extraction';
import { detectIntent } from '@/lib/engine/intent-detection';
import { buildSafetyState, reportContext } from '@/lib/engine/safety-state';
import { runL0Triage } from '@/lib/engine/safety-engine';

export interface SummaryTurn { role: string; content: string; triageLevel?: string | null; triage?: { level: TriageLevel }; createdAt?: string | Date | number }
export const SUMMARY_INSUFFICIENT: Record<Lang, string> = {
  en: 'There is not enough medical information for a doctor summary. Share your symptoms or a health concern first.',
  ur: 'ڈاکٹر کے خلاصے کے لیے طبی معلومات کافی نہیں ہیں۔ پہلے اپنی علامات یا صحت کا مسئلہ بتائیں۔',
  roman: 'Doctor ke khulasay ke liye tibbi maloomat kaafi nahi. Pehle apni alamaat ya sehat ka masla batayein.',
};

/** Extractive, local, transcript-grounded. Model assertions are never patient facts. */
export function buildDoctorSummary(conversationId: string, turns: readonly SummaryTurn[], lang: Lang): DoctorSummary | null {
  const medical = turns.filter(m => {
    if (m.role !== 'user' || !m.content.trim()) return false;
    const intent = detectIntent(m.content).intent;
    if (['greeting', 'small_talk', 'introduction', 'farewell', 'gratitude', 'capabilities', 'wellness_check', 'language_change', 'guidance_request', 'non_medical'].includes(intent)) return false;
    const ctx = extractClinicalContext(m.content);
    return ctx.hasSymptoms || ctx.conditions.length > 0 || ctx.medications !== null || ['general_illness', 'emotional_distress'].includes(intent) || runL0Triage(m.content, lang).level === 'EMERGENCY';
  });
  if (!medical.length) return null;
  const state = buildSafetyState(turns, runL0Triage, lang);
  const notStated = lang === 'ur' ? 'نہیں بتایا گیا' : lang === 'roman' ? 'Nahi bataya gaya' : 'Not stated';
  const labels = lang === 'ur' ? { current: 'بتائی گئی کیفیت', historical: 'گزشتہ کیفیت', hypothetical: 'معلوماتی سوال', negated: 'تردید', resolved: 'بتائی گئی بہتری' }
    : lang === 'roman' ? { current: 'Batayi hui kaifiyat', historical: 'Pehle ki kaifiyat', hypothetical: 'Maloomati sawal', negated: 'Tardeed', resolved: 'Batayi hui behtari' }
    : { current: 'Patient report', historical: 'Historical report', hypothetical: 'Educational / hypothetical question', negated: 'Negated report', resolved: 'Reported resolution' };
  const facts = medical.map(m => `${labels[reportContext(m.content)]}: “${m.content}”`);
  const level = turns.filter(m => m.role === 'assistant').reduce<TriageLevel>((acc, m) => {
    const l = m.triage?.level ?? m.triageLevel;
    return l && l in TRIAGE_ORDER && TRIAGE_ORDER[l as TriageLevel] > TRIAGE_ORDER[acc] ? l as TriageLevel : acc;
  }, state.urgency === 'INFORMATIONAL' ? 'ROUTINE' : state.urgency);
  const duration = medical.map(m => m.content.match(/\b(?:for|since)\s+[^,.!?]{1,60}|\b\d+\s*(?:din|days?|hours?|haft[ey])\b|\d+\s*(?:دن|گھنٹے)|کل سے|صبح سے/i)?.[0]).filter(Boolean);
  return {
    conversationId, chiefComplaint: medical[0].content,
    duration: duration.length ? duration.join('; ') : notStated,
    symptoms: facts,
    redFlagsObserved: state.concerns.filter(c => c.status === 'unresolved' || c.status === 'reported_resolved').map(c => `${c.category} (${c.subject}; ${c.status}): “${c.evidence}”${c.resolutionEvidence ? `; update: “${c.resolutionEvidence}”` : ''}`),
    triageLevel: level,
    guidanceGiven: [...new Set(turns.filter(m => m.role === 'assistant' && m.content.trim() && ((m.triage?.level ?? m.triageLevel) !== 'INFORMATIONAL')).map(m => m.content))].slice(-5),
    language: lang,
    disclaimer: lang === 'ur' ? 'گفتگو سے مقامی طور پر بنایا گیا حقائق کا خلاصہ؛ تشخیص یا تصدیق شدہ طبی ریکارڈ نہیں۔ اصل الفاظ محفوظ ہیں؛ ڈاکٹر سے تصدیق ضروری ہے۔ مکمل تاریخ، ادویات، الرجی، اہم جسمانی پیمائشیں اور موجودہ طبی حالت کی تصدیق نہیں ہوئی۔'
      : lang === 'roman' ? 'Guftagu se locally banaya gaya haqaiq ka khulasa; tashkhees ya tasdeeq shuda tibbi record nahi. Asal alfaaz mehfooz hain; doctor ki tasdeeq zaroori hai. Mukammal history, dawa, allergy, vitals aur maujooda tibbi haalat ki tasdeeq nahi hui.'
      : 'Locally generated factual transcript summary; not a diagnosis or verified medical record. Original wording is preserved, including Roman Urdu, for clinician verification. Complete history, medications, allergies, vital signs and current stability have not been verified.',
    confidence: null, differential: null, patientProfile: null, citations: [], generatedAt: new Date().toISOString(),
  };
}
