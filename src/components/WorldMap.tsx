/**
 * WorldMap — Choropleth background layer showing QOL score by country.
 *
 * Renders TopoJSON world geometry colored by QoL V1 (0-1 HDI-calibrated) values.
 * Sits behind the graph as a subtle background, toggleable to foreground via M key.
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
}

/**
 * Build Set<iso3> of countries belonging to the selected stratum for a given year.
 * Returns null when stratum is 'unified' (show all).
 */
function buildStratumIso3s(
  classifications: AllClassifications | null,
  stratum: IncomeStratum | 'unified',
  year: number
): Set<string> | null {
  if (stratum === 'unified' || !classifications) return null
  const allowed = new Set<string>()
  const yearStr = String(year)
  // The classification_3tier values are "Developing", "Emerging", "Advanced"
  const targetLabel = stratum.charAt(0).toUpperCase() + stratum.slice(1) // e.g. "developing" → "Developing"
  for (const [, countryData] of Object.entries(classifications.classifications)) {
    const iso3 = countryData.iso3
    if (!iso3) continue
    const yearInfo = countryData.by_year?.[yearStr]
    if (yearInfo?.classification_3tier === targetLabel) {
      allowed.add(iso3)
    }
  }
  return allowed
}

/** Build a Map<iso3, QoL score> for the given year from the scores data. */
function buildYearMap(
  scores: Record<string, QolScoresByCountry>,
  year: number,
  stratumIso3s: Set<string> | null,
  simAdjustments?: Record<string, number>
): Map<string, number> {
  const map = new Map<string, number>()
  const yearStr = String(year)
  for (const [, data] of Object.entries(scores)) {
    // If filtering by stratum, skip countries not in the stratum
    if (stratumIso3s && !stratumIso3s.has(data.iso3)) continue
    const value = data.by_year[yearStr]
    if (value != null) {
      const adj = simAdjustments?.[data.iso3] ?? 0
      const adjusted = value + adj
      map.set(data.iso3, Math.max(0, Math.min(1, adjusted)))
    }
  }
  return map
}

export function WorldMap({ foreground, qolScores, currentYear, selectedStratum, classificationsCache, simAdjustments }: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const topoRef = useRef<Topology | null>(null)
  const projectionRef = useRef<d3.GeoProjection | null>(null)
  const pathGenRef = useRef<d3.GeoPath | null>(null)
  const featuresRef = useRef<GeoJSON.Feature[]>([])
  const initializedRef = useRef(false)

  // Color scale: QoL V1 0-1 (HDI-calibrated) → green for high, red for low
  const colorScale = useMemo(
    () => d3.scaleSequential(d3.interpolateRdYlGn).domain([0, 1]),
    []
  )

  // Build stratum filter (null = show all)
  const stratumIso3s = useMemo(
    () => buildStratumIso3s(classificationsCache, selectedStratum, currentYear),
    [classificationsCache, selectedStratum, currentYear]
  )

  // Build iso3→value map for current year, filtered by stratum
  const yearMap = useMemo(
    () => qolScores ? buildYearMap(qolScores, currentYear, stratumIso3s, simAdjustments) : new Map<string, number>(),
    [qolScores, currentYear, stratumIso3s, simAdjustments]
  )

  // Load TopoJSON once
  useEffect(() => {
    if (topoRef.current) return
    fetch(`${import.meta.env.BASE_URL}data/world-110m.json`)
      .then(res => res.json())
      .then((topo: Topology) => {
        topoRef.current = topo
        const geom = topo.objects.countries as GeometryCollection
        featuresRef.current = (topojson.feature(topo, geom) as GeoJSON.FeatureCollection).features
        // Trigger initial render
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
      .attr('fill', d => {
        const numId = normalizeId(d.id)
        const iso3 = NUMERIC_TO_ISO3[numId]
        if (!iso3) return '#1a1a2e'
        const val = yearMap.get(iso3)
        return val != null ? colorScale(val) : '#1a1a2e'
      })
      .attr('stroke', '#555')
      .attr('stroke-width', 0.3)

    initializedRef.current = true
  }, [yearMap, colorScale])

  // Render on mount and resize
  useEffect(() => {
    renderMap()

    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver(() => renderMap())
    ro.observe(container)
    return () => ro.disconnect()
  }, [renderMap])

  // Update fill colors when year/sim data changes (fast path: just update fill, no re-render)
  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !initializedRef.current) return

    d3.select(svg).selectAll<SVGPathElement, GeoJSON.Feature>('path')
      .attr('fill', d => {
        const numId = normalizeId(d.id)
        const iso3 = NUMERIC_TO_ISO3[numId]
        if (!iso3) return '#1a1a2e'
        const val = yearMap.get(iso3)
        return val != null ? colorScale(val) : '#1a1a2e'
      })
  }, [yearMap, colorScale])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: foreground ? 1.0 : 0.07,
        filter: foreground ? 'none' : 'saturate(0.15) brightness(0.9)',
        transition: 'opacity 0.3s ease, filter 0.3s ease'
      }}
    >
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default WorldMap
