<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { ClusterId, ResearchNode } from '~/research/research'
import { useDraggable } from '@vueuse/core'
import { motion } from 'motion-v'
import { clusters, researchLinks, researchNodes, VIEW_H, VIEW_W } from '~/research/research'
import { regionRect } from '~/utils/graphRegion'

const { prefersReducedMotion } = usePrefersReducedMotion()

const container = ref<HTMLElement | null>(null)
const nodeEls = reactive<Record<string, HTMLElement | null>>({})
const regionEls = reactive<Record<string, SVGRectElement | null>>({})
const boxes = ref<Record<string, { hw: number, hh: number }>>({})
const activeId = ref<string | null>(null)

const positions = reactive<Record<string, { x: number, y: number }>>(
  Object.fromEntries(researchNodes.map(node => [node.id, { x: node.x, y: node.y }])),
)

/** ResearchNodeComponent is a child component, so the template ref is its instance, not the DOM node: unwrap via $el. */
function registerNode(id: string) {
  return (el: Element | ComponentPublicInstance | null) => {
    if (el instanceof HTMLElement)
      nodeEls[id] = el
    else if (el && '$el' in el && el.$el instanceof HTMLElement)
      nodeEls[id] = el.$el
    else
      nodeEls[id] = null
  }
}

let userMoved = false

function scale() {
  const width = container.value?.clientWidth
  return width ? VIEW_W / width : 1
}

function measure() {
  const el = container.value
  if (!el)
    return

  const width = el.clientWidth
  if (!width)
    return

  const s = VIEW_W / width
  const next: Record<string, { hw: number, hh: number }> = {}
  for (const node of researchNodes) {
    const nodeEl = nodeEls[node.id]
    if (!nodeEl)
      continue
    next[node.id] = {
      hw: (nodeEl.offsetWidth / 2) * s,
      hh: (nodeEl.offsetHeight / 2) * s,
    }
  }
  boxes.value = next

  if (!userMoved)
    resolveOverlaps()
}

/**
 * Safety net for the hand-placed layout in `research.ts`: boxes grow relative
 * to the graph as the container narrows, so two nodes that clear each other on
 * a wide screen can end up touching on a small one. Boxes are compared as
 * rectangles and separated along their axis of least penetration, which leaves
 * a layout whose boxes merely sit close (diagonally, say) exactly where it was
 * authored instead of pushing it apart.
 */
function resolveOverlaps() {
  const fixed = new Set(researchNodes.filter(n => n.kind === 'theme' || n.kind === 'hub').map(n => n.id))
  const margin = 10

  for (let pass = 0; pass < 40; pass++) {
    for (let i = 0; i < researchNodes.length; i++) {
      for (let j = i + 1; j < researchNodes.length; j++) {
        const a = researchNodes[i]!
        const b = researchNodes[j]!
        const boxA = boxes.value[a.id]
        const boxB = boxes.value[b.id]
        if (!boxA || !boxB)
          continue

        const pa = positions[a.id]!
        const pb = positions[b.id]!
        const dx = pb.x - pa.x
        const dy = pb.y - pa.y
        const gapX = boxA.hw + boxB.hw + margin - Math.abs(dx)
        const gapY = boxA.hh + boxB.hh + margin - Math.abs(dy)
        if (gapX <= 0 || gapY <= 0)
          continue

        // Push along the shorter escape route, so boxes slide apart rather than fly across the graph.
        const alongX = gapX < gapY
        const overlap = alongX ? gapX : gapY
        const ux = alongX ? Math.sign(dx) || 1 : 0
        const uy = alongX ? 0 : Math.sign(dy) || 1
        const aFixed = fixed.has(a.id)
        const bFixed = fixed.has(b.id)

        if (aFixed && bFixed) {
          continue
        }
        else if (aFixed) {
          clampInto(pb, pb.x + ux * overlap, pb.y + uy * overlap, boxB)
        }
        else if (bFixed) {
          clampInto(pa, pa.x - ux * overlap, pa.y - uy * overlap, boxA)
        }
        else {
          const half = overlap / 2
          clampInto(pa, pa.x - ux * half, pa.y - uy * half, boxA)
          clampInto(pb, pb.x + ux * half, pb.y + uy * half, boxB)
        }
      }
    }
  }
}

function clampInto(target: { x: number, y: number }, x: number, y: number, box: { hw: number, hh: number }) {
  target.x = Math.min(Math.max(x, box.hw), VIEW_W - box.hw)
  target.y = Math.min(Math.max(y, box.hh), VIEW_H - box.hh)
}

let observer: ResizeObserver | undefined

onMounted(() => {
  measure()
  observer = new ResizeObserver(() => measure())
  if (container.value)
    observer.observe(container.value)
  document.fonts?.ready.then(measure)
})

onBeforeUnmount(() => observer?.disconnect())

let justDragged: string | null = null

for (const node of researchNodes) {
  let start: { clientX: number, clientY: number, pos: { x: number, y: number } } | null = null
  let moved = false

  useDraggable(() => nodeEls[node.id], {
    onStart: (_pos, event) => {
      start = { clientX: event.clientX, clientY: event.clientY, pos: { ...positions[node.id]! } }
      moved = false
      activeId.value = node.id
    },
    onMove: (_pos, event) => {
      if (!start)
        return
      const dx = event.clientX - start.clientX
      const dy = event.clientY - start.clientY
      if (Math.hypot(dx, dy) > 3)
        moved = true

      userMoved = true
      const s = scale()
      const box = boxes.value[node.id] ?? { hw: 40, hh: 20 }
      clampInto(positions[node.id]!, start.pos.x + dx * s, start.pos.y + dy * s, box)
    },
    onEnd: () => {
      if (moved)
        justDragged = node.id
      start = null
    },
  })
}

function consumeDragClick(nodeId: string, event: MouseEvent) {
  if (justDragged === nodeId) {
    event.preventDefault()
    justDragged = null
  }
}

for (const cluster of clusters) {
  let start: { clientX: number, clientY: number, positions: Record<string, { x: number, y: number }> } | null = null

  useDraggable(() => regionEls[cluster.id], {
    onStart: (_pos, event) => {
      const snapshot: Record<string, { x: number, y: number }> = {}
      for (const node of researchNodes) {
        if (node.clusters.includes(cluster.id))
          snapshot[node.id] = { ...positions[node.id]! }
      }
      start = { clientX: event.clientX, clientY: event.clientY, positions: snapshot }
    },
    onMove: (_pos, event) => {
      if (!start)
        return
      userMoved = true
      const s = scale()
      const dx = (event.clientX - start.clientX) * s
      const dy = (event.clientY - start.clientY) * s
      for (const id in start.positions) {
        const from = start.positions[id]!
        const box = boxes.value[id] ?? { hw: 40, hh: 20 }
        clampInto(positions[id]!, from.x + dx, from.y + dy, box)
      }
    },
    onEnd: () => {
      start = null
    },
  })
}

const regions = computed(() => {
  return clusters
    .map((cluster) => {
      const clusterBoxes = researchNodes
        .filter(node => node.clusters.includes(cluster.id))
        .flatMap((node) => {
          const box = boxes.value[node.id]
          const pos = positions[node.id]
          return box && pos ? [{ x: pos.x, y: pos.y, hw: box.hw, hh: box.hh }] : []
        })
      return { id: cluster.id, rect: regionRect(clusterBoxes) }
    })
    .filter((region): region is { id: ClusterId, rect: NonNullable<typeof region.rect> } => !!region.rect)
})

function edgePath(a: { x: number, y: number }, b: { x: number, y: number }) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const offset = len * 0.05
  const mx = (a.x + b.x) / 2 - (dy / len) * offset
  const my = (a.y + b.y) / 2 + (dx / len) * offset
  return `M${a.x} ${a.y}Q${mx.toFixed(1)} ${my.toFixed(1)} ${b.x} ${b.y}`
}

const nodeById = new Map(researchNodes.map(node => [node.id, node]))

const neighbours = (() => {
  const map = new Map<string, Set<string>>()
  const add = (a: string, b: string) => {
    if (!map.has(a))
      map.set(a, new Set())
    map.get(a)!.add(b)
  }
  for (const link of researchLinks) {
    add(link.from, link.to)
    add(link.to, link.from)
  }
  return map
})()

const activeNode = computed(() => (activeId.value ? nodeById.get(activeId.value) ?? null : null))

const focused = computed<Set<string> | null>(() => {
  const node = activeNode.value
  if (!node)
    return null

  if (node.kind === 'theme') {
    const cluster = node.clusters[0]
    return new Set(researchNodes.filter(n => n.clusters.includes(cluster!)).map(n => n.id))
  }

  return new Set([node.id, ...(neighbours.get(node.id) ?? [])])
})

const focusedClusters = computed<Set<ClusterId> | null>(() => {
  const node = activeNode.value
  if (!node?.clusters.length)
    return null
  return new Set(node.clusters)
})

const edges = computed(() => {
  return researchLinks.flatMap((link) => {
    const a = nodeById.get(link.from)
    const b = nodeById.get(link.to)
    const pa = positions[link.from]
    const pb = positions[link.to]
    if (!a || !b || !pa || !pb)
      return []

    const highlight = !!focused.value && focused.value.has(link.from) && focused.value.has(link.to)
    const shared = a.clusters.find(c => b.clusters.includes(c))

    return [{
      id: `${link.from}--${link.to}`,
      d: edgePath(pa, pb),
      highlight,
      dimmed: !!focused.value && !highlight,
      cluster: highlight ? shared ?? activeNode.value?.clusters[0] ?? null : null,
    }]
  })
})

function nodeOpacity(node: ResearchNode) {
  if (!focused.value)
    return 1
  return focused.value.has(node.id) ? 1 : 0.18
}

const enter = computed(() =>
  prefersReducedMotion.value
    ? { initial: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 12 }, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
)
</script>

<template>
  <div class="rl-root">
    <motion.div
      :initial="enter.initial"
      :animate="{ opacity: 1, y: 0 }"
      :transition="enter.transition"
      class="hidden border border-neutral-200 p-6 md:block dark:border-neutral-800"
    >
      <div
        ref="container"
        class="relative aspect-[1000/560] w-full select-none"
        @mouseleave="activeId = null"
      >
        <!-- SVG: regions + edges -->
        <ResearchGraphSVG
          :regions="regions"
          :edges="edges"
          :focused-clusters="focusedClusters"
          :positions="positions"
          @register-region="(clusterId, el) => { regionEls[clusterId] = el }"
        />

        <!-- Nodes -->
        <ResearchNodeComponent
          v-for="node in researchNodes"
          :key="node.id"
          :ref="registerNode(node.id)"
          :node="node"
          :position="positions[node.id]!"
          :opacity="nodeOpacity(node)"
          @click="consumeDragClick(node.id, $event)"
          @mouseenter="activeId = node.id"
          @mouseleave="activeId = null"
          @focus="activeId = node.id"
          @blur="activeId = null"
        />

        <!-- Popover -->
        <ResearchPopover
          :node="activeNode"
          :position="activeNode ? positions[activeNode.id] : null"
          :size="activeNode ? boxes[activeNode.id] : null"
        />
      </div>
    </motion.div>

    <!-- Accessible / small-screen equivalent -->
    <div class="md:sr-only flex flex-col gap-8">
      <section v-for="cluster in clusters" :key="cluster.id" :class="`rl-${cluster.id}`">
        <h3 class="rl-list-heading uppercase m-0 inline-block px-2.4 py-1.2 text-[0.68rem] font-600 tracking-[0.09em]">
          {{ cluster.label }}
        </h3>
        <p class="mb-0 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {{ cluster.description }}
        </p>
        <ul class="list-none mb-0 mt-3 flex flex-col gap-2.5 p-0">
          <li
            v-for="node in researchNodes.filter(n => n.clusters[0] === cluster.id && n.kind !== 'theme')"
            :key="node.id"
            class="text-sm"
          >
            <component
              :is="node.url ? 'a' : 'span'"
              :href="node.url"
              :target="node.url ? '_blank' : undefined"
              :rel="node.url ? 'noopener noreferrer' : undefined"
              class="font-medium"
              :class="node.url ? 'intro-link pressable inline-flex items-center gap-1' : ''"
            >
              {{ node.label }}
              <Icon v-if="node.url" name="uil:arrow-up-right" class="size-3.5 shrink-0" />
            </component>
            <span v-if="node.venue" class="ml-1.5 text-xs text-neutral-400 dark:text-neutral-500">{{ node.venue }}</span>
            <span v-if="node.description" class="block text-neutral-500 dark:text-neutral-400">{{ node.description }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.rl-list-heading {
  background-color: rgb(var(--c));
  color: var(--rl-on);
}
</style>
