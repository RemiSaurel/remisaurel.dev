/** A node's measured footprint in graph design space. */
export interface RegionBox {
  x: number
  y: number
  hw: number
  hh: number
}

export interface Region {
  x: number
  y: number
  width: number
  height: number
}

const CANVAS_W = 1000
const CANVAS_H = 460

/** Rounded rectangle wrapping every box, padded evenly on each side, clamped within canvas. */
export function regionRect(boxes: RegionBox[], padding = 26): Region | null {
  if (!boxes.length)
    return null

  const minX = Math.max(0, Math.min(...boxes.map(b => b.x - b.hw)) - padding)
  const maxX = Math.min(CANVAS_W, Math.max(...boxes.map(b => b.x + b.hw)) + padding)
  const minY = Math.max(0, Math.min(...boxes.map(b => b.y - b.hh)) - padding)
  const maxY = Math.min(CANVAS_H, Math.max(...boxes.map(b => b.y + b.hh)) + padding)

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
