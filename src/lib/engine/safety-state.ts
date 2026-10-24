import type { Lang, TriageLevel } from '@/lib/types';
import { extractClinicalContext } from './context-extraction';
import { detectIntent } from './intent-detection';

/** Patient reports, never model text, are the authority for longitudinal risk. */
export type ReportContext = 'current' | 'historical' | 'hypothetical' | 'negated' | 'resolved';
export interface SafetyTurn { role: string; content: string; createdAt?: Date | string | number }
export interface RiskAssessment { level: TriageLevel; matchedCategory?: string; signals: string[] }
export type RiskAssessor = (text: string, lang?: Lang) => RiskAssessment;
export interface SafetyConcern {
  category: string;
  subject: 'self' | 'other' | 'uncertain';
  evidence: string;
  reportedAt: string | null;
  status: 'unresolved' | 'reported_resolved' | 'assessed' | 'corrected';
  resolutionEvidence?: string;
  severity?: string;
  onset?: string;
  selfHarm: 'not_reported' | 'ideation' | 'possible_imminent';
}
export interface ConversationSafetyState {
  version: 1;
  symptomReports: Array<{ evidence: string; context: ReportContext; subject: SafetyConcern['subject']; onset?: string; severity?: string }>;
  concerns: SafetyConcern[];
  urgency: TriageLevel;
  pendingQuestions: string[];
  priorUrgentAdvice: boolean;
  professionalAssessmentReported: boolean;
  uncertainty: string[];
}

/** Context is scoped to the report. A new active report overrides historical framing. */
export function reportContext(text: string): ReportContext {
  const t = text.normalize('NFKC').toLowerCase();
  if (/^\s*(?:what if|suppose|hypothetically|if (?:someone|a person|i))\b/.test(t) && !/\b(?:but (?:now|i)|actually (?:i|my))\b/.test(t)) return 'hypothetical';
  const active = /\b(?:now|currently|still|ongoing|i (?:have|am having|cannot|can't)|has (?:severe|chest)|abhi|ab bhi)\b|ابھی|اب بھی/.test(t);
  if (!active && (/\b(?:what (?:causes|is|are)|what if|suppose|hypothetical|for (?:a story|research)|can .* cause|how (?:does|do|can)|explain)\b|کی وجوہات|اگر کسی|کیا وجہ|wajah kya|agar kisi/.test(t))) return 'hypothetical';
  if (!active && /\b(?:last (?:year|month|week)|years? ago|used to|in (?:19|20)\d{2}|previously|in the past)\b|پچھلے سال|پہلے ہوتا|pichl[ey] saal|pehle hota/.test(t)) return 'historical';
  return 'current';
}

export function buildSafetyState(history: readonly SafetyTurn[], assess: RiskAssessor, lang: Lang = 'en'): ConversationSafetyState {
  const concerns: SafetyConcern[] = [];
  const symptomReports: ConversationSafetyState['symptomReports'] = [];
  let priorUrgentAdvice = false;
  let professionalAssessmentReported = false;
  const assessments = new Map<string, RiskAssessment>();
  for (const turn of history) {
    if (turn.role === 'assistant' && /urgent in.person assessment|emergency department|فوری.*معائنہ|fori.*muaina/i.test(turn.content)) priorUrgentAdvice = true;
    if (turn.role !== 'user') continue;
    const text = turn.content.trim();
    if (!text) continue;
    const reportedSubject = /\b(?:my (?:mother|father|friend|child|son|daughter|wife|husband)|he |she |they )|میری (?:ماں|بیٹی)|میرے (?:والد|بیٹے)|meri (?:ami|ammi)|mera (?:beta|dost)/i.test(text) ? 'other' : /\b(?:i|my|me|mujhe|main)\b|مجھے|میں/i.test(text) ? 'self' : 'uncertain';
    const ctx = extractClinicalContext(text);
    if (ctx.hasSymptoms || ctx.conditions.length || ['general_illness', 'emotional_distress'].includes(detectIntent(text).intent)) symptomReports.push({ evidence: text, context: reportContext(text), subject: reportedSubject, onset: text.match(/\b(?:since|for)\s+[^,.!?]{1,50}|کل سے|aaj subah se/i)?.[0], severity: text.match(/\b(?:mild|moderate|severe|unbearable|shadeed)\b|شدید/i)?.[0] });
    // A correction is narrowly scoped: furniture cannot clear suicidality or breathing risk.
    if (/\b(?:actually|i meant|correction)\b.*\b(?:drawer|furniture|tool chest)\b/i.test(text)) {
      for (const c of concerns) if (/cardiac|chest/.test(c.category)) {
        c.status = 'corrected'; c.resolutionEvidence = text;
      }
    }
    // Assessment alone is not resolution. Both must be explicitly reported for the same concern.
    const assessed = /\b(?:doctor|clinician|hospital|emergency department)\b.*\b(?:assessed|examined|evaluated|discharged|checked|treated)\b|\b(?:assessed|examined|evaluated|discharged|checked|treated)\b.*\b(?:doctor|clinician|hospital)\b|ڈاکٹر نے معائنہ|doctor ne check/i.test(text);
    if (assessed) professionalAssessmentReported = true;
    for (const c of concerns) {
      const mentions = c.category.startsWith('mental-health')
        ? /suicid|self.harm|hurt myself|harm myself|khudkushi|خودکشی/i.test(text)
        : /cardiac|chest/.test(c.category)
          ? /chest pain|seene.*dard|سینے.*درد/i.test(text)
          : text.toLowerCase().includes(c.category.replace(/-/g, ' '));
      const resolved = /\b(?:resolved|gone|stopped|no longer|not (?:suicidal|having)|no (?:chest pain|thoughts of))\b|ختم ہو گیا|ab nahi|ab nahin/i.test(text);
      if (mentions && resolved && reportContext(text) === 'current' && (reportedSubject === c.subject || reportedSubject === 'uncertain' && assessed)) {
        c.status = assessed ? 'assessed' : 'reported_resolved';
        c.resolutionEvidence = text;
      }
    }
    if (reportContext(text) !== 'current') continue;
    let risk = assessments.get(text);
    if (!risk) { risk = assess(text, lang); assessments.set(text, risk); }
    const chestConcern = risk.level === 'URGENT' && /chest pain|seene? (?:mein |me )?dard|سینے میں درد/i.test(text) && /\b(?:i have|i am having|mujhe)\b|مجھے/i.test(text) && !/\b(?:no chest pain|not having|no longer|resolved|gone|muscular|musculoskeletal)\b|dard (?:nahi|nahin)|درد نہیں/i.test(text);
    if (risk.level !== 'EMERGENCY' && !chestConcern) continue;
    const category = risk.matchedCategory ?? (chestConcern ? 'chest-pain' : 'general-emergency');
    // Resolved statements must not immediately reactivate the same flag.
    if (concerns.some(c => c.category === category && c.resolutionEvidence === text)) continue;
    const subject = reportedSubject;
    const existing = concerns.find(c => c.category === category && c.subject === subject);
    const imminent = /\b(?:plan|going to|about to|tonight|have (?:a gun|pills)|already (?:took|taken)|cannot stay safe|can't stay safe)\b|ابھی.*(?:خودکشی|نقصان)/i.test(text);
    const concern: SafetyConcern = {
      category, subject, evidence: text, status: 'unresolved',
      reportedAt: turn.createdAt ? new Date(turn.createdAt).toISOString() : null,
      severity: text.match(/\b(?:mild|moderate|severe|unbearable|shadeed)\b|شدید/i)?.[0],
      onset: text.match(/\b(?:since|for)\s+[^,.!?]{1,50}|کل سے|aaj subah se/i)?.[0],
      selfHarm: category.startsWith('mental-health') ? imminent ? 'possible_imminent' : 'ideation' : 'not_reported',
    };
    if (existing) Object.assign(existing, concern);
    else concerns.push(concern);
  }
  const active = concerns.filter(c => c.status === 'unresolved');
  const reassess = concerns.some(c => c.status === 'reported_resolved');
  return {
    version: 1, symptomReports, concerns, urgency: active.length ? 'EMERGENCY' : reassess ? 'URGENT' : 'INFORMATIONAL',
    pendingQuestions: active.some(c => c.selfHarm !== 'not_reported') ? ['immediate_safety', 'trusted_person_present', 'professional_assessment'] : active.length ? ['symptoms_ongoing', 'professional_assessment'] : reassess ? ['professional_assessment'] : [],
    priorUrgentAdvice, professionalAssessmentReported,
    uncertainty: active.length || reassess ? ['Current medical stability cannot be determined remotely.', 'Resolution and professional assessment are patient-reported, not independently verified.'] : [],
  };
}

/** Never expires by turn count or elapsed time: old unresolved reports require reassessment. */
export function safetyFollowUp(state: ConversationSafetyState, lang: Lang): string | null {
  const active = state.concerns.filter(c => c.status === 'unresolved' || c.status === 'reported_resolved');
  if (!active.length) return null;
  const quotes = active.map(c => `“${c.evidence}”`).join('; ');
  const harm = active.some(c => c.selfHarm !== 'not_reported');
  if (lang === 'ur') return `آپ نے بتایا تھا: ${quotes}۔ میں دور سے آپ کی طبی حالت یا محفوظ ہونے کی تصدیق نہیں کر سکتا۔ ان خدشات کے لیے فوری بالمشافہ طبی معائنہ ضروری ہے۔ اگر علامات اب بھی ہیں، واپس آئیں، یا خود کو نقصان پہنچانے کا خطرہ ہو تو مقامی ایمرجنسی سروس یا قریبی ایمرجنسی شعبے سے فوراً مدد لیں۔ ${harm ? 'کسی قابل اعتماد شخص کو ابھی اپنے پاس بلائیں اور نقصان پہنچانے والی چیزوں سے دور رہیں۔ کیا ابھی خود کو نقصان پہنچانے کا ارادہ یا خطرہ ہے؟' : 'کیا علامات ابھی جاری ہیں، اور کیا کسی ڈاکٹر نے معائنہ کیا ہے؟'}`;
  if (lang === 'roman') return `Aap ne bataya tha: ${quotes}. Main door se aap ki tibbi haalat ya mehfooz hone ki tasdeeq nahi kar sakta. In khadshaat ke liye fori rubaru tibbi muaina zaroori hai. Agar alamaat ab bhi hain, wapas aayein, ya khud ko nuqsan ka khatra ho, local emergency service ya qareebi emergency department se foran madad lein. ${harm ? 'Kisi bharosaymand shakhs ko abhi apne paas bulayein aur nuqsan dene wali cheezon se door rahein. Kya abhi khud ko nuqsan pohanchane ka irada ya khatra hai?' : 'Kya alamaat abhi jaari hain aur kya doctor ne muaina kiya hai?'}`;
  return `You reported: ${quotes}. I cannot determine your medical status or confirm that you are safe remotely. These concerns need urgent in-person assessment. If symptoms are ongoing, return, or you might harm yourself, contact your local emergency service or go to the nearest emergency department now. ${harm ? 'Ask someone you trust to stay with you and move away from anything you could use to hurt yourself. Are you thinking of acting on these thoughts or in immediate danger right now?' : 'Are the symptoms still happening, and have you been assessed by a clinician?'}`;
}

/** Recall uses the complete patient transcript, independently of the model's prompt window. */
export function conversationRecall(message: string, state: ConversationSafetyState, lang: Lang): { content: string; language: Lang } | null {
  if (!/what (?:did i tell|have i told|were my symptoms)|what is my status|am i (?:okay|ok|fine) now|(?:summary|summarize|summarise).*(?:doctor|conversation)|explain my symptoms|میں نے.*بتایا|meri (?:pichli baat|haalat)|doctor.*khulasa/i.test(message)) return null;
  const language = /in urdu|اردو میں/i.test(message) ? 'ur' : /in roman/i.test(message) ? 'roman' : lang;
  const facts = state.symptomReports.map(r => `• [${r.context}] “${r.evidence}”`).join('\n');
  const content = language === 'ur'
    ? `آپ کی پہلے بتائی گئی معلومات یا سوالات:\n${facts || 'ابھی طبی معلومات نہیں بتائی گئیں۔'}\n\nمیں دور سے آپ کی موجودہ طبی حالت کی تصدیق نہیں کر سکتا۔ یہ تشخیص نہیں؛ اصل الفاظ محفوظ ہیں۔`
    : language === 'roman'
      ? `Aap ki pehle batayi hui maloomat ya sawalat:\n${facts || 'Abhi tibbi maloomat nahi batayi gayi.'}\n\nMain door se aap ki maujooda tibbi haalat ki tasdeeq nahi kar sakta. Yeh tashkhees nahi; asal alfaaz mehfooz hain.`
      : `Earlier you reported or asked:\n${facts || 'You have not shared enough medical information yet.'}\n\nI cannot determine your current medical status remotely. This is a factual transcript recap, not a diagnosis; original wording is preserved.`;
  return { content, language };
}
