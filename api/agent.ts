import { runAgent } from '../src/agent/runAgent';
import type { Block } from '../src/types';

/**
 * POST /api/agent — Vercel Function.
 * Body: { prompt: string, world: Block[] }
 * Returns the validated AgentResponse, or 4xx/5xx with { error }.
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: { prompt?: string; world?: Block[] };
  try {
    body = (await req.json()) as { prompt?: string; world?: Block[] };
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (typeof body.prompt !== 'string' || !body.prompt.trim()) {
    return json({ error: 'prompt required' }, 400);
  }
  if (!Array.isArray(body.world)) {
    return json({ error: 'world array required' }, 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: 'Server missing GEMINI_API_KEY' }, 500);

  try {
    const result = await runAgent(
      { prompt: body.prompt, world: body.world },
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
