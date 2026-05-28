#!/usr/bin/env node
/**
 * @suisei/sui-skills-mcp — stdio entrypoint.
 *
 * The product: a standalone MCP server for the Sui stack. Plug into
 * Claude Desktop, Cursor, or any MCP-aware agent and you get one-line
 * tools to read chain state, call any Move function, transfer and stake
 * SUI, mint badges, dry-run and submit transactions, and publish to
 * Walrus. Suisei (the teaching agent at suisei.dev) is a showcase app
 * built entirely on these tools.
 *
 * This entry uses stdio: the agent process spawns this binary and talks
 * JSON-RPC over its stdin/stdout. For remote hosts (Claude Custom
 * Connectors, web + mobile) use the HTTP entry in `http.ts` / `serve.ts`.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

const server = createServer();
const transport = new StdioServerTransport();
await server.connect(transport);
