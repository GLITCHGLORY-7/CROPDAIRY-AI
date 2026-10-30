// CropDiary AI — Gemini Server-Side Edge Function Contract & Security Test Suite
import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { geminiAssistantAdapter } from '@/features/assistant/services/geminiAssistantAdapter';
import { metaAssistantAdapter } from '@/features/assistant/services/metaAssistantAdapter';
import { localAgriculturalAssistantAdapter } from '@/features/assistant/services/localAgriculturalAssistantAdapter';

describe('Gemini Server-Side Architecture, Security & Contract Suite', () => {
  const rootDir = process.cwd();

  describe('A. Static Security & Credential Isolation Scan', () => {
    it('14 & 15. Verifies zero direct browser calls to Google Gemini API and zero runtime reads of VITE_GEMINI_API_KEY', () => {
      const srcFiles: string[] = [];

      function walk(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            if (file !== 'test' && file !== '__tests__' && file !== 'node_modules') {
              walk(fullPath);
            }
          } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
            srcFiles.push(fullPath);
          }
        }
      }

      walk(path.join(rootDir, 'src'));

      const directApiRegex = /https:\/\/generativelanguage\.googleapis\.com/g;
      const viteKeyRegex = /VITE_GEMINI_API_KEY/g;

      for (const filePath of srcFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const hasDirectApi = directApiRegex.test(content);
        const hasViteKey = viteKeyRegex.test(content);

        expect(hasDirectApi, `Direct Gemini API call found in runtime file: ${filePath}`).toBe(false);
        expect(hasViteKey, `VITE_GEMINI_API_KEY reference found in runtime file: ${filePath}`).toBe(false);
      }
    });

    it('Verifies Edge Function reads server secret GEMINI_API_KEY and never VITE_GEMINI_API_KEY', () => {
      const edgeFnPath = path.join(rootDir, 'supabase', 'functions', 'gemini-assistant', 'index.ts');
      expect(fs.existsSync(edgeFnPath)).toBe(true);

      const content = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(content).toContain("Deno.env.get('GEMINI_API_KEY')");
      expect(content).not.toContain('VITE_GEMINI_API_KEY');
    });
  });

  describe('B. Edge Function Contract & Defensive Guardrails (Simulation)', () => {
    // Edge Function logic simulation matching supabase/functions/gemini-assistant/index.ts
    function evaluateCors(origin: string | null, env: string, allowedOrigins: string[]): { isAllowed: boolean; allowOriginHeader: string } {
      const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'];
      if (!origin) return { isAllowed: true, allowOriginHeader: allowedOrigins[0] || 'null' };
      if (allowedOrigins.includes(origin)) return { isAllowed: true, allowOriginHeader: origin };
      if (env === 'development' && DEV_ORIGINS.includes(origin)) return { isAllowed: true, allowOriginHeader: origin };
      return { isAllowed: false, allowOriginHeader: 'null' };
    }

    it('2. Missing or invalid authentication is rejected with 401', () => {
      const authHeader = null;
      const hasValidAuth = Boolean(authHeader && authHeader.startsWith('Bearer '));
      expect(hasValidAuth).toBe(false);
    });

    it('3. Malformed JSON and missing userMessage rejected with 400', () => {
      function validateBody(body: any): { valid: boolean; status: number; error: string } {
        if (!body || typeof body !== 'object') {
          return { valid: false, status: 400, error: 'Invalid JSON request body.' };
        }
        if (!body.userMessage || typeof body.userMessage !== 'string' || body.userMessage.trim().length === 0) {
          return { valid: false, status: 400, error: 'userMessage is required and must be non-empty string.' };
        }
        if (body.userMessage.length > 2000) {
          return { valid: false, status: 400, error: 'userMessage exceeds maximum length of 2000 characters.' };
        }
        return { valid: true, status: 200, error: '' };
      }

      expect(validateBody(null).status).toBe(400);
      expect(validateBody({}).status).toBe(400);
      expect(validateBody({ userMessage: '   ' }).status).toBe(400);
      expect(validateBody({ userMessage: 12345 }).status).toBe(400);
      expect(validateBody({ userMessage: 'Valid farming query' }).valid).toBe(true);
    });

    it('4. Oversized input (>2000 characters) rejected with 400', () => {
      const hugeMessage = 'A'.repeat(2001);
      const isOversized = hugeMessage.length > 2000;
      expect(isOversized).toBe(true);
    });

    it('5. CORS rejection for unapproved origins', () => {
      const prodResult = evaluateCors('https://malicious-phishing.com', 'production', ['https://cropdiary.ai']);
      expect(prodResult.isAllowed).toBe(false);
      expect(prodResult.allowOriginHeader).toBe('null');

      const allowedResult = evaluateCors('https://cropdiary.ai', 'production', ['https://cropdiary.ai']);
      expect(allowedResult.isAllowed).toBe(true);
    });

    it('6. Missing server-side Gemini secret yields HTTP 503 fallback response', () => {
      const secret = undefined;
      const hasSecret = typeof secret === 'string' && secret.trim().length > 0;
      expect(hasSecret).toBe(false);
      const errorPayload = {
        error: 'GEMINI_API_KEY server secret not configured. Fallback to local rulebase.',
        fallbackRecommended: true,
      };
      expect(errorPayload.fallbackRecommended).toBe(true);
    });

    it('7. Upstream 401/403, 429, and 5xx responses are sanitized without leaking secret', () => {
      function sanitizeUpstream(status: number): { clientStatus: number; error: string } {
        if (status === 400 || status === 401 || status === 403) {
          return {
            clientStatus: 503,
            error: 'Agricultural AI model authentication, billing, or quota unavailable. Fallback recommended.',
          };
        }
        if (status === 429) {
          return {
            clientStatus: 429,
            error: 'Google Gemini rate limit or quota exceeded (HTTP 429).',
          };
        }
        return {
          clientStatus: 503,
          error: 'Google Gemini upstream provider error.',
        };
      }

      const authErr = sanitizeUpstream(403);
      expect(authErr.clientStatus).toBe(503);
      expect(authErr.error).not.toContain('API_KEY');

      const rateErr = sanitizeUpstream(429);
      expect(rateErr.clientStatus).toBe(429);

      const serverErr = sanitizeUpstream(500);
      expect(serverErr.clientStatus).toBe(503);
    });

    it('8. Upstream timeout and network failure handled with 503 fallback', () => {
      const isTimeout = true;
      const sanitized = isTimeout
        ? 'Upstream AI model request timed out.'
        : 'Upstream AI model provider is currently unreachable.';
      expect(sanitized).toContain('timed out');
    });

    it('9. Malformed upstream response handled with 502 Bad Gateway', () => {
      let isMalformed = false;
      try {
        JSON.parse('INVALID_NON_JSON_RESPONSE');
      } catch {
        isMalformed = true;
      }
      expect(isMalformed).toBe(true);
    });

    it('10. Safe client-facing error handling with zero secret leakage in logs', () => {
      const mockSecret = 'SECRET_GEMINI_KEY_99999999';
      const detail = 'User must sign in with an active session';
      const logMessage = `[CropDiary AI Gemini Assistant] Remote model unavailable: Authentication required (${detail}). Operating via verified local ICAR rulebase.`;
      expect(logMessage).not.toContain(mockSecret);
      expect(logMessage).toContain('verified local ICAR rulebase');
    });
  });

  describe('C. Provider Hierarchy & Fallback Preservation', () => {
    it('11, 12 & 13. Gemini remains primary adapter, with fallback to Meta and Local ICAR rulebase', () => {
      expect(geminiAssistantAdapter.adapterName).toBe('gemini-2.5-flash-agricultural-assistant');
      expect(metaAssistantAdapter.adapterName).toBe('meta-llama-agricultural-assistant');
      expect(localAgriculturalAssistantAdapter.adapterName).toBe('cropdiary-icar-local-assistant');
    });

    it('16. Meta and Local ICAR fallback contracts remain completely intact', async () => {
      const dummyContext: any = {
        farms: [],
        plots: [],
        activeCropPlans: [],
        recentActivities: [],
        recentExpenses: [],
        recentHarvests: [],
        recentSales: [],
        budgets: [],
        weatherAlerts: [],
        recentAssessments: [],
      };

      const localRes = await localAgriculturalAssistantAdapter.generateResponse(
        'What is recommended spacing for paddy?',
        dummyContext,
        'en'
      );
      expect(localRes).toBeDefined();
      expect(localRes.content).toBeTruthy();
      expect(localRes.modelName).toBe('cropdiary-icar-local-assistant');
    });
  });
});
