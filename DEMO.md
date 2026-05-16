# Demo storyboard — Sui Overflow (AI track)

~90 seconds. Goal: a judge understands in **30 seconds** that this is a
**learn-by-playing town builder where you read short crypto lessons,
answer questions to earn Tetris-style pieces, drop them on a 3D map, and
end up owning both your lesson-built town and your sandbox land as
separate Sui NFTs that anyone can visit.**

## Pre-record checklist
- [ ] Clear `localStorage` so progress is fresh
- [ ] Connected Sui wallet (testnet) with ~0.1 SUI from the faucet
- [ ] If Enoki + Google sign-in keys are wired, sign in via Google for the wow
- [ ] Sound on — placement thuds + ai-build chime + save sparkle carry the moments
- [ ] Window 1080p, no devtools, no extension toolbars visible
- [ ] Browser zoom 100%
- [ ] Optional: open a second tab pointing to `/town/<your-address>` for the close

## Cuts

| Time | Beat | What's on screen | Voiceover / action |
|------|------|------------------|--------------------|
| 0:00–0:05 | **Hook** | Landing — isometric block diorama, hero "Read a lesson. Answer the questions. Watch a town appear." | "BlockBuilders. Learn crypto by playing — and own what you build, on Sui." |
| 0:05–0:10 | **Curriculum tease** | Cursor scrolls down — six lessons listed in the editorial table | "Six lessons. Wallets, tokens, smart contracts, validators, ZK, DeFi." |
| 0:10–0:18 | **AI tutor moment** | Click "Begin lesson 1" → read page → click *Explain it differently* → Gemini returns a kid-friendly metaphor | "Stuck on a concept? AI tutor rephrases it in plain words." |
| 0:18–0:30 | **Quiz drops a piece** | Click correct answer → cyan ✓ → a Tetris-style piece appears on the 3D map → R rotates → click to drop | "Every right answer earns you a piece. You decide where it goes." |
| 0:30–0:42 | **Town grows** | Speed-answer through one full lesson — 4 pieces drop, the wallet district takes shape; bottom progress chip "4/4" | (Let the placement thuds + chime carry it) |
| 0:42–0:55 | **Auto-mint Crypto 101** | Cut to "Town complete" screen after lesson 6 → amber callout "Auto-minting your Crypto 101 NFT" → wallet popup → signed → ✓ Minted | "Finish all six and you mint a Crypto 101 NFT — a one-time record of your learning, on Sui." |
| 0:55–1:05 | **Switch to Sandbox** | Click "Open Sandbox" → empty grid → tabs swap to **City** → pick *streetlight* (pole, amber) → click to place → click the grid to stack two more | "Sandbox is your separate land. Place blocks, stack them like Minecraft." |
| 1:05–1:15 | **AI Builder takes over** | Click prompt bar → type *"build a small park"* → narration "I'm planting a small park with paths and trees" → 18 blocks animate into place | "Prompt the AI Builder. It returns structured 3D actions and the world builds itself in front of you." |
| 1:15–1:22 | **Save to Sui + share** | Click Save World → wallet sign → ✓ Saved on Sui → copy share URL | "Save anytime. Walrus stores the JSON, Sui pins the NFT." |
| 1:22–1:27 | **Public visit** | Paste `/town/<your-address>` into a fresh tab → camera auto-orbits your sandbox | "Anyone with the URL can walk through your land — no login needed." |
| 1:27–1:30 | **Leaderboard outro** | Click 🏆 Leaderboard → list of top builders by on-chain block count → close on the trophy frame | "BlockBuilders. Onchain on Sui." |

## Submission copy

**Title.** BlockBuilders — learn crypto, build a town, own both on Sui.

**One-liner.** Read 6 lessons, answer quiz questions to earn Tetris pieces, drop them on a 3D map. Mint your finished crypto 101 town as one NFT, build your own land in the sandbox as another. Anyone can visit both.

**What's novel.**
1. **Quiz-driven Tetris-Lego building** — answers earn pieces, the player chooses where they go. Learning + agency in one mechanic.
2. **Two-NFT model on the same Move package** — a one-time *Crypto 101* commemorative + a live-updating *Sandbox land*. Distinguished on chain by a name prefix; no extra contracts.
3. **AI tutor inline** — Gemini rephrases any lesson page on demand with a fresh metaphor.
4. **AI Builder Agent** — types prompts into structured `place_block` actions, applied with an animated queue. The world builds itself.
5. **Open visitable worlds** — `/town/<address>` reads Sui + Walrus, no auth required. Plus a public gallery and an on-chain leaderboard.
6. **Sui-native end-to-end** — Move package, dynamic World NFTs, Walrus storage, Enoki zkLogin (Google sign-in).

## Tweet

> just shipped BlockBuilders for @SuiNetwork's overflow hackathon —
> a learn-by-playing town builder. read crypto lessons → answer quizzes
> to earn tetris pieces → drop them on a 3D map. finish all 6 lessons
> and you auto-mint a Crypto 101 NFT, then your separate Sandbox land
> lives onchain for anyone to visit. AI tutor + AI builder both inside.
