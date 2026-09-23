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
  /**
   * Items can carry several values at once (the techs of a project), which makes
   * "is all of" meaningful. Leave it off when each item has a single value, like a year.
   */
  multiValued?: boolean
  /** Used in the chip once several values are picked, e.g. "3 techs". */
  plural?: string
  searchPlaceholder?: string
}

/**
 * How the selected values combine: `include` keeps items carrying any of them, `all` items
 * carrying every one of them, `exclude` items carrying none of them.
 */
export type FilterMode = 'include' | 'all' | 'exclude'

export interface FilterEntry {
  mode: FilterMode
  /** Single-choice filters hold zero or one value, so every filter reads the same way: empty means inactive. */
  values: FilterValue[]
}

/** Filter entry per filter key. */
export type FilterState = Record<string, FilterEntry>

export function emptyFilterEntry(): FilterEntry {
  return { mode: 'include', values: [] }
}

export function emptyFilterState(definitions: FilterDefinition[]): FilterState {
  return Object.fromEntries(definitions.map(definition => [definition.key, emptyFilterEntry()]))
}

export function hasActiveFilters(state: FilterState) {
  return Object.values(state).some(entry => entry.values.length)
}

/** Modes a filter offers: single-choice filters only ever read "is". */
export function filterModes(definition: FilterDefinition): FilterMode[] {
  if (!definition.multiple)
    return ['include']
  return definition.multiValued ? ['include', 'all', 'exclude'] : ['include', 'exclude']
}

/**
 * With a single value, "all of" and "any of" select the same items, so both read "is".
 * Callers compare against this rather than the stored mode to know what the chip says.
 */
export function effectiveMode(entry: FilterEntry): FilterMode {
  return entry.mode === 'all' && entry.values.length < 2 ? 'include' : entry.mode
}

const MODE_LABELS: Record<FilterMode, [single: string, several: string]> = {
  include: ['is', 'is any of'],
  all: ['is', 'is all of'],
  exclude: ['is not', 'is none of'],
}

export function modeLabel(mode: FilterMode, count: number) {
  return MODE_LABELS[mode][count > 1 ? 1 : 0]
}

/** An empty filter lets everything through; otherwise the item's values are checked against the mode. */
export function matchesFilter(entry: FilterEntry | undefined, values: FilterValue | FilterValue[] | undefined) {
  if (!entry?.values.length)
    return true
  const list = Array.isArray(values) ? values : [values]
  switch (entry.mode) {
    case 'all':
      return entry.values.every(value => list.includes(value))
    case 'exclude':
      return !entry.values.some(value => list.includes(value))
    default:
      return entry.values.some(value => list.includes(value))
  }
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
