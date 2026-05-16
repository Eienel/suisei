/**
 * Tour mode — given a snapshot of someone's town, ask Gemini to write
 * a guided narrative tour: 3–5 camera stops, each with a position +
 * look-at target + one-line narration. The frontend animates the
 * camera between stops and reads each line.
 *
 * Output is structured JSON; the model's job is interpretation, not
 * geometry — it reads block clusters and turns them into a story.
 */

import { z } from 'zod';
import { BLOCK_DEFS } from '../world/blockTypes';
import type { Block } from '../types';

const GEMINI_MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const Vec3 = z.tuple([z.number(), z.number(), z.number()]);

export const TourStopSchema = z.object({
  camera: Vec3,
  lookAt: Vec3,
  narration: z.string().min(1).max(220),
});

export const TourSchema = z.object({
  title: z.string().min(1).max(80),
  stops: z.array(TourStopSchema).min(2).max(6),
});

export type TourStop = z.infer<typeof TourStopSchema>;
export type Tour = z.infer<typeof TourSchema>;

const responseSchema = {
  type: 'object',
  required: ['title', 'stops'],
  properties: {
    title: { type: 'string' },
    stops: {
      type: 'array',
      items: {
        type: 'object',
        required: ['camera', 'lookAt', 'narration'],
        properties: {
          camera: {
            type: 'array',
            items: { type: 'number' },
            minItems: 3,
            maxItems: 3,
          },
          lookAt: {
            type: 'array',
            items: { type: 'number' },
            minItems: 3,
            maxItems: 3,
          },
          narration: { type: 'string' },
        },
      },
    },
  },
} as const;

export interface TourRequest {
  blocks: Block[];
  worldName?: string;
}

export interface TourRunOptions {
  apiKey: string;
  signal?: AbortSignal;
}

export async function runTour(
  { blocks, worldName }: TourRequest,
  { apiKey, signal }: TourRunOptions
): Promise<Tour> {
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
  if (!blocks.length) throw new Error('Empty world — nothing to tour');

  const blockCatalog = BLOCK_DEFS.map(
    (d) => `  - ${d.id} (${d.category}): ${d.blurb}`
  ).join('\n');

  const sys = `You are a museum-style guide narrating a 3D crypto town built
in BlockBuilders. The user has finished a world; you walk visitors
through it in 3–5 short stops.

CAMERA GEOMETRY:
- y is up. Floor sits at y=-0.5. Each block fills one unit cell.
- "camera" is where the camera sits; "lookAt" is the point it aims at.
- Pick camera positions that make each cluster look hero-shot good:
  slightly above (y 4–10), at a 30–45° angle, 6–12 units away from
  the lookAt point.
- The first stop should be a wide establishing shot (further out,
  higher); the last should land on a centerpiece close-up.

NARRATION:
- One sentence per stop, ≤180 chars.
- First stop = introduce the town. Middle stops = interpret what each
  cluster means in crypto terms (a wallet district, an oracle hill, a
  validator wall). Last = a memorable closing line.
- Speak TO the visitor ("notice...", "see how..."), not ABOUT them.
- No jargon dumps. Use the metaphor each block category invites.

TITLE:
- 3–6 words. Punchy. Names the town's vibe ("Skyline of Stakes",
  "Oracle's Promise"). Avoid generic words like "tour" or "town".

BLOCK CATALOG (for interpretation, not enumeration):
${blockCatalog}`;

  const summary = summariseWorld(blocks);
  const userText = `Town to tour${worldName ? ` ("${worldName}")` : ''}:

${summary}

Plan a 3–5 stop guided tour. Pick camera positions and write the narration.`;

  const reqBody = {
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    systemInstruction: { parts: [{ text: sys }] },
    generationConfig: {
      temperature: 0.85,
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
  if (!text) throw new Error('Tour returned no content');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Tour returned non-JSON');
  }
  const result = TourSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Tour schema violation: ${result.error.issues[0]?.message}`);
  }
  return result.data;
}

function summariseWorld(blocks: Block[]): string {
  // Cluster blocks by type and compute centroids — the AI plans
  // camera positions around clusters, not individual blocks.
  const groups = new Map<string, { count: number; sx: number; sy: number; sz: number }>();
  for (const b of blocks) {
    const g = groups.get(b.type) ?? { count: 0, sx: 0, sy: 0, sz: 0 };
    g.count += 1;
    g.sx += b.position[0];
    g.sy += b.position[1];
    g.sz += b.position[2];
    groups.set(b.type, g);
  }
  const lines = Array.from(groups.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([type, g]) => {
      const cx = (g.sx / g.count).toFixed(1);
      const cy = (g.sy / g.count).toFixed(1);
      const cz = (g.sz / g.count).toFixed(1);
      return `  - ${g.count}× ${type} centred at [${cx}, ${cy}, ${cz}]`;
    });
  return `${blocks.length} blocks total. Clusters:\n${lines.join('\n')}`;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
}
