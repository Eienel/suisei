# BlockBuilders

> Learn crypto by building your own town. Onchain on Sui.

A learn-by-playing town builder. Read short lessons, answer multiple-choice
questions, and earn Tetris-style pieces you place anywhere on a 3D map.
Finish all six lessons and you've built — and own — a small crypto-themed
town that anyone can visit at a public URL.

Built for **Sui Overflow · AI track**.

## What's in

| Feature | How |
|---|---|
| **Lessons** | 6 districts (Wallets · Tokens · Smart Contracts · Validators · ZK · DeFi). Each: 1–2 read pages + 4-question quiz. |
| **Tetris-piece building** | Every correct answer hands you a piece (single block → 4-block tetromino). Rotate with `R`, click on the map to drop it. |
| **AI tutor** | "Explain it differently" button on every read page calls Gemini 2.5 Flash to rephrase the concept with a fresh metaphor. |
| **AI Builder Agent** | Sandbox mode (unlocks after 3 lessons). Prompt anything → AI returns structured JSON actions → world builds itself. |
| **Save to Sui** | World NFT minted/updated on Sui testnet. Metadata stored on Walrus. |
| **Open worlds** | Public read-only viewer at `/town/<address>` — anyone with the URL can walk around your town. |
| **Auth** | Enoki zkLogin (Google sign-in) + dapp-kit wallet, side-by-side. |

## Run

```bash
cp .env.example .env   # fill in GEMINI_API_KEY at minimum
npm install
npm run dev            # http://localhost:5173 — /api/* routes work locally via Vite middleware
npm run build
npm run preview
npm run typecheck
```

## Environment

```
GEMINI_API_KEY=                # server-only. /api/agent + /api/tutor.
                               # aistudio.google.com → free key.

VITE_SUI_NETWORK=testnet
VITE_WORLD_NFT_PACKAGE_ID=0x888787d0d2848499ba22fa09afdcbc593c3ba637d04807345abab501a1f56daf
VITE_ENOKI_API_KEY=            # optional — Google sign-in
VITE_ENOKI_GOOGLE_CLIENT_ID=   # optional
VITE_WALRUS_PUBLISHER_URL=     # optional — public testnet default
VITE_WALRUS_AGGREGATOR_URL=    # optional — public testnet default
```

## Stack

| Layer | Tech |
|---|---|
| Shell | Vite + React 18 + TypeScript + Tailwind |
| 3D | `@react-three/fiber` + `@react-three/drei` |
| State | Zustand (persisted) |
| AI | Google **Gemini 2.5 Flash** via Vercel Functions. Two routes: `/api/agent` (Builder Agent) + `/api/tutor` (lesson rephrasing). |
| Auth | `@mysten/dapp-kit` + `@mysten/enoki` |
| Storage | Walrus testnet HTTP publisher / aggregator |
| Chain | `@mysten/sui` programmable transactions, Move 2024 |

## Project map

```
api/
  agent.ts, tutor.ts         # Vercel Edge Functions
src/
  agent/                     # runAgent (builder) + runTutor (rephraser)
  audio/                     # procedural WebAudio sfx
  components/
    Landing                  # editorial hero
    LessonsList              # curriculum + save/share/auth
    LessonRead               # paginated read pages + AskTutor button
    LessonCheck              # quiz + live 3D world; correct = piece spawn
    LessonDone               # completion + onchain CTAs
    Sandbox                  # V1 AI builder
    VisitPage                # public read-only town viewer
    PieceGhost               # 3D ghost preview of the pending piece
    PlacementGrid            # raycast floor + ghost + commit-piece
    Block, BlockMaterial,    # block rendering
    BlockAccent, World
    AuthButton, SaveWorldButton, ShareButton, AskTutor, HowToModal,
    ErrorBoundary
  data/lessons.ts            # 6 lessons × 4 questions × piece rewards
  state/app.ts               # screen + lessons + correctlyAnswered
  state/world.ts             # blocks + pendingPiece (Tetris flow)
  sui/                       # config / providers / walrus / useSaveWorld
  world/
    pieces.ts                # piece library + rotation math
    blockTypes.ts            # 10 block categories + materials
    grid.ts
move/blockbuilders/          # published Move package source
```

## Three sentences

1. **Single source of truth** is `useWorld.blocks` — an array of `Block` records. Everything renders from it; the visit page reads the same shape from chain.
2. **Manual placement and AI builds share reducers** — `placeBlock` is called from quiz commits, from manual sandbox clicks, and from the AI executor. No bypass paths.
3. **Sui touches one folder.** `src/sui/` owns auth + Walrus + Move calls; the rest of the app stays chain-agnostic.

## Move package

Published to Sui **testnet**:
- Package: `0x888787d0d2848499ba22fa09afdcbc593c3ba637d04807345abab501a1f56daf`
- Module: `blockbuilders::world`
- Entry funcs: `mint_world(name, uri, block_count)`, `update_world(world, uri, block_count)`, `rename(world, name)`
- Events: `WorldMinted`, `WorldUpdated`

Source under `move/blockbuilders/`.

## Demo

See [`DEMO.md`](DEMO.md) for the hackathon storyboard.

## Branches

- `claude/v1-sui-ai` — V1 → V4 development branch
- `claude/scaffold-blockbuilders-mvp-Av5g1` — original 2D Phaser MVP, preserved for reference
