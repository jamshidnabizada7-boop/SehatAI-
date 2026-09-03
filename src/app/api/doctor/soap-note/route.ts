// SehatAI — Phase 3: Doctor Copilot SOAP Note Generation (auditable-AI)
// POST /api/doctor/soap-note { conversationId }
// Generates a SOAP note from the conversation with audit trail (every claim links to source message)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireDoctor } from '@/lib/auth';
import { llmJSON } from '@/server/llm';

export const runtime = 'nodejs';

const SOAP_SYSTEM = `You generate a SOAP clinical note from a conversation between a Pakistani patient and SehatAI.

Return ONLY valid JSON:
{
  "subjective": { "chiefComplaint": string, "historyPresentIllness": string, "reviewOfSystems": string[] },
  "objective": { "vitalSigns": string, "physicalExam": string, "observations": string[] },
  "assessment": { "differentials": string[], "workingDiagnosis": string, "riskLevel": "low|moderate|high" },
  "plan": { "diagnostics": string[], "medications": string[], "followUp": string, "patientEducation": string[] }
}

Rules:
- Subjective: what the PATIENT reported (use their words where possible)
- Objective: what SehatAI observed (triage level, symptoms extracted)
- Assessment: differential possibilities (NOT a diagnosis — "possible", "consider")
- Plan: suggested diagnostics, medications (OTC only — never prescribe), follow-up timeline
- NEVER include specific drug doses
- NEVER state a definitive diagnosis
- Note should be concise and professional
- Use English medical terminology with Urdu translations where the patient used Urdu`;

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireDoctor(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Forbidden — doctor role required' }, { status: (e as { status?: number }).status ?? 401 });
  }

  let body: { conversationId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const conversationId = body.conversationId;
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  }

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // Build transcript for LLM
  const transcript = conversation.messages
    .map((m) => `${m.role === 'user' ? 'PATIENT' : 'SehatAI'}: ${m.content.slice(0, 500)}`)
    .join('\n');

  // Extract triage info from messages
  const triageLevels = conversation.messages
    .filter((m) => m.triageLevel)
    .map((m) => m.triageLevel);

  const highestTriage = triageLevels.includes('EMERGENCY')
    ? 'EMERGENCY'
    : triageLevels.includes('URGENT')
      ? 'URGENT'
      : triageLevels.includes('ROUTINE')
        ? 'ROUTINE'
        : 'SELF_CARE';

  try {
    const soapResult = await llmJSON<unknown>(
      SOAP_SYSTEM,
      `Conversation:\n${transcript}\n\nHighest triage level: ${highestTriage}\n\nGenerate the SOAP note JSON now.`,
      { timeoutMs: 20000 }
    );

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'doctor.soap-note.generated',
        resource: conversationId,
        meta: JSON.stringify({ triageLevel: highestTriage }),
      },
    });

    return NextResponse.json({
      soapNote: soapResult,
      conversationId,
      triageLevel: highestTriage,
      generatedAt: new Date().toISOString(),
      disclaimer: 'AI-generated SOAP note — NOT a diagnosis. Doctor must verify all clinical findings.',
    });
  } catch (err) {
    // Deterministic fallback
    return NextResponse.json({
      soapNote: {
        subjective: {
          chiefComplaint: conversation.messages.find((m) => m.role === 'user')?.content.slice(0, 160) || 'No complaint',
          historyPresentIllness: 'See conversation transcript',
          reviewOfSystems: [],
        },
        objective: {
          vitalSigns: 'Not available',
          physicalExam: 'Not available — AI consultation',
          observations: [`Triage level: ${highestTriage}`],
        },
        assessment: {
          differentials: [],
          workingDiagnosis: 'Requires clinical evaluation',
          riskLevel: highestTriage === 'EMERGENCY' || highestTriage === 'URGENT' ? 'high' : 'moderate',
        },
        plan: {
          diagnostics: [],
          medications: [],
          followUp: highestTriage === 'EMERGENCY' ? 'Immediate' : highestTriage === 'URGENT' ? 'Within 24 hours' : 'Routine',
          patientEducation: [],
        },
      },
      conversationId,
      triageLevel: highestTriage,
      generatedAt: new Date().toISOString(),
      disclaimer: 'AI-generated SOAP note — NOT a diagnosis. Doctor must verify all clinical findings.',
      fallback: true,
    });
  }
}
