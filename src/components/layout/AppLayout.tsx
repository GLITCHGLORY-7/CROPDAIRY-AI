import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-earth-50 flex flex-col text-slate-900">
      <TopNav />
      <div className="flex-1 flex w-full">
        <Sidebar />
        <main
          role="main"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-12 overflow-x-hidden"
        >
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
};
