<script setup lang="ts">
import type { FlowPlayer } from '~/composables/useFlowPlayer'
import type { SpringState } from '~/utils/flow/geometry'
import type { FlowDirection } from '~/utils/flow/graph'
import type { FlowGraph, FlowNodeSpec, FlowPoint, FlowRect, FlowSize, FlowStatus, FlowViewport } from '~/utils/flow/types'
import { useEventListener, useIntersectionObserver, useMediaQuery, useResizeObserver, useScrollLock } from '@vueuse/core'
import { boundsOf, dropPath, easeInOut, edgePath, fitViewport, loopPath, springSettled, springStep, zoomAt } from '~/utils/flow/geometry'
import { lineageOf, neighbourIn, stagesOf } from '~/utils/flow/graph'
import { edgeId, LOOP_EDGE } from '~/utils/flow/types'

// A workflow drawn as nodes on a dotted canvas, left to right. Nodes sit where the graph puts them and
// can be moved by hand; the view pans, zooms and opens full screen. What the flow is doing comes from
// a player (see useFlowPlayer); what a node's footer and side panel show comes from the slots.
// Below `md` the same graph reads as a vertical list instead (FlowStack).
interface FlowCanvasProps {
  graph: FlowGraph
  player?: FlowPlayer
  /** Accessible name of the canvas */
  label?: string
  /** Height inline, in pixels: full screen takes the window */
  height?: number
  nodeWidth?: number
  /** Whether a node can be dragged around. Off, a press on a node pans the view like anywhere else */
  movable?: boolean
}

const props = withDefaults(defineProps<FlowCanvasProps>(), {
  label: 'Workflow',
  height: 440,
  nodeWidth: 224,
  movable: true,
})

defineSlots<{
  footer?: (props: { node: FlowNodeSpec, status: FlowStatus }) => any
  inspector?: (props: { node: FlowNodeSpec, status: FlowStatus }) => any
}>()

const selected = defineModel<string | null>('selected', { default: null })

const { play } = useSound()
const { prefersReducedMotion } = usePrefersReducedMotion()
const motionOk = () => !prefersReducedMotion.value

// Room for the kicker above a node, and for the return path under the lowest one
const KICKER = 22
const LOOP_GAP = 34
const PANEL = 312
const TOOLBAR = 52
const ZOOM_STEP = 1.25
const GUESS_HEIGHT = 96

const host = ref<HTMLElement>()
const root = ref<HTMLElement>()
const world = ref<HTMLElement>()
const dots = ref<HTMLElement>()

const isDesktop = useMediaQuery('(min-width: 768px)')

// Whether the flow has run once: until then, a paused flow invites to be played
const hasPlayed = ref(false)
watch(() => props.player?.playing.value, (on) => {
  if (on)
    hasPlayed.value = true
}, { immediate: true })

const statusOf = (id: string): FlowStatus => props.player?.status.value[id] ?? 'idle'
const byId = computed(() => new Map(props.graph.nodes.map(node => [node.id, node])))
const stages = computed(() => stagesOf(props.graph.nodes.map(node => node.id), props.graph.edges))
const selectedNode = computed(() => (selected.value ? byId.value.get(selected.value) ?? null : null))

// --- Sizes: measured, so edges meet the nodes whatever their content ---

const sizes = shallowRef(new Map<string, FlowSize>())
const sizeOf = (id: string): FlowSize => sizes.value.get(id) ?? { width: props.nodeWidth, height: GUESS_HEIGHT }
const nodeEls = new Map<string, HTMLElement>()
let observer: ResizeObserver | undefined

function measure(id: string, el: HTMLElement) {
  const card = el.querySelector<HTMLElement>('.card') ?? el
  const known = sizes.value.get(id)
  if (known?.width === card.offsetWidth && known.height === card.offsetHeight)
    return
  const next = new Map(sizes.value)
  next.set(id, { width: card.offsetWidth, height: card.offsetHeight })
  sizes.value = next
}

function bindNode(id: string, el: unknown) {
  if (!(el instanceof HTMLElement) || nodeEls.get(id) === el)
    return
  if (nodeEls.has(id))
    observer?.unobserve(nodeEls.get(id)!)
  nodeEls.set(id, el)
  observer?.observe(el)
  measure(id, el)
}

// --- Positions: where the graph puts a node, unless a hand moved it; springs between the two ---

const manual = shallowRef(new Map<string, FlowPoint>())
const dragging = ref<string | null>(null)
const display = new Map<string, { x: SpringState, y: SpringState }>()
const frame = ref(0)
let springRaf = 0
let springLast = 0

function target(id: string): FlowPoint {
  const node = byId.value.get(id)
  return manual.value.get(id) ?? { x: node?.x ?? 0, y: node?.y ?? 0 }
}

function positionOf(id: string): FlowPoint {
  void frame.value
  const shown = display.get(id)
  return shown ? { x: shown.x.x, y: shown.y.x } : target(id)
}

function springTick(now: number) {
  springRaf = 0
  const dt = springLast ? Math.min((now - springLast) / 1000, 1 / 30) : 1 / 60
  springLast = now
  let moving = false
  for (const [id, shown] of display) {
    if (dragging.value === id)
      continue
    const to = target(id)
    if (motionOk() && !(springSettled(shown.x, to.x) && springSettled(shown.y, to.y))) {
      springStep(shown.x, to.x, dt)
      springStep(shown.y, to.y, dt)
      moving = true
    }
    else {
      shown.x = { x: to.x, v: 0 }
      shown.y = { x: to.y, v: 0 }
    }
  }
  frame.value++
  if (moving)
    springRaf = requestAnimationFrame(springTick)
  else
    springLast = 0
}

function springAll() {
  for (const node of props.graph.nodes) {
    if (!display.has(node.id)) {
      const at = positionOf(node.id)
      display.set(node.id, { x: { x: at.x, v: 0 }, y: { x: at.y, v: 0 } })
    }
  }
  if (!springRaf)
    springRaf = requestAnimationFrame(springTick)
}

const moved = computed(() => manual.value.size > 0)

function resetLayout() {
  manual.value = new Map()
  springAll()
  play('toggle', { direction: 'back', emphasis: 'subtle' })
}

// --- Edges, loop and balls ---

function rectOf(id: string): FlowRect {
  return { ...positionOf(id), ...sizeOf(id) }
}

const edges = computed(() => props.graph.edges.map((edge) => {
  const a = rectOf(edge.from)
  const b = rectOf(edge.to)
  return {
    id: edgeId(edge),
    stage: stages.value.get(edge.from) ?? 0,
    ...(edge.vertical
      ? dropPath({ x: a.x + a.width / 2, y: a.y + a.height }, { x: b.x + b.width / 2, y: b.y })
      : edgePath({ x: a.x + a.width, y: a.y + a.height / 2 }, { x: b.x, y: b.y + b.height / 2 })),
  }
}))

const loop = computed(() => {
  const spec = props.graph.loop
  if (!spec)
    return null
  const floor = Math.max(...props.graph.nodes.map(node => rectOf(node.id).y + rectOf(node.id).height)) + LOOP_GAP
  const a = rectOf(spec.from)
  const b = rectOf(spec.to)
  return { ...spec, ...loopPath({ x: a.x + a.width / 2, y: a.y + a.height }, { x: b.x + b.width / 2, y: b.y + b.height }, floor) }
})

const pathEls = new Map<string, SVGPathElement>()

function bindPath(id: string, el: unknown) {
  if (el instanceof SVGPathElement)
    pathEls.set(id, el)
  else
    pathEls.delete(id)
}

const FADE = 0.12
const balls = computed(() => {
  if (!props.player || !isDesktop.value || !motionOk())
    return []
  void frame.value
  return props.player.packets.value.flatMap((packet) => {
    const path = pathEls.get(packet.edge)
    if (!path)
      return []
    const length = path.getTotalLength()
    const point = path.getPointAtLength(easeInOut(packet.t) * length)
    return [{
      id: packet.id,
      loop: packet.edge === LOOP_EDGE,
      transform: `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`,
      opacity: Math.min(1, packet.t / FADE, (1 - packet.t) / FADE),
    }]
  })
})

// An edge carrying a ball is drawn in ink, like the node it leaves
const hotEdges = computed(() => new Set(props.player?.packets.value.map(packet => packet.edge) ?? []))

// --- Hover: a node lights up everything it depends on and everything that depends on it ---

const hovered = ref<string | null>(null)
const lineage = computed(() => (hovered.value && !dragging.value ? lineageOf(hovered.value, props.graph.edges) : null))
const dimmed = (id: string) => !!lineage.value && !lineage.value.nodes.has(id)
const edgeDimmed = (id: string) => !!lineage.value && !lineage.value.edges.has(id)

// --- Viewport ---

// Not reactive: it changes on every pointer move and only the world's style depends on it
let view: FlowViewport = { x: 0, y: 0, k: 1 }
// Once the user moved the view, resizing the canvas no longer refits it under their hands
let userMoved = false
const zoomPercent = ref(100)
// Hidden until the first fit, so the graph never shows unplaced
const ready = ref(false)
// The entrance cascade only plays once: afterwards a dimmed node must not wait for its stage's delay
const intro = ref(true)
const panning = ref(false)
const expanded = ref(false)
// Growing into full screen or shrinking back: the canvas changes size every frame, and must not refit each time
const morphing = ref(false)

const insets = computed(() => ({ bottom: TOOLBAR, right: selectedNode.value ? PANEL : 0 }))

function area(): FlowSize {
  return { width: root.value?.clientWidth ?? 0, height: root.value?.clientHeight ?? 0 }
}

function applyView(animate: boolean) {
  if (!world.value || !dots.value)
    return
  world.value.classList.toggle('is-gliding', animate && motionOk())
  world.value.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.k})`
  const step = 20 * view.k
  dots.value.style.backgroundPosition = `${view.x}px ${view.y}px`
  dots.value.style.backgroundSize = `${step}px ${step}px`
  // Dots closer than this read as a texture, not a grid
  dots.value.style.opacity = step < 9 ? '0' : '1'
  zoomPercent.value = Math.round(view.k * 100)
}

function setView(next: FlowViewport, { animate = false, user = false } = {}) {
  view = next
  if (user)
    userMoved = true
  applyView(animate)
}

function graphBounds() {
  const rects = props.graph.nodes.map((node) => {
    const rect = rectOf(node.id)
    return { ...rect, y: rect.y - KICKER, height: rect.height + KICKER }
  })
  if (loop.value)
    rects.push({ x: loop.value.labelAt.x, y: loop.value.labelAt.y, width: 1, height: 16 })
  return boundsOf(rects)
}

function fit(animate = true) {
  const bounds = graphBounds()
  const a = area()
  if (!bounds || !a.width || !a.height)
    return
  userMoved = false
  setView(fitViewport(bounds, a, { insets: insets.value, padding: 16 }), { animate })
}

function zoomBy(factor: number, animate = true) {
  const a = area()
  const anchor = { x: (a.width - insets.value.right) / 2, y: (a.height - insets.value.bottom) / 2 }
  setView(zoomAt(view, view.k * factor, anchor), { animate, user: true })
}

/** Pans just enough to bring a node clear of the edges and of the side panel */
function reveal(id: string, animate = true) {
  const rect = rectOf(id)
  const a = area()
  const pad = 24
  const left = rect.x * view.k + view.x
  const top = (rect.y - KICKER) * view.k + view.y
  const right = left + rect.width * view.k
  const bottom = (rect.y + rect.height) * view.k + view.y
  const maxRight = a.width - insets.value.right - pad
  const maxBottom = a.height - insets.value.bottom - pad
  const dx = left < pad ? pad - left : right > maxRight ? maxRight - right : 0
  const dy = top < pad ? pad - top : bottom > maxBottom ? maxBottom - bottom : 0
  if (dx || dy)
    setView({ ...view, x: view.x + dx, y: view.y + dy }, { animate })
}

onMounted(() => {
  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const id = (entry.target as HTMLElement).dataset.id
      if (id)
        measure(id, entry.target as HTMLElement)
    }
  })
  for (const el of nodeEls.values())
    observer.observe(el)
  nextTick(() => {
    fit(false)
    ready.value = true
    setTimeout(() => (intro.value = false), 900)
  })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(springRaf)
})

// Resizing the canvas (or the window, full screen) keeps the graph framed, until the user takes over
useResizeObserver(root, () => {
  if (ready.value && !userMoved && !morphing.value)
    fit(false)
})

// The side panel takes room: an untouched view refits the whole graph beside it (and back once it
// closes), a view the user framed only moves the selected node out from under it
watch(selected, (id, previous) => {
  nextTick(() => {
    if (!userMoved && !id !== !previous)
      fit()
    else if (id)
      reveal(id)
  })
})

// The flow only plays while it can be seen
useIntersectionObserver(host, ([entry]) => {
  if (props.player)
    props.player.setVisible(!!entry?.isIntersecting)
})

// --- Pointer: a press drags the node under it, or the view; both wait for 4px, so a click stays a click ---

let press: { id: number, x: number, y: number, node: string | null, origin: FlowPoint, view: FlowViewport, active: boolean } | null = null
let suppressClick = false

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0 || (e.target as Element).closest('[data-flow-ui]'))
    return
  const node = props.movable ? ((e.target as Element).closest<HTMLElement>('[data-flow-node]')?.dataset.id ?? null) : null
  press = { id: e.pointerId, x: e.clientX, y: e.clientY, node, origin: node ? positionOf(node) : { x: 0, y: 0 }, view: { ...view }, active: false }
}

function onPointerMove(e: PointerEvent) {
  if (!press || e.pointerId !== press.id)
    return
  const dx = e.clientX - press.x
  const dy = e.clientY - press.y
  if (!press.active) {
    if (Math.hypot(dx, dy) < 4)
      return
    press.active = true
    root.value?.setPointerCapture(e.pointerId)
    if (press.node) {
      dragging.value = press.node
      springAll()
    }
    else {
      panning.value = true
    }
  }
  if (press.node) {
    const at = { x: press.origin.x + dx / view.k, y: press.origin.y + dy / view.k }
    const next = new Map(manual.value)
    next.set(press.node, at)
    manual.value = next
    // In the hand, not on a spring: the node follows the pointer exactly
    display.set(press.node, { x: { x: at.x, v: 0 }, y: { x: at.y, v: 0 } })
    frame.value++
  }
  else {
    setView({ ...view, x: press.view.x + dx, y: press.view.y + dy }, { user: true })
  }
}

function onPointerUp(e: PointerEvent) {
  if (!press || e.pointerId !== press.id)
    return
  if (press.active) {
    suppressClick = true
    setTimeout(() => (suppressClick = false))
    if (press.node)
      play('tap', { emphasis: 'subtle' })
  }
  press = null
  dragging.value = null
  panning.value = false
}

function onClick(e: MouseEvent) {
  if (suppressClick || (e.target as Element).closest('[data-flow-ui]'))
    return
  const node = (e.target as Element).closest<HTMLElement>('[data-flow-node]')?.dataset.id ?? null
  select(node === selected.value ? null : node)
}

function select(id: string | null) {
  if (id === selected.value)
    return
  if (id)
    play('select', { emphasis: 'subtle' })
  else
    play('close', { emphasis: 'subtle' })
  selected.value = id
}

// Pinch on a trackpad arrives as ctrl + wheel. A plain wheel is left to the page, unless the canvas
// is full screen: stealing the page's scroll inline would trap whoever scrolls past it.
useEventListener(root, 'wheel', (e: WheelEvent) => {
  // The side panel scrolls on its own, even full screen
  if ((e.target as Element).closest('[data-flow-ui]') && !e.ctrlKey && !e.metaKey)
    return
  if (!e.ctrlKey && !e.metaKey) {
    if (!expanded.value)
      return
    e.preventDefault()
    setView({ ...view, x: view.x - e.deltaX, y: view.y - e.deltaY }, { user: true })
    return
  }
  e.preventDefault()
  const rect = root.value!.getBoundingClientRect()
  const delta = Math.max(-24, Math.min(24, -e.deltaY)) * 0.01
  setView(zoomAt(view, view.k * Math.exp(delta), { x: e.clientX - rect.left, y: e.clientY - rect.top }), { user: true })
}, { passive: false })

// --- Keyboard ---

const ARROWS: Record<string, FlowDirection> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }

function focusNode(id: string) {
  nodeEls.get(id)?.focus({ preventScroll: true })
  if (selected.value)
    select(id)
  reveal(id)
}

// With the side panel open, the keyboard carries it along: it shows the node that has the focus. A press
// focuses a node too, and then its click decides, so only a focus that came from the keyboard counts.
function onNodeFocus(e: FocusEvent, id: string) {
  if (selected.value && selected.value !== id && (e.target as HTMLElement).matches(':focus-visible'))
    select(id)
}

function onNodeKeydown(e: KeyboardEvent, id: string) {
  const direction = ARROWS[e.key]
  if (direction) {
    e.preventDefault()
    const centres = new Map(props.graph.nodes.map((node) => {
      const rect = rectOf(node.id)
      return [node.id, { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }]
    }))
    const next = neighbourIn(direction, id, centres)
    if (next)
      focusNode(next)
  }
  else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    select(selected.value === id ? null : id)
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey)
    return
  switch (e.key) {
    case '+':
    case '=':
      zoomBy(ZOOM_STEP, false)
      break
    case '-':
      zoomBy(1 / ZOOM_STEP, false)
      break
    case '0':
      fit()
      break
    case 'Escape':
      if (selected.value) {
        const id = selected.value
        select(null)
        nodeEls.get(id)?.focus({ preventScroll: true })
      }
      else if (expanded.value) {
        toggleExpanded()
      }
      else {
        return
      }
      break
    default:
      return
  }
  e.preventDefault()
}

// --- Full screen: the same canvas, teleported over the page ---

const scrollLock = useScrollLock(import.meta.client ? document.body : null)
const expandButton = ref<{ $el: HTMLElement }>()

// Same curve and length as the view gliding to its new fit, so the frame and the graph move as one
const MORPH: KeyframeAnimationOptions = { duration: 420, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }

/**
 * FLIP: the canvas is measured where it is, switched to where it goes (teleported over the page, or
 * back into the article), then animated from the old box to the new one. Size is animated rather than
 * scale, so the nodes never stretch; meanwhile an untouched view glides to its fit for the new size.
 */
async function toggleExpanded() {
  const el = root.value
  if (!el || morphing.value)
    return
  const from = el.getBoundingClientRect()
  const animate = motionOk()
  // Set before the switch renders, so the view's glide already picks the morph's curve
  morphing.value = animate
  expanded.value = !expanded.value
  scrollLock.value = expanded.value
  play(expanded.value ? 'open' : 'close', { emphasis: 'subtle' })
  await nextTick()
  const to = el.getBoundingClientRect()
  // Whatever the view was, the graph lands framed in its new space
  fit(animate)
  if (animate) {
    await el.animate([
      { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)`, width: `${from.width}px`, height: `${from.height}px` },
      { transform: 'translate(0, 0)', width: `${to.width}px`, height: `${to.height}px` },
    ], MORPH).finished.catch(() => {})
    morphing.value = false
    // Settled at its final size: frame it once more, in case the glide was cut short
    fit(false)
  }
  expandButton.value?.$el.focus({ preventScroll: true })
}

onBeforeUnmount(() => (scrollLock.value = false))

const STATUS_LABEL: Record<FlowStatus, string> = { idle: 'Waiting', running: 'Running', done: 'Done', error: 'Failed' }
</script>

<template>
  <figure ref="host" class="flow-host breakout my-8" data-no-highlight>
    <!-- Phones: the graph as a vertical list -->
    <div class="md:hidden">
      <FlowStack v-model:selected="selected" :graph="graph" :player="player">
        <template v-if="$slots.footer" #footer="scope">
          <slot name="footer" v-bind="scope" />
        </template>
        <template v-if="$slots.inspector" #inspector="scope">
          <slot name="inspector" v-bind="scope" />
        </template>
      </FlowStack>
      <FlowControls v-if="player" :player="player" :step="false" :inviting="!hasPlayed" class="ml-auto mt-6 w-fit" tips="top-end" />
    </div>

    <div class="hidden md:block" :style="{ height: `${height}px` }">
      <Teleport to="body">
        <Transition name="flow-fade">
          <div v-if="expanded" class="flow-backdrop fixed inset-0 z-[59]" aria-hidden="true" />
        </Transition>
      </Teleport>
      <Teleport to="body" :disabled="!expanded">
        <div
          :class="expanded ? 'fixed inset-0 z-[60] p-3 sm:p-5' : 'h-full'"
          @click.self="toggleExpanded"
        >
          <div
            ref="root"
            role="group"
            :aria-label="label"
            aria-roledescription="workflow canvas"
            class="relative flow-root h-full select-none overflow-hidden border border-neutral-200 rounded-2xl bg-white dark:border-neutral-800 dark:bg-neutral-900"
            :class="[{ 'is-ready': ready, 'is-intro': intro, 'is-panning': panning, 'is-expanded': expanded, 'is-morphing': morphing }]"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @click="onClick"
            @keydown="onKeydown"
          >
            <div ref="dots" class="flow-dots pointer-events-none absolute inset-0" aria-hidden="true" />

            <div ref="world" class="flow-world absolute left-0 top-0 origin-top-left">
              <svg
                class="pointer-events-none absolute left-0 top-0 overflow-visible"
                width="1"
                height="1"
                fill="none"
                stroke-width="1.25"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <g
                  v-for="edge in edges"
                  :key="edge.id"
                  class="flow-edge"
                  :class="{ 'is-hot': hotEdges.has(edge.id), 'is-lit': lineage?.edges.has(edge.id), 'is-dim': edgeDimmed(edge.id) }"
                  :style="{ '--stage': edge.stage }"
                >
                  <path :ref="el => bindPath(edge.id, el)" :d="edge.d" pathLength="1" class="flow-edge-line" />
                  <path :d="edge.arrow" class="flow-edge-arrow" />
                </g>
                <g v-if="loop" class="flow-loop" :class="{ 'is-dim': !!lineage }">
                  <path
                    :ref="el => bindPath(LOOP_EDGE, el)"
                    :d="loop.d"
                    class="flow-loop-line"
                    :class="{ 'is-flowing': player?.playing.value }"
                  />
                  <path :d="loop.arrow" />
                </g>
                <g v-for="ball in balls" :key="ball.id" class="flow-ball" :transform="ball.transform" :opacity="ball.opacity">
                  <circle r="9" class="halo" />
                  <circle r="4.5" class="core" />
                </g>
              </svg>

              <div
                v-if="loop"
                class="flow-loop-label absolute flex items-center gap-1.5 whitespace-nowrap border border-neutral-300 rounded-full border-dashed bg-white px-2.5 py-1 text-[11px] text-neutral-600 font-medium dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
                :style="{ left: `${loop.labelAt.x}px`, top: `${loop.labelAt.y}px` }"
              >
                <Icon name="lucide:repeat-2" class="size-3" />
                {{ loop.label }}
              </div>

              <div
                v-for="node in graph.nodes"
                :key="node.id"
                :ref="el => bindNode(node.id, el)"
                data-flow-node
                :data-id="node.id"
                tabindex="0"
                role="button"
                :aria-pressed="selected === node.id"
                :aria-label="`${node.kicker ? `${node.kicker}: ` : ''}${node.title}, ${STATUS_LABEL[statusOf(node.id)]}`"
                class="flow-node-wrap absolute left-0 top-0 rounded-[14px] outline-none"
                :class="{ 'is-dragging': dragging === node.id }"
                :style="{
                  'width': `${nodeWidth}px`,
                  'transform': `translate(${positionOf(node.id).x}px, ${positionOf(node.id).y}px)`,
                  '--stage': stages.get(node.id) ?? 0,
                }"
                @pointerenter="hovered = node.id"
                @pointerleave="hovered === node.id && (hovered = null)"
                @focus="onNodeFocus($event, node.id)"
                @keydown="onNodeKeydown($event, node.id)"
              >
                <FlowNode
                  :node="node"
                  :status="statusOf(node.id)"
                  :selected="selected === node.id"
                  class="flow-node-body"
                  :class="{ 'is-dim': dimmed(node.id) }"
                >
                  <template v-if="$slots.footer" #footer>
                    <slot name="footer" :node="node" :status="statusOf(node.id)" />
                  </template>
                </FlowNode>
              </div>
            </div>

            <!-- How to move around: shown while the pointer is over the canvas -->
            <div class="flow-hint pointer-events-none absolute left-4 top-3 text-[11px] text-neutral-400 dark:text-neutral-500">
              Drag to pan · <kbd class="font-sans">⌘</kbd> scroll to zoom · arrows to move between steps
            </div>

            <FlowToolbar class="absolute right-3 top-3" tips="bottom-end">
              <FlowButton
                ref="expandButton"
                :label="expanded ? 'Exit full screen' : 'Full screen'"
                :shortcut="expanded ? 'Esc' : undefined"
                @click="toggleExpanded"
              >
                <FlowIconSwap :icons="['lucide:maximize-2', 'lucide:minimize-2']" :active="expanded ? 1 : 0" />
              </FlowButton>
            </FlowToolbar>

            <div class="absolute bottom-3 left-3 flex items-center gap-2">
              <FlowToolbar tips="top-start">
                <FlowButton label="Zoom out" shortcut="−" icon="lucide:minus" @click="zoomBy(1 / ZOOM_STEP)" />
                <FlowButton label="Fit to view" shortcut="0" @click="fit()">
                  <span class="tabular-nums w-9 text-center text-[11px] font-medium">{{ zoomPercent }}%</span>
                </FlowButton>
                <FlowButton label="Zoom in" shortcut="+" icon="lucide:plus" @click="zoomBy(ZOOM_STEP)" />
              </FlowToolbar>
              <Transition name="flow-pop">
                <FlowToolbar v-if="moved" tips="top-start">
                  <FlowButton label="Reset layout" icon="lucide:rotate-ccw" @click="resetLayout" />
                </FlowToolbar>
              </Transition>
            </div>

            <div
              v-if="player"
              class="absolute bottom-3 flex items-center gap-2 transition-[right] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
              :style="{ right: `${selectedNode ? PANEL + 12 : 12}px` }"
            >
              <!-- A flow that starts paused pulses its play button, until it has been played once -->
              <FlowControls :player="player" :inviting="!hasPlayed" @step="hasPlayed = true" />
            </div>

            <!-- The keyboard changes what the panel shows while focus stays on the node: say it -->
            <div class="sr-only" role="status">
              {{ selectedNode ? `${selectedNode.title} details, ${STATUS_LABEL[statusOf(selectedNode.id)]}` : '' }}
            </div>

            <Transition name="flow-panel">
              <aside
                v-if="selectedNode"
                data-flow-ui
                class="absolute bottom-3 right-3 top-3 flex flex-col overflow-hidden border border-neutral-200 rounded-xl bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(0_0_0/0.18)] dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-none"
                :style="{ width: `${PANEL - 12}px` }"
                :aria-label="`${selectedNode.title} details`"
              >
                <header class="flex items-start gap-2.5 border-b border-neutral-200 p-3 dark:border-neutral-700">
                  <span class="grid size-8 shrink-0 place-items-center border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                    <Icon :name="selectedNode.icon" class="size-4" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="text-[11px] text-neutral-500 leading-tight dark:text-neutral-400">
                      {{ selectedNode.kicker ?? 'Step' }}
                    </div>
                    <div class="truncate text-sm text-neutral-900 font-medium dark:text-neutral-100">
                      {{ selectedNode.title }}
                    </div>
                  </div>
                  <FlowButton label="Close" shortcut="Esc" icon="lucide:x" tip="bottom-end" class="-mr-1 -mt-1" @click="select(null)" />
                </header>
                <div class="flow-prose flex-1 overflow-y-auto p-3 text-[13px] text-neutral-600 leading-relaxed dark:text-neutral-300">
                  <div class="mb-3 flex items-center gap-2 text-xs">
                    <span class="flow-status-dot" :data-status="statusOf(selectedNode.id)" />
                    {{ STATUS_LABEL[statusOf(selectedNode.id)] }}
                  </div>
                  <slot name="inspector" :node="selectedNode" :status="statusOf(selectedNode.id)">
                    <div v-if="selectedNode.detail" class="whitespace-pre-line text-xs font-mono">
                      {{ selectedNode.detail }}
                    </div>
                  </slot>
                </div>
              </aside>
            </Transition>
          </div>
        </div>
      </Teleport>
    </div>
  </figure>
</template>

<style scoped>
.flow-root {
  --flow-line: rgb(163 163 163);
  --flow-ink: rgb(23 23 23);
  --flow-dot: rgb(0 0 0 / 0.07);
  touch-action: pan-y;
  cursor: grab;
}

.dark .flow-root {
  --flow-line: rgb(115 115 115);
  --flow-ink: rgb(245 245 245);
  --flow-dot: rgb(255 255 255 / 0.06);
}

.flow-root.is-panning {
  cursor: grabbing;
}

.flow-root.is-morphing {
  z-index: 61;
}

/* While the frame morphs, the view glides on the frame's curve */
.is-morphing .flow-world.is-gliding {
  transition:
    transform 420ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 200ms linear;
}

.flow-root.is-expanded {
  touch-action: none;
}

.flow-backdrop {
  background: rgb(255 255 255 / 0.6);
  backdrop-filter: blur(6px);
}

.dark .flow-backdrop {
  background: rgb(23 23 23 / 0.6);
}

.flow-dots {
  background-image: radial-gradient(var(--flow-dot) 1px, transparent 1px);
  background-size: 20px 20px;
  transition: opacity 200ms linear;
}

/* The world fades in once fitted, then its nodes rise stage by stage */
.flow-world {
  opacity: 0;
}

.is-ready .flow-world {
  opacity: 1;
  transition: opacity 200ms linear;
}

.flow-world.is-gliding {
  transition:
    transform 320ms var(--ease-out),
    opacity 200ms linear;
}

.flow-node-wrap {
  cursor: pointer;
}

.flow-node-wrap.is-dragging {
  cursor: grabbing;
  z-index: 10;
}

.flow-node-wrap:focus-visible :deep(.card) {
  outline: 2px solid rgb(59 130 246);
  outline-offset: 3px;
}

.flow-node-body {
  transition:
    opacity 200ms var(--ease-out),
    scale 200ms var(--ease-out);
}

.is-dragging .flow-node-body {
  scale: 1.02;
}

.is-dragging .flow-node-body :deep(.card) {
  box-shadow: 0 16px 32px -12px rgb(0 0 0 / 0.25);
}

.flow-node-body.is-dim {
  opacity: 0.35;
}

.is-intro .flow-node-body {
  opacity: 0;
  translate: 0 6px;
}

.is-intro.is-ready .flow-node-body {
  opacity: 1;
  translate: 0 0;
  transition:
    opacity 400ms var(--ease-out),
    translate 400ms var(--ease-out);
  transition-delay: calc(var(--stage) * 80ms + 60ms);
}

@media (hover: hover) and (pointer: fine) {
  .flow-node-wrap:hover .flow-node-body :deep(.card) {
    box-shadow: 0 6px 16px -8px rgb(0 0 0 / 0.18);
  }
}

/* Edges draw themselves in, after the node they leave */
.flow-edge {
  stroke: var(--flow-line);
  transition:
    stroke 300ms var(--ease-out),
    opacity 200ms var(--ease-out);
}

.flow-edge.is-hot,
.flow-edge.is-lit {
  stroke: var(--flow-ink);
}

.flow-edge.is-dim,
.flow-loop.is-dim {
  opacity: 0.3;
}

.flow-edge-line {
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
}

.is-intro .flow-edge-line {
  stroke-dashoffset: 1;
}

.is-intro .flow-edge-arrow {
  opacity: 0;
}

.is-intro.is-ready .flow-edge-line {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 500ms var(--ease-out);
  transition-delay: calc(var(--stage) * 80ms + 160ms);
}

.is-intro.is-ready .flow-edge-arrow {
  opacity: 1;
  transition: opacity 200ms linear;
  transition-delay: calc(var(--stage) * 80ms + 560ms);
}

/* Centred on the loop's long run. Not with translate utilities: UnoCSS and Tailwind (via Nuxt UI)
   both answer to them, one through `transform` and one through `translate`, and the shifts add up */
.flow-loop-label {
  transform: translate(-50%, -50%);
}

.flow-loop {
  stroke: var(--flow-line);
  stroke-width: 1.25;
  transition: opacity 200ms var(--ease-out);
}

.flow-loop-line {
  stroke-dasharray: 4 4;
}

.flow-loop-line.is-flowing {
  animation: loop-flow 0.8s linear infinite;
}

@keyframes loop-flow {
  to {
    stroke-dashoffset: -8;
  }
}

.flow-ball .halo {
  fill: var(--flow-ink);
  fill-opacity: 0.12;
}

.flow-ball .core {
  fill: var(--flow-ink);
}

.flow-hint {
  opacity: 0;
  transition: opacity 200ms var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .flow-root:hover .flow-hint {
    opacity: 1;
    transition-delay: 600ms;
  }
}

.flow-prose :deep(p) {
  font-size: inherit;
  line-height: inherit;
}

.flow-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background: rgb(212 212 212);
}

.flow-status-dot[data-status='running'] {
  background: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.2);
}

.flow-status-dot[data-status='done'] {
  background: var(--flow-ink);
}

.flow-status-dot[data-status='error'] {
  background: rgb(220 38 38);
}

.flow-panel-enter-active,
.flow-panel-leave-active {
  transition:
    opacity 220ms var(--ease-out),
    transform 220ms var(--ease-out);
}

.flow-panel-leave-active {
  transition-duration: 160ms;
}

.flow-panel-enter-from,
.flow-panel-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

.flow-fade-enter-active,
.flow-fade-leave-active {
  transition: opacity 420ms cubic-bezier(0.32, 0.72, 0, 1);
}

.flow-fade-enter-from,
.flow-fade-leave-to {
  opacity: 0;
}

.flow-pop-enter-active,
.flow-pop-leave-active {
  transition:
    opacity 160ms var(--ease-out),
    transform 160ms var(--ease-out);
}

.flow-pop-enter-from,
.flow-pop-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@media (prefers-reduced-motion: reduce) {
  .flow-loop-line.is-flowing {
    animation: none;
  }

  .is-intro .flow-node-body,
  .is-intro .flow-edge-line,
  .is-intro .flow-edge-arrow {
    opacity: 1;
    translate: none;
    stroke-dashoffset: 0;
    transition: none !important;
  }

  .flow-panel-enter-from,
  .flow-panel-leave-to,
  .flow-pop-enter-from,
  .flow-pop-leave-to {
    transform: none;
  }
}
</style>
