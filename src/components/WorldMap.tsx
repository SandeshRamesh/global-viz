/**
 * WorldMap — Choropleth background layer showing QOL score by country.
 *
 * Renders TopoJSON world geometry colored by QoL V1 (0-1 HDI-calibrated) values.
 * Sits behind the graph as a subtle background, toggleable to foreground via M key.
 *
 * Smooth transitions: pre-interpolates all iso3→year scores on data load so
 * timeline scrubbing never flickers.  Years outside the data range are filled
 * with the nearest available value.
 */

import { useEffect, useRef, useMemo, useCallback } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { QolScoresByCountry, IncomeStratum, AllClassifications } from '../services/api'

/**
 * ISO 3166-1 numeric → ISO 3166-1 alpha-3 mapping.
 * The world-110m.json uses numeric IDs; our QOL data uses alpha-3 (iso3).
 */
const NUMERIC_TO_ISO3: Record<string, string> = {
  '4': 'AFG', '8': 'ALB', '12': 'DZA', '24': 'AGO', '32': 'ARG',
  '36': 'AUS', '40': 'AUT', '50': 'BGD', '56': 'BEL', '204': 'BEN',
  '64': 'BTN', '68': 'BOL', '70': 'BIH', '72': 'BWA', '76': 'BRA',
  '96': 'BRN', '100': 'BGR', '854': 'BFA', '108': 'BDI', '116': 'KHM',
  '120': 'CMR', '124': 'CAN', '140': 'CAF', '148': 'TCD', '152': 'CHL',
  '156': 'CHN', '170': 'COL', '178': 'COG', '180': 'COD', '188': 'CRI',
  '384': 'CIV', '191': 'HRV', '192': 'CUB', '196': 'CYP', '203': 'CZE',
  '208': 'DNK', '262': 'DJI', '214': 'DOM', '218': 'ECU', '818': 'EGY',
  '222': 'SLV', '226': 'GNQ', '232': 'ERI', '233': 'EST', '231': 'ETH',
  '242': 'FJI', '246': 'FIN', '250': 'FRA', '266': 'GAB', '270': 'GMB',
  '268': 'GEO', '276': 'DEU', '288': 'GHA', '300': 'GRC', '320': 'GTM',
  '324': 'GIN', '624': 'GNB', '328': 'GUY', '332': 'HTI', '340': 'HND',
  '348': 'HUN', '352': 'ISL', '356': 'IND', '360': 'IDN', '364': 'IRN',
  '368': 'IRQ', '372': 'IRL', '376': 'ISR', '380': 'ITA', '388': 'JAM',
  '392': 'JPN', '400': 'JOR', '398': 'KAZ', '404': 'KEN', '408': 'PRK',
  '410': 'KOR', '414': 'KWT', '417': 'KGZ', '418': 'LAO', '428': 'LVA',
  '422': 'LBN', '426': 'LSO', '430': 'LBR', '434': 'LBY', '440': 'LTU',
  '442': 'LUX', '807': 'MKD', '450': 'MDG', '454': 'MWI', '458': 'MYS',
  '466': 'MLI', '478': 'MRT', '484': 'MEX', '496': 'MNG', '499': 'MNE',
  '504': 'MAR', '508': 'MOZ', '104': 'MMR', '516': 'NAM', '524': 'NPL',
  '528': 'NLD', '554': 'NZL', '558': 'NIC', '562': 'NER', '566': 'NGA',
  '578': 'NOR', '512': 'OMN', '586': 'PAK', '591': 'PAN', '598': 'PNG',
  '600': 'PRY', '604': 'PER', '608': 'PHL', '616': 'POL', '620': 'PRT',
  '634': 'QAT', '642': 'ROU', '643': 'RUS', '646': 'RWA', '682': 'SAU',
  '686': 'SEN', '688': 'SRB', '694': 'SLE', '702': 'SGP', '703': 'SVK',
  '705': 'SVN', '706': 'SOM', '710': 'ZAF', '724': 'ESP', '144': 'LKA',
  '729': 'SDN', '740': 'SUR', '748': 'SWZ', '752': 'SWE', '756': 'CHE',
  '760': 'SYR', '158': 'TWN', '762': 'TJK', '834': 'TZA', '764': 'THA',
  '626': 'TLS', '768': 'TGO', '780': 'TTO', '788': 'TUN', '792': 'TUR',
  '795': 'TKM', '800': 'UGA', '804': 'UKR', '784': 'ARE', '826': 'GBR',
  '840': 'USA', '858': 'URY', '860': 'UZB', '862': 'VEN', '704': 'VNM',
  '887': 'YEM', '894': 'ZMB', '716': 'ZWE', '10': 'ATA',
  '304': 'GRL', '630': 'PRI', '275': 'PSE', '732': 'ESH',
  '90': 'SLB', '548': 'VUT', '174': 'COM', '480': 'MUS',
  '728': 'SSD', '-99': 'XKX',
  '44': 'BHS', '84': 'BLZ', '51': 'ARM', '112': 'BLR',
  '498': 'MDA', '31': 'AZE', '238': 'FLK', '260': 'ATF', '540': 'NCL'
}

/** Full year range we support for timeline playback. */
const YEAR_MIN = 1990
const YEAR_MAX = 2030

/** Normalize TopoJSON feature id (may be zero-padded string like "004" or number) */
function normalizeId(id: string | number | undefined): string {
  if (id == null) return ''
  const n = Number(id)
  return isNaN(n) ? String(id) : String(n)
}

interface WorldMapProps {
  foreground: boolean
  qolScores: Record<string, QolScoresByCountry> | null
  currentYear: number
  selectedStratum: IncomeStratum | 'unified'
  classificationsCache: AllClassifications | null
  simAdjustments?: Record<string, number>
  onCountrySelect?: (name: string) => void
  onCountryHover?: (name: string | null) => void
  selectedCountryIso3?: string | null
}

/**
 * Build Set<iso3> of countries belonging to the selected stratum.
 * Returns null when stratum is 'unified' (show all).
 *
 * Uses a stable membership rule: a country is included if it belongs to
 * the stratum in ANY year.  This prevents countries from flickering on/off
 * the map as their classification shifts between years during timeline playback.
 */
function buildStratumIso3s(
  classifications: AllClassifications | null,
  stratum: IncomeStratum | 'unified',
): Set<string> | null {
  if (stratum === 'unified' || !classifications) return null
  const allowed = new Set<string>()
  const targetLabel = stratum.charAt(0).toUpperCase() + stratum.slice(1)
  for (const [, countryData] of Object.entries(classifications.classifications)) {
    const iso3 = countryData.iso3
    if (!iso3) continue
    const byYear = countryData.by_year as Record<string, { classification_3tier?: string }>
    for (const yearInfo of Object.values(byYear)) {
      if (yearInfo?.classification_3tier === targetLabel) {
        allowed.add(iso3)
        break // found at least one year — include this country
      }
    }
  }
  return allowed
}

/**
 * Pre-interpolate QoL scores for every iso3 across the full year range.
 *
 * For each country:
 *   - Known year values are kept as-is
 *   - Years between two known values are linearly interpolated
 *   - Years before the earliest known value use the earliest value (hold)
 *   - Years after the latest known value use the latest value (hold)
 *
 * Returns Map<iso3, Map<year, score>> covering YEAR_MIN..YEAR_MAX.
 */
function buildInterpolatedScores(
  scores: Record<string, QolScoresByCountry>
): Map<string, Map<number, number>> {
  const result = new Map<string, Map<number, number>>()

  for (const [, data] of Object.entries(scores)) {
    const iso3 = data.iso3
    if (!iso3) continue

    // Collect known (year, value) pairs sorted by year
    const known: Array<[number, number]> = []
    for (const [yStr, val] of Object.entries(data.by_year)) {
      if (val != null) known.push([Number(yStr), val])
    }
    if (known.length === 0) continue
    known.sort((a, b) => a[0] - b[0])

    const yearMap = new Map<number, number>()
    const firstYear = known[0][0]
    const firstVal = known[0][1]
    const lastYear = known[known.length - 1][0]
    const lastVal = known[known.length - 1][1]

    let ki = 0 // index into known[]
    for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
      if (y <= firstYear) {
        // Before or at first data point — hold first value
        yearMap.set(y, firstVal)
      } else if (y >= lastYear) {
        // At or after last data point — hold last value
        yearMap.set(y, lastVal)
      } else {
        // Advance ki so known[ki] <= y < known[ki+1]
        while (ki < known.length - 2 && known[ki + 1][0] <= y) ki++
        const [y0, v0] = known[ki]
        const [y1, v1] = known[ki + 1]
        if (y1 === y0) {
          yearMap.set(y, v0)
        } else {
          const t = (y - y0) / (y1 - y0)
          yearMap.set(y, v0 + t * (v1 - v0))
        }
      }
    }

    result.set(iso3, yearMap)
  }

  return result
}

/**
 * Build iso3→score map for a given year from pre-interpolated data,
 * with optional stratum filtering and simulation adjustments.
 */
function buildYearMapFromInterpolated(
  interpolated: Map<string, Map<number, number>>,
  year: number,
  stratumIso3s: Set<string> | null,
  simAdjustments?: Record<string, number>
): Map<string, number> {
  const map = new Map<string, number>()
  for (const [iso3, yearScores] of interpolated) {
    if (stratumIso3s && !stratumIso3s.has(iso3)) continue
    const value = yearScores.get(year)
    if (value != null) {
      const adj = simAdjustments?.[iso3] ?? 0
      const adjusted = value + adj
      map.set(iso3, Math.max(0, Math.min(1, adjusted)))
    }
  }
  return map
}

/** Transition duration for fill color changes (ms). */
const COLOR_TRANSITION_MS = 400

export function WorldMap({ foreground, qolScores, currentYear, selectedStratum, classificationsCache, simAdjustments, onCountrySelect, onCountryHover, selectedCountryIso3 }: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const topoRef = useRef<Topology | null>(null)
  const projectionRef = useRef<d3.GeoProjection | null>(null)
  const pathGenRef = useRef<d3.GeoPath | null>(null)
  const featuresRef = useRef<GeoJSON.Feature[]>([])
  const initializedRef = useRef(false)
  const prevYearRef = useRef<number | null>(null)

  // Stable refs for callbacks (avoid re-bindining D3 event handlers on every render)
  const onCountrySelectRef = useRef(onCountrySelect)
  onCountrySelectRef.current = onCountrySelect
  const onCountryHoverRef = useRef(onCountryHover)
  onCountryHoverRef.current = onCountryHover
  const foregroundRef = useRef(foreground)
  foregroundRef.current = foreground
  const selectedCountryIso3Ref = useRef(selectedCountryIso3)
  selectedCountryIso3Ref.current = selectedCountryIso3

  // Build iso3→country name reverse map from qolScores
  const iso3ToName = useMemo(() => {
    const map = new Map<string, string>()
    if (!qolScores) return map
    for (const [countryKey, data] of Object.entries(qolScores)) {
      if (data.iso3) map.set(data.iso3, countryKey)
    }
    return map
  }, [qolScores])

  // Color scale: QoL V1 (HDI-calibrated) — green for high, red for low
  const colorScale = useMemo(
    () => d3.scaleSequential(d3.interpolateRdYlGn).domain([0.3, 0.95]),
    []
  )

  // Pre-interpolate all scores once when data loads (O(countries * years), ~7k entries)
  const interpolated = useMemo(
    () => qolScores ? buildInterpolatedScores(qolScores) : new Map<string, Map<number, number>>(),
    [qolScores]
  )

  // Build stratum filter (null = show all) — stable across all years
  const stratumIso3s = useMemo(
    () => buildStratumIso3s(classificationsCache, selectedStratum),
    [classificationsCache, selectedStratum]
  )

  // Build iso3→value map for current year from interpolated data
  const yearMap = useMemo(
    () => buildYearMapFromInterpolated(interpolated, currentYear, stratumIso3s, simAdjustments),
    [interpolated, currentYear, stratumIso3s, simAdjustments]
  )

  /** Resolve fill color for a TopoJSON feature. */
  const fillColor = useCallback((d: GeoJSON.Feature): string => {
    const numId = normalizeId(d.id)
    const iso3 = NUMERIC_TO_ISO3[numId]
    if (!iso3) return '#1a1a2e'
    const val = yearMap.get(iso3)
    return val != null ? colorScale(val) : '#1a1a2e'
  }, [yearMap, colorScale])

  /** Apply per-path opacity + selection outline to all paths.
   *  Uses refs so it always reads current state — safe to call from anywhere. */
  const applySelectionStyle = useCallback(() => {
    const svg = svgRef.current
    if (!svg || !initializedRef.current) return
    const sel = selectedCountryIso3Ref.current
    const hasSelection = !!sel
    const isFg = foregroundRef.current

    d3.select(svg).selectAll<SVGPathElement, GeoJSON.Feature>('path')
      .each(function (d) {
        const numId = normalizeId(d.id)
        const iso3 = NUMERIC_TO_ISO3[numId]
        const isSelected = iso3 && iso3 === sel
        const el = d3.select(this)

        let pathOpacity: number
        if (isFg) {
          pathOpacity = hasSelection ? (isSelected ? 1 : 0.3) : 1
        } else {
          pathOpacity = hasSelection ? (isSelected ? 0.45 : 0.03) : 0.07
        }

        el.attr('stroke', isSelected ? '#00E5FF' : '#555')
          .attr('stroke-width', isSelected ? 2 : 0.3)
          .style('opacity', pathOpacity)
          // In background, boost selected country to counteract container desaturation
          .style('filter', (!isFg && isSelected) ? 'saturate(7) brightness(1.15)' : 'none')

        if (isSelected) el.raise()
      })
  }, [])

  // Load TopoJSON once
  useEffect(() => {
    if (topoRef.current) return
    fetch(`${import.meta.env.BASE_URL}data/world-110m.json`)
      .then(res => res.json())
      .then((topo: Topology) => {
        topoRef.current = topo
        const geom = topo.objects.countries as GeometryCollection
        featuresRef.current = (topojson.feature(topo, geom) as GeoJSON.FeatureCollection).features
        renderMap()
      })
      .catch(err => console.warn('Failed to load world map:', err))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderMap = useCallback(() => {
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container || featuresRef.current.length === 0) return

    const { width, height } = container.getBoundingClientRect()
    if (width === 0 || height === 0) return

    svg.setAttribute('width', String(width))
    svg.setAttribute('height', String(height))

    const projection = d3.geoNaturalEarth1()
      .fitSize([width, height], { type: 'FeatureCollection', features: featuresRef.current })
    projectionRef.current = projection

    const pathGen = d3.geoPath().projection(projection)
    pathGenRef.current = pathGen

    const sel = d3.select(svg)
    sel.selectAll('path').remove()

    sel.selectAll('path')
      .data(featuresRef.current)
      .enter()
      .append('path')
      .attr('d', d => pathGen(d) || '')
      .attr('fill', fillColor)
      .attr('stroke', '#555')
      .attr('stroke-width', 0.3)
      .style('cursor', 'pointer')
      .on('mouseover', function (_event: MouseEvent, d: GeoJSON.Feature) {
        if (!foregroundRef.current) return
        const numId = normalizeId(d.id)
        const iso3 = NUMERIC_TO_ISO3[numId]
        if (!iso3) return
        const name = iso3ToName.get(iso3)
        if (name) onCountryHoverRef.current?.(name)
        d3.select(this).attr('stroke', '#fff').attr('stroke-width', 1.5).raise()
      })
      .on('mouseout', function (_event: MouseEvent, d: GeoJSON.Feature) {
        if (!foregroundRef.current) return
        onCountryHoverRef.current?.(null)
        const numId = normalizeId(d.id)
        const iso3 = NUMERIC_TO_ISO3[numId]
        const isSelected = iso3 && iso3 === selectedCountryIso3Ref.current
        d3.select(this)
          .attr('stroke', isSelected ? '#00E5FF' : '#555')
          .attr('stroke-width', isSelected ? 2 : 0.3)
      })
      .on('click', function (_event: MouseEvent, d: GeoJSON.Feature) {
        if (!foregroundRef.current) return
        const numId = normalizeId(d.id)
        const iso3 = NUMERIC_TO_ISO3[numId]
        if (!iso3) return
        const name = iso3ToName.get(iso3)
        if (name) onCountrySelectRef.current?.(name)
      })

    initializedRef.current = true
    applySelectionStyle()
  }, [fillColor, iso3ToName, applySelectionStyle])

  // Render on mount and resize
  useEffect(() => {
    renderMap()

    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver(() => renderMap())
    ro.observe(container)
    return () => ro.disconnect()
  }, [renderMap])

  // Re-apply selection style when selection or foreground changes
  useEffect(() => {
    applySelectionStyle()
  }, [selectedCountryIso3, foreground, applySelectionStyle])

  // Smooth color transition when year/sim data changes
  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !initializedRef.current) return

    const isFirstPaint = prevYearRef.current === null
    prevYearRef.current = currentYear

    const paths = d3.select(svg).selectAll<SVGPathElement, GeoJSON.Feature>('path')

    if (isFirstPaint) {
      // No transition on initial paint
      paths.attr('fill', fillColor)
    } else {
      // Smooth color transition during timeline scrubbing
      paths
        .transition()
        .duration(COLOR_TRANSITION_MS)
        .attr('fill', fillColor)
    }
  }, [fillColor, currentYear])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: foreground ? 50 : 0,
        pointerEvents: foreground ? 'auto' : 'none',
        opacity: 1,
        filter: foreground ? 'none' : 'saturate(0.15) brightness(0.9)',
        transition: 'filter 0.3s ease'
      }}
    >
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default WorldMap
