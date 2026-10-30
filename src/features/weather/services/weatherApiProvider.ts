// CropDiary AI — WeatherAPI.com Provider Adapter
// Integrates with WeatherAPI.com using live commercial API key.

import { IWeatherProvider } from './IWeatherProvider';
import {
  WeatherForecast,
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
} from '@/types/weather';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

/**
 * Maps WeatherAPI condition codes to standard WMO weather codes.
 */
function mapWeatherApiCodeToWmo(code: number): number {
  switch (code) {
    case 1000: return 0;  // Sunny / Clear
    case 1003: return 2;  // Partly cloudy
    case 1006:
    case 1009: return 3;  // Cloudy / Overcast
    case 1030:
    case 1135:
    case 1147: return 45; // Mist / Fog
    case 1063:
    case 1180:
    case 1183: return 61; // Patchy light rain / slight rain
    case 1186:
    case 1189: return 63; // Moderate rain
    case 1192:
    case 1195:
    case 1243:
    case 1246: return 65; // Heavy / torrential rain
    case 1087:
    case 1273:
    case 1276: return 95; // Thundery outbreaks / thunderstorm
    case 1066:
    case 1114:
    case 1210:
    case 1213: return 71; // Snow
    default: return 1;
  }
}

export class WeatherApiProvider implements IWeatherProvider {
  readonly name = 'WeatherAPI.com Live Meteorological Feed';
  readonly attribution = 'Weather data provided by WeatherAPI.com (via Secure Supabase Edge Function)';

  isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  async getForecast(
    latitude: number,
    longitude: number,
    timezone: string = 'Asia/Kolkata'
  ): Promise<WeatherForecast> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase backend proxy is not configured.');
    }

    const { data, error } = await supabase.functions.invoke('weather-forecast', {
      body: { latitude, longitude, days: 7 },
    });

    if (error || !data) {
      throw new Error(`Weather backend proxy error: ${error?.message || 'Empty response'}`);
    }

    const current: CurrentWeather = {
      temperature_c: Math.round((data.current.temp_c || 0) * 10) / 10,
      apparent_temperature_c: Math.round((data.current.feelslike_c || 0) * 10) / 10,
      relative_humidity_pct: data.current.humidity || 0,
      precipitation_mm: data.current.precip_mm || 0,
      rain_mm: data.current.precip_mm || 0,
      weather_code: mapWeatherApiCodeToWmo(data.current.condition?.code || 1000),
      weather_description: data.current.condition?.text || 'Clear',
      cloud_cover_pct: data.current.cloud || 0,
      wind_speed_kmh: Math.round(data.current.wind_kph || 0),
      wind_direction_deg: data.current.wind_degree || 0,
      wind_gusts_kmh: data.current.gust_kph ? Math.round(data.current.gust_kph) : undefined,
      is_day: data.current.is_day === 1,
      observed_at: data.current.last_updated ? new Date(data.current.last_updated).toISOString() : new Date().toISOString(),
    };

    const hourly: HourlyForecastItem[] = [];
    if (data.forecast?.forecastday) {
      for (const fday of data.forecast.forecastday) {
        if (Array.isArray(fday.hour)) {
          for (const hr of fday.hour) {
            hourly.push({
              time: hr.time ? new Date(hr.time).toISOString() : new Date().toISOString(),
              temperature_c: Math.round((hr.temp_c || 0) * 10) / 10,
              apparent_temperature_c: Math.round((hr.feelslike_c || 0) * 10) / 10,
              relative_humidity_pct: hr.humidity || 0,
              precipitation_probability_pct: hr.chance_of_rain || 0,
              precipitation_mm: hr.precip_mm || 0,
              weather_code: mapWeatherApiCodeToWmo(hr.condition?.code || 1000),
              weather_description: hr.condition?.text || 'Clear',
              wind_speed_kmh: Math.round(hr.wind_kph || 0),
              wind_direction_deg: hr.wind_degree || 0,
            });
          }
        }
      }
    }

    const daily: DailyForecastItem[] = [];
    if (data.forecast?.forecastday) {
      for (const fday of data.forecast.forecastday) {
        daily.push({
          date: fday.date,
          weather_code: mapWeatherApiCodeToWmo(fday.day?.condition?.code || 1000),
          weather_description: fday.day?.condition?.text || 'Clear',
          temperature_max_c: Math.round((fday.day?.maxtemp_c || 0) * 10) / 10,
          temperature_min_c: Math.round((fday.day?.mintemp_c || 0) * 10) / 10,
          apparent_temperature_max_c: Math.round((fday.day?.maxtemp_c || 0) * 10) / 10,
          apparent_temperature_min_c: Math.round((fday.day?.mintemp_c || 0) * 10) / 10,
          precipitation_sum_mm: fday.day?.totalprecip_mm || 0,
          rain_sum_mm: fday.day?.totalprecip_mm || 0,
          precipitation_probability_max_pct: fday.day?.daily_chance_of_rain || 0,
          wind_speed_max_kmh: Math.round(fday.day?.maxwind_kph || 0),
          sunrise: fday.astro?.sunrise || '06:00 AM',
          sunset: fday.astro?.sunset || '06:30 PM',
        });
      }
    }

    return {
      latitude: data.location?.lat || latitude,
      longitude: data.location?.lon || longitude,
      timezone: data.location?.tz_id || timezone,
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

export const weatherApiProvider = new WeatherApiProvider();
