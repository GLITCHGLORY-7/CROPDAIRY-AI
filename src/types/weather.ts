// CropDiary AI — Phase 4: Weather Intelligence, Alerts & Reminders TypeScript Models

export type WeatherAlertType =
  | 'heavy_rain'
  | 'heat_stress'
  | 'cold_stress'
  | 'high_wind'
  | 'dry_spell'
  | 'spray_window'
  | 'disease_favorable';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertStatus = 'active' | 'dismissed' | 'resolved';

export type ReminderCategory =
  | 'irrigation'
  | 'scouting'
  | 'fieldwork'
  | 'fertilizer'
  | 'harvest'
  | 'weather_action'
  | 'custom';

export type ReminderStatus = 'pending' | 'completed' | 'snoozed' | 'cancelled';

export type ReminderRecurrence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface CurrentWeather {
  temperature_c: number;
  apparent_temperature_c?: number; // Feels-like
  relative_humidity_pct: number;
  precipitation_mm: number;
  rain_mm?: number;
  weather_code: number;
  weather_description: string;
  cloud_cover_pct?: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  wind_gusts_kmh?: number;
  is_day: boolean;
  observed_at: string;
}

export interface HourlyForecastItem {
  time: string; // ISO 8601 string
  temperature_c: number;
  apparent_temperature_c?: number;
  relative_humidity_pct: number;
  precipitation_probability_pct: number;
  precipitation_mm: number;
  weather_code: number;
  weather_description: string;
  wind_speed_kmh: number;
  wind_direction_deg: number;
}

export interface DailyForecastItem {
  date: string; // YYYY-MM-DD
  weather_code: number;
  weather_description: string;
  temperature_max_c: number;
  temperature_min_c: number;
  apparent_temperature_max_c?: number;
  apparent_temperature_min_c?: number;
  precipitation_sum_mm: number;
  rain_sum_mm?: number;
  precipitation_probability_max_pct: number;
  wind_speed_max_kmh: number;
  wind_gusts_max_kmh?: number;
  wind_direction_dominant_deg?: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  elevation_m?: number;
  timezone: string;
  timezone_abbreviation?: string;
  provider: string;
  provider_attribution: string;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  retrieved_at: string;
  is_cached: boolean;
  cache_age_seconds?: number;
}

export interface FarmWeatherAlert {
  id: string;
  owner_id: string;
  farm_id: string;
  plot_id?: string | null;
  crop_plan_id?: string | null;
  alert_type: WeatherAlertType;
  severity: AlertSeverity;
  title: string;
  explanation: string;
  trigger_measurements: Record<string, any>;
  practical_steps: string[];
  forecast_window_start: string;
  forecast_window_end: string;
  rule_version: string;
  is_crop_specific: boolean;
  crop_name?: string | null;
  status: AlertStatus;
  created_at: string;
  updated_at: string;
}

export interface FarmReminder {
  id: string;
  owner_id: string;
  farm_id: string;
  plot_id?: string | null;
  crop_plan_id?: string | null;
  title: string;
  description?: string | null;
  category: ReminderCategory;
  due_date: string; // ISO 8601
  timezone: string;
  recurrence: ReminderRecurrence;
  status: ReminderStatus;
  snoozed_until?: string | null;
  weather_trigger_condition?: {
    type: 'heavy_rain' | 'dry_spell' | 'high_wind' | 'high_temp';
    threshold_value: number;
    description: string;
  } | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserNotification {
  id: string;
  owner_id: string;
  notification_type: 'weather_alert' | 'reminder_due' | 'system';
  title: string;
  message: string;
  resource_type?: 'weather_alert' | 'reminder' | 'farm' | 'crop_plan' | null;
  resource_id?: string | null;
  read_at?: string | null;
  is_dismissed: boolean;
  created_at: string;
}

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string; // State / Region
  admin2?: string; // District
  country_code?: string;
}
