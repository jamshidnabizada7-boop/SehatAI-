import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireActiveDoctor } from '@/lib/auth';
import { canReadConversation } from '@/server/conversation-access';
import { buildDoctorSummary } from '@/lib/doctor-summary';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const actor = await requireActiveDoctor();
    const body = await req.json();
    if (typeof body.conversationId !== 'string' || !body.conversationId) return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    const conversation = await db.conversation.findUnique({ where: { id: body.conversationId } });
    if (!conversation || !await canReadConversation(conversation, '', 'soap_draft')) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    const messages = await db.message.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: 'asc' } });
    const summary = buildDoctorSummary(conversation.id, messages, 'en');
    if (!summary) return NextResponse.json({ error: 'Insufficient medical information' }, { status: 422 });
    await db.auditLog.create({ data: { userId: actor.id, action: 'doctor.soap-note.generated', resource: conversation.id } });
    return NextResponse.json({
      soapNote: {
        subjective: { chiefComplaint: summary.chiefComplaint, historyPresentIllness: summary.symptoms.join('\n'), reviewOfSystems: [] },
        objective: { vitalSigns: 'Not measured or verified', physicalExam: 'Not performed', observations: [] },
        assessment: { differentials: [], workingDiagnosis: 'Not established; clinician assessment required', riskLevel: summary.triageLevel === 'EMERGENCY' || summary.triageLevel === 'URGENT' ? 'high' : 'unassessed' },
        plan: { diagnostics: [], medications: [], followUp: 'Clinician to determine; unresolved urgent concerns require immediate assessment', patientEducation: summary.guidanceGiven },
      },
      conversationId: conversation.id, triageLevel: summary.triageLevel, generatedAt: summary.generatedAt,
      disclaimer: summary.disclaimer, source: 'deterministic-transcript',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const status = (error as { status?: number }).status;
    return NextResponse.json({ error: 'Note unavailable' }, { status: status === 401 || status === 403 ? status : 503 });
  }
}
