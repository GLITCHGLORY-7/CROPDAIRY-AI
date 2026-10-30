// CropDiary AI — AI Farm Assistant Adapter Contract Interface
import {
  FarmContextPayload,
  AssistantResponsePayload,
  Language,
} from '@/types/assistant';

export interface IAIAssistantAdapter {
  readonly adapterName: string;
  isAvailable(): boolean;
  generateResponse(
    userMessage: string,
    farmContext: FarmContextPayload,
    language: Language
  ): Promise<AssistantResponsePayload>;
}
