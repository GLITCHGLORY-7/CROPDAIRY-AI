import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { farmService } from '@/services/farmService';
import { storageAdapter } from '@/services/storageAdapter';
import { openMeteoProvider } from '@/features/weather/services/openMeteoProvider';
import { geocodingService } from '@/features/weather/services/geocodingService';
import { StatCard } from '@/components/shared/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { FarmFormModal } from '@/features/farms/FarmFormModal';
import { FarmFormData } from '@/lib/validation/farmSchemas';
import { useToast } from '@/context/ToastContext';
import { convertToAcres, convertFromAcres, formatArea, formatDate } from '@/lib/formatters';
import {
  Trees,
  Layers,
  MapPin,
  Plus,
  ArrowRight,
  Compass,
  BookOpen,
  IndianRupee,
  Sun,
  CloudSun,
  CloudRain,
  Droplets,
  Wind,
  Sprout,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);

  // 1. Fetch real saved farms with plots
  const { data: farms = [], isLoading: isFarmsLoading } = useQuery({
    queryKey: ['farms', user?.id],
    queryFn: () => (user ? farmService.getFarmsWithPlots(user.id) : []),
    enabled: Boolean(user),
  });

  // 2. Fetch active crop plans
  const { data: cropPlans = [] } = useQuery({
    queryKey: ['crop-plans', user?.id],
    queryFn: () => (user ? storageAdapter.getCropPlans(user.id) : []),
    enabled: Boolean(user),
  });

  // 3. Fetch recent farm diary activities
  const { data: recentActivities = [], isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['recent-activities', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const entries = await storageAdapter.getDiaryEntries(user.id, { sortOrder: 'newest' });
      return entries.slice(0, 4);
    },
    enabled: Boolean(user),
  });

  // 4. Fetch upcoming pending reminders
  const { data: upcomingReminders = [], isLoading: isRemindersLoading } = useQuery({
    queryKey: ['upcoming-reminders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const items = await storageAdapter.getReminders(user.id, { status: 'pending' });
      return items.slice(0, 4);
    },
    enabled: Boolean(user),
  });

  // Create farm mutation
  const createFarmMutation = useMutation({
    mutationFn: (data: FarmFormData) => {
      if (!user) throw new Error('Unauthorized');
      return farmService.createFarm(user.id, data);
    },
    onSuccess: (newFarm) => {
      queryClient.invalidateQueries({ queryKey: ['farms', user?.id] });
      showToast('success', 'Farm Registered', `"${newFarm.name}" added to your account.`);
    },
    onError: (err: any) => {
      showToast('error', 'Error', err.message);
    },
  });

  // Calculations
  const activeFarms = farms.filter((f) => f.status === 'active');
  const allPlots = farms.flatMap((f) => f.plots || []);
  const activePlots = allPlots.filter((p) => p.status === 'active');
  const preferredUnit = profile?.preferred_area_unit || 'Acres';

  const totalAreaInAcres = activeFarms.reduce(
    (acc, farm) => acc + convertToAcres(farm.area, farm.area_unit),
    0
  );
  const displayTotalArea = convertFromAcres(totalAreaInAcres, preferredUnit);
  const primaryFarm = activeFarms[0];

  // 5. Fetch weather for primary farm or default location
  const { data: weatherData } = useQuery({
    queryKey: ['dashboard-weather', primaryFarm?.id, profile?.district],
    queryFn: async () => {
      let lat = primaryFarm?.latitude ? parseFloat(String(primaryFarm.latitude)) : NaN;
      let lon = primaryFarm?.longitude ? parseFloat(String(primaryFarm.longitude)) : NaN;
      const locDistrict = primaryFarm?.district || profile?.district || 'Thanjavur';
      const locState = primaryFarm?.state || profile?.state || 'Tamil Nadu';

      if (isNaN(lat) || isNaN(lon)) {
        const fallback = geocodingService.getFallbackCoordinates(locDistrict, locState);
        lat = fallback.lat;
        lon = fallback.lon;
      }

      try {
        const cacheKey = `weather_${lat.toFixed(4)}_${lon.toFixed(4)}`;
        const cached = await storageAdapter.getCachedWeather(cacheKey);
        if (cached) return { forecast: cached, district: locDistrict, state: locState };
        const fresh = await openMeteoProvider.getForecast(lat, lon);
        await storageAdapter.setCachedWeather(cacheKey, lat, lon, fresh);
        return { forecast: fresh, district: locDistrict, state: locState };
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 15, // 15 mins
  });

  // Greeting logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatActivityTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `Today, ${timeStr}`;
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeStr}`;
      return `${formatDate(dateStr)}, ${timeStr}`;
    } catch {
      return dateStr;
    }
  };

  const getEntryBadge = (type: string) => {
    switch (type) {
      case 'irrigation':
        return { label: 'Water', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'input_application':
        return { label: 'Input', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'crop_observation':
        return { label: 'Protection', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'expense':
        return { label: 'Expense', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'harvest':
        return { label: 'Harvest', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: 'Activity', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header Greeting & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()}, {profile?.display_name || 'Rajesh Kumar'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here's what's happening with your farms today.
          </p>
        </div>
      </div>

      {/* 2. Top Highlights Row: Weather Card (Left) & Farming Journey Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Weather Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-2xs">
                {weatherData?.forecast?.current.precipitation_mm && weatherData.forecast.current.precipitation_mm > 0 ? (
                  <CloudRain className="w-8 h-8" aria-hidden="true" />
                ) : weatherData?.forecast?.current.cloud_cover_pct && weatherData.forecast.current.cloud_cover_pct > 30 ? (
                  <CloudSun className="w-8 h-8" aria-hidden="true" />
                ) : (
                  <Sun className="w-8 h-8" aria-hidden="true" />
                )}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {weatherData?.forecast ? Math.round(weatherData.forecast.current.temperature_c) : 28}°C
                  </span>
                  <span className="text-sm font-semibold text-slate-600">
                    {weatherData?.forecast?.current.weather_description || 'Partly Cloudy'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>
                    {weatherData ? `${weatherData.district}, ${weatherData.state}` : `${profile?.district || 'Thanjavur'}, ${profile?.state || 'Tamil Nadu'}`}
                  </span>
                </p>
              </div>
            </div>

            {/* Weather Metrics */}
            <div className="flex sm:flex-col gap-4 sm:gap-1.5 text-xs text-slate-600 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
                  Humidity:
                </span>
                <span className="font-bold text-slate-800">
                  {weatherData?.forecast ? `${weatherData.forecast.current.relative_humidity_pct}%` : '78%'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-cyan-500" aria-hidden="true" />
                  Rainfall:
                </span>
                <span className="font-bold text-slate-800">
                  {weatherData?.forecast ? `${weatherData.forecast.current.precipitation_mm} mm` : '0 mm'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  Wind:
                </span>
                <span className="font-bold text-slate-800">
                  {weatherData?.forecast ? `${Math.round(weatherData.forecast.current.wind_speed_kmh)} km/h` : '12 km/h'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
            <Link
              to="/app/weather"
              className="text-xs font-bold text-agri-700 hover:text-agri-800 inline-flex items-center gap-1 group"
            >
              <span>View Forecast</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Your Farming Journey Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-agri-50 to-emerald-50/70 rounded-2xl p-5 border border-agri-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 z-10">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-agri-800">
                <Sprout className="w-4 h-4 text-agri-600" aria-hidden="true" />
                Your Farming Journey
              </span>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xs leading-relaxed">
                {activeFarms.length === 0
                  ? 'Complete your farm setup to get personalized recommendations.'
                  : cropPlans.length === 0
                  ? 'Add a crop plan for your plots to enable AI yield & advisory insights.'
                  : 'Your active plots are being monitored. Keep logging field activities for best yield tracking.'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-agri-100 border border-agri-200 text-agri-700 flex items-center justify-center flex-shrink-0 shadow-2xs z-10">
              <Sprout className="w-7 h-7" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-4 pt-2 z-10">
            {activeFarms.length === 0 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsAddFarmOpen(true)}
                className="text-xs font-bold gap-1.5"
              >
                <span>Set Up Farm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : cropPlans.length === 0 ? (
              <Link to="/app/crop-planner">
                <Button variant="primary" size="sm" className="text-xs font-bold gap-1.5">
                  <span>Create Crop Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            ) : (
              <Link to="/app/diary/new">
                <Button variant="primary" size="sm" className="text-xs font-bold gap-1.5">
                  <span>Log Activity</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 3. Aggregate Statistics Grid (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          label="Total Farms"
          value={isFarmsLoading ? '...' : activeFarms.length}
          subtext={activeFarms.length > 0 ? `${farms.length - activeFarms.length} archived` : 'Ready to register'}
          icon={Trees}
          variant="agri"
        />
        <StatCard
          label="Total Plots"
          value={isFarmsLoading ? '...' : activePlots.length}
          subtext={cropPlans.length > 0 ? `${cropPlans.length} active crop plans` : 'Ready for crop planning'}
          icon={Layers}
          variant="earth"
        />
        <StatCard
          label="Total Land Area"
          value={isFarmsLoading ? '...' : formatArea(displayTotalArea, preferredUnit)}
          subtext={`Standardized in ${preferredUnit}`}
          icon={MapPin}
          variant="neutral"
        />
      </div>

      {/* 4. Middle Section: Active Farm (Left) & Quick Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Farm */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Active Farm
            </h2>
            {activeFarms.length > 1 && (
              <Link to="/app/farms" className="text-xs font-bold text-agri-700 hover:underline">
                View All ({activeFarms.length})
              </Link>
            )}
          </div>

          {isFarmsLoading ? (
            <Skeleton className="h-40 w-full rounded-2xl" />
          ) : primaryFarm ? (
            <Card className="p-4 sm:p-5 hover:border-slate-300 transition-all shadow-xs overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Farm Thumbnail */}
                <div className="w-full sm:w-32 h-28 sm:h-28 rounded-xl bg-gradient-to-tr from-agri-800 to-agri-600 flex items-center justify-center text-white flex-shrink-0 relative overflow-hidden shadow-2xs">
                  <div className="absolute inset-0 bg-cover bg-center opacity-80"
                    style={{
                      backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop&q=70')`,
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center">
                    <Trees className="w-8 h-8 text-white drop-shadow-md" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white mt-1 drop-shadow-sm">
                      Field Plot
                    </span>
                  </div>
                </div>

                {/* Farm Metadata */}
                <div className="flex-1 space-y-1.5 w-full">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900">
                      {primaryFarm.name}
                    </h3>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {[primaryFarm.village, primaryFarm.district, primaryFarm.state].filter(Boolean).join(', ') || 'Tamil Nadu, India'}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    • {primaryFarm.plots?.length || 0} Plots • {formatArea(primaryFarm.area, primaryFarm.area_unit)} • {primaryFarm.soil_type}
                  </p>

                  <div className="pt-2 flex items-center justify-end">
                    <Link to={`/app/farms/${primaryFarm.id}`}>
                      <Button variant="outline" size="sm" className="text-xs font-semibold gap-1">
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 border-dashed border-slate-300 rounded-2xl bg-white text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-agri-50 text-agri-700 flex items-center justify-center mx-auto border border-agri-200">
                <Trees className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Register Your First Farm</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add your land area, soil profile, and irrigation system to unlock AI agronomy, weather alerts, and crop planning.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddFarmOpen(true)}
                className="gap-1.5 text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Register First Farm</span>
              </Button>
            </Card>
          )}
        </div>

        {/* Right: Quick Actions */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Quick Actions
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Add Farm */}
            <button
              type="button"
              onClick={() => setIsAddFarmOpen(true)}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-agri-50/60 hover:border-agri-300 transition-all text-left shadow-2xs group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-100 transition-colors flex-shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs sm:text-sm font-bold text-slate-800 group-hover:text-agri-800">
                  Add Farm
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:block">Register land</span>
              </div>
            </button>

            {/* Create Crop Plan */}
            <Link
              to="/app/crop-planner"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-blue-50/60 hover:border-blue-300 transition-all text-left shadow-2xs group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-800">
                  Create Crop Plan
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:block">AI recommendations</span>
              </div>
            </Link>

            {/* Log Activity */}
            <Link
              to="/app/diary/new"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-amber-50/60 hover:border-amber-300 transition-all text-left shadow-2xs group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-100 transition-colors flex-shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs sm:text-sm font-bold text-slate-800 group-hover:text-amber-800">
                  Log Activity
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:block">Field operations</span>
              </div>
            </Link>

            {/* Record Expense */}
            <Link
              to="/app/diary/new?tab=expense"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-purple-50/60 hover:border-purple-300 transition-all text-left shadow-2xs group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-100 transition-colors flex-shrink-0">
                <IndianRupee className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs sm:text-sm font-bold text-slate-800 group-hover:text-purple-800">
                  Record Expense
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:block">Track inputs & costs</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Bottom Section: Recent Activities (Left) & Upcoming Reminders (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Recent Activities
            </h2>
            <Link to="/app/diary" className="text-xs font-bold text-agri-700 hover:underline">
              View All
            </Link>
          </div>

          <Card className="divide-y divide-slate-100 shadow-xs overflow-hidden">
            {isActivitiesLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((entry) => {
                const badge = getEntryBadge(entry.entry_type);
                return (
                  <div
                    key={entry.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                        {entry.entry_type === 'irrigation' ? (
                          <Droplets className="w-4 h-4 text-blue-600" />
                        ) : entry.entry_type === 'expense' ? (
                          <IndianRupee className="w-4 h-4 text-rose-600" />
                        ) : entry.entry_type === 'crop_observation' ? (
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Sprout className="w-4 h-4 text-agri-700" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                          {entry.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatActivityTime(entry.occurred_at || entry.created_at)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider flex-shrink-0 ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No recent activities logged yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Record irrigation, fertilizer application, or expenses to build your digital diary.
                </p>
                <Link to="/app/diary/new" className="inline-block pt-1">
                  <Button variant="outline" size="sm" className="text-xs">
                    Log Activity
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Upcoming Reminders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Upcoming Reminders
            </h2>
            <Link to="/app/reminders" className="text-xs font-bold text-agri-700 hover:underline">
              View All
            </Link>
          </div>

          <Card className="divide-y divide-slate-100 shadow-xs overflow-hidden">
            {isRemindersLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : upcomingReminders.length > 0 ? (
              upcomingReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                        {reminder.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatActivityTime(reminder.due_date)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-200 capitalize">
                    {reminder.category}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No pending farm reminders</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Scheduled spray windows, irrigation reminders, and crop alerts will appear here.
                </p>
                <Link to="/app/reminders" className="inline-block pt-1">
                  <Button variant="outline" size="sm" className="text-xs">
                    View Reminders
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Create Farm Modal */}
      <FarmFormModal
        isOpen={isAddFarmOpen}
        onClose={() => setIsAddFarmOpen(false)}
        onSubmit={async (data) => {
          await createFarmMutation.mutateAsync(data);
        }}
        isLoading={createFarmMutation.isPending}
      />
    </div>
  );
};
