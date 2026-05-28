/**
 * Client-side glue for the Suisei agent. Posts to the Vercel Edge
 * function at `/api/agent`. If the function is missing (local dev
 * without Vercel) or unconfigured (no ANTHROPIC_API_KEY in prod),
 * the caller falls back to a scripted reply.
 */

export interface AgentTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentRequest {
  questId: string | null;
  phase?: string | null;
  address?: string | null;
  badgesEarned?: number;
  messages: AgentTurn[];
}

export interface AgentReply {
  reply: string;
}

/**
 * Returns null when the proxy is unreachable / unconfigured so the
 * caller can pick a scripted fallback line. Real errors (network,
 * 5xx) also produce null and a console warning — Suisei never
 * surfaces "the API failed" to the user.
 */
export async function callAgent(req: AgentRequest): Promise<AgentReply | null> {
  try {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (res.status === 503) return null; // agent_not_configured
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn('[suisei.agent] proxy returned', res.status);
      return null;
    }
    const data = (await res.json()) as AgentReply;
    if (!data.reply) return null;
    return data;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[suisei.agent] proxy unreachable:', e);
    return null;
  }
}
