/**
 * URL State Management
 *
 * Encodes/decodes application state to/from URL for shareable links.
 * Uses query parameters for readability with base64 fallback for complex state.
 */

import type { ViewMode } from '../types'

/**
 * State to persist in URL
 */
export interface URLState {
  view: ViewMode
  expanded?: string[]      // Expanded node IDs (Global View)
  targets?: string[]       // Target node IDs (Local View)
  beta?: number            // Beta threshold
  highlight?: string       // Highlighted/searched node
  zoom?: {
    k: number              // Scale
    x: number              // Pan X
    y: number              // Pan Y
  }
}

/**
 * Encode state to URL search params
 */
export function encodeStateToURL(state: URLState): string {
  const params = new URLSearchParams()

  // View mode (always included)
  params.set('v', state.view)

  // Expanded nodes (comma-separated)
  if (state.expanded && state.expanded.length > 0) {
    params.set('e', state.expanded.join(','))
  }

  // Local View targets (comma-separated)
  if (state.targets && state.targets.length > 0) {
    params.set('t', state.targets.join(','))
  }

  // Beta threshold (only if not default)
  if (state.beta !== undefined && state.beta !== 0.5) {
    params.set('b', state.beta.toFixed(2))
  }

  // Highlighted node
  if (state.highlight) {
    params.set('h', state.highlight)
  }

  // Zoom state (compact format: k,x,y)
  if (state.zoom) {
    params.set('z', `${state.zoom.k.toFixed(2)},${state.zoom.x.toFixed(0)},${state.zoom.y.toFixed(0)}`)
  }

  return params.toString()
}

/**
 * Decode URL search params to state
 */
export function decodeStateFromURL(search: string): Partial<URLState> | null {
  if (!search || search === '?') return null

  try {
    const params = new URLSearchParams(search)
    const state: Partial<URLState> = {}

    // View mode
    const view = params.get('v')
    if (view && ['global', 'local', 'split'].includes(view)) {
      state.view = view as ViewMode
    }

    // Expanded nodes
    const expanded = params.get('e')
    if (expanded) {
      state.expanded = expanded.split(',').filter(Boolean)
    }

    // Local View targets
    const targets = params.get('t')
    if (targets) {
      state.targets = targets.split(',').filter(Boolean)
    }

    // Beta threshold
    const beta = params.get('b')
    if (beta) {
      const parsed = parseFloat(beta)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
        state.beta = parsed
      }
    }

    // Highlighted node
    const highlight = params.get('h')
    if (highlight) {
      state.highlight = highlight
    }

    // Zoom state
    const zoom = params.get('z')
    if (zoom) {
      const parts = zoom.split(',')
      if (parts.length === 3) {
        const k = parseFloat(parts[0])
        const x = parseFloat(parts[1])
        const y = parseFloat(parts[2])
        if (!isNaN(k) && !isNaN(x) && !isNaN(y)) {
          state.zoom = { k, x, y }
        }
      }
    }

    return Object.keys(state).length > 0 ? state : null
  } catch {
    return null
  }
}

/**
 * Update browser URL without navigation
 */
export function updateBrowserURL(state: URLState): void {
  const encoded = encodeStateToURL(state)
  const newURL = encoded ? `?${encoded}` : window.location.pathname
  window.history.replaceState(null, '', newURL)
}

/**
 * Get current state from browser URL
 */
export function getStateFromBrowserURL(): Partial<URLState> | null {
  return decodeStateFromURL(window.location.search)
}

/**
 * Generate a shareable URL for current state
 */
export function generateShareableURL(state: URLState): string {
  const encoded = encodeStateToURL(state)
  const base = window.location.origin + window.location.pathname
  return encoded ? `${base}?${encoded}` : base
}

/**
 * Copy URL to clipboard and return success status
 */
export async function copyURLToClipboard(state: URLState): Promise<boolean> {
  try {
    const url = generateShareableURL(state)
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    // Fallback for older browsers
    try {
      const url = generateShareableURL(state)
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch {
      return false
    }
  }
}
