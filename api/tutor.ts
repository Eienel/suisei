import { runTutor } from '../src/agent/runTutor';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: { topic?: string; heading?: string; body?: string };
  try {
    body = (await req.json()) as { topic?: string; heading?: string; body?: string };
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (
    typeof body.topic !== 'string' ||
    typeof body.heading !== 'string' ||
    typeof body.body !== 'string'
  ) {
    return json({ error: 'topic, heading, body required' }, 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: 'Server missing GEMINI_API_KEY' }, 500);

  try {
    const result = await runTutor(
      { topic: body.topic, heading: body.heading, body: body.body },
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
