// CropDiary AI — Weather Provider Interface
// Decoupled architecture allowing pluggable meteorological data backends.

import { WeatherForecast } from '@/types/weather';

export interface IWeatherProvider {
  readonly name: string;
  readonly attribution: string;
  getForecast(
    latitude: number,
    longitude: number,
    timezone?: string
  ): Promise<WeatherForecast>;
}
