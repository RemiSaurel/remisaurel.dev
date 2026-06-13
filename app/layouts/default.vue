<script setup lang="ts">
import { motion } from 'motion-v'

const route = useRoute()
const { prefersReducedMotion } = usePrefersReducedMotion()

const navItems = [
  { route: '/', label: 'About' },
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
    <!-- Navigation -->
    <nav>
      <div class="mx-auto max-w-7xl px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo/Name -->
          <motion.div
            :initial="prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }"
          >
            <NuxtLink to="/" class="pressable rounded-sm text-sm font-medium tracking-tight">
              Rémi Saurel
            </NuxtLink>
          </motion.div>

          <!-- Nav Links -->
          <div class="flex items-center gap-6">
            <motion.div
              v-for="(item, index) in navItems"
              :key="item.route"
              :initial="prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -5 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.1 + index * 0.05 }"
            >
              <NuxtLink
                :to="item.route"
                class="pressable rounded-sm text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                :class="{ 'text-neutral-900! dark:text-neutral-100!': isActive(item.route) }"
              >
                {{ item.label }}
              </NuxtLink>
            </motion.div>

            <!-- Theme Toggle -->
            <motion.div
              :initial="prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }"
              :animate="{ opacity: 1, scale: 1 }"
              :transition="prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.3 }"
            >
              <ColorModeSwitcher />
            </motion.div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="mx-auto max-w-7xl px-6 py-12">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="mt-auto border-t border-neutral-200 dark:border-neutral-800">
      <div class="mx-auto max-w-7xl px-6 py-6">
        <p class="text-xs text-neutral-400 dark:text-neutral-600">
          &copy; {{ new Date().getFullYear() }} Rémi Saurel
        </p>
      </div>
    </footer>
  </div>
</template>
