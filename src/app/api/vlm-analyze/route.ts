// SehatAI — VLM (Vision) Analysis API
// POST /api/vlm-analyze { image (base64), question } → { analysis }
// Uses Google Gemini Vision for image understanding (rash, skin conditions, etc.)
// Available to ALL authenticated users (patients + doctors) with safety guardrails.
// The VLM provides ADVISORY analysis, NOT a diagnosis.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

// Primary and fallback Gemini Vision models
const GEMINI_VISION_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
];

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

function parseRetrySeconds(msg: string): number | null {
  const m1 = msg.match(/retry in\s+([0-9.]+)\s*s/i);
  if (m1) return parseFloat(m1[1]);
  const m2 = msg.match(/retryDelay["']?:\s*["']?([0-9]+)s/i);
  if (m2) return parseInt(m2[1], 10);
  return null;
}

function getGeminiApiKeys(): string[] {
  const envVars = ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEYS', 'GOOGLE_API_KEYS'];
  const keys: string[] = [];
  for (const v of envVars) {
    const raw = process.env[v];
    if (!raw || typeof raw !== 'string') continue;
    for (const part of raw.split(/[,;\n]+/)) {
      const trimmed = part.trim().replace(/^["']|["']$/g, '');
      if (
        trimmed &&
        trimmed.length >= 10 &&
        !trimmed.toLowerCase().includes('your_') &&
        !trimmed.toLowerCase().includes('placeholder') &&
        !keys.includes(trimmed)
      ) {
        keys.push(trimmed);
      }
    }
  }
  return keys;
}

export async function POST(req: NextRequest) {
  // Auth check — any authenticated user (patient, doctor, or admin)
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized — please sign in to use image analysis' }, { status: 401 });
  }

  const userRole = (session.user as { role?: string }).role ?? 'user';

  let body: { image?: string; question?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!body.image || typeof body.image !== 'string' || body.image.trim().length === 0) {
    return NextResponse.json({ error: 'image (base64) is required' }, { status: 400 });
  }

  const apiKeys = getGeminiApiKeys();
  if (apiKeys.length === 0) {
    return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
  }

  let mimeType = '';
  let base64Data = body.image.trim();

  if (base64Data.startsWith('data:')) {
    const commaIdx = base64Data.indexOf(',');
    if (commaIdx !== -1) {
      const prefix = base64Data.slice(0, commaIdx);
      base64Data = base64Data.slice(commaIdx + 1);
      const match = prefix.match(/^data:([^;]+)/);
      if (match) {
        mimeType = match[1].toLowerCase().trim();
      }
    }
  }

  // Strip all internal whitespace and linebreaks (e.g. RFC 2045 line breaks) that break Gemini decoding
  base64Data = base64Data.replace(/\s+/g, '');

  if (!mimeType) {
    // Infer mime type from base64 magic bytes
    if (base64Data.startsWith('iVBORw0KGgo')) {
      mimeType = 'image/png';
    } else if (base64Data.startsWith('/9j/')) {
      mimeType = 'image/jpeg';
    } else if (base64Data.startsWith('UklGR')) {
      mimeType = 'image/webp';
    } else if (base64Data.startsWith('R0lGOD')) {
      mimeType = 'image/gif';
    }
  }

  const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
  ];

  // Validate format and ensure it's not SVG, non-image, or unsupported format
  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType) || mimeType.includes('svg')) {
    return NextResponse.json(
      { error: 'Unsupported image format. Please upload a JPG, PNG, or WebP image.' },
      { status: 400 }
    );
  }

  if (!base64Data || base64Data.length < 8) {
    return NextResponse.json({ error: 'image (base64) is required' }, { status: 400 });
  }

  // Normalize image/jpg to image/jpeg
  if (mimeType === 'image/jpg') {
    mimeType = 'image/jpeg';
  }

  // Check claimed mimeType matches magic bytes if known
  const isJpeg = base64Data.startsWith('/9j/');
  const isPng = base64Data.startsWith('iVBORw0KGgo');
  const isWebp = base64Data.startsWith('UklGR');
  const isGif = base64Data.startsWith('R0lGOD');

  if (
    (mimeType === 'image/jpeg' && !isJpeg) ||
    (mimeType === 'image/png' && !isPng) ||
    (mimeType === 'image/webp' && !isWebp) ||
    (mimeType === 'image/gif' && !isGif)
  ) {
    return NextResponse.json(
      { error: 'Invalid or corrupt image data. Please upload a valid JPG, PNG, or WebP image.' },
      { status: 400 }
    );
  }

  // Use appropriate safety prompt based on role
  const safetyPrompt = userRole === 'doctor' || userRole === 'admin' ? DOCTOR_SAFETY_PROMPT : PATIENT_SAFETY_PROMPT;
  const questionText =
    typeof body.question === 'string' && body.question.trim().length > 0
      ? body.question.trim()
      : 'Describe this image and provide health guidance.';
  const promptText = `${safetyPrompt}\n\nQuestion: ${questionText}`;

  try {
    let analysis = '';
    let lastError: unknown = null;
    let rateLimitExceeded = false;
    let rateLimitDelay: number | null = null;

    keyLoop: for (const key of apiKeys) {
      const genAI = new GoogleGenerativeAI(key);

      // Try models in cascade: primary gemini-3.6-flash, then resilient fallbacks
      for (const modelName of GEMINI_VISION_MODELS) {
        const model = genAI.getGenerativeModel({ model: modelName });

        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const response = await model.generateContent([
              promptText,
              {
                inlineData: {
                  data: base64Data,
                  mimeType,
                },
              },
            ]);
            analysis = response.response.text() || 'No analysis available.';
            if (analysis) break keyLoop;
          } catch (err) {
            lastError = err;
            const msg = err instanceof Error ? err.message : String(err);

            const isAuthOrKeyError =
              msg.includes('API key') ||
              msg.includes('API_KEY') ||
              msg.includes('API_KEY_INVALID') ||
              msg.includes('401') ||
              msg.includes('403');

            if (isAuthOrKeyError) {
              // Server-side API key failure — immediately advance to next key in pool
              continue keyLoop;
            }

            const isImageClientError =
              msg.includes('Unable to process input image') ||
              msg.includes('Base64 decoding failed') ||
              (msg.includes('400') &&
                (msg.includes('image') || msg.includes('inlineData') || msg.includes('unsupported')));

            if (isImageClientError) {
              return NextResponse.json(
                { error: 'Invalid or corrupt image data. Please upload a valid JPG, PNG, or WebP image.' },
                { status: 400 }
              );
            }

            const is429 = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
            const is503 = msg.includes('503') || msg.includes('high demand') || msg.includes('overloaded');

            if (is429) {
              rateLimitExceeded = true;
              const retrySec = parseRetrySeconds(msg);
              if (retrySec !== null) rateLimitDelay = retrySec;
              if (retrySec !== null && retrySec <= 2 && attempt === 0) {
                await new Promise((resolve) => setTimeout(resolve, Math.ceil(retrySec * 1000) + 200));
                continue;
              }
              break;
            }

            if (is503 && attempt === 0) {
              await new Promise((resolve) => setTimeout(resolve, 800));
              continue;
            }

            break;
          }
        }
      }
    }

    if (!analysis) {
      if (rateLimitExceeded) {
        const retryHeader = rateLimitDelay ? Math.ceil(rateLimitDelay) : 30;
        return NextResponse.json(
          {
            error: 'Image analysis rate limit reached. Please wait a moment before trying again.',
            retryAfter: retryHeader,
          },
          {
            status: 429,
            headers: { 'Retry-After': String(retryHeader) },
          }
        );
      }
      throw lastError || new Error('No analysis generated');
    }

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
    const isAuthOrKeyError =
      msg.includes('API key') ||
      msg.includes('API_KEY') ||
      msg.includes('API_KEY_INVALID') ||
      msg.includes('401') ||
      msg.includes('403');

    if (
      !isAuthOrKeyError &&
      (msg.includes('Unable to process input image') ||
        msg.includes('Base64 decoding failed') ||
        (msg.includes('400') && (msg.includes('image') || msg.includes('inlineData'))))
    ) {
      return NextResponse.json(
        { error: 'Invalid or corrupt image data. Please upload a valid JPG, PNG, or WebP image.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'VLM analysis failed', detail: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'SehatAI VLM Analysis API',
    description: 'Vision-based health image analysis (rash, wound, skin conditions)',
    model: 'gemini-3.6-flash',
    endpoint: 'POST /api/vlm-analyze { image: base64, question?: string }',
    safety: 'Advisory only — never a diagnosis. Available to all authenticated users.',
    access: 'Patient (general guidance) + Doctor (clinical differential)',
  });
}
