// SehatAI — VLM (Vision) Analysis API
// POST /api/vlm-analyze { image (base64), question } → { analysis }
// Uses z-ai-web-dev-sdk VLM for image understanding (rash, skin conditions, etc.)
// Available to ALL authenticated users (patients + doctors) with safety guardrails.
// The VLM provides ADVISORY analysis, NOT a diagnosis.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

// Safety prompt for patients (more restrictive)
const PATIENT_SAFETY_PROMPT = `You are a health guidance assistant for patients in Pakistan.
Analyze the uploaded image and provide:
1. A simple visual description of what you see (rash, wound, skin condition, swelling, etc.)
2. General self-care suggestions (if applicable)
3. When to see a doctor (red flags / warning signs)

CRITICAL RULES (STRICTLY ENFORCED):
- NEVER provide a definitive diagnosis
- NEVER recommend specific prescription medications or doses
- NEVER suggest this is a substitute for a doctor's examination
- Always include: "This is general guidance only. Please see a doctor for proper diagnosis."
- If the image is not a medical/health image, say "I can only analyze health-related images"
- If you cannot clearly see the image, say so honestly
- Keep the response simple and easy to understand (avoid medical jargon)
- Respond in the same language as the user's question (English, Urdu, or Roman Urdu)`;

// Safety prompt for doctors (more clinical)
const DOCTOR_SAFETY_PROMPT = `You are a medical imaging assistant for a licensed clinician in Pakistan.
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
  // Auth check — any authenticated user (patient, doctor, or admin)
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized — please sign in to use image analysis' }, { status: 401 });
  }

  const userRole = (session.user as { role?: string }).role ?? 'user';

  let body: { image?: string; question?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!body.image) {
    return NextResponse.json({ error: 'image (base64) is required' }, { status: 400 });
  }

  // Use appropriate safety prompt based on role
  const safetyPrompt = userRole === 'doctor' || userRole === 'admin' ? DOCTOR_SAFETY_PROMPT : PATIENT_SAFETY_PROMPT;

  try {
    // Dynamic import to avoid loading SDK on every request
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const imageUrl = body.image.startsWith('data:') ? body.image : `data:image/jpeg;base64,${body.image}`;

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `${safetyPrompt}\n\nQuestion: ${body.question || 'Describe this image and provide health guidance.'}` },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const analysis = response.choices[0]?.message?.content || 'No analysis available.';

    return NextResponse.json({
      analysis,
      disclaimer:
        userRole === 'doctor' || userRole === 'admin'
          ? 'This AI analysis is advisory only. Clinical correlation and diagnosis by a licensed physician required.'
          : 'یہ عام رہنمائی ہے۔ درست تشخیص کے لیے ڈاکٹر سے رجوع کریں۔ — This is general guidance only. Please see a doctor for proper diagnosis.',
      timestamp: new Date().toISOString(),
      role: userRole,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'VLM analysis failed', detail: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'SehatAI VLM Analysis API',
    description: 'Vision-based health image analysis (rash, wound, skin conditions)',
    model: 'GLM-4V (z-ai-web-dev-sdk)',
    endpoint: 'POST /api/vlm-analyze { image: base64, question?: string }',
    safety: 'Advisory only — never a diagnosis. Available to all authenticated users.',
    access: 'Patient (general guidance) + Doctor (clinical differential)',
  });
}
