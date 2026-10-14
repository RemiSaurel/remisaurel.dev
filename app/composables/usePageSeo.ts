import type { MaybeRefOrGetter } from 'vue'

const SITE_NAME = 'Rémi Saurel'

export interface PageSeoOptions {
  /** Page title, without the site name (added by the title template). Omit for the home page. */
  title?: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  type?: 'website' | 'article'
  /** ISO date, only used when `type` is `article` */
  publishedAt?: MaybeRefOrGetter<string | undefined>
  /** Path whose OG image is shown: the page's own by default, the home one for pages that have none. */
  ogPath?: string
  noindex?: boolean
}

/**
 * Title, description, canonical url and OG/Twitter card of the current page. Static pages are
 * described in `SEO_PAGES`, so with no options it reads the entry of the current route.
 */
export function usePageSeo(options: PageSeoOptions = {}) {
  const route = useRoute()
  const { siteUrl } = useRuntimeConfig().public

  const page = SEO_PAGES[route.path]
  const title = options.title ?? page?.title
  const description = options.description ?? page?.description

  const url = computed(() => {
    const path = route.path === '/' ? '/' : route.path.replace(/\/$/, '')
    return `${siteUrl}${path}`
  })
  const cardTitle = computed(() => {
    const pageTitle = toValue(title)
    return pageTitle ? `${pageTitle} · ${SITE_NAME}` : SITE_NAME
  })
  const isArticle = options.type === 'article'

  useSeoMeta({
    title: () => toValue(title),
    description,
    robots: options.noindex ? 'noindex' : undefined,
    ogTitle: cardTitle,
    ogDescription: description,
    ogType: options.type ?? 'website',
    ogUrl: url,
    ogSiteName: SITE_NAME,
    ogLocale: 'en_US',
    // Drawn by server/routes/og, always 1200 × 630
    ogImage: `${siteUrl}${ogImagePath(options.ogPath ?? route.path)}`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: () => toValue(title) ?? SITE_NAME,
    twitterCard: 'summary_large_image',
    articlePublishedTime: isArticle ? options.publishedAt : undefined,
  })

  useHead({
    link: [{ rel: 'canonical', href: url }],
  })
}
