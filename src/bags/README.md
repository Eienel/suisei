# Bags integration

This folder is the **only** place the rest of the app touches Solana / Bags.
Sprint 4 wires both candidate hooks (gated cosmetics + mint-on-completion) so
neither path blocks on the parked decision. The UI is graceful before any
real token / SDK exists.

## Files
- `BagsProvider.tsx` — wraps the sandbox in `ConnectionProvider`,
  `WalletProvider`, and `WalletModalProvider`. Wallet Standard auto-discovers
  Phantom / Backpack / Solflare etc.
- `useBags.ts` — exposes `wallet`, `holdsToken`, `blockBalance`, `cosmetics`,
  `connect`, `disconnect`, `mintBadge`. Reads `VITE_SOLANA_RPC_URL` and
  `VITE_BLOCK_TOKEN_MINT` from env.

## Status of each candidate hook
**1. Token-gated cosmetics — wired.**
Holders of $BLOCK get the `gold-stud` brick skin. Implementation:
- `useBags()` queries `getParsedTokenAccountsByOwner(wallet, { mint })`
- If balance > 0, returns `cosmetics: ['gold-stud']`
- `GameShell` broadcasts `SET_COSMETIC` over the EventBus
- Phaser `Brick.applyCosmetic(skin)` re-renders studs in gold

**2. Mint-on-completion — UI wired, SDK call stubbed.**
When all 10 lessons are unlocked, the HUD shows a "Mint $BLOCK Builder
Badge" CTA. Click → `useBags().mintBadge()`. The hook currently logs a
warning and returns `null`. **Drop in the real Bags SDK call here**
(see TODO in `useBags.ts`). The CTA reflects mint state in real time.

## To activate before launch
1. Pin a $BLOCK mint address → set `VITE_BLOCK_TOKEN_MINT` in `.env`
2. Choose an RPC → set `VITE_SOLANA_RPC_URL` (don't ship to mainnet on the
   public devnet endpoint)
3. Replace the `mintBadge()` stub with the real Bags SDK call. Return
   `{ tx: signature }` on success so the HUD can show a confirmation.

## Why a hook (not a context)
We may end up with both modes. Keeping the surface as a single hook means
components only import one thing and we can swap implementations without
restructuring the tree.
