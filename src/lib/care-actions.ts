import type { TriageLevel } from '@/lib/types';
import { detectIntent } from '@/lib/engine/intent-detection';

/** Patient-facing actions reflect the patient's intent and urgency, never a generic footer. */
export function careActionsFor(level: TriageLevel | undefined, userText: string) {
  const intent = detectIntent(userText).intent;
  const smallTalk = ['greeting', 'small_talk', 'introduction', 'farewell', 'gratitude', 'wellness_check', 'capabilities', 'language_change'].includes(intent);
  const emergency = level === 'EMERGENCY';
  const explicitDoctor = /\b(?:book|find|see|consult|appointment|talk to)\b.*\b(?:doctor|clinician|specialist)\b|doctor.*(?:book|appointment)|ڈاکٹر.*(?:ملاقات|وقت|دکھا)|doctor ko dikha/i.test(userText);
  const explicitFacility = /\b(?:nearby|nearest|find|where)\b.*\b(?:hospital|clinic|facilit)|قریبی.*(?:ہسپتال|کلینک)|qareebi.*(?:hospital|clinic)/i.test(userText);
  return {
    bookDoctor: !emergency && !smallTalk && (level === 'URGENT' || explicitDoctor),
    facilities: emergency || !smallTalk && explicitFacility,
    homeCare: !smallTalk && (level === 'SELF_CARE' || level === 'ROUTINE' && !['general_illness', 'emotional_distress', 'guidance_request'].includes(intent)),
  };
}
