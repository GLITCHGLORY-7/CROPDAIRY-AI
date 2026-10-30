// CropDiary AI — Open-Meteo Weather Provider Adapter
// High-accuracy open meteorological forecast service with WMO code translation and error resilience.

import { IWeatherProvider } from './IWeatherProvider';
import {
  WeatherForecast,
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
} from '@/types/weather';
import { openMeteoResponseSchema } from '@/lib/validation/weatherSchemas';

export function decodeWmoWeatherCode(code: number): {
  description: string;
  iconName: string;
  isPrecipitation: boolean;
} {
  switch (code) {
    case 0:
      return { description: 'Clear sky', iconName: 'Sun', isPrecipitation: false };
    case 1:
      return { description: 'Mainly clear', iconName: 'CloudSun', isPrecipitation: false };
    case 2:
      return { description: 'Partly cloudy', iconName: 'CloudSun', isPrecipitation: false };
    case 3:
      return { description: 'Overcast', iconName: 'Cloud', isPrecipitation: false };
    case 45:
      return { description: 'Foggy conditions', iconName: 'CloudFog', isPrecipitation: false };
    case 48:
      return { description: 'Depositing rime fog', iconName: 'CloudFog', isPrecipitation: false };
    case 51:
      return { description: 'Light drizzle', iconName: 'CloudDrizzle', isPrecipitation: true };
    case 53:
      return { description: 'Moderate drizzle', iconName: 'CloudDrizzle', isPrecipitation: true };
    case 55:
      return { description: 'Dense drizzle', iconName: 'CloudDrizzle', isPrecipitation: true };
    case 61:
      return { description: 'Slight rain showers', iconName: 'CloudRain', isPrecipitation: true };
    case 63:
      return { description: 'Moderate continuous rain', iconName: 'CloudRain', isPrecipitation: true };
    case 65:
      return { description: 'Heavy torrential rain', iconName: 'CloudRain', isPrecipitation: true };
    case 71:
    case 73:
    case 75:
      return { description: 'Snowfall', iconName: 'Snowflake', isPrecipitation: true };
    case 80:
      return { description: 'Slight scattered rain showers', iconName: 'CloudRain', isPrecipitation: true };
    case 81:
      return { description: 'Moderate rain showers', iconName: 'CloudRain', isPrecipitation: true };
    case 82:
      return { description: 'Violent downpour / Cloudburst', iconName: 'CloudLightning', isPrecipitation: true };
    case 95:
      return { description: 'Thunderstorm with lightning', iconName: 'CloudLightning', isPrecipitation: true };
    case 96:
    case 99:
      return { description: 'Severe thunderstorm with hail', iconName: 'CloudLightning', isPrecipitation: true };
    default:
      return { description: 'Atmospheric condition', iconName: 'Cloud', isPrecipitation: false };
  }
}

export function getWeatherDescription(code: number): string {
  return decodeWmoWeatherCode(code).description;
}

export class OpenMeteoProvider implements IWeatherProvider {
  readonly name = 'Open-Meteo Weather API';
  readonly attribution = 'Weather data by Open-Meteo.com under CC BY 4.0';

  getWeatherDescription(code: number): string {
    return decodeWmoWeatherCode(code).description;
  }

  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    this.baseUrl = 'https://api.open-meteo.com/v1/forecast';
    // Optional commercial tier key if configured in environment
    const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : ({} as any);
    this.apiKey = metaEnv?.VITE_OPEN_METEO_API_KEY || undefined;
  }

  async getForecast(
    latitude: number,
    longitude: number,
    timezone: string = 'Asia/Kolkata'
  ): Promise<WeatherForecast> {
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      current: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'precipitation',
        'rain',
        'weather_code',
        'cloud_cover',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
        'is_day',
      ].join(','),
      hourly: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'precipitation_probability',
        'precipitation',
        'weather_code',
        'wind_speed_10m',
        'wind_direction_10m',
      ].join(','),
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'apparent_temperature_max',
        'apparent_temperature_min',
        'precipitation_sum',
        'rain_sum',
        'precipitation_probability_max',
        'wind_speed_10m_max',
        'wind_gusts_10m_max',
        'wind_direction_10m_dominant',
        'sunrise',
        'sunset',
      ].join(','),
      timezone: timezone || 'auto',
      forecast_days: '7',
    });

    if (this.apiKey) {
      params.append('apikey', this.apiKey);
    }

    const url = `${this.baseUrl}?${params.toString()}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
    } catch (networkErr: any) {
      throw new Error(`Weather network request failed: ${networkErr.message}. Check your connection.`);
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Weather API rate limit reached. Please wait a few moments before refreshing.');
      }
      throw new Error(`Weather provider HTTP ${response.status}: ${response.statusText}`);
    }

    const rawData = await response.json();
    const validated = openMeteoResponseSchema.parse(rawData);

    // Normalize Current Weather
    const currentCode = decodeWmoWeatherCode(validated.current.weather_code);
    const current: CurrentWeather = {
      temperature_c: validated.current.temperature_2m,
      apparent_temperature_c: validated.current.apparent_temperature,
      relative_humidity_pct: validated.current.relative_humidity_2m,
      precipitation_mm: validated.current.precipitation,
      rain_mm: validated.current.rain,
      weather_code: validated.current.weather_code,
      weather_description: currentCode.description,
      cloud_cover_pct: validated.current.cloud_cover,
      wind_speed_kmh: validated.current.wind_speed_10m,
      wind_direction_deg: validated.current.wind_direction_10m,
      wind_gusts_kmh: validated.current.wind_gusts_10m,
      is_day: validated.current.is_day !== 0,
      observed_at: validated.current.time,
    };

    // Normalize 24-hour window from hourly
    const hourly: HourlyForecastItem[] = [];
    const hourlyLimit = Math.min(24, validated.hourly.time.length);
    for (let i = 0; i < hourlyLimit; i++) {
      const codeInfo = decodeWmoWeatherCode(validated.hourly.weather_code[i] ?? 0);
      hourly.push({
        time: validated.hourly.time[i],
        temperature_c: validated.hourly.temperature_2m[i],
        apparent_temperature_c: validated.hourly.apparent_temperature?.[i],
        relative_humidity_pct: validated.hourly.relative_humidity_2m[i],
        precipitation_probability_pct: validated.hourly.precipitation_probability?.[i] ?? 0,
        precipitation_mm: validated.hourly.precipitation[i] ?? 0,
        weather_code: validated.hourly.weather_code[i],
        weather_description: codeInfo.description,
        wind_speed_kmh: validated.hourly.wind_speed_10m[i] ?? 0,
        wind_direction_deg: validated.hourly.wind_direction_10m[i] ?? 0,
      });
    }

    // Normalize 7-day daily forecast
    const daily: DailyForecastItem[] = [];
    for (let i = 0; i < validated.daily.time.length; i++) {
      const dayCode = decodeWmoWeatherCode(validated.daily.weather_code[i] ?? 0);
      daily.push({
        date: validated.daily.time[i],
        weather_code: validated.daily.weather_code[i],
        weather_description: dayCode.description,
        temperature_max_c: validated.daily.temperature_2m_max[i],
        temperature_min_c: validated.daily.temperature_2m_min[i],
        apparent_temperature_max_c: validated.daily.apparent_temperature_max?.[i],
        apparent_temperature_min_c: validated.daily.apparent_temperature_min?.[i],
        precipitation_sum_mm: validated.daily.precipitation_sum[i],
        rain_sum_mm: validated.daily.rain_sum?.[i],
        precipitation_probability_max_pct: validated.daily.precipitation_probability_max?.[i] ?? 0,
        wind_speed_max_kmh: validated.daily.wind_speed_10m_max[i],
        wind_gusts_max_kmh: validated.daily.wind_gusts_10m_max?.[i],
        wind_direction_dominant_deg: validated.daily.wind_direction_10m_dominant?.[i],
        sunrise: validated.daily.sunrise?.[i] || '',
        sunset: validated.daily.sunset?.[i] || '',
      });
    }

    return {
      latitude: validated.latitude,
      longitude: validated.longitude,
      elevation_m: validated.elevation,
      timezone: validated.timezone,
      timezone_abbreviation: validated.timezone_abbreviation,
      provider: this.name,
      provider_attribution: this.attribution,
      current,
      hourly,
      daily,
      retrieved_at: new Date().toISOString(),
      is_cached: false,
    };
  }
}

export const openMeteoProvider = new OpenMeteoProvider();
