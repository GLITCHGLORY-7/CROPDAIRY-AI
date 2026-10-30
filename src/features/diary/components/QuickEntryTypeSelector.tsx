// CropDiary AI — Quick Entry Type Selector
// Accessible grid allowing farmers to choose among 7 specialized agricultural entry types.

import React from 'react';
import { DiaryEntryType } from '@/types/diary';
import {
  BookOpen,
  Trees,
  Droplets,
  Sprout,
  Eye,
  IndianRupee,
  Wheat,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickEntryTypeSelectorProps {
  selectedType: DiaryEntryType;
  onSelectType: (type: DiaryEntryType) => void;
  disabled?: boolean;
}

interface TypeOption {
  type: DiaryEntryType;
  label: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
  badgeBg: string;
}

export const ENTRY_TYPE_OPTIONS: TypeOption[] = [
  {
    type: 'activity',
    label: 'Farm Activity',
    description: 'Sowing, weeding, spraying, pruning, maintenance',
    icon: Trees,
    colorClass: 'text-emerald-700 border-emerald-300 hover:bg-emerald-50/60',
    badgeBg: 'bg-emerald-100 text-emerald-800',
  },
  {
    type: 'irrigation',
    label: 'Irrigation',
    description: 'Drip, sprinkler, flood, water volume & duration',
    icon: Droplets,
    colorClass: 'text-sky-700 border-sky-300 hover:bg-sky-50/60',
    badgeBg: 'bg-sky-100 text-sky-800',
  },
  {
    type: 'input_application',
    label: 'Fertilizer & Inputs',
    description: 'Compost, bio-nutrients, amendments, seeds',
    icon: Sprout,
    colorClass: 'text-agri-700 border-agri-300 hover:bg-agri-50/60',
    badgeBg: 'bg-agri-100 text-agri-800',
  },
  {
    type: 'crop_observation',
    label: 'Crop Observation',
    description: 'Plant growth, pest signs, leaves, flowering',
    icon: Eye,
    colorClass: 'text-indigo-700 border-indigo-300 hover:bg-indigo-50/60',
    badgeBg: 'bg-indigo-100 text-indigo-800',
  },
  {
    type: 'expense',
    label: 'Farm Expense',
    description: 'Labor, fuel, seeds, machinery hire, transport',
    icon: IndianRupee,
    colorClass: 'text-rose-700 border-rose-300 hover:bg-rose-50/60',
    badgeBg: 'bg-rose-100 text-rose-800',
  },
  {
    type: 'harvest',
    label: 'Harvest Record',
    description: 'Yield weight, grade, home-use vs sale, market revenue',
    icon: Wheat,
    colorClass: 'text-amber-700 border-amber-300 hover:bg-amber-50/60',
    badgeBg: 'bg-amber-100 text-amber-800',
  },
  {
    type: 'general',
    label: 'General Note',
    description: 'Field notes, weather remarks, general farm log',
    icon: BookOpen,
    colorClass: 'text-slate-700 border-slate-300 hover:bg-slate-50',
    badgeBg: 'bg-slate-100 text-slate-800',
  },
];

export const QuickEntryTypeSelector: React.FC<QuickEntryTypeSelectorProps> = ({
  selectedType,
  onSelectType,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        Select Entry Category
      </label>
      <div
        role="radiogroup"
        aria-label="Diary Entry Type"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5"
      >
        {ENTRY_TYPE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedType === opt.type;

          return (
            <button
              key={opt.type}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelectType(opt.type)}
              className={cn(
                'flex flex-col text-left p-3 rounded-xl border transition-all relative min-h-[92px]',
                isSelected
                  ? 'border-agri-600 bg-agri-50/70 ring-2 ring-agri-500 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300',
                disabled && 'opacity-60 cursor-not-allowed'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center',
                    isSelected ? 'bg-agri-700 text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-agri-600 animate-pulse" />
                )}
              </div>

              <span
                className={cn(
                  'text-xs font-bold',
                  isSelected ? 'text-agri-950' : 'text-slate-800'
                )}
              >
                {opt.label}
              </span>
              <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
