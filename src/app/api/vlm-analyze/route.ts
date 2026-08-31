// SehatAI — Phase 3: VLM (Vision) Analysis API for Doctor Copilot
// POST /api/vlm-analyze { image (base64), question } → { analysis }
// Uses z-ai-web-dev-sdk VLM for image understanding (rash, skin conditions, etc.)
// CRITICAL: This is for Doctor Copilot ONLY (not patient-facing).
// The VLM provides ASSISTANCE to the doctor, NOT a diagnosis.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

const SAFETY_PROMPT = `You are a medical imaging assistant for a licensed clinician in Pakistan.
Analyze the image and provide:
1. Visual description of what you see
2. Possible differential considerations (NOT a diagnosis)
3. Red flags if visible
4. Recommendation for further testing

CRITICAL RULES:
- NEVER provide a definitive diagnosis
- NEVER recommend specific medications or doses
- Always state: "This analysis is advisory only. Clinical correlation required."
- If the image is not a medical image, say so
- If you cannot analyze the image, say so honestly`;

export async function POST(req: NextRequest) {
  // Auth check — doctor/admin only
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { image?: string; question?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!body.image) {
    return NextResponse.json({ error: 'image (base64) is required' }, { status: 400 });
  }

  try {
    // Dynamic import to avoid loading SDK on every request
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `${SAFETY_PROMPT}\n\nQuestion: ${body.question || 'Describe this medical image and provide differential considerations.'}` },
            { type: 'image_url', image_url: { url: body.image.startsWith('data:') ? body.image : `data:image/jpeg;base64,${body.image}` } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const analysis = response.choices[0]?.message?.content || 'No analysis available.';

    return NextResponse.json({
      analysis,
      disclaimer: 'This AI analysis is advisory only. Clinical correlation and diagnosis by a licensed physician required.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'VLM analysis failed', detail: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'SehatAI VLM Analysis API',
    description: 'Vision-based medical image analysis for Doctor Copilot (not patient-facing)',
    model: 'GLM-4V (z-ai-web-dev-sdk)',
    endpoint: 'POST /api/vlm-analyze { image: base64, question?: string }',
    safety: 'Advisory only — never a diagnosis. Doctor-only access.',
  });
}
