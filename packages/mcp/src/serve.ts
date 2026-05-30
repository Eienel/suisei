#!/usr/bin/env node
/**
 * Standalone HTTP entrypoint — host the Suisei MCP anywhere.
 *
 *   PORT=8787 SUISEI_MCP_TOKEN=secret npx suisei-mcp-serve
 *
 * Spins up a Node HTTP server and serves the Streamable HTTP transport via
 * the shared node bridge. Point a Claude Custom Connector at
 * https://<host>/ to use the toolkit from the Claude web and mobile apps.
 * For serverless (Vercel Node / Cloudflare) call handleNodeRequest /
 * handleMcpRequest from a route instead.
 */

import { createServer as createHttpServer } from 'node:http';
import { handleNodeRequest } from './node.js';

function envVar(name: string): string | undefined {
  return (globalThis as { process?: { env?: Record<string, string> } }).process?.env?.[name];
}

const PORT = Number(envVar('PORT') ?? 8787);

const httpServer = createHttpServer((req, res) => {
  void handleNodeRequest(req, res);
});

httpServer.listen(PORT, () => {
  process.stderr.write(`suisei-mcp HTTP server on http://localhost:${PORT}\n`);
});
