# Phase 4 Cinematic Simulation Plan (v2)

## Context
This plan builds a cinematic, causality-forward simulation playback while preserving current architecture:
- Use existing `pinnedPaths` and D3 enter/update/exit patterns.
- Keep simulation visuals scoped to global view.
- Keep one authoritative notion of shown effects across results + visualization.

## Preflight Rebase
1. Confirm timeline source-of-truth in simulation mode is `currentYearIndex`.
2. Treat `currentYear` as legacy compatibility or derive it from index.
3. Define one shared selector for "top-N shown effects" used by both:
   - Results dropdown (`x of y effects shown`)
   - Visualization pin/tint/edge candidate set
4. Lock feature scope: cinematic cascade behavior only in global view (never local/split).

## Checkpoint 1: Static Simulation View (Final-Year, No Timeline Dynamics)
### Goal
Show intervention + top-N effects with selective expansion, affected fill tint, and intervention pulse.

### Changes
1. Affected fill tint:
   - Blend domain color toward green/red based on effect sign.
   - Intensity default: `clamp(abs(percent_change)/50, 0, 0.5)`.
2. Intervention pulse:
   - Prefer CSS animation on intervention glow circles.
   - Keep fallback to stroke-width pulse if browser/SVG transform issues arise.
3. Bridge-node inclusion:
   - Walk `causal_paths[target].source` chain back to intervention.
   - Add missing intermediates into pins as structural bridge nodes (untinted).
   - Safety guards: visited set, max depth 10, stop on missing source.

### Verification Gate
1. High-connectivity intervention: verify selective expansion + tints + pulse.
2. Low-connectivity intervention: verify no clutter.
3. Broken-chain simulation fixture: verify no loop/crash in bridge walker.

## Checkpoint 2: Timeline Playback Drives Visibility
### Goal
Year scrub/play progressively reveals affected structure. Rewind keeps visibility but not future tint.

### Changes
1. Store sync:
   - On simulation success, set `playbackMode='simulation'`.
   - Resume index; restart at 0 if already at end.
2. Progressive pinning:
   - Dedicated `useEffect([currentYearIndex, temporalResults, ...])`.
   - Build from current-year top-N + short hold window.
   - Maintain `everAffectedNodes`/held set for expansion persistence.
3. Rewind behavior:
   - Expanded nodes may remain visible.
   - Tint must use current year only; if missing current-year effect -> domain color.
4. Timeline UI:
   - Show current-year affected count near year label.

### Verification Gate
1. Playback: node set grows with years.
2. Rewind: nodes remain, tint reflects rewound year only.
3. Scrub rapidly: no ghost/popping artifacts.

## Checkpoint 3: Causal Edges (Directed, Year-Aware)
### Goal
Visible affected nodes get one directed causal edge from source.

### Changes
1. New layer order:
   - Hierarchical stems below causal edges.
   - Causal edges below nodes.
2. Edge generation:
   - Build from `causal_paths`.
   - Render only if both endpoints are visible.
3. Routing:
   - Quadratic bezier with adaptive inward pull.
   - Pull 10% if angular distance < 30 degrees, else 30%.
4. Edge style:
   - Color by sign, width by `|beta|`, hop-based dash pattern.
   - Add arrowheads (marker-end) for direction.
5. Enter/update/exit:
   - Enter fade/draw with node appearance.
   - Update positions with layout movement.
   - Exit cleanly on teardown.

### Verification Gate
1. Directed edges are readable (arrowheads visible).
2. Hop chain can be traced end-to-end.
3. Near-angle edges are not over-curved.

## Checkpoint 4: Angular Proximity Clustering
### Goal
Causal members cluster within sectors without breaking hierarchy.

### Changes
1. Extend node/layout mapping to expose needed angle metadata.
2. Priority sort on the **pruned visible tree** (not full hierarchy).
3. Multi-intervention in same sector:
   - Cluster by intervention source first.
   - Then by effect magnitude/proximity.
4. Keep ring constraints and sector boundaries intact.

### Verification Gate
1. Affected members form tighter wedges.
2. Mixed intervention clusters remain separable and legible.

## Checkpoint 5: Edge Animation + Polish
### Goal
Deliver molecule-like motion without heavy runtime cost.

### Changes
1. Edge draw-in using stroke-dashoffset.
2. Subtle hop-staggered edge pulse.
3. Node first-appearance overshoot then settle.
4. Fixed playback speed preserved.
5. No perpetual JS loops required for baseline effects.

### Verification Gate
1. Record and inspect 0.5x playback.
2. Confirm motion is theatrical but readable.

## Checkpoint 6: Robustness and Teardown
### Required Scenarios
1. Zero-propagation runs.
2. Single-hop runs.
3. Deep chain (max hop) runs.
4. Multiple interventions.
5. Rapid scrub back/forth.
6. Country switch during playback.
7. Collapse-all during simulation.
8. Resize during animation.
9. Deep-ring intervention affecting inner rings (inward edges).
10. Browser back/URL state change during simulation playback.

### Teardown Contract
1. On clear/new run/country switch:
   - Clear pins/held sets tied to simulation.
   - Remove causal-edge joins cleanly.
   - Remove/stop intervention pulse state.

## Files Expected to Change
1. `/home/sandesh/Documents/Global_Project/viz/src/App.tsx`
2. `/home/sandesh/Documents/Global_Project/viz/src/stores/simulationStore.ts`
3. `/home/sandesh/Documents/Global_Project/viz/src/components/simulation/TimelinePlayer.tsx`
4. `/home/sandesh/Documents/Global_Project/viz/src/layouts/RadialLayout.ts`
5. `/home/sandesh/Documents/Global_Project/viz/src/services/api.ts` (typing only, if needed)

## Checkpoint Exit Criteria
At each checkpoint boundary:
1. `npx tsc --noEmit` passes.
2. `npm run build` passes.
3. Manual verification gate for that checkpoint is signed off.
4. "Results shown count" and visualization candidate set match for current year.
