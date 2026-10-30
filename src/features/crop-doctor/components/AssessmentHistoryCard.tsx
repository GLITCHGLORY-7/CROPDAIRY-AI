// CropDiary AI — Assessment History Card Component
// Displays past crop diagnostic scans with quick status, follow-up outcomes, and navigation.

import React from 'react';
import { Link } from 'react-router-dom';
import { CropAssessment } from '@/types/cropDoctor';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowRight, Calendar, MapPin, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AssessmentHistoryCardProps {
  assessment: CropAssessment;
  farmName?: string;
  plotName?: string;
  onDelete?: (id: string) => void;
}

export const AssessmentHistoryCard: React.FC<AssessmentHistoryCardProps> = ({
  assessment,
  farmName,
  plotName,
  onDelete,
}) => {
  const latestFollowup = assessment.followups?.[0];

  const getOutcomeBadge = () => {
    if (!latestFollowup) return null;
    switch (latestFollowup.outcome) {
      case 'symptoms_improved':
        return (
          <Badge variant="success" className="text-[10px] gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Improved ({latestFollowup.days_after_assessment}d)</span>
          </Badge>
        );
      case 'symptoms_worsened':
        return (
          <Badge variant="warning" className="text-[10px] gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Worsened ({latestFollowup.days_after_assessment}d)</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="text-[10px]">
            Follow-Up Logged
          </Badge>
        );
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200/90 hover:border-agri-400 hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row items-stretch">
        {/* Specimen Photo Thumbnail */}
        <div className="relative sm:w-44 h-36 sm:h-auto bg-slate-900 flex-shrink-0 overflow-hidden">
          <img
            src={assessment.photo_url}
            alt={assessment.primary_diagnosis}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs border border-white/20">
              {(assessment.confidence_score * 100).toFixed(0)}% Conf.
            </span>
          </div>
        </div>

        {/* Card Content Body */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between text-left space-y-3">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-agri-800 uppercase tracking-wide">
                  {assessment.crop_name}
                </span>
                {assessment.growth_stage && (
                  <span className="text-xs text-slate-500">• {assessment.growth_stage}</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {getOutcomeBadge()}
                <Badge variant={assessment.confidence_level === 'high' ? 'success' : 'neutral'} className="text-[10px]">
                  {assessment.diagnosis_type.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <h3 className="font-extrabold text-base text-slate-900 mt-1 line-clamp-1">
              {assessment.primary_diagnosis}
            </h3>

            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {assessment.diagnostic_summary}
            </p>
          </div>

          {/* Metadata Footer */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(assessment.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </span>

              {(farmName || plotName) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{[farmName, plotName].filter(Boolean).join(' • ')}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onDelete && (
                <button
                  type="button"
                  aria-label="Delete assessment record"
                  onClick={() => onDelete(assessment.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <Link to={`/app/crop-doctor/${assessment.id}`}>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 min-h-[36px]">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
