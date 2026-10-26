import presetMini from '@unocss/preset-mini'
import { defineConfig } from 'unocss'

export default defineConfig({
  presets: [presetMini()],
  // `hover:` and `group-hover:` only apply to devices that can really hover, so a tap
  // on a touch screen never leaves a row or an arrow stuck in its hovered state.
  postprocess: (util) => {
    if (util.selector.includes(':hover')) {
      const hoverOnly = '@media (hover: hover) and (pointer: fine)'
      util.parent = util.parent ? `${util.parent} $$ ${hoverOnly}` : hoverOnly
    }
  },
  shortcuts: {
    'pressable': 'transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]',
    // Keyboard focus ring of the site's controls
    'keyboard-focus': 'focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:outline-offset-2 focus-visible:outline-solid dark:focus-visible:outline-neutral-100',
    // Section titles of the /lab editor panels
    'lab-heading': 'm-0 text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-500 dark:text-neutral-400',
  },
})
