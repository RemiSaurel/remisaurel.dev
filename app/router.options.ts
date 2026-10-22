import type { RouterConfig } from '@nuxt/schema'

// The global `scroll-behavior: smooth` made the reset to the top animate: the new page
// appeared at the old scroll offset, then slid up. Page changes now jump to the top at
// once, before the new page enters; only hash links keep the smooth scroll.
export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (to.path === from.path)
      return to.hash ? { el: to.hash, behavior: 'smooth' } : false
    if (savedPosition)
      return { ...savedPosition, behavior: 'instant' }
    if (to.hash)
      return { el: to.hash, behavior: 'instant' }

    // Out-in transition: wait for the old page to finish leaving, so it doesn't jump while fading out
    return new Promise((resolve) => {
      useNuxtApp().hooks.hookOnce('page:transition:finish', () => {
        resolve({ left: 0, top: 0, behavior: 'instant' })
      })
    })
  },
}
