/**
 * SimulationPanel Component
 *
 * Draggable light-themed toolbox panel containing:
 * - Country Selector
 * - Intervention Builder
 * - Policy Templates
 * - Simulation Runner
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSimulationStore, useIsPanelOpen } from '../../stores/simulationStore'
import { usePresence } from '../../hooks/usePresence'
import { PANEL_EXIT_MS } from '../../constants/animation'
import CountrySelector from './CountrySelector'
import TemplateSelector from './TemplateSelector'
import InterventionBuilder from './InterventionBuilder'
import SimulationRunner from './SimulationRunner'

const PANEL_WIDTH = 380
const PANEL_HEIGHT = 560

const getDefaultPosition = () => {
  if (typeof window === 'undefined') return { x: 24, y: 24 }
  return {
    x: window.innerWidth - PANEL_WIDTH - 100,
    y: window.innerHeight - 70 - PANEL_HEIGHT
  }
}

// ============================================
// Main Component
// ============================================

export function SimulationPanel() {
  const isPanelOpen = useIsPanelOpen()
  const { closePanel } = useSimulationStore()
  const { isMounted, isVisible } = usePresence(isPanelOpen, PANEL_EXIT_MS)

  // Drag state
  const [position, setPosition] = useState(() => getDefaultPosition())
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  const clampPosition = useCallback((next: { x: number; y: number }) => {
    const panelWidth = panelRef.current?.offsetWidth || PANEL_WIDTH
    const panelHeight = panelRef.current?.offsetHeight || PANEL_HEIGHT
    return {
      x: Math.max(0, Math.min(next.x, window.innerWidth - panelWidth)),
      y: Math.max(0, Math.min(next.y, window.innerHeight - panelHeight))
    }
  }, [])

  // Reset position when panel opens
  useEffect(() => {
    if (isPanelOpen) {
      setPosition(clampPosition(getDefaultPosition()))
    }
  }, [isPanelOpen, clampPosition])

  // Keep panel on-screen when viewport changes
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => clampPosition(prev))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [clampPosition])

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return

    setIsDragging(true)
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
    e.preventDefault()
  }, [position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const newX = e.clientX - dragOffset.current.x
    const newY = e.clientY - dragOffset.current.y

    setPosition(clampPosition({ x: newX, y: newY }))
  }, [isDragging, clampPosition])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Global mouse listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

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

  if (!isMounted) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-hidden={!isPanelOpen}
      aria-label="Simulation controls"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        width: 380,
        maxHeight: 560,
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 8,
        boxShadow: isDragging
          ? '0 8px 24px rgba(0,0,0,0.2)'
          : '0 2px 12px rgba(0,0,0,0.15)',
        border: '1px solid #ddd',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: isDragging ? 'none' : 'auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(14px)',
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: isDragging
          ? 'none'
          : `opacity ${PANEL_EXIT_MS}ms ease, transform ${PANEL_EXIT_MS}ms ease, box-shadow 0.2s ease`
      }}
    >
      {/* Header - draggable */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          borderBottom: '1px solid #eee',
          background: '#fafafa',
          cursor: isDragging ? 'grabbing' : 'grab',
          flexShrink: 0
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
          Simulation
        </span>
        <button
          onClick={closePanel}
          title="Close (Esc)"
          aria-label="Close simulation panel"
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

        {/* Policy Templates */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #eee' }}>
          <TemplateSelector />
        </div>

        {/* Simulation Runner */}
        <div style={{ padding: '12px 14px', background: '#fafafa' }}>
          <SimulationRunner />
        </div>

      </div>

      <style>{`
        button:focus-visible {
          outline: 2px solid #3B82F6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

export default SimulationPanel
