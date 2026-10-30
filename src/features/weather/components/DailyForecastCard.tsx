// CropDiary AI — 7-Day Agronomic Daily Forecast Component
// Displays daily temperature spreads, rain probability, wind gusts, and conditions.

import React from 'react';
import { DailyForecastItem } from '@/types/weather';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Calendar, Droplets, Wind } from 'lucide-react';
import { getWeatherIcon } from './CurrentWeatherCard';

interface DailyForecastCardProps {
  daily: DailyForecastItem[];
}

export const DailyForecastCard: React.FC<DailyForecastCardProps> = ({ daily }) => {
  return (
    <Card className="border-slate-200/90 shadow-xs text-left">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-agri-600" />
          <span>7-Day Agricultural Forecast</span>
        </CardTitle>
        <span className="text-xs text-slate-500 font-medium">Daily Max/Min & Rainfall Outlook</span>
      </CardHeader>

      <CardContent className="p-4 space-y-2">
        {daily.map((day, idx) => {
          const dateObj = new Date(day.date);
          const weekday = idx === 0 ? 'Today' : dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
          const dateStr = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

          const isHeavyRain = day.precipitation_sum_mm >= 30;
          const isHot = day.temperature_max_c >= 38;

          return (
            <div
              key={day.date}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all gap-3"
            >
              {/* Day & Icon */}
              <div className="flex items-center gap-3 min-w-[140px]">
                <div className="scale-75 w-10 h-10 flex items-center justify-center">
                  {getWeatherIcon(day.weather_code, true)}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <span>{weekday}</span>
                    <span className="text-[11px] font-normal text-slate-400">({dateStr})</span>
                  </div>
                  <span className="text-[11px] text-slate-500 capitalize">{day.weather_description}</span>
                </div>
              </div>

              {/* Rain Probability & Cumulative Rain */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 min-w-[100px]">
                  <Droplets className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800">{day.precipitation_probability_max_pct}%</span>
                    <span className="text-[10px] text-slate-500 ml-1">({day.precipitation_sum_mm.toFixed(1)} mm)</span>
                  </div>
                </div>

                {/* Wind */}
                <div className="hidden md:flex items-center gap-1 min-w-[80px] text-slate-600">
                  <Wind className="w-3.5 h-3.5 text-slate-400" />
                  <span>{day.wind_speed_max_kmh.toFixed(0)} km/h</span>
                </div>
              </div>

              {/* Temperature Spread Bar */}
              <div className="flex items-center gap-2 min-w-[130px] justify-end w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500">
                  {day.temperature_min_c.toFixed(0)}°
                </span>
                <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${isHot ? 'bg-amber-600' : isHeavyRain ? 'bg-sky-600' : 'bg-agri-600'}`}
                    style={{ width: `${Math.min(100, (day.temperature_max_c / 45) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-extrabold text-slate-900">
                  {day.temperature_max_c.toFixed(0)}°C
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
