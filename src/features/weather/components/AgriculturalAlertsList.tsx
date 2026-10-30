// CropDiary AI — Agricultural Weather Alerts List Component
// Displays rules-based agro-climatic hazard warnings with actionable farmer instructions and crop tags.

import React from 'react';
import { FarmWeatherAlert, AlertSeverity } from '@/types/weather';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  X,
  Calendar,
  Sprout,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgriculturalAlertsListProps {
  alerts: FarmWeatherAlert[];
  onDismissAlert?: (alertId: string) => void;
}

export const AgriculturalAlertsList: React.FC<AgriculturalAlertsListProps> = ({
  alerts,
  onDismissAlert,
}) => {
  const getSeverityStyle = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          cardBorder: 'border-rose-400 bg-rose-50/40',
          badge: <Badge variant="warning" className="bg-rose-100 text-rose-900 border-rose-300">CRITICAL HAZARD</Badge>,
          icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
        };
      case 'warning':
        return {
          cardBorder: 'border-amber-300 bg-amber-50/40',
          badge: <Badge variant="warning">AGRONOMIC WARNING</Badge>,
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
        };
      case 'info':
      default:
        return {
          cardBorder: 'border-sky-300 bg-sky-50/40',
          badge: <Badge variant="outline" className="border-sky-300 text-sky-800 bg-sky-50">AGRONOMIC NOTICE</Badge>,
          icon: <Info className="w-5 h-5 text-sky-600" />,
        };
    }
  };

  return (
    <Card className="border-slate-200/90 shadow-xs text-left">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Active Agricultural Alerts & Hazards</span>
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic rules based on ICAR & TNAU agronomic thresholds
          </p>
        </div>

        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          {alerts.length} Active {alerts.length === 1 ? 'Alert' : 'Alerts'}
        </span>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {alerts.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-sm text-slate-800">No Extreme Weather Hazards Detected</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Temperature, wind, and rainfall forecasts for your selected farm location are within normal safe ranges for field operations.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const { cardBorder, badge, icon } = getSeverityStyle(alert.severity);
            const windowStart = new Date(alert.forecast_window_start).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
            });
            const windowEnd = new Date(alert.forecast_window_end).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={alert.id}
                className={cn('p-4 rounded-xl border transition-all space-y-3', cardBorder)}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0">{icon}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {badge}
                        {alert.is_crop_specific && alert.crop_name ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-agri-900 bg-agri-100 px-2 py-0.5 rounded border border-agri-300">
                            <Sprout className="w-3 h-3 text-agri-700" />
                            <span>Crop-Specific: {alert.crop_name}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                            General Farm Rule
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                        {alert.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{windowStart === windowEnd ? windowStart : `${windowStart} – ${windowEnd}`}</span>
                    </span>

                    {onDismissAlert && (
                      <button
                        type="button"
                        aria-label="Dismiss alert"
                        onClick={() => onDismissAlert(alert.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Explanation */}
                <p className="text-xs text-slate-700 leading-relaxed bg-white/60 p-2.5 rounded-lg border border-black/5">
                  {alert.explanation}
                </p>

                {/* Actionable Practical Steps */}
                {alert.practical_steps.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 block">
                      Recommended Practical Actions:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {alert.practical_steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-agri-600 mt-1.5 flex-shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
