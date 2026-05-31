# suisei_badge

The soulbound badge minted at the end of every Suisei quest.

## Publish (testnet)

```bash
sui client switch --env testnet
cd move/suisei_badge
sui move build
sui client publish --gas-budget 200000000
```

Copy the **Created Object -> Package ID** into `.env.local`:

```
VITE_BADGE_PACKAGE_ID=0x...
```

## Verify it's soulbound

The `Badge` struct has only `key` (no `store`). The Move compiler
will reject any user-written transfer attempt. That's the whole
point of Quest 5.
