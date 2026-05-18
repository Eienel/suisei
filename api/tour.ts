import { runTour } from '../src/agent/runTour.js';
import type { Block } from '../src/types.js';

/**
 * POST /api/tour — generate a guided tour for a snapshot of blocks.
 * Body: { blocks: Block[], worldName?: string }
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: { blocks?: Block[]; worldName?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!Array.isArray(body.blocks) || body.blocks.length === 0) {
    return json({ error: 'blocks array required (non-empty)' }, 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: 'Server missing GEMINI_API_KEY' }, 500);

  try {
    const result = await runTour(
      { blocks: body.blocks, worldName: body.worldName },
      { apiKey }
    );
    return json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const config = { runtime: 'edge' };
