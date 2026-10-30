import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { IntegrationMatrixCard } from '@/features/settings/components/IntegrationMatrixCard';

interface IntegrationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrationStatusModal: React.FC<IntegrationStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="System Integrations & Service Diagnostics"
      description="Live status of database persistence, external APIs, and local fallbacks."
      maxWidth="xl"
    >
      <div className="max-h-[75vh] overflow-y-auto">
        <IntegrationMatrixCard />
      </div>
    </Dialog>
  );
};
