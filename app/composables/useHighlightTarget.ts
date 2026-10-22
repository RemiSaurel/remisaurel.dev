import type { MaybeRefOrGetter } from 'vue'
import { useDebounceFn, useEventListener } from '@vueuse/core'
import { ref, shallowRef, toValue } from 'vue'

export interface HighlightTarget {
  range: Range
  // Set when the target is an existing highlight, absent for a fresh text selection
  id: string | null
}

export interface HighlightLookup {
  idAt: (x: number, y: number) => string | null
  rangeOf: (id: string) => Range | null
}

// Anything that is not prose: selecting there should not offer to highlight
const EXCLUDED = 'button, input, textarea, select, [data-no-highlight]'

function isHighlightable(root: HTMLElement, range: Range) {
  if (range.collapsed || !root.contains(range.commonAncestorContainer))
    return false
  const container = range.commonAncestorContainer
  const element = container instanceof Element ? container : container.parentElement
  return !element?.closest(EXCLUDED)
}

// What the highlight toolbar points at: the text the reader just selected, or an existing
// highlight they clicked. `rect` follows it while the page scrolls
export function useHighlightTarget(root: MaybeRefOrGetter<HTMLElement | null>, lookup: HighlightLookup) {
  const target = shallowRef<HighlightTarget | null>(null)
  const rect = ref<DOMRect | null>(null)

  function updateRect() {
    rect.value = target.value ? target.value.range.getBoundingClientRect() : null
  }

  function set(next: HighlightTarget | null) {
    target.value = next
    updateRect()
  }

  function dismiss() {
    set(null)
  }

  const onSelectionChange = useDebounceFn(() => {
    const el = toValue(root)
    // Typing a hex colour in the toolbar moves the selection: keep the target meanwhile
    if (document.activeElement?.closest('[data-highlight-toolbar]'))
      return
    const selection = document.getSelection()
    if (!el || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
      // A collapsed selection also happens when clicking an existing highlight: let the click
      // handler decide, only drop a fresh selection
      if (target.value && !target.value.id)
        dismiss()
      return
    }
    const range = selection.getRangeAt(0).cloneRange()
    set(isHighlightable(el, range) ? { range, id: null } : null)
  }, 150)

  useEventListener(() => document, 'selectionchange', onSelectionChange)

  useEventListener(root, 'click', (event: MouseEvent) => {
    if (!document.getSelection()?.isCollapsed)
      return
    const id = lookup.idAt(event.clientX, event.clientY)
    const range = id ? lookup.rangeOf(id) : null
    set(id && range ? { range, id } : null)
  })

  useEventListener(() => window, 'scroll', updateRect, { passive: true })
  useEventListener(() => window, 'resize', updateRect, { passive: true })
  useEventListener(() => document, 'keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape')
      dismiss()
  })

  return { target, rect, dismiss }
}
