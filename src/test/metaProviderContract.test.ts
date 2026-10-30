// CropDiary AI — Meta Model API Provider Contract & Technical Reliability Test Suite
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MetaAssistantAdapter } from '@/features/assistant/services/metaAssistantAdapter';
import { FarmContextPayload } from '@/types/assistant';

let mockInvokeResponse = {
  data: null as any,
  error: null as any,
};
let mockIsConfigured = true;
let mockInvokeFn = vi.fn(async (_fnName: string, _options: any) => mockInvokeResponse);

vi.mock('@/services/supabaseClient', () => ({
  get isSupabaseConfigured() {
    return () => mockIsConfigured;
  },
  get supabase() {
    if (!mockIsConfigured) return null;
    return {
      functions: {
        invoke: (...args: any[]) => mockInvokeFn(...args),
      },
    };
  },
}));

describe('Meta API Provider Contract & Architectural Verification', () => {
  const syntheticFarmContext: FarmContextPayload = {
    farms: [{ id: 'farm-test-1', name: 'Cauvery Bio Farm', location: 'Thanjavur, TN', totalArea: 5.0 }],
    plots: [{ id: 'plot-1', name: 'Main Paddy Plot', area: 5.0, soilType: 'Clay Loam', crop: 'Paddy CR-1009' }],
    activeCropPlans: [{ id: 'plan-1', cropName: 'Paddy CR-1009', season: 'Samba', sowingDate: '2026-08-20' }],
    recentActivities: [{ id: 'act-1', title: 'Neem cake basal application', date: '2026-08-22', category: 'Fertilizing' }],
    recentExpenses: [{ id: 'exp-1', title: 'Organic inputs', amount: 3500, category: 'Fertilizer', date: '2026-08-22' }],
    recentHarvests: [],
    recentSales: [],
    budgets: [],
    weatherAlerts: [{ id: 'alert-1', title: 'Moderate Rain Expected', severity: 'moderate', action: 'Ensure clear drainage' }],
    recentAssessments: [],
  };

  let warnSpy: any;

  beforeEach(() => {
    mockIsConfigured = true;
    mockInvokeResponse = { data: null, error: null };
    mockInvokeFn = vi.fn(async (_fnName: string, _options: any) => mockInvokeResponse);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('Contract-1: Enforces standard chat-completions request format with system instruction & user grounding', async () => {
    let capturedOptions: any = null;
    mockInvokeFn.mockImplementation(async (_fnName: string, options: any) => {
      capturedOptions = options;
      return {
        data: {
          content: 'Recommended: Apply organic neem cake @ 250 kg/ha and maintain 2 cm water level.',
          modelName: 'muse-spark-1.3',
          sources: [{ recordType: 'crop_plan', recordId: 'plan-1', title: 'Paddy CR-1009 Samba Plan' }],
        },
        error: null,
      };
    });

    const adapter = new MetaAssistantAdapter();
    const result = await adapter.generateResponse(
      'What basal fertilizer should I apply for Paddy CR-1009?',
      syntheticFarmContext,
      'en'
    );

    expect(capturedOptions).toBeDefined();
    expect(capturedOptions.body).toHaveProperty('userMessage');
    expect(capturedOptions.body).toHaveProperty('farmContext');
    expect(capturedOptions.body).toHaveProperty('language', 'en');
    expect(capturedOptions.body.farmContext.farms[0].name).toBe('Cauvery Bio Farm');

    expect(result.content).toContain('neem cake');
    expect(result.modelName).toBe('muse-spark-1.3');
    expect(result.usedFarmerRecords).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('Contract-2: Strictly isolates local fallback so a fallback is NEVER counted as a live Meta API response', async () => {
    mockInvokeResponse = {
      data: null,
      error: { context: { status: 503 } },
    };

    const adapter = new MetaAssistantAdapter();
    const result = await adapter.generateResponse(
      'How to control stem borer?',
      syntheticFarmContext,
      'en'
    );

    // CRITICAL: A fallback response MUST NOT claim the live Meta model name
    expect(result.modelName).not.toBe('muse-spark-1.3');
    expect(result.modelName).toBe('cropdiary-icar-local-assistant');
    expect(result.disclaimer).toContain('offline / rulebase mode');
  });

  it('Contract-3: Properly handles HTTP 402 Billing Required without exposing account IDs or crashing', async () => {
    mockInvokeResponse = {
      data: null,
      error: { context: { status: 402 } },
    };

    const adapter = new MetaAssistantAdapter();
    const result = await adapter.generateResponse('Check fertilizer price', syntheticFarmContext, 'en');

    expect(result).toBeDefined();
    expect(result.disclaimer).toContain('offline / rulebase mode');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Billing required')
    );
  });

  it('Contract-4: Properly handles HTTP 429 Rate Limiting with safe cooldown logging', async () => {
    mockInvokeResponse = {
      data: null,
      error: { context: { status: 429 } },
    };

    const adapter = new MetaAssistantAdapter();
    const result = await adapter.generateResponse('Water schedule', syntheticFarmContext, 'en');

    expect(result).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Rate limited')
    );
  });

  it('Contract-5: Properly handles HTTP 502 Bad Gateway / Malformed Upstream Payload', async () => {
    mockInvokeResponse = {
      data: null,
      error: { context: { status: 502 } },
    };

    const adapter = new MetaAssistantAdapter();
    const result = await adapter.generateResponse('Disease identification', syntheticFarmContext, 'en');

    expect(result).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Malformed response')
    );
  });

  it('Contract-6: Verifies Tamil localized transparency disclaimer on fallback', async () => {
    mockInvokeResponse = {
      data: null,
      error: { context: { status: 503 } },
    };

    const adapter = new MetaAssistantAdapter();
    const result = await adapter.generateResponse(
      'மழை எச்சரிக்கை உள்ளதா?',
      syntheticFarmContext,
      'ta'
    );

    expect(result).toBeDefined();
    expect(result.disclaimer).toContain('உள்ளூர் ICAR / TNAU வழிகாட்டுதல்');
  });
});
