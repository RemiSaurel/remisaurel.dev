import type { FlowPacket, FlowStatus } from '~/utils/flow/types'

export interface FlowPlayerOptions {
  /** Starts playing once mounted. Never under reduced motion: the visitor presses play when they want it */
  autoplay?: boolean
}

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
  let timers: { due: number, done: () => void }[] = []
  let flights: { packet: FlowPacket, start: number, duration: number, done: () => void }[] = []

  onMounted(() => {
    if (options.autoplay && !prefersReducedMotion.value)
      playing.value = true
  })

  const running = () => playing.value && visible.value

  function tick(now: number) {
    raf = 0
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0
    last = now
    if (running())
      clock += dt * speed.value

    const due = timers.filter(timer => timer.due <= clock)
    timers = timers.filter(timer => timer.due > clock)
    due.forEach(timer => timer.done())

    const landed = flights.filter(flight => clock - flight.start >= flight.duration)
    flights = flights.filter(flight => clock - flight.start < flight.duration)
    packets.value = flights.map(flight => ({ ...flight.packet, t: (clock - flight.start) / flight.duration }))
    landed.forEach(flight => flight.done())

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
    reset,
    setSpeed,
    setVisible,
  }
}

export type FlowPlayer = ReturnType<typeof useFlowPlayer>
