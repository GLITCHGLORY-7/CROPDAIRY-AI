// CropDiary AI — Phase 7 AI Farm Assistant & Multilingual Types

export type Language = 'en' | 'ta';

export type AssistantRole = 'user' | 'assistant' | 'system';

export type SourceRecordType =
  | 'farm'
  | 'plot'
  | 'crop_plan'
  | 'diary_entry'
  | 'expense'
  | 'harvest'
  | 'sale'
  | 'budget'
  | 'crop_doctor'
  | 'weather'
  | 'scheme'
  | 'mandi';

export interface SourceReference {
  recordType: SourceRecordType;
  recordId: string;
  title: string;
  date?: string;
  url?: string;
  snippet?: string;
}

export interface AssistantMessage {
  id: string;
  conversation_id: string;
  owner_id: string;
  role: AssistantRole;
  content: string;
  sources?: SourceReference[];
  model_name?: string;
  created_at: string;
}

export interface AssistantConversation {
  id: string;
  owner_id: string;
  title: string;
  preferred_language: Language;
  farm_id?: string | null;
  plot_id?: string | null;
  created_at: string;
  updated_at: string;
  messages?: AssistantMessage[];
}

export interface FarmContextPayload {
  selectedFarmId?: string;
  selectedPlotId?: string;
  farms: Array<{ id: string; name: string; location: string; totalArea: number }>;
  plots: Array<{ id: string; name: string; area: number; soilType: string; crop?: string }>;
  activeCropPlans: Array<{ id: string; cropName: string; season: string; sowingDate: string }>;
  recentActivities: Array<{ id: string; title: string; date: string; category: string }>;
  recentExpenses: Array<{ id: string; title: string; amount: number; category: string; date: string }>;
  recentHarvests: Array<{ id: string; cropName: string; quantity: number; unit: string; date: string }>;
  recentSales: Array<{ id: string; cropName: string; grossRevenue: number; netProceeds: number; date: string }>;
  budgets: Array<{ id: string; name: string; planned: number; spent: number; percentUsed: number; status: string }>;
  weatherAlerts: Array<{ id: string; title: string; severity: string; action: string }>;
  recentAssessments: Array<{ id: string; diagnosis: string; severity: string; date: string }>;
}

export interface AssistantResponsePayload {
  content: string;
  sources: SourceReference[];
  modelName: string;
  usedFarmerRecords: boolean;
  disclaimer: string;
}
