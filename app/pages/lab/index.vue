<script setup lang="ts">
import type { ArtTheme } from '~/art/art'
import { useClipboard, useEventListener } from '@vueuse/core'
import { isGroup } from '~/art/art'

// A tool, not a page: it takes the whole window instead of the site layout
definePageMeta({ layout: false })

useSeoMeta({
  title: 'Lab',
  ogTitle: 'Lab · Rémi Saurel',
  description: 'A workbench for composing the generative illustrations used across the site.',
  ogImage: '/home.png',
  twitterCard: 'summary_large_image',
})

useHead({ htmlAttrs: { class: 'lab-page' } })

const editor = useLabEditor()
provide(LAB_EDITOR_KEY, editor)

const {
  composition,
  selectedIds,
  selectedNode,
  topSelection,
  entry,
  canvasTheme,
  canUndo,
  canRedo,
  undo,
  redo,
  select,
  selectMany,
  selectAll,
  removeSelected,
  duplicateSelected,
  updateNode,
  shiftSelected,
  groupSelected,
  ungroupSelected,
  copySelection,
  paste,
  loadComposition,
  restoreDraft,
} = editor

// The server renders the default preset; hold the editor back until the draft is in,
// so the canvas never flashes a composition that is about to be replaced
const ready = ref(false)
const previewOpen = ref(true)
const PREVIEW_KEY = 'lab-preview-open'

onMounted(() => {
  restoreDraft()
  try {
    previewOpen.value = localStorage.getItem(PREVIEW_KEY) !== '0'
  }
  catch {}
  ready.value = true
})

watch(previewOpen, (open) => {
  try {
    localStorage.setItem(PREVIEW_KEY, open ? '1' : '0')
  }
  catch {}
})

const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark', icon: 'lucide:moon' },
  { value: 'light', label: 'Light', icon: 'lucide:sun' },
]

const themeModel = computed({
  get: () => canvasTheme.value,
  set: (value: string) => (canvasTheme.value = value as ArtTheme),
})

const POPOVER_UI = { content: 'rounded-none overflow-hidden bg-white shadow-lg ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800' }
const POPOVER_CONTENT = { align: 'end', sideOffset: 6, collisionPadding: 16 } as const

// Output

const json = computed(() => JSON.stringify(composition.value, null, 2))
const { copy, copied } = useClipboard({ copiedDuring: 1400 })

const preview = useTemplateRef<{ svgMarkup: (theme: ArtTheme) => string | null }>('preview')
const exportOpen = ref(false)

function exportName(extension: string, theme: ArtTheme) {
  const base = composition.value.layers.map(node => node.name.toLowerCase().replace(/\W+/g, '-')).slice(0, 2).join('-') || 'empty'
  return `${base}-${theme}.${extension}`
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function svgMarkup(theme: ArtTheme) {
  return preview.value?.svgMarkup(theme) ?? null
}

function exportSvg(theme: ArtTheme) {
  const markup = svgMarkup(theme)
  if (markup)
    download(new Blob([markup], { type: 'image/svg+xml' }), exportName('svg', theme))
  exportOpen.value = false
}

/** 1600x800: sharp as a card on a 2x screen, and a fine Open Graph image. */
function exportPng(theme: ArtTheme) {
  const markup = svgMarkup(theme)
  exportOpen.value = false
  if (!markup)
    return
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }))
  const image = new Image()
  image.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1600
    canvas.height = 800
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)
    canvas.toBlob(blob => blob && download(blob, exportName('png', theme)))
  }
  image.src = url
}

// Import replaces the canvas; it is the only thing that does

const importOpen = ref(false)
const importDraft = ref('')
const importError = ref(false)

function applyImport() {
  const parsed = parseComposition(importDraft.value)
  importError.value = !parsed
  if (!parsed)
    return
  loadComposition(parsed)
  importOpen.value = false
  importDraft.value = ''
}

watch(importDraft, () => (importError.value = false))

// Clipboard: ⌘C / ⌘X carry the selected layers, ⌘V always adds, never replaces

function isTyping(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('input, textarea, [contenteditable], [role="slider"]')
}

function hasTextSelection() {
  return !!window.getSelection()?.toString()
}

function onCopy(event: ClipboardEvent, cut: boolean) {
  if (isTyping(event.target) || hasTextSelection())
    return
  const text = copySelection()
  if (!text)
    return
  event.preventDefault()
  event.clipboardData?.setData('text/plain', text)
  if (cut)
    removeSelected()
}

useEventListener('copy', (event: ClipboardEvent) => onCopy(event, false))
useEventListener('cut', (event: ClipboardEvent) => onCopy(event, true))

useEventListener('paste', (event: ClipboardEvent) => {
  if (isTyping(event.target))
    return
  const parsed = parseComposition(event.clipboardData?.getData('text') ?? '')
  if (parsed) {
    event.preventDefault()
    paste(parsed.layers)
  }
})

// Keyboard: instant, never animated, and silent while a field has focus.
// One table drives both the handler and the help popover, so they cannot drift apart.

interface KeyCombo {
  /** Compared against `event.key`, lowercased. */
  key: string
  /** ⌘ on macOS, Ctrl elsewhere. Left out: either state matches. */
  mod?: boolean
  /** Left out: either state matches. */
  shift?: boolean
}

interface Shortcut {
  keys: string[]
  label: string
  /** Left out for shortcuts listed here but handled elsewhere (the clipboard events above). */
  combos?: KeyCombo[]
  /** Only fires while something is selected. */
  needsSelection?: boolean
  when?: () => boolean
  /** Lets the browser keep its default, for keys that have one worth keeping. */
  keepDefault?: boolean
  run?: (event: KeyboardEvent) => void
}

const ARROWS: Record<string, [number, number]> = {
  arrowleft: [-1, 0],
  arrowright: [1, 0],
  arrowup: [0, -1],
  arrowdown: [0, 1],
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['⌘', 'Z'], label: 'Undo', combos: [{ key: 'z', mod: true, shift: false }], run: undo },
  { keys: ['⇧', '⌘', 'Z'], label: 'Redo', combos: [{ key: 'z', mod: true, shift: true }, { key: 'y', mod: true }], run: redo },
  { keys: ['⌘', 'C'], label: 'Copy layers' },
  { keys: ['⌘', 'V'], label: 'Paste layers' },
  { keys: ['⌘', 'D'], label: 'Duplicate', combos: [{ key: 'd', mod: true }], needsSelection: true, run: duplicateSelected },
  { keys: ['⌘', 'G'], label: 'Group', combos: [{ key: 'g', mod: true, shift: false }], needsSelection: true, run: groupSelected },
  { keys: ['⇧', '⌘', 'G'], label: 'Ungroup', combos: [{ key: 'g', mod: true, shift: true }], needsSelection: true, run: ungroupSelected },
  { keys: ['⌘', 'A'], label: 'Select all', combos: [{ key: 'a', mod: true }], run: selectAll },
  { keys: ['⌫'], label: 'Delete', combos: [{ key: 'backspace' }, { key: 'delete' }], needsSelection: true, run: removeSelected },
  { keys: ['⌘', ']'], label: 'Bring forward', combos: [{ key: ']', mod: true }], needsSelection: true, run: () => shiftSelected(1) },
  { keys: ['⌘', '['], label: 'Send backward', combos: [{ key: '[', mod: true }], needsSelection: true, run: () => shiftSelected(-1) },
  {
    keys: ['←', '→'],
    label: 'Nudge (⇧ for 10)',
    combos: Object.keys(ARROWS).map(key => ({ key, mod: false })),
    needsSelection: true,
    run: (event) => {
      const step = event.shiftKey ? 10 : 1
      const [dx, dy] = ARROWS[event.key.toLowerCase()]!
      for (const item of topSelection.value)
        updateNode(item.node.id, { x: item.node.x + dx * step, y: item.node.y + dy * step })
    },
  },
  {
    keys: ['R'],
    label: 'Shuffle seed',
    combos: [{ key: 'r', mod: false }],
    needsSelection: true,
    when: () => !!selectedNode.value && !isGroup(selectedNode.value),
    keepDefault: true,
    run: () => updateNode(selectedNode.value!.id, { seed: Math.floor(Math.random() * 1000) }),
  },
  {
    keys: ['⇧', 'H'],
    label: 'Hide or show',
    combos: [{ key: 'h', mod: false, shift: true }],
    needsSelection: true,
    keepDefault: true,
    run: () => {
      for (const item of topSelection.value)
        updateNode(item.node.id, { visible: !item.node.visible })
    },
  },
  {
    keys: ['↵'],
    label: 'Select group’s children',
    combos: [{ key: 'enter' }],
    needsSelection: true,
    when: () => !!selectedNode.value && isGroup(selectedNode.value),
    run: () => {
      const node = selectedNode.value
      if (node && isGroup(node))
        selectMany(node.children.map(child => child.id))
    },
  },
  {
    keys: ['Esc'],
    label: 'Select parent, then none',
    combos: [{ key: 'escape' }],
    needsSelection: true,
    keepDefault: true,
    // Step out of a group first, then out of the selection
    run: () => select(entry(selectedIds.value.at(-1))?.parent?.id ?? null),
  },
]

function matches(combo: KeyCombo, event: KeyboardEvent) {
  const mod = event.metaKey || event.ctrlKey
  return combo.key === event.key.toLowerCase()
    && (combo.mod === undefined || combo.mod === mod)
    && (combo.shift === undefined || combo.shift === event.shiftKey)
}

useEventListener('keydown', (event: KeyboardEvent) => {
  if (isTyping(event.target))
    return
  const shortcut = SHORTCUTS.find(item =>
    item.run
    && item.combos?.some(combo => matches(combo, event))
    && (!item.needsSelection || selectedIds.value.length > 0)
    && (!item.when || item.when()),
  )
  if (!shortcut)
    return
  if (!shortcut.keepDefault)
    event.preventDefault()
  shortcut.run!(event)
})

const GESTURES = [
  { keys: ['⇧'], label: 'Click to add to the selection; drag on one axis' },
  { keys: ['⌘'], label: 'Click to reach a layer inside a group' },
  { keys: ['Double'], label: 'Click to enter a group' },
  { keys: ['⌥'], label: 'Drag without smart guides' },
]
</script>

<template>
  <div class="lab-app min-h-dvh flex flex-col bg-white text-neutral-900 lg:h-dvh dark:bg-neutral-900 dark:text-neutral-100">
    <!-- Top bar -->
    <header class="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
      <div class="flex items-center gap-1">
        <NuxtLink
          to="/"
          class="h-7 inline-flex pressable items-center gap-1.5 px-1.5 text-xs text-neutral-500 transition-colors duration-150 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <Icon name="lucide:arrow-left" class="size-3.5" aria-hidden="true" />
          Rémi Saurel
        </NuxtLink>
        <span class="text-xs text-neutral-300 dark:text-neutral-700" aria-hidden="true">/</span>
        <h1 class="m-0 px-1.5 text-xs font-medium">
          Lab
        </h1>

        <span class="mx-1.5 h-4 w-px bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />

        <button type="button" class="lab-toolbar-button" :disabled="!canUndo" aria-label="Undo" title="Undo (⌘Z)" @click="undo">
          <Icon name="lucide:undo-2" class="size-3.5" aria-hidden="true" />
        </button>
        <button type="button" class="lab-toolbar-button" :disabled="!canRedo" aria-label="Redo" title="Redo (⇧⌘Z)" @click="redo">
          <Icon name="lucide:redo-2" class="size-3.5" aria-hidden="true" />
        </button>

        <UPopover :content="{ ...POPOVER_CONTENT, align: 'start' }" :ui="POPOVER_UI">
          <button type="button" class="lab-toolbar-button data-[state=open]:bg-neutral-100 dark:data-[state=open]:bg-neutral-800" aria-label="Keyboard shortcuts" title="Shortcuts">
            <Icon name="lucide:keyboard" class="size-3.5" aria-hidden="true" />
          </button>
          <template #content>
            <div class="w-80 flex flex-col gap-3 p-3 text-xs">
              <dl class="grid grid-cols-[1fr_auto] m-0 gap-x-4 gap-y-1.5">
                <template v-for="shortcut in SHORTCUTS" :key="shortcut.label">
                  <dt class="text-neutral-600 dark:text-neutral-300">
                    {{ shortcut.label }}
                  </dt>
                  <dd class="m-0 flex justify-end gap-0.5">
                    <kbd v-for="k in shortcut.keys" :key="k" class="lab-kbd">{{ k }}</kbd>
                  </dd>
                </template>
              </dl>
              <div class="h-px bg-neutral-200 dark:bg-neutral-800" />
              <ul class="list-none m-0 flex flex-col gap-1.5 p-0">
                <li v-for="gesture in GESTURES" :key="gesture.label" class="flex items-baseline gap-2">
                  <kbd class="lab-kbd shrink-0">{{ gesture.keys[0] }}</kbd>
                  <span class="text-neutral-600 dark:text-neutral-300">{{ gesture.label }}</span>
                </li>
              </ul>
            </div>
          </template>
        </UPopover>
      </div>

      <div class="flex items-center gap-1.5">
        <ViewSwitcher id="lab-canvas-theme" v-model="themeModel" :options="THEME_OPTIONS" />

        <UPopover v-model:open="importOpen" :content="POPOVER_CONTENT" :ui="POPOVER_UI">
          <button type="button" class="lab-toolbar-button gap-1.5 px-2 data-[state=open]:bg-neutral-100 dark:data-[state=open]:bg-neutral-800">
            <Icon name="lucide:file-input" class="size-3.5" aria-hidden="true" />
            <span class="hidden sm:inline">Import</span>
          </button>
          <template #content>
            <form class="w-80 flex flex-col gap-2 p-3" @submit.prevent="applyImport">
              <label for="lab-import" class="text-xs text-neutral-600 dark:text-neutral-300">Paste a composition JSON</label>
              <textarea
                id="lab-import"
                v-model="importDraft"
                rows="6"
                spellcheck="false"
                class="resize-none border border-neutral-200 bg-neutral-50 p-2 text-[11px] font-mono outline-none dark:border-neutral-800 focus:border-[#4f7cff] dark:bg-neutral-950"
                :class="{ 'border-rose-400! dark:border-rose-500!': importError }"
                placeholder="{ 'grid': true, 'layers': [...] }"
                @keydown.meta.enter="applyImport"
              />
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px]" :class="importError ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-400 dark:text-neutral-500'">
                  {{ importError ? 'That doesn’t look like a composition.' : 'Replaces the canvas, undo brings it back.' }}
                </span>
                <button type="submit" class="lab-primary-button" :disabled="!importDraft.trim()">
                  Load
                </button>
              </div>
            </form>
          </template>
        </UPopover>

        <button type="button" class="lab-toolbar-button gap-1.5 px-2" @click="copy(json)">
          <span class="relative size-3.5">
            <Transition name="lab-swap">
              <Icon v-if="copied" key="done" name="lucide:check" class="absolute inset-0 size-3.5" aria-hidden="true" />
              <Icon v-else key="copy" name="lucide:braces" class="absolute inset-0 size-3.5" aria-hidden="true" />
            </Transition>
          </span>
          <span class="hidden sm:inline">{{ copied ? 'Copied' : 'Copy JSON' }}</span>
        </button>

        <UPopover v-model:open="exportOpen" :content="POPOVER_CONTENT" :ui="POPOVER_UI">
          <button type="button" class="lab-primary-button gap-1.5">
            <Icon name="lucide:download" class="size-3.5" aria-hidden="true" />
            Export
          </button>
          <template #content>
            <div class="w-48 p-1 text-xs">
              <button v-for="theme in (['dark', 'light'] as const)" :key="`svg-${theme}`" type="button" class="lab-menu-item" @click="exportSvg(theme)">
                SVG <span class="text-neutral-400 dark:text-neutral-500">{{ theme }}</span>
              </button>
              <div class="mx-2 my-1 h-px bg-neutral-200 dark:bg-neutral-800" />
              <button v-for="theme in (['dark', 'light'] as const)" :key="`png-${theme}`" type="button" class="lab-menu-item" @click="exportPng(theme)">
                PNG <span class="text-neutral-400 dark:text-neutral-500">{{ theme }} · 1600×800</span>
              </button>
            </div>
          </template>
        </UPopover>

        <span class="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />
        <ColorModeSwitcher />
      </div>
    </header>

    <div class="lab-body" :class="{ 'is-ready': ready }">
      <aside class="lab-panel [grid-area:layers] lg:border-r">
        <LabLayers />
      </aside>

      <main class="[grid-area:canvas] min-h-0 flex flex-col bg-neutral-50 dark:bg-neutral-950/40">
        <LabCanvas class="min-h-0 flex-1" />

        <!-- The composition where it will actually ship: list and card, on both site themes -->
        <section class="border-t border-neutral-200 dark:border-neutral-800" aria-label="Preview">
          <button
            type="button"
            class="w-full flex cursor-pointer items-center gap-1.5 px-4 py-2 text-left"
            :aria-expanded="previewOpen"
            @click="previewOpen = !previewOpen"
          >
            <Icon name="lucide:chevron-right" class="lab-chevron size-3 text-neutral-400" :class="{ 'is-open': previewOpen }" aria-hidden="true" />
            <span class="lab-heading">Preview</span>
            <span class="ml-auto text-[11px] text-neutral-400 dark:text-neutral-500">As it ships on the site</span>
          </button>
          <!-- Kept mounted while collapsed: the exports are read from it -->
          <div class="lab-collapse" :class="{ 'is-open': previewOpen }">
            <div class="min-h-0 overflow-hidden">
              <LabPreview ref="preview" class="px-4 pb-4" />
            </div>
          </div>
        </section>
      </main>

      <aside class="lab-panel [grid-area:inspector] lg:border-l">
        <LabInspector />
      </aside>
    </div>
  </div>
</template>

<style>
/* The editor owns the window on large screens: no page scroll, panels scroll instead */
@media (min-width: 1024px) {
  html.lab-page {
    overflow: hidden;
  }
}
</style>

<style scoped>
/* Canvas first on phones; three panels around it from laptop widths */
.lab-body {
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: 'canvas' 'layers' 'inspector';
  opacity: 0;
}

.lab-body.is-ready {
  opacity: 1;
  transition: opacity 300ms var(--ease-out);
}

@media (min-width: 1024px) {
  .lab-body {
    grid-template-columns: 13rem minmax(0, 1fr) 16rem;
    grid-template-rows: minmax(0, 1fr);
    grid-template-areas: 'layers canvas inspector';
  }
}

@media (min-width: 1440px) {
  .lab-body {
    grid-template-columns: 15rem minmax(0, 1fr) 18rem;
  }
}

.lab-panel {
  padding: 0.75rem;
  border-color: #e5e5e5;
}

.dark .lab-panel {
  border-color: #262626;
}

@media (min-width: 1024px) {
  .lab-panel {
    min-height: 0;
    overflow-y: auto;
  }
}

.lab-toolbar-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  height: 1.75rem;
  font-size: 0.75rem;
  color: #525252;
  cursor: pointer;
  transition: transform 160ms var(--ease-out);
}

.lab-toolbar-button:hover:not(:disabled) {
  background: #f5f5f5;
  color: #171717;
}

.lab-toolbar-button:active:not(:disabled) {
  transform: scale(0.96);
}

.lab-toolbar-button:disabled {
  opacity: 0.35;
  cursor: default;
}

.dark .lab-toolbar-button {
  color: #d4d4d4;
}

.dark .lab-toolbar-button:hover:not(:disabled) {
  background: #262626;
  color: #fafafa;
}

.lab-primary-button {
  display: inline-flex;
  align-items: center;
  height: 1.75rem;
  padding: 0 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: #171717;
  color: #fafafa;
  cursor: pointer;
  transition: transform 160ms var(--ease-out);
}

.lab-primary-button:active:not(:disabled) {
  transform: scale(0.97);
}

.lab-primary-button:disabled {
  opacity: 0.4;
  cursor: default;
}

.dark .lab-primary-button {
  background: #fafafa;
  color: #171717;
}

.lab-toolbar-button:focus-visible,
.lab-primary-button:focus-visible {
  outline: 1px solid #4f7cff;
  outline-offset: 1px;
}

.lab-menu-item {
  display: flex;
  width: 100%;
  gap: 0.375rem;
  padding: 0.375rem 0.5rem;
  text-align: left;
  cursor: pointer;
  outline: none;
}

.lab-menu-item:hover,
.lab-menu-item:focus-visible {
  background: #f5f5f5;
}

.dark .lab-menu-item:hover,
.dark .lab-menu-item:focus-visible {
  background: #262626;
}

.lab-kbd {
  min-width: 1.25rem;
  padding: 0 0.3rem;
  font-family: inherit;
  font-size: 0.6875rem;
  text-align: center;
  color: #525252;
  background: #f5f5f5;
  box-shadow: inset 0 -1px 0 #e5e5e5;
}

.dark .lab-kbd {
  color: #d4d4d4;
  background: #262626;
  box-shadow: inset 0 -1px 0 #404040;
}

.lab-chevron {
  transition: transform 150ms var(--ease-out);
}

.lab-chevron.is-open {
  transform: rotate(90deg);
}

/* Height animates through the grid track, no measuring; the canvas refits as it goes */
.lab-collapse {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms var(--ease-out);
}

.lab-collapse.is-open {
  grid-template-rows: 1fr;
}

/* Copy feedback: a short blurred crossfade reads as one icon morphing */
.lab-swap-enter-active,
.lab-swap-leave-active {
  transition:
    opacity 150ms var(--ease-out),
    transform 150ms var(--ease-out),
    filter 150ms var(--ease-out);
}

.lab-swap-enter-from,
.lab-swap-leave-to {
  opacity: 0;
  transform: scale(0.8);
  filter: blur(2px);
}

@media (prefers-reduced-motion: reduce) {
  .lab-chevron,
  .lab-collapse {
    transition: none;
  }

  .lab-swap-enter-from,
  .lab-swap-leave-to {
    transform: none;
    filter: none;
  }
}
</style>
