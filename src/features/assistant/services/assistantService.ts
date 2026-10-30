// CropDiary AI — Assistant Orchestration Service & Secure Farm Context Retrieval
import { storageAdapter } from '@/services/storageAdapter';
import {
  AssistantConversation,
  AssistantMessage,
  FarmContextPayload,
  Language,
} from '@/types/assistant';
import { geminiAssistantAdapter } from './geminiAssistantAdapter';
import { metaAssistantAdapter } from './metaAssistantAdapter';
import { localAgriculturalAssistantAdapter } from './localAgriculturalAssistantAdapter';

export const assistantService = {
  // 1. Secure Context Retrieval across Phases 1 through 6
  async retrieveFarmContext(
    userId: string,
    farmId?: string,
    plotId?: string
  ): Promise<FarmContextPayload> {
    // 1. Authenticated user verification & farms retrieval
    const userFarms = await storageAdapter.getFarms(userId);
    const validFarms = userFarms.map((f) => ({
      id: f.id,
      name: f.name,
      location: `${f.district || ''}, ${f.state || ''}`,
      totalArea: f.area,
    }));

    const targetFarm = farmId && farmId !== 'all'
      ? userFarms.find((f) => f.id === farmId)
      : userFarms[0];

    const effectiveFarmId = targetFarm?.id;

    // 2. Plots for farm
    let plotsList: any[] = [];
    if (effectiveFarmId) {
      plotsList = await storageAdapter.getPlots(userId, effectiveFarmId);
    }

    const plotsPayload = plotsList.map((p) => ({
      id: p.id,
      name: p.name,
      area: p.area,
      soilType: p.soil_type || 'Loam',
      crop: p.current_crop || undefined,
    }));

    // 3. Active Crop Plans
    const cropPlans = await storageAdapter.getCropPlans(userId);
    const activePlans = cropPlans
      .filter((cp) => !effectiveFarmId || cp.farm_id === effectiveFarmId)
      .slice(0, 3)
      .map((cp) => ({
        id: cp.id,
        cropName: cp.selected_crop_name,
        season: cp.season,
        sowingDate: cp.sowing_date,
      }));

    // 4. Diary Entries (Activities, Observations)
    const diaryEntries = await storageAdapter.getDiaryEntries(userId, {
      farmId: effectiveFarmId,
      plotId: plotId && plotId !== 'all' ? plotId : undefined,
    });

    const recentActivities = diaryEntries
      .filter((e) => e.entry_type === 'activity' || e.entry_type === 'irrigation')
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        title: e.title,
        date: e.occurred_at,
        category: e.entry_type,
      }));

    // 5. Recent Expenses
    const transactions = await storageAdapter.getFinancialTransactions(userId, {
      farmId: effectiveFarmId,
      transactionType: 'expense',
    });

    const recentExpenses = transactions.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.description,
      amount: t.amount,
      category: t.category,
      date: t.occurred_at,
    }));

    // 6. Recent Harvests & Sales
    const recentHarvests = diaryEntries
      .filter((e) => e.harvest)
      .slice(0, 3)
      .map((e) => ({
        id: e.id,
        cropName: e.harvest!.crop_name,
        quantity: e.harvest!.quantity_harvested,
        unit: e.harvest!.unit,
        date: e.occurred_at,
      }));

    const sales = await storageAdapter.getHarvestSales(userId, {
      farmId: effectiveFarmId,
    });
    const recentSales = sales.slice(0, 3).map((s) => ({
      id: s.id,
      cropName: s.crop_name,
      grossRevenue: s.gross_revenue,
      netProceeds: s.net_proceeds,
      date: s.sale_date,
    }));

    // 7. Budgets
    const budgets = await storageAdapter.getBudgets(userId, effectiveFarmId);
    const budgetComparisons = budgets.slice(0, 3).map((b) => ({
      id: b.id,
      name: b.name,
      planned: b.amount,
      spent: 0,
      percentUsed: 0,
      status: b.status,
    }));

    // 8. Weather Alerts
    const alerts = await storageAdapter.getWeatherAlerts(
      userId,
      effectiveFarmId ? { farmId: effectiveFarmId } : undefined
    );
    const weatherAlerts = alerts
      .filter((a) => a.status === 'active')
      .slice(0, 3)
      .map((a) => ({
        id: a.id,
        title: a.title,
        severity: a.severity,
        action: (a.practical_steps && a.practical_steps[0]) || 'Review field conditions',
      }));

    // 9. Crop Doctor Assessments
    const assessments = await storageAdapter.getAssessments(userId);
    const recentAssessments = assessments.slice(0, 3).map((a) => ({
      id: a.id,
      diagnosis: a.primary_diagnosis || 'Crop assessment',
      severity: a.confidence_level || 'medium',
      date: a.created_at,
    }));

    return {
      selectedFarmId: effectiveFarmId,
      selectedPlotId: plotId,
      farms: validFarms,
      plots: plotsPayload,
      activeCropPlans: activePlans,
      recentActivities,
      recentExpenses,
      recentHarvests,
      recentSales,
      budgets: budgetComparisons,
      weatherAlerts,
      recentAssessments,
    };
  },

  // 2. Conversations Management
  async getConversations(userId: string): Promise<AssistantConversation[]> {
    return storageAdapter.getAssistantConversations(userId);
  },

  async getConversationById(
    userId: string,
    conversationId: string
  ): Promise<AssistantConversation | null> {
    return storageAdapter.getAssistantConversationById(userId, conversationId);
  },

  async createConversation(
    userId: string,
    title?: string,
    preferredLanguage: Language = 'en',
    farmId?: string,
    plotId?: string
  ): Promise<AssistantConversation> {
    return storageAdapter.createAssistantConversation(userId, {
      title: title || (preferredLanguage === 'ta' ? 'புதிய வேளாண் ஆலோசனை' : 'New Agricultural Consultation'),
      preferred_language: preferredLanguage,
      farm_id: farmId || null,
      plot_id: plotId || null,
    });
  },

  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    return storageAdapter.deleteAssistantConversation(userId, conversationId);
  },

  async getMessages(
    userId: string,
    conversationId: string
  ): Promise<AssistantMessage[]> {
    return storageAdapter.getAssistantMessages(userId, conversationId);
  },

  // 3. User Message Execution
  async sendMessage(
    userId: string,
    conversationId: string,
    userMessage: string,
    farmId?: string,
    plotId?: string,
    language: Language = 'en'
  ): Promise<AssistantMessage> {
    // 1. Store User Message
    await storageAdapter.createAssistantMessage(userId, {
      conversation_id: conversationId,
      role: 'user',
      content: userMessage.trim(),
    });

    // 2. Securely retrieve farm records context
    const farmContext = await this.retrieveFarmContext(userId, farmId, plotId);

    // 3. Choose provider (Gemini if available, else Meta Edge Function, else local grounded ICAR engine)
    const adapter = geminiAssistantAdapter.isAvailable()
      ? geminiAssistantAdapter
      : metaAssistantAdapter.isAvailable()
        ? metaAssistantAdapter
        : localAgriculturalAssistantAdapter;

    const response = await adapter.generateResponse(
      userMessage.trim(),
      farmContext,
      language
    );

    // 4. Store Assistant Response with sources
    const assistantMsg = await storageAdapter.createAssistantMessage(userId, {
      conversation_id: conversationId,
      role: 'assistant',
      content: response.content,
      sources: response.sources,
      model_name: response.modelName,
    });

    return assistantMsg;
  },
};
