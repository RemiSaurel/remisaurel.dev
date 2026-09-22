<script setup lang="ts">
interface Props {
  iconName?: string
  image?: string
  route: string
  external?: boolean
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  external: false,
  size: 'md',
})
</script>

<template>
  <NuxtLink
    :to="props.route"
    :external="props.external"
    :target="props.external ? '_blank' : undefined"
    :rel="props.external ? 'noopener noreferrer' : undefined"
    class="icon-link inline-flex items-center gap-1.5 rounded bg-neutral-400/10 text-neutral-600 leading-none no-underline hover:bg-neutral-400/20 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
    :class="props.size === 'sm' ? 'px-1.5 py-1 text-sm' : 'px-2 py-1.5'"
  >
    <Icon
      v-if="props.iconName"
      :name="props.iconName"
      class="shrink-0"
      :class="props.size === 'sm' ? 'size-3.5' : 'size-4'"
      aria-hidden="true"
    />
    <img
      v-else-if="props.image"
      :src="props.image"
      alt=""
      class="shrink-0"
      :class="props.size === 'sm' ? 'size-3.5' : 'size-4'"
    >
    <span><slot /></span>
  </NuxtLink>
</template>

<style scoped>
.icon-link {
  /* Sits on the surrounding text's line instead of on the icon's baseline */
  vertical-align: middle;
  transition:
    background-color 150ms var(--ease-out),
    color 150ms var(--ease-out),
    transform 160ms var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .icon-link:hover {
    transform: translateY(-1px);
  }
}

.icon-link:active {
  transform: scale(0.97);
}

.icon-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .icon-link,
  .icon-link:hover,
  .icon-link:active {
    transform: none;
  }
}
</style>
