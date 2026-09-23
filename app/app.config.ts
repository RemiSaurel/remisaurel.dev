export default defineAppConfig({
  ui: {
    colors: {
      neutral: 'neutral',
    },
    // Nuxt UI draws overlays with `ring ring-default`, but UnoCSS has no `default` color and
    // renders `ring` as its fallback 3px blue ring. Spelling out the ring keeps it a 1px gray border.
    tooltip: {
      slots: {
        content: 'ring-1 ring-neutral-200 dark:ring-neutral-800',
      },
    },
    popover: {
      slots: {
        content: 'ring-1 ring-neutral-200 dark:ring-neutral-800',
      },
    },
    // Heading anchors (the `#` on hover) default to the green primary color
    prose: {
      h2: { slots: { leading: 'group-hover:text-highlighted group-focus:text-highlighted' } },
      h3: { slots: { leading: 'group-hover:text-highlighted group-focus:text-highlighted' } },
      h4: { slots: { leading: 'group-hover:text-highlighted group-focus:text-highlighted' } },
      img: {
        slots: {
          overlay: 'z-50',
          content: 'z-50',
          zoomedImage: 'w-auto h-auto object-fill',
        },
      },
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
