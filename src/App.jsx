import React, { useState, useCallback } from 'react'
import { WiStrongWind, WiHumidity, WiThermometer } from 'react-icons/wi'
import { FaLocationDot, FaMagnifyingGlass } from 'react-icons/fa6'
import { getWeatherInfo } from './weatherCodes.js'

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

function cToF(c) {
  return Math.round((c * 9) / 5 + 32)
}

function formatWeekday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

export default function App() {
  const [query, setQuery] = useState('')
  const [unit, setUnit] = useState('C')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [place, setPlace] = useState(null)
  const [current, setCurrent] = useState(null)
  const [daily, setDaily] = useState([])

  const fetchForecast = useCallback(async (lat, lon, label) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
      })
      const res = await fetch(`${FORECAST_URL}?${params.toString()}`)
      if (!res.ok) throw new Error('Forecast request failed')
      const data = await res.json()

      setPlace(label)
      setCurrent({
        temp: data.current.temperature_2m,
        feelsLike: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        wind: data.current.wind_speed_10m,
        code: data.current.weather_code,
      })
      setDaily(
        data.daily.time.slice(0, 5).map((date, i) => ({
          date,
          code: data.daily.weather_code[i],
          max: data.daily.temperature_2m_max[i],
          min: data.daily.temperature_2m_min[i],
        }))
      )
    } catch (e) {
      setError('Could not load the forecast. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = useCallback(
    async (e) => {
      e?.preventDefault()
      if (!query.trim()) return
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({ name: query.trim(), count: '1' })
        const res = await fetch(`${GEOCODE_URL}?${params.toString()}`)
        const data = await res.json()
        const result = data.results?.[0]
        if (!result) {
          setLoading(false)
          setError(`No place found matching "${query.trim()}".`)
          return
        }
        const label = [result.name, result.admin1, result.country]
          .filter(Boolean)
          .join(', ')
        await fetchForecast(result.latitude, result.longitude, label)
      } catch (e) {
        setLoading(false)
        setError('Something went wrong looking that up.')
      }
    },
    [query, fetchForecast]
  )

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Location isn\u2019t available in this browser.')
      return
    }
    setLoading(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchForecast(pos.coords.latitude, pos.coords.longitude, 'Your location')
      },
      () => {
        setLoading(false)
        setError('Location permission was denied.')
      }
    )
  }, [fetchForecast])

  const displayTemp = (celsius) => (unit === 'C' ? Math.round(celsius) : cToF(celsius))
  const weatherInfo = current ? getWeatherInfo(current.code) : null
  const CurrentIcon = weatherInfo?.icon

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      <header className="border-b border-line">
        <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
          <p className="font-mono text-sm">
            weather<span className="text-amber">.</span>app
          </p>
          <button
            onClick={() => setUnit((u) => (u === 'C' ? 'F' : 'C'))}
            className="font-mono text-xs border border-line rounded px-3 py-1.5 hover:border-amber hover:text-amber transition-colors"
          >
            &deg;{unit} &rarr; &deg;{unit === 'C' ? 'F' : 'C'}
          </button>
        </div>
      </header>

      <main className="max-w-content mx-auto w-full px-6 py-12 flex-1">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a city..."
              className="w-full bg-surface border border-line rounded pl-9 pr-3 py-3 text-ink placeholder:text-muted font-mono text-sm focus:border-amber outline-none transition-colors"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="font-mono text-sm bg-amber text-bg font-medium rounded px-5 py-3 hover:bg-[#f2b45c] transition-colors whitespace-nowrap"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleUseLocation}
              title="Use my location"
              className="border border-line rounded px-4 py-3 hover:border-amber hover:text-amber transition-colors"
            >
              <FaLocationDot className="text-sm" />
            </button>
          </div>
        </form>

        <div className="mt-10">
          {loading && (
            <p className="font-mono text-sm text-muted">Loading forecast&hellip;</p>
          )}

          {!loading && error && (
            <p className="font-mono text-sm text-amber">{error}</p>
          )}

          {!loading && !error && !current && (
            <p className="text-muted leading-relaxed">
              Search for a city, or use your current location, to see the forecast.
            </p>
          )}

          {!loading && current && (
            <>
              <div className="border border-line rounded-lg p-6 md:p-8">
                <p className="font-mono text-xs text-muted mb-1">{place}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-6xl font-semibold leading-none">
                      {displayTemp(current.temp)}&deg;
                    </p>
                    <p className="mt-2 text-muted">{weatherInfo.label}</p>
                  </div>
                  {CurrentIcon && <CurrentIcon className="text-7xl text-amber" />}
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-line">
                  <div className="flex flex-col items-start gap-1">
                    <WiThermometer className="text-2xl text-muted" />
                    <p className="font-mono text-xs text-muted">Feels like</p>
                    <p className="text-ink">{displayTemp(current.feelsLike)}&deg;</p>
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <WiHumidity className="text-2xl text-muted" />
                    <p className="font-mono text-xs text-muted">Humidity</p>
                    <p className="text-ink">{current.humidity}%</p>
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <WiStrongWind className="text-2xl text-muted" />
                    <p className="font-mono text-xs text-muted">Wind</p>
                    <p className="text-ink">{Math.round(current.wind)} km/h</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-5 gap-2">
                {daily.map((d) => {
                  const info = getWeatherInfo(d.code)
                  const Icon = info.icon
                  return (
                    <div
                      key={d.date}
                      className="border border-line rounded-lg p-3 flex flex-col items-center gap-1.5 text-center"
                    >
                      <p className="font-mono text-xs text-muted">{formatWeekday(d.date)}</p>
                      <Icon className="text-2xl text-amber" />
                      <p className="text-sm text-ink">{displayTemp(d.max)}&deg;</p>
                      <p className="text-xs text-muted">{displayTemp(d.min)}&deg;</p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="max-w-content mx-auto w-full px-6 py-8 border-t border-line">
        <p className="font-mono text-xs text-muted">
          Weather data from Open-Meteo &middot; built by Jason Cruz
        </p>
      </footer>
    </div>
  )
}
