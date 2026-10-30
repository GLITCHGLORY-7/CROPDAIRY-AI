// CropDiary AI — Phase 7 AI Farm Assistant & Government Schemes Vitest Suite
import { describe, it, expect, beforeEach } from 'vitest';
import { storageAdapter } from '@/services/storageAdapter';
import { localAgriculturalAssistantAdapter } from '@/features/assistant/services/localAgriculturalAssistantAdapter';
import { schemeService } from '@/features/schemes/services/schemeService';
import { VERIFIED_GOVERNMENT_SCHEMES } from '@/features/schemes/data/verifiedSchemesCatalog';
import { FarmContextPayload } from '@/types/assistant';

describe('Phase 7: AI Farm Assistant, Regional Languages & Government Schemes', () => {
  const userId = 'farmer-assistant-test-user';
  const farmId = 'farm-thanjavur-delta-01';

  const mockFarmContext: FarmContextPayload = {
    selectedFarmId: farmId,
    farms: [
      {
        id: farmId,
        name: 'Cauvery Green Acres',
        location: 'Thanjavur, Tamil Nadu',
        totalArea: 4.5,
      },
    ],
    plots: [
      {
        id: 'plot-paddy-a',
        name: 'North Delta Field',
        area: 4.5,
        soilType: 'Clay Loam',
        crop: 'Paddy (Samba)',
      },
    ],
    activeCropPlans: [
      {
        id: 'plan-paddy-2026',
        cropName: 'Paddy (CR 1009 Sub 1)',
        season: 'Samba',
        sowingDate: '2026-08-15',
      },
    ],
    recentActivities: [
      {
        id: 'act-weeding-01',
        title: 'Cono-weeder second pass in Block A',
        date: '2026-09-10',
        category: 'activity',
      },
      {
        id: 'act-irrigation-01',
        title: 'Alternate wetting and drying irrigation',
        date: '2026-09-12',
        category: 'irrigation',
      },
    ],
    recentExpenses: [
      {
        id: 'exp-seeds-01',
        title: 'Certified Paddy Seed Bag (30kg)',
        amount: 2400,
        category: 'seeds',
        date: '2026-08-10',
      },
      {
        id: 'exp-fert-01',
        title: 'Neem-coated Urea & Potash basal dose',
        amount: 3850,
        category: 'fertilizer',
        date: '2026-08-18',
      },
    ],
    recentHarvests: [
      {
        id: 'harv-paddy-01',
        cropName: 'Paddy',
        quantity: 28,
        unit: 'Quintals',
        date: '2026-01-20',
      },
    ],
    recentSales: [
      {
        id: 'sale-paddy-01',
        cropName: 'Paddy',
        grossRevenue: 64400,
        netProceeds: 62200,
        date: '2026-01-25',
      },
    ],
    budgets: [
      {
        id: 'bud-samba-01',
        name: 'Samba Season Budget',
        planned: 40000,
        spent: 6250,
        percentUsed: 15.6,
        status: 'on_track',
      },
    ],
    weatherAlerts: [
      {
        id: 'alt-rain-01',
        title: 'Heavy Rainfall Warning (IMD Red Alert)',
        severity: 'critical',
        action: 'Clear field drainage channels and postpone urea topdressing',
      },
    ],
    recentAssessments: [
      {
        id: 'diag-blast-01',
        diagnosis: 'Rice Blast (Magnaporthe oryzae)',
        severity: 'high',
        date: '2026-09-05',
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
  });

  // --- 1. Storage Adapter Operations ---
  describe('1. Assistant Conversation & Message Persistence', () => {
    it('creates and retrieves assistant conversations with user isolation', async () => {
      const conv = await storageAdapter.createAssistantConversation(userId, {
        title: 'Samba Crop Disease Advice',
        preferred_language: 'en',
        farm_id: farmId,
      });

      expect(conv.id).toBeDefined();
      expect(conv.title).toBe('Samba Crop Disease Advice');
      expect(conv.preferred_language).toBe('en');
      expect(conv.farm_id).toBe(farmId);

      const list = await storageAdapter.getAssistantConversations(userId);
      expect(list.length).toBe(1);
      expect(list[0].id).toBe(conv.id);

      // Verify user isolation
      const otherUserList = await storageAdapter.getAssistantConversations('other-user-999');
      expect(otherUserList.length).toBe(0);
    });

    it('persists assistant messages with verified sources and chronological order', async () => {
      const conv = await storageAdapter.createAssistantConversation(userId, {
        title: 'Expense Inquiry',
        preferred_language: 'en',
      });

      const userMsg = await storageAdapter.createAssistantMessage(userId, {
        conversation_id: conv.id,
        role: 'user',
        content: 'How much have I spent on fertilizer?',
      });

      const assistantMsg = await storageAdapter.createAssistantMessage(userId, {
        conversation_id: conv.id,
        role: 'assistant',
        content: 'You have recorded ₹3,850 for fertilizer.',
        sources: [
          {
            recordType: 'expense',
            recordId: 'exp-fert-01',
            title: 'Neem-coated Urea & Potash basal dose',
          },
        ],
        model_name: 'icar-tnau-expert-engine',
      });

      expect(userMsg.id).toBeDefined();
      expect(assistantMsg.sources?.length).toBe(1);
      expect(assistantMsg.sources?.[0].recordType).toBe('expense');

      const messages = await storageAdapter.getAssistantMessages(userId, conv.id);
      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
    });

    it('deletes conversation and cascades message cleanup', async () => {
      const conv = await storageAdapter.createAssistantConversation(userId, {
        title: 'Temporary Thread',
      });
      await storageAdapter.createAssistantMessage(userId, {
        conversation_id: conv.id,
        role: 'user',
        content: 'Hello',
      });

      await storageAdapter.deleteAssistantConversation(userId, conv.id);
      const remainingConvs = await storageAdapter.getAssistantConversations(userId);
      const remainingMsgs = await storageAdapter.getAssistantMessages(userId, conv.id);

      expect(remainingConvs.length).toBe(0);
      expect(remainingMsgs.length).toBe(0);
    });
  });

  // --- 2. Grounded Agricultural Assistant Reasoning ---
  describe('2. Grounded ICAR / TNAU Local Reasoning Engine', () => {
    it('answers expense questions strictly using recorded transactions with citations (English)', async () => {
      const response = await localAgriculturalAssistantAdapter.generateResponse(
        'What expenses have I recorded this month?',
        mockFarmContext,
        'en'
      );

      expect(response.usedFarmerRecords).toBe(true);
      expect(response.content).toContain('₹6,250'); // 2400 + 3850
      expect(response.sources.length).toBeGreaterThan(0);
      expect(response.sources.some((s) => s.recordType === 'expense')).toBe(true);
      expect(response.disclaimer).toContain('ICAR');
    });

    it('answers expense inquiries in Tamil with Tamil currency formatting (Tamil)', async () => {
      const response = await localAgriculturalAssistantAdapter.generateResponse(
        'எனது பண்ணை செலவுகள் எவ்வளவு?',
        mockFarmContext,
        'ta'
      );

      expect(response.usedFarmerRecords).toBe(true);
      expect(response.content).toContain('₹6,250');
      expect(response.content).toContain('செலவுகள்');
      expect(response.sources.some((s) => s.recordType === 'expense')).toBe(true);
    });

    it('answers weather inquiries with active severe alert instructions', async () => {
      const response = await localAgriculturalAssistantAdapter.generateResponse(
        'Are there any weather alerts or rainfall warnings?',
        mockFarmContext,
        'en'
      );

      expect(response.usedFarmerRecords).toBe(true);
      expect(response.content).toContain('Heavy Rainfall Warning');
      expect(response.content).toContain('drainage channels');
      expect(response.sources.some((s) => s.recordType === 'weather')).toBe(true);
    });

    it('answers harvest inquiries with exact harvested quantities and units', async () => {
      const response = await localAgriculturalAssistantAdapter.generateResponse(
        'What harvests have I logged?',
        mockFarmContext,
        'en'
      );

      expect(response.usedFarmerRecords).toBe(true);
      expect(response.content).toContain('Paddy');
      expect(response.content).toContain('28 Quintals');
      expect(response.sources.some((s) => s.recordType === 'harvest')).toBe(true);
    });

    it('guards against hallucination when no records match user inquiry', async () => {
      const emptyContext: FarmContextPayload = {
        farms: [],
        plots: [],
        activeCropPlans: [],
        recentActivities: [],
        recentExpenses: [],
        recentHarvests: [],
        recentSales: [],
        budgets: [],
        weatherAlerts: [],
        recentAssessments: [],
      };

      const response = await localAgriculturalAssistantAdapter.generateResponse(
        'What expenses have I logged?',
        emptyContext,
        'en'
      );

      expect(response.usedFarmerRecords).toBe(false);
      expect(response.content).toContain('No expense records were found');
      expect(response.sources.length).toBe(0);
    });
  });

  // --- 3. Verified Government Schemes Catalog & Filtering ---
  describe('3. Government Schemes Catalog & Multi-Attribute Search', () => {
    it('loads the verified catalog containing central and state schemes', async () => {
      expect(VERIFIED_GOVERNMENT_SCHEMES.length).toBeGreaterThanOrEqual(9);
      const pmKisan = VERIFIED_GOVERNMENT_SCHEMES.find((s) => s.code === 'PM-KISAN');
      expect(pmKisan).toBeDefined();
      expect(pmKisan?.scope).toBe('central');
      expect(pmKisan?.official_portal_url).toContain('pmkisan.gov.in');
    });

    it('filters schemes by jurisdiction (Tamil Nadu State)', async () => {
      const stateSchemes = await schemeService.getSchemes({ scope: 'state' });
      expect(stateSchemes.length).toBeGreaterThan(0);
      expect(stateSchemes.every((s) => s.scope === 'state')).toBe(true);
    });

    it('filters schemes by category (irrigation and equipment)', async () => {
      const irrigationSchemes = await schemeService.getSchemes({ category: 'irrigation' });
      expect(irrigationSchemes.length).toBeGreaterThan(0);
      expect(irrigationSchemes.some((s) => s.code === 'PMKSY-PDMC')).toBe(true);
    });

    it('searches schemes by bilingual Tamil keyword', async () => {
      const results = await schemeService.getSchemes({ searchQuery: 'பாசனம்' });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  // --- 4. Transparent Eligibility Assessment & Reminder Bridge ---
  describe('4. Eligibility Assessment & Phase 4 Reminder Bridge', () => {
    it('assesses small & marginal farmer as potentially eligible for PM-KISAN', () => {
      const pmKisan = VERIFIED_GOVERNMENT_SCHEMES.find((s) => s.code === 'PM-KISAN')!;
      const assessment = schemeService.assessFarmerEligibility(pmKisan, {
        totalAcreage: 3.5, // <= 5 acres
        cropsGrown: ['Paddy'],
        state: 'Tamil Nadu',
      });

      expect(assessment.status).toBe('potentially_eligible');
      expect(assessment.matchedCriteria.length).toBeGreaterThan(0);
      expect(assessment.unmatchedCriteria.length).toBe(0);
      expect(assessment.explanation).toContain('PM-KISAN');
    });

    it('flags large acreage as criteria not met for small-farmer restricted schemes', () => {
      // Find a scheme with max_landholding_acres limit
      const schemeWithCap = VERIFIED_GOVERNMENT_SCHEMES.find(
        (s) => s.max_landholding_acres !== null && s.max_landholding_acres !== undefined
      )!;

      const cap = schemeWithCap.max_landholding_acres || 5;
      const assessment = schemeService.assessFarmerEligibility(schemeWithCap, {
        totalAcreage: cap + 10,
        cropsGrown: ['Paddy'],
        state: 'Tamil Nadu',
      });

      expect(assessment.status).toBe('criteria_not_met');
      expect(assessment.unmatchedCriteria.some((c) => c.includes('exceeds'))).toBe(true);
    });

    it('bridges scheme application deadline directly into Phase 4 Farm Reminders', async () => {
      const pmfby = VERIFIED_GOVERNMENT_SCHEMES.find((s) => s.code === 'PMFBY')!;
      const dueDate = '2026-11-15';

      await schemeService.createSchemeDeadlineReminder(
        userId,
        farmId,
        pmfby,
        dueDate,
        'Collect sowing certificate from Village Administrative Officer (VAO)'
      );

      const reminders = await storageAdapter.getReminders(userId, { farmId });
      expect(reminders.length).toBe(1);
      expect(reminders[0].title).toContain('PMFBY');
      expect(reminders[0].category).toBe('custom');
      expect(reminders[0].due_date).toBe('2026-11-15T09:00:00Z');
      expect(reminders[0].description).toContain('pmfby.gov.in');
      expect(reminders[0].description).toContain('Village Administrative Officer');
    });
  });
});