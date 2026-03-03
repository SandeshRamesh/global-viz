# Atlas — Identity & Design System

## Personality

Atlas is a research observatory, not a dashboard. It exists to reveal the hidden machinery of human progress — causal chains across 178 countries and 35 years. The tone is **curious, authoritative, and unhurried**. It invites you to look closer, not to act faster.

**Voice keywords:** Exploratory. Grounded. Cinematic. Scholarly but not academic. Ambitious but not hype.

**Atlas is not:**
- A SaaS product ("Start your free trial")
- An NGO awareness campaign ("Together we can change the world")
- A news site ("Breaking: new data shows...")
- A government report (dry, bureaucratic, passive voice)

**Atlas is:**
- A research instrument presented beautifully ("What actually drives human progress?")
- Confident in what the data shows, honest about what it doesn't
- Speaking to smart people who don't need hand-holding
- More observatory than classroom — it shows, then explains if you ask

---

## Relationship to Argon Analytics

Argon is the company. Atlas is its north-star research project. They share craftsmanship DNA but serve different purposes.

| Dimension | Argon Analytics | Atlas |
|-----------|----------------|-------|
| Metaphor | Bloomberg terminal | Research observatory |
| Background | Pure black `#000000` | Deep space `#060918` |
| Accent | Bright green `oklch(0.92 0.32 125)` | Cyan `#00E5FF` |
| Feeling | Clinical, sharp, business | Vast, exploratory, cinematic |
| Motion | Linear fades and slides | Orbital arcs, slow rotation |
| Texture | Deliberately flat | Atmospheric (faint grids, wireframes) |
| Scale | Functional (48-56px headlines) | Dramatic (72-96px headlines) |
| Audience | Business decision-makers | Researchers, policymakers, curious minds |

**Shared:** Satoshi font, 400/500 weights only, 8px grid, 1px barely-visible borders, slow deliberate animation, no gradients, no rounded-full, no bouncy motion, no illustrations.

---

## Color Palette

### Foundations

| Role | Value | Usage |
|------|-------|-------|
| Background | `#060918` | Page base — 60% of visual space. Deep navy-black, not pure black. |
| Surface | `#0c1024` | Cards, elevated sections, content blocks |
| Elevated | `#121830` | Hover states, active cards, dropdowns |
| Overlay | `#1a2040` | Modals, tooltips, overlays |
| Border | `rgba(255,255,255, 0.08)` | 1px structural separation, never decorative |
| Border hover | `rgba(255,255,255, 0.15)` | Interactive border states |

### Text

| Role | Value | Usage |
|------|-------|-------|
| Primary | `rgba(255,255,255, 0.95)` | Headlines, important content |
| Secondary | `rgba(255,255,255, 0.70)` | Body text, descriptions |
| Muted | `rgba(255,255,255, 0.35)` | Labels, metadata, captions |
| Disabled | `rgba(255,255,255, 0.20)` | Inactive elements |

### Accent — Cyan

| Role | Value | Usage |
|------|-------|-------|
| Accent | `#00E5FF` | CTAs, emphasis words, active states, stat numbers |
| Accent dim | `rgba(0, 229, 255, 0.15)` | Subtle backgrounds behind accent elements, badges |
| Accent glow | `rgba(0, 229, 255, 0.40)` | Hover glow, box-shadow on primary buttons |

Cyan is never used for large background fills. It highlights — a word, a border, an icon, a data point. Same 2% rule as Argon's green: sparingly, deliberately.

### Distribution Rule

60% deep background / 30% white text at varying opacities / 10% cyan accent (sparingly).

---

## Typography

### Font

**Satoshi** (variable, loaded locally). Two weights only:

- **Regular 400** — body text, descriptions, metadata
- **Medium 500** — headings, buttons, interactive elements, nav

No Bold (700). White on dark backgrounds reads heavier — shift everything one weight down.

### Scale

Perfect Fourth ratio (1.333), base 16px. All display text uses `clamp()` for fluid sizing between 320px and 1440px.

| Level | Size | Line Height | Letter Spacing | Usage |
|-------|------|-------------|----------------|-------|
| Display | clamp(48px, 6vw, 96px) | 1.0 | -0.025em | Hero headline only |
| H1 | clamp(36px, 4.5vw, 72px) | 1.05 | -0.02em | Section headlines |
| H2 | clamp(28px, 3vw, 42px) | 1.1 | -0.015em | Subsection heads |
| H3 | clamp(20px, 2vw, 28px) | 1.2 | -0.01em | Card titles, callout heads |
| Body | 16px–18px | 1.5 | 0 | Paragraphs, descriptions |
| Small | 14px | 1.5 | 0 | Captions, metadata |
| Label | 12px–13px uppercase | 1.3 | +0.06em | Section labels, tags |

### Rules

- Inverse relationship: bigger text = tighter line height
- Uppercase labels always get widened letter-spacing (+0.05em to +0.08em)
- No italics in headings. Italics allowed sparingly in body for emphasis
- Max body width: 680px for readability

---

## Motion

### Philosophy

Atlas motion is **orbital** — slow arcs, gentle rotation, parallax that suggests you're moving around a subject rather than scrolling past it. Nothing bounces. Nothing snaps. Everything decelerates like an object in low gravity.

### Timing

| Context | Duration | Easing |
|---------|----------|--------|
| Micro (hover, focus) | 200ms | `cubic-bezier(0.25, 0.1, 0.25, 1.0)` |
| Standard (panels, cards) | 400–600ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Cinematic (hero, section enter) | 800–1200ms | `cubic-bezier(0.08, 0.82, 0.17, 1)` |
| Atmospheric (background globe, grids) | 20–60s loops | `linear` or very gentle ease |

### Allowed Motion Types

- Fade in with slight upward drift (20-40px, not more)
- Slow scale from 0.96 → 1.0 on entry
- Orbital rotation on background elements (globe, grid)
- Parallax depth on scroll (subtle — 0.05-0.15 factor)
- Counter-value ticking (numbers counting up on enter)

### Disallowed Motion

- Bounce, spring, elastic easing
- Slide-in from off-screen edges
- Staggered card waterfalls (too SaaS)
- Lottie/GIF illustrations
- Anything faster than 150ms (feels jumpy)

---

## Component DNA

### Borders & Surfaces

- Border: `1px solid rgba(255,255,255, 0.08)` — structural, not decorative
- Border radius: `12px` for cards/sections, `8px` for buttons/inputs, `4px` for small elements
- Never `rounded-full` on anything
- No box-shadow. Depth comes from surface color stepping (`#060918` → `#0c1024` → `#121830`)

### Buttons

| State | Style |
|-------|-------|
| Default | Cyan border + cyan text, transparent background |
| Hover | Cyan background + dark text (`#060918`), subtle glow |
| Disabled | `rgba(255,255,255, 0.15)` border + text |

Secondary buttons use white at 0.35 opacity, hover to 0.70.

### Cards

- Background: `#0c1024` (surface)
- Border: `1px solid rgba(255,255,255, 0.08)`
- Radius: `12px`
- Padding: `32px` desktop, `24px` mobile
- Hover: background shifts to `#121830`, border to `rgba(255,255,255, 0.15)`
- Transition: 400ms standard easing

### Navigation

- Fixed position, `background: rgba(6, 9, 24, 0.80)`, `backdrop-filter: blur(12px)`
- Solid `#060918` when mobile menu open
- Logo left, links center or right, CTA right
- Height: 64px desktop, 56px mobile

### Spacing

8px grid. Everything snaps to multiples of 8.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 8px | Tight gaps, inline spacing |
| sm | 16px | Between related elements |
| md | 24px | Component internal padding |
| lg | 32px | Between components |
| xl | 48px | Between subsections |
| 2xl | 64px | Between sections (mobile) |
| 3xl | 96px | Between sections (desktop) |
| 4xl | 128px | Hero vertical padding |

---

## Texture & Atmosphere

Atlas is allowed subtle environmental texture that Argon is not. This creates the "observatory" feeling.

### Allowed

- Faint wireframe globe in hero backgrounds (data-blue at 0.05-0.10 opacity)
- Dot grid or fine line grid as section backgrounds (data-blue at 0.05)
- Constellation-style connecting dots for data relationships
- Subtle radial gradient from center (not color gradient — just a barely-visible light falloff, like `radial-gradient(ellipse at center, rgba(140,165,210,0.03) 0%, transparent 70%)`)
- Map outlines as watermarks behind content sections

### Disallowed

- Photographic backgrounds or stock imagery
- Illustrated icons or mascots
- Decorative gradients (multi-color, visible)
- Particle effects or heavy WebGL scenes on the landing page
- Patterns that compete with content

---

## Imagery & Data Visualization

- Maps use cyan for highlighted countries/regions, white at low opacity for inactive
- Graphs: white lines on dark background, cyan for primary data series
- No 3D charts. Flat, clean, D3-style visualizations
- Stat numbers displayed large (H1-H2 scale) with muted labels beneath
- When showing the tool in screenshots/mockups: actual screenshots with subtle border + rounded corners, never device mockups (no fake browser chrome, no phone frames)

---

## Responsive Notes

- Mobile hero headline: `clamp(48px, 6vw, 96px)` handles this naturally
- Section padding compresses: 3xl → 2xl on mobile
- Cards go full-width below 768px, maintain 24px padding
- Navigation switches to hamburger below 768px
- Atmospheric textures (globe, grids) reduce opacity or hide on mobile for performance

---

## Quick Reference — CSS Variables

```css
:root {
  /* Backgrounds */
  --atlas-bg: #060918;
  --atlas-surface: #0c1024;
  --atlas-elevated: #121830;
  --atlas-overlay: #1a2040;

  /* Text */
  --atlas-text-primary: rgba(255, 255, 255, 0.95);
  --atlas-text-secondary: rgba(255, 255, 255, 0.70);
  --atlas-text-muted: rgba(255, 255, 255, 0.35);
  --atlas-text-disabled: rgba(255, 255, 255, 0.20);

  /* Accent — Cyan */
  --atlas-accent: #00E5FF;
  --atlas-accent-dim: rgba(0, 229, 255, 0.15);
  --atlas-accent-glow: rgba(0, 229, 255, 0.40);

  /* Borders */
  --atlas-border: rgba(255, 255, 255, 0.08);
  --atlas-border-hover: rgba(255, 255, 255, 0.15);

  /* Motion */
  --atlas-ease-micro: cubic-bezier(0.25, 0.1, 0.25, 1.0);
  --atlas-ease-standard: cubic-bezier(0.16, 1, 0.3, 1);
  --atlas-ease-cinematic: cubic-bezier(0.08, 0.82, 0.17, 1);

  /* Typography */
  --atlas-font: 'Satoshi', system-ui, -apple-system, sans-serif;
}
```
