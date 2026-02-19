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

// ============================================
// Constants
// ============================================

const MAX_INTERVENTIONS = 5
const MIN_CHANGE = -100
const MAX_CHANGE = 500

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
    color: '#888',
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
    transition: 'background 0.2s'
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
    cursor: 'pointer',
    outline: 'none'
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
    outline: 'none',
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
    color: '#888',
    fontSize: 11
  }
}

// ============================================
// Main Component
// ============================================

export function InterventionBuilder() {
  const {
    indicators,
    indicatorsLoading,
    loadIndicators,
    selectedCountry,
    countryGraph,
    interventions,
    addIntervention,
    updateIntervention,
    removeIntervention,
    historicalTimeline,
    currentYearIndex
  } = useSimulationStore()

  // Current timeline year (used as default for new interventions)
  const currentTimelineYear = historicalTimeline?.years[currentYearIndex] ?? 2024

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
   * Fetch temporal edge counts for each intervention's indicator+year combo.
   * Caches the full temporal graph per country+year so switching indicators
   * within the same year doesn't re-fetch.
   */
  useEffect(() => {
    if (!selectedCountry) return

    const countryName = selectedCountry
    const needed: Array<{ indicator: string; year: number; cacheKey: string; countKey: string }> = []

    for (const inv of interventions) {
      if (!inv.indicator) continue
      const year = inv.year ?? currentTimelineYear
      const cacheKey = `${countryName}::${year}`
      const countKey = `${inv.indicator}::${year}`

      // Already have this count? Skip
      if (temporalEdgeCounts.has(countKey)) continue

      // Have the graph cached (completed, not in-flight)? Compute immediately
      const cached = temporalGraphCache.current.get(cacheKey)
      if (cached) {
        setTemporalEdgeCounts(prev => {
          const next = new Map(prev)
          next.set(countKey, cached.get(inv.indicator) ?? 0)
          return next
        })
        continue
      }

      // Already fetching this year? Just wait (don't add to needed again)
      if (inFlightFetches.current.has(cacheKey)) continue

      needed.push({ indicator: inv.indicator, year, cacheKey, countKey })
    }

    if (needed.length === 0) return

    // Dedupe by cacheKey (country+year) so we fetch each graph only once
    const uniqueYears = new Map<string, number>()
    for (const n of needed) {
      uniqueYears.set(n.cacheKey, n.year)
    }

    for (const [cacheKey, year] of uniqueYears) {
      inFlightFetches.current.add(cacheKey)

      simulationAPI.getCountryTemporalGraph(countryName, year)
        .then(result => {
          // Build source → outgoing count map
          const edgeMap = new Map<string, number>()
          for (const edge of result.edges) {
            edgeMap.set(edge.source, (edgeMap.get(edge.source) ?? 0) + 1)
          }
          temporalGraphCache.current.set(cacheKey, edgeMap)
          inFlightFetches.current.delete(cacheKey)

          // Resolve counts for ALL current interventions at this year (not just initial `needed`)
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
  }, [interventions, selectedCountry, currentTimelineYear, temporalEdgeCounts])

  // Clear temporal cache when country changes
  useEffect(() => {
    temporalGraphCache.current.clear()
    setTemporalEdgeCounts(new Map())
  }, [selectedCountry])

  /** Get temporal edge count for an intervention, or null if not yet loaded */
  const getTemporalEdges = useCallback((indicator: string, year: number): number | null => {
    if (!indicator) return null
    const key = `${indicator}::${year}`
    return temporalEdgeCounts.has(key) ? temporalEdgeCounts.get(key)! : null
  }, [temporalEdgeCounts])

  // Load indicators on mount
  useEffect(() => {
    if (indicators.length === 0 && !indicatorsLoading) {
      loadIndicators()
    }
  }, [indicators.length, indicatorsLoading, loadIndicators])

  /**
   * Count outgoing causal edges per indicator from the country graph.
   * Indicators with more outgoing edges propagate effects to more targets.
   */
  const outEdgeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    if (countryGraph?.edges) {
      for (const edge of countryGraph.edges) {
        counts.set(edge.source, (counts.get(edge.source) || 0) + 1)
      }
    }
    return counts
  }, [countryGraph])

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
      year: currentTimelineYear,
      indicatorLabel: '',
      domain: ''
    }
    addIntervention(newIntervention)
  }, [interventions.length, addIntervention, currentTimelineYear])

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

  // Update intervention year (clears stale temporal edge count)
  const handleYearChange = useCallback((index: number, year: number) => {
    const ind = interventions[index]?.indicator
    const oldYear = interventions[index]?.year ?? currentTimelineYear
    if (ind && oldYear !== year) {
      setTemporalEdgeCounts(prev => {
        const next = new Map(prev)
        next.delete(`${ind}::${oldYear}`)
        return next
      })
    }
    updateIntervention(index, { year })
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

  // Check if no country selected
  if (!selectedCountry) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          Select a country to build interventions
        </div>
      </div>
    )
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
              <input
                type="number"
                min={1990}
                max={2024}
                value={intervention.year ?? currentTimelineYear}
                onChange={(e) => handleYearChange(index, Number(e.target.value))}
                style={{
                  width: 56,
                  padding: '2px 4px',
                  borderRadius: 3,
                  border: '1px solid #ddd',
                  background: 'white',
                  color: '#555',
                  fontSize: 11,
                  textAlign: 'center' as const
                }}
                title="Intervention year"
              />
              <button
                style={styles.removeBtn}
                onClick={() => removeIntervention(index)}
                title="Remove intervention"
              >
                ×
              </button>
            </div>
          </div>

          {/* Indicator selector with domain color */}
          <div className="indicator-select-wrapper">
            <select
              className="indicator-select"
              value={intervention.indicator}
              onChange={(e) => handleIndicatorChange(index, e.target.value)}
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

          {/* Temporal edge count badge — always visible, updates with year */}
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
                  <span style={{ color: '#999', marginLeft: 'auto', fontSize: 10 }}>
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
              type="range"
              min={MIN_CHANGE}
              max={MAX_CHANGE}
              value={intervention.change_percent}
              onChange={(e) => handleChangePercent(index, Number(e.target.value))}
              style={styles.slider}
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
