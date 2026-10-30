// CropDiary AI — In-App Notification Center Page
// Centralized notification management, browser push controls, and deep links to agricultural features.

import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from './services/notificationService';
import { UserNotification } from '@/types/weather';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Bell,
  CloudRain,
  Calendar,
  Info,
  Check,
  CheckCheck,
  Trash2,
  ArrowRight,
  BellRing,
} from 'lucide-react';

export const NotificationCenterPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    'default'
  );

  const loadNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const list = await notificationService.getNotifications(user.id);
      setNotifications(list);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, [user]);

  const handleRequestPushPermission = async () => {
    await notificationService.requestBrowserNotificationPermission();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    await notificationService.markAsRead(user.id, id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
    );
  };

  const handleDismiss = async (id: string) => {
    if (!user) return;
    await notificationService.dismissNotification(user.id, id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (typeFilter === 'all') return true;
      if (typeFilter === 'unread') return !n.read_at;
      return n.notification_type === typeFilter;
    });
  }, [notifications, typeFilter]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at && !n.is_dismissed).length,
    [notifications]
  );

  const getNotificationIcon = (type: UserNotification['notification_type']) => {
    switch (type) {
      case 'weather_alert':
        return <CloudRain className="w-5 h-5 text-sky-600" />;
      case 'reminder_due':
        return <Calendar className="w-5 h-5 text-amber-600" />;
      case 'system':
      default:
        return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  const getDeepLink = (n: UserNotification) => {
    if (n.resource_type === 'weather_alert') return '/app/weather';
    if (n.resource_type === 'reminder') return '/app/reminders';
    if (n.resource_type === 'crop_plan') return '/app/planner';
    return '/app/weather';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-agri-50 text-agri-700 border border-agri-200">
              <Bell className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Agricultural Notification Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Proactive atmospheric warnings, ICAR rule advisories, and task reminders.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs shrink-0"
          >
            <CheckCheck className="w-4 h-4 mr-1 text-agri-700" />
            <span>Mark All as Read ({unreadCount})</span>
          </Button>
        )}
      </div>

      {/* Browser Push Permission Banner */}
      {browserPermission !== 'granted' && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <BellRing className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-sky-950">
                Enable Browser Notifications for Urgent Weather Alerts
              </p>
              <p className="text-[11px] text-sky-800 mt-0.5">
                Receive instant alerts for heavy downpours, high spray drift winds, and extreme heat when this tab is open.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRequestPushPermission}
            className="text-xs bg-sky-700 hover:bg-sky-800 shrink-0"
          >
            Enable Notifications
          </Button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { id: 'all', label: 'All', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
          {
            id: 'weather_alert',
            label: 'Weather Alerts',
            count: notifications.filter((n) => n.notification_type === 'weather_alert').length,
          },
          {
            id: 'reminder_due',
            label: 'Reminders',
            count: notifications.filter((n) => n.notification_type === 'reminder_due').length,
          },
          {
            id: 'system',
            label: 'System',
            count: notifications.filter((n) => n.notification_type === 'system').length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTypeFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              typeFilter === tab.id
                ? 'bg-agri-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                typeFilter === tab.id
                  ? 'bg-agri-800 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-3 border-agri-200 border-t-agri-700 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-2 border-slate-300">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No notifications in this view
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You're all caught up! New atmospheric warnings and task reminders will appear here automatically.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const isRead = Boolean(n.read_at);
            return (
              <Card
                key={n.id}
                className={`p-4 transition ${
                  !isRead
                    ? 'border-l-4 border-l-agri-600 bg-emerald-50/20'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg shrink-0 mt-0.5">
                    {getNotificationIcon(n.notification_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-sm ${
                            !isRead
                              ? 'font-bold text-slate-900'
                              : 'font-semibold text-slate-700'
                          }`}
                        >
                          {n.title}
                        </h4>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-agri-600" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {new Date(n.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">{n.message}</p>

                    {/* Footer Actions */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        to={getDeepLink(n)}
                        className="text-xs font-semibold text-agri-700 hover:text-agri-800 inline-flex items-center gap-1 hover:underline"
                      >
                        <span>Open Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <div className="flex items-center gap-2">
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(n.id)}
                            className="text-[11px] h-7 px-2 text-slate-600 hover:text-slate-900"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            <span>Mark Read</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(n.id)}
                          aria-label="Dismiss notification"
                          className="text-[11px] h-7 px-2 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
