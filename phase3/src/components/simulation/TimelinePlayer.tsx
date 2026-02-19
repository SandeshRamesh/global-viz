/**
 * TimelinePlayer Component
 *
 * Timeline playback UI with three states:
 * - docked: Bottom left, just play button (matches simulate button style)
 * - expanded: Center, full timeline with scrubber
 * - collapsed: Center, play button + year only
 *
 * Flow: docked -> expanded (on play) -> collapsed (4s inactivity) -> docked (4s more)
 *
 * Supports click-and-drag scrubbing with smooth cursor tracking.
 * Based on common patterns from react-scrubber and similar implementations.
 * Sources: https://www.npmjs.com/package/react-scrubber, https://motion.dev/docs/react-drag
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'

type PlayerState = 'docked' | 'expanded' | 'collapsed' | 'docking'

interface TimelinePlayerProps {
  edgesLoading?: boolean;  // True while temporal edges are loading
  isLocalView?: boolean;   // True when in local/split view
}

export function TimelinePlayer({ edgesLoading = false, isLocalView = false }: TimelinePlayerProps) {
  const {
    selectedCountry,
    isSimulating,
    historicalTimeline,
    timelineLoading,
    temporalResults,
    playbackMode,
    currentYearIndex,
    isPlaying,
    setCurrentYearIndex,
    play,
    pause
  } = useSimulationStore()

  const intervalRef = useRef<number | null>(null)
  const [playerState, setPlayerState] = useState<PlayerState>('docked')
  const [pendingPlay, setPendingPlay] = useState(false)

  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const wasPlayingBeforeDrag = useRef(false)

  // Reset to docked when country changes
  useEffect(() => {
    setPlayerState('docked')
    setPendingPlay(false)
  }, [selectedCountry])

  // Get years array based on mode
  const years = playbackMode === 'historical'
    ? (historicalTimeline?.years || [])
    : Array.from({ length: (temporalResults?.horizon_years || 10) + 1 }, (_, i) => (temporalResults?.base_year || 2024) + i)

  const maxIndex = years.length - 1
  const actualYear = years[currentYearIndex] || null

  // Speed: 300ms for unified (35 years), 700ms for country-specific (~26 years)
  const MS_PER_YEAR = selectedCountry ? 700 : 300

  // Handle pending play after expansion animation completes
  useEffect(() => {
    if (pendingPlay && playerState === 'expanded') {
      // Wait for expansion animation (400ms) + small delay (100ms)
      const timer = setTimeout(() => {
        play()
        setPendingPlay(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [pendingPlay, playerState, play])

  // Playback interval effect - smooth linear progression
  // In local view, wait for edges to load before starting playback
  const shouldPlay = isPlaying && years.length > 0 && !isDragging && !(isLocalView && edgesLoading)

  useEffect(() => {
    if (shouldPlay) {
      intervalRef.current = window.setInterval(() => {
        const state = useSimulationStore.getState()
        const maxIdx = playbackMode === 'historical'
          ? (state.historicalTimeline?.years.length || 1) - 1
          : state.horizonYears

        if (state.currentYearIndex >= maxIdx) {
          state.pause()
        } else {
          state.setCurrentYearIndex(state.currentYearIndex + 1)
        }
      }, MS_PER_YEAR)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [shouldPlay, playbackMode, MS_PER_YEAR])

  // Inactivity timers
  const collapseTimeoutRef = useRef<number | null>(null)
  const dockTimeoutRef = useRef<number | null>(null)

  const clearTimers = useCallback(() => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current)
      collapseTimeoutRef.current = null
    }
    if (dockTimeoutRef.current) {
      clearTimeout(dockTimeoutRef.current)
      dockTimeoutRef.current = null
    }
  }, [])

  // Start inactivity timer for collapse
  const startCollapseTimer = useCallback(() => {
    clearTimers()
    collapseTimeoutRef.current = window.setTimeout(() => {
      setPlayerState('collapsed')
    }, 4000)
  }, [clearTimers])

  // Handle state transitions based on playback and inactivity
  useEffect(() => {
    // Don't run timers while dragging
    if (isDragging) {
      clearTimers()
      return
    }

    clearTimers()

    if (isPlaying) {
      // Playing - stay expanded, no timers
      return
    }

    if (playerState === 'expanded') {
      // Not playing + expanded -> collapse after 2s
      collapseTimeoutRef.current = window.setTimeout(() => {
        setPlayerState('collapsed')
      }, 4000)
    } else if (playerState === 'collapsed') {
      // Only allow docking when on the latest year
      // Otherwise stay collapsed to show the non-latest year
      if (currentYearIndex >= maxIndex) {
        dockTimeoutRef.current = window.setTimeout(() => {
          setPlayerState('docking')
        }, 4000)
      }
    } else if (playerState === 'docking') {
      // After docking animation completes (400ms), switch to docked
      const dockCompleteTimer = setTimeout(() => {
        setPlayerState('docked')
      }, 400)
      return () => clearTimeout(dockCompleteTimer)
    }

    return clearTimers
  }, [isPlaying, playerState, isDragging, clearTimers, currentYearIndex, maxIndex])

  // Calculate index from mouse/touch position
  const getIndexFromPosition = useCallback((clientX: number): number => {
    if (!trackRef.current || maxIndex <= 0) return 0
    const rect = trackRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    return Math.round(percentage * maxIndex)
  }, [maxIndex])

  // Handle drag start (mouse)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isSimulating || maxIndex <= 0) return
    e.preventDefault()

    // Pause playback and remember state
    wasPlayingBeforeDrag.current = isPlaying
    if (isPlaying) pause()

    setIsDragging(true)
    const index = getIndexFromPosition(e.clientX)
    setCurrentYearIndex(index)
  }, [isSimulating, maxIndex, isPlaying, pause, getIndexFromPosition, setCurrentYearIndex])

  // Handle drag start (touch)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isSimulating || maxIndex <= 0) return

    // Pause playback and remember state
    wasPlayingBeforeDrag.current = isPlaying
    if (isPlaying) pause()

    setIsDragging(true)
    const touch = e.touches[0]
    const index = getIndexFromPosition(touch.clientX)
    setCurrentYearIndex(index)
  }, [isSimulating, maxIndex, isPlaying, pause, getIndexFromPosition, setCurrentYearIndex])

  // Handle drag move and end - attach to window for reliable tracking
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const index = getIndexFromPosition(e.clientX)
      setCurrentYearIndex(index)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const index = getIndexFromPosition(touch.clientX)
      setCurrentYearIndex(index)
    }

    const handleDragEnd = () => {
      setIsDragging(false)
      // Restart inactivity timer
      startCollapseTimer()
      // Optionally resume playback if it was playing before
      // (Uncomment if you want auto-resume behavior)
      // if (wasPlayingBeforeDrag.current) play()
    }

    // Attach listeners to window for reliable tracking even when cursor leaves track
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleDragEnd)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleDragEnd)
    window.addEventListener('touchcancel', handleDragEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleDragEnd)
      window.removeEventListener('touchcancel', handleDragEnd)
    }
  }, [isDragging, getIndexFromPosition, setCurrentYearIndex, startCollapseTimer])

  // Show player when timeline data is available
  const showPlayer = (
    timelineLoading ||
    (historicalTimeline !== null && historicalTimeline.years.length > 0) ||
    isSimulating ||
    temporalResults !== null
  )

  if (!showPlayer) return null

  // Calculate cursor position (0-100%)
  const cursorPosition = maxIndex > 0 ? (currentYearIndex / maxIndex) * 100 : 0

  // Toggle play/pause
  const handlePlayPause = () => {
    if (isSimulating || years.length === 0) return
    if (isPlaying) {
      pause()
    } else {
      // If at the end, restart from beginning; otherwise resume from current position
      if (currentYearIndex >= maxIndex) {
        setCurrentYearIndex(0)
      }
      // Expand timeline and delay play until positioned
      setPlayerState('expanded')
      setPendingPlay(true)
    }
  }

  // Handle click on docked button - expand to center with delayed play
  const handleDockedClick = () => {
    if (isSimulating || years.length === 0) return
    // If at the end, restart from beginning; otherwise resume from current position
    if (currentYearIndex >= maxIndex) {
      setCurrentYearIndex(0)
    }
    setPlayerState('expanded')
    setPendingPlay(true)
  }

  // Status text
  const statusText = isSimulating
    ? 'Calculating...'
    : playbackMode === 'historical'
      ? (selectedCountry ? 'Historical Data' : '')
      : 'Simulation'

  // Loading state - show in docked position (SHAP loading or edges loading in local view)
  const isLoading = timelineLoading || (isLocalView && edgesLoading)
  if (isLoading && playerState === 'docked') {
    return (
      <>
        <div className="timeline-docked">
          <button className="docked-btn disabled" disabled>
            <span className="spinner" />
          </button>
        </div>
        <style>{timelineStyles}</style>
      </>
    )
  }

  // Docked state - bottom left, just play button
  if (playerState === 'docked') {
    return (
      <>
        <div className="timeline-docked">
          <button
            className={`docked-btn ${isSimulating ? 'disabled' : ''}`}
            onClick={handleDockedClick}
            disabled={isSimulating}
            title="Play Timeline"
          >
            <svg width="20" height="20" viewBox="0 0 14 14" fill="currentColor">
              <path d="M2 1.5v11a.5.5 0 00.75.43l9.5-5.5a.5.5 0 000-.86l-9.5-5.5A.5.5 0 002 1.5z" />
            </svg>
          </button>
        </div>
        <style>{timelineStyles}</style>
      </>
    )
  }

  // Determine if we're in docking animation
  const isDocking = playerState === 'docking'

  // Expanded, collapsed, or docking state
  return (
    <>
      <div className={`timeline-player ${playerState} ${isPlaying ? 'playing' : ''} ${isDragging ? 'dragging' : ''}`}>
        {/* Play/Pause Button */}
        <button
          className={`play-btn ${isSimulating ? 'disabled' : ''}`}
          onClick={handlePlayPause}
          disabled={isSimulating}
          title={isPlaying ? 'Pause' : 'Play Timeline'}
        >
          {isSimulating ? (
            <span className="spinner" />
          ) : isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="1" width="4" height="12" rx="1" />
              <rect x="8" y="1" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M2 1.5v11a.5.5 0 00.75.43l9.5-5.5a.5.5 0 000-.86l-9.5-5.5A.5.5 0 002 1.5z" />
            </svg>
          )}
        </button>

        {/* Current year always visible */}
        <span className={`year-display-always ${isDocking ? 'fading' : ''}`}>
          {actualYear}
        </span>

        {/* Expandable content - only visible when expanded */}
        <div className="expandable-content">
          {/* Status Text - only render if there's text */}
          {statusText && <span className="status-text">{statusText}</span>}

          {/* Timeline Track - supports click and drag */}
          <div
            ref={trackRef}
            className={`timeline-track ${isSimulating ? 'disabled' : ''} ${isDragging ? 'dragging' : ''}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div className="track-line" />

            {/* Year markers at start and end */}
            {years.length > 0 && (
              <>
                <span className="year-marker start">{years[0]}</span>
                <span className="year-marker end">{years[maxIndex]}</span>
              </>
            )}

            <div
              className={`cursor ${isDragging ? 'dragging' : ''}`}
              style={{
                left: `${cursorPosition}%`,
                // Disable transition during drag for immediate response
                transition: isDragging ? 'none' : `left ${MS_PER_YEAR}ms linear`
              }}
            />
          </div>
        </div>
      </div>
      <style>{timelineStyles}</style>
    </>
  )
}

const timelineStyles = `
  /* Docked state - bottom left, 3rd in row after data quality & simulate buttons */
  .timeline-docked {
    position: fixed;
    bottom: 10px;
    left: 122px; /* 10px margin + 48px (data quality) + 8px gap + 48px (simulate) + 12px gap */
    z-index: 1000;
  }

  .docked-btn {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e0e0e0;
    border-radius: 24px;
    color: #666;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
    transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
    outline: none;
  }

  .docked-btn:hover:not(.disabled) {
    background: #f0f0f0;
    color: #333;
  }

  .docked-btn.disabled {
    background: rgba(255, 255, 255, 0.7);
    cursor: wait;
    color: #999;
  }

  .docked-btn .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(102, 102, 102, 0.2);
    border-top-color: #666;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* Center timeline player */
  .timeline-player {
    position: fixed;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e0e0e0;
    border-radius: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
    z-index: 1000;
    transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                padding 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                gap 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.3s ease;
    overflow: visible;
  }

  .timeline-player.collapsed {
    padding: 8px 12px;
    gap: 8px;
  }

  /* Docking animation - move from center to bottom left */
  .timeline-player.docking {
    left: 94px; /* 70px + 24px (half of 48px button) */
    transform: translateX(-50%);
    padding: 8px 12px;
    gap: 8px;
    opacity: 0;
  }

  .year-display-always {
    font-size: 13px;
    font-weight: 600;
    color: #333;
    font-variant-numeric: tabular-nums;
    min-width: 36px;
    transition: opacity 0.3s ease-out;
  }

  .year-display-always.fading {
    opacity: 0;
  }

  .expandable-content {
    display: flex;
    align-items: center;
    gap: 12px;
    overflow: visible;
    max-width: 400px;
    opacity: 1;
    transition: max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                gap 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .timeline-player.collapsed .expandable-content,
  .timeline-player.docking .expandable-content {
    max-width: 0;
    opacity: 0;
    gap: 0;
  }

  .timeline-player.expanded .expandable-content {
    max-width: 400px;
    opacity: 1;
  }

  .play-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: #3B82F6;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
    flex-shrink: 0;
    outline: none;
  }

  .play-btn:hover:not(.disabled) {
    background: #2563EB;
  }

  .play-btn.disabled {
    background: #93C5FD;
    cursor: wait;
  }

  .play-btn .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .status-text {
    font-size: 11px;
    color: #666;
    white-space: nowrap;
    min-width: 80px;
  }

  .timeline-track {
    position: relative;
    width: 240px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    overflow: visible;
    touch-action: none; /* Prevent browser handling of touch gestures */
    user-select: none;
  }

  .timeline-track.dragging {
    cursor: grabbing;
  }

  .timeline-track.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .track-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
  }

  .year-marker {
    position: absolute;
    bottom: -2px;
    font-size: 9px;
    color: #999;
    user-select: none;
  }

  .year-marker.start {
    left: 0;
  }

  .year-marker.end {
    right: 0;
  }

  .cursor {
    position: absolute;
    width: 14px;
    height: 14px;
    background: #3B82F6;
    border: 2px solid white;
    border-radius: 50%;
    transform: translateX(-50%);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    cursor: grab;
  }

  .cursor.dragging {
    cursor: grabbing;
    transform: translateX(-50%) scale(1.2);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  }

  .cursor-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    background: #1E293B;
    color: white;
    font-size: 11px;
    font-weight: 500;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
    transition: opacity 0.15s;
    margin-bottom: 6px;
    z-index: 10;
  }

  .cursor-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: #1E293B;
  }

  /* Visible during playback or dragging */
  .timeline-player.playing .cursor-tooltip,
  .timeline-player.dragging .cursor-tooltip {
    opacity: 1;
  }

  /* Hidden when not playing and not dragging (default) */
  .timeline-player:not(.playing):not(.dragging) .cursor-tooltip {
    opacity: 0;
  }

  /* Show on hover when expanded but not playing */
  .timeline-player.expanded:not(.playing):not(.dragging) .cursor:hover .cursor-tooltip,
  .timeline-player.expanded:not(.playing):not(.dragging) .timeline-track:hover .cursor-tooltip {
    opacity: 1;
  }
`

export default TimelinePlayer
