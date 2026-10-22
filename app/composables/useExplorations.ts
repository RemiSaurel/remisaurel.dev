/** Drafts are benches for components: listed while developing, never in production. */
export const SHOW_DRAFTS = import.meta.dev

/** The explorations a visitor can open, newest first. Shared by the nav and /explorations. */
export function useExplorations() {
  return useAsyncData('explorations', async () => {
    const all = await queryCollection('explorations')
      .select('path', 'title', 'description', 'date', 'tags', 'status', 'icon')
      .order('date', 'DESC')
      .all()
    return all.filter(exploration => SHOW_DRAFTS || exploration.status !== 'draft')
  }, { default: () => [] })
}
