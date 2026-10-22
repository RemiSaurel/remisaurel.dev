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

const { setCursorLogo, clearCursorLogo } = useCursorLogo()

const POST_LIMIT = 3
const EXPLORATION_LIMIT = 3

const { data: posts } = await useAsyncData('home-posts', async () => {
  const all = await queryCollection('posts').all()
  return all
    .filter(post => !post.disabled)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, POST_LIMIT)
    .map(({ path, title, description }) => ({ path, title, description }))
}, { default: () => [] })

const { data: allExplorations } = await useExplorations()
const explorations = computed(() => allExplorations.value.slice(0, EXPLORATION_LIMIT))

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
          <a
            href="https://www.irit.fr/" target="_blank" class="intro-link"
            @mouseenter="setCursorLogo(ENTITY_LOGOS.irit)"
            @mouseleave="clearCursorLogo"
          >IRIT</a> lab in Toulouse, working in the
          <a
            href="https://www.irit.fr/TALENT/site/" target="_blank" class="intro-link"
            @mouseenter="setCursorLogo(ENTITY_LOGOS.talent)"
            @mouseleave="clearCursorLogo"
          >TALENT</a> team, in collaboration with
          <a
            href="https://www.kosmos-education.com/" target="_blank" class="intro-link"
            @mouseenter="setCursorLogo(ENTITY_LOGOS.kosmos)"
            @mouseleave="clearCursorLogo"
          >Kosmos Education</a>.
        </p>
        <p class="mb-0 mt-4 text-neutral-500 dark:text-neutral-400">
          I build dashboards powered by AI and learning analytics to help teachers
          support students’ <span class="whitespace-nowrap">out-of-class</span> activities in K-12 education.
          This is where I write about it, build things around it, and share the <NuxtLink to="/research" class="intro-link">
            research
          </NuxtLink> behind it.
        </p>
      </div>
    </div>

    <ContentSection id="publications" title="Publications" :animate="animate" :delay="0.5" class="scroll-mt-8">
      <ul class="list-none m-0 flex flex-col gap-1 p-0">
        <li v-for="publication in sortedPublications" :key="publication.id">
          <PublicationLine :publication="publication" />
        </li>
      </ul>
    </ContentSection>

    <ContentSection v-if="explorations.length" title="Explorations" link="/explorations" :animate="animate" :delay="0.6">
      <ul class="list-none m-0 flex flex-col gap-1 p-0">
        <li v-for="exploration in explorations" :key="exploration.path">
          <ExplorationRow
            :to="exploration.path"
            :title="exploration.title"
            :description="exploration.description"
            :status="exploration.status"
            :icon="exploration.icon"
          />
        </li>
      </ul>
    </ContentSection>

    <ContentSection v-if="posts.length" title="Posts" link="/posts" :animate="animate" :delay="0.7">
      <ul class="list-none m-0 flex flex-col gap-3 p-0">
        <li v-for="post in posts" :key="post.path">
          <PostLine :to="post.path" :title="post.title" :description="post.description" />
        </li>
      </ul>
    </ContentSection>

    <ContentSection title="News" :animate="animate" :delay="0.8">
      <NewsList :limit="3" />
    </ContentSection>
  </div>
</template>
