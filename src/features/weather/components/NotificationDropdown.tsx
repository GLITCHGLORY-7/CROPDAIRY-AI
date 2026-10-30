// CropDiary AI — TopNav Notification Dropdown
// Displays unread agricultural alerts and farm reminders with instant read-state updates.

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '../services/notificationService';
import { UserNotification } from '@/types/weather';
import {
  Bell,
  CloudRain,
  Calendar,
  Info,
  Check,
  CheckCheck,
  ArrowRight,
} from 'lucide-react';

export const NotificationDropdown: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const list = await notificationService.getNotifications(user.id);
      setNotifications(list.slice(0, 5));
      setUnreadCount(list.filter((n) => !n.read_at && !n.is_dismissed).length);
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [user]);

  // Click outside and Escape key handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    await notificationService.markAsRead(user.id, id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: UserNotification['notification_type']) => {
    switch (type) {
      case 'weather_alert':
        return <CloudRain className="w-4 h-4 text-sky-600" />;
      case 'reminder_due':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'system':
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-hidden focus:ring-2 focus:ring-agri-500 min-h-[38px] min-w-[38px] flex items-center justify-center"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notification Center Dropdown"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
        >
          {/* Dropdown Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-semibold text-rose-800 bg-rose-100 rounded-full border border-rose-200">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-agri-700 hover:text-agri-800 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List of items */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">
                  No notifications right now
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Proactive weather warnings and scheduled task reminders will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isRead = Boolean(n.read_at);
                return (
                  <div
                    key={n.id}
                    className={`p-3 text-left transition flex items-start gap-3 hover:bg-slate-50 ${
                      !isRead ? 'bg-sky-50/40' : ''
                    }`}
                  >
                    <div className="p-1.5 bg-white rounded-md border border-slate-200 shrink-0 mt-0.5">
                      {getNotificationIcon(n.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            !isRead
                              ? 'font-bold text-slate-900'
                              : 'font-medium text-slate-700'
                          }`}
                        >
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(n.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      {!isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-agri-700 hover:text-agri-900"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark read</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <Link
              to="/app/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-agri-700 hover:text-agri-800 inline-flex items-center gap-1"
            >
              <span>Open Notification Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
