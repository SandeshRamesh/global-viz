# 3D Global View Sandbox Specification

## Overview

This document provides all information needed to create a 3D version of the radial hierarchy visualization.

---

## 1. Data Location & Format

### Primary Data File
```
<REPO_ROOT>/viz/phase2/public/data/v2_1_visualization_final.json
```

### Data Schema

```typescript
interface GraphDataV21 {
  nodes: RawNodeV21[]
  edges: RawEdge[]
  hierarchy: Record<string, unknown>
  metadata: {
    version: string
    statistics: {
      total_nodes: number      // 2,583
      layers: Record<string, number>
    }
  }
}

interface RawNodeV21 {
  id: string | number
  label: string
  description?: string
  layer: number              // 0-5 (ring index)
  node_type: 'root' | 'outcome_category' | 'coarse_domain' | 'fine_domain' | 'indicator'
  domain: string | null      // Color grouping (9 domains)
  subdomain: string | null
  shap_importance: number    // Raw SHAP value (Ring 5 only)
  importance: number         // Normalized 0-1 (computed from SHAP)
  in_degree: number
  out_degree: number
  parent?: string | number   // Parent node ID (for hierarchy)
  children?: (string | number)[]
  indicator_count?: number   // For parent nodes
}

interface RawEdge {
  source: string
  target: string
  weight?: number
  relationship?: 'causal' | 'hierarchical'
}
```

### Sample Node Data
```json
{
  "id": "quality_of_life",
  "label": "Quality of Life",
  "layer": 0,
  "node_type": "root",
  "domain": null,
  "shap_importance": 1.0,
  "importance": 1.0,
  "children": ["health", "security", "education", ...]
}
```

---

## 2. Hierarchy Structure (6 Rings)

| Ring | Layer | Node Type | Count | Description |
|------|-------|-----------|-------|-------------|
| 0 | 0 | root | 1 | "Quality of Life" at center |
| 1 | 1 | outcome_category | 9 | Health, Security, Education, etc. |
| 2 | 2 | coarse_domain | 45 | Broad groupings |
| 3 | 3 | fine_domain | 196 | Specific sub-domains |
| 4 | 4 | indicator_group | 569 | Indicator clusters |
| 5 | 5 | indicator | 1,763 | Individual indicators |

**Total: 2,583 nodes**

---

## 3. SHAP Importance & Node Sizing

### SHAP Source

SHAP values come from the **V3.1 Temporal API**:
```
GET /api/temporal/shap/{target}/timeline
GET /api/temporal/shap/{country}/{target}/timeline
```

Response format:
```json
{
  "target": "quality_of_life",
  "years": [1990, 1991, ..., 2024],
  "shap_by_year": {
    "2020": {
      "indicator_id_1": 0.032,
      "indicator_id_2": 0.015,
      ...
    }
  }
}
```

### SHAP Aggregation Algorithm

**Ring 5 (indicators):** Get SHAP directly from API

**Rings 4-0 (parents):** Aggregate from children using SUM
```typescript
// Bottom-up aggregation
for (let ring = 4; ring >= 0; ring--) {
  for (const node of nodesAtRing[ring]) {
    const childShaps = node.children.map(id => shapMap.get(id))
    const sumShap = childShaps.reduce((a, b) => a + b, 0)
    shapMap.set(node.id, sumShap)
  }
}
```

**Normalization:** Scale so root = 1.0
```typescript
const rootShap = shapMap.get('quality_of_life')
for (const [nodeId, shap] of shapMap) {
  shapMap.set(nodeId, shap / rootShap)  // Normalized to 0-1
}
```

### Node Sizing Formula

**Area-proportional sizing** (statistically accurate):
```typescript
// From ViewportScales.ts
const minArea = Math.PI * minRadius * minRadius
const maxArea = Math.PI * maxRadius * maxRadius
const scaleFactor = maxArea - minArea

// importance is normalized SHAP (0-1)
const area = minArea + importance * scaleFactor
const radius = Math.sqrt(area / Math.PI)
```

**Viewport-aware size range:**
```typescript
// minRadius: ~1.6px (visibility floor)
const minRadius = Math.max(
  readableUnit * 2,      // 2px on 1x display
  baseUnit * 0.2         // 0.2% of viewport
)

// maxRadius: scales with density
const densityFactor = Math.sqrt(2583 / visibleNodes)
const maxRadius = Math.min(
  baseUnit * 2.0 * densityFactor,
  baseUnit * 3           // Cap at ~32px
)
```

---

## 4. Angular Positioning Algorithm

### Two-Pass Layout (RadialLayout.ts)

**Pass 1: Bottom-up (calculate minimum angular requirements)**
```typescript
function calculateMinimumRequirements(node, ringIndex, ringRadii) {
  // Own size requirement
  const nodeSize = getActualNodeSize(ringIndex, node.importance)
  const spacing = getAdaptiveSpacing(nodeSize)
  const ownMinAngle = (nodeSize * 2 + spacing) / ringRadii[ringIndex]

  // Children requirement (recursive)
  let childrenRequirement = 0
  for (const child of node.children) {
    childrenRequirement += calculateMinimumRequirements(child, ringIndex + 1, ringRadii)
  }

  // Parent must reserve enough for all descendants
  node.minAngularExtent = Math.max(ownMinAngle, childrenRequirement)
  return node.minAngularExtent
}
```

**Pass 2: Top-down (allocate angular space)**
```typescript
function positionNode(node, startAngle, angularExtent, ringIndex) {
  const midAngle = startAngle + angularExtent / 2
  const radius = ringRadii[ringIndex]

  // Polar to Cartesian
  node.x = radius * Math.cos(midAngle)
  node.y = radius * Math.sin(midAngle)
  node.angle = midAngle

  // Distribute children proportionally
  const childExtents = distributeProportionally(node.children, angularExtent)
  let currentAngle = midAngle - sum(childExtents) / 2

  for (let i = 0; i < node.children.length; i++) {
    positionNode(node.children[i], currentAngle, childExtents[i], ringIndex + 1)
    currentAngle += childExtents[i]
  }
}
```

### Smart Sector Filling (Expanded Nodes Priority)

When nodes are expanded, they get positioned on the **right side (0°)** for readable text:
```typescript
// Expanded outcomes centered around 0° (right)
const expandedPositioningSpace = expandedTotal * baseScale * compactness
let currentAngle = -expandedPositioningSpace / 2  // Center on 0°

for (const outcome of expandedOutcomes) {
  angles.set(outcome.id, currentAngle + extent / 2)
  currentAngle += extent
}

// Collapsed outcomes fill remaining space (left/top/bottom)
```

---

## 5. Ring Radii Calculation

**Dynamic radii based on node density:**
```typescript
function calculateRingRadii(nodesByRing, sizeRange) {
  const radii = [0]  // Ring 0 at center
  let currentRadius = 0

  for (let ring = 1; ring < 6; ring++) {
    const nodes = nodesByRing.get(ring)

    // Calculate minimum radius to fit all nodes
    let totalArc = 0
    for (const node of nodes) {
      const nodeRadius = getNodeRadius(node.importance, sizeRange)
      totalArc += nodeRadius * 2 + spacing
    }
    const requiredRadius = totalArc / (2 * Math.PI)

    // Apply constraints
    const finalRadius = Math.max(
      requiredRadius,
      currentRadius + minRingGap,  // ~86px gap
      ring === 1 ? minInnerRadius : 0  // ~108px inner
    )

    radii.push(finalRadius)
    currentRadius = finalRadius
  }

  return radii
}
```

**Typical radii on 1080p:**
| Ring | Approx Radius |
|------|---------------|
| 0 | 0 (center) |
| 1 | ~108px |
| 2 | ~194px |
| 3 | ~300px |
| 4 | ~450px |
| 5 | ~700px |

---

## 6. Domain Colors

9 domains with distinct colors:
```typescript
const DOMAIN_COLORS: Record<string, string> = {
  'health_wellbeing': '#FF6B6B',        // Red
  'security_safety': '#4ECDC4',          // Teal
  'education_knowledge': '#45B7D1',      // Blue
  'economic_prosperity': '#96CEB4',      // Green
  'governance_democracy': '#FFEAA7',     // Yellow
  'environment_sustainability': '#74B49B', // Sage
  'social_cohesion': '#DDA0DD',          // Plum
  'infrastructure_technology': '#F4A460', // Sandy
  'demographics_population': '#B0C4DE'    // Light Steel
}
```

---

## 7. 3D Adaptation Suggestions

### Option A: 3D Globe/Sphere
- Map rings to latitude bands (Ring 0 at pole, Ring 5 at equator)
- Angular position → longitude
- Node size → 3D sphere radius
- Hierarchical edges as arcs on sphere surface

### Option B: 3D Solar System
- Root at center (sun)
- Rings as orbital shells at different radii
- Nodes as planets/moons
- Size = sphere radius, color = domain
- Causal edges as particle streams between nodes

### Option C: 3D Cone/Funnel
- Ring 0 at apex, Ring 5 at base
- Each ring is a horizontal slice at different Z
- Larger Z = larger radius (funnel shape)
- Good for showing hierarchy depth

### 3D Position Formula
```typescript
// Option A: Globe
const theta = node.angle  // longitude
const phi = (node.ring / 5) * (Math.PI / 2)  // latitude (0° to 90°)
const r = globeRadius

node.x = r * Math.cos(phi) * Math.cos(theta)
node.y = r * Math.cos(phi) * Math.sin(theta)
node.z = r * Math.sin(phi)

// Option B: Solar System (same as 2D, add Z)
node.x = ringRadii[node.ring] * Math.cos(node.angle)
node.y = ringRadii[node.ring] * Math.sin(node.angle)
node.z = 0  // or slight random offset for depth

// Option C: Cone
const coneAngle = 30 * (Math.PI / 180)  // 30° cone
const baseRadius = maxRadius
node.z = node.ring * ringGap
const ringRadius = baseRadius * (node.ring / 5)
node.x = ringRadius * Math.cos(node.angle)
node.y = ringRadius * Math.sin(node.angle)
```

---

## 8. Key Files Reference

| File | Purpose |
|------|---------|
| `src/layouts/RadialLayout.ts` | Angular positioning algorithm |
| `src/layouts/ViewportScales.ts` | Node sizing, ring radii calculation |
| `src/types/index.ts` | TypeScript interfaces |
| `src/App.tsx:569-641` | SHAP aggregation & normalization |
| `src/stores/simulationStore.ts` | Temporal SHAP loading |
| `public/data/v2_1_visualization_final.json` | Node/edge data |

---

## 9. API Endpoints for Dynamic SHAP

```bash
# Unified SHAP timeline (all countries)
GET http://localhost:8000/api/temporal/shap/quality_of_life/timeline

# Country-specific SHAP timeline
GET http://localhost:8000/api/temporal/shap/Australia/quality_of_life/timeline

# Stratified SHAP (by income level)
GET http://localhost:8000/api/temporal/shap/stratified/developing/quality_of_life/timeline
```

---

## 10. Quick Start for 3D Sandbox

1. **Load data:**
   ```javascript
   const response = await fetch('/data/v2_1_visualization_final.json')
   const data = await response.json()
   ```

2. **Build hierarchy:**
   ```javascript
   const nodeMap = new Map(data.nodes.map(n => [String(n.id), n]))
   const root = nodeMap.get('quality_of_life')
   ```

3. **Apply SHAP (static for sandbox):**
   ```javascript
   // Use shap_importance from data, or fetch from API
   const importance = node.importance  // Already 0-1 normalized
   ```

4. **Calculate positions:**
   ```javascript
   // Use RadialLayout algorithm, then convert to 3D
   const layout2D = computeRadialLayout(data.nodes, config)
   const nodes3D = layout2D.nodes.map(n => ({
     ...n,
     z: n.ring * zScale  // Simple 3D: layer as Z
   }))
   ```

5. **Render with Three.js:**
   ```javascript
   nodes3D.forEach(node => {
     const geometry = new THREE.SphereGeometry(node.radius)
     const material = new THREE.MeshStandardMaterial({
       color: DOMAIN_COLORS[node.domain]
     })
     const mesh = new THREE.Mesh(geometry, material)
     mesh.position.set(node.x, node.y, node.z)
     scene.add(mesh)
   })
   ```

---

## Summary

| Concept | Formula/Location |
|---------|------------------|
| **SHAP source** | API `/api/temporal/shap/...` or `node.shap_importance` |
| **SHAP aggregation** | SUM children, normalize so root=1.0 |
| **Node radius** | `sqrt((minArea + importance * scaleFactor) / π)` |
| **Angular position** | Two-pass: bottom-up requirements, top-down allocation |
| **Ring radii** | Dynamic based on node density + min gap constraints |
| **Domain color** | 9 colors in `DOMAIN_COLORS` map |
