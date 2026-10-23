// The mentions of the teachers' chatbot: type `@` to pick a learner, `#` to pick a subject. These are
// the rules of the app's input, ported as pure functions so the exploration plays by the same ones.

export type MentionKind = 'learner' | 'subject'

export interface Mention {
  kind: MentionKind
  /** The id of the learner or the subject: a name alone cannot tell two learners apart */
  id: number
  name: string
}

/** The character that opens the list of each kind */
export const MENTION_TRIGGERS: Record<MentionKind, string> = { learner: '@', subject: '#' }

export interface MentionQuery {
  kind: MentionKind
  /** Index of the trigger character in the text */
  start: number
  /** What was typed after the trigger, up to the cursor */
  query: string
}

/**
 * The list is open while the cursor sits right after a trigger and the words typed since: the trigger
 * must start the text or follow a space, and a space closes the list. The nearest trigger wins.
 */
export function findMentionQuery(text: string, cursor: number): MentionQuery | null {
  const before = text.slice(0, cursor)
  const at = before.lastIndexOf('@')
  const hash = before.lastIndexOf('#')
  const start = Math.max(at, hash)
  if (start < 0)
    return null
  if (start > 0 && !/\s/.test(before[start - 1]!))
    return null
  const query = before.slice(start + 1)
  if (/\s/.test(query))
    return null
  return { kind: start === at ? 'learner' : 'subject', start, query }
}

// The app compares in lower case. The exploration also drops accents, so "Geometrie" finds "Géométrie"
const fold = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** The items whose name contains what was typed, in the order of the list */
export function matchNames<T extends { name: string }>(items: T[], query: string): T[] {
  const needle = fold(query)
  return needle ? items.filter(item => fold(item.name).includes(needle)) : items
}

/** Replaces the trigger and what follows it with the picked name and a space, and says where the cursor goes */
export function insertMention(text: string, cursor: number, found: MentionQuery, name: string) {
  const inserted = `${MENTION_TRIGGERS[found.kind]}${name} `
  return {
    text: text.slice(0, found.start) + inserted + text.slice(cursor),
    cursor: found.start + inserted.length,
  }
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * The text the backend receives: each picked mention, as long as it is still in the text and ends
 * a word, becomes a tag around its name, with its id. A name typed by hand, without picking it,
 * stays as typed. (The app tags the name only: the id is what the exploration adds.)
 */
export function toPrompt(text: string, mentions: Mention[]): string {
  return mentions.reduce((prompt, { kind, id, name }) => {
    const typed = new RegExp(`${escapeRegExp(MENTION_TRIGGERS[kind])}${escapeRegExp(name)}(?=\\s|$)`, 'g')
    return prompt.replace(typed, () => `<${kind} id="${id}">${name}</${kind}>`)
  }, text)
}

export interface PromptPart {
  text: string
  /** Set for a tagged name, with its id */
  kind?: MentionKind
  id?: number
}

const TAG = /<(learner|subject) id="(\d+)">(.*?)<\/\1>/g

/** Splits a prompt as the backend receives it into plain words and tagged names, in reading order */
export function parsePrompt(prompt: string): PromptPart[] {
  const parts: PromptPart[] = []
  let last = 0
  for (const match of prompt.matchAll(TAG)) {
    if (match.index > last)
      parts.push({ text: prompt.slice(last, match.index) })
    parts.push({ text: match[3]!, kind: match[1] as MentionKind, id: Number(match[2]) })
    last = match.index + match[0].length
  }
  if (last < prompt.length)
    parts.push({ text: prompt.slice(last) })
  return parts
}
