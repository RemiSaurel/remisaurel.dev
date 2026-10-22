export const NEW_WINDOW_MONTHS = 3

/** True when the date falls within the last 3 months (and is not in the future beyond today). */
export function isNew(date: Date | string | undefined, now: Date = new Date()) {
  if (!date)
    return false
  const published = new Date(date)
  if (Number.isNaN(published.getTime()))
    return false
  const limit = new Date(now)
  limit.setMonth(limit.getMonth() - NEW_WINDOW_MONTHS)
  return published >= limit && published <= now
}
