# BlockBuilders — Project History & Current State

**Date:** May 2026  
**Hackathon:** Sui Overflow 2026 (Agentic Web track)  
**Target Audience:** Kids 8–14 + curious adults  
**Tone:** "Think Lego but for crypto"

---

## Genesis

Started as a greenfield hackathon project: a **Lego-style web game where players learn blockchain concepts by snapping colored blocks together**. The core promise: crypto education without jargon, delivered through play.

### Original Locked Decisions
- **Name/ticker:** BlockBuilders / $BLOCK
- **Stack:** Vite + React + TypeScript + Phaser 3 (WebGL 3D) + Tailwind + Zustand
- **MVP scope:** Build-a-Blockchain sandbox, 5–8 brick types, ~10 micro-lessons unlocked by brick combos
- **No backend:** Single-player, localStorage-persisted, all state client-side
- **Hosting:** Vercel (zero-config, per-commit preview URLs)

---

## What Got Built (Sprint 0 → Present)

### ✅ Core Game Loop
1. **3D Sandbox World** (Phaser + Three.js)
   - Real-time draggable bricks on a grid
   - Snapping physics (magnetic to nearest cell on drop)
   - 18 block types × 6 geometric shapes × multiple colors
   - Day/night cycle with live emissive glow on crypto blocks
   - Instanced mesh rendering for performance

2. **Lesson System** (React modal overlays)
   - 10 lessons: Wallets, Tokens, Smart Contracts, Validators, Zero Knowledge, DeFi, Consensus, Nodes, Mining, Governance
   - Each lesson = 5-min read + 3–5 multiple-choice questions
   - Correct answers drop blocks into your town (visual reward)
   - Progress persisted to localStorage

3. **DeFi District** (Advanced feature)
   - Separate 3D world slice with fixed blueprint plots
   - **Bank building:** Player places blocks → completes blueprint → stakes 1 real SUI on testnet → real onchain StakedSui object minted
   - Town Value badge: shows live sum of all StakedSui held by wallet (indexed via SuiClient)
   - Building transfer mechanic: once staked, user can move completed building from DeFi District to their Sandbox town
   - Sandbox now visually shows their real onchain portfolio

4. **Visual Polish**
   - Geist Sans + Geist Mono typography (brand consistency)
   - Dark ink background (#0A0E1A), electric blue accents, warm yellow highlights
   - Cozy-dusk night cycle (moody but playable)
   - Smooth animations, particle effects on block placement, 3D sound design (procedural Web Audio synthesis for ambient music)

5. **Mobile Responsiveness**
   - Touch-friendly tap targets
   - Responsive layouts (320px → 1920px)
   - HUD adjusts for viewport

---

## Architecture (Current)

```
/src
├── main.tsx                    # Vite entry
├── App.tsx                     # Screen router (landing/lessons/sandbox/defi/gallery)
├── components/
│   ├── Landing.tsx             # Landing page (being redesigned)
│   ├── Sandbox.tsx             # Free-play mode
│   ├── DefiDistrict.tsx        # Staking buildings + transfer UI
│   ├── LessonsList.tsx         # Lesson picker + quiz modal
│   ├── World.tsx               # Phaser + Three.js canvas wrapper
│   ├── HUD.tsx                 # Top-right info chip
│   ├── Toolbar.tsx             # Block palette (left rail)
│   ├── TownValueBadge.tsx      # Live TVL display (bottom-left)
│   └── ... (30+ component files)
├── state/
│   ├── world.ts                # Zustand store: blocks, mode (lessons/sandbox/defi), transfers
│   ├── app.ts                  # Zustand store: screen, completedLessons, cosmetics
├── game/
│   ├── scenes/SandboxScene.ts  # Phaser boot + main game loop
│   ├── bricks/Brick.ts         # Phaser GameObject base class
│   └── ... (audio, particles, grid logic)
├── defi/
│   ├── buildings.ts            # Blueprint definitions (Bank, Market, Pool)
│   ├── useStake.ts             # Native Sui staking via sui_system
│   └── ... (DeFi-specific hooks)
├── sui/
│   ├── useTownStake.ts         # Query wallet StakedSui objects, compute TVL
│   └── ... (chain integration)
├── data/
│   ├── lessons.ts              # 10 lesson definitions + quiz content
│   └── blockTypes.ts           # 18 block type definitions
└── types.ts                    # Shared TypeScript interfaces
```

### State Shape (Zustand)
- **world.ts:**
  - `blocks: Block[]` (sandbox)
  - `defiBlocks: Block[]` (DeFi district)
  - `mode: 'lessons' | 'sandbox' | 'defi'`
  - `pendingTransfer?: { cells, sourceAnchor, stakedSuiId, txDigest }`
  - Reducers: `addBlock`, `moveBlock`, `startTransfer`, `commitTransfer`, `cancelTransfer`

- **app.ts:**
  - `screen: 'landing' | 'lessons' | 'sandbox' | 'defi' | 'gallery' | 'leaderboard'`
  - `completedLessons: string[]`
  - Persisted to localStorage with migrations

---

## What We Discovered (Pivots & Learnings)

### 1. **Real Onchain Stakes = Wow Factor**
Early iterations had blocks as pure cosmetics. Pivoting to "each building you complete stakes real SUI" turned the sandbox into a **portfolio dashboard**. Judges + kids both understood: *your town IS your onchain position*.

### 2. **Day/Night Cycle Matters**
Player feedback: "Grid is invisible at night." Solution: Live emissive system (0.34 base ambient + dynamic glow on crypto blocks at dusk). No rebuild churn, reads `sky.nightFactor` each frame.

### 3. **Blueprint-Driven DeFi**
Instead of "every block has utility," we locked down: "complete a building → one DeFi action." Keeps scope tight but opens the door: add Cetus swaps (Market building), Haedal liquid staking (Pool building) as separate feature PRs.

### 4. **Zustand + localStorage ≠ Backend**
Full game state (world, progress, cosmetics) lives in Zustand + localStorage. Agentic integration (agents can play autonomously) requires tool schema exposure, not a DB.

---

## What Was Planned Next (Before Pivot)

### Sprint 4 (Post-MVP)
- **Agents can play:** Expose MCP tools (`place_block`, `stake_sui`, `query_portfolio`) so Claude / custom agents can drive the game end-to-end
- **Liquid staking fallback:** Haedal / Volo integration pending API availability
- **Market building (Cetus):** Swap mechanic on testnet
- **Pool building (LP):** Stretch goal

### Sprint 5
- **Cosmetics/cosmetics:** NFT gated visuals, holo block skins, etc.
- **Leaderboard:** "Most SUI staked," "Lessons fastest," etc.
- **Social proof:** Live stat bar ("X towns built · Y SUI staked across them")

### Sprint 6
- **Production deploy** on custom domain (not Vercel preview)
- **Demo video** + hackathon submission

---

## Current Pain Points / Reasons to Restart

1. **Scope creep:** DeFi staking + transfers + blueprint validation = complex state machine. Harder to reason about, more surface area for bugs.

2. **Learning experience diluted:** The 10 lessons are good but get buried behind "unlock blocks → complete buildings → stake → move to town" mechanics. The core crypto concepts aren't always visible in the gameplay.

3. **Gameplay loop unclear:** Is this a building sim? A portfolio tracker? A tutorial? The answer is "all three" but that's confusing for new players.

4. **Mobile/UX rough:** HUD chrome, button placement, modal scrolling—lots of small friction.

---

## New Direction: Simpler Game Loop

### Inspiration
- **Binance Academy / Duolingo:** Short, engaging lessons → instant gratification (level up, badge)
- **Chrome Dino Game:** Minimal mechanics, high replayability, escalating difficulty
- **Lego still the vibe:** But maybe simpler than 3D—could be 2D isometric or card-based

### Proposed Rethink
Instead of: *Lesson → block drops → build buildings → stake → transfer*

Try: *Quiz question → if correct, play a mini-game round → accumulate points → unlock next topic*

Where the mini-game could be:
- **Drag-and-drop blocks** (like Dino jump dodging): answer correct, you build faster / place blocks smoother
- **Match 3 / Puzzle:** Connect crypto concepts (wallet ↔ blockchain, token ↔ holder, etc.)
- **Simple construction:** Place blocks against time, earn XP per block placed correctly
- **Tap-to-build:** Like Cookie Clicker but educational (tap = execute transaction, unlock = learn new concept)

The Sui integration stays but becomes **secondary reward** (after you've learned the concept in the game). Example:
1. Player completes "Wallets 101" lesson (3 questions)
2. Unlocks "Wallet mini-game" (3 minutes of gameplay)
3. High score on mini-game → real SUI testnet faucet tap or cosmetic NFT unlock

---

## Files to Review When Restarting

- **`DESIGN_BRIEF.md`** — Landing page redesign direction (may still be useful)
- **`src/data/lessons.ts`** — 10 lesson definitions (good reference, can simplify copy)
- **`src/world/blockTypes.ts`** — 18 block type definitions (could keep as visual palette)
- **Commits 5bbfc1a → present** — DeFi staking + transfer logic (reference for Sui integration, but likely to be ripped out)

---

## Recommendation for Fresh Start

### Keep
- Vite + React + TypeScript + Tailwind (stack is solid)
- Zustand for state (simple, no bloat)
- 10-lesson structure (content is good)
- Sui testnet integration skeleton (can rebuild on top)
- Dark ink branding + Geist Sans typography

### Rip Out
- Phaser + 3D rendering (too complex for a game loop clarification sprint)
- DeFi blueprint/transfer mechanics (rethink simpler)
- HUD chrome + complex modal overlays
- Procedural Web Audio (nice-to-have, not core)

### New Core
1. **Simple 2D game canvas** (plain HTML5 Canvas or Pixi.js, no Phaser)
2. **Clear progression:** Lesson → Mini-game → Score/Badge → Next lesson
3. **Suil mascot integration:** Character gives hints, celebrates wins, lives on screen
4. **Optional Sui hook:** After beating a world, user can "claim" a reward (testnet faucet, cosmetic)

---

## Questions Before Restart

1. **Game mechanic:** Drag-to-place? Match-3? Time-attack? Cookie Clicker style?
2. **Difficulty curve:** Linear progression through 10 lessons, or grouped by difficulty tier?
3. **Cosmetics/rewards:** Just cosmetics (block skins, avatar customization)? Or real testnet rewards?
4. **Mobile first or desktop?** (Current is desktop-first; might want to flip for broader reach)
5. **Sui integration timing:** Bake it in from day 1, or add as a "capstone" after lessons?

---

## Deliverables in This Zip

- **Full source code** (current branch, clean state)
- **This document** (PROJECT_HISTORY.md)
- **README.md** (run/build instructions)
- **.env.example** (Sui RPC endpoints, if applicable)
- **Git log** (see commit messages for feature breakdown)

Download, extract, `npm install`, `npm run dev`, and it's live at `localhost:5173`.

Good luck! 🧱
