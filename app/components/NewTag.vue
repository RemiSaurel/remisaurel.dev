<template>
  <span class="new-tag uppercase shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold tracking-wide">
    New
  </span>
</template>

<style scoped>
/* Amber, the same hue as the "hai" node of the research map: warm against the neutral and pink palette */
.new-tag {
  color: rgb(146 92 20);
  background: rgb(217 150 50 / 0.14);
  box-shadow: inset 0 0 0 1px rgb(217 150 50 / 0.3);
}

.dark .new-tag {
  color: rgb(236 190 120);
  background: rgb(222 178 106 / 0.12);
  box-shadow: inset 0 0 0 1px rgb(222 178 106 / 0.28);
}
</style>
