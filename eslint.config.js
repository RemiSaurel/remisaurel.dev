import antfu from '@antfu/eslint-config'

export default antfu({
  unocss: true,
  vue: true,
}, {
  // `#source` is MDC slot syntax, not a heading: the rule would "fix" it into `# source`
  files: ['content/**/*.md'],
  rules: {
    'markdown/no-missing-atx-heading-space': 'off',
  },
})
