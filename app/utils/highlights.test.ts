import { describe, expect, it } from 'vitest'
import { addHighlight, createQuote, hueToHex, isHexColor, locateQuote, parseQuotes, trimSpan } from './highlights'

const text = 'The cat sat. The cat ran. A dog sat.'

describe('trimSpan', () => {
  it('drops surrounding whitespace', () => {
    expect(trimSpan('  hello  ', { start: 0, end: 9 })).toEqual({ start: 2, end: 7 })
  })

  it('returns null for a blank selection', () => {
    expect(trimSpan('a   b', { start: 1, end: 4 })).toBeNull()
  })
})

describe('locateQuote', () => {
  it('finds the occurrence whose context matches', () => {
    const second = text.indexOf('cat', 10)
    const quote = createQuote(text, { start: second, end: second + 3 }, 'a', '#facc15')
    expect(locateQuote(text, quote)).toEqual({ start: second, end: second + 3 })
  })

  it('follows the text when it moves', () => {
    const quote = createQuote(text, { start: 4, end: 7 }, 'a', '#facc15')
    const moved = `Intro. ${text}`
    expect(locateQuote(moved, quote)).toEqual({ start: 11, end: 14 })
  })

  it('returns null once the quoted text is gone', () => {
    const quote = createQuote(text, { start: 21, end: 26 }, 'a', '#facc15')
    expect(locateQuote('Nothing left.', quote)).toBeNull()
  })
})

describe('addHighlight', () => {
  it('merges overlapping and touching highlights into one', () => {
    let quotes = addHighlight(text, [], { start: 0, end: 7 }, 'a', '#facc15')
    quotes = addHighlight(text, quotes, { start: 4, end: 12 }, 'b', '#60a5fa')
    expect(quotes).toHaveLength(1)
    expect(quotes[0]).toMatchObject({ id: 'b', color: '#60a5fa', exact: 'The cat sat.' })
    quotes = addHighlight(text, quotes, { start: 12, end: 17 }, 'c', '#60a5fa')
    expect(quotes).toHaveLength(1)
    expect(quotes[0]!.exact).toBe('The cat sat. The ')
  })

  it('absorbs a chain of highlights bridged by the new one', () => {
    let quotes = addHighlight(text, [], { start: 0, end: 3 }, 'a', '#facc15')
    quotes = addHighlight(text, quotes, { start: 13, end: 16 }, 'b', '#facc15')
    quotes = addHighlight(text, quotes, { start: 2, end: 14 }, 'c', '#facc15')
    expect(quotes).toHaveLength(1)
    expect(quotes[0]!.exact).toBe('The cat sat. The')
  })

  it('keeps separate highlights apart', () => {
    let quotes = addHighlight(text, [], { start: 0, end: 3 }, 'a', '#facc15')
    quotes = addHighlight(text, quotes, { start: 26, end: 31 }, 'b', '#facc15')
    expect(quotes.map(q => q.exact)).toEqual(['The', 'A dog'])
  })
})

describe('parseQuotes', () => {
  it('reads what it stored', () => {
    const quotes = addHighlight(text, [], { start: 0, end: 3 }, 'a', '#facc15')
    expect(parseQuotes(JSON.stringify(quotes))).toEqual(quotes)
  })

  it('ignores corrupted or malformed data', () => {
    expect(parseQuotes(null)).toEqual([])
    expect(parseQuotes('{nope')).toEqual([])
    expect(parseQuotes('{"a":1}')).toEqual([])
    expect(parseQuotes('[{"id":"a","color":"red","exact":"x","prefix":"","suffix":""}]')).toEqual([])
  })
})

describe('colors', () => {
  it('validates hex colors', () => {
    expect(isHexColor('#facc15')).toBe(true)
    expect(isHexColor('facc15')).toBe(false)
    expect(isHexColor('#fff')).toBe(false)
  })

  it('maps a hue to a valid hex', () => {
    expect(isHexColor(hueToHex(0))).toBe(true)
    expect(isHexColor(hueToHex(200))).toBe(true)
    expect(hueToHex(360)).toBe(hueToHex(0))
  })
})
