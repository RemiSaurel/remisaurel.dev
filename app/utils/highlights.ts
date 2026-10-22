export interface TextSpan {
  start: number
  end: number
}

// A highlight is stored as a quote of the text, not as DOM positions: it survives layout and
// component changes, and only breaks when the quoted text itself changes
export interface HighlightQuote {
  id: string
  color: string
  exact: string
  prefix: string
  suffix: string
}

export const HIGHLIGHT_SWATCHES = [
  '#facc15',
  '#fb923c',
  '#f87171',
  '#f472b6',
  '#c084fc',
  '#60a5fa',
  '#2dd4bf',
  '#4ade80',
]

export const DEFAULT_HIGHLIGHT_COLOR = HIGHLIGHT_SWATCHES[0]!

const CONTEXT_LENGTH = 32
const HEX_COLOR = /^#[0-9a-f]{6}$/i

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value)
}

// Hue in [0, 360) to a highlighter-friendly hex (vivid but light, readable under dark text)
export function hueToHex(hue: number) {
  const h = (((hue % 360) + 360) % 360) / 60
  const s = 0.9
  const l = 0.62
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h % 2) - 1))
  const m = l - c / 2
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h) % 6]!
  const channel = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

export function trimSpan(text: string, span: TextSpan): TextSpan | null {
  let { start, end } = span
  while (start < end && /\s/.test(text[start]!)) start++
  while (end > start && /\s/.test(text[end - 1]!)) end--
  return start < end ? { start, end } : null
}

export function createQuote(text: string, span: TextSpan, id: string, color: string): HighlightQuote {
  return {
    id,
    color,
    exact: text.slice(span.start, span.end),
    prefix: text.slice(Math.max(0, span.start - CONTEXT_LENGTH), span.start),
    suffix: text.slice(span.end, span.end + CONTEXT_LENGTH),
  }
}

function commonSuffixLength(a: string, b: string) {
  let n = 0
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++
  return n
}

function commonPrefixLength(a: string, b: string) {
  let n = 0
  while (n < a.length && n < b.length && a[n] === b[n]) n++
  return n
}

// Where the quote sits in the text now. When the quoted text occurs several times, the
// occurrence whose surroundings match best wins
export function locateQuote(text: string, quote: HighlightQuote): TextSpan | null {
  let best: TextSpan | null = null
  let bestScore = -1
  let from = text.indexOf(quote.exact)
  while (from !== -1) {
    const before = text.slice(Math.max(0, from - quote.prefix.length), from)
    const after = text.slice(from + quote.exact.length, from + quote.exact.length + quote.suffix.length)
    const score = commonSuffixLength(before, quote.prefix) + commonPrefixLength(after, quote.suffix)
    if (score > bestScore) {
      bestScore = score
      best = { start: from, end: from + quote.exact.length }
    }
    from = text.indexOf(quote.exact, from + 1)
  }
  return best
}

// Adds a highlight; the ones it overlaps or touches are absorbed into a single one, whatever
// their colour. Quotes that cannot be located are kept untouched
export function addHighlight(text: string, quotes: HighlightQuote[], span: TextSpan, id: string, color: string) {
  const located = quotes.map(quote => ({ quote, span: locateQuote(text, quote) }))
  const kept = located.filter(item => !item.span).map(item => item.quote)
  let pending = located.filter(item => item.span)
  let merged = { ...span }

  let absorbed = true
  while (absorbed) {
    absorbed = false
    const rest = []
    for (const item of pending) {
      const s = item.span!
      if (s.start <= merged.end && s.end >= merged.start) {
        merged = { start: Math.min(s.start, merged.start), end: Math.max(s.end, merged.end) }
        absorbed = true
      }
      else {
        rest.push(item)
      }
    }
    pending = rest
  }

  return [...kept, ...pending.map(item => item.quote), createQuote(text, merged, id, color)]
}

export function parseQuotes(raw: string | null): HighlightQuote[] {
  if (!raw)
    return []
  try {
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data))
      return []
    return data.filter((item): item is HighlightQuote =>
      !!item
      && typeof item.id === 'string'
      && isHexColor(item.color)
      && typeof item.exact === 'string'
      && item.exact.length > 0
      && typeof item.prefix === 'string'
      && typeof item.suffix === 'string',
    )
  }
  catch {
    return []
  }
}
