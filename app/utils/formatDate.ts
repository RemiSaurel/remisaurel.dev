export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

/** True when the item opens a new year in a date-sorted list, so only that row prints the year. */
export function isFirstOfYear<T>(items: T[], index: number, getDate: (item: T) => Date) {
  if (index === 0)
    return true
  return new Date(getDate(items[index - 1]!)).getFullYear() !== new Date(getDate(items[index]!)).getFullYear()
}
