<script setup lang="ts">
import type { ArtNode } from '~/art/art'
import { artColorValue, isGroup, LAYER_TYPES } from '~/art/art'

interface Row {
  node: ArtNode
  depth: number
  parentId: string | null
  /** Index in its siblings, in drawing order (0 is the bottom). */
  index: number
  group: boolean
  collapsed: boolean
}

interface Drop { rowId: string, zone: 'above' | 'below' | 'inside' }

const { composition, selectedIds, hoveredId, collapsedIds, entry, select, updateNode, moveNode, toggleCollapsed } = injectLabEditor()

// Listed top to bottom, like every design tool: the last drawn node comes first
const rows = computed(() => {
  const list: Row[] = []
  const walk = (nodes: ArtNode[], depth: number, parentId: string | null) => {
    for (let index = nodes.length - 1; index >= 0; index--) {
      const node = nodes[index]!
      const group = isGroup(node)
      const collapsed = group && collapsedIds.value.includes(node.id)
      list.push({ node, depth, parentId, index, group, collapsed })
      if (group && !collapsed)
        walk(node.children, depth + 1, node.id)
    }
  }
  walk(composition.value.layers, 0, null)
  return list
})

function iconFor(node: ArtNode) {
  return isGroup(node) ? 'lucide:square-dashed' : LAYER_TYPES[node.type].icon
}

/** Own colors only: the icon tells which node to select to change it. */
function tintFor(node: ArtNode) {
  return node.color && node.color !== 'ink' ? { color: artColorValue(node.color, 'auto') } : undefined
}

function onRowClick(event: MouseEvent, id: string) {
  select(id, event.shiftKey || event.metaKey || event.ctrlKey ? 'toggle' : 'replace')
}

// Rename

const renamingId = ref<string | null>(null)
const renameDraft = ref('')
const renameInput = useTemplateRef<HTMLInputElement[]>('renameInput')

async function startRename(id: string, name: string) {
  renamingId.value = id
  renameDraft.value = name
  await nextTick()
  renameInput.value?.[0]?.select()
}

function finishRename(apply: boolean) {
  if (renamingId.value && apply && renameDraft.value.trim())
    updateNode(renamingId.value, { name: renameDraft.value.trim() })
  renamingId.value = null
}

// Reordering by drag: above or below a row, or into a group

const draggingId = ref<string | null>(null)
const drop = ref<Drop | null>(null)

function onDragStart(event: DragEvent, id: string) {
  draggingId.value = id
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('text/plain', id)
}

function onDragOver(event: DragEvent, row: Row) {
  if (!draggingId.value || draggingId.value === row.node.id)
    return
  // A group can't go inside itself or its own children
  if (entry(row.node.id)?.ancestors.some(ancestor => ancestor.id === draggingId.value))
    return
  event.preventDefault()
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const ratio = (event.clientY - rect.top) / rect.height
  let zone: Drop['zone'] = ratio < 0.5 ? 'above' : 'below'
  if (row.group) {
    // Groups take the middle as "inside"; an open group's lower edge is its first child's slot
    if (ratio >= 0.25 && (ratio <= 0.75 || !row.collapsed))
      zone = 'inside'
  }
  drop.value = { rowId: row.node.id, zone }
}

function onDrop() {
  const target = drop.value && rows.value.find(row => row.node.id === drop.value!.rowId)
  if (draggingId.value && target && drop.value) {
    if (drop.value.zone === 'inside' && isGroup(target.node))
      moveNode(draggingId.value, target.node.id, target.node.children.length)
    else
      // Above in the list is later in drawing order
      moveNode(draggingId.value, target.parentId, target.index + (drop.value.zone === 'above' ? 1 : 0))
  }
  onDragEnd()
}

function onDragEnd() {
  draggingId.value = null
  drop.value = null
}

const INDENT = 14
</script>

<template>
  <section class="flex flex-col gap-2" aria-label="Layers">
    <div class="flex items-center justify-between">
      <h2 class="lab-heading">
        Layers
      </h2>
      <LabAddMenu />
    </div>

    <p v-if="!rows.length" class="m-0 px-2 py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
      No layers yet.
    </p>

    <ul v-else class="list-none relative m-0 flex flex-col p-0">
      <li
        v-for="row in rows"
        :key="row.node.id"
        :draggable="renamingId !== row.node.id"
        class="group relative h-8 flex cursor-default items-center gap-1.5 pr-1 text-xs"
        :class="[
          selectedIds.includes(row.node.id)
            ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
            : hoveredId === row.node.id ? 'bg-neutral-50 dark:bg-neutral-800/50' : '',
          { 'opacity-40': draggingId === row.node.id },
          { 'ring-1 ring-inset ring-[#4f7cff]': drop?.rowId === row.node.id && drop.zone === 'inside' },
        ]"
        :style="{ paddingLeft: `${4 + row.depth * INDENT}px` }"
        @click="onRowClick($event, row.node.id)"
        @dblclick="startRename(row.node.id, row.node.name)"
        @mouseenter="hoveredId = row.node.id"
        @mouseleave="hoveredId = null"
        @dragstart="onDragStart($event, row.node.id)"
        @dragover="onDragOver($event, row)"
        @drop.prevent="onDrop"
        @dragend="onDragEnd"
      >
        <span
          v-if="drop?.rowId === row.node.id && drop.zone !== 'inside'"
          class="pointer-events-none absolute right-0 h-px bg-[#4f7cff]"
          :class="drop.zone === 'above' ? 'top-0' : 'bottom-0'"
          :style="{ left: `${4 + row.depth * INDENT}px` }"
          aria-hidden="true"
        />

        <button
          v-if="row.group"
          type="button"
          class="size-4 inline-flex shrink-0 cursor-pointer items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          :aria-label="row.collapsed ? `Expand ${row.node.name}` : `Collapse ${row.node.name}`"
          :aria-expanded="!row.collapsed"
          @click.stop="toggleCollapsed(row.node.id)"
        >
          <Icon name="lucide:chevron-right" class="lab-chevron size-3" :class="{ 'is-open': !row.collapsed }" aria-hidden="true" />
        </button>
        <span v-else class="size-4 shrink-0" aria-hidden="true" />

        <Icon
          :name="iconFor(row.node)"
          class="pub-art-auto size-3.5 shrink-0"
          :style="tintFor(row.node)"
          :class="selectedIds.includes(row.node.id) ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-500'"
          aria-hidden="true"
        />

        <input
          v-if="renamingId === row.node.id"
          ref="renameInput"
          v-model="renameDraft"
          type="text"
          :aria-label="`Rename ${row.node.name}`"
          class="h-6 min-w-0 flex-1 border-0 bg-white px-1 text-xs outline-none ring-1 ring-[#4f7cff] dark:bg-neutral-900"
          @click.stop
          @keydown.stop.enter="finishRename(true)"
          @keydown.stop.escape="finishRename(false)"
          @blur="finishRename(true)"
        >
        <button
          v-else
          type="button"
          class="min-w-0 flex-1 cursor-default truncate border-0 bg-transparent p-0 text-left outline-none focus-visible:underline"
          :class="[
            row.node.visible ? '' : 'text-neutral-400 dark:text-neutral-500',
            selectedIds.includes(row.node.id) ? 'font-medium' : 'text-neutral-600 dark:text-neutral-300',
          ]"
          :aria-pressed="selectedIds.includes(row.node.id)"
          @click.stop="onRowClick($event, row.node.id)"
        >
          {{ row.node.name }}
        </button>

        <!-- Visibility: always shown when hidden, otherwise only on hover, to keep the list calm -->
        <button
          type="button"
          class="size-6 inline-flex shrink-0 cursor-pointer items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 focus-visible:opacity-100 dark:hover:text-neutral-100"
          :class="row.node.visible ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'"
          :aria-label="row.node.visible ? `Hide ${row.node.name}` : `Show ${row.node.name}`"
          @click.stop="updateNode(row.node.id, { visible: !row.node.visible })"
        >
          <Icon :name="row.node.visible ? 'lucide:eye' : 'lucide:eye-off'" class="size-3.5" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* Instant on click would read as a jump; a short turn shows which way it went */
.lab-chevron {
  transition: transform 150ms var(--ease-out);
}

.lab-chevron.is-open {
  transform: rotate(90deg);
}

@media (prefers-reduced-motion: reduce) {
  .lab-chevron {
    transition: none;
  }
}
</style>
