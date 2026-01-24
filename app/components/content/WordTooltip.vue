<script setup lang="ts">
import { ref } from "vue"; // Import ref to track hover state

defineProps<{
  tooltip: string;
}>();

const isHovering = ref(false);
</script>

<template>
  <ClientOnly>
    <div class="inline-flex relative">
      <Transition name="fade-slide" appear>
        <div
          v-if="isHovering"
          class="absolute bottom-4 mb-2 w-32 text-center"
          style="left: 50%; transform: translateX(-50%)"
        >
          <div
            class="bg-zinc-500 dark:bg-zinc-700 text-zinc-100 dark:text-zinc-200 text-xs p-2 rounded-md shadow-md"
          >
            {{ tooltip }}
          </div>
        </div>
      </Transition>

      <!-- Hoverable element -->
      <span
        class="text-zinc-500 dark:text-zinc-400 relative"
        @mouseover="isHovering = true"
        @mouseleave="isHovering = false"
      >
        <slot />
      </span>
    </div>
  </ClientOnly>
</template>

<style scoped>
/* Define the transition for fade and slide */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
