import { describe, expect, it } from 'vitest'
import { percent } from './percent'

describe('percent', () => {
  it('writes a share of the total as a CSS length', () => {
    expect(percent(30, 120)).toBe('25.000%')
    expect(percent(0, 120)).toBe('0.000%')
  })

  it('rounds to three decimals', () => {
    expect(percent(1, 3)).toBe('33.333%')
  })

  it('keeps values outside the total, which a popover can have near an edge', () => {
    expect(percent(-10, 100)).toBe('-10.000%')
    expect(percent(150, 100)).toBe('150.000%')
  })
})
