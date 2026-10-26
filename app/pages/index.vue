<script setup lang="ts">
import { useFirstVisit } from '~/composables/useFirstVisit'
import { publications } from '~/publications/publications'

usePageSeo()

const { isFirstVisit, markAsVisited } = useFirstVisit()

const animate = computed(() => isFirstVisit.value)

onMounted(() => {
  setTimeout(() => {
    markAsVisited()
  }, 2000)
})

const POST_LIMIT = 5
const EXPLORATION_LIMIT = 5

const { data: posts } = await useAsyncData('home-posts', async () => {
  const all = await queryCollection('posts').all()
  return all
    .filter(post => !post.disabled)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, POST_LIMIT)
    .map(({ path, title, description, date }) => ({ path, title, description, date }))
}, { default: () => [] })

const { data: allExplorations } = await useExplorations()
// Teasers (drafts) come after the explorations you can open, so they never push one out of the list.
// The openable ones are newest first (the query's order), the teasers nearest first, undated ones last
const explorations = computed(() => [
  ...allExplorations.value.filter(exploration => exploration.status !== 'draft'),
  ...allExplorations.value
    .filter(exploration => exploration.status === 'draft')
    .sort((a, b) => (a.date ? new Date(a.date).getTime() : Infinity) - (b.date ? new Date(b.date).getTime() : Infinity)),
].slice(0, EXPLORATION_LIMIT))

const sortedPublications = [...publications]
  .sort((a, b) => b.date.getTime() - a.date.getTime())
</script>

<template>
  <div class="mx-auto max-w-2xl flex flex-col gap-16 sm:gap-20">
    <div class="flex flex-col gap-10">
      <ProfileHeader :animate="animate" />

      <div class="[--enter-blur:8px] [--enter-delay:0.4s]" :class="{ enter: animate }">
        <p class="intro-text m-0">
          French PhD student at the
          <a href="https://www.irit.fr/" target="_blank" class="font-medium"><img :src="ENTITY_LOGOS.irit.src" alt="" class="object-contain mr-1.5 inline-block h-5.5 w-5.5 align-text-bottom"><span class="underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500">IRIT</span></a> lab in Toulouse, working in the
          <a href="https://www.irit.fr/TALENT/site/" target="_blank" class="font-medium"><img :src="ENTITY_LOGOS.talent.src" alt="" class="object-contain dark:invert dark:hue-rotate-180 dark:mix-blend-screen mr-1.5 inline-block h-5.5 w-5.5 align-text-bottom"><span class="underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500">TALENT</span></a> team, in collaboration with
          <a href="https://www.kosmos-education.com/" target="_blank" class="font-medium"><img :src="ENTITY_LOGOS.kosmos.src" alt="" class="object-contain mr-1.5 inline-block h-5.5 w-5.5 align-text-bottom"><span class="underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500">Kosmos Education</span></a>.
        </p>
        <p class="mb-0 mt-4 text-neutral-500 dark:text-neutral-400">
          I build dashboards powered by AI and learning analytics to help teachers
          support students’ <span class="whitespace-nowrap">out-of-class</span> activities in K-12 education.
          This is where I write about it, build things around it, and share the <NuxtLink to="/research" class="font-medium">
            <span class="underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500">research</span>
          </NuxtLink> behind it.
        </p>
        <p class="mb-0 mt-4 text-neutral-500 dark:text-neutral-400">
          You can find me on
          <a href="https://scholar.google.com/citations?hl=fr&user=r8AM0OIAAAAJ" target="_blank" rel="noopener noreferrer" class="font-medium"><Icon name="academicons:google-scholar" class="mr-1.5 inline-block size-4.5 align-text-bottom" /><span class="underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500">Google Scholar</span></a>,
          <a href="https://github.com/remisaurel" target="_blank" rel="noopener noreferrer" class="font-medium"><Icon name="uil:github-alt" class="mr-1.5 inline-block size-4.5 align-text-bottom" /><span class="underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500">GitHub</span></a>,
          <a href="https://www.linkedin.com/in/r%C3%A9mi-saurel/" target="_blank" rel="noopener noreferrer" class="font-medium"><Icon name="uil:linkedin" class="mr-1.5 inline-block size-4.5 align-text-bottom" /><span class="underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500">LinkedIn</span></a>
          and
          <a href="https://twitter.com/remisaurel" target="_blank" rel="noopener noreferrer" class="font-medium"><Icon name="i-simple-icons-x" class="mr-1.5 inline-block size-4.5 align-text-bottom" /><span class="underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500">X</span></a>.
        </p>
      </div>
    </div>

    <ContentSection id="publications" title="Publications" :animate="animate" :delay="0.5" class="scroll-mt-8">
      <HoverList tag="ul" class="list-none m-0 flex flex-col gap-1 p-0">
        <li v-for="publication in sortedPublications" :key="publication.id">
          <PublicationLine :publication="publication" />
        </li>
      </HoverList>
    </ContentSection>

    <ContentSection v-if="explorations.length" title="Explorations" link="/explorations" :animate="animate" :delay="0.6">
      <HoverList tag="ul" class="list-none m-0 flex flex-col gap-1 p-0">
        <li v-for="exploration in explorations" :key="exploration.path">
          <ExplorationRow
            :to="exploration.path"
            :title="exploration.title"
            :description="exploration.description"
            :status="exploration.status"
            :icon="exploration.icon"
            :date="exploration.date"
          />
        </li>
      </HoverList>
    </ContentSection>

    <ContentSection v-if="posts.length" title="Posts" link="/posts" :animate="animate" :delay="0.7">
      <HoverList tag="ul" class="list-none m-0 flex flex-col gap-1 p-0">
        <li v-for="post in posts" :key="post.path">
          <PostLine :to="post.path" :title="post.title" :description="post.description" :date="post.date" />
        </li>
      </HoverList>
    </ContentSection>

    <ContentSection title="News" :animate="animate" :delay="0.8">
      <NewsList :limit="3" />
    </ContentSection>
  </div>
</template>
