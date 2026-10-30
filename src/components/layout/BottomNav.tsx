import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Trees,
  Compass,
  ScanEye,
  Menu,
  X,
  Settings,
  BookOpen,
  IndianRupee,
  TrendingUp,
  Landmark,
  Bot,
  History,
  CloudSun,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNav: React.FC = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const primaryItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Farms', path: '/app/farms', icon: Trees },
    { name: 'Planner', path: '/app/crop-planner', icon: Compass },
    { name: 'Doctor', path: '/app/crop-doctor', icon: ScanEye },
  ];

  const secondaryItems = [
    { name: 'Weather & Alerts', path: '/app/weather', icon: CloudSun },
    { name: 'Farm Reminders', path: '/app/reminders', icon: Calendar },
    { name: 'Farm Diary', path: '/app/diary', icon: BookOpen },
    { name: 'Finance & P&L', path: '/app/finance', icon: IndianRupee },
    { name: 'Market Prices', path: '/app/market-prices', icon: TrendingUp },
    { name: 'Government Schemes', path: '/app/schemes', icon: Landmark },
    { name: 'AI Farm Assistant', path: '/app/assistant', icon: Bot },
    { name: 'Farm History', path: '/app/history', icon: History },
    { name: 'Settings', path: '/app/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav
        role="navigation"
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg"
      >
        {primaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl text-[11px] font-semibold transition-colors',
                  isActive ? 'text-agri-800 font-bold' : 'text-slate-700 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn('w-5 h-5 mb-0.5', isActive ? 'stroke-[2.5px] text-agri-800' : 'stroke-2 text-slate-700')}
                    aria-hidden="true"
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* More Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          aria-expanded={isMoreOpen}
          aria-label="Toggle all farming modules menu"
          className={cn(
            'flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl text-[11px] font-semibold transition-colors',
            isMoreOpen ? 'text-agri-800 bg-agri-50 font-bold' : 'text-slate-700 hover:text-slate-900'
          )}
        >
          {isMoreOpen ? <X className="w-5 h-5 mb-0.5 text-agri-800" /> : <Menu className="w-5 h-5 mb-0.5 text-slate-700" />}
          <span>More</span>
        </button>
      </nav>

      {/* More Modules Sheet (Mobile Drawer) */}
      {isMoreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="All Farm Modules"
          className="md:hidden fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl p-5 pb-24 border-t border-slate-200 shadow-2xl max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">All Farm Modules</h3>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                aria-label="Close menu"
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreOpen(false)}
                    className="flex flex-col items-start p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-agri-50 hover:border-agri-200 transition-colors"
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <Icon className="w-5 h-5 text-agri-700" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-left">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
