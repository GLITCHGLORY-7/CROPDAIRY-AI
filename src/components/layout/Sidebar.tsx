import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Trees,
  Compass,
  ScanEye,
  CloudSun,
  Calendar,
  BookOpen,
  IndianRupee,
  TrendingUp,
  Landmark,
  Bot,
  History,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { name: 'My Farms', path: '/app/farms', icon: Trees },
  { name: 'Smart Crop Planner', path: '/app/crop-planner', icon: Compass },
  { name: 'AI Crop Doctor', path: '/app/crop-doctor', icon: ScanEye },
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

export const Sidebar: React.FC = () => {
  return (
    <aside
      aria-label="Sidebar navigation"
      className="hidden md:flex flex-col w-64 border-r border-slate-200/80 bg-white min-h-[calc(100vh-61px)] p-4 overflow-y-auto"
    >
      <div className="mb-3 px-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Farm Modules
        </span>
      </div>

      <nav role="navigation" aria-label="Main menu" className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group min-h-[44px]',
                  isActive
                    ? 'bg-agri-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-agri-700'
                      )}
                      aria-hidden="true"
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tight',
                        isActive
                          ? 'bg-agri-800 text-agri-100'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 px-3 space-y-2">
        <div className="p-3 rounded-xl bg-earth-100 border border-earth-200 text-xs text-earth-900">
          <div className="font-bold flex items-center gap-1.5 text-earth-900 mb-1">
            🌱 CropDiary AI
          </div>
          <p className="text-[11px] text-earth-800 leading-relaxed">
            Intelligent Farm Companion & Ledger for Indian Agriculture. Offline-Ready & Field Tested.
          </p>
        </div>

        <div className="flex items-center gap-2 px-1 pt-1 text-[11px] text-slate-500 font-medium">
          <span className="text-slate-400">Connection Status</span>
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Online
          </span>
        </div>
      </div>
    </aside>
  );
};
