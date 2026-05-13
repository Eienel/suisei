import { AgentResponseSchema, geminiResponseSchema, type AgentResponse } from './schema';
import { systemPrompt, describeWorld } from './prompt';
import type { Block } from '../types';

const GEMINI_MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface AgentRequest {
  prompt: string;
  world: Block[];
}

export interface AgentRunOptions {
  apiKey: string;
  signal?: AbortSignal;
}

/**
 * Server-side core. Takes a user prompt + current world, calls Gemini
 * with strict responseSchema, validates with Zod, returns a typed
 * AgentResponse. Throws with a clear message on any failure.
 */
export async function runAgent(
  { prompt, world }: AgentRequest,
  { apiKey, signal }: AgentRunOptions
): Promise<AgentResponse> {
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
  if (!prompt.trim()) throw new Error('Empty prompt');

  const sys = systemPrompt();
  const userMsg = `${describeWorld(world)}\n\nUser intent: ${prompt.trim()}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: userMsg }] }],
    systemInstruction: { parts: [{ text: sys }] },
    generationConfig: {
      temperature: 0.85,
      responseMimeType: 'application/json',
      responseSchema: geminiResponseSchema,
    },
  };

  const url = `${ENDPOINT}?key=${apiKey}`;
  const res = await fetch(url, {
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
