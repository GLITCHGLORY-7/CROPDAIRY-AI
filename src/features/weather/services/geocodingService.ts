// CropDiary AI — Geocoding & Farm Location Coordinate Resolver
// Provides real-time Open-Meteo geocoding search and Indian agricultural district fallback coordinates.

import { GeocodingResult } from '@/types/weather';

export const INDIAN_DISTRICT_COORDINATES: Record<string, { lat: number; lon: number; state: string }> = {
  // Tamil Nadu
  coimbatore: { lat: 11.0168, lon: 76.9558, state: 'Tamil Nadu' },
  thanjavur: { lat: 10.7870, lon: 79.1378, state: 'Tamil Nadu' },
  madurai: { lat: 9.9252, lon: 78.1198, state: 'Tamil Nadu' },
  tiruchirappalli: { lat: 10.7905, lon: 78.7047, state: 'Tamil Nadu' },
  salem: { lat: 11.6643, lon: 78.1460, state: 'Tamil Nadu' },
  erode: { lat: 11.3410, lon: 77.7172, state: 'Tamil Nadu' },
  tirunelveli: { lat: 8.7139, lon: 77.7567, state: 'Tamil Nadu' },
  thiruvarur: { lat: 10.7661, lon: 79.6344, state: 'Tamil Nadu' },
  nagapattinam: { lat: 10.7672, lon: 79.8449, state: 'Tamil Nadu' },
  dindigul: { lat: 10.3673, lon: 77.9803, state: 'Tamil Nadu' },
  dharmapuri: { lat: 12.1211, lon: 78.1582, state: 'Tamil Nadu' },
  vellore: { lat: 12.9165, lon: 79.1325, state: 'Tamil Nadu' },
  cuddalore: { lat: 11.7480, lon: 79.7714, state: 'Tamil Nadu' },
  villupuram: { lat: 11.9401, lon: 79.4861, state: 'Tamil Nadu' },
  theni: { lat: 10.0104, lon: 77.4768, state: 'Tamil Nadu' },
  chengalpattu: { lat: 12.6841, lon: 79.9836, state: 'Tamil Nadu' },

  // Andhra Pradesh & Telangana
  guntur: { lat: 16.3067, lon: 80.4365, state: 'Andhra Pradesh' },
  krishna: { lat: 16.1875, lon: 81.1389, state: 'Andhra Pradesh' },
  kurnool: { lat: 15.8281, lon: 78.0373, state: 'Andhra Pradesh' },
  warangal: { lat: 17.9689, lon: 79.5941, state: 'Telangana' },

  // Karnataka
  mandya: { lat: 12.5244, lon: 76.8970, state: 'Karnataka' },
  mysuru: { lat: 12.2958, lon: 76.6394, state: 'Karnataka' },
  belagavi: { lat: 15.8497, lon: 74.4977, state: 'Karnataka' },
  dharwad: { lat: 15.4589, lon: 75.0078, state: 'Karnataka' },

  // Maharashtra
  pune: { lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
  nashik: { lat: 19.9975, lon: 73.7898, state: 'Maharashtra' },
  solapur: { lat: 17.6599, lon: 75.9064, state: 'Maharashtra' },
  amravati: { lat: 20.9320, lon: 77.7523, state: 'Maharashtra' },

  // Punjab & Haryana
  ludhiana: { lat: 30.9010, lon: 75.8573, state: 'Punjab' },
  patiala: { lat: 30.3398, lon: 76.3869, state: 'Punjab' },
  karnal: { lat: 29.6857, lon: 76.9905, state: 'Haryana' },
  hisar: { lat: 29.1492, lon: 75.7217, state: 'Haryana' },

  // Uttar Pradesh & Bihar
  varanasi: { lat: 25.3176, lon: 82.9739, state: 'Uttar Pradesh' },
  meerut: { lat: 28.9845, lon: 77.7064, state: 'Uttar Pradesh' },
  patna: { lat: 25.5941, lon: 85.1376, state: 'Bihar' },
};

export const geocodingService = {
  /**
   * Resolves approximate coordinates from district/state names when farm GPS coordinates are unset.
   */
  getFallbackCoordinates(district?: string, _state?: string): { lat: number; lon: number; source: string } {
    if (district) {
      const cleanDistrict = district.trim().toLowerCase();
      if (INDIAN_DISTRICT_COORDINATES[cleanDistrict]) {
        const match = INDIAN_DISTRICT_COORDINATES[cleanDistrict];
        return {
          lat: match.lat,
          lon: match.lon,
          source: `District Centroid (${district}, ${match.state})`,
        };
      }
    }

    // Default to central Tamil Nadu agricultural belt if unspecified
    return {
      lat: 11.0168,
      lon: 76.9558,
      source: 'Regional Center (Coimbatore, Tamil Nadu)',
    };
  },

  /**
   * Searches locations via Open-Meteo geocoding API.
   */
  async searchLocations(query: string): Promise<GeocodingResult[]> {
    if (!query || query.trim().length < 2) return [];

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query.trim()
    )}&count=6&language=en&format=json`;

    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.results || !Array.isArray(data.results)) return [];

      return data.results.map((r: any) => ({
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        country: r.country,
        admin1: r.admin1,
        admin2: r.admin2,
        country_code: r.country_code,
      }));
    } catch {
      return [];
    }
  },
};
