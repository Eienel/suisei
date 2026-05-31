/*
 * Remote MCP endpoint, served from the Next app.
 *
 * Mirrors the previous standalone api/mcp.ts: it exposes the published
 * Suisei MCP over Streamable HTTP so it can be added to Claude as a Custom
 * Connector (web and mobile). handleMcpRequest takes a web Request and
 * returns a web Response, which is exactly what a Next route handler needs.
 *
 * Node runtime (not Edge): the server uses Node built-ins.
 *
 * Auth: set SUISEI_MCP_TOKEN in the project env; callers must then send
 * `Authorization: Bearer <token>`.
 */
import { handleMcpRequest } from '@suisei-mcp/mcp/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function POST(request: Request): Promise<Response> {
  return handleMcpRequest(request);
}

export function GET(request: Request): Promise<Response> {
  return handleMcpRequest(request);
}

export function DELETE(request: Request): Promise<Response> {
  return handleMcpRequest(request);
}
