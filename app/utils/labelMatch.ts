// Which expected parts of a drawing are named by its labels. A label is matched on the words the
// learner wrote, not on where it sits or what is drawn under it: a word list and a typo tolerance,
// simple enough to read, to test and to explain to a learner.

export interface ExpectedPart {
  id: string
  /** What the teacher sees. The learner is never told */
  name: string
  /** The ways to write it: synonyms, translations, short forms */
  accepts: string[]
}

export interface LabelCheck {
  /** The ids of the parts that at least one label names, in the order of the parts */
  covered: string[]
  /** The positions of the labels that name no expected part */
  unmatched: number[]
}

const ARTICLES = new Set(['the', 'a', 'an', 'le', 'la', 'les', 'l', 'un', 'une'])

/** Lower case, no accents or punctuation, one space between words, no article in front */
export function normalizeLabel(text: string): string {
  const words = text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
  while (words.length > 1 && ARTICLES.has(words[0]!))
    words.shift()
  return words.join(' ')
}

/** The number of single-letter changes (add, remove, replace) between two texts */
export function editDistance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const next = [i]
    for (let j = 1; j <= b.length; j++)
      next[j] = Math.min(row[j]! + 1, next[j - 1]! + 1, row[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
    row = next
  }
  return row[b.length]!
}

/** A typo costs a letter or two on a long word, and a short word like "ER" must be exact */
const tolerance = (word: string): number => word.length <= 4 ? 0 : word.length <= 8 ? 1 : 2

export function namesPart(text: string, part: ExpectedPart): boolean {
  const label = normalizeLabel(text)
  if (!label)
    return false
  return part.accepts.some((accepted) => {
    const target = normalizeLabel(accepted)
    return Math.abs(label.length - target.length) <= tolerance(target) && editDistance(label, target) <= tolerance(target)
  })
}

export function checkLabels(texts: string[], parts: ExpectedPart[]): LabelCheck {
  const covered = new Set<string>()
  const unmatched: number[] = []
  texts.forEach((text, index) => {
    const part = parts.find(candidate => namesPart(text, candidate))
    if (part)
      covered.add(part.id)
    else
      unmatched.push(index)
  })
  return { covered: parts.filter(part => covered.has(part.id)).map(part => part.id), unmatched }
}
