import presetMini from '@unocss/preset-mini'
import { defineConfig } from 'unocss'

export default defineConfig({
  presets: [presetMini()],
  shortcuts: {
    pressable: 'transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]',
    'rl-node-theme': 'block py-[0.4rem] px-[0.75rem] text-[0.68rem] font-600 leading-[1.35] tracking-[0.09em] case-upper',
    'rl-node-hub': 'rl-node-theme',
    'rl-node-topic': 'block py-[0.34rem] px-[0.7rem] text-[0.78rem] leading-[1.35]',
    'rl-node-paper': 'flex flex-col gap-[0.15rem] py-[0.4rem] px-[0.7rem] text-[0.78rem] leading-[1.3] transition-colors duration-200',
    'rl-venue': 'text-[0.6rem] font-500 tracking-[0.08em] case-upper',
  },
  // node kind classes are built dynamically as `rl-node-${node.kind}`, so the
  // literal names never appear in source for the extractor to pick up
  safelist: ['rl-node-theme', 'rl-node-hub', 'rl-node-topic', 'rl-node-paper'],
})
