// CropDiary AI — New Crop Diagnostic Wizard Page
// Step-by-step workflow: Farm/Plot/Crop selection -> Photo & Symptom intake -> AI analysis & saving.

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { farmService } from '@/services/farmService';
import { cropDoctorService } from './services/cropDoctorService';
import { ImageUploader } from './components/ImageUploader';
import { SymptomIntakeForm } from './components/SymptomIntakeForm';
import { AssessmentResultView } from './components/AssessmentResultView';
import { ProcessedImageResult } from './utils/imageUtils';
import {
  PlantPart,
  SymptomCategory,
  ProblemDuration,
  SpreadingStatus,
  DiagnosticEngineOutput,
} from '@/types/cropDoctor';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import {
  ScanEye,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Trees,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const POPULAR_CROPS = [
  'Paddy / Rice',
  'Tomato',
  'Cotton',
  'Groundnut / Peanut',
  'Maize / Corn',
  'Chilli',
  'Blackgram',
  'Sugarcane',
  'Wheat',
  'Soybean',
  'Brinjal / Eggplant',
  'Other Crop',
];

const GROWTH_STAGES = [
  'Nursery / Seedling (0-20 days)',
  'Vegetative / Tillering',
  'Flowering / Square Formation',
  'Fruiting / Pod / Grain Filling',
  'Maturity / Pre-Harvest',
];

export const NewCropAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1 State: Farm, Plot, Crop
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [selectedPlotId, setSelectedPlotId] = useState<string>('');
  const [selectedCropName, setSelectedCropName] = useState<string>('Paddy / Rice');
  const [customCropName, setCustomCropName] = useState<string>('');
  const [growthStage, setGrowthStage] = useState<string>('Vegetative / Tillering');

  // Step 2 State: Image & Symptoms
  const [selectedImage, setSelectedImage] = useState<ProcessedImageResult | null>(null);
  const [affectedParts, setAffectedParts] = useState<PlantPart[]>(['Leaves']);
  const [symptomCategories, setSymptomCategories] = useState<SymptomCategory[]>([
    'Spots / Lesions',
    'Discoloration / Yellowing',
  ]);
  const [problemDuration, setProblemDuration] = useState<ProblemDuration>('3-7 days');
  const [spreading, setSpreading] = useState<SpreadingStatus>('Slowly spreading to adjacent rows');
  const [weatherNotes, setWeatherNotes] = useState<string>('');
  const [farmerNotes, setFarmerNotes] = useState<string>('');

  // Step 3 State: Analysis Results
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticEngineOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch farms and plots
  const { data: farms = [] } = useQuery({
    queryKey: ['farms', user?.id],
    queryFn: () => (user ? farmService.getFarmsWithPlots(user.id) : []),
    enabled: Boolean(user),
  });

  // Pre-fill from query params if coming from a plot or farm page
  useEffect(() => {
    const farmIdParam = searchParams.get('farmId');
    const plotIdParam = searchParams.get('plotId');
    const cropParam = searchParams.get('crop');

    if (farmIdParam && farms.some((f) => f.id === farmIdParam)) {
      setSelectedFarmId(farmIdParam);
    } else if (farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }

    if (plotIdParam) {
      setSelectedPlotId(plotIdParam);
    }

    if (cropParam) {
      if (POPULAR_CROPS.includes(cropParam)) {
        setSelectedCropName(cropParam);
      } else {
        setSelectedCropName('Other Crop');
        setCustomCropName(cropParam);
      }
    }
  }, [farms, searchParams]);

  const activeFarm = farms.find((f) => f.id === selectedFarmId);
  const availablePlots = activeFarm?.plots || [];

  const handleTogglePart = (part: PlantPart) => {
    setAffectedParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  };

  const handleToggleCategory = (category: SymptomCategory) => {
    setSymptomCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const effectiveCropName =
    selectedCropName === 'Other Crop' ? customCropName.trim() || 'Unknown Crop' : selectedCropName;

  // Run AI diagnosis
  const handleRunAnalysis = async () => {
    if (affectedParts.length === 0) {
      showToast('error', 'Select Affected Part', 'Please select at least one plant part.');
      return;
    }
    if (symptomCategories.length === 0) {
      showToast('error', 'Select Symptom', 'Please select at least one observable symptom.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const output = await cropDoctorService.runDiagnosticAnalysis({
        crop_name: effectiveCropName,
        growth_stage: growthStage,
        affected_parts: affectedParts,
        symptom_categories: symptomCategories,
        problem_duration: problemDuration,
        is_spreading: spreading,
        recent_weather_or_irrigation: weatherNotes,
        farmer_notes: farmerNotes,
        farm_location: {
          state: activeFarm?.state || profile?.state || 'Tamil Nadu',
          district: activeFarm?.district || profile?.district || 'Coimbatore',
        },
        photo_base64: selectedImage?.dataUrl,
        photo_mime_type: selectedImage?.mimeType,
      });

      setDiagnosticResult(output);
      setCurrentStep(3);
    } catch (err: any) {
      showToast('error', 'Analysis Failed', err.message || 'Failed to complete diagnosis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save assessment to user account
  const handleSaveAssessment = async () => {
    if (!user || !diagnosticResult) return;

    setIsSaving(true);
    try {
      const saved = await cropDoctorService.saveAssessment(user.id, {
        inputData: {
          farm_id: selectedFarmId || null,
          plot_id: selectedPlotId || null,
          crop_name: effectiveCropName,
          growth_stage: growthStage,
          affected_parts: affectedParts,
          symptom_categories: symptomCategories,
          problem_duration: problemDuration,
          is_spreading: spreading,
          recent_weather_or_irrigation: weatherNotes || undefined,
          farmer_notes: farmerNotes || undefined,
          status: 'active',
          ...diagnosticResult,
        },
        photoFile: selectedImage?.file,
        photoPreviewUrl: selectedImage?.dataUrl,
      });

      queryClient.invalidateQueries({ queryKey: ['crop_assessments', user.id] });
      showToast('success', 'Diagnosis Saved', 'Record added to your farm health history.');
      navigate(`/app/crop-doctor/${saved.id}`);
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/crop-doctor"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Crop Doctor Scans</span>
        </Link>

        {/* Wizard Step Indicator */}
        <div className="flex items-center gap-2">
          {[
            { step: 1, label: 'Crop & Plot' },
            { step: 2, label: 'Photo & Symptoms' },
            { step: 3, label: 'AI Diagnosis' },
          ].map(({ step, label }) => (
            <div key={step} className="flex items-center gap-1.5">
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  currentStep === step
                    ? 'bg-agri-700 text-white'
                    : currentStep > step
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                )}
              >
                {currentStep > step ? '✓' : step}
              </span>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:inline',
                  currentStep === step ? 'text-slate-900 font-bold' : 'text-slate-500'
                )}
              >
                {label}
              </span>
              {step < 3 && <span className="text-slate-300 hidden sm:inline">•</span>}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Crop & Plot Selection */}
      {currentStep === 1 && (
        <Card className="border-slate-200/90 shadow-xs">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Trees className="w-5 h-5 text-agri-700" />
              <span>Step 1: Select Affected Farm, Plot & Crop</span>
            </CardTitle>
            <CardDescription>
              Link this diagnosis to an actual registered farm or plot for longitudinal health tracking.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Farm Selector */}
            <div className="space-y-2">
              <label htmlFor="farm-selector" className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Farm
              </label>
              {farms.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  No farms registered yet. You can still continue, and optionally create a farm later.
                </div>
              ) : (
                <select
                  id="farm-selector"
                  value={selectedFarmId}
                  onChange={(e) => {
                    setSelectedFarmId(e.target.value);
                    setSelectedPlotId('');
                  }}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white text-slate-800 focus:outline-none focus:border-agri-600"
                >
                  <option value="">-- No specific farm attached (Quick Scan) --</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.district}, {f.state})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Plot Selector (if farm selected) */}
            {activeFarm && availablePlots.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="plot-selector" className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Select Plot (Optional)
                </label>
                <select
                  id="plot-selector"
                  value={selectedPlotId}
                  onChange={(e) => setSelectedPlotId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white text-slate-800 focus:outline-none focus:border-agri-600"
                >
                  <option value="">-- Entire Farm / General Plot --</option>
                  {availablePlots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.area} {p.area_unit} • {p.soil_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Crop Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Which crop is affected? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {POPULAR_CROPS.map((crop) => {
                  const isSelected = selectedCropName === crop;
                  return (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => setSelectedCropName(crop)}
                      className={cn(
                        'p-2.5 rounded-xl border text-left text-xs transition-all min-h-[46px] flex items-center justify-between',
                        isSelected
                          ? 'border-agri-600 bg-agri-50 text-agri-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      )}
                    >
                      <span>{crop}</span>
                      {isSelected && <span className="text-agri-700 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>

              {selectedCropName === 'Other Crop' && (
                <div className="pt-2">
                  <label htmlFor="custom-crop-input" className="sr-only">Enter custom crop name</label>
                  <input
                    id="custom-crop-input"
                    type="text"
                    placeholder="Enter crop name (e.g. Mustard, Banana, Chickpea)..."
                    value={customCropName}
                    onChange={(e) => setCustomCropName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 focus:border-agri-600 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Growth Stage Selector */}
            <div className="space-y-2">
              <label htmlFor="stage-selector" className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Current Growth Stage
              </label>
              <select
                id="stage-selector"
                value={growthStage}
                onChange={(e) => setGrowthStage(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white text-slate-800 focus:outline-none focus:border-agri-600"
              >
                {GROWTH_STAGES.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setCurrentStep(2)}
                className="text-xs gap-1.5 min-h-[44px]"
              >
                <span>Continue to Photo & Symptoms</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Photo Capture & Symptom Intake */}
      {currentStep === 2 && (
        <Card className="border-slate-200/90 shadow-xs">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <ScanEye className="w-5 h-5 text-agri-700" />
              <span>Step 2: Upload Photo & Describe Observable Symptoms</span>
            </CardTitle>
            <CardDescription>
              Crop: <strong>{effectiveCropName}</strong> ({growthStage})
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-8">
            {/* Photo Uploader */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Specimen Photograph (Recommended)
                </span>
                <span className="text-[11px] text-slate-500">Camera or Gallery</span>
              </div>
              <ImageUploader
                selectedImage={selectedImage}
                onImageSelected={setSelectedImage}
              />
            </div>

            {/* Guided Symptom Questionnaire */}
            <div className="pt-4 border-t border-slate-100">
              <SymptomIntakeForm
                affectedParts={affectedParts}
                onTogglePart={handleTogglePart}
                symptomCategories={symptomCategories}
                onToggleCategory={handleToggleCategory}
                duration={problemDuration}
                onChangeDuration={setProblemDuration}
                spreading={spreading}
                onChangeSpreading={setSpreading}
                weatherNotes={weatherNotes}
                onChangeWeatherNotes={setWeatherNotes}
                farmerNotes={farmerNotes}
                onChangeFarmerNotes={setFarmerNotes}
              />
            </div>

            {/* Step Navigation Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(1)}
                className="text-xs gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="text-xs gap-2 min-h-[44px] px-6 font-bold"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzing ? 'Analyzing Specimen...' : 'Run Crop Health Diagnosis'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Diagnostic Results & Recommendations */}
      {currentStep === 3 && diagnosticResult && (
        <div className="space-y-6">
          <AssessmentResultView
            assessment={{
              ...diagnosticResult,
              crop_name: effectiveCropName,
              growth_stage: growthStage,
              photo_url: selectedImage?.dataUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80',
              affected_parts: affectedParts,
              symptom_categories: symptomCategories,
              problem_duration: problemDuration,
              is_spreading: spreading,
            }}
            isSaved={false}
            onSave={handleSaveAssessment}
            isSaving={isSaving}
          />

          <div className="flex justify-between items-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(2)}
              className="text-xs gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Adjust Symptoms / Photo</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
