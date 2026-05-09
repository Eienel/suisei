# BlockBuilders

> think Lego but for crypto · `$BLOCK`

A snap-bricks-together web game that teaches blockchain concepts. Built for the
Bags hackathon. Audience: kids 8–14 + curious adults.

- **One mode:** Build-a-Blockchain sandbox
- **8 brick types:** wallet, block, transaction, token, validator, miner, smart contract, oracle
- **10 micro-lessons** unlocked by snapping the right brick combos
- **Web only.** No install, no backend, single-player
- **Bags hook:** $BLOCK holders unlock cosmetic bricks; 100% completion unlocks a "Builder Badge" mint

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production bundle (manual chunks)
npm run preview    # serve the production bundle
npm run typecheck
```

## Stack

- **Vite + React 18 + TypeScript** for the shell
- **Phaser 3** for the canvas (drag, snap, fuse, glyphs)
- **Tailwind** with brand tokens (electric blue / warm yellow / cream / Nunito)
- **Zustand** (persisted to localStorage) as the single source of truth
- **`mitt`** as a typed EventBus — the React ↔ Phaser seam
- **Solana wallet adapter** + Wallet Standard (Phantom / Backpack / Solflare)
- **WebAudio** for procedural SFX (no audio files)

The landing page is ~156 KB; Phaser + Solana load only when you enter the
sandbox via `React.lazy` + manual chunks.

## Project map

```
src/
├── components/   React shell — Landing, GameShell, BrickPalette, LessonModal, LessonsPanel
├── game/         Phaser side
│   ├── bricks/   Brick definitions (data-driven) + GameObject + glyph drawing
│   ├── scenes/   BootScene + SandboxScene (collision, fuse, removal, cosmetics)
│   ├── events.ts Typed mitt EventBus
│   └── PhaserGame.ts
├── data/         lessons.ts — registry of 10 lessons, each with a triggerCombo
├── lessons/      detect.ts (multiset combo matcher) + useLessonUnlock hook
├── audio/        sfx.ts — WebAudio procedural SFX + mute toggle
├── state/        Zustand store, persisted (placedBricks, unlockedLessons, screen)
├── bags/         BagsProvider + useBags + integration notes
└── types.ts
```

## Environment

Copy `.env.example` to `.env` and fill in when these exist. Without them, the
sandbox runs and the wallet connects, but token gating and badge mint are
inert — the UI surfaces this gracefully.

```
VITE_SOLANA_RPC_URL=
VITE_BLOCK_TOKEN_MINT=
```

## Deploy

The repo ships a `vercel.json`. Easiest path:

1. Push to GitHub (already on `claude/scaffold-blockbuilders-mvp-Av5g1`)
2. Import the repo in Vercel — framework auto-detects as Vite
3. Add `VITE_SOLANA_RPC_URL` and `VITE_BLOCK_TOKEN_MINT` in Project Settings → Env
4. Every push gets a preview URL; merge to main → production

Equivalent fallbacks: Netlify, Cloudflare Pages (`npm run build` → publish `dist/`).

## Roadmap (shipped)

- ✅ **Sprint 0 — Scaffold**: Vite + React + TS + Phaser + Tailwind, landing, sandbox stub, brick palette, Bags stub, lessons stub
- ✅ **Sprint 1 — Mechanics**: collision detection, fuse adjacency, brick removal (right-click + long-press), mobile touch hardening
- ✅ **Sprint 2 — Lesson engine**: multiset combo matcher, queue-driven LessonModal, full LessonsPanel review screen
- ✅ **Sprint 3 — Polish**: per-brick glyphs, WebAudio SFX, lesson copy pass, OG image, code-split (landing 156 KB)
- ✅ **Sprint 4 — Bags integration**: real wallet connect, $BLOCK SPL balance check, gold-stud cosmetic skin, mint-badge CTA (SDK call stubbed)
- ✅ **Sprint 5 — Ship**: manual chunks, `vercel.json`, `DEMO.md` storyboard, README finalize

## What's next (post-hackathon)

- Drop the real Bags SDK call into `useBags.mintBadge()` (one TODO comment marks the spot)
- Two more cosmetic skins (`holo`, `neon`) tied to balance tiers
- Camera pan / pinch zoom for larger boards
- Sprite-based brick art replacing the primitive glyphs
- Multiplayer "trade-bricks" mode (out of scope for the MVP)

## Demo

See [`DEMO.md`](DEMO.md) for the ~90-second hackathon submission storyboard.

## Branch convention

Development happens on `claude/scaffold-blockbuilders-mvp-Av5g1` until merge.
