// CropDiary AI — 24-Hour Timeline Forecast Component
// Displays hour-by-hour temperature, rain probability, and wind metrics in a horizontal scrollable rail.

import React from 'react';
import { HourlyForecastItem } from '@/types/weather';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Clock, Droplets, Wind } from 'lucide-react';
import { getWeatherIcon } from './CurrentWeatherCard';

interface HourlyForecastListProps {
  hourly: HourlyForecastItem[];
}

export const HourlyForecastList: React.FC<HourlyForecastListProps> = ({ hourly }) => {
  return (
    <Card className="border-slate-200/90 shadow-xs text-left">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-agri-600" />
          <span>Next 24 Hours Forecast</span>
        </CardTitle>
        <span className="text-xs text-slate-500 font-medium">Hourly Progression</span>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {hourly.map((item, idx) => {
            const dateObj = new Date(item.time);
            const hourLabel = idx === 0 ? 'Now' : dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
            const isNight = dateObj.getHours() < 6 || dateObj.getHours() > 19;

            return (
              <div
                key={item.time}
                className="flex flex-col items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 min-w-[90px] flex-shrink-0 text-center space-y-2 hover:bg-agri-50/50 hover:border-agri-200 transition-colors"
              >
                {/* Time */}
                <span className="text-xs font-bold text-slate-700">{hourLabel}</span>

                {/* Condition Icon */}
                <div className="scale-75 my-[-6px]">
                  {getWeatherIcon(item.weather_code, !isNight)}
                </div>

                {/* Temperature */}
                <div className="font-extrabold text-sm text-slate-900">
                  {item.temperature_c.toFixed(0)}°C
                </div>

                {/* Rain Probability Badge */}
                <div className="w-full space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-sky-700">
                    <Droplets className="w-2.5 h-2.5 text-sky-600" />
                    <span>{item.precipitation_probability_pct}%</span>
                  </div>
                  {/* Visual micro-bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-sky-500 h-1 rounded-full transition-all"
                      style={{ width: `${Math.min(100, item.precipitation_probability_pct)}%` }}
                    />
                  </div>
                </div>

                {/* Wind */}
                <div className="flex items-center gap-0.5 text-[10px] text-slate-500 pt-0.5">
                  <Wind className="w-2.5 h-2.5 text-slate-400" />
                  <span>{item.wind_speed_kmh.toFixed(0)}k</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
