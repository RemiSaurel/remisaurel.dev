<script setup lang="ts">
import type { FlowTipPlacement } from '~/utils/flow/types'
import { FLOW_TIP_PLACEMENT } from '~/utils/flow/types'

// An icon button of the canvas toolbars. Its label shows after a short hover, the way a toolbar
// tooltip should: late enough not to flicker past, instantly once one is already showing (FlowToolbar).
interface FlowButtonProps {
  label: string
  icon?: string
  /** Shown after the label, e.g. a key */
  shortcut?: string
  pressed?: boolean
  /** Where the label opens; defaults to what the toolbar around says */
  tip?: FlowTipPlacement
}

const props = defineProps<FlowButtonProps>()

const fromToolbar = inject(FLOW_TIP_PLACEMENT, ref<FlowTipPlacement>('top'))
const placement = computed(() => props.tip ?? fromToolbar.value)
</script>

<template>
  <button
    type="button"
    class="flow-button group/button relative grid h-8 min-w-8 place-items-center rounded-lg px-1.5 text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 dark:text-neutral-400 hover:text-neutral-900 dark:hover:bg-neutral-700/60 dark:hover:text-neutral-100"
    :aria-label="label"
    :aria-pressed="pressed"
  >
    <span class="press grid place-items-center">
      <slot>
        <Icon v-if="icon" :name="icon" class="size-4" />
      </slot>
    </span>
    <span
      role="tooltip"
      class="tip pointer-events-none absolute z-10 flex items-center gap-1.5 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[11px] text-white font-medium dark:bg-neutral-100 dark:text-neutral-900"
      :data-placement="placement"
    >
      {{ label }}
      <kbd v-if="shortcut" class="text-[10px] font-sans opacity-60">{{ shortcut }}</kbd>
    </span>
  </button>
</template>

<style scoped>
.press {
  transition: transform 160ms var(--ease-out);
}

.flow-button:active .press {
  transform: scale(0.9);
}

/* --tip-x aligns the label, --tip-from is where it slides in from: towards the button */
.tip {
  --tip-x: -50%;
  --tip-from: 2px;
  bottom: 100%;
  left: 50%;
  margin-bottom: 8px;
  opacity: 0;
  transform: translate(var(--tip-x), var(--tip-from));
  transition:
    opacity 120ms var(--ease-out),
    transform 120ms var(--ease-out);
}

.tip[data-placement='top-start'] {
  --tip-x: 0;
  left: 0;
}

.tip[data-placement='top-end'] {
  --tip-x: 0;
  left: auto;
  right: 0;
}

.tip[data-placement='bottom-end'] {
  --tip-x: 0;
  --tip-from: -2px;
  bottom: auto;
  top: 100%;
  left: auto;
  right: 0;
  margin-bottom: 0;
  margin-top: 8px;
}

@media (hover: hover) and (pointer: fine) {
  .flow-button:hover .tip {
    opacity: 1;
    transform: translate(var(--tip-x), 0);
    transition-delay: 450ms;
  }

  /* Once a tooltip of the toolbar is up, the next one follows without the wait (see FlowToolbar) */
  [data-warm] .flow-button:hover .tip {
    transition-delay: 0ms;
  }
}

.flow-button:focus-visible .tip {
  opacity: 1;
  transform: translate(var(--tip-x), 0);
}

@media (prefers-reduced-motion: reduce) {
  .tip {
    transform: translate(var(--tip-x), 0);
  }
}
</style>
