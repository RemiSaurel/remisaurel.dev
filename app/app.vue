<script setup lang="ts">
useSeoMeta({
  ogImage: '/blog.png',
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CursorLogo />
    <TetrisGame />
  </UApp>
</template>
