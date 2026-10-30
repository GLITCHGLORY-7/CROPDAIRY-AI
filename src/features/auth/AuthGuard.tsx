import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-earth-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-agri-700 animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800">Loading CropDiary AI...</h2>
        <p className="text-xs text-slate-500 mt-1">Preparing your farm records</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user hasn't set basic profile state or area unit, guide to onboarding once
  if (profile && !profile.state && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
