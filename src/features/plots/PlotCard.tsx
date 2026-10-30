import React, { useState } from 'react';
import { Plot } from '@/types/database';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatArea, formatDate } from '@/lib/formatters';
import { Droplet, Layers, Compass, Edit, Archive, Trash2, Sprout } from 'lucide-react';

export interface PlotCardProps {
  plot: Plot;
  onEdit: (plot: Plot) => void;
  onToggleStatus: (plot: Plot) => void;
  onDelete: (plotId: string) => void;
}

export const PlotCard: React.FC<PlotCardProps> = ({ plot, onEdit, onToggleStatus, onDelete }) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const isActive = plot.status === 'active';

  return (
    <>
      <Card className="hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900">{plot.name}</CardTitle>
                <Badge variant={isActive ? 'success' : 'neutral'}>
                  {isActive ? 'Active' : 'Archived'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Updated {formatDate(plot.updated_at)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-agri-700 bg-agri-50 px-2.5 py-1 rounded-lg border border-agri-200">
                {formatArea(plot.area, plot.area_unit)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50">
              <Layers className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <span>{plot.soil_type}</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50">
              <Droplet className="w-4 h-4 text-sky-500" aria-hidden="true" />
              <span>{plot.irrigation_method}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <Compass className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span>Environment: <strong>{plot.farming_environment}</strong></span>
          </div>

          {plot.notes && (
            <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100/60">
              &quot;{plot.notes}&quot;
            </p>
          )}

          {/* Planned Crop Association indicator */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Sprout className="w-3.5 h-3.5 text-agri-600" />
              Cultivation Zone
            </span>
            <span className="font-semibold text-agri-700">Ready for Crop Plan</span>
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(plot)}
            aria-label={`Edit ${plot.name}`}
            className="text-xs text-slate-600"
          >
            <Edit className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsArchiveOpen(true)}
              aria-label={isActive ? `Archive ${plot.name}` : `Activate ${plot.name}`}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              <Archive className="w-3.5 h-3.5 mr-1" />
              {isActive ? 'Archive' : 'Restore'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              aria-label={`Delete ${plot.name}`}
              className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Archive / Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={() => {
          onToggleStatus(plot);
          setIsArchiveOpen(false);
        }}
        title={isActive ? 'Archive Plot' : 'Restore Plot'}
        message={
          isActive
            ? `Archiving "${plot.name}" hides it from active crop planning while safely preserving its history.`
            : `Restoring "${plot.name}" will mark it active for crop planning.`
        }
        confirmLabel={isActive ? 'Archive Plot' : 'Restore Plot'}
        variant={isActive ? 'destructive' : 'primary'}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          onDelete(plot.id);
          setIsDeleteOpen(false);
        }}
        title="Delete Plot"
        message={`Are you sure you want to permanently delete "${plot.name}"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="destructive"
      />
    </>
  );
};
