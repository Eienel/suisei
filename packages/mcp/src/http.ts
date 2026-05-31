/**
 * Remote (Streamable HTTP) entrypoint - Web Standards flavour.
 *
 * `handleMcpRequest(request)` is a runtime-agnostic Fetch handler: it runs
 * on Vercel Edge, Cloudflare Workers, Deno, Bun, and Node 18+. Wire it to
 * an HTTPS route and add that URL to Claude as a Custom Connector to use
 * the Suisei MCP from the Claude web and mobile apps.
 *
 * Stateless: a fresh server + transport per request (no session store),
 * which is what serverless wants. Reads work great over a remote
 * connector; transaction-building tools return unsigned bytes - signing
 * still happens host-side, so a remote host needs its own signing path.
 */

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createServer } from './server.js';

export interface McpHttpOptions {
  /**
   * If set, requests must carry `Authorization: Bearer <token>`. Falls
   * back to the SUISEI_MCP_TOKEN env var (with SUI_SKILLS_MCP_TOKEN kept
   * as a compatibility alias). Leave unset only for local testing - a
   * public endpoint without a token is open to the world.
   */
  authToken?: string;
}

function envToken(): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string> } }).process?.env;
  return env?.SUISEI_MCP_TOKEN ?? env?.SUI_SKILLS_MCP_TOKEN;
}

function unauthorized(): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'unauthorized' },
      id: null,
    }),
    { status: 401, headers: { 'content-type': 'application/json' } },
  );
}

/** Handle one MCP request over Streamable HTTP. */
export async function handleMcpRequest(
  request: Request,
  options: McpHttpOptions = {},
): Promise<Response> {
  const token = options.authToken ?? envToken();
  if (token) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${token}`) return unauthorized();
  }

  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}
