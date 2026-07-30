<script setup lang="ts">
const { activeLogo, enabled } = useCursorLogo()

const x = ref(0)
const y = ref(0)

let latestX = 0
let latestY = 0
let ticking = false

function onMouseMove(event: MouseEvent) {
  latestX = event.clientX
  latestY = event.clientY

  if (!ticking) {
    ticking = true
    requestAnimationFrame(() => {
      x.value = latestX
      y.value = latestY
      ticking = false
    })
  }
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="enabled"
      class="cursor-logo-follower pointer-events-none fixed left-0 top-0 z-100"
      :style="{ transform: `translate3d(${x+12}px, ${y-16}px, 0)` }"
    >
      <Transition name="cursor-logo">
        <div
          v-if="activeLogo"
          class="relative h-9 w-13 p-0 flex items-center justify-center rounded-xl shadow-lg bg-white ring-1 ring-black/5"
        >
          <img :src="activeLogo.src" :alt="activeLogo.alt" class="max-h-6 max-w-9">
          <span
            class="absolute h-3.5 w-3.5 flex items-center justify-center rounded-full bg-neutral-900 text-[8px] text-white ring-1.5 ring-white -right-1.5 -top-1.5"
          >↗</span>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.cursor-logo-follower {
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.cursor-logo-enter-active,
.cursor-logo-leave-active {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
}

.cursor-logo-enter-from,
.cursor-logo-leave-to {
  transform: scale(0.3) rotate(-10deg);
  opacity: 0;
}
</style>
