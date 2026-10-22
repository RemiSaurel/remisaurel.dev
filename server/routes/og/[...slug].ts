import { pageComposition, postComposition } from '../../utils/og/compositions'
import { renderOgImage } from '../../utils/og/render'

/**
 * `/og/index.png`, `/og/research.png`, `/og/posts/my-post.png`, `/og/explorations/my-exploration.png`: the OG image of the page at the
 * same path (see `ogImagePath`). `nuxt generate` writes them as static files.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!slug.endsWith('.png'))
    throw createError({ statusCode: 404 })

  const name = slug.slice(0, -'.png'.length)
  const path = name === 'index' ? '/' : `/${name}`
  let png: Uint8Array

  if (path.startsWith('/posts/')) {
    const post = await queryCollection(event, 'posts').path(path).first()
    if (!post)
      throw createError({ statusCode: 404, statusMessage: `No post at ${path}` })
    png = renderOgImage({
      title: post.title,
      description: post.description,
      label: 'Post',
      date: new Date(post.date),
      composition: postComposition(path.slice('/posts/'.length)),
    })
  }
  else if (path.startsWith('/explorations/')) {
    const exploration = await queryCollection(event, 'explorations').path(path).first()
    if (!exploration || ('status' in exploration && exploration.status === 'draft'))
      throw createError({ statusCode: 404, statusMessage: `No exploration at ${path}` })
    png = renderOgImage({
      title: exploration.title,
      description: exploration.description,
      label: 'Exploration',
      date: new Date(exploration.date),
      // Drawn like a post's: the same slug always gets the same picture
      composition: postComposition(path.slice('/explorations/'.length)),
    })
  }
  else {
    const page = SEO_PAGES[path]
    if (!page)
      throw createError({ statusCode: 404, statusMessage: `No page at ${path}` })
    png = renderOgImage({
      title: page.title ?? 'Rémi Saurel',
      description: page.description,
      label: page.label,
      composition: pageComposition(path),
    })
  }

  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', 'public, max-age=3600')
  return png
})
