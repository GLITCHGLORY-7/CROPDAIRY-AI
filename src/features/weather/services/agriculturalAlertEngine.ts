// CropDiary AI — Rules-Based Agricultural Alert Engine
// Generates explainable, deterministic agronomic weather alerts using ICAR/TNAU thresholds and saved crop plans.

import {
  WeatherForecast,
  FarmWeatherAlert,
  AlertSeverity,
} from '@/types/weather';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';

export interface AlertEvaluationContext {
  farm: Farm;
  plot?: Plot | null;
  cropPlan?: CropPlan | null;
  forecast: WeatherForecast;
}

export class AgriculturalAlertEngine {
  readonly version = 'ICAR-AgroMet-v1.0';

  /**
   * Evaluates weather forecast against agronomic thresholds, tailoring to plot soil and crop if available.
   */
  evaluateAlerts(context: AlertEvaluationContext): FarmWeatherAlert[] {
    const { farm, plot, cropPlan, forecast } = context;
    const alerts: FarmWeatherAlert[] = [];
    const now = new Date().toISOString();

    const cropName = cropPlan?.selected_crop_name || null;
    const isCropSpecific = Boolean(cropPlan);

    // 1. Heavy Rainfall & Waterlogging Alert
    const highRainDays = forecast.daily.filter((d) => d.precipitation_sum_mm >= 35);
    if (highRainDays.length > 0) {
      const peakDay = highRainDays.reduce((prev, curr) =>
        curr.precipitation_sum_mm > prev.precipitation_sum_mm ? curr : prev
      );

      const isHeavy = peakDay.precipitation_sum_mm >= 60;
      const isClaySoil = plot?.soil_type === 'Clay' || plot?.soil_type === 'Black Soil' || farm.soil_type === 'Clay';

      let severity: AlertSeverity = isHeavy || (isClaySoil && peakDay.precipitation_sum_mm >= 45) ? 'critical' : 'warning';

      const explanation = `Forecast predicts ${peakDay.precipitation_sum_mm.toFixed(0)} mm of rainfall on ${peakDay.date}. ` +
        (isClaySoil
          ? `Because this plot features ${plot?.soil_type || farm.soil_type} with slow drainage infiltration, standing water risk is heightened.`
          : `Under typical field drainage conditions, heavy surface runoff and temporary waterlogging may occur.`);

      alerts.push({
        id: `alert-rain-${peakDay.date}-${farm.id}`,
        owner_id: farm.owner_id,
        farm_id: farm.id,
        plot_id: plot?.id || null,
        crop_plan_id: cropPlan?.id || null,
        alert_type: 'heavy_rain',
        severity,
        title: `Heavy Rainfall & Drainage Risk (${peakDay.precipitation_sum_mm.toFixed(0)} mm)`,
        explanation,
        trigger_measurements: {
          peak_rainfall_mm: peakDay.precipitation_sum_mm,
          rain_date: peakDay.date,
          soil_type: plot?.soil_type || farm.soil_type,
        },
        practical_steps: [
          'Inspect and clear plot perimeter drainage trenches to allow excess runoff.',
          'Withhold top-dress nitrogen (urea) and foliar fertilizers to avoid nutrient leaching losses.',
          'Ensure nursery beds and low-lying plots have open outlet furrows.',
        ],
        forecast_window_start: `${peakDay.date}T00:00:00Z`,
        forecast_window_end: `${peakDay.date}T23:59:59Z`,
        rule_version: this.version,
        is_crop_specific: isCropSpecific,
        crop_name: cropName,
        status: 'active',
        created_at: now,
        updated_at: now,
      });
    }

    // 2. High-Temperature Heat Stress Alert
    const hotDays = forecast.daily.filter((d) => d.temperature_max_c >= 38);
    if (hotDays.length > 0) {
      const peakHeat = hotDays.reduce((prev, curr) =>
        curr.temperature_max_c > prev.temperature_max_c ? curr : prev
      );

      const isExtreme = peakHeat.temperature_max_c >= 41;
      const severity: AlertSeverity = isExtreme ? 'critical' : 'warning';

      let cropNote = '';
      if (cropPlan) {
        cropNote = `For ${cropPlan.selected_crop_name}, prolonged temperatures above 38°C increase flower drop, pollen sterility, and rapid soil moisture evaporation.`;
      } else {
        cropNote = 'Daytime temperatures exceeding 38°C significantly accelerate crop evapotranspiration and risk foliar heat stress.';
      }

      alerts.push({
        id: `alert-heat-${peakHeat.date}-${farm.id}`,
        owner_id: farm.owner_id,
        farm_id: farm.id,
        plot_id: plot?.id || null,
        crop_plan_id: cropPlan?.id || null,
        alert_type: 'heat_stress',
        severity,
        title: `High Temperature Stress (${peakHeat.temperature_max_c.toFixed(0)}°C Forecast)`,
        explanation: `${cropNote} Expected peak temperature on ${peakHeat.date}.`,
        trigger_measurements: {
          max_temperature_c: peakHeat.temperature_max_c,
          heat_date: peakHeat.date,
        },
        practical_steps: [
          'Schedule irrigation during early morning (before 8 AM) or late evening to minimize evaporative loss.',
          'Avoid chemical spraying during peak afternoon heat (11 AM - 3 PM) to prevent leaf scorching.',
          'Check soil moisture in top 10 cm layer and apply organic mulch if available.',
        ],
        forecast_window_start: `${peakHeat.date}T09:00:00Z`,
        forecast_window_end: `${peakHeat.date}T18:00:00Z`,
        rule_version: this.version,
        is_crop_specific: isCropSpecific,
        crop_name: cropName,
        status: 'active',
        created_at: now,
        updated_at: now,
      });
    }

    // 3. Cold Temperature / Chilling Stress Alert
    const coldDays = forecast.daily.filter((d) => d.temperature_min_c <= 12);
    if (coldDays.length > 0) {
      const coldestDay = coldDays.reduce((prev, curr) =>
        curr.temperature_min_c < prev.temperature_min_c ? curr : prev
      );

      alerts.push({
        id: `alert-cold-${coldestDay.date}-${farm.id}`,
        owner_id: farm.owner_id,
        farm_id: farm.id,
        plot_id: plot?.id || null,
        crop_plan_id: cropPlan?.id || null,
        alert_type: 'cold_stress',
        severity: coldestDay.temperature_min_c <= 8 ? 'critical' : 'warning',
        title: `Night-time Chilling Stress (${coldestDay.temperature_min_c.toFixed(0)}°C)`,
        explanation: `Night temperatures dropping to ${coldestDay.temperature_min_c.toFixed(0)}°C may slow vegetative metabolism and delay seedling emergence for warm-season crops.`,
        trigger_measurements: {
          min_temperature_c: coldestDay.temperature_min_c,
          cold_date: coldestDay.date,
        },
        practical_steps: [
          'Provide light evening irrigation to stabilize ground temperature against radiation chilling.',
          'Protect young nursery seedling beds with temporary plastic or straw covers.',
        ],
        forecast_window_start: `${coldestDay.date}T00:00:00Z`,
        forecast_window_end: `${coldestDay.date}T08:00:00Z`,
        rule_version: this.version,
        is_crop_specific: isCropSpecific,
        crop_name: cropName,
        status: 'active',
        created_at: now,
        updated_at: now,
      });
    }

    // 4. Strong Winds & Gusts Alert (Lodging & Spray Drift)
    const windyDays = forecast.daily.filter(
      (d) => (d.wind_gusts_max_kmh && d.wind_gusts_max_kmh >= 30) || d.wind_speed_max_kmh >= 20
    );
    if (windyDays.length > 0) {
      const peakWind = windyDays.reduce((prev, curr) =>
        (curr.wind_gusts_max_kmh || curr.wind_speed_max_kmh) >
        (prev.wind_gusts_max_kmh || prev.wind_speed_max_kmh)
          ? curr
          : prev
      );

      const gustSpeed = peakWind.wind_gusts_max_kmh || peakWind.wind_speed_max_kmh;
      alerts.push({
        id: `alert-wind-${peakWind.date}-${farm.id}`,
        owner_id: farm.owner_id,
        farm_id: farm.id,
        plot_id: plot?.id || null,
        crop_plan_id: cropPlan?.id || null,
        alert_type: 'high_wind',
        severity: gustSpeed >= 50 ? 'critical' : 'warning',
        title: `Strong Wind & Spray Drift Hazard (${gustSpeed.toFixed(0)} km/h)`,
        explanation: `Sustained winds up to ${peakWind.wind_speed_max_kmh.toFixed(0)} km/h and gusts up to ${gustSpeed.toFixed(0)} km/h increase risk of lodging in tall crops and cause dangerous spray drift.`,
        trigger_measurements: {
          max_wind_speed_kmh: peakWind.wind_speed_max_kmh,
          max_wind_gust_kmh: gustSpeed,
          wind_date: peakWind.date,
        },
        practical_steps: [
          'DO NOT conduct any pesticide or foliar fertilizer spraying; chemical drift creates off-target contamination.',
          'Provide mechanical staking for tomato, chilli, and banana plants.',
          'Check earthen ridges around maize and sugarcane fields.',
        ],
        forecast_window_start: `${peakWind.date}T06:00:00Z`,
        forecast_window_end: `${peakWind.date}T20:00:00Z`,
        rule_version: this.version,
        is_crop_specific: isCropSpecific,
        crop_name: cropName,
        status: 'active',
        created_at: now,
        updated_at: now,
      });
    }

    // 5. Prolonged Dry Spell / Irrigation Warning
    const totalWeekRain = forecast.daily.reduce((sum, d) => sum + d.precipitation_sum_mm, 0);
    const avgMaxTemp =
      forecast.daily.reduce((sum, d) => sum + d.temperature_max_c, 0) / forecast.daily.length;

    if (totalWeekRain < 2.0 && avgMaxTemp >= 33) {
      alerts.push({
        id: `alert-dry-7day-${farm.id}`,
        owner_id: farm.owner_id,
        farm_id: farm.id,
        plot_id: plot?.id || null,
        crop_plan_id: cropPlan?.id || null,
        alert_type: 'dry_spell',
        severity: 'warning',
        title: `Extended Dry Conditions (<2 mm over 7 days)`,
        explanation: `Under 2 mm of cumulative precipitation is forecast over the next 7 days, coupled with high temperatures (avg ${avgMaxTemp.toFixed(1)}°C). Soil depletion will accelerate.`,
        trigger_measurements: {
          total_7day_rain_mm: totalWeekRain,
          avg_max_temp_c: Number(avgMaxTemp.toFixed(1)),
        },
        practical_steps: [
          'Review available irrigation water sources (well / canal / borewell) and plan rotational schedule.',
          'Flush drip lateral lines and verify emitter discharge rates.',
          'Consider straw mulching around crop root zones to suppress soil moisture evaporation.',
        ],
        forecast_window_start: forecast.daily[0]?.date ? `${forecast.daily[0].date}T00:00:00Z` : now,
        forecast_window_end: forecast.daily[forecast.daily.length - 1]?.date
          ? `${forecast.daily[forecast.daily.length - 1].date}T23:59:59Z`
          : now,
        rule_version: this.version,
        is_crop_specific: isCropSpecific,
        crop_name: cropName,
        status: 'active',
        created_at: now,
        updated_at: now,
      });
    }

    // 6. Disease-Favorable Humid Warmth Alert (Phase 3 Pathogen Bridge)
    const humidWarmDays = forecast.daily.filter(
      (d) => d.temperature_max_c <= 30 && d.temperature_min_c >= 20 && d.precipitation_sum_mm >= 5
    );
    if (humidWarmDays.length >= 2) {
      alerts.push({
        id: `alert-disease-conducive-${farm.id}`,
        owner_id: farm.owner_id,
        farm_id: farm.id,
        plot_id: plot?.id || null,
        crop_plan_id: cropPlan?.id || null,
        alert_type: 'disease_favorable',
        severity: 'info',
        title: `Fungal Pathogen Conducive Weather`,
        explanation: `Consecutive days with warm temperatures (20-30°C) and rain moisture create favorable microclimates for fungal sporulation (e.g., Leaf Blast, Tikka, Early Blight).`,
        trigger_measurements: {
          conducive_days_count: humidWarmDays.length,
        },
        practical_steps: [
          'Scout bottom canopy leaves for early spots or discoloration using the AI Crop Doctor.',
          'Avoid heavy overhead irrigation that prolongs leaf wetness beyond early morning hours.',
          'Withhold excessive urea application which softens leaf cuticles.',
        ],
        forecast_window_start: `${humidWarmDays[0].date}T00:00:00Z`,
        forecast_window_end: `${humidWarmDays[humidWarmDays.length - 1].date}T23:59:59Z`,
        rule_version: this.version,
        is_crop_specific: isCropSpecific,
        crop_name: cropName,
        status: 'active',
        created_at: now,
        updated_at: now,
      });
    }

    return alerts;
  }

  /**
   * Evaluates operational spray window status (Favorable / Caution / Unfavorable).
   */
  evaluateSprayWindow(forecast: WeatherForecast): {
    status: 'favorable' | 'caution' | 'unfavorable';
    title: string;
    description: string;
    score: number;
    windSpeedKmh: number;
    rainProbabilityPct: number;
    tempC: number;
  } {
    const current = forecast.current;
    const next6Hours = forecast.hourly.slice(0, 6);

    const maxNextRainProb = next6Hours.reduce(
      (max, h) => Math.max(max, h.precipitation_probability_pct),
      0
    );
    const maxNextWind = next6Hours.reduce(
      (max, h) => Math.max(max, h.wind_speed_kmh),
      current.wind_speed_kmh
    );

    if (maxNextWind > 20 || maxNextRainProb > 50 || current.precipitation_mm > 0.5) {
      return {
        status: 'unfavorable',
        title: 'Unfavorable for Spraying',
        description:
          maxNextWind > 20
            ? `High wind speeds (${maxNextWind.toFixed(0)} km/h) risk severe spray drift and chemical waste.`
            : `Rain probability is ${maxNextRainProb}% within 6 hours; chemical wash-off will occur.`,
        score: 20,
        windSpeedKmh: current.wind_speed_kmh,
        rainProbabilityPct: maxNextRainProb,
        tempC: current.temperature_c,
      };
    }

    if (maxNextWind > 12 || maxNextRainProb > 25 || current.temperature_c > 33) {
      return {
        status: 'caution',
        title: 'Moderate Spraying Caution',
        description:
          current.temperature_c > 33
            ? 'High temperature may cause droplet evaporation and foliar burn. Prefer early morning.'
            : `Breezy conditions (${maxNextWind.toFixed(0)} km/h). Use low-drift nozzles.`,
        score: 60,
        windSpeedKmh: current.wind_speed_kmh,
        rainProbabilityPct: maxNextRainProb,
        tempC: current.temperature_c,
      };
    }

    return {
      status: 'favorable',
      title: 'Favorable Spraying Window',
      description: `Gentle winds (${current.wind_speed_kmh.toFixed(0)} km/h) and low rain chance (${maxNextRainProb}%). Ideal for biological or label-claim foliar applications.`,
      score: 90,
      windSpeedKmh: current.wind_speed_kmh,
      rainProbabilityPct: maxNextRainProb,
      tempC: current.temperature_c,
    };
  }
}

export const agriculturalAlertEngine = new AgriculturalAlertEngine();
