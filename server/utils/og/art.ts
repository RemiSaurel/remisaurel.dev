/**
 * Draws a /lab composition as plain SVG markup, in the 400 × 200 frame of the site's illustrations.
 * It mirrors PubArt.vue (same shapes, same transforms) minus what a rasterizer can't do: glow
 * layers need CSS color functions and are skipped, so OG compositions stick to the line layers.
 */

import type { ArtComposition, ArtNode, ArtNodeColor, ArtTheme } from '../../../app/art/art'
import { ART_PALETTES, colorPair, drawLayer, isGroup, nodeTransform } from '../../../app/art/art'

export interface ArtRenderOptions {
  theme: ArtTheme
  /** Stroke width in frame units: the frame is scaled up, so it is the screen width divided by the scale. */
  stroke: number
}

interface Paint {
  bg: string
  ink: string
}

function attr(value: number | string | undefined, name: string) {
  return value === undefined ? '' : ` ${name}="${value}"`
}

function paintFor(color: ArtNodeColor | undefined, parent: Paint, theme: ArtTheme): Paint {
  return color ? { bg: parent.bg, ink: colorPair(color)[theme] } : parent
}

function renderNode(node: ArtNode, parent: Paint, options: ArtRenderOptions): string {
  if (!node.visible)
    return ''
  const paint = paintFor(node.color, parent, options.theme)
  const stroke = (node.stroke ?? 1) * options.stroke
  const opacity = node.opacity === 1 ? undefined : node.opacity
  const open = `<g transform="${nodeTransform(node)}"${attr(opacity, 'opacity')}>`

  if (isGroup(node))
    return `${open}${node.children.map(child => renderNode(child, paint, options)).join('')}</g>`
  if (node.type === 'glow')
    return ''

  const dash = `${3 * stroke} ${3 * stroke}`
  const shapes = drawLayer(node).map((shape) => {
    if (shape.kind === 'path') {
      const fill = shape.filled ? paint.ink : 'none'
      const alpha = shape.opacity ?? 1
      return `<path d="${shape.d}" fill="${fill}" stroke="${paint.ink}" stroke-opacity="${alpha}"${shape.filled ? ` fill-opacity="${alpha}"` : ''} stroke-width="${stroke}"${shape.dashed ? ` stroke-dasharray="${dash}"` : ''}/>`
    }
    return `<circle cx="${shape.x}" cy="${shape.y}" r="${shape.r}" fill="${shape.filled ? paint.ink : paint.bg}" stroke="${paint.ink}"${attr(shape.opacity, 'opacity')} stroke-width="${stroke}"/>`
  })
  return `${open}${shapes.join('')}</g>`
}

/** The layers of a composition, ready to drop in a `<g>` that maps the 400 × 200 frame onto the canvas. */
export function renderArtLayers(composition: ArtComposition, options: ArtRenderOptions) {
  const paint = { bg: ART_PALETTES[options.theme].bg, ink: ART_PALETTES[options.theme].ink }
  const body = composition.layers.map(node => renderNode(node, paint, options)).join('')
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</g>`
}
