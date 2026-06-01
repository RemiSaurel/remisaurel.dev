<script setup lang="ts">
const route = useRoute()
const headings = ref<{ level: number, text: string, anchor: string }[]>([])

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const showToC = ref(false)

const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('posts').path(route.path).first()
})

onMounted(() => {
  const allHeadings = document.querySelectorAll('h1, h2, h3')
  allHeadings.forEach((heading) => {
    const level = Number.parseInt(heading.tagName.slice(1))
    const textContent = heading.textContent?.trim()
    if (textContent) {
      const anchor = slugify(textContent)
      headings.value.push({ level, text: textContent, anchor })
      heading.id = anchor
    }
  })
  headings.value.shift() // Remove first heading from ToC

  const handleClickOutside = (event: MouseEvent) => {
    const tocElement = document.querySelector('.relative')
    if (tocElement && !tocElement.contains(event.target as Node)) {
      showToC.value = false
    }
  }

  document.addEventListener('click', handleClickOutside)

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})

const toggleToC = () => (showToC.value = !showToC.value)

function to(anchor: string) {
  const element = document.getElementById(anchor)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
  showToC.value = false
}
</script>

<template>
  <div>
    <main>
      <article v-if="page" class="leading-6">
        <h1 class="mb-4 text-4xl">
          {{ page.title }}
        </h1>
        <ContentRenderer :value="page" />
      </article>
    </main>
  </div>
</template>

<style scoped>
html {
  scroll-behavior: smooth;
}
</style>
