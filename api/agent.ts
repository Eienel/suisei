/**
 * Suisei agent — Claude Haiku proxy.
 *
 * The browser never sees ANTHROPIC_API_KEY. This Vercel Edge function
 * forwards a chat turn from `SuiseiChat.tsx` to Anthropic Messages with
 * a stable system prompt (cached) + per-turn quest context.
 *
 * Deploy: set ANTHROPIC_API_KEY in Vercel project env. The client at
 * `/api/agent` works automatically once it's set.
 */

export const config = { runtime: 'edge' };

type ChatBody = {
  /** Active quest id, or null on the hub. */
  questId: string | null;
  /** Phase within the quest (intro / interact / badge / done). */
  phase?: string | null;
  /** User's wallet address, if signed in. Used for tonal awareness only. */
  address?: string | null;
  /** How many badges the user has earned so far. */
  badgesEarned?: number;
  /**
   * Conversation history. Suisei's own scripted lines are passed in as
   * `assistant` turns so the model picks up where the script left off.
   */
  messages: { role: 'user' | 'assistant'; content: string }[];
};

const MODEL = 'claude-haiku-4-5-20251001';

const VOICE_SYSTEM = `You are Suisei — an AI agent that teaches the Sui blockchain
by doing it. You live inside the Suisei web app, on the right side of
the screen, as a persistent chat. The user is taking an 8-quest
curriculum that ends with them deploying real Move code on Sui
testnet and earning soulbound badges.

Voice:
- Direct, builder-coded, playfully clever. Senior dev energy, never
  childish, never condescending, never Duolingo-owl.
- 2–3 sentences max per reply unless the user asks for more.
- One idea per reply. Don't recap what the user just did.
- Crypto-skeptic-aware. You can joke about Solidity habits when
  relevant ("on the EVM you'd need three contracts for this") but
  never with contempt.
- When the user asks "how do I do X", give the actual code or the
  exact button. No "first let's understand…" filler.
- When stuck, name the most likely cause + the fastest fix.

Hard rules:
- Never claim to send a transaction yourself. You can only describe
  what the user should do; the UI does the signing.
- Never invent Sui APIs. If you're unsure of an exact symbol, say
  "check the Sui docs" rather than guessing.
- Plain text. No markdown headers or numbered lists.

Curriculum (always available context):
01. zkLogin           — Google → wallet. No seed phrase, no extension.
02. Sponsored Tx      — App pays gas. Your NFT is a real on-chain object.
03. Move Abilities    — key, store, copy, drop. Type-level safety.
04. Capability Pattern— Admin power as a physical object. You hold a key.
05. Soulbound NFT     — A badge that cannot leave your wallet.
06. PTB               — Five operations, one atomic block.
07. Walrus + Seal     — Decentralized storage gated by a Move policy.
08. DeepBook (grad)   — Real orders on a real orderbook. Graduate NFT.

The Suisei MCP server (\`@suisei/mcp\`) exposes the same toolkit Suisei
uses, so other agents (Claude Desktop, Cursor) can do real Sui work. You
can mention this when relevant.`;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const apiKey = (globalThis as { process?: { env?: Record<string, string> } }).process?.env
    ?.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'agent_not_configured' }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    );
  }

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return new Response(JSON.stringify({ error: 'bad_json' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const liveContext = buildLiveContext(body);
  const messages = trimHistory(body.messages ?? []);

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 320,
      system: [
        // Stable curriculum + voice — cached across turns.
        { type: 'text', text: VOICE_SYSTEM, cache_control: { type: 'ephemeral' } },
        // Per-turn live context — not cached.
        { type: 'text', text: liveContext },
      ],
      messages,
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    return new Response(
      JSON.stringify({ error: 'upstream_error', status: upstream.status, detail }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }

  const data = (await upstream.json()) as {
    content?: { type: string; text?: string }[];
    usage?: { input_tokens?: number; cache_read_input_tokens?: number; output_tokens?: number };
  };
  const text =
    data.content
      ?.filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('\n')
      .trim() ?? '';

  return new Response(
    JSON.stringify({
      reply: text,
      usage: data.usage,
    }),
    { headers: { 'content-type': 'application/json' } },
  );
}

function buildLiveContext(b: ChatBody): string {
  const lines: string[] = [];
  if (b.questId) {
    lines.push(`Current quest: ${b.questId}.`);
  } else {
    lines.push('User is on the quest hub (no active quest).');
  }
  if (b.phase) lines.push(`Phase: ${b.phase}.`);
  if (typeof b.badgesEarned === 'number') {
    lines.push(`Badges earned: ${b.badgesEarned} of 8.`);
  }
  if (b.address) lines.push(`User wallet: ${b.address}.`);
  return lines.join(' ');
}

function trimHistory(messages: ChatBody['messages']): ChatBody['messages'] {
  // Keep the last ~12 turns. Older context is rolled into the system block.
  const MAX = 12;
  if (messages.length <= MAX) return messages;
  return messages.slice(messages.length - MAX);
}
