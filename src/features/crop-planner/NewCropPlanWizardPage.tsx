import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { farmService } from '@/services/farmService';
import { cropPlanService } from '@/services/cropPlanService';
import { cropSuitabilityEngine } from './services/cropSuitabilityEngine';
import { cropPlanningInputSchema, CropPlanningInputFormData } from '@/lib/validation/cropPlannerSchemas';
import { CandidateCropResult, Season, CropCategory } from '@/types/crop';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { CropCandidateCard } from './components/CropCandidateCard';
import { CropComparisonTable } from './components/CropComparisonTable';
import { EstimateCalculator } from './components/EstimateCalculator';
import { PlanTimelineView } from './components/PlanTimelineView';
import { SavePlanModal } from './components/SavePlanModal';
import { formatArea } from '@/lib/formatters';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  MapPin,
  Layers,
  Droplet,
  Compass,
  Check,
  AlertTriangle,
} from 'lucide-react';

export const NewCropPlanWizardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateCropResult | null>(null);
  const [comparedCandidates, setComparedCandidates] = useState<CandidateCropResult[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Fetch real farms with plots
  const { data: farms = [], isLoading: isFarmsLoading } = useQuery({
    queryKey: ['farms', user?.id],
    queryFn: () => (user ? farmService.getFarmsWithPlots(user.id) : []),
    enabled: Boolean(user),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CropPlanningInputFormData>({
    resolver: zodResolver(cropPlanningInputSchema),
    defaultValues: {
      farm_id: '',
      plot_id: '',
      planting_season: 'Kharif',
      intended_planting_date: new Date().toISOString().split('T')[0],
      preferred_category: 'Any',
      water_availability: 'Adequate',
      budget_enforcement: 'flexible',
      risk_tolerance: 'Medium',
      intended_use: 'Commercial',
      previous_crop: '',
      farmer_notes: '',
    },
  });

  const watchedFarmId = watch('farm_id');
  const watchedPlotId = watch('plot_id');
  const watchedSeason = watch('planting_season');
  const watchedPlantingDate = watch('intended_planting_date');
  const watchedWater = watch('water_availability');
  const watchedBudget = watch('available_budget');
  const watchedCategory = watch('preferred_category');
  const watchedEnforcement = watch('budget_enforcement');
  const watchedRisk = watch('risk_tolerance');
  const watchedUse = watch('intended_use');
  const watchedPreviousCrop = watch('previous_crop');
  const watchedNotes = watch('farmer_notes');

  const selectedFarm = useMemo(() => farms.find((f) => f.id === watchedFarmId), [farms, watchedFarmId]);
  const availablePlots = useMemo(() => selectedFarm?.plots?.filter((p) => p.status === 'active') || [], [selectedFarm]);
  const selectedPlot = useMemo(() => availablePlots.find((p) => p.id === watchedPlotId), [availablePlots, watchedPlotId]);

  // Handle farm change: reset plot
  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFarmId = e.target.value;
    setValue('farm_id', newFarmId);
    setValue('plot_id', '');
    const farm = farms.find((f) => f.id === newFarmId);
    if (farm) {
      setValue('water_availability', farm.water_availability);
    }
  };

  // Run Crop Recommendation Engine
  const recommendationResult = useMemo(() => {
    if (!selectedFarm || !selectedPlot) return null;

    return cropSuitabilityEngine.evaluate(selectedFarm, selectedPlot, {
      farm_id: selectedFarm.id,
      plot_id: selectedPlot.id,
      planting_season: watchedSeason as Season,
      intended_planting_date: watchedPlantingDate,
      preferred_category: watchedCategory as CropCategory | 'Any',
      water_availability: watchedWater,
      available_budget: watchedBudget ? Number(watchedBudget) : undefined,
      budget_enforcement: watchedEnforcement,
      risk_tolerance: watchedRisk,
      intended_use: watchedUse,
      previous_crop: watchedPreviousCrop,
      farmer_notes: watchedNotes,
    });
  }, [
    selectedFarm,
    selectedPlot,
    watchedSeason,
    watchedPlantingDate,
    watchedCategory,
    watchedWater,
    watchedBudget,
    watchedEnforcement,
    watchedRisk,
    watchedUse,
    watchedPreviousCrop,
    watchedNotes,
  ]);

  // Toggle candidate into comparison tray
  const handleToggleCompare = (candidate: CandidateCropResult) => {
    setComparedCandidates((prev) => {
      const exists = prev.some((c) => c.crop.id === candidate.crop.id);
      if (exists) {
        return prev.filter((c) => c.crop.id !== candidate.crop.id);
      }
      if (prev.length >= 3) {
        showToast('warning', 'Comparison Limit', 'You can compare up to 3 candidate crops side-by-side.');
        return prev;
      }
      return [...prev, candidate];
    });
  };

  // Select crop for plan
  const handleSelectCandidate = (candidate: CandidateCropResult) => {
    setSelectedCandidate(candidate);
    showToast('success', 'Crop Selected', `${candidate.crop.name} selected as your primary crop plan.`);
  };

  // Save Plan Mutation
  const savePlanMutation = useMutation({
    mutationFn: async ({ title, status }: { title: string; status: any }) => {
      if (!user || !selectedFarm || !selectedPlot || !selectedCandidate) {
        throw new Error('Incomplete planning parameters');
      }

      const timelineStages = cropSuitabilityEngine.generateTimeline(
        selectedCandidate.crop,
        watchedPlantingDate
      );

      const targetHarvest = timelineStages[timelineStages.length - 1]?.approx_date.split(' - ')[1] || watchedPlantingDate;

      return cropPlanService.createCropPlan(user.id, {
        farm_id: selectedFarm.id,
        plot_id: selectedPlot.id,
        title,
        status,
        selected_crop_id: selectedCandidate.crop.id,
        selected_crop_name: selectedCandidate.crop.name,
        sowing_date: watchedPlantingDate,
        target_harvest_date: targetHarvest,
        season: watchedSeason,
        inputs: {
          farm_id: selectedFarm.id,
          plot_id: selectedPlot.id,
          planting_season: watchedSeason,
          intended_planting_date: watchedPlantingDate,
          preferred_category: watchedCategory,
          water_availability: watchedWater,
          available_budget: watchedBudget ? Number(watchedBudget) : undefined,
          budget_enforcement: watchedEnforcement,
          risk_tolerance: watchedRisk,
          intended_use: watchedUse,
          previous_crop: watchedPreviousCrop,
          farmer_notes: watchedNotes,
        },
        selected_candidate_snapshot: selectedCandidate,
        shortlist_snapshots: recommendationResult?.shortlist.slice(0, 5).map((c) => ({
          crop_id: c.crop.id,
          crop_name: c.crop.name,
          total_score: c.scoring.total_score,
        })) || [],
        estimated_total_cost: selectedCandidate.economics_for_plot.cost_breakdown.total,
        illustrative_profit_estimate: selectedCandidate.economics_for_plot.illustrative_revenue?.net_profit_min,
        timeline_stages: timelineStages,
      });
    },
    onSuccess: (savedPlan) => {
      queryClient.invalidateQueries({ queryKey: ['crop_plans', user?.id] });
      showToast('success', 'Crop Plan Saved', `Plan "${savedPlan.title}" created successfully.`);
      navigate(`/app/crop-planner/${savedPlan.id}`, { replace: true });
    },
    onError: (err: any) => {
      showToast('error', 'Save Failed', err.message);
    },
  });

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/crop-planner"
          className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-600 hover:text-agri-700 transition-colors gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Saved Plans
        </Link>
        <span className="text-xs font-bold text-slate-400">
          Step {activeStep} of 4
        </span>
      </div>

      {/* Wizard Progress Stepper */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
        {[
          { step: 1, label: '1. Farm & Plot' },
          { step: 2, label: '2. Conditions' },
          { step: 3, label: '3. Recommendations' },
          { step: 4, label: '4. Economics & Save' },
        ].map((s) => (
          <button
            key={s.step}
            type="button"
            disabled={s.step > activeStep}
            onClick={() => setActiveStep(s.step as any)}
            className={`p-2.5 rounded-xl border transition-all ${
              activeStep === s.step
                ? 'bg-agri-700 text-white border-agri-700 shadow-xs'
                : activeStep > s.step
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* --- STEP 1: SELECT FARM AND PLOT --- */}
      {activeStep === 1 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg">Step 1: Select Target Farm and Plot</CardTitle>
            <p className="text-xs text-slate-500">
              Crop planning is grounded in the actual soil, irrigation, and area of your registered plots.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {isFarmsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : farms.length === 0 ? (
              <div className="p-6 text-center space-y-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-600">
                  You need to register at least one farm and plot before creating a crop plan.
                </p>
                <Link to="/app/farms">
                  <Button variant="primary" size="md">
                    Register a Farm First
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Select Farm"
                  required
                  value={watchedFarmId}
                  onChange={handleFarmChange}
                  error={errors.farm_id?.message}
                >
                  <option value="">-- Choose Farm --</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.district}, {f.state})
                    </option>
                  ))}
                </Select>

                <Select
                  label="Select Sub-Plot"
                  required
                  disabled={!watchedFarmId || availablePlots.length === 0}
                  value={watchedPlotId}
                  onChange={(e) => setValue('plot_id', e.target.value)}
                  error={errors.plot_id?.message}
                  helperText={
                    !watchedFarmId
                      ? 'Choose a farm first'
                      : availablePlots.length === 0
                      ? 'No active plots in this farm'
                      : undefined
                  }
                >
                  <option value="">-- Choose Plot --</option>
                  {availablePlots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatArea(p.area, p.area_unit)} • {p.soil_type})
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Selected Plot Review Banner */}
            {selectedPlot && selectedFarm && (
              <div className="p-4 rounded-xl bg-agri-50/60 border border-agri-200 text-xs space-y-2">
                <div className="font-bold text-agri-950 flex items-center gap-1.5 text-sm">
                  <Compass className="w-4 h-4 text-agri-700" />
                  Loaded Field Attributes for: {selectedPlot.name}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-700">
                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-agri-100">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Area: <strong>{formatArea(selectedPlot.area, selectedPlot.area_unit)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-agri-100">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Soil: <strong>{selectedPlot.soil_type}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-agri-100">
                    <Droplet className="w-3.5 h-3.5 text-sky-500" />
                    <span>Irrigation: <strong>{selectedPlot.irrigation_method}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-agri-100">
                    <span>Water: <strong>{selectedFarm.water_availability}</strong></span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!watchedFarmId || !watchedPlotId}
                onClick={() => setActiveStep(2)}
                className="gap-2"
              >
                Continue to Planting Conditions
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- STEP 2: ENTER PLANTING CONDITIONS --- */}
      {activeStep === 2 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg">Step 2: Enter Planting Season & Conditions</CardTitle>
            <p className="text-xs text-slate-500">
              Set your target season, sowing date, water security, and optional budget ceilings.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Planting Season"
                required
                error={errors.planting_season?.message}
                {...register('planting_season')}
              >
                <option value="Kharif">Kharif (Monsoon / Samba - June to Nov)</option>
                <option value="Rabi">Rabi (Winter / Navarai - Oct to March)</option>
                <option value="Zaid">Zaid (Summer / Kuruvai - March to June)</option>
                <option value="Perennial">Perennial / Annual</option>
                <option value="All-Season">All-Season</option>
              </Select>

              <Input
                label="Target Sowing / Planting Date"
                type="date"
                required
                error={errors.intended_planting_date?.message}
                {...register('intended_planting_date')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Preferred Crop Category"
                {...register('preferred_category')}
              >
                <option value="Any">Any Suitable Category</option>
                <option value="Cereals & Millets">Cereals & Millets</option>
                <option value="Pulses">Pulses (Legumes)</option>
                <option value="Oilseeds">Oilseeds</option>
                <option value="Cash Crops">Cash Crops</option>
                <option value="Vegetables">Vegetables</option>
              </Select>

              <Select
                label="Water Availability for this Season"
                required
                error={errors.water_availability?.message}
                {...register('water_availability')}
              >
                <option value="Adequate">Adequate Year-round (Borewell/Canal)</option>
                <option value="Seasonal">Seasonal (Good early, drops late)</option>
                <option value="Scarce">Scarce / Limited Groundwater</option>
                <option value="Rain-dependent">Purely Rain-dependent</option>
              </Select>

              <Select
                label="Risk Tolerance"
                {...register('risk_tolerance')}
              >
                <option value="Low">Low (Prefer stable staples with MSP)</option>
                <option value="Medium">Medium (Balanced cash crops)</option>
                <option value="High">High (High-reward vegetables/horticulture)</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Available Budget for this Plot (₹ Optional)"
                type="number"
                placeholder="e.g. 35000"
                helperText="Leave blank for unconstrained matching"
                {...register('available_budget')}
              />

              <Select
                label="Budget Enforcement"
                {...register('budget_enforcement')}
              >
                <option value="flexible">Flexible (Allow mild variance)</option>
                <option value="strict">Strict (Filter out expensive crops)</option>
                <option value="none">None</option>
              </Select>

              <Input
                label="Previous Crop Grown (Optional)"
                placeholder="e.g. Paddy / Fallow"
                helperText="Helps rotation and pest breaks"
                {...register('previous_crop')}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="md" onClick={() => setActiveStep(1)}>
                Back to Farm Selection
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSubmit(() => setActiveStep(3))}
                className="gap-2"
              >
                Generate Explainable Recommendations
                <Sparkles className="w-4 h-4 text-agri-200" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- STEP 3: RECOMMENDATIONS & COMPARISON --- */}
      {activeStep === 3 && recommendationResult && (
        <div className="space-y-6">
          {/* Engine Confidence Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white border border-slate-200 gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Agronomic Shortlist for {selectedPlot?.name}
                </h2>
                <Badge variant={recommendationResult.confidence === 'High Confidence' ? 'success' : 'warning'}>
                  {recommendationResult.confidence}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated {recommendationResult.shortlist.length} eligible crops based on verified ICAR agronomy.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                {comparedCandidates.length}/3 Comparing
              </span>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!selectedCandidate}
                onClick={() => setActiveStep(4)}
                className="gap-2"
              >
                Review Economics
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Missing Inputs or Cautions notice */}
          {recommendationResult.missing_inputs.length > 0 && (
            <Alert variant="warning" title="Data Completeness Notice">
              {recommendationResult.missing_inputs.join(' ')}
            </Alert>
          )}

          {/* Side-by-Side Comparison Table (if user checked any) */}
          {comparedCandidates.length > 0 && (
            <CropComparisonTable
              candidates={comparedCandidates}
              selectedCropId={selectedCandidate?.crop.id}
              onSelect={handleSelectCandidate}
              onRemoveFromCompare={handleToggleCompare}
            />
          )}

          {/* Candidate Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendationResult.shortlist.map((candidate) => (
              <CropCandidateCard
                key={candidate.crop.id}
                candidate={candidate}
                isSelected={selectedCandidate?.crop.id === candidate.crop.id}
                isCompared={comparedCandidates.some((c) => c.crop.id === candidate.crop.id)}
                onSelect={handleSelectCandidate}
                onToggleCompare={handleToggleCompare}
                disableCompareSelect={comparedCandidates.length >= 3}
              />
            ))}
          </div>

          {/* Ineligible Crops Explanations (Transparency) */}
          {recommendationResult.ineligible.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                <AlertTriangle className="w-4 h-4 text-slate-400" />
                Excluded Candidates ({recommendationResult.ineligible.length} crops violated constraints):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                {recommendationResult.ineligible.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <strong className="text-slate-800">{item.crop.name}:</strong>{' '}
                    <span className="text-rose-700">{item.rejection_reasons[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" size="md" onClick={() => setActiveStep(2)}>
              Adjust Planting Conditions
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!selectedCandidate}
              onClick={() => setActiveStep(4)}
              className="gap-2"
            >
              Proceed with {selectedCandidate ? selectedCandidate.crop.name : 'Selected Crop'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* --- STEP 4: ECONOMICS & TIMELINE REVIEW --- */}
      {activeStep === 4 && selectedCandidate && selectedPlot && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Final Plan Review: {selectedCandidate.crop.name}
                </h2>
                <Badge variant="success">Rank #1 Selected</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Plot: <strong>{selectedPlot.name}</strong> ({formatArea(selectedPlot.area, selectedPlot.area_unit)}) • Season: {watchedSeason}
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setIsSaveModalOpen(true)}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              Save Crop Plan
            </Button>
          </div>

          {/* Interactive Plot Economics Calculator */}
          <EstimateCalculator candidate={selectedCandidate} />

          {/* Growth Milestone Timeline */}
          <PlanTimelineView
            stages={cropSuitabilityEngine.generateTimeline(
              selectedCandidate.crop,
              watchedPlantingDate
            )}
            sowingDate={watchedPlantingDate}
            cropName={selectedCandidate.crop.name}
          />

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" size="md" onClick={() => setActiveStep(3)}>
              Back to Candidates Shortlist
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => setIsSaveModalOpen(true)}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              Save Crop Plan to My Account
            </Button>
          </div>
        </div>
      )}

      {/* Save Plan Modal */}
      {selectedCandidate && selectedPlot && (
        <SavePlanModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={async (data) => {
            await savePlanMutation.mutateAsync(data);
          }}
          defaultTitle={`${watchedSeason} ${new Date().getFullYear()} - ${selectedPlot.name} ${selectedCandidate.crop.name}`}
          cropName={selectedCandidate.crop.name}
          plotName={selectedPlot.name}
          isLoading={savePlanMutation.isPending}
        />
      )}
    </div>
  );
};
