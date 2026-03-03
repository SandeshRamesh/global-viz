# Responsive Design Analysis — Atlas Visualization

## 1. Current State: What We Have

The app is a **full-screen, absolute-positioned layout** with no responsive breakpoints. Every element uses fixed pixel values. There is exactly **one media query** in the entire codebase (`prefers-reduced-motion`). Zero screen-size media queries.

### Layout Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ [Search + Rings]          [StrataTabs center]    [ViewTabs]  │
│  absolute top-left        absolute top-center    abs top-rt  │
│  width: min(220px, 26vw)                                     │
│                                                              │
│                     ┌──────────────────────────┐             │
│                     │   SVG Radial Graph       │             │
│                     │   (100% x 100%)          │             │
│                     │   D3 zoom/pan            │             │
│                     └──────────────────────────┘             │
│                                                              │
│  [DataQuality]  [Simulate]  [Timeline]     [SimPanel 380px]  │
│  fixed bot-left  fixed b-l   fixed bottom   fixed, draggable │
│  48x48           48x48       48px / expand  380x560 max      │
└──────────────────────────────────────────────────────────────┘
```

Everything overlays a single full-viewport SVG. Panels float on top with `position: fixed` or `position: absolute`. The SVG + D3 zoom handles its own scaling via `ViewportScales.ts`.

### Hardcoded Dimensions That Matter

| Element | Size | Where |
|---------|------|-------|
| SimulationPanel | 380 x 560px | SimulationPanel.tsx:20-21 |
| DataQualityPanel | ~340 x 450px | DataQualityPanel.tsx:47,204 |
| Search sidebar | min(220px, 26vw) | App.tsx:5980 |
| Search input | 260px fixed | App.tsx:5998 |
| Split view ratio | 67% / 33% fixed | App.tsx:400 |
| ViewTabs buttons | 8px 16px padding | ViewTabs.tsx:93 |
| StrataTabs buttons | 8px 16px padding, minWidth 65-85px | StrataTabs.tsx:96-105 |
| Bottom buttons | 48 x 48px | App.tsx:6212 |
| Timeline expanded | 240px track + controls | TimelinePlayer.tsx:710 |
| Minimum font size | 9px (ring expand buttons) | App.tsx:6158 |

### What Already Scales Well

- **SVG radial graph**: `ViewportScales.ts` uses `baseUnit = Math.min(width, height) * 0.01` — the graph itself adapts to any viewport. This is the core visualization and it's already responsive.
- **D3 zoom/pan**: Works at any size, users can zoom into dense areas.
- **Node sizing, edge thickness, text**: All computed from viewport dimensions.
- **Panel clamping**: Both draggable panels clamp to viewport bounds.
- **Search container**: Uses `min(220px, 26vw)` — partially responsive.

### What Breaks

| Viewport | What Breaks |
|----------|-------------|
| **< 1440px** | Split view right pane gets cramped (33% of 1440 = 475px) |
| **< 1280px** | Split view right pane unusable (33% of 1280 = 422px) |
| **< 1024px** | StrataTabs (4 buttons × ~80px = 320px) + ViewTabs (3 buttons × ~70px = 210px) start competing for horizontal space |
| **< 768px** | SimulationPanel (380px) occupies half the screen; split view is pointless |
| **< 600px** | SimulationPanel wider than viewport on some phones; StrataTabs overflow |
| **< 480px** | Everything overlaps. Panels cover the entire graph. Bottom buttons overlap timeline. |

---

## 2. Industry Standard Breakpoints

| Name | Width | Devices | Usage Share |
|------|-------|---------|-------------|
| **Desktop XL** | ≥ 1920px | External monitors, ultrawide | ~15% |
| **Desktop** | 1280–1919px | Laptops, standard monitors | ~45% |
| **Tablet Landscape** | 1024–1279px | iPad landscape, small laptops | ~10% |
| **Tablet Portrait** | 768–1023px | iPad portrait, large phones landscape | ~8% |
| **Phone Landscape** | 600–767px | Phones in landscape | ~5% |
| **Phone Portrait** | < 600px | Phones in portrait | ~17% |

For an **academic research tool** presented at conferences, the realistic audience is:
- **70%+ laptop/desktop** (1280px+) — primary audience
- **15-20% tablet** (768-1279px) — secondary, iPad at conferences
- **10-15% phone** (< 768px) — checking results on the go

---

## 3. Desktop Adaptive Improvements (Phase 9A)

Before tackling mobile, the desktop experience itself has sizing issues at common resolutions. These are the quick-win fixes that improve desktop AND make mobile easier later.

### 3A. Fix the Split View Ratio

**Problem**: Fixed 67/33 split. At 1280px, the right pane (Local View) gets 422px — barely usable. At 1440px it's 475px — tight but workable.

**Fix**: Make split ratio viewport-aware.

```
≥ 1600px:  67/33 (current) — plenty of room
1280-1599: 60/40 — give local view more breathing room
1024-1279: 55/45 — near-equal split
< 1024px:  no split — stack or tab between views
```

The ratio should also be **user-draggable** (a resize handle between the two panes). This is a common pattern in IDEs and dashboards.

### 3B. Fix Search Input Overflow

**Problem**: Container is `min(220px, 26vw)` but the input inside is hardcoded at `width: 260px`. The input overflows its container below ~1000px.

**Fix**: Change input to `width: '100%'` and let the container control the width.

### 3C. SimulationPanel Sizing

**Problem**: Fixed 380x560. This is fine on 1920px but eats 30% of horizontal space on 1280px. On small laptops (1366x768 — extremely common resolution), the 560px max-height exceeds the viewport height minus the bottom bar.

**Fix**:
```
width:     min(380px, 90vw)
maxHeight: min(560px, calc(100vh - 100px))
```

This keeps current look on large screens but adapts gracefully. The panel already scrolls internally, so height reduction works naturally.

### 3D. StrataTabs + ViewTabs Collision

**Problem**: On screens < 1100px, the center-positioned StrataTabs and right-positioned ViewTabs start overlapping or getting uncomfortably close.

**Fix**: At < 1100px, move StrataTabs from center to left (below the search panel). This frees the top bar and prevents collision. Or use compact labels: "Uni" / "Dev" / "Emg" / "Adv" below 1200px.

### 3E. Font Size Floor

**Problem**: Some text goes as low as 9px (ring expand buttons). On high-DPI displays this is fine, but on standard 1080p monitors at 100% scaling it's hard to read.

**Fix**: Set a global minimum of 11px for interactive text. For decorative/secondary labels, 10px minimum.

---

## 4. Tablet Strategy (Phase 9B: 768–1279px)

Tablets are the **bridge** — the visualization still works, but the UI chrome needs to reorganize. The graph itself scales fine thanks to ViewportScales.

### Key Changes for Tablet

**No split view below 1024px.** The radial graph needs at minimum ~600px to be legible. Below 1024px, split view produces two unusable panes. Instead: tab between Global and Local with a smooth transition.

**Collapsible sidebar.** The left search/rings panel should collapse to an icon that expands on tap. This frees the full viewport for the graph on 768px screens.

**Bottom sheet panels.** SimulationPanel and DataQualityPanel should switch from draggable floating panels to **bottom sheets** that slide up from the bottom. This is the standard tablet/mobile pattern for tools panels. On desktop they stay as floating panels.

**Compact tabs.** StrataTabs and ViewTabs should use icon+label or icon-only below 1024px to save horizontal space.

**Touch-friendly graph.** The radial graph already supports pinch-to-zoom via D3. The main gap is that double-click-to-select is hard to discover on touch. Consider adding a long-press or tap-and-hold alternative.

### Tablet Layout (768-1023px)

```
┌─────────────────────────────────┐
│ [☰] [StrataTabs compact]  [Tabs]│  ← hamburger replaces search
│                                 │
│         SVG Radial Graph        │  ← full viewport
│         (100% x 100%)          │
│                                 │
│ [DQ] [Sim] [▶]                 │  ← bottom buttons unchanged
└─────────────────────────────────┘
   ↕ SimulationPanel slides up as bottom sheet
```

---

## 5. Phone Strategy (Phase 9C: < 768px)

Phones are the hardest. A complex radial causal graph on a 375px screen is inherently challenging. The goal isn't feature parity — it's **useful access to key information**.

### What Works on Phone

- **View the graph** — the radial layout actually renders fine at small sizes thanks to ViewportScales. Users can pinch-zoom into areas of interest.
- **Select a country** — the country selector is a search box, which works fine on mobile.
- **View simulation results** — the results table is scrollable text.
- **Timeline scrubbing** — the timeline player works with touch.

### What Doesn't Work on Phone

- **Building interventions** — selecting indicators from a 200-item grouped dropdown on a phone is painful. But the template system helps (pre-built scenarios).
- **Split view** — impossible at < 768px. Use tab switching.
- **Draggable panels** — no room to drag. Must be bottom sheets or full-screen overlays.
- **Hover cards** — no hover on touch. Need tap-to-inspect.
- **Hotkey legend** — irrelevant on phone.

### Phone Layout (< 600px)

```
┌──────────────────────┐
│ [☰]  Atlas   [⚙]    │  ← minimal header
│                      │
│    SVG Radial Graph  │  ← full viewport, pinch zoom
│                      │
│                      │
│ [▶ 2015]             │  ← minimal timeline (docked)
├──────────────────────┤
│ [Graph] [Sim] [Data] │  ← bottom tab bar
└──────────────────────┘
```

- **Bottom tab bar** replaces all floating buttons and view tabs
- **Graph tab**: Full-screen radial view with country selector as slide-down
- **Sim tab**: Full-screen simulation panel (no longer a floating popup)
- **Data tab**: Data quality + results
- **No split view** — Local View accessed by tab switching

### Phone Touch Interactions

| Desktop | Phone Equivalent |
|---------|-----------------|
| Double-click node | Tap (expand) + long-press (inspect) |
| Hover for tooltip | Tap to show tooltip, tap elsewhere to dismiss |
| Scroll wheel zoom | Pinch to zoom |
| Drag to pan | Touch drag |
| Keyboard shortcuts | Gesture equivalents or bottom bar buttons |
| Right-click | Long press context menu (future) |

---

## 6. Implementation Priority

### Phase 9A — Desktop Adaptive (Low risk, high impact)
1. Responsive split ratio (viewport-aware)
2. Fix search input overflow (width: 100%)
3. SimulationPanel responsive sizing (min/vw/vh)
4. DataQualityPanel responsive sizing
5. StrataTabs/ViewTabs collision handling
6. Font size floor (11px minimum for interactive text)
7. Add resize observer for dynamic layout recalc

### Phase 9B — Tablet (Medium risk, medium impact)
1. Hide split view below 1024px
2. Collapsible search sidebar (hamburger menu)
3. Bottom sheet pattern for panels
4. Compact tab labels
5. Touch-friendly node selection

### Phase 9C — Phone (High risk, high impact)
1. Bottom tab navigation
2. Full-screen panel views
3. Tap-to-inspect (replace hover)
4. Minimal header
5. Simplified timeline
6. Template-first simulation (skip manual intervention building)

### Breakpoint Constants

```typescript
export const BREAKPOINTS = {
  PHONE:           600,   // Phone portrait max
  TABLET:          768,   // Tablet portrait min
  TABLET_LANDSCAPE: 1024, // Tablet landscape / small laptop
  DESKTOP:         1280,  // Standard desktop min
  DESKTOP_XL:      1600,  // Large desktop
} as const
```

---

## 7. What NOT to Do

- **Don't hide the graph on mobile.** The radial visualization IS the product. It should always be visible and interactive, even on small screens. ViewportScales already handles this.
- **Don't build a separate mobile app.** The same codebase should adapt. React conditional rendering + CSS media queries are sufficient.
- **Don't compromise desktop for mobile.** Desktop is the primary audience. Mobile adaptations should be additive, not reductive.
- **Don't over-abstract early.** Start with CSS media queries and conditional rendering. Don't build a layout engine.
