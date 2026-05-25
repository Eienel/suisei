/**
 * AI tutor — rephrases a lesson page in plainer language with a fresh
 * concrete metaphor. Separate from /api/agent (the world builder) so
 * we can tune prompt + schema independently.
 */

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const responseSchema = {
  type: 'object',
  required: ['rephrased'],
  properties: {
    rephrased: { type: 'string' },
  },
} as const;

export interface TutorRequest {
  topic: string;
  heading: string;
  body: string;
}

export interface TutorResponse {
  rephrased: string;
}

export interface TutorRunOptions {
  apiKey: string;
  signal?: AbortSignal;
}

export async function runTutor(
  { topic, heading, body }: TutorRequest,
  { apiKey, signal }: TutorRunOptions
): Promise<TutorResponse> {
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

  const sys = `You are a friendly crypto tutor for BlockBuilders. The student
is reading a short lesson page and asked you to explain it differently.

Rules:
- Keep it 2-3 short sentences.
- Use ONE concrete metaphor a 10-year-old would understand
  (lemonade stands, school lockers, recess games, board games, etc.).
- Plain language, no jargon. If you must mention a crypto word, define
  it inline in 4 words or less.
- Do not summarize — RE-explain from a fresh angle.
- Output strict JSON matching the response schema.`;

  const user = `Lesson topic: ${topic}
Original heading: ${heading}
Original body:
${body}

Rephrase the body in plainer language with a fresh metaphor.`;

  const reqBody = {
    contents: [{ role: 'user', parts: [{ text: user }] }],
    systemInstruction: { parts: [{ text: sys }] },
    generationConfig: {
      temperature: 0.9,
      responseMimeType: 'application/json',
      responseSchema,
    },
  };

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(reqBody),
    signal,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Tutor returned no content');

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Tutor returned non-JSON');
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as { rephrased?: unknown }).rephrased !== 'string'
  ) {
    throw new Error('Tutor response missing rephrased field');
  }
  return { rephrased: (parsed as TutorResponse).rephrased };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
}
