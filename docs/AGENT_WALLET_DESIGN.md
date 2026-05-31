# Agent Wallet - Design

A wallet an AI agent can sign with, without ever touching the user's main key.
Three composable tiers. You pick how much rope to give the agent.

## The non-negotiables

1. **The MCP never holds a key.** Tx-builder tools still return unsigned bytes.
   The agent signs from a separate host component.
2. **The owner's key never touches the agent.** Importing a user key *into the
   agent* would erase every safety property below. Owner key is for setup,
   revocation, and withdrawal - that's it.
3. **The agent always has its *own* freshly-generated key.** Bounded loss
   comes from limiting what that key controls, not from sharing.

## Tier 1 - Allowance Wallet (v1, ships first)

The minimum-viable agent wallet. No Move code. Works today.

- Owner clicks "create agent wallet". App generates a fresh Sui keypair.
- Owner funds it with a chosen amount (e.g. 5 SUI). That's the agent's
  pocket money.
- Agent has **full wallet capability** over this wallet - stake, transfer,
  swap, anything - because it's a real wallet with a real key it owns.
- Blast radius = the balance. Owner refills when empty. Owner sweeps it
  back to revoke ("send all SUI back to me" tx).

### What the agent can do

Everything the existing 24-tool MCP exposes. The agent calls the same
builders (`sui_stake`, `sui_transfer`, `sui_deepbook_swap`, ...) with
`sender = agent_wallet_address`, signs locally, submits. Identical flow
to a human user - just with a small wallet.

### Importing wallets (Tier 1)

- **Owner side**: connect any wallet (Sui Wallet, Suiet, hardware) via
  `@mysten/dapp-kit`. That key signs the initial fund-the-agent transfer.
  Never leaves the wallet. **No raw key import for the owner** in v1 - too
  easy to leak.
- **Agent side**: always freshly generated. No import path. Storing the
  agent key:
  - **Local dev**: encrypted file in the app's data dir, unlocked with an
    OS keychain entry (`keytar` on desktop, Keychain/CredMgr/secret-service).
  - **Browser**: WebCrypto non-extractable key in IndexedDB.
  - **Server-side agents**: env var or a KMS reference; never logged.

### Tier-1 MCP surface (shipped)

These wrap the existing tools to make the "agent wallet" abstraction
explicit. **All return unsigned bytes - no keys in the MCP.**

| Tool | What it does |
| --- | --- |
| `agent_wallet_fund` | Build an owner-signed tx sending SUI -> agent wallet (sets the allowance) |
| `agent_wallet_sweep` | Build an agent-signed tx returning everything to the owner (the kill switch) |
| `agent_wallet_status` | Read the agent wallet's balance + whether it's funded |

**Key generation is *not* an MCP tool - on purpose.** A `create` tool
would have to return the private key *through the MCP response*, which
means it lands in the agent's / LLM's context and logs. That's the exact
leak we're avoiding. So creation and signing live in a separate package,
`@suisei-mcp/agent-signer`, run locally:

- `agent-signer create` - generate an Ed25519 keypair, seal it with
  AES-256-GCM under a scrypt-derived passphrase key, write it `0600` to
  `~/.suisei/agent-wallet.json` (override via `AGENT_WALLET_PATH`). Prints
  **only the address**.
- `agent-signer address` - print the agent wallet address.
- `agent-signer sign <txBytesBase64>` - decrypt in-process, sign builder
  bytes, print the base64 signature for `sui_execute_signed_tx`.

Strict separation: the signer is the only thing that ever holds a
plaintext key, and that key never crosses a process boundary into the
MCP or the model.

## Tier 2 - Policy Vault (opt-in, on-chain limits)

For users who want trustless limits even on the agent wallet. Custom Move
in `move/agent_wallet/`.

```
OwnerCap ──controls──> Vault (shared) { balance, policies: Table<addr, Policy> }
                              ▲
                              │ sender = agent address (from Tier 1)
                              │
                      agent_transfer / agent_stake (gated by Policy)
```

A `Policy` per agent address records:

- `per_tx_limit` - biggest single spend allowed
- `daily_limit` + rolling 24h window via `Clock`
- `allowed_recipients` (empty = anywhere)
- `expires_at_ms` - power lapses automatically

Owner functions (require `OwnerCap`): `grant`, `revoke`, `deposit`,
`withdraw`. Agent functions (require sender in policy table):
`agent_transfer`, `agent_stake` (v1 scope - covers the staking app),
`agent_unstake`.

**Composes with Tier 1**: the agent key is the same key from Tier 1; it
just spends *via the vault* instead of from its own balance.

### Tier-2 MCP additions

`agent_vault_create`, `agent_vault_grant`, `agent_vault_revoke`,
`agent_vault_deposit`, `agent_vault_withdraw`, `agent_vault_spend_*`,
`agent_vault_status`.

## Tier 3 - Multisig Co-Signer (opt-in, off-chain policy)

For users who want a second pair of eyes on every signature, with
real-time/anomaly checks the chain can't see (velocity, time-of-day,
human-in-the-loop above a threshold). Sits *on top of* Tier 1 or Tier 2.

- Sui 2-of-2 native multisig: `agent_key` + `policy_key`.
- The multisig derives to a single address. Tier 1: that address holds
  the balance. Tier 2: the vault grants to that address.
- A small `agent-cosigner` service holds `policy_key`, runs off-chain
  checks, and co-signs only when they pass. Owner can pause it instantly.

### The compromise table (Tier 1 + 2 + 3 stacked)

| Compromised | Worst case |
| ---: | --- |
| Agent key only | Nothing. Multisig invalid without co-signer. |
| Policy server only | Nothing. Can't initiate, only co-sign what the agent proposed. |
| Both off-chain parties | Bounded by Tier-2 policy: per-tx, daily, allowlist, expiry. Owner revokes on-chain. |
| Owner key | Full control - as expected. Never given to agent or MCP. |

Two independent gates would have to fall to lose a single coin, and the
damage is still capped and revocable.

## Design decisions (locked)

- **2-of-2** multisig in Tier 3 (max safety; if co-signer is down, owner
  can recover via on-chain revoke + redeploy).
- **Rolling 24h** via `Clock` in Tier 2 (predictable per-grant; not tied
  to epoch boundaries).
- Tier 2 wraps **transfer + stake/unstake** in v1. Arbitrary Move calls
  are deferred - bounding those safely is a separate hard problem.

## Build order

1. ~~**Tier 1 MCP tools + `agent-signer` package**~~ - **DONE.**
   `agent_wallet_fund` / `agent_wallet_sweep` / `agent_wallet_status` (keyless
   builders in the MCP) + `@suisei-mcp/agent-signer` (encrypted local keystore,
   create / address / sign CLI). Next: a "create agent wallet" UI flow in the
   Suisei app and an end-to-end testnet stake flow from chat.
2. **Move `agent_wallet` module** - `Vault`, `OwnerCap`, `Policy`, grants,
   spends. Move tests.
3. **Tier 2 MCP wrappers** - keyless builders for grant/revoke/spend.
4. **`agent-cosigner` service + Tier 3 wiring** - only if Tier 2's
   per-action wrapping proves too narrow in practice.

## Out of scope (v1)

- Arbitrary Move calls under Tier 2 limits.
- Cross-chain. Sui-only.
- Recovery via social/zkLogin for the owner key (use a real wallet).
- Encrypted storage for the agent key beyond OS keychain / WebCrypto.
