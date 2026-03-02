# Phase 4: Advanced Features - Paths 2 & 5 ✅ COMPLETE (as Simulation UX Polish)

**Timeline:** Week 10 | **Completed:** 2026-02-20

**Original Objective:** Support advanced users (optimizers, educators)

**Original Target Users:**
- Path 2 (Optimizer) - data scientists, economists, academics
- Path 5 (Educator) - teachers, science communicators, museum designers

> **Note:** This was the original design spec. In practice, Phase 4 became "Simulation UX Polish" — edge pulse cascades, intervention glows, auto-zoom, hover cards, effects slider, hotkeys. Multi-objective optimization, education mode, and classroom features are in the backlog. See `docs/plans/roadmap.md` Phase 4 for what was delivered.

---

## Path 2: Optimization Mode

### Multi-Objective Solver

- [ ] "Optimization Mode" view (new tab alongside Global/Local)
- [ ] Define Objectives panel:
  - Add objective (dropdown: 9 outcomes)
  - Set weight (slider: 0.0-1.0)
  - Set direction (maximize/minimize)
- [ ] Add Constraints panel:
  - Budget limit (e.g., health_expenditure < +15%)
  - Feasibility constraints (e.g., enrollment cannot exceed 100%)
- [ ] Run Optimization button

### Pareto Frontier Visualization

- [ ] Scatterplot (X = objective 1, Y = objective 2)
- [ ] Points = scenarios (color = Pareto optimal vs dominated)
- [ ] Click point → load scenario details (intervention mix)
- [ ] "Show in Flow View" → visualize this scenario in Local View

### Advanced Search

- [ ] Fuzzy autocomplete (matches on 1,763 indicators)
- [ ] Filter by:
  - Domain (multi-select checkboxes)
  - Data quality (observed/imputed)
  - SHAP range (min-max sliders)
  - Impact range (effect size thresholds)
- [ ] Boolean operators (AND/OR/NOT in search)

---

## Path 5: Education Mode

### Simplified UI

- [ ] "Educator Mode" toggle (top nav)
- [ ] Simplified view:
  - Only 3 outcomes visible (Health, Education, Income)
  - Jargon removed ("β=1.366" → "Large positive effect")
  - Reduced node count (hide low-importance indicators)

### Guided Tutorial

- [ ] Interactive overlay (step-by-step walkthrough)
- [ ] Lessons:
  1. What is Causation? (drag slider, see effect)
  2. Direct vs Indirect Effects (compare path lengths)
  3. Spillover Effects (change X, notice Y changes)
- [ ] Progress tracking (checkmarks for completed lessons)

### Challenge Mode (Gamified)

- [ ] "Budget Allocation Challenge" (gamified scenario)
- [ ] Setup:
  - Your country has $100M budget
  - Allocate across 5 interventions (sliders)
  - Goal: Maximize QoL improvement
- [ ] Leaderboard:
  - Ranks students by QoL achieved
  - Shows top 10 strategies (inspire learning)
- [ ] Discussion prompts (auto-generated based on results)

### Classroom Dashboard

- [ ] Teacher view (separate login)
- [ ] See all student results (table view)
- [ ] Export class summary (CSV with student IDs, scores, strategies)
- [ ] Share lesson link (unique URL + QR code for students)

---

## Deliverables

- [ ] `OptimizationView.jsx` (multi-objective solver UI)
- [ ] `ParetoFrontier.jsx` (scatterplot visualization)
- [ ] `AdvancedSearch.jsx` (fuzzy search with filters)
- [ ] `EducatorMode.jsx` (simplified UI toggle)
- [ ] `TutorialOverlay.jsx` (guided lessons)
- [ ] `ChallengeMode.jsx` (gamified budget allocation)
- [ ] `ClassroomDashboard.jsx` (teacher view)

---

## Success Metrics

- [ ] Optimization mode validated
- [ ] Education mode tested with 1+ classroom (n=20 students)
