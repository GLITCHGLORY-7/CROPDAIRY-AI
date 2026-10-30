// CropDiary AI — Source Reference Badge Component
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  MapPin,
  Calendar,
  BookOpen,
  IndianRupee,
  Package,
  TrendingUp,
  PieChart,
  Stethoscope,
  CloudSun,
  Landmark,
  Store,
  ExternalLink,
} from 'lucide-react';
import { SourceReference, SourceRecordType } from '@/types/assistant';

interface SourceReferenceBadgeProps {
  sources: SourceReference[];
}

const RECORD_CONFIG: Record<
  SourceRecordType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; defaultRoute: string }
> = {
  farm: { label: 'Farm', icon: Sprout, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', defaultRoute: '/app/farms' },
  plot: { label: 'Plot', icon: MapPin, color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800', defaultRoute: '/app/farms' },
  crop_plan: { label: 'Crop Plan', icon: Calendar, color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', defaultRoute: '/app/crop-planner' },
  diary_entry: { label: 'Farm Diary', icon: BookOpen, color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800', defaultRoute: '/app/diary' },
  expense: { label: 'Expense', icon: IndianRupee, color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800', defaultRoute: '/app/finance' },
  harvest: { label: 'Harvest', icon: Package, color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800', defaultRoute: '/app/finance' },
  sale: { label: 'Sale', icon: TrendingUp, color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800', defaultRoute: '/app/finance' },
  budget: { label: 'Budget', icon: PieChart, color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800', defaultRoute: '/app/finance' },
  crop_doctor: { label: 'Crop Doctor', icon: Stethoscope, color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800', defaultRoute: '/app/crop-doctor' },
  weather: { label: 'Weather Alert', icon: CloudSun, color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800', defaultRoute: '/app/weather' },
  scheme: { label: 'Gov Scheme', icon: Landmark, color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800', defaultRoute: '/app/schemes' },
  mandi: { label: 'Mandi Price', icon: Store, color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800', defaultRoute: '/app/finance' },
};

export const SourceReferenceBadge: React.FC<SourceReferenceBadgeProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
      <div className="flex items-center gap-1.5 mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>Verified Sources & Grounded Evidence:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((src, idx) => {
          const cfg = RECORD_CONFIG[src.recordType] || RECORD_CONFIG.diary_entry;
          const Icon = cfg.icon;
          const route = src.url || cfg.defaultRoute;
          const isExternal = route.startsWith('http');

          const content = (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-colors hover:shadow-xs ${cfg.color}`}
              title={src.snippet || src.title}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[200px]">{src.title}</span>
              {src.date && (
                <span className="text-[10px] opacity-75 shrink-0 font-mono">
                  {new Date(src.date).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {isExternal ? (
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              ) : null}
            </span>
          );

          if (isExternal) {
            return (
              <a
                key={idx}
                href={route}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
                aria-label={`View external source: ${src.title}`}
              >
                {content}
              </a>
            );
          }

          return (
            <Link
              key={idx}
              to={route}
              className="inline-block"
              aria-label={`View record: ${src.title}`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
};