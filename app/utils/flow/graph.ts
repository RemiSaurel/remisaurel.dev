// Reading a workflow as a graph: which stage a node runs in, what it depends on and what depends on it.
// Pure functions only, so they can be tested without a browser.

import type { FlowEdgeSpec, FlowPoint } from './types'
import { edgeId } from './types'

/**
 * Stage of each node: the longest path from a source, so a node runs once everything it reads from
 * has run. Sources are stage 0. A cycle (which a workflow should not have) is cut where it closes.
 */
export function stagesOf(ids: readonly string[], edges: readonly FlowEdgeSpec[]): Map<string, number> {
  const stage = new Map<string, number>()
  const visiting = new Set<string>()
  const of = (id: string): number => {
    const known = stage.get(id)
    if (known !== undefined)
      return known
    if (visiting.has(id))
      return 0
    visiting.add(id)
    const parents = edges.filter(e => e.to === id && ids.includes(e.from))
    const value = parents.length ? Math.max(...parents.map(e => of(e.from))) + 1 : 0
    visiting.delete(id)
    stage.set(id, value)
    return value
  }
  ids.forEach(of)
  return stage
}

/** Node ids grouped by stage, in running order */
export function stageGroups(ids: readonly string[], edges: readonly FlowEdgeSpec[]): string[][] {
  const stage = stagesOf(ids, edges)
  const groups: string[][] = []
  for (const id of ids)
    (groups[stage.get(id)!] ??= []).push(id)
  return groups.filter(Boolean)
}

/** Everything upstream and downstream of `id`, itself included: what lights up when it is hovered */
export function lineageOf(id: string, edges: readonly FlowEdgeSpec[]): { nodes: Set<string>, edges: Set<string> } {
  const nodes = new Set([id])
  const through = new Set<string>()
  const walk = (from: string, forward: boolean) => {
    for (const edge of edges) {
      const [here, next] = forward ? [edge.from, edge.to] : [edge.to, edge.from]
      if (here !== from || through.has(edgeId(edge)))
        continue
      through.add(edgeId(edge))
      nodes.add(next)
      walk(next, forward)
    }
  }
  walk(id, true)
  walk(id, false)
  return { nodes, edges: through }
}

export type FlowDirection = 'left' | 'right' | 'up' | 'down'

/**
 * The node an arrow key moves to: the closest one whose centre lies in that direction, within a 45°
 * cone either side. Distance across the cone counts double, so the key follows rows and columns.
 */
export function neighbourIn(direction: FlowDirection, from: string, centres: ReadonlyMap<string, FlowPoint>): string | null {
  const origin = centres.get(from)
  if (!origin)
    return null
  let best: string | null = null
  let bestScore = Infinity
  for (const [id, at] of centres) {
    if (id === from)
      continue
    const dx = at.x - origin.x
    const dy = at.y - origin.y
    const [along, across] = direction === 'left'
      ? [-dx, dy]
      : direction === 'right'
        ? [dx, dy]
        : direction === 'up' ? [-dy, dx] : [dy, dx]
    if (along <= 0 || Math.abs(across) > along)
      continue
    const score = along + Math.abs(across) * 2
    if (score < bestScore) {
      bestScore = score
      best = id
    }
  }
  return best
}
