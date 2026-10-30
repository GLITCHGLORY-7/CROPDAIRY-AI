// CropDiary AI — Scheme Deadline Reminder Modal (WCAG 2.1 AA Compliant)
import React, { useState } from 'react';
import { X, Calendar, Bell, Check, Loader2 } from 'lucide-react';
import { GovernmentScheme } from '@/types/schemes';
import { Farm } from '@/types/database';
import { schemeService } from '../services/schemeService';
import { Language } from '@/types/assistant';

interface SchemeDeadlineModalProps {
  scheme: GovernmentScheme;
  farms: Farm[];
  userId: string;
  language: Language;
  onClose: () => void;
  onSuccess: () => void;
}

export const SchemeDeadlineModal: React.FC<SchemeDeadlineModalProps> = ({
  scheme,
  farms,
  userId,
  language,
  onClose,
  onSuccess,
}) => {
  const [selectedFarmId, setSelectedFarmId] = useState<string>(
    farms.length > 0 ? farms[0].id : ''
  );
  // Default due date: 30 days from today
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const [dueDate, setDueDate] = useState<string>(defaultDueDate);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId || !dueDate) return;

    setIsSubmitting(true);
    try {
      await schemeService.createSchemeDeadlineReminder(
        userId,
        selectedFarmId,
        scheme,
        dueDate,
        customNotes
      );
      setIsSaved(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to create scheme reminder:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scheme-deadline-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="scheme-deadline-title"
                className="text-sm font-bold text-slate-900 dark:text-slate-100"
              >
                {language === 'ta'
                  ? 'திட்ட விண்ணப்ப நினைவூட்டல்'
                  : 'Set Scheme Deadline Reminder'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">{scheme.code}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={language === 'ta' ? 'மூடுக' : 'Close modal'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        {isSaved ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {language === 'ta'
                ? 'நினைவூட்டல் வெற்றிகரமாக அமைக்கப்பட்டது!'
                : 'Reminder Successfully Scheduled!'}
            </h4>
            <p className="text-xs text-slate-500">
              {language === 'ta'
                ? 'பண்ணை வானிலை & நினைவூட்டல்கள் பக்கத்தில் இது சேர்க்கப்பட்டுள்ளது.'
                : 'Added directly to your Farm Reminders schedule.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Farm Select */}
            <div>
              <label
                htmlFor="reminder-farm-select"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                {language === 'ta' ? 'விவசாய பண்ணை' : 'Select Farm'}
              </label>
              <select
                id="reminder-farm-select"
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.district}, {f.state})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Deadline Date */}
            <div>
              <label
                htmlFor="reminder-due-date"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                {language === 'ta'
                  ? 'விண்ணப்ப காலக்கெடு / நினைவூட்டல் தேதி'
                  : 'Target Application Deadline'}
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="reminder-due-date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Notes / Document checklist */}
            <div>
              <label
                htmlFor="reminder-custom-notes"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                {language === 'ta' ? 'கூடுதல் குறிப்புகள் (விருப்பம்)' : 'Custom Notes (Optional)'}
              </label>
              <textarea
                id="reminder-custom-notes"
                rows={2}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder={
                  language === 'ta'
                    ? 'எ.கா. VAO சான்றிதழ் பெறப்பட்டது, CSC மையத்திற்கு செல்ல வேண்டும்...'
                    : 'e.g. Land chitta downloaded, visit nearest e-Sevai / CSC center...'
                }
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                {language === 'ta' ? 'தானியங்கி ஆவண சரிபார்ப்பு:' : 'Automatic Checklist:'}
              </span>
              <span>
                {language === 'ta'
                  ? 'தேவையான ஆவணங்கள் மற்றும் அதிகாரப்பூர்வ இணையதள முகவரி நினைவூட்டலில் தானாக சேர்க்கப்படும்.'
                  : `Portal (${scheme.official_portal_url}) and documents checklist will be included in the reminder.`}
              </span>
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedFarmId || !dueDate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-colors shadow-2xs"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Calendar className="w-3.5 h-3.5" />
                )}
                <span>{language === 'ta' ? 'நினைவூட்டலை சேமி' : 'Save Reminder'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};