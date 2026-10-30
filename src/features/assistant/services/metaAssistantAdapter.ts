// CropDiary AI — Secure Meta Assistant Adapter (via Supabase Edge Function)
import { IAIAssistantAdapter } from './IAIAssistantAdapter';
import {
  FarmContextPayload,
  AssistantResponsePayload,
  Language,
} from '@/types/assistant';
import {
  logSanitizedDiagnostic,
  createLocalIcarFallbackResponse,
} from './assistantFallbackHelper';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

export class MetaAssistantAdapter implements IAIAssistantAdapter {
  readonly adapterName = 'meta-llama-agricultural-assistant';

  isAvailable(): boolean {
    return isSupabaseConfigured();
  }

  async generateResponse(
    userMessage: string,
    farmContext: FarmContextPayload,
    language: Language = 'en'
  ): Promise<AssistantResponsePayload> {
    if (!isSupabaseConfigured() || !supabase) {
      logSanitizedDiagnostic('Local development mode', 'Supabase credentials unconfigured');
      return this.renderFallbackResponse(userMessage, farmContext, language);
    }

    try {
      const { data, error } = await supabase.functions.invoke('meta-assistant', {
        body: {
          userMessage,
          farmContext,
          language,
        },
      });

      if (!error && data?.content && typeof data.content === 'string') {
        return {
          content: data.content,
          sources: data.sources || [],
          modelName: data.modelName || this.adapterName,
          usedFarmerRecords: true,
          disclaimer:
            data.disclaimer ||
            'Generated via secure Meta Model Edge Function grounded on your authenticated farm records.',
        };
      }

      // Safe, categorized failure diagnostics
      if (error) {
        const status = (error as any)?.context?.status || (error as any)?.status;
        if (status === 401) {
          logSanitizedDiagnostic('Authentication required', 'User must sign in with an active session');
        } else if (status === 402) {
          logSanitizedDiagnostic('Billing required', 'Meta AI account requires billing setup on dev.meta.ai');
        } else if (status === 403) {
          logSanitizedDiagnostic('Access forbidden', 'Origin or credentials rejected by CORS/policy');
        } else if (status === 404) {
          logSanitizedDiagnostic('Service not found', 'Edge Function not deployed on Supabase');
        } else if (status === 429) {
          logSanitizedDiagnostic('Rate limited', 'Per-user request frequency cap exceeded');
        } else if (status === 503) {
          logSanitizedDiagnostic('Service unavailable', 'MODEL_API_KEY unconfigured or upstream unreachable');
        } else if (status === 502) {
          logSanitizedDiagnostic('Malformed response', 'Invalid response structure from upstream provider');
        } else {
          logSanitizedDiagnostic('Provider error', typeof status === 'number' ? `HTTP ${status}` : 'Unknown status');
        }
      } else if (!data?.content) {
        logSanitizedDiagnostic('Empty response', 'Upstream returned zero content');
      }

      return this.renderFallbackResponse(userMessage, farmContext, language);
    } catch (networkErr: any) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      logSanitizedDiagnostic(
        isOffline ? 'Device offline' : 'Network communication failure',
        networkErr?.name || 'FetchError'
      );
      return this.renderFallbackResponse(userMessage, farmContext, language);
    }
  }

  private async renderFallbackResponse(
    userMessage: string,
    farmContext: FarmContextPayload,
    language: Language
  ): Promise<AssistantResponsePayload> {
    return createLocalIcarFallbackResponse(userMessage, farmContext, language);
  }
}

export const metaAssistantAdapter = new MetaAssistantAdapter();
