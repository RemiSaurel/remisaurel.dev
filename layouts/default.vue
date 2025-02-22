<script setup lang="ts">
const navItems = [
  { route: '/', icon: 'lucide:house' },
  { route: '/posts', icon: 'uil:book-alt' },
  { route: '/projects', icon: 'lucide:laptop' },
  { route: '/teaching', icon: 'lucide:graduation-cap' },
  { route: '/activity', icon: 'lucide:workflow' }
];
</script>

<template>
  <div class="max-w-6xl m-auto pb-4">
    <nav class="flex items-center justify-end gap-3 p-2">
      <NavButton v-for="item in navItems" :key="item.route" :route="item.route" :icon="item.icon" />
      <ColorModeSwitcher />
    </nav>

    <div class="px-3 md:px-0 max-w-3xl m-auto mt-12">
      <slot />
    </div>
  </div>
</template>