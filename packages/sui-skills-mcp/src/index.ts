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
import { suiGetAllBalances } from './tools/sui_get_all_balances.js';
import { suiGetObject } from './tools/sui_get_object.js';
import { suiGetOwnedObjects } from './tools/sui_get_owned_objects.js';
import { suiGetOwnedBadges } from './tools/sui_get_owned_badges.js';
import { suiMintBadge } from './tools/sui_mint_badge.js';
import { suiMoveCall } from './tools/sui_move_call.js';
import { suiTransfer } from './tools/sui_transfer.js';
import { suiStake } from './tools/sui_stake.js';
import { suiUnstake } from './tools/sui_unstake.js';
import { suiDryRun } from './tools/sui_dry_run.js';
import { suiExecuteSignedTx } from './tools/sui_execute_signed_tx.js';
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
    name: 'sui_get_all_balances',
    description:
      'List every coin balance an address holds (not just SUI). Returns coin type, balance in MIST, and object count per coin. Use when a wallet may hold tokens beyond the native coin.',
    inputSchema: z.object({
      address: z.string().describe('A 0x Sui address.'),
      network: z.enum(['testnet', 'mainnet', 'devnet']).default('testnet'),
    }),
    handler: suiGetAllBalances,
  },
  {
    name: 'sui_get_object',
    description:
      "Read any on-chain object: its Move type, owner, version, content fields, and Display metadata. The general read primitive — use it to inspect any object id.",
    inputSchema: z.object({
      object_id: z.string().describe('The 0x object id to read.'),
      network: z.enum(['testnet', 'mainnet', 'devnet']).default('testnet'),
    }),
    handler: suiGetObject,
  },
  {
    name: 'sui_get_owned_objects',
    description:
      'List objects owned by an address, optionally filtered to one Move struct type (e.g. "0x2::coin::Coin<0x2::sui::SUI>"). Paginated — pass the returned next_cursor to continue.',
    inputSchema: z.object({
      address: z.string().describe('Wallet address whose objects to list.'),
      struct_type: z
        .string()
        .optional()
        .describe('Fully-qualified Move struct type to filter by.'),
      cursor: z.string().optional().describe('Pagination cursor from a previous call.'),
      limit: z.number().int().min(1).max(50).default(50),
      network: z.enum(['testnet', 'mainnet', 'devnet']).default('testnet'),
    }),
    handler: suiGetOwnedObjects,
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
    name: 'sui_move_call',
    description:
      'Build (do not sign) a transaction calling ANY Move entry function — the universal write primitive. Each argument is a string: "object:<id>", or "pure:<type>:<value>" where type is address|id|bool|string|u8|u16|u32|u64|u128|u256. Vectors/structs are out of scope; use a dedicated tool for those. Returns base64 tx bytes.',
    inputSchema: z.object({
      target: z
        .string()
        .describe('Move target as "0xpkg::module::function".'),
      type_arguments: z
        .array(z.string())
        .default([])
        .describe('Type arguments for generic functions, e.g. ["0x2::sui::SUI"].'),
      arguments: z
        .array(z.string())
        .default([])
        .describe('Encoded call arguments, e.g. ["object:0xabc", "pure:u64:100"].'),
      sender: z.string().describe('0x address that will sign and pay for the tx.'),
      network: z.enum(['testnet', 'mainnet', 'devnet']).default('testnet'),
    }),
    handler: suiMoveCall,
  },
  {
    name: 'sui_transfer',
    description:
      'Build (do not sign) a transfer. Provide amount_mist to send SUI (split from gas) and/or object_ids to send whole objects to a recipient. Returns base64 tx bytes.',
    inputSchema: z.object({
      sender: z.string().describe('0x address sending and paying for the tx.'),
      recipient: z.string().describe('0x address receiving the funds/objects.'),
      amount_mist: z
        .string()
        .optional()
        .describe('Amount of SUI to send, in MIST (as a string to avoid precision loss).'),
      object_ids: z
        .array(z.string())
        .optional()
        .describe('Object ids to transfer whole.'),
      network: z.enum(['testnet', 'mainnet', 'devnet']).default('testnet'),
    }),
    handler: suiTransfer,
  },
  {
    name: 'sui_stake',
    description:
      'Build (do not sign) a native staking tx: split amount_mist from gas and delegate to a validator via 0x3::sui_system. Returns base64 tx bytes; the resulting StakedSui object lands in the sender once signed.',
    inputSchema: z.object({
      sender: z.string().describe('0x address staking and paying for the tx.'),
      amount_mist: z.string().describe('Amount to stake, in MIST (as a string).'),
      validator: z.string().describe('0x address of the validator to delegate to.'),
      network: z.enum(['testnet', 'mainnet', 'devnet']).default('testnet'),
    }),
    handler: suiStake,
  },
  {
    name: 'sui_unstake',
    description:
      'Build (do not sign) a withdraw-stake tx for a StakedSui object via 0x3::sui_system. Returns base64 tx bytes; principal plus rewards return to the sender once signed.',
    inputSchema: z.object({
      sender: z.string().describe('0x address that owns the StakedSui and pays for the tx.'),
      staked_sui_id: z.string().describe('Object id of the StakedSui to withdraw.'),
      network: z.enum(['testnet', 'mainnet', 'devnet']).default('testnet'),
    }),
    handler: suiUnstake,
  },
  {
    name: 'sui_dry_run',
    description:
      'Simulate a built (unsigned) transaction without spending gas. Returns execution status, gas cost, and balance/object changes. Use to verify a tx-builder result before asking the host to sign it.',
    inputSchema: z.object({
      tx_bytes_base64: z.string().describe('Base64 tx bytes from a tx-builder tool.'),
      network: z.enum(['testnet', 'mainnet', 'devnet']).default('testnet'),
    }),
    handler: suiDryRun,
  },
  {
    name: 'sui_execute_signed_tx',
    description:
      'Submit a host-signed transaction. The toolkit holds no keys: the caller signs tx bytes from a builder tool and passes the signature(s) here. Returns the digest and execution effects.',
    inputSchema: z.object({
      tx_bytes_base64: z.string().describe('Base64 tx bytes that were signed.'),
      signatures: z
        .array(z.string())
        .describe('One or more base64 signatures over the tx bytes (usually one).'),
      network: z.enum(['testnet', 'mainnet', 'devnet']).default('testnet'),
    }),
    handler: suiExecuteSignedTx,
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
  if (field instanceof z.ZodArray) {
    return base({ type: 'array', items: describeField(field.element as z.ZodTypeAny) });
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
