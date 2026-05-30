# @suisei-mcp/mcp — Suisei MCP

The Sui Stack as one-line tools, exposed over the Model Context Protocol
— so any MCP-aware client (Claude Desktop, Cursor, Windsurf, your own
agent) can build on Sui. The server identifies itself as **Suisei** to
the agent. Tool names keep the `sui_` prefix because they wrap the Sui
chain — Suisei is the agent toolkit; Sui is the chain it speaks.
Suisei (the teaching agent) is a showcase built entirely on these tools.

> **Status:** Alpha. Thirty-three tools spanning the core build loop —
> read chain state, build any transaction, simulate it, decode it,
> submit it — plus native staking (stake, unstake, live APY, validator
> set, position tracking), DeepBook quotes & swaps, batch payouts,
> historical events, coin metadata + symbol registry, Tier-1
> agent-wallet lifecycle, and Walrus storage. Next up: the on-chain
> policy vault and Seal.

## Why

Most Sui SDKs assume you're writing application code. This package
assumes you're writing **agent** code — short tool calls, structured
JSON in, structured JSON out, no React, no UI. The agent decides what
to do; the tool does it.

## Install

```bash
npm install -g @suisei-mcp/mcp
```

## Use with Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) or the equivalent on your platform:

```jsonc
{
  "mcpServers": {
    "suisei": {
      "command": "npx",
      "args": ["-y", "@suisei-mcp/mcp"]
    }
  }
}
```

Restart Claude Desktop. You can now ask the agent things like:

> "What's the balance of `alice.sui`?"
> "Mint a badge to `0x1234…` for completing the zkLogin quest."
> "Publish this paragraph to Walrus and give me the blob id."

The agent picks the right tool. You see the result.

## Use it remotely (Claude web + mobile)

Stdio only works where the host can spawn a local process (Claude
Desktop, Cursor). To use the toolkit from the **Claude web and mobile
apps**, run it as a **remote MCP server** and add the URL as a Custom
Connector (Settings → Connectors).

Host it anywhere with the bundled HTTP server:

```bash
PORT=8787 SUISEI_MCP_TOKEN=your-secret npx suisei-mcp-serve
# serves Streamable HTTP at http://localhost:8787/  (front with HTTPS in prod)
```

On serverless, import the runtime-agnostic Fetch handler directly — it
runs on Vercel Edge, Cloudflare Workers, Deno, and Bun:

```ts
// api/mcp.ts (Vercel Edge)  — needs `@suisei-mcp/mcp` as a dependency
export const config = { runtime: 'edge' };
import { handleMcpRequest } from '@suisei-mcp/mcp/http';
export default (req: Request) => handleMcpRequest(req);
```

Set `SUISEI_MCP_TOKEN` so the endpoint requires
`Authorization: Bearer <token>` — a public MCP URL without a token is
open to the world.

**Signing caveat.** Reads (balances, coins, objects, transactions,
dynamic fields, gas, Walrus) work over a remote connector immediately.
The transaction-building tools still return *unsigned* bytes — signing
happens host-side, and a remote host (mobile) has no local wallet, so it
needs its own signing path (e.g. an Enoki-sponsored flow or a wallet
deep-link) to submit.

## Tools

**Read the chain**

| Tool                    | What it does                                                 |
| ----------------------- | ------------------------------------------------------------ |
| `sui_resolve_address`   | SuiNS name → 0x address (idempotent on 0x inputs)            |
| `sui_get_balance`       | SUI balance (in MIST + human-readable SUI)                   |
| `sui_get_all_balances`  | Every coin balance a wallet holds, not just SUI             |
| `sui_get_object`        | Any object's type, owner, fields, and Display               |
| `sui_get_owned_objects` | List objects by owner, filterable by struct type, paginated |
| `sui_get_owned_badges`  | List a wallet's Suisei completion badges                    |
| `sui_get_coins`         | List coin objects of a type (the ids you spend), paginated  |
| `sui_get_transaction`   | Look up a finalized tx by digest: status, gas, changes      |
| `sui_get_reference_gas_price` | Current network reference gas price (MIST)            |
| `sui_get_dynamic_fields` | List an object's dynamic fields (Tables, Bags), paginated  |
| `sui_get_stakes`        | A wallet's active stakes: principal, accrued rewards, ids   |
| `sui_get_validators_apy` | Live APY per validator (the APR feed for staking)          |
| `sui_get_validators`    | Active validator set: name, address, commission, total stake |
| `sui_get_validator`     | One validator, with APY + commission + stake merged         |
| `sui_query_events`      | Historical events: filter by type / module / sender / tx    |
| `sui_get_coin_metadata` | Live coin metadata (symbol, decimals, name, icon URL)       |
| `sui_resolve_coin`      | Symbol → coin type from a built-in registry (USDC, DEEP, …) |
| `sui_deepbook_quote`    | Read-only DeepBook v3 quote: expected out + DEEP fee        |
| `agent_wallet_status`   | An agent wallet's SUI balance + whether it's funded         |

**Build a transaction (never signed — bytes returned for the host)**

| Tool                    | What it does                                                 |
| ----------------------- | ------------------------------------------------------------ |
| `sui_move_call`         | Build a call to ANY Move entry function — the universal write |
| `sui_transfer`          | Build a transfer of SUI and/or whole objects                |
| `sui_pay_many`          | Build a batch payout: N recipients, N amounts, one atomic tx |
| `sui_stake`             | Build a native staking delegation to a validator            |
| `sui_unstake`           | Build a withdraw-stake for a StakedSui object               |
| `sui_mint_badge`        | Build a Suisei completion-badge mint                         |
| `sui_deepbook_swap`     | Build a DeepBook v3 market swap (CLOB liquidity)            |
| `agent_wallet_fund`     | Owner-signed: top up an agent wallet's allowance            |
| `agent_wallet_sweep`    | Agent-signed kill switch: drain the wallet back to the owner |

**Simulate & submit**

| Tool                    | What it does                                                 |
| ----------------------- | ------------------------------------------------------------ |
| `sui_dry_run`           | Simulate built tx bytes (status + gas, no spend)            |
| `sui_decode_tx_bytes`   | Offline decode: turn unsigned bytes into a human-readable plan |
| `sui_execute_signed_tx` | Submit host-signed tx bytes, return digest + effects        |

**Walrus storage**

| Tool                    | What it does                                                 |
| ----------------------- | ------------------------------------------------------------ |
| `walrus_publish`        | Publish a blob to Walrus testnet/mainnet                     |
| `walrus_fetch`          | Fetch a blob from Walrus by id                               |

The build loop is: a `*_build`-style tool returns base64 tx bytes →
`sui_dry_run` to verify → the host signs → `sui_execute_signed_tx` to
submit. The toolkit never holds keys.

All tools return structured JSON in the `text` content block. The
calling agent is expected to parse it.

## Design rules

- **No private keys.** Tools that produce transactions return tx bytes;
  the host signs and submits. A tool that holds a key is a tool that
  can spend money.
- **One job per tool.** No mega-tools with twelve flags. The agent's
  reasoning gets sharper when each tool is unambiguous.
- **Structured output.** Every successful return is JSON. The agent
  reads structured data more accurately than prose.

## Transport &amp; deprecation

Sui is deprecating public JSON-RPC fullnode endpoints (~mid-2026) in
favour of gRPC and GraphQL. Transport is chosen in one place —
`src/sui-client.ts` — so the rest of the toolkit never imports a client
directly.

Today `clientFor()` returns the JSON-RPC client, because building a
transaction (`tx.build({ client })`) needs *transaction resolution*,
which `@mysten/sui` 1.45.x implements only for JSON-RPC. Verified against
testnet: both the gRPC and GraphQL clients reject `tx.build` ("not
supported"/"not supported yet"). Reads already work over gRPC via
`grpcClientFor()`, also in that file.

When the SDK ships transaction-building over gRPC, the cutover is a
one-line change in `clientFor()` — no tool touches transport directly.

## Development

```bash
git clone https://github.com/eienel/suisei
cd blockbuilders/packages/mcp
npm install
npm run build
node dist/index.js
```

The server speaks JSON-RPC 2.0 over stdio per the MCP spec. To test
without an agent, you can pipe a handshake in by hand:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

## License

MIT.
