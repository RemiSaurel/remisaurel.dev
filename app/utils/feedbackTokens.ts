export interface FeedbackPart {
  text: string
  // Set for a reference the client turns into an inline icon
  kind?: 'question' | 'subject'
  id?: number
}

// The stored form of a reference, written by the backend: {{question:12|Question 3}}
const TOKEN = /\{\{(question|subject):(\d+)\|([^{}]*)\}\}/g

// Split a stored feedback message into plain words and references, in reading order
export function parseFeedback(text: string): FeedbackPart[] {
  const parts: FeedbackPart[] = []
  let last = 0
  for (const match of text.matchAll(TOKEN)) {
    if (match.index > last)
      parts.push({ text: text.slice(last, match.index) })
    parts.push({ text: match[3]!, kind: match[1] as 'question' | 'subject', id: Number(match[2]) })
    last = match.index + match[0].length
  }
  if (last < text.length)
    parts.push({ text: text.slice(last) })
  return parts
}
