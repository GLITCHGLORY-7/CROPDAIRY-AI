import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'agri' | 'earth' | 'neutral';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'neutral',
  className,
}) => {
  const iconBgs = {
    agri: 'bg-agri-100 text-agri-700 border-agri-200',
    earth: 'bg-earth-200 text-earth-800 border-earth-300',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }[variant];

  return (
    <Card className={cn('p-5 flex items-center justify-between shadow-xs', className)}>
      <div className="text-left">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
          {value}
        </div>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </div>
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xs', iconBgs)}>
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
    </Card>
  );
};
