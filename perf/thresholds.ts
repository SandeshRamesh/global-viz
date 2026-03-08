/**
 * Performance budgets for Atlas.
 * Each metric has three tiers: pass, warn, fail.
 * CI blocks on fail; warns are GitHub annotations.
 */

export interface Threshold {
  pass: number;
  warn: number;
  fail: number;
  unit: string;
}

// --- Core Web Vitals ---

export const LCP: Threshold = { pass: 2500, warn: 4000, fail: 4000, unit: 'ms' };
export const FCP: Threshold = { pass: 1800, warn: 2500, fail: 2500, unit: 'ms' };
export const CLS: Threshold = { pass: 0.05, warn: 0.1, fail: 0.1, unit: '' };
export const INP: Threshold = { pass: 200, warn: 500, fail: 800, unit: 'ms' };

// --- Resource Budgets ---

export const JS_BUNDLE_GZIP: Threshold = { pass: 700, warn: 750, fail: 1000, unit: 'KB' };
export const CSS_BUNDLE: Threshold = { pass: 15, warn: 25, fail: 50, unit: 'KB' };
export const TOTAL_DIST: Threshold = { pass: 5000, warn: 7000, fail: 10000, unit: 'KB' };
export const INITIAL_HEAP: Threshold = { pass: 35, warn: 50, fail: 80, unit: 'MB' };
export const PEAK_HEAP: Threshold = { pass: 120, warn: 150, fail: 200, unit: 'MB' };
export const DOM_NODES: Threshold = { pass: 7000, warn: 8000, fail: 10000, unit: 'nodes' };
export const FPS: Threshold = { pass: 30, warn: 20, fail: 15, unit: 'fps' };
export const LONG_TASKS: Threshold = { pass: 3, warn: 8, fail: 15, unit: 'tasks' };
export const HEAP_LEAK: Threshold = { pass: 10, warn: 20, fail: 30, unit: 'MB' };

// --- Network ---

export const API_RESPONSE: Threshold = { pass: 500, warn: 1000, fail: 3000, unit: 'ms' };
export const TOTAL_TRANSFER: Threshold = { pass: 3000, warn: 5000, fail: 10000, unit: 'KB' };

/**
 * Evaluate a metric against its threshold.
 * For FPS, higher is better (inverted comparison).
 */
export function evaluate(
  value: number,
  threshold: Threshold,
  higherIsBetter = false
): 'pass' | 'warn' | 'fail' {
  if (higherIsBetter) {
    if (value >= threshold.pass) return 'pass';
    if (value >= threshold.warn) return 'warn';
    return 'fail';
  }
  if (value < threshold.pass) return 'pass';
  if (value < threshold.warn) return 'warn';
  return 'fail';
}

/** Format a result line for console/report output. */
export function formatResult(
  name: string,
  value: number,
  threshold: Threshold,
  higherIsBetter = false
): string {
  const status = evaluate(value, threshold, higherIsBetter);
  const icon = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  return `${icon} ${name}: ${value.toFixed(1)}${threshold.unit} (pass: ${threshold.pass}, warn: ${threshold.warn}, fail: ${threshold.fail})`;
}
