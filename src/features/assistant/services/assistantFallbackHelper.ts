// CropDiary AI — Shared Assistant Fallback & Sanitized Diagnostic Helpers
import {
  FarmContextPayload,
  AssistantResponsePayload,
  Language,
} from '@/types/assistant';
import { localAgriculturalAssistantAdapter } from './localAgriculturalAssistantAdapter';

/**
 * Emits sanitized client diagnostics without logging secrets, authorization tokens,
 * full request payloads, or private farm data.
 */
export function logSanitizedDiagnostic(
  category: string,
  detail?: string,
  providerLabel: string = 'CropDiary AI Assistant'
): void {
  const detailStr = detail ? ` (${detail})` : '';
  console.warn(
    `[${providerLabel}] Remote model unavailable: ${category}${detailStr}. Operating via verified local ICAR rulebase.`
  );
}

export interface FallbackDisclaimerOptions {
  enDisclaimer?: string;
  taDisclaimer?: string;
}

/**
 * Generates local agricultural fallback response with verified ICAR/TNAU attribution
 * and localized transparency disclaimer.
 */
export async function createLocalIcarFallbackResponse(
  userMessage: string,
  farmContext: FarmContextPayload,
  language: Language,
  options?: FallbackDisclaimerOptions
): Promise<AssistantResponsePayload> {
  const fallbackResult = await localAgriculturalAssistantAdapter.generateResponse(
    userMessage,
    farmContext,
    language
  );

  const defaultEn =
    'Provided by verified local ICAR / TNAU agronomic rulebase (offline / rulebase mode).';
  const defaultTa =
    'பயிர் நாட்குறிப்பு உள்ளூர் ICAR / TNAU வழிகாட்டுதல் (நேரலை AI மாதிரி இணைக்கப்படவில்லை).';

  return {
    ...fallbackResult,
    disclaimer:
      language === 'ta'
        ? (options?.taDisclaimer ?? defaultTa)
        : (options?.enDisclaimer ?? defaultEn),
  };
}
