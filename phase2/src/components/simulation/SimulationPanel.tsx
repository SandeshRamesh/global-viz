/**
 * SimulationPanel Component
 *
 * Light-themed toolbox panel on the right side containing:
 * - Country Selector
 * - Intervention Builder
 * - Simulation Runner
 * - Results Panel (when results exist)
 */

import { useEffect } from 'react'
import { useSimulationStore, useIsPanelOpen } from '../../stores/simulationStore'
import CountrySelector from './CountrySelector'
import InterventionBuilder from './InterventionBuilder'
import SimulationRunner from './SimulationRunner'
import ResultsPanel from './ResultsPanel'

// ============================================
// Main Component
// ============================================

export function SimulationPanel() {
  const isPanelOpen = useIsPanelOpen()
  const { closePanel, simulationResults } = useSimulationStore()

  // Close panel with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPanelOpen) {
        closePanel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isPanelOpen, closePanel])

  if (!isPanelOpen) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 70,
        right: 100,
        width: 300,
        maxHeight: 420,
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 8,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        border: '1px solid #ddd',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          borderBottom: '1px solid #eee',
          background: '#fafafa'
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
          Simulation
        </span>
        <button
          onClick={closePanel}
          title="Close (Esc)"
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            fontSize: 18,
            cursor: 'pointer',
            padding: '0 4px',
            lineHeight: 1
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#666'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        {/* Country Selection */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #eee' }}>
          <CountrySelector />
        </div>

        {/* Intervention Builder */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #eee' }}>
          <InterventionBuilder />
        </div>

        {/* Simulation Runner */}
        <div style={{ padding: '12px 14px', background: '#fafafa' }}>
          <SimulationRunner />
        </div>

        {/* Results Panel (conditionally shown) */}
        {simulationResults && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid #eee', background: 'rgba(76,175,80,0.05)' }}>
            <ResultsPanel />
          </div>
        )}
      </div>
    </div>
  )
}

export default SimulationPanel
