import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { WiStrongWind, WiHumidity, WiThermometer } from 'react-icons/wi'
import { FaLocationDot, FaMagnifyingGlass } from 'react-icons/fa6'
import { getWeatherInfo, getWeatherCategory } from './weatherCodes.js'
import { FaMoon, FaSun } from 'react-icons/fa6'

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

function cToF(c) {
  return Math.round((c * 9) / 5 + 32)
}

function formatWeekday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

// A backdrop layer that reacts to the current weather: sun rays when clear,
// rain streaks when wet, drifting clouds/snow otherwise. Sits above the aura
// glow but below the actual UI content.
function WeatherScene({ category, isDay }) {
  const drops = useMemo(
    () =>
      Array.from({ length: 40 }, () => ({
        left: Math.random() * 100,
        duration: 0.6 + Math.random() * 0.6,
        delay: Math.random() * 2,
        height: 14 + Math.random() * 16,
      })),
    []
  )

  const flakes = useMemo(
    () =>
      Array.from({ length: 30 }, () => ({
        left: Math.random() * 100,
        duration: 6 + Math.random() * 6,
        delay: Math.random() * 6,
        size: 3 + Math.random() * 4,
      })),
    []
  )

  const clouds = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        top: 8 + i * 12 + Math.random() * 6,
        size: 90 + Math.random() * 110,
        duration: 38 + Math.random() * 22,
        delay: -Math.random() * 30,
        opacity: 0.25 + Math.random() * 0.15,
      })),
    []
  )

  const showSun = isDay && category === 'clear'
  const showRain = category === 'rain' || category === 'storm'
  const showSnow = category === 'snow'
  const showClouds = category === 'cloudy' || category === 'fog' || category === 'storm'

  return (
    <div className="weather-scene" aria-hidden="true">
      {showSun && (
  <div className="absolute" style={{ top: '6%', right: '10%', width: 140, height: 140 }}>
    {/* outer glow halo */}
    <div
      className="absolute inset-0 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(124,156,255,0.45) 0%, rgba(124,156,255,0) 70%)',
        transform: 'scale(2.2)',
        animation: 'pulse-glow 5s ease-in-out infinite',
      }}
    />

    {/* sun, drawn in SVG so rays and disc share exact coordinates */}
    <svg width="140" height="140" viewBox="0 0 140 140" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="sunGradient" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#a8bfff" />
          <stop offset="100%" stopColor="#7C9CFF" />
        </radialGradient>
      </defs>

      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180
        const innerR = 40
        const outerR = 68
        const x1 = 70 + innerR * Math.cos(angle)
        const y1 = 70 + innerR * Math.sin(angle)
        const x2 = 70 + outerR * Math.cos(angle)
        const y2 = 70 + outerR * Math.sin(angle)
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#7C9CFF"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.35"
            style={{ animation: `twinkle ${3 + i * 0.4}s ease-in-out ${i * 0.2}s infinite` }}
          />
        )
      })}

      <circle cx="70" cy="70" r="32" fill="url(#sunGradient)" />
    </svg>
  </div>
)}

      {showRain &&
        drops.map((d, i) => (
          <div
            key={i}
            className="absolute w-px bg-accent"
            style={{
              left: `${d.left}%`,
              height: d.height,
              opacity: 0.35,
              animation: `fall ${d.duration}s linear ${d.delay}s infinite`,
            }}
          />
        ))}

      {showSnow &&
      flakes.map((f, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-ink"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            opacity: 0.6,
            animation: `snowFall ${f.duration}s linear ${f.delay}s infinite`,
          }}
        />
      ))}

      {showClouds &&
        clouds.map((c, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-ink blur-2xl"
            style={{
              top: `${c.top}%`,
              left: '-20%',
              width: c.size,
              height: c.size * 0.5,
              opacity: 1,
              animation: `drift ${c.duration}s linear ${c.delay}s infinite`,
            }}
          />
        ))}
    </div>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [unit, setUnit] = useState('C')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [place, setPlace] = useState(null)
  const [current, setCurrent] = useState(null)
  const [daily, setDaily] = useState([])
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [debugCategory, setDebugCategory] = useState(null)

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('theme', theme)
  }, [theme])

  const fetchForecast = useCallback(async (lat, lon, label) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current:
          'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
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
        isDay: data.current.is_day === 1,
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
  const category = debugCategory || (current ? getWeatherCategory(current.code) : null)

  return (
    <div className="aura-bg min-h-screen flex flex-col">
      <div className="aura-layer-1" />
      <div className="aura-layer-2" />
      <div className="aura-layer-3" />

      {current && <WeatherScene category={category} isDay={current.isDay} />}

      <div className="aura-content flex flex-col min-h-screen text-ink">
      <header className="">
        <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
          <p className="font-mono text-sm">
              nimbus<span className="text-amber">.</span>app
            </p>
            <div className="flex items-center gap-2">
              <button
  onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
  className="font-mono text-sm bg-surface border border-line rounded px-3 py-1.5 flex items-center gap-1.5 hover:border-amber hover:text-amber transition-colors"
>
  {theme === 'dark' ? <FaSun className="text-sm" /> : <FaMoon className="text-sm" />}
  {theme === 'dark' ? 'Borealis' : 'Beams'}
</button>
              <button
                onClick={() => setUnit((u) => (u === 'C' ? 'F' : 'C'))}
                className="font-mono text-sm bg-surface border border-line rounded px-3 py-1.5 hover:border-amber hover:text-amber transition-colors"
              >
                &deg;{unit} &rarr; &deg;{unit === 'C' ? 'F' : 'C'}
              </button>
            </div>
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
              className="fill border-line rounded px-4 py-3 bg-surface border hover:border-amber hover:text-amber transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleUseLocation}
              title="Use my location"
              className="fill border-line rounded px-4 py-3 bg-surface border hover:border-amber hover:text-amber transition-colors"
            >
              <FaLocationDot className="text-sm" />
            </button>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {['clear', 'cloudy', 'rain', 'snow', 'storm', 'fog', null].map((cat) => (
            <button
              key={cat || 'off'}
              onClick={() => setDebugCategory(cat)}
              className={`font-mono text-xs border rounded px-2 py-1 transition-colors ${
                debugCategory === cat ? 'border-amber text-amber' : 'border-line bg-surface border text-ink hover:border-amber'
              }`}
            >
              {cat || 'off'}
            </button>
          ))}
        </div>
        <div className="mt-10">
          {loading && (
            <p className="font-mono text-sm text-muted">Loading forecast&hellip;</p>
          )}

          {!loading && error && (
            <p className="font-mono text-sm text-amber">{error}</p>
          )}

          {!loading && !error && !current && (
            <p className="text-ink">
              Search for a city, or use your current location, to see the forecast.
            </p>
          )}

          {!loading && current && (
            <>
              <div className="fill bg-surface border border-line rounded-lg p-6 md:p-8">
                <p className="font-mono text-xs text-muted mb-1">{place}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-6xl font-semibold leading-none">
                      {displayTemp(current.temp)}°{unit}
                    </p>
                    <p className="mt-2 text-muted">{weatherInfo.label}</p>
                  </div>
                  {CurrentIcon && <CurrentIcon className="text-7xl text-amber" />}
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-line">
                  <div className="flex flex-col items-start gap-1">
                    <WiThermometer className="text-2xl text-muted" />
                    <p className="font-mono text-xs text-muted">Feels like</p>
                    <p className="text-ink">{displayTemp(current.feelsLike)}°{unit}</p>
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
                      className="fill bg-surface border border-line rounded-lg p-3 flex flex-col items-center gap-1.5 text-center"
                    >
                      <p className="font-mono text-xs text-muted">{formatWeekday(d.date)}</p>
                      <Icon className="text-2xl text-amber" />
                      <p className="text-sm text-ink">{displayTemp(d.max)}°{unit}</p>
                      <p className="text-xs text-muted">{displayTemp(d.min)}°{unit}</p>
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
    </div>
  )
}