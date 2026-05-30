# TxLens — "look before you sign" wallet guard

A showcase app for `@suisei-mcp/mcp`. The pitch: half of Web3
hacks happen because users sign transactions they don't understand —
wallet UIs show "Approve transaction" with a hash, and people click
through. TxLens is a chat-native (and later browser-extension) pre-flight
check: paste any unsigned tx bytes from any dApp, an agent decodes them
into plain English, simulates them, cross-references the objects and
contracts touched, and gives a verdict before you sign.

This document is the scope sketch we keep so the idea doesn't evaporate.
Implementation lives in `apps/txlens/` whenever we build it.

## Why this is a strong demo for the MCP

It is the *defensive* agent — the use case crypto-curious normies
immediately understand. It also flexes the new `sui_decode_tx_bytes`
tool, which no other Sui MCP has. And it requires **zero new Move code**
to ship a v1: it's pure MCP composition. That's the best kind of demo —
"look what the existing toolkit can already do."

## The user model

- User is about to sign a tx in some wallet UI (Sui Wallet, Suiet, an
  in-app prompt). The UI shows the tx bytes (most do, behind a "raw" or
  "advanced" tab).
- User pastes the `tx_bytes_base64` into TxLens (chat command, browser
  extension popup, or a hosted page).
- TxLens replies with: a plain-English step-by-step, a simulated outcome
  (balance changes, objects created/destroyed), and a **verdict** with
  reasoning ("safe — known DeepBook swap" / "warning — transfers to
  a wallet less than 24 hours old" / "danger — calls a function that
  drains every coin you own").
- User decides: sign, cancel, or escalate.

The whole flow happens *before* a single byte is signed. Nothing leaves
the chain because nothing has been submitted; nothing leaves the user
because no key was ever touched. TxLens never sees the signing key — by
construction, it doesn't need one.

## Architecture

```
   wallet UI (any)
       │
       │ raw tx_bytes_base64
       ▼
    TxLens
       │
       ├──► sui_decode_tx_bytes      → step-by-step plain-English plan
       ├──► sui_dry_run              → simulated balance / object changes + gas
       ├──► sui_get_object(...)      → for each object touched: owner, type, age
       ├──► sui_get_transaction(...) → for each package called: when was it published?
       ├──► sui_query_events(...)    → has this package emitted suspicious events recently?
       │
       ▼
   risk engine (rules + LLM reasoning)
       │
       ▼
   verdict + explanation + diff
```

## MCP toolset already covering this

| Need                                              | Existing MCP tool                |
| ------------------------------------------------- | -------------------------------- |
| Turn bytes into a human plan                      | `sui_decode_tx_bytes` (v0.2)     |
| Simulated outcome (no spend)                      | `sui_dry_run`                    |
| Inspect every object the tx touches               | `sui_get_object`                 |
| "Who deployed this package & when"                | `sui_get_transaction` on the package's publish digest (via `sui_get_object` on the package itself) |
| Recent activity of a contract                     | `sui_query_events` (MoveModule)  |
| Resolve recipient SuiNS names                     | `sui_resolve_address`            |
| Confirm coin amounts have sane decimals           | `sui_get_coin_metadata` / `sui_resolve_coin` |
| Show the user the diff post-fact (optional audit) | `sui_get_transaction(digest)` after they sign |

All of this is shipped. v1 is feasible with the MCP we have today.

## The risk engine (v1 = heuristics + LLM)

The interesting work is **what counts as risky**. v1 is a rule book plus
LLM reasoning on the decoded plan; we don't need ML, we need crisp,
explainable signals. Rules to start:

- **Object drains.** Any `TransferObjects` where the address is *not* the
  sender and the object set is "large" (>N owned objects, especially
  whole gas coin transfer to a non-self address) → loud warning.
- **Sweeping move-calls.** Function names matching `drain`, `withdraw_all`,
  `unstake_all`, `set_owner` are surfaced verbatim — the agent doesn't
  rule on intent, it just makes the user read what they're about to do.
- **Fresh contracts.** Package published less than `T` hours ago →
  caution. Brand-new doesn't mean malicious, but the user should know.
- **No prior interactions.** If the sender has never touched this
  package before and the package has had fewer than `N` recent events,
  flag for review.
- **Coin sanity.** If a transfer amount looks off by 10^9 vs. the coin's
  decimals (suggests a UI bug or a deliberate trick), warn.
- **SuiNS displacement.** A recipient that looks like a confusable
  homoglyph of a known address gets flagged.
- **Self-signed read-only.** Pure read patterns (devInspect-shaped txs)
  get marked **safe** quickly — fast path.

The LLM step on top: take the decoded plan + the heuristic flags + the
contract metadata, produce a 2–3 sentence summary the user actually
reads. The agent is the *narrator*, not the rulebook.

## v1 vs v2

**v1** (~ a long weekend): hosted web page + an MCP-driven chat command.
User pastes bytes, gets a verdict. No Move code. Ships entirely on the
existing toolkit.

**v2**: browser extension that intercepts the wallet's tx-bytes popup,
auto-pastes, shows the verdict inline. Same backend, better UX.

**v3** (optional, Move): a community `TxRiskRegistry` — anyone can flag a
package id with evidence (a tx digest, a screenshot blob on Walrus), and
the registry stores `{ package_id, flagger, reason_blob_id, votes }`.
TxLens consults the registry for an extra signal. Adds a "Yelp for smart
contracts" element. Not v1.

## Gaps to close (deferred until we actually build)

1. **A package-creation-time helper.** "When was this package published?"
   is a recurring need. Either fold into `sui_get_object` (it already
   returns the previousTransaction for the package) or add a small
   `sui_get_package_info` wrapper. Cheap.
2. **A "has the sender interacted with this package before?" shortcut.**
   Composable from `sui_query_events(sender)` filtered to package, but
   a named tool would be clearer. Defer until used.
3. **Tier-2 agent wallet integration** (later) for *auto-block mode*:
   if TxLens runs as a co-signer in a multisig flow, it can refuse to
   co-sign txs that fail its rules, not just warn.

## Why not start now

We're publishing the MCP to npm first. TxLens is the strongest
demonstration that the published toolkit is enough to build a real
product on — so it makes more sense as the post-publish showcase
alongside MnemoSui. Two showcases:

- **MnemoSui** — what an agent can *do* with Sui (storage, ownership,
  transfer).
- **TxLens** — what an agent can *protect you from* on Sui.

Together they cover the two arcs every hackathon judge cares about:
new capability and safety.
