# Phase 9B/C — Tablet & Mobile Fixes

## Problems

### P1: Tutorial off-screen on iPad (Tablet)
iPads (768x1024 portrait, 1024x768 landscape) fall into the "desktop" code path since `width >= 768`. But the tutorial card at `bottom: 100px` fixed positioning doesn't account for tablet viewport heights. The tutorial nav and card can overlap or clip off the bottom on shorter tablet viewports. No tablet-specific CSS or positioning logic exists anywhere — iPads get full desktop layout in a cramped viewport.

### P2: Simulation step description disappears too fast on mobile
`TimelinePlayer.tsx` uses 2s delay on mobile before collapsing the expanded state (line 211), vs 4s on desktop (line 217). Users don't have time to read the simulation description before it vanishes.

### P3: Country description missing during tutorial on mobile
During the tutorial's country/simulation steps (steps 4-7), the country description panel is not visible on mobile. Likely the sidebar drawer (which holds descriptions) is collapsed by default on mobile (`viewport.isBelow(768)`) and the tutorial doesn't force it open.

---

## Current Breakpoint Architecture

```
0 -------- 479 -------- 768 -------- 1024 -------- 1280 -------- 1600
  small-mob    mobile      tablet       tablet-land    desktop       desktop-xl
```

| Constant | Value | Current behavior |
|----------|-------|-----------------|
| — | 479px | Small mobile (Tutorial.css only) |
| TABLET | 768px | Mobile/desktop boundary everywhere |
| TABLET_LANDSCAPE | 1024px | Split view disabled below this |
| DESKTOP | 1280px | Split ratio 60% |
| DESKTOP_XL | 1600px | Split ratio 67% |

**Gap**: No distinct tablet handling between 768-1024px. iPads in portrait (768px) just barely enter "desktop" mode but don't have the space for it.

---

## Plan

### Fix 1: Tablet tutorial positioning
**Files**: `src/components/Tutorial.tsx`, `src/components/Tutorial.css`

1. Add tablet media query `@media (min-width: 768px) and (max-width: 1024px)`:
   - Tutorial card: reduce `bottom` to ~80px, reduce max-width, increase padding
   - Tutorial nav: adjust bottom positioning to avoid overlap with card
   - Ensure card doesn't exceed viewport height (add `max-height: calc(100vh - 160px)` with overflow)

2. In Tutorial.tsx, add tablet-aware positioning for spotlight steps:
   - Check `window.innerWidth < 1024` (not just `< 768`) for tighter positioning
   - Step 4 (map): card position needs tablet-specific offset
   - Step 5 (sim panel): ensure card doesn't overlap sim panel on tablet

3. Test viewports:
   - iPad 10th gen: 810x1080 (portrait)
   - iPad Air: 820x1180 (portrait)
   - iPad Pro 11": 834x1194 (portrait)
   - iPad landscape: 1024x768
   - iPad Pro 12.9" landscape: 1366x1024

### Fix 2: Increase mobile simulation description delay
**File**: `src/components/simulation/TimelinePlayer.tsx`

1. Line ~211: Change mobile collapse timeout from `2000` to `4000` (match desktop timing)
   - Or better: use `3500` — slightly shorter than desktop but enough to read
2. Consider: add a brief "tap to dismiss" hint on mobile so users know they can interact

### Fix 3: Show country description during tutorial on mobile
**Files**: `src/components/Tutorial.tsx`, `src/App.tsx`

1. Identify where country description renders:
   - Search App.tsx for country description display logic (~line 7078-7084)
   - Check if it's inside the sidebar drawer (which is collapsed on mobile)

2. During tutorial steps 4-7 (country-specific), either:
   - **Option A**: Force sidebar drawer open on mobile during tutorial (simpler)
   - **Option B**: Render a standalone country description card above the tutorial card (better UX — doesn't require learning the sidebar)

3. Recommended: Option B — create a mobile-only country description overlay:
   - Appears above the tutorial card during steps that have country context
   - Shows country name, income group, and 1-2 line description
   - Compact card with same styling as tutorial card
   - Dismisses automatically when tutorial advances past country steps

### Verification: Playwright test matrix
**File**: New script `scripts/dev/test-responsive.ts` or inline Playwright checks

Test each fix at these viewports:

| Device | Width | Height | DPR | Tests |
|--------|-------|--------|-----|-------|
| iPhone SE | 375 | 667 | 2 | P2, P3 |
| iPhone 14 | 390 | 844 | 3 | P2, P3 |
| iPad 10th | 810 | 1080 | 2 | P1 |
| iPad Air | 820 | 1180 | 2 | P1 |
| iPad Pro 11" | 834 | 1194 | 2 | P1 |
| iPad landscape | 1024 | 768 | 2 | P1 |
| Desktop | 1440 | 900 | 1 | Regression |

For each viewport:
1. Navigate to `/explore`
2. Start tutorial
3. Screenshot at each step — verify card is fully visible
4. Advance to simulation steps — verify description visibility and timing
5. Check country description appears on mobile/tablet

---

## Execution Order

```
1. Fix 2 (mobile timing)        — smallest change, one line
2. Fix 3 (country description)  — research exact location, then implement
3. Fix 1 (tablet tutorial)      — CSS + positioning, needs most iteration
4. Playwright verification      — run after each fix
```

## Estimated Scope

- Fix 2: ~5 lines changed
- Fix 3: ~30-50 lines (mobile overlay component or sidebar force-open)
- Fix 1: ~40-60 lines (CSS media query + 2-3 JS positioning tweaks)
- Verification: Playwright script for automated screenshots
