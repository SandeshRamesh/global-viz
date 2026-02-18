/**
 * ResultsPanel Component
 *
 * Displays simulation results in a sortable table:
 * - Shows top 20 affected indicators by default
 * - Columns: Name, Baseline, Simulated, Change %
 * - Sort by magnitude (default), name
 * - Expandable to show all affected indicators
 */

import { useState, useMemo, useCallback } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'

// ============================================
// Constants
// ============================================

const DEFAULT_VISIBLE_COUNT = 20

// ============================================
// Types
// ============================================

type SortField = 'magnitude' | 'name' | 'change'
type SortDirection = 'asc' | 'desc'

interface ResultRow {
  id: string
  name: string
  baseline: number
  simulated: number
  absoluteChange: number
  percentChange: number
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format a numeric value for display
 */
function formatValue(value: number): string {
  if (isNaN(value)) return 'N/A'
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(2)}K`
  if (Math.abs(value) < 0.01 && value !== 0) return value.toExponential(2)
  return value.toFixed(2)
}

/**
 * Format percentage change
 */
function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// ============================================
// Main Component
// ============================================

export function ResultsPanel() {
  const { simulationResults, indicators } = useSimulationStore()
  const [sortField, setSortField] = useState<SortField>('magnitude')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showAll, setShowAll] = useState(false)

  // Build indicator name map
  const indicatorNames = useMemo(() => {
    const map = new Map<string, string>()
    indicators.forEach(ind => map.set(ind.id, ind.label))
    return map
  }, [indicators])

  // Transform effects into rows
  const rows = useMemo((): ResultRow[] => {
    if (!simulationResults?.effects) return []

    return Object.entries(simulationResults.effects).map(([id, effect]) => ({
      id,
      name: indicatorNames.get(id) || id,
      baseline: effect.baseline,
      simulated: effect.simulated,
      absoluteChange: effect.absolute_change,
      percentChange: effect.percent_change
    }))
  }, [simulationResults, indicatorNames])

  // Sort rows
  const sortedRows = useMemo(() => {
    const sorted = [...rows]

    sorted.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'magnitude':
          comparison = Math.abs(b.percentChange) - Math.abs(a.percentChange)
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'change':
          comparison = b.percentChange - a.percentChange
          break
      }

      return sortDirection === 'desc' ? comparison : -comparison
    })

    return sorted
  }, [rows, sortField, sortDirection])

  // Visible rows (paginated)
  const visibleRows = showAll ? sortedRows : sortedRows.slice(0, DEFAULT_VISIBLE_COUNT)
  const hiddenCount = sortedRows.length - DEFAULT_VISIBLE_COUNT

  // Handle sort click
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }, [sortField])

  // Get sort indicator
  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return ''
    return sortDirection === 'desc' ? ' ▼' : ' ▲'
  }

  if (!simulationResults) return null

  return (
    <div className="results-panel">
      <div className="results-header">
        <h3>Simulation Results</h3>
        <span className="results-count">
          {sortedRows.length} indicators affected
        </span>
      </div>

      {/* Results Table */}
      <div className="results-table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th
                className="sortable"
                onClick={() => handleSort('name')}
              >
                Indicator{getSortIndicator('name')}
              </th>
              <th>Baseline</th>
              <th>Simulated</th>
              <th
                className="sortable"
                onClick={() => handleSort('change')}
              >
                Change{getSortIndicator('change')}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(row => (
              <tr key={row.id}>
                <td className="indicator-name" title={row.name}>
                  {row.name}
                </td>
                <td className="value">{formatValue(row.baseline)}</td>
                <td className="value">{formatValue(row.simulated)}</td>
                <td className={`change ${row.percentChange >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercent(row.percentChange)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show More / Show Less */}
      {hiddenCount > 0 && (
        <button
          className="show-more-btn"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show Less' : `Show All ${sortedRows.length} Indicators`}
        </button>
      )}

      {/* Propagation Info */}
      {simulationResults.propagation && (
        <div className="propagation-info">
          <span>
            Propagation: {simulationResults.propagation.iterations} iterations
          </span>
          {simulationResults.propagation.converged ? (
            <span className="converged">✓ Converged</span>
          ) : (
            <span className="not-converged">⚠ Max iterations reached</span>
          )}
        </div>
      )}

      <style>{`
        .results-panel {
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .results-header h3 {
          margin: 0;
          font-size: 12px;
          font-weight: 600;
          color: #333;
        }

        .results-count {
          font-size: 11px;
          color: #888;
        }

        .results-table-wrapper {
          overflow-x: auto;
          margin-bottom: 10px;
          max-height: 180px;
        }

        .results-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        .results-table th,
        .results-table td {
          padding: 6px 4px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .results-table th {
          font-weight: 600;
          color: #666;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          white-space: nowrap;
          position: sticky;
          top: 0;
          background: white;
        }

        .results-table th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .results-table th.sortable:hover {
          color: #3B82F6;
        }

        .results-table td {
          color: #333;
        }

        .indicator-name {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .value {
          font-family: 'JetBrains Mono', monospace;
          text-align: right;
          white-space: nowrap;
          font-size: 10px;
        }

        .change {
          font-family: 'JetBrains Mono', monospace;
          text-align: right;
          font-weight: 600;
          white-space: nowrap;
        }

        .change.positive {
          color: #4caf50;
        }

        .change.negative {
          color: #f44336;
        }

        .results-table tbody tr:hover {
          background: #f8f8f8;
        }

        .show-more-btn {
          width: 100%;
          padding: 6px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          color: #666;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .show-more-btn:hover {
          background: #eee;
          color: #333;
        }

        .propagation-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          padding: 6px 8px;
          background: #f8f8f8;
          border-radius: 4px;
          font-size: 10px;
          color: #888;
        }

        .converged {
          color: #4caf50;
        }

        .not-converged {
          color: #ff9800;
        }
      `}</style>
    </div>
  )
}

export default ResultsPanel
