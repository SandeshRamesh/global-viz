/**
 * SimulationRunner Component
 *
 * "Run Simulation" button with:
 * - Validation (country selected, interventions added)
 * - Loading state with spinner
 * - Error handling
 * - Success triggers visualization updates
 */

import { useCallback } from 'react'
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
    runTemporalSimulation,
    clearResults,
    clearError
  } = useSimulationStore()

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

      {/* Run Button */}
      <button
        className={`run-btn ${buttonState.className}`}
        onClick={handleRunSimulation}
        disabled={buttonState.disabled}
      >
        {isSimulating && <span className="spinner" />}
        {buttonState.text}
      </button>

      {/* Error Display */}
      {error && (
        <div className="runner-error">
          <span className="error-icon">!</span>
          <span className="error-text">{error}</span>
          <button className="dismiss-btn" onClick={clearError}>×</button>
        </div>
      )}

      {/* Results Status */}
      {temporalResults && !error && (
        <div className="results-status">
          <div className="results-summary">
            <span className="check-icon">✓</span>
            <span>
              {(() => {
                // Count total unique affected indicators across all years
                const allIndicators = new Set<string>()
                Object.values(temporalResults.effects).forEach(yearEffects => {
                  Object.keys(yearEffects).forEach(id => allIndicators.add(id))
                })
                return `${allIndicators.size} indicators affected`
              })()}
            </span>
          </div>
          <div className="results-detail">
            {temporalResults.base_year} → {temporalResults.base_year + temporalResults.horizon_years}
          </div>
          <button
            className="clear-btn"
            onClick={handleClearResults}
          >
            Clear Results
          </button>
        </div>
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
      `}</style>
    </div>
  )
}

export default SimulationRunner
