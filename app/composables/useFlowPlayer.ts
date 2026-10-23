import type { FlowPacket, FlowStatus } from '~/utils/flow/types'
import { landsAt, nextEventAt } from '~/utils/flow/clock'

export interface FlowPlayerOptions {
  /** Starts playing once mounted. Never under reduced motion: the visitor presses play when they want it */
  autoplay?: boolean
}

/** Real seconds a step may take at most: a `think` wait of a second must not make the button feel slow */
const STEP_SECONDS = 0.3

/**
 * What a workflow canvas shows happening: the status of each node and the balls travelling its edges.
 * An exploration drives it from its own logic (`set`, `send`, `wait`), and every duration runs on the
 * player's clock, so pausing and changing the speed apply to whatever is in flight: paused, every
 * `wait` and `send` holds where it is, and so does the driver awaiting them.
 */
export function useFlowPlayer(options: FlowPlayerOptions = {}) {
  const { prefersReducedMotion } = usePrefersReducedMotion()

  const status = ref<Record<string, FlowStatus>>({})
  const packets = shallowRef<FlowPacket[]>([])
  const playing = ref(false)
  const speed = ref(1)
  /** Whether the canvas is on screen: the clock stands still while nobody can see it */
  const visible = ref(true)
  /** Bumped by `reset`: a driver started before it should stop */
  const generation = ref(0)

  let clock = 0
  let raf = 0
  let last = 0
  let nextPacket = 0
  /** Where a `step` stops: the clock runs up to it while paused, then holds again. `null` outside a step */
  let stepTarget: number | null = null
  /** Clock seconds per real second during a step: fast enough that a long beat still takes `STEP_SECONDS` */
  let stepRate = 1
  let timers: { due: number, done: () => void }[] = []
  let flights: { packet: FlowPacket, start: number, duration: number, done: () => void }[] = []

  onMounted(() => {
    if (options.autoplay && !prefersReducedMotion.value)
      playing.value = true
  })

  const running = () => (playing.value || stepTarget !== null) && visible.value

  /** Fires whatever the clock has reached: timers coming due, balls landing */
  function flush() {
    const due = timers.filter(timer => timer.due <= clock)
    timers = timers.filter(timer => timer.due > clock)
    due.forEach(timer => timer.done())

    const landed = flights.filter(flight => clock >= landsAt(flight))
    flights = flights.filter(flight => clock < landsAt(flight))
    packets.value = flights.map(flight => ({ ...flight.packet, t: (clock - flight.start) / flight.duration }))
    landed.forEach(flight => flight.done())
  }

  function tick(now: number) {
    raf = 0
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0
    last = now
    if (running()) {
      clock += dt * (stepTarget === null ? speed.value : stepRate)
      // A step never runs past its event: it lands on it exactly, then the clock holds
      if (stepTarget !== null && clock >= stepTarget) {
        clock = stepTarget
        stepTarget = null
      }
    }

    flush()
    schedule()
  }

  // The frame loop only runs while something is waiting on the clock
  function schedule() {
    if (import.meta.server || raf || (!timers.length && !flights.length))
      return
    if (!last)
      last = performance.now()
    raf = requestAnimationFrame(tick)
  }

  function stopLoop() {
    if (raf)
      cancelAnimationFrame(raf)
    raf = 0
    last = 0
  }

  onScopeDispose(stopLoop)

  /** Resolves after `seconds` of player time */
  function wait(seconds: number) {
    return new Promise<void>((resolve) => {
      timers.push({ due: clock + seconds, done: resolve })
      schedule()
    })
  }

  /** Sends a ball along `edge` (an edge id, or `loop`); resolves when it lands */
  function send(edge: string, seconds = 1) {
    return new Promise<void>((resolve) => {
      flights.push({ packet: { id: nextPacket++, edge, t: 0 }, start: clock, duration: seconds, done: resolve })
      schedule()
    })
  }

  function play() {
    playing.value = true
  }

  function pause() {
    playing.value = false
  }

  function toggle() {
    if (playing.value)
      pause()
    else
      play()
  }

  /**
   * Pauses, then runs the clock up to the next thing that resolves (a `wait` ending, a ball landing),
   * so each press moves the flow one beat. Pressed again mid-beat, it finishes that beat at once
   */
  function step() {
    pause()
    if (stepTarget !== null) {
      clock = stepTarget
      stepTarget = null
      flush()
      return
    }
    stepTarget = nextEventAt(timers, flights)
    if (stepTarget !== null)
      stepRate = Math.max(speed.value, (stepTarget - clock) / STEP_SECONDS)
    schedule()
  }

  function setSpeed(next: number) {
    speed.value = next
  }

  function setVisible(next: boolean) {
    visible.value = next
  }

  function set(id: string, next: FlowStatus) {
    status.value = { ...status.value, [id]: next }
  }

  /** Clears every status and ball, and drops whatever was waiting: drivers watch `generation` to stop */
  function reset() {
    status.value = {}
    packets.value = []
    timers = []
    flights = []
    stepTarget = null
    generation.value++
  }

  watch([playing, visible], schedule)

  return {
    status,
    packets,
    playing,
    speed,
    visible,
    generation,
    set,
    send,
    wait,
    play,
    pause,
    toggle,
    step,
    reset,
    setSpeed,
    setVisible,
  }
}

export type FlowPlayer = ReturnType<typeof useFlowPlayer>
