// CropDiary AI — Smart Farm Diary Dashboard Page
// Central digital farm ledger: chronological activity timeline, financial summaries, and task bridges.

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { storageAdapter } from '@/services/storageAdapter';
import { diaryService } from './services/diaryService';
import { reminderService } from '@/features/weather/services/reminderService';
import { indexedDbClient } from '@/services/offline/indexedDbClient';
import {
  FarmDiaryEntry,
  DiaryFilterParams,
  DiarySummaryStats,
} from '@/types/diary';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { FarmReminder } from '@/types/weather';
import { DiaryEntryCard } from './components/DiaryEntryCard';
import { DiaryFilterToolbar } from './components/DiaryFilterToolbar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  BookOpen,
  PlusCircle,
  TrendingDown,
  Wheat,
  Clock,
  CalendarCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const FarmDiaryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [entries, setEntries] = useState<FarmDiaryEntry[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [_cropPlans, setCropPlans] = useState<CropPlan[]>([]);
  const [pendingReminders, setPendingReminders] = useState<FarmReminder[]>([]);
  const [stats, setStats] = useState<DiarySummaryStats>({
    totalEntries: 0,
    todayActivities: 0,
    totalExpensesAmount: 0,
    totalHarvestKg: 0,
    activeObservationsCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<DiaryFilterParams>({
    entryType: 'all',
    farmId: 'all',
    plotId: 'all',
    sortOrder: 'newest',
  });

  // Delete modal state
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load master data
  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const [userFarms, userEntries, userStats, allReminders, allPlans, offlineEntries] =
        await Promise.all([
          storageAdapter.getFarms(user.id),
          diaryService.getEntries(user.id, filters),
          diaryService.getSummaryStats(user.id, filters.farmId !== 'all' ? filters.farmId : undefined),
          reminderService.getReminders(user.id, { status: 'pending' }),
          storageAdapter.getCropPlans(user.id),
          indexedDbClient.getOfflineEntries(user.id),
        ]);

      // Merge pending offline entries seamlessly
      const serverIds = new Set(userEntries.map((e) => e.id));
      const pendingLocals = offlineEntries.filter((oe) => !serverIds.has(oe.id));
      const combined = [...pendingLocals, ...userEntries].sort(
        (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
      );

      setFarms(userFarms);
      setEntries(combined);
      setStats(userStats);
      setPendingReminders(allReminders.slice(0, 3));
      setCropPlans(allPlans);

      // Load plots for all farms
      const plotPromises = userFarms.map((f) => storageAdapter.getPlots(f.id));
      const plotsResults = await Promise.all(plotPromises);
      setPlots(plotsResults.flat());
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (updates: Partial<DiaryFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      entryType: 'all',
      farmId: 'all',
      plotId: 'all',
      searchQuery: '',
      startDate: undefined,
      endDate: undefined,
      sortOrder: 'newest',
    });
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deletingEntryId) return;
    setIsDeleting(true);
    try {
      await diaryService.deleteEntry(user.id, deletingEntryId);
      setEntries((prev) => prev.filter((e) => e.id !== deletingEntryId));
      setDeletingEntryId(null);
      // Refresh summary stats
      const updatedStats = await diaryService.getSummaryStats(
        user.id,
        filters.farmId !== 'all' ? filters.farmId : undefined
      );
      setStats(updatedStats);
    } finally {
      setIsDeleting(false);
    }
  };

  // Convert reminder to diary entry
  const handleLogReminderAsActivity = (reminder: FarmReminder) => {
    navigate('/app/diary/new', {
      state: {
        fromReminder: true,
        reminderId: reminder.id,
        farmId: reminder.farm_id,
        plotId: reminder.plot_id,
        cropPlanId: reminder.crop_plan_id,
        title: `Completed: ${reminder.title}`,
        category: reminder.category,
        description: reminder.description || '',
      },
    });
  };

  // Lookup maps for fast card rendering
  const farmMap = useMemo(() => {
    const map = new Map<string, string>();
    farms.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [farms]);

  const plotMap = useMemo(() => {
    const map = new Map<string, string>();
    plots.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [plots]);

  // Group entries by Date for chronological timeline
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, FarmDiaryEntry[]>();
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    entries.forEach((entry) => {
      const dateKey = entry.occurred_at.slice(0, 10);
      let label = dateKey;
      if (dateKey === todayStr) label = 'Today';
      else if (dateKey === yesterdayStr) label = 'Yesterday';
      else {
        const d = new Date(dateKey);
        label = d.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }

      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(entry);
    });

    return Array.from(groups.entries());
  }, [entries]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-agri-50 text-agri-700 border border-agri-200">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Smart Farm Diary & Field Ledger
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Searchable historical record of daily operations, inputs, observations, expenditures, and harvests.
          </p>
        </div>

        <Link to="/app/diary/new">
          <Button variant="primary" className="shrink-0">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            <span>New Diary Entry</span>
          </Button>
        </Link>
      </div>

      {/* KPI Financial & Operational Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Entries</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {stats.totalEntries}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-agri-600" />
            <span>Today's Activities</span>
          </p>
          <p className="text-2xl font-bold text-agri-700 mt-1">
            {stats.todayActivities}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            <span>Recorded Expenses</span>
          </p>
          <p className="text-2xl font-bold text-rose-700 mt-1">
            ₹{stats.totalExpensesAmount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Wheat className="w-3.5 h-3.5 text-amber-500" />
            <span>Harvest Yield</span>
          </p>
          <p className="text-2xl font-bold text-amber-800 mt-1">
            {stats.totalHarvestKg > 0 ? `${stats.totalHarvestKg.toLocaleString('en-IN')} kg` : '0 kg'}
          </p>
        </div>
      </div>

      {/* Pending Reminders Conversion Bridge (Phase 4 Integration) */}
      {pendingReminders.length > 0 && (
        <Card className="p-4 bg-emerald-50/70 border-emerald-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Pending Scheduled Reminders (Click to Log as Diary Record)
              </span>
            </div>
            <Link
              to="/app/reminders"
              className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
            >
              <span>View All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {pendingReminders.map((rem) => (
              <div
                key={rem.id}
                className="bg-white p-3 rounded-lg border border-emerald-200 flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {rem.title}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Due: {new Date(rem.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleLogReminderAsActivity(rem)}
                  className="text-xs h-7 px-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50 shrink-0"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  <span>Log Activity</span>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filter Toolbar */}
      <DiaryFilterToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        farms={farms}
        plots={plots}
        totalResultsCount={entries.length}
      />

      {/* Timeline Section */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-agri-200 border-t-agri-700 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">
            Loading farm diary ledger...
          </p>
        </div>
      ) : entries.length === 0 ? (
        <Card className="p-10 text-center border-dashed border-2 border-slate-300">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No diary entries recorded
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filters.searchQuery || filters.entryType !== 'all' || filters.farmId !== 'all'
              ? 'No diary records match your selected filter criteria. Try resetting filters.'
              : 'Start building a verifiable digital history for your farm. Record sowing dates, irrigation cycles, input bills, and harvest yields.'}
          </p>
          <div className="mt-4">
            <Link to="/app/diary/new">
              <Button variant="primary" size="sm">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                <span>Create First Entry</span>
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedEntries.map(([dateLabel, dateEntries]) => (
            <div key={dateLabel} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] text-slate-400">
                  {dateEntries.length} {dateEntries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              <div className="space-y-3">
                {dateEntries.map((entry) => (
                  <DiaryEntryCard
                    key={entry.id}
                    entry={entry}
                    farmName={farmMap.get(entry.farm_id)}
                    plotName={entry.plot_id ? plotMap.get(entry.plot_id) : undefined}
                    onDelete={(id) => setDeletingEntryId(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingEntryId)}
        onClose={() => setDeletingEntryId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Diary Entry"
        message="Are you sure you want to delete this diary entry? This will permanently delete the entry, its typed details, and any attached photos."
        confirmLabel="Delete Entry"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
};
