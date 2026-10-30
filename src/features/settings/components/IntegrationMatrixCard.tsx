import React from 'react';
import {
  Database,
  Bot,
  CloudSun,
  TrendingUp,
  Mic,
  HardDrive,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { isSupabaseConfigured } from '@/services/supabaseClient';

export interface ServiceIntegrationStatus {
  id: string;
  name: string;
  role: string;
  isRequired: boolean;
  isConfigured: boolean;
  statusType: 'connected' | 'local_fallback' | 'public_active' | 'browser_supported' | 'unavailable';
  statusLabel: string;
  activeMode: string;
  fallbackDescription: string;
  credentialsLocation: string;
  setupGuidance: string;
  icon: React.ElementType;
}

export const getIntegrationStatuses = (): ServiceIntegrationStatus[] => {
  const isSupabase = isSupabaseConfigured();
  const isAIEngineAvailable = Boolean(
    isSupabase ||
    import.meta.env.VITE_AI_VISION_API_KEY
  );
  const hasAgmarknetKey = Boolean(import.meta.env.VITE_DATAGOV_API_KEY);
  const hasSpeech =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const hasIndexedDb =
    typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

  return [
    {
      id: 'supabase',
      name: 'Supabase Cloud (PostgreSQL & Auth)',
      role: 'Cloud data persistence, user authentication, and multi-tenant Row-Level Security.',
      isRequired: false,
      isConfigured: isSupabase,
      statusType: isSupabase ? 'connected' : 'local_fallback',
      statusLabel: isSupabase ? 'Cloud Synced' : 'Local Storage Mode',
      activeMode: isSupabase
        ? 'Remote PostgreSQL (RLS Active)'
        : 'Browser-Isolated Storage & IndexedDB',
      fallbackDescription:
        'When unconfigured, CropDiary AI runs autonomously using an isolated browser storage adapter and local IndexedDB monotonic queue.',
      credentialsLocation: 'Server Environment (.env -> VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)',
      setupGuidance:
        'To synchronize data across multiple devices, provision a free Supabase project, execute the migration SQL files in supabase/migrations/, and configure your project URL and anon public key in your environment.',
      icon: Database,
    },
    {
      id: 'ai-engine',
      name: 'Agronomic AI Engine (Crop Doctor & Assistant)',
      role: 'Multi-modal leaf disease visual triage and conversational agronomic reasoning.',
      isRequired: false,
      isConfigured: isAIEngineAvailable,
      statusType: isAIEngineAvailable ? 'connected' : 'local_fallback',
      statusLabel: isAIEngineAvailable ? 'Gemini AI Active' : 'ICAR Rulebase Mode',
      activeMode: isAIEngineAvailable
        ? 'Google Gemini 2.5 Flash (via Edge Function)'
        : 'ICAR-TNAU Ground-Truth Rule Matrix',
      fallbackDescription:
        'When external AI keys are absent, Crop Doctor executes against an embedded ground-truth rulebase cross-referencing ICAR pathology matrices, enforcing non-chemical IPM priority and zero WHO Class Ia/Ib pesticides.',
      credentialsLocation: 'Supabase Server Secret (GEMINI_API_KEY)',
      setupGuidance:
        'To stream live reasoning from Google Gemini, obtain an API key from Google AI Studio and configure GEMINI_API_KEY as a server-side Supabase secret (`supabase secrets set GEMINI_API_KEY="your_key"`). Never expose AI API keys to client-side bundles.',
      icon: Bot,
    },
    {
      id: 'weather',
      name: 'Meteorological Weather Provider (Open-Meteo)',
      role: 'Hyperlocal 7-day precipitation forecasts, temperature trends, and pesticide spray feasibility windows.',
      isRequired: false,
      isConfigured: true,
      statusType: 'public_active',
      statusLabel: 'Public REST Active',
      activeMode: 'Open-Meteo WMO Meteorological API',
      fallbackDescription:
        'Public zero-credential service. When device has no connectivity, displays cached forecasts with timestamp disclaimers.',
      credentialsLocation: 'No API Key Required (Standard Public Tier)',
      setupGuidance:
        'The standard Open-Meteo tier requires zero credentials and is fully operational out of the box. An optional enterprise key (VITE_OPEN_METEO_API_KEY) can be configured for commercial SLA rates.',
      icon: CloudSun,
    },
    {
      id: 'market-prices',
      name: 'Agricultural Market Prices (Agmarknet / DMI)',
      role: 'Daily APMC mandi wholesale commodity prices and transport net margin arbitrage.',
      isRequired: false,
      isConfigured: hasAgmarknetKey,
      statusType: hasAgmarknetKey ? 'connected' : 'local_fallback',
      statusLabel: hasAgmarknetKey ? 'Live Agmarknet Active' : 'DMI Benchmark Mode',
      activeMode: hasAgmarknetKey
        ? 'Data.gov.in Live Agmarknet Feed'
        : 'Directorate of Marketing & Inspection (DMI) Verified Corridors',
      fallbackDescription:
        'Displays verified DMI benchmark price corridors for 10 primary Indian agricultural crops with mandi vs. farmgate net realization calculations.',
      credentialsLocation: 'Server Environment (.env -> VITE_DATAGOV_API_KEY)',
      setupGuidance:
        'To stream live intraday arrivals from wholesale APMC mandis, register for an API key on the Open Government Data Platform (data.gov.in) and add VITE_DATAGOV_API_KEY to your server environment.',
      icon: TrendingUp,
    },
    {
      id: 'speech',
      name: 'Vernacular Speech-to-Text (Web Speech API)',
      role: 'Hands-free voice transcription for field activity logging in Tamil (ta-IN) and English (en-IN).',
      isRequired: false,
      isConfigured: hasSpeech,
      statusType: hasSpeech ? 'browser_supported' : 'unavailable',
      statusLabel: hasSpeech ? 'Browser Supported' : 'Fallback to Keyboard',
      activeMode: hasSpeech
        ? 'Native Browser SpeechRecognition'
        : 'Manual Text Input Active',
      fallbackDescription:
        'Gracefully falls back to manual keyboard typing with zero functionality loss on unsupported platforms.',
      credentialsLocation: 'Client Hardware & Browser Feature (No Key Needed)',
      setupGuidance:
        'Web Speech API is supported natively on modern Chrome, Microsoft Edge, and Android WebViews. On browsers without native speech recognition (e.g. desktop Firefox), use manual text input.',
      icon: Mic,
    },
    {
      id: 'offline-storage',
      name: 'Offline Storage & Synchronization Engine',
      role: 'Transactional local database for zero-connectivity field operation and monotonic queue replay.',
      isRequired: true,
      isConfigured: hasIndexedDb,
      statusType: hasIndexedDb ? 'connected' : 'unavailable',
      statusLabel: hasIndexedDb ? 'IndexedDB Operational' : 'Storage Restricted',
      activeMode: hasIndexedDb
        ? 'Native IndexedDB (cropdiary_offline_db)'
        : 'In-Memory Fallback',
      fallbackDescription:
        'Stores offline diary entries, field assessments, and financial transactions with client UUID deduplication.',
      credentialsLocation: 'Client Browser IndexedDB API (No Key Needed)',
      setupGuidance:
        'Supported across all modern browsers. To ensure persistent offline storage in the field, avoid strict Incognito/Private tabs which may wipe browser storage upon closing.',
      icon: HardDrive,
    },
  ];
};

export const IntegrationMatrixCard: React.FC = () => {
  const integrations = getIntegrationStatuses();

  const getBadgeVariant = (type: ServiceIntegrationStatus['statusType']) => {
    switch (type) {
      case 'connected':
      case 'public_active':
      case 'browser_supported':
        return 'success';
      case 'local_fallback':
        return 'outline';
      case 'unavailable':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <Card className="shadow-xs border-slate-200">
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-agri-700" />
              Service & Integration Diagnostics Matrix
            </CardTitle>
            <CardDescription>
              Transparent audit of cloud connectors, AI backends, external APIs, and local fallback modes.
            </CardDescription>
          </div>
          <Badge variant="outline" className="self-start sm:self-auto text-xs font-semibold text-slate-700">
            Real-Time Diagnostic
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-agri-700 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Security & Privacy Safeguard:</strong> CropDiary AI never asks farmers to paste private API keys into browser input fields or stores secret keys in unencrypted local storage. All external credentials belong strictly in secure server-side environment configurations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {integrations.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-agri-50 text-agri-700 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                      <p className="text-xs text-slate-500">{item.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Badge variant={getBadgeVariant(item.statusType)} className="text-xs">
                      {item.statusLabel}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-medium">Active Runtime Mode</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-agri-600 flex-shrink-0" />
                      {item.activeMode}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Fallback Strategy</span>
                    <span className="text-slate-600 block mt-0.5">{item.fallbackDescription}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div>
                    <strong className="text-slate-700">Credentials:</strong> {item.credentialsLocation}
                  </div>
                  <div>
                    <strong className="text-slate-700">Setup Guide:</strong> {item.setupGuidance}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
