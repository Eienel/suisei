#!/usr/bin/env node
/**
 * Standalone HTTP entrypoint — host the Sui Skills MCP anywhere.
 *
 *   PORT=8787 SUI_SKILLS_MCP_TOKEN=secret npx sui-skills-mcp-serve
 *
 * Spins up a Node HTTP server and bridges each request to the
 * runtime-agnostic `handleMcpRequest` Fetch handler. Point a Claude
 * Custom Connector at https://<host>/mcp to use the toolkit from the
 * Claude web and mobile apps. For serverless (Vercel Edge / Cloudflare
 * Workers) skip this and call `handleMcpRequest` directly from a route.
 */

import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { handleMcpRequest } from './http.js';

const PORT = Number(envVar('PORT') ?? 8787);

function envVar(name: string): string | undefined {
  return (globalThis as { process?: { env?: Record<string, string> } }).process?.env?.[name];
}

/** Read a Node request body into a single Buffer. */
function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c as Buffer));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Build a Fetch Request from a Node request. */
async function toFetchRequest(req: IncomingMessage): Promise<Request> {
  const host = req.headers.host ?? `localhost:${PORT}`;
  const url = new URL(req.url ?? '/', `http://${host}`);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => headers.append(k, vv));
    else if (v != null) headers.set(k, v);
  }
  const method = req.method ?? 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody ? await readBody(req) : undefined;
  return new Request(url, { method, headers, body: body && body.length ? body : undefined });
}

const httpServer = createHttpServer((req: IncomingMessage, res: ServerResponse) => {
  void (async () => {
    try {
      const fetchReq = await toFetchRequest(req);
      const response = await handleMcpRequest(fetchReq);
      const buf = Buffer.from(await response.arrayBuffer());
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      res.writeHead(response.status, headers);
      res.end(buf);
    } catch (e) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32603, message: e instanceof Error ? e.message : String(e) },
          id: null,
        }),
      );
    }
  })();
});

httpServer.listen(PORT, () => {
  process.stderr.write(`sui-skills-mcp HTTP server on http://localhost:${PORT}\n`);
});
