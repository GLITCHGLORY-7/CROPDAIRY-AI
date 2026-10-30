// CropDiary AI — Farm Reminders & Task Calendar Page
// Accessible task management, recurring scheduling, and weather-triggered condition tracking.

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storageAdapter } from '@/services/storageAdapter';
import { reminderService } from './services/reminderService';
import { FarmReminder } from '@/types/weather';
import { Farm, Plot } from '@/types/database';
import { ReminderCard } from './components/ReminderCard';
import { ReminderFormModal } from './components/ReminderFormModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Calendar, PlusCircle } from 'lucide-react';

export const RemindersPage: React.FC = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<FarmReminder[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [farmFilter, setFarmFilter] = useState<string>('all');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<FarmReminder | null>(
    null
  );
  const [deletingReminderId, setDeletingReminderId] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [userReminders, userFarms] = await Promise.all([
        reminderService.getReminders(user.id),
        storageAdapter.getFarms(user.id),
      ]);
      setReminders(userReminders);
      setFarms(userFarms);

      // Load plots for all farms
      const plotPromises = userFarms.map((f) => storageAdapter.getPlots(f.id));
      const plotsResults = await Promise.all(plotPromises);
      setPlots(plotsResults.flat());
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Derived filter calculations
  const filteredReminders = useMemo(() => {
    return reminders.filter((item) => {
      // Farm filter
      if (farmFilter !== 'all' && item.farm_id !== farmFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter)
        return false;

      // Status filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'pending') return item.status === 'pending';
      if (statusFilter === 'completed') return item.status === 'completed';
      if (statusFilter === 'snoozed') return item.status === 'snoozed';
      if (statusFilter === 'weather_triggered')
        return Boolean(item.weather_trigger_condition);
      if (statusFilter === 'overdue') {
        if (item.status === 'completed') return false;
        return new Date(item.due_date).getTime() < Date.now();
      }

      return true;
    });
  }, [reminders, farmFilter, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = reminders.length;
    const completed = reminders.filter((r) => r.status === 'completed').length;
    const pending = reminders.filter((r) => r.status === 'pending').length;
    const overdue = reminders.filter(
      (r) => r.status !== 'completed' && new Date(r.due_date).getTime() < Date.now()
    ).length;
    const weatherTriggered = reminders.filter(
      (r) => Boolean(r.weather_trigger_condition)
    ).length;

    return { total, completed, pending, overdue, weatherTriggered };
  }, [reminders]);

  // Handlers
  const handleToggleComplete = async (reminderId: string) => {
    if (!user) return;
    const item = reminders.find((r) => r.id === reminderId);
    if (!item) return;

    if (item.status === 'completed') {
      // Re-open task
      await storageAdapter.updateReminder(user.id, reminderId, {
        status: 'pending',
        completed_at: null,
      });
    } else {
      await reminderService.completeReminder(user.id, reminderId);
    }
    loadData();
  };

  const handleSnooze = async (reminderId: string, days: number) => {
    if (!user) return;
    await reminderService.snoozeReminder(user.id, reminderId, days);
    loadData();
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deletingReminderId) return;
    setIsDeleting(true);
    try {
      await reminderService.deleteReminder(user.id, deletingReminderId);
      setReminders((prev) => prev.filter((r) => r.id !== deletingReminderId));
      setDeletingReminderId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    if (!user) return;
    if (editingReminder) {
      await reminderService.updateReminder(user.id, editingReminder.id, formData);
    } else {
      await reminderService.createReminder(user.id, formData);
    }
    loadData();
  };

  const farmMap = useMemo(() => {
    const map = new Map<string, string>();
    farms.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [farms]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-agri-50 text-agri-700 border border-agri-200">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Farm Reminders & Task Schedule
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track daily field tasks, recurring agronomic schedules, and weather-triggered operational alerts.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingReminder(null);
            setIsFormModalOpen(true);
          }}
          className="shrink-0"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          <span>New Reminder</span>
        </Button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Pending Tasks</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {stats.pending}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Overdue</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              stats.overdue > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {stats.overdue}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Completed</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {stats.completed}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Weather Triggered</p>
          <p className="text-2xl font-bold text-sky-700 mt-1">
            {stats.weatherTriggered}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {[
            { id: 'all', label: 'All Tasks', count: stats.total },
            { id: 'pending', label: 'Pending', count: stats.pending },
            { id: 'overdue', label: 'Overdue', count: stats.overdue },
            {
              id: 'weather_triggered',
              label: 'Weather Triggered',
              count: stats.weatherTriggered,
            },
            { id: 'completed', label: 'Completed', count: stats.completed },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-agri-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id
                    ? 'bg-agri-800 text-white'
                    : 'bg-white text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Secondary Filters (Farm & Category) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="filter-farm"
              className="text-xs font-medium text-slate-600"
            >
              Farm:
            </label>
            <select
              id="filter-farm"
              value={farmFilter}
              onChange={(e) => setFarmFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
            >
              <option value="all">All Farms</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="filter-category"
              className="text-xs font-medium text-slate-600"
            >
              Category:
            </label>
            <select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
            >
              <option value="all">All Categories</option>
              <option value="irrigation">Irrigation</option>
              <option value="scouting">Scouting</option>
              <option value="fieldwork">Fieldwork</option>
              <option value="fertilizer">Fertilizer</option>
              <option value="harvest">Harvest</option>
              <option value="weather_action">Weather Action</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Reminders List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-3 border-agri-200 border-t-agri-700 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading reminders...</p>
        </div>
      ) : filteredReminders.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-2 border-slate-300">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No reminders found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'No reminders match your selected filter criteria. Try resetting filters.'
              : 'Keep your agricultural operations on track by creating task schedules, spray windows, or irrigation reminders.'}
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingReminder(null);
                setIsFormModalOpen(true);
              }}
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span>Create First Reminder</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              farmName={farmMap.get(reminder.farm_id)}
              onComplete={handleToggleComplete}
              onSnooze={handleSnooze}
              onDelete={(id) => setDeletingReminderId(id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <ReminderFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingReminder(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingReminder}
        farms={farms}
        plots={plots}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingReminderId)}
        onClose={() => setDeletingReminderId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Reminder"
        message="Are you sure you want to delete this farm reminder? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
};
