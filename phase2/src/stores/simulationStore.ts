/**
 * Simulation State Management (Zustand)
 *
 * Manages all state for the Phase 2 simulation feature:
 * - Panel visibility
 * - Country selection and data
 * - Interventions (max 5)
 * - Simulation results
 */

import { create } from 'zustand';
import {
  simulationAPI,
  type Country,
  type CountryGraph,
  type CountryTimeline,
  type Intervention,
  type SimulationResults,
  type TemporalResults,
  type IndicatorInfo,
  type TemporalShapTimeline,
  type StratifiedShapTimeline,
  type IncomeStratum,
  type StratumCounts,
  type AllClassifications,
  getShapImportance
} from '../services/api';

// ============================================
// Saved Scenarios (localStorage)
// ============================================

const SCENARIOS_STORAGE_KEY = 'globalviz_saved_scenarios';

export interface SavedScenario {
  id: string;
  name: string;
  country: string;
  interventions: Intervention[];
  simulationStartYear: number;
  simulationEndYear: number;
  savedAt: number; // timestamp
}

function loadScenariosFromStorage(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(SCENARIOS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScenariosToStorage(scenarios: SavedScenario[]): void {
  try {
    localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));
  } catch {
    // Storage full or unavailable — silent fail
  }
}

// ============================================
// State Interface
// ============================================

type PlaybackMode = 'historical' | 'simulation';

interface SimulationState {
  // Panel visibility
  isPanelOpen: boolean;

  // Countries list
  countries: Country[];
  countriesLoading: boolean;

  // Selected country data
  selectedCountry: string | null;
  countryGraph: CountryGraph | null;
  countryLoading: boolean;

  // Historical timeline for playback (raw indicator values)
  historicalTimeline: CountryTimeline | null;
  timelineLoading: boolean;

  // Temporal SHAP timeline (year-specific importance values)
  temporalShapTimeline: TemporalShapTimeline | null;
  shapTimelineLoading: boolean;
  selectedTarget: string;  // Default target for SHAP (quality_of_life)

  // Cached unified SHAP (persists across country selections)
  cachedUnifiedShap: TemporalShapTimeline | null;
  cachedUnifiedTimeline: CountryTimeline | null;

  // Stratified SHAP (income-based views)
  selectedStratum: IncomeStratum | 'unified';  // 'unified', 'developing', 'emerging', 'advanced'
  stratifiedShapTimeline: StratifiedShapTimeline | null;
  stratumCounts: StratumCounts | null;  // Country counts per stratum for current year

  // Cached classifications (loaded once, used to compute stratum counts)
  classificationsCache: AllClassifications | null;
  stratumCountsCache: Map<number, StratumCounts>;  // year -> counts

  // Indicators for dropdown
  indicators: IndicatorInfo[];
  indicatorsLoading: boolean;

  // Interventions (max 5)
  interventions: Intervention[];

  // Simulation state
  isSimulating: boolean;
  simulationResults: SimulationResults | null;
  temporalResults: TemporalResults | null;

  // Playback state (works for both historical and simulation)
  playbackMode: PlaybackMode;
  currentYearIndex: number;  // Index into years array
  isPlaying: boolean;

  // Legacy fields for simulation temporal playback
  currentYear: number;
  horizonYears: number;
  baseYear: number;

  // Simulation timeline range (user-configurable)
  simulationStartYear: number;
  simulationEndYear: number;

  // Saved scenarios
  savedScenarios: SavedScenario[];

  // Error handling
  error: string | null;

  // Actions - Panel
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;

  // Actions - Countries
  loadCountries: () => Promise<void>;
  setCountry: (name: string) => Promise<void>;
  clearCountry: () => void;

  // Actions - Temporal SHAP
  loadTemporalShapTimeline: (country?: string, target?: string) => Promise<void>;
  loadUnifiedTimeline: () => Promise<void>;  // Load unified SHAP for global view
  setTarget: (target: string) => void;

  // Actions - Stratified SHAP
  setStratum: (stratum: IncomeStratum | 'unified') => void;
  loadStratifiedShapTimeline: (stratum: IncomeStratum, target?: string) => Promise<void>;
  loadAllClassifications: () => Promise<void>;  // Load once, cache for all years
  getStratumCountsForYear: (year: number) => StratumCounts | null;  // Lookup from cache

  // Actions - Indicators
  loadIndicators: () => Promise<void>;

  // Actions - Interventions
  addIntervention: (intervention: Intervention) => void;
  updateIntervention: (index: number, intervention: Partial<Intervention>) => void;
  removeIntervention: (index: number) => void;
  clearInterventions: () => void;

  // Actions - Simulation
  runSimulation: () => Promise<void>;
  runTemporalSimulation: (horizonYears?: number | undefined) => Promise<void>;
  clearResults: () => void;

  // Actions - Temporal Playback
  setCurrentYear: (year: number) => void;
  setCurrentYearIndex: (index: number) => void;
  play: () => void;
  pause: () => void;
  resetPlayback: () => void;
  setPlaybackMode: (mode: PlaybackMode) => void;

  // Actions - Simulation Timeline
  setSimulationStartYear: (year: number) => void;
  setSimulationEndYear: (year: number) => void;

  // Actions - Scenarios
  saveScenario: (name: string) => void;
  loadScenario: (id: string) => void;
  deleteScenario: (id: string) => void;

  // Actions - Error
  clearError: () => void;
  setError: (error: string) => void;
}

// ============================================
// Constants
// ============================================

const MAX_INTERVENTIONS = 5;

// ============================================
// Store Implementation
// ============================================

export const useSimulationStore = create<SimulationState>((set, get) => ({
  // Initial state
  isPanelOpen: false,
  countries: [],
  countriesLoading: false,
  selectedCountry: null,
  countryGraph: null,
  countryLoading: false,
  historicalTimeline: null,
  timelineLoading: false,
  temporalShapTimeline: null,
  shapTimelineLoading: false,
  selectedTarget: 'quality_of_life',
  cachedUnifiedShap: null,
  cachedUnifiedTimeline: null,
  selectedStratum: 'unified',
  stratifiedShapTimeline: null,
  stratumCounts: null,
  classificationsCache: null,
  stratumCountsCache: new Map(),
  indicators: [],
  indicatorsLoading: false,
  interventions: [],
  isSimulating: false,
  simulationResults: null,
  temporalResults: null,
  playbackMode: 'historical',
  currentYearIndex: 0,
  isPlaying: false,
  currentYear: 0,
  horizonYears: 5,
  baseYear: 2024,
  simulationStartYear: 2024,
  simulationEndYear: 2029,
  savedScenarios: loadScenariosFromStorage(),
  error: null,

  // Panel actions
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  // Country actions
  loadCountries: async () => {
    const { countriesLoading } = get();
    if (countriesLoading) return;

    set({ countriesLoading: true, error: null });
    try {
      const response = await simulationAPI.getCountries();
      set({ countries: response.countries, countriesLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load countries',
        countriesLoading: false
      });
    }
  },

  setCountry: async (name: string) => {
    const { selectedTarget } = get();

    set({
      selectedCountry: name,
      countryLoading: true,
      timelineLoading: true,
      shapTimelineLoading: true,
      error: null,
      // Clear previous results when country changes
      simulationResults: null,
      temporalResults: null,
      historicalTimeline: null,
      temporalShapTimeline: null,
      // Reset playback to historical mode
      playbackMode: 'historical',
      currentYearIndex: 0,
      isPlaying: false
    });

    try {
      // Fetch graph, raw timeline, and SHAP timeline in parallel
      const [countryGraph, timeline] = await Promise.all([
        simulationAPI.getCountryGraph(name),
        simulationAPI.getCountryTimeline(name)
      ]);

      // Fetch SHAP timeline separately (may fallback to unified)
      let shapTimeline: TemporalShapTimeline;
      try {
        shapTimeline = await simulationAPI.getCountryShapTimeline(name, selectedTarget);
      } catch {
        // Country not available for SHAP, use unified
        shapTimeline = await simulationAPI.getUnifiedShapTimeline(selectedTarget);
      }

      // Filter SHAP timeline to only include years with actual data (non-zero values)
      // This prevents showing years like 1999-2009 where country SHAP is all zeros
      const yearsWithData = shapTimeline.years.filter(year => {
        const yearData = shapTimeline.shap_by_year[String(year)];
        if (!yearData) return false;
        // Check if any indicator has non-zero SHAP value
        return Object.values(yearData).some(v => {
          const mean = typeof v === 'object' && 'mean' in v ? v.mean : v;
          return mean !== 0 && mean !== null && mean !== undefined;
        });
      });

      // Use filtered years for timeline (min year with data to max year)
      const effectiveYears = yearsWithData.length > 0 ? yearsWithData : timeline.years;
      const effectiveTimeline: CountryTimeline = {
        ...timeline,
        years: effectiveYears,
        start_year: effectiveYears[0] || timeline.start_year,
        end_year: effectiveYears[effectiveYears.length - 1] || timeline.end_year
      };

      set({
        countryGraph,
        countryLoading: false,
        historicalTimeline: effectiveTimeline,
        timelineLoading: false,
        temporalShapTimeline: shapTimeline,
        shapTimelineLoading: false,
        // Start at the latest year
        currentYearIndex: effectiveTimeline.years.length - 1
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load country data',
        countryLoading: false,
        timelineLoading: false,
        shapTimelineLoading: false,
        countryGraph: null,
        historicalTimeline: null,
        temporalShapTimeline: null
      });
    }
  },

  clearCountry: () => {
    const { cachedUnifiedShap, cachedUnifiedTimeline } = get();

    // Clear country-specific data and restore unified timeline from cache
    set({
      selectedCountry: null,
      countryGraph: null,
      simulationResults: null,
      temporalResults: null,
      interventions: [],
      playbackMode: 'historical',
      isPlaying: false,
      // Restore unified from cache (instant, no loading)
      temporalShapTimeline: cachedUnifiedShap,
      historicalTimeline: cachedUnifiedTimeline,
      currentYearIndex: cachedUnifiedShap ? cachedUnifiedShap.years.length - 1 : 0
    });

    // Only fetch if not cached (shouldn't happen normally)
    if (!cachedUnifiedShap) {
      get().loadUnifiedTimeline();
    }
  },

  // Temporal SHAP actions
  loadTemporalShapTimeline: async (country?: string, target?: string) => {
    const state = get();
    const targetToUse = target || state.selectedTarget;

    set({ shapTimelineLoading: true });

    try {
      let timeline: TemporalShapTimeline;
      if (country) {
        // Try country-specific first, fallback to unified
        try {
          timeline = await simulationAPI.getCountryShapTimeline(country, targetToUse);
        } catch {
          // Country not available, use unified
          timeline = await simulationAPI.getUnifiedShapTimeline(targetToUse);
        }
      } else {
        // Use unified (global) timeline
        timeline = await simulationAPI.getUnifiedShapTimeline(targetToUse);
      }

      set({
        temporalShapTimeline: timeline,
        shapTimelineLoading: false
      });
    } catch (err) {
      console.error('Failed to load temporal SHAP timeline:', err);
      set({
        shapTimelineLoading: false,
        temporalShapTimeline: null
      });
    }
  },

  // Load unified SHAP timeline for global view (no country selected)
  // Uses cache if available to avoid refetching on country clear
  loadUnifiedTimeline: async () => {
    const { selectedTarget, cachedUnifiedShap, cachedUnifiedTimeline } = get();

    // Use cached data if available
    if (cachedUnifiedShap && cachedUnifiedTimeline) {
      set({
        temporalShapTimeline: cachedUnifiedShap,
        historicalTimeline: cachedUnifiedTimeline,
        timelineLoading: false,
        shapTimelineLoading: false,
        currentYearIndex: cachedUnifiedShap.years.length - 1,
        playbackMode: 'historical'
      });
      return;
    }

    set({
      timelineLoading: true,
      shapTimelineLoading: true
    });

    try {
      const shapTimeline = await simulationAPI.getUnifiedShapTimeline(selectedTarget);

      // Create a pseudo historicalTimeline from SHAP years for playback
      const unifiedHistoricalTimeline: CountryTimeline = {
        country: 'unified',
        start_year: shapTimeline.years[0] || 1990,
        end_year: shapTimeline.years[shapTimeline.years.length - 1] || 2024,
        years: shapTimeline.years,
        values: {},  // No indicator values for unified view
        n_indicators: 0
      };

      set({
        temporalShapTimeline: shapTimeline,
        historicalTimeline: unifiedHistoricalTimeline,
        // Cache for later use
        cachedUnifiedShap: shapTimeline,
        cachedUnifiedTimeline: unifiedHistoricalTimeline,
        timelineLoading: false,
        shapTimelineLoading: false,
        // Start at the latest year
        currentYearIndex: shapTimeline.years.length - 1,
        playbackMode: 'historical'
      });
    } catch (err) {
      console.error('Failed to load unified timeline:', err);
      set({
        timelineLoading: false,
        shapTimelineLoading: false,
        temporalShapTimeline: null,
        historicalTimeline: null
      });
    }
  },

  setTarget: (target: string) => {
    const { selectedCountry, selectedStratum, loadTemporalShapTimeline, loadStratifiedShapTimeline } = get();
    set({ selectedTarget: target });
    // Reload SHAP timeline with new target
    if (selectedStratum !== 'unified') {
      loadStratifiedShapTimeline(selectedStratum, target);
    } else {
      loadTemporalShapTimeline(selectedCountry || undefined, target);
    }
  },

  // Stratified SHAP actions
  setStratum: (stratum: IncomeStratum | 'unified') => {
    console.log(`%c[Store] Switching stratum: ${stratum}`, 'color: cyan; font-weight: bold');
    const { selectedTarget, loadStratifiedShapTimeline, loadTemporalShapTimeline, historicalTimeline, currentYearIndex } = get();
    set({ selectedStratum: stratum });

    if (stratum !== 'unified') {
      // Load stratified SHAP timeline
      loadStratifiedShapTimeline(stratum, selectedTarget);
    } else {
      // Clear stratified data and use unified
      set({ stratifiedShapTimeline: null });
      loadTemporalShapTimeline(undefined, selectedTarget);
    }

    // Update stratum counts from cache for current year
    const { stratumCountsCache } = get();
    if (historicalTimeline && historicalTimeline.years[currentYearIndex]) {
      const counts = stratumCountsCache.get(historicalTimeline.years[currentYearIndex]);
      if (counts) {
        set({ stratumCounts: counts });
      }
    }
  },

  loadStratifiedShapTimeline: async (stratum: IncomeStratum, target?: string) => {
    const state = get();
    const targetToUse = target || state.selectedTarget;
    const startTime = performance.now();
    console.log(`%c[Store] Loading ${stratum} SHAP timeline...`, 'color: orange');

    set({ shapTimelineLoading: true });

    try {
      const timeline = await simulationAPI.getStratifiedShapTimeline(stratum, targetToUse);
      const duration = performance.now() - startTime;
      console.log(`%c[Store] ${stratum} SHAP loaded in ${duration.toFixed(0)}ms`, duration > 1000 ? 'color: red' : 'color: green');
      set({
        stratifiedShapTimeline: timeline,
        shapTimelineLoading: false
      });
    } catch (err) {
      console.error('Failed to load stratified SHAP timeline:', err);
      set({
        shapTimelineLoading: false,
        stratifiedShapTimeline: null
      });
    }
  },

  /**
   * Load all classifications once and precompute stratum counts for all years.
   * This should be called once at app startup.
   */
  loadAllClassifications: async () => {
    // Skip if already loaded
    if (get().classificationsCache) return;

    try {
      const allClassifications = await simulationAPI.getAllClassifications();

      // Precompute stratum counts for all years (1990-2024)
      const countsCache = new Map<number, StratumCounts>();

      for (let year = 1990; year <= 2024; year++) {
        const counts: Record<IncomeStratum, number> = {
          developing: 0,
          emerging: 0,
          advanced: 0
        };

        // Count countries in each stratum for this year
        for (const [_country, countryData] of Object.entries(allClassifications.classifications)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const byYear = (countryData as any).by_year;
          const classification = byYear?.[String(year)];
          if (classification?.classification_3tier) {
            const stratum = classification.classification_3tier.toLowerCase() as IncomeStratum;
            if (stratum in counts) {
              counts[stratum]++;
            }
          }
        }

        const total = counts.developing + counts.emerging + counts.advanced;
        countsCache.set(year, { year, counts, total });
      }

      set({
        classificationsCache: allClassifications,
        stratumCountsCache: countsCache
      });
    } catch (err) {
      console.error('Failed to load classifications:', err);
    }
  },

  /**
   * Get stratum counts for a specific year from cache.
   * Returns null if cache not loaded yet.
   */
  getStratumCountsForYear: (year: number): StratumCounts | null => {
    const { stratumCountsCache } = get();
    return stratumCountsCache.get(year) || null;
  },

  // Indicator actions
  loadIndicators: async () => {
    const { indicatorsLoading } = get();
    if (indicatorsLoading) return;

    set({ indicatorsLoading: true, error: null });
    try {
      const response = await simulationAPI.getIndicators();
      set({ indicators: response.indicators, indicatorsLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load indicators',
        indicatorsLoading: false
      });
    }
  },

  // Intervention actions
  addIntervention: (intervention: Intervention) => {
    const { interventions } = get();
    if (interventions.length >= MAX_INTERVENTIONS) {
      set({ error: `Maximum ${MAX_INTERVENTIONS} interventions allowed` });
      return;
    }
    set({ interventions: [...interventions, intervention] });
  },

  updateIntervention: (index: number, updates: Partial<Intervention>) => {
    const { interventions } = get();
    if (index < 0 || index >= interventions.length) return;

    const updated = [...interventions];
    updated[index] = { ...updated[index], ...updates };
    set({ interventions: updated });
  },

  removeIntervention: (index: number) => {
    const { interventions } = get();
    set({ interventions: interventions.filter((_, i) => i !== index) });
  },

  clearInterventions: () => set({ interventions: [] }),

  // Simulation actions
  runSimulation: async () => {
    const { selectedCountry, interventions, isSimulating } = get();

    if (isSimulating) return;

    if (!selectedCountry) {
      set({ error: 'Please select a country first' });
      return;
    }

    if (interventions.length === 0) {
      set({ error: 'Please add at least one intervention' });
      return;
    }

    // Validate all interventions have indicators
    const invalidIntervention = interventions.find(i => !i.indicator);
    if (invalidIntervention) {
      set({ error: 'Please select an indicator for all interventions' });
      return;
    }

    set({ isSimulating: true, error: null });

    try {
      const results = await simulationAPI.runSimulation(selectedCountry, interventions);
      set({ simulationResults: results, isSimulating: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Simulation failed',
        isSimulating: false
      });
    }
  },

  runTemporalSimulation: async (horizonYears?: number) => {
    const { selectedCountry, interventions, isSimulating, historicalTimeline, currentYearIndex, simulationStartYear, simulationEndYear } = get();

    if (isSimulating) return;

    if (!selectedCountry || interventions.length === 0) {
      set({ error: 'Please select a country and add interventions first' });
      return;
    }

    set({ isSimulating: true, error: null });

    // Default intervention year = simulationStartYear (user-set), fallback to timeline position
    const fallbackYear = historicalTimeline?.years[currentYearIndex] ?? 2024;
    const defaultYear = simulationStartYear ?? fallbackYear;
    const interventionsWithYear = interventions.map(intv => ({
      ...intv,
      year: intv.year ?? defaultYear
    }));

    // Compute horizon from user-set start/end years
    const effectiveHorizon = horizonYears ?? Math.max(1, simulationEndYear - simulationStartYear);

    try {
      const results = await simulationAPI.runTemporalSimulation(
        selectedCountry,
        interventionsWithYear,
        effectiveHorizon,
        simulationStartYear
      );
      set({
        temporalResults: results,
        isSimulating: false,
        horizonYears: results.horizon_years,
        baseYear: results.base_year,
        currentYear: 0
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Temporal simulation failed',
        isSimulating: false
      });
    }
  },

  clearResults: () => set({
    simulationResults: null,
    temporalResults: null,
    currentYear: 0,
    isPlaying: false,
    playbackMode: 'historical'
  }),

  // Temporal playback actions
  setCurrentYear: (year: number) => {
    const { horizonYears } = get();
    set({ currentYear: Math.max(0, Math.min(year, horizonYears)) });
  },

  setCurrentYearIndex: (index: number) => {
    const { historicalTimeline, playbackMode, horizonYears } = get();
    if (playbackMode === 'historical' && historicalTimeline) {
      const maxIndex = historicalTimeline.years.length - 1;
      set({ currentYearIndex: Math.max(0, Math.min(index, maxIndex)) });
    } else {
      // Simulation mode uses horizonYears
      set({ currentYearIndex: Math.max(0, Math.min(index, horizonYears)) });
    }
  },

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  resetPlayback: () => {
    const { historicalTimeline, playbackMode } = get();
    if (playbackMode === 'historical' && historicalTimeline) {
      // Reset to latest year in historical mode
      set({ currentYearIndex: historicalTimeline.years.length - 1, isPlaying: false });
    } else {
      set({ currentYear: 0, currentYearIndex: 0, isPlaying: false });
    }
  },

  setPlaybackMode: (mode: PlaybackMode) => {
    const { historicalTimeline } = get();
    if (mode === 'historical' && historicalTimeline) {
      set({
        playbackMode: mode,
        currentYearIndex: historicalTimeline.years.length - 1,
        isPlaying: false
      });
    } else {
      set({
        playbackMode: mode,
        currentYearIndex: 0,
        currentYear: 0,
        isPlaying: false
      });
    }
  },

  // Simulation timeline actions
  setSimulationStartYear: (year: number) => {
    const { simulationEndYear } = get();
    const clamped = Math.max(1990, Math.min(simulationEndYear - 1, year));
    set({ simulationStartYear: clamped });
  },

  setSimulationEndYear: (year: number) => {
    const { simulationStartYear } = get();
    const clamped = Math.max(simulationStartYear + 1, Math.min(2030, year));
    set({ simulationEndYear: clamped });
  },

  // Scenario save/load actions
  saveScenario: (name: string) => {
    const { selectedCountry, interventions, simulationStartYear, simulationEndYear, savedScenarios } = get();
    if (!selectedCountry || interventions.length === 0) return;

    const scenario: SavedScenario = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      country: selectedCountry,
      interventions: interventions.map(({ indicator, change_percent, year, indicatorLabel, domain }) => ({
        indicator, change_percent, year, indicatorLabel, domain
      })),
      simulationStartYear,
      simulationEndYear,
      savedAt: Date.now()
    };

    const updated = [scenario, ...savedScenarios];
    saveScenariosToStorage(updated);
    set({ savedScenarios: updated });
  },

  loadScenario: (id: string) => {
    const { savedScenarios, setCountry } = get();
    const scenario = savedScenarios.find(s => s.id === id);
    if (!scenario) return;

    // Restore interventions and range immediately
    set({
      interventions: scenario.interventions,
      simulationStartYear: scenario.simulationStartYear,
      simulationEndYear: scenario.simulationEndYear,
      simulationResults: null,
      temporalResults: null
    });

    // Load country (async — triggers graph + timeline fetch)
    setCountry(scenario.country);
  },

  deleteScenario: (id: string) => {
    const { savedScenarios } = get();
    const updated = savedScenarios.filter(s => s.id !== id);
    saveScenariosToStorage(updated);
    set({ savedScenarios: updated });
  },

  // Error actions
  clearError: () => set({ error: null }),
  setError: (error: string) => set({ error })
}));

// ============================================
// Selector Hooks (for optimized re-renders)
// ============================================

/** Get just the panel open state */
export const useIsPanelOpen = () => useSimulationStore((state) => state.isPanelOpen);

/** Get selected country name */
export const useSelectedCountry = () => useSimulationStore((state) => state.selectedCountry);

/** Get simulation results */
export const useSimulationResults = () => useSimulationStore((state) => state.simulationResults);

/** Check if currently simulating */
export const useIsSimulating = () => useSimulationStore((state) => state.isSimulating);

/** Get current error */
export const useSimulationError = () => useSimulationStore((state) => state.error);

/** Get intervention count */
export const useInterventionCount = () => useSimulationStore((state) => state.interventions.length);

/** Check if can run simulation */
export const useCanRunSimulation = () => useSimulationStore((state) => (
  state.selectedCountry !== null &&
  state.interventions.length > 0 &&
  state.interventions.every(i => i.indicator) &&
  !state.isSimulating
));

/** Get historical timeline */
export const useHistoricalTimeline = () => useSimulationStore((state) => state.historicalTimeline);

/** Get playback mode */
export const usePlaybackMode = () => useSimulationStore((state) => state.playbackMode);

/** Get current year index */
export const useCurrentYearIndex = () => useSimulationStore((state) => state.currentYearIndex);

/** Get current actual year based on mode */
export const useCurrentActualYear = () => useSimulationStore((state) => {
  if (state.playbackMode === 'historical' && state.historicalTimeline) {
    return state.historicalTimeline.years[state.currentYearIndex] || null;
  }
  return state.baseYear + state.currentYearIndex;
});

/** Check if timeline is available */
export const useHasTimeline = () => useSimulationStore((state) =>
  state.historicalTimeline !== null && state.historicalTimeline.years.length > 0
);

/** Get temporal SHAP timeline */
export const useTemporalShapTimeline = () => useSimulationStore((state) => state.temporalShapTimeline);

/** Get selected target */
export const useSelectedTarget = () => useSimulationStore((state) => state.selectedTarget);

/** Get SHAP importance for current year from temporal timeline (returns mean values) */
export const useCurrentYearShapImportance = () => useSimulationStore((state) => {
  const { historicalTimeline, currentYearIndex, selectedStratum, temporalShapTimeline, stratifiedShapTimeline } = state;

  if (!historicalTimeline) return null;
  const currentYear = historicalTimeline.years[currentYearIndex];
  if (!currentYear) return null;

  // Choose the right timeline based on stratum selection
  const timeline = selectedStratum !== 'unified' && stratifiedShapTimeline
    ? stratifiedShapTimeline
    : temporalShapTimeline;

  if (!timeline) return null;

  const yearData = timeline.shap_by_year[String(currentYear)];
  if (!yearData) return null;

  // Convert SHAP values to mean-only format for backwards compatibility
  const importanceMap: Record<string, number> = {};
  for (const [nodeId, value] of Object.entries(yearData)) {
    importanceMap[nodeId] = getShapImportance(value);
  }

  return importanceMap;
});

/** Get selected stratum */
export const useSelectedStratum = () => useSimulationStore((state) => state.selectedStratum);

/** Get stratum counts for current year */
export const useStratumCounts = () => useSimulationStore((state) => state.stratumCounts);

/** Get stratified SHAP timeline */
export const useStratifiedShapTimeline = () => useSimulationStore((state) => state.stratifiedShapTimeline);

// Export types
export type { PlaybackMode };
