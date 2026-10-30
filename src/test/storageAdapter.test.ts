import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storageAdapter } from '../services/storageAdapter';
import { farmService } from '../services/farmService';
import { plotService } from '../services/plotService';

let mockSupabaseState = {
  isConfigured: false,
  profileRow: null as any,
  sessionUser: null as any,
};

vi.mock('../services/supabaseClient', () => ({
  get isSupabaseConfigured() {
    return () => mockSupabaseState.isConfigured;
  },
  get supabase() {
    if (!mockSupabaseState.isConfigured) return null;
    return {
      auth: {
        getSession: async () => ({
          data: {
            session: mockSupabaseState.sessionUser ? { user: mockSupabaseState.sessionUser } : null,
          },
        }),
      },
      from: (table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: (_field: string, _val: string) => ({
                maybeSingle: async () => ({
                  data: mockSupabaseState.profileRow,
                  error: null,
                }),
              }),
            }),
            update: (updates: any) => ({
              eq: (_field: string, _val: string) => ({
                select: () => ({
                  maybeSingle: async () => ({
                    data: { ...mockSupabaseState.profileRow, ...updates },
                    error: null,
                  }),
                }),
              }),
            }),
            upsert: (record: any) => ({
              select: () => ({
                single: async () => ({
                  data: { ...mockSupabaseState.profileRow, ...record },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          insert: async () => ({ data: null, error: null }),
          select: () => ({
            eq: () => ({
              data: [],
              error: null,
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        };
      },
    };
  },
}));

describe('Storage & Service Adapter (Local Dev Mode)', () => {
  const userA = 'user-alpha-1111';
  const userB = 'user-beta-2222';

  beforeEach(() => {
    localStorage.clear();
    mockSupabaseState.isConfigured = false;
    mockSupabaseState.profileRow = null;
    mockSupabaseState.sessionUser = null;
  });

  afterEach(() => {
    mockSupabaseState.isConfigured = false;
    mockSupabaseState.profileRow = null;
    mockSupabaseState.sessionUser = null;
  });

  it('enforces tenant data isolation between users', async () => {
    // User A creates a farm
    const farmA = await storageAdapter.createFarm(userA, {
      name: 'Farm Alpha',
      country: 'India',
      state: 'Tamil Nadu',
      district: 'Thanjavur',
      area: 5.0,
      area_unit: 'Acres',
      farming_type: 'Open field',
      soil_type: 'Clay Loam',
      irrigation_method: 'Drip',
      water_availability: 'Adequate',
      status: 'active',
    });

    // User B should NOT see User A's farm
    const farmsB = await storageAdapter.getFarms(userB);
    expect(farmsB.length).toBe(0);

    // User A should see their farm
    const farmsA = await storageAdapter.getFarms(userA);
    expect(farmsA.length).toBe(1);
    expect(farmsA[0].id).toBe(farmA.id);

    // User B cannot fetch Farm A by ID
    const unauthorizedAccess = await storageAdapter.getFarmById(userB, farmA.id);
    expect(unauthorizedAccess).toBeNull();
  });

  it('creates and retrieves plots bound to parent farm', async () => {
    const farm = await storageAdapter.createFarm(userA, {
      name: 'Delta Paddy Estate',
      country: 'India',
      state: 'Tamil Nadu',
      district: 'Thanjavur',
      area: 6.0,
      area_unit: 'Acres',
      farming_type: 'Open field',
      soil_type: 'Clay Loam',
      irrigation_method: 'Borewell Canal',
      water_availability: 'Adequate',
      status: 'active',
    });

    const plot1 = await storageAdapter.createPlot(userA, {
      farm_id: farm.id,
      name: 'Block 1 - Samba Season',
      area: 2.5,
      area_unit: 'Acres',
      soil_type: 'Clay',
      irrigation_method: 'Flood/Furrow',
      farming_environment: 'Open field',
      status: 'active',
    });

    const plot2 = await storageAdapter.createPlot(userA, {
      farm_id: farm.id,
      name: 'Block 2 - Kuruvai Nursery',
      area: 1.0,
      area_unit: 'Acres',
      soil_type: 'Sandy Loam',
      irrigation_method: 'Drip',
      farming_environment: 'Open field',
      status: 'active',
    });

    const plots = await storageAdapter.getPlots(userA, farm.id);
    expect(plots.length).toBe(2);
    expect(plots.map((p) => p.name)).toContain('Block 1 - Samba Season');
    expect(plots.map((p) => p.name)).toContain('Block 2 - Kuruvai Nursery');
  });

  it('rejects plot creation with excessive area exceeding parent farm', async () => {
    const farm = await farmService.createFarm(userA, {
      name: 'Small Holding',
      country: 'India',
      state: 'Tamil Nadu',
      district: 'Thanjavur',
      area: 2.0,
      area_unit: 'Acres',
      farming_type: 'Open field',
      soil_type: 'Red Soil',
      irrigation_method: 'Rainfed',
      water_availability: 'Seasonal',
      status: 'active',
    });

    // Try to create a 5-acre plot on a 2-acre farm
    await expect(
      plotService.createPlot(userA, {
        farm_id: farm.id,
        name: 'Oversized Plot',
        area: 5.0,
        area_unit: 'Acres',
        soil_type: 'Red Soil',
        irrigation_method: 'Rainfed',
        farming_environment: 'Open field',
        status: 'active',
      })
    ).rejects.toThrow(/exceeds parent farm area/i);
  });

  it('cascades deletion of plots when parent farm is deleted', async () => {
    const farm = await storageAdapter.createFarm(userA, {
      name: 'Temporary Farm',
      country: 'India',
      state: 'Tamil Nadu',
      district: 'Thanjavur',
      area: 3.0,
      area_unit: 'Acres',
      farming_type: 'Open field',
      soil_type: 'Clay',
      irrigation_method: 'Drip',
      water_availability: 'Adequate',
      status: 'active',
    });

    await storageAdapter.createPlot(userA, {
      farm_id: farm.id,
      name: 'Temp Plot 1',
      area: 1.0,
      area_unit: 'Acres',
      soil_type: 'Clay',
      irrigation_method: 'Drip',
      farming_environment: 'Open field',
      status: 'active',
    });

    // Delete the farm
    await storageAdapter.deleteFarm(userA, farm.id);

    // Verify farm is deleted
    const farms = await storageAdapter.getFarms(userA);
    expect(farms.length).toBe(0);

    // Verify plots are cascaded
    const plots = await storageAdapter.getPlots(userA, farm.id);
    expect(plots.length).toBe(0);
  });

  it('toggles farm and plot status between active and archived', async () => {
    const farm = await farmService.createFarm(userA, {
      name: 'Active/Archive Farm',
      country: 'India',
      state: 'Tamil Nadu',
      district: 'Thanjavur',
      area: 4.0,
      area_unit: 'Acres',
      farming_type: 'Open field',
      soil_type: 'Clay',
      irrigation_method: 'Drip',
      water_availability: 'Adequate',
      status: 'active',
    });

    expect(farm.status).toBe('active');

    const archived = await farmService.toggleFarmStatus(userA, farm.id, 'active');
    expect(archived.status).toBe('archived');

    const restored = await farmService.toggleFarmStatus(userA, farm.id, 'archived');
    expect(restored.status).toBe('active');
  });

  it('guarantees resilient profile upsert and get without RLS exceptions', async () => {
    // 1. Initial profile creation (e.g. unconfirmed email / onboarding)
    const profile = await storageAdapter.upsertProfile({
      id: userA,
      display_name: 'Murugan Farmer',
      preferred_language: 'ta',
      state: 'Tamil Nadu',
      district: 'Thanjavur',
      preferred_area_unit: 'Acres',
      farming_experience: '5-10 years',
      primary_farming_type: 'Open field',
    });

    expect(profile).toBeDefined();
    expect(profile.id).toBe(userA);
    expect(profile.display_name).toBe('Murugan Farmer');
    expect(profile.preferred_language).toBe('ta');
    expect(profile.district).toBe('Thanjavur');

    // 2. Fetch profile returns saved preferences
    const fetched = await storageAdapter.getProfile(userA);
    expect(fetched).not.toBeNull();
    expect(fetched?.display_name).toBe('Murugan Farmer');
    expect(fetched?.preferred_language).toBe('ta');

    // 3. Partial update preserves existing fields
    const updated = await storageAdapter.upsertProfile({
      id: userA,
      district: 'Tiruvarur',
    });

    expect(updated.district).toBe('Tiruvarur');
    expect(updated.display_name).toBe('Murugan Farmer');
    expect(updated.preferred_language).toBe('ta');
    expect(updated.state).toBe('Tamil Nadu');
  });

  it('preserves valid local onboarding fields when authenticated Supabase response contains SQL NULL fields', async () => {
    // 1. User registers and completes onboarding locally (e.g. while email is pending confirmation)
    await storageAdapter.upsertProfile({
      id: userA,
      display_name: 'Murugan Farmer',
      preferred_language: 'ta',
      state: 'Tamil Nadu',
      district: 'Thanjavur',
      preferred_area_unit: 'Acres',
      farming_experience: '5-10 years',
      primary_farming_type: 'Open field',
    });

    // 2. User confirms email and authenticates. Cloud trigger (handle_new_user) provisioned a row
    // where state, district, farming_experience, and primary_farming_type are SQL NULL.
    mockSupabaseState.isConfigured = true;
    mockSupabaseState.sessionUser = { id: userA, email: 'murugan@example.com' };
    mockSupabaseState.profileRow = {
      id: userA,
      display_name: 'Farmer', // Database trigger default fallback
      preferred_language: 'ta',
      country: 'India',
      preferred_area_unit: 'Acres',
      state: null, // SQL NULL
      district: null, // SQL NULL
      farming_experience: null, // SQL NULL
      primary_farming_type: null, // SQL NULL
      created_at: '2026-10-26T00:00:00Z',
      updated_at: '2026-10-26T00:00:00Z',
    };

    // 3. storageAdapter.getProfile is invoked upon sign-in
    const mergedProfile = await storageAdapter.getProfile(userA);

    expect(mergedProfile).not.toBeNull();
    // Valid local onboarding fields must NOT be overwritten by cloud nulls:
    expect(mergedProfile?.state).toBe('Tamil Nadu');
    expect(mergedProfile?.district).toBe('Thanjavur');
    expect(mergedProfile?.farming_experience).toBe('5-10 years');
    expect(mergedProfile?.primary_farming_type).toBe('Open field');
    // Meaningful local display_name is not replaced by generic 'Farmer' trigger default
    expect(mergedProfile?.display_name).toBe('Murugan Farmer');
  });

  it('does not overwrite intentional server-side changes when cloud returns non-null values', async () => {
    // 1. Initial local profile
    await storageAdapter.upsertProfile({
      id: userA,
      display_name: 'Murugan Farmer',
      preferred_language: 'ta',
      state: 'Tamil Nadu',
      district: 'Thanjavur',
      preferred_area_unit: 'Acres',
      farming_experience: '5-10 years',
      primary_farming_type: 'Open field',
    });

    // 2. An intentional update occurred on the server (e.g. through another device or portal)
    mockSupabaseState.isConfigured = true;
    mockSupabaseState.sessionUser = { id: userA, email: 'murugan@example.com' };
    mockSupabaseState.profileRow = {
      id: userA,
      display_name: 'Murugan Farmer Pro',
      preferred_language: 'ta',
      country: 'India',
      preferred_area_unit: 'Hectares',
      state: 'Tamil Nadu',
      district: 'Madurai', // Intentionally updated district
      farming_experience: '10+ years', // Intentionally updated experience
      primary_farming_type: 'Orchard', // Intentionally updated farming type
      created_at: '2026-10-26T00:00:00Z',
      updated_at: '2026-10-28T12:00:00Z',
    };

    // 3. storageAdapter.getProfile should accept intentional cloud updates
    const mergedProfile = await storageAdapter.getProfile(userA);

    expect(mergedProfile).not.toBeNull();
    expect(mergedProfile?.display_name).toBe('Murugan Farmer Pro');
    expect(mergedProfile?.district).toBe('Madurai');
    expect(mergedProfile?.farming_experience).toBe('10+ years');
    expect(mergedProfile?.primary_farming_type).toBe('Orchard');
    expect(mergedProfile?.preferred_area_unit).toBe('Hectares');
  });
});
