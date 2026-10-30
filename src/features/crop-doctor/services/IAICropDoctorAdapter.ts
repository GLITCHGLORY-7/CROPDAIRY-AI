// CropDiary AI — AI Crop Doctor Adapter Interface
import { DiagnosticEngineInput, DiagnosticEngineOutput } from '@/types/cropDoctor';

export interface IAICropDoctorAdapter {
  readonly name: string;
  isAvailable(): boolean;
  diagnose(input: DiagnosticEngineInput): Promise<DiagnosticEngineOutput>;
}
