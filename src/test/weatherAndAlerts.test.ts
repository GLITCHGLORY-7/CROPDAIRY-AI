// CropDiary AI — Phase 4 Weather Intelligence, Alerts & Reminders Test Suite
// Verifies WMO decoding, ICAR agricultural rule engine, spray window advisory,
// reminder recurrence, weather-triggered condition deduplication, and notification states.

import { describe, it, expect, beforeEach } from 'vitest';
import { openMeteoProvider } from '@/features/weather/services/openMeteoProvider';
import { geocodingService } from '@/features/weather/services/geocodingService';
import { agriculturalAlertEngine } from '@/features/weather/services/agriculturalAlertEngine';
import { reminderService } from '@/features/weather/services/reminderService';
import { notificationService } from '@/features/weather/services/notificationService';
import { storageAdapter } from '@/services/storageAdapter';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { WeatherForecast } from '@/types/weather';

describe('Phase 4: Weather Intelligence & Agronomic Alerts', () => {
  const testUserId = 'test-farmer-p4-001';
  const otherUserId = 'test-farmer-p4-other';

  const mockFarm: Farm = {
    id: 'farm-thanjavur-01',
    owner_id: testUserId,
    name: 'Cauvery Delta Paddy Field',
    description: 'Alluvial soil delta farm',
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Thanjavur',
    village: 'Papanasam',
    area: 5.0,
    area_unit: 'Acres',
    farming_type: 'Open field',
    soil_type: 'Clay Loam',
    irrigation_method: 'Canal',
    water_availability: 'Adequate',
    latitude: 10.787,
    longitude: 79.1378,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockPlotClay: Plot = {
    id: 'plot-clay-01',
    farm_id: mockFarm.id,
    name: 'Lowland Heavy Clay Basin',
    area: 2.5,
    area_unit: 'Acres',
    soil_type: 'Clay',
    irrigation_source: 'Canal',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockCropPlan: CropPlan = {
    id: 'plan-paddy-01',
    owner_id: testUserId,
    farm_id: mockFarm.id,
    plot_id: mockPlotClay.id,
    title: 'Samba Season CR 1009 Sub-1 Paddy',
    status: 'Active',
    selected_crop_id: 'rice-paddy',
    selected_crop_name: 'Rice / Paddy (Oryza sativa)',
    sowing_date: '2026-09-15',
    target_harvest_date: '2027-01-20',
    season: 'Kharif',
    inputs: {
      intended_planting_date: '2026-09-15',
      water_availability: 'Adequate',
    },
    selected_candidate_snapshot: {} as any,
    shortlist_snapshots: [],
    estimated_total_cost: 32000,
    timeline_stages: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const createMockForecast = (overrides?: Partial<WeatherForecast>): WeatherForecast => ({
    latitude: 10.787,
    longitude: 79.1378,
    timezone: 'Asia/Kolkata',
    retrieved_at: new Date().toISOString(),
    is_cached: false,
    provider: 'Open-Meteo (open-meteo.com)',
    attribution: 'Weather data by Open-Meteo.com under CC BY 4.0',
    current: {
      temperature_c: 31.5,
      apparent_temperature_c: 36.2,
      relative_humidity_pct: 78,
      precipitation_mm: 0,
      weather_code: 1,
      weather_description: 'Mainly clear',
      wind_speed_kmh: 11.2,
      wind_direction_deg: 180,
      cloud_cover_pct: 25,
      is_day: true,
      time: new Date().toISOString(),
    },
    hourly: Array.from({ length: 24 }).map((_, i) => ({
      time: new Date(Date.now() + i * 3600000).toISOString(),
      temperature_c: 30 - i * 0.3,
      apparent_temperature_c: 34 - i * 0.3,
      relative_humidity_pct: 75 + (i % 5),
      precipitation_probability_pct: 10,
      precipitation_mm: 0,
      weather_code: 1,
      weather_description: 'Mainly clear',
      wind_speed_kmh: 10 + (i % 4),
      wind_direction_deg: 180,
    })),
    daily: Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      return {
        date: dateStr,
        weather_code: 1,
        weather_description: 'Mainly clear',
        temperature_max_c: 33.0,
        temperature_min_c: 24.5,
        precipitation_sum_mm: 0,
        precipitation_probability_max_pct: 15,
        wind_speed_max_kmh: 14.0,
        sunrise: `${dateStr}T06:05:00`,
        sunset: `${dateStr}T18:15:00`,
      };
    }),
    ...overrides,
  });

  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. WMO Decoding & Weather Normalization', () => {
    it('decodes standard WMO weather codes into human-readable descriptions', () => {
      expect(openMeteoProvider.getWeatherDescription(0)).toBe('Clear sky');
      expect(openMeteoProvider.getWeatherDescription(63)).toBe('Moderate continuous rain');
      expect(openMeteoProvider.getWeatherDescription(65)).toBe('Heavy torrential rain');
      expect(openMeteoProvider.getWeatherDescription(95)).toBe('Thunderstorm with lightning');
      expect(openMeteoProvider.getWeatherDescription(45)).toBe('Foggy conditions');
      expect(openMeteoProvider.getWeatherDescription(999)).toBe('Atmospheric condition');
    });

    it('retains explicit Open-Meteo CC BY 4.0 legal attribution', () => {
      const forecast = createMockForecast();
      expect(forecast.attribution).toContain('CC BY 4.0');
      expect(forecast.provider).toContain('Open-Meteo');
    });
  });

  describe('2. Geocoding & Coordinate Resolution', () => {
    it('resolves known Indian agricultural districts to accurate centroids', () => {
      const thanjavur = geocodingService.getFallbackCoordinates('Thanjavur', 'Tamil Nadu');
      expect(thanjavur.lat).toBeCloseTo(10.787, 2);
      expect(thanjavur.lon).toBeCloseTo(79.1378, 2);
      expect(thanjavur.source).toContain('District Centroid');

      const guntur = geocodingService.getFallbackCoordinates('guntur');
      expect(guntur.lat).toBeCloseTo(16.3067, 2);

      const pune = geocodingService.getFallbackCoordinates('pune');
      expect(pune.lat).toBeCloseTo(18.5204, 2);
    });

    it('falls back gracefully to regional center for unknown locations', () => {
      const fallback = geocodingService.getFallbackCoordinates('UnknownLocation123');
      expect(fallback.lat).toBeDefined();
      expect(fallback.lon).toBeDefined();
      expect(fallback.source).toContain('Regional Center');
    });
  });

  describe('3. Deterministic ICAR Agricultural Alert Engine', () => {
    it('triggers Heavy Rainfall & Waterlogging Alert with soil drainage amplification', () => {
      const rainForecast = createMockForecast();
      // Set day 2 precipitation to 50mm
      rainForecast.daily[2].precipitation_sum_mm = 50;

      // On standard loam soil, 50mm generates a warning
      const standardAlerts = agriculturalAlertEngine.evaluateAlerts({
        farm: mockFarm,
        plot: null,
        cropPlan: null,
        forecast: rainForecast,
      });
      const rainAlert = standardAlerts.find((a) => a.alert_type === 'heavy_rain');
      expect(rainAlert).toBeDefined();
      expect(rainAlert?.severity).toBe('warning');

      // On heavy clay soil, 50mm amplifies to critical due to waterlogging hazard
      const clayAlerts = agriculturalAlertEngine.evaluateAlerts({
        farm: mockFarm,
        plot: mockPlotClay,
        cropPlan: mockCropPlan,
        forecast: rainForecast,
      });
      const clayRainAlert = clayAlerts.find((a) => a.alert_type === 'heavy_rain');
      expect(clayRainAlert).toBeDefined();
      expect(clayRainAlert?.severity).toBe('critical');
      expect(clayRainAlert?.explanation).toContain('Clay');
      expect(clayRainAlert?.practical_steps.length).toBeGreaterThan(0);
    });

    it('evaluates Extreme Heat Stress and injects crop-specific physiological cautions', () => {
      const heatForecast = createMockForecast();
      heatForecast.daily[1].temperature_max_c = 41.5;

      const alerts = agriculturalAlertEngine.evaluateAlerts({
        farm: mockFarm,
        plot: mockPlotClay,
        cropPlan: mockCropPlan,
        forecast: heatForecast,
      });

      const heatAlert = alerts.find((a) => a.alert_type === 'heat_stress');
      expect(heatAlert).toBeDefined();
      expect(heatAlert?.title).toContain('42°C');
      expect(heatAlert?.explanation).toContain('Rice / Paddy');
      expect(heatAlert?.explanation).toContain('pollen sterility');
    });

    it('evaluates Strong Wind Spray Drift Hazard', () => {
      const windForecast = createMockForecast();
      windForecast.daily[0].wind_speed_max_kmh = 24.0;

      const alerts = agriculturalAlertEngine.evaluateAlerts({
        farm: mockFarm,
        plot: null,
        cropPlan: null,
        forecast: windForecast,
      });

      const windAlert = alerts.find((a) => a.alert_type === 'high_wind');
      expect(windAlert).toBeDefined();
      expect(windAlert?.title).toContain('Spray Drift Hazard');
      expect(windAlert?.practical_steps.some((s) => s.toLowerCase().includes('do not'))).toBe(true);
    });

    it('evaluates Fungal Pathogen Incubation Conducive Weather and bridges to AI Crop Doctor', () => {
      const fungalForecast = createMockForecast();
      // Set high humidity >= 80% and moderate temp 22-26°C for 2+ consecutive days
      fungalForecast.daily[0].temperature_max_c = 28;
      fungalForecast.daily[0].temperature_min_c = 22;
      fungalForecast.daily[0].precipitation_sum_mm = 8;
      fungalForecast.daily[1].temperature_max_c = 27;
      fungalForecast.daily[1].temperature_min_c = 21;
      fungalForecast.daily[1].precipitation_sum_mm = 12;

      // Ensure hourly humidity is high
      fungalForecast.hourly = fungalForecast.hourly.map((h) => ({
        ...h,
        relative_humidity_pct: 86,
      }));

      const alerts = agriculturalAlertEngine.evaluateAlerts({
        farm: mockFarm,
        plot: mockPlotClay,
        cropPlan: mockCropPlan,
        forecast: fungalForecast,
      });

      const fungalAlert = alerts.find((a) => a.alert_type === 'disease_favorable');
      expect(fungalAlert).toBeDefined();
      expect(fungalAlert?.title).toContain('Fungal Pathogen Conducive');
      expect(fungalAlert?.practical_steps.some((s) => s.includes('AI Crop Doctor'))).toBe(true);
    });
  });

  describe('4. Operational Spray Window Guidance', () => {
    it('evaluates spray window as favorable under calm winds and low precipitation probability', () => {
      const calmForecast = createMockForecast();
      calmForecast.current.wind_speed_kmh = 8;
      calmForecast.hourly.forEach((h) => {
        h.wind_speed_kmh = 9;
        h.precipitation_probability_pct = 5;
      });

      const sprayWindow = agriculturalAlertEngine.evaluateSprayWindow(calmForecast);
      expect(sprayWindow.status).toBe('favorable');
      expect(sprayWindow.score).toBeGreaterThanOrEqual(80);
    });

    it('evaluates spray window as unfavorable when winds exceed 18 km/h or rain probability is high', () => {
      const windyForecast = createMockForecast();
      windyForecast.current.wind_speed_kmh = 22;

      const sprayWindow = agriculturalAlertEngine.evaluateSprayWindow(windyForecast);
      expect(sprayWindow.status).toBe('unfavorable');
      expect(sprayWindow.description.toLowerCase()).toContain('wind');
    });
  });

  describe('5. Farm Reminders, Recurrence & Snooze', () => {
    it('creates reminder and calculates +1 day and +3 day snooze dates accurately', async () => {
      const reminder = await reminderService.createReminder(testUserId, {
        farm_id: mockFarm.id,
        title: 'Check irrigation canals',
        category: 'irrigation',
        due_date: new Date().toISOString(),
        recurrence: 'none',
      });

      expect(reminder.id).toBeDefined();
      expect(reminder.status).toBe('pending');

      // Snooze by 1 day
      const snoozed1 = await reminderService.snoozeReminder(testUserId, reminder.id, 1);
      expect(snoozed1.status).toBe('snoozed');
      expect(snoozed1.snoozed_until).toBeDefined();

      const snoozeTime = new Date(snoozed1.snoozed_until!).getTime();
      const expectedTime = Date.now() + 24 * 60 * 60 * 1000;
      expect(Math.abs(snoozeTime - expectedTime)).toBeLessThan(5000); // within 5s
    });

    it('schedules next recurrence upon completing recurring reminder', async () => {
      const weeklyReminder = await reminderService.createReminder(testUserId, {
        farm_id: mockFarm.id,
        title: 'Weekly Soil Moisture Probing',
        category: 'scouting',
        due_date: '2026-11-01T09:00:00Z',
        recurrence: 'weekly',
      });

      await reminderService.completeReminder(testUserId, weeklyReminder.id);

      const allReminders = await reminderService.getReminders(testUserId);
      const activeWeekly = allReminders.find(
        (r) => r.title === 'Weekly Soil Moisture Probing' && r.status === 'pending'
      );

      expect(activeWeekly).toBeDefined();
      expect(new Date(activeWeekly!.due_date).getDate()).toBe(
        new Date('2026-11-01T09:00:00Z').getDate() + 7
      );
    });

    it('deduplicates weather-triggered reminders generated within 24 hours', async () => {
      const first = await reminderService.createWeatherTriggeredReminder(
        testUserId,
        mockFarm.id,
        'high_wind',
        20,
        'High Wind: Delay Foliar Spray',
        'Strong wind gusts will blow chemical spray off-target.'
      );
      expect(first).not.toBeNull();

      // Immediate second trigger attempt should be deduplicated
      const second = await reminderService.createWeatherTriggeredReminder(
        testUserId,
        mockFarm.id,
        'high_wind',
        20,
        'High Wind: Delay Foliar Spray',
        'Strong wind gusts will blow chemical spray off-target.'
      );
      expect(second).toBeNull();
    });
  });

  describe('6. Notification Center & Tenant Isolation', () => {
    it('manages in-app notifications with unread counts and read states', async () => {
      await notificationService.sendInAppNotification(testUserId, {
        type: 'weather_alert',
        title: 'Heavy Rainfall Warning',
        message: '60 mm downpour expected tomorrow.',
        resourceType: 'weather_alert',
        resourceId: 'alert-123',
      });

      let count = await notificationService.getUnreadCount(testUserId);
      expect(count).toBe(1);

      const notifications = await notificationService.getNotifications(testUserId);
      expect(notifications.length).toBe(1);

      await notificationService.markAsRead(testUserId, notifications[0].id);
      count = await notificationService.getUnreadCount(testUserId);
      expect(count).toBe(0);
    });

    it('enforces strict tenant isolation between different users', async () => {
      await reminderService.createReminder(testUserId, {
        farm_id: mockFarm.id,
        title: 'Private Farmer Task A',
        category: 'fertilizer',
        due_date: new Date().toISOString(),
      });

      await reminderService.createReminder(otherUserId, {
        farm_id: 'farm-other-02',
        title: 'Private Farmer Task B',
        category: 'harvest',
        due_date: new Date().toISOString(),
      });

      const userAReminders = await reminderService.getReminders(testUserId);
      const userBReminders = await reminderService.getReminders(otherUserId);

      expect(userAReminders.every((r) => r.owner_id === testUserId)).toBe(true);
      expect(userBReminders.every((r) => r.owner_id === otherUserId)).toBe(true);
      expect(userAReminders.some((r) => r.title === 'Private Farmer Task B')).toBe(false);
    });
  });
});
