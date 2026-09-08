# Portfolio Design System

## Intent
The portfolio should feel authored, editorial and kinetic. The reference level of ambition is `zainabkabira.com`, but the visual identity, copy, project treatment and interactions must remain original.

## Core idea
**I build useful things, then make them feel alive.**

The site should communicate range without looking unfocused: software, AI, 3D, product, systems and business work are all connected by building real things and understanding the system around them.

## Visual language

### Palette
- Warm paper background rather than pure white.
- Near-black primary text.
- Cobalt accent reserved for interactive emphasis and motion details.
- Project sections may use their own muted art-direction tones.
- Avoid generic neon gradients, glassmorphism and repeated glowing cards.

### Typography
- Large, tightly tracked sans-serif display type.
- Serif italic used sparingly as a contrast voice.
- Small uppercase metadata for project numbers, status and navigation.
- Text hierarchy should carry the composition before decoration does.

### Layout
- Full-width editorial sections.
- Strong rules/borders instead of card containers.
- Each featured project gets a large visual stage and its own composition.
- Supporting work can use compact rows, but should still feel intentional.
- Mobile layouts are re-composed, not simply scaled down.

## Motion language
Motion is part of the identity, not an afterthought.

Use:
- staged reveal on entry;
- scroll progress;
- subtle image/object drift and parallax;
- pointer-reactive project stages;
- custom cursor labels on desktop;
- continuous ticker motion;
- page transitions through Astro's client router;
- project-specific motion when real assets are added.

Avoid:
- animating every small piece of text;
- excessive spring/bounce motion;
- long intro loaders;
- motion that blocks navigation;
- effects that only exist to show off code.

Always support `prefers-reduced-motion`.

## Content rules
- Real work first.
- Show problem, decisions, implementation and outcome.
- Clearly label prototype, active development and planned features.
- Do not invent metrics.
- Do not use generated UI screenshots to imply functionality that does not exist.
- Real screenshots/renders should replace temporary abstract art-direction stages before production launch.

## Project hierarchy

### Featured
1. HomeMah
2. Koh Seng B2B
3. HealthMate
4. OPTCG Tracker

### Supporting
5. SmartDeskOS
6. KOI Studio

### Future candidates
- RagASTAR
- DigiTutor
- Probability Study Webapp
- Interactive 3D Product Configurator

## Source structure
- `src/data/projects.ts` — project content and status source of truth.
- `src/pages/index.astro` — homepage composition.
- `src/pages/work/[slug].astro` — generated project case-study routes.
- `src/styles/global.css` — visual tokens, layout and motion styling.
- `src/scripts/site.ts` — progressive enhancement for scroll/pointer motion.
- `public/images/projects/<slug>/` — final project visual assets.

When changing the design later, update this document when the underlying principles or file ownership changes.
