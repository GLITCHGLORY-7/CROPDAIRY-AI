// CropDiary AI — Weather Scheduler & Agricultural Alert Evaluator
// Runs automated evaluation of active farms, caches forecasts, and triggers deduplicated alerts & notifications.

import { Farm } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { WeatherForecast } from '@/types/weather';
import { weatherService } from './weatherService';
import { geocodingService } from './geocodingService';
import { agriculturalAlertEngine } from './agriculturalAlertEngine';
import { notificationService } from './notificationService';
import { reminderService } from './reminderService';
import { storageAdapter } from '@/services/storageAdapter';

export interface SchedulerExecutionResult {
  farmsEvaluated: number;
  alertsGenerated: number;
  notificationsSent: number;
  weatherErrors: string[];
  executedAt: string;
}

export const weatherScheduler = {
  /**
   * Evaluates all active farms for a user, fetches weather data, generates alerts,
   * and creates deduplicated in-app notifications and weather-action reminders.
   */
  async evaluateUserFarms(
    userId: string,
    farms: Farm[],
    cropPlans: CropPlan[] = []
  ): Promise<SchedulerExecutionResult> {
    const executedAt = new Date().toISOString();
    const errors: string[] = [];
    let alertsGenerated = 0;
    let notificationsSent = 0;

    for (const farm of farms) {
      if (farm.status !== 'active') continue;

      let lat = farm.latitude;
      let lon = farm.longitude;

      if (!lat || !lon) {
        const fallback = geocodingService.getFallbackCoordinates(farm.district, farm.state);
        lat = fallback.lat;
        lon = fallback.lon;
      }

      let forecast: WeatherForecast;
      try {
        // Check cache first (freshness: 60 minutes)
        const cacheKey = `weather_${lat.toFixed(3)}_${lon.toFixed(3)}`;
        const cached = await storageAdapter.getCachedWeather(cacheKey);

        if (cached && !this.isCacheExpired(cached.retrieved_at, 60)) {
          forecast = { ...cached, is_cached: true };
        } else {
          forecast = await weatherService.getForecast(lat, lon);
          await storageAdapter.setCachedWeather(cacheKey, lat, lon, forecast, 60);
        }
      } catch (err: any) {
        errors.push(`Farm "${farm.name}": ${err.message}`);
        continue;
      }

      // Check if farm has an active crop plan
      const farmPlan = cropPlans.find((p) => p.farm_id === farm.id && p.status === 'Active') ||
        cropPlans.find((p) => p.farm_id === farm.id) || null;

      // Evaluate rules
      const newAlerts = agriculturalAlertEngine.evaluateAlerts({
        farm,
        plot: null,
        cropPlan: farmPlan,
        forecast,
      });

      // Persist alerts and send notifications for high severity
      for (const alert of newAlerts) {
        try {
          const savedAlert = await storageAdapter.createWeatherAlert(userId, alert);
          alertsGenerated++;

          // Send notification for critical or warning alerts
          if (alert.severity === 'critical' || alert.severity === 'warning') {
            const notif = await notificationService.sendInAppNotification(userId, {
              type: 'weather_alert',
              title: `${alert.severity.toUpperCase()}: ${alert.title}`,
              message: `${farm.name}: ${alert.explanation.slice(0, 160)}...`,
              resourceType: 'weather_alert',
              resourceId: savedAlert.id,
            });
            if (notif) notificationsSent++;
          }

          // Weather-Triggered Reminders auto-creation
          if (alert.alert_type === 'heavy_rain') {
            await reminderService.createWeatherTriggeredReminder(
              userId,
              farm.id,
              'heavy_rain',
              alert.trigger_measurements?.peak_rainfall_mm || 40,
              `Inspect Drainage Ditches (${farm.name})`,
              `Heavy rain (${alert.trigger_measurements?.peak_rainfall_mm || 40} mm) forecast. Clear furrow outlets and check standing water.`
            );
          } else if (alert.alert_type === 'dry_spell') {
            await reminderService.createWeatherTriggeredReminder(
              userId,
              farm.id,
              'dry_spell',
              7,
              `Review Rotational Irrigation Plan (${farm.name})`,
              `Extended dry period forecast. Verify drip line pressure and water storage levels.`
            );
          }
        } catch (err: any) {
          console.warn('Alert persistence encountered an issue:', err.message);
        }
      }
    }

    return {
      farmsEvaluated: farms.filter((f) => f.status === 'active').length,
      alertsGenerated,
      notificationsSent,
      weatherErrors: errors,
      executedAt,
    };
  },

  isCacheExpired(retrievedAt: string, maxAgeMinutes: number): boolean {
    const ageMs = Date.now() - new Date(retrievedAt).getTime();
    return ageMs > maxAgeMinutes * 60 * 1000;
  },
};
