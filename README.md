# BlockBuilders

> AI co-creative 3D world builder on Sui. Built for Sui Overflow (AI track).

Prompt an AI Builder Agent to construct evolving 3D knowledge worlds. Edit them
yourself. Own them onchain via dynamic World NFTs on Sui.

## What's live

- **3D world (R3F)** — 10 distinct block materials (zk crystal, data core,
  DeFi vault, governance marble, AI neural, security bunker, wallet keystone,
  oracle lens, token prism, contract obelisk). Soft shadows, bloom, tone
  mapping, idle pulses, placement spring. Manual place / select / rotate /
  delete with hotkeys.
- **AI Builder Agent** — `/api/agent` proxies Gemini 2.5 Flash with a strict
  `responseSchema`. Returns `{ narration, actions: place_block | remove_block }`,
  Zod-validated, applied with a staggered animation so the world builds in
  front of the user.
- **Sui auth** — both Enoki zkLogin (Google sign-in) **and** dapp-kit wallet,
  side-by-side. Auto-detect: Google button hides if Enoki keys aren't set.
- **Save World** — serializes world JSON, uploads to Walrus testnet, mints
  (or updates) a `World` NFT on Sui via the published Move package. Links
  out to Suiscan for the tx receipt.
- **Move package** — published on Sui testnet:
  `0x888787d0d2848499ba22fa09afdcbc593c3ba637d04807345abab501a1f56daf`

## Stack

| Layer | Tech |
|---|---|
| Shell | Vite + React 18 + TypeScript + Tailwind (dark cinematic theme, Geist Sans) |
| 3D | `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` |
| State | Zustand (persisted to localStorage) |
| AI | Google **Gemini 2.5 Flash** via Vercel Function (`/api/agent`) — provider-agnostic seam at `src/agent/runAgent.ts` |
| Auth | `@mysten/dapp-kit` + `@mysten/enoki` (zkLogin) |
| Storage | Walrus testnet HTTP publisher/aggregator |
| Chain | `@mysten/sui` programmable transactions, Move 2024 |

Landing chunk: ~30 KB. Three / Sui / Postprocessing / Vendor split into their
own immutable chunks.

## Run

```bash
cp .env.example .env
# Fill in GEMINI_API_KEY (server, required for AI)
# Optionally fill VITE_ENOKI_API_KEY + VITE_ENOKI_GOOGLE_CLIENT_ID for zkLogin

npm install
npm run dev        # http://localhost:5173 — /api/agent works locally via Vite middleware
npm run build
npm run preview
npm run typecheck
```

## Environment variables

```
# Server-only (Vercel Function)
GEMINI_API_KEY=                # AI Builder Agent. Get at aistudio.google.com

# Client (VITE_*)
VITE_SUI_NETWORK=testnet
VITE_WORLD_NFT_PACKAGE_ID=0x888787d0d2848499ba22fa09afdcbc593c3ba637d04807345abab501a1f56daf
VITE_ENOKI_API_KEY=            # optional — Google sign-in. portal.enoki.mystenlabs.com
VITE_ENOKI_GOOGLE_CLIENT_ID=   # optional — Google Cloud Console OAuth Web client
VITE_WALRUS_PUBLISHER_URL=     # optional — defaults to public testnet publisher
VITE_WALRUS_AGGREGATOR_URL=    # optional — defaults to public testnet aggregator
```

For production: add the same vars in **Vercel → Project Settings → Environment
Variables**. The `GEMINI_API_KEY` must NOT be prefixed `VITE_` — it's read
server-side only.

## Project map

```
api/
  agent.ts            # Vercel Edge Function entry → runAgent
src/
  agent/              # AI agent: schema, prompt, runAgent, apply, hook
  audio/              # Procedural WebAudio SFX
  components/         # World, Block, BlockMaterial, BlockAccent,
                      # HUD, Toolbar, PromptBar, NarrationOverlay,
                      # AuthButton, SaveWorldButton, HowToModal
  state/              # world (blocks, tools) + app (UI flags)
  sui/                # providers, config, walrus, useUserWorld, useSaveWorld
  world/              # block taxonomy + grid math
  types.ts
move/blockbuilders/   # Move package source (published)
```

## Architecture, three sentences

1. **Single source of truth** is `useWorld` — an array of `Block` records with
   integer grid positions; everything renders from it.
2. **AI actions and manual edits flow through the same reducers** in
   `state/world.ts`, so the AI can't bypass any rule the user is also bound by.
3. **Sui touches one folder.** `src/sui/` owns auth + Walrus + Move calls;
   the rest of the app doesn't know about chains.

## Demo

See [`DEMO.md`](DEMO.md) for the hackathon storyboard.

## Branches

- `claude/v1-sui-ai` (this branch) — V1 production work
- `claude/scaffold-blockbuilders-mvp-Av5g1` — the original 2D Phaser MVP
  (preserved as a reference, kept for git history)
- `claude/lesson-puzzle-wip` — WIP lesson-puzzle pivot, abandoned with
  the larger Sui/AI redesign

## License

For Sui Overflow hackathon use.
