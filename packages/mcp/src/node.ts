/**
 * Node HTTP bridge for the Streamable HTTP transport.
 *
 * `handleMcpRequest` (http.ts) speaks the Web Fetch API. This adapter lets
 * it serve Node `http`-style handlers — used by both the standalone server
 * (serve.ts) and a Vercel Node serverless function. Node runtime is needed
 * (not Edge) because some tools use the Node `Buffer` global.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleMcpRequest, type McpHttpOptions } from './http.js';

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c as Buffer));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function toFetchRequest(req: IncomingMessage): Promise<Request> {
  const host = req.headers.host ?? 'localhost';
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

/** Serve one MCP request from a Node http req/res pair. */
export async function handleNodeRequest(
  req: IncomingMessage,
  res: ServerResponse,
  options: McpHttpOptions = {},
): Promise<void> {
  try {
    const response = await handleMcpRequest(await toFetchRequest(req), options);
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
}
