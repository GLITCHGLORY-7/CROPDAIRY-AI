// CropDiary AI — Meta Llama 3.2 Vision Multi-Modal AI Adapter
// Integrates with Meta Llama 3.2 11B/90B Vision Instruct via OpenAI-compatible multi-modal endpoints.

import { IAICropDoctorAdapter } from './IAICropDoctorAdapter';
import { DiagnosticEngineInput, DiagnosticEngineOutput } from '@/types/cropDoctor';
import { structuredDiagnosticResponseSchema } from '@/lib/validation/cropDoctorSchemas';

export class MetaLlamaVisionAdapter implements IAICropDoctorAdapter {
  readonly name = 'Meta Llama 3.2 Vision Instruct (11B Multi-Modal)';

  private apiKey: string | undefined;
  private endpointUrl: string;
  private modelName: string;

  constructor() {
    // Check environment variables safely in Vite
    const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : ({} as any);
    this.apiKey =
      metaEnv?.VITE_AI_VISION_API_KEY ||
      metaEnv?.VITE_GROQ_API_KEY ||
      metaEnv?.VITE_OPENAI_API_KEY ||
      undefined;

    this.endpointUrl =
      metaEnv?.VITE_AI_VISION_ENDPOINT ||
      'https://api.groq.com/openai/v1/chat/completions';

    this.modelName =
      metaEnv?.VITE_AI_VISION_MODEL ||
      'llama-3.2-11b-vision-preview';
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async diagnose(input: DiagnosticEngineInput): Promise<DiagnosticEngineOutput> {
    if (!this.isAvailable()) {
      throw new Error('AI Vision API key is not configured.');
    }

    const systemPrompt = `You are CropDiary AI's expert plant pathologist and agricultural diagnostic specialist trained on ICAR, TNAU, and CIMMYT agronomic standards.
Your role is to diagnose crop diseases, insect pests, nutrient deficiencies, or environmental stress from photographic evidence and farmer-reported symptoms.
CRITICAL SAFETY & RESPONSIBILITY GUIDELINES:
1. Distinguish verified agronomic patterns from speculative hypotheses. Explicitly state confidence and uncertainty.
2. Provide at least two alternative possible causes (differential diagnosis).
3. Prioritize Integrated Pest Management (IPM): cultural sanitation, spacing, aeration, and biological controls (Trichoderma, Pseudomonas, Neem/Azadirachtin, pheromone traps).
4. Strictly NEVER recommend or prescribe WHO Class Ia (Extremely Hazardous) or Class Ib (Highly Hazardous) chemical pesticides.
5. In any chemical management advisory, emphasize personal protective equipment (PPE: gloves, mask, eye shield) and local CIBRC label-claim compliance.
6. Provide Krishi Vigyan Kendra (KVK) referral advice and mention the Kisan Call Centre (1800-180-1551).
7. Respond ONLY in valid JSON matching the exact schema requested. Do not wrap in markdown or prose.`;

    const userContent: any[] = [
      {
        type: 'text',
        text: `Analyze this crop health problem with the following farmer observations:
- Crop: ${input.crop_name}
- Growth Stage: ${input.growth_stage || 'Not specified'}
- Affected Plant Parts: ${input.affected_parts.join(', ')}
- Observable Symptoms: ${input.symptom_categories.join(', ')}
- Duration of Problem: ${input.problem_duration}
- Spread Status: ${input.is_spreading}
- Recent Weather or Irrigation Changes: ${input.recent_weather_or_irrigation || 'None reported'}
- Farmer Notes: ${input.farmer_notes || 'None'}
- Farm Location: ${input.farm_location?.district || ''}, ${input.farm_location?.state || 'India'}

Return a JSON object with this exact shape:
{
  "primary_diagnosis": "Disease or Pest Name (Scientific Name)",
  "diagnosis_type": "fungal_disease" | "bacterial_disease" | "viral_disease" | "pest_infestation" | "nutrient_deficiency" | "environmental_stress",
  "confidence_score": 0.85,
  "confidence_level": "high" | "medium" | "low",
  "diagnostic_summary": "Comprehensive explanation of pathology",
  "supporting_evidence": ["Evidence point 1", "Evidence point 2"],
  "missing_or_contradictory": ["Missing symptom 1"],
  "possible_causes": [
    {
      "id": "cause-1",
      "common_name": "Common name",
      "scientific_name": "Scientific name",
      "type": "fungal_disease",
      "confidence_score": 0.85,
      "confidence_level": "high",
      "summary": "Summary",
      "matching_symptoms": ["Symptom match"],
      "missing_symptoms": ["Symptom missing"],
      "typical_conditions": "Favorable conditions"
    }
  ],
  "immediate_actions": [
    {
      "category": "cultural",
      "title": "Action title",
      "description": "Step details",
      "timing": "Immediate"
    }
  ],
  "ipm_cultural_biological_remedies": [
    {
      "category": "biological",
      "title": "Remedy title",
      "description": "Details",
      "timing": "Morning"
    }
  ],
  "chemical_management_caution": "Detailed safety advisory complying with CIBRC; no Class Ia/Ib.",
  "kvk_extension_referral": {
    "helpline": "Kisan Call Centre (KCC): 1800-180-1551",
    "recommendation": "Visit nearest KVK with leaf sample in paper envelope.",
    "district_center": "Krishi Vigyan Kendra (KVK)",
    "portal_url": "https://kvk.icar.gov.in"
  }
}`,
      },
    ];

    if (input.photo_base64) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: input.photo_base64.startsWith('data:')
            ? input.photo_base64
            : `data:${input.photo_mime_type || 'image/jpeg'};base64,${input.photo_base64}`,
        },
      });
    }

    const response = await fetch(this.endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Vision Gateway HTTP ${response.status}: ${errText}`);
    }

    const payload = await response.json();
    const rawContent = payload.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('AI Vision Gateway returned an empty message payload.');
    }

    const parsedJson = JSON.parse(rawContent);

    // Validate strictly with Zod schema
    const validated = structuredDiagnosticResponseSchema.parse({
      ...parsedJson,
      ai_model_used: this.modelName,
      is_ai_simulated: false,
    });

    return validated;
  }
}
