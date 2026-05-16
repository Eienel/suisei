import { runCustomLesson } from '../src/agent/runCustomLesson';

/**
 * POST /api/lesson — generate a custom lesson + quiz from a free topic.
 * Body: { topic: string }
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: { topic?: string };
  try {
    body = (await req.json()) as { topic?: string };
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.topic?.trim()) {
    return json({ error: 'topic required' }, 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: 'Server missing GEMINI_API_KEY' }, 500);

  try {
    const result = await runCustomLesson({ topic: body.topic }, { apiKey });
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
