<script setup lang="ts">
import type { ArtNode } from '~/art/art'
import type { Matrix, Point } from '~/art/geometry'
import type { NodeEntry } from '~/composables/useLabEditor'
import { useElementSize } from '@vueuse/core'
import { ART_HEIGHT, ART_WIDTH, isGroup } from '~/art/art'
import { apply, applyVector, IDENTITY, invert, matrixRotation, multiply, nodeMatrix } from '~/art/geometry'

interface Box {
  x: number
  y: number
  width: number
  height: number
}

interface MoveTarget {
  id: string
  startX: number
  startY: number
  toLocal: Matrix
  toFrame: Matrix
}

type Drag
  = | { mode: 'move', start: Point, targets: MoveTarget[], moved: boolean }
    | { mode: 'rotate', id: string, center: Point, startAngle: number, startRotation: number }
    | { mode: 'scale', id: string, center: Point, startDistance: number, startScale: number }
    | { mode: 'marquee', start: Point, current: Point, additive: boolean, initial: string[] }

const { composition, entries, entry, selectedIds, selectedNode, primaryId, topSelection, hoveredId, canvasTheme, select, selectMany, updateNode, commit } = injectLabEditor()

const SELECTION = '#4f7cff'
const GUIDE = '#f43f5e'
/** Screen-pixel sizes, converted to frame units so the chrome never scales with the canvas. */
const HANDLE_PX = 7
const ROTATE_OFFSET_PX = 20
const SNAP_PX = 5
const HIT_PADDING_PX = 6

const stage = useTemplateRef<HTMLElement>('stage')
const { width: stageWidth } = useElementSize(stage)
const unit = computed(() => ART_WIDTH / Math.max(stageWidth.value, 1))

// Interaction state, read by the chrome below
const drag = shallowRef<Drag | null>(null)
const guides = shallowRef<{ x: number | null, y: number | null }>({ x: null, y: null })
const hud = shallowRef<{ left: number, top: number, text: string } | null>(null)
const hoverCursor = ref('default')

// Local bounding boxes, measured from the rendered groups (strokes excluded)
const boxes = shallowRef<Record<string, Box>>({})

function svgElement() {
  return stage.value?.querySelector('svg') ?? null
}

function measure() {
  const svg = svgElement()
  if (!svg)
    return
  const next: Record<string, Box> = {}
  for (const group of svg.querySelectorAll<SVGGElement>('g[data-node-id]')) {
    const { x, y, width, height } = group.getBBox()
    next[group.dataset.nodeId!] = { x, y, width, height }
  }
  boxes.value = next
}

watch(composition, measure, { deep: true, flush: 'post' })
onMounted(measure)

// Geometry: every node's local space mapped to the frame, through its groups

const worlds = computed(() => {
  const map = new Map<string, { world: Matrix, parent: Matrix }>()
  const walk = (nodes: ArtNode[], parent: Matrix) => {
    for (const node of nodes) {
      const world = multiply(parent, nodeMatrix(node))
      map.set(node.id, { world, parent })
      if (isGroup(node))
        walk(node.children, world)
    }
  }
  walk(composition.value.layers, IDENTITY)
  return map
})

function isShown(item: NodeEntry) {
  return item.node.visible && item.ancestors.every(ancestor => ancestor.visible)
}

/** Drawn leaves, topmost first: what a click can land on. */
const leaves = computed(() => [...entries.value.values()]
  .filter(item => !isGroup(item.node) && isShown(item))
  .sort((a, b) => b.order - a.order))

function worldScale([a, b]: Matrix) {
  return Math.hypot(a, b) || 1
}

function contains(id: string, point: Point) {
  const box = boxes.value[id]
  const world = worlds.value.get(id)?.world
  if (!box || !world)
    return false
  // Grown so hairline layers (a single line) stay easy to grab
  const pad = HIT_PADDING_PX * unit.value / worldScale(world)
  const [lx, ly] = apply(invert(world), point)
  return lx >= box.x - pad && lx <= box.x + box.width + pad && ly >= box.y - pad && ly <= box.y + box.height + pad
}

function leafAt(point: Point) {
  return leaves.value.find(item => contains(item.node.id, point))
}

/**
 * Which node a click on `leaf` means. Like Figma: the outermost group, unless the current
 * selection already sits inside one of its groups, in which case the node at that level.
 */
function resolveTarget(leaf: NodeEntry, deep: boolean) {
  if (deep)
    return leaf.node.id
  const chain = [...leaf.ancestors, leaf.node]
  const context = entry(primaryId.value)?.parent?.id ?? null
  const level = chain.findIndex(node => (entry(node.id)?.parent?.id ?? null) === context)
  return chain[level === -1 ? 0 : level]!.id
}

function outline(id: string): Point[] | null {
  const box = boxes.value[id]
  const world = worlds.value.get(id)?.world
  if (!box || !world)
    return null
  return ([
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x + box.width, box.y + box.height],
    [box.x, box.y + box.height],
  ] as Point[]).map(point => apply(world, point))
}

function polygon(points: Point[]) {
  return points.map(([x, y]) => `${x},${y}`).join(' ')
}

const selectionOutlines = computed(() => selectedIds.value
  .filter(id => entry(id) && isShown(entry(id)!))
  .map(id => ({ id, points: outline(id) }))
  .filter((item): item is { id: string, points: Point[] } => !!item.points))

const hoverOutline = computed(() => {
  const id = hoveredId.value
  if (!id || selectedIds.value.includes(id) || drag.value)
    return null
  const item = entry(id)
  return item && isShown(item) ? outline(id) : null
})

const handles = computed(() => {
  const node = selectedNode.value
  const item = node && entry(node.id)
  const box = node && boxes.value[node.id]
  const world = node && worlds.value.get(node.id)?.world
  if (!node || !item || !isShown(item) || !box || !world)
    return null
  const corners = outline(node.id)!
  const topCenter = apply(world, [box.x + box.width / 2, box.y])
  const rotation = matrixRotation(world)
  const angle = rotation * Math.PI / 180
  const offset = ROTATE_OFFSET_PX * unit.value
  const rotateHandle: Point = [topCenter[0] + Math.sin(angle) * offset, topCenter[1] - Math.cos(angle) * offset]
  return { corners, topCenter, rotateHandle, rotation }
})

const marquee = computed(() => {
  const current = drag.value
  if (current?.mode !== 'marquee')
    return null
  return {
    x: Math.min(current.start[0], current.current[0]),
    y: Math.min(current.start[1], current.current[1]),
    width: Math.abs(current.current[0] - current.start[0]),
    height: Math.abs(current.current[1] - current.start[1]),
  }
})

// Pointer handling: one set of handlers on the frame, dispatching on what was pressed

function framePoint(event: PointerEvent | MouseEvent): Point {
  const svg = svgElement()!
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM()!.inverse())
  return [point.x, point.y]
}

function showHud(event: PointerEvent, text: string) {
  const rect = stage.value!.getBoundingClientRect()
  hud.value = { left: event.clientX - rect.left + 14, top: event.clientY - rect.top + 14, text }
}

function originInFrame(id: string): Point {
  const item = entry(id)!
  return apply(worlds.value.get(id)!.parent, [item.node.x, item.node.y])
}

function moveTargets(): MoveTarget[] {
  return topSelection.value.map((item) => {
    const parent = worlds.value.get(item.node.id)!.parent
    return { id: item.node.id, startX: item.node.x, startY: item.node.y, toLocal: invert(parent), toFrame: parent }
  })
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0)
    return
  const point = framePoint(event)
  const handle = (event.target as Element).closest<SVGElement>('[data-handle]')?.dataset.handle
  const node = selectedNode.value

  if (handle && node) {
    const center = originInFrame(node.id)
    drag.value = handle === 'rotate'
      ? { mode: 'rotate', id: node.id, center, startAngle: Math.atan2(point[1] - center[1], point[0] - center[0]), startRotation: node.rotation }
      : { mode: 'scale', id: node.id, center, startDistance: Math.max(Math.hypot(point[0] - center[0], point[1] - center[1]), 0.001), startScale: node.scale }
  }
  else {
    const leaf = leafAt(point)
    if (!leaf) {
      drag.value = { mode: 'marquee', start: point, current: point, additive: event.shiftKey, initial: event.shiftKey ? selectedIds.value : [] }
    }
    else {
      const id = resolveTarget(leaf, event.metaKey || event.ctrlKey)
      if (event.shiftKey)
        select(id, 'toggle')
      // Pressing a node that is part of a multi-selection drags the whole selection
      else if (!selectedIds.value.includes(id))
        select(id)
      drag.value = { mode: 'move', start: point, targets: moveTargets(), moved: false }
    }
  }

  // Capture so the drag survives the pointer leaving the canvas
  svgElement()!.setPointerCapture(event.pointerId)
  event.preventDefault()
}

function snap(value: number, candidates: number[], threshold: number) {
  let best: number | null = null
  for (const candidate of candidates) {
    if (Math.abs(candidate - value) <= threshold && (best === null || Math.abs(candidate - value) < Math.abs(best - value)))
      best = candidate
  }
  return best
}

function onPointerMove(event: PointerEvent) {
  const point = framePoint(event)
  const current = drag.value

  if (!current) {
    // Hover: highlight what a click would pick, and say so with the cursor
    const handle = (event.target as Element).closest<SVGElement>('[data-handle]')?.dataset.handle
    const leaf = leafAt(point)
    hoveredId.value = leaf ? resolveTarget(leaf, event.metaKey || event.ctrlKey) : null
    hoverCursor.value = handle === 'rotate' ? 'grab' : handle === 'nw' || handle === 'se' ? 'nwse-resize' : handle ? 'nesw-resize' : leaf ? 'move' : 'default'
    return
  }

  if (current.mode === 'marquee') {
    drag.value = { ...current, current: point }
    const box = marquee.value!
    // Marquee picks nodes at the root, the level you see before entering a group
    const hits = composition.value.layers.filter((node) => {
      const points = node.visible ? outline(node.id) : null
      if (!points)
        return false
      const xs = points.map(([x]) => x)
      const ys = points.map(([, y]) => y)
      return Math.max(...xs) >= box.x && Math.min(...xs) <= box.x + box.width && Math.max(...ys) >= box.y && Math.min(...ys) <= box.y + box.height
    }).map(node => node.id)
    selectMany([...new Set([...current.initial, ...hits])])
    return
  }

  if (current.mode === 'move') {
    let dx = point[0] - current.start[0]
    let dy = point[1] - current.start[1]
    // A few pixels of slop, so a click never nudges anything
    if (!current.moved && Math.hypot(dx, dy) < 3 * unit.value)
      return
    current.moved = true
    if (event.shiftKey) {
      if (Math.abs(dx) > Math.abs(dy))
        dy = 0
      else dx = 0
    }

    let guideX: number | null = null
    let guideY: number | null = null
    const lead = current.targets[0]
    if (lead && !event.altKey) {
      // Smart guides on the lead node: frame center and thirds, and other root nodes' centers
      const [ox, oy] = apply(lead.toFrame, [lead.startX, lead.startY])
      const moving = new Set(current.targets.map(target => target.id))
      const others = composition.value.layers.filter(node => !moving.has(node.id) && node.visible)
      const threshold = SNAP_PX * unit.value
      guideX = snap(ox + dx, [ART_WIDTH / 2, ART_WIDTH / 3, ART_WIDTH * 2 / 3, ...others.map(node => node.x)], threshold)
      guideY = snap(oy + dy, [ART_HEIGHT / 2, ART_HEIGHT / 3, ART_HEIGHT * 2 / 3, ...others.map(node => node.y)], threshold)
      if (guideX !== null)
        dx = guideX - ox
      if (guideY !== null)
        dy = guideY - oy
    }
    guides.value = { x: guideX, y: guideY }

    for (const target of current.targets) {
      // The frame delta, expressed in the node's own parent space
      const [lx, ly] = applyVector(target.toLocal, [dx, dy])
      updateNode(target.id, { x: Math.round((target.startX + lx) * 10) / 10, y: Math.round((target.startY + ly) * 10) / 10 })
    }
    if (lead) {
      const [fx, fy] = apply(lead.toFrame, [lead.startX, lead.startY])
      showHud(event, `${Math.round(fx + dx)}, ${Math.round(fy + dy)}`)
    }
    return
  }

  if (current.mode === 'rotate') {
    const angle = Math.atan2(point[1] - current.center[1], point[0] - current.center[0])
    let rotation = current.startRotation + (angle - current.startAngle) * 180 / Math.PI
    rotation = ((rotation + 540) % 360) - 180
    if (event.shiftKey) {
      rotation = Math.round(rotation / 15) * 15
    }
    else {
      // Soft magnet on right angles and diagonals
      const nearest = Math.round(rotation / 45) * 45
      if (Math.abs(nearest - rotation) < 2)
        rotation = nearest
    }
    rotation = Math.round(rotation * 10) / 10
    updateNode(current.id, { rotation })
    showHud(event, `${Math.round(rotation)}°`)
    return
  }

  const distance = Math.hypot(point[0] - current.center[0], point[1] - current.center[1])
  let scale = current.startScale * distance / current.startDistance
  scale = event.shiftKey ? Math.round(scale * 4) / 4 : Math.round(scale * 100) / 100
  scale = Math.min(10, Math.max(0.05, scale))
  updateNode(current.id, { scale })
  showHud(event, `${Math.round(scale * 100)}%`)
}

function onPointerUp() {
  const current = drag.value
  if (current?.mode === 'marquee' && !marquee.value?.width && !marquee.value?.height && !current.additive)
    select(null)
  if (current && current.mode !== 'marquee' && (current.mode !== 'move' || current.moved))
    commit()
  drag.value = null
  guides.value = { x: null, y: null }
  hud.value = null
}

/** Double-click enters a group: selects its child under the pointer. */
function onDoubleClick(event: MouseEvent) {
  const leaf = leafAt(framePoint(event))
  if (!leaf)
    return
  const chain = [...leaf.ancestors, leaf.node]
  const level = chain.findIndex(node => node.id === primaryId.value)
  const next = chain[level + 1]
  if (level !== -1 && next)
    select(next.id)
}

function onPointerLeave() {
  if (!drag.value)
    hoveredId.value = null
}

const cursor = computed(() => {
  const mode = drag.value?.mode
  if (mode === 'rotate')
    return 'grabbing'
  if (mode === 'move')
    return 'move'
  if (mode === 'scale')
    return 'nwse-resize'
  if (mode === 'marquee')
    return 'crosshair'
  return hoverCursor.value
})

const CORNER_HANDLES = ['nw', 'ne', 'se', 'sw'] as const
</script>

<template>
  <div class="lab-stage relative flex items-center justify-center overflow-hidden">
    <div
      ref="stage"
      class="lab-frame relative"
      :style="{ cursor }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerLeave"
      @dblclick="onDoubleClick"
    >
      <PubArt :composition="composition" :theme="canvasTheme" class="aspect-[2/1] w-full overflow-visible">
        <!-- Editor chrome: drawn in frame units, sized in screen pixels -->
        <g class="pointer-events-none" fill="none">
          <line v-if="guides.x !== null" :x1="guides.x" :x2="guides.x" y1="0" :y2="ART_HEIGHT" :stroke="GUIDE" stroke-width="1" vector-effect="non-scaling-stroke" />
          <line v-if="guides.y !== null" :y1="guides.y" :y2="guides.y" x1="0" :x2="ART_WIDTH" :stroke="GUIDE" stroke-width="1" vector-effect="non-scaling-stroke" />
          <polygon v-if="hoverOutline" :points="polygon(hoverOutline)" :stroke="SELECTION" stroke-width="1" vector-effect="non-scaling-stroke" />
          <polygon
            v-for="item in selectionOutlines"
            :key="item.id"
            :points="polygon(item.points)"
            :stroke="SELECTION"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
          <rect
            v-if="marquee"
            v-bind="marquee"
            :fill="SELECTION"
            fill-opacity="0.08"
            :stroke="SELECTION"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
        </g>
        <g v-if="handles && drag?.mode !== 'move'">
          <line
            :x1="handles.topCenter[0]"
            :y1="handles.topCenter[1]"
            :x2="handles.rotateHandle[0]"
            :y2="handles.rotateHandle[1]"
            :stroke="SELECTION"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
            class="pointer-events-none"
          />
          <circle
            data-handle="rotate"
            :cx="handles.rotateHandle[0]"
            :cy="handles.rotateHandle[1]"
            :r="HANDLE_PX / 2 * unit"
            fill="white"
            :stroke="SELECTION"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
          <!-- Invisible, larger hit areas: a 7px square is too small to aim at -->
          <circle data-handle="rotate" :cx="handles.rotateHandle[0]" :cy="handles.rotateHandle[1]" :r="HANDLE_PX * 1.5 * unit" fill="transparent" />
          <g
            v-for="(corner, index) in handles.corners"
            :key="CORNER_HANDLES[index]"
            :transform="`translate(${corner[0]} ${corner[1]}) rotate(${handles.rotation})`"
          >
            <rect
              :data-handle="CORNER_HANDLES[index]"
              :x="-HANDLE_PX * 1.5 * unit"
              :y="-HANDLE_PX * 1.5 * unit"
              :width="HANDLE_PX * 3 * unit"
              :height="HANDLE_PX * 3 * unit"
              fill="transparent"
            />
            <rect
              :data-handle="CORNER_HANDLES[index]"
              :x="-HANDLE_PX / 2 * unit"
              :y="-HANDLE_PX / 2 * unit"
              :width="HANDLE_PX * unit"
              :height="HANDLE_PX * unit"
              fill="white"
              :stroke="SELECTION"
              stroke-width="1"
              vector-effect="non-scaling-stroke"
            />
          </g>
        </g>
      </PubArt>

      <div
        v-if="!composition.layers.length"
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center text-sm"
        :class="canvasTheme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'"
      >
        <span class="font-medium" :class="canvasTheme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'">Empty canvas</span>
        <span class="text-xs">Add a layer or start from a preset.</span>
      </div>

      <div
        v-if="hud"
        class="tabular-nums pointer-events-none absolute z-10 whitespace-nowrap bg-neutral-900 px-1.5 py-0.5 text-[11px] text-white dark:bg-white dark:text-neutral-900"
        :style="{ left: `${hud.left}px`, top: `${hud.top}px` }"
      >
        {{ hud.text }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Room around the frame for handles that overflow it */
.lab-stage {
  --stage-padding: 2.5rem;
  padding: var(--stage-padding) 1.25rem;
}

.lab-frame {
  width: 100%;
  touch-action: none;
  user-select: none;
}

/* Full-screen editor: the frame fills whatever the stage gives it, height or width first */
@media (min-width: 1024px) {
  .lab-stage {
    height: 100%;
    container-type: size;
    padding: 0;
  }

  .lab-frame {
    /* Handles overflow the frame vertically (rotation) more than sideways, so less side room */
    width: min(100cqw - 3rem, (100cqh - var(--stage-padding) * 2) * 2);
  }
}

/* Faint inner edge so the light canvas doesn't dissolve into the stage */
.lab-frame::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  outline: 1px solid rgb(0 0 0 / 0.1);
  outline-offset: -1px;
}

.dark .lab-frame::after {
  outline-color: rgb(255 255 255 / 0.1);
}
</style>
