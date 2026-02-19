/**
 * SimulationRunner Component
 *
 * "Run Simulation" button with:
 * - Validation (country selected, interventions added)
 * - Loading state with spinner
 * - Error handling
 * - Success triggers visualization updates
 */

import { useCallback, useState, useMemo, useRef, useEffect } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'

// ============================================
// Main Component
// ============================================

export function SimulationRunner() {
  const {
    selectedCountry,
    interventions,
    isSimulating,
    temporalResults,
    error,
    simulationStartYear,
    simulationEndYear,
    runTemporalSimulation,
    clearResults,
    clearError,
    setSimulationStartYear,
    setSimulationEndYear,
    savedScenarios,
    saveScenario,
    loadScenario,
    deleteScenario
  } = useSimulationStore()

  const [showSaveInput, setShowSaveInput] = useState(false)
  const [scenarioName, setScenarioName] = useState('')
  const [showScenarioList, setShowScenarioList] = useState(false)
  const scenarioListRef = useRef<HTMLDivElement>(null)

  // Close scenario dropdown on outside click
  useEffect(() => {
    if (!showScenarioList) return
    const handler = (e: MouseEvent) => {
      if (scenarioListRef.current && !scenarioListRef.current.contains(e.target as Node)) {
        setShowScenarioList(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showScenarioList])

  const handleSave = useCallback(() => {
    const name = scenarioName.trim() || `${selectedCountry} — ${new Date().toLocaleDateString()}`
    saveScenario(name)
    setScenarioName('')
    setShowSaveInput(false)
  }, [scenarioName, selectedCountry, saveScenario])

  // Handle run simulation
  const handleRunSimulation = useCallback(async () => {
    clearError()
    await runTemporalSimulation()
  }, [runTemporalSimulation, clearError])

  // Handle clear results
  const handleClearResults = useCallback(() => {
    clearResults()
  }, [clearResults])

  // Determine button state and message
  const getButtonState = () => {
    if (isSimulating) {
      return { disabled: true, text: 'Simulating...', className: 'loading' }
    }
    if (!selectedCountry) {
      return { disabled: true, text: 'Select a Country', className: 'disabled' }
    }
    if (interventions.length === 0) {
      return { disabled: true, text: 'Add Interventions', className: 'disabled' }
    }
    if (interventions.some(i => !i.indicator)) {
      return { disabled: true, text: 'Complete Interventions', className: 'disabled' }
    }
    return { disabled: false, text: 'Run Simulation', className: 'ready' }
  }

  const buttonState = getButtonState()

  // Count valid interventions
  const validInterventions = interventions.filter(i => i.indicator).length

  return (
    <div className="simulation-runner">
      {/* Status Summary */}
      <div className="status-summary">
        <div className="status-item">
          <span className="status-label">Country:</span>
          <span className={`status-value ${selectedCountry ? 'set' : 'unset'}`}>
            {selectedCountry || 'Not selected'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Interventions:</span>
          <span className={`status-value ${validInterventions > 0 ? 'set' : 'unset'}`}>
            {validInterventions} configured
          </span>
        </div>
      </div>

      {/* Simulation Timeline Range — dual thumb on single track */}
      {selectedCountry && (
        <div className="sim-timeline-range">
          <div className="sim-timeline-label">
            <span>Simulation Range</span>
            <span className="sim-timeline-years">
              {simulationStartYear} → {simulationEndYear} ({simulationEndYear - simulationStartYear}yr)
            </span>
          </div>
          <div className="sim-dual-slider">
            <span className="sim-timeline-bound">1990</span>
            <div className="sim-dual-track">
              {/* Filled region between thumbs */}
              <div
                className="sim-dual-fill"
                style={{
                  left: `${((simulationStartYear - 1990) / (2030 - 1990)) * 100}%`,
                  right: `${((2030 - simulationEndYear) / (2030 - 1990)) * 100}%`
                }}
              />
              <input
                type="range"
                min={1990}
                max={2030}
                value={simulationStartYear}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (v < simulationEndYear) setSimulationStartYear(v)
                }}
                className="sim-thumb sim-thumb-start"
              />
              <input
                type="range"
                min={1990}
                max={2030}
                value={simulationEndYear}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (v > simulationStartYear) setSimulationEndYear(v)
                }}
                className="sim-thumb sim-thumb-end"
              />
            </div>
            <span className="sim-timeline-bound">2030</span>
          </div>
        </div>
      )}

      {/* Run Button */}
      <button
        className={`run-btn ${buttonState.className}`}
        onClick={handleRunSimulation}
        disabled={buttonState.disabled}
      >
        {isSimulating && <span className="spinner" />}
        {buttonState.text}
      </button>

      {/* Scenario Save/Load */}
      {(savedScenarios.length > 0 || (selectedCountry && interventions.length > 0)) && (
        <div className="scenario-actions">
          {showSaveInput ? (
            <div className="scenario-save-row">
              <input
                type="text"
                className="scenario-name-input"
                placeholder="Scenario name..."
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSaveInput(false); }}
                autoFocus
              />
              <button className="scenario-btn save" onClick={handleSave}>Save</button>
              <button className="scenario-btn cancel" onClick={() => setShowSaveInput(false)}>×</button>
            </div>
          ) : (
            <div className="scenario-btn-row">
              {selectedCountry && interventions.length > 0 && (
                <button className="scenario-btn save" onClick={() => setShowSaveInput(true)}>
                  💾 Save
                </button>
              )}
              {savedScenarios.length > 0 && (
                <div className="scenario-dropdown-wrap" ref={scenarioListRef}>
                  <button
                    className="scenario-btn load"
                    onClick={() => setShowScenarioList(!showScenarioList)}
                  >
                    📂 Load ({savedScenarios.length})
                  </button>
                  {showScenarioList && (
                    <div className="scenario-dropdown">
                      {savedScenarios.map((s) => (
                        <div key={s.id} className="scenario-item">
                          <div
                            className="scenario-item-main"
                            onClick={() => { loadScenario(s.id); setShowScenarioList(false); }}
                          >
                            <span className="scenario-item-name">{s.name}</span>
                            <span className="scenario-item-meta">
                              {s.country} · {s.interventions.length} int · {s.simulationStartYear}–{s.simulationEndYear}
                            </span>
                          </div>
                          <button
                            className="scenario-delete-btn"
                            onClick={(e) => { e.stopPropagation(); deleteScenario(s.id); }}
                            title="Delete"
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="runner-error">
          <span className="error-icon">!</span>
          <span className="error-text">{error}</span>
          <button className="dismiss-btn" onClick={clearError}>×</button>
        </div>
      )}

      {/* Results Status + Expandable Details */}
      {temporalResults && !error && (
        <TemporalResultsDropdown
          temporalResults={temporalResults}
          onClear={handleClearResults}
        />
      )}

      <style>{`
        .simulation-runner {
        }

        .status-summary {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 10px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }

        .status-label {
          color: #888;
        }

        .status-value {
          font-weight: 500;
        }

        .status-value.set {
          color: #4caf50;
        }

        .status-value.unset {
          color: #bbb;
        }

        .run-btn {
          width: 100%;
          padding: 10px 14px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .run-btn.ready {
          background: #3B82F6;
          color: white;
        }

        .run-btn.ready:hover {
          background: #2563EB;
          box-shadow: 0 2px 8px rgba(59,130,246,0.3);
        }

        .run-btn.disabled {
          background: #f0f0f0;
          color: #bbb;
          cursor: not-allowed;
        }

        .run-btn.loading {
          background: #93C5FD;
          color: #1E40AF;
          cursor: wait;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(30,64,175,0.3);
          border-top-color: #1E40AF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .runner-error {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          padding: 8px;
          background: #FFEBEE;
          border: 1px solid #FFCDD2;
          border-radius: 4px;
        }

        .error-icon {
          width: 18px;
          height: 18px;
          background: #f44336;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .error-text {
          flex: 1;
          font-size: 11px;
          color: #C62828;
        }

        .dismiss-btn {
          background: none;
          border: none;
          color: #EF9A9A;
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .dismiss-btn:hover {
          color: #C62828;
        }

        .results-status {
          margin-top: 10px;
          padding: 8px;
          background: #E8F5E9;
          border: 1px solid #C8E6C9;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .results-summary {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #2E7D32;
        }

        .check-icon {
          font-size: 14px;
        }

        .results-detail {
          font-size: 11px;
          color: #666;
        }

        .clear-btn {
          width: 100%;
          padding: 5px 10px;
          background: white;
          border: 1px solid #C8E6C9;
          border-radius: 4px;
          color: #666;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-btn:hover {
          background: #f5f5f5;
          border-color: #A5D6A7;
        }

        .sim-timeline-range {
          margin-bottom: 10px;
          padding: 8px;
          background: #f8f9ff;
          border: 1px solid #e0e4f0;
          border-radius: 5px;
        }

        .sim-timeline-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #555;
          margin-bottom: 6px;
        }

        .sim-timeline-years {
          font-weight: 600;
          color: #3B82F6;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
        }

        .sim-dual-slider {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sim-timeline-bound {
          font-size: 10px;
          color: #888;
          font-family: 'JetBrains Mono', monospace;
          min-width: 28px;
          text-align: center;
          flex-shrink: 0;
        }

        .sim-dual-track {
          position: relative;
          flex: 1;
          height: 20px;
        }

        .sim-dual-track::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 4px;
          transform: translateY(-50%);
          background: #dde1f0;
          border-radius: 2px;
        }

        .sim-dual-fill {
          position: absolute;
          top: 50%;
          height: 4px;
          transform: translateY(-50%);
          background: #3B82F6;
          border-radius: 2px;
          pointer-events: none;
        }

        .sim-thumb {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          pointer-events: none;
          outline: none;
          margin: 0;
          padding: 0;
        }

        .sim-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 4px;
          height: 16px;
          background: #3B82F6;
          border-radius: 1px;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
          transition: box-shadow 0.15s;
        }

        .sim-thumb::-moz-range-thumb {
          width: 4px;
          height: 16px;
          background: #3B82F6;
          border-radius: 1px;
          border: none;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }

        .sim-thumb::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 5px rgba(59,130,246,0.25);
        }

        .sim-thumb::-moz-range-thumb:hover {
          box-shadow: 0 0 0 5px rgba(59,130,246,0.25);
        }

        .scenario-actions {
          margin-top: 8px;
        }

        .scenario-btn-row {
          display: flex;
          gap: 6px;
        }

        .scenario-save-row {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .scenario-name-input {
          flex: 1;
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 11px;
          outline: none;
        }

        .scenario-name-input:focus {
          border-color: #3B82F6;
        }

        .scenario-btn {
          padding: 4px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #f8f8f8;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }

        .scenario-btn:hover {
          background: #eee;
          border-color: #bbb;
        }

        .scenario-btn.save {
          color: #2E7D32;
          border-color: #C8E6C9;
        }

        .scenario-btn.load {
          color: #1565C0;
          border-color: #BBDEFB;
        }

        .scenario-btn.cancel {
          color: #999;
          padding: 4px 6px;
          font-size: 14px;
          line-height: 1;
        }

        .scenario-dropdown-wrap {
          position: relative;
        }

        .scenario-dropdown {
          position: absolute;
          bottom: 100%;
          left: 0;
          min-width: 240px;
          max-height: 200px;
          overflow-y: auto;
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          box-shadow: 0 -4px 16px rgba(0,0,0,0.12);
          z-index: 300;
          margin-bottom: 4px;
        }

        .scenario-item {
          display: flex;
          align-items: center;
          border-bottom: 1px solid #f0f0f0;
        }

        .scenario-item:last-child {
          border-bottom: none;
        }

        .scenario-item-main {
          flex: 1;
          padding: 8px 10px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .scenario-item-main:hover {
          background: #f0f7ff;
        }

        .scenario-item-name {
          font-size: 12px;
          font-weight: 500;
          color: #333;
        }

        .scenario-item-meta {
          font-size: 10px;
          color: #888;
        }

        .scenario-delete-btn {
          background: none;
          border: none;
          color: #ccc;
          font-size: 16px;
          padding: 4px 8px;
          cursor: pointer;
          line-height: 1;
        }

        .scenario-delete-btn:hover {
          color: #f44336;
        }
      `}</style>
    </div>
  )
}

// ============================================
// Temporal Results Dropdown
// ============================================

interface TemporalResultsDropdownProps {
  temporalResults: {
    base_year: number
    horizon_years: number
    effects: Record<string, Record<string, { baseline: number; simulated: number; absolute_change: number; percent_change: number }>>
  }
  onClear: () => void
}

function TemporalResultsDropdown({ temporalResults, onClear }: TemporalResultsDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { indicators, effectFilterPct, setEffectFilterPct } = useSimulationStore()

  // Build indicator name lookup
  const indicatorNames = useMemo(() => {
    const map = new Map<string, string>()
    indicators.forEach(ind => map.set(ind.id, ind.label))
    return map
  }, [indicators])

  // Get final year effects, filtered by percentile, sorted by magnitude
  const { affectedCount, totalNonZero, rows } = useMemo(() => {
    const yearKeys = Object.keys(temporalResults.effects).sort()
    const finalYearKey = yearKeys[yearKeys.length - 1]
    const finalEffects = finalYearKey ? temporalResults.effects[finalYearKey] : {}

    const allRows = Object.entries(finalEffects)
      .map(([id, effect]) => {
        const e = effect as Record<string, number>
        return {
          id,
          name: indicatorNames.get(id) || id,
          baseline: e.baseline,
          simulated: e.simulated,
          absoluteChange: e.absolute_change,
          percentChange: e.percent_change,
          absPct: Math.abs(e.percent_change)
        }
      })
      .filter(row => row.absPct > 0.01)
      .sort((a, b) => b.absPct - a.absPct)

    const totalNonZero = allRows.length

    // Percentile filter: keep only effects above the threshold
    // effectFilterPct=1 means show all, 0.5 means top 50%, 0.1 means top 10%
    if (allRows.length > 1 && effectFilterPct < 1) {
      const cutoffIndex = Math.floor(allRows.length * (1 - effectFilterPct))
      const cutoffMagnitude = allRows[Math.min(cutoffIndex, allRows.length - 1)].absPct
      const filtered = allRows.filter(r => r.absPct >= cutoffMagnitude)
      return { affectedCount: filtered.length, totalNonZero, rows: filtered }
    }

    return { affectedCount: allRows.length, totalNonZero, rows: allRows }
  }, [temporalResults, indicatorNames, effectFilterPct])

  const formatVal = (v: number) => {
    if (isNaN(v)) return 'N/A'
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`
    if (Math.abs(v) < 0.01 && v !== 0) return v.toExponential(1)
    return v.toFixed(2)
  }

  /**
   * Format the change column based on indicator context.
   * For indicators where baseline and simulated are both small numbers
   * (percentages, ratios, indices), show "baseline → simulated" which
   * is more intuitive than a large percent change.
   * e.g., "6.4 → 29.6" is clearer than "+360%"
   */
  const formatChange = (row: { baseline: number; simulated: number; absoluteChange: number; percentChange: number }) => {
    const absPct = Math.abs(row.percentChange)
    const absBase = Math.abs(row.baseline)

    // For small-valued indicators (ratios, percentages, indices) where
    // % change looks alarming, show level change instead
    if (absPct > 100 && absBase < 1000) {
      const sign = row.absoluteChange >= 0 ? '+' : ''
      return `${sign}${formatVal(row.absoluteChange)}`
    }

    return `${row.percentChange >= 0 ? '+' : ''}${row.percentChange.toFixed(1)}%`
  }

  return (
    <div className="results-status">
      {/* Header row — always visible, clickable */}
      <div
        className="results-dropdown-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="check-icon">✓</span>
          <span style={{ fontSize: 12, color: '#2E7D32' }}>
            {affectedCount} of {totalNonZero} effects shown
          </span>
          <span className={`dropdown-chevron ${isExpanded ? 'open' : ''}`}>▾</span>
        </div>
        <span style={{ fontSize: 10, color: '#888' }}>
          {temporalResults.base_year} → {temporalResults.base_year + temporalResults.horizon_years}
        </span>
      </div>

      {/* Filter slider — always visible when results exist */}
      <div className="effect-filter-row">
        <label className="effect-filter-label">
          Show: top {Math.round(effectFilterPct * 100)}%
        </label>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={Math.round(effectFilterPct * 100)}
          onChange={(e) => setEffectFilterPct(Number(e.target.value) / 100)}
          className="effect-filter-slider"
        />
      </div>

      {/* Expanded table */}
      {isExpanded && (
        <div className="dropdown-table-wrapper">
          <table className="dropdown-table">
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Baseline</th>
                <th>Final</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td className="dt-name" title={row.name}>{row.name}</td>
                  <td className="dt-val">{formatVal(row.baseline)}</td>
                  <td className="dt-val">{formatVal(row.simulated)}</td>
                  <td className={`dt-change ${row.percentChange >= 0 ? 'pos' : 'neg'}`}>
                    {formatChange(row)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button className="clear-btn" onClick={onClear}>
        Clear Results
      </button>

      <style>{`
        .results-dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }

        .results-dropdown-header:hover {
          opacity: 0.8;
        }

        .dropdown-chevron {
          font-size: 12px;
          color: #888;
          transition: transform 0.2s;
          display: inline-block;
        }

        .dropdown-chevron.open {
          transform: rotate(180deg);
        }

        .dropdown-table-wrapper {
          max-height: 280px;
          overflow-y: auto;
          margin-top: 8px;
          border-top: 1px solid #C8E6C9;
          padding-top: 4px;
        }

        .dropdown-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }

        .dropdown-table th {
          font-size: 9px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          padding: 4px 3px;
          text-align: left;
          position: sticky;
          top: 0;
          background: #E8F5E9;
          border-bottom: 1px solid #C8E6C9;
        }

        .dropdown-table td {
          padding: 3px;
          border-bottom: 1px solid #f0f0f0;
        }

        .dropdown-table tbody tr:hover {
          background: rgba(76,175,80,0.08);
        }

        .dt-name {
          max-width: 110px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #444;
        }

        .dt-val {
          font-family: 'JetBrains Mono', monospace;
          text-align: right;
          color: #666;
          white-space: nowrap;
        }

        .dt-change {
          font-family: 'JetBrains Mono', monospace;
          text-align: right;
          font-weight: 600;
          white-space: nowrap;
        }

        .dt-change.pos { color: #4caf50; }
        .dt-change.neg { color: #f44336; }

        .effect-filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
          padding: 4px 0;
        }

        .effect-filter-label {
          font-size: 10px;
          color: #666;
          white-space: nowrap;
          min-width: 72px;
        }

        .effect-filter-slider {
          flex: 1;
          height: 3px;
          -webkit-appearance: none;
          appearance: none;
          background: #C8E6C9;
          border-radius: 2px;
          outline: none;
        }

        .effect-filter-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: #4caf50;
          border-radius: 50%;
          cursor: pointer;
        }

        .effect-filter-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #4caf50;
          border-radius: 50%;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}

export default SimulationRunner
