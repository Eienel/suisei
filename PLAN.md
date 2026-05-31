# Suisei - Build Plan

> Sui's agent toolkit. The MCP server is the product; the apps are showcases.
> Built for Sui Overflow 2026 / Agentic Web track / target June 20.

---

## What this repo is now

The BlockBuilders teaching game that used to live here has been stripped
out (preserved in a separate backup). This repo is now the **Suisei MCP
toolkit** and nothing else:

- `packages/mcp` - `@suisei-mcp/mcp`, the MCP server (33 tools).
- `packages/agent-signer` - `@suisei-mcp/agent-signer`, the non-custodial
  local signer.
- `api/mcp.ts` - the same server as a Vercel Node serverless function.
- `move/suisei_badge` - the soulbound completion badge module.
- `docs/` - design docs for the showcase apps.

There is no frontend in this repo. The showcase apps, when built, live in
their own `apps/*` directories.

---

## Vision

The product is the **MCP toolkit**: the Sui Stack as one-line tools, so
any AI agent (Claude Desktop, Claude web/mobile, Cursor, a custom bot)
can read, build, simulate, sign, and submit on Sui. Two packages on npm,
built on two non-negotiables:

1. **The toolkit never holds private keys.** Every transaction-building
   tool returns unsigned `tx_bytes_base64`. The host signs; the MCP
   submits.
2. **Key material never enters an agent's context.** Key generation is
   not an MCP tool - it would land the secret in the LLM's prompt and
   logs. Signing lives in `agent-signer`, a separate local process.

On top of the toolkit sit **showcases** - proof that the published
toolkit is enough to build real products:

- **Suisei (teaching agent)** - an AI agent that uses the Sui Stack to
  teach the Sui Stack. The original concept; brought back as a showcase,
  not as the submitted product.
- **TxLens** - "look before you sign" tx guard. Pure MCP composition,
  zero new Move code.
- **MnemoSui** - an agent's memory as a transferable NFT (Walrus + Sui).
  Needs its own Move module deployed first.

---

## Context

Built for the Sui Overflow 2026 hackathon.

---

## The 33 tools (shipped today)

**Read - balances & coins:** `sui_get_balance`, `sui_get_all_balances`,
`sui_get_coins`, `sui_get_coin_metadata`, `sui_resolve_coin`.

**Read - objects & chain state:** `sui_get_object`,
`sui_get_owned_objects`, `sui_get_dynamic_fields`, `sui_get_transaction`,
`sui_query_events`, `sui_get_reference_gas_price`, `sui_resolve_address`.

**Read - staking / validators:** `sui_get_validators`,
`sui_get_validator`, `sui_get_validators_apy`, `sui_get_stakes`.

**Build (returns unsigned bytes):** `sui_transfer`, `sui_pay_many`,
`sui_move_call`, `sui_stake`, `sui_unstake`, `sui_mint_badge`.

**DeepBook:** `sui_deepbook_quote`, `sui_deepbook_swap`.

**Simulate / submit / inspect:** `sui_dry_run`, `sui_decode_tx_bytes`,
`sui_execute_signed_tx`.

**Walrus:** `walrus_publish`, `walrus_fetch`.

**Agent wallet (Tier 1):** `agent_wallet_fund`, `agent_wallet_status`,
`agent_wallet_sweep`.

**Badges:** `sui_get_owned_badges`.

---

## Roadmap (post-publish)

| Item | Status | Notes |
|---|---|---|
| `@suisei-mcp/mcp` 0.1.0 on npm | done | metadata only at 0.1.2 (URLs, docs) |
| `@suisei-mcp/agent-signer` 0.1.0 on npm | done | same |
| Publish 0.1.2 (URL + doc fixes) | pending | no new tools; see PUBLISH.md |
| TxLens v1 | not started | prompt-only; no new code or Move needed |
| MnemoSui Move module (`move/mnemosui`) | not started | the real blocker for MnemoSui |
| MnemoSui memory_* helper tools | not started | DX wrappers over `sui_move_call`; optional |
| Seal encrypt/decrypt tools | not started | v0.3; without it MnemoSui memories are plaintext |
| Tier 2 Policy Vault (Move) | designed | per-tx / 24h limits, allowlist, expiry |
| Tier 3 Multisig Co-Signer | designed | 2-of-2 with a policy service as second key |

---

## Demo plan (hackathon video)

The hero demo is: **watch an AI agent build a real Sui app live, with
on-chain results a judge can verify on Sui Explorer.** It proves the
toolkit is real and complete in a way a finished app cannot.

**Cold open** - the thesis + the Claude Desktop config snippet; the tools
appear after a restart.

**Act 1 - TxLens (the safety arc).** Paste raw `tx_bytes_base64`; the
agent calls `sui_decode_tx_bytes` -> `sui_dry_run` -> `sui_get_object` ->
`sui_query_events` and returns a verdict ("warning - transfers your whole
gas coin to a wallet 2 hours old"). Zero new Move code.

**Act 2 - MnemoSui (the capability arc).** `walrus_publish` a memory ->
`sui_move_call` to create + append on a pre-deployed `MemoryBook` (sign
the bytes with `agent-signer` on camera) -> `sui_get_dynamic_fields` to
list them back -> `sui_transfer` the book to a second wallet ("the
agent's brain just changed owners").

**Act 3 - the security spine.** The two non-negotiables on screen; the
agent-signer flow shown once more.

**Close** - `npm i -g @suisei-mcp/mcp`. It already ships.

### What is prompt-only vs. what needs prep

- **TxLens: prompt-only.** Every tool it needs ships today. A system
  prompt + the tx bytes to paste is the whole build. Record live.
- **MnemoSui: needs a pre-deployed Move module.** The MCP can *operate*
  MnemoSui (via `sui_move_call` + Walrus + dynamic-fields tools) but
  cannot *deploy* the `MemoryBook` package - there is no deploy tool, by
  design. Write `move/mnemosui/` and `sui client publish` it before the
  demo; then the live build is prompt-driven against the deployed
  package. Memories are plaintext until Seal lands.

### Recording notes

1. Dry-run the whole flow first; record the clean take. "Live" = real
   tools, real chain, not first attempt on camera.
2. Have testnet SUI in two wallets (owner + transfer recipient).
3. Cut to Sui Explorer every time a tx lands - that is the proof.
4. Keep the unsigned-bytes -> `agent-signer` moment visible; it is the
   single most differentiating frame.
5. Speed-ramp installs/faucet waits in the hero cut; keep one unedited
   long cut as backup.

---

## Definition of done (for the hackathon)

A judge can:

1. Add `@suisei-mcp/mcp` to Claude Desktop with the one-line config.
2. Ask Claude to read a balance, build a transfer, and dry-run it - and
   see real testnet results on Sui Explorer.
3. Watch the agent build TxLens live: paste tx bytes, get a verdict,
   with no new code.
4. Watch the agent run MnemoSui against the pre-deployed module: store a
   memory on Walrus, append it on-chain, transfer the MemoryBook.
5. See that signing happens in `agent-signer`, never in the MCP or the
   agent's context.

If those five work end-to-end on testnet, we ship.

---

## Open questions

- **TxLens hosting for v1:** chat-command-only (just the prompt) for the
  demo, or a thin hosted page? Prompt-only is enough to record.
- **MnemoSui Move strategy:** one package with `memory_book`, vs. folding
  into a broader showcase package.
- **Seal:** ship MnemoSui plaintext for the demo and add Seal after, or
  block MnemoSui on Seal? (Recommend: demo plaintext, label it clearly.)
- **memory_* helper tools:** worth adding for DX, or keep MnemoSui on raw
  `sui_move_call` for the demo? (Recommend: raw `sui_move_call` for the
  demo; wrappers later.)
