import {
  CropTemplate,
  CropPlanningInput,
  CandidateCropResult,
  CandidateScoreBreakdown,
  TimelineStage,
} from '@/types/crop';
import { Farm, Plot } from '@/types/database';
import { convertToAcres } from '@/lib/formatters';
import { CROP_CATALOG } from '../data/cropCatalog';

export interface RecommendationEngineResult {
  shortlist: CandidateCropResult[];
  ineligible: Array<{ crop: CropTemplate; rejection_reasons: string[] }>;
  missing_inputs: string[];
  confidence: 'High Confidence' | 'Moderate Confidence' | 'Low Confidence' | 'Insufficient Data';
  assumptions_summary: string[];
}

export class CropSuitabilityEngine {
  private catalog: CropTemplate[];

  constructor(customCatalog: CropTemplate[] = CROP_CATALOG) {
    this.catalog = customCatalog;
  }

  /**
   * Main evaluation pipeline
   */
  public evaluate(
    farm: Farm,
    plot: Plot,
    input: CropPlanningInput
  ): RecommendationEngineResult {
    const missing_inputs: string[] = [];
    const assumptions_summary: string[] = [];

    // Track missing or unverified inputs
    if (!plot.soil_type || plot.soil_type === 'Other') {
      missing_inputs.push('Specific soil classification is unverified (using general loam assumption).');
    }
    if (!plot.irrigation_method || plot.irrigation_method === 'Manual') {
      missing_inputs.push('Advanced irrigation setup not specified.');
    }
    if (!input.available_budget) {
      assumptions_summary.push('Budget filtering disabled: farmer has not specified a strict capital ceiling.');
    }

    const plotAcres = convertToAcres(plot.area, plot.area_unit);

    const eligibleCandidates: CandidateCropResult[] = [];
    const ineligibleCandidates: Array<{ crop: CropTemplate; rejection_reasons: string[] }> = [];

    for (const crop of this.catalog) {
      const scoring = this.scoreCandidate(crop, farm, plot, input, plotAcres);

      if (scoring.is_eligible) {
        const economics = this.calculatePlotEconomics(crop, plotAcres, input.available_budget);

        eligibleCandidates.push({
          crop,
          scoring,
          rank: 0, // Assigned after sorting
          economics_for_plot: economics,
        });
      } else {
        ineligibleCandidates.push({
          crop,
          rejection_reasons: scoring.rejection_reasons,
        });
      }
    }

    // Sort eligible candidates by total score descending
    eligibleCandidates.sort((a, b) => b.scoring.total_score - a.scoring.total_score);

    // Assign 1-indexed ranks
    eligibleCandidates.forEach((cand, idx) => {
      cand.rank = idx + 1;
    });

    // Overall confidence rating
    let overallConfidence: RecommendationEngineResult['confidence'] = 'High Confidence';
    if (missing_inputs.length >= 2) {
      overallConfidence = 'Low Confidence';
    } else if (missing_inputs.length === 1 || eligibleCandidates.length === 0) {
      overallConfidence = 'Moderate Confidence';
    }

    if (eligibleCandidates.length === 0) {
      assumptions_summary.push('No crops in catalog fully matched all hard constraints (season, soil, water). Try relaxing constraints or exploring alternate seasons.');
    }

    return {
      shortlist: eligibleCandidates,
      ineligible: ineligibleCandidates,
      missing_inputs,
      confidence: overallConfidence,
      assumptions_summary,
    };
  }

  /**
   * Deterministic scoring function for a single candidate crop
   */
  private scoreCandidate(
    crop: CropTemplate,
    _farm: Farm,
    plot: Plot,
    input: CropPlanningInput,
    plotAcres: number
  ): CandidateScoreBreakdown {
    let soil_score = 0;
    let season_score = 0;
    let water_score = 0;
    let budget_score = 15; // default full score if no budget constraint
    let risk_score = 10;

    const rejection_reasons: string[] = [];
    const favorable_reasons: string[] = [];
    const limiting_factors: string[] = [];
    const cautions_and_risks: string[] = [];
    const missing_data_warnings: string[] = [];

    // --- 1. HARD CONSTRAINT: Season Compatibility (25 pts) ---
    const isSeasonMatch =
      crop.seasons.includes(input.planting_season) ||
      crop.seasons.includes('All-Season') ||
      crop.seasons.includes('Perennial');

    if (!isSeasonMatch) {
      rejection_reasons.push(
        `Season Mismatch: ${crop.name} is recommended for [${crop.seasons.join(', ')}], but planting season is set to ${input.planting_season}.`
      );
    } else {
      season_score = 25;
      favorable_reasons.push(`Optimal agronomic planting season for ${input.planting_season}.`);
    }

    // --- 2. HARD CONSTRAINT: Environment & Soil Compatibility (25 pts) ---
    const isEnvironmentMatch =
      crop.suitable_environments.includes(plot.farming_environment) ||
      plot.farming_environment === 'Other';

    if (!isEnvironmentMatch) {
      rejection_reasons.push(
        `Growing Environment Incompatible: Crop requires [${crop.suitable_environments.join(', ')}], but plot is configured as ${plot.farming_environment}.`
      );
    }

    const isSoilMatch = crop.suitable_soils.includes(plot.soil_type);

    if (isSoilMatch) {
      soil_score = 25;
      favorable_reasons.push(`Soil match: ${plot.soil_type} provides required texture and nutrient holding.`);
    } else if (plot.soil_type === 'Other') {
      soil_score = 12;
      missing_data_warnings.push('Plot soil is marked as "Other"; partial suitability assumed.');
    } else {
      // Check for hard soil rejections
      if (
        (crop.id === 'groundnut-peanut' && (plot.soil_type === 'Clay' || plot.soil_type === 'Black Soil')) ||
        (crop.id === 'paddy-samba' && plot.soil_type === 'Sandy Loam')
      ) {
        rejection_reasons.push(
          `Unsuitable Soil Physical Properties: ${crop.name} cannot perform adequately in ${plot.soil_type}.`
        );
      } else {
        soil_score = 8;
        cautions_and_risks.push(`Sub-optimal soil: ${plot.soil_type} is not primary preference; may require organic conditioning.`);
      }
    }

    // --- 3. HARD CONSTRAINT: Water Security & Irrigation (25 pts) ---
    const isIrrigationMatch = crop.suitable_irrigation.includes(plot.irrigation_method);

    if (input.water_availability === 'Scarce' || input.water_availability === 'Rain-dependent') {
      if (crop.water_category === 'Very High (>1400mm)') {
        rejection_reasons.push(
          `Critical Water Deficit: ${crop.name} requires ${crop.water_requirement_mm}mm of water, but plot water availability is ${input.water_availability}.`
        );
      } else if (crop.water_category === 'High (800-1400mm)') {
        water_score = 5;
        cautions_and_risks.push(`High water demand crop under limited water availability; severe stress risk during dry spells.`);
      } else {
        water_score = 22;
        favorable_reasons.push(`Low-to-moderate water demand aligns well with ${input.water_availability} water security.`);
      }
    } else {
      // Water availability is Adequate or Seasonal
      water_score = isIrrigationMatch ? 25 : 18;
      favorable_reasons.push(`Water availability (${input.water_availability}) supports cultivation.`);
      if (!isIrrigationMatch) {
        cautions_and_risks.push(`Plot irrigation method (${plot.irrigation_method}) differs from preferred [${crop.suitable_irrigation.join(', ')}].`);
      }
    }

    // --- 4. Budget Constraint (15 pts) ---
    const estimatedCostForPlot = crop.typical_cost_per_acre.total * plotAcres;

    if (input.available_budget && input.available_budget > 0) {
      if (estimatedCostForPlot > input.available_budget) {
        const deficit = estimatedCostForPlot - input.available_budget;
        const deficitPercent = Math.round((deficit / input.available_budget) * 100);

        if (input.budget_enforcement === 'strict' && deficitPercent > 20) {
          rejection_reasons.push(
            `Budget Limit Exceeded: Estimated investment (₹${estimatedCostForPlot.toLocaleString()}) exceeds available budget (₹${input.available_budget.toLocaleString()}) by ${deficitPercent}%.`
          );
        } else {
          budget_score = Math.max(2, 15 - Math.min(13, Math.round(deficitPercent / 10)));
          cautions_and_risks.push(
            `Estimated cost (₹${estimatedCostForPlot.toLocaleString()}) is ${deficitPercent}% higher than budgeted ₹${input.available_budget.toLocaleString()}.`
          );
        }
      } else {
        budget_score = 15;
        favorable_reasons.push(`Estimated investment (₹${estimatedCostForPlot.toLocaleString()}) is comfortably within your budget (₹${input.available_budget.toLocaleString()}).`);
      }
    }

    // --- 5. Risk & Category Alignment (10 pts) ---
    if (input.preferred_category && input.preferred_category !== 'Any') {
      if (crop.category === input.preferred_category) {
        favorable_reasons.push(`Directly matches your preferred crop category (${crop.category}).`);
      } else {
        risk_score -= 3;
      }
    }

    if (input.risk_tolerance === 'Low') {
      if (crop.category === 'Vegetables') {
        risk_score -= 4;
        cautions_and_risks.push(`Vegetables carry high market price volatility; monitor perishability for low risk tolerance.`);
      } else if (crop.category === 'Pulses' || crop.category === 'Cereals & Millets') {
        favorable_reasons.push(`Stable staple crop with low market perishability and MSP safety net.`);
      }
    }

    // Calculate total score
    const total_score = soil_score + season_score + water_score + budget_score + risk_score;
    const is_eligible = rejection_reasons.length === 0;

    // Identify explicit limiting factors based on sub-optimal component scores
    if (soil_score < 25) {
      limiting_factors.push(
        plot.soil_type === 'Other'
          ? 'Unclassified soil texture ("Other") limits precise nutrient uptake estimation; soil test recommended.'
          : `Sub-optimal soil texture (${plot.soil_type}) limits peak vegetative potential compared to primary preference.`
      );
    }
    if (water_score < 25) {
      limiting_factors.push(
        `Water availability (${input.water_availability}) or irrigation method (${plot.irrigation_method}) restricts moisture intake relative to ${crop.name}'s ${crop.water_requirement_mm}mm requirement.`
      );
    }
    if (budget_score < 15) {
      limiting_factors.push('Plot capital budget is constrained relative to full ICAR recommended package.');
    }
    if (risk_score < 10) {
      limiting_factors.push(`Market price volatility or crop perishability under ${input.risk_tolerance || 'standard'} risk tolerance.`);
    }

    // Epistemic confidence rating for this candidate
    let confidence: CandidateScoreBreakdown['confidence'] = 'High Confidence';
    if (missing_data_warnings.length > 0 || cautions_and_risks.length >= 2 || limiting_factors.length >= 2) {
      confidence = 'Moderate Confidence';
    }

    return {
      soil_score,
      season_score,
      water_score,
      budget_score,
      risk_score,
      total_score: is_eligible ? Math.min(100, Math.max(0, total_score)) : 0,
      is_eligible,
      rejection_reasons,
      favorable_reasons,
      limiting_factors,
      cautions_and_risks,
      missing_data_warnings,
      confidence,
    };
  }

  /**
   * Scale per-acre costs & returns for the specific plot
   */
  public calculatePlotEconomics(
    crop: CropTemplate,
    plotAcres: number,
    _availableBudget?: number
  ): CandidateCropResult['economics_for_plot'] {
    const cost = crop.typical_cost_per_acre;
    const yieldSpec = crop.expected_yield_per_acre;
    const priceSpec = crop.typical_selling_price_per_unit;

    const scaledCost = {
      seeds: Math.round(cost.seeds * plotAcres),
      fertilizers: Math.round(cost.fertilizers * plotAcres),
      irrigation: Math.round(cost.irrigation * plotAcres),
      labor: Math.round(cost.labor * plotAcres),
      protection: Math.round(cost.protection * plotAcres),
      machinery: Math.round(cost.machinery * plotAcres),
      total: Math.round(cost.total * plotAcres),
    };

    const scaledYieldMin = Number((yieldSpec.min * plotAcres).toFixed(1));
    const scaledYieldMax = Number((yieldSpec.max * plotAcres).toFixed(1));

    // Revenue calculations using modal price benchmark
    const price = priceSpec.modal;
    const grossRevMin = Math.round(scaledYieldMin * price);
    const grossRevMax = Math.round(scaledYieldMax * price);
    const netProfitMin = grossRevMin - scaledCost.total;
    const netProfitMax = grossRevMax - scaledCost.total;

    return {
      plot_acres: plotAcres,
      cost_breakdown: scaledCost,
      projected_yield: {
        min: scaledYieldMin,
        max: scaledYieldMax,
        unit: yieldSpec.unit,
      },
      illustrative_revenue: {
        price_per_unit: price,
        gross_revenue_min: grossRevMin,
        gross_revenue_max: grossRevMax,
        net_profit_min: netProfitMin,
        net_profit_max: netProfitMax,
        assumptions: `Based on ₹${price}/${priceSpec.unit} benchmark (${priceSpec.source}) and estimated yield of ${scaledYieldMin}-${scaledYieldMax} ${yieldSpec.unit} across ${plotAcres} acres. Illustrative only.`,
      },
    };
  }

  /**
   * Generates chronological growth stage milestones starting from a sowing date
   */
  public generateTimeline(
    crop: CropTemplate,
    sowingDateStr: string
  ): TimelineStage[] {
    const sowingDate = new Date(sowingDateStr);
    const avgDuration = Math.round((crop.duration_days_min + crop.duration_days_max) / 2);

    const formatStageDate = (daysFromStart: number): string => {
      const d = new Date(sowingDate);
      d.setDate(d.getDate() + daysFromStart);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (crop.category === 'Cereals & Millets') {
      const s1 = Math.round(avgDuration * 0.15); // Nursery / Germination
      const s2 = Math.round(avgDuration * 0.40); // Tillering / Vegetative
      const s3 = Math.round(avgDuration * 0.70); // Panicle / Flowering
      const s4 = Math.round(avgDuration * 0.90); // Grain filling / Dough

      return [
        {
          stage_name: 'Sowing & Germination',
          start_day: 0,
          end_day: s1,
          approx_date: `${formatStageDate(0)} - ${formatStageDate(s1)}`,
          guidance: 'Seed treatment with bio-fertilizers; maintain shallow moisture; prepare nursery beds.',
        },
        {
          stage_name: 'Vegetative & Tillering',
          start_day: s1 + 1,
          end_day: s2,
          approx_date: `${formatStageDate(s1 + 1)} - ${formatStageDate(s2)}`,
          guidance: 'Top dressing with nitrogen; first hand weeding or mechanical weeding; water regulation.',
        },
        {
          stage_name: 'Panicle Initiation & Flowering',
          start_day: s2 + 1,
          end_day: s3,
          approx_date: `${formatStageDate(s2 + 1)} - ${formatStageDate(s3)}`,
          guidance: 'Critical water-sensitive period: prevent moisture stress; inspect for stem borer or blast.',
        },
        {
          stage_name: 'Grain Filling & Maturity',
          start_day: s3 + 1,
          end_day: s4,
          approx_date: `${formatStageDate(s3 + 1)} - ${formatStageDate(s4)}`,
          guidance: 'Maintain saturated soil; drain standing water 10-12 days before anticipated harvest.',
        },
        {
          stage_name: 'Harvest & Threshing',
          start_day: s4 + 1,
          end_day: avgDuration,
          approx_date: `${formatStageDate(s4 + 1)} - ${formatStageDate(avgDuration)}`,
          guidance: 'Harvest when 85-90% grains turn golden yellow. Dry grain to 12-14% moisture for storage.',
        },
      ];
    }

    if (crop.category === 'Pulses' || crop.category === 'Oilseeds') {
      const s1 = Math.round(avgDuration * 0.20);
      const s2 = Math.round(avgDuration * 0.50);
      const s3 = Math.round(avgDuration * 0.85);

      return [
        {
          stage_name: 'Sowing & Emergence',
          start_day: 0,
          end_day: s1,
          approx_date: `${formatStageDate(0)} - ${formatStageDate(s1)}`,
          guidance: 'Treat seeds with Rhizobium culture; ensure proper row spacing.',
        },
        {
          stage_name: 'Vegetative & Branching',
          start_day: s1 + 1,
          end_day: s2,
          approx_date: `${formatStageDate(s1 + 1)} - ${formatStageDate(s2)}`,
          guidance: 'Inter-cultivation and weeding; monitor for sucking pests and yellow mosaic.',
        },
        {
          stage_name: 'Flowering & Pod Formation',
          start_day: s2 + 1,
          end_day: s3,
          approx_date: `${formatStageDate(s2 + 1)} - ${formatStageDate(s3)}`,
          guidance: 'Critical irrigation if rainfed; monitor for pod borers; avoid moisture stress.',
        },
        {
          stage_name: 'Pod Maturity & Harvesting',
          start_day: s3 + 1,
          end_day: avgDuration,
          approx_date: `${formatStageDate(s3 + 1)} - ${formatStageDate(avgDuration)}`,
          guidance: 'Harvest when pods turn brown/black; dry thoroughly to prevent fungal storage mold.',
        },
      ];
    }

    // Default horticultural / cash crop stages
    const s1 = Math.round(avgDuration * 0.20);
    const s2 = Math.round(avgDuration * 0.55);
    const s3 = Math.round(avgDuration * 0.85);

    return [
      {
        stage_name: 'Transplanting / Sowing & Establishment',
        start_day: 0,
        end_day: s1,
        approx_date: `${formatStageDate(0)} - ${formatStageDate(s1)}`,
        guidance: 'Root-dip seedlings in bio-agent; light irrigation every 2-3 days until established.',
      },
      {
        stage_name: 'Active Vegetative Growth',
        start_day: s1 + 1,
        end_day: s2,
        approx_date: `${formatStageDate(s1 + 1)} - ${formatStageDate(s2)}`,
        guidance: 'Staking/trellising; fertigation schedule; weed control.',
      },
      {
        stage_name: 'Flowering & Fruit Setting',
        start_day: s2 + 1,
        end_day: s3,
        approx_date: `${formatStageDate(s2 + 1)} - ${formatStageDate(s3)}`,
        guidance: 'Regular irrigation; micronutrient sprays; IPM for fruit borers.',
      },
      {
        stage_name: 'Harvesting & Picking Cycles',
        start_day: s3 + 1,
        end_day: avgDuration,
        approx_date: `${formatStageDate(s3 + 1)} - ${formatStageDate(avgDuration)}`,
        guidance: 'Multiple pickings at breaker / ripe stage; grade produce for mandi wholesale.',
      },
    ];
  }
}

export const cropSuitabilityEngine = new CropSuitabilityEngine();
