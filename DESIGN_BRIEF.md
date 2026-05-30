# BlockBuilders Landing Page — Design Brief

## Vision
A **premium-minimalist** editorial landing that positions BlockBuilders as a sophisticated entry point to onchain learning and DeFi. The page should feel confident, playful, and intentional—avoiding the clichéd "crypto startup" visual language (gradients, jargon, three-feature cards). Instead, it mirrors the editorial clarity of `corentinbernadou.com` and `13g.fr` with the character personality of `inkgames.com`.

---

## Core Messaging
**Headline (Primary CTA):** 
> Build a town. Stake real Sui. Watch it earn.

**Subheading (Value Prop):**
> Learn crypto by building. Every lesson you complete places real blocks. Every building you finish stakes real Sui on testnet. Your town is your onchain portfolio.

**Tone:** 
- Direct, playful, builder-coded (not condescending)
- Concrete metaphors over jargon
- Short sentences; rhythmic pacing
- Ownership language ("your town," "your portfolio")

---

## Visual Design System

### Color Palette
- **Background:** Dark ink (`#0A0E27` or similar—deep, not pitch-black)
- **Foreground (type):** Off-white/cream (`#FAF7F2`)
- **Accent Primary:** Electric blue (`#1E6BFF`); used sparingly for links, highlights
- **Accent Secondary:** Warm yellow (`#FFC83D`); calls out key actions or mascot
- **Dividers/Tertiary:** Subtle greys (`#3D4454`, `#5A6375`)
- **Success/DeFi:** Cyan (`#06B6D4`)

### Typography
- **Display/Headlines:** Geist Sans, 700 weight, tight tracking; scales responsively (64px → 36px mobile)
- **Body/Labels:** Geist Sans, 400/500, generous line height (1.5–1.7); 16–18px
- **Data/Captions:** Geist Mono, 12–13px; used for stats, code-like copy, nav items

### Spacing & Layout
- **Grid:** 12-column, 8px base unit
- **Max-width:** 1200px (desktop); full-width with 24px gutters mobile
- **Section margins:** 80px vertical rhythm (desktop), 48px mobile
- **Card padding:** 32px (desktop), 20px (mobile)

---

## Page Structure

### 1. Header (Fixed/Sticky)
- **Left:** BlockBuilders logotype (sans icon; just word, set in Geist Sans 700)
- **Center:** Empty (breathing room)
- **Right:** Nav links ("GitHub" / "Docs" / "Sui Overflow") + Wallet connect button (secondary style)
- **Style:** Glass or translucent backdrop; border-bottom subtle divider
- **Mobile:** Hamburger menu (if needed); logo + wallet button

### 2. Hero Section
**Layout:** 2-column asymmetric (desktop); stacked (mobile)

**Left Column (60%):**
- Eyebrow label: "Onchain learning + DeFi" (Mono, 11px, caps, muted)
- Headline: "Build a town." (Line 1 in electric blue)  
  "Stake real Sui." (Line 2 in electric blue)  
  "Watch it earn." (Line 3 in white)
- Subheading: 2–3 sentences clarifying the game loop
- CTAs (horizontal stack, mobile→vertical):
  - Primary: "Enter Sandbox" (solid electric blue bg, white text, rounded corners)
  - Secondary: "DeFi District →" (text link, no background)
  - Tertiary: "Read Lessons →" (text link, no background)
- Progress indicator (if user has played before): "3/6 lessons done · Town value: 1.50 SUI" (compact pill)

**Right Column (40%, desktop only):**
- **Mascot Hero Image:** (See Mascot Section below)
  - 3/4 isometric view of the chosen mascot (Suil/Raldo/RG-77)
  - Cubic/geometric style, chunky proportions, confident pose
  - Floating/dynamic composition (not static)
  - Single-color or 2-color palette (matches brand; avoid busy detail)
  - Subtle shadow beneath to ground it
  - Optional: small background elements (floating blocks, Sui logo accent)

### 3. Feature Strip (Optional)
Three short **benefit statements** in a rhythm:

| Icon | Headline | Copy |
|------|----------|------|
| 🧠 | **Learn real crypto** | 10 lessons, no jargon. Each one teaches a building block (literally). |
| 🏗️ | **Build instantly** | Drag blocks, watch your town appear. No tutorials, no loading bars. |
| 💰 | **Stake & earn** | Complete buildings in the DeFi District. Real 1 SUI stake on testnet. |

- **Style:** Cards with subtle borders, generous padding, full-width on mobile (stacked), 3-up on desktop
- **Typography:** Mono label → bold headline → dim body

### 4. The Curriculum / Lessons Table
Below the fold, past the hero. Shows all lessons as an **editorial table**:

| # | Lesson | Blocks | Learn |
|---|--------|--------|-------|
| 01 | Wallets | 🟨 🟨 | How you hold & spend on-chain. |
| 02 | Tokens | 🟩 🟩 | Digital currency with permission. |
| ... | ... | ... | ... |

- **Style:** Minimal table, alternating row backgrounds (subtle), no borders except bottom per row
- **Interaction:** Hover→highlight row + underline lesson title (signals clickability)
- **Mobile:** Stack into cards or accordion

### 5. Stats Bar / Social Proof (Optional)
Inline callout showing live data:
> **457** towns built · **8.25 SUI** staked across them · Built for [Sui Overflow 2026](link)

- **Style:** Mono, slightly larger than body, center-aligned, generous padding, subtle background
- **Mobile:** Stack vertically if needed

### 6. Footer
- **Left:** "BlockBuilders v0.X" (Mono, muted)
- **Center:** Links ("GitHub" / "Twitter" / "Docs")
- **Right:** "Sui testnet" (Mono, muted)
- **Border:** Subtle divider above

---

## Mascot Design

### Character Brief: Three Concepts (Suil / Raldo / RG-77)

**Option A: Suil**
- A **cubic water droplet** or fluid block with big eyes
- Chunky proportions, rounded corners on sharp cube edges
- Personality: cheerful, curious, bouncy
- Color: Electric blue with yellow highlights (like SUI branding, but our palette)
- Vibe: innocent builder, approachable for 8–14 audience but sophisticated enough for judges
- Pose: leaning forward or mid-jump, hands on hips (confident)

**Option B: Raldo**
- A **blocky robot** or automaton made of stacked cubes
- Angular, geometric, almost LEGO-like construction
- Big expressive visor/eyes, stubby limbs
- Personality: friendly, clever, tinkerer-coded
- Color: Warm yellow primary with electric blue accents
- Vibe: "I build things" energy; appeals to developer sensibility
- Pose: waving or holding up a small cube trophy

**Option C: RG-77**
- A **crystalline/geometric abstract form**—think faceted gem or isometric tower
- Symmetrical, sharp angles, almost art-deco in feel
- Optional: subtle glow or light refraction effect
- Personality: mysterious, elegant, sophisticated
- Color: Monochromatic (white/cream) with electric blue outline or shadow
- Vibe: premium, futuristic, appeals to older teens and adults
- Pose: centered, balanced, almost architectural

### Rendering Specs
- **Format:** PNG with transparency OR SVG (preferred for scalability)
- **Dimensions:** 400×400px (display) + 800×800px (print/retina)
- **Style:** Flat or subtle isometric shading (2–3 color layers); no photorealism
- **Animation-ready:** Design should support a subtle floating/breathing loop (CSS or JS)
- **Accessibility:** Solid silhouette + minimal detail so it reads at small sizes (favicon, avatar)

---

## Interactions & States

### Desktop
- Hover states on CTAs: slight scale up, color shift
- Hover on lesson row: row background lightens, title underlines
- Smooth scroll (no jarring jumps)
- Parallax or subtle depth cues (optional; don't overdo)

### Mobile
- Touch-friendly tap targets (48px min)
- Vertical rhythm preserved (no cramped spacing)
- Overflow-y-auto on content
- CTA buttons full-width or 2-up if space allows

### Responsive Breakpoints
- **Mobile (< 640px):** Single column, smaller type, stacked CTAs
- **Tablet (640–1024px):** 2-column on hero (if space), 1.5x spacing
- **Desktop (1024px+):** Full 2-column hero, 3-card features, table layout

---

## Accessibility
- Colour contrast ≥ 7:1 for all text
- Semantic HTML (proper heading hierarchy, nav landmarks)
- Alt text on mascot image: "Mascot [name], a playful cubic character"
- Skip link to main content
- Focus states visible on all interactive elements (keyboard nav)

---

## Copy Variants by Section

### Eyebrow (Above Headline)
- "Onchain learning + DeFi"
- "Learn. Build. Earn."
- "The Lego of crypto"

### Subheading (Below Headline, ~80 words)
Option 1: *Game-loop focused*
> BlockBuilders teaches crypto through play. Solve lessons → blocks drop into your town → complete buildings in the DeFi District → stake real SUI → watch your town earn. Your portfolio, visualized.

Option 2: *Audience-first*
> Understand wallets, tokens, DeFi, and validators by building. Every lesson is a 5-minute read + quick quiz. Every quiz you finish places a block in your town. Finish all ten and you've built something real—backed by onchain stakes.

### Feature Cards (3 benefits)
1. **Learn real crypto** — No jargon dumps. Each lesson teaches one concept; your town grows as you progress.
2. **Build instantly** — Drag blocks onto a grid. No animations between actions, no loading screens, no meta-game menu shuffling.
3. **Stake & earn** — Complete buildings in the DeFi District. Deposit 1 testnet SUI. Your stakes compound every epoch.

### Lessons Table Intro
- "Ten lessons. One town. Real onchain stakes."
- "The curriculum — each unlocks new blocks as you complete it."

### Footer CTA (if included)
- "Built for Sui Overflow 2026" or "Built on Sui testnet"

---

## Technical Implementation Notes
- Mascot should be **lazyLoadable** (image or SVG async)
- Page should be **Server-Side Renderable** (if using Next.js; not a blocker for Vite)
- Stats bar can pull from **onchain query** (number of towns, total SUI staked) with a `useQuery` hook and fallback placeholder
- Lesson table can **link to Lessons screen** via `onClick={() => setScreen('lessons')}`
- Wallet button integration: connects to Sui via `@mysten/dapp-kit`

---

## References / Inspiration
- **Editorial clarity:** corentinbernadou.com, 13g.fr (minimal, confident, type-forward)
- **Character personality:** inkgames.com (playful mascot, integrated into layout, not tacked on)
- **Crypto simplicity:** fora.so (clean, no jargon, visual hierarchy)
- **Dark + branding:** Stripe, Vercel, Linear (dark bg, bold type, strategic accent color)

---

## Deliverables
1. **JSX Component** (React + Tailwind): `Landing.tsx` replacement with mascot, new copy, restructured layout
2. **Mascot Asset** (PNG 800×800 + SVG if possible): Ready to integrate, with floating/breathing animation CSS
3. **Figma Mockup** (optional): For sign-off before implementation

---

## Success Criteria
✅ Page loads in < 2s (including mascot image)  
✅ Mobile first: fully responsive 320px → 1920px  
✅ Accessible: WCAG 2.1 AA (contrast, keyboard nav, semantics)  
✅ "Wow factor" for Sui judges: sophisticated but playful, not juvenile  
✅ New users understand: "I read lessons → my town grows → I can stake real SUI"  
✅ Returning users see: progress chip + wallet button + quick nav to DeFi/Sandbox  
✅ Mascot feels integrated (not a floating logo tacked on top)  
