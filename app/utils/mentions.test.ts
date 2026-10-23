import { describe, expect, it } from 'vitest'
import { findMentionQuery, insertMention, matchNames, parsePrompt, toPrompt } from './mentions'

describe('findMentionQuery', () => {
  it('opens the list of learners on @ and of subjects on #', () => {
    expect(findMentionQuery('How did @', 9)).toEqual({ kind: 'learner', start: 8, query: '' })
    expect(findMentionQuery('Who failed #Pyt', 15)).toEqual({ kind: 'subject', start: 11, query: 'Pyt' })
  })

  it('accepts a trigger at the start of the text', () => {
    expect(findMentionQuery('@Ma', 3)).toEqual({ kind: 'learner', start: 0, query: 'Ma' })
  })

  it('ignores a trigger inside a word, like in an email', () => {
    expect(findMentionQuery('write to jean@school', 20)).toBeNull()
  })

  it('closes once a space follows the query', () => {
    expect(findMentionQuery('who is #Algebra and', 19)).toBeNull()
  })

  it('reads only up to the cursor', () => {
    expect(findMentionQuery('who is #Algebra', 10)).toEqual({ kind: 'subject', start: 7, query: 'Al' })
  })

  it('takes the nearest trigger', () => {
    expect(findMentionQuery('#Algebra @Ma', 12)).toEqual({ kind: 'learner', start: 9, query: 'Ma' })
    expect(findMentionQuery('@Marie #Alg', 11)).toEqual({ kind: 'subject', start: 7, query: 'Alg' })
  })

  it('stays closed without a trigger', () => {
    expect(findMentionQuery('who is the best', 15)).toBeNull()
  })
})

describe('matchNames', () => {
  const names = ['Probability', 'Geometry', 'Géométrie', 'Algebra']
  const subjects = names.map((name, index) => ({ id: index + 1, name }))
  const only = (...wanted: string[]) => subjects.filter(subject => wanted.includes(subject.name))

  it('keeps the whole list for an empty query', () => {
    expect(matchNames(subjects, '')).toEqual(subjects)
  })

  it('matches anywhere in the name, ignoring case', () => {
    expect(matchNames(subjects, 'ebr')).toEqual(only('Algebra'))
    expect(matchNames(subjects, 'GEO')).toEqual(only('Geometry', 'Géométrie'))
  })

  it('ignores accents on both sides', () => {
    expect(matchNames(subjects, 'geometrie')).toEqual(only('Géométrie'))
    expect(matchNames(subjects, 'Géom')).toEqual(only('Geometry', 'Géométrie'))
  })

  it('returns nothing when no name matches', () => {
    expect(matchNames(subjects, 'zzz')).toEqual([])
  })
})

describe('insertMention', () => {
  it('swaps the trigger and the query for the name and a space', () => {
    const text = 'Who failed #Pyt'
    const found = findMentionQuery(text, text.length)!
    expect(insertMention(text, text.length, found, 'Pythagoras')).toEqual({
      text: 'Who failed #Pythagoras ',
      cursor: 23,
    })
  })

  it('keeps what follows the cursor', () => {
    const text = 'How did @Ma do on algebra?'
    const found = findMentionQuery(text, 11)!
    expect(insertMention(text, 11, found, 'Marie Dupont')).toEqual({
      text: 'How did @Marie Dupont  do on algebra?',
      cursor: 22,
    })
  })
})

describe('toPrompt', () => {
  it('wraps a picked mention in a tag of its kind', () => {
    expect(toPrompt('Who failed #Pythagoras ', [{ kind: 'subject', id: 2, name: 'Pythagoras' }]))
      .toBe('Who failed <subject id="2">Pythagoras</subject> ')
  })

  it('wraps a mention at the end of the text', () => {
    expect(toPrompt('Who failed #Pythagoras', [{ kind: 'subject', id: 2, name: 'Pythagoras' }]))
      .toBe('Who failed <subject id="2">Pythagoras</subject>')
  })

  it('wraps every picked mention, names with spaces included', () => {
    const mentions = [
      { kind: 'learner' as const, id: 16, name: 'Marie Dupont' },
      { kind: 'subject' as const, id: 3, name: 'Algebra' },
    ]
    expect(toPrompt('Did @Marie Dupont pass #Algebra ?', mentions))
      .toBe('Did <learner id="16">Marie Dupont</learner> pass <subject id="3">Algebra</subject> ?')
  })

  it('leaves a name typed by hand as typed', () => {
    expect(toPrompt('Who failed #Pythagoras ', [])).toBe('Who failed #Pythagoras ')
  })

  it('leaves a picked mention that was edited afterwards', () => {
    expect(toPrompt('Who failed #Pythagora ', [{ kind: 'subject', id: 2, name: 'Pythagoras' }]))
      .toBe('Who failed #Pythagora ')
  })

  it('reads a name with special characters literally', () => {
    expect(toPrompt('See #Maths (2) $& now', [{ kind: 'subject', id: 7, name: 'Maths (2) $&' }]))
      .toBe('See <subject id="7">Maths (2) $&</subject> now')
  })
})

describe('parsePrompt', () => {
  it('keeps a prompt without tag as one part', () => {
    expect(parsePrompt('Who is the best?')).toEqual([{ text: 'Who is the best?' }])
  })

  it('splits words and tagged names in reading order', () => {
    expect(parsePrompt('Did <learner id="16">Marie Dupont</learner> pass <subject id="3">Algebra</subject>?')).toEqual([
      { text: 'Did ' },
      { text: 'Marie Dupont', kind: 'learner', id: 16 },
      { text: ' pass ' },
      { text: 'Algebra', kind: 'subject', id: 3 },
      { text: '?' },
    ])
  })

  it('reads a tag at the start and at the end', () => {
    expect(parsePrompt('<subject id="3">Algebra</subject> then <learner id="13">Jean Martin</learner>')).toEqual([
      { text: 'Algebra', kind: 'subject', id: 3 },
      { text: ' then ' },
      { text: 'Jean Martin', kind: 'learner', id: 13 },
    ])
  })

  it('leaves an unknown tag as words', () => {
    expect(parsePrompt('<skill id="2">Adding</skill>')).toEqual([{ text: '<skill id="2">Adding</skill>' }])
  })

  it('leaves a tag without id as words', () => {
    expect(parsePrompt('<subject>Algebra</subject>')).toEqual([{ text: '<subject>Algebra</subject>' }])
  })
})
