import type { CurrentWeather, WeatherKind } from '~/utils/weather'
import { parseCurrentWeather, WEATHER_URL } from '~/utils/weather'

const REFRESH_MS = 15 * 60_000
// How long the tile waits for the first answer before it shows up without weather
const FIRST_ANSWER_MS = 1500
const FORCED_KINDS: WeatherKind[] = ['clear', 'partly', 'cloud', 'rain', 'snow', 'storm']

/**
 * Current weather in Toulouse, fetched in the browser only (the site is static, so a build-time
 * value would be stale). Stays null until it arrives, or for good if the request fails.
 * `?weather=snow&temp=-2` forces it while developing.
 */
export function useToulouseWeather() {
  const fetched = useState<CurrentWeather | null>('toulouse-weather', () => null)
  const settled = useState('toulouse-weather-settled', () => false)
  const route = useRoute()

  const weather = computed<CurrentWeather | null>(() => {
    const kind = import.meta.dev ? route.query.weather : undefined
    if (typeof kind === 'string' && FORCED_KINDS.includes(kind as WeatherKind)) {
      const temperature = Number(route.query.temp)
      return {
        kind: kind as WeatherKind,
        temperature: Number.isFinite(temperature) && route.query.temp !== undefined ? temperature : 15,
        isDay: route.query.night === undefined,
      }
    }
    return fetched.value
  })

  async function refresh() {
    try {
      fetched.value = parseCurrentWeather(await $fetch(WEATHER_URL)) ?? fetched.value
    }
    catch {
      // No weather is fine: the tile just shows the clock
    }
    settled.value = true
  }

  let timer: ReturnType<typeof setInterval> | undefined
  let giveUp: ReturnType<typeof setTimeout> | undefined
  onMounted(() => {
    refresh()
    timer = setInterval(refresh, REFRESH_MS)
    giveUp = setTimeout(() => settled.value = true, FIRST_ANSWER_MS)
  })
  onBeforeUnmount(() => {
    clearInterval(timer)
    clearTimeout(giveUp)
  })

  // `settled`: the first answer came, or failed, or took too long
  return { weather, settled }
}
