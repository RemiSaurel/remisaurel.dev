/**
 * Generative illustrations: a composition is a stack of layers drawn on a shared 2:1 frame.
 * The frame and grid are fixed, strokes stay within a small range of screen widths, and colors
 * come from a curated palette (that is what keeps every image coherent);
 * everything a layer draws is a pure function of its params, so a composition copied from
 * /lab always renders the same picture, including under `nuxt generate`.
 */

import { isHex, normalizeHex } from './color'
import { GLOW_LAYER } from './glow'

export const ART_WIDTH = 400
export const ART_HEIGHT = 200
export const GRID_STEP = 20

export const ART_PALETTES = {
  light: { bg: '#f5f5f5', ink: '#171717' },
  dark: { bg: '#0a0a0a', ink: '#fafafa' },
} as const

export type ArtTheme = keyof typeof ART_PALETTES

/** Stroke widths in screen pixels, identical at every rendered size. */
export const ART_STROKE = { default: 1, min: 0.25, max: 4, step: 0.25 } as const

export function isArtStroke(value: unknown): value is number {
  return typeof value === 'number' && value >= ART_STROKE.min && value <= ART_STROKE.max
}

/**
 * Stroke colors a node can pick. Each one has a variant per theme, tuned to sit at the same
 * visual weight on its background, so a colored illustration still ships on both site themes.
 */
export const ART_COLORS = {
  ink: { label: 'Ink', light: ART_PALETTES.light.ink, dark: ART_PALETTES.dark.ink },
  graphite: { label: 'Graphite', light: '#737373', dark: '#a3a3a3' },
  red: { label: 'Red', light: '#dc2626', dark: '#f87171' },
  orange: { label: 'Orange', light: '#ea580c', dark: '#fb923c' },
  amber: { label: 'Amber', light: '#ca8a04', dark: '#facc15' },
  green: { label: 'Green', light: '#16a34a', dark: '#4ade80' },
  cyan: { label: 'Cyan', light: '#0891b2', dark: '#22d3ee' },
  blue: { label: 'Blue', light: '#2563eb', dark: '#60a5fa' },
  violet: { label: 'Violet', light: '#7c3aed', dark: '#a78bfa' },
  pink: { label: 'Pink', light: '#db2777', dark: '#f472b6' },
} as const

export type ArtColor = keyof typeof ART_COLORS

export const ART_COLOR_ORDER = Object.keys(ART_COLORS) as ArtColor[]

export function isArtColor(value: unknown): value is ArtColor {
  return typeof value === 'string' && value in ART_COLORS
}

/** A color picked by hand: one hex per theme, like the palette's own pairs. */
export interface ArtCustomColor {
  light: string
  dark: string
}

export type ArtNodeColor = ArtColor | ArtCustomColor

export function isCustomColor(value: unknown): value is ArtCustomColor {
  return !!value && typeof value === 'object' && isHex((value as ArtCustomColor).light) && isHex((value as ArtCustomColor).dark)
}

export function sameColor(a: ArtNodeColor | undefined, b: ArtNodeColor | undefined) {
  if (typeof a === 'string' || typeof b === 'string' || !a || !b)
    return a === b
  return a.light === b.light && a.dark === b.dark
}

/** Either kind of color, as its two hex values. */
export function colorPair(color: ArtNodeColor): ArtCustomColor {
  return typeof color === 'string' ? ART_COLORS[color] : color
}

/**
 * A node color as a paint value. `auto` follows the site color mode through the
 * `--art-dark` switch set by `.pub-art-auto`, so it needs that class on an ancestor.
 */
export function artColorValue(color: ArtNodeColor, theme: 'auto' | ArtTheme) {
  const { light, dark } = colorPair(color)
  if (theme === 'auto')
    return `color-mix(in srgb, ${dark} calc(var(--art-dark, 0) * 100%), ${light})`
  return theme === 'light' ? light : dark
}

// Shapes: the only two primitives the renderer knows about

export interface ArtPath {
  kind: 'path'
  d: string
  opacity?: number
  dashed?: boolean
  filled?: boolean
}

export interface ArtDot {
  kind: 'dot'
  x: number
  y: number
  r: number
  opacity?: number
  filled?: boolean
}

export type ArtShape = ArtPath | ArtDot

// Params: each layer type describes its own controls, the inspector renders them generically

interface ParamBase {
  key: string
  label: string
  /** Hides the control when it would have no effect (e.g. growth with even spacing). */
  when?: (params: LayerParams) => boolean
}

export interface RangeParam extends ParamBase {
  kind: 'range'
  min: number
  max: number
  step: number
  default: number
  unit?: string
}

export interface ChoiceParam extends ParamBase {
  kind: 'choice'
  options: { value: string, label: string }[]
  default: string
}

export interface ToggleParam extends ParamBase {
  kind: 'toggle'
  default: boolean
}

export type ParamDefinition = RangeParam | ChoiceParam | ToggleParam
export type ParamValue = number | string | boolean
export type LayerParams = Record<string, ParamValue>

export type LayerType = 'lines' | 'retention' | 'orbits' | 'dots' | 'rings' | 'rays' | 'wave' | 'shape' | 'glow'

interface ArtNodeBase {
  id: string
  name: string
  visible: boolean
  /** Center of the node in its parent's space (the frame, 0..400 × 0..200, at the root). */
  x: number
  y: number
  rotation: number
  scale: number
  /** Mirrors the node around its own center, before rotation: left out means not flipped. */
  flipX?: boolean
  flipY?: boolean
  opacity: number
  /** Left out means inherited: from the enclosing group, or ink at the root. */
  color?: ArtNodeColor
  /** Stroke width in screen pixels. Left out means inherited, like `color`. */
  stroke?: number
}

export interface ArtGroup extends ArtNodeBase {
  type: 'group'
  children: ArtNode[]
}

export interface ArtLayer extends ArtNodeBase {
  type: LayerType
  /** Only read by layers that scatter or jitter something. */
  seed: number
  params: LayerParams
}

export type ArtNode = ArtLayer | ArtGroup

export interface ArtComposition {
  grid: boolean
  /** Film grain over the whole frame, 0..1: left out means none. */
  grain?: number
  /** Drawn in order: the last node is on top. */
  layers: ArtNode[]
}

export function isGroup(node: ArtNode): node is ArtGroup {
  return node.type === 'group'
}

interface DrawContext {
  params: LayerParams
  rand: () => number
}

export interface LayerDefinition {
  label: string
  icon: string
  description: string
  /** Whether the seed changes anything: the inspector hides it otherwise. */
  random: boolean
  params: ParamDefinition[]
  draw: (context: DrawContext) => ArtShape[]
}

/** Mulberry32: tiny, fast, and good enough to scatter a few hundred shapes. */
export function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6D2B79F5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

function polyline(points: [number, number][], closed = false) {
  const d = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`).join('')
  return closed ? `${d}Z` : d
}

function num(params: LayerParams, key: string) {
  return params[key] as number
}

function str(params: LayerParams, key: string) {
  return params[key] as string
}

function bool(params: LayerParams, key: string) {
  return params[key] as boolean
}

/** Distributes `count` positions over 0..1 following a spacing law. */
function distribute(count: number, law: string, rand: () => number, growth = 1.08) {
  if (count <= 1)
    return [0.5]
  if (law === 'random')
    return Array.from({ length: count }, () => rand()).sort((a, b) => a - b)
  if (law === 'exponential') {
    const gaps = Array.from({ length: count - 1 }, (_, i) => growth ** i)
    const total = gaps.reduce((sum, gap) => sum + gap, 0)
    let position = 0
    return [0, ...gaps.map(gap => (position += gap / total))]
  }
  if (law === 'center') {
    // Dense in the middle, sparse at the edges
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1) * 2 - 1
      return (Math.sign(t) * Math.abs(t) ** 2.2 + 1) / 2
    })
  }
  return Array.from({ length: count }, (_, i) => i / (count - 1))
}

/** A 0..1 envelope over a 0..1 position, used to shape lengths and opacities. */
function envelope(profile: string, t: number, rand: () => number) {
  switch (profile) {
    case 'rise': return t
    case 'fall': return 1 - t
    case 'peak': return Math.exp(-((t - 0.5) ** 2) / 0.04)
    case 'wave': return (Math.sin(t * Math.PI * 4) + 1) / 2
    case 'random': return rand()
    default: return 1
  }
}

/** Dot size over a -1..1 grid position. */
function falloff(kind: string, u: number, v: number, rand: () => number) {
  switch (kind) {
    case 'radial': return Math.max(0, 1 - Math.hypot(u, v) / Math.SQRT2)
    case 'linear': return (u + 1) / 2
    case 'random': return rand()
    default: return 1
  }
}

/** A -1..1 curve over a 0..1 position. */
function waveform(form: string, t: number, frequency: number, phase: number) {
  switch (form) {
    case 'decay': return Math.exp(-t * frequency) * Math.cos((t * frequency * 2 + phase) * Math.PI * 2)
    case 'sigmoid': return 1 / (1 + Math.exp(-(t - 0.5 - phase * 0.3) * frequency * 6)) * 2 - 1
    default: return Math.sin((t * frequency + phase) * Math.PI * 2)
  }
}

const SPACING_OPTIONS = [
  { value: 'even', label: 'Even' },
  { value: 'exponential', label: 'Grow' },
  { value: 'center', label: 'Center' },
  { value: 'random', label: 'Random' },
]

const PROFILE_OPTIONS = [
  { value: 'flat', label: 'Flat' },
  { value: 'rise', label: 'Rise' },
  { value: 'fall', label: 'Fall' },
  { value: 'peak', label: 'Peak' },
  { value: 'wave', label: 'Wave' },
  { value: 'random', label: 'Random' },
]

export const LAYER_TYPES: Record<LayerType, LayerDefinition> = {
  lines: {
    label: 'Lines',
    icon: 'lucide:align-vertical-space-around',
    description: 'Parallel strokes, spaced and shaped',
    random: true,
    params: [
      { kind: 'range', key: 'count', label: 'Count', min: 2, max: 160, step: 1, default: 48 },
      { kind: 'range', key: 'width', label: 'Span', min: 10, max: 400, step: 1, default: 300 },
      { kind: 'range', key: 'length', label: 'Length', min: 2, max: 200, step: 1, default: 100 },
      { kind: 'choice', key: 'spacing', label: 'Spacing', options: SPACING_OPTIONS, default: 'even' },
      { kind: 'range', key: 'growth', label: 'Growth', min: 1, max: 1.3, step: 0.005, default: 1.06, when: params => params.spacing === 'exponential' },
      { kind: 'choice', key: 'profile', label: 'Length profile', options: PROFILE_OPTIONS, default: 'flat' },
      { kind: 'choice', key: 'anchor', label: 'Anchor', options: [{ value: 'center', label: 'Center' }, { value: 'bottom', label: 'Bottom' }, { value: 'top', label: 'Top' }], default: 'center' },
      { kind: 'toggle', key: 'fade', label: 'Fade with length', default: false },
      { kind: 'toggle', key: 'dashed', label: 'Dashed', default: false },
    ],
    draw: ({ params, rand }) => {
      const width = num(params, 'width')
      const maxLength = num(params, 'length')
      const positions = distribute(num(params, 'count'), str(params, 'spacing'), rand, num(params, 'growth'))
      return positions.map((t) => {
        const amount = envelope(str(params, 'profile'), t, rand)
        const length = maxLength * (0.06 + 0.94 * amount)
        const x = (t - 0.5) * width
        const anchor = str(params, 'anchor')
        const top = anchor === 'bottom' ? maxLength / 2 - length : anchor === 'top' ? -maxLength / 2 : -length / 2
        return {
          kind: 'path',
          d: `M${round(x)} ${round(top)}V${round(top + length)}`,
          opacity: bool(params, 'fade') ? round(0.15 + 0.85 * amount) : 1,
          dashed: bool(params, 'dashed'),
        } satisfies ArtPath
      })
    },
  },

  retention: {
    label: 'Retention',
    icon: 'lucide:audio-waveform',
    description: 'Decay between growing intervals',
    random: true,
    params: [
      { kind: 'range', key: 'count', label: 'Lines', min: 20, max: 160, step: 1, default: 80 },
      { kind: 'range', key: 'reviews', label: 'Reviews', min: 1, max: 8, step: 1, default: 5 },
      { kind: 'range', key: 'growth', label: 'Interval growth', min: 1, max: 3, step: 0.05, default: 1.8 },
      { kind: 'range', key: 'decay', label: 'Decay', min: 0.01, max: 0.2, step: 0.005, default: 0.035 },
      { kind: 'range', key: 'width', label: 'Span', min: 40, max: 400, step: 1, default: 320 },
      { kind: 'range', key: 'height', label: 'Height', min: 10, max: 200, step: 1, default: 120 },
      { kind: 'toggle', key: 'markers', label: 'Review markers', default: true },
    ],
    draw: ({ params, rand }) => {
      const shapes: ArtShape[] = []
      const width = num(params, 'width')
      const half = num(params, 'height') / 2
      const count = num(params, 'count')
      const reviewCount = num(params, 'reviews')
      // Each interval is `growth` times the previous one, lightly jittered by the seed
      const intervals = Array.from({ length: reviewCount - 1 }, (_, i) => num(params, 'growth') ** i * lerp(0.85, 1.15, rand()))
      const total = intervals.reduce((sum, interval) => sum + interval, 0) * 1.25 || 1
      const reviews = [0]
      for (const interval of intervals)
        reviews.push(reviews.at(-1)! + interval / total)

      for (let i = 0; i < count; i++) {
        const t = i / (count - 1)
        const last = reviews.findLastIndex(review => review <= t)
        // Memory strength doubles-ish with each review, so the curve flattens over time
        const retention = Math.exp(-(t - reviews[last]!) / (num(params, 'decay') * 2.1 ** last))
        const h = half * (0.08 + 0.92 * retention)
        const x = round((t - 0.5) * width)
        shapes.push({ kind: 'path', d: `M${x} ${round(-h)}V${round(h)}`, opacity: round(0.2 + 0.6 * retention) })
      }

      if (bool(params, 'markers')) {
        for (const review of reviews) {
          const x = round((review - 0.5) * width)
          shapes.push({ kind: 'path', d: `M${x} ${-half - 8}V${half + 8}` })
          shapes.push({ kind: 'dot', x, y: -half - 16, r: 2, filled: true })
        }
      }
      return shapes
    },
  },

  orbits: {
    label: 'Orbits',
    icon: 'lucide:orbit',
    description: 'Tilted ellipses around a core',
    random: true,
    params: [
      { kind: 'range', key: 'count', label: 'Orbits', min: 1, max: 12, step: 1, default: 4 },
      { kind: 'range', key: 'radius', label: 'Radius', min: 10, max: 220, step: 1, default: 150 },
      { kind: 'range', key: 'flatness', label: 'Flatness', min: 0.05, max: 1, step: 0.01, default: 0.25 },
      { kind: 'range', key: 'spread', label: 'Tilt spread', min: 0, max: 180, step: 1, default: 180, unit: '°' },
      { kind: 'range', key: 'variance', label: 'Variance', min: 0, max: 1, step: 0.01, default: 0.3 },
      { kind: 'toggle', key: 'bodies', label: 'Bodies', default: true },
      { kind: 'toggle', key: 'links', label: 'Links to core', default: true, when: params => params.bodies === true },
      { kind: 'toggle', key: 'core', label: 'Core', default: true },
      { kind: 'toggle', key: 'dashed', label: 'Some dashed', default: true },
    ],
    draw: ({ params, rand }) => {
      const shapes: ArtShape[] = []
      const count = num(params, 'count')
      const spread = num(params, 'spread') * Math.PI / 180
      const variance = num(params, 'variance')

      for (let i = 0; i < count; i++) {
        const rotation = (count === 1 ? 0 : (i / count) * spread) + lerp(-0.15, 0.15, rand()) * variance
        const rx = num(params, 'radius') * lerp(1 - variance * 0.5, 1, rand())
        const ry = rx * num(params, 'flatness') * lerp(1 - variance, 1, rand())
        const cos = Math.cos(rotation)
        const sin = Math.sin(rotation)
        const point = (angle: number): [number, number] => {
          const ex = rx * Math.cos(angle)
          const ey = ry * Math.sin(angle)
          return [ex * cos - ey * sin, ex * sin + ey * cos]
        }
        const dashed = bool(params, 'dashed') && rand() < 0.3
        shapes.push({ kind: 'path', d: polyline(Array.from({ length: 97 }, (_, k) => point(k / 96 * Math.PI * 2)), true), dashed, opacity: dashed ? 0.5 : 0.85 })

        const [bx, by] = point(rand() * Math.PI * 2)
        if (bool(params, 'links'))
          shapes.push({ kind: 'path', d: `M0 0L${round(bx)} ${round(by)}`, dashed: true, opacity: 0.25 })
        if (bool(params, 'bodies'))
          shapes.push({ kind: 'dot', x: round(bx), y: round(by), r: 3.5, filled: rand() < 0.5 })
      }

      if (bool(params, 'core')) {
        shapes.push({ kind: 'dot', x: 0, y: 0, r: 9, opacity: 0.5 })
        shapes.push({ kind: 'dot', x: 0, y: 0, r: 4, filled: true })
      }
      return shapes
    },
  },

  dots: {
    label: 'Dot matrix',
    icon: 'lucide:grip',
    description: 'A grid of dots with a falloff',
    random: true,
    params: [
      { kind: 'range', key: 'cols', label: 'Columns', min: 1, max: 60, step: 1, default: 24 },
      { kind: 'range', key: 'rows', label: 'Rows', min: 1, max: 30, step: 1, default: 10 },
      { kind: 'range', key: 'gap', label: 'Gap', min: 3, max: 40, step: 0.5, default: 10 },
      { kind: 'range', key: 'size', label: 'Size', min: 0.3, max: 8, step: 0.1, default: 1.6 },
      { kind: 'choice', key: 'falloff', label: 'Falloff', options: [{ value: 'none', label: 'None' }, { value: 'radial', label: 'Radial' }, { value: 'linear', label: 'Linear' }, { value: 'random', label: 'Random' }], default: 'radial' },
      { kind: 'range', key: 'threshold', label: 'Cutoff', min: 0, max: 1, step: 0.01, default: 0.1 },
      { kind: 'toggle', key: 'filled', label: 'Filled', default: true },
    ],
    draw: ({ params, rand }) => {
      const shapes: ArtShape[] = []
      const cols = num(params, 'cols')
      const rows = num(params, 'rows')
      const gap = num(params, 'gap')
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const u = cols === 1 ? 0 : col / (cols - 1) * 2 - 1
          const v = rows === 1 ? 0 : row / (rows - 1) * 2 - 1
          const amount = falloff(str(params, 'falloff'), u, v, rand)
          if (amount < num(params, 'threshold'))
            continue
          shapes.push({
            kind: 'dot',
            x: round((col - (cols - 1) / 2) * gap),
            y: round((row - (rows - 1) / 2) * gap),
            r: round(num(params, 'size') * (0.3 + 0.7 * amount)),
            filled: bool(params, 'filled'),
          })
        }
      }
      return shapes
    },
  },

  rings: {
    label: 'Rings',
    icon: 'lucide:circle-dot',
    description: 'Concentric circles or arcs',
    random: false,
    params: [
      { kind: 'range', key: 'count', label: 'Rings', min: 1, max: 40, step: 1, default: 6 },
      { kind: 'range', key: 'inner', label: 'Inner radius', min: 0, max: 200, step: 1, default: 12 },
      { kind: 'range', key: 'outer', label: 'Outer radius', min: 4, max: 300, step: 1, default: 90 },
      { kind: 'choice', key: 'spacing', label: 'Spacing', options: SPACING_OPTIONS.filter(option => option.value !== 'random'), default: 'even' },
      { kind: 'range', key: 'arc', label: 'Arc', min: 10, max: 360, step: 1, default: 360, unit: '°' },
      { kind: 'toggle', key: 'alternate', label: 'Alternate dashes', default: false },
      { kind: 'toggle', key: 'fade', label: 'Fade outward', default: false },
    ],
    draw: ({ params, rand }) => {
      const inner = num(params, 'inner')
      const outer = Math.max(num(params, 'outer'), inner + 1)
      const arc = num(params, 'arc') * Math.PI / 180
      return distribute(num(params, 'count'), str(params, 'spacing'), rand, 1.25).map((t, i) => {
        const r = lerp(inner, outer, num(params, 'count') === 1 ? 1 : t)
        const steps = Math.max(8, Math.round(r * arc / 4))
        // Arcs open upward-left so a partial ring reads as a gauge, not a glitch
        const points = Array.from({ length: steps + 1 }, (_, k): [number, number] => {
          const angle = -Math.PI / 2 - arc / 2 + (k / steps) * arc
          return [Math.cos(angle) * r, Math.sin(angle) * r]
        })
        return {
          kind: 'path',
          d: polyline(points, arc >= Math.PI * 2 - 0.001),
          dashed: bool(params, 'alternate') && i % 2 === 1,
          opacity: bool(params, 'fade') ? round(1 - t * 0.8) : 1,
        } satisfies ArtPath
      })
    },
  },

  rays: {
    label: 'Rays',
    icon: 'lucide:sun-dim',
    description: 'Strokes radiating from a center',
    random: true,
    params: [
      { kind: 'range', key: 'count', label: 'Rays', min: 2, max: 180, step: 1, default: 48 },
      { kind: 'range', key: 'inner', label: 'Inner radius', min: 0, max: 200, step: 1, default: 30 },
      { kind: 'range', key: 'outer', label: 'Outer radius', min: 4, max: 300, step: 1, default: 90 },
      { kind: 'range', key: 'arc', label: 'Fan', min: 5, max: 360, step: 1, default: 360, unit: '°' },
      { kind: 'choice', key: 'profile', label: 'Length profile', options: PROFILE_OPTIONS, default: 'flat' },
      { kind: 'toggle', key: 'tips', label: 'Dots at tips', default: false },
    ],
    draw: ({ params, rand }) => {
      const shapes: ArtShape[] = []
      const count = num(params, 'count')
      const arc = num(params, 'arc') * Math.PI / 180
      const full = arc >= Math.PI * 2 - 0.001
      const inner = num(params, 'inner')
      const outer = num(params, 'outer')
      for (let i = 0; i < count; i++) {
        const t = full ? i / count : count === 1 ? 0.5 : i / (count - 1)
        const angle = -Math.PI / 2 - (full ? 0 : arc / 2) + t * arc
        const r = lerp(inner, outer, 0.1 + 0.9 * envelope(str(params, 'profile'), t, rand))
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        shapes.push({ kind: 'path', d: `M${round(cos * inner)} ${round(sin * inner)}L${round(cos * r)} ${round(sin * r)}` })
        if (bool(params, 'tips'))
          shapes.push({ kind: 'dot', x: round(cos * r), y: round(sin * r), r: 1.6, filled: true })
      }
      return shapes
    },
  },

  wave: {
    label: 'Wave',
    icon: 'lucide:activity',
    description: 'A curve and its echoes',
    random: true,
    params: [
      { kind: 'choice', key: 'form', label: 'Form', options: [{ value: 'sine', label: 'Sine' }, { value: 'decay', label: 'Decay' }, { value: 'sigmoid', label: 'S-curve' }, { value: 'noise', label: 'Noise' }], default: 'sine' },
      { kind: 'range', key: 'width', label: 'Span', min: 20, max: 400, step: 1, default: 320 },
      { kind: 'range', key: 'amplitude', label: 'Amplitude', min: 0, max: 100, step: 1, default: 30 },
      { kind: 'range', key: 'frequency', label: 'Frequency', min: 0.25, max: 10, step: 0.25, default: 2 },
      { kind: 'range', key: 'echoes', label: 'Echoes', min: 1, max: 30, step: 1, default: 1 },
      { kind: 'range', key: 'echoGap', label: 'Echo gap', min: 1, max: 30, step: 0.5, default: 6 },
      { kind: 'range', key: 'phaseShift', label: 'Echo drift', min: 0, max: 1, step: 0.01, default: 0 },
      { kind: 'toggle', key: 'dashed', label: 'Dashed', default: false },
    ],
    draw: ({ params, rand }) => {
      const width = num(params, 'width')
      const amplitude = num(params, 'amplitude')
      const frequency = num(params, 'frequency')
      const echoes = num(params, 'echoes')
      const form = str(params, 'form')
      // Noise is a smoothed random walk, sampled once so every echo shares it
      const knots = Array.from({ length: Math.ceil(frequency * 4) + 2 }, () => rand() * 2 - 1)
      const noise = (t: number) => {
        const position = t * (knots.length - 1)
        const i = Math.floor(position)
        const f = position - i
        const smooth = f * f * (3 - 2 * f)
        return lerp(knots[i]!, knots[Math.min(i + 1, knots.length - 1)]!, smooth)
      }
      const shapes: ArtShape[] = []
      for (let e = 0; e < echoes; e++) {
        const offset = (e - (echoes - 1) / 2) * num(params, 'echoGap')
        const phase = e * num(params, 'phaseShift')
        const points = Array.from({ length: 121 }, (_, k): [number, number] => {
          const t = k / 120
          const y = form === 'noise' ? noise(t) : waveform(form, t, frequency, phase)
          return [(t - 0.5) * width, -y * amplitude + offset]
        })
        shapes.push({ kind: 'path', d: polyline(points), dashed: bool(params, 'dashed'), opacity: echoes > 1 ? round(1 - Math.abs(offset) / (echoes * num(params, 'echoGap')) * 1.2) : 1 })
      }
      return shapes
    },
  },

  shape: {
    label: 'Shape',
    icon: 'lucide:shapes',
    description: 'Circle, square, triangle, line, cross',
    random: false,
    params: [
      { kind: 'choice', key: 'form', label: 'Form', options: [{ value: 'circle', label: 'Circle' }, { value: 'square', label: 'Square' }, { value: 'triangle', label: 'Triangle' }, { value: 'line', label: 'Line' }, { value: 'cross', label: 'Cross' }], default: 'circle' },
      { kind: 'range', key: 'size', label: 'Size', min: 2, max: 400, step: 1, default: 60 },
      { kind: 'range', key: 'ratio', label: 'Aspect', min: 0.1, max: 4, step: 0.05, default: 1, when: params => params.form !== 'line' },
      { kind: 'toggle', key: 'filled', label: 'Filled', default: false, when: params => params.form !== 'line' && params.form !== 'cross' },
      { kind: 'toggle', key: 'dashed', label: 'Dashed', default: false, when: params => params.filled !== true || params.form === 'line' || params.form === 'cross' },
    ],
    draw: ({ params }) => {
      const w = num(params, 'size') * Math.sqrt(num(params, 'ratio'))
      const h = num(params, 'size') / Math.sqrt(num(params, 'ratio'))
      const dashed = bool(params, 'dashed')
      const filled = bool(params, 'filled')
      switch (str(params, 'form')) {
        case 'circle':
          return [{ kind: 'path', d: polyline(Array.from({ length: 97 }, (_, k): [number, number] => [Math.cos(k / 96 * Math.PI * 2) * w / 2, Math.sin(k / 96 * Math.PI * 2) * h / 2]), true), dashed, filled }]
        case 'square':
          return [{ kind: 'path', d: polyline([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], true), dashed, filled }]
        case 'triangle':
          return [{ kind: 'path', d: polyline([[0, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], true), dashed, filled }]
        case 'cross':
          return [{ kind: 'path', d: `M${round(-w / 2)} 0H${round(w / 2)}M0 ${round(-h / 2)}V${round(h / 2)}`, dashed }]
        default:
          return [{ kind: 'path', d: `M${round(-w / 2)} 0H${round(w / 2)}`, dashed }]
      }
    },
  },

  glow: GLOW_LAYER,
}

export const LAYER_TYPE_ORDER = Object.keys(LAYER_TYPES) as LayerType[]

export function defaultParams(type: LayerType): LayerParams {
  return Object.fromEntries(LAYER_TYPES[type].params.map(param => [param.key, param.default]))
}

export function drawLayer(layer: ArtLayer): ArtShape[] {
  const definition = LAYER_TYPES[layer.type]
  // Missing params (older compositions, new controls) fall back to their defaults
  const params = { ...defaultParams(layer.type), ...layer.params }
  return definition.draw({ params, rand: createRandom(layer.seed) })
}

export function nodeTransform(node: Pick<ArtNode, 'x' | 'y' | 'rotation' | 'scale' | 'flipX' | 'flipY'>) {
  const scale = node.flipX || node.flipY
    ? `${round(node.flipX ? -node.scale : node.scale)} ${round(node.flipY ? -node.scale : node.scale)}`
    : round(node.scale)
  return `translate(${round(node.x)} ${round(node.y)}) rotate(${round(node.rotation)}) scale(${scale})`
}

// Presets: starting points, and a record of the compositions used on the site

type LayerInput = Partial<Omit<ArtLayer, 'params'>> & { type: LayerType, params?: LayerParams }

export function createLayer(input: LayerInput): ArtLayer {
  const { params, ...rest } = input
  return {
    visible: true,
    x: ART_WIDTH / 2,
    y: ART_HEIGHT / 2,
    rotation: 0,
    scale: 1,
    opacity: 1,
    seed: 1,
    ...rest,
    // After the spread, so an explicit `undefined` (e.g. from a duplicate) still gets a value
    id: input.id ?? newId(),
    name: input.name ?? LAYER_TYPES[input.type].label,
    params: { ...defaultParams(input.type), ...params },
  }
}

export function newId() {
  return Math.random().toString(36).slice(2, 10)
}

type GroupInput = Partial<Omit<ArtGroup, 'type'>> & { children: ArtNode[] }

export function createGroup(input: GroupInput): ArtGroup {
  return {
    name: 'Group',
    visible: true,
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
    opacity: 1,
    ...input,
    id: input.id ?? newId(),
    type: 'group',
  }
}

/** Accepts anything node-shaped (drafts, pasted JSON, older formats) and fills in the gaps. */
export function normalizeNode(value: unknown): ArtNode | null {
  if (!value || typeof value !== 'object')
    return null
  const { color, stroke, ...node } = value as Record<string, unknown>
  // Custom colors are rewritten as fresh, lowercase hex pairs; an unknown color (typo,
  // removed swatch) is dropped, so the node inherits rather than breaking
  if (isArtColor(color))
    node.color = color
  else if (isCustomColor(color))
    node.color = { light: normalizeHex(color.light), dark: normalizeHex(color.dark) }
  if (isArtStroke(stroke))
    node.stroke = stroke
  if (node.type === 'group' && Array.isArray(node.children)) {
    const children = node.children.map(normalizeNode).filter((child): child is ArtNode => !!child)
    return createGroup({ ...(node as Partial<ArtGroup>), children })
  }
  if (typeof node.type === 'string' && node.type in LAYER_TYPES)
    return createLayer(node as LayerInput)
  return null
}

/** Same nodes with fresh ids all the way down, for pasting and duplicating. */
export function cloneNode(node: ArtNode): ArtNode {
  // Through JSON rather than structuredClone: nodes are often Vue proxies, which it rejects
  const copy: ArtNode = JSON.parse(JSON.stringify(node))
  const reassign = (item: ArtNode) => {
    item.id = newId()
    if (isGroup(item))
      item.children.forEach(reassign)
  }
  reassign(copy)
  return copy
}

export interface ArtPreset {
  label: string
  build: () => ArtComposition
}

/** The deep red of the glow presets: the palette's red is tuned for thin strokes, not light. */
const EMBER: ArtCustomColor = { light: '#dc2626', dark: '#f0341f' }

export const ART_PRESETS: ArtPreset[] = [
  {
    label: 'Spaced testing',
    build: () => ({
      grid: true,
      layers: [
        createLayer({ type: 'retention', seed: 3 }),
        createLayer({ type: 'shape', name: 'Baseline', params: { form: 'line', size: 320, dashed: true }, opacity: 0.2 }),
      ],
    }),
  },
  {
    label: 'Multi-agent',
    build: () => ({
      grid: true,
      layers: [
        createLayer({ type: 'orbits', seed: 7 }),
      ],
    }),
  },
  {
    label: 'Signal',
    build: () => ({
      grid: true,
      layers: [
        createLayer({ type: 'wave', params: { echoes: 12, echoGap: 5, amplitude: 24, frequency: 1.5, phaseShift: 0.04 } }),
        createLayer({ type: 'dots', name: 'Field', opacity: 0.5, params: { cols: 36, rows: 16, gap: 11, size: 0.8, falloff: 'none' } }),
      ],
    }),
  },
  {
    label: 'Ember',
    build: () => ({
      grid: false,
      grain: 0.5,
      layers: [
        createLayer({ type: 'glow', name: 'Wash', color: EMBER, x: 330, y: 200, rotation: -18, params: { size: 360, ratio: 2.2, softness: 58, intensity: 1.3, core: 0.8 } }),
        createLayer({ type: 'glow', name: 'Streaks', color: EMBER, x: 120, y: 70, rotation: -55, opacity: 0.8, seed: 4, params: { form: 'streaks', size: 220, count: 3, gap: 16, thickness: 14, softness: 5, motion: 0.4, core: 0.3 } }),
      ],
    }),
  },
  {
    label: 'Flame',
    build: () => ({
      grid: false,
      grain: 0.5,
      layers: [
        createLayer({ type: 'glow', name: 'Flame', color: EMBER, x: 230, y: 105, seed: 12, params: { form: 'flame', size: 150, ratio: 2.6, count: 4, softness: 7, motion: 0.7, warp: 50, turbulence: 0.018, intensity: 1.8, core: 0.85, coreHue: 38 } }),
      ],
    }),
  },
]
