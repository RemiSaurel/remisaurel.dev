<script setup lang="ts">
import { useAnimations } from '~/composables/useAnimations';
import { useFirstVisit } from '~/composables/useFirstVisit';

useSeoMeta({
  title: "RemiSaurel",
  ogTitle: "RemiSaurel",
  description: "My little corner of the internet.",
  ogImage: "/home.png",
  twitterCard: "summary_large_image",
});

const { MAIN_TRANSITION } = useAnimations();
const { isFirstVisit, markAsVisited } = useFirstVisit();

// Compute transitions reactively
const headerTransition = computed(() => 
  isFirstVisit.value ? MAIN_TRANSITION : { duration: 0 }
);
const newsDelay = computed(() => 
  isFirstVisit.value ? { duration: 1, delay: 1.2 } : { duration: 0 }
);

onMounted(() => {
  // Mark as visited after all animations are complete
  setTimeout(() => {
    markAsVisited();
  }, 3000); // Give enough time for all animations to complete
});
</script>

<template>
  <div class="flex flex-col gap-1 mb-6">
    <ProfileHeader :transition="headerTransition" />
  </div>
      
  <NewsSection :transition="newsDelay" />
</template>