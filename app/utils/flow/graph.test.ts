import { describe, expect, it } from 'vitest'
import { lineageOf, neighbourIn, stageGroups, stagesOf } from './graph'

// The grading workflow: a dataset read by two agents, whose notes are aggregated into results
const ids = ['data', 'content', 'language', 'aggregate', 'results']
const edges = [
  { from: 'data', to: 'content' },
  { from: 'data', to: 'language' },
  { from: 'content', to: 'aggregate' },
  { from: 'language', to: 'aggregate' },
  { from: 'aggregate', to: 'results' },
]

describe('stagesOf', () => {
  it('runs a node after the longest path that feeds it', () => {
    const stage = stagesOf(ids, [...edges, { from: 'data', to: 'aggregate' }])
    expect(Object.fromEntries(stage)).toEqual({ data: 0, content: 1, language: 1, aggregate: 2, results: 3 })
  })

  it('survives a cycle', () => {
    const stage = stagesOf(['a', 'b'], [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }])
    expect(stage.size).toBe(2)
  })
})

describe('stageGroups', () => {
  it('groups parallel nodes', () => {
    expect(stageGroups(ids, edges)).toEqual([['data'], ['content', 'language'], ['aggregate'], ['results']])
  })
})

describe('lineageOf', () => {
  it('follows a branch up and down, not its sibling', () => {
    const { nodes, edges: through } = lineageOf('content', edges)
    expect([...nodes].sort()).toEqual(['aggregate', 'content', 'data', 'results'])
    expect(through.has('data->language')).toBe(false)
    expect(through.has('aggregate->results')).toBe(true)
  })
})

describe('neighbourIn', () => {
  const centres = new Map([
    ['data', { x: 0, y: 100 }],
    ['content', { x: 300, y: 0 }],
    ['language', { x: 300, y: 200 }],
    ['aggregate', { x: 600, y: 100 }],
  ])

  it('moves along rows and columns', () => {
    expect(neighbourIn('down', 'content', centres)).toBe('language')
    expect(neighbourIn('up', 'language', centres)).toBe('content')
    expect(neighbourIn('right', 'content', centres)).toBe('aggregate')
  })

  it('stays put at an edge of the graph', () => {
    expect(neighbourIn('left', 'data', centres)).toBeNull()
  })
})
