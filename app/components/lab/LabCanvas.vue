<script setup lang="ts">
import type { ArtNode } from '~/art/art'
import type { Matrix, Point } from '~/art/geometry'
import type { Bounds, Measure, SnapLine, SnapTarget } from '~/art/snap'
import type { Guide, NodeEntry } from '~/composables/useLabEditor'
import { useElementBounding, useElementSize, useEventListener } from '@vueuse/core'
import { ART_HEIGHT, ART_WIDTH, isGroup } from '~/art/art'
import { apply, applyVector, IDENTITY, invert, isMirrored, matrixRotation, multiply, nodeMatrix } from '~/art/geometry'
import { alignments, boundsOf, boxTargets, measure as measureBetween, offsetBounds, snapOffset, unionBounds } from '~/art/snap'

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
  = | { mode: 'move', start: Point, targets: MoveTarget[], moved: boolean, bounds: Bounds | null, snaps: { x: SnapTarget[], y: SnapTarget[] } }
    | { mode: 'rotate', id: string, center: Point, startAngle: number, startRotation: number, direction: 1 | -1 }
    | { mode: 'scale', id: string, center: Point, startDistance: number, startScale: number }
    | { mode: 'marquee', start: Point, current: Point, additive: boolean, initial: string[] }

const {
  composition,
  entries,
  entry,
  selectedIds,
  selectedNode,
  primaryId,
  topSelection,
  hoveredId,
  canvasTheme,
  rulersVisible,
  guides,
  addGuide,
  moveGuide,
  removeGuide,
  clearGuides,
  select,
  selectMany,
  updateNode,
  commit,
} = injectLabEditor()

const SELECTION = '#4f7cff'
const GUIDE = '#f43f5e'
/** Must match LabRuler's size and the stage padding below. */
const RULER_PX = 20
/** Alignment crosses, half their size, in screen pixels. */
const MARK_PX = 2.5
/** Screen-pixel sizes, converted to frame units so the chrome never scales with the canvas. */
const HANDLE_PX = 7
const ROTATE_OFFSET_PX = 20
const SNAP_PX = 5
const HIT_PADDING_PX = 6

const root = useTemplateRef<HTMLElement>('root')
const stage = useTemplateRef<HTMLElement>('stage')
const { width: stageWidth } = useElementSize(stage)
const unit = computed(() => ART_WIDTH / Math.max(stageWidth.value, 1))

// Where the frame sits in the stage, for the rulers and guides drawn around it
const rootBox = useElementBounding(root)
const frameBox = useElementBounding(stage)
// The frame can move without resizing (the preview panel opening below it): follow the stage
watch([rootBox.width, rootBox.height, rulersVisible], () => nextTick(frameBox.update))

const frameOffset = computed(() => ({ left: frameBox.left.value - rootBox.left.value, top: frameBox.top.value - rootBox.top.value }))
/** Screen pixels per frame unit. */
const ppu = computed(() => 1 / unit.value)
/** Before the first measure, every position would collapse onto the frame origin. */
const measured = computed(() => stageWidth.value > 0 && frameBox.width.value > 0)

// Interaction state, read by the chrome below
const drag = shallowRef<Drag | null>(null)
const hud = shallowRef<{ left: number, top: number, text: string } | null>(null)
const hoverCursor = ref('default')
const snapLines = shallowRef<SnapLine[]>([])
const litGuides = shallowRef<Set<string>>(new Set())
/** The pointer in frame units, anywhere over the stage: the rulers mark it. */
const pointer = shallowRef<Point | null>(null)
const altHeld = ref(false)

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

function frameBounds(id: string): Bounds | null {
  const points = outline(id)
  return points ? boundsOf(points) : null
}

const FRAME_BOUNDS: Bounds = { minX: 0, minY: 0, maxX: ART_WIDTH, maxY: ART_HEIGHT }

/** The whole selection as one box, in frame units: what the rulers and ⌥ measure. */
const selectionBounds = computed(() => unionBounds(selectionOutlines.value.map(item => boundsOf(item.points))))

/**
 * What a moving selection can align with: the frame (edges, middle, thirds), every other
 * visible node's edges and middle, and the ruler guides. Collected once per drag.
 */
function snapTargets(moving: Set<string>) {
  const x: SnapTarget[] = [ART_WIDTH / 3, ART_WIDTH * 2 / 3].map(value => ({ value, from: 0, to: ART_HEIGHT }))
  const y: SnapTarget[] = [ART_HEIGHT / 3, ART_HEIGHT * 2 / 3].map(value => ({ value, from: 0, to: ART_WIDTH }))
  x.push(...boxTargets(FRAME_BOUNDS, 'x'))
  y.push(...boxTargets(FRAME_BOUNDS, 'y'))
  for (const item of entries.value.values()) {
    // Not what moves, not what contains it (its box moves along), not what it contains
    const related = moving.has(item.node.id)
      || item.ancestors.some(ancestor => moving.has(ancestor.id))
      || [...moving].some(id => entry(id)?.ancestors.some(ancestor => ancestor.id === item.node.id))
    if (related || !isShown(item))
      continue
    const bounds = frameBounds(item.node.id)
    if (!bounds)
      continue
    x.push(...boxTargets(bounds, 'x'))
    y.push(...boxTargets(bounds, 'y'))
  }
  if (rulersVisible.value) {
    for (const guide of guides.value) {
      const target = { value: guide.value, from: -Infinity, to: Infinity, guideId: guide.id }
      ;(guide.axis === 'x' ? x : y).push(target)
    }
  }
  return { x, y }
}

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
  // Along the node's own "up", which a vertical flip turns into down: the handle follows its top edge
  const [ux, uy] = applyVector(world, [0, -1])
  const length = Math.hypot(ux, uy) || 1
  const offset = ROTATE_OFFSET_PX * unit.value
  const rotateHandle: Point = [topCenter[0] + ux / length * offset, topCenter[1] + uy / length * offset]
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

// ⌥ with a selection: distances to the layer under the pointer, or to the frame edges

useEventListener('keydown', (event: KeyboardEvent) => (altHeld.value = event.altKey))
useEventListener('keyup', (event: KeyboardEvent) => (altHeld.value = event.altKey))
// Released outside the window (⌥-tab), the keyup never comes
useEventListener('blur', () => (altHeld.value = false))

const measureTarget = computed(() => {
  const id = hoveredId.value
  if (id && !selectedIds.value.includes(id))
    return { id, bounds: frameBounds(id) }
  return { id: null, bounds: FRAME_BOUNDS }
})

const measurement = computed(() => {
  const bounds = selectionBounds.value
  const target = measureTarget.value.bounds
  if (!altHeld.value || drag.value || !bounds || !target)
    return null
  const segments = measureBetween(bounds, target).map(item => ({ ...item, label: formatDistance(item.to - item.from) }))
  return { segments, outline: measureTarget.value.id ? outline(measureTarget.value.id) : null }
})

function formatDistance(value: number) {
  return String(Math.round(value * 10) / 10)
}

/** Segment endpoints, for the SVG line. */
function segmentPoints(item: Measure) {
  return item.axis === 'x'
    ? { x1: item.from, x2: item.to, y1: item.at, y2: item.at }
    : { x1: item.at, x2: item.at, y1: item.from, y2: item.to }
}

/** Where a segment's label sits, in screen pixels inside the frame. */
function labelPosition(item: Measure) {
  const middle = (item.from + item.to) / 2
  const [fx, fy] = item.axis === 'x' ? [middle, item.at] : [item.at, middle]
  return { left: `${fx * ppu.value}px`, top: `${fy * ppu.value}px` }
}

/** Crosses on every point an alignment passes through. */
function snapMarks(line: SnapLine) {
  const size = MARK_PX * unit.value
  let d = ''
  for (const mark of new Set(line.marks.map(value => Math.round(value * 100) / 100))) {
    const [x, y] = line.axis === 'x' ? [line.value, mark] : [mark, line.value]
    d += `M${x - size} ${y - size}L${x + size} ${y + size}M${x - size} ${y + size}L${x + size} ${y - size}`
  }
  return d
}

// Rulers and guides

/** Ruler lengths and where frame 0 falls on each, measured from the ruler's own start. */
const rulerLayout = computed(() => ({
  width: Math.max(0, rootBox.width.value - RULER_PX),
  height: Math.max(0, rootBox.height.value - RULER_PX),
  left: frameOffset.value.left - RULER_PX,
  top: frameOffset.value.top - RULER_PX,
}))

const rulerSelection = computed(() => {
  const bounds = selectionBounds.value
  return bounds ? { x: [bounds.minX, bounds.maxX] as [number, number], y: [bounds.minY, bounds.maxY] as [number, number] } : null
})

interface GuideDrag { id: string, axis: Guide['axis'] }
const guideDrag = shallowRef<GuideDrag | null>(null)
/** While a dragged guide is over its ruler, letting go removes it. */
const guideRemoving = ref(false)

/**
 * Screen position of a guide inside the stage. Not rounded: the SVG strokes it lines up with
 * sit on fractional pixels too, and a guide snapped to the pixel grid would visibly miss them.
 * The 1px line is centered on the value, like an SVG stroke, hence the half pixel.
 */
function guideStyle(guide: Guide) {
  return guide.axis === 'x'
    ? { transform: `translateX(${frameOffset.value.left + guide.value * ppu.value - 0.5}px)` }
    : { transform: `translateY(${frameOffset.value.top + guide.value * ppu.value - 0.5}px)` }
}

function guideValue(event: PointerEvent, axis: Guide['axis']) {
  const raw = axis === 'x'
    ? (event.clientX - frameBox.left.value) / ppu.value
    : (event.clientY - frameBox.top.value) / ppu.value
  // Whole units, or tens with ⇧: guides are for round numbers
  const step = event.shiftKey ? 10 : 1
  return Math.round(raw / step) * step
}

function overOwnRuler(event: PointerEvent, axis: Guide['axis']) {
  // Vertical guides come from the left ruler, horizontal ones from the top ruler
  return axis === 'x'
    ? event.clientX - rootBox.left.value < RULER_PX
    : event.clientY - rootBox.top.value < RULER_PX
}

/** Dragging out of a ruler pulls a new guide; its orientation follows the ruler's. */
function onRulerPointerDown(event: PointerEvent, axis: Guide['axis']) {
  if (event.button !== 0)
    return
  const id = addGuide(axis, guideValue(event, axis))
  startGuideDrag(event, { id, axis })
}

function onGuidePointerDown(event: PointerEvent, guide: Guide) {
  if (event.button !== 0)
    return
  startGuideDrag(event, { id: guide.id, axis: guide.axis })
}

function startGuideDrag(event: PointerEvent, next: GuideDrag) {
  guideDrag.value = next
  guideRemoving.value = overOwnRuler(event, next.axis)
  ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
  event.preventDefault()
  event.stopPropagation()
}

function onGuidePointerMove(event: PointerEvent) {
  const current = guideDrag.value
  if (!current)
    return
  const value = guideValue(event, current.axis)
  moveGuide(current.id, value)
  guideRemoving.value = overOwnRuler(event, current.axis)
  showHud(event, guideRemoving.value ? 'Remove guide' : `${current.axis.toUpperCase()} ${value}`)
}

function onGuidePointerUp(event: PointerEvent) {
  const current = guideDrag.value
  if (!current)
    return
  if (overOwnRuler(event, current.axis))
    removeGuide(current.id)
  guideDrag.value = null
  guideRemoving.value = false
  hud.value = null
}

function onStagePointerMove(event: PointerEvent) {
  if (!frameBox.width.value)
    return
  pointer.value = [(event.clientX - frameBox.left.value) / ppu.value, (event.clientY - frameBox.top.value) / ppu.value]
}

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
    // Under a mirrored group, the node's angle runs the other way from the pointer's
    const direction = isMirrored(worlds.value.get(node.id)!.parent) ? -1 : 1
    drag.value = handle === 'rotate'
      ? { mode: 'rotate', id: node.id, center, startAngle: Math.atan2(point[1] - center[1], point[0] - center[0]), startRotation: node.rotation, direction }
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
      const targets = moveTargets()
      const moving = new Set(targets.map(target => target.id))
      const bounds = unionBounds(targets.map(target => frameBounds(target.id)).filter((item): item is Bounds => !!item))
      drag.value = { mode: 'move', start: point, targets, moved: false, bounds, snaps: snapTargets(moving) }
    }
  }

  // Capture so the drag survives the pointer leaving the canvas
  svgElement()!.setPointerCapture(event.pointerId)
  event.preventDefault()
}

function tenth(value: number) {
  return Math.round(value * 10) / 10
}

// Four decimals: exact on screen, without float noise (271.99999…) in the JSON
function tidy(value: number) {
  return Math.round(value * 10000) / 10000
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
    // ⇧ locks the drag to one axis, which then neither moves nor snaps
    const lock = event.shiftKey ? (Math.abs(dx) > Math.abs(dy) ? 'y' : 'x') : null
    if (lock === 'y')
      dy = 0
    if (lock === 'x')
      dx = 0

    const lines: SnapLine[] = []
    const lit = new Set<string>()
    let snappedX = false
    let snappedY = false
    if (current.bounds && !event.altKey) {
      // Magnetic edges: the selection's sides and middle pull onto anything within a few pixels
      const threshold = SNAP_PX * unit.value
      const moved = offsetBounds(current.bounds, dx, dy)
      const offsetX = lock === 'x' ? null : snapOffset(moved, 'x', current.snaps.x, threshold)
      const offsetY = lock === 'y' ? null : snapOffset(moved, 'y', current.snaps.y, threshold)
      dx += offsetX ?? 0
      dy += offsetY ?? 0
      snappedX = offsetX !== null
      snappedY = offsetY !== null
      const placed = offsetBounds(current.bounds, dx, dy)
      for (const [axis, offset] of [['x', offsetX], ['y', offsetY]] as const) {
        if (offset === null)
          continue
        const found = alignments(placed, axis, current.snaps[axis])
        lines.push(...found.lines)
        found.guideIds.forEach(id => lit.add(id))
      }
    }
    snapLines.value = lines
    litGuides.value = lit

    // Tenths while free, so values stay tidy; exact once snapped, or the snap would miss by a hair
    const roundX = snappedX ? tidy : tenth
    const roundY = snappedY ? tidy : tenth
    for (const target of current.targets) {
      // The frame delta, expressed in the node's own parent space
      const [lx, ly] = applyVector(target.toLocal, [dx, dy])
      updateNode(target.id, { x: roundX(target.startX + lx), y: roundY(target.startY + ly) })
    }
    // The selection's top-left corner, like the rulers: the position you'd type in a design tool
    if (current.bounds)
      showHud(event, `${Math.round(current.bounds.minX + dx)}, ${Math.round(current.bounds.minY + dy)}`)
    return
  }

  if (current.mode === 'rotate') {
    const angle = Math.atan2(point[1] - current.center[1], point[0] - current.center[0])
    let rotation = current.startRotation + current.direction * (angle - current.startAngle) * 180 / Math.PI
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
  snapLines.value = []
  litGuides.value = new Set()
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

function onStagePointerLeave() {
  if (!drag.value && !guideDrag.value)
    pointer.value = null
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

const rootCursor = computed(() => {
  const current = guideDrag.value
  if (!current)
    return undefined
  if (guideRemoving.value)
    return 'default'
  return current.axis === 'x' ? 'ew-resize' : 'ns-resize'
})

const CORNER_HANDLES = ['nw', 'ne', 'se', 'sw'] as const
</script>

<template>
  <div
    ref="root"
    class="lab-stage relative flex items-center justify-center overflow-hidden"
    :class="{ 'has-rulers': rulersVisible }"
    :style="{ cursor: rootCursor }"
    @pointermove="onStagePointerMove"
    @pointerleave="onStagePointerLeave"
  >
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
          <!-- Smart guides: one line per alignment, a cross on everything it lines up -->
          <g v-for="line in snapLines" :key="`${line.axis}-${line.value}`" :stroke="GUIDE" stroke-width="1">
            <line v-bind="line.axis === 'x' ? { x1: line.value, x2: line.value, y1: line.from, y2: line.to } : { y1: line.value, y2: line.value, x1: line.from, x2: line.to }" vector-effect="non-scaling-stroke" />
            <path :d="snapMarks(line)" vector-effect="non-scaling-stroke" />
          </g>
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
          <!-- ⌥ measuring: the target, and the distances to it -->
          <g v-if="measurement" :stroke="GUIDE" stroke-width="1">
            <polygon v-if="measurement.outline" :points="polygon(measurement.outline)" vector-effect="non-scaling-stroke" />
            <template v-for="(item, index) in measurement.segments" :key="index">
              <line v-bind="segmentPoints(item)" vector-effect="non-scaling-stroke" />
              <line
                v-if="item.extension"
                v-bind="item.axis === 'x'
                  ? { x1: item.extension.value, x2: item.extension.value, y1: item.extension.from, y2: item.extension.to }
                  : { y1: item.extension.value, y2: item.extension.value, x1: item.extension.from, x2: item.extension.to }"
                stroke-dasharray="2 2"
                vector-effect="non-scaling-stroke"
              />
            </template>
          </g>
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

      <template v-if="measurement">
        <span
          v-for="(item, index) in measurement.segments"
          :key="index"
          class="lab-measure-label"
          :style="labelPosition(item)"
        >
          {{ item.label }}
        </span>
      </template>

      <div
        v-if="hud"
        class="tabular-nums pointer-events-none absolute z-30 whitespace-nowrap bg-neutral-900 px-1.5 py-0.5 text-[11px] text-white dark:bg-white dark:text-neutral-900"
        :style="{ left: `${hud.left}px`, top: `${hud.top}px` }"
      >
        {{ hud.text }}
      </div>
    </div>

    <template v-if="rulersVisible && measured">
      <!-- Guides span the whole stage, like the rulers they come from -->
      <div class="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
        <div
          v-for="guide in guides"
          :key="guide.id"
          class="lab-guide"
          :class="[`is-${guide.axis}`, {
            'is-lit': litGuides.has(guide.id) || guideDrag?.id === guide.id,
            'is-removing': guideRemoving && guideDrag?.id === guide.id,
          }]"
          :style="guideStyle(guide)"
          @pointerdown="onGuidePointerDown($event, guide)"
          @pointermove="onGuidePointerMove"
          @pointerup="onGuidePointerUp"
          @pointercancel="onGuidePointerUp"
        />
      </div>

      <!-- Dragging out of the top ruler pulls a horizontal guide, out of the left one a vertical guide -->
      <div
        class="lab-ruler-track is-x"
        @pointerdown="onRulerPointerDown($event, 'y')"
        @pointermove="onGuidePointerMove"
        @pointerup="onGuidePointerUp"
        @pointercancel="onGuidePointerUp"
      >
        <LabRuler
          axis="x"
          :length="rulerLayout.width"
          :origin="rulerLayout.left"
          :ppu="ppu"
          :extent="ART_WIDTH"
          :selection="rulerSelection?.x"
          :cursor="pointer?.[0] ?? null"
        />
      </div>
      <div
        class="lab-ruler-track is-y"
        @pointerdown="onRulerPointerDown($event, 'x')"
        @pointermove="onGuidePointerMove"
        @pointerup="onGuidePointerUp"
        @pointercancel="onGuidePointerUp"
      >
        <LabRuler
          axis="y"
          :length="rulerLayout.height"
          :origin="rulerLayout.top"
          :ppu="ppu"
          :extent="ART_HEIGHT"
          :selection="rulerSelection?.y"
          :cursor="pointer?.[1] ?? null"
        />
      </div>
      <div class="lab-ruler-corner">
        <Transition name="lab-corner">
          <button
            v-if="guides.length"
            type="button"
            class="lab-ruler-clear"
            aria-label="Clear guides"
            title="Clear guides"
            @click="clearGuides"
          >
            <Icon name="lucide:x" class="size-3" aria-hidden="true" />
          </button>
        </Transition>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Room around the frame for handles that overflow it */
.lab-stage {
  --stage-padding: 2.5rem;
  --ruler: 20px;
  padding: var(--stage-padding) 1.25rem;
}

/* The rulers take their strip off the top and left, the frame refits in what is left */
.lab-stage.has-rulers {
  padding: calc(var(--stage-padding) + var(--ruler)) 1.25rem var(--stage-padding) calc(1.25rem + var(--ruler));
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

  .lab-stage.has-rulers {
    padding: var(--ruler) 0 0 var(--ruler);
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

/* Rulers: pinned to the stage edges, counting in frame units */
.lab-ruler-track,
.lab-ruler-corner {
  position: absolute;
  z-index: 20;
}

.lab-ruler-track.is-x {
  top: 0;
  left: var(--ruler);
  right: 0;
  height: var(--ruler);
  cursor: row-resize;
}

.lab-ruler-track.is-y {
  top: var(--ruler);
  left: 0;
  bottom: 0;
  width: var(--ruler);
  cursor: col-resize;
}

.lab-ruler-corner {
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ruler);
  height: var(--ruler);
  background: #fff;
}

.dark .lab-ruler-corner {
  background: #171717;
}

/* Hairlines between rulers and stage, drawn over the ruler so they never double up */
.lab-ruler-track::after,
.lab-ruler-corner::after {
  content: '';
  position: absolute;
  pointer-events: none;
  inset: 0;
  box-shadow: inset -1px -1px 0 #e5e5e5;
}

.lab-ruler-track.is-x::after {
  box-shadow: inset 0 -1px 0 #e5e5e5;
}

.lab-ruler-track.is-y::after {
  box-shadow: inset -1px 0 0 #e5e5e5;
}

.dark .lab-ruler-track.is-x::after {
  box-shadow: inset 0 -1px 0 #262626;
}

.dark .lab-ruler-track.is-y::after {
  box-shadow: inset -1px 0 0 #262626;
}

.dark .lab-ruler-corner::after {
  box-shadow: inset -1px -1px 0 #262626;
}

.lab-ruler-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #a3a3a3;
  cursor: pointer;
  transition:
    transform 160ms var(--ease-out),
    opacity 150ms var(--ease-out);
}

.lab-ruler-clear:hover {
  color: #f43f5e;
}

.lab-ruler-clear:active {
  transform: scale(0.9);
}

.lab-ruler-clear:focus-visible {
  outline: 1px solid #4f7cff;
  outline-offset: -2px;
}

.lab-corner-enter-from,
.lab-corner-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.lab-corner-leave-active {
  transition-duration: 100ms;
}

/* Guides: a 1px line inside a wider grab strip */
.lab-guide {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
}

.lab-guide.is-x {
  bottom: 0;
  width: 9px;
  margin-left: -4px;
  cursor: ew-resize;
}

.lab-guide.is-y {
  right: 0;
  height: 9px;
  margin-top: -4px;
  cursor: ns-resize;
}

.lab-guide::before {
  content: '';
  position: absolute;
  background: #f43f5e;
  opacity: 0.5;
}

.lab-guide.is-x::before {
  top: 0;
  bottom: 0;
  left: 4px;
  width: 1px;
}

.lab-guide.is-y::before {
  left: 0;
  right: 0;
  top: 4px;
  height: 1px;
}

/* Instant: it answers the pointer, and snapping lights it on every frame of a drag */
.lab-guide:hover::before,
.lab-guide.is-lit::before {
  opacity: 1;
}

.lab-guide.is-removing::before {
  opacity: 0.2;
}

.lab-measure-label {
  position: absolute;
  z-index: 20;
  padding: 0 3px;
  font-size: 10px;
  line-height: 14px;
  font-variant-numeric: tabular-nums;
  color: #fff;
  background: #f43f5e;
  white-space: nowrap;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

@media (prefers-reduced-motion: reduce) {
  .lab-corner-enter-from,
  .lab-corner-leave-to {
    transform: none;
  }
}
</style>
