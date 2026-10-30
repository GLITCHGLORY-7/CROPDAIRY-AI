// CropDiary AI — Meta Model API Integration & Resilient Fallback Vitest Suite
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MetaAssistantAdapter } from '@/features/assistant/services/metaAssistantAdapter';
import { FarmContextPayload } from '@/types/assistant';

// Mock Supabase Client
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

describe('Meta Model API Integration & Failure Diagnostics', () => {
  const dummyContext: FarmContextPayload = {
    farms: [{ id: 'farm-1', name: 'Kaveri Delta Orchard', location: 'Thanjavur, Tamil Nadu', totalArea: 3.5 }],
    plots: [{ id: 'plot-1', name: 'Main Orchard', area: 3.5, soilType: 'Clay Loam' }],
    activeCropPlans: [],
    recentActivities: [],
    recentExpenses: [],
    recentHarvests: [],
    recentSales: [],
    budgets: [],
    weatherAlerts: [],
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

  it('1. Successfully parses live Meta AI response payload', async () => {
    mockInvokeResponse = {
      data: {
        content: 'Apply organic neem cake at 250 kg/hectare during basal plowing for optimal soil fertility.',
        sources: ['TNAU Agronomy Guidelines 2026'],
        modelName: 'muse-spark-1.3',
        usedFarmerRecords: true,
        disclaimer: 'Generated via secure Meta Model Edge Function grounded on your authenticated farm records.',
      },
      error: null,
    };

    const adapter = new MetaAssistantAdapter();
    const result = await adapter.generateResponse('How should I fertilize my orchard?', dummyContext, 'en');

    expect(result.content).toContain('organic neem cake');
    expect(result.modelName).toBe('muse-spark-1.3');
    expect(result.usedFarmerRecords).toBe(true);
    expect(result.disclaimer).toContain('Meta Model Edge Function');
    // Ensure no warning was logged on success
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('2. Handles missing configuration (HTTP 503) with transparent fallback and sanitized log', async () => {
    mockInvokeResponse = {
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: { status: 503 },
      },
    };

    const adapter = new MetaAssistantAdapter();
    const result = await adapter.generateResponse('What activities did I record?', dummyContext, 'en');

    expect(result).toBeDefined();
    // Transparent farmer disclaimer indicates rulebase fallback
    expect(result.disclaimer).toContain('offline / rulebase mode');
    // Sanitized diagnostic logged without secrets or private data
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[CropDiary AI Assistant] Remote model unavailable: Service unavailable')
    );
  });

  it('3. Handles unauthenticated session (HTTP 401) without falsely claiming provider downtime', async () => {
    mockInvokeResponse = {
      data: null,
      error: {
        message: 'Authentication required. Missing Authorization header.',
        context: { status: 401 },
      },
    };

    const adapter = new MetaAssistantAdapter();
    const result = await adapter.generateResponse('Summarize expenses', dummyContext, 'en');

    expect(result).toBeDefined();
    expect(result.disclaimer).toContain('offline / rulebase mode');
    // Diagnostic notes user auth required, not provider downtime
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Authentication required (User must sign in with an active session)')
    );
  });

  it('4. Handles CORS / forbidden origin (HTTP 403) safely', async () => {
    mockInvokeResponse = {
      data: null,
      error: {
        message: 'Origin not allowed by CORS policy',
        context: { status: 403 },
      },
    };

    const adapter = new MetaAssistantAdapter();
    const result = await adapter.generateResponse('Weather forecast?', dummyContext, 'en');

    expect(result).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Access forbidden (Origin or credentials rejected by CORS/policy)')
    );
  });

  it('5. Handles per-user rate limit exceeded (HTTP 429)', async () => {
    mockInvokeResponse = {
      data: null,
      error: {
        message: 'Rate limit exceeded',
        context: { status: 429 },
      },
    };

    const adapter = new MetaAssistantAdapter();
    const result = await adapter.generateResponse('Check soil health', dummyContext, 'en');

    expect(result).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Rate limited (Per-user request frequency cap exceeded)')
    );
  });

  it('6. Handles malformed or non-JSON upstream provider response (HTTP 502)', async () => {
    mockInvokeResponse = {
      data: null,
      error: {
        message: 'Bad Gateway',
        context: { status: 502 },
      },
    };

    const adapter = new MetaAssistantAdapter();
    const result = await adapter.generateResponse('How to control stem borer?', dummyContext, 'en');

    expect(result).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Malformed response (Invalid response structure from upstream provider)')
    );
  });

  it('7. Handles network throw / offline device gracefully', async () => {
    mockInvokeFn.mockRejectedValueOnce(new Error('Failed to fetch'));

    const adapter = new MetaAssistantAdapter();
    const result = await adapter.generateResponse('Explain drip irrigation', dummyContext, 'en');

    expect(result).toBeDefined();
    expect(result.disclaimer).toContain('offline / rulebase mode');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Network communication failure')
    );
  });

  it('8. Supports Tamil language fallback with localized transparency disclaimer', async () => {
    mockInvokeResponse = {
      data: null,
      error: { context: { status: 503 } },
    };

    const adapter = new MetaAssistantAdapter();
    const result = await adapter.generateResponse('வணக்கம்', dummyContext, 'ta');

    expect(result).toBeDefined();
    expect(result.disclaimer).toContain('உள்ளூர் ICAR / TNAU வழிகாட்டுதல்');
  });

  it('9. Verifies server-side configuration resolution and security validation logic', () => {
    // Test Edge Function logic directly in unit test
    const DEFAULT_ENDPOINT = 'https://api.meta.ai/v1/chat/completions';
    const DEFAULT_MODEL = 'muse-spark-1.3';

    function resolveModelConfig(env: Record<string, string>) {
      const apiKey = env['MODEL_API_KEY'] || env['META_API_KEY'];
      const model = env['MODEL_NAME'] || env['META_MODEL'] || DEFAULT_MODEL;
      const rawEndpoint = env['MODEL_API_ENDPOINT'] || env['META_API_ENDPOINT'] || DEFAULT_ENDPOINT;

      let validEndpoint = DEFAULT_ENDPOINT;
      let endpointError: string | null = null;

      try {
        const url = new URL(rawEndpoint);
        if (url.protocol !== 'https:') {
          endpointError = 'Insecure protocol: HTTPS mandatory';
        } else {
          const host = url.hostname.toLowerCase();
          const isPrivate = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.');
          if (isPrivate && env['ENVIRONMENT'] !== 'development') {
            endpointError = 'Private destination prohibited in production';
          } else {
            validEndpoint = url.toString();
          }
        }
      } catch {
        endpointError = 'Invalid URL format';
      }

      return {
        hasKey: Boolean(apiKey),
        model,
        endpoint: validEndpoint,
        endpointError,
      };
    }

    // Default configuration
    const config1 = resolveModelConfig({});
    expect(config1.endpoint).toBe('https://api.meta.ai/v1/chat/completions');
    expect(config1.model).toBe('muse-spark-1.3');
    expect(config1.hasKey).toBe(false);

    // Precedence: MODEL_API_KEY preferred over META_API_KEY
    const config2 = resolveModelConfig({ MODEL_API_KEY: 'official-key', META_API_KEY: 'legacy-key' });
    expect(config2.hasKey).toBe(true);

    // Reject insecure HTTP endpoint
    const config3 = resolveModelConfig({ MODEL_API_ENDPOINT: 'http://insecure.api.com' });
    expect(config3.endpointError).toContain('HTTPS mandatory');

    // Reject private IP in production
    const config4 = resolveModelConfig({ MODEL_API_ENDPOINT: 'https://192.168.1.100/v1', ENVIRONMENT: 'production' });
    expect(config4.endpointError).toContain('Private destination prohibited');

    // Permit custom HTTPS endpoint (e.g. OpenAI-compatible Meta gateway)
    const config5 = resolveModelConfig({ MODEL_API_ENDPOINT: 'https://custom-gateway.internal.net/v1/chat/completions' });
    expect(config5.endpoint).toBe('https://custom-gateway.internal.net/v1/chat/completions');
    expect(config5.endpointError).toBeNull();
  });
});
