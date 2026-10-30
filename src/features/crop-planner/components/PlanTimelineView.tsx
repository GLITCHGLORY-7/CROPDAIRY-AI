import React from 'react';
import { TimelineStage } from '@/types/crop';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

export interface PlanTimelineViewProps {
  stages: TimelineStage[];
  sowingDate: string;
  targetHarvestDate?: string;
  cropName: string;
}

export const PlanTimelineView: React.FC<PlanTimelineViewProps> = ({
  stages,
  sowingDate,
  targetHarvestDate,
  cropName,
}) => {
  return (
    <Card className="border-slate-200 shadow-sm text-left">
      <CardHeader className="bg-slate-50/70 border-b border-slate-200/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-agri-700" />
              Agronomic Growth Stages & Milestone Timeline
            </CardTitle>
            <p className="text-xs text-slate-500">
              Estimated milestones for {cropName} starting from planned sowing on {sowingDate}.
            </p>
          </div>
          {targetHarvestDate && (
            <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-agri-100 text-agri-800 border border-agri-200 self-start sm:self-auto">
              Est. Harvest: {targetHarvestDate}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <div className="relative border-l-2 border-agri-200 ml-4 pl-6 space-y-6">
          {stages.map((stage, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline marker icon */}
              <div className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-agri-600 flex items-center justify-center text-agri-700 shadow-xs">
                <span className="text-[10px] font-black">{idx + 1}</span>
              </div>

              {/* Stage content */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-agri-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <h4 className="font-bold text-sm text-slate-900">{stage.stage_name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Day {stage.start_day}–{stage.end_day}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-agri-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {stage.approx_date}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {stage.guidance}
                </p>

                {/* Integration note */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    Pending field confirmation in Farm Diary
                  </span>
                  <span className="italic">Stage-linked Weather Alerts active</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
