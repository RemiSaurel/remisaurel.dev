import type { MaybeRefOrGetter } from 'vue'
import type { Project } from '~/pages/projects/index.vue'
import type { Tech, TechKey } from '~/projects/techs'
import type { FilterDefinition, FilterState } from '~/utils/filters'
import { TECHS } from '~/projects/techs'
import { countBy, emptyFilterState, hasActiveFilters, matchesFilter } from '~/utils/filters'

/**
 * Filters for the projects page. A project must match every active filter; within one
 * filter, its mode (any of, all of, none of) decides how the selected values combine.
 */
export function useProjectFilters(projects: MaybeRefOrGetter<Project[]>) {
  const definitions = computed<FilterDefinition[]>(() => {
    const list = toValue(projects)
    const techCounts = countBy(list, project => project.stack)
    const yearCounts = countBy(list, project => project.date)
    const websiteCounts = countBy(list, project => !!project.links?.demo)
    const sourceCounts = countBy(list, project => !!project.links?.github)

    return [
      {
        key: 'techs',
        label: 'Tech',
        icon: 'lucide:layers',
        multiple: true,
        multiValued: true,
        plural: 'techs',
        searchPlaceholder: 'Search a tech…',
        options: (Object.keys(TECHS) as TechKey[])
          .filter(key => techCounts.has(key))
          .map((key) => {
            const tech: Tech = TECHS[key]
            return { value: key, label: tech.name, icon: tech.icon, iconColor: tech.color, count: techCounts.get(key) }
          }),
      },
      {
        key: 'years',
        label: 'Year',
        icon: 'lucide:calendar',
        multiple: true,
        plural: 'years',
        options: [...yearCounts.keys()]
          .sort((a, b) => Number(b) - Number(a))
          .map(year => ({ value: year, label: String(year), count: yearCounts.get(year) })),
      },
      {
        key: 'website',
        label: 'Website',
        icon: 'lucide:globe',
        multiple: false,
        options: [
          { value: true, label: 'Live', count: websiteCounts.get(true) ?? 0 },
          { value: false, label: 'Not live', count: websiteCounts.get(false) ?? 0 },
        ],
      },
      {
        key: 'source',
        label: 'Source code',
        icon: 'lucide:github',
        multiple: false,
        options: [
          { value: true, label: 'Public', count: sourceCounts.get(true) ?? 0 },
          { value: false, label: 'Private', count: sourceCounts.get(false) ?? 0 },
        ],
      },
    ]
  })

  const filters = ref<FilterState>(emptyFilterState(definitions.value))

  const filtered = computed(() => {
    const { techs, years, website, source } = filters.value
    return toValue(projects).filter(project =>
      matchesFilter(techs, project.stack)
      && matchesFilter(years, project.date)
      && matchesFilter(website, !!project.links?.demo)
      && matchesFilter(source, !!project.links?.github),
    )
  })

  const hasFilters = computed(() => hasActiveFilters(filters.value))

  function clear() {
    filters.value = emptyFilterState(definitions.value)
  }

  return {
    definitions,
    filters,
    filtered,
    hasFilters,
    clear,
  }
}
