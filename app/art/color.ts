/**
 * Just enough color math for the lab's custom colors: hex for storage, HSV for the picker,
 * and OKLCH to derive a color's counterpart on the other theme at the same perceived weight.
 */

export interface Rgb { r: number, g: number, b: number }
export interface Hsv { h: number, s: number, v: number }

const HEX = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

export function isHex(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value)
}

/** `abc`, `#abc`, `#AABBCC` → `#aabbcc`, or null when it isn't a color. */
export function normalizeHex(value: string) {
  const text = value.trim()
  if (!HEX.test(text))
    return null
  const digits = text.replace('#', '').toLowerCase()
  return `#${digits.length === 3 ? [...digits].map(digit => digit + digit).join('') : digits}`
}

export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(normalizeHex(hex)!.slice(1), 16)
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }
}

export function rgbToHex({ r, g, b }: Rgb) {
  const channel = (value: number) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const [red, green, blue] = [r / 255, g / 255, b / 255]
  const max = Math.max(red, green, blue)
  const delta = max - Math.min(red, green, blue)
  let h = 0
  if (delta) {
    if (max === red)
      h = ((green - blue) / delta + 6) % 6
    else if (max === green)
      h = (blue - red) / delta + 2
    else
      h = (red - green) / delta + 4
  }
  return { h: h * 60, s: max ? delta / max : 0, v: max }
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const channel = (n: number) => {
    const k = (n + h / 60) % 6
    return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255
  }
  return { r: channel(5), g: channel(3), b: channel(1) }
}

// OKLab (Björn Ottosson), through linear sRGB

function toLinear(channel: number) {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function fromLinear(channel: number) {
  const c = channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055
  return c * 255
}

function rgbToOklch(rgb: Rgb) {
  const [r, g, b] = [toLinear(rgb.r), toLinear(rgb.g), toLinear(rgb.b)]
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  return { l: L, c: Math.hypot(A, B), h: Math.atan2(B, A) }
}

/** Linear sRGB, possibly out of gamut: the caller decides what to do about it. */
function oklchToLinear(L: number, C: number, H: number) {
  const A = C * Math.cos(H)
  const B = C * Math.sin(H)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ] as const
}

/** Keeps lightness and hue, and gives up just enough chroma to land inside sRGB. */
function oklchToHex(L: number, C: number, H: number) {
  const inGamut = (chroma: number) => oklchToLinear(L, chroma, H).every(channel => channel >= -0.0001 && channel <= 1.0001)
  let chroma = C
  if (!inGamut(chroma)) {
    let low = 0
    for (let i = 0; i < 16; i++) {
      const mid = (low + chroma) / 2
      if (inGamut(mid))
        low = mid
      else
        chroma = mid
    }
    chroma = low
  }
  const [r, g, b] = oklchToLinear(L, chroma, H)
  return rgbToHex({ r: fromLinear(Math.max(0, r)), g: fromLinear(Math.max(0, g)), b: fromLinear(Math.max(0, b)) })
}

// The two art backgrounds (#f5f5f5, #0a0a0a) in OKLCH lightness
const LIGHT_GROUND = 0.97
const DARK_GROUND = 0.145
/** Neutrals mirror around mid-gray, a little further out on the dark ground: 0.55 ↔ 0.71. */
const DARK_STRETCH = 1.33
/** Hues keep their character and step up in lightness, like the built-in 600 → 400 pairs. */
const HUE_SHIFT = 0.16
/** Below this chroma a color reads as gray, and gray has to flip rather than shift. */
const NEUTRAL_CHROMA = 0.04

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** The same color for the other theme, kept within a band that stays readable on it. */
export function counterpartColor(hex: string, to: 'light' | 'dark') {
  const { l, c, h } = rgbToOklch(hexToRgb(hex))
  const neutral = c < NEUTRAL_CHROMA
  const lightness = to === 'dark'
    ? clamp(neutral ? DARK_GROUND + (LIGHT_GROUND - l) * DARK_STRETCH : l + HUE_SHIFT, 0.62, 0.985)
    : clamp(neutral ? LIGHT_GROUND - (l - DARK_GROUND) / DARK_STRETCH : l - HUE_SHIFT, 0.2, 0.75)
  return oklchToHex(lightness, c, h)
}
