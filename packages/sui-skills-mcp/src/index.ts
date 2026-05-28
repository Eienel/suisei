#!/usr/bin/env node
/**
 * @suisei/sui-skills-mcp — Sui Stack as MCP tools.
 *
 * The same toolkit Suisei (the teaching agent at suisei.dev) uses
 * internally, published as a standalone MCP server. Plug into Claude
 * Desktop, Cursor, or any MCP-aware agent and you get one-line tools
 * for the Sui stack: zkLogin, Sponsored Tx, Move PTBs, Walrus, Seal,
 * native staking, DeepBook.
 *
 * Stdio transport. No network listener. The agent process spawns this
 * binary, talks JSON-RPC over its stdin/stdout, and supervises it.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { suiResolveAddress } from './tools/sui_resolve_address.js';
import { suiGetBalance } from './tools/sui_get_balance.js';
import { suiGetOwnedBadges } from './tools/sui_get_owned_badges.js';
import { suiMintBadge } from './tools/sui_mint_badge.js';
import { walrusPublish } from './tools/walrus_publish.js';
import { walrusFetch } from './tools/walrus_fetch.js';

const PKG_VERSION = '0.1.0';

const server = new Server(
  { name: 'sui-skills', version: PKG_VERSION },
  { capabilities: { tools: {} } },
);

interface ToolDef {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  handler: (args: unknown) => Promise<string>;
}

const tools: ToolDef[] = [
  {
    name: 'sui_resolve_address',
    description:
      'Resolve a Sui address from a SuiNS name (e.g. "alice.sui") or echo back a 0x address if already canonical. Use this whenever the user gives you a human-readable name.',
    inputSchema: z.object({
      name_or_address: z.string().describe('A SuiNS name or 0x… address.'),
      network: z
        .enum(['testnet', 'mainnet', 'devnet'])
        .default('testnet')
        .describe('Sui network to query.'),
    }),
    handler: suiResolveAddress,
  },
  {
    name: 'sui_get_balance',
    description:
      'Get the SUI balance of an address. Returns balance in MIST (1 SUI = 10^9 MIST) and a human-readable SUI value.',
    inputSchema: z.object({
      address: z.string().describe('A 0x Sui address.'),
      network: z.enum(['testnet', 'mainnet', 'devnet']).default('testnet'),
    }),
    handler: suiGetBalance,
  },
  {
    name: 'sui_get_owned_badges',
    description:
      "Lists Suisei badges (soulbound quest-completion NFTs) owned by an address. Each badge proves the user completed a specific Suisei quest. Useful for showing a wallet's curriculum progress.",
    inputSchema: z.object({
      address: z.string().describe('Wallet address whose badges to list.'),
      badge_package: z
        .string()
        .optional()
        .describe(
          'Badge package id (the Move package with the badge module). Defaults to the canonical Suisei package on the chosen network.',
        ),
      network: z.enum(['testnet', 'mainnet', 'devnet']).default('testnet'),
    }),
    handler: suiGetOwnedBadges,
  },
  {
    name: 'sui_mint_badge',
    description:
      'Build (do not execute) a PTB that mints a Suisei completion badge to a recipient. Returns base64 tx bytes; the caller signs and submits separately. Use this when an agent wants to issue its own badges through the canonical badge module.',
    inputSchema: z.object({
      recipient: z.string().describe('0x address receiving the badge.'),
      quest_id: z
        .string()
        .describe('Quest identifier, e.g. "zklogin", "sponsored".'),
      quest_number: z.number().int().min(1).max(255),
      badge_package: z.string(),
      network: z.enum(['testnet', 'mainnet', 'devnet']).default('testnet'),
    }),
    handler: suiMintBadge,
  },
  {
    name: 'walrus_publish',
    description:
      'Publish a blob to Walrus testnet/mainnet. Returns the Walrus blob id, which is content-addressable and durable. Use this when the user wants to store arbitrary bytes on a decentralized network instead of S3.',
    inputSchema: z.object({
      content: z
        .string()
        .describe('Content to publish. UTF-8 string or base64 if `encoding=base64`.'),
      encoding: z.enum(['utf8', 'base64']).default('utf8'),
      epochs: z
        .number()
        .int()
        .min(1)
        .default(5)
        .describe('How many Walrus epochs to keep the blob alive.'),
      publisher_url: z
        .string()
        .optional()
        .describe('Override the Walrus publisher endpoint.'),
    }),
    handler: walrusPublish,
  },
  {
    name: 'walrus_fetch',
    description:
      'Fetch a blob from Walrus by id. Returns UTF-8 text or base64 bytes depending on `as`.',
    inputSchema: z.object({
      blob_id: z.string().describe('The Walrus blob id returned by walrus_publish.'),
      as: z.enum(['utf8', 'base64']).default('utf8'),
      aggregator_url: z
        .string()
        .optional()
        .describe('Override the Walrus aggregator endpoint.'),
    }),
    handler: walrusFetch,
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.inputSchema),
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = tools.find((t) => t.name === req.params.name);
  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${req.params.name}` }],
      isError: true,
    };
  }
  const parsed = tool.inputSchema.safeParse(req.params.arguments ?? {});
  if (!parsed.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Bad arguments for ${tool.name}: ${parsed.error.message}`,
        },
      ],
      isError: true,
    };
  }
  try {
    const text = await tool.handler(parsed.data);
    return { content: [{ type: 'text', text }] };
  } catch (e) {
    return {
      content: [
        {
          type: 'text',
          text: `Tool ${tool.name} failed: ${e instanceof Error ? e.message : String(e)}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Minimal Zod → JSON-Schema converter for the inputs we actually use
 * here. Avoids pulling a 50KB schema library into a server that just
 * needs to describe six tools.
 */
function zodToJsonSchema(schema: z.ZodObject<z.ZodRawShape>): Record<string, unknown> {
  const shape = schema.shape;
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const [key, field] of Object.entries(shape)) {
    properties[key] = describeField(field);
    if (!(field instanceof z.ZodOptional) && !(field instanceof z.ZodDefault)) {
      required.push(key);
    }
  }
  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
}

function describeField(field: z.ZodTypeAny): Record<string, unknown> {
  const description = field.description ?? undefined;
  const base = (out: Record<string, unknown>) => (description ? { ...out, description } : out);

  if (field instanceof z.ZodString) return base({ type: 'string' });
  if (field instanceof z.ZodNumber) return base({ type: 'number' });
  if (field instanceof z.ZodBoolean) return base({ type: 'boolean' });
  if (field instanceof z.ZodEnum) {
    return base({ type: 'string', enum: field.options as string[] });
  }
  if (field instanceof z.ZodOptional) {
    return describeField(field.unwrap());
  }
  if (field instanceof z.ZodDefault) {
    const inner = describeField(field._def.innerType as z.ZodTypeAny);
    return { ...inner, default: field._def.defaultValue() };
  }
  return base({});
}

const transport = new StdioServerTransport();
await server.connect(transport);
