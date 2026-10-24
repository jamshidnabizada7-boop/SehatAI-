import type { DoneStageData, PipelineStage, TriageStageData } from '@/lib/types';

function publicTriage(triage: TriageStageData) {
  return { level: triage.level, reason: triage.reason, signals: [], engine: 'guidance', shortCircuited: triage.shortCircuited };
}

function publicEmergency(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  return { title: data.title, reason: data.reason, actions: data.actions, doNot: data.doNot, numbers: data.numbers, sources: data.sources };
}

/** Only final validated content crosses the public SSE boundary. Never stream unvalidated tokens. */
export function publicPipelineEvent(stage: PipelineStage, value: unknown): unknown {
  const data = value as Record<string, unknown>;
  if (stage === 'generation' || stage === 'retrieval' || stage === 'safety' || stage === 'validation') return {};
  if (stage === 'triage') return publicTriage(value as TriageStageData);
  if (stage === 'language') return { language: data.language };
  if (stage === 'emergency') return publicEmergency(value);
  if (stage === 'done') {
    const done = value as DoneStageData;
    return { messageId: done.messageId, conversationId: done.conversationId, content: done.content, language: done.language, triage: publicTriage(done.triage), citations: done.citations, validation: null, offline: done.offline, emergency: publicEmergency(done.emergency), drugCheck: done.drugCheck, confidence: null, differential: null };
  }
  if (stage === 'error') return { message: 'The service could not complete the response.', fallbackContent: data.fallbackContent };
  return {};
}
