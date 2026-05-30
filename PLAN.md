# Suisei — Build Plan

> Sui's agent toolkit. Showcase by Suisei.
> Built for Sui Overflow 2026 · Agentic Web track · Deadline TBD (target June 20)

---

## Vision

A **niche AI agent** that lives on Sui, **uses the full Sui Stack** (zkLogin, Sponsored Tx, Move, PTBs, Walrus, Seal, randomness, native staking) to teach the Sui Stack — through 7-8 quests, each ending in a real testnet deployment.

But the agent is just the showcase. The real product is the **MCP server (Sui Skills)** — an open toolkit that any AI agent can plug into to do real Sui work: deploy Move modules, compose PTBs, mint NFTs, query objects, stake SUI, swap on DeepBook, store on Walrus, encrypt with Seal.

**Three-layer architecture:**

1. **Sui Skills (MCP server)** — open-source toolkit. Any agent (Claude Desktop, Cursor, ChatGPT custom GPT, custom Python/TS agents) can plug in.
2. **Suisei (web product)** — the first agent built on Sui Skills. Teaches users by guided quests.
3. **Leaderboard (community layer)** — onchain badge holders ranked, social proof, viral mechanics.

---

## Why this wins

- **Agentic Web track ($30K)** — Suisei IS an agent that transacts onchain. Sui's own Agentic Web vision asks for: shared verifiable state, portable permissions, atomic execution, cryptographic proof. We demonstrate all four.
- **Walrus track stacking ($70K pool)** — agent memory + lesson progress stored via MemWal; Quest 7 uses Walrus + Seal directly.
- **DeepBook track stacking ($70K pool)** — Graduate quest builds a real DeepBook trading bot.
- **Community Award ($25K)** — leaderboard + viral "I'm now a Sui Stack Graduate" mechanic.
- **Not a wrapper** — every quest deploys real Move code via embedded WASM compiler (PlayMove). Real on-chain package IDs verifiable on Sui Explorer.
- **MCP server is ecosystem infra** — judges love things that make Sui easier for everyone, not just one app.

---

## Quest Design (7 + 1 graduate; ~30-35 min total)

| # | Concept | Duration | Wow Moment | Bounty Tag |
|---|---|---|---|---|
| 1 | **zkLogin** | 3 min | "I signed in with Google. I have a wallet." | Agentic Web |
| 2 | **Sponsored Tx + Object Model** | 4 min | "My first tx cost $0. The app paid. My NFT is a real object." | Agentic Web |
| 3 | **Move Abilities** | 5 min | "The compiler refused to let me lose someone's NFT." | Agentic Web |
| 4 | **Capability Pattern** | 5 min | "Admin power is an object I hold." | Agentic Web |
| 5 | **Soulbound Badge** | 4 min | "This achievement physically cannot leave my wallet." | Agentic Web |
| 6 | **PTBs** | 4 min | "I chained 5 ops in one atomic transaction." | Agentic Web |
| 7 | **Walrus + Seal** | 5 min | "I encrypted a secret only NFT holders can read." | **Walrus** |
| GRAD | **DeepBook Trading Bot** | 5 min | "I deployed a bot that places real orders on a real orderbook." | **DeepBook** |

**Quest mechanic loop** (each one):
1. Suisei narrates the concept (~20 sec, animated text)
2. Suisei scaffolds Move code (fill-in-the-blanks, ~15 lines visible)
3. User completes the scaffold (or just clicks "use Suisei's suggestion")
4. Suisei compiles + deploys via embedded PlayMove
5. User interacts with the deployed contract (built-in PTB)
6. Soulbound badge minted as proof of completion
7. Progress saved to Walrus via MemWal

---

## Sui Skills (MCP Server)

Open-source. MIT. Separate npm package: `@suisei/mcp`.

**Tools exposed:**

| Tool | What it does |
|---|---|
| `sui.connect_zklogin(provider)` | Initiate zkLogin flow, return wallet address |
| `sui.sponsor_tx(tx)` | Wrap a transaction in Enoki sponsorship |
| `sui.deploy_move(source)` | Compile Move source (via WASM) + deploy package |
| `sui.compose_ptb(ops)` | Build + execute a Programmable Transaction Block |
| `sui.query_object(id)` | Return an object's full content + history |
| `sui.mint_nft(template, recipient)` | Mint NFT via Display V2 standard |
| `sui.mint_soulbound(badge, recipient)` | Mint a non-transferable badge |
| `sui.stake(amount, validator)` | Native staking via 0x3::sui_system |
| `sui.unstake(staked_id)` | Withdraw stake |
| `sui.swap_deepbook(pool, side, amount)` | Place order on DeepBook |
| `walrus.store(blob)` | Store blob on Walrus, return blob ID |
| `walrus.retrieve(blob_id)` | Fetch blob from Walrus |
| `seal.encrypt(data, policy)` | Encrypt data with a Move-gated decrypt policy |
| `seal.decrypt(ciphertext)` | Decrypt if policy permits |
| `random.roll(min, max)` | Use Sui's on-chain random beacon |
| `clock.now()` | Get on-chain timestamp |

Distribution:
- npm package + GitHub repo
- Claude Desktop config snippet (one-liner to install)
- Cursor IDE snippet
- Python SDK wrapper (`pip install sui-skills`) — bonus

---

## Leaderboard

- **What it tracks:** soulbound badge holders per quest + graduate NFT holders
- **Views:** Top 100 all-time, This week, This month
- **Profile pages:** /u/0x... shows collected badges, completion timestamp, public stats
- **Source of truth:** onchain query for badge object holders + Suisei's package registry
- **Social hooks:** "I just became a Sui Stack Graduate" share-card (auto-generated PNG via Vercel OG image)

---

## Stack

- **Frontend:** Vite + React + TS + Tailwind + Zustand + @mysten/dapp-kit
- **AI agent:** Claude Haiku (default) via Vercel serverless proxy; BYO API key fallback
- **Auth/UX:** Enoki SDK (zkLogin + Sponsored Tx)
- **Move compilation:** PlayMove WASM (embedded iframe v1, forked direct integration v2)
- **Storage:** Walrus via MemWal SDK
- **Access control:** Seal SDK
- **Backend:** Vercel serverless (Enoki proxy, agent call proxy, leaderboard query cache)
- **MCP server:** Separate Node package using `@modelcontextprotocol/sdk`

---

## Timeline (assumes June 20 deadline; verify before sprint)

| Window | Deliverable |
|---|---|
| **May 27 → Jun 2** | Foundation: strip repo, set up clean shell, Enoki zkLogin + Sponsored Tx working, Quest 1 vertical slice (sign-in → first object → first badge) |
| **Jun 3 → Jun 9** | Quests 2-4 (object model, Move abilities, capability pattern). PlayMove embedded. Suisei chat panel + agent integration |
| **Jun 10 → Jun 14** | Quests 5-7 (soulbound, PTBs, Walrus+Seal). MCP server v1 published to npm |
| **Jun 15 → Jun 18** | Graduate quest (DeepBook). Leaderboard. Landing page redesign with Suisei mascot |
| **Jun 19 → Jun 20** | Demo video, submission package, polish |

**Hard cuts if behind:**
- Drop Graduate quest (DeepBook) → forfeit DeepBook bounty stack but ship 7 core quests
- Ship MCP server as "concept + repo" not as polished npm release
- Skip leaderboard, ship just badge collection page

---

## TODO Tracker

### Sprint 0 — Foundation (May 27 → Jun 2)

- [x] Verify hackathon deadline (confirmed by user)
- [x] Strip old components and 3D code
- [x] Set up clean app shell (router, providers, theme)
- [x] Brand design brief ready to feed Claude Design (`docs/design/SUISEI_BRIEF.md` + `BRAND_DESIGNER_PROMPT.txt`)
- [ ] Apply for Enoki API access
- [x] Implement zkLogin sign-in flow (Quest 1 step 1) — `AuthButton` + EnokiRegistrar
- [ ] Implement Sponsored Tx wrapper (Quest 1 step 2) — pending Enoki keys
- [x] Build minimal Suisei chat panel (right side, persistent) — `SuiseiChat.tsx`
- [x] Author first Move module: `suisei_badge` (soulbound) — `move/suisei_badge`
- [ ] Publish `suisei_badge` to testnet + set `VITE_BADGE_PACKAGE_ID`
- [x] Mint badge on Quest 1 completion (Quest 1 step 3) — real-when-configured, mocked when not
- [x] Landing page placeholder
- [x] Quest hub UI — `QuestHub.tsx`, linear unlock from `badges` count
- [x] Quest 1 vertical slice — `quests/Quest1ZkLogin.tsx` (intro → interact → badge → done)
- [ ] Suisei agent system prompt v1 (Claude Haiku via proxy) — scripted lines in place, LLM proxy still TBD

### Sprint 1 — Core Quests (Jun 3 → Jun 9)

- [ ] Embed PlayMove iframe + wire postMessage protocol
- [ ] Quest 2: Sponsored Tx + Object Model
- [ ] Quest 3: Move Abilities (deploy a struct, see compiler reject)
- [ ] Quest 4: Capability Pattern (admin-gated mint)
- [ ] Soulbound badge for each quest
- [ ] Walrus + MemWal integration for progress storage
- [ ] Suisei agent system prompt v2 with quest context

### Sprint 2 — Advanced + MCP (Jun 10 → Jun 14)

- [ ] Quest 5: Soulbound NFT (mint, try to transfer, fail)
- [ ] Quest 6: PTBs (drag-build atomic 5-op tx)
- [ ] Quest 7: Walrus + Seal (encrypt, NFT-gated decrypt)
- [ ] MCP server scaffolding (`@suisei/mcp`)
- [ ] All Sui skills tools implemented
- [ ] npm publish + Claude Desktop config snippet
- [ ] README + docs

### Sprint 3 — Graduate + Polish (Jun 15 → Jun 18)

- [ ] Graduate quest: DeepBook trading bot
- [ ] "Sui Stack Graduate" NFT mint
- [ ] Leaderboard page (top 100 + this week)
- [ ] Profile pages (/u/0x...)
- [ ] Share-card OG image generator
- [ ] Landing page final design (with Suisei mascot)
- [ ] Mobile responsive sweep

### Sprint 4 — Ship (Jun 19 → Jun 20)

- [ ] Demo video (90 sec)
- [ ] GitHub README with run instructions
- [ ] Submission via DeepSurge
- [ ] Live tweet announcement
- [ ] Discord post in Sui developer channel

---

## Open questions (decide as we build)

- **Agent model:** Claude Haiku (cheap, fast) vs Gemini Flash Lite (free tier). Default Claude, fallback Gemini.
- **BYOA UX:** API key field in settings, never leaves localStorage, routed client-side.
- **Mascot:** Keep Suil character from old design? Rebrand as "Suisei the agent's avatar"?
- **Move package strategy:** One global package with all quest modules, vs. per-quest packages owned by the user?
- **Leaderboard backend:** Pure onchain query (slow) vs. Vercel cron indexer (faster, requires backend)?

---

## Definition of Done (for the hackathon)

A judge can:
1. Open the site, sign in with Google in 5 seconds
2. Complete the first quest (mint their first object) in under 5 minutes
3. See the deployed Move package on Sui Explorer
4. Talk to Suisei via the chat panel
5. Plug `@suisei/mcp` into Claude Desktop and ask Claude to mint them an NFT
6. See themselves on the leaderboard with their badges

If all 6 work end-to-end on testnet, we ship.
