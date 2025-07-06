<script setup lang="ts">
import { useAnimations } from '~/composables/useAnimations';

useSeoMeta({
  title: "RemiSaurel",
  ogTitle: "RemiSaurel",
  description: "My little corner of the internet.",
  ogImage: "/home.png",
  twitterCard: "summary_large_image",
});

const { MAIN_TRANSITION } = useAnimations();
const newsDelay = { duration: 1, delay: 1.2 };
</script>

<template>
  <div class="flex flex-col gap-1 mb-6">
    <ProfileHeader />
  </div>
      
  <NewsSection :transition="newsDelay" />
</template>