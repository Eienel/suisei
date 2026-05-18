/**
 * Custom lesson generator — given a free-form topic, Gemini returns a
 * 2-page read + 4-question quiz, each correct answer rewarding a piece.
 * The shape mirrors `data/lessons.ts` so the existing read → check →
 * done flow renders custom lessons with zero special-cases.
 */

import { z } from 'zod';
import { BLOCK_TYPE_IDS } from '../world/blockTypes.js';
import { PIECE_KEYS } from '../world/pieces.js';
import type { BlockType } from '../types.js';
import type { PieceKey } from '../world/pieces.js';

const GEMINI_MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const BlockTypeZ = z.enum(
  BLOCK_TYPE_IDS as unknown as [BlockType, ...BlockType[]]
);
const PieceKeyZ = z.enum(
  PIECE_KEYS as unknown as [PieceKey, ...PieceKey[]]
);

const PageSchema = z.object({
  heading: z.string().min(1).max(80),
  body: z.string().min(1).max(1000),
});

const PieceRewardSchema = z.object({
  type: BlockTypeZ,
  pieceKey: PieceKeyZ,
});

const QuizQuestionSchema = z.object({
  prompt: z.string().min(1).max(220),
  options: z.array(z.string().min(1).max(120)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  reward: PieceRewardSchema,
});

export const CustomLessonSchema = z.object({
  title: z.string().min(1).max(40),
  blurb: z.string().min(1).max(120),
  district: z.string().min(1).max(40),
  pages: z.array(PageSchema).min(1).max(3),
  quiz: z.array(QuizQuestionSchema).length(4),
});

export type CustomLesson = z.infer<typeof CustomLessonSchema>;

const responseSchema = {
  type: 'object',
  required: ['title', 'blurb', 'district', 'pages', 'quiz'],
  properties: {
    title: { type: 'string' },
    blurb: { type: 'string' },
    district: { type: 'string' },
    pages: {
      type: 'array',
      items: {
        type: 'object',
        required: ['heading', 'body'],
        properties: {
          heading: { type: 'string' },
          body: { type: 'string' },
        },
      },
    },
    quiz: {
      type: 'array',
      items: {
        type: 'object',
        required: ['prompt', 'options', 'correctIndex', 'reward'],
        properties: {
          prompt: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer' },
          reward: {
            type: 'object',
            required: ['type', 'pieceKey'],
            properties: {
              type: { type: 'string', enum: [...BLOCK_TYPE_IDS] },
              pieceKey: { type: 'string', enum: [...PIECE_KEYS] },
            },
          },
        },
      },
    },
  },
} as const;

export interface CustomLessonRequest {
  topic: string;
}

export interface CustomLessonRunOptions {
  apiKey: string;
  signal?: AbortSignal;
}

export async function runCustomLesson(
  { topic }: CustomLessonRequest,
  { apiKey, signal }: CustomLessonRunOptions
): Promise<CustomLesson> {
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
  if (!topic.trim()) throw new Error('Topic required');

  const sys = `You are the BlockBuilders lesson writer. The player picked a
crypto topic; you write a tiny, accurate, kid-tone lesson with a quiz.

LESSON SHAPE:
- title: 1-3 words, capitalised topic (e.g. "MEV", "Rollups").
- blurb: one short sentence that promises what they'll learn.
- district: 1-3 word name for the on-map district they're building
  while answering (e.g. "Mempool docks", "Rollup yard").
- pages: 2 pages, each AT MOST 600 characters (about 100 words),
  written for an 8-14 year old. Concrete metaphors, no jargon dumps.
  Define every term inline. Hard limit — count characters.
- quiz: EXACTLY 4 multiple-choice questions, each with EXACTLY 4
  options. correctIndex is the 0-based index of the right answer.

REWARDS:
- Each question's reward is a (block type, piece shape) pair.
- Block types in the catalog: ${BLOCK_TYPE_IDS.join(', ')}.
- Piece shapes: ${PIECE_KEYS.join(', ')}.
- Pick block types whose meaning matches the question (e.g. a wallet
  question rewards a wallet_keystone; a smart contract question
  rewards a contract_obelisk).
- Mix piece shapes across the 4 questions for visual variety. Reserve
  the larger shapes (LINE_4, SQUARE, T, L, S, Z) for harder questions.

ACCURACY:
- The crypto content must be correct. If you're unsure, simplify
  rather than invent.

Output STRICT JSON matching the schema. No markdown.`;

  const user = `Crypto topic to teach: "${topic.trim()}"

Write the lesson. Remember: 2 pages, EXACTLY 4 quiz questions, each
with EXACTLY 4 options.`;

  const reqBody = {
    contents: [{ role: 'user', parts: [{ text: user }] }],
    systemInstruction: { parts: [{ text: sys }] },
    generationConfig: {
      temperature: 0.7,
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
  if (!text) throw new Error('Custom lesson returned no content');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Custom lesson returned non-JSON');
  }
  const result = CustomLessonSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Custom lesson schema violation: ${result.error.issues[0]?.message}`);
  }
  return result.data;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
}
