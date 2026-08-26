/**
 * Loading and derivation for the credibility artifact.
 *
 * Rendering lives in `components/simulation/CredibilityContent.tsx`; everything
 * here is pure data work so it can be exercised without a DOM.
 */

import type {
  CredibilityArtifact,
  CredibilityDrilldownColumns,
  CredibilityFinding,
  CredibilityScatterPoint,
} from '../types/credibility'

const ARTIFACT_URL = `${import.meta.env.BASE_URL}data/credibility.json`

/** Palette for the finding series. Chain legs share a hue family. */
export const FINDING_COLORS: Record<string, string> = {
  F01: '#3B82F6',
  F02: '#10B981',
  F06: '#8B5CF6',
  F08a: '#F59E0B',
  F08b: '#EF4444',
}

export const FALLBACK_COLOR = '#767676'

let cache: Promise<CredibilityArtifact> | null = null

/**
 * Fetch the artifact once per session.
 *
 * The payload is ~0.7 MB and fully static, so it is cached in module scope and
 * shared by every mount of the panel.
 *
 * Deliberately takes no AbortSignal: the promise outlives any single mount, so
 * binding it to one component's controller would let that component's unmount
 * abort the fetch for every other consumer. Callers drop late results with their
 * own cancellation flag instead.
 */
export function loadCredibility(): Promise<CredibilityArtifact> {
  if (!cache) {
    cache = fetch(ARTIFACT_URL)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`credibility.json ${res.status}`)
        }
        return (await res.json()) as CredibilityArtifact
      })
      .catch((err: unknown) => {
        // Never cache a rejection - a transient failure would poison the session.
        cache = null
        throw err
      })
  }
  return cache
}

/**
 * Expand one year of columnar drill-down data into scatter points.
 *
 * Returns an empty array when the year has no country-scope fits, which happens
 * in the early years where too few countries clear the 10-observation minimum.
 */
export function decodeScatter(
  columns: CredibilityDrilldownColumns | undefined,
  countries: string[],
): CredibilityScatterPoint[] {
  if (!columns) return []
  const points: CredibilityScatterPoint[] = []
  for (let i = 0; i < columns.c.length; i++) {
    const observed = columns.o[i]
    const predicted = columns.p[i]
    points.push({
      country: countries[columns.c[i]] ?? 'Unknown',
      observed,
      predicted,
      residual: predicted - observed,
      r2: columns.r2[i],
      n: columns.n[i],
      lag: columns.lag[i],
      type: columns.t[i],
    })
  }
  return points
}

/** Years for which a finding actually has drill-down points, ascending. */
export function drilldownYears(finding: CredibilityFinding): number[] {
  return Object.keys(finding.drilldown)
    .map(Number)
    .sort((a, b) => a - b)
}

export interface ScatterSummary {
  count: number
  /** Median absolute residual, in the target's native units. */
  medianAbsResidual: number
  /**
   * Median absolute percentage error across countries.
   *
   * Deliberately used in place of a correlation between observed and predicted.
   * Target values span several orders of magnitude across countries, so that
   * correlation sits above 0.99 almost regardless of fit quality - it measures
   * the spread of country sizes, not the model. A median percentage error stays
   * informative at any scale.
   */
  medianAbsPctError: number | null
  /** Share of countries whose own fit clears R² = 0.5. */
  shareWellFit: number
}

/** Headline numbers under the scatter. */
export function summariseScatter(points: CredibilityScatterPoint[]): ScatterSummary | null {
  if (points.length === 0) return null

  const medianAbsResidual = median(points.map((p) => Math.abs(p.residual)))

  // Countries whose observed value is ~0 give a meaningless percentage.
  const pctErrors = points
    .filter((p) => Math.abs(p.observed) > 1e-9)
    .map((p) => Math.abs(p.residual / p.observed) * 100)

  const wellFit = points.filter((p) => p.r2 >= 0.5).length

  return {
    count: points.length,
    medianAbsResidual,
    medianAbsPctError: pctErrors.length > 0 ? median(pctErrors) : null,
    shareWellFit: wellFit / points.length,
  }
}

/** Median of a numeric list. Assumes a non-empty input. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Compact number formatting for axis ticks and tooltips.
 *
 * Indicator units vary by orders of magnitude across findings, so the precision
 * is chosen from the magnitude rather than fixed.
 */
export function formatValue(value: number): string {
  const abs = Math.abs(value)
  if (abs === 0) return '0'
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (abs >= 1e4) return `${(value / 1e3).toFixed(1)}k`
  if (abs >= 100) return value.toFixed(0)
  if (abs >= 1) return value.toFixed(2)
  return value.toPrecision(2)
}

export type ScatterScale = 'linear' | 'log'

/**
 * Choose axis scaling for a predicted-vs-actual scatter.
 *
 * Economic indicators run over several orders of magnitude across countries, so
 * a linear scatter collapses almost every country into the origin. Log is the
 * readable default when the spread is wide and every value is positive; a log
 * axis cannot represent zero or negative values, so those fall back to linear.
 */
export function suggestScale(points: CredibilityScatterPoint[]): ScatterScale {
  const values = points.flatMap((p) => [p.observed, p.predicted])
  if (values.length === 0) return 'linear'
  if (values.some((v) => v <= 0)) return 'linear'
  const min = Math.min(...values)
  const max = Math.max(...values)
  return max / min > 1000 ? 'log' : 'linear'
}

/** Human-readable label for a fitted functional form. */
export function formatRelationship(type: string): string {
  switch (type) {
    case 'linear':
      return 'Linear'
    case 'quadratic':
      return 'Quadratic'
    case 'threshold':
      return 'Threshold'
    case 'logarithmic':
      return 'Logarithmic'
    case 'saturation':
      return 'Saturation'
    default:
      return type
  }
}
