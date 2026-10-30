// CropDiary AI — Diary Search & Filter Toolbar Component
// Allows farmers to search entries by keywords, filter by farm/plot/category, and set date ranges.

import React from 'react';
import { DiaryFilterParams, DiaryEntryType } from '@/types/diary';
import { Farm, Plot } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, X, RotateCcw, ArrowUpDown } from 'lucide-react';

interface DiaryFilterToolbarProps {
  filters: DiaryFilterParams;
  onFilterChange: (updates: Partial<DiaryFilterParams>) => void;
  onResetFilters: () => void;
  farms: Farm[];
  plots: Plot[];
  totalResultsCount: number;
}

const CATEGORY_TABS: Array<{ id: DiaryEntryType | 'all'; label: string }> = [
  { id: 'all', label: 'All Entries' },
  { id: 'activity', label: 'Activities' },
  { id: 'irrigation', label: 'Irrigation' },
  { id: 'input_application', label: 'Inputs' },
  { id: 'crop_observation', label: 'Observations' },
  { id: 'expense', label: 'Expenses' },
  { id: 'harvest', label: 'Harvests' },
];

export const DiaryFilterToolbar: React.FC<DiaryFilterToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  farms,
  plots,
  totalResultsCount,
}) => {
  const availablePlots = filters.farmId && filters.farmId !== 'all'
    ? plots.filter((p) => p.farm_id === filters.farmId)
    : plots;

  const hasActiveFilters = Boolean(
    filters.searchQuery ||
    (filters.farmId && filters.farmId !== 'all') ||
    (filters.plotId && filters.plotId !== 'all') ||
    (filters.entryType && filters.entryType !== 'all') ||
    filters.startDate ||
    filters.endDate
  );

  return (
    <Card className="p-4 space-y-3 border-slate-200/90 text-left">
      {/* Search Input & Quick Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <label htmlFor="diary-search-input" className="sr-only">
            Search diary entries
          </label>
          <Input
            id="diary-search-input"
            type="text"
            placeholder="Search activities, inputs, harvests, notes, or #tags..."
            value={filters.searchQuery || ''}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="pl-9 text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange({ searchQuery: '' })}
              aria-label="Clear search input"
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Order Toggle */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onFilterChange({
                sortOrder: filters.sortOrder === 'oldest' ? 'newest' : 'oldest',
              })
            }
            className="text-xs h-9 px-3 shrink-0"
          >
            <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-slate-500" />
            <span>{filters.sortOrder === 'oldest' ? 'Oldest First' : 'Newest First'}</span>
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-xs h-9 px-2.5 text-slate-500 hover:text-slate-800 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
        {CATEGORY_TABS.map((tab) => {
          const isActive = (filters.entryType || 'all') === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange({ entryType: tab.id })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-agri-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Secondary Dropdown Filters: Farm, Plot, Date Range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div>
          <label htmlFor="filter-diary-farm" className="block text-[11px] font-semibold text-slate-600 mb-1">
            Farm
          </label>
          <select
            id="filter-diary-farm"
            value={filters.farmId || 'all'}
            onChange={(e) => onFilterChange({ farmId: e.target.value, plotId: 'all' })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
          >
            <option value="all">All Farms</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-diary-plot" className="block text-[11px] font-semibold text-slate-600 mb-1">
            Plot
          </label>
          <select
            id="filter-diary-plot"
            value={filters.plotId || 'all'}
            onChange={(e) => onFilterChange({ plotId: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
          >
            <option value="all">All Plots</option>
            {availablePlots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-start-date" className="block text-[11px] font-semibold text-slate-600 mb-1">
            From Date
          </label>
          <input
            id="filter-start-date"
            type="date"
            value={filters.startDate ? filters.startDate.slice(0, 10) : ''}
            onChange={(e) => onFilterChange({ startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
          />
        </div>

        <div>
          <label htmlFor="filter-end-date" className="block text-[11px] font-semibold text-slate-600 mb-1">
            To Date
          </label>
          <input
            id="filter-end-date"
            type="date"
            value={filters.endDate ? filters.endDate.slice(0, 10) : ''}
            onChange={(e) => onFilterChange({ endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
        <span>Showing <strong>{totalResultsCount}</strong> {totalResultsCount === 1 ? 'record' : 'records'}</span>
        {hasActiveFilters && (
          <span className="text-agri-700 font-semibold">Active filters applied</span>
        )}
      </div>
    </Card>
  );
};
