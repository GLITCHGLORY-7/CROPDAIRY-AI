// CropDiary AI — Phase 4 Zod Validation Schemas
// Validates coordinates, reminder forms, weather payloads, and alert objects.

import { z } from 'zod';

export const coordinatesSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
});

export const reminderCategoryEnum = z.enum([
  'irrigation',
  'scouting',
  'fieldwork',
  'fertilizer',
  'harvest',
  'weather_action',
  'custom',
]);

export const reminderRecurrenceEnum = z.enum([
  'none',
  'daily',
  'weekly',
  'biweekly',
  'monthly',
]);

export const reminderStatusEnum = z.enum([
  'pending',
  'completed',
  'snoozed',
  'cancelled',
]);

export const weatherTriggerConditionSchema = z.object({
  type: z.enum(['heavy_rain', 'dry_spell', 'high_wind', 'high_temp']),
  threshold_value: z.number(),
  description: z.string().min(3),
});

export const reminderFormSchema = z.object({
  farm_id: z.string().min(1, 'Please select an associated farm'),
  plot_id: z.string().optional().nullable(),
  crop_plan_id: z.string().optional().nullable(),
  title: z
    .string()
    .min(3, 'Reminder title must be at least 3 characters')
    .max(150, 'Reminder title must be under 150 characters'),
  description: z
    .string()
    .max(1000, 'Description must be within 1000 characters')
    .optional()
    .nullable(),
  category: reminderCategoryEnum,
  due_date: z.string().min(1, 'Please specify a due date and time'),
  timezone: z.string().default('Asia/Kolkata'),
  recurrence: reminderRecurrenceEnum.default('none'),
  weather_trigger_condition: weatherTriggerConditionSchema.optional().nullable(),
});

export type ReminderFormData = z.infer<typeof reminderFormSchema>;

// Open-Meteo API response validator
export const openMeteoResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number().optional(),
  timezone: z.string(),
  timezone_abbreviation: z.string().optional(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    apparent_temperature: z.number().optional(),
    relative_humidity_2m: z.number(),
    precipitation: z.number(),
    rain: z.number().optional(),
    weather_code: z.number(),
    cloud_cover: z.number().optional(),
    wind_speed_10m: z.number(),
    wind_direction_10m: z.number(),
    wind_gusts_10m: z.number().optional(),
    is_day: z.number().optional(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number()),
    apparent_temperature: z.array(z.number()).optional(),
    relative_humidity_2m: z.array(z.number()),
    precipitation_probability: z.array(z.number()).optional(),
    precipitation: z.array(z.number()),
    weather_code: z.array(z.number()),
    wind_speed_10m: z.array(z.number()),
    wind_direction_10m: z.array(z.number()),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    apparent_temperature_max: z.array(z.number()).optional(),
    apparent_temperature_min: z.array(z.number()).optional(),
    precipitation_sum: z.array(z.number()),
    rain_sum: z.array(z.number()).optional(),
    precipitation_probability_max: z.array(z.number()).optional(),
    wind_speed_10m_max: z.array(z.number()),
    wind_gusts_10m_max: z.array(z.number()).optional(),
    wind_direction_10m_dominant: z.array(z.number()).optional(),
    sunrise: z.array(z.string()).optional(),
    sunset: z.array(z.string()).optional(),
  }),
});
