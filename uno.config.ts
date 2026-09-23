import presetMini from '@unocss/preset-mini'
import { defineConfig } from 'unocss'

export default defineConfig({
  presets: [presetMini()],
  shortcuts: {
    pressable: 'transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]',
  },
})
