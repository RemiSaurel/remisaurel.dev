/** When a ball launched at `start` for `duration` seconds lands. One expression, so the clock and the step agree to the bit */
export function landsAt(flight: { start: number, duration: number }): number {
  return flight.start + flight.duration
}

/**
 * The next moment something waiting on the player's clock resolves: a timer coming due or a ball landing.
 * What "one step" runs up to. `null` when nothing is waiting
 */
export function nextEventAt(timers: { due: number }[], flights: { start: number, duration: number }[]): number | null {
  const times = [...timers.map(timer => timer.due), ...flights.map(landsAt)]
  return times.length ? Math.min(...times) : null
}
