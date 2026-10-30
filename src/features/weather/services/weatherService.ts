// CropDiary AI — Unified Weather Service Provider Router
// Prioritizes configured WeatherAPI.com commercial feed with automatic fallback to Open-Meteo.

import { WeatherForecast } from '@/types/weather';
import { weatherApiProvider } from './weatherApiProvider';
import { openMeteoProvider } from './openMeteoProvider';

export class WeatherService {
  async getForecast(
    latitude: number,
    longitude: number,
    timezone: string = 'Asia/Kolkata'
  ): Promise<WeatherForecast> {
    if (weatherApiProvider.isConfigured()) {
      try {
        return await weatherApiProvider.getForecast(latitude, longitude, timezone);
      } catch (err) {
        console.warn('WeatherAPI call failed, falling back to Open-Meteo:', err);
      }
    }
    return await openMeteoProvider.getForecast(latitude, longitude, timezone);
  }

  getActiveProviderName(): string {
    return weatherApiProvider.isConfigured()
      ? weatherApiProvider.name
      : openMeteoProvider.name;
  }
}

export const weatherService = new WeatherService();
