// CropDiary AI — Farm Reminder Item Card Component
// Accessible task card with complete, snooze, edit, and deletion actions.

import React from 'react';
import { FarmReminder, ReminderCategory } from '@/types/weather';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Droplets,
  Eye,
  Trees,
  Sprout,
  CheckSquare,
  CloudRain,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReminderCardProps {
  reminder: FarmReminder;
  farmName?: string;
  onComplete: (id: string) => void;
  onSnooze: (id: string, days: number) => void;
  onDelete: (id: string) => void;
  isProcessing?: boolean;
}

export function getCategoryIcon(category: ReminderCategory) {
  switch (category) {
    case 'irrigation':
      return <Droplets className="w-4 h-4 text-sky-600" />;
    case 'scouting':
      return <Eye className="w-4 h-4 text-indigo-600" />;
    case 'fieldwork':
      return <Trees className="w-4 h-4 text-emerald-600" />;
    case 'fertilizer':
      return <Sprout className="w-4 h-4 text-agri-600" />;
    case 'harvest':
      return <CheckSquare className="w-4 h-4 text-amber-600" />;
    case 'weather_action':
      return <CloudRain className="w-4 h-4 text-blue-600" />;
    case 'custom':
    default:
      return <CheckSquare className="w-4 h-4 text-slate-600" />;
  }
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  farmName,
  onComplete,
  onSnooze,
  onDelete,
  isProcessing = false,
}) => {
  const isCompleted = reminder.status === 'completed';
  const isSnoozed = reminder.status === 'snoozed';

  const dueDateObj = new Date(reminder.due_date);
  const now = new Date();
  const isOverdue = !isCompleted && dueDateObj.getTime() < now.getTime();

  const getDueBadge = () => {
    if (isCompleted) {
      return (
        <Badge variant="success" className="text-[10px]">
          Completed
        </Badge>
      );
    }
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
          <AlertCircle className="w-3 h-3" />
          <span>Overdue</span>
        </span>
      );
    }
    if (isSnoozed) {
      return (
        <Badge variant="warning" className="text-[10px]">
          Snoozed
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" className="text-[10px]">
        Scheduled
      </Badge>
    );
  };

  return (
    <Card
      className={cn(
        'p-4 transition-all text-left border-slate-200/90',
        isCompleted
          ? 'bg-slate-50/70 opacity-75 border-slate-200'
          : isOverdue
          ? 'border-rose-300 bg-rose-50/20 shadow-xs'
          : 'hover:border-agri-400 bg-white hover:shadow-xs'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Checkbox & Title */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            role="checkbox"
            aria-checked={isCompleted}
            aria-label={`Mark "${reminder.title}" as ${isCompleted ? 'pending' : 'completed'}`}
            disabled={isProcessing}
            onClick={() => onComplete(reminder.id)}
            className={cn(
              'mt-1 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors focus:ring-2 focus:ring-agri-500 focus:outline-none',
              isCompleted
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-300 bg-white hover:border-agri-600'
            )}
          >
            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
          </button>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 capitalize">
                {getCategoryIcon(reminder.category)}
                <span>{reminder.category.replace('_', ' ')}</span>
              </span>

              {getDueBadge()}

              {reminder.recurrence !== 'none' && (
                <span className="text-[10px] text-slate-500 font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 capitalize">
                  ↻ {reminder.recurrence}
                </span>
              )}
            </div>

            <h4
              className={cn(
                'text-sm font-extrabold text-slate-900',
                isCompleted && 'line-through text-slate-500'
              )}
            >
              {reminder.title}
            </h4>

            {reminder.description && (
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {reminder.description}
              </p>
            )}

            {/* Farm & Due Date Footer */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
              {farmName && <span className="font-semibold text-slate-700">{farmName}</span>}
              <span className="flex items-center gap-1 text-slate-600">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  {dueDateObj.toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  at{' '}
                  {dueDateObj.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isCompleted && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSnooze(reminder.id, 1)}
                className="text-[10px] px-2 py-1 min-h-[30px]"
                title="Snooze reminder by 1 day"
              >
                <span>+1d</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSnooze(reminder.id, 3)}
                className="text-[10px] px-2 py-1 min-h-[30px]"
                title="Snooze reminder by 3 days"
              >
                <span>+3d</span>
              </Button>
            </div>
          )}

          <button
            type="button"
            aria-label="Delete reminder"
            onClick={() => onDelete(reminder.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};
