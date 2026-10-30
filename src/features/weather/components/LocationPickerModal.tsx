// CropDiary AI — Farm Location & GPS Coordinate Picker Modal
// Enables farmers to pin exact coordinates using search, district lists, or browser GPS.

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Search,
  Crosshair,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  geocodingService,
  INDIAN_DISTRICT_COORDINATES,
} from '../services/geocodingService';
import { GeocodingResult } from '@/types/weather';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
  farmName: string;
  currentLat?: number | null;
  currentLon?: number | null;
  onSaveCoordinates: (farmId: string, lat: number, lon: number) => Promise<void>;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  farmId,
  farmName,
  currentLat,
  currentLon,
  onSaveCoordinates,
}) => {
  const [latInput, setLatInput] = useState<string>(
    currentLat ? currentLat.toString() : ''
  );
  const [lonInput, setLonInput] = useState<string>(
    currentLon ? currentLon.toString() : ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setIsSearching(true);
    setErrorMessage(null);
    try {
      const results = await geocodingService.searchLocations(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setErrorMessage('No matching locations found. Try district or city name.');
      }
    } catch {
      setErrorMessage('Search request failed. Please check internet connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (r: GeocodingResult) => {
    setLatInput(r.latitude.toFixed(6));
    setLonInput(r.longitude.toFixed(6));
    setSearchResults([]);
    setSearchQuery(`${r.name}, ${r.admin1 || ''}`);
  };

  const handleDistrictSelect = (districtKey: string) => {
    const item = INDIAN_DISTRICT_COORDINATES[districtKey];
    if (item) {
      setLatInput(item.lat.toFixed(6));
      setLonInput(item.lon.toFixed(6));
      setSearchQuery(`${districtKey.toUpperCase()}, ${item.state}`);
      setSearchResults([]);
    }
  };

  const handleUseBrowserGPS = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setLatInput(pos.coords.latitude.toFixed(6));
        setLonInput(pos.coords.longitude.toFixed(6));
      },
      (err) => {
        setIsLocating(false);
        setErrorMessage(
          err.message || 'Permission denied or unable to acquire GPS location.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSave = async () => {
    const parsedLat = parseFloat(latInput);
    const parsedLon = parseFloat(lonInput);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setErrorMessage('Latitude must be a valid number between -90 and +90.');
      return;
    }
    if (isNaN(parsedLon) || parsedLon < -180 || parsedLon > 180) {
      setErrorMessage('Longitude must be a valid number between -180 and +180.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await onSaveCoordinates(farmId, parsedLat, parsedLon);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save coordinates.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Set Exact Location for ${farmName}`}
      description="Precise GPS coordinates enable accurate hyper-local Open-Meteo forecasts, microclimate analysis, and spray drift calculations."
      maxWidth="md"
    >
      <div className="space-y-4 text-left">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Browser GPS Quick Action */}
        <div className="flex items-center justify-between p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg">
          <div>
            <p className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-emerald-700" />
              <span>Use Current Device Location</span>
            </p>
            <p className="text-[11px] text-emerald-700">
              Captures your current field coordinates with device GPS.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-800 text-xs shrink-0"
            onClick={handleUseBrowserGPS}
            isLoading={isLocating}
          >
            Locate Me
          </Button>
        </div>

        {/* Location Search Form */}
        <div>
          <label
            htmlFor="location-search-input"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Search District, Town, or Village
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="location-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Thanjavur, Coimbatore, Guntur, Pune..."
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleSearch}
              isLoading={isSearching}
              className="shrink-0"
            >
              <Search className="w-4 h-4 mr-1" />
              <span>Search</span>
            </Button>
          </div>

          {/* Search results list */}
          {searchResults.length > 0 && (
            <ul className="mt-2 border border-slate-200 rounded-md divide-y divide-slate-100 max-h-40 overflow-y-auto bg-white shadow-sm">
              {searchResults.map((res, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => handleSelectResult(res)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-agri-50 transition flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">
                        {res.name}
                      </span>
                      <span className="text-slate-500 ml-1.5">
                        {res.admin1 ? `${res.admin1}, ` : ''}
                        {res.country}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {res.latitude.toFixed(2)}, {res.longitude.toFixed(2)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick District Presets */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Or select Indian Agricultural District Centroid:
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-md">
            {Object.keys(INDIAN_DISTRICT_COORDINATES).map((key) => {
              const item = INDIAN_DISTRICT_COORDINATES[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDistrictSelect(key)}
                  className="px-2 py-0.5 text-[11px] bg-white hover:bg-agri-50 hover:text-agri-700 border border-slate-200 rounded text-slate-700 capitalize transition"
                >
                  {key} ({item.state.slice(0, 2)})
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Coordinates Input */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label
              htmlFor="lat-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Latitude (°N)
            </label>
            <Input
              id="lat-input"
              type="number"
              step="0.000001"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              placeholder="e.g. 10.7870"
            />
          </div>
          <div>
            <label
              htmlFor="lon-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Longitude (°E)
            </label>
            <Input
              id="lon-input"
              type="number"
              step="0.000001"
              value={lonInput}
              onChange={(e) => setLonInput(e.target.value)}
              placeholder="e.g. 79.1378"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-md">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            Open-Meteo uses high-resolution WMO weather models. Saving exact coordinates delivers 1-km micro-forecast accuracy for your field.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!latInput || !lonInput}
          >
            <Check className="w-4 h-4 mr-1.5" />
            <span>Save Coordinates</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
