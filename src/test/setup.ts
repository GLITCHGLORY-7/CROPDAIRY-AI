import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Ensure unit tests execute in isolated, hermetic Local Storage Mode
// This prevents unit tests from mutating or requiring active network sessions on the live Supabase cloud instance.
vi.stubEnv('VITE_SUPABASE_URL', '');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

// Polyfill window.matchMedia if not present in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
