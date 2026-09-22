export type FilterValue = string | number | boolean

export interface FilterOption {
  value: FilterValue
  label: string
  icon?: string
  /** Monochrome icons need an explicit brand color. */
  iconColor?: string
  /** How many items carry this value, shown next to the option. */
  count?: number
}

export interface FilterDefinition {
  key: string
  label: string
  icon: string
  /** Checkboxes when true, a single choice (radio) otherwise. */
  multiple: boolean
  options: FilterOption[]
  /** Used in the chip once several values are picked, e.g. "3 techs". */
  plural?: string
  searchPlaceholder?: string
}

/**
 * Selected values per filter key. Single-choice filters hold zero or one value, so every
 * filter reads the same way: empty means inactive.
 */
export type FilterState = Record<string, FilterValue[]>

export function emptyFilterState(definitions: FilterDefinition[]): FilterState {
  return Object.fromEntries(definitions.map(definition => [definition.key, []]))
}

/** An empty filter lets everything through; otherwise any selected value must match. */
export function matchesFilter(selected: FilterValue[] | undefined, values: FilterValue | FilterValue[] | undefined) {
  if (!selected?.length)
    return true
  const list = Array.isArray(values) ? values : [values]
  return selected.some(value => list.includes(value))
}

/** How many items carry each value, for the counts shown next to the options. */
export function countBy<T>(items: T[], getValues: (item: T) => FilterValue | FilterValue[] | undefined) {
  const counts = new Map<FilterValue, number>()
  for (const item of items) {
    const values = getValues(item)
    for (const value of Array.isArray(values) ? values : [values]) {
      if (value !== undefined)
        counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }
  return counts
}
