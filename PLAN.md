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
- `web/` - the landing page and showcase (Next), which also serves the
  remote MCP endpoint at `/api/mcp`.
- `move/suisei_badge` - the soulbound completion badge module.
- `docs/` - design docs for the showcase apps.

The only frontend here is the `web/` landing page. The showcase apps
themselves, when built, live in their own repositories.

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

## Open questions

- **TxLens hosting for v1:** chat-command-only (just the prompt), or a
  thin hosted page.
- **MnemoSui Move strategy:** one package with `memory_book`, vs. folding
  into a broader showcase package.
- **Seal:** ship MnemoSui plaintext first and add Seal after, or block
  MnemoSui on Seal.
- **memory_* helper tools:** add DX wrappers, or keep MnemoSui on raw
  `sui_move_call`.
