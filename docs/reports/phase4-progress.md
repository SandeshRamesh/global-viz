# Phase 4 Cinematic Simulation — Progress Report

**Last updated:** 2026-02-20
**Branch:** `chore/cleanup-2026-02-18`

---

## Status Overview

| Checkpoint | Status | Notes |
|-----------|--------|-------|
| Preflight Rebase | Done | Store fixes, playbackMode auto-switch, currentYear derivation |
| CP1: Static Sim View | Done | Fill tint, intervention pulse, bridge nodes, selective expansion |
| CP2: Timeline Drives Visibility | Done | Progressive pinning, staged reveal, layout-ready signaling |
| CP3: Causal Edges | Done | Straight colored lines (green/red), year-aware, 1px uniform |
| CP4: Angular Clustering | Done | CausalLayoutHint pre-computed, anchor outcomes at 0°, chain-based sibling sort, cross-sector facing tiebreaker |
| CP5: Edge Animation | Pending | Draw-in, hop-stagger, node overshoot |
| CP6: Robustness | Pending | Teardown, edge cases, zero-propagation |

---

## Architecture Decisions

### Visual State Machine

Three states based on panel + playback:

| State | Condition | Visual |
|-------|-----------|--------|
| **Playback active** | `playbackMode === 'simulation' && isPlaying` | Neon red/green **fill** on leaf indicators |
| **Panel open, stopped** | `isPanelOpen && !isPlaying` | Neon **borders** on eligible nodes (proportional to radius) |
| **Panel closed** | `!isPanelOpen` | Revert to historical view, expand root+ring1 |

### Node Sizing

Faithful to importance throughout. During simulation:
```
finalImportance = baseImportance * (1 + percentChange / 100)
radius = ViewportAwareLayout.getNodeRadius(finalImportance)
```
No amplification, no additive boost. `baseImportance` from `lastValidShapRef` (cached SHAP values).

### Colors

- **Neon green:** `#39FF14` (positive effects) — distinct from Economic domain `#4CAF50`
- **Neon red:** `#FF1744` (negative effects) — distinct from Security domain `#F44336`
- **Blend curve:** `sqrt(|pct| / 50)` maps percent change to blend intensity
- **During playback:** `d3.interpolateRgb(domainColor, neonTarget)(0.3 + t * 0.7)`
- **Only leaf indicators** get colored — parents use domain colors

### Parent Aggregation

Importance-weighted average of children's percent changes:
```
parentPct = sum(childImportance * childPct) / sum(childImportance)
```
Parent eligibility for border: must have at least one visible child AND `|pct| >= 1%`.

### Simulation Caching

Module-level `Map<string, TemporalResults>` keyed by:
```
${country}::${sortedInterventions}::${baseYear}::${horizon}
```
Cache hit → `applyResults()` instantly (same path as API response).

### Timing — Single Variable

`SIM_MS_PER_YEAR = 1500` in `src/constants/time.ts` drives:
- Intervention pulse animation cycle
- Timeline playback tick rate
- First-tick extra delay calculation

---

## Staged Reveal Flow (Current Implementation)

```
1. User clicks "Run Simulation"
2. API returns (or cache hit) → applyResults()
   - currentYearIndex: 1 (skip base year, start at intervention year)
   - playbackMode: 'simulation'
   - layoutReady: false

3. Auto-expand useEffect fires
   - Pins ONLY: root + ring1 + intervention indicators + ancestors
   - everAffectedRef = empty (progressive pinning fills it)
   - NO topN leaf nodes pinned yet

4. D3 renders intervention-only view
   - Intervention node visible with cyan breathing pulse
   - layoutReady set true after transitions settle

5. TimelinePlayer detects layoutReady
   - 800ms hard delay (intervention pulse visible alone)
   - Calls play()

6. isPlaying → true, progressive pinning guard lifts
   - Year 1 effects computed, top-N leaves added to everAffectedRef
   - pinnedPaths rebuilt with affected nodes + ancestors + bridges
   - Single-child pruning applied

7. First tick extra delay: SIM_MS_PER_YEAR * 2 = 3000ms
   - Year 1 nodes have time to animate in before advancing

8. Steady-state: SIM_MS_PER_YEAR per tick
   - Progressive pinning adds new nodes as years progress
   - Nodes stay pinned for HOLD_YEARS=2 after last appearance
   - Rewind keeps nodes visible, tint tracks current year only
```

---

## Key Files Modified

### `src/constants/time.ts`
- Added `SIM_MS_PER_YEAR = 1500`

### `src/stores/simulationStore.ts`
- `applyResults`: `currentYearIndex: 1` (skip base year)
- `addIntervention/updateIntervention/removeIntervention`: auto-sync `simulationStartYear` to earliest intervention year
- `layoutReady` flag + `setLayoutReady` action
- Simulation result caching (`simCache` Map)

### `src/App.tsx` (~4000 lines, main file)

**Store destructuring (~line 288):** `isPlaying`, `setPlaybackMode`, `layoutReady`, `setLayoutReady`

**`aggregateEffects` useMemo (~line 1148):**
- Leaf seeding: any `|percent_change| > 0.001` included (removed baseline filter)
- Parent: importance-weighted average
- `hasVisibleChild` computed before `borderEligible`

**Auto-expand useEffect (~line 1268):**
- Only pins interventions + ancestors (NOT topN leaves)
- `everAffectedRef` starts empty

**Progressive pinning useEffect (~line 1322):**
- Gated on `isPlaying` — no expansion until playback starts
- Top-N per year, HOLD_YEARS=2, bridge nodes via causal_paths

**Panel-close cleanup useEffect (~line 1448):**
- Reverts to historical, clears pins, expands root

**`getColor` (~line 2419):** Neon fill only during `simPlaybackActive`

**`getSize` sim branch (~line 2500):** `baseImp * (1 + pctChange/100)`

**`getSimBorder`:** Proportional to node radius, gated on `!simPlaybackActive && isPanelOpen`

**Intervention pulse (~line 3150):** `${SIM_MS_PER_YEAR}ms` duration

**Layout ready signal (~line 3981):** `setTimeout(setLayoutReady(true), nodeAnimationEndTime + 200)`

### `src/components/simulation/TimelinePlayer.tsx`
- Uses `SIM_MS_PER_YEAR` for sim tick rate
- Re-run detection: checks `currentYearIndex === 1`
- `layoutReady` → 800ms delay → `play()`
- First tick: `MS_PER_YEAR + SIM_MS_PER_YEAR` extra delay
- Subsequent ticks: steady `SIM_MS_PER_YEAR`

### `src/styles/App.css`
- Intervention pulse: `stroke-width 2.5→6`, `opacity 0.75→1.0`
- Causal edge pulse keyframes (for CP3)

---

## Verified Behaviors

- [x] Intervention node pulses alone on start year before affected nodes appear
- [x] Year 1 nodes get extra delay to animate in
- [x] Progressive reveal: node set grows year over year
- [x] Rewind keeps nodes visible, tint reflects current year only
- [x] Panel close reverts to historical, expands root+ring1
- [x] Cache hit re-runs skip API call
- [x] Earliest intervention year auto-syncs simulationStartYear
- [x] Node sizes faithful to importance (no amplification)
- [x] Parent colors reflect weighted-average child effects
- [x] Border width proportional to node radius [0.5px, 2px]

## Needs Verification

- [x] Delayed indicator appearance — confirmed: per-year top-N filtering means different indicators enter the visible set at different years as the cascade propagates. `everAffectedRef` accumulates, so the set only grows during forward play.
- [ ] No orphan nodes after rapid scrub
- [ ] Edge case: zero-propagation run (no affected indicators)
- [ ] Multiple interventions with different years

---

## Remaining Work (CP3-CP6)

### CP3: Causal Edges — DONE
- Simplified to straight `<line>` elements (no bezier/arrowheads)
- Color: neon green `#39FF14` (positive) / neon red `#FF1744` (negative)
- Subtle styling: 0.5px width, 0.25 opacity, solid (no dashes)
- D3 enter (fade in 400ms), update (transition 300ms), exit (fade out 300ms)
- Only rendered when `playbackMode === 'simulation' && pinnedPaths.size > 0`
- Both endpoints must be visible for edge to render
- Panel-close cleanup removes all causal edges from SVG

### CP4: Angular Clustering — DONE

**Pre-computed `CausalLayoutHint`** (App.tsx useMemo from `temporalResults`):
- `anchorOutcomes: Set<string>` — Ring 1 outcomes with affected descendants
- `causalAdjacency: Map<string, string>` — target → source from causal_paths
- `hopDistance: Map<string, number>` — node → hop distance from intervention
- Built once from ALL years' effects union (stable across playback, no re-sorting)

**Ring 1 sector assignment** (RadialLayout.ts `assignOutcomeAngles`):
- Anchor outcomes cluster at 0° (right side) alongside expanded outcomes
- Non-anchor outcomes fill remaining arc space
- Multiple interventions' anchor outcomes interleave at 0°

**Ring 2-5 sibling sort** (RadialLayout.ts `sortChildrenByCausalChain`):
- Partition children into affected (in hopDistance) vs structural
- Group affected into causal chains (siblings sharing a source chain)
- Sort chains by min hop (closest to intervention → sector center)
- Within each chain, sort by hop ascending
- Cross-sector facing tiebreaker: between chains at same hop, bias toward source angle
- Final order: `[structural_left, ...chains, structural_right]`

**Applied in all three positioning paths:**
- `positionNode()` — recursive Ring 3+ positioning
- `positionNodeWithSectorAwareness()` — standard case (Ring 2+)
- `positionChildrenStandard()` — Ring 2 children of outcomes

**Passed to layout via `LayoutConfig.causalHint`** — only in simulation mode

### CP5: Edge Animation
- `stroke-dashoffset` draw-in animation
- Hop-staggered pulse (animation-delay: hop * 300ms)
- Node first-appearance overshoot (r*1.15 → r*1.0)

### CP6: Robustness
- Zero-propagation, single-hop, deep chain (hop 8)
- Rapid scrub, country switch, collapse-all teardown
- Resize during animation
- Teardown contract: clear pins, remove edges, revert playback mode
