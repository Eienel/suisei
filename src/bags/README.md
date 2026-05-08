# Bags integration (Sprint 4 plug point)

This folder is the **only** place the rest of the app touches Solana / Bags.
Sprint 0 ships it as a stub so we can scaffold without committing to a hook
shape yet. Everything below is the contract Sprint 4 will fulfill.

## Decision still parked
Pick one (or both):

- **Token-gated cosmetics** — holders of $BLOCK get gold-stud / holo / neon
  brick skins in the palette. Lower stakes, more "always on" reward.
- **Mint-on-completion badge** — finishing all 10 lessons unlocks a
  "$BLOCK Builder" mint. Higher stakes, single climactic moment.

## Sprint 4 checklist
- [ ] Wrap `<App />` in `ConnectionProvider` + `WalletProvider` from
  `@solana/wallet-adapter-react` (already installed).
- [ ] Replace `useBags()` stub with a real hook that:
  - exposes `connect / disconnect` via the wallet adapter modal
  - reads $BLOCK balance for `holdsToken`
  - returns the cosmetics the wallet is entitled to
  - implements `mintBadge()` against the Bags SDK
- [ ] Add a "Connect Wallet" button to `GameShell` HUD.
- [ ] If gating cosmetics: filter `BRICK_DEFS` cosmetic skins by `holdsToken`.
- [ ] If minting: when `unlockedLessons.length === LESSONS.length`, show a
  "Mint $BLOCK Builder Badge" CTA in the HUD.

## Why a hook (not a context)
We may end up with both modes. Keeping the surface as a single hook means
components only import one thing and we can swap implementations without
restructuring the tree.

## Env vars (when we wire it)
```
VITE_SOLANA_RPC_URL=
VITE_BLOCK_TOKEN_MINT=
VITE_BAGS_API_KEY=
```
Add to `.env.example` when known. Never commit real values.
