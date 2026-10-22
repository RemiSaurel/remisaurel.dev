import type { InjectionKey, Ref } from 'vue'

// The shapes a workflow canvas works with. An exploration describes its graph with these, then
// drives it (or lets the demo loop drive it) through a player: see `useFlowPlayer`.

export interface FlowPoint { x: number, y: number }
export interface FlowSize { width: number, height: number }
export interface FlowRect extends FlowPoint, FlowSize {}

/** Where the world sits in the canvas: `x`/`y` is its translation in screen pixels, `k` its scale */
export interface FlowViewport { x: number, y: number, k: number }

export type FlowStatus = 'idle' | 'running' | 'done' | 'error'

export interface FlowNodeSpec {
  id: string
  /** Top left corner, in world pixels. Flows read left to right */
  x: number
  y: number
  title: string
  /** Iconify name, e.g. `lucide:table-2` */
  icon: string
  /** Small label above the node: the stage it belongs to ("Step 1", "Output") */
  kicker?: string
  /** Monospace line in the inset panel: what the node does, a file name, a prompt */
  detail?: string
  /** Inverted icon tile, for the node the flow is about */
  strong?: boolean
  /** Holds the flow a moment while it works (an agent, a model): the demo loop shows it thinking */
  think?: boolean
}

export interface FlowEdgeSpec {
  from: string
  to: string
}

/** Return path under the nodes, from the end of a stage back to its start: "for each row of the dataset" */
export interface FlowLoopSpec {
  from: string
  to: string
  label: string
}

export interface FlowGraph {
  nodes: FlowNodeSpec[]
  edges: FlowEdgeSpec[]
  loop?: FlowLoopSpec
}

/** A ball travelling along an edge (`edge` is its id) or the loop (`edge` is `loop`), `t` from 0 to 1 */
export interface FlowPacket {
  id: number
  edge: string
  t: number
}

export function edgeId(edge: FlowEdgeSpec) {
  return `${edge.from}->${edge.to}`
}

export const LOOP_EDGE = 'loop'

/** Where a toolbar label opens: centred above, or flush with the button's start or end so it never crosses the canvas edge */
export type FlowTipPlacement = 'top' | 'top-start' | 'top-end' | 'bottom-end'

export const FLOW_TIP_PLACEMENT: InjectionKey<Ref<FlowTipPlacement>> = Symbol('flow-tip-placement')
