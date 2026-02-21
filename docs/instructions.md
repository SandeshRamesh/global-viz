# Phase 2: Simulation Mode

**Last Updated:** 2025-01-06

## Overview

Phase 2 extends Phase 1's semantic hierarchy visualization with country-specific data and intervention simulation capabilities.

**User Flow:**
1. **Select** → Choose a country (203 available)
2. **Explore** → See country-specific node sizing and edge weights at baseline
3. **Intervene** → Double-click nodes or use dropdown to set interventions
4. **Simulate** → Run temporal simulation and watch graph morph over time
5. **Playback** → Scrub through timeline to see year-by-year effects

---

## Progress Tracker

### Section 4: Country Context ✅ COMPLETE

| Feature | Status |
|---------|--------|
| Country selector dropdown (203 countries) | ✅ Done |
| Country-specific SHAP node sizing | ✅ Done |
| Node filtering (remove uncovered nodes) | ✅ Done |
| Country-specific β coefficients in Local View | ✅ Done |
| API integration | ✅ Done |
| Zustand store | ✅ Done |

### Section 5: Simulation UI ✅ COMPLETE

| Component | Status |
|-----------|--------|
| PlayBar (simulate button) | ✅ Done |
| SimulationPanel (right sidebar) | ✅ Done |
| InterventionBuilder (select indicators, set %) | ✅ Done |
| SimulationRunner (Run button + API call) | ✅ Done |
| ResultsPanel (before/after table) | ✅ Done |

### Section 6: Visual Feedback 🔜 IN PROGRESS

| Feature | Status | Description |
|---------|--------|-------------|
| Node color effects | ❌ | Red/green gradient based on change magnitude |
| Intensity scaling | ❌ | Brightness = magnitude (capped at 50%) |
| Parent node propagation | ❌ | Aggregate child effects to Ring 0-4 |

### Section 7: Temporal Playback 🔜 PLANNED

| Feature | Status | Description |
|---------|--------|-------------|
| TimelinePlayer component | ❌ | Bottom-of-screen playback bar |
| Play/Pause animation | ❌ | Auto-advance through years (1s per year) |
| Scrub slider | ❌ | Manual year selection |
| Year markers | ❌ | Clickable dots for each year |
| Node morphing animation | ❌ | Smooth color transitions as years change |
| Temporal store state | ❌ | currentYear, isPlaying, timeline data |

### Section 8: Interaction Enhancements 🔜 PLANNED

| Feature | Status | Description |
|---------|--------|-------------|
| Double-click to add intervention | ❌ | Click node → add to intervention list |
| Pan/zoom to selected node | ❌ | Smooth camera animation (800ms) |
| Node flash on add | ❌ | Cyan flash (500ms) when added |

### Section 9: Advanced Features ❌ NOT STARTED

| Feature | Status |
|---------|--------|
| Pre-built scenario library (WHO, World Bank, IMF) | ❌ |
| Temporal line chart (Recharts) | ❌ |
| Map integration | ❌ |
| Side-by-side comparison | ❌ |

---

## Temporal Simulation Flow

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: SELECT COUNTRY                                             │
├─────────────────────────────────────────────────────────────────────┤
│  User selects "United States" from dropdown                         │
│  → API call: GET /api/graph/United%20States                         │
│  → Graph loads with country-specific SHAP sizing                    │
│  → Nodes colored by domain (no simulation effects yet)              │
│  → Baseline values stored in simulationStore.countryGraph.baseline  │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: ADD INTERVENTIONS                                          │
├─────────────────────────────────────────────────────────────────────┤
│  User opens SimulationPanel (click simulate button)                 │
│  → Adds intervention: "Health Expenditure +20%"                     │
│  → Adds intervention: "Education Spending +15%"                     │
│  → Interventions stored in simulationStore.interventions[]          │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: RUN TEMPORAL SIMULATION                                    │
├─────────────────────────────────────────────────────────────────────┤
│  User clicks "Run Simulation" button                                │
│  → API call: POST /api/simulate/temporal                            │
│     Body: { country, interventions, horizon_years: 10 }             │
│  → Loading state shown                                              │
│  → Results stored in simulationStore.temporalResults                │
│  → TimelinePlayer appears at bottom of screen                       │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: TIMELINE APPEARS - START AT YEAR 0 (BASELINE)              │
├─────────────────────────────────────────────────────────────────────┤
│  Timeline shows: [Year 0] ─── [Year 1] ─── ... ─── [Year 10]        │
│  → Starts at Year 0: Graph shows baseline (no color effects)        │
│  → Node colors = original domain colors                             │
│  → Ready for playback                                               │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5: PLAYBACK - WATCH GRAPH MORPH                               │
├─────────────────────────────────────────────────────────────────────┤
│  User clicks Play or scrubs timeline                                │
│  → Year advances: 0 → 1 → 2 → ... → 10                              │
│  → Each year: look up effects[year] from temporalResults            │
│  → Nodes gradually change color based on accumulated effects        │
│     - Green gradient: positive change (0% → 50%+ = light → dark)    │
│     - Red gradient: negative change (0% → -50%+ = light → dark)     │
│  → Parent nodes aggregate child effects (weighted average)          │
│  → Smooth CSS transitions between years (300ms)                     │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6: EXPLORE RESULTS                                            │
├─────────────────────────────────────────────────────────────────────┤
│  User can:                                                          │
│  → Scrub back/forward to any year                                   │
│  → Pause at specific year to examine                                │
│  → Hover nodes to see exact change values                           │
│  → Click "Reset" to clear simulation and start over                 │
│  → Modify interventions and re-run                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Priority 1: Node Color Effects

Apply gradient colors to nodes based on simulation results.

**Files to modify:**
- `src/App.tsx` - Add `getSimulationColor()` function, modify `getColor()`
- `src/stores/simulationStore.ts` - Add `currentYear` state

```typescript
// In App.tsx - Color scales using d3
const greenScale = d3.scaleLinear<string>()
  .domain([0, 50])  // 0% to 50% change
  .range(['#C8E6C9', '#2E7D32'])  // Light → Dark green
  .clamp(true);

const redScale = d3.scaleLinear<string>()
  .domain([0, 50])
  .range(['#FFCDD2', '#C62828'])  // Light → Dark red
  .clamp(true);

// Modified getColor function
const getColor = (n: ExpandableNode): string => {
  // Check if we have simulation results for this node
  const effect = getNodeEffect(n.id);
  if (effect !== null) {
    const absChange = Math.abs(effect);
    return effect >= 0 ? greenScale(absChange) : redScale(absChange);
  }
  // Default domain color
  if (n.ring === 0) return '#78909C';
  return DOMAIN_COLORS[n.semanticPath.domain] || '#9E9E9E';
};

// Helper to get effect for current year
const getNodeEffect = (nodeId: string): number | null => {
  const { temporalResults, currentYear } = useSimulationStore.getState();
  if (!temporalResults || currentYear === 0) return null;

  const yearKey = `year_${currentYear}`;
  const yearEffects = temporalResults.effects[yearKey];
  if (!yearEffects) return null;

  const effect = yearEffects[nodeId];
  return effect?.percent_change ?? null;
};
```

### Priority 2: Parent Node Propagation

Aggregate child effects up the hierarchy so Ring 0-4 nodes show color.

```typescript
// Compute parent effects from children (weighted average by importance)
function computeParentEffects(
  nodes: ExpandableNode[],
  leafEffects: Record<string, number>
): Record<string, number> {
  const allEffects = { ...leafEffects };

  // Process from Ring 5 up to Ring 0
  for (let ring = 4; ring >= 0; ring--) {
    const ringNodes = nodes.filter(n => n.ring === ring);

    for (const node of ringNodes) {
      const childIds = node.childIds;
      const childEffects = childIds
        .map(id => allEffects[id])
        .filter(e => e !== undefined);

      if (childEffects.length > 0) {
        // Weighted average (could weight by importance)
        allEffects[node.id] = childEffects.reduce((a, b) => a + b, 0) / childEffects.length;
      }
    }
  }

  return allEffects;
}
```

### Priority 3: TimelinePlayer Component

Bottom-of-screen playback bar.

**Visual Design:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  ▶ Play    Year: 3 / 10    [○──○──○──●──○──○──○──○──○──○──○]       │
│                             0  1  2  3  4  5  6  7  8  9  10        │
└─────────────────────────────────────────────────────────────────────┘
```

**Component Interface:**
```typescript
// src/components/simulation/TimelinePlayer.tsx
interface TimelinePlayerProps {
  // No props - reads from simulationStore
}

// Zustand store additions
interface TemporalPlaybackState {
  currentYear: number;           // 0 = baseline, 1-10 = projection years
  isPlaying: boolean;
  playbackSpeed: number;         // ms per year (default: 1000)

  // Actions
  setYear: (year: number) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  nextYear: () => void;
  prevYear: () => void;
}
```

**Position:** Fixed to bottom, full width, height: 60px, z-index: 1000

**Behavior:**
- Appears only when `temporalResults` is not null
- Starts at Year 0 (baseline state)
- Play: Auto-advance 1 year per second (configurable)
- Clicking year marker jumps to that year
- Keyboard: Space = play/pause, Left/Right = prev/next year
- Reset button clears to Year 0

### Priority 4: Store Updates

Add temporal playback state to simulationStore.

```typescript
// Additional state in simulationStore.ts
interface SimulationState {
  // ... existing state ...

  // Temporal playback
  currentYear: number;           // 0 = baseline
  isPlaying: boolean;
  playbackInterval: number | null;

  // Actions
  setCurrentYear: (year: number) => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  resetPlayback: () => void;
}
```

### Priority 5: Double-Click Intervention

Quick intervention via node double-click.

```typescript
// In App.tsx - add to dblclick handler
.on('dblclick', (event) => {
  const target = event.target as Element;
  if (target.classList.contains('node')) {
    event.stopPropagation();
    const nodeId = target.getAttribute('data-id');
    const node = nodeDataMap.get(nodeId);

    if (node && node.ring === 5) {  // Only indicators can be intervened
      const { addIntervention, openPanel } = useSimulationStore.getState();
      addIntervention({
        indicator: node.id,
        indicatorLabel: node.label,
        change_percent: 20,  // Default +20%
        domain: node.semanticPath.domain
      });
      openPanel();
      flashNode(node.id, '#00BCD4', 500);  // Cyan flash
    }
  }
});
```

---

## New Components to Create

### 1. TimelinePlayer.tsx

```typescript
// src/components/simulation/TimelinePlayer.tsx
import { useSimulationStore } from '../../stores/simulationStore';
import { useEffect, useRef } from 'react';

export function TimelinePlayer() {
  const {
    temporalResults,
    currentYear,
    isPlaying,
    setCurrentYear,
    startPlayback,
    stopPlayback,
    resetPlayback
  } = useSimulationStore();

  const intervalRef = useRef<number | null>(null);

  // Don't render if no temporal results
  if (!temporalResults) return null;

  const maxYear = temporalResults.horizon_years;
  const years = Array.from({ length: maxYear + 1 }, (_, i) => i);

  // Playback effect
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setCurrentYear(prev => {
          if (prev >= maxYear) {
            stopPlayback();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, maxYear]);

  return (
    <div className="timeline-player">
      <button onClick={isPlaying ? stopPlayback : startPlayback}>
        {isPlaying ? '⏸' : '▶'}
      </button>
      <button onClick={resetPlayback}>⏮</button>
      <span>Year: {currentYear} / {maxYear}</span>
      <div className="timeline-track">
        {years.map(year => (
          <button
            key={year}
            className={`year-marker ${year === currentYear ? 'active' : ''}`}
            onClick={() => setCurrentYear(year)}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**CSS:**
```css
.timeline-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 16px;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.timeline-track {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.year-marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: white;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.year-marker.active {
  background: #3B82F6;
  border-color: #3B82F6;
  color: white;
  transform: scale(1.2);
}

.year-marker:hover:not(.active) {
  border-color: #3B82F6;
  background: #EBF5FF;
}
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/countries` | GET | List 203 countries |
| `/api/graph/{country}` | GET | Country graph + SHAP + baseline |
| `/api/indicators` | GET | All 2,583 indicators |
| `/api/simulate` | POST | Instant simulation (single point) |
| `/api/simulate/temporal` | POST | Multi-year projection with timeline |

### Temporal Request
```json
{
  "country": "United States",
  "interventions": [
    { "indicator": "health_expenditure_pc", "change_percent": 15 }
  ],
  "horizon_years": 10
}
```

### Temporal Response
```json
{
  "status": "success",
  "country": "United States",
  "horizon_years": 10,
  "interventions": [...],
  "timeline": {
    "year_0": { "indicator_1": 0.5, "indicator_2": 0.3 },
    "year_1": { "indicator_1": 0.52, "indicator_2": 0.31 },
    "year_2": { "indicator_1": 0.55, "indicator_2": 0.33 }
  },
  "effects": {
    "year_0": {},
    "year_1": {
      "life_expectancy": { "baseline": 78.5, "value": 78.9, "percent_change": 0.5 }
    },
    "year_2": {
      "life_expectancy": { "baseline": 78.5, "value": 79.4, "percent_change": 1.1 }
    }
  }
}
```

---

## Implementation Order

| Step | Task | Files | Description |
|------|------|-------|-------------|
| 1 | Store updates | `simulationStore.ts` | Add currentYear, isPlaying, playback actions |
| 2 | Color scales | `App.tsx` | Add greenScale, redScale, getNodeEffect() |
| 3 | Modify getColor | `App.tsx` | Check for simulation effects before domain color |
| 4 | TimelinePlayer | `TimelinePlayer.tsx` | Create component with play/pause/scrub |
| 5 | Add to App | `App.tsx` | Render TimelinePlayer when results exist |
| 6 | Parent propagation | `App.tsx` | Compute Ring 0-4 effects from children |
| 7 | Double-click | `App.tsx` | Add intervention on node dblclick |
| 8 | CSS transitions | `App.css` | Add smooth color transitions |

---

## Development

### Frontend
```bash
npm run dev          # http://localhost:5173/global-viz/
npm run build        # Production build
```

### Backend API
```bash
# From global-viz root directory
source api/venv/bin/activate
python -m uvicorn api.main:app --port 8000
```

### Toggle API
In `src/services/api.ts`:
- `'local'` → localhost:8000
- `'public'` → argonprimary.duckdns.org:8000
