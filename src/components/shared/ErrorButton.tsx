import * as Sentry from '@sentry/react';
import { AlertTriangle } from 'lucide-react';

/**
 * Sentry Verification Component
 * Triggered to test real-time exception logging and telemetry dispatch.
 */
export function ErrorButton() {
  return (
    <button
      type="button"
      onClick={() => {
        try {
          Sentry.captureMessage('Sentry test button clicked: Break the world');
        } catch {
          // Continue to error throw
        }
        throw new Error('This is your first error!');
      }}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
      aria-label="Test Sentry error tracking"
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      Break the world
    </button>
  );
}
