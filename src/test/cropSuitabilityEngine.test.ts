import { describe, it, expect, beforeEach } from 'vitest';
import { cropSuitabilityEngine } from '../features/crop-planner/services/cropSuitabilityEngine';
import { cropPlanService } from '../services/cropPlanService';
import { Farm, Plot } from '../types/database';
import { CropPlanningInput } from '../types/crop';

describe('Phase 2 — Smart Crop Planner & Suitability Engine', () => {
  const mockFarm: Farm = {
    id: 'farm-101',
    owner_id: 'user-farmer-1',
    name: 'Kaveri Delta Farm',
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Thanjavur',
    area: 5.0,
    area_unit: 'Acres',
    farming_type: 'Open field',
    soil_type: 'Clay Loam',
    irrigation_method: 'Borewell Canal',
    water_availability: 'Adequate',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockClayPlot: Plot = {
    id: 'plot-201',
    farm_id: 'farm-101',
    owner_id: 'user-farmer-1',
    name: 'Samba Lowland Block',
    area: 2.0,
    area_unit: 'Acres',
    soil_type: 'Clay',
    irrigation_method: 'Flood/Furrow',
    farming_environment: 'Open field',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockSandyPlot: Plot = {
    id: 'plot-202',
    farm_id: 'farm-101',
    owner_id: 'user-farmer-1',
    name: 'Upland Sandy Patch',
    area: 1.5,
    area_unit: 'Acres',
    soil_type: 'Sandy Loam',
    irrigation_method: 'Drip',
    farming_environment: 'Open field',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();
  });

  describe('Agronomic Hard Constraints & Suitability Scoring', () => {
    it('recommends Paddy Samba for Kharif on Clay soil with adequate water', () => {
      const input: CropPlanningInput = {
        farm_id: mockFarm.id,
        plot_id: mockClayPlot.id,
        planting_season: 'Kharif',
        intended_planting_date: '2026-07-15',
        water_availability: 'Adequate',
      };

      const result = cropSuitabilityEngine.evaluate(mockFarm, mockClayPlot, input);

      expect(result.shortlist.length).toBeGreaterThan(0);
      const paddyCandidate = result.shortlist.find((c) => c.crop.id === 'paddy-samba');
      expect(paddyCandidate).toBeDefined();
      expect(paddyCandidate!.scoring.is_eligible).toBe(true);
      expect(paddyCandidate!.scoring.total_score).toBeGreaterThanOrEqual(80);
      expect(paddyCandidate!.scoring.soil_score).toBe(25);
      expect(paddyCandidate!.scoring.season_score).toBe(25);
    });

    it('rejects Groundnut on Heavy Clay soil due to pegging physical constraints', () => {
      const input: CropPlanningInput = {
        farm_id: mockFarm.id,
        plot_id: mockClayPlot.id,
        planting_season: 'Kharif',
        intended_planting_date: '2026-07-15',
        water_availability: 'Adequate',
      };

      const result = cropSuitabilityEngine.evaluate(mockFarm, mockClayPlot, input);

      // Groundnut should be in ineligible list with specific physical soil rejection reason
      const groundnutExcluded = result.ineligible.find((item) => item.crop.id === 'groundnut-peanut');
      expect(groundnutExcluded).toBeDefined();
      expect(groundnutExcluded!.rejection_reasons.some((r) => r.includes('Soil Physical Properties'))).toBe(true);
    });

    it('recommends Groundnut on Sandy Loam soil with high score', () => {
      const input: CropPlanningInput = {
        farm_id: mockFarm.id,
        plot_id: mockSandyPlot.id,
        planting_season: 'Kharif',
        intended_planting_date: '2026-07-15',
        water_availability: 'Adequate',
      };

      const result = cropSuitabilityEngine.evaluate(mockFarm, mockSandyPlot, input);

      const groundnutCandidate = result.shortlist.find((c) => c.crop.id === 'groundnut-peanut');
      expect(groundnutCandidate).toBeDefined();
      expect(groundnutCandidate!.scoring.is_eligible).toBe(true);
      expect(groundnutCandidate!.scoring.soil_score).toBe(25);
    });

    it('rejects high-water demanding crops under Scarce or Rain-dependent water security', () => {
      const dryInput: CropPlanningInput = {
        farm_id: mockFarm.id,
        plot_id: mockClayPlot.id,
        planting_season: 'Kharif',
        intended_planting_date: '2026-07-15',
        water_availability: 'Scarce',
      };

      const result = cropSuitabilityEngine.evaluate(mockFarm, mockClayPlot, dryInput);

      // Sugarcane and Paddy Samba require Very High water (>1400mm)
      const sugarcaneExcluded = result.ineligible.find((item) => item.crop.id === 'sugarcane-perennial');
      expect(sugarcaneExcluded).toBeDefined();
      expect(sugarcaneExcluded!.rejection_reasons.some((r) => r.includes('Critical Water Deficit'))).toBe(true);
    });

    it('strictly filters out crops that exceed budget when strict enforcement is on', () => {
      const lowBudgetInput: CropPlanningInput = {
        farm_id: mockFarm.id,
        plot_id: mockSandyPlot.id, // 1.5 acres
        planting_season: 'Kharif',
        intended_planting_date: '2026-07-15',
        water_availability: 'Adequate',
        available_budget: 15000, // Very low budget for 1.5 acres
        budget_enforcement: 'strict',
      };

      const result = cropSuitabilityEngine.evaluate(mockFarm, mockSandyPlot, lowBudgetInput);

      // Tomato costs ~39,000/acre (58,500 for 1.5 acres), which drastically exceeds 15,000
      const tomatoExcluded = result.ineligible.find((item) => item.crop.id === 'tomato-hybrid');
      expect(tomatoExcluded).toBeDefined();
      expect(tomatoExcluded!.rejection_reasons.some((r) => r.includes('Budget Limit Exceeded'))).toBe(true);
    });

    it('downgrades confidence rating when plot soil is unspecified or "Other"', () => {
      const unverifiedPlot: Plot = {
        ...mockSandyPlot,
        soil_type: 'Other',
      };

      const input: CropPlanningInput = {
        farm_id: mockFarm.id,
        plot_id: unverifiedPlot.id,
        planting_season: 'Kharif',
        intended_planting_date: '2026-07-15',
        water_availability: 'Adequate',
      };

      const result = cropSuitabilityEngine.evaluate(mockFarm, unverifiedPlot, input);

      expect(result.missing_inputs.length).toBeGreaterThan(0);
      expect(result.confidence).not.toBe('High Confidence');
    });
  });

  describe('Economics Calculation & Plot Scaling', () => {
    it('scales costs and yields accurately for the plot area (2.0 acres)', () => {
      const input: CropPlanningInput = {
        farm_id: mockFarm.id,
        plot_id: mockClayPlot.id,
        planting_season: 'Kharif',
        intended_planting_date: '2026-07-15',
        water_availability: 'Adequate',
      };

      const result = cropSuitabilityEngine.evaluate(mockFarm, mockClayPlot, input);
      const maize = result.shortlist.find((c) => c.crop.id === 'maize-hybrid');
      expect(maize).toBeDefined();

      const econ = maize!.economics_for_plot;
      expect(econ.plot_acres).toBe(2.0);

      // Maize cost per acre is 22,900 => For 2.0 acres = 45,800
      expect(econ.cost_breakdown.total).toBe(22900 * 2);

      // Yield per acre is 24-32 => For 2.0 acres = 48-64
      expect(econ.projected_yield.min).toBe(48);
      expect(econ.projected_yield.max).toBe(64);

      // Net profit calculation verification
      expect(econ.illustrative_revenue).toBeDefined();
      expect(econ.illustrative_revenue!.gross_revenue_min).toBe(48 * maize!.crop.typical_selling_price_per_unit.modal);
    });
  });

  describe('Growth Timeline Milestone Generator', () => {
    it('generates sequential non-overlapping milestones', () => {
      const input: CropPlanningInput = {
        farm_id: mockFarm.id,
        plot_id: mockClayPlot.id,
        planting_season: 'Kharif',
        intended_planting_date: '2026-07-01',
        water_availability: 'Adequate',
      };

      const result = cropSuitabilityEngine.evaluate(mockFarm, mockClayPlot, input);
      const candidate = result.shortlist[0];

      const stages = cropSuitabilityEngine.generateTimeline(candidate.crop, '2026-07-01');

      expect(stages.length).toBeGreaterThanOrEqual(4);
      expect(stages[0].stage_name).toContain('Sowing');
      expect(stages[stages.length - 1].stage_name).toContain('Harvest');

      // Verify start_day sequence
      for (let i = 1; i < stages.length; i++) {
        expect(stages[i].start_day).toBe(stages[i - 1].end_day + 1);
      }
    });
  });

  describe('Crop Plan Persistence & Lifecycle Service', () => {
    const userId = 'user-farmer-1';

    it('creates, saves, retrieves, and updates crop plans', async () => {
      // First save plot into storage so foreign key checks pass
      await (await import('../services/storageAdapter')).storageAdapter.createFarm(userId, {
        name: mockFarm.name,
        country: mockFarm.country,
        state: mockFarm.state,
        district: mockFarm.district,
        area: mockFarm.area,
        area_unit: mockFarm.area_unit,
        farming_type: mockFarm.farming_type,
        soil_type: mockFarm.soil_type,
        irrigation_method: mockFarm.irrigation_method,
        water_availability: mockFarm.water_availability,
        status: 'active',
      });

      const farmInDb = (await (await import('../services/storageAdapter')).storageAdapter.getFarms(userId))[0];
      const plotInDb = await (await import('../services/storageAdapter')).storageAdapter.createPlot(userId, {
        farm_id: farmInDb.id,
        name: mockClayPlot.name,
        area: mockClayPlot.area,
        area_unit: mockClayPlot.area_unit,
        soil_type: mockClayPlot.soil_type,
        irrigation_method: mockClayPlot.irrigation_method,
        farming_environment: mockClayPlot.farming_environment,
        status: 'active',
      });

      const input: CropPlanningInput = {
        farm_id: farmInDb.id,
        plot_id: plotInDb.id,
        planting_season: 'Kharif',
        intended_planting_date: '2026-08-01',
        water_availability: 'Adequate',
      };

      const evalResult = cropSuitabilityEngine.evaluate(farmInDb, plotInDb, input);
      const chosen = evalResult.shortlist[0];

      // Create Plan
      const createdPlan = await cropPlanService.createCropPlan(userId, {
        farm_id: farmInDb.id,
        plot_id: plotInDb.id,
        title: 'Kharif 2026 Main Plan',
        status: 'Planned',
        selected_crop_id: chosen.crop.id,
        selected_crop_name: chosen.crop.name,
        sowing_date: '2026-08-01',
        target_harvest_date: '2026-11-20',
        season: 'Kharif',
        inputs: input,
        selected_candidate_snapshot: chosen,
        shortlist_snapshots: [],
        estimated_total_cost: chosen.economics_for_plot.cost_breakdown.total,
        timeline_stages: [],
      });

      expect(createdPlan.id).toBeDefined();
      expect(createdPlan.title).toBe('Kharif 2026 Main Plan');

      // Fetch by ID
      const fetched = await cropPlanService.getCropPlanById(userId, createdPlan.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.selected_crop_name).toBe(chosen.crop.name);

      // Update status to Active
      const updated = await cropPlanService.updatePlanStatus(userId, createdPlan.id, 'Active');
      expect(updated.status).toBe('Active');

      // Duplicate plan for Rabi season
      const duplicated = await cropPlanService.duplicateCropPlan(
        userId,
        createdPlan.id,
        'Rabi',
        '2026-12-01'
      );
      expect(duplicated.season).toBe('Rabi');
      expect(duplicated.status).toBe('Draft');
      expect(duplicated.sowing_date).toBe('2026-12-01');

      // Verify total plans in DB
      const allPlans = await cropPlanService.getCropPlans(userId);
      expect(allPlans.length).toBe(2);

      // Delete plan
      await cropPlanService.deleteCropPlan(userId, createdPlan.id);
      const remainingPlans = await cropPlanService.getCropPlans(userId);
      expect(remainingPlans.length).toBe(1);
    });
  });
});
