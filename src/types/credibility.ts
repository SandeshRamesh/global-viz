/**
 * Types for the credibility artifact served at `public/data/credibility.json`.
 *
 * Produced by `scripts/dev/build_credibility_artifact.py`. Two layers:
 *  - `timeline`  per-year fit quality of the unified temporal graph, read
 *                verbatim out of the shipped v3.1 graph JSONs
 *  - `drilldown` per-year country-scope predicted-vs-actual points, stored
 *                columnar (parallel arrays) to keep the payload small
 */

/** One year of unified-scope fit statistics for a single edge. */
export interface CredibilityTimelinePoint {
  year: number
  /** R² of the functional form actually selected (linear, quadratic, …). */
  r2: number
  /** R² of the plain linear fit at the same lag, always present for reference. */
  r2Linear: number
  /** Bootstrap mean of the standardised slope. */
  beta: number
  ciLower: number
  ciUpper: number
  pValue: number
  /** Observations behind the fit (the estimation window expands each year). */
  n: number
  lag: number
  type: RelationshipType
}

export type RelationshipType =
  | 'linear'
  | 'quadratic'
  | 'threshold'
  | 'logarithmic'
  | 'saturation'

/** Columnar predicted-vs-actual points for one edge in one year. */
export interface CredibilityDrilldownColumns {
  /** Indices into the top-level `countries` array. */
  c: number[]
  /** Observed target value. */
  o: number[]
  /** Fitted target value. */
  p: number[]
  /** R² of that country's own fit over its window. */
  r2: number[]
  /** Observations in that country's window. */
  n: number[]
  lag: number[]
  t: RelationshipType[]
}

export interface CredibilityFinding {
  id: string
  /** Findings sharing a group are legs of one causal chain (e.g. F08). */
  group: string
  title: string
  source: string
  target: string
  sourceLabel: string
  targetLabel: string
  timeline: CredibilityTimelinePoint[]
  drilldown: Record<string, CredibilityDrilldownColumns>
}

export interface CredibilityDisclosure {
  id: string
  severity: 'warning' | 'note'
  title: string
  body: string
}

export interface CredibilityArtifact {
  schemaVersion: number
  generatedAt: string
  yearRange: [number, number]
  scopeNote: string
  provenance: Record<string, unknown>
  disclosures: CredibilityDisclosure[]
  /** Shared country name table referenced by drill-down `c` indices. */
  countries: string[]
  findings: CredibilityFinding[]
}

/** A single predicted-vs-actual point, decoded from the columnar form. */
export interface CredibilityScatterPoint {
  country: string
  observed: number
  predicted: number
  residual: number
  r2: number
  n: number
  lag: number
  type: RelationshipType
}
