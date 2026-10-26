/** A share of a whole as a CSS length, to place something on a map by its coordinates: `percent(30, 120)` is `'25.000%'`. */
export function percent(value: number, total: number) {
  return `${((value / total) * 100).toFixed(3)}%`
}
