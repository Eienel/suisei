# @suisei/agent-signer

The non-custodial signer for a **Tier-1 Sui agent wallet**.

[`@suisei/sui-skills-mcp`](../sui-skills-mcp) builds *unsigned* transaction
bytes and never holds a key. This package is the one piece that does: it
generates the agent's keypair, stores it **encrypted on your machine**, and
signs builder bytes. The plaintext key is created here, used here, and
**never crosses a process boundary** — it never travels through an MCP
response or into an LLM's context.

## What "Tier-1 agent wallet" means

A real Sui wallet the agent fully controls, funded with a small allowance.
The agent can stake, transfer, swap — anything — but only up to its
balance. Blast radius = what you fund. Refill to extend, sweep to revoke.
Your main wallet is never touched: the agent has its own freshly-generated
key, and your owner key stays in your real wallet.

## Install

```bash
npm install -g @suisei/agent-signer
```

## Use

Set a passphrase (encrypts the key at rest) and create the wallet:

```bash
export AGENT_WALLET_PASSPHRASE="something-long-and-private"
agent-signer create
# -> { "address": "0x…", "path": "~/.suisei/agent-wallet.json" }
```

Then the loop with Claude + the MCP:

1. Ask the agent to fund it: it calls `agent_wallet_fund` (owner-signed) so
   your real wallet sends SUI to the agent address.
2. Ask the agent to act, e.g. *"stake 1 SUI to the top validator from my
   agent wallet"* — it builds the tx and gives you `tx_bytes_base64`.
3. Sign with the agent key:
   ```bash
   agent-signer sign <tx_bytes_base64>
   # -> { "signature": "…" }
   ```
4. Tell the agent to `sui_execute_signed_tx` with that signature.

To revoke, ask the agent for `agent_wallet_sweep` (drains the wallet back to
you), sign it, submit, and stop funding.

## You own the key — back it up or move it

The wallet isn't locked inside this tool. The private key is yours,
encrypted under your passphrase, and you can take it out anytime:

```bash
agent-signer export
# -> { "address": "0x…", "secret_key": "suiprivkey1…", "warning": "…" }
```

That `suiprivkey1…` is a standard Sui secret. Import it into **Sui Wallet**,
**Suiet**, or the CLI (`sui keytool import "<suiprivkey1…>" ed25519`) and
you have the same wallet there. Back it up offline — anyone holding it
controls the wallet.

Bring your own key instead of generating one:

```bash
agent-signer import "suiprivkey1…"
```

Because the key is exportable, losing the keystore file isn't fatal **if
you backed up the export**. If you didn't and you lose the file or
passphrase, the agent wallet is gone — but it only ever holds an allowance,
so create a fresh one and refund. Your owner wallet is untouched.

## Configuration

| Env / flag | Default | Meaning |
| --- | --- | --- |
| `AGENT_WALLET_PASSPHRASE` / `--passphrase` | — (required) | Encrypts/decrypts the key |
| `AGENT_WALLET_PATH` / `--path` | `~/.suisei/agent-wallet.json` | Keystore location |

## Security model

- **Ed25519** key, sealed with **AES-256-GCM** under a **scrypt**-derived
  key (N=32768). Keystore written `0600`.
- Wrong passphrase → decryption fails closed (GCM auth tag).
- `create`/`address` emit only the public address; `sign` emits only a
  signature. The raw secret is revealed only by an explicit `export` (with
  a warning) — never incidentally, and never to the MCP or an agent.
- Lose the keystore or passphrase and the agent wallet is gone — by design
  it holds only an allowance, so create a fresh one and refund. Your owner
  wallet (in your real wallet app) is unaffected.

This is **Tier 1** of the agent-wallet design. On-chain policy limits
(Tier 2) and a multisig co-signer (Tier 3) layer on top — see
[`docs/AGENT_WALLET_DESIGN.md`](../../docs/AGENT_WALLET_DESIGN.md).

## License

MIT.
