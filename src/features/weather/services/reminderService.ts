// CropDiary AI — Smart Farm Reminders Service
// Manages farm operational tasks, recurring reminders, weather-triggered action schedules, and deduplication.

import { storageAdapter } from '@/services/storageAdapter';
import { FarmReminder, ReminderStatus } from '@/types/weather';
import { ReminderFormData } from '@/lib/validation/weatherSchemas';

export const reminderService = {
  async getReminders(
    userId: string,
    filters?: { farmId?: string; status?: ReminderStatus }
  ): Promise<FarmReminder[]> {
    return storageAdapter.getReminders(userId, filters);
  },

  async getReminderById(userId: string, reminderId: string): Promise<FarmReminder | null> {
    return storageAdapter.getReminderById(userId, reminderId);
  },

  async createReminder(userId: string, data: ReminderFormData): Promise<FarmReminder> {
    return storageAdapter.createReminder(userId, {
      farm_id: data.farm_id,
      plot_id: data.plot_id || null,
      crop_plan_id: data.crop_plan_id || null,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      category: data.category,
      due_date: data.due_date,
      timezone: data.timezone || 'Asia/Kolkata',
      recurrence: data.recurrence || 'none',
      status: 'pending',
      snoozed_until: null,
      weather_trigger_condition: data.weather_trigger_condition || null,
      completed_at: null,
    });
  },

  async completeReminder(userId: string, reminderId: string): Promise<FarmReminder> {
    const existing = await storageAdapter.getReminderById(userId, reminderId);
    if (!existing) throw new Error('Reminder not found');

    const completed = await storageAdapter.updateReminder(userId, reminderId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    // If recurring, schedule next occurrence
    if (existing.recurrence && existing.recurrence !== 'none') {
      const nextDue = new Date(existing.due_date);
      if (existing.recurrence === 'daily') nextDue.setDate(nextDue.getDate() + 1);
      else if (existing.recurrence === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
      else if (existing.recurrence === 'biweekly') nextDue.setDate(nextDue.getDate() + 14);
      else if (existing.recurrence === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);

      await storageAdapter.createReminder(userId, {
        farm_id: existing.farm_id,
        plot_id: existing.plot_id,
        crop_plan_id: existing.crop_plan_id,
        title: existing.title,
        description: existing.description,
        category: existing.category,
        due_date: nextDue.toISOString(),
        timezone: existing.timezone,
        recurrence: existing.recurrence,
        status: 'pending',
        snoozed_until: null,
        weather_trigger_condition: existing.weather_trigger_condition,
        completed_at: null,
      });
    }

    return completed;
  },

  async snoozeReminder(
    userId: string,
    reminderId: string,
    days: number = 1
  ): Promise<FarmReminder> {
    const now = new Date();
    const snoozedDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return storageAdapter.updateReminder(userId, reminderId, {
      status: 'snoozed',
      snoozed_until: snoozedDate.toISOString(),
      due_date: snoozedDate.toISOString(),
    });
  },

  async updateReminder(
    userId: string,
    reminderId: string,
    updates: Partial<FarmReminder>
  ): Promise<FarmReminder> {
    return storageAdapter.updateReminder(userId, reminderId, updates);
  },

  async deleteReminder(userId: string, reminderId: string): Promise<void> {
    return storageAdapter.deleteReminder(userId, reminderId);
  },

  /**
   * Weather-Triggered Action Deduplication:
   * Prevents creating repetitive reminder cards every time forecast refreshes.
   */
  async createWeatherTriggeredReminder(
    userId: string,
    farmId: string,
    triggerType: 'heavy_rain' | 'dry_spell' | 'high_wind' | 'high_temp',
    threshold: number,
    title: string,
    description: string
  ): Promise<FarmReminder | null> {
    const existing = await storageAdapter.getReminders(userId, { farmId });
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Check if an active or recent reminder for the same condition already exists
    const duplicate = existing.find(
      (r) =>
        r.weather_trigger_condition?.type === triggerType &&
        (r.status === 'pending' || r.status === 'snoozed' || r.created_at > oneDayAgo)
    );

    if (duplicate) {
      return null; // Suppress duplicate
    }

    const due = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(); // 6 hours out

    return storageAdapter.createReminder(userId, {
      farm_id: farmId,
      plot_id: null,
      crop_plan_id: null,
      title,
      description,
      category: 'weather_action',
      due_date: due,
      timezone: 'Asia/Kolkata',
      recurrence: 'none',
      status: 'pending',
      snoozed_until: null,
      weather_trigger_condition: {
        type: triggerType,
        threshold_value: threshold,
        description,
      },
      completed_at: null,
    });
  },
};
