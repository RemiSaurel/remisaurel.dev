<script setup lang="ts">
const headings = ref<{ level: number, text: string, anchor: string }[]>([])

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const showToC = ref(false)

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
    <div class="relative left-0 top-0 hidden lg:block">
      <div class="fixed left-6 top-5 inline-block">
        <div
          class="space-x-2 group flex cursor-pointer items-center text-zinc-600 transition duration-400 dark:text-zinc-4 hover:text-zinc-8 dark:hover:text-zinc-2"
          @click="toggleToC"
        >
          <span>TOC</span>
          <span
            :class="showToC ? 'rotate-90' : ''"
            class="flex items-center justify-center transition-transform duration-300"
          >
            <Icon name="uil:angle-right" class="size-6" />
          </span>
        </div>

        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          leave-active-class="transition-all duration-200 ease-in" enter-from-class="opacity-0 transform -translate-y-2"
          enter-to-class="opacity-100 transform translate-y-0" leave-from-class="opacity-100 transform translate-y-0"
          leave-to-class="opacity-0 transform -translate-y-2"
        >
          <div
            v-if="showToC"
            class="absolute z-10 mt-2 w-64 border-0.5 border-zinc-2 rounded-lg border-solid bg-white p-4 shadow-lg dark:border-zinc-7 dark:bg-zinc-8"
          >
            <div class="m-0 flex flex-col gap-2 p-0">
              <div
                v-for="heading in headings" :key="heading.text"
                class="cursor-pointer text-sm text-zinc-500 transition dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-2"
                :class="{
                  'font-medium': heading.level === 1,
                  'ml-3 text-base': heading.level === 2,
                  'ml-6 text-sm': heading.level === 3,
                }"
              >
                <div @click="to(heading.anchor)">
                  {{ heading.text }}
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <main>
      <ContentDoc v-slot="{ doc }">
        <article class="leading-6">
          <h1 class="mb-4 text-4xl">
            {{ doc.title }}
          </h1>
          <ContentRenderer :value="doc" />
        </article>
      </ContentDoc>
    </main>
  </div>
</template>

<style scoped>
html {
  scroll-behavior: smooth;
}
</style>
