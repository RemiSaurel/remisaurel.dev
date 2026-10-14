/**
 * OG images: the site's look drawn as one SVG (grid, hairlines, Instrument Sans, a /lab
 * illustration) and rasterized by resvg, which, unlike satori, can follow the illustration's strokes
 * and dashes exactly. SVG has no text wrapping, so lines are broken here, measured with the real font.
 */

import type { ArtComposition } from '../../../app/art/art'
import { resolve } from 'node:path'
import process from 'node:process'
import { Resvg } from '@resvg/resvg-js'
import { ART_HEIGHT, ART_PALETTES, ART_WIDTH, GRID_STEP } from '../../../app/art/art'
import { renderArtLayers } from './art'

const WIDTH = 1200
const HEIGHT = 630
const PADDING = 72
const TEXT_WIDTH = 570
const DESCRIPTION_WIDTH = 480

const FONT_FAMILY = 'Instrument Sans'
const FONT_DIR = resolve(process.cwd(), 'server/assets/fonts')

const THEME = ART_PALETTES.light
const MUTED = '#737373'
const HAIRLINE = '#d4d4d4'

/** The frame is drawn at this scale, its centre sitting right of the text column. */
const ART_SCALE = 2.25
const ART_CENTER = { x: 920, y: 315 }
const ART_STROKE_PX = 1.6

export interface OgImageOptions {
  title: string
  description?: string
  /** Small tag under the name, like the venue tags of the publications list. */
  label?: string
  /** Shown bottom left after the domain. */
  date?: Date
  composition: ArtComposition
}

const fontOptions = {
  loadSystemFonts: false,
  fontDirs: [FONT_DIR],
  defaultFontFamily: FONT_FAMILY,
}

/** Emoji have no glyph in Instrument Sans: they would render as empty boxes. */
function plain(text: string) {
  return text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').replace(/\s+/g, ' ').trim()
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[char]!)
}

interface TextStyle {
  size: number
  weight: number
  /** In em, like the CSS property. */
  tracking?: number
}

function textAttributes({ size, weight, tracking = 0 }: TextStyle) {
  return `font-family="${FONT_FAMILY}" font-size="${size}" font-weight="${weight}" letter-spacing="${tracking * size}"`
}

const measured = new Map<string, number>()

function measure(text: string, style: TextStyle) {
  const key = `${style.size}|${style.weight}|${style.tracking ?? 0}|${text}`
  const cached = measured.get(key)
  if (cached !== undefined)
    return cached
  const probe = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="400"><text x="0" y="200" ${textAttributes(style)} xml:space="preserve">${escapeXml(text)}</text></svg>`
  const width = new Resvg(probe, { font: fontOptions }).getBBox()?.width ?? 0
  measured.set(key, width)
  return width
}

/** Greedy line breaking: every line is measured whole, so kerning and tracking are counted. */
function wrap(text: string, style: TextStyle, maxWidth: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word
    if (!line || measure(candidate, style) <= maxWidth) {
      line = candidate
      continue
    }
    lines.push(line)
    line = word
  }
  if (line)
    lines.push(line)
  return lines
}

/** Keeps the first `maxLines` lines, the last one cut with an ellipsis if text was left over. */
function clamp(lines: string[], maxLines: number, style: TextStyle, maxWidth: number) {
  if (lines.length <= maxLines)
    return lines
  const kept = lines.slice(0, maxLines)
  let last = `${kept.at(-1)} ${lines[maxLines]}`.split(' ')
  while (last.length > 1 && measure(`${last.join(' ')}…`, style) > maxWidth)
    last = last.slice(0, -1)
  kept[maxLines - 1] = `${last.join(' ').replace(/[\s,.;:–-]+$/, '')}…`
  return kept
}

// Title sizes, largest first: the first one that fits its line budget wins
const TITLE_SIZES = [
  { size: 84, maxLines: 2 },
  { size: 68, maxLines: 3 },
  { size: 56, maxLines: 3 },
  { size: 46, maxLines: 4 },
]

function fitTitle(title: string) {
  for (const { size, maxLines } of TITLE_SIZES) {
    const style: TextStyle = { size, weight: 600, tracking: -0.018 }
    const lines = wrap(title, style, TEXT_WIDTH)
    if (lines.length <= maxLines)
      return { style, lines }
  }
  const style: TextStyle = { size: 46, weight: 600, tracking: -0.018 }
  return { style, lines: clamp(wrap(title, style, TEXT_WIDTH), 4, style, TEXT_WIDTH) }
}

function grid() {
  const step = GRID_STEP * ART_SCALE
  const originX = ART_CENTER.x - ART_WIDTH * ART_SCALE / 2
  const originY = ART_CENTER.y - ART_HEIGHT * ART_SCALE / 2
  let d = ''
  for (let x = originX % step; x < WIDTH; x += step)
    d += `M${x} 0V${HEIGHT}`
  for (let y = originY % step; y < HEIGHT; y += step)
    d += `M0 ${y}H${WIDTH}`
  return `<path d="${d}" fill="none" stroke="${THEME.ink}" stroke-opacity="0.07" stroke-width="1"/>`
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export function ogImageSvg({ title: rawTitle, description: rawDescription, label, date, composition }: OgImageOptions) {
  const title = plain(rawTitle)
  const description = rawDescription && plain(rawDescription)
  const { style: titleStyle, lines: titleLines } = fitTitle(title)
  const titleLeading = Math.round(titleStyle.size * 1.08)

  const descriptionStyle: TextStyle = { size: 28, weight: 400 }
  const descriptionLines = description ? clamp(wrap(description, descriptionStyle, DESCRIPTION_WIDTH), titleLines.length >= 3 ? 2 : 3, descriptionStyle, DESCRIPTION_WIDTH) : []
  const descriptionLeading = 40
  const descriptionGap = descriptionLines.length ? 28 : 0

  // The text block is centred between the header and the footer
  const blockHeight = titleLines.length * titleLeading + descriptionGap + descriptionLines.length * descriptionLeading
  const top = 140 + (350 - blockHeight) / 2
  const titleBaseline = top + titleStyle.size * 0.86
  const descriptionTop = top + titleLines.length * titleLeading + descriptionGap

  const nameStyle: TextStyle = { size: 26, weight: 600, tracking: -0.01 }
  const labelStyle: TextStyle = { size: 18, weight: 500 }
  const nameWidth = measure('Rémi Saurel', nameStyle)
  const labelWidth = label ? measure(label, labelStyle) : 0
  const chipX = PADDING + nameWidth + 20
  const footer = date ? `remisaurel.dev  ·  ${formatDate(date)}` : 'remisaurel.dev'

  const art = renderArtLayers(composition, { theme: 'light', stroke: ART_STROKE_PX / ART_SCALE })
  const artX = ART_CENTER.x - ART_WIDTH * ART_SCALE / 2
  const artY = ART_CENTER.y - ART_HEIGHT * ART_SCALE / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="scrim" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="${THEME.bg}" stop-opacity="1"/>
      <stop offset="0.74" stop-color="${THEME.bg}" stop-opacity="1"/>
      <stop offset="1" stop-color="${THEME.bg}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${THEME.bg}"/>
  ${grid()}
  <g transform="translate(${artX} ${artY}) scale(${ART_SCALE})">${art}</g>
  <rect width="760" height="${HEIGHT}" fill="url(#scrim)"/>
  <text x="${PADDING}" y="88" fill="${THEME.ink}" ${textAttributes(nameStyle)}>Rémi Saurel</text>
  ${label
    ? `<rect x="${chipX}" y="62" width="${labelWidth + 24}" height="34" fill="none" stroke="${HAIRLINE}" stroke-width="1.5"/>
  <text x="${chipX + 12}" y="85" fill="${MUTED}" ${textAttributes(labelStyle)}>${escapeXml(label)}</text>`
    : ''}
  ${titleLines.map((line, i) => `<text x="${PADDING}" y="${titleBaseline + i * titleLeading}" fill="${THEME.ink}" ${textAttributes(titleStyle)}>${escapeXml(line)}</text>`).join('\n  ')}
  ${descriptionLines.map((line, i) => `<text x="${PADDING}" y="${descriptionTop + 28 + i * descriptionLeading}" fill="${MUTED}" ${textAttributes(descriptionStyle)}>${escapeXml(line)}</text>`).join('\n  ')}
  <text x="${PADDING}" y="${HEIGHT - 56}" fill="${MUTED}" ${textAttributes({ size: 22, weight: 500 })} xml:space="preserve">${escapeXml(footer)}</text>
</svg>`
}

export function renderOgImage(options: OgImageOptions) {
  return new Resvg(ogImageSvg(options), { font: fontOptions, fitTo: { mode: 'width', value: WIDTH } }).render().asPng()
}
