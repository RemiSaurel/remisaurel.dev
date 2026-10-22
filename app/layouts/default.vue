<script setup lang="ts">
const route = useRoute()
const { play } = useSound()

const { data: explorations } = await useExplorations()

// Explorations only join the nav once there is one to open
const navItems = computed(() => [
  { route: '/', label: 'About' },
  { route: '/research', label: 'Research' },
  ...(explorations.value.length ? [{ route: '/explorations', label: 'Explorations' }] : []),
  { route: '/posts', label: 'Posts' },
  { route: '/projects', label: 'Projects' },
])

// Below `sm` the links fold into a menu opened by the hamburger
const menuOpen = ref(false)

watch(() => route.path, () => {
  menuOpen.value = false
})

function toggleMenu() {
  menuOpen.value = !menuOpen.value
  play('toggle', { direction: menuOpen.value ? 'forward' : 'back' })
}

function isActive(path: string) {
  if (path === '/')
    return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
    <a
      href="#content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:text-sm dark:focus:bg-neutral-900"
    >
      Skip to content
    </a>

    <!-- Navigation -->
    <nav>
      <div class="mx-auto max-w-7xl px-6 py-3 sm:py-4">
        <div class="flex items-center justify-between gap-x-3">
          <!-- Logo/Name -->
          <div class="enter [--enter-duration:0.4s] [--enter-x:-10px] [--enter-y:0] shrink-0">
            <NuxtLink to="/" class="inline-block whitespace-nowrap rounded-sm py-2 text-xs font-medium tracking-tight -my-2 sm:text-sm">
              Rémi Saurel
            </NuxtLink>
          </div>

          <div class="flex items-center gap-2 sm:gap-6">
            <!-- Nav Links (desktop) -->
            <div
              v-for="(item, index) in navItems"
              :key="item.route"
              class="enter [--enter-duration:0.3s] [--enter-y:-5px] hidden sm:block"
              :style="{ '--enter-delay': `${0.1 + index * 0.05}s` }"
            >
              <NuxtLink
                :to="item.route"
                class="inline-block whitespace-nowrap rounded-sm py-2 text-sm text-neutral-500 transition-colors duration-150 -my-2 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                :class="{ 'text-neutral-900! dark:text-neutral-100!': isActive(item.route) }"
                @click="play('navigate', { emphasis: 'subtle', volume: 0.5 })"
              >
                {{ item.label }}
              </NuxtLink>
            </div>

            <!-- Sound + Theme Toggles, then the hamburger on small screens -->
            <div class="enter [--enter-delay:0.3s] [--enter-duration:0.3s] [--enter-scale:0.9] [--enter-y:0] flex shrink-0 gap-1">
              <SoundSwitcher />
              <ColorModeSwitcher />
              <button
                type="button"
                class="relative h-8 w-8 flex pressable items-center justify-center rounded-lg bg-neutral-100 transition-colors duration-200 sm:hidden dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
                :aria-expanded="menuOpen"
                aria-controls="mobile-menu"
                @click="toggleMenu"
              >
                <Icon
                  name="uil:bars"
                  class="menu-icon"
                  :style="{ opacity: menuOpen ? 0 : 1, scale: menuOpen ? 0.25 : 1, filter: menuOpen ? 'blur(4px)' : 'blur(0px)' }"
                />
                <Icon
                  name="uil:multiply"
                  class="menu-icon"
                  :style="{ opacity: menuOpen ? 1 : 0, scale: menuOpen ? 1 : 0.25, filter: menuOpen ? 'blur(0px)' : 'blur(4px)' }"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Nav Links (mobile) -->
        <div
          id="mobile-menu"
          class="menu-panel sm:hidden"
          :class="{ 'menu-panel-open': menuOpen }"
          :inert="!menuOpen"
        >
          <div class="overflow-hidden">
            <div class="flex flex-col pb-2 pt-3">
              <NuxtLink
                v-for="item in navItems"
                :key="item.route"
                :to="item.route"
                class="py-2 text-base text-neutral-500 transition-colors duration-150 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                :class="{ 'text-neutral-900! dark:text-neutral-100!': isActive(item.route) }"
                @click="play('navigate', { emphasis: 'subtle', volume: 0.5 })"
              >
                {{ item.label }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main id="content" class="mx-auto max-w-7xl w-full flex-1 px-6 py-12">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="mt-auto">
      <div class="mx-auto max-w-7xl w-full px-6 py-10">
        <div class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <p class="m-0">
            &copy; {{ new Date().getFullYear() }} Rémi Saurel
          </p>
          <NuxtLink
            to="/failures"
            class="inline-block py-2 transition-colors duration-150 -my-2 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Failures
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.menu-icon {
  position: absolute;
  inset: 0;
  margin: auto;
  height: 1rem;
  width: 1rem;
  transition:
    opacity var(--duration-micro, 200ms) cubic-bezier(0.2, 0, 0, 1),
    scale var(--duration-micro, 200ms) cubic-bezier(0.2, 0, 0, 1),
    filter var(--duration-micro, 200ms) cubic-bezier(0.2, 0, 0, 1);
}

/* Grid rows animate the panel's height without measuring it */
.menu-panel {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 250ms var(--ease-out),
    opacity 200ms var(--ease-out);
}

.menu-panel-open {
  grid-template-rows: 1fr;
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .menu-panel,
  .menu-icon {
    transition: none;
  }
}
</style>
