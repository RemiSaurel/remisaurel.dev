import type { ExpectedPart } from './labelMatch'
import { describe, expect, it } from 'vitest'
import { checkLabels, editDistance, namesPart, normalizeLabel } from './labelMatch'

const NUCLEUS: ExpectedPart = { id: 'nucleus', name: 'Nucleus', accepts: ['nucleus', 'noyau'] }
const MITO: ExpectedPart = { id: 'mito', name: 'Mitochondria', accepts: ['mitochondria', 'mitochondrion', 'mitochondrie'] }
const ER: ExpectedPart = { id: 'er', name: 'Endoplasmic reticulum', accepts: ['endoplasmic reticulum', 'er'] }
const PARTS = [NUCLEUS, MITO, ER]

describe('normalizeLabel', () => {
  it('ignores case, accents, punctuation and extra spaces', () => {
    expect(normalizeLabel('  Réticulum   Endoplasmique! ')).toBe('reticulum endoplasmique')
  })

  it('drops the article in front', () => {
    expect(normalizeLabel('The nucleus')).toBe('nucleus')
    expect(normalizeLabel('l\'appareil de Golgi')).toBe('appareil de golgi')
  })

  it('keeps a text that is only an article', () => {
    expect(normalizeLabel('la')).toBe('la')
  })

  it('is empty for nothing but punctuation', () => {
    expect(normalizeLabel(' ?! ')).toBe('')
  })
})

describe('editDistance', () => {
  it('counts additions, removals and replacements', () => {
    expect(editDistance('nucleus', 'nucleus')).toBe(0)
    expect(editDistance('nuclus', 'nucleus')).toBe(1)
    expect(editDistance('nucleas', 'nucleus')).toBe(1)
    expect(editDistance('', 'abc')).toBe(3)
  })
})

describe('namesPart', () => {
  it('matches any of the accepted writings, in any language listed', () => {
    expect(namesPart('Nucleus', NUCLEUS)).toBe(true)
    expect(namesPart('le noyau', NUCLEUS)).toBe(true)
  })

  it('forgives a typo on a long word', () => {
    expect(namesPart('nuclues', NUCLEUS)).toBe(false)
    expect(namesPart('nuclus', NUCLEUS)).toBe(true)
    expect(namesPart('mitocondria', MITO)).toBe(true)
  })

  it('wants a short word exact', () => {
    expect(namesPart('ER', ER)).toBe(true)
    expect(namesPart('EP', ER)).toBe(false)
  })

  it('does not match a different part', () => {
    expect(namesPart('mitochondria', NUCLEUS)).toBe(false)
  })

  it('does not match when the label only contains the word', () => {
    expect(namesPart('nucleus and nucleolus', NUCLEUS)).toBe(false)
  })

  it('does not match an empty label', () => {
    expect(namesPart('', NUCLEUS)).toBe(false)
  })
})

describe('checkLabels', () => {
  it('lists the parts that are named, in the order of the parts, and the labels that name none', () => {
    const result = checkLabels(['ER', 'cell wall', 'nucleus'], PARTS)
    expect(result.covered).toEqual(['nucleus', 'er'])
    expect(result.unmatched).toEqual([1])
  })

  it('counts a part once, however many labels name it', () => {
    expect(checkLabels(['nucleus', 'noyau', 'Nucleus'], PARTS).covered).toEqual(['nucleus'])
  })

  it('covers nothing when there are no labels', () => {
    expect(checkLabels([], PARTS)).toEqual({ covered: [], unmatched: [] })
  })
})
