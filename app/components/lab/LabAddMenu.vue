<script setup lang="ts">
import type { LayerType } from '~/art/art'
import { ART_PRESETS, LAYER_TYPE_ORDER, LAYER_TYPES } from '~/art/art'

const { addLayer, loadPreset } = injectLabEditor()

const open = ref(false)

const POPOVER_UI = { content: 'rounded-none overflow-hidden bg-white shadow-lg ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800' }
const POPOVER_CONTENT = { align: 'start', sideOffset: 6, collisionPadding: 16 } as const

function add(type: LayerType) {
  addLayer(type)
  open.value = false
}

function preset(index: number) {
  loadPreset(ART_PRESETS[index]!)
  open.value = false
}
</script>

<template>
  <UPopover v-model:open="open" :content="POPOVER_CONTENT" :ui="POPOVER_UI">
    <button
      type="button"
      class="h-7 inline-flex pressable cursor-pointer items-center gap-1 px-2 text-xs text-neutral-600 data-[state=open]:bg-neutral-100 hover:bg-neutral-100 dark:text-neutral-300 hover:text-neutral-900 dark:data-[state=open]:bg-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
    >
      <Icon name="lucide:plus" class="size-3.5" aria-hidden="true" />
      Add
    </button>

    <template #content>
      <div class="w-80 p-1 text-xs">
        <p class="uppercase m-0 px-2 pb-1 pt-1.5 text-[11px] text-neutral-400 font-medium tracking-wide dark:text-neutral-500">
          Layer
        </p>
        <button
          v-for="type in LAYER_TYPE_ORDER"
          :key="type"
          type="button"
          class="h-7 w-full flex cursor-pointer items-center gap-2.5 px-2 text-left outline-none focus-visible:bg-neutral-100 hover:bg-neutral-100 dark:focus-visible:bg-neutral-800 dark:hover:bg-neutral-800"
          :title="LAYER_TYPES[type].description"
          @click="add(type)"
        >
          <Icon :name="LAYER_TYPES[type].icon" class="size-3.5 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
          <span class="shrink-0 text-neutral-900 font-medium dark:text-neutral-100">{{ LAYER_TYPES[type].label }}</span>
          <span class="min-w-0 truncate text-neutral-400 dark:text-neutral-500">{{ LAYER_TYPES[type].description }}</span>
        </button>

        <div class="mx-2 my-1 h-px bg-neutral-200 dark:bg-neutral-800" />

        <p class="uppercase m-0 px-2 pb-1 pt-1.5 text-[11px] text-neutral-400 font-medium tracking-wide dark:text-neutral-500">
          Start from
        </p>
        <button
          v-for="(item, index) in ART_PRESETS"
          :key="item.label"
          type="button"
          class="h-7 w-full flex cursor-pointer items-center justify-between gap-2 px-2 text-left outline-none focus-visible:bg-neutral-100 hover:bg-neutral-100 dark:focus-visible:bg-neutral-800 dark:hover:bg-neutral-800"
          @click="preset(index)"
        >
          <span class="text-neutral-900 dark:text-neutral-100">{{ item.label }}</span>
          <span class="text-neutral-400 dark:text-neutral-500">Replaces canvas</span>
        </button>
      </div>
    </template>
  </UPopover>
</template>
