import type { Drawing } from '~/composables/useDrawing'
import type { SimulatedAct } from '~/utils/simulatedLearner'
import { simulatedCell } from '~/utils/simulatedLearner'

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

/**
 * Plays a scripted learner into a drawing, in real time: the strokes grow point by point and the pauses are
 * real, so the log it leaves has the shape of a session someone drew. It goes through the same calls as the
 * pen and the buttons, so nothing in the drawing tells it from a hand. `check` is the page's own way to ask for help.
 */
export function useSimulatedLearner(drawing: Drawing, check: () => void) {
  const running = ref(false)
  // A run that is stopped, or replaced, sees its number is no longer the current one
  let current = 0

  async function perform(act: SimulatedAct, run: number) {
    if (act.type === 'stroke') {
      const [first, ...rest] = act.path
      if (!first)
        return
      drawing.color.value = act.color
      drawing.size.value = act.size
      drawing.begin(first[0], first[1], first[2], true)
      let previous = first[3]
      for (const [x, y, pressure, t] of rest) {
        await sleep(t - previous)
        if (run !== current)
          return drawing.cancel()
        drawing.extend(x, y, pressure)
        previous = t
      }
      drawing.finish()
    }
    else if (act.type === 'label') {
      drawing.color.value = act.color
      drawing.addLabel(act.x, act.y, act.text, act.size)
    }
    else if (act.type === 'rename') {
      const label = drawing.labels.value.find(item => item.text === act.from)
      if (label)
        drawing.editLabel(label.id, { text: act.to })
    }
    else if (act.type === 'undo') {
      drawing.undo()
    }
    else {
      check()
    }
  }

  async function start() {
    const run = ++current
    drawing.reset()
    running.value = true
    for (const { pause, act } of simulatedCell()) {
      await sleep(pause)
      if (run !== current)
        return
      await perform(act, run)
      if (run !== current)
        return
    }
    running.value = false
  }

  /** What was drawn stays: a stopped learner is a learner who left */
  function stop() {
    current++
    running.value = false
  }

  onBeforeUnmount(stop)

  return { running, start, stop }
}
