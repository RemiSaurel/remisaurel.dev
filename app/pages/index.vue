<script setup lang="ts">
import { motion } from 'motion-v';
import { useFirstVisit } from '~/composables/useFirstVisit';

useSeoMeta({
  title: "Rémi Saurel",
  ogTitle: "Rémi Saurel",
  description: "PhD Student in AI and Learning Analytics at IRIT Lab, Toulouse.",
  ogImage: "/home.png",
  twitterCard: "summary_large_image",
});

const { isFirstVisit, markAsVisited } = useFirstVisit();

const animate = computed(() => isFirstVisit.value);

onMounted(() => {
  setTimeout(() => {
    markAsVisited();
  }, 2000);
});

const transition = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94]
};
</script>

<template>
  <div class="flex flex-col gap-8 lg:grid lg:grid-cols-[220px_1fr] lg:gap-16">
    <!-- Left: Profile Sidebar -->
    <ProfileSidebar :animate="animate" />

    <!-- Right: Main Content -->
    <main class="flex flex-col gap-8">
      <!-- Intro Section -->
      <ContentSection :animate="animate" :delay="0.3">
        <motion.p
          :initial="animate ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="animate ? { ...transition, delay: 0.4 } : { duration: 0 }"
          class="intro-text"
        >
          French PhD student at the 
          <a href="https://www.irit.fr/" target="_blank" class="underline underline-offset-2">IRIT</a> lab in Toulouse, working in the 
          <a href="https://www.irit.fr/TALENT/site/" target="_blank" class="underline underline-offset-2">TALENT</a> team.
          Collaborating with 
          <a href="https://www.kosmos-education.com/" target="_blank" class="underline underline-offset-2">Kosmos Education</a>.
        </motion.p>
        <motion.p
          :initial="animate ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="animate ? { ...transition, delay: 0.5 } : { duration: 0 }"
          class="mt-4 text-zinc-500 dark:text-zinc-400"
        >
          I develop dashboards powered by AI and learning analytics to help teachers 
          support students' out-of-class activities in K-12 education. Interested in 
          Human-AI Interaction and responsible AI integration in education.
        </motion.p>
      </ContentSection>

      <!-- Publications Section -->
      <ContentSection title="Publications" :animate="animate" :delay="0.5">
        <PublicationsList />
      </ContentSection>

      <!-- News Section -->
      <ContentSection title="News" :animate="animate" :delay="0.7">
        <NewsList :limit="5" />
      </ContentSection>
    </main>
  </div>
</template>
