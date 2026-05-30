# MnemoSui — a permanent, portable brain for AI agents

A showcase app for `@suisei/sui-skills-mcp`. The pitch: every AI agent
forgets, and the memory they do have is locked inside one vendor's app.
MnemoSui gives an agent a brain it actually owns — conversation history,
knowledge, embeddings, files — stored on **Walrus**, indexed on **Sui** as
a transferable object. Move the agent between Claude, ChatGPT, or your own
client. Sell, gift, or revoke memories on-chain. Mint a "I remember this
conversation" badge as proof.

This document is the scope sketch we keep so the idea doesn't evaporate.
Implementation lives in `apps/mnemosui/` whenever we build it.

## Why this is a strong demo for the MCP

Hits three Sui primitives at once: **Walrus** (storage), **owned objects /
dynamic fields** (the index), **NFT-style transfer** (portability). And it
gives a clear answer to the "what's the agent × crypto story" question
every Sui hackathon judge will ask.

## The user model

- A user owns a `MemoryBook` (a Sui object). It belongs to them; an agent
  can read it and append to it only with their consent.
- Each "memory" is a small JSON record `{ blob_id, tag, timestamp, hash }`
  attached to the MemoryBook as a **dynamic field**. The content itself
  lives on Walrus, identified by `blob_id`.
- The agent retrieves by listing the MemoryBook's dynamic fields and
  `walrus_fetch`-ing the ones that match a tag or recency filter.
- The user can `sui_transfer` the MemoryBook to someone else — their
  agent now reads the same memories. (NFT semantics, but for personal
  knowledge.)
- Tier 2 of the agent wallet (when shipped) lets the user set an "append
  budget" — the agent can write up to N entries per day before needing a
  signature.

## On-chain shape (Move sketch)

```move
module mnemosui::memory_book {
    use sui::table::{Self, Table};
    use std::string::String;

    public struct MemoryBook has key, store {
        id: UID,
        owner: address,             // matches the object owner; convenience field
        created_at_ms: u64,
        memory_count: u64,
        index: Table<u64, Memory>,  // append-only log
    }

    public struct Memory has store, drop {
        blob_id: String,            // Walrus blob id
        tag: String,                // e.g. "chat", "fact", "embedding-shard"
        timestamp_ms: u64,
        content_hash: vector<u8>,   // sha256 of the stored content
        encrypted: bool,            // true once Seal is wired in
    }

    public fun create(ctx: &mut TxContext): MemoryBook { /* … */ }
    public fun append(book: &mut MemoryBook, blob_id: String, tag: String,
                      content_hash: vector<u8>, encrypted: bool, clock: &Clock, ctx: &mut TxContext) { /* … */ }
    public entry fun forget(book: &mut MemoryBook, index: u64) { /* … */ }
}
```

A more advanced version replaces `index: Table<u64, Memory>` with a
content-addressed `Table<vector<u8>, Memory>` so dedupe is free.

## MCP toolset already covering this

| Need                                 | Existing MCP tool                       |
| ------------------------------------ | --------------------------------------- |
| Store opaque memory content          | `walrus_publish`                        |
| Retrieve memory content              | `walrus_fetch`                          |
| Create the MemoryBook object         | `sui_move_call` → `memory_book::create` |
| Append a memory                      | `sui_move_call` → `memory_book::append` |
| List memories                        | `sui_get_dynamic_fields(parent_id)`     |
| Read one memory record               | `sui_get_object(child_id)`              |
| Transfer the book to another wallet  | `sui_transfer`                          |
| Verify "agent did this"              | `sui_query_events` on `memory_book` events |
| Pretty-show what the agent will sign | `sui_decode_tx_bytes`                   |
| Bound the agent's autonomous writes  | Tier-1 agent wallet (shipped)           |

## Gaps to close before MnemoSui actually ships

1. **Seal integration** — `seal_encrypt(plaintext, policy) -> sealed` and
   `seal_decrypt(sealed) -> plaintext`. Without it, memories are public.
   Listed as v0.3 in the MCP roadmap.
2. **Memory-book helper tools** — `memory_book_create`, `memory_append`,
   `memory_list`, `memory_fetch`. We *can* run on `sui_move_call` +
   dynamic-fields plumbing, but a thin wrapper is the DX difference
   between "neat idea" and "first-class app." Build these once the Move
   module exists.
3. **Bulk Walrus** — multi-blob publish would speed first-time imports
   (e.g. importing a ChatGPT export).
4. **Embeddings on-chain** — if we want semantic search inside Sui, we'd
   need either small embeddings in a dynamic field per memory or a hash
   index. Stretch goal.

## Build order (when we pick it up)

1. **Move module** (`move/mnemosui/`) — `MemoryBook`, `Memory`, `create`,
   `append`, `forget`, events. Move tests.
2. **MCP helper tools** — the four memory_* wrappers above.
3. **Frontend** (`apps/mnemosui/`) — Suisei-style React app with three
   pages: a chat that auto-appends memories, a memories browser
   (timeline + tags + search), and a transfer flow.
4. **Seal** — encrypt memory content before `walrus_publish`, decrypt on
   `walrus_fetch`. Per-memory access policies (owner-only by default).
5. **Demo script** — record a 2-minute video: chat with the agent → walk
   over to a second machine → transfer the MemoryBook → agent recognises
   you and continues the conversation.

## Why not start now

We're publishing the MCP to npm first. MnemoSui needs the MCP we're
publishing, so we want the public version stable before building on it.
After publish: this is the showcase that proves the toolkit is real.
