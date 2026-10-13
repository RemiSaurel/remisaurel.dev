/**
 * The illustration of each OG image, drawn with the same layers as the site's publications.
 * Pages get a fixed composition; a post gets one derived from its slug, so every post has its own
 * picture and the same post always gets the same one.
 */

import type { ArtComposition } from '../../../app/art/art'
import { createLayer } from '../../../app/art/art'

/** `seed` varies what a layer scatters; `turn` (degrees) rotates the whole picture a little. */
type CompositionName = 'signal' | 'agents' | 'rays' | 'matrix' | 'decay' | 'retention' | 'lines' | 'rings'

const LINE_PROFILES = ['peak', 'wave', 'rise', 'fall']

const BUILDERS: Record<CompositionName, (seed: number, turn: number) => ArtComposition> = {
  signal: () => ({
    grid: true,
    layers: [
      createLayer({ type: 'wave', params: { echoes: 12, echoGap: 5, amplitude: 24, frequency: 1.5, phaseShift: 0.04 } }),
      createLayer({ type: 'dots', name: 'Field', opacity: 0.5, params: { cols: 36, rows: 16, gap: 11, size: 0.8, falloff: 'none' } }),
    ],
  }),
  agents: seed => ({
    grid: true,
    layers: [createLayer({ type: 'orbits', seed })],
  }),
  rays: (seed, turn) => ({
    grid: true,
    layers: [
      createLayer({ type: 'rays', seed, rotation: turn, params: { count: 72, inner: 26, outer: 92, profile: 'random', tips: true } }),
      createLayer({ type: 'rings', opacity: 0.4, params: { count: 3, inner: 12, outer: 24, alternate: true } }),
    ],
  }),
  matrix: () => ({
    grid: true,
    layers: [
      createLayer({ type: 'dots', params: { cols: 22, rows: 11, gap: 14, size: 3.4, falloff: 'radial', threshold: 0.12 } }),
      createLayer({ type: 'rings', opacity: 0.5, params: { count: 5, inner: 20, outer: 100, arc: 180, fade: true } }),
    ],
  }),
  decay: seed => ({
    grid: true,
    layers: [
      createLayer({ type: 'wave', seed, params: { form: 'decay', echoes: 8, echoGap: 6, amplitude: 52, frequency: 3, phaseShift: 0.05, width: 300 } }),
      createLayer({ type: 'shape', name: 'Baseline', opacity: 0.3, params: { form: 'line', size: 340, dashed: true } }),
    ],
  }),
  retention: seed => ({
    grid: true,
    layers: [
      createLayer({ type: 'retention', seed }),
      createLayer({ type: 'shape', name: 'Baseline', opacity: 0.2, params: { form: 'line', size: 320, dashed: true } }),
    ],
  }),
  lines: seed => ({
    grid: true,
    layers: [
      createLayer({ type: 'lines', seed, params: { count: 56, width: 320, length: 130, profile: LINE_PROFILES[seed % LINE_PROFILES.length]!, fade: true } }),
      createLayer({ type: 'dots', y: 168, opacity: 0.5, params: { cols: 32, rows: 1, gap: 10, size: 0.9, falloff: 'none' } }),
    ],
  }),
  rings: () => ({
    grid: true,
    layers: [
      createLayer({ type: 'rings', params: { count: 9, inner: 14, outer: 96, spacing: 'exponential', alternate: true } }),
      createLayer({ type: 'shape', params: { form: 'cross', size: 220 }, opacity: 0.25 }),
    ],
  }),
}

const PAGE_COMPOSITIONS: Record<string, CompositionName> = {
  '/': 'signal',
  '/research': 'agents',
  '/posts': 'lines',
  '/projects': 'matrix',
  '/failures': 'decay',
  '/lab': 'rings',
}

const POST_COMPOSITIONS: CompositionName[] = ['retention', 'agents', 'signal', 'lines', 'rays', 'matrix']

/** FNV-1a: a stable 32-bit number for a string. */
function hash(value: string) {
  let h = 0x811C9DC5
  for (let i = 0; i < value.length; i++)
    h = Math.imul(h ^ value.charCodeAt(i), 0x01000193)
  return h >>> 0
}

export function pageComposition(path: string): ArtComposition {
  return BUILDERS[PAGE_COMPOSITIONS[path] ?? 'signal'](7, 0)
}

export function postComposition(slug: string): ArtComposition {
  const h = hash(slug)
  // Different bits for each choice, so two posts rarely share both the layout and its variation
  return BUILDERS[POST_COMPOSITIONS[(h >>> 7) % POST_COMPOSITIONS.length]!](h % 997 + 1, (h >>> 17) % 360)
}
