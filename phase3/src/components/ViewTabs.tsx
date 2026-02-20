/**
 * ViewTabs - Tab switcher for Global, Local, and Split views
 * With action buttons for Reset, Clear, and Share
 */

import { useState } from 'react'
import type { ViewMode } from '../types'

interface ViewTabsProps {
  activeView: ViewMode
  onViewChange: (view: ViewMode) => void
  localTargetCount: number    // Number of targets in Local View
  onReset: () => void         // Reset view callback
  onClear?: () => void        // Clear local view targets callback
  onShare?: () => Promise<boolean>  // Copy shareable link callback
  simMode?: boolean           // Sim mode enables local/split even without targets
}

/**
 * Tab switcher component with Global/Local/Split tabs and action buttons
 */
export function ViewTabs({
  activeView,
  onViewChange,
  localTargetCount,
  onReset,
  onClear,
  onShare,
  simMode = false
}: ViewTabsProps) {
  const hasTargets = localTargetCount > 0 || simMode
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle')

  const handleShare = async () => {
    if (onShare) {
      const success = await onShare()
      if (success) {
        setShareStatus('copied')
        setTimeout(() => setShareStatus('idle'), 2000)
      }
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 6
      }}
    >
      {/* Row 1: View mode tabs */}
      <div
        style={{
          display: 'flex',
          background: 'white',
          borderRadius: 6,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ddd',
          overflow: 'hidden'
        }}
      >
        {/* Global tab */}
        <button
          onClick={() => onViewChange('global')}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: activeView === 'global' ? 600 : 400,
            cursor: 'pointer',
            border: 'none',
            background: activeView === 'global' ? '#3B82F6' : 'white',
            color: activeView === 'global' ? 'white' : '#555',
            transition: 'all 0.15s ease'
          }}
          title="Global View - Explore the hierarchy (G)"
        >
          Global
        </button>

        {/* Split tab */}
        <button
          onClick={() => onViewChange('split')}
          disabled={!hasTargets && activeView !== 'split'}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: activeView === 'split' ? 600 : 400,
            cursor: !hasTargets && activeView !== 'split' ? 'not-allowed' : 'pointer',
            border: 'none',
            borderLeft: '1px solid #ddd',
            background: activeView === 'split' ? '#3B82F6' : 'white',
            color: activeView === 'split' ? 'white' : !hasTargets ? '#aaa' : '#555',
            opacity: !hasTargets && activeView !== 'split' ? 0.6 : 1,
            transition: 'all 0.15s ease'
          }}
          title={!hasTargets
            ? "Double-click a node to enable split view"
            : "Split View - See both views side by side (S)"
          }
        >
          Split
        </button>

        {/* Local tab */}
        <button
          onClick={() => onViewChange('local')}
          disabled={!hasTargets && activeView !== 'local'}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: activeView === 'local' ? 600 : 400,
            cursor: !hasTargets && activeView !== 'local' ? 'not-allowed' : 'pointer',
            border: 'none',
            borderLeft: '1px solid #ddd',
            background: activeView === 'local' ? '#3B82F6' : 'white',
            color: activeView === 'local' ? 'white' : !hasTargets ? '#aaa' : '#555',
            opacity: !hasTargets && activeView !== 'local' ? 0.6 : 1,
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
          title={!hasTargets
            ? "Double-click a node to view its causal pathways"
            : `Local View - ${localTargetCount} target${localTargetCount !== 1 ? 's' : ''} (L)`
          }
        >
          Local
          {hasTargets && (
            <span
              style={{
                background: activeView === 'local' ? 'rgba(255,255,255,0.3)' : '#3B82F6',
                color: 'white',
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 10,
                fontWeight: 600
              }}
            >
              {localTargetCount}
            </span>
          )}
        </button>
      </div>

      {/* Row 2: Clear and Reset buttons in shared bubble */}
      <div
        style={{
          display: 'flex',
          background: 'white',
          borderRadius: 6,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ddd',
          overflow: 'hidden'
        }}
      >
        {/* Clear button - always rendered, fades in/out smoothly */}
        <button
          onClick={onClear}
          disabled={!hasTargets}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 500,
            cursor: hasTargets ? 'pointer' : 'default',
            border: 'none',
            background: 'white',
            color: hasTargets ? '#E53935' : '#ccc',
            transition: 'all 0.2s ease',
            opacity: hasTargets ? 1 : 0.4
          }}
          onMouseEnter={(e) => {
            if (hasTargets) e.currentTarget.style.background = '#FFEBEE'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white'
          }}
          title={hasTargets ? "Clear all Local View targets (C)" : "No targets to clear"}
        >
          Clear (C)
        </button>

        {/* Reset button */}
        <button
          onClick={onReset}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
            borderLeft: '1px solid #ddd',
            background: 'white',
            color: '#555',
            transition: 'all 0.15s ease'
          }}
          title="Reset view to initial state (R or Home)"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f5f5f5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white'
          }}
        >
          Reset (R)
        </button>
      </div>

      {/* Row 3: Share button */}
      <div
        style={{
          display: 'flex',
          background: 'white',
          borderRadius: 6,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ddd',
          overflow: 'hidden'
        }}
      >
        <button
          onClick={handleShare}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
            background: shareStatus === 'copied' ? '#E8F5E9' : 'white',
            color: shareStatus === 'copied' ? '#2E7D32' : '#555',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
          title="Copy shareable link to clipboard"
          onMouseEnter={(e) => {
            if (shareStatus !== 'copied') {
              e.currentTarget.style.background = '#f5f5f5'
            }
          }}
          onMouseLeave={(e) => {
            if (shareStatus !== 'copied') {
              e.currentTarget.style.background = 'white'
            }
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {shareStatus === 'copied' ? 'Copied!' : 'Share'}
        </button>
      </div>
    </div>
  )
}

export default ViewTabs
