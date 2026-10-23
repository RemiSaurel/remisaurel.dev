// Geometry of the workflow canvas: viewport maths, edge paths and the spring that moves nodes.
// Pure functions only, so they can be tested without a browser.

import type { FlowPoint, FlowRect, FlowSize, FlowViewport } from './types'

export const FLOW_MIN_ZOOM = 0.35
export const FLOW_MAX_ZOOM = 2

export function clampZoom(k: number): number {
  return Math.min(FLOW_MAX_ZOOM, Math.max(FLOW_MIN_ZOOM, k))
}

/** Zooms to `k` around a screen point: the world point under it does not move */
export function zoomAt(view: FlowViewport, k: number, anchor: FlowPoint): FlowViewport {
  const next = clampZoom(k)
  const ratio = next / view.k
  return {
    x: anchor.x - (anchor.x - view.x) * ratio,
    y: anchor.y - (anchor.y - view.y) * ratio,
    k: next,
  }
}

export function boundsOf(rects: readonly FlowRect[]): FlowRect | null {
  if (rects.length === 0)
    return null
  const left = Math.min(...rects.map(r => r.x))
  const top = Math.min(...rects.map(r => r.y))
  const right = Math.max(...rects.map(r => r.x + r.width))
  const bottom = Math.max(...rects.map(r => r.y + r.height))
  return { x: left, y: top, width: right - left, height: bottom - top }
}

/** Space an overlay covers along each side of the canvas (a side panel, the toolbar) */
export interface FlowInsets { top?: number, right?: number, bottom?: number, left?: number }

/** The viewport that shows `bounds` whole and centred in what the insets leave, never zoomed in past `maxZoom` */
export function fitViewport(
  bounds: FlowRect,
  area: FlowSize,
  { padding = 40, maxZoom = 1, insets = {} as FlowInsets } = {},
): FlowViewport {
  const { top = 0, right = 0, bottom = 0, left = 0 } = insets
  const width = Math.max(1, area.width - left - right)
  const height = Math.max(1, area.height - top - bottom)
  const k = Math.min(
    maxZoom,
    clampZoom(Math.min((width - padding * 2) / bounds.width, (height - padding * 2) / bounds.height)),
  )
  return {
    k,
    x: left + width / 2 - (bounds.x + bounds.width / 2) * k,
    y: top + height / 2 - (bounds.y + bounds.height / 2) * k,
  }
}

// The arrowhead stops short of the node, like a pointer resting beside it
export const ARROW_GAP = 4
const ARROW = 5
// Straight run into a node, shared by every edge that ends there
const MERGE_RUN = 18

/**
 * Edge leaving the right side of a node and entering the left side of another: a horizontal S that
 * levels out into a short straight run. Every edge into a node shares that run and the same level
 * arrowhead, so edges meeting at one node merge into a single arrow.
 * A target close in front still gets handles of half its distance, so the edge never overshoots and a ball
 * never doubles back. A target behind its source (a node dragged back) gets longer handles, so the edge swings out and
 * back instead of cutting through both nodes.
 */
export function edgePath(from: FlowPoint, to: FlowPoint): { d: string, arrow: string, end: FlowPoint } {
  const end = { x: to.x - ARROW_GAP, y: to.y }
  const dx = end.x - from.x
  const arrow = `M${end.x - ARROW} ${end.y - ARROW * 0.8}L${end.x} ${end.y}L${end.x - ARROW} ${end.y + ARROW * 0.8}`
  if (dx > 12) {
    const run = Math.min(MERGE_RUN, dx / 3)
    const reach = end.x - run
    const handle = (reach - from.x) / 2
    return {
      d: `M${from.x} ${from.y}C${from.x + handle} ${from.y} ${reach - handle} ${end.y} ${reach} ${end.y}L${end.x} ${end.y}`,
      arrow,
      end,
    }
  }
  const handle = Math.max(60, Math.abs(dx) / 2 + 40)
  return {
    d: `M${from.x} ${from.y}C${from.x + handle} ${from.y} ${end.x - handle} ${end.y} ${end.x} ${end.y}`,
    arrow,
    end,
  }
}

/**
 * Edge leaving the bottom of a node and entering the top of another one lower down: a vertical S, for
 * a flow that wraps onto a new row. The arrowhead stops short of the target, like `edgePath`'s.
 */
export function dropPath(from: FlowPoint, to: FlowPoint): { d: string, arrow: string, end: FlowPoint } {
  const end = { x: to.x, y: to.y - ARROW_GAP }
  const handle = Math.max(0, end.y - from.y) / 2
  return {
    d: `M${from.x} ${from.y}C${from.x} ${from.y + handle} ${end.x} ${end.y - handle} ${end.x} ${end.y}`,
    arrow: `M${end.x - ARROW * 0.8} ${end.y - ARROW}L${end.x} ${end.y}L${end.x + ARROW * 0.8} ${end.y - ARROW}`,
    end,
  }
}

/**
 * Return path from the bottom of `from` back to the bottom of `to`, running at height `floor`:
 * down, along a rounded U, and up into `to`. `labelAt` is the middle of its long run.
 */
export function loopPath(from: FlowPoint, to: FlowPoint, floor: number, radius = 14): { d: string, arrow: string, labelAt: FlowPoint } {
  const r = Math.max(0, Math.min(radius, Math.abs(from.x - to.x) / 2, floor - Math.max(from.y, to.y)))
  const side = Math.sign(to.x - from.x) || -1
  const end = { x: to.x, y: to.y + ARROW_GAP }
  return {
    d: [
      `M${from.x} ${from.y + ARROW_GAP}`,
      `V${floor - r}`,
      `Q${from.x} ${floor} ${from.x + side * r} ${floor}`,
      `H${to.x - side * r}`,
      `Q${to.x} ${floor} ${to.x} ${floor - r}`,
      `V${end.y}`,
    ].join(''),
    arrow: `M${end.x - ARROW * 0.8} ${end.y + ARROW}L${end.x} ${end.y}L${end.x + ARROW * 0.8} ${end.y + ARROW}`,
    labelAt: { x: (from.x + to.x) / 2, y: floor },
  }
}

/** Slow in, slow out: what a ball does between two nodes */
export function easeInOut(t: number): number {
  return (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, t)))) / 2
}

export interface SpringState { x: number, v: number }

/**
 * Moves `state` towards `target` as a critically damped spring: it never overshoots, and since it
 * keeps its velocity, retargeting mid-flight bends the motion instead of restarting it.
 * Closed-form, so the result does not depend on the frame rate.
 */
export function springStep(state: SpringState, target: number, dt: number, omega = 22): void {
  const offset = state.x - target
  const c2 = state.v + omega * offset
  const decay = Math.exp(-omega * dt)
  state.x = target + (offset + c2 * dt) * decay
  state.v = (c2 - omega * (offset + c2 * dt)) * decay
}

export function springSettled(state: SpringState, target: number): boolean {
  return Math.abs(state.x - target) < 0.1 && Math.abs(state.v) < 1
}
