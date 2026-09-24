/**
 * Glow: soft light made the way designers make it by hand in a vector tool. Plain filled
 * shapes, pushed through an SVG filter that warps them, blurs them, dithers them with grain
 * and colors the brightest parts hotter. It stays vector and deterministic, so it exports
 * and pre-renders like every other layer.
 */

import type { ArtShape, LayerDefinition, LayerParams } from './art'

export interface GlowFilter {
  /** Gaussian blur per axis, in the layer's own units. */
  blur: [number, number]
  warp: number
  warpScale: number
  intensity: number
  grain: number
  core: number
  /** Degrees the hot core turns away from the layer's color. */
  coreHue: number
  /** Where the filter computes, in the layer's own units: large regions cost a lot. */
  region: { x: number, y: number, width: number, height: number }
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

function num(params: LayerParams, key: string) {
  return params[key] as number
}

function polygon(points: [number, number][]) {
  return `${points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`).join('')}Z`
}

function ellipse(cx: number, cy: number, rx: number, ry: number) {
  return polygon(Array.from({ length: 72 }, (_, k): [number, number] => {
    const angle = k / 72 * Math.PI * 2
    return [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]
  }))
}

/**
 * A comet: a round head at (x, y) and a tail running `length` to the left, thinning to a
 * point and drifting `bend` sideways as it goes.
 */
function tongue(x: number, y: number, length: number, radius: number, bend: number) {
  const steps = 32
  const spine = (t: number): [number, number] => [x - (1 - t) * length, y + bend * (1 - t) ** 2]
  const top: [number, number][] = []
  const bottom: [number, number][] = []
  for (let k = 0; k <= steps; k++) {
    const t = k / steps
    const [sx, sy] = spine(t)
    const half = radius * Math.sqrt(t)
    top.push([sx, sy - half])
    bottom.push([sx, sy + half])
  }
  const cap = Array.from({ length: 16 }, (_, k): [number, number] => {
    const angle = -Math.PI / 2 + (k + 1) / 17 * Math.PI
    return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]
  })
  return polygon([...top, ...cap, ...bottom.reverse()])
}

/** Half the width and height the shapes cover before the filter spreads them. */
function extent(params: LayerParams): [number, number] {
  const size = num(params, 'size')
  const ratio = Math.sqrt(num(params, 'ratio'))
  switch (params.form) {
    case 'arc': return [size / 2, size / 2]
    case 'streaks': return [size / 2, (num(params, 'count') * num(params, 'gap') + num(params, 'thickness')) / 2]
    case 'flame': return [size * ratio / 2 + size, size / ratio / 2 + size / 2]
    default: return [size * ratio / 2, size / ratio / 2]
  }
}

export function glowFilter(params: LayerParams): GlowFilter {
  const softness = num(params, 'softness')
  const motion = num(params, 'motion')
  // Motion trades blur across the stroke for blur along it, like a long exposure
  const blur: [number, number] = [round(softness * (1 + motion * 2)), round(softness * (1 - motion * 0.85))]
  const warp = num(params, 'warp')
  const [halfWidth, halfHeight] = extent(params)
  // Past three deviations a gaussian has nothing left to draw
  const padX = blur[0] * 3 + warp
  const padY = blur[1] * 3 + warp
  return {
    blur,
    warp,
    warpScale: num(params, 'turbulence'),
    intensity: num(params, 'intensity'),
    grain: num(params, 'grain'),
    core: num(params, 'core'),
    coreHue: num(params, 'coreHue'),
    region: {
      x: round(-halfWidth - padX),
      y: round(-halfHeight - padY),
      width: round((halfWidth + padX) * 2),
      height: round((halfHeight + padY) * 2),
    },
  }
}

export const GLOW_LAYER: LayerDefinition = {
  label: 'Glow',
  icon: 'lucide:sun',
  description: 'Soft, grainy light: orbs, arcs, streaks, flames',
  random: true,
  params: [
    { kind: 'choice', key: 'form', label: 'Form', options: [{ value: 'orb', label: 'Orb' }, { value: 'arc', label: 'Arc' }, { value: 'streaks', label: 'Streaks' }, { value: 'flame', label: 'Flame' }], default: 'orb' },
    { kind: 'range', key: 'size', label: 'Size', min: 10, max: 480, step: 1, default: 180 },
    { kind: 'range', key: 'ratio', label: 'Aspect', min: 0.1, max: 6, step: 0.05, default: 1.6, when: params => params.form === 'orb' || params.form === 'flame' },
    { kind: 'range', key: 'thickness', label: 'Thickness', min: 1, max: 120, step: 1, default: 28, when: params => params.form === 'arc' || params.form === 'streaks' },
    { kind: 'range', key: 'sweep', label: 'Sweep', min: 10, max: 360, step: 1, default: 140, unit: '°', when: params => params.form === 'arc' },
    { kind: 'range', key: 'count', label: 'Count', min: 1, max: 12, step: 1, default: 3, when: params => params.form === 'streaks' || params.form === 'flame' },
    { kind: 'range', key: 'gap', label: 'Gap', min: 2, max: 80, step: 1, default: 14, when: params => params.form === 'streaks' },
    { kind: 'range', key: 'softness', label: 'Softness', min: 0, max: 80, step: 0.5, default: 26 },
    { kind: 'range', key: 'motion', label: 'Motion blur', min: 0, max: 1, step: 0.01, default: 0 },
    { kind: 'range', key: 'warp', label: 'Warp', min: 0, max: 160, step: 1, default: 0 },
    { kind: 'range', key: 'turbulence', label: 'Warp scale', min: 0.002, max: 0.05, step: 0.001, default: 0.012, when: params => (params.warp as number) > 0 },
    { kind: 'range', key: 'intensity', label: 'Intensity', min: 0.2, max: 4, step: 0.05, default: 1.4 },
    { kind: 'range', key: 'core', label: 'Hot core', min: 0, max: 1, step: 0.01, default: 0.6 },
    { kind: 'range', key: 'coreHue', label: 'Core hue', min: -120, max: 120, step: 1, default: 35, unit: '°', when: params => (params.core as number) > 0 },
    { kind: 'range', key: 'grain', label: 'Grain', min: 0, max: 1, step: 0.01, default: 0.35 },
  ],
  draw: ({ params, rand }) => {
    const size = num(params, 'size')
    const ratio = Math.sqrt(num(params, 'ratio'))
    const thickness = num(params, 'thickness')

    switch (params.form) {
      case 'arc': {
        // A band along the top of a circle: the lit rim of something just out of frame
        const sweep = num(params, 'sweep') * Math.PI / 180
        const outer = size / 2
        const inner = Math.max(0, outer - thickness)
        const steps = 64
        const ring = (radius: number, reverse: boolean) => Array.from({ length: steps + 1 }, (_, k): [number, number] => {
          const t = reverse ? 1 - k / steps : k / steps
          const angle = -Math.PI / 2 - sweep / 2 + t * sweep
          return [Math.cos(angle) * radius, Math.sin(angle) * radius]
        })
        return [{ kind: 'path', d: polygon([...ring(outer, false), ...ring(inner, true)]), filled: true }]
      }

      case 'streaks': {
        const count = num(params, 'count')
        const gap = num(params, 'gap')
        return Array.from({ length: count }, (_, i): ArtShape => {
          const y = (i - (count - 1) / 2) * gap
          const length = size * (0.7 + 0.3 * rand())
          const width = Math.max(1, thickness / count) * (0.6 + 0.8 * rand())
          return { kind: 'path', d: ellipse(0, y, length / 2, width / 2), filled: true, opacity: round(0.55 + 0.45 * rand()) }
        })
      }

      case 'flame': {
        // Tongues licking to the right, stacked along the height: with warp and motion blur
        // they smear into fire
        const count = num(params, 'count')
        const width = size * ratio
        const height = size / ratio
        return Array.from({ length: count }, (_, i): ArtShape => {
          const row = count === 1 ? 0.5 : i / (count - 1)
          const length = width * (0.5 + 0.5 * rand())
          const head = [width / 2 - length * 0.1 - rand() * width * 0.25, (row - 0.5) * height * 0.8] as const
          const radius = height / count * (0.35 + 0.35 * rand())
          const bend = (rand() - 0.5) * height * 0.6
          return { kind: 'path', d: tongue(head[0], head[1], length, radius, bend), filled: true, opacity: round(0.65 + 0.35 * rand()) }
        })
      }

      default:
        return [{ kind: 'path', d: ellipse(0, 0, size * ratio / 2, size / ratio / 2), filled: true }]
    }
  },
}
