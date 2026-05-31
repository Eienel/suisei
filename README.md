# Suisei

[![@suisei-mcp/mcp](https://img.shields.io/npm/v/@suisei-mcp/mcp?label=%40suisei-mcp%2Fmcp&color=cb3837&logo=npm)](https://www.npmjs.com/package/@suisei-mcp/mcp)
[![@suisei-mcp/agent-signer](https://img.shields.io/npm/v/@suisei-mcp/agent-signer?label=%40suisei-mcp%2Fagent-signer&color=cb3837&logo=npm)](https://www.npmjs.com/package/@suisei-mcp/agent-signer)
[![license](https://img.shields.io/npm/l/@suisei-mcp/mcp?color=blue)](LICENSE)

> Sui's agent toolkit. The Sui Stack as one-line tools, exposed over the
> Model Context Protocol so any AI agent (Claude Desktop, Cursor, your
> own bot) can read, build, simulate, sign, and submit on Sui.

Two packages on npm, the same toolkit any agent can plug into:

| Package | What it is | Install |
|---|---|---|
| [`@suisei-mcp/mcp`](packages/mcp) | The MCP server: 33 tools spanning read, build, simulate, submit, staking, DeepBook, Walrus, and agent-wallet lifecycle. | `npm i -g @suisei-mcp/mcp` |
| [`@suisei-mcp/agent-signer`](packages/agent-signer) | A non-custodial local CLI that holds the agent's key, encrypts it under your passphrase, and signs builder bytes. No key ever crosses an MCP response. | `npm i -g @suisei-mcp/agent-signer` |

## The two non-negotiables

1. The toolkit never holds private keys. Every transaction-building
   tool returns unsigned `tx_bytes_base64`. The host signs. The MCP
   submits. A tool that holds a key is a tool that can spend money.
2. Key material never enters an agent's context. Key generation is not
   an MCP tool. If it were, the secret would land in the LLM's prompt
   and logs. That's why signing lives in `agent-signer`, a separate
   local process, not the server.

## Quickstart: Claude Code (CLI)

One command registers the server; `npx` fetches it on demand, so there is
nothing to install:

```bash
claude mcp add suisei -- npx -y @suisei-mcp/mcp
```

Confirm it connected:

```bash
claude mcp list
```

Add `-s user` to make it available in every project, not just the current
one:

```bash
claude mcp add -s user suisei -- npx -y @suisei-mcp/mcp
```

The `sui_*` and `walrus_*` tools are now available in your Claude Code
sessions. Skip to [Talk to it](#talk-to-it) below.

## Quickstart: Claude Desktop

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

Restart Claude.

## Talk to it

Reads work immediately, with no key and no other setup. Just ask in
plain language:

> "What's the balance of `alice.sui`?"
> "Show the top 10 Sui validators by APY."
> "Decode these tx bytes and tell me what they do: `<base64>`"
> "Build a tx that stakes 1 SUI to validator X, but don't sign it, I want to dry-run first."
> "Publish this paragraph to Walrus and give me the blob id."

The agent picks the tool, you see the JSON, you decide what to sign.
Building a transaction returns unsigned `tx_bytes_base64`; to actually
submit it, sign locally with `agent-signer` (next section).

## Quickstart: agent wallet (Tier 1)

Give an agent a small, bounded wallet to act from, without ever touching
your real wallet.

```bash
npm i -g @suisei-mcp/agent-signer

export AGENT_WALLET_PASSPHRASE="something-long-and-private"
agent-signer create
# returns { "address": "0x...", "path": "~/.suisei/agent-wallet.json" }
```

Then the loop:

1. Fund the agent wallet (the allowance). This is a normal transfer from
   **your real wallet** to the agent address - `agent-signer` does **not**
   do this, because it holds the *agent* key, not your owner key. Pick
   whichever is easiest:
   - Just send SUI to the agent address from Sui Wallet / Suiet (simplest).
   - `sui client transfer-sui --to <agent-addr> --amount <mist>` if your
     wallet is in the Sui CLI.
   - `agent_wallet_fund` drafts the transfer as unsigned bytes for you, but
     you still sign those with your *owner* key (Sui CLI or a connected
     browser wallet) - this path mainly makes sense inside a web app.
2. Agent builds the tx it wants to run (stake, swap, transfer, etc.). MCP
   returns `tx_bytes_base64`.
3. You sign that locally with the **agent** key:
   ```bash
   agent-signer sign <tx_bytes_base64>
   ```
4. Agent submits with `sui_execute_signed_tx`.

There are two keys in play, which is the usual point of confusion: your
**owner** key (your real wallet) signs *funding* and the final *sweep*;
the **agent** key (`agent-signer`) signs everything the agent does with its
allowance. `agent-signer` never touches your owner key.

To revoke: ask the agent for `agent_wallet_sweep`, sign it with your owner
key, submit. The agent wallet is drained back to you and the allowance is
gone.

## Remote MCP (Claude web + mobile)

Claude Desktop spawns a local process; Claude on the web and mobile
can't. For those, host the MCP as a remote endpoint and add it as a
Custom Connector (Settings, then Connectors).

Two ways to host it:

- Self-hosted: `npx suisei-mcp-serve` starts an HTTP server you can
  front with HTTPS.
- Serverless: the [`web/`](web) Next app serves the endpoint at
  `/api/mcp` (alongside the landing page). Set `SUISEI_MCP_TOKEN` in the
  project env; callers must then send `Authorization: Bearer <token>`.

## Custom RPC provider (optional)

By default the toolkit talks to the public Sui fullnode. To run against a
managed provider for reliability - or to stay working past the ~mid-2026
deprecation of public JSON-RPC endpoints - point it at any standard Sui
JSON-RPC gateway (Tatum, QuickNode, your own node) with env vars:

```bash
export SUI_RPC_URL_TESTNET="https://sui-testnet.gateway.tatum.io"
export SUI_RPC_API_KEY="<your-key>"          # sent as x-api-key by default
```

No tools change - it's the same JSON-RPC interface, just a different
endpoint. See [`.env.example`](.env.example) for all options.

## What's in this repo

```
packages/
  mcp/                    # @suisei-mcp/mcp: the MCP server (33 tools)
  agent-signer/           # @suisei-mcp/agent-signer: non-custodial local signer
web/                      # Landing page + showcase (Next), serves /api/mcp
move/
  suisei_badge/           # Soulbound completion badge for the teaching agent
docs/
  AGENT_WALLET_DESIGN.md  # Tier 1 (shipped), Tier 2 vault, Tier 3 multisig
  MNEMOSUI_DESIGN.md      # Showcase: an agent memory NFT (Walrus + Sui)
  TXLENS_DESIGN.md        # Showcase: look before you sign wallet guard
  PUBLISH.md              # npm release runbook
  design/SUISEI_BRIEF.md  # Brand brief for the Suisei teaching agent
PLAN.md                   # Build plan for the next milestones
.github/workflows/
  publish-mcp.yml         # Tag-driven npm publish for @suisei-mcp/mcp
```

## What we're building

The MCP is the foundation. On top of it, three showcases are designed
and ready to build, all already covered by the existing toolkit:

| App | What it shows | Status |
|---|---|---|
| Suisei (teaching agent) | An AI agent that uses the Sui Stack to teach the Sui Stack: 7 quests plus 1 graduate quest, each ending with a real testnet deploy and a soulbound badge. | Brand and Move badge module ready; app pending. |
| MnemoSui | An agent's memory as an NFT: conversation history and embeddings stored on Walrus, indexed on Sui, transferable between Claude, ChatGPT, or your own client. | Move module and Seal needed before build. |
| TxLens | Look before you sign: paste raw tx bytes, get a plain-English plan, simulation, and a risk verdict before a single byte is signed. | Ships entirely on the existing toolkit, no new Move code needed. |

And on the wallet side:

- Tier 2, Policy Vault (Move). Per-tx and 24h spend limits, recipient
  allowlist, expiry, enforced on-chain.
- Tier 3, Multisig Co-Signer. 2-of-2 native multisig with a small policy
  service as the second key, for off-chain velocity and anomaly checks
  the chain can't see.

Details in [`PLAN.md`](PLAN.md) and the [`docs/`](docs) design files.

## Development

```bash
git clone https://github.com/eienel/suisei
cd suisei

# build both published packages
npm run build:mcp
npm run build:signer
```

Each package has its own test loop and `tsc` build. See
[`packages/mcp/README.md`](packages/mcp/README.md) and
[`packages/agent-signer/README.md`](packages/agent-signer/README.md).

## License

MIT.
