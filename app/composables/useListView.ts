export type ListView = 'list' | 'card'

/**
 * Shared morph for list <-> card switches. A tween rather than a spring: a spring's
 * settling tail leaves text drifting by sub-pixels, which reads as blur at the end.
 */
export const VIEW_MORPH_TRANSITION = { type: 'tween', duration: 0.45, ease: [0.32, 0.72, 0, 1] } as const

const STORAGE_PREFIX = 'list-view:'

/**
 * Display mode for a collection (publications, news...), shared between the switcher
 * in the section header and the list itself, and remembered across visits.
 *
 * The site is statically generated, so the first render is always `list`; the stored
 * choice is applied after mount with `isRestoring` set, letting the list swap layouts
 * without playing the morph on page load.
 */
export function useListView(key: string) {
  const view = useState<ListView>(`list-view-${key}`, () => 'list')
  const isRestoring = useState(`list-view-restoring-${key}`, () => false)

  onMounted(() => {
    let stored: string | null = null
    try {
      stored = localStorage.getItem(STORAGE_PREFIX + key)
    }
    catch {}
    if ((stored === 'list' || stored === 'card') && stored !== view.value) {
      isRestoring.value = true
      view.value = stored
      requestAnimationFrame(() => requestAnimationFrame(() => {
        isRestoring.value = false
      }))
    }
  })

  watch(view, (value) => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, value)
    }
    catch {}
  })

  return {
    view,
    isRestoring,
  }
}
