# Copy-Paste Prompt for Claude Design (or v0.dev / Lovable)

Paste everything between the `---` lines into Claude Design.

---

Design a landing page for **BlockBuilders** — a Lego-style web game where you learn crypto by building. Players solve short lessons, blocks drop into their 3D town, and they can stake real Sui (testnet) by completing buildings in a "DeFi District." Their town becomes their onchain portfolio.

It's built for the **Sui Overflow 2026 hackathon** (Agentic Web track). The audience is dual: kids 8–14 who want to learn crypto, AND Sui judges who want to see something premium and original. The current landing looks too kid-coded; I need it to feel sophisticated and confident — like a serious product that happens to be playful.

## Tone & Feel
**Avoid:** Gradient blobs, glassmorphism, three-icon feature cards, generic "verb-your-noun" headlines, anything that screams "AI startup template," any pastel kid-coded palette.

**Aim for:** Editorial clarity (like corentinbernadou.com or 13g.fr) with playful character integration (like inkgames.com's octopus mascot living inside a confident layout). Dark ink background, bold sans-serif type, generous whitespace, a single charismatic mascot.

## Headline (locked)
> **Build a town. Stake real Sui. Watch it earn.**

Render the first two lines in electric blue, the third in off-white. Below it:
> "BlockBuilders teaches crypto through play. Solve lessons → blocks drop into your town → complete buildings in the DeFi District → stake real SUI → watch your town earn. Your portfolio, visualized."

## CTAs
- Primary: **Enter Sandbox** (solid electric blue, white text)
- Secondary: **Read Lessons →** (text link)
- Tertiary: **DeFi District →** (text link)

## Mascot (pick one — show me 3 versions)
A chunky, cubic character that lives inside the hero (3/4 isometric view, ~400×400px area). Three concepts to try:

1. **Suil** — A cute cubic water droplet with big eyes. Electric blue body, warm yellow accents. Bouncy, curious, confident pose (hands on hips or mid-jump).
2. **Raldo** — A blocky tinkerer robot built from stacked cubes. Warm yellow primary, blue accents. Holding a small block trophy or waving.
3. **RG-77** — An abstract crystalline form, like a faceted gem or art-deco tower. Monochromatic off-white with blue outline glow. Mysterious, elegant.

The mascot should feel **integrated** into the layout (a real character with weight and shadow), not a logo tacked on top. Subtle floating/bobbing CSS animation if possible.

## Color Palette
- Background: Dark ink `#0A0E1A`
- Foreground/type: Off-white `#F5F7FF`
- Primary accent: Electric blue `#1E6BFF`
- Secondary accent: Warm yellow `#FFC83D`
- Success/data: Cyan `#00E5FF`
- Dim text: `#7B8298`

## Typography
- Headlines: **Geist Sans 700**, tight tracking, ~72–80px desktop, scales down responsively
- Body: Geist Sans 400/500, 16–18px, line-height 1.5–1.7
- Data/labels: **Geist Mono** 11–13px, uppercase + wide tracking for eyebrows

## Page Structure
1. **Sticky header** — Logo wordmark left, GitHub/Docs/wallet-connect right
2. **Hero** — 2-column asymmetric (copy left ~60%, mascot right ~40%); stacks on mobile
3. **Feature strip** — Three benefit cards (Learn · Build · Stake) with emoji + headline + short body
4. **Curriculum table** — Editorial-style table listing 10 lessons (number, title, blurb, block-color swatches); hover row highlights
5. **Stats bar** — "X towns built · Y SUI staked" pulled from chain (placeholder OK)
6. **Footer** — Version, links, "Built on Sui testnet"

## Responsive
- Desktop-first but fully responsive 320px → 1920px
- Mobile: stacked hero, full-width cards, 48px tap targets
- All text passes WCAG 2.1 AA contrast

## Tech Stack
React + TypeScript + Tailwind CSS. Output a single self-contained `Landing.tsx` component. Use Tailwind utility classes; no external CSS files. Don't import icon libraries — emoji or inline SVG only.

## Success criteria
- Sui judges see this and think "this team has taste"
- A 12-year-old sees this and wants to click "Enter Sandbox"
- Mascot has personality without being childish
- Page feels like one continuous voice, not stitched-together sections
- Loads in under 2s, no layout shift

Render 2–3 distinct hero variations so I can pick a direction. Focus on the **hero + mascot composition** first — that's the hook.

---

## What to send back

When you paste this, ask Claude Design (or v0) for:
1. **Three hero variations** — different layout/composition takes on the same brief
2. **The full Landing.tsx** for your favorite variation
3. **A separate mascot SVG** (or instructions to generate one) so we can iterate on it independently

Once you pick a winner, I'll wire it into the actual codebase, hook up the buttons, and add the live onchain stats query.
