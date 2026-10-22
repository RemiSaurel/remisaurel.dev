export type WeatherKind = 'clear' | 'partly' | 'cloud' | 'rain' | 'snow' | 'storm'
export type TemperatureBand = 'cold' | 'mild' | 'hot'

export interface CurrentWeather {
  temperature: number
  kind: WeatherKind
  isDay: boolean
}

export const WEATHER_LABELS: Record<WeatherKind, string> = {
  clear: 'Clear sky',
  partly: 'Partly cloudy',
  cloud: 'Cloudy',
  rain: 'Rain',
  snow: 'Snow',
  storm: 'Thunderstorm',
}

export const BAND_LABELS: Record<TemperatureBand, string> = {
  cold: 'cold',
  mild: 'mild',
  hot: 'hot',
}

const COLD_BELOW = 10
const HOT_FROM = 25

export function temperatureBand(celsius: number): TemperatureBand {
  if (celsius < COLD_BELOW)
    return 'cold'
  return celsius >= HOT_FROM ? 'hot' : 'mild'
}

/** Folds the WMO weather codes (Open-Meteo) into the few looks the tile can draw. */
export function weatherKindFromCode(code: number): WeatherKind {
  if (code === 0)
    return 'clear'
  if (code <= 2)
    return 'partly'
  if (code === 3 || code === 45 || code === 48)
    return 'cloud'
  if (code >= 95)
    return 'storm'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return 'snow'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return 'rain'
  return 'cloud'
}

// Toulouse, in the Europe/Paris zone like the clock
const LATITUDE = 43.6047
const LONGITUDE = 1.4442

export const WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,weather_code,is_day&timezone=Europe%2FParis`

/** Reads an Open-Meteo `current` answer; anything unexpected gives null so the tile just stays without weather. */
export function parseCurrentWeather(json: unknown): CurrentWeather | null {
  const current = (json as { current?: Record<string, unknown> } | null)?.current
  const temperature = current?.temperature_2m
  const code = current?.weather_code
  if (typeof temperature !== 'number' || typeof code !== 'number')
    return null
  return {
    temperature,
    kind: weatherKindFromCode(code),
    isDay: current?.is_day !== 0,
  }
}
