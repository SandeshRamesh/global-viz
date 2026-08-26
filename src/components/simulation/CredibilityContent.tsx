/**
 * CredibilityContent - fit-quality view for the anchor findings.
 *
 * Layer 1 (timeline): how well each anchor edge fits as the estimation window
 * expands from 1990 to 2024. Two panels share a year axis - R² for every
 * finding on top, the focused finding's β with its bootstrap CI below. β runs
 * negative for some findings while R² is bounded to [0,1], so they cannot
 * honestly share one axis.
 *
 * Layer 2 (drill-down): tapping a year opens predicted-vs-actual for that
 * finding at country scope - one point per country, each fitted on its own
 * series. Pooled scopes apply the lag shift across country boundaries; fitting
 * within a country sidesteps that entirely (see the `lag-pairing` disclosure).
 *
 * All numbers are read from `public/data/credibility.json`. Nothing is refitted
 * in the browser.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import type {
  CredibilityArtifact,
  CredibilityDisclosure,
  CredibilityFinding,
  CredibilityScatterPoint,
  CredibilityTimelinePoint,
} from '../../types/credibility'
import {
  decodeScatter,
  FALLBACK_COLOR,
  FINDING_COLORS,
  formatRelationship,
  formatValue,
  loadCredibility,
  suggestScale,
  summariseScatter,
} from '../../services/credibility'
import type { ScatterScale } from '../../services/credibility'

const CHART_MIN_WIDTH = 260
const R2_HEIGHT = 118
const BETA_HEIGHT = 84
const SCATTER_HEIGHT = 250
const MARGIN = { top: 8, right: 8, bottom: 18, left: 30 }

const MUTED_LINE = '#d5dae4'
const AXIS_TEXT = '#767676'
const GRID = '#eef0f5'

/** Track the content width so the charts fill the panel at any size. */
function useMeasuredWidth(fallback = 320): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(fallback)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return

    const measure = () => setWidth(Math.max(CHART_MIN_WIDTH, node.clientWidth))
    measure()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}

const colorFor = (id: string) => FINDING_COLORS[id] ?? FALLBACK_COLOR

/** Red → amber → green ramp for per-country R². */
const r2Color = (r2: number) => d3.interpolateRdYlGn(Math.max(0, Math.min(1, r2)))

export function CredibilityContent() {
  const [artifact, setArtifact] = useState<CredibilityArtifact | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string>('F02')
  const [drilldown, setDrilldown] = useState<{ findingId: string; year: number } | null>(null)

  useEffect(() => {
    let cancelled = false

    loadCredibility()
      .then((data) => {
        if (cancelled) return
        setArtifact(data)
        if (data.findings.length > 0 && !data.findings.some((f) => f.id === 'F02')) {
          setFocusedId(data.findings[0].id)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const focused = useMemo(
    () => artifact?.findings.find((f) => f.id === focusedId) ?? artifact?.findings[0] ?? null,
    [artifact, focusedId],
  )

  const openDrilldown = useCallback((findingId: string, year: number) => {
    setDrilldown({ findingId, year })
  }, [])

  if (error) {
    return (
      <div style={{ fontSize: 12, color: '#B91C1C', lineHeight: 1.5 }}>
        Could not load credibility data ({error}).
        <div style={{ color: AXIS_TEXT, marginTop: 6 }}>
          Generate it with <code>scripts/dev/build_credibility_artifact.py</code>.
        </div>
      </div>
    )
  }

  if (!artifact || !focused) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: '#d0d5e0',
            borderTopColor: '#666',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    )
  }

  if (drilldown) {
    const finding = artifact.findings.find((f) => f.id === drilldown.findingId)
    if (finding) {
      return (
        <DrilldownView
          artifact={artifact}
          finding={finding}
          year={drilldown.year}
          onYearChange={(year) => setDrilldown({ ...drilldown, year })}
          onBack={() => setDrilldown(null)}
        />
      )
    }
  }

  return (
    <TimelineView
      artifact={artifact}
      focused={focused}
      onFocus={setFocusedId}
      onOpenDrilldown={openDrilldown}
    />
  )
}

// ============================================
// Layer 1 - timeline
// ============================================

interface TimelineViewProps {
  artifact: CredibilityArtifact
  focused: CredibilityFinding
  onFocus: (id: string) => void
  onOpenDrilldown: (findingId: string, year: number) => void
}

function TimelineView({ artifact, focused, onFocus, onOpenDrilldown }: TimelineViewProps) {
  const [ref, width] = useMeasuredWidth()
  const [hoverYear, setHoverYear] = useState<number | null>(null)

  /**
   * Default to the most recent year that actually has country-scope points.
   * Source indicators report with a lag, so the final timeline years often have
   * none - landing there would show a dead drill-down button on first open.
   */
  const defaultYear = useMemo(() => {
    const withPoints = Object.keys(focused.drilldown).map(Number)
    if (withPoints.length > 0) return Math.max(...withPoints)
    return focused.timeline[focused.timeline.length - 1]?.year
  }, [focused])

  const readout = useMemo(() => {
    const year = hoverYear ?? defaultYear
    return focused.timeline.find((p) => p.year === year) ?? null
  }, [focused, hoverYear, defaultYear])

  const hasDrilldown = readout ? Boolean(focused.drilldown[String(readout.year)]) : false

  return (
    <div ref={ref}>
      <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 2 }}>
        Fit quality over time
      </div>
      <div style={{ fontSize: 11, color: AXIS_TEXT, lineHeight: 1.45, marginBottom: 10 }}>
        R² of each anchor finding as the estimation window expands. Tap a point to see
        predicted vs actual for that year.
      </div>

      <FindingLegend findings={artifact.findings} focusedId={focused.id} onFocus={onFocus} />

      <R2Chart
        findings={artifact.findings}
        focused={focused}
        width={width}
        hoverYear={hoverYear}
        onHoverYear={setHoverYear}
        onSelectYear={(year) => onOpenDrilldown(focused.id, year)}
      />

      <div style={{ fontSize: 10, color: AXIS_TEXT, margin: '10px 0 2px', fontWeight: 600 }}>
        β with 95% bootstrap CI · {focused.id}
      </div>
      <BetaChart
        finding={focused}
        width={width}
        hoverYear={hoverYear}
        onHoverYear={setHoverYear}
        onSelectYear={(year) => onOpenDrilldown(focused.id, year)}
      />

      {readout && (
        <YearReadout
          finding={focused}
          point={readout}
          hasDrilldown={hasDrilldown}
          onOpen={() => onOpenDrilldown(focused.id, readout.year)}
        />
      )}

      <DisclosureList disclosures={artifact.disclosures} />

      <div style={{ fontSize: 9, color: '#9aa1ad', marginTop: 10, lineHeight: 1.5 }}>
        {artifact.scopeNote} Generated {artifact.generatedAt.slice(0, 10)}.
      </div>
    </div>
  )
}

interface FindingLegendProps {
  findings: CredibilityFinding[]
  focusedId: string
  onFocus: (id: string) => void
}

function FindingLegend({ findings, focusedId, onFocus }: FindingLegendProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
      {findings.map((finding) => {
        const active = finding.id === focusedId
        const color = colorFor(finding.id)
        return (
          <button
            key={finding.id}
            onClick={() => onFocus(finding.id)}
            title={`${finding.sourceLabel} → ${finding.targetLabel}`}
            aria-pressed={active}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 999,
              border: `1px solid ${active ? color : '#e2e6ee'}`,
              background: active ? `${color}14` : 'white',
              color: active ? color : '#666',
              fontWeight: active ? 600 : 400,
              fontSize: 11,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: active ? color : MUTED_LINE,
                flexShrink: 0,
              }}
            />
            {finding.id}
          </button>
        )
      })}
    </div>
  )
}

interface ChartProps {
  width: number
  hoverYear: number | null
  onHoverYear: (year: number | null) => void
  onSelectYear: (year: number) => void
}

interface R2ChartProps extends ChartProps {
  findings: CredibilityFinding[]
  focused: CredibilityFinding
}

function R2Chart({
  findings,
  focused,
  width,
  hoverYear,
  onHoverYear,
  onSelectYear,
}: R2ChartProps) {
  const innerW = Math.max(40, width - MARGIN.left - MARGIN.right)
  const innerH = R2_HEIGHT - MARGIN.top - MARGIN.bottom

  const years = focused.timeline.map((p) => p.year)
  const x = d3
    .scaleLinear()
    .domain([years[0] ?? 1990, years[years.length - 1] ?? 2024])
    .range([0, innerW])
  const y = d3.scaleLinear().domain([0, 1]).range([innerH, 0])

  const line = d3
    .line<CredibilityTimelinePoint>()
    .x((p) => x(p.year))
    .y((p) => y(p.r2))
    .curve(d3.curveMonotoneX)

  const focusColor = colorFor(focused.id)

  return (
    <svg
      width={width}
      height={R2_HEIGHT}
      role="img"
      aria-label={`R-squared from ${years[0]} to ${years[years.length - 1]} for each anchor finding`}
      style={{ display: 'block', touchAction: 'pan-y' }}
      onMouseLeave={() => onHoverYear(null)}
    >
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <g key={tick}>
            <line x1={0} x2={innerW} y1={y(tick)} y2={y(tick)} stroke={GRID} strokeWidth={1} />
            <text x={-6} y={y(tick)} dy="0.32em" textAnchor="end" fontSize={9} fill={AXIS_TEXT}>
              {tick === 0 || tick === 1 ? tick.toFixed(0) : tick.toFixed(2).slice(1)}
            </text>
          </g>
        ))}

        {x.ticks(Math.max(3, Math.floor(innerW / 60))).map((tick) => (
          <text
            key={tick}
            x={x(tick)}
            y={innerH + 13}
            textAnchor="middle"
            fontSize={9}
            fill={AXIS_TEXT}
          >
            {tick}
          </text>
        ))}

        {/* Unfocused findings sit behind as context */}
        {findings
          .filter((f) => f.id !== focused.id)
          .map((f) => (
            <path
              key={f.id}
              d={line(f.timeline) ?? undefined}
              fill="none"
              stroke={MUTED_LINE}
              strokeWidth={1.25}
            />
          ))}

        <path d={line(focused.timeline) ?? undefined} fill="none" stroke={focusColor} strokeWidth={2} />

        {hoverYear !== null && (
          <line
            x1={x(hoverYear)}
            x2={x(hoverYear)}
            y1={0}
            y2={innerH}
            stroke={focusColor}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.6}
          />
        )}

        {focused.timeline.map((p) => {
          const active = hoverYear === p.year
          const available = Boolean(focused.drilldown[String(p.year)])
          return (
            <g key={p.year}>
              <circle
                cx={x(p.year)}
                cy={y(p.r2)}
                r={active ? 4 : 2.5}
                fill={available ? focusColor : 'white'}
                stroke={focusColor}
                strokeWidth={1.25}
              />
              {/* Oversized transparent hit area for touch */}
              <circle
                cx={x(p.year)}
                cy={y(p.r2)}
                r={11}
                fill="transparent"
                style={{ cursor: available ? 'pointer' : 'default' }}
                onMouseEnter={() => onHoverYear(p.year)}
                onClick={() => available && onSelectYear(p.year)}
              >
                <title>{`${p.year} · R² ${p.r2.toFixed(3)}`}</title>
              </circle>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

interface BetaChartProps extends ChartProps {
  finding: CredibilityFinding
}

function BetaChart({ finding, width, hoverYear, onHoverYear, onSelectYear }: BetaChartProps) {
  const innerW = Math.max(40, width - MARGIN.left - MARGIN.right)
  const innerH = BETA_HEIGHT - MARGIN.top - MARGIN.bottom

  const points = finding.timeline
  const lo = d3.min(points, (p) => p.ciLower) ?? 0
  const hi = d3.max(points, (p) => p.ciUpper) ?? 1
  const pad = Math.max((hi - lo) * 0.12, 1e-3)

  const x = d3
    .scaleLinear()
    .domain([points[0]?.year ?? 1990, points[points.length - 1]?.year ?? 2024])
    .range([0, innerW])
  const y = d3.scaleLinear().domain([lo - pad, hi + pad]).range([innerH, 0])

  const area = d3
    .area<CredibilityTimelinePoint>()
    .x((p) => x(p.year))
    .y0((p) => y(p.ciLower))
    .y1((p) => y(p.ciUpper))
    .curve(d3.curveMonotoneX)

  const line = d3
    .line<CredibilityTimelinePoint>()
    .x((p) => x(p.year))
    .y((p) => y(p.beta))
    .curve(d3.curveMonotoneX)

  const color = colorFor(finding.id)
  const crossesZero = lo - pad < 0 && hi + pad > 0

  return (
    <svg
      width={width}
      height={BETA_HEIGHT}
      role="img"
      aria-label={`Beta coefficient with bootstrap confidence interval for ${finding.id}`}
      style={{ display: 'block', touchAction: 'pan-y' }}
      onMouseLeave={() => onHoverYear(null)}
    >
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {y.ticks(3).map((tick) => (
          <g key={tick}>
            <line x1={0} x2={innerW} y1={y(tick)} y2={y(tick)} stroke={GRID} strokeWidth={1} />
            <text x={-6} y={y(tick)} dy="0.32em" textAnchor="end" fontSize={9} fill={AXIS_TEXT}>
              {tick.toFixed(1)}
            </text>
          </g>
        ))}

        {crossesZero && (
          <line x1={0} x2={innerW} y1={y(0)} y2={y(0)} stroke="#c3c9d4" strokeWidth={1} />
        )}

        <path d={area(points) ?? undefined} fill={color} opacity={0.18} />
        <path d={line(points) ?? undefined} fill="none" stroke={color} strokeWidth={1.75} />

        {hoverYear !== null && (
          <line
            x1={x(hoverYear)}
            x2={x(hoverYear)}
            y1={0}
            y2={innerH}
            stroke={color}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.6}
          />
        )}

        {points.map((p) => (
          <circle
            key={p.year}
            cx={x(p.year)}
            cy={y(p.beta)}
            r={11}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => onHoverYear(p.year)}
            onClick={() => finding.drilldown[String(p.year)] && onSelectYear(p.year)}
          >
            <title>{`${p.year} · β ${p.beta.toFixed(3)}`}</title>
          </circle>
        ))}
      </g>
    </svg>
  )
}

interface YearReadoutProps {
  finding: CredibilityFinding
  point: CredibilityTimelinePoint
  hasDrilldown: boolean
  onOpen: () => void
}

function YearReadout({ finding, point, hasDrilldown, onOpen }: YearReadoutProps) {
  const color = colorFor(finding.id)
  return (
    <div
      style={{
        marginTop: 10,
        padding: 10,
        background: '#f8f9fc',
        border: '1px solid #e2e6ee',
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: '#333', marginBottom: 2 }}>
        {finding.id} · {point.year}
      </div>
      <div style={{ fontSize: 10, color: AXIS_TEXT, marginBottom: 8, lineHeight: 1.4 }}>
        {finding.sourceLabel} → {finding.targetLabel}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
        <MiniStat label="R²" value={point.r2.toFixed(3)} color={color} />
        <MiniStat label="β" value={point.beta.toFixed(3)} color={color} />
        <MiniStat label="n" value={point.n.toLocaleString()} color={color} />
      </div>

      <div style={{ fontSize: 10, color: AXIS_TEXT, lineHeight: 1.5 }}>
        95% CI [{point.ciLower.toFixed(3)}, {point.ciUpper.toFixed(3)}] ·{' '}
        {formatRelationship(point.type)} · lag {point.lag}
        {point.lag > 0 && (
          <span style={{ color: '#B45309' }}> · pooled lag ≥ 1, see note below</span>
        )}
      </div>
      {point.type !== 'linear' && (
        <div style={{ fontSize: 10, color: AXIS_TEXT, marginTop: 3 }}>
          Linear R² would be {point.r2Linear.toFixed(3)}
        </div>
      )}

      <button
        onClick={onOpen}
        disabled={!hasDrilldown}
        className="touch-target-44"
        style={{
          marginTop: 8,
          width: '100%',
          padding: '8px 10px',
          borderRadius: 6,
          border: `1px solid ${hasDrilldown ? color : '#e2e6ee'}`,
          background: hasDrilldown ? `${color}12` : '#f2f3f7',
          color: hasDrilldown ? color : '#a0a6b0',
          fontSize: 11,
          fontWeight: 600,
          cursor: hasDrilldown ? 'pointer' : 'not-allowed',
        }}
      >
        {hasDrilldown
          ? 'Predicted vs actual →'
          : 'No country-scope fits this year'}
      </button>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 9, color: AXIS_TEXT, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </div>
    </div>
  )
}

// ============================================
// Layer 2 - predicted vs actual
// ============================================

interface DrilldownViewProps {
  artifact: CredibilityArtifact
  finding: CredibilityFinding
  year: number
  onYearChange: (year: number) => void
  onBack: () => void
}

function DrilldownView({ artifact, finding, year, onYearChange, onBack }: DrilldownViewProps) {
  const [ref, width] = useMeasuredWidth()
  const [selected, setSelected] = useState<CredibilityScatterPoint | null>(null)

  const availableYears = useMemo(
    () => Object.keys(finding.drilldown).map(Number).sort((a, b) => a - b),
    [finding],
  )

  const points = useMemo(
    () => decodeScatter(finding.drilldown[String(year)], artifact.countries),
    [finding, year, artifact.countries],
  )

  const summary = useMemo(() => summariseScatter(points), [points])
  const color = colorFor(finding.id)

  const [scaleOverride, setScaleOverride] = useState<ScatterScale | null>(null)
  const suggested = useMemo(() => suggestScale(points), [points])
  const scale = scaleOverride ?? suggested
  const canUseLog = useMemo(
    () => points.every((p) => p.observed > 0 && p.predicted > 0),
    [points],
  )
  const offScale = useMemo(
    () =>
      scale === 'log'
        ? points.filter((p) => p.observed <= 0 || p.predicted <= 0).length
        : 0,
    [points, scale],
  )

  // A stale selection from the previous year would show numbers that no longer
  // belong to any plotted point.
  useEffect(() => setSelected(null), [year])

  const yearIndex = availableYears.indexOf(year)

  return (
    <div ref={ref}>
      <button
        onClick={onBack}
        className="touch-target-44"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          color: AXIS_TEXT,
          fontSize: 11,
          cursor: 'pointer',
          padding: '2px 0 8px',
        }}
      >
        ← Back to fit quality
      </button>

      <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>
        Predicted vs actual · {year}
      </div>
      <div style={{ fontSize: 11, color: AXIS_TEXT, lineHeight: 1.45, margin: '2px 0 8px' }}>
        {finding.id} · {finding.sourceLabel} → {finding.targetLabel}
      </div>

      <div
        style={{
          fontSize: 10,
          color: '#1E5F3F',
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: 6,
          padding: '6px 8px',
          lineHeight: 1.45,
          marginBottom: 10,
        }}
      >
        Country scope — every point is fitted on that country's own series, so the
        cross-country lag pairing that affects pooled graphs does not apply here.
      </div>

      {/* Year stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <StepButton
          label="◀"
          ariaLabel="Previous year"
          disabled={yearIndex <= 0}
          onClick={() => onYearChange(availableYears[yearIndex - 1])}
        />
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 600,
            color: '#333',
          }}
        >
          {year}
          <span style={{ color: AXIS_TEXT, fontWeight: 400 }}>
            {' '}· {points.length} countries
          </span>
        </div>
        <StepButton
          label="▶"
          ariaLabel="Next year"
          disabled={yearIndex < 0 || yearIndex >= availableYears.length - 1}
          onClick={() => onYearChange(availableYears[yearIndex + 1])}
        />
      </div>

      {points.length === 0 ? (
        <div style={{ fontSize: 11, color: AXIS_TEXT, padding: '16px 0' }}>
          No country clears the 10-observation minimum for this edge in {year}.
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 4,
              marginBottom: 2,
            }}
          >
            <span style={{ fontSize: 9, color: AXIS_TEXT, marginRight: 2 }}>Axes</span>
            {(['linear', 'log'] as const).map((option) => {
              const active = scale === option
              const disabled = option === 'log' && !canUseLog
              return (
                <button
                  key={option}
                  onClick={() => setScaleOverride(option)}
                  disabled={disabled}
                  title={
                    disabled
                      ? 'Log needs every value to be positive'
                      : `Show ${option} axes`
                  }
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    border: `1px solid ${active ? color : '#e2e6ee'}`,
                    background: active ? `${color}14` : 'white',
                    color: disabled ? '#c3c9d4' : active ? color : '#666',
                    fontSize: 9,
                    fontWeight: active ? 600 : 400,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {option === 'linear' ? 'Linear' : 'Log'}
                </button>
              )
            })}
          </div>

          <ScatterChart
            points={points}
            width={width}
            scale={scale}
            selected={selected}
            onSelect={setSelected}
          />

          {offScale > 0 && (
            <div style={{ fontSize: 9, color: '#B45309', marginTop: 2 }}>
              {offScale} {offScale === 1 ? 'country' : 'countries'} not shown on a log
              axis (value ≤ 0)
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 9,
              color: AXIS_TEXT,
              marginTop: 4,
            }}
          >
            <span>Country R²</span>
            <div
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: `linear-gradient(to right, ${r2Color(0)}, ${r2Color(0.5)}, ${r2Color(1)})`,
              }}
            />
            <span>0 → 1</span>
          </div>

          {summary && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 6,
                margin: '10px 0',
              }}
            >
              <MiniStat
                label="Med % err"
                value={
                  summary.medianAbsPctError === null
                    ? '—'
                    : `${summary.medianAbsPctError.toFixed(1)}%`
                }
                color={color}
              />
              <MiniStat
                label="Med |resid|"
                value={formatValue(summary.medianAbsResidual)}
                color={color}
              />
              <MiniStat
                label="R² ≥ .5"
                value={`${Math.round(summary.shareWellFit * 100)}%`}
                color={color}
              />
            </div>
          )}

          {selected ? (
            <SelectedPointCard point={selected} color={color} />
          ) : (
            <div style={{ fontSize: 10, color: AXIS_TEXT, textAlign: 'center', padding: '6px 0' }}>
              Tap a point for country detail
            </div>
          )}
        </>
      )}

      <DisclosureList
        disclosures={artifact.disclosures.filter((d) => d.id !== 'lag-pairing')}
      />
    </div>
  )
}

function StepButton({
  label,
  ariaLabel,
  disabled,
  onClick,
}: {
  label: string
  ariaLabel: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="touch-target-44"
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        border: '1px solid #e2e6ee',
        background: disabled ? '#f2f3f7' : 'white',
        color: disabled ? '#c3c9d4' : '#666',
        fontSize: 11,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  )
}

interface ScatterChartProps {
  points: CredibilityScatterPoint[]
  width: number
  scale: ScatterScale
  selected: CredibilityScatterPoint | null
  onSelect: (point: CredibilityScatterPoint | null) => void
}

function ScatterChart({ points, width, scale, selected, onSelect }: ScatterChartProps) {
  const margin = { top: 8, right: 10, bottom: 26, left: 44 }
  const innerW = Math.max(40, width - margin.left - margin.right)
  const innerH = SCATTER_HEIGHT - margin.top - margin.bottom

  // A log axis cannot place non-positive values; they are dropped from the plot
  // and counted for the caller rather than silently disappearing.
  const plotted = scale === 'log'
    ? points.filter((p) => p.observed > 0 && p.predicted > 0)
    : points

  // Shared domain on both axes so the 1:1 reference sits at exactly 45°.
  const lo = d3.min(plotted, (p) => Math.min(p.observed, p.predicted)) ?? 0
  const hi = d3.max(plotted, (p) => Math.max(p.observed, p.predicted)) ?? 1

  let domain: [number, number]
  if (scale === 'log') {
    domain = [lo > 0 ? lo * 0.7 : 1e-6, hi > 0 ? hi * 1.4 : 1]
  } else {
    const pad = Math.max((hi - lo) * 0.06, 1e-6)
    domain = [lo - pad, hi + pad]
  }

  const makeScale = () =>
    scale === 'log' ? d3.scaleLog().domain(domain) : d3.scaleLinear().domain(domain)

  const x = makeScale().range([0, innerW])
  const y = makeScale().range([innerH, 0])

  const nExtent = d3.extent(plotted, (p) => p.n) as [number, number]
  const radius = d3
    .scaleSqrt()
    .domain([nExtent[0] ?? 1, nExtent[1] ?? 1])
    .range([2.5, 6])

  return (
    <svg
      width={width}
      height={SCATTER_HEIGHT}
      role="img"
      aria-label="Predicted versus actual target value, one point per country"
      style={{ display: 'block', touchAction: 'pan-y' }}
    >
      <g transform={`translate(${margin.left},${margin.top})`}>
        <rect
          width={innerW}
          height={innerH}
          fill="transparent"
          onClick={() => onSelect(null)}
        />

        {x.ticks(4).map((tick) => (
          <g key={`x${tick}`}>
            <line x1={x(tick)} x2={x(tick)} y1={0} y2={innerH} stroke={GRID} strokeWidth={1} />
            <text x={x(tick)} y={innerH + 12} textAnchor="middle" fontSize={9} fill={AXIS_TEXT}>
              {formatValue(tick)}
            </text>
          </g>
        ))}
        {y.ticks(4).map((tick: number) => (
          <g key={`y${tick}`}>
            <line x1={0} x2={innerW} y1={y(tick)} y2={y(tick)} stroke={GRID} strokeWidth={1} />
            <text x={-6} y={y(tick)} dy="0.32em" textAnchor="end" fontSize={9} fill={AXIS_TEXT}>
              {formatValue(tick)}
            </text>
          </g>
        ))}

        {/* Perfect-prediction reference */}
        <line
          x1={x(domain[0])}
          y1={y(domain[0])}
          x2={x(domain[1])}
          y2={y(domain[1])}
          stroke="#9aa1ad"
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {plotted.map((p) => {
          const isSelected = selected?.country === p.country
          return (
            <circle
              key={p.country}
              cx={x(p.observed)}
              cy={y(p.predicted)}
              r={isSelected ? radius(p.n) + 3 : radius(p.n)}
              fill={r2Color(p.r2)}
              fillOpacity={isSelected ? 1 : 0.75}
              stroke={isSelected ? '#333' : 'white'}
              strokeWidth={isSelected ? 1.5 : 0.5}
              style={{ cursor: 'pointer' }}
              onClick={(event) => {
                event.stopPropagation()
                onSelect(isSelected ? null : p)
              }}
            >
              <title>{`${p.country} · observed ${formatValue(p.observed)} · predicted ${formatValue(p.predicted)}`}</title>
            </circle>
          )
        })}

        <text
          x={innerW / 2}
          y={innerH + 23}
          textAnchor="middle"
          fontSize={9}
          fill={AXIS_TEXT}
        >
          Observed →
        </text>
      </g>
      <text
        transform={`translate(10,${margin.top + innerH / 2}) rotate(-90)`}
        textAnchor="middle"
        fontSize={9}
        fill={AXIS_TEXT}
      >
        Predicted →
      </text>
    </svg>
  )
}

function SelectedPointCard({
  point,
  color,
}: {
  point: CredibilityScatterPoint
  color: string
}) {
  const pctError =
    Math.abs(point.observed) > 1e-9
      ? (point.residual / Math.abs(point.observed)) * 100
      : null

  return (
    <div
      style={{
        padding: 10,
        background: '#f8f9fc',
        border: '1px solid #e2e6ee',
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 6 }}>
        {point.country}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
        <MiniStat label="Observed" value={formatValue(point.observed)} color="#333" />
        <MiniStat label="Predicted" value={formatValue(point.predicted)} color={color} />
        <MiniStat
          label="Residual"
          value={`${point.residual > 0 ? '+' : ''}${formatValue(point.residual)}`}
          color={Math.abs(point.r2) >= 0.5 ? '#10B981' : '#F59E0B'}
        />
      </div>
      <div style={{ fontSize: 10, color: AXIS_TEXT, lineHeight: 1.5 }}>
        Own-series R² {point.r2.toFixed(3)} · {formatRelationship(point.type)} · lag{' '}
        {point.lag} · {point.n} obs
        {pctError !== null && ` · ${pctError > 0 ? '+' : ''}${pctError.toFixed(1)}% error`}
      </div>
    </div>
  )
}

// ============================================
// Disclosures
// ============================================

function DisclosureList({ disclosures }: { disclosures: CredibilityDisclosure[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (disclosures.length === 0) return null

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid #e2e6ee', paddingTop: 10 }}>
      <div
        style={{
          fontSize: 9,
          color: AXIS_TEXT,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        Known limitations
      </div>
      {disclosures.map((disclosure) => {
        const open = expanded === disclosure.id
        const warn = disclosure.severity === 'warning'
        return (
          <div key={disclosure.id} style={{ marginBottom: 4 }}>
            <button
              onClick={() => setExpanded(open ? null : disclosure.id)}
              aria-expanded={open}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                width: '100%',
                textAlign: 'left',
                padding: '6px 8px',
                borderRadius: 6,
                border: `1px solid ${warn ? '#FDE68A' : '#e2e6ee'}`,
                background: warn ? '#FFFBEB' : '#f8f9fc',
                cursor: 'pointer',
                fontSize: 10,
                color: warn ? '#92400E' : '#555',
                fontWeight: 600,
              }}
            >
              <span aria-hidden="true">{warn ? '⚠' : 'ℹ'}</span>
              <span style={{ flex: 1 }}>{disclosure.title}</span>
              <span style={{ color: AXIS_TEXT, fontWeight: 400 }}>{open ? '−' : '+'}</span>
            </button>
            {open && (
              <div
                style={{
                  fontSize: 10,
                  color: AXIS_TEXT,
                  lineHeight: 1.55,
                  padding: '6px 8px 2px',
                }}
              >
                {disclosure.body}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default CredibilityContent
