import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { onboardingSchema, OnboardingFormData } from '@/lib/validation/authSchemas';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/context/ToastContext';
import { User, ShieldCheck, LogOut, Trash2, Activity } from 'lucide-react';
import { indexedDbClient } from '@/services/offline/indexedDbClient';
import { IntegrationMatrixCard } from './components/IntegrationMatrixCard';
import { ErrorButton } from '@/components/shared/ErrorButton';
import { isSentryConfigured } from '@/lib/sentry';

export const SettingsPage: React.FC = () => {
  const { user, profile, updateProfile, signOut, isSupabaseConfigured } = useAuth();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: profile?.display_name || '',
      preferredLanguage: profile?.preferred_language || 'en',
      country: profile?.country || 'India',
      state: profile?.state || '',
      district: profile?.district || '',
      preferredAreaUnit: profile?.preferred_area_unit || 'Acres',
      farmingExperience: profile?.farming_experience || '',
      primaryFarmingType: profile?.primary_farming_type || 'Open field',
    },
  });

  const onSubmit = async (data: OnboardingFormData) => {
    await updateProfile({
      display_name: data.displayName,
      preferred_language: data.preferredLanguage,
      country: data.country,
      state: data.state,
      district: data.district,
      preferred_area_unit: data.preferredAreaUnit,
      farming_experience: data.farmingExperience,
      primary_farming_type: data.primaryFarmingType,
    });
  };

  const handleClearDemoData = async () => {
    if (window.confirm('Clear all local farm, plot, diary, and financial records saved in this browser?')) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cropdiary_local_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      if (user?.id) {
        try {
          await indexedDbClient.clearUserData(user.id);
        } catch (e) {
          console.warn('IndexedDB clear deferred:', e);
        }
      }
      showToast('info', 'Local Data Cleared', 'Your browser storage has been reset.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your farmer profile, vernacular language, measurement units, and security.
        </p>
      </div>

      {/* Profile & Regional Settings */}
      <Card className="shadow-xs border-slate-200">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-agri-700" />
              Farmer Profile & Localization
            </CardTitle>
            <CardDescription>
              Customizes unit conversions, localized terminology, and weather defaults.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name / Display Name"
                required
                error={errors.displayName?.message}
                {...register('displayName')}
              />

              <Select
                label="Preferred Language"
                required
                error={errors.preferredLanguage?.message}
                {...register('preferredLanguage')}
              >
                <option value="en">English</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="hi">Hindi (हिन्दी)</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Country"
                required
                error={errors.country?.message}
                {...register('country')}
              />

              <Input
                label="State / Province"
                required
                error={errors.state?.message}
                {...register('state')}
              />

              <Input
                label="District / Locality"
                required
                error={errors.district?.message}
                {...register('district')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Default Land Area Unit"
                required
                helperText="Used across dashboard statistics"
                error={errors.preferredAreaUnit?.message}
                {...register('preferredAreaUnit')}
              >
                <option value="Acres">Acres</option>
                <option value="Hectares">Hectares</option>
                <option value="Bigha">Bigha</option>
                <option value="Guntha">Guntha</option>
              </Select>

              <Select
                label="Farming Experience"
                error={errors.farmingExperience?.message}
                {...register('farmingExperience')}
              >
                <option value="< 2 years">&lt; 2 years (Beginner)</option>
                <option value="2-5 years">2 – 5 years</option>
                <option value="5-10 years">5 – 10 years</option>
                <option value="10+ years">10+ years (Experienced)</option>
              </Select>

              <Select
                label="Primary Farming Type"
                error={errors.primaryFarmingType?.message}
                {...register('primaryFarmingType')}
              >
                <option value="Open field">Open Field</option>
                <option value="Orchard">Orchard / Plantation</option>
                <option value="Greenhouse">Greenhouse / Polyhouse</option>
                <option value="Kitchen garden">Kitchen Garden</option>
                <option value="Mixed farming">Mixed Farming</option>
                <option value="Other">Other</option>
              </Select>
            </div>
          </CardContent>

          <CardFooter className="bg-slate-50 border-t border-slate-100 flex items-center justify-end">
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Save Preferences
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Real Integration Diagnostics Matrix */}
      <IntegrationMatrixCard />

      {/* Sentry Error Tracking & Observability */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Sentry Production Observability & Error Tracking
            </CardTitle>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isSentryConfigured()
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isSentryConfigured() ? 'Sentry DSN Active' : 'Setup Required (VITE_SENTRY_DSN)'}
            </span>
          </div>
          <CardDescription>
            Real-time client telemetry, crash reporting, and frontend exception monitoring powered by Sentry.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600">
            Click the test button below to verify Sentry exception capture. When your{' '}
            <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">
              VITE_SENTRY_DSN
            </code>{' '}
            is configured in your environment, this exception is dispatched directly to your Sentry dashboard.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 gap-3">
            <div>
              <span className="font-bold text-slate-800 block">Sentry Exception Test</span>
              <span className="text-slate-500 text-xs">
                Dispatches a simulated unhandled runtime exception to verify tracing and alert pipelines.
              </span>
            </div>
            <ErrorButton />
          </div>
        </CardContent>
      </Card>

      {/* Account & Security Information */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-agri-700" />
            Account & Security Controls
          </CardTitle>
          <CardDescription>
            Session management and connection details.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-xs sm:text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-2">
            <div>
              <span className="font-bold text-slate-800 block">Registered Email</span>
              <span className="text-slate-500">{user?.email || 'Demo Farmer Account'}</span>
            </div>
            <div className="text-xs text-slate-400">
              User ID: <code className="font-mono text-[11px]">{user?.id}</code>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-2">
            <div>
              <span className="font-bold text-slate-800 block">Database Storage Mode</span>
              <span className="text-slate-500">
                {isSupabaseConfigured
                  ? 'Supabase Cloud PostgreSQL (Row-Level Security Active)'
                  : 'Local Storage Mode (Browser-Isolated Storage & IndexedDB)'}
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 self-start sm:self-auto">
              {isSupabaseConfigured ? 'Remote' : 'Local'}
            </span>
          </div>

          {!isSupabaseConfigured && (
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearDemoData}
                className="text-rose-600 hover:text-rose-800 border-rose-200 hover:bg-rose-50 gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Reset Local Demo Records
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">End your active farming session</span>
          <Button type="button" variant="destructive" size="md" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
