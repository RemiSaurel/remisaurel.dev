export default defineAppConfig({
  ui: {
    colors: {
      neutral: 'neutral',
    },
    badge: {
      compoundVariants: [
        {
          color: 'neutral',
          variant: 'outline',
          class: 'ring ring-inset ring-accented text-default !bg-elevated',
        },
      ],
    },
  },
})
