/**
 * DEBUG SYSTEM
 *
 * Development: Shows detailed logs with category prefixes
 * Production: Zero overhead (functions are no-ops, tree-shaken by Vite)
 *
 * Usage:
 *   import { debug } from './utils/debug'
 *   debug.layout('Ring radii:', radii)
 *   debug.perf('Layout calculation')
 *   // ... code ...
 *   debug.perfEnd('Layout calculation')
 */

const IS_DEV = import.meta.env.DEV

// Categories to enable (set to false to silence)
const ENABLED_CATEGORIES: Record<string, boolean> = {
  Layout: false,      // RadialLayout verbose logs
  Viewport: false,    // ViewportScales logs
  Render: false,      // Render cycle logs
  Sector: false,      // Sector filling algorithm
  Space: false,       // Space allocation
  Overlap: false,     // Overlap detection
  cache: true,        // Cache operations (keep for debugging)
}

// No-op function for production
const noop = (): void => {}

// Create bound console methods for development (with category check)
const createLogger = (prefix: string) =>
  IS_DEV && ENABLED_CATEGORIES[prefix] !== false
    ? console.log.bind(console, `[${prefix}]`)
    : noop

const createWarn = (prefix: string) =>
  IS_DEV && ENABLED_CATEGORIES[prefix] !== false
    ? console.warn.bind(console, `[${prefix}]`)
    : noop

export const debug = {
  // Layout calculations (RadialLayout.ts)
  layout: createLogger('Layout'),
  layoutWarn: createWarn('Layout'),

  // Viewport scaling (ViewportScales.ts)
  viewport: createLogger('Viewport'),
  viewportWarn: createWarn('Viewport'),

  // Rendering (App.tsx)
  render: createLogger('Render'),
  renderWarn: createWarn('Render'),

  // Sector filling algorithm
  sector: createLogger('Sector'),

  // Space allocation
  space: createLogger('Space'),

  // Overlap detection
  overlap: createLogger('Overlap'),

  // Performance timing
  perf: IS_DEV ? console.time.bind(console) : noop,
  perfEnd: IS_DEV ? console.timeEnd.bind(console) : noop,

  // Generic debug (for misc logs) - always enabled in dev
  log: IS_DEV ? console.log.bind(console) : noop,
  warn: IS_DEV ? console.warn.bind(console) : noop,
}

export default debug
