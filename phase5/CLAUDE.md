# Phase 5: Advanced Features & Production Polish

## Overview

Phase 5 transforms the platform into a **production-ready tool** with optimization mode, education features, performance optimization, mobile support, accessibility, and white-label customization for consulting clients.

**Status:** Not Started
**Dependencies:** Phase 4 complete
**Estimated Duration:** Months 4-6
**Target Users:** All paths - production-ready for diverse audiences

---

## Objectives

1. Multi-objective optimization mode (Pareto frontiers)
2. Education mode with guided tutorials and gamification
3. Performance optimization (WebGL, lazy loading, caching)
4. Mobile/tablet support
5. Accessibility (WCAG AAA)
6. White-label customization for consulting

---

## Optimization Mode (Path 2: Optimizer)

### Multi-Objective Solver

* [ ] **"Optimization Mode" view** (new tab alongside Global/Local)

* [ ] **Define Objectives panel:**
  - Add objective (dropdown: 10 outcomes)
  - Set weight (slider: 0.0-1.0)
  - Set direction (maximize/minimize)

* [ ] **Add Constraints panel:**
  - Budget limit (e.g., health_expenditure < +15%)
  - Feasibility constraints (e.g., enrollment cannot exceed 100%)

* [ ] **Run Optimization button** (calls V3.0 backend API)

### Pareto Frontier Visualization

* [ ] **Scatterplot** (X = objective 1, Y = objective 2)
* [ ] **Points = scenarios** (color = Pareto optimal vs dominated)
* [ ] **Click point → load scenario details** (intervention mix)
* [ ] **"Show in Flow View"** → visualize this scenario in Local View

### Advanced Search

* [ ] **Fuzzy autocomplete** (matches on 1,763 indicators)
* [ ] **Filter by:**
  - Domain (multi-select checkboxes)
  - Data quality (observed/imputed)
  - SHAP range (min-max sliders)
  - Impact range (effect size thresholds)
* [ ] **Boolean operators** (AND/OR/NOT in search)

### Optimization Deliverables

* [ ] `OptimizationView.tsx` (multi-objective solver UI)
* [ ] `ParetoFrontier.tsx` (scatterplot visualization)
* [ ] `ObjectiveBuilder.tsx` (add/configure objectives)
* [ ] `ConstraintPanel.tsx` (budget/feasibility constraints)
* [ ] `AdvancedSearch.tsx` (fuzzy search with filters)

---

## Education Mode (Path 5: Educator)

### Simplified UI

* [ ] **"Educator Mode" toggle** (top nav)
* [ ] **Simplified view:**
  - Only 3 outcomes visible (Health, Education, Income)
  - Jargon removed ("beta=1.366" → "Large positive effect")
  - Reduced node count (hide low-importance indicators)

### Guided Tutorial

* [ ] **Interactive overlay** (step-by-step walkthrough)
* [ ] **Lessons:**
  1. What is Causation? (drag slider, see effect)
  2. Direct vs Indirect Effects (compare path lengths)
  3. Spillover Effects (change X, notice Y changes)
* [ ] **Progress tracking** (checkmarks for completed lessons)

### Challenge Mode (Gamified)

* [ ] **"Budget Allocation Challenge"** (gamified scenario)
* [ ] **Setup:**
  - Your country has $100M budget
  - Allocate across 5 interventions (sliders)
  - Goal: Maximize QoL improvement

* [ ] **Leaderboard:**
  - Ranks students by QoL achieved
  - Shows top 10 strategies (inspire learning)

* [ ] **Discussion prompts** (auto-generated based on results)

### Classroom Dashboard

* [ ] **Teacher view** (separate login)
* [ ] **See all student results** (table view)
* [ ] **Export class summary** (CSV with student IDs, scores, strategies)
* [ ] **Share lesson link** (unique URL + QR code for students)

### Education Deliverables

* [ ] `EducatorMode.tsx` (simplified UI toggle)
* [ ] `TutorialOverlay.tsx` (guided lessons)
* [ ] `ChallengeMode.tsx` (gamified budget allocation)
* [ ] `Leaderboard.tsx` (student rankings)
* [ ] `ClassroomDashboard.tsx` (teacher view)

---

## Performance Optimization

### WebGL Rendering

* [ ] **WebGL for >5,000 nodes** (deck.gl integration)
* [ ] **Level-of-detail (LOD) system** (hide labels at zoom-out)
* [ ] **Instanced rendering** for identical node shapes

### Lazy Loading

* [ ] **Load hierarchy on expand** (not upfront)
* [ ] **Chunk large datasets** (load in pages of 500 nodes)
* [ ] **Progressive rendering** (show structure first, details later)

### Caching

* [ ] **IndexedDB caching** (cache graph data client-side)
* [ ] **Service worker** (offline support, PWA)
* [ ] **Preload adjacent years** for smooth timeline scrubbing
* [ ] **LRU cache** for SHAP data (keep last 10 queries)

### Performance Deliverables

* [ ] `WebGLGlobalView.tsx` (deck.gl renderer)
* [ ] `LODManager.ts` (level of detail logic)
* [ ] `CacheManager.ts` (IndexedDB wrapper)
* [ ] `ServiceWorker.js` (offline support)

---

## Mobile/Tablet Support

### Touch-Optimized Controls

* [ ] **Pinch to zoom** (two-finger gesture)
* [ ] **Swipe to pan** (single finger drag)
* [ ] **Long press for context menu**
* [ ] **Swipe left/right to change years** (timeline shortcut)

### Responsive Layout

```css
/* Desktop: Full layout */
@media (min-width: 1024px) { ... }

/* Tablet: Simplified sidebar */
@media (min-width: 768px) and (max-width: 1023px) { ... }

/* Mobile: Stacked layout */
@media (max-width: 767px) { ... }
```

### Mobile-Specific UI

* [ ] **Bottom sheet for panels** (instead of sidebar)
* [ ] **Larger touch targets** (44px minimum)
* [ ] **Simplified timeline** (fewer controls)
* [ ] **Full-screen search modal** (on tap)

### Mobile Deliverables

* [ ] Mobile-responsive CSS throughout
* [ ] Touch gesture handlers (Hammer.js or similar)
* [ ] `MobileLayout.tsx` (stacked panel layout)
* [ ] PWA manifest for home screen install

---

## Accessibility (WCAG AAA)

### Keyboard Navigation

* [ ] **Full keyboard navigation** (tab through nodes)
* [ ] **Arrow keys to navigate** within graph
* [ ] **Enter to select**, Escape to close
* [ ] **Skip to content links**

### Screen Reader Support

* [ ] **ARIA labels** on all interactive elements
* [ ] **Live regions** for dynamic updates
* [ ] **Alt text** for visualizations
* [ ] **Data tables** (hidden visually, available to screen readers)

### Visual Accessibility

* [ ] **High-contrast mode toggle**
* [ ] **Focus indicators** (visible keyboard focus)
* [ ] **Color blind modes:**
  - Deuteranopia-safe palette
  - Protanopia-safe palette
  - Pattern overlays in addition to color

### Accessibility Deliverables

* [ ] `AccessibilityProvider.tsx` (ARIA context)
* [ ] `KeyboardNav.tsx` (keyboard navigation logic)
* [ ] `ColorBlindMode.tsx` (palette switcher)
* [ ] `ScreenReaderTable.tsx` (data table for SR users)
* [ ] Accessibility audit report (WCAG AAA compliance)

---

## Internationalization

* [ ] **Multi-language support** (English, Spanish, French, Mandarin)
* [ ] **Translate indicator names** (use original dataset translations)
* [ ] **RTL layout support** (Arabic, Hebrew)
* [ ] **Date/number formatting** by locale

### i18n Deliverables

* [ ] `i18n/` folder with translation files
* [ ] `react-i18next` integration
* [ ] Language selector component
* [ ] RTL stylesheet variants

---

## White-Label Customization (Consulting)

### Custom Branding

* [ ] **Upload logo** (replaces default logo)
* [ ] **Set color palette** (primary, secondary, accent)
* [ ] **Custom favicon**
* [ ] **Custom footer text** (client attribution)

### Custom Data

* [ ] **Upload custom graph structure** (JSON format)
* [ ] **Custom indicators** (add client-specific metrics)
* [ ] **Custom hierarchy** (different aggregation levels)

### Custom Scenarios

* [ ] **Pre-load client-specific interventions**
* [ ] **Custom baseline scenarios**
* [ ] **Client-specific event markers** on timeline

### Private Hosting

* [ ] **Client-specific subdomains** (client.argonanalytics.com)
* [ ] **Data isolation** (each client sees only their data)
* [ ] **Authentication** (client-specific login)

### White-Label Deliverables

* [ ] `BrandingConfig.tsx` (logo, colors, fonts)
* [ ] `CustomDataLoader.ts` (upload/validate custom data)
* [ ] `ScenarioPreloader.ts` (pre-built client scenarios)
* [ ] Multi-tenant infrastructure setup

---

## API Requirements (V3.0 Backend)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/optimize` | POST | Run multi-objective optimization |
| `/api/pareto/{objective1}/{objective2}` | GET | Get Pareto frontier |
| `/api/challenges` | GET | List available challenges |
| `/api/challenges/{id}/submit` | POST | Submit challenge solution |
| `/api/leaderboard/{challengeId}` | GET | Get challenge rankings |
| `/api/classroom/{classId}/results` | GET | Teacher view of student results |

---

## Success Metrics

### Optimization Mode
* [ ] Pareto frontier renders correctly (verified against V3.0 backend)
* [ ] Constraints applied correctly in solutions
* [ ] Advanced search returns relevant results

### Education Mode
* [ ] Tutorial completes without errors
* [ ] Tested with 1+ classroom (n=20 students)
* [ ] Leaderboard updates in real-time

### Performance
* [ ] <2s initial load time
* [ ] 60fps interactions on desktop
* [ ] 30fps on mobile
* [ ] WebGL renders 10,000+ nodes smoothly

### Accessibility
* [ ] Zero WCAG AAA violations
* [ ] Full keyboard navigation verified
* [ ] Screen reader tested (NVDA, VoiceOver)

### Mobile
* [ ] Functional on 375px width (iPhone SE)
* [ ] Touch gestures work reliably
* [ ] PWA installable

### White-Label
* [ ] 1+ white-label client deployed
* [ ] Custom branding loads correctly
* [ ] Data isolation verified

---

## Dependencies

**From Phase 4:**
- Multi-target system
- Country comparison
- Heterogeneity insights

**From V3.0 Research:**
- Pareto optimization backend
- Intervention modeling
- Saturation thresholds

**External Libraries:**
- `deck.gl` - WebGL rendering
- `react-i18next` - internationalization
- `workbox` - service worker tooling
- `hammer.js` - touch gestures
- `focus-trap-react` - keyboard navigation

---

## Timeline

| Month | Focus |
|-------|-------|
| 4 | Optimization mode + advanced search |
| 5 | Education mode + gamification |
| 6 | Performance + mobile + accessibility |
| 7+ | White-label + i18n + polish |

---

## Future Considerations (v2.0+)

- Real-time collaboration (multiple users editing)
- User accounts with saved scenarios
- API access for external integrations
- Custom model training (user-defined targets)
- Regional spillover modeling
