import { computed } from 'vue'

export function useMotionHover(hover: Record<string, number | string>) {
  const { prefersReducedMotion } = usePrefersReducedMotion()

  return computed(() => {
    return prefersReducedMotion.value ? undefined : hover
  })
}
