# Suisei — Brand Brief Addendum

> Paste the contents of `BRAND_DESIGNER_PROMPT.txt` first, then this brief, when feeding Claude Design / v0 / Lovable for a complete identity pass.

---

## The idea

**Suisei** — an AI agent that lives on Sui, uses the full Sui Stack
(zkLogin, Sponsored Tx, Move, PTBs, Walrus, Seal, on-chain randomness,
native staking) to teach you the Sui Stack through 7 quests + 1
graduate quest. Each quest ends with the user deploying a real Move
package on testnet and earning a soulbound badge. Completing all 8
mints a "Sui Stack Graduate" NFT.

The agent runs on an open MCP server (`@suisei-mcp/mcp`) so
*any* AI agent — Claude Desktop, Cursor, custom Python bots — can plug
into the same toolkit and do real Sui work. Suisei is the showcase.
The MCP server is the gift to the ecosystem.

There's a leaderboard ranking Sui Stack Graduates and individual badge
collections, giving the product a public, viral surface.

## Audience

- **Primary:** crypto-curious devs who've heard of Sui but never built
  on it; non-crypto coders looking for the most beginner-friendly L1
  to try. Both want a no-install, browser-only first dose.
- **Secondary:** Sui Overflow 2026 judges — looking for products that
  use Sui-native primitives, not EVM ports. The "agent itself uses
  the stack it teaches" framing should land as both clever and
  legible.
- **Tertiary:** advanced devs who want to add Sui skills to their
  Claude Desktop / Cursor agent. The MCP-server-as-product angle.

## Tone

Direct, builder-coded, playfully clever — never childish, never
condescending. Suisei should feel like a senior dev who happens to be
warm, not a Duolingo owl. Confident enough to make jokes about
Solidity habits; humble enough to celebrate every small win.

## Constraints

- **Dark ink palette** preferred (we own it already; matches the
  premium-builder feel and beats every other Sui-edu site).
- **Geist Sans + Geist Mono** locked (already shipping in the bundle).
- Mascot needs to live in the product **as a real presence** (right
  side of every screen, occasional cut-ins), not a logo at the top.
- Must be a single charismatic character — not three loose options.
  Decide one and commit.
- Must read at 24×24 (favicon, leaderboard avatar) and 512×512 (hero,
  share card) without redrawing.

## What competitors look like (we are NOT this)

- **Suilings** (suilings.xyz) — pure dev exercises, no narrative, no
  mascot, looks like Rustlings clone. Too dry.
- **HackQuest** — generic web3 academy with a Sui track. Looks like
  every other LMS.
- **letsmovesui.com** — has Sui's official mascots (SuiFrens) but
  uses them as decoration, not characters. Reads like docs.

## What we are inspired by

- **CryptoZombies** — narrative makes syntax memorable (400k users,
  proves the format).
- **Speedrun Ethereum / Stylus** — chain-specific, ship-real-things-
  as-reward, opinionated layout.
- **Linear** — premium dark UI, monospace data, generous whitespace.
- **InkGames octopus** — mascot embedded in confident editorial
  layout, not tacked on.
- **Vercel / Stripe** — restraint as a flex; the product looks
  expensive but isn't loud.

## What to deliver (using the BRAND_DESIGNER_PROMPT format)

All eleven sections A-K, with these emphases:

- **B (Naming):** "Suisei" is the locked name. Just sanity-check the
  spelling and offer one alternative if a stronger fit emerges.
- **F (Mascot):** Single concept, committed. Cubic/geometric is fine
  but flexible — surprise me if a non-cube form serves the personality
  better. Must convey: helpful agent, slightly mischievous, builder.
- **G + H (UX + Landing):** Hero layout must include the mascot
  *integrated*, not a floating sprite. Show me 2 variations only —
  one premium-editorial, one playful-utility. No "third option" filler.
- **J (Prompts):** All Midjourney / DALL·E prompts must reference our
  palette + Geist as system fonts so generated images match the
  product. Avoid generic crypto stock language ("futuristic, neon,
  cyberpunk").

## Locked color palette (do not change)

| Token | Hex | Usage |
|---|---|---|
| `ink` | `#0A0E1A` | Background |
| `fg` | `#F5F7FF` | Foreground type |
| `accent.blue` | `#1E6BFF` | Primary accent — agent voice, CTAs |
| `accent.cyan` | `#00E5FF` | Success, live-status, data |
| `accent.yellow` | `#FFC83D` | Warmth, mascot highlights, badge celebration |
| `dim` | `#7B8298` | Muted body, captions |
| `line` | `#1C2238` | Borders, hairlines |

## The locked headline

> Learn Sui by doing Sui.

(Working sub-line: *An AI agent that uses the full Sui Stack to teach
you the Sui Stack. Eight quests, real on-chain deployments, zero seed
phrases.*)
