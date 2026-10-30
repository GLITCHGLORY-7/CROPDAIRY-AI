// CropDiary AI — Agrochemical Spray Window Guidance Card
// Real-time evaluation of wind drift risk, temperature evaporation, and rain wash-off.

import React from 'react';
import { WeatherForecast } from '@/types/weather';
import { agriculturalAlertEngine } from '../services/agriculturalAlertEngine';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ShieldCheck, AlertTriangle, XCircle, Wind } from 'lucide-react';

interface SprayWindowCardProps {
  forecast: WeatherForecast;
}

export const SprayWindowCard: React.FC<SprayWindowCardProps> = ({ forecast }) => {
  const windowStatus = agriculturalAlertEngine.evaluateSprayWindow(forecast);

  const getStatusBadge = () => {
    switch (windowStatus.status) {
      case 'favorable':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>FAVORABLE SPRAY WINDOW</span>
          </span>
        );
      case 'caution':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>MODERATE CAUTION</span>
          </span>
        );
      case 'unfavorable':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>DO NOT SPRAY</span>
          </span>
        );
    }
  };

  return (
    <Card className="border-slate-200/90 shadow-xs text-left">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wind className="w-4 h-4 text-agri-700" />
          <span>Foliar Agrochemical & Bio-Spray Window</span>
        </CardTitle>
        {getStatusBadge()}
      </CardHeader>

      <CardContent className="p-4 space-y-3 text-xs">
        <p className="text-slate-700 leading-relaxed font-medium">
          {windowStatus.description}
        </p>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Current Wind</span>
            <span className="text-xs font-extrabold text-slate-900 font-mono mt-0.5 block">
              {windowStatus.windSpeedKmh.toFixed(1)} km/h
            </span>
            <span className="text-[9px] text-slate-400">Limit: 12 km/h</span>
          </div>

          <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Rain Chance (6h)</span>
            <span className="text-xs font-extrabold text-slate-900 font-mono mt-0.5 block">
              {windowStatus.rainProbabilityPct}%
            </span>
            <span className="text-[9px] text-slate-400">Limit: 25%</span>
          </div>

          <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Ambient Temp</span>
            <span className="text-xs font-extrabold text-slate-900 font-mono mt-0.5 block">
              {windowStatus.tempC.toFixed(0)}°C
            </span>
            <span className="text-[9px] text-slate-400">Limit: 33°C</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
          Always wear personal protective equipment (PPE: rubber gloves, particulate mask, eye shield). Avoid spraying near flowering plants when honeybee pollinators are active.
        </div>
      </CardContent>
    </Card>
  );
};
