// CropDiary AI — Follow-Up Observation Modal Component
// Allows farmers to record post-treatment recovery or progression, linking back to the assessment record.

import React, { useState } from 'react';
import { FollowupOutcome } from '@/types/cropDoctor';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, AlertTriangle, HelpCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    outcome: FollowupOutcome;
    days_after_assessment: number;
    remedies_applied: string[];
    notes?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

const OUTCOME_OPTIONS: { outcome: FollowupOutcome; label: string; desc: string; icon: any; color: string }[] = [
  {
    outcome: 'symptoms_improved',
    label: 'Symptoms Improved / Spread Stopped',
    desc: 'New leaves are healthy, lesion spread has ceased.',
    icon: CheckCircle2,
    color: 'border-emerald-500 bg-emerald-50 text-emerald-950',
  },
  {
    outcome: 'no_change',
    label: 'No Significant Change Observed',
    desc: 'Symptoms have neither progressed nor cleared.',
    icon: HelpCircle,
    color: 'border-amber-500 bg-amber-50 text-amber-950',
  },
  {
    outcome: 'symptoms_worsened',
    label: 'Symptoms Worsened / Spread to Adjacent Plants',
    desc: 'Lesions expanded or jumped to adjacent rows.',
    icon: AlertTriangle,
    color: 'border-rose-500 bg-rose-50 text-rose-950',
  },
  {
    outcome: 'crop_harvested_salvaged',
    label: 'Crop Harvested & Yield Salvaged',
    desc: 'Harvest completed successfully with minimal loss.',
    icon: Activity,
    color: 'border-blue-500 bg-blue-50 text-blue-950',
  },
  {
    outcome: 'crop_cleared',
    label: 'Severe Damage / Crop Cleared',
    desc: 'Plot cleared to prevent neighbor contamination.',
    icon: AlertTriangle,
    color: 'border-slate-500 bg-slate-50 text-slate-950',
  },
];

const COMMON_REMEDIES = [
  'Sprayed Trichoderma viride biocontrol',
  'Sprayed Pseudomonas fluorescens',
  'Applied 5% Neem Seed Kernel Extract (NSKE)',
  'Pruned and burnt infected foliage',
  'Adjusted irrigation / drained standing water',
  'Withheld top-dress Nitrogen fertilizer',
  'Installed yellow sticky / pheromone traps',
  'Consulted local KVK / Agriculture Officer',
  'Applied CIBRC label-claim fungicide/insecticide with PPE',
];

export const FollowupFormModal: React.FC<FollowupFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [outcome, setOutcome] = useState<FollowupOutcome>('symptoms_improved');
  const [daysAfter, setDaysAfter] = useState<number>(7);
  const [selectedRemedies, setSelectedRemedies] = useState<string[]>([
    'Pruned and burnt infected foliage',
    'Applied 5% Neem Seed Kernel Extract (NSKE)',
  ]);
  const [notes, setNotes] = useState<string>('');

  const toggleRemedy = (remedy: string) => {
    setSelectedRemedies((prev) =>
      prev.includes(remedy) ? prev.filter((r) => r !== remedy) : [...prev, remedy]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      outcome,
      days_after_assessment: daysAfter,
      remedies_applied: selectedRemedies,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Record Follow-Up Observation"
      description="Record what happened after applying recommendations to build your farm health history."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="text-left space-y-5">
        {/* Days After Assessment */}
        <div className="space-y-1.5">
          <label
            htmlFor="days-after-input"
            className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
          >
            Days Elapsed Since Diagnosis
          </label>
          <div className="flex items-center gap-3">
            <input
              id="days-after-input"
              type="number"
              min={0}
              max={365}
              value={daysAfter}
              onChange={(e) => setDaysAfter(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-24 rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-agri-600 focus:outline-none"
            />
            <span className="text-xs text-slate-500">days after original scan</span>
          </div>
        </div>

        {/* Outcome Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Observed Crop Condition
          </label>
          <div className="space-y-2">
            {OUTCOME_OPTIONS.map(({ outcome: optVal, label, desc, icon: Icon, color }) => {
              const isSelected = outcome === optVal;
              return (
                <button
                  key={optVal}
                  type="button"
                  onClick={() => setOutcome(optVal)}
                  className={cn(
                    'w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 focus:outline-none focus:ring-2 focus:ring-agri-600',
                    isSelected
                      ? `${color} border-2 shadow-xs`
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-bold">{label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Remedies Applied Checklist */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Remedies & Actions Applied
          </label>
          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
            {COMMON_REMEDIES.map((remedy) => {
              const isChecked = selectedRemedies.includes(remedy);
              return (
                <label
                  key={remedy}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white text-xs text-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleRemedy(remedy)}
                    className="rounded border-slate-300 text-agri-600 focus:ring-agri-500"
                  />
                  <span>{remedy}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Follow-up Notes */}
        <div className="space-y-1.5">
          <label
            htmlFor="followup-notes-input"
            className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
          >
            Follow-Up Observations & Notes (Optional)
          </label>
          <textarea
            id="followup-notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe plant response, weather conditions, or new shoot growth..."
            rows={2}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-agri-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Follow-Up'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
