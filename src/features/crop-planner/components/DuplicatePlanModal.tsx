import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { CropPlan, Season } from '@/types/crop';

export interface DuplicatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDuplicate: (newSeason: Season, newSowingDate: string) => Promise<void>;
  plan: CropPlan;
  isLoading?: boolean;
}

export const DuplicatePlanModal: React.FC<DuplicatePlanModalProps> = ({
  isOpen,
  onClose,
  onDuplicate,
  plan,
  isLoading = false,
}) => {
  const [season, setSeason] = useState<Season>('Kharif');
  const [sowingDate, setSowingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onDuplicate(season, sowingDate);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Duplicate Plan: ${plan.title}`}
      description="Create a new plan for the upcoming farming season reusing your proven setup."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <Select
          label="Upcoming Farming Season"
          value={season}
          onChange={(e) => setSeason(e.target.value as Season)}
        >
          <option value="Kharif">Kharif (Monsoon / Samba)</option>
          <option value="Rabi">Rabi (Winter / Navarai)</option>
          <option value="Zaid">Zaid (Summer / Kuruvai)</option>
          <option value="Perennial">Perennial</option>
          <option value="All-Season">All-Season</option>
        </Select>

        <Input
          label="Intended Sowing Date"
          type="date"
          required
          value={sowingDate}
          onChange={(e) => setSowingDate(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
            Duplicate Plan
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
