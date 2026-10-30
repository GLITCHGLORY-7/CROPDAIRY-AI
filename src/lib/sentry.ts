// CropDiary AI — Sentry Error Tracking & Observability Service
import * as Sentry from '@sentry/react';

export const isSentryConfigured = (): boolean => {
  const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : ({} as any);
  const dsn = metaEnv?.VITE_SENTRY_DSN;
  return Boolean(dsn && dsn.trim().length > 0 && !dsn.includes('placeholder'));
};

export const initSentry = (): void => {
  const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : ({} as any);
  const dsn = metaEnv?.VITE_SENTRY_DSN;
  if (!dsn || dsn.includes('placeholder')) {
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost', /^https:\/\/.*\.supabase\.co/],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: metaEnv?.VITE_APP_ENV || 'production',
  });
};
