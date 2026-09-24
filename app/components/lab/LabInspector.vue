<script setup lang="ts">
import type { ParamDefinition } from '~/art/art'
import { ART_HEIGHT, ART_STROKE, ART_WIDTH, defaultParams, isGroup, LAYER_TYPES } from '~/art/art'

const {
  composition,
  selectedNodes,
  selectedNode,
  entry,
  canGroup,
  updateNode,
  updateParam,
  resetParams,
  duplicateSelected,
  removeSelected,
  groupSelected,
  ungroupSelected,
  flipSelected,
  inheritedStroke,
  strokeSelected,
} = injectLabEditor()

const FLIPS = [
  { axis: 'x', key: 'flipX', label: 'Flip horizontal', icon: 'lucide:flip-horizontal-2', kbd: '⇧H' },
  { axis: 'y', key: 'flipY', label: 'Flip vertical', icon: 'lucide:flip-vertical-2', kbd: '⇧V' },
] as const

const layer = computed(() => selectedNode.value && !isGroup(selectedNode.value) ? selectedNode.value : null)
const group = computed(() => selectedNode.value && isGroup(selectedNode.value) ? selectedNode.value : null)
const definition = computed(() => layer.value ? LAYER_TYPES[layer.value.type] : null)
const inGroup = computed(() => !!entry(selectedNode.value?.id)?.parent)

const params = computed(() => layer.value ? { ...defaultParams(layer.value.type), ...layer.value.params } : {})
const visibleParams = computed(() => definition.value?.params.filter(param => !param.when || param.when(params.value)) ?? [])

function paramValue(param: ParamDefinition) {
  return params.value[param.key] ?? param.default
}

const paramsChanged = computed(() => {
  const current = layer.value
  if (!current)
    return false
  const defaults = defaultParams(current.type)
  return Object.keys(defaults).some(key => current.params[key] !== defaults[key])
})

function field<K extends 'x' | 'y' | 'rotation' | 'scale' | 'opacity'>(key: K) {
  return computed({
    get: () => selectedNode.value?.[key] ?? 0,
    set: (value: number) => {
      if (selectedNode.value)
        updateNode(selectedNode.value.id, { [key]: value })
    },
  })
}

const x = field('x')
const y = field('y')
const rotation = field('rotation')
const scale = field('scale')
const opacity = field('opacity')

/** Shows the first selected node's width, own or inherited; setting it applies to all of them. */
const stroke = computed({
  get: () => {
    const node = selectedNodes.value[0]
    return node ? node.stroke ?? inheritedStroke(node.id) : ART_STROKE.default
  },
  set: strokeSelected,
})

/** Zero drops the key, so compositions without grain keep their JSON unchanged. */
const grain = computed({
  get: () => composition.value.grain ?? 0,
  set: (value: number) => {
    if (value > 0)
      composition.value.grain = value
    else
      delete composition.value.grain
  },
})

const seed = computed({
  get: () => layer.value?.seed ?? 0,
  set: (value: number) => layer.value && updateNode(layer.value.id, { seed: value }),
})

function shuffleSeed() {
  seed.value = Math.floor(Math.random() * 1000)
}

// Inside a group, coordinates are relative to the group's center, so they can go negative
const xRange = computed(() => inGroup.value ? [-ART_WIDTH / 2, ART_WIDTH / 2] : [0, ART_WIDTH])
const yRange = computed(() => inGroup.value ? [-ART_HEIGHT / 2, ART_HEIGHT / 2] : [0, ART_HEIGHT])
</script>

<template>
  <section class="flex flex-col gap-5" aria-label="Inspector">
    <!-- Nothing selected: the composition itself -->
    <template v-if="!selectedNodes.length">
      <h2 class="lab-heading">
        Composition
      </h2>
      <LabSwitch v-model="composition.grid" label="Background grid" />
      <LabSlider v-model="grain" label="Film grain" :min="0" :max="1" :step="0.01" />
      <div class="flex flex-col gap-1.5 border-t border-neutral-200 pt-4 text-xs text-neutral-500 leading-relaxed dark:border-neutral-800 dark:text-neutral-400">
        <p class="m-0">
          Frame and grid are locked, strokes stay thin, and colors come from one palette, so every illustration belongs to the same set.
        </p>
        <p class="m-0">
          Select a layer on the canvas or in the list to edit it. Drag on empty canvas to select several.
        </p>
      </div>
    </template>

    <!-- Several nodes: what can be done to all of them at once -->
    <template v-else-if="!selectedNode">
      <div class="flex items-center justify-between gap-2">
        <h2 class="m-0 text-sm font-medium">
          {{ selectedNodes.length }} layers
        </h2>
        <div class="flex shrink-0 items-center">
          <button type="button" class="lab-tool" aria-label="Duplicate layers" title="Duplicate (⌘D)" @click="duplicateSelected">
            <Icon name="lucide:copy" class="size-3.5" aria-hidden="true" />
          </button>
          <button type="button" class="lab-tool hover:text-rose-600! dark:hover:text-rose-400!" aria-label="Delete layers" title="Delete (⌫)" @click="removeSelected">
            <Icon name="lucide:trash-2" class="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <button type="button" class="lab-action" :disabled="!canGroup" @click="groupSelected">
        <Icon name="lucide:square-dashed" class="size-3.5" aria-hidden="true" />
        Group selection
        <kbd class="lab-action-kbd">⌘G</kbd>
      </button>
      <p v-if="!canGroup" class="m-0 text-[11px] text-neutral-500 -mt-3 dark:text-neutral-400">
        Layers from different groups can’t be grouped together.
      </p>
      <div class="grid grid-cols-2 gap-1">
        <button v-for="flip in FLIPS" :key="flip.axis" type="button" class="lab-action" @click="flipSelected(flip.axis)">
          <Icon :name="flip.icon" class="size-3.5" aria-hidden="true" />
          {{ flip.axis === 'x' ? 'Horizontal' : 'Vertical' }}
          <kbd class="lab-action-kbd">{{ flip.kbd }}</kbd>
        </button>
      </div>
      <LabColors />
      <LabSlider v-model="stroke" label="Stroke" :min="ART_STROKE.min" :max="ART_STROKE.max" :step="ART_STROKE.step" unit="px" />
    </template>

    <!-- One node -->
    <template v-else>
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0 flex items-center gap-2">
          <Icon :name="group ? 'lucide:square-dashed' : definition!.icon" class="size-3.5 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
          <h2 class="m-0 truncate text-sm font-medium">
            {{ selectedNode.name }}
          </h2>
        </div>
        <div class="flex shrink-0 items-center">
          <button type="button" class="lab-tool" aria-label="Duplicate" title="Duplicate (⌘D)" @click="duplicateSelected">
            <Icon name="lucide:copy" class="size-3.5" aria-hidden="true" />
          </button>
          <button type="button" class="lab-tool hover:text-rose-600! dark:hover:text-rose-400!" aria-label="Delete" title="Delete (⌫)" @click="removeSelected">
            <Icon name="lucide:trash-2" class="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <button v-if="group" type="button" class="lab-action" @click="ungroupSelected">
        <Icon name="lucide:ungroup" class="size-3.5" aria-hidden="true" />
        Ungroup
        <kbd class="lab-action-kbd">⇧⌘G</kbd>
      </button>

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <h3 class="lab-heading">
            Transform
          </h3>
          <div class="flex items-center -my-1.5 -mr-1">
            <button
              v-for="flip in FLIPS"
              :key="flip.axis"
              type="button"
              class="lab-tool lab-flip"
              :class="{ 'is-on': selectedNode[flip.key] }"
              :aria-pressed="!!selectedNode[flip.key]"
              :aria-label="flip.label"
              :title="`${flip.label} (${flip.kbd})`"
              @click="flipSelected(flip.axis)"
            >
              <!-- Turns over like a card with each flip: the icon is symmetric, the motion says what happened -->
              <Icon
                :name="flip.icon"
                class="lab-flip-icon size-3.5"
                :class="`is-${flip.axis}`"
                :style="{ '--turn': selectedNode[flip.key] ? '180deg' : '0deg' }"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-1">
          <LabSlider v-model="x" label="X" :min="xRange[0]!" :max="xRange[1]!" :step="0.1" />
          <LabSlider v-model="y" label="Y" :min="yRange[0]!" :max="yRange[1]!" :step="0.1" />
          <LabSlider v-model="rotation" label="Rotate" :min="-180" :max="180" :step="0.1" unit="°" />
          <LabSlider v-model="scale" label="Scale" :min="0.05" :max="4" :step="0.01" />
        </div>
      </div>

      <div v-if="layer && definition" class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <h3 class="lab-heading">
            {{ definition.label }}
          </h3>
          <!-- Always laid out, so the heading row never jumps when it appears -->
          <button
            type="button"
            class="h-5 cursor-pointer px-1 text-[11px] text-neutral-500 transition-opacity duration-150 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            :class="paramsChanged ? 'opacity-100' : 'pointer-events-none opacity-0'"
            :tabindex="paramsChanged ? 0 : -1"
            @click="resetParams(layer.id)"
          >
            Reset
          </button>
        </div>
        <div class="flex flex-col gap-1">
          <template v-for="param in visibleParams" :key="param.key">
            <LabSlider
              v-if="param.kind === 'range'"
              :model-value="paramValue(param) as number"
              :label="param.label"
              :min="param.min"
              :max="param.max"
              :step="param.step"
              :unit="param.unit"
              @update:model-value="updateParam(layer.id, param.key, $event)"
            />
            <LabSegmented
              v-else-if="param.kind === 'choice'"
              class="py-1"
              :model-value="paramValue(param) as string"
              :label="param.label"
              :options="param.options"
              @update:model-value="updateParam(layer.id, param.key, $event)"
            />
            <LabSwitch
              v-else
              :model-value="paramValue(param) as boolean"
              :label="param.label"
              @update:model-value="updateParam(layer.id, param.key, $event)"
            />
          </template>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <h3 class="lab-heading">
          Appearance
        </h3>
        <LabColors class="pb-1" />
        <LabSlider v-model="opacity" label="Opacity" :min="0" :max="1" :step="0.01" />
        <LabSlider v-model="stroke" label="Stroke" :min="ART_STROKE.min" :max="ART_STROKE.max" :step="ART_STROKE.step" unit="px" />
        <div v-if="definition?.random" class="flex gap-1">
          <LabSlider v-model="seed" label="Seed" :min="0" :max="999" :step="1" class="flex-1" />
          <button type="button" class="lab-tool bg-neutral-100 h-7! w-7! dark:bg-neutral-800/70" aria-label="Shuffle seed" title="Shuffle seed (R)" @click="shuffleSeed">
            <Icon name="lucide:dices" class="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.lab-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  cursor: pointer;
  color: #737373;
  transition: transform 160ms var(--ease-out);
}

.lab-tool:hover {
  color: #171717;
}

.dark .lab-tool:hover {
  color: #f5f5f5;
}

.lab-tool:active {
  transform: scale(0.94);
}

.lab-tool.is-on {
  color: #171717;
  background: #f5f5f5;
}

.dark .lab-tool.is-on {
  color: #f5f5f5;
  background: rgb(38 38 38 / 0.7);
}

.lab-flip-icon {
  transition: transform 300ms var(--ease-in-out);
}

.lab-flip-icon.is-x {
  transform: perspective(40px) rotateY(var(--turn));
}

.lab-flip-icon.is-y {
  transform: perspective(40px) rotateX(var(--turn));
}

@media (prefers-reduced-motion: reduce) {
  .lab-flip-icon {
    transition: none;
  }
}

.lab-tool:focus-visible,
.lab-action:focus-visible {
  outline: 1px solid #4f7cff;
  outline-offset: -1px;
}

.lab-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 1.75rem;
  padding: 0 0.5rem;
  font-size: 0.75rem;
  background: #f5f5f5;
  cursor: pointer;
  transition: transform 160ms var(--ease-out);
}

.lab-action:hover:not(:disabled) {
  background: #e5e5e5;
}

.lab-action:active:not(:disabled) {
  transform: scale(0.98);
}

.lab-action:disabled {
  opacity: 0.4;
  cursor: default;
}

.dark .lab-action {
  background: rgb(38 38 38 / 0.7);
}

.dark .lab-action:hover:not(:disabled) {
  background: #404040;
}

.lab-action-kbd {
  margin-left: auto;
  font-family: inherit;
  font-size: 0.6875rem;
  color: #a3a3a3;
}
</style>
