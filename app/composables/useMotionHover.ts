import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

/** A motion-v `whileHover` target, dropped when the visitor prefers reduced motion. */
export function useMotionHover(hover: MaybeRefOrGetter<Record<string, number | string>>) {
  const { prefersReducedMotion } = usePrefersReducedMotion()

  return computed(() => prefersReducedMotion.value ? undefined : toValue(hover))
}
