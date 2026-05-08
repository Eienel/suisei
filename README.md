# BlockBuilders

> think Lego but for crypto · `$BLOCK`

A snap-bricks-together web game that teaches blockchain concepts. Built for the Bags hackathon.

- **Audience:** kids 8–14 + curious adults
- **MVP mode:** Build-a-Blockchain sandbox, 5–8 brick types, ~10 micro-lessons unlocked by combos
- **Stack:** Vite + React + TypeScript + Phaser 3 + Tailwind + Zustand + `mitt`
- **No backend.** Local state + (eventually) on-chain via Bags.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle
npm run preview  # serve the production bundle
npm run typecheck
```

## Project map

```
src/
├── components/   React shell — landing, game shell, palette, lesson modal
├── game/         Phaser side — scenes, bricks, event bus
│   ├── bricks/   Brick definitions (data-driven) + base GameObject
│   ├── scenes/   Boot + Sandbox scenes
│   └── events.ts Typed mitt EventBus (the React ↔ Phaser seam)
├── data/         Lesson registry (10 stubs, combo-triggered)
├── state/        Zustand store, persisted to localStorage
├── bags/         Solana / Bags integration plug point (stub for now)
└── types.ts
```

## Sprint roadmap

- **Sprint 0 — Scaffold** ✅ landing, sandbox with one draggable brick, palette, Bags stub, lesson data
- **Sprint 1 — Mechanics** snap-to-grid feedback, all bricks draggable, fuse animation, mobile touch
- **Sprint 2 — Lesson engine** combo detector, modal, HUD progress chip
- **Sprint 3 — Polish** brick art, sounds, lesson copy pass, OG image
- **Sprint 4 — Bags** wallet connect + gated cosmetics OR mint-on-completion (decide)
- **Sprint 5 — Ship** Vercel deploy, demo video, hackathon submission

See [`/src/bags/README.md`](src/bags/README.md) for the Bags integration plan.

## Branch convention

All work happens on `claude/scaffold-blockbuilders-mvp-Av5g1` until the scaffold is reviewed.
