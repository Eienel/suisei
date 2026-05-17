# BlockBuilders

> Learn crypto by building a town. Own it onchain on Sui.

A learn-by-playing town builder. Read short lessons, answer multiple-choice
questions, drop Tetris-style pieces on a 3D map. Finish all six lessons and
you mint a **Crypto 101 NFT** of the town you built. Then your **Sandbox**
land — separate from the lesson world — is a Minecraft-style free-build that
anyone can visit at a public URL.

Built for **Sui Overflow · AI track**.

## The loop

```
Landing
  ↓
Lessons list                              Sandbox (unlocks after 3 lessons)
  ↓                                            ↓
Read a page  →  Ask AI tutor              Pick shape + color + tab (City/Crypto)
  ↓                                            ↓
Quiz (4 Qs)  →  Each correct = a piece    Click ground to place, click a block face to stack
  ↓                                            ↓
Drop piece on map (rotate with R)         Prompt the AI Builder → animated build
  ↓                                            ↓
After lesson 6: auto-mint Crypto 101 NFT  Save World → Walrus + Sui NFT
                                               ↓
                                          Anyone can visit at /town/<address>
                                               ↓
                                          Leaderboard tallies block count
```

## Two NFT kinds per player

| Kind | When minted | Purpose | Updates |
|---|---|---|---|
| **Crypto 101** (`L:...`) | Auto-mints when all 6 lessons done | Commemorative — the town built from quiz answers | One-time |
| **Sandbox land** (`S:...`) | Manual "Save World" in Sandbox | Your creative land — visitable, remixable | On every save |

Both live in the same Move package (`0x888787d0…56daf`), distinguished by an `S:` / `L:` name prefix so we can split kinds without fetching every Walrus blob.

## What's live

| Feature | How |
|---|---|
| **6 lessons** | Wallets · Tokens · Smart Contracts · Validators · ZK · DeFi |
| **AI tutor** | "Explain it differently" on every read page (Gemini 2.5 Flash) |
| **Tetris-piece placement** | 10 shapes, drop on map, `R` rotates, validity preview |
| **Minecraft-style stacking** | Click any block's face to place on top / adjacent |
| **5 block shapes** | cube · slab · pole · panel · ramp |
| **Per-block color tint** | 12 swatches |
| **Block categories** | City (road · timber · foliage · streetlight · water) + Crypto (wallet · token · vault · etc.) |
| **Lesson-gated unlocks** | road (after 1 lesson) · foliage (2) · streetlight (3) · water (4) |
| **Instanced rendering** | One draw call per (type × shape) — thousands of blocks at 60fps |
| **Day/night cycle** | ~3 min, sun arcs, emissive blocks glow at night, fog tints shift |
| **Animated water + AI neural shimmer** | per-frame emissive modulation |
| **Sandbox / Lessons NFT split** | Two persisted worlds, two separate on-chain identities |
| **Walrus storage** | Public HTTP publisher / aggregator — town JSON lives off-chain |
| **AI Builder Agent** | Type intent → Gemini returns structured `place_block` actions → animated apply queue |
| **Conversational refinement** | Same prompt bar holds chat history — say "taller", "add water", "shift north" and the model edits surgically |
| **Visual reference** | Paperclip in the prompt bar attaches an image; the model interprets it and builds the closest match |
| **AI clarify** | If the prompt is too vague, the agent asks back with quick-pick chips instead of guessing |
| **AI guided tours** | On any public town page, "Tour" plans a 3–5 stop camera walk with narration |
| **AI custom lessons** | "Create your own" — pick any topic (MEV, rollups, …), Gemini writes a 2-page lesson + 4-question quiz |
| **Public visit pages** | `/town/<address>` reads Sui + Walrus, auto-orbiting camera |
| **Remix** | Visiting someone? One click copies their world into yours |
| **Gallery** | Recent towns from Sui `WorldMinted` events |
| **Leaderboard** | Top builders by on-chain block count, with kind icons + names |
| **Auth** | Sui wallet (dapp-kit) + Enoki Google sign-in (when env keys set) |

## Run

```bash
cp .env.example .env   # fill in GEMINI_API_KEY at minimum
npm install
npm run dev            # http://localhost:5173
npm run build
npm run preview
npm run typecheck
```

## Environment

```
# Server-side (Vercel Function only — never bundled to client)
GEMINI_API_KEY=                # required. aistudio.google.com → free key

# Client-side (Vite inlines at build time)
VITE_SUI_NETWORK=testnet
VITE_WORLD_NFT_PACKAGE_ID=0x888787d0d2848499ba22fa09afdcbc593c3ba637d04807345abab501a1f56daf

# Optional — enables "Sign in with Google" via Sui zkLogin
VITE_ENOKI_API_KEY=
VITE_ENOKI_GOOGLE_CLIENT_ID=

# Optional — defaults are public Walrus testnet endpoints
VITE_WALRUS_PUBLISHER_URL=
VITE_WALRUS_AGGREGATOR_URL=
```

## Stack

| Layer | Tech |
|---|---|
| Shell | Vite + React 18 + TypeScript + Tailwind |
| 3D | `@react-three/fiber` + `@react-three/drei` |
| State | Zustand (persisted) — two-world store + agent store + app store |
| AI | Google **Gemini 2.5 Flash** via Vercel Functions (`/api/agent` builder + chat + image-vision · `/api/tutor` lesson rephrase · `/api/tour` guided camera walks · `/api/lesson` custom-topic lessons) |
| Auth | `@mysten/dapp-kit` + `@mysten/enoki` (zkLogin) |
| Storage | Walrus testnet HTTP publisher/aggregator |
| Chain | `@mysten/sui` programmable transactions, Move 2024 |

## Architecture in five sentences

1. **One source of truth per world** — `useWorld` keeps `lessonBlocks` + `sandboxBlocks` arrays plus a `mode` flag; everything renders from the active set.
2. **All placement flows through the same reducers** — manual click, Tetris piece commit, AI executor — same `placeBlock`/`commitPiece` calls, same validation rules.
3. **Sui touches one folder** — `src/sui/` owns auth + Walrus + Move calls + the leaderboard/gallery reads. The rest of the app stays chain-agnostic.
4. **Landing chunk is 22 KB and pulls zero `@mysten/*` code** — the Sui chunk + the 3D chunk are lazy-loaded via `React.lazy` so first paint is fast even on flaky cellular.
5. **AI emits typed JSON actions, not chat** — `/api/agent` enforces a Gemini `responseSchema`, results are Zod-validated client-side, then applied through the same reducers as manual edits.

## Verified cross-engine

Tested in real headless engines on multiple viewports — zero `pageerror`s on each:

| Engine | Browser equivalent | Viewport | Result |
|---|---|---|---|
| WebKit | iOS Safari, iOS Chrome | iPhone 14 Pro | ✅ |
| WebKit | Mac Safari | 1440×900 | ✅ |
| Blink  | Mac Chrome, Mac Edge | 1440×900 | ✅ |
| Blink  | Windows Chrome, Edge | 1920×1080 | ✅ |

## Move package

Published on Sui **testnet**:
- Package: `0x888787d0d2848499ba22fa09afdcbc593c3ba637d04807345abab501a1f56daf`
- Module: `blockbuilders::world`
- Entry funcs: `mint_world(name, uri, count)`, `update_world(world, uri, count)`, `rename(world, name)`
- Events: `WorldMinted`, `WorldUpdated`

Source under `move/blockbuilders/`. Seeded test mints from a sandbox keypair so the gallery + leaderboard aren't empty for first visitors.

## Project map

```
api/
  agent.ts, tutor.ts                  # Vercel Edge Functions
src/
  agent/                              # runAgent, runTutor, applyActions, useAgent store
  audio/sfx.ts                        # procedural WebAudio + haptics
  components/
    Landing                           # editorial hero with isometric SVG
    LessonsList                       # curriculum grid
    LessonRead, LessonCheck, LessonDone  # lesson sub-screens
    Sandbox                           # V1 free-build shell
    Gallery, Leaderboard, VisitPage   # public Sui-backed screens
    BlockInstances, BlockMaterial...  # instanced 3D rendering
    PieceGhost, PlacementGrid         # placement raycasting + preview
    DayNightCycle                     # sun/ambient/fog animation
    AuthButton, SaveWorldButton, ShareButton, AskTutor, HowToModal,
    ErrorBoundary, SuiShell, Toolbar, HUD, PromptBar, NarrationOverlay
  data/lessons.ts                     # 6 lessons × 4 questions × reward pieces
  state/app.ts                        # screen routing + completed lessons
  state/world.ts                      # two-world store + pendingPiece + reducers
  sui/                                # config, providers, walrus, useSaveWorld,
                                      # useUserWorld, useGallery, useLeaderboard
  world/
    blockTypes.ts                     # 15 types: 10 crypto + 5 city
    shapes.ts                         # 5 shape geometries
    grid.ts, pieces.ts, sky.ts
  types.ts, main.tsx, App.tsx, index.css
move/blockbuilders/                   # published Move package source
```

## Branches

- `claude/v1-sui-ai` — main development branch
- `claude/scaffold-blockbuilders-mvp-Av5g1` — V0 Phaser MVP (preserved for git history)

## Demo

See [`DEMO.md`](DEMO.md) for the hackathon storyboard.
