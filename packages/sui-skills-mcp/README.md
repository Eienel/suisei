# @suisei/sui-skills-mcp

The Sui Stack as one-line tools, exposed over the Model Context
Protocol. The same toolkit [Suisei](https://suisei.dev) — the Sui
teaching agent — uses internally, available to any MCP-aware client
(Claude Desktop, Cursor, Windsurf, your own agent).

> **Status:** Sprint 0 alpha. Six tools covering Quests 1, 2, 5, 7.
> Sprints 1–3 add native staking, PTB composition, DeepBook, Seal.

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

| Tool                    | What it does                                                 |
| ----------------------- | ------------------------------------------------------------ |
| `sui_resolve_address`   | SuiNS name → 0x address (idempotent on 0x inputs)            |
| `sui_get_balance`       | SUI balance (in MIST + human-readable SUI)                   |
| `sui_get_owned_badges`  | List a wallet's Suisei completion badges                     |
| `sui_mint_badge`        | Build (don't execute) a PTB to mint a badge                  |
| `walrus_publish`        | Publish a blob to Walrus testnet/mainnet                     |
| `walrus_fetch`          | Fetch a blob from Walrus by id                               |

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
