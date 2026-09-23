<script setup lang="ts">
import { ConfigProvider, TooltipProvider } from 'reka-ui'

useSeoMeta({
  ogImage: '/blog.png',
})

// The game (and its engine) is only downloaded once the easter egg is found, then
// stays mounted so reopening it is instant.
const { isOpen: isTetrisOpen } = useTetrisEasterEgg()
const tetrisLoaded = ref(false)
watch(isTetrisOpen, (open) => {
  if (open)
    tetrisLoaded.value = true
})
</script>

<template>
  <!-- What <UApp> provides minus its Toaster and OverlayProvider, which the site never
       uses but would ship in the entry chunk. `useId` keeps reka ids SSR-stable. -->
  <ConfigProvider :use-id="useId">
    <TooltipProvider>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <CursorLogo />
      <LazyTetrisGame v-if="tetrisLoaded" />
    </TooltipProvider>
  </ConfigProvider>
</template>
