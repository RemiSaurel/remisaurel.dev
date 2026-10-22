export type MascotState = 'sleep' | 'code' | 'music'

const minutes = (hours: number, mins = 0) => hours * 60 + mins

/** What the mascot is doing from each time of day on, in minutes after midnight. Sorted. */
const SCHEDULE: { from: number, state: MascotState }[] = [
  { from: minutes(0), state: 'sleep' },
  { from: minutes(7), state: 'music' },
  { from: minutes(7, 45), state: 'code' },
  { from: minutes(12, 15), state: 'music' },
  { from: minutes(13, 15), state: 'code' },
  { from: minutes(18, 30), state: 'music' },
  { from: minutes(19, 30), state: 'code' },
  { from: minutes(23), state: 'sleep' },
]

export const MASCOT_LABELS: Record<MascotState, string> = {
  sleep: 'Sleeping',
  code: 'Coding',
  music: 'Listening to music',
}

export function mascotStateAt(minutesOfDay: number): MascotState {
  let state = SCHEDULE[0]!.state
  for (const slot of SCHEDULE) {
    if (slot.from > minutesOfDay)
      break
    state = slot.state
  }
  return state
}

/** Minutes after midnight in the given time zone. */
export function minutesOfDay(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date)
  const part = (type: string) => Number(parts.find(p => p.type === type)?.value)
  return part('hour') * 60 + part('minute')
}
