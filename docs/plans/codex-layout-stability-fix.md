# Codex Task: Fix Layout Stability on Single-Node Collapse

## Bug Description

When the user expands ring 1 and ring 2 (all domains visible with their children), then **collapses a single ring 1 node** (clicking it to hide its ring 2 children):

1. **The collapsed ring 1 node jumps to a wrong angular position** and overlaps with other ring 1 nodes
2. **Untouched ring 2 nodes** (belonging to other still-expanded ring 1 nodes) **have their text labels shift wildly** to unrelated positions on the graph

Both symptoms point to one root cause: the entire angular layout recomputes when a single subtree collapses, shifting positions of nodes that should remain stationary.

## Root Cause Analysis

### The Angular Allocation Algorithm

File: `src/layouts/RadialLayout.ts`, function `assignOutcomeAngles()` (line ~400)

This function partitions ring 1 ("outcome") nodes into two groups:

```
expanded[] — outcomes in expandedNodeIds → cluster at 0° (right side)
collapsed[] — outcomes NOT in expandedNodeIds → fill remaining arc
```

**When a ring 1 node is collapsed** (removed from `expandedNodeIds`):
- It moves from `expanded[]` to `collapsed[]`
- The `expanded` group shrinks → `expandedPositioningSpace` decreases
- The `collapsed` group grows → `remainingSpace` changes
- ALL outcomes get new angular positions (expanded ones re-center, collapsed ones redistribute)

This cascade means **every ring 1 node shifts** when any single one is toggled.

### Downstream Effects

Since ring 1 nodes move, their ring 2+ children (positioned relative to their parent's midpoint in `positionNode` line ~800) also shift. Even untouched ring 2 nodes get new (x, y) coordinates. The D3 update block detects position changes (>1px threshold) and animates them to new positions — causing the "wild text movement" the user sees.

### Why `COLLAPSED_OUTCOME_MIN_EXTENT` Makes It Worse

```typescript
const COLLAPSED_OUTCOME_MIN_EXTENT = Math.PI / 24  // ~7.5°
```

A collapsed outcome gets only 7.5° regardless of its full subtree size. An expanded outcome with 20 children might occupy 60°. Toggling from 60° to 7.5° frees 52.5° that gets redistributed to siblings — a massive position shift.

## What Must Be Preserved

**DO NOT modify the core algorithm** for expanded outcomes. The compactness-based clustering at 0° and proportional distribution works correctly when all outcomes start from the same state. The sector filling, causal chain sorting, text-aware spacing, and overlap resolution are all correct.

## Proposed Fix Strategy

The goal: **collapsing a single ring 1 node should NOT change any other node's angular position**.

### Approach: Stable Angular Reservation

When a ring 1 outcome transitions from expanded → collapsed, it should retain its angular extent (the space it occupied when expanded) rather than shrinking to `COLLAPSED_OUTCOME_MIN_EXTENT`.

**Option A: Cache last-known angular extents per outcome**

In `computeRadialLayout()` (line ~1256), after computing layout, store each ring 1 node's allocated `angularExtent` in a persistent cache (passed via `LayoutConfig`). On next layout call, if an outcome is now collapsed but has a cached extent, use the cached value instead of `COLLAPSED_OUTCOME_MIN_EXTENT`.

```typescript
// New field in LayoutConfig:
interface LayoutConfig {
  ...
  /** Cached angular extents from previous layout (stabilises collapse) */
  prevOutcomeExtents?: Map<string, number>
}
```

In `assignOutcomeAngles()`:

```typescript
// For collapsed outcomes, use previous extent if available
const minExtent = shouldCluster
  ? (outcomeRequirements.get(id) ?? COLLAPSED_OUTCOME_MIN_EXTENT)
  : (config.prevOutcomeExtents?.get(id) ?? COLLAPSED_OUTCOME_MIN_EXTENT)
```

The cache would be populated in `App.tsx`'s `computeLayout` after each successful layout, and passed back on next invocation.

**Option B: Compute full-tree subtree weights**

In `App.tsx`'s `computeLayout`, compute each ring 1 node's descendant count from the FULL tree (`effectiveNodes`, not just visible nodes). Pass these as `subtreeWeights` in the config. In `assignOutcomeAngles()`, use these weights for collapsed outcomes instead of the flat constant.

```typescript
// In computeLayout (App.tsx):
const subtreeWeights = new Map<string, number>()
for (const n of effectiveNodes.filter(n => n.layer === 1)) {
  const countDescendants = (id: string): number => {
    const node = nodeById.get(id)
    if (!node?.children) return 1
    return 1 + node.children.reduce((sum, cid) => sum + countDescendants(String(cid)), 0)
  }
  subtreeWeights.set(String(n.id), countDescendants(String(n.id)))
}
```

Then in `assignOutcomeAngles`, use subtree weight to determine angular allocation for collapsed outcomes proportionally, rather than the flat 7.5°.

**Option A is preferred** because it perfectly preserves the angular position (no drift at all), while Option B approximates it from subtree structure (close but not exact since importance-weighted allocation differs from count-weighted).

### Implementation Details

#### Changes to `RadialLayout.ts`

1. Add `prevOutcomeExtents?: Map<string, number>` to `LayoutConfig` interface
2. In `assignOutcomeAngles()`, accept and use cached extents for collapsed outcomes
3. In `computeRadialLayout()` return value, include the computed outcome extents for caching

Add to `LayoutResult`:
```typescript
export interface LayoutResult {
  nodes: LayoutNode[]
  computedRings: ComputedRingConfig[]
  outcomeExtents: Map<string, number>  // NEW: for caching
}
```

#### Changes to `App.tsx`

1. Add `const outcomeExtentsRef = useRef<Map<string, number>>(new Map())`
2. In `computeLayout`, pass `prevOutcomeExtents: outcomeExtentsRef.current` in the config
3. After layout completes, update: `outcomeExtentsRef.current = layoutResult.outcomeExtents`
4. On `expandAll` / reset, clear the cache: `outcomeExtentsRef.current = new Map()`

#### Edge Case: First Layout

On first layout (no cache), all outcomes are collapsed → all get `COLLAPSED_OUTCOME_MIN_EXTENT` → evenly distributed. This is correct existing behavior.

#### Edge Case: Expand After Collapse

When a previously-collapsed outcome is expanded again, it enters the `expanded[]` group and gets its full requirement from Pass 1. The cached extent is ignored (only used for collapsed outcomes). After the new layout, the cache updates with the new extent.

#### Edge Case: Country Change / Data Reload

Country selection changes `effectiveNodes`, which changes the tree structure. Clear the cache on country change to prevent stale extents.

---

## Complete File Reference

### `src/layouts/RadialLayout.ts` (~1500 lines)

**Two-pass radial layout algorithm with viewport-aware scaling.**

#### Module-Level State (mutable, set by `setLayoutParams`)

```typescript
let currentSizeRange: NodeSizeRange     // Min/max node radius
let currentBaseSpacing: number          // Minimum inter-node gap
let currentSpacingScaleFactor: number   // Spacing scale factor
let currentMaxSpacing: number           // Maximum inter-node gap
let currentTextConfig: TextConfig | null // Text spacing config
let currentCausalHint: CausalLayoutHint | null // Simulation hints
let ringNodeCounts: Map<number, number> // Node count per ring
let expandedOutcomeCount: number        // How many Ring 1 nodes are expanded
```

These are set at the start of `computeRadialLayout()` and used by all helper functions during that call.

#### Key Functions

| Function | Lines | Purpose |
|----------|-------|---------|
| `setLayoutParams(config)` | ~120 | Initialize module state from LayoutConfig |
| `getActualNodeSize(ring, importance)` | ~337 | Area-proportional radius: `sqrt((minArea + importance * scale) / π)` |
| `getAdaptiveSpacing(r1, r2?)` | ~352 | Inter-node spacing: `min(max, base + avg(r1,r2) * scale)` |
| `calculateVisualFootprint(nodeSize, label, importance, ring)` | ~196 | Node diameter + text contribution (density-scaled for ring 2+) |
| `getUnifiedCompactness(expandedCount)` | ~108 | 0.4 (1 expanded) → 1.0 (5+ expanded), linear |
| `getDensityTextFactor(ring)` | ~142 | 1.0 (≤50 nodes) → 0.1 (≥400 nodes), per ring |
| `assignOutcomeAngles(ids, reqs, expanded)` | ~400 | **CRITICAL** — sector filling for ring 1. See root cause above |
| `calculateMinimumRequirements(node, ...)` | ~676 | Pass 1: bottom-up angular extent computation |
| `positionNode(node, start, extent, ...)` | ~800 | Pass 2: standard top-down allocation |
| `positionNodeWithSectorAwareness(...)` | ~920 | Pass 2 variant: uses sector angles for ring 1 |
| `sortChildrenByCausalChain(children, ...)` | ~1050 | Reorder children by causal proximity (sim mode) |
| `computeRadialLayout(nodes, config, expanded)` | ~1256 | **ENTRY POINT** — orchestrates passes 1+2 |
| `resolveOverlaps(nodes, rings, ...)` | ~1445 | Post-pass: push apart overlapping same-ring nodes |
| `detectOverlaps(nodes, rings, ...)` | ~1525 | Check for remaining overlaps (diagnostic) |
| `computeLayoutStats(nodes, rings, ...)` | ~1580 | Summary statistics for debugging |

#### `assignOutcomeAngles` Deep Dive (line ~400)

```
Input:
  allOutcomeIds: string[]              — all Ring 1 node IDs
  outcomeRequirements: Map<id, rads>   — from Pass 1 (minAngularExtent)
  expandedNodeIds: Set<id>             — currently expanded nodes

Algorithm:
  1. Partition into expanded[] and collapsed[]
     - Expanded: in expandedNodeIds OR in causalHint.anchorOutcomes
     - Collapsed: everything else
     - Expanded use their Pass 1 requirement as minExtent
     - Collapsed use COLLAPSED_OUTCOME_MIN_EXTENT (7.5°)

  2. Calculate totals and scale factor
     - baseScale = 2π / (expandedTotal + collapsedTotal)

  3. Compute compactness (how tightly expanded cluster)
     - ring1Compactness = getUnifiedCompactness(expanded.length)

  4. Position expanded at 0° (right side)
     - Each gets: extent * compactness for positioning
     - Full extent preserved for child allocation

  5. Position collapsed in remaining arc
     - Spread evenly in remaining space after expanded positioning

Output:
  angles: Map<id, centerAngle>
  extents: Map<id, angularExtent>
```

#### `positionNodeWithSectorAwareness` (line ~920)

Variant of `positionNode` that handles ring 1 specially:

```
For Ring 1 children of root:
  Use pre-assigned angles/extents from assignOutcomeAngles
  (Instead of proportional distribution)

For Ring 2+ children:
  Standard proportional distribution (same as positionNode)
  Children centered around parent midpoint
  Excess space distributed proportional to minAngularExtent
  Overcrowding: compress proportionally
```

#### `resolveOverlaps` (line ~1445)

Post-layout overlap resolution:

```
For each ring:
  Sort nodes by angle
  For each pair within angular window:
    dist = arcDistance(n1, n2)
    minDist = size1 + size2 + adaptiveSpacing
    If dist < minDist:
      Push apart by (minDist - dist) / 2
      Respect parent sector boundaries (clamp to parent extent)
  Repeat up to maxIterations (50)
```

### `src/layouts/ViewportScales.ts` (~700 lines)

**Viewport-aware parameter computation.**

| Class | Purpose |
|-------|---------|
| `LayoutScales` | Base unit = 1% viewport, readableUnit = 1/DPR |
| `NodeSizeCalculator` | Area-proportional radius with density scaling |
| `SpacingCalculator` | Adaptive spacing (base + nodeRadius * 0.3) |
| `RingRadiiCalculator` | Dynamic ring radii from node density + text footprint |
| `TextSizeCalculator` | Ring-depth multiplied font sizes |
| `EdgeStyleCalculator` | Depth-decayed edge thickness + opacity |
| `ViewportAwareLayout` | Master coordinator, single `getLayoutValues()` entry |

Key method: `getNodeRadius(importance)` — used by both layout AND rendering.

### `src/App.tsx` — Layout-Related Sections

#### `computeLayout` (line ~2763)

```
1. Filter effectiveNodes to visible set (expansion-aware)
2. Handle pinned paths (parent remapping, depth computation)
3. Calculate dynamic ring radii via ViewportScales
4. Build LayoutConfig with viewport params
5. Call computeRadialLayout(visibleRawNodes, config, expandedNodes)
6. Post-process: resolveOverlaps, detectOverlaps
7. Convert LayoutNode[] → ExpandableNode[] (with structural edges)
8. Update state: visibleNodes, visibleEdges, computedRingsState
```

Dependencies: `[effectiveNodes, nodePadding, expandedNodes, pinnedPaths, playbackMode, causalHint]`

#### `getSize(node)` (line ~3258) — RENDERING node size

**Different from layout's `getActualNodeSize`!** Layout uses raw importance; rendering uses temporal SHAP, simulation effects, etc.

```
Ring 0: size ∝ QoL score (0.5–1.0)
Ring 1+, historical: temporal SHAP importance (year-specific)
Ring 1+, simulation: baseline × (1 + percentChange/100)
Fallback: cached SHAP → base importance
finalizeRadius: Ring 1 floored at importance=0.12
```

This mismatch means the layout allocates space based on static importance while rendering uses dynamic importance. The overlap resolution in the layout may not account for the rendering sizes.

#### Label positioning (line ~4990)

```
Ring 0-1: text below node
  offset = nodeSize + fontSize * 0.6 + basePadding
  anchor = "middle"

Ring 2+: text radially outward
  angle = atan2(y, x)
  offset = nodeSize + fontSize * 0.3 + 2
  availableSpace = nextRingRadius - currentRadius - offset - 5
  lines = getOptimalLines(label, fontSize, availableSpace)
  rotation = degrees(angle), flip if angle > 90°
```

`getOptimalLines` tries 1 line first, then 2, then 3 — picking fewest lines that fit.

#### Expansion callbacks

```
toggleExpansion(nodeId): flip in expandedNodes, clear pinnedPaths
expandRing(ring): expand all visible ring-N nodes with children
collapseRing(ring): collapse ring-N nodes + all descendants
```

All use `runOrQueueStructuralAction` to serialize with animation budget system.

---

## Verification

After implementing the fix:

1. Expand ring 1 and ring 2 (press `+` twice from startup)
2. Click a single ring 1 node to collapse it
3. **All other ring 1 nodes must remain at their exact positions**
4. **All ring 2 nodes under other still-expanded ring 1 nodes must not move**
5. **Text labels on untouched ring 2 nodes must not shift**
6. Clicking the collapsed node again to re-expand should restore its children in the same sector
7. `npx tsc --noEmit` must pass clean

Also verify:
- Expanding from fully collapsed (only root) still works correctly
- Simulation mode (causal hints) still clusters affected outcomes at 0°
- Country selection change doesn't produce stale cached positions

---

## Implemented Solver (March 2026)

The stabilization pass now uses a dedicated pure solver:
- `src/layouts/outcomeAngles.ts` (`computeOutcomeSectors`)
- shared continuity curves in `src/layouts/branchCurves.ts`

### Final ring-1 algorithm

1. Build one deterministic circular outcome order:
- preserve previous order for existing outcomes,
- append unseen outcomes in data order.

2. Compute raw extents:
- clustered outcomes (`expanded` or causal `anchor`) use scaled Pass-1 requirements,
- collapsed outcomes reserve cached previous extents with floor `COLLAPSED_OUTCOME_MIN_EXTENT`.

3. Normalize extents to `2π` every pass.

4. Place outcomes sequentially in canonical order.

5. Apply bounded global rotation toward right-side bias (`0°`):
- expand actions allow limited rotation (`single_expand ≈ 12.9°`, ring/global expand `10°`),
- collapse actions use `0°` rotation step (prevents collapse-induced sibling drift).

6. Persist `OutcomeSectorSnapshot` (`order`, `centers`, `extents`, `rotation`, `clusteredOutcomeIds`) and feed it into the next layout pass.

### Continuity updates (4→5 cliff removed)

- `getRingCompactness()` now uses a smooth ease-out curve over expanded ratio.
- `getTextBoostFactor()` now decays smoothly with a non-zero floor (default `0.08`).
- Both layout spacing and label rendering now use the same shared curve functions.

### Cache lifecycle

Outcome-sector cache is invalidated on context boundaries:
- raw graph reload,
- country / region / stratum change,
- playback mode class change,
- explicit reset and simulation pinning resets.

### Dev instrumentation

`window.__atlasLayout.report()` and `window.__atlasLayout.reset()` are available in dev mode via `src/utils/layoutTrace.ts`.

### Regression tests

Added `vitest` layout tests in:
- `src/layouts/__tests__/outcomeAngles.stability.test.ts`

Coverage includes:
- single-collapse sibling stability,
- deterministic toggle cycles,
- extent normalization and floor,
- branch-curve continuity around 4→5 expansions.
