import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { aggregateChildEdges } from '../causalEdges'

const raw = JSON.parse(readFileSync('public/data/v2_1_visualization_final.json', 'utf8'))
const nodeById = new Map<string, any>(raw.nodes.map((n: any) => [String(n.id), n]))

describe('global highlight aggregation', () => {
  it('yields cause/effect neighbours for a layer-2 domain', () => {
    const target = 'coarse_16' // "Wealth Distribution & Economic Freedom"
    const { inputEdges, outputEdges } = aggregateChildEdges([target], raw.edges, nodeById, 0.5)
    const causes = new Set([...inputEdges.values()].map(v => String(v.edge.source)).filter(id => id !== target))
    const effects = new Set([...outputEdges.values()].map(v => String(v.edge.target)).filter(id => id !== target))
    const layerOf = (id: string) => nodeById.get(id)?.layer
    console.log(`  target: ${nodeById.get(target).label}`)
    console.log(`  causes  (orange): ${causes.size}  layers=${[...new Set([...causes].map(layerOf))]}`)
    console.log(`  effects (purple): ${effects.size}  layers=${[...new Set([...effects].map(layerOf))]}`)
    console.log(`  sample causes : ${[...causes].slice(0,3).map(id => nodeById.get(id)?.label).join(' | ')}`)
    console.log(`  sample effects: ${[...effects].slice(0,3).map(id => nodeById.get(id)?.label).join(' | ')}`)
    expect(causes.size + effects.size).toBeGreaterThan(0)
    for (const id of [...causes, ...effects]) expect(layerOf(id)).toBe(2)
  })
})
