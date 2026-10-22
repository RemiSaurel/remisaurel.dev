import { describe, expect, it } from 'vitest'
import { parseCurrentWeather, temperatureBand, weatherKindFromCode } from './weather'

describe('temperatureBand', () => {
  it('splits cold, mild and hot', () => {
    expect(temperatureBand(-3)).toBe('cold')
    expect(temperatureBand(9.9)).toBe('cold')
    expect(temperatureBand(10)).toBe('mild')
    expect(temperatureBand(24.9)).toBe('mild')
    expect(temperatureBand(25)).toBe('hot')
  })
})

describe('weatherKindFromCode', () => {
  it('maps the WMO codes', () => {
    expect(weatherKindFromCode(0)).toBe('clear')
    expect(weatherKindFromCode(2)).toBe('partly')
    expect(weatherKindFromCode(3)).toBe('cloud')
    expect(weatherKindFromCode(45)).toBe('cloud')
    expect(weatherKindFromCode(53)).toBe('rain')
    expect(weatherKindFromCode(81)).toBe('rain')
    expect(weatherKindFromCode(73)).toBe('snow')
    expect(weatherKindFromCode(86)).toBe('snow')
    expect(weatherKindFromCode(96)).toBe('storm')
  })

  it('falls back to cloud on an unknown code', () => {
    expect(weatherKindFromCode(40)).toBe('cloud')
  })
})

describe('parseCurrentWeather', () => {
  it('reads an Open-Meteo answer', () => {
    expect(parseCurrentWeather({ current: { temperature_2m: 14.2, weather_code: 61, is_day: 0 } }))
      .toEqual({ temperature: 14.2, kind: 'rain', isDay: false })
  })

  it('gives null when the answer is not the expected shape', () => {
    expect(parseCurrentWeather(null)).toBeNull()
    expect(parseCurrentWeather({})).toBeNull()
    expect(parseCurrentWeather({ current: { temperature_2m: '14' } })).toBeNull()
  })
})
