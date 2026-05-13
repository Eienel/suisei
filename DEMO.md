# Demo storyboard — Sui Overflow (AI track)

~90 seconds. Goal: a judge understands in 30 seconds that this is an AI
co-creative 3D world builder where users own evolving knowledge worlds
onchain via Sui.

## Pre-record checklist
- [ ] Clear `localStorage` so the world is empty + the "How to play" modal
      opens fresh
- [ ] Browser zoom 100%, no extension toolbars visible
- [ ] Sound on — placement thuds, build chimes, save sparkles all carry the moment
- [ ] Wallet ready: either a Sui wallet (Sui Wallet / Suiet) on testnet
      OR an Enoki Google flow if VITE_ENOKI_* are configured
- [ ] Some testnet SUI in the wallet (~0.05 SUI is enough for save tx)
- [ ] Optional: pre-create a World NFT so the demo skips name-prompt
      (otherwise show the mint flow)

## Cuts

| Time | Beat | What's on screen | What you say / do |
|------|------|------------------|-------------------|
| 0:00–0:05 | **Hook** | Empty 3D world, dark cinematic UI, HowTo overlay dismissed | "BlockBuilders. AI + human co-creative 3D world builder, owned onchain via Sui." |
| 0:05–0:20 | **Prompt the AI** | Bottom prompt bar focused with ⌘K. Type: *"build a zk learning city"* | "I prompt an AI Builder Agent — not a chatbot. It returns structured 3D actions." |
| 0:20–0:45 | **World builds itself** | 60+ blocks animate into place over ~6s, narration toast at top: *"I'm constructing a small zk learning city with distinct functional zones."* | Let it breathe. The staggered placement + chime is the magic moment. |
| 0:45–1:00 | **Edit manually** | Switch to **Place** tool (B). Drop a few governance marbles. Press R to rotate. Select a token prism and delete with ⌫. | "AI gives you a starting point. You stay in control — every block is yours to move, rotate, delete." |
| 1:00–1:12 | **Iterate with the AI** | Prompt: *"add a token marketplace on the north edge"*. Watch the new district appear next to the city. | "The AI sees the current world. It adds to what's there." |
| 1:12–1:25 | **Sign in + Save onchain** | Top-right: "Sign in with Google" (Enoki) OR "Connect Wallet". Then "Save World" → name prompt → mint. Suiscan link appears. | "One click signs me in via Sui zkLogin. Save uploads my world to Walrus and mints a dynamic World NFT on Sui." |
| 1:25–1:30 | **Outro** | Reveal the Suiscan tx page in another tab briefly, cut back to the world | "Worlds you own. Worlds that evolve. BlockBuilders." |

## Submission copy

**Title.** BlockBuilders — AI co-creative 3D world builder on Sui

**One-liner.** Co-create evolving 3D knowledge worlds with an AI Builder
Agent. Own them onchain via dynamic NFTs on Sui.

**What's novel.**
1. The AI emits structured JSON actions, not chat — the frontend executes
   them directly into a real-time 3D world.
2. Save → Walrus blob → on-chain `update_world` tx → dynamic NFT metadata.
   The NFT *is* the snapshot pointer.
3. Sui-native auth via Enoki zkLogin (Google sign-in → derived Sui
   address, no wallet install).

## Tweet
> just shipped BlockBuilders for @SuiOverflow — prompt an AI agent to
> build a 3D crypto-knowledge world, then own it onchain as an evolving
> Sui NFT. 90-second clip ↓
