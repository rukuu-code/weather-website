import {
  WiDaySunny,
  WiDayCloudy,
  WiCloud,
  WiFog,
  WiSprinkle,
  WiRain,
  WiRainMix,
  WiSnow,
  WiSnowflakeCold,
  WiShowers,
  WiSnowWind,
  WiThunderstorm,
  WiStormShowers,
} from 'react-icons/wi'

// Maps WMO weather codes (used by Open-Meteo) to a label and icon.
export function getWeatherInfo(code) {
  const map = {
    0: { label: 'Clear sky', icon: WiDaySunny },
    1: { label: 'Mainly clear', icon: WiDaySunny },
    2: { label: 'Partly cloudy', icon: WiDayCloudy },
    3: { label: 'Overcast', icon: WiCloud },
    45: { label: 'Fog', icon: WiFog },
    48: { label: 'Depositing rime fog', icon: WiFog },
    51: { label: 'Light drizzle', icon: WiSprinkle },
    53: { label: 'Drizzle', icon: WiSprinkle },
    55: { label: 'Dense drizzle', icon: WiSprinkle },
    56: { label: 'Freezing drizzle', icon: WiRainMix },
    57: { label: 'Freezing drizzle', icon: WiRainMix },
    61: { label: 'Slight rain', icon: WiRain },
    63: { label: 'Rain', icon: WiRain },
    65: { label: 'Heavy rain', icon: WiRain },
    66: { label: 'Freezing rain', icon: WiRainMix },
    67: { label: 'Freezing rain', icon: WiRainMix },
    71: { label: 'Slight snow', icon: WiSnow },
    73: { label: 'Snow', icon: WiSnow },
    75: { label: 'Heavy snow', icon: WiSnow },
    77: { label: 'Snow grains', icon: WiSnowflakeCold },
    80: { label: 'Rain showers', icon: WiShowers },
    81: { label: 'Rain showers', icon: WiShowers },
    82: { label: 'Violent rain showers', icon: WiShowers },
    85: { label: 'Snow showers', icon: WiSnowWind },
    86: { label: 'Snow showers', icon: WiSnowWind },
    95: { label: 'Thunderstorm', icon: WiThunderstorm },
    96: { label: 'Thunderstorm with hail', icon: WiStormShowers },
    99: { label: 'Thunderstorm with hail', icon: WiStormShowers },
  }
  return map[code] || { label: 'Unknown', icon: WiCloud }
  
}
// Buckets a WMO code into a broad category used to drive the animated scene.
export function getWeatherCategory(code) {
  if ([0, 1].includes(code)) return 'clear'
  if ([2, 3].includes(code)) return 'cloudy'
  if ([45, 48].includes(code)) return 'fog'
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow'
  if ([95, 96, 99].includes(code)) return 'storm'
  return 'cloudy'
}
