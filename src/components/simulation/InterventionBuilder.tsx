/**
 * InterventionBuilder Component - Phase 2
 *
 * Select intervention targets and set % change.
 * Features:
 * - Indicator dropdown grouped by domain
 * - Change % slider (-100% to +500%)
 * - Add up to 5 interventions
 * - Remove intervention button
 * - Wired to Zustand store
 */

import { useEffect, useMemo, useCallback, useState, useRef } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'
import { simulationAPI } from '../../services/api'
import type { Intervention } from '../../services/api'
import { INTERVENTION_YEAR_MAX, INTERVENTION_YEAR_MIN } from '../../constants/time'

// ============================================
// Constants
// ============================================

const MAX_INTERVENTIONS = 5
const MIN_CHANGE = -100
const MAX_CHANGE = 200
const MIN_YEAR = INTERVENTION_YEAR_MIN
const MAX_YEAR = INTERVENTION_YEAR_MAX

// Domain colors matching the main visualization
const DOMAIN_COLORS: Record<string, string> = {
  'Conflict & Peace': '#E53935',
  'Culture & Society': '#8E24AA',
  'Economy': '#43A047',
  'Education': '#1E88E5',
  'Environment': '#00ACC1',
  'Governance': '#FB8C00',
  'Health': '#F06292',
  'Infrastructure': '#6D4C41',
  'Demographics': '#78909C'
}

// ============================================
// Styles (Light theme)
// ============================================

const styles = {
  container: {
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  title: {
    color: '#333',
    fontSize: 12,
    fontWeight: 600,
    margin: 0
  },
  count: {
    color: '#767676',
    fontSize: 11
  },
  interventionCard: {
    background: '#f8f8f8',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    border: '1px solid #eee'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cardNumber: {
    color: '#666',
    fontSize: 11,
    fontWeight: 600
  },
  removeBtn: {
    background: '#FFEBEE',
    border: '1px solid #FFCDD2',
    color: '#C62828',
    width: 22,
    height: 22,
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    transition: 'background 0.2s',
    position: 'relative' as const
  },
  select: {
    width: '100%',
    padding: '6px 8px',
    borderRadius: 4,
    border: '1px solid #ddd',
    background: 'white',
    color: '#333',
    fontSize: 12,
    marginBottom: 8,
    cursor: 'pointer'
  },
  sliderContainer: {
    marginBottom: 4
  },
  sliderLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  sliderText: {
    color: '#666',
    fontSize: 11
  },
  sliderValue: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 600,
    minWidth: 50,
    textAlign: 'right' as const
  },
  slider: {
    width: '100%',
    height: 4,
    WebkitAppearance: 'none' as const,
    background: '#e0e0e0',
    borderRadius: 2,
    cursor: 'pointer'
  },
  addButton: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 4,
    border: '1px dashed #ccc',
    background: 'transparent',
    color: '#666',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all 0.2s'
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '12px',
    color: '#767676',
    fontSize: 11
  }
}

// ============================================
// Year Input — commits on blur or Enter, not on every keystroke
// ============================================

function YearInput({ value, onCommit }: { value: number; onCommit: (year: number) => void }) {
  const [draft, setDraft] = useState(String(value))
  const prevValue = useRef(value)

  // Sync draft when external value changes (e.g., parent resets)
  useEffect(() => {
    if (value !== prevValue.current) {
      setDraft(String(value))
      prevValue.current = value
    }
  }, [value])

  const commit = () => {
    const parsed = parseInt(draft, 10)
    if (isNaN(parsed)) {
      setDraft(String(value)) // revert
      return
    }
    const clamped = Math.max(MIN_YEAR, Math.min(MAX_YEAR, parsed))
    setDraft(String(clamped))
    if (clamped !== value) {
      onCommit(clamped)
      prevValue.current = clamped
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      name="intervention-year"
      aria-label="Intervention year"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
      style={{
        width: 46,
        padding: '2px 4px',
        borderRadius: 3,
        border: '1px solid #ddd',
        background: 'white',
        color: '#555',
        fontSize: 11,
        textAlign: 'center' as const
      }}
      title={`Intervention year (${MIN_YEAR}–${MAX_YEAR})`}
    />
  )
}

// ============================================
// Main Component
// ============================================

export function InterventionBuilder() {
  const {
    indicators,
    indicatorsLoading,
    indicatorsLoadFailed,
    loadIndicators,
    selectedCountry,
    countryGraph,
    interventions,
    addIntervention,
    updateIntervention,
    removeIntervention,
    historicalTimeline,
    currentYearIndex,
    selectedStratum,
    simulationStartYear
  } = useSimulationStore()

  // Current timeline year (used as default for new interventions)
  const currentTimelineYear = historicalTimeline?.years[currentYearIndex] ?? INTERVENTION_YEAR_MAX

  // --------------------------------------------------
  // Temporal edge counts: per-intervention, updates on indicator/year change
  // --------------------------------------------------
  // Map: "indicatorId::year" → outgoing edge count
  const [temporalEdgeCounts, setTemporalEdgeCounts] = useState<Map<string, number>>(new Map())
  // Cache completed temporal graph edges per "country::year"
  const temporalGraphCache = useRef<Map<string, Map<string, number>>>(new Map())
  // Track in-flight fetches separately (prevents premature "0 edges" from empty cache)
  const inFlightFetches = useRef<Set<string>>(new Set())

  /**
   * Derive the current scope key for graph caching.
   * Country → "country::USA", Stratified → "stratified::developing", Unified → "unified"
   */
  const scopeKey = selectedCountry
    ? `country::${selectedCountry}`
    : selectedStratum === 'unified'
      ? 'unified'
      : `stratified::${selectedStratum}`

  /**
   * Fetch temporal edge counts for each intervention's indicator+year combo.
   * Uses the appropriate graph API based on current scope (country, stratified, unified).
   */
  useEffect(() => {
    const needed: Array<{ indicator: string; year: number; cacheKey: string; countKey: string }> = []

    for (const inv of interventions) {
      if (!inv.indicator) continue
      const year = inv.year ?? currentTimelineYear
      const cacheKey = `${scopeKey}::${year}`
      const countKey = `${inv.indicator}::${year}`

      if (temporalEdgeCounts.has(countKey)) continue

      const cached = temporalGraphCache.current.get(cacheKey)
      if (cached) {
        setTemporalEdgeCounts(prev => {
          const next = new Map(prev)
          next.set(countKey, cached.get(inv.indicator) ?? 0)
          return next
        })
        continue
      }

      if (inFlightFetches.current.has(cacheKey)) continue
      needed.push({ indicator: inv.indicator, year, cacheKey, countKey })
    }

    if (needed.length === 0) return

    const controller = new AbortController()

    const uniqueYears = new Map<string, number>()
    for (const n of needed) {
      uniqueYears.set(n.cacheKey, n.year)
    }

    for (const [cacheKey, year] of uniqueYears) {
      inFlightFetches.current.add(cacheKey)

      // Pick the right graph API based on scope
      const graphPromise: Promise<{ edges: Array<{ source: string }> }> = selectedCountry
        ? simulationAPI.getCountryTemporalGraph(selectedCountry, year, controller.signal)
        : selectedStratum === 'unified'
          ? simulationAPI.getUnifiedGraph(year, controller.signal)
          : simulationAPI.getStratifiedGraph(selectedStratum as 'developing' | 'emerging' | 'advanced', year, controller.signal)

      graphPromise
        .then(result => {
          if (controller.signal.aborted) return
          const edgeMap = new Map<string, number>()
          for (const edge of result.edges) {
            edgeMap.set(edge.source, (edgeMap.get(edge.source) ?? 0) + 1)
          }
          temporalGraphCache.current.set(cacheKey, edgeMap)
          inFlightFetches.current.delete(cacheKey)

          setTemporalEdgeCounts(prev => {
            const next = new Map(prev)
            for (const n of needed) {
              if (n.cacheKey === cacheKey) {
                next.set(n.countKey, edgeMap.get(n.indicator) ?? 0)
              }
            }
            return next
          })
        })
        .catch(() => {
          if (controller.signal.aborted) return
          inFlightFetches.current.delete(cacheKey)
          setTemporalEdgeCounts(prev => {
            const next = new Map(prev)
            for (const n of needed) {
              if (n.cacheKey === cacheKey) {
                next.set(n.countKey, 0)
              }
            }
            return next
          })
        })
    }

    return () => controller.abort()
  }, [interventions, scopeKey, currentTimelineYear, temporalEdgeCounts, selectedCountry, selectedStratum])

  // Clear temporal cache when scope changes
  useEffect(() => {
    temporalGraphCache.current.clear()
    setTemporalEdgeCounts(new Map())
  }, [scopeKey])

  /** Get temporal edge count for an intervention, or null if not yet loaded */
  const getTemporalEdges = useCallback((indicator: string, year: number): number | null => {
    if (!indicator) return null
    const key = `${indicator}::${year}`
    return temporalEdgeCounts.has(key) ? temporalEdgeCounts.get(key)! : null
  }, [temporalEdgeCounts])

  // Load indicators on mount (with failure guard to prevent infinite retry)
  useEffect(() => {
    if (indicators.length === 0 && !indicatorsLoading && !indicatorsLoadFailed) {
      loadIndicators()
    }
  }, [indicators.length, indicatorsLoading, indicatorsLoadFailed, loadIndicators])

  /**
   * Outgoing edge counts for the dropdown — loaded from the scope-appropriate graph.
   * For country: uses the already-loaded countryGraph.
   * For unified/stratified: fetches the temporal graph for the current year.
   */
  const [scopeEdgeCounts, setScopeEdgeCounts] = useState<Map<string, number>>(new Map())

  // Fetch scope-level graph edge counts when scope or year changes (non-country only)
  useEffect(() => {
    if (selectedCountry) {
      setScopeEdgeCounts(new Map()) // country mode uses countryGraph below
      return
    }

    const year = currentTimelineYear
    const graphPromise: Promise<{ edges: Array<{ source: string }> }> =
      selectedStratum === 'unified'
        ? simulationAPI.getUnifiedGraph(year)
        : simulationAPI.getStratifiedGraph(selectedStratum as 'developing' | 'emerging' | 'advanced', year)

    graphPromise
      .then(result => {
        const counts = new Map<string, number>()
        for (const edge of result.edges) {
          counts.set(edge.source, (counts.get(edge.source) ?? 0) + 1)
        }
        setScopeEdgeCounts(counts)
      })
      .catch(() => setScopeEdgeCounts(new Map()))
  }, [selectedCountry, selectedStratum, currentTimelineYear])

  const outEdgeCounts = useMemo(() => {
    // Country mode: use pre-loaded countryGraph
    if (selectedCountry && countryGraph?.edges) {
      const counts = new Map<string, number>()
      for (const edge of countryGraph.edges) {
        counts.set(edge.source, (counts.get(edge.source) || 0) + 1)
      }
      return counts
    }
    // Non-country mode: use fetched scope graph
    return scopeEdgeCounts
  }, [selectedCountry, countryGraph, scopeEdgeCounts])

  // Build indicator options grouped by domain, sorted by causal connections
  const indicatorOptions = useMemo(() => {
    if (!indicators || indicators.length === 0) {
      return []
    }

    // Group by domain
    const grouped = new Map<string, Array<{ id: string; label: string; domain: string; outEdges: number }>>()

    indicators.forEach(ind => {
      const domain = ind.domain || 'Other'
      if (!grouped.has(domain)) {
        grouped.set(domain, [])
      }
      grouped.get(domain)!.push({
        id: ind.id,
        label: ind.label || ind.id,
        domain,
        outEdges: outEdgeCounts.get(ind.id) || 0
      })
    })

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([domain, nodes]) => ({
        domain,
        label: domain,
        color: DOMAIN_COLORS[domain] || '#9E9E9E',
        // Sort by outgoing causal connections descending
        nodes: nodes.sort((a, b) => b.outEdges - a.outEdges)
      }))
  }, [indicators, outEdgeCounts])

  // Top indicators by causal connections (most propagation potential)
  const topIndicators = useMemo(() => {
    if (!indicators || indicators.length === 0) return []
    return indicators
      .map(ind => ({
        ...ind,
        outEdges: outEdgeCounts.get(ind.id) || 0
      }))
      .filter(ind => ind.outEdges > 0)
      .sort((a, b) => b.outEdges - a.outEdges)
      .slice(0, 50)
  }, [indicators, outEdgeCounts])

  // Add new intervention
  const handleAddIntervention = useCallback(() => {
    if (interventions.length >= MAX_INTERVENTIONS) return

    const newIntervention: Intervention = {
      id: `intervention-${Date.now()}`,
      indicator: '',
      change_percent: 20,
      year: simulationStartYear,
      indicatorLabel: '',
      domain: ''
    }
    addIntervention(newIntervention)
  }, [interventions.length, addIntervention, simulationStartYear])

  // Update intervention indicator (clears stale temporal edge count)
  const handleIndicatorChange = useCallback((index: number, indicatorId: string) => {
    // Find indicator info
    let indicatorLabel = indicatorId
    let domain = ''

    for (const group of indicatorOptions) {
      const node = group.nodes.find(n => n.id === indicatorId)
      if (node) {
        indicatorLabel = node.label
        domain = node.domain
        break
      }
    }

    // Clear old temporal count so the effect re-fetches
    const oldInd = interventions[index]?.indicator
    const year = interventions[index]?.year ?? currentTimelineYear
    if (oldInd) {
      setTemporalEdgeCounts(prev => {
        const next = new Map(prev)
        next.delete(`${oldInd}::${year}`)
        return next
      })
    }

    updateIntervention(index, {
      indicator: indicatorId,
      indicatorLabel,
      domain
    })
  }, [indicatorOptions, updateIntervention, interventions, currentTimelineYear])

  // Update intervention change percent
  const handleChangePercent = useCallback((index: number, change_percent: number) => {
    updateIntervention(index, { change_percent })
  }, [updateIntervention])

  // Commit intervention year change (clears stale temporal edge count, clamps value)
  const commitYearChange = useCallback((index: number, rawYear: number) => {
    const clamped = Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(rawYear)))
    const ind = interventions[index]?.indicator
    const oldYear = interventions[index]?.year ?? currentTimelineYear
    if (ind && oldYear !== clamped) {
      setTemporalEdgeCounts(prev => {
        const next = new Map(prev)
        next.delete(`${ind}::${oldYear}`)
        return next
      })
    }
    updateIntervention(index, { year: clamped })
  }, [updateIntervention, interventions, currentTimelineYear])

  // Format change percent for display
  const formatChange = (pct: number) => {
    const sign = pct >= 0 ? '+' : ''
    return `${sign}${pct}%`
  }

  // Get value color
  const getValueColor = (pct: number) => {
    if (pct > 0) return '#4CAF50'
    if (pct < 0) return '#ef5350'
    return '#666'
  }

  // Loading state
  if (indicatorsLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          Loading indicators...
        </div>
      </div>
    )
  }

  // Error state with retry
  if (indicatorsLoadFailed) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '12px', color: '#C62828', fontSize: 12 }}>
          Failed to load indicators
          <button
            onClick={() => loadIndicators()}
            style={{
              display: 'block',
              margin: '8px auto 0',
              padding: '6px 16px',
              borderRadius: 4,
              border: '1px solid #FFCDD2',
              background: '#FFEBEE',
              color: '#C62828',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>Interventions</h3>
        <span style={styles.count}>
          {interventions.length} / {MAX_INTERVENTIONS}
        </span>
      </div>

      {/* Intervention cards */}
      {interventions.map((intervention, index) => (
        <div key={intervention.id || index} style={styles.interventionCard}>
          {/* Card header */}
          <div style={styles.cardHeader}>
            <span style={styles.cardNumber}>Intervention {index + 1}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <YearInput
                value={intervention.year ?? currentTimelineYear}
                onCommit={(year) => commitYearChange(index, year)}
              />
              <button
                className="touch-target-44"
                style={styles.removeBtn}
                onClick={() => removeIntervention(index)}
                title="Remove intervention"
                aria-label={`Remove intervention ${index + 1}`}
              >
                ×
              </button>
            </div>
          </div>

          {/* Indicator selector with domain color */}
          <div className="indicator-select-wrapper">
            <select
              id={`intervention-${index}-indicator`}
              name={`intervention-${index}-indicator`}
              className="indicator-select"
              value={intervention.indicator}
              onChange={(e) => handleIndicatorChange(index, e.target.value)}
              aria-label={`Indicator for intervention ${index + 1}`}
            >
              <option value="">Select indicator...</option>
              {/* Top indicators by causal connections */}
              <optgroup label="★ Top Indicators (by causal reach)">
                {topIndicators.map(ind => (
                  <option
                    key={ind.id}
                    value={ind.id}
                    data-domain={ind.domain}
                  >
                    {ind.label || ind.id} ({ind.outEdges})
                  </option>
                ))}
              </optgroup>
              {/* Grouped by domain */}
              {indicatorOptions.map(group => (
                <optgroup key={group.domain} label={group.label}>
                  {group.nodes.map(node => (
                    <option
                      key={node.id}
                      value={node.id}
                      data-domain={node.domain}
                    >
                      {node.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {/* Domain color indicator */}
            {intervention.domain && (
              <span
                className="domain-dot"
                style={{ backgroundColor: DOMAIN_COLORS[intervention.domain] || '#9E9E9E' }}
                title={intervention.domain}
              />
            )}
          </div>

          {/* Temporal edge count badge */}
          {intervention.indicator && (() => {
            const year = intervention.year ?? currentTimelineYear
            const temporalCount = getTemporalEdges(intervention.indicator, year)
            const staticCount = outEdgeCounts.get(intervention.indicator) ?? 0
            const isLoading = temporalCount === null
            const hasEdges = temporalCount !== null && temporalCount > 0
            const noEdges = temporalCount !== null && temporalCount === 0

            return (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 11,
                background: noEdges ? '#FFF3E0' : '#F1F8E9',
                border: `1px solid ${noEdges ? '#FFE0B2' : '#DCEDC8'}`,
              }}>
                <span style={{
                  fontWeight: 600,
                  color: noEdges ? '#E65100' : hasEdges ? '#33691E' : '#888',
                }}>
                  {isLoading ? '...' : temporalCount}
                </span>
                <span style={{ color: '#666' }}>
                  causal edges in {year}
                </span>
                {staticCount !== temporalCount && temporalCount !== null && (
                  <span style={{ color: '#767676', marginLeft: 'auto', fontSize: 10 }}>
                    ({staticCount} static)
                  </span>
                )}
                {noEdges && (
                  <span style={{
                    color: '#E65100',
                    marginLeft: 'auto',
                    fontSize: 10,
                    fontWeight: 500,
                  }}>
                    no propagation — try a later year
                  </span>
                )}
                {hasEdges && year > simulationStartYear && (
                  <span style={{
                    color: '#F57F17',
                    marginLeft: 'auto',
                    fontSize: 10,
                    fontWeight: 500,
                  }}>
                    baseline from {simulationStartYear}
                  </span>
                )}
              </div>
            )
          })()}

          {/* Change slider */}
          <div style={styles.sliderContainer}>
            <div style={styles.sliderLabel}>
              <span style={styles.sliderText}>Change</span>
              <span style={{
                ...styles.sliderValue,
                color: getValueColor(intervention.change_percent)
              }}>
                {formatChange(intervention.change_percent)}
              </span>
            </div>
            <input
              id={`intervention-${index}-change`}
              name={`intervention-${index}-change`}
              type="range"
              min={MIN_CHANGE}
              max={MAX_CHANGE}
              value={intervention.change_percent}
              onChange={(e) => handleChangePercent(index, Number(e.target.value))}
              style={styles.slider}
              aria-label={`Change percent for intervention ${index + 1}`}
              aria-valuemin={MIN_CHANGE}
              aria-valuemax={MAX_CHANGE}
              aria-valuenow={intervention.change_percent}
              aria-valuetext={formatChange(intervention.change_percent)}
            />
          </div>
        </div>
      ))}

      {/* Add button */}
      {interventions.length < MAX_INTERVENTIONS && (
        <button
          style={styles.addButton}
          onClick={handleAddIntervention}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f5f5f5'
            e.currentTarget.style.borderColor = '#999'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = '#ccc'
          }}
        >
          <span style={{ fontSize: 14 }}>+</span>
          Add Intervention
        </button>
      )}

      {/* Empty state hint */}
      {interventions.length === 0 && (
        <div style={{ ...styles.emptyState, marginTop: 8 }}>
          Add interventions to simulate policy changes
        </div>
      )}

      {/* Slider thumb styles and indicator select */}
      <style>{`
        .indicator-select-wrapper {
          position: relative;
          margin-bottom: 8px;
        }

        .indicator-select {
          width: 100%;
          padding: 6px 28px 6px 8px;
          border-radius: 4px;
          border: 1px solid #ddd;
          background: white;
          color: #333;
          font-size: 12px;
          cursor: pointer;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
        }

        .indicator-select:focus {
          border-color: #3B82F6;
        }

        .indicator-select:focus-visible,
        button:focus-visible,
        input[type="text"]:focus-visible,
        input[type="range"]:focus-visible {
          outline: 2px solid #3B82F6;
          outline-offset: 2px;
        }

        .domain-dot {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
          pointer-events: none;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: #fff;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #4CAF50;
          margin-top: -6px;
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #fff;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #4CAF50;
        }
      `}</style>
    </div>
  )
}

export default InterventionBuilder
