# mnemosui

The Move package behind MnemoSui: an agent's memory as an owned,
transferable Sui object. Content lives on Walrus; this package is the
on-chain index.

## What's in it

- `MemoryBook` (`key + store`) - the brain. Owned and transferable.
- `Memory` - one index entry `{ blob_id, tag, timestamp_ms, content_hash,
  encrypted }`, stored as a dynamic field on the book.
- `create` / `append` / `forget` entry functions, plus views.
- Events: `MemoryBookCreated`, `MemoryAppended`, `MemoryForgotten`.

`encrypted` is a flag for a future Seal integration; this module does not
encrypt anything. Until Seal lands, store plaintext blob ids and pass
`encrypted = false`.

## Build & test (local)

```bash
cd move/mnemosui
sui move build
sui move test
```

## Publish (testnet)

```bash
sui client switch --env testnet
cd move/mnemosui
sui move build
sui client publish --gas-budget 200000000
```

Copy the created **Package ID** - the agent uses it as the `package` in
every `sui_move_call`. The module is `memory_book`.

## How the MCP drives it (no new tools needed)

| Action | MCP call |
|---|---|
| Store memory content | `walrus_publish` -> returns `blob_id` |
| Create a MemoryBook | `sui_move_call` -> `<pkg>::memory_book::create` |
| Append a memory | `sui_move_call` -> `<pkg>::memory_book::append` |
| List memories | `sui_get_dynamic_fields` on the book id |
| Read one memory | `sui_get_object` on the child field id |
| Transfer the brain | `sui_transfer` the book object |
| Fetch content back | `walrus_fetch` with the `blob_id` |
| Verify "agent did this" | `sui_query_events` on `memory_book` events |

`create` and `append` need the shared `Clock` object at
`0x6` as the `clock` argument.

## Notes

- `forget` removes the on-chain index entry only; the Walrus blob is not
  deleted. `memory_count` is never decremented, so indices stay stable.
- `MemoryBook` is transferable by design - that portability is the point.
  It is not soulbound (contrast `suisei_badge`, which is `key`-only).
