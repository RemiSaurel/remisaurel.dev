export interface Reference {
  id: string
  authors: string[]
  year: number
  title: string
  venue?: string
  url?: string
}

export const REFERENCES_KEY = Symbol('references') as InjectionKey<ComputedRef<Reference[]>>

function lastName(author: string) {
  return author.split(',')[0]!.trim()
}

// APA-style short author label: "Name", "Name & Other" or "Name et al."
export function citationAuthors(ref: Reference) {
  const names = ref.authors.map(lastName)
  if (names.length === 1)
    return names[0]
  if (names.length === 2)
    return `${names[0]} & ${names[1]}`
  return `${names[0]} et al.`
}

// "A, B, & C" as in an APA reference list
export function fullAuthors(ref: Reference) {
  const a = ref.authors
  if (a.length <= 1)
    return a[0] ?? ''
  return `${a.slice(0, -1).join(', ')}, & ${a.at(-1)}`
}
