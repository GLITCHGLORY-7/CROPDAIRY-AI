import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sprout, LogOut, Globe, Database, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NotificationDropdown } from '@/features/weather/components/NotificationDropdown';
import { NetworkStatusBar } from '@/components/shared/NetworkStatusBar';
import { IntegrationStatusModal } from '@/components/shared/IntegrationStatusModal';

interface TopNavProps {
  onMobileMenuToggle?: () => void;
}

export const TopNav: React.FC<TopNavProps> = () => {
  const { user, profile, isSupabaseConfigured, signOut } = useAuth();
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  return (
    <>
      <header
        role="banner"
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between"
      >
        {/* Brand logo & title */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-agri-700 text-white flex items-center justify-center shadow-xs">
            <Sprout className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          </div>
          <div>
            <span className="font-bold text-sm sm:text-lg text-slate-900 tracking-tight flex items-center gap-1">
              CropDiary <span className="text-agri-700">AI</span>
            </span>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              Digital Agronomy & Farm Management
            </p>
          </div>
        </div>

        {/* Middle & Right action controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Offline & Sync Network Status */}
          <NetworkStatusBar />

          {/* Connection status button & diagnostics modal trigger */}
          <button
            type="button"
            onClick={() => setShowDiagnostics(true)}
            title="Click to view real-time API integrations, database connectivity, and fallback modes"
            aria-label="View system and integration diagnostics"
            className="cursor-pointer transition-transform hover:scale-[1.02] focus:outline-hidden focus:ring-2 focus:ring-agri-500 rounded-full flex-shrink-0"
          >
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100">
                <Database className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span className="hidden sm:inline">Cloud Synced</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                <span className="hidden sm:inline">Local Storage Mode</span>
              </span>
            )}
          </button>

          {/* Language Indicator */}
          <div
            title="Active vernacular language"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span className="font-semibold uppercase">{profile?.preferred_language || 'EN'}</span>
          </div>

          {/* In-App Notifications Dropdown */}
          {user && <NotificationDropdown />}

          {/* User profile & Logout */}
          {user && (
            <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200">
              <span className="text-xs font-semibold text-slate-700 hidden lg:inline max-w-[120px] truncate">
                {profile?.display_name || user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                aria-label="Sign out of account"
                className="text-slate-600 hover:text-rose-600 min-h-[36px] px-2 sm:px-2.5"
              >
                <LogOut className="w-4 h-4 sm:mr-1" aria-hidden="true" />
                <span className="hidden sm:inline text-xs">Sign Out</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Integration Diagnostics Modal */}
      {showDiagnostics && (
        <IntegrationStatusModal
          isOpen={showDiagnostics}
          onClose={() => setShowDiagnostics(false)}
        />
      )}
    </>
  );
};
