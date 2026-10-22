import { describe, expect, it } from 'vitest'
import { parseFeedback } from './feedbackTokens'

describe('parseFeedback', () => {
  it('keeps a message without reference as one part', () => {
    expect(parseFeedback('Relis bien les questions.')).toEqual([{ text: 'Relis bien les questions.' }])
  })

  it('splits words and references in reading order', () => {
    expect(parseFeedback('Pour la {{question:12|Question 3}}, teste chaque option.')).toEqual([
      { text: 'Pour la ' },
      { text: 'Question 3', kind: 'question', id: 12 },
      { text: ', teste chaque option.' },
    ])
  })

  it('reads a reference at the start and at the end', () => {
    expect(parseFeedback('{{subject:4|Les fractions}} puis {{question:1|Question 1}}')).toEqual([
      { text: 'Les fractions', kind: 'subject', id: 4 },
      { text: ' puis ' },
      { text: 'Question 1', kind: 'question', id: 1 },
    ])
  })

  it('leaves an unknown kind as words', () => {
    expect(parseFeedback('{{skill:2|Additionner}}')).toEqual([{ text: '{{skill:2|Additionner}}' }])
  })
})
