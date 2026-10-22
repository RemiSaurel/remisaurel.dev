import type { MaybeRefOrGetter } from 'vue'
import type { HighlightQuote } from '~/utils/highlights'
import { useDebounceFn, useMutationObserver } from '@vueuse/core'
import { nextTick, onScopeDispose, readonly, ref, toValue, watch } from 'vue'
import { addHighlight, locateQuote, parseQuotes, trimSpan } from '~/utils/highlights'

interface TextIndex {
  text: string
  nodes: { node: Text, start: number }[]
}

// The text of `root` as one string, with where each text node starts in it
function indexText(root: HTMLElement): TextIndex {
  const nodes: TextIndex['nodes'] = []
  let text = ''
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    nodes.push({ node: node as Text, start: text.length })
    text += node.nodeValue
  }
  return { text, nodes }
}

function offsetOf(index: TextIndex, container: Node, offset: number) {
  // A boundary inside an element is expressed by its child index: the offset is the start of
  // the child at that index (or the end of the last one)
  if (container.nodeType !== Node.TEXT_NODE) {
    const probe = document.createRange()
    probe.setStart(container, offset)
    probe.collapse(true)
    const next = index.nodes.find(({ node }) => probe.comparePoint(node, 0) >= 0)
    return next ? next.start : index.text.length
  }
  const found = index.nodes.find(({ node }) => node === container)
  return found ? found.start + offset : null
}

function rangeFor(index: TextIndex, start: number, end: number) {
  const locate = (position: number, isEnd: boolean) => {
    const found = index.nodes.find(({ node, start: s }) => isEnd
      ? position > s && position <= s + node.length
      : position >= s && position < s + node.length)
    return found ? { node: found.node, offset: position - found.start } : null
  }
  const from = locate(start, false)
  const to = locate(end, true)
  if (!from || !to)
    return null
  const range = document.createRange()
  range.setStart(from.node, from.offset)
  range.setEnd(to.node, to.offset)
  return range
}

function supportsHighlightApi() {
  return import.meta.client && typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined'
}

const REGISTRY_PREFIX = 'user-hl-'

// Highlights the reader makes in `root`, saved in localStorage under `storageKey`. They are
// painted with the CSS Custom Highlight API, so the DOM (and its hydration) is never touched
export function useHighlights(root: MaybeRefOrGetter<HTMLElement | null>, storageKey: MaybeRefOrGetter<string>) {
  const supported = ref(false)
  const quotes = ref<HighlightQuote[]>([])
  const ranges = new Map<string, Range>()
  // What this instance put in the page-wide registry: another instance (the page we are
  // leaving, or the one we are entering) may share the same names, so only remove our own
  const painted = new Map<string, Highlight>()
  let sheet: CSSStyleSheet | null = null

  const fullKey = () => `highlights:${toValue(storageKey)}`

  function load() {
    try {
      quotes.value = parseQuotes(localStorage.getItem(fullKey()))
    }
    catch {
      quotes.value = []
    }
  }

  function save() {
    try {
      if (quotes.value.length)
        localStorage.setItem(fullKey(), JSON.stringify(quotes.value))
      else
        localStorage.removeItem(fullKey())
    }
    catch {}
  }

  function clearPainting() {
    for (const [name, highlight] of painted) {
      if (CSS.highlights.get(name) === highlight)
        CSS.highlights.delete(name)
    }
    painted.clear()
  }

  function paint() {
    clearPainting()
    const byColor = new Map<string, Range[]>()
    for (const quote of quotes.value) {
      const range = ranges.get(quote.id)
      if (range)
        byColor.set(quote.color, [...(byColor.get(quote.color) ?? []), range])
    }
    if (!sheet) {
      sheet = new CSSStyleSheet()
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
    }
    const rules: string[] = []
    for (const [color, group] of byColor) {
      const name = `${REGISTRY_PREFIX}${color.slice(1).toLowerCase()}`
      const highlight = new Highlight(...group)
      CSS.highlights.set(name, highlight)
      painted.set(name, highlight)
      rules.push(`::highlight(${name}) { background-color: color-mix(in srgb, ${color} 45%, transparent); color: inherit; }`)
    }
    sheet.replaceSync(rules.join('\n'))
  }

  // Locates every quote in the current DOM again. Quotes that cannot be found stay stored (the
  // text may come back) but are not painted
  function refresh() {
    ranges.clear()
    const el = toValue(root)
    if (el) {
      const index = indexText(el)
      for (const quote of quotes.value) {
        const span = locateQuote(index.text, quote)
        const range = span && rangeFor(index, span.start, span.end)
        if (range)
          ranges.set(quote.id, range)
      }
    }
    if (supported.value)
      paint()
  }

  function add(selection: Range, color: string) {
    const el = toValue(root)
    if (!el)
      return
    const index = indexText(el)
    const start = offsetOf(index, selection.startContainer, selection.startOffset)
    const end = offsetOf(index, selection.endContainer, selection.endOffset)
    const span = start !== null && end !== null ? trimSpan(index.text, { start, end }) : null
    if (!span)
      return
    quotes.value = addHighlight(index.text, quotes.value, span, crypto.randomUUID(), color)
    save()
    refresh()
  }

  function remove(id: string) {
    quotes.value = quotes.value.filter(quote => quote.id !== id)
    save()
    refresh()
  }

  function recolor(id: string, color: string) {
    const el = toValue(root)
    const quote = quotes.value.find(item => item.id === id)
    const range = ranges.get(id)
    if (!el || !quote || !range)
      return
    // Recoloured next to a highlight of the new colour: add() merges them
    const index = indexText(el)
    const span = locateQuote(index.text, quote)
    if (!span)
      return
    quotes.value = addHighlight(index.text, quotes.value.filter(item => item.id !== id), span, id, color)
    save()
    refresh()
  }

  function rangeOf(id: string) {
    return ranges.get(id) ?? null
  }

  // The highlight under a viewport point, if any
  function idAt(x: number, y: number) {
    for (const [id, range] of ranges) {
      for (const rect of range.getClientRects()) {
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
          return id
      }
    }
    return null
  }

  watch(
    [() => toValue(root), () => toValue(storageKey)],
    ([el]) => {
      if (!el || !import.meta.client)
        return
      supported.value = supportsHighlightApi()
      if (!supported.value)
        return
      load()
      // The content of a new page is rendered by the time the DOM has settled
      nextTick(refresh)
    },
    { immediate: true, flush: 'post' },
  )

  // Content that renders after mount (async components) shifts the text: locate again.
  // Painting never touches the DOM, so this cannot loop
  useMutationObserver(() => toValue(root), useDebounceFn(() => {
    if (supported.value)
      refresh()
  }, 120), { childList: true, subtree: true, characterData: true })

  onScopeDispose(() => {
    if (!import.meta.client)
      return
    if (supported.value)
      clearPainting()
    if (sheet)
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(s => s !== sheet)
  })

  return {
    supported: readonly(supported),
    quotes: readonly(quotes),
    add,
    remove,
    recolor,
    rangeOf,
    idAt,
  }
}
