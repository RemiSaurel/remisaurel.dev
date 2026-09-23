<script setup lang="ts">
import { MINIMAL } from '~/sounds/sounds'

const route = useRoute()
const { play } = useSound()

const navItems = [
  { route: '/', label: 'About' },
  { route: '/research', label: 'Research' },
  { route: '/posts', label: 'Posts' },
  { route: '/projects', label: 'Projects' },
]

function isActive(path: string) {
  if (path === '/')
    return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
    <a
      href="#content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:text-sm dark:focus:bg-neutral-900"
    >
      Skip to content
    </a>

    <!-- Navigation -->
    <nav>
      <div class="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <!-- Logo/Name -->
          <div class="enter [--enter-duration:0.4s] [--enter-x:-10px] [--enter-y:0] shrink-0">
            <NuxtLink to="/" class="pressable whitespace-nowrap rounded-sm text-xs font-medium tracking-tight sm:text-sm">
              Rémi Saurel
            </NuxtLink>
          </div>

          <!-- Nav Links -->
          <div class="flex items-center gap-2 sm:gap-6">
            <div
              v-for="(item, index) in navItems"
              :key="item.route"
              class="enter [--enter-duration:0.3s] [--enter-y:-5px]"
              :style="{ '--enter-delay': `${0.1 + index * 0.05}s` }"
            >
              <NuxtLink
                :to="item.route"
                class="pressable whitespace-nowrap rounded-sm text-xs text-neutral-500 transition-colors duration-200 sm:text-sm dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                :class="{ 'text-neutral-900! dark:text-neutral-100!': isActive(item.route) }"
                @click="play(MINIMAL.tap)"
              >
                {{ item.label }}
              </NuxtLink>
            </div>

            <!-- Sound + Theme Toggles -->
            <div class="enter [--enter-delay:0.3s] [--enter-duration:0.3s] [--enter-scale:0.9] [--enter-y:0] flex shrink-0 gap-1">
              <SoundSwitcher />
              <ColorModeSwitcher />
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main id="content" class="mx-auto max-w-7xl px-6 py-12">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="mt-auto">
      <div class="mx-auto max-w-7xl px-6 py-10">
        <div class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <p class="m-0">
            &copy; {{ new Date().getFullYear() }} Rémi Saurel
          </p>
          <NuxtLink
            to="/failures"
            class="pressable transition-colors duration-200 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            failures
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
