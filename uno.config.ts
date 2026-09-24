import presetMini from '@unocss/preset-mini'
import { defineConfig } from 'unocss'

export default defineConfig({
  presets: [presetMini()],
  shortcuts: {
    'pressable': 'transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]',
    // Section titles of the /lab editor panels
    'lab-heading': 'm-0 text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-500 dark:text-neutral-400',
  },
})
