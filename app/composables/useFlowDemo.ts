import type { FlowPlayer } from './useFlowPlayer'
import type { FlowGraph } from '~/utils/flow/types'
import { stageGroups } from '~/utils/flow/graph'
import { edgeId, LOOP_EDGE } from '~/utils/flow/types'

export interface FlowDemoOptions {
  /** Passes through the flow before it rests and starts over: the rows of a dataset */
  rows?: number
  /** Seconds a ball takes along an edge */
  edgeSeconds?: number
  /** Seconds a `think` node holds the flow */
  thinkSeconds?: number
  /** Seconds of rest once every row is through */
  restSeconds?: number
  /**
   * Never rests: the loop brings the ball back after the last row too, and `completed` keeps
   * counting instead of starting over, like a stream of responses that never ends
   */
  continuous?: boolean
}

/**
 * Plays a workflow on its own, for an exploration that has nothing real to run yet: stage after
 * stage the nodes work and hand a ball to the next ones, then the loop brings it back for the
 * next row. It drives the player like any exploration would, so pause and speed just work.
 */
export function useFlowDemo(graph: MaybeRefOrGetter<FlowGraph>, player: FlowPlayer, options: FlowDemoOptions = {}) {
  const { rows = 5, edgeSeconds = 0.9, thinkSeconds = 0.8, restSeconds = 1.2, continuous = false } = options

  /** Row being processed, and rows done (a running total when `continuous`): what a dataset footer shows */
  const row = ref(0)
  const completed = ref(0)

  async function run(generation: number) {
    const alive = () => player.generation.value === generation
    while (alive()) {
      const { nodes, edges, loop } = toValue(graph)
      const byId = new Map(nodes.map(node => [node.id, node]))
      const stages = stageGroups(nodes.map(node => node.id), edges)

      for (let r = 0; r < rows && alive(); r++) {
        row.value = r
        for (const stage of stages) {
          stage.forEach(id => player.set(id, 'running'))
          if (stage.some(id => byId.get(id)?.think))
            await player.wait(thinkSeconds)
          stage.forEach(id => player.set(id, 'done'))
          const leaving = edges.filter(edge => stage.includes(edge.from))
          await Promise.all(leaving.map(edge => player.send(edgeId(edge), edgeSeconds)))
        }
        if (!alive())
          return
        completed.value = continuous ? completed.value + 1 : r + 1
        // The ball goes back to the start for the next row; the last one rests where it ended
        if (loop && (continuous || r < rows - 1)) {
          player.status.value = {}
          await player.send(LOOP_EDGE, edgeSeconds * 1.6)
        }
      }
      if (continuous)
        continue
      await player.wait(restSeconds)
      if (!alive())
        return
      player.status.value = {}
      completed.value = 0
    }
  }

  function restart() {
    player.reset()
    row.value = 0
    completed.value = 0
    run(player.generation.value)
  }

  onMounted(restart)
  onScopeDispose(() => player.reset())

  return { row, completed, restart }
}
