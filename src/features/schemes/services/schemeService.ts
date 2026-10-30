// CropDiary AI — Government Schemes Service
import { storageAdapter } from '@/services/storageAdapter';
import {
  GovernmentScheme,
  SchemeFilterParams,
  SchemeEligibilityAssessment,
} from '@/types/schemes';
import { VERIFIED_GOVERNMENT_SCHEMES } from '../data/verifiedSchemesCatalog';

export const schemeService = {
  async getSchemes(filters?: SchemeFilterParams): Promise<GovernmentScheme[]> {
    let list = [...VERIFIED_GOVERNMENT_SCHEMES];

    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.name_ta.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
      );
    }

    if (filters?.category && filters.category !== 'all') {
      list = list.filter((s) => s.category === filters.category);
    }

    if (filters?.scope && filters.scope !== 'all') {
      list = list.filter((s) => s.scope === filters.scope);
    }

    if (filters?.state && filters.state !== 'all') {
      list = list.filter((s) => s.state === 'All India' || s.state === filters.state);
    }

    if (filters?.beneficiaryType && filters.beneficiaryType !== 'all') {
      list = list.filter(
        (s) =>
          s.beneficiary_type === 'all_farmers' ||
          s.beneficiary_type === filters.beneficiaryType
      );
    }

    return list;
  },

  async getSchemeById(schemeId: string): Promise<GovernmentScheme | null> {
    const scheme =
      VERIFIED_GOVERNMENT_SCHEMES.find((s) => s.id === schemeId || s.code === schemeId) ||
      null;
    return scheme;
  },

  assessFarmerEligibility(
    scheme: GovernmentScheme,
    context: {
      totalAcreage: number;
      cropsGrown: string[];
      state?: string;
    }
  ): SchemeEligibilityAssessment {
    const matchedCriteria: string[] = [];
    const unmatchedCriteria: string[] = [];
    const pendingDetails: string[] = [];

    // 1. Geographic Scope Check
    const farmerState = context.state || 'Tamil Nadu';
    if (scheme.state === 'All India' || scheme.state.toLowerCase() === farmerState.toLowerCase()) {
      matchedCriteria.push(`Location matches scheme jurisdiction (${scheme.state}).`);
    } else {
      unmatchedCriteria.push(
        `Scheme is restricted to ${scheme.state}, but farm is located in ${farmerState}.`
      );
    }

    // 2. Landholding Criteria
    if (scheme.max_landholding_acres !== null && scheme.max_landholding_acres !== undefined) {
      if (context.totalAcreage <= scheme.max_landholding_acres) {
        matchedCriteria.push(
          `Farm area (${context.totalAcreage} acres) qualifies for Small & Marginal classification (limit: ${scheme.max_landholding_acres} acres).`
        );
      } else {
        unmatchedCriteria.push(
          `Registered farm area (${context.totalAcreage} acres) exceeds small/marginal cap of ${scheme.max_landholding_acres} acres.`
        );
      }
    } else {
      matchedCriteria.push('No landholding ceiling constraint; open to all farm sizes.');
    }

    // 3. Crop Eligibility
    if (scheme.eligible_crops.includes('All Crops')) {
      matchedCriteria.push('Valid for all agricultural crops.');
    } else {
      const hasCropMatch = context.cropsGrown.some((c) =>
        scheme.eligible_crops.some((sc) => sc.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(sc.toLowerCase()))
      );

      if (hasCropMatch) {
        matchedCriteria.push(`Cultivated crop matches eligible crop list (${scheme.eligible_crops.join(', ')}).`);
      } else if (context.cropsGrown.length > 0) {
        unmatchedCriteria.push(
          `Scheme applies specifically to ${scheme.eligible_crops.join(', ')}, while your registered crops are ${context.cropsGrown.join(', ')}.`
        );
      } else {
        pendingDetails.push('Add active crop plans to your farm to verify specific crop eligibility.');
      }
    }

    // 4. Document Verification Checklist
    pendingDetails.push('Verification of Aadhaar-linked bank account and land title (Patta/Chitta) required during official application.');

    // Status Determination
    let status: 'potentially_eligible' | 'more_info_needed' | 'criteria_not_met' = 'potentially_eligible';

    if (unmatchedCriteria.length > 0) {
      status = 'criteria_not_met';
    } else if (pendingDetails.length > 1 && context.cropsGrown.length === 0) {
      status = 'more_info_needed';
    }

    let explanation = '';
    let recommendation = '';

    if (status === 'potentially_eligible') {
      explanation = `Based on your recorded ${context.totalAcreage} acres in ${farmerState}, your farm appears potentially aligned with the public criteria of ${scheme.name}.`;
      recommendation = `Review required documents (${scheme.required_documents.slice(0, 3).join(', ')}) and apply through the official government portal (${scheme.official_portal_url}).`;
    } else if (status === 'more_info_needed') {
      explanation = `Your farm location matches, but additional information on crop varieties and active season is needed.`;
      recommendation = 'Update your crop plans in the Smart Crop Planner to complete eligibility discovery.';
    } else {
      explanation = `One or more requirements do not match your farm profile: ${unmatchedCriteria[0]}`;
      recommendation = 'Explore alternate general schemes open to all landholding sizes.';
    }

    return {
      schemeId: scheme.id,
      schemeCode: scheme.code,
      schemeName: scheme.name,
      status,
      matchedCriteria,
      unmatchedCriteria,
      pendingDetails,
      explanation,
      recommendation,
    };
  },

  async createSchemeDeadlineReminder(
    userId: string,
    farmId: string,
    scheme: GovernmentScheme,
    dueDate: string,
    customNotes?: string
  ): Promise<void> {
    const title = `Government Scheme Deadline: ${scheme.code} (${scheme.name})`;
    const notes = `Apply via official portal: ${scheme.official_portal_url}. Required docs: ${scheme.required_documents.slice(0, 3).join(', ')}. ${customNotes || ''}`;

    await storageAdapter.createReminder(userId, {
      farm_id: farmId,
      category: 'custom',
      title,
      due_date: `${dueDate}T09:00:00Z`,
      description: notes,
      timezone: 'Asia/Kolkata',
      recurrence: 'none',
      status: 'pending',
    });
  },
};
