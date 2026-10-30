// CropDiary AI — Current Weather Specimen Card
// Displays real-time temperature, feels-like, wind, humidity, and provider attribution.

import React from 'react';
import { WeatherForecast } from '@/types/weather';
import { Farm } from '@/types/database';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  Snowflake,
  Wind,
  Droplets,
  Compass,
  Sunrise,
  Sunset,
  RefreshCw,
  MapPin,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CurrentWeatherCardProps {
  forecast: WeatherForecast;
  farm: Farm;
  isCoordinateApproximate: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onOpenLocationPicker?: () => void;
}

export function getWeatherIcon(code: number, isDay: boolean = true) {
  switch (code) {
    case 0:
      return isDay ? <Sun className="w-10 h-10 text-amber-500" /> : <Sun className="w-10 h-10 text-slate-300" />;
    case 1:
    case 2:
      return <CloudSun className="w-10 h-10 text-amber-400" />;
    case 3:
      return <Cloud className="w-10 h-10 text-slate-400" />;
    case 45:
    case 48:
      return <CloudFog className="w-10 h-10 text-slate-400" />;
    case 51:
    case 53:
    case 55:
      return <CloudDrizzle className="w-10 h-10 text-blue-400" />;
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
      return <CloudRain className="w-10 h-10 text-blue-600" />;
    case 82:
    case 95:
    case 96:
    case 99:
      return <CloudLightning className="w-10 h-10 text-indigo-600" />;
    case 71:
    case 73:
    case 75:
      return <Snowflake className="w-10 h-10 text-sky-400" />;
    default:
      return <Cloud className="w-10 h-10 text-slate-400" />;
  }
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
  forecast,
  farm,
  isCoordinateApproximate,
  onRefresh,
  isRefreshing = false,
  onOpenLocationPicker,
}) => {
  const current = forecast.current;
  const today = forecast.daily[0];

  const windDirectionCardinal = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-agri-900 via-slate-900 to-agri-950 text-white p-6 shadow-md space-y-6 text-left">
      {/* Top Header & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-agri-300">
              Live Meteorological Station
            </span>
            {forecast.is_cached && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-slate-200 border border-white/20">
                Cached ({forecast.cache_age_seconds ? `${Math.round(forecast.cache_age_seconds / 60)}m ago` : 'recent'})
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">
            {farm.name} Weather Outlook
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-agri-100">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-agri-300" />
              <span>{[farm.village, farm.district, farm.state].filter(Boolean).join(', ')}</span>
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-[11px] text-slate-300">
              {forecast.latitude.toFixed(4)}°N, {forecast.longitude.toFixed(4)}°E
            </span>
            {isCoordinateApproximate && (
              <span className="text-amber-300 font-medium text-[11px] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/50">
                District Centroid (Coordinates estimated)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenLocationPicker && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenLocationPicker}
              className="text-xs bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              <MapPin className="w-3.5 h-3.5 mr-1 text-agri-300" />
              <span>{isCoordinateApproximate ? 'Set Exact Location' : 'Edit Location'}</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs bg-white/10 text-white hover:bg-white/20 border-white/20 min-h-[36px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Primary Observations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
        {/* Main Temperature & Condition */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
            {getWeatherIcon(current.weather_code, current.is_day)}
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-black tracking-tighter">
                {current.temperature_c.toFixed(0)}°
              </span>
              <span className="text-lg text-agri-200 font-semibold">C</span>
            </div>
            <p className="text-sm font-bold text-white capitalize">{current.weather_description}</p>
            {current.apparent_temperature_c !== undefined && (
              <p className="text-xs text-slate-300">
                Feels like <strong>{current.apparent_temperature_c.toFixed(0)}°C</strong>
              </p>
            )}
          </div>
        </div>

        {/* Humidity & Precipitation */}
        <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6 text-xs">
          <div className="flex items-center justify-between text-slate-200">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Droplets className="w-4 h-4 text-sky-400" />
              <span>Relative Humidity</span>
            </span>
            <span className="font-bold text-white font-mono">{current.relative_humidity_pct}%</span>
          </div>

          <div className="flex items-center justify-between text-slate-200">
            <span className="flex items-center gap-1.5 text-slate-300">
              <CloudRain className="w-4 h-4 text-blue-400" />
              <span>Precipitation (Current)</span>
            </span>
            <span className="font-bold text-white font-mono">{current.precipitation_mm.toFixed(1)} mm</span>
          </div>

          {today && (
            <div className="flex items-center justify-between text-slate-200">
              <span className="text-slate-300">Rain Prob. (Today Max)</span>
              <span className="font-bold text-sky-300 font-mono">
                {today.precipitation_probability_max_pct}%
              </span>
            </div>
          )}
        </div>

        {/* Wind Speed & Direction */}
        <div className="space-y-2 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 text-xs">
          <div className="flex items-center justify-between text-slate-200">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Wind className="w-4 h-4 text-teal-400" />
              <span>Wind Speed (10m)</span>
            </span>
            <span className="font-bold text-white font-mono">{current.wind_speed_kmh.toFixed(1)} km/h</span>
          </div>

          <div className="flex items-center justify-between text-slate-200">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Compass className="w-4 h-4 text-teal-400" />
              <span>Wind Direction</span>
            </span>
            <span className="font-bold text-white font-mono">
              {current.wind_direction_deg}° ({windDirectionCardinal(current.wind_direction_deg)})
            </span>
          </div>

          {current.wind_gusts_kmh !== undefined && (
            <div className="flex items-center justify-between text-slate-200">
              <span className="text-slate-300">Peak Gusts</span>
              <span className="font-bold text-amber-300 font-mono">
                {current.wind_gusts_kmh.toFixed(0)} km/h
              </span>
            </div>
          )}
        </div>

        {/* Sunrise & Sunset */}
        <div className="space-y-2 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 text-xs">
          {today?.sunrise && (
            <div className="flex items-center justify-between text-slate-200">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Sunrise className="w-4 h-4 text-amber-400" />
                <span>Sunrise</span>
              </span>
              <span className="font-bold text-white font-mono">
                {today.sunrise.includes('T') ? today.sunrise.split('T')[1].slice(0, 5) : today.sunrise}
              </span>
            </div>
          )}

          {today?.sunset && (
            <div className="flex items-center justify-between text-slate-200">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Sunset className="w-4 h-4 text-orange-400" />
                <span>Sunset</span>
              </span>
              <span className="font-bold text-white font-mono">
                {today.sunset.includes('T') ? today.sunset.split('T')[1].slice(0, 5) : today.sunset}
              </span>
            </div>
          )}

          {current.cloud_cover_pct !== undefined && (
            <div className="flex items-center justify-between text-slate-200">
              <span className="text-slate-300">Cloud Cover</span>
              <span className="font-bold text-slate-200 font-mono">{current.cloud_cover_pct}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Attribution & Freshness Guarantee */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-agri-400" />
          <span>{forecast.provider_attribution}</span>
        </span>
        <span>
          Retrieved: {new Date(forecast.retrieved_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ({forecast.timezone})
        </span>
      </div>
    </div>
  );
};
