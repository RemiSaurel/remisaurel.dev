/** Drafts are benches for components: openable while developing, a non-clickable teaser in production. */
export const SHOW_DRAFTS = import.meta.dev

/** Every exploration, drafts included (see `SHOW_DRAFTS`), newest first. Shared by the nav, the home and /explorations. */
export function useExplorations() {
  return useAsyncData('explorations', () => queryCollection('explorations')
    .select('path', 'title', 'description', 'date', 'tags', 'status', 'icon')
    .order('date', 'DESC')
    .all(), { default: () => [] })
}
