import { AgentResponseSchema, geminiResponseSchema, type AgentResponse } from './schema';
import { systemPrompt, describeWorld } from './prompt';
import type { Block } from '../types';

const GEMINI_MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface AgentRequest {
  prompt: string;
  world: Block[];
  /**
   * Optional reference image. Base64-encoded (no `data:` prefix) plus
   * its mime. Gemini 2.5 Flash is multimodal and uses the image to
   * inform the structured-output build plan.
   */
  image?: {
    base64: string;
    mimeType: string;
  };
  /**
   * Recent chat turns for multi-turn / conversational planning.
   * Order: oldest → newest. Max ~6 turns recommended for context budget.
   */
  history?: readonly ChatTurn[];
}

export interface AgentRunOptions {
  apiKey: string;
  signal?: AbortSignal;
}

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

/**
 * Server-side core. Calls Gemini with strict responseSchema, supports
 * optional image attachment + chat history for conversational planning,
 * validates with Zod, returns a typed AgentResponse.
 */
export async function runAgent(
  { prompt, world, image, history = [] }: AgentRequest,
  { apiKey, signal }: AgentRunOptions
): Promise<AgentResponse> {
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
  if (!prompt.trim() && !image) throw new Error('Empty prompt and no image');

  const sys = systemPrompt();
  const worldContext = describeWorld(world);

  // Build the conversation. The very first user turn includes the world
  // context so the AI knows what's already on the board; follow-up turns
  // are just text.
  const contents: GeminiContent[] = [];
  for (const turn of history) {
    contents.push({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.text }],
    });
  }
  // Compose the latest user turn — image + fresh world context + the
  // prompt. Always include world state because it changes between
  // turns (the AI's previous actions or the user's manual edits).
  const finalParts: GeminiPart[] = [];
  if (image) {
    finalParts.push({
      inline_data: { mime_type: image.mimeType, data: image.base64 },
    });
  }
  const intent = prompt.trim() || (image ? 'Build what the reference image shows.' : '(continue)');
  finalParts.push({
    text: `${worldContext}\n\nUser intent: ${intent}`,
  });
  contents.push({ role: 'user', parts: finalParts });

  const body = {
    contents,
    systemInstruction: { parts: [{ text: sys }] },
    generationConfig: {
      temperature: 0.85,
      responseMimeType: 'application/json',
      responseSchema: geminiResponseSchema,
    },
  };

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const finish = data.candidates?.[0]?.finishReason;
    throw new Error(`No content from Gemini (finishReason=${finish ?? 'unknown'})`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini returned non-JSON despite responseSchema');
  }

  const result = AgentResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Schema violation: ${result.error.issues[0]?.message}`);
  }
  return result.data;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
}
