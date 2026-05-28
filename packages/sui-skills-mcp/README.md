# @suisei/sui-skills-mcp

The Sui Stack as one-line tools, exposed over the Model Context
Protocol. The same toolkit [Suisei](https://suisei.dev) — the Sui
teaching agent — uses internally, available to any MCP-aware client
(Claude Desktop, Cursor, Windsurf, your own agent).

> **Status:** Alpha. Nineteen tools spanning the core build loop — read
> chain state, build any transaction, simulate it, submit it — plus
> Walrus storage. Next up: PTB composition, DeepBook, and Seal.

## Why

Most Sui SDKs assume you're writing application code. This package
assumes you're writing **agent** code — short tool calls, structured
JSON in, structured JSON out, no React, no UI. The agent decides what
to do; the tool does it.

## Install

```bash
npm install -g @suisei/sui-skills-mcp
```

## Use with Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) or the equivalent on your platform:

```jsonc
{
  "mcpServers": {
    "sui": {
      "command": "npx",
      "args": ["-y", "@suisei/sui-skills-mcp"]
    }
  }
}
```

Restart Claude Desktop. You can now ask the agent things like:

> "What's the balance of `alice.sui`?"
> "Mint a badge to `0x1234…` for completing the zkLogin quest."
> "Publish this paragraph to Walrus and give me the blob id."

The agent picks the right tool. You see the result.

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

**Build a transaction (never signed — bytes returned for the host)**

| Tool                    | What it does                                                 |
| ----------------------- | ------------------------------------------------------------ |
| `sui_move_call`         | Build a call to ANY Move entry function — the universal write |
| `sui_transfer`          | Build a transfer of SUI and/or whole objects                |
| `sui_stake`             | Build a native staking delegation to a validator            |
| `sui_unstake`           | Build a withdraw-stake for a StakedSui object               |
| `sui_mint_badge`        | Build a Suisei completion-badge mint                         |

**Simulate & submit**

| Tool                    | What it does                                                 |
| ----------------------- | ------------------------------------------------------------ |
| `sui_dry_run`           | Simulate built tx bytes (status + gas, no spend)            |
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

## Development

```bash
git clone https://github.com/eienel/blockbuilders
cd blockbuilders/packages/sui-skills-mcp
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
