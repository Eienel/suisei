/**
 * Remote MCP endpoint - exposes the Suisei MCP over Streamable HTTP so it
 * can be added to Claude as a Custom Connector (web + mobile).
 *
 * Node runtime (not Edge): some tools use the Node `Buffer` global.
 *
 * Imports the package's *built* output directly. vercel.json's
 * installCommand builds `packages/mcp` (with its dev deps) so dist/node.js
 * and its dependencies exist when this function is bundled.
 *
 * Auth: set SUISEI_MCP_TOKEN in the Vercel project env; callers must then
 * send `Authorization: Bearer <token>`. The toolkit is non-custodial
 * (write tools return unsigned bytes), but the endpoint should still be
 * gated so it isn't used as free RPC.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleNodeRequest } from '../packages/mcp/dist/node.js';

export const config = { api: { bodyParser: false } };

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  void handleNodeRequest(req, res);
}
