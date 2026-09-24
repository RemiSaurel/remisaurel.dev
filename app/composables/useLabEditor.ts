import type { InjectionKey } from 'vue'
import type { ArtComposition, ArtGroup, ArtNode, ArtNodeColor, ArtPreset, ArtTheme, LayerType, ParamValue } from '~/art/art'
import type { Matrix } from '~/art/geometry'
import { ART_PRESETS, ART_STROKE, cloneNode, createGroup, createLayer, isGroup, LAYER_TYPES, newId, normalizeNode } from '~/art/art'
import { apply, decompose, IDENTITY, invert, multiply, nodeMatrix } from '~/art/geometry'

const DRAFT_KEY = 'lab-draft'
const GUIDES_KEY = 'lab-guides'
const RULERS_KEY = 'lab-rulers'
const HISTORY_LIMIT = 100
/** Continuous edits (drags, slider scrubs) settle into a single undo step after this pause. */
const HISTORY_SETTLE = 250

/** A ruler guide, in frame units: `x` guides are vertical lines, `y` guides horizontal. */
export interface Guide {
  id: string
  axis: 'x' | 'y'
  value: number
}

export interface NodeEntry {
  node: ArtNode
  parent: ArtGroup | null
  /** The array the node lives in: the root layers or its group's children. */
  siblings: ArtNode[]
  index: number
  depth: number
  /** Outermost first. */
  ancestors: ArtGroup[]
  /** Position in a depth-first walk: the drawing order across the whole tree. */
  order: number
}

function serialize(composition: ArtComposition) {
  return JSON.stringify(composition)
}

/** Accepts anything that looks like a composition, and fills in what older drafts lack. */
export function parseComposition(text: string): ArtComposition | null {
  try {
    const value = JSON.parse(text)
    if (!value || !Array.isArray(value.layers))
      return null
    const layers = value.layers.map(normalizeNode).filter((node: ArtNode | null): node is ArtNode => !!node)
    const grain = typeof value.grain === 'number' && value.grain > 0 ? Math.min(1, value.grain) : undefined
    return { grid: value.grid !== false, ...(grain ? { grain } : {}), layers }
  }
  catch {
    return null
  }
}

export function useLabEditor() {
  const composition = ref<ArtComposition>(ART_PRESETS[0]!.build())
  const selectedIds = ref<string[]>([])
  const hoveredId = ref<string | null>(null)
  const collapsedIds = ref<string[]>([])
  const canvasTheme = ref<ArtTheme>('dark')
  // Editor aids, not part of the picture: they never reach the JSON or the undo history
  const rulersVisible = ref(true)
  const guides = ref<Guide[]>([])

  // Index: every node with where it lives, rebuilt whenever the tree changes

  const entries = computed(() => {
    const map = new Map<string, NodeEntry>()
    let order = 0
    const walk = (siblings: ArtNode[], parent: ArtGroup | null, ancestors: ArtGroup[]) => {
      siblings.forEach((node, index) => {
        map.set(node.id, { node, parent, siblings, index, depth: ancestors.length, ancestors, order: order++ })
        if (isGroup(node))
          walk(node.children, node, [...ancestors, node])
      })
    }
    walk(composition.value.layers, null, [])
    return map
  })

  function entry(id: string | null | undefined) {
    return id ? entries.value.get(id) : undefined
  }

  const selectedNodes = computed(() => selectedIds.value.map(id => entry(id)?.node).filter((node): node is ArtNode => !!node))
  /** The one node the inspector edits, when exactly one is selected. */
  const selectedNode = computed(() => selectedNodes.value.length === 1 ? selectedNodes.value[0]! : null)
  const primaryId = computed(() => selectedIds.value.at(-1) ?? null)

  /** Selected nodes minus those already inside a selected group, in drawing order. */
  const topSelection = computed(() => {
    const ids = new Set(selectedIds.value)
    return selectedIds.value
      .map(id => entry(id))
      .filter((item): item is NodeEntry => !!item && !item.ancestors.some(ancestor => ids.has(ancestor.id)))
      .sort((a, b) => a.order - b.order)
  })

  const canGroup = computed(() => {
    const items = topSelection.value
    return items.length > 0 && items.every(item => item.parent === items[0]!.parent)
  })

  // History: snapshots of the whole composition, coalesced while an edit is in motion

  const history = ref<string[]>([serialize(composition.value)])
  const historyIndex = ref(0)
  let applyingHistory = false
  let settleTimer: ReturnType<typeof setTimeout> | undefined

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  function commit() {
    clearTimeout(settleTimer)
    const snapshot = serialize(composition.value)
    if (snapshot === history.value[historyIndex.value])
      return
    const kept = history.value.slice(0, historyIndex.value + 1)
    kept.push(snapshot)
    history.value = kept.slice(-HISTORY_LIMIT)
    historyIndex.value = history.value.length - 1
    saveDraft(snapshot)
  }

  watch(composition, () => {
    if (applyingHistory)
      return
    clearTimeout(settleTimer)
    settleTimer = setTimeout(commit, HISTORY_SETTLE)
  }, { deep: true })

  function replaceSilently(next: ArtComposition) {
    applyingHistory = true
    composition.value = next
    nextTick(() => (applyingHistory = false))
  }

  function applySnapshot(index: number) {
    historyIndex.value = index
    replaceSilently(JSON.parse(history.value[index]!))
    // Keep only the selection that still exists at that point in time
    nextTick(() => (selectedIds.value = selectedIds.value.filter(id => entries.value.has(id))))
    saveDraft(history.value[index]!)
  }

  /**
   * Discrete actions (add, delete, group, paste…) are one undo step each, even when done in
   * quick succession: whatever was settling is committed first, then the action itself.
   */
  function step<Args extends unknown[]>(action: (...args: Args) => void) {
    return (...args: Args) => {
      commit()
      action(...args)
      commit()
    }
  }

  function undo() {
    // An edit still settling becomes its own step first, so undo never skips it
    commit()
    if (canUndo.value)
      applySnapshot(historyIndex.value - 1)
  }

  function redo() {
    commit()
    if (canRedo.value)
      applySnapshot(historyIndex.value + 1)
  }

  // Draft: a per-browser convenience, never the source of truth (that is the copied JSON)

  function saveDraft(snapshot: string) {
    try {
      localStorage.setItem(DRAFT_KEY, snapshot)
    }
    catch {}
  }

  function restoreDraft() {
    try {
      rulersVisible.value = localStorage.getItem(RULERS_KEY) !== '0'
      const saved = JSON.parse(localStorage.getItem(GUIDES_KEY) ?? '[]')
      if (Array.isArray(saved))
        guides.value = saved.filter((guide: Guide) => (guide.axis === 'x' || guide.axis === 'y') && Number.isFinite(guide.value))
    }
    catch {}
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      const parsed = draft ? parseComposition(draft) : null
      if (parsed) {
        replaceSilently(parsed)
        history.value = [serialize(parsed)]
        historyIndex.value = 0
      }
    }
    catch {}
  }

  watch(rulersVisible, (visible) => {
    try {
      localStorage.setItem(RULERS_KEY, visible ? '1' : '0')
    }
    catch {}
  })

  watch(guides, (list) => {
    try {
      localStorage.setItem(GUIDES_KEY, JSON.stringify(list))
    }
    catch {}
  }, { deep: true })

  // Guides

  function addGuide(axis: Guide['axis'], value: number) {
    const guide: Guide = { id: newId(), axis, value }
    guides.value.push(guide)
    return guide.id
  }

  function moveGuide(id: string, value: number) {
    const guide = guides.value.find(item => item.id === id)
    if (guide)
      guide.value = value
  }

  function removeGuide(id: string) {
    guides.value = guides.value.filter(item => item.id !== id)
  }

  function clearGuides() {
    guides.value = []
  }

  // Selection

  function select(id: string | null, mode: 'replace' | 'toggle' = 'replace') {
    if (!id) {
      selectedIds.value = []
      return
    }
    if (mode === 'toggle') {
      selectedIds.value = selectedIds.value.includes(id)
        ? selectedIds.value.filter(item => item !== id)
        : [...selectedIds.value, id]
      return
    }
    selectedIds.value = [id]
  }

  function selectMany(ids: string[]) {
    selectedIds.value = ids
  }

  /** Everything at the level of the current selection (or the root when nothing is selected). */
  function selectAll() {
    const siblings = entry(primaryId.value)?.siblings ?? composition.value.layers
    selectedIds.value = siblings.map(node => node.id)
  }

  function toggleCollapsed(id: string) {
    collapsedIds.value = collapsedIds.value.includes(id)
      ? collapsedIds.value.filter(item => item !== id)
      : [...collapsedIds.value, id]
  }

  // Tree edits

  /** "Rings", "Rings copy", "Rings copy 2"… never "Rings copy copy". */
  function uniqueName(name: string) {
    const base = name.replace(/ copy(?: \d+)?$/, '')
    const taken = new Set([...entries.value.values()].map(item => item.node.name))
    let candidate = `${base} copy`
    for (let i = 2; taken.has(candidate); i++)
      candidate = `${base} copy ${i}`
    return candidate
  }

  /** New nodes land right above the primary selection, in its group, like design tools. */
  function insertionPoint() {
    const primary = entry(primaryId.value)
    return primary
      ? { siblings: primary.siblings, index: primary.index + 1 }
      : { siblings: composition.value.layers, index: composition.value.layers.length }
  }

  function addLayer(type: LayerType) {
    const sameType = [...entries.value.values()].filter(item => item.node.type === type).length
    const { siblings, index } = insertionPoint()
    const parent = entry(primaryId.value)?.parent
    const layer = createLayer({
      type,
      name: sameType ? `${LAYER_TYPES[type].label} ${sameType + 1}` : LAYER_TYPES[type].label,
      seed: Math.floor(Math.random() * 1000),
      // Inside a group, the frame center is wherever the group's origin sits
      ...(parent ? { x: 0, y: 0 } : {}),
    })
    siblings.splice(index, 0, layer)
    selectedIds.value = [layer.id]
  }

  function loadPreset(preset: ArtPreset) {
    loadComposition(preset.build())
  }

  function loadComposition(next: ArtComposition) {
    composition.value = next
    selectedIds.value = []
  }

  function removeSelected() {
    const items = topSelection.value
    if (!items.length)
      return
    const last = items.at(-1)!
    const neighbour = items.length === 1 ? (last.siblings[last.index - 1] ?? last.siblings[last.index + 1]) : undefined
    for (const item of items) {
      const current = entry(item.node.id)
      current?.siblings.splice(current.index, 1)
    }
    // Land on the neighbour below, so repeated deletes keep going
    selectedIds.value = neighbour ? [neighbour.id] : []
    hoveredId.value = null
  }

  function duplicateSelected() {
    const copies: string[] = []
    // Last first, so earlier indices stay valid while inserting
    for (const item of [...topSelection.value].reverse()) {
      const copy = cloneNode(item.node)
      copy.name = uniqueName(item.node.name)
      // Offset the copy so it visibly exists, instead of hiding exactly under the source
      copy.x += 10
      copy.y += 10
      item.siblings.splice(item.index + 1, 0, copy)
      copies.unshift(copy.id)
    }
    selectedIds.value = copies
  }

  function updateNode(id: string, patch: Partial<ArtNode>) {
    const node = entry(id)?.node
    if (node)
      Object.assign(node, patch)
  }

  function updateParam(id: string, key: string, value: ParamValue) {
    const node = entry(id)?.node
    if (node && !isGroup(node))
      node.params[key] = value
  }

  function resetParams(id: string) {
    const node = entry(id)?.node
    if (node && !isGroup(node))
      node.params = createLayer({ type: node.type }).params
  }

  /** `null` goes back to inheriting, which keeps the JSON free of redundant colors. */
  function colorSelected(color: ArtNodeColor | null) {
    for (const node of selectedNodes.value) {
      if (color)
        // A copy per node: custom colors are objects, and nodes must never share one
        node.color = typeof color === 'string' ? color : { ...color }
      else
        delete node.color
    }
  }

  /** The stroke a node gets from its groups, or the default at the root. */
  function inheritedStroke(id: string) {
    return entry(id)?.ancestors.findLast(ancestor => ancestor.stroke !== undefined)?.stroke ?? ART_STROKE.default
  }

  /** A width matching what the node would inherit is dropped, like colors. */
  function strokeSelected(width: number) {
    for (const node of selectedNodes.value) {
      if (width === inheritedStroke(node.id))
        delete node.stroke
      else
        node.stroke = width
    }
  }

  function isInside(id: string, groupId: string | null) {
    return !!groupId && (groupId === id || !!entry(groupId)?.ancestors.some(ancestor => ancestor.id === id))
  }

  /** The groups a node inside `parentId` sits in, outermost first. */
  function groupChain(parentId: string | null): ArtGroup[] {
    const parent = entry(parentId)
    return parent && isGroup(parent.node) ? [...parent.ancestors, parent.node] : []
  }

  function chainMatrix(groups: ArtGroup[]): Matrix {
    return groups.reduce<Matrix>((matrix, group) => multiply(matrix, nodeMatrix(group)), IDENTITY)
  }

  function chainOpacity(groups: ArtGroup[]) {
    return groups.reduce((opacity, group) => opacity * group.opacity, 1)
  }

  // Four decimals: enough to be exact on screen, few enough to hide float noise (89.99999…)
  function tidy(value: number) {
    return Math.round(value * 10000) / 10000
  }

  /** A matrix as node fields, keeping the `prefer`red flips where they still fit. */
  function transformPatch(matrix: Matrix, prefer: Pick<ArtNode, 'flipX' | 'flipY'>, node = prefer): Partial<ArtNode> {
    const { x, y, rotation, scale, flipX, flipY } = decompose(matrix, prefer)
    const patch: Partial<ArtNode> = { x: tidy(x), y: tidy(y), rotation: tidy(rotation), scale: tidy(scale) }
    // Flags are only written when set or changed, so unflipped nodes keep a lean JSON
    if (flipX || node.flipX)
      patch.flipX = flipX
    if (flipY || node.flipY)
      patch.flipY = flipY
    return patch
  }

  /**
   * The transform and opacity a node needs under `to` to look exactly as it does under
   * `from`: moving it between groups changes where it lives, never what you see.
   */
  function rebase(node: ArtNode, from: ArtGroup[], to: ArtGroup[]): Partial<ArtNode> {
    const fromMatrix = chainMatrix(from)
    const toMatrix = chainMatrix(to)
    const patch: Partial<ArtNode> = {}
    if (fromMatrix.some((value, i) => Math.abs(value - toMatrix[i]!) > 1e-9))
      Object.assign(patch, transformPatch(multiply(invert(toMatrix), multiply(fromMatrix, nodeMatrix(node))), node))
    const fromOpacity = chainOpacity(from)
    const toOpacity = chainOpacity(to)
    // A parent more transparent than the result needs can't be compensated: keep the closest
    if (fromOpacity !== toOpacity && toOpacity > 0)
      patch.opacity = tidy(Math.min(1, node.opacity * fromOpacity / toOpacity))
    return patch
  }

  /**
   * Moves a node into `parentId` (null for the root) at `index`, counted in that list as it
   * is before the move. Refuses to drop a group into itself.
   */
  function moveNode(id: string, parentId: string | null, index: number) {
    const source = entry(id)
    if (!source || isInside(id, parentId))
      return
    const target = parentId ? entry(parentId)?.node : null
    const list = target && isGroup(target) ? target.children : parentId ? null : composition.value.layers
    if (!list)
      return
    let at = index
    if (list === source.siblings && source.index < index)
      at--
    if (list === source.siblings && at === source.index)
      return
    const patch = list === source.siblings ? {} : rebase(source.node, source.ancestors, groupChain(parentId))
    source.siblings.splice(source.index, 1)
    list.splice(Math.max(0, Math.min(list.length, at)), 0, source.node)
    Object.assign(source.node, patch)
  }

  function shiftSelected(step: number) {
    const item = entry(primaryId.value)
    if (item && selectedIds.value.length === 1)
      moveNode(item.node.id, item.parent?.id ?? null, item.index + (step > 0 ? step + 1 : step))
  }

  function groupSelected() {
    const items = topSelection.value
    if (!canGroup.value)
      return
    const { siblings } = items[0]!
    const topIndex = items.at(-1)!.index
    // The group's origin is the middle of its children, so it rotates and scales around them
    const cx = items.reduce((sum, item) => sum + item.node.x, 0) / items.length
    const cy = items.reduce((sum, item) => sum + item.node.y, 0) / items.length
    const children = items.map(item => ({ ...item.node, x: item.node.x - cx, y: item.node.y - cy }))
    const groupCount = [...entries.value.values()].filter(item => isGroup(item.node)).length
    const group = createGroup({ name: `Group ${groupCount + 1}`, x: cx, y: cy, children })
    for (const item of [...items].reverse())
      siblings.splice(item.index, 1)
    siblings.splice(topIndex - (items.length - 1), 0, group)
    selectedIds.value = [group.id]
  }

  /** Dissolves the selected groups, baking their transform into each child so nothing moves. */
  function ungroupSelected() {
    const released: string[] = []
    for (const item of [...topSelection.value].reverse()) {
      const group = item.node
      if (!isGroup(group))
        continue
      const matrix = nodeMatrix(group)
      const children = group.children.map(child => ({
        ...child,
        // Through the matrices, so a flipped group hands its mirror down to each child
        ...transformPatch(multiply(matrix, nodeMatrix(child)), child),
        opacity: child.opacity * group.opacity,
        visible: child.visible && group.visible,
        // Baked in too, so children keep the width they were drawn with
        stroke: child.stroke ?? group.stroke,
      }) as ArtNode)
      for (const child of children) {
        if (child.stroke === undefined)
          delete child.stroke
      }
      item.siblings.splice(item.index, 1, ...children)
      released.unshift(...children.map(child => child.id))
    }
    if (released.length)
      selectedIds.value = released
  }

  /**
   * Mirrors the selection across a screen axis through its middle, like design tools: one
   * node flips in place, several also swap places. Rotations follow, so a tilted layer flips
   * along the screen and not along its own tilt.
   */
  function flipSelected(axis: 'x' | 'y') {
    const items = topSelection.value
    if (!items.length)
      return
    const parents = items.map(item => chainMatrix(item.ancestors))
    const origins = items.map((item, i) => apply(parents[i]!, [item.node.x, item.node.y]))
    const cx = origins.reduce((sum, [ox]) => sum + ox, 0) / origins.length
    const cy = origins.reduce((sum, [, oy]) => sum + oy, 0) / origins.length
    const mirror: Matrix = axis === 'x' ? [-1, 0, 0, 1, 2 * cx, 0] : [1, 0, 0, -1, 0, 2 * cy]
    items.forEach(({ node }, i) => {
      const parent = parents[i]!
      const local = multiply(invert(parent), multiply(mirror, multiply(parent, nodeMatrix(node))))
      const prefer = axis === 'x' ? { flipX: !node.flipX, flipY: node.flipY } : { flipX: node.flipX, flipY: !node.flipY }
      Object.assign(node, transformPatch(local, prefer, node))
    })
  }

  // Clipboard: layers travel as a composition JSON, so the lab, a file and a gist all speak it

  /** Copied nodes carry their on-screen transform, so they paste where they were seen. */
  function copySelection() {
    const layers = topSelection.value.map(item => ({ ...item.node, ...rebase(item.node, item.ancestors, []) }))
    return layers.length ? JSON.stringify({ grid: composition.value.grid, layers }) : null
  }

  function paste(nodes: ArtNode[]) {
    if (!nodes.length)
      return
    const { siblings, index } = insertionPoint()
    const into = groupChain(entry(primaryId.value)?.parent?.id ?? null)
    const copies = nodes.map((node) => {
      const copy = cloneNode(node)
      return Object.assign(copy, rebase(copy, [], into))
    })
    siblings.splice(index, 0, ...copies)
    selectedIds.value = copies.map(copy => copy.id)
  }

  return {
    composition,
    entries,
    entry,
    selectedIds,
    selectedNodes,
    selectedNode,
    primaryId,
    topSelection,
    hoveredId,
    collapsedIds,
    canvasTheme,
    rulersVisible,
    guides,
    addGuide,
    moveGuide,
    removeGuide,
    clearGuides,
    canUndo,
    canRedo,
    canGroup,
    commit,
    undo,
    redo,
    restoreDraft,
    select,
    selectMany,
    selectAll,
    toggleCollapsed,
    addLayer: step(addLayer),
    loadPreset: step(loadPreset),
    loadComposition: step(loadComposition),
    removeSelected: step(removeSelected),
    duplicateSelected: step(duplicateSelected),
    updateNode,
    updateParam,
    resetParams: step(resetParams),
    colorSelected: step(colorSelected),
    /** For continuous picking (dragging in the color field): settles into one undo step. */
    previewColor: colorSelected,
    inheritedStroke,
    /** Not a step: dragging the slider settles into one undo step on its own. */
    strokeSelected,
    moveNode: step(moveNode),
    shiftSelected: step(shiftSelected),
    groupSelected: step(groupSelected),
    ungroupSelected: step(ungroupSelected),
    flipSelected: step(flipSelected),
    copySelection,
    paste: step(paste),
  }
}

export type LabEditor = ReturnType<typeof useLabEditor>

export const LAB_EDITOR_KEY: InjectionKey<LabEditor> = Symbol('lab-editor')

export function injectLabEditor() {
  const editor = inject(LAB_EDITOR_KEY)
  if (!editor)
    throw new Error('Lab components must be used inside the /lab page')
  return editor
}
