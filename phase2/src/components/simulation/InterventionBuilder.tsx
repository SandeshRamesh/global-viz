/**
 * InterventionBuilder Component - Phase 2
 *
 * Select intervention targets and set % change.
 * Features:
 * - Indicator dropdown grouped by domain
 * - Change % slider (-100% to +300%)
 * - Add up to 5 interventions
 * - Remove intervention button
 * - Wired to Zustand store
 */

import { useEffect, useMemo, useCallback } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'
import type { Intervention } from '../../services/api'

// ============================================
// Constants
// ============================================

const MAX_INTERVENTIONS = 5
const MIN_CHANGE = -100
const MAX_CHANGE = 300

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

  // Load indicators on mount
  useEffect(() => {
    if (indicators.length === 0 && !indicatorsLoading) {
      loadIndicators()
    }
  }, [indicators.length, indicatorsLoading, loadIndicators])

  // Get country-specific importance for an indicator
  const getImportance = useCallback((indicatorId: string): number => {
    // Use country-specific SHAP importance if available
    if (countryGraph?.shap_importance && countryGraph.shap_importance[indicatorId] !== undefined) {
      return countryGraph.shap_importance[indicatorId]
    }
    // Fall back to global importance from indicators list
    const ind = indicators.find(i => i.id === indicatorId)
    return ind?.importance || 0
  }, [countryGraph, indicators])

  // Build indicator options grouped by domain, sorted by country importance
  const indicatorOptions = useMemo(() => {
    if (!indicators || indicators.length === 0) {
      return []
    }

    // Group by domain
    const grouped = new Map<string, Array<{ id: string; label: string; domain: string; importance: number }>>()

    indicators.forEach(ind => {
      const domain = ind.domain || 'Other'
      if (!grouped.has(domain)) {
        grouped.set(domain, [])
      }
      grouped.get(domain)!.push({
        id: ind.id,
        label: ind.label || ind.id,
        domain,
        importance: getImportance(ind.id)
      })
    })

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([domain, nodes]) => ({
        domain,
        label: domain,
        color: DOMAIN_COLORS[domain] || '#9E9E9E',
        // Sort by country importance descending within each domain
        nodes: nodes.sort((a, b) => (b.importance || 0) - (a.importance || 0))
      }))
  }, [indicators, getImportance])

  // Flat list of all indicators sorted by country importance (for top recommendations)
  const topIndicators = useMemo(() => {
    if (!indicators || indicators.length === 0) return []
    return indicators
      .map(ind => ({
        ...ind,
        countryImportance: getImportance(ind.id)
      }))
      .filter(ind => ind.countryImportance > 0.001)  // Only show indicators with some importance
      .sort((a, b) => b.countryImportance - a.countryImportance)
      .slice(0, 50)  // Top 50 most important for this country
  }, [indicators, getImportance])

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

  // Update intervention indicator
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

    updateIntervention(index, {
      indicator: indicatorId,
      indicatorLabel,
      domain
    })
  }, [indicatorOptions, updateIntervention])

  // Update intervention change percent
  const handleChangePercent = useCallback((index: number, change_percent: number) => {
    updateIntervention(index, { change_percent })
  }, [updateIntervention])

  // Update intervention year
  const handleYearChange = useCallback((index: number, year: number) => {
    updateIntervention(index, { year })
  }, [updateIntervention])

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
              {/* Top indicators by importance */}
              <optgroup label="★ Top Indicators (by importance)">
                {topIndicators.map(ind => (
                  <option
                    key={ind.id}
                    value={ind.id}
                    data-domain={ind.domain}
                  >
                    {ind.label || ind.id}
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
