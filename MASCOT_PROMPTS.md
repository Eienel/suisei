# BlockBuilders Mascot Generation Prompts

Three distinct character concepts ready for visual generation via Midjourney or DALL-E.

---

## Option A: Suil
### Character Description
A cheerful, curious cubic water droplet with big expressive eyes. Chunky proportions with slightly rounded corners on sharp cube edges. Personality: bouncy, innocent, approachable for young builders but sophisticated enough for judges.

### Midjourney Prompt
```
A cute cubic water droplet character with big bright eyes, chunky geometric proportions, 
rounded corners on sharp edges, electric blue (#1E6BFF) primary color with warm yellow 
(#FFC83D) highlights, leaning forward in a confident pose with hands on hips, 
isometric shading, flat or subtle 3D, playful expression, Lego-like construction aesthetic, 
clean solid color palette, no photorealism, 3/4 view, floating isolated on transparent background,
character design, vector art style --ar 1:1 --niji
```

### DALL-E Prompt
```
A cheerful cubic character named Suil. It looks like a chunky water droplet made of 
bright electric blue (#1E6BFF) with warm yellow accents. Big friendly eyes, hands on hips,
confident leaning pose. Simple geometric shapes, flat shading with subtle isometric depth.
The character feels like a friendly Lego brick with personality. Isolated on transparent 
background, 3/4 isometric view, character design, no photorealism.
```

### Design Notes
- **Primary color:** Electric blue (#1E6BFF)
- **Accent:** Warm yellow (#FFC83D)
- **Style:** Flat or subtle isometric
- **Emotion:** Cheerful, curious, bouncy
- **Silhouette:** Chunky water droplet
- **Target audience:** Appeals to 8–14 year-olds and tech-savvy adults

---

## Option B: Raldo
### Character Description
A friendly blocky robot or automaton made of stacked cubes and geometric shapes. Angular and almost Lego-like in construction, with a big expressive visor/eyes and stubby limbs. Personality: clever, tinkerer-coded, "I build things" energy.

### Midjourney Prompt
```
A blocky robot character named Raldo, constructed from stacked geometric cubes and angular shapes,
warm yellow (#FFC83D) primary with electric blue (#1E6BFF) accents, big expressive visor or eyes,
stubby limbs, holding or gesturing with a small cube trophy or block, confident waving pose,
Lego-like construction, isometric shading, flat style, builder/tinkerer aesthetic,
clean solid colors, no photorealism, 3/4 view, isolated on transparent background,
character design, vector art style --ar 1:1 --niji
```

### DALL-E Prompt
```
A blocky robot character named Raldo. It's built from stacked cubes and geometric shapes,
warm yellow (#FFC83D) with electric blue accents. A big expressive visor or eyes,
stubby arms and legs, confident pose with one hand raised as if waving or holding a trophy.
Lego-like construction, simple geometric style with flat shading. Feels like a builder or 
tinkerer robot with personality. Isolated on transparent background, 3/4 isometric view,
character design, no photorealism.
```

### Design Notes
- **Primary color:** Warm yellow (#FFC83D)
- **Accent:** Electric blue (#1E6BFF)
- **Style:** Flat with isometric shading
- **Emotion:** Clever, confident, builder-coded
- **Silhouette:** Stacked cubes + blocky form
- **Unique element:** Holding a trophy/gem or waving gesture
- **Target audience:** Developers, builders, anyone who codes

---

## Option C: RG-77
### Character Description
A crystalline, geometric abstract form—think faceted gem or isometric tower with symmetrical, sharp angles and almost art-deco aesthetic. Mysterious, elegant, sophisticated. Optional subtle glow or light refraction effect.

### Midjourney Prompt
```
An abstract crystalline character named RG-77, symmetrical geometric form like a faceted gem or tower,
sharp angular edges, art-deco aesthetic, monochromatic off-white/cream (#FAF7F2) with electric blue 
(#1E6BFF) outline or shadow, optional subtle glow or light refraction, elegant and mysterious,
minimal detail, isometric perspective, flat or geometric shading, futuristic yet timeless,
premium minimalist design, isolated on transparent background, no photorealism,
character design, vector art style --ar 1:1 --niji
```

### DALL-E Prompt
```
An elegant geometric abstract character named RG-77. It resembles a symmetrical crystalline form,
like a faceted gem or isometric tower, with sharp angular edges and an art-deco aesthetic.
Monochromatic off-white (#FAF7F2) with electric blue outline. Subtle glow effect optional.
Sophisticated, mysterious, minimal detail. Geometric shading, premium minimalist style.
Looks timeless and futuristic. Isolated on transparent background, 3/4 view,
character design, no photorealism.
```

### Design Notes
- **Primary color:** Monochromatic off-white (#FAF7F2)
- **Accent:** Electric blue (#1E6BFF) outline/shadow
- **Style:** Geometric, art-deco inspired
- **Emotion:** Mysterious, elegant, sophisticated
- **Silhouette:** Symmetrical, faceted, tower-like
- **Special effect:** Optional subtle glow or refraction
- **Target audience:** Older teens, adults, judges who prefer premium design

---

## Generation Settings (Common to All)

- **Format:** PNG with transparency (300 DPI for print, 400×400px for web)
- **Art direction:** Flat or subtle isometric shading; no photorealism
- **Silhouette:** Must read clearly at 64px (favicon/avatar size)
- **Color accuracy:** Match hex codes where possible
- **Pose:** 3/4 view, confident, dynamic (not static)
- **Animation-ready:** Design supports a subtle floating/bobbing CSS animation loop

---

## Next Steps

1. **Choose a generation tool:**
   - Midjourney (premium, very consistent, handles style direction well)
   - DALL-E 3 (strong with character design, good color control)
   - Stable Diffusion (budget-friendly, less consistent)

2. **Generate all three concepts** and display side-by-side for comparison

3. **Iterate on winner:**
   - Small adjustments (eye size, pose, color intensity)
   - Ensure it exports cleanly with transparent background
   - Generate 2–3 variations of the chosen concept

4. **Asset preparation:**
   - Export as PNG 800×800px (web) + 1600×1600px (print)
   - Export as SVG if vectorizable (for perfect scaling)
   - Create a 2-frame floating animation CSS (optional)

5. **Integration:**
   - Place image in `public/assets/mascot-[name].png`
   - Update `Landing.tsx` MascotHero component to reference the asset

---

## Color Reference

For consistent generation across attempts:

| Color Name | Hex | RGB | Usage |
|---|---|---|---|
| Electric Blue | `#1E6BFF` | 30, 107, 255 | Primary accent, hero CTA |
| Warm Yellow | `#FFC83D` | 255, 200, 61 | Secondary accent, highlights |
| Off-white | `#FAF7F2` | 250, 247, 242 | Background, primary text |
| Dark Ink | `#0A0E1A` | 10, 14, 26 | Page background |

---

## Fallback: DIY Vector Design

If generation tools underperform:
1. Sketch in Figma or Adobe Illustrator
2. Keep it **simple:** 2–4 color layers, clear silhouette
3. Use **grid-based** construction for geometric feel
4. Export SVG for infinite scalability

