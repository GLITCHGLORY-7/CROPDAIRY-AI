// CropDiary AI — Symptom Intake Form Component
// Guided, accessible questionnaire capturing observable plant symptoms with WCAG AA compliance.

import React from 'react';
import {
  PlantPart,
  SymptomCategory,
  ProblemDuration,
  SpreadingStatus,
} from '@/types/cropDoctor';
import {
  Clock,
  Activity,
  ThermometerSun,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SymptomIntakeFormProps {
  affectedParts: PlantPart[];
  onTogglePart: (part: PlantPart) => void;
  symptomCategories: SymptomCategory[];
  onToggleCategory: (category: SymptomCategory) => void;
  duration: ProblemDuration;
  onChangeDuration: (duration: ProblemDuration) => void;
  spreading: SpreadingStatus;
  onChangeSpreading: (spreading: SpreadingStatus) => void;
  weatherNotes: string;
  onChangeWeatherNotes: (val: string) => void;
  farmerNotes: string;
  onChangeFarmerNotes: (val: string) => void;
  disabled?: boolean;
}

const AVAILABLE_PLANT_PARTS: { part: PlantPart; desc: string }[] = [
  { part: 'Leaves', desc: 'Foliage, leaf tips, undersides' },
  { part: 'Stem / Stalk', desc: 'Main stem, branches, tillers, collar' },
  { part: 'Roots / Crown', desc: 'Root ball, taproot, underground rhizome' },
  { part: 'Flowers', desc: 'Buds, floral squares, blossoms, panicles' },
  { part: 'Fruits / Grains / Pods', desc: 'Developing fruit, green pods, cobs' },
  { part: 'Whole Plant', desc: 'Generalized collapse, stunting, wilting' },
];

const AVAILABLE_SYMPTOMS: {
  category: SymptomCategory;
  icon: string;
  hint: string;
}[] = [
  { category: 'Spots / Lesions', icon: '🎯', hint: 'Circular, angular, concentric, or water-soaked spots' },
  { category: 'Wilting / Drooping', icon: '🥀', hint: 'Flaccid leaves, loss of turgidity despite moisture' },
  { category: 'Discoloration / Yellowing', icon: '🟡', hint: 'Chlorosis, bronzing, vein whitening, mosaic' },
  { category: 'Curling / Deformed Foliage', icon: '🌀', hint: 'Upward or downward rolling, puckering, crinkling' },
  { category: 'Pest / Insect Sighting', icon: '🐛', hint: 'Visible caterpillars, bugs, webbing, frass/feces' },
  { category: 'Powdery / Mildew Growth', icon: '❄️', hint: 'White, grey, or dark powdery fungal layer' },
  { category: 'Rotting / Decay', icon: '💧', hint: 'Soft brown decay, foul alcoholic or foul smell' },
  { category: 'Stunted Growth', icon: '📉', hint: 'Short internodes, failure to tiller or branch' },
];

const DURATION_OPTIONS: { val: ProblemDuration; label: string; desc: string }[] = [
  { val: '1-2 days', label: '1 - 2 days', desc: 'Sudden onset' },
  { val: '3-7 days', label: '3 - 7 days', desc: 'Past week' },
  { val: '1-2 weeks', label: '1 - 2 weeks', desc: 'Ongoing' },
  { val: 'More than 2 weeks', label: '2+ weeks', desc: 'Chronic' },
];

const SPREADING_OPTIONS: { val: SpreadingStatus; label: string; desc: string }[] = [
  { val: 'Isolated to few leaves or plants', label: 'Isolated', desc: 'Confined to individual plants' },
  { val: 'Slowly spreading to adjacent rows', label: 'Gradual Spread', desc: 'Moving along rows or wet spots' },
  { val: 'Rapidly spreading across plot', label: 'Rapid Outbreak', desc: 'Widespread across entire plot' },
];

export const SymptomIntakeForm: React.FC<SymptomIntakeFormProps> = ({
  affectedParts,
  onTogglePart,
  symptomCategories,
  onToggleCategory,
  duration,
  onChangeDuration,
  spreading,
  onChangeSpreading,
  weatherNotes,
  onChangeWeatherNotes,
  farmerNotes,
  onChangeFarmerNotes,
  disabled = false,
}) => {
  return (
    <div className="space-y-6 text-left">
      {/* 1. Affected Plant Parts */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          1. Which plant parts are affected? <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500">
          Select all parts where symptoms, lesions, or insects are visible.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {AVAILABLE_PLANT_PARTS.map(({ part, desc }) => {
            const isSelected = affectedParts.includes(part);
            return (
              <button
                key={part}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => onTogglePart(part)}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all min-h-[58px] flex flex-col justify-center focus:ring-2 focus:ring-agri-600 focus:outline-none',
                  isSelected
                    ? 'border-agri-600 bg-agri-50/80 text-agri-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/70'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs">{part}</span>
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center text-[10px]',
                      isSelected
                        ? 'border-agri-600 bg-agri-600 text-white'
                        : 'border-slate-300 bg-white'
                    )}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal mt-0.5">{desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Observable Symptoms */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          2. What visible symptoms do you observe? <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500">
          Select all characteristics matching the infected or stressed plant.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {AVAILABLE_SYMPTOMS.map(({ category, icon, hint }) => {
            const isSelected = symptomCategories.includes(category);
            return (
              <button
                key={category}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => onToggleCategory(category)}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all min-h-[54px] flex items-start gap-3 focus:ring-2 focus:ring-agri-600 focus:outline-none',
                  isSelected
                    ? 'border-agri-600 bg-agri-50 text-agri-950 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/70'
                )}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{category}</span>
                    <span
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center text-[10px]',
                        isSelected
                          ? 'border-agri-600 bg-agri-600 text-white font-bold'
                          : 'border-slate-300 bg-white'
                      )}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{hint}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Duration & Spread in 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Problem Duration */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>3. How long has this problem been visible?</span>
          </label>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {DURATION_OPTIONS.map(({ val, label, desc }) => {
              const isSelected = duration === val;
              return (
                <button
                  key={val}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChangeDuration(val)}
                  className={cn(
                    'p-2.5 rounded-xl border text-left transition-all min-h-[50px] focus:ring-2 focus:ring-agri-600 focus:outline-none',
                    isSelected
                      ? 'border-agri-600 bg-agri-50 text-agri-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  )}
                >
                  <div className="text-xs">{label}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Spreading Pattern */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            <span>4. Is the problem spreading?</span>
          </label>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {SPREADING_OPTIONS.map(({ val, label, desc }) => {
              const isSelected = spreading === val;
              return (
                <button
                  key={val}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChangeSpreading(val)}
                  className={cn(
                    'p-2.5 rounded-xl border text-left transition-all min-h-[46px] flex items-center justify-between focus:ring-2 focus:ring-agri-600 focus:outline-none',
                    isSelected
                      ? 'border-agri-600 bg-agri-50 text-agri-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  )}
                >
                  <div>
                    <span className="text-xs">{label}</span>
                    <span className="text-[10px] text-slate-500 font-normal ml-2">({desc})</span>
                  </div>
                  <span
                    className={cn(
                      'w-3.5 h-3.5 rounded-full border',
                      isSelected ? 'border-agri-600 bg-agri-600' : 'border-slate-300 bg-white'
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Weather, Irrigation & Field Changes */}
      <div className="space-y-2 pt-2">
        <label
          htmlFor="field-weather-notes-input"
          className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5"
        >
          <ThermometerSun className="w-3.5 h-3.5 text-slate-500" />
          <span>5. Recent Weather, Irrigation or Fertilizer Changes (Optional)</span>
        </label>
        <p className="text-xs text-slate-500">
          e.g., Heavy rain 3 days ago, water canal shutoff, recent urea top-dressing, unusually humid nights.
        </p>
        <textarea
          id="field-weather-notes-input"
          value={weatherNotes}
          disabled={disabled}
          onChange={(e) => onChangeWeatherNotes(e.target.value)}
          placeholder="Mention recent rainfall, drought, waterlogging, or fertilizer applied..."
          rows={2}
          className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-agri-600 focus:ring-2 focus:ring-agri-600/20 focus:outline-none"
        />
      </div>

      {/* 5. Additional Farmer Notes */}
      <div className="space-y-2 pt-1">
        <label
          htmlFor="field-farmer-notes-input"
          className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>6. Additional Notes or Specific Inquiries (Optional)</span>
        </label>
        <textarea
          id="field-farmer-notes-input"
          value={farmerNotes}
          disabled={disabled}
          onChange={(e) => onChangeFarmerNotes(e.target.value)}
          placeholder="Any specific questions or additional details you noticed..."
          rows={2}
          className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-agri-600 focus:ring-2 focus:ring-agri-600/20 focus:outline-none"
        />
      </div>
    </div>
  );
};
