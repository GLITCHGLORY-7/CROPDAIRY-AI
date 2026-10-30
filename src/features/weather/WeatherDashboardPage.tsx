// CropDiary AI — Weather Intelligence & Agricultural Alerts Dashboard
// Real-time WMO weather models, ICAR/TNAU deterministic rule alerts, and operational spray windows.

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { storageAdapter } from '@/services/storageAdapter';
import { weatherService } from './services/weatherService';
import { geocodingService } from './services/geocodingService';
import { agriculturalAlertEngine } from './services/agriculturalAlertEngine';
import { reminderService } from './services/reminderService';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { WeatherForecast, FarmWeatherAlert } from '@/types/weather';
import { CurrentWeatherCard } from './components/CurrentWeatherCard';
import { HourlyForecastList } from './components/HourlyForecastList';
import { DailyForecastCard } from './components/DailyForecastCard';
import { AgriculturalAlertsList } from './components/AgriculturalAlertsList';
import { SprayWindowCard } from './components/SprayWindowCard';
import { LocationPickerModal } from './components/LocationPickerModal';
import { ReminderFormModal } from './components/ReminderFormModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  CloudSun,
  MapPin,
  RefreshCw,
  PlusCircle,
  Stethoscope,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export const WeatherDashboardPage: React.FC = () => {
  const { farmId: routeFarmId } = useParams<{ farmId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [_cropPlans, setCropPlans] = useState<CropPlan[]>([]);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [alerts, setAlerts] = useState<FarmWeatherAlert[]>([]);
  const [_locationSource, setLocationSource] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // 1. Load initial user farms
  const loadFarms = useCallback(async () => {
    if (!user) return;
    try {
      const userFarms = await storageAdapter.getFarms(user.id);
      setFarms(userFarms);

      if (userFarms.length > 0) {
        const active =
          userFarms.find((f) => f.id === routeFarmId) || userFarms[0];
        setSelectedFarm(active);
      } else {
        setSelectedFarm(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load farms.');
    } finally {
      setIsLoading(false);
    }
  }, [user, routeFarmId]);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  // 2. Load weather & run alert engine whenever selectedFarm changes
  const fetchWeatherForFarm = useCallback(
    async (farm: Farm, forceRefresh = false) => {
      if (!user) return;
      setIsRefreshing(true);
      setErrorMessage(null);

      try {
        // Load plots and crop plans for context-aware alerts
        const [farmPlots, allPlans] = await Promise.all([
          storageAdapter.getPlots(farm.id),
          storageAdapter.getCropPlans(user.id),
        ]);
        const activePlans = allPlans.filter((p) => p.farm_id === farm.id);
        setPlots(farmPlots);
        setCropPlans(activePlans);

        // Resolve coordinates
        let lat = farm.latitude ? parseFloat(String(farm.latitude)) : NaN;
        let lon = farm.longitude ? parseFloat(String(farm.longitude)) : NaN;
        let source = 'GPS Field Coordinates';

        if (isNaN(lat) || isNaN(lon)) {
          const fallback = geocodingService.getFallbackCoordinates(
            farm.district,
            farm.state
          );
          lat = fallback.lat;
          lon = fallback.lon;
          source = fallback.source;
        }

        setLocationSource(source);

        // Fetch forecast via provider (with internal 60m caching if not forced)
        const cacheKey = `weather_${lat.toFixed(4)}_${lon.toFixed(4)}`;
        let data: WeatherForecast;
        if (!forceRefresh) {
          const cached = await storageAdapter.getCachedWeather(cacheKey);
          if (cached) {
            data = cached;
          } else {
            data = await weatherService.getForecast(lat, lon);
            await storageAdapter.setCachedWeather(cacheKey, lat, lon, data);
          }
        } else {
          data = await weatherService.getForecast(lat, lon);
          await storageAdapter.setCachedWeather(cacheKey, lat, lon, data);
        }

        setForecast(data);

        // Run ICAR agricultural rule engine
        const evaluatedAlerts = agriculturalAlertEngine.evaluateAlerts({
          farm,
          forecast: data,
          cropPlan: activePlans[0] || null,
        });

        // Save new alerts to storage & notify
        for (const alert of evaluatedAlerts) {
          await storageAdapter.createWeatherAlert(user.id, alert);
        }

        // Retrieve active alerts from DB
        const savedAlerts = await storageAdapter.getWeatherAlerts(user.id, {
          farmId: farm.id,
        });
        setAlerts(savedAlerts.filter((a) => a.status === 'active'));
      } catch (err: any) {
        setErrorMessage(
          err.message || 'Unable to retrieve weather data from Open-Meteo.'
        );
      } finally {
        setIsRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (selectedFarm) {
      fetchWeatherForFarm(selectedFarm);
    }
  }, [selectedFarm, fetchWeatherForFarm]);

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextFarmId = e.target.value;
    const nextFarm = farms.find((f) => f.id === nextFarmId);
    if (nextFarm) {
      setSelectedFarm(nextFarm);
      navigate(`/app/weather/${nextFarm.id}`);
    }
  };

  const handleSaveCoordinates = async (
    farmId: string,
    lat: number,
    lon: number
  ) => {
    if (!user) return;
    await storageAdapter.updateFarm(user.id, farmId, {
      latitude: lat,
      longitude: lon,
    });
    setFarms((prev) =>
      prev.map((f) =>
        f.id === farmId ? { ...f, latitude: lat, longitude: lon } : f
      )
    );
    if (selectedFarm?.id === farmId) {
      const updated = { ...selectedFarm, latitude: lat, longitude: lon };
      setSelectedFarm(updated);
      fetchWeatherForFarm(updated, true);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    if (!user) return;
    await storageAdapter.updateWeatherAlertStatus(user.id, alertId, 'dismissed');
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleCreateReminderSubmit = async (formData: any) => {
    if (!user) return;
    await reminderService.createReminder(user.id, formData);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="w-12 h-12 border-4 border-agri-200 border-t-agri-700 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-700">
          Loading Weather Intelligence Engine...
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Connecting to Open-Meteo agricultural model...
        </p>
      </div>
    );
  }

  if (farms.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Card className="p-8 border-dashed border-2 border-slate-300">
          <CloudSun className="w-16 h-16 text-agri-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">
            No Farm Registered Yet
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Weather Intelligence delivers hyper-local forecasts and ICAR agronomic alerts based on your farm’s exact location and soil type.
          </p>
          <div className="mt-6">
            <Link to="/app/farms">
              <Button variant="primary">Register Your First Farm</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isExactLocation =
    selectedFarm?.latitude != null && selectedFarm?.longitude != null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header & Farm Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-agri-50 text-agri-700 border border-agri-200">
              <CloudSun className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Weather Intelligence & Alerts
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time atmospheric modeling, ICAR agricultural risk advisories, and spraying windows.
          </p>
        </div>

        {/* Farm Selector & Location Status */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="farm-weather-select"
              className="text-xs font-semibold text-slate-700"
            >
              Farm:
            </label>
            <select
              id="farm-weather-select"
              value={selectedFarm?.id || ''}
              onChange={handleFarmChange}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-agri-500"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.district || f.state})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
              isExactLocation
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 animate-pulse'
            }`}
            title="Click to set or refine GPS coordinates"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {isExactLocation ? 'Exact GPS Pinned' : 'Estimated Location'}
            </span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedFarm && fetchWeatherForFarm(selectedFarm, true)}
            isLoading={isRefreshing}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Weather Data Notice</p>
            <p className="mt-0.5">{errorMessage}</p>
            <p className="mt-1 text-slate-600">
              Check your internet connection or verify your farm coordinates.
            </p>
          </div>
        </div>
      )}

      {/* Main Weather Overview Grid */}
      {forecast && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real-time observation card (2 cols on lg) */}
            <div className="lg:col-span-2">
              <CurrentWeatherCard
                forecast={forecast}
                farm={selectedFarm!}
                isCoordinateApproximate={!isExactLocation}
                onRefresh={() => selectedFarm && fetchWeatherForFarm(selectedFarm, true)}
                isRefreshing={isRefreshing}
                onOpenLocationPicker={() => setIsLocationModalOpen(true)}
              />
            </div>

            {/* Spray Window & Action Advisory Card */}
            <div className="space-y-4">
              <SprayWindowCard forecast={forecast} />

              {/* Proactive Quick Actions */}
              <Card className="p-4 bg-slate-50 border-slate-200">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Proactive Farm Operations
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full text-xs justify-start bg-white hover:bg-agri-50 text-slate-700 border-slate-200"
                    onClick={() => setIsReminderModalOpen(true)}
                  >
                    <PlusCircle className="w-4 h-4 text-agri-600 mr-2" />
                    <span>Schedule Weather-Triggered Task</span>
                  </Button>

                  <Link to="/app/crop-doctor" className="block">
                    <Button
                      variant="outline"
                      className="w-full text-xs justify-start bg-white hover:bg-agri-50 text-slate-700 border-slate-200"
                    >
                      <Stethoscope className="w-4 h-4 text-indigo-600 mr-2" />
                      <span>Inspect Crop Health (AI Crop Doctor)</span>
                    </Button>
                  </Link>

                  <Link to="/app/reminders" className="block">
                    <Button
                      variant="outline"
                      className="w-full text-xs justify-start bg-white hover:bg-agri-50 text-slate-700 border-slate-200"
                    >
                      <Calendar className="w-4 h-4 text-amber-600 mr-2" />
                      <span>View All Farm Reminders</span>
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>

          {/* Active Agricultural Alerts Section */}
          <div>
            <AgriculturalAlertsList
              alerts={alerts}
              onDismissAlert={handleDismissAlert}
            />
          </div>

          {/* Hourly Forecast Rail (24 Hours) */}
          <div>
            <HourlyForecastList hourly={forecast.hourly} />
          </div>

          {/* 7-Day Forecast */}
          <div>
            <DailyForecastCard daily={forecast.daily} />
          </div>
        </>
      )}

      {/* Location Picker Modal */}
      {selectedFarm && (
        <LocationPickerModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          farmId={selectedFarm.id}
          farmName={selectedFarm.name}
          currentLat={
            selectedFarm.latitude ? parseFloat(String(selectedFarm.latitude)) : null
          }
          currentLon={
            selectedFarm.longitude ? parseFloat(String(selectedFarm.longitude)) : null
          }
          onSaveCoordinates={handleSaveCoordinates}
        />
      )}

      {/* Reminder Form Modal */}
      {selectedFarm && (
        <ReminderFormModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          onSubmit={handleCreateReminderSubmit}
          farms={farms}
          plots={plots}
          defaultFarmId={selectedFarm.id}
        />
      )}
    </div>
  );
};
