import { Farm, Plot, Profile, RecordStatus } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { CropAssessment, CropAssessmentFollowup } from '@/types/cropDoctor';
import {
  WeatherForecast,
  FarmWeatherAlert,
  FarmReminder,
  UserNotification,
  AlertStatus,
  ReminderStatus,
} from '@/types/weather';
import {
  FarmDiaryEntry,
  FarmActivityDetail,
  IrrigationRecord,
  FarmInputRecord,
  CropObservationRecord,
  FarmExpenseRecord,
  HarvestRecord,
  DiaryAttachment,
  DiaryFilterParams,
  DiarySummaryStats,
} from '@/types/diary';
import { DiaryEntryFormData } from '@/lib/validation/diarySchemas';
import {
  FarmBudget,
  BudgetFormData,
  HarvestSale,
  HarvestSaleFormData,
  FinancialTransaction,
  TransactionFormData,
} from '@/types/finance';
import { calculateGrossSaleRevenue } from '@/features/finance/services/financialCalculationEngine';
import {
  AssistantConversation,
  AssistantMessage,
  Language,
  SourceReference,
} from '@/types/assistant';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { generateUUID } from '@/lib/utils';
import {
  diaryToFinanceExpenseCategory,
  diaryToFinancePaymentStatus,
} from '@/lib/categoryMappings';

const LOCAL_STORAGE_KEY_PREFIX = 'cropdiary_local_';

// Local mock storage helpers
function getLocalItems<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${key}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setLocalItems<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${key}`, JSON.stringify(items));
  } catch (err) {
    console.error('Local storage write failure:', err);
  }
}

export const storageAdapter = {
  // --- Profile Operations ---
  async getProfile(userId: string): Promise<Profile | null> {
    const localProfiles = getLocalItems<Profile>('profiles');
    const localProfile = localProfiles.find((p) => p.id === userId) || null;

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          const merged: Profile = {
            ...localProfile,
            ...data,
            display_name: (data.display_name && data.display_name !== 'Farmer')
              ? data.display_name
              : (localProfile?.display_name || data.display_name || 'Farmer'),
            preferred_language: data.preferred_language || localProfile?.preferred_language || 'en',
            country: data.country || localProfile?.country || 'India',
            state: data.state ?? localProfile?.state ?? '',
            district: data.district ?? localProfile?.district ?? '',
            preferred_area_unit: data.preferred_area_unit ?? localProfile?.preferred_area_unit ?? 'Acres',
            farming_experience: data.farming_experience ?? localProfile?.farming_experience,
            primary_farming_type: data.primary_farming_type ?? localProfile?.primary_farming_type,
          };
          const idx = localProfiles.findIndex((p) => p.id === userId);
          if (idx >= 0) localProfiles[idx] = merged; else localProfiles.push(merged);
          setLocalItems('profiles', localProfiles);
          return merged;
        }
      } catch (err) {
        console.warn('Supabase getProfile error, falling back to local storage:', err);
      }
    }

    return localProfile;
  },

  async upsertProfile(profile: Partial<Profile> & { id: string }): Promise<Profile> {
    const now = new Date().toISOString();

    // 1. Maintain local offline copy immediately (guarantees offline availability & zero data loss)
    const profiles = getLocalItems<Profile>('profiles');
    const existingIndex = profiles.findIndex((p) => p.id === profile.id);
    const localUpdated: Profile = {
      id: profile.id,
      display_name: profile.display_name || (existingIndex >= 0 ? profiles[existingIndex].display_name : 'Farmer'),
      preferred_language: profile.preferred_language || (existingIndex >= 0 ? profiles[existingIndex].preferred_language : 'en'),
      country: profile.country || (existingIndex >= 0 ? profiles[existingIndex].country : 'India'),
      state: profile.state ?? (existingIndex >= 0 ? profiles[existingIndex].state : ''),
      district: profile.district ?? (existingIndex >= 0 ? profiles[existingIndex].district : ''),
      preferred_area_unit: profile.preferred_area_unit || (existingIndex >= 0 ? profiles[existingIndex].preferred_area_unit : 'Acres'),
      farming_experience: profile.farming_experience ?? (existingIndex >= 0 ? profiles[existingIndex].farming_experience : undefined),
      primary_farming_type: profile.primary_farming_type ?? (existingIndex >= 0 ? profiles[existingIndex].primary_farming_type : undefined),
      created_at: existingIndex >= 0 ? profiles[existingIndex].created_at : now,
      updated_at: now,
    };

    if (existingIndex >= 0) {
      profiles[existingIndex] = localUpdated;
    } else {
      profiles.push(localUpdated);
    }
    setLocalItems('profiles', profiles);

    // 2. Cloud Synchronization (when connected to Supabase with an active authenticated session)
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const activeUser = sessionData?.session?.user;

        // RLS enforcement: Only attempt remote cloud write if user is authenticated with matching session UUID
        if (activeUser && activeUser.id === profile.id) {
          // Attempt update first to respect existing row provisioned by handle_new_user trigger
          const { data: updated, error: updateErr } = await supabase
            .from('profiles')
            .update({ ...profile, updated_at: now })
            .eq('id', profile.id)
            .select()
            .maybeSingle();

          if (!updateErr && updated) {
            const mergedUpdated: Profile = {
              ...localUpdated,
              ...updated,
              state: updated.state ?? localUpdated.state,
              district: updated.district ?? localUpdated.district,
              farming_experience: updated.farming_experience ?? localUpdated.farming_experience,
              primary_farming_type: updated.primary_farming_type ?? localUpdated.primary_farming_type,
            };
            if (existingIndex >= 0) profiles[existingIndex] = mergedUpdated; else profiles.push(mergedUpdated);
            setLocalItems('profiles', profiles);
            return mergedUpdated;
          }

          // If row did not exist yet in cloud, attempt insert/upsert
          const { data: upserted, error: upsertErr } = await supabase
            .from('profiles')
            .upsert({ ...profile, updated_at: now })
            .select()
            .single();

          if (!upsertErr && upserted) {
            const mergedUpserted: Profile = {
              ...localUpdated,
              ...upserted,
              state: upserted.state ?? localUpdated.state,
              district: upserted.district ?? localUpdated.district,
              farming_experience: upserted.farming_experience ?? localUpdated.farming_experience,
              primary_farming_type: upserted.primary_farming_type ?? localUpdated.primary_farming_type,
            };
            if (existingIndex >= 0) profiles[existingIndex] = mergedUpserted; else profiles.push(mergedUpserted);
            setLocalItems('profiles', profiles);
            return mergedUpserted;
          }

          console.warn('Supabase cloud profile write non-critical fallback to local storage:', updateErr || upsertErr);
        } else {
          // Unauthenticated or unconfirmed email session:
          // Safely keep in local cache; do not throw unhandled RLS violation
          console.info('No active Supabase session for user. Profile saved locally; will sync upon authentication.');
        }
      } catch (cloudErr) {
        console.warn('Supabase profile network or auth error, preserved in local storage:', cloudErr);
      }
    }

    return localUpdated;
  },

  // --- Farm Operations ---
  async getFarms(userId: string): Promise<Farm[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }

    // Local mode (strict tenant isolation)
    const farms = getLocalItems<Farm>('farms');
    return farms
      .filter((f) => f.owner_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getFarmById(userId: string, farmId: string): Promise<Farm | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('id', farmId)
        .eq('owner_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    }

    // Local mode
    const farms = getLocalItems<Farm>('farms');
    return farms.find((f) => f.id === farmId && f.owner_id === userId) || null;
  },

  async createFarm(userId: string, farmData: Omit<Farm, 'id' | 'owner_id' | 'created_at' | 'updated_at'>): Promise<Farm> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('farms')
        .insert({
          ...farmData,
          owner_id: userId,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    // Local mode
    const farms = getLocalItems<Farm>('farms');
    const newFarm: Farm = {
      ...farmData,
      id: generateUUID(),
      owner_id: userId,
      created_at: now,
      updated_at: now,
    };
    farms.unshift(newFarm);
    setLocalItems('farms', farms);
    return newFarm;
  },

  async updateFarm(userId: string, farmId: string, updates: Partial<Farm>): Promise<Farm> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('farms')
        .update({ ...updates, updated_at: now })
        .eq('id', farmId)
        .eq('owner_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    // Local mode
    const farms = getLocalItems<Farm>('farms');
    const index = farms.findIndex((f) => f.id === farmId && f.owner_id === userId);
    if (index === -1) throw new Error('Farm not found or unauthorized');

    const updated = { ...farms[index], ...updates, updated_at: now };
    farms[index] = updated;
    setLocalItems('farms', farms);
    return updated;
  },

  async updateFarmStatus(userId: string, farmId: string, status: RecordStatus): Promise<Farm> {
    return this.updateFarm(userId, farmId, { status });
  },

  async deleteFarm(userId: string, farmId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', farmId)
        .eq('owner_id', userId);
      if (error) throw error;
      return;
    }

    // Local mode
    let farms = getLocalItems<Farm>('farms');
    farms = farms.filter((f) => !(f.id === farmId && f.owner_id === userId));
    setLocalItems('farms', farms);

    // Cascade delete associated plots
    let plots = getLocalItems<Plot>('plots');
    plots = plots.filter((p) => p.farm_id !== farmId);
    setLocalItems('plots', plots);
  },

  // --- Plot Operations ---
  async getPlots(userId: string, farmId?: string): Promise<Plot[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('plots').select('*').eq('owner_id', userId);
      if (farmId) query = query.eq('farm_id', farmId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }

    // Local mode
    const plots = getLocalItems<Plot>('plots');
    return plots
      .filter((p) => p.owner_id === userId && (!farmId || p.farm_id === farmId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getPlotById(userId: string, plotId: string): Promise<Plot | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('plots')
        .select('*')
        .eq('id', plotId)
        .eq('owner_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    }

    // Local mode
    const plots = getLocalItems<Plot>('plots');
    return plots.find((p) => p.id === plotId && p.owner_id === userId) || null;
  },

  async createPlot(userId: string, plotData: Omit<Plot, 'id' | 'owner_id' | 'created_at' | 'updated_at'>): Promise<Plot> {
    const now = new Date().toISOString();
    
    // First verify parent farm ownership
    const parentFarm = await this.getFarmById(userId, plotData.farm_id);
    if (!parentFarm) {
      throw new Error('Parent farm does not exist or you do not have permission to add plots to it');
    }

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('plots')
        .insert({
          ...plotData,
          owner_id: userId,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    // Local mode
    const plots = getLocalItems<Plot>('plots');
    const newPlot: Plot = {
      ...plotData,
      id: generateUUID(),
      owner_id: userId,
      created_at: now,
      updated_at: now,
    };
    plots.unshift(newPlot);
    setLocalItems('plots', plots);
    return newPlot;
  },

  async updatePlot(userId: string, plotId: string, updates: Partial<Plot>): Promise<Plot> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('plots')
        .update({ ...updates, updated_at: now })
        .eq('id', plotId)
        .eq('owner_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    // Local mode
    const plots = getLocalItems<Plot>('plots');
    const index = plots.findIndex((p) => p.id === plotId && p.owner_id === userId);
    if (index === -1) throw new Error('Plot not found or unauthorized');

    const updated = { ...plots[index], ...updates, updated_at: now };
    plots[index] = updated;
    setLocalItems('plots', plots);
    return updated;
  },

  async updatePlotStatus(userId: string, plotId: string, status: RecordStatus): Promise<Plot> {
    return this.updatePlot(userId, plotId, { status });
  },

  async deletePlot(userId: string, plotId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('plots')
        .delete()
        .eq('id', plotId)
        .eq('owner_id', userId);
      if (error) throw error;
      return;
    }

    // Local mode
    let plots = getLocalItems<Plot>('plots');
    plots = plots.filter((p) => !(p.id === plotId && p.owner_id === userId));
    setLocalItems('plots', plots);
  },

  // --- Crop Plan Operations ---
  async getCropPlans(userId: string, farmId?: string, plotId?: string): Promise<CropPlan[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('crop_plans').select('*').eq('owner_id', userId);
      if (farmId) query = query.eq('farm_id', farmId);
      if (plotId) query = query.eq('plot_id', plotId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }

    // Local mode (strict tenant isolation)
    const plans = getLocalItems<CropPlan>('crop_plans');
    return plans
      .filter(
        (p) =>
          p.owner_id === userId &&
          (!farmId || p.farm_id === farmId) &&
          (!plotId || p.plot_id === plotId)
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getCropPlanById(userId: string, planId: string): Promise<CropPlan | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('crop_plans')
        .select('*')
        .eq('id', planId)
        .eq('owner_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    }

    // Local mode
    const plans = getLocalItems<CropPlan>('crop_plans');
    return plans.find((p) => p.id === planId && p.owner_id === userId) || null;
  },

  async createCropPlan(
    userId: string,
    planData: Omit<CropPlan, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
  ): Promise<CropPlan> {
    const now = new Date().toISOString();

    // Verify parent plot and farm ownership
    const parentPlot = await this.getPlotById(userId, planData.plot_id);
    if (!parentPlot) {
      throw new Error('Target plot not found or unauthorized');
    }

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('crop_plans')
        .insert({
          ...planData,
          owner_id: userId,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    // Local mode
    const plans = getLocalItems<CropPlan>('crop_plans');
    const newPlan: CropPlan = {
      ...planData,
      id: generateUUID(),
      owner_id: userId,
      created_at: now,
      updated_at: now,
    };
    plans.unshift(newPlan);
    setLocalItems('crop_plans', plans);
    return newPlan;
  },

  async updateCropPlan(
    userId: string,
    planId: string,
    updates: Partial<CropPlan>
  ): Promise<CropPlan> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('crop_plans')
        .update({ ...updates, updated_at: now })
        .eq('id', planId)
        .eq('owner_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    // Local mode
    const plans = getLocalItems<CropPlan>('crop_plans');
    const index = plans.findIndex((p) => p.id === planId && p.owner_id === userId);
    if (index === -1) throw new Error('Crop plan not found or unauthorized');

    const updated = { ...plans[index], ...updates, updated_at: now };
    plans[index] = updated;
    setLocalItems('crop_plans', plans);
    return updated;
  },

  async deleteCropPlan(userId: string, planId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('crop_plans')
        .delete()
        .eq('id', planId)
        .eq('owner_id', userId);
      if (error) throw error;
      return;
    }

    // Local mode
    let plans = getLocalItems<CropPlan>('crop_plans');
    plans = plans.filter((p) => !(p.id === planId && p.owner_id === userId));
    setLocalItems('crop_plans', plans);
  },

  // --- Phase 3: AI Crop Doctor Operations ---

  async uploadAssessmentPhoto(
    userId: string,
    assessmentId: string,
    file: File | Blob,
    ext: string = 'jpg'
  ): Promise<{ url: string; path: string }> {
    const filename = `${Date.now()}_leaf.${ext}`;
    const storagePath = `${userId}/${assessmentId}/${filename}`;

    if (isSupabaseConfigured() && supabase) {
      const { error: uploadError } = await supabase.storage
        .from('crop-assessment-photos')
        .upload(storagePath, file, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Create signed URL valid for 1 year (private bucket compliance)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('crop-assessment-photos')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

      if (signedError) throw signedError;
      return { url: signedData.signedUrl, path: storagePath };
    }

    // Local mode: use mock or object URL
    return {
      url: 'data:image/jpeg;base64,mockLocalPhotoStorage',
      path: `local/${storagePath}`,
    };
  },

  async deleteAssessmentPhoto(path: string): Promise<void> {
    if (isSupabaseConfigured() && supabase && path && !path.startsWith('local/')) {
      await supabase.storage.from('crop-assessment-photos').remove([path]);
    }
  },

  async getAssessments(
    userId: string,
    filters?: { farmId?: string; plotId?: string; cropName?: string }
  ): Promise<CropAssessment[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase
        .from('crop_assessments')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.farmId) {
        query = query.eq('farm_id', filters.farmId);
      }
      if (filters?.plotId) {
        query = query.eq('plot_id', filters.plotId);
      }
      if (filters?.cropName) {
        query = query.ilike('crop_name', `%${filters.cropName}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as CropAssessment[]) || [];
    }

    // Local mode
    let assessments = getLocalItems<CropAssessment>('crop_assessments');
    assessments = assessments.filter((a) => a.owner_id === userId);

    if (filters?.farmId) {
      assessments = assessments.filter((a) => a.farm_id === filters.farmId);
    }
    if (filters?.plotId) {
      assessments = assessments.filter((a) => a.plot_id === filters.plotId);
    }
    if (filters?.cropName) {
      const q = filters.cropName.toLowerCase();
      assessments = assessments.filter((a) => a.crop_name.toLowerCase().includes(q));
    }

    return assessments;
  },

  async getAssessmentById(
    userId: string,
    assessmentId: string
  ): Promise<CropAssessment | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('crop_assessments')
        .select('*')
        .eq('id', assessmentId)
        .eq('owner_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      // Fetch followups
      const followups = await this.getAssessmentFollowups(assessmentId);
      return { ...(data as CropAssessment), followups };
    }

    // Local mode
    const assessments = getLocalItems<CropAssessment>('crop_assessments');
    const assessment = assessments.find((a) => a.id === assessmentId && a.owner_id === userId);
    if (!assessment) return null;

    const followups = await this.getAssessmentFollowups(assessmentId);
    return { ...assessment, followups };
  },

  async createAssessment(
    userId: string,
    data: Omit<CropAssessment, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
  ): Promise<CropAssessment> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      const { data: created, error } = await supabase
        .from('crop_assessments')
        .insert({
          ...data,
          owner_id: userId,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw error;
      return created as CropAssessment;
    }

    // Local mode
    const assessments = getLocalItems<CropAssessment>('crop_assessments');
    const newAssessment: CropAssessment = {
      ...data,
      id: generateUUID(),
      owner_id: userId,
      created_at: now,
      updated_at: now,
      followups: [],
    };
    assessments.unshift(newAssessment);
    setLocalItems('crop_assessments', assessments);
    return newAssessment;
  },

  async updateAssessment(
    userId: string,
    assessmentId: string,
    updates: Partial<CropAssessment>
  ): Promise<CropAssessment> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('crop_assessments')
        .update({ ...updates, updated_at: now })
        .eq('id', assessmentId)
        .eq('owner_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as CropAssessment;
    }

    // Local mode
    const assessments = getLocalItems<CropAssessment>('crop_assessments');
    const index = assessments.findIndex((a) => a.id === assessmentId && a.owner_id === userId);
    if (index === -1) throw new Error('Crop assessment not found or unauthorized');

    const updated = { ...assessments[index], ...updates, updated_at: now };
    assessments[index] = updated;
    setLocalItems('crop_assessments', assessments);
    return updated;
  },

  async deleteAssessment(userId: string, assessmentId: string): Promise<void> {
    const current = await this.getAssessmentById(userId, assessmentId);
    if (!current) return;

    if (current.photo_storage_path) {
      await this.deleteAssessmentPhoto(current.photo_storage_path).catch(() => {});
    }

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('crop_assessments')
        .delete()
        .eq('id', assessmentId)
        .eq('owner_id', userId);

      if (error) throw error;
      return;
    }

    // Local mode
    let assessments = getLocalItems<CropAssessment>('crop_assessments');
    assessments = assessments.filter((a) => !(a.id === assessmentId && a.owner_id === userId));
    setLocalItems('crop_assessments', assessments);

    let followups = getLocalItems<CropAssessmentFollowup>('crop_assessment_followups');
    followups = followups.filter((f) => f.assessment_id !== assessmentId);
    setLocalItems('crop_assessment_followups', followups);
  },

  async getAssessmentFollowups(assessmentId: string): Promise<CropAssessmentFollowup[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('crop_assessment_followups')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as CropAssessmentFollowup[]) || [];
    }

    // Local mode
    const followups = getLocalItems<CropAssessmentFollowup>('crop_assessment_followups');
    return followups.filter((f) => f.assessment_id === assessmentId);
  },

  async createAssessmentFollowup(
    userId: string,
    data: Omit<CropAssessmentFollowup, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
  ): Promise<CropAssessmentFollowup> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      const { data: created, error } = await supabase
        .from('crop_assessment_followups')
        .insert({
          ...data,
          owner_id: userId,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw error;
      return created as CropAssessmentFollowup;
    }

    // Local mode
    const followups = getLocalItems<CropAssessmentFollowup>('crop_assessment_followups');
    const newFollowup: CropAssessmentFollowup = {
      ...data,
      id: generateUUID(),
      owner_id: userId,
      created_at: now,
      updated_at: now,
    };
    followups.unshift(newFollowup);
    setLocalItems('crop_assessment_followups', followups);
    return newFollowup;
  },

  // --- Phase 4: Weather Intelligence & Alert Operations ---

  async getCachedWeather(cacheKey: string): Promise<WeatherForecast | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('weather_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? (data.forecast_data as WeatherForecast) : null;
    }

    // Local mode
    const cachedList = getLocalItems<{
      cache_key: string;
      forecast_data: WeatherForecast;
      expires_at: string;
    }>('weather_cache');

    const match = cachedList.find(
      (c) => c.cache_key === cacheKey && new Date(c.expires_at) > new Date()
    );
    return match ? match.forecast_data : null;
  },

  async setCachedWeather(
    cacheKey: string,
    latitude: number,
    longitude: number,
    forecast: WeatherForecast,
    expirationMinutes: number = 60
  ): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationMinutes * 60 * 1000).toISOString();

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('weather_cache').upsert(
        {
          cache_key: cacheKey,
          latitude,
          longitude,
          provider: forecast.provider || 'open-meteo',
          forecast_data: forecast,
          retrieved_at: now.toISOString(),
          expires_at: expiresAt,
        },
        { onConflict: 'cache_key' }
      );
      return;
    }

    // Local mode
    let cachedList = getLocalItems<{
      cache_key: string;
      latitude: number;
      longitude: number;
      forecast_data: WeatherForecast;
      retrieved_at: string;
      expires_at: string;
    }>('weather_cache');

    cachedList = cachedList.filter((c) => c.cache_key !== cacheKey);
    cachedList.unshift({
      cache_key: cacheKey,
      latitude,
      longitude,
      forecast_data: forecast,
      retrieved_at: now.toISOString(),
      expires_at: expiresAt,
    });
    setLocalItems('weather_cache', cachedList);
  },

  async getWeatherAlerts(
    userId: string,
    filters?: { farmId?: string; status?: AlertStatus }
  ): Promise<FarmWeatherAlert[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase
        .from('farm_weather_alerts')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.farmId) query = query.eq('farm_id', filters.farmId);
      if (filters?.status) query = query.eq('status', filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return (data as FarmWeatherAlert[]) || [];
    }

    // Local mode
    let alerts = getLocalItems<FarmWeatherAlert>('farm_weather_alerts');
    alerts = alerts.filter((a) => a.owner_id === userId);
    if (filters?.farmId) alerts = alerts.filter((a) => a.farm_id === filters.farmId);
    if (filters?.status) alerts = alerts.filter((a) => a.status === filters.status);
    return alerts;
  },

  async createWeatherAlert(
    userId: string,
    alert: Omit<FarmWeatherAlert, 'id' | 'owner_id' | 'created_at' | 'updated_at'> & { id?: string }
  ): Promise<FarmWeatherAlert> {
    const now = new Date().toISOString();
    const alertId = alert.id || generateUUID();

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('farm_weather_alerts')
        .upsert({
          ...alert,
          id: alertId,
          owner_id: userId,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FarmWeatherAlert;
    }

    // Local mode: deduplicate by id
    let alerts = getLocalItems<FarmWeatherAlert>('farm_weather_alerts');
    const existingIndex = alerts.findIndex((a) => a.id === alertId && a.owner_id === userId);

    const savedAlert: FarmWeatherAlert = {
      ...alert,
      id: alertId,
      owner_id: userId,
      status: alert.status || 'active',
      created_at: existingIndex >= 0 ? alerts[existingIndex].created_at : now,
      updated_at: now,
    };

    if (existingIndex >= 0) {
      alerts[existingIndex] = savedAlert;
    } else {
      alerts.unshift(savedAlert);
    }

    setLocalItems('farm_weather_alerts', alerts);
    return savedAlert;
  },

  async updateWeatherAlertStatus(
    userId: string,
    alertId: string,
    status: AlertStatus
  ): Promise<FarmWeatherAlert> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('farm_weather_alerts')
        .update({ status, updated_at: now })
        .eq('id', alertId)
        .eq('owner_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as FarmWeatherAlert;
    }

    // Local mode
    const alerts = getLocalItems<FarmWeatherAlert>('farm_weather_alerts');
    const index = alerts.findIndex((a) => a.id === alertId && a.owner_id === userId);
    if (index === -1) throw new Error('Alert not found');

    const updated = { ...alerts[index], status, updated_at: now };
    alerts[index] = updated;
    setLocalItems('farm_weather_alerts', alerts);
    return updated;
  },

  // --- Phase 4: Farm Reminders Operations ---

  async getReminders(
    userId: string,
    filters?: { farmId?: string; status?: ReminderStatus }
  ): Promise<FarmReminder[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase
        .from('farm_reminders')
        .select('*')
        .eq('owner_id', userId)
        .order('due_date', { ascending: true });

      if (filters?.farmId) query = query.eq('farm_id', filters.farmId);
      if (filters?.status) query = query.eq('status', filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return (data as FarmReminder[]) || [];
    }

    // Local mode
    let reminders = getLocalItems<FarmReminder>('farm_reminders');
    reminders = reminders.filter((r) => r.owner_id === userId);
    if (filters?.farmId) reminders = reminders.filter((r) => r.farm_id === filters.farmId);
    if (filters?.status) reminders = reminders.filter((r) => r.status === filters.status);
    return reminders.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  },

  async getReminderById(userId: string, reminderId: string): Promise<FarmReminder | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('farm_reminders')
        .select('*')
        .eq('id', reminderId)
        .eq('owner_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return (data as FarmReminder) || null;
    }

    // Local mode
    const reminders = getLocalItems<FarmReminder>('farm_reminders');
    return reminders.find((r) => r.id === reminderId && r.owner_id === userId) || null;
  },

  async createReminder(
    userId: string,
    data: Omit<FarmReminder, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
  ): Promise<FarmReminder> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      const { data: created, error } = await supabase
        .from('farm_reminders')
        .insert({
          ...data,
          owner_id: userId,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw error;
      return created as FarmReminder;
    }

    // Local mode
    const reminders = getLocalItems<FarmReminder>('farm_reminders');
    const newReminder: FarmReminder = {
      ...data,
      id: generateUUID(),
      owner_id: userId,
      created_at: now,
      updated_at: now,
    };
    reminders.unshift(newReminder);
    setLocalItems('farm_reminders', reminders);
    return newReminder;
  },

  async updateReminder(
    userId: string,
    reminderId: string,
    updates: Partial<FarmReminder>
  ): Promise<FarmReminder> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('farm_reminders')
        .update({ ...updates, updated_at: now })
        .eq('id', reminderId)
        .eq('owner_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as FarmReminder;
    }

    // Local mode
    const reminders = getLocalItems<FarmReminder>('farm_reminders');
    const index = reminders.findIndex((r) => r.id === reminderId && r.owner_id === userId);
    if (index === -1) throw new Error('Reminder not found');

    const updated = { ...reminders[index], ...updates, updated_at: now };
    reminders[index] = updated;
    setLocalItems('farm_reminders', reminders);
    return updated;
  },

  async deleteReminder(userId: string, reminderId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('farm_reminders')
        .delete()
        .eq('id', reminderId)
        .eq('owner_id', userId);

      if (error) throw error;
      return;
    }

    // Local mode
    let reminders = getLocalItems<FarmReminder>('farm_reminders');
    reminders = reminders.filter((r) => !(r.id === reminderId && r.owner_id === userId));
    setLocalItems('farm_reminders', reminders);
  },

  // --- Phase 4: User Notification Center Operations ---

  async getNotifications(userId: string): Promise<UserNotification[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('owner_id', userId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as UserNotification[]) || [];
    }

    // Local mode
    const notifs = getLocalItems<UserNotification>('user_notifications');
    return notifs
      .filter((n) => n.owner_id === userId && !n.is_dismissed)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createNotification(
    userId: string,
    data: Omit<UserNotification, 'id' | 'owner_id' | 'created_at'>
  ): Promise<UserNotification> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      const { data: created, error } = await supabase
        .from('user_notifications')
        .insert({
          ...data,
          owner_id: userId,
          created_at: now,
        })
        .select()
        .single();

      if (error) throw error;
      return created as UserNotification;
    }

    // Local mode
    const notifs = getLocalItems<UserNotification>('user_notifications');
    const newNotif: UserNotification = {
      ...data,
      id: generateUUID(),
      owner_id: userId,
      created_at: now,
    };
    notifs.unshift(newNotif);
    setLocalItems('user_notifications', notifs);
    return newNotif;
  },

  async markNotificationRead(userId: string, notificationId: string): Promise<void> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read_at: now })
        .eq('id', notificationId)
        .eq('owner_id', userId);

      if (error) throw error;
      return;
    }

    // Local mode
    const notifs = getLocalItems<UserNotification>('user_notifications');
    const index = notifs.findIndex((n) => n.id === notificationId && n.owner_id === userId);
    if (index >= 0) {
      notifs[index].read_at = now;
      setLocalItems('user_notifications', notifs);
    }
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read_at: now })
        .eq('owner_id', userId)
        .is('read_at', null);

      if (error) throw error;
      return;
    }

    // Local mode
    const notifs = getLocalItems<UserNotification>('user_notifications');
    for (const n of notifs) {
      if (n.owner_id === userId && !n.read_at) {
        n.read_at = now;
      }
    }
    setLocalItems('user_notifications', notifs);
  },

  async dismissNotification(userId: string, notificationId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_dismissed: true })
        .eq('id', notificationId)
        .eq('owner_id', userId);

      if (error) throw error;
      return;
    }

    // Local mode
    const notifs = getLocalItems<UserNotification>('user_notifications');
    const index = notifs.findIndex((n) => n.id === notificationId && n.owner_id === userId);
    if (index >= 0) {
      notifs[index].is_dismissed = true;
      setLocalItems('user_notifications', notifs);
    }
  },

  // --- Phase 5: Smart Farm Diary & Activity Operations ---

  async getDiaryEntries(
    userId: string,
    filters?: DiaryFilterParams
  ): Promise<FarmDiaryEntry[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase
        .from('farm_diary_entries')
        .select(`
          *,
          activity_detail:farm_activity_details(*),
          irrigation_record:irrigation_records(*),
          input_record:farm_input_records(*),
          observation:crop_observations(*),
          expense:farm_expenses(*),
          harvest:harvest_records(*),
          attachments:farm_diary_attachments(*)
        `)
        .eq('owner_id', userId);

      if (filters?.farmId && filters.farmId !== 'all') {
        query = query.eq('farm_id', filters.farmId);
      }
      if (filters?.plotId && filters.plotId !== 'all') {
        query = query.eq('plot_id', filters.plotId);
      }
      if (filters?.cropPlanId && filters.cropPlanId !== 'all') {
        query = query.eq('crop_plan_id', filters.cropPlanId);
      }
      if (filters?.entryType && filters.entryType !== 'all') {
        query = query.eq('entry_type', filters.entryType);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      } else {
        query = query.neq('status', 'archived');
      }
      if (filters?.startDate) {
        query = query.gte('occurred_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('occurred_at', filters.endDate);
      }

      const ascending = filters?.sortOrder === 'oldest';
      query = query.order('occurred_at', { ascending });

      const { data, error } = await query;
      if (error) throw error;

      let list = (data as FarmDiaryEntry[]) || [];
      if (filters?.searchQuery && filters.searchQuery.trim()) {
        const rawQ = filters.searchQuery.trim().toLowerCase();
        const cleanQ = rawQ.startsWith('#') ? rawQ.slice(1) : rawQ;
        list = list.filter(
          (e) =>
            e.title.toLowerCase().includes(rawQ) ||
            e.title.toLowerCase().includes(cleanQ) ||
            (e.description && (e.description.toLowerCase().includes(rawQ) || e.description.toLowerCase().includes(cleanQ))) ||
            (e.tags && e.tags.some((t) => {
              const lowerT = t.toLowerCase();
              return lowerT.includes(rawQ) || lowerT.includes(cleanQ);
            }))
        );
      }
      return list;
    }

    // Local mode
    let master = getLocalItems<FarmDiaryEntry>('farm_diary_entries');
    const activities = getLocalItems<FarmActivityDetail>('farm_activity_details');
    const irrigations = getLocalItems<IrrigationRecord>('irrigation_records');
    const inputs = getLocalItems<FarmInputRecord>('farm_input_records');
    const observations = getLocalItems<CropObservationRecord>('crop_observations');
    const expenses = getLocalItems<FarmExpenseRecord>('farm_expenses');
    const harvests = getLocalItems<HarvestRecord>('harvest_records');
    const attachments = getLocalItems<DiaryAttachment>('farm_diary_attachments');

    // Filter by owner
    let list = master.filter((e) => e.owner_id === userId);

    if (filters?.farmId && filters.farmId !== 'all') {
      list = list.filter((e) => e.farm_id === filters.farmId);
    }
    if (filters?.plotId && filters.plotId !== 'all') {
      list = list.filter((e) => e.plot_id === filters.plotId);
    }
    if (filters?.cropPlanId && filters.cropPlanId !== 'all') {
      list = list.filter((e) => e.crop_plan_id === filters.cropPlanId);
    }
    if (filters?.entryType && filters.entryType !== 'all') {
      list = list.filter((e) => e.entry_type === filters.entryType);
    }
    if (filters?.status) {
      list = list.filter((e) => e.status === filters.status);
    } else {
      list = list.filter((e) => e.status !== 'archived');
    }
    if (filters?.startDate) {
      list = list.filter((e) => new Date(e.occurred_at) >= new Date(filters.startDate!));
    }
    if (filters?.endDate) {
      list = list.filter((e) => new Date(e.occurred_at) <= new Date(filters.endDate!));
    }
    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const rawQ = filters.searchQuery.trim().toLowerCase();
      const cleanQ = rawQ.startsWith('#') ? rawQ.slice(1) : rawQ;
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(rawQ) ||
          e.title.toLowerCase().includes(cleanQ) ||
          (e.description && (e.description.toLowerCase().includes(rawQ) || e.description.toLowerCase().includes(cleanQ))) ||
          (e.tags && e.tags.some((t) => {
            const lowerT = t.toLowerCase();
            return lowerT.includes(rawQ) || lowerT.includes(cleanQ);
          }))
      );
    }

    // Hydrate sub-details
    const hydrated = list.map((entry) => ({
      ...entry,
      activity_detail: activities.find((a) => a.entry_id === entry.id) || null,
      irrigation_record: irrigations.find((i) => i.entry_id === entry.id) || null,
      input_record: inputs.find((inp) => inp.entry_id === entry.id) || null,
      observation: observations.find((o) => o.entry_id === entry.id) || null,
      expense: expenses.find((ex) => ex.entry_id === entry.id) || null,
      harvest: harvests.find((h) => h.entry_id === entry.id) || null,
      attachments: attachments.filter((att) => att.entry_id === entry.id),
    }));

    // Sort order
    hydrated.sort((a, b) => {
      const timeA = new Date(a.occurred_at).getTime();
      const timeB = new Date(b.occurred_at).getTime();
      return filters?.sortOrder === 'oldest' ? timeA - timeB : timeB - timeA;
    });

    return hydrated;
  },

  async getDiaryEntryById(
    userId: string,
    entryId: string
  ): Promise<FarmDiaryEntry | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('farm_diary_entries')
        .select(`
          *,
          activity_detail:farm_activity_details(*),
          irrigation_record:irrigation_records(*),
          input_record:farm_input_records(*),
          observation:crop_observations(*),
          expense:farm_expenses(*),
          harvest:harvest_records(*),
          attachments:farm_diary_attachments(*)
        `)
        .eq('id', entryId)
        .eq('owner_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return (data as FarmDiaryEntry) || null;
    }

    // Local mode
    const all = await this.getDiaryEntries(userId, { status: undefined });
    return all.find((e) => e.id === entryId) || null;
  },

  async createDiaryEntry(
    userId: string,
    entryData: DiaryEntryFormData & { id?: string; attachments?: DiaryAttachment[] }
  ): Promise<FarmDiaryEntry> {
    const entryId = entryData.id || generateUUID();
    const now = new Date().toISOString();

    const masterPayload: Omit<FarmDiaryEntry, 'created_at' | 'updated_at'> = {
      id: entryId,
      owner_id: userId,
      farm_id: entryData.farm_id,
      plot_id: entryData.plot_id || null,
      crop_plan_id: entryData.crop_plan_id || null,
      entry_type: entryData.entry_type,
      title: entryData.title.trim(),
      description: entryData.description?.trim() || null,
      occurred_at: entryData.occurred_at || now,
      status: entryData.status || 'active',
      tags: entryData.tags || [],
      metadata: {},
    };

    if (isSupabaseConfigured() && supabase) {
      // Idempotency check: if entry already exists, return existing
      const { data: existing } = await supabase
        .from('farm_diary_entries')
        .select('*')
        .eq('id', entryId)
        .eq('owner_id', userId)
        .single();

      if (existing) {
        return (await this.getDiaryEntryById(userId, entryId))!;
      }

      const { error: masterError } = await supabase
        .from('farm_diary_entries')
        .insert({
          ...masterPayload,
          created_at: now,
          updated_at: now,
        });
      if (masterError) throw masterError;

      // Insert typed detail
      if (entryData.entry_type === 'activity' && entryData.activity_detail) {
        await supabase.from('farm_activity_details').insert({
          id: generateUUID(),
          entry_id: entryId,
          ...entryData.activity_detail,
          created_at: now,
        });
      } else if (entryData.entry_type === 'irrigation' && entryData.irrigation_record) {
        await supabase.from('irrigation_records').insert({
          id: generateUUID(),
          entry_id: entryId,
          ...entryData.irrigation_record,
          created_at: now,
        });
      } else if (entryData.entry_type === 'input_application' && entryData.input_record) {
        await supabase.from('farm_input_records').insert({
          id: generateUUID(),
          entry_id: entryId,
          ...entryData.input_record,
          created_at: now,
        });
      } else if (entryData.entry_type === 'crop_observation' && entryData.observation) {
        await supabase.from('crop_observations').insert({
          id: generateUUID(),
          entry_id: entryId,
          ...entryData.observation,
          created_at: now,
        });
      } else if (entryData.entry_type === 'expense' && entryData.expense) {
        await supabase.from('farm_expenses').insert({
          id: generateUUID(),
          entry_id: entryId,
          ...entryData.expense,
          created_at: now,
        });
      } else if (entryData.entry_type === 'harvest' && entryData.harvest) {
        await supabase.from('harvest_records').insert({
          id: generateUUID(),
          entry_id: entryId,
          ...entryData.harvest,
          created_at: now,
        });
      }

      // Insert attachments
      if (entryData.attachments && entryData.attachments.length > 0) {
        for (const att of entryData.attachments) {
          await supabase.from('farm_diary_attachments').insert({
            id: att.id || generateUUID(),
            entry_id: entryId,
            owner_id: userId,
            file_name: att.file_name,
            file_url: att.file_url,
            storage_path: att.storage_path,
            media_type: att.media_type,
            file_size_bytes: att.file_size_bytes,
            caption: att.caption || null,
            created_at: now,
          });
        }
      }

      return (await this.getDiaryEntryById(userId, entryId))!;
    }

    // Local mode
    const masterList = getLocalItems<FarmDiaryEntry>('farm_diary_entries');
    const existingIdx = masterList.findIndex((e) => e.id === entryId && e.owner_id === userId);
    if (existingIdx !== -1) {
      // Idempotency: entry already exists with this exact client UUID
      return (await this.getDiaryEntryById(userId, entryId))!;
    }

    const newEntry: FarmDiaryEntry = {
      ...masterPayload,
      created_at: now,
      updated_at: now,
    };
    masterList.unshift(newEntry);
    setLocalItems('farm_diary_entries', masterList);

    // Save sub-detail
    if (entryData.entry_type === 'activity' && entryData.activity_detail) {
      const activities = getLocalItems<FarmActivityDetail>('farm_activity_details');
      const detail: FarmActivityDetail = {
        id: generateUUID(),
        entry_id: entryId,
        ...entryData.activity_detail,
        created_at: now,
      };
      activities.push(detail);
      setLocalItems('farm_activity_details', activities);
      newEntry.activity_detail = detail;
    } else if (entryData.entry_type === 'irrigation' && entryData.irrigation_record) {
      const irrigations = getLocalItems<IrrigationRecord>('irrigation_records');
      const detail: IrrigationRecord = {
        id: generateUUID(),
        entry_id: entryId,
        ...entryData.irrigation_record,
        created_at: now,
      };
      irrigations.push(detail);
      setLocalItems('irrigation_records', irrigations);
      newEntry.irrigation_record = detail;
    } else if (entryData.entry_type === 'input_application' && entryData.input_record) {
      const inputs = getLocalItems<FarmInputRecord>('farm_input_records');
      const detail: FarmInputRecord = {
        id: generateUUID(),
        entry_id: entryId,
        ...entryData.input_record,
        created_at: now,
      };
      inputs.push(detail);
      setLocalItems('farm_input_records', inputs);
      newEntry.input_record = detail;
    } else if (entryData.entry_type === 'crop_observation' && entryData.observation) {
      const observations = getLocalItems<CropObservationRecord>('crop_observations');
      const detail: CropObservationRecord = {
        id: generateUUID(),
        entry_id: entryId,
        ...entryData.observation,
        created_at: now,
      };
      observations.push(detail);
      setLocalItems('crop_observations', observations);
      newEntry.observation = detail;
    } else if (entryData.entry_type === 'expense' && entryData.expense) {
      const expenses = getLocalItems<FarmExpenseRecord>('farm_expenses');
      const detail: FarmExpenseRecord = {
        id: generateUUID(),
        entry_id: entryId,
        ...entryData.expense,
        created_at: now,
      };
      expenses.push(detail);
      setLocalItems('farm_expenses', expenses);
      newEntry.expense = detail;
    } else if (entryData.entry_type === 'harvest' && entryData.harvest) {
      const harvests = getLocalItems<HarvestRecord>('harvest_records');
      const detail: HarvestRecord = {
        id: generateUUID(),
        entry_id: entryId,
        ...entryData.harvest,
        created_at: now,
      };
      harvests.push(detail);
      setLocalItems('harvest_records', harvests);
      newEntry.harvest = detail;
    }

    if (entryData.attachments && entryData.attachments.length > 0) {
      const attList = getLocalItems<DiaryAttachment>('farm_diary_attachments');
      const savedAtts: DiaryAttachment[] = entryData.attachments.map((att) => ({
        id: att.id || generateUUID(),
        entry_id: entryId,
        owner_id: userId,
        file_name: att.file_name,
        file_url: att.file_url,
        storage_path: att.storage_path,
        media_type: att.media_type,
        file_size_bytes: att.file_size_bytes,
        caption: att.caption || null,
        created_at: now,
      }));
      attList.push(...savedAtts);
      setLocalItems('farm_diary_attachments', attList);
      newEntry.attachments = savedAtts;
    } else {
      newEntry.attachments = [];
    }

    return newEntry;
  },

  async updateDiaryEntry(
    userId: string,
    entryId: string,
    updates: Partial<DiaryEntryFormData>
  ): Promise<FarmDiaryEntry> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      const masterUpdates: any = { updated_at: now };
      if (updates.title) masterUpdates.title = updates.title.trim();
      if (updates.description !== undefined) masterUpdates.description = updates.description?.trim() || null;
      if (updates.occurred_at) masterUpdates.occurred_at = updates.occurred_at;
      if (updates.farm_id) masterUpdates.farm_id = updates.farm_id;
      if (updates.plot_id !== undefined) masterUpdates.plot_id = updates.plot_id;
      if (updates.crop_plan_id !== undefined) masterUpdates.crop_plan_id = updates.crop_plan_id;
      if (updates.status) masterUpdates.status = updates.status;
      if (updates.tags) masterUpdates.tags = updates.tags;

      const { error: masterErr } = await supabase
        .from('farm_diary_entries')
        .update(masterUpdates)
        .eq('id', entryId)
        .eq('owner_id', userId);
      if (masterErr) throw masterErr;

      // Update sub-details if provided
      if (updates.activity_detail) {
        await supabase
          .from('farm_activity_details')
          .update(updates.activity_detail)
          .eq('entry_id', entryId);
      } else if (updates.irrigation_record) {
        await supabase
          .from('irrigation_records')
          .update(updates.irrigation_record)
          .eq('entry_id', entryId);
      } else if (updates.input_record) {
        await supabase
          .from('farm_input_records')
          .update(updates.input_record)
          .eq('entry_id', entryId);
      } else if (updates.observation) {
        await supabase
          .from('crop_observations')
          .update(updates.observation)
          .eq('entry_id', entryId);
      } else if (updates.expense) {
        await supabase
          .from('farm_expenses')
          .update(updates.expense)
          .eq('entry_id', entryId);
      } else if (updates.harvest) {
        await supabase
          .from('harvest_records')
          .update(updates.harvest)
          .eq('entry_id', entryId);
      }

      return (await this.getDiaryEntryById(userId, entryId))!;
    }

    // Local mode
    const masterList = getLocalItems<FarmDiaryEntry>('farm_diary_entries');
    const idx = masterList.findIndex((e) => e.id === entryId && e.owner_id === userId);
    if (idx === -1) throw new Error('Diary entry not found');

    const entry = masterList[idx];
    if (updates.title) entry.title = updates.title.trim();
    if (updates.description !== undefined) entry.description = updates.description?.trim() || null;
    if (updates.occurred_at) entry.occurred_at = updates.occurred_at;
    if (updates.farm_id) entry.farm_id = updates.farm_id;
    if (updates.plot_id !== undefined) entry.plot_id = updates.plot_id;
    if (updates.crop_plan_id !== undefined) entry.crop_plan_id = updates.crop_plan_id;
    if (updates.status) entry.status = updates.status;
    if (updates.tags) entry.tags = updates.tags;
    entry.updated_at = now;
    setLocalItems('farm_diary_entries', masterList);

    // Update sub-detail records
    if (updates.activity_detail) {
      const activities = getLocalItems<FarmActivityDetail>('farm_activity_details');
      const aIdx = activities.findIndex((a) => a.entry_id === entryId);
      if (aIdx >= 0) {
        activities[aIdx] = { ...activities[aIdx], ...updates.activity_detail };
        setLocalItems('farm_activity_details', activities);
      }
    } else if (updates.irrigation_record) {
      const irrigations = getLocalItems<IrrigationRecord>('irrigation_records');
      const iIdx = irrigations.findIndex((i) => i.entry_id === entryId);
      if (iIdx >= 0) {
        irrigations[iIdx] = { ...irrigations[iIdx], ...updates.irrigation_record };
        setLocalItems('irrigation_records', irrigations);
      }
    } else if (updates.input_record) {
      const inputs = getLocalItems<FarmInputRecord>('farm_input_records');
      const inpIdx = inputs.findIndex((i) => i.entry_id === entryId);
      if (inpIdx >= 0) {
        inputs[inpIdx] = { ...inputs[inpIdx], ...updates.input_record };
        setLocalItems('farm_input_records', inputs);
      }
    } else if (updates.observation) {
      const observations = getLocalItems<CropObservationRecord>('crop_observations');
      const oIdx = observations.findIndex((o) => o.entry_id === entryId);
      if (oIdx >= 0) {
        observations[oIdx] = { ...observations[oIdx], ...updates.observation };
        setLocalItems('crop_observations', observations);
      }
    } else if (updates.expense) {
      const expenses = getLocalItems<FarmExpenseRecord>('farm_expenses');
      const exIdx = expenses.findIndex((e) => e.entry_id === entryId);
      if (exIdx >= 0) {
        expenses[exIdx] = { ...expenses[exIdx], ...updates.expense };
        setLocalItems('farm_expenses', expenses);
      }
    } else if (updates.harvest) {
      const harvests = getLocalItems<HarvestRecord>('harvest_records');
      const hIdx = harvests.findIndex((h) => h.entry_id === entryId);
      if (hIdx >= 0) {
        harvests[hIdx] = { ...harvests[hIdx], ...updates.harvest };
        setLocalItems('harvest_records', harvests);
      }
    }

    return (await this.getDiaryEntryById(userId, entryId))!;
  },

  async deleteDiaryEntry(userId: string, entryId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('farm_diary_entries')
        .delete()
        .eq('id', entryId)
        .eq('owner_id', userId);
      if (error) throw error;
      return;
    }

    // Local mode (cascades)
    let master = getLocalItems<FarmDiaryEntry>('farm_diary_entries');
    master = master.filter((e) => !(e.id === entryId && e.owner_id === userId));
    setLocalItems('farm_diary_entries', master);

    let activities = getLocalItems<FarmActivityDetail>('farm_activity_details');
    activities = activities.filter((a) => a.entry_id !== entryId);
    setLocalItems('farm_activity_details', activities);

    let irrigations = getLocalItems<IrrigationRecord>('irrigation_records');
    irrigations = irrigations.filter((i) => i.entry_id !== entryId);
    setLocalItems('irrigation_records', irrigations);

    let inputs = getLocalItems<FarmInputRecord>('farm_input_records');
    inputs = inputs.filter((i) => i.entry_id !== entryId);
    setLocalItems('farm_input_records', inputs);

    let observations = getLocalItems<CropObservationRecord>('crop_observations');
    observations = observations.filter((o) => o.entry_id !== entryId);
    setLocalItems('crop_observations', observations);

    let expenses = getLocalItems<FarmExpenseRecord>('farm_expenses');
    expenses = expenses.filter((e) => e.entry_id !== entryId);
    setLocalItems('farm_expenses', expenses);

    let harvests = getLocalItems<HarvestRecord>('harvest_records');
    harvests = harvests.filter((h) => h.entry_id !== entryId);
    setLocalItems('harvest_records', harvests);

    let attachments = getLocalItems<DiaryAttachment>('farm_diary_attachments');
    attachments = attachments.filter((att) => att.entry_id !== entryId);
    setLocalItems('farm_diary_attachments', attachments);
  },

  async getDiarySummaryStats(
    userId: string,
    farmId?: string
  ): Promise<DiarySummaryStats> {
    const entries = await this.getDiaryEntries(userId, {
      farmId,
      status: 'active',
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayActivities = entries.filter((e) => e.occurred_at.slice(0, 10) === todayStr).length;

    let totalExpensesAmount = 0;
    let totalHarvestKg = 0;
    let activeObservationsCount = 0;

    for (const entry of entries) {
      if (entry.expense && entry.expense.amount > 0) {
        totalExpensesAmount += Number(entry.expense.amount);
      }
      if (entry.harvest && entry.harvest.quantity_harvested > 0) {
        const qty = Number(entry.harvest.quantity_harvested);
        const unit = (entry.harvest.unit || '').toLowerCase();
        if (unit.includes('quintal')) {
          totalHarvestKg += qty * 100;
        } else if (unit.includes('tonne')) {
          totalHarvestKg += qty * 1000;
        } else {
          totalHarvestKg += qty;
        }
      }
      if (entry.observation) {
        activeObservationsCount += 1;
      }
    }

    return {
      totalEntries: entries.length,
      todayActivities,
      totalExpensesAmount: Math.round(totalExpensesAmount * 100) / 100,
      totalHarvestKg: Math.round(totalHarvestKg * 10) / 10,
      activeObservationsCount,
    };
  },

  async createDiaryAttachment(
    userId: string,
    attachment: Omit<DiaryAttachment, 'id' | 'created_at'>
  ): Promise<DiaryAttachment> {
    const attId = generateUUID();
    const now = new Date().toISOString();
    const item: DiaryAttachment = {
      id: attId,
      entry_id: attachment.entry_id,
      owner_id: userId,
      file_name: attachment.file_name,
      file_url: attachment.file_url,
      storage_path: attachment.storage_path,
      media_type: attachment.media_type,
      file_size_bytes: attachment.file_size_bytes,
      caption: attachment.caption || null,
      created_at: now,
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('farm_diary_attachments')
        .insert(item)
        .select('*')
        .single();
      if (error) throw error;
      return data as DiaryAttachment;
    }

    // Local mode
    const attList = getLocalItems<DiaryAttachment>('farm_diary_attachments');
    attList.push(item);
    setLocalItems('farm_diary_attachments', attList);
    return item;
  },

  async deleteDiaryAttachment(userId: string, attachmentId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('farm_diary_attachments')
        .delete()
        .eq('id', attachmentId)
        .eq('owner_id', userId);
      if (error) throw error;
      return;
    }

    // Local mode
    let attList = getLocalItems<DiaryAttachment>('farm_diary_attachments');
    attList = attList.filter((att) => !(att.id === attachmentId && att.owner_id === userId));
    setLocalItems('farm_diary_attachments', attList);
  },

  // --- Phase 6: Farm Finance, Budgets & Harvest Sales Operations ---

  // 1. Budgets
  async getBudgets(userId: string, farmId?: string): Promise<FarmBudget[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('farm_budgets').select('*').eq('owner_id', userId);
      if (farmId && farmId !== 'all') {
        query = query.eq('farm_id', farmId);
      }
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return (data as FarmBudget[]) || [];
    }

    const budgets = getLocalItems<FarmBudget>('farm_budgets');
    let list = budgets.filter((b) => b.owner_id === userId);
    if (farmId && farmId !== 'all') {
      list = list.filter((b) => b.farm_id === farmId);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getBudgetById(userId: string, budgetId: string): Promise<FarmBudget | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('farm_budgets')
        .select('*')
        .eq('id', budgetId)
        .eq('owner_id', userId)
        .single();
      if (error) return null;
      return data as FarmBudget;
    }

    const budgets = getLocalItems<FarmBudget>('farm_budgets');
    return budgets.find((b) => b.id === budgetId && b.owner_id === userId) || null;
  },

  async createBudget(userId: string, data: BudgetFormData): Promise<FarmBudget> {
    const budgetId = generateUUID();
    const now = new Date().toISOString();
    const item: FarmBudget = {
      id: budgetId,
      owner_id: userId,
      farm_id: data.farm_id,
      plot_id: data.plot_id || null,
      crop_plan_id: data.crop_plan_id || null,
      name: data.name.trim(),
      category: data.category,
      amount: Number(data.amount),
      currency: data.currency || 'INR',
      period_start: data.period_start,
      period_end: data.period_end,
      alert_threshold_percent: data.alert_threshold_percent || 80,
      notes: data.notes?.trim() || null,
      status: data.status || 'active',
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured() && supabase) {
      const { data: created, error } = await supabase
        .from('farm_budgets')
        .insert(item)
        .select('*')
        .single();
      if (error) throw error;
      return created as FarmBudget;
    }

    const budgets = getLocalItems<FarmBudget>('farm_budgets');
    budgets.unshift(item);
    setLocalItems('farm_budgets', budgets);
    return item;
  },

  async updateBudget(
    userId: string,
    budgetId: string,
    updates: Partial<BudgetFormData>
  ): Promise<FarmBudget> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('farm_budgets')
        .update({ ...updates, updated_at: now })
        .eq('id', budgetId)
        .eq('owner_id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return data as FarmBudget;
    }

    const budgets = getLocalItems<FarmBudget>('farm_budgets');
    const idx = budgets.findIndex((b) => b.id === budgetId && b.owner_id === userId);
    if (idx === -1) throw new Error('Budget not found');
    const updated: FarmBudget = { ...budgets[idx], ...updates, updated_at: now };
    budgets[idx] = updated;
    setLocalItems('farm_budgets', budgets);
    return updated;
  },

  async deleteBudget(userId: string, budgetId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('farm_budgets')
        .delete()
        .eq('id', budgetId)
        .eq('owner_id', userId);
      if (error) throw error;
      return;
    }

    let budgets = getLocalItems<FarmBudget>('farm_budgets');
    budgets = budgets.filter((b) => !(b.id === budgetId && b.owner_id === userId));
    setLocalItems('farm_budgets', budgets);
  },

  // 2. Harvest Sales (with automatic Financial Transaction synchronization)
  async getHarvestSales(
    userId: string,
    filters?: { farmId?: string; harvestRecordId?: string }
  ): Promise<HarvestSale[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('harvest_sales').select('*').eq('owner_id', userId);
      if (filters?.farmId && filters.farmId !== 'all') {
        query = query.eq('farm_id', filters.farmId);
      }
      if (filters?.harvestRecordId) {
        query = query.eq('harvest_record_id', filters.harvestRecordId);
      }
      query = query.order('sale_date', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return (data as HarvestSale[]) || [];
    }

    const sales = getLocalItems<HarvestSale>('harvest_sales');
    let list = sales.filter((s) => s.owner_id === userId);
    if (filters?.farmId && filters.farmId !== 'all') {
      list = list.filter((s) => s.farm_id === filters.farmId);
    }
    if (filters?.harvestRecordId) {
      list = list.filter((s) => s.harvest_record_id === filters.harvestRecordId);
    }
    return list.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());
  },

  async getHarvestSaleById(userId: string, saleId: string): Promise<HarvestSale | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('harvest_sales')
        .select('*')
        .eq('id', saleId)
        .eq('owner_id', userId)
        .single();
      if (error) return null;
      return data as HarvestSale;
    }

    const sales = getLocalItems<HarvestSale>('harvest_sales');
    return sales.find((s) => s.id === saleId && s.owner_id === userId) || null;
  },

  async createHarvestSale(userId: string, data: HarvestSaleFormData): Promise<HarvestSale> {
    const saleId = generateUUID();
    const now = new Date().toISOString();

    const gross_revenue = calculateGrossSaleRevenue(
      data.quantity_sold,
      data.quantity_unit,
      data.unit_price,
      data.price_unit || 'per_quintal'
    );
    const selling_cost = Number(data.selling_cost || 0);
    const net_proceeds = Math.max(0, gross_revenue - selling_cost);

    const item: HarvestSale = {
      id: saleId,
      owner_id: userId,
      farm_id: data.farm_id,
      plot_id: data.plot_id || null,
      crop_plan_id: data.crop_plan_id || null,
      harvest_record_id: data.harvest_record_id || null,
      crop_name: data.crop_name.trim(),
      quantity_sold: Number(data.quantity_sold),
      quantity_unit: data.quantity_unit,
      unit_price: Number(data.unit_price),
      price_unit: data.price_unit || 'per_quintal',
      currency: data.currency || 'INR',
      gross_revenue,
      selling_cost,
      net_proceeds,
      sale_date: data.sale_date,
      buyer_market: data.buyer_market?.trim() || null,
      buyer_reference: data.buyer_reference?.trim() || null,
      payment_status: data.payment_status || 'received',
      notes: data.notes?.trim() || null,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured() && supabase) {
      const { data: created, error } = await supabase
        .from('harvest_sales')
        .insert(item)
        .select('*')
        .single();
      if (error) throw error;

      // Automatically mirror to financial transactions
      await supabase.from('farm_financial_transactions').insert({
        id: generateUUID(),
        owner_id: userId,
        farm_id: data.farm_id,
        plot_id: data.plot_id || null,
        crop_plan_id: data.crop_plan_id || null,
        transaction_type: 'sale_revenue',
        category: 'crop_sale',
        amount: gross_revenue,
        currency: data.currency || 'INR',
        occurred_at: `${data.sale_date}T12:00:00Z`,
        description: `Sale: ${data.quantity_sold} ${data.quantity_unit} of ${data.crop_name} to ${data.buyer_market || 'Market'}`,
        source_harvest_sale_id: saleId,
        payment_method: 'cash',
        payment_status: data.payment_status || 'received',
        vendor_buyer: data.buyer_market || null,
        created_at: now,
        updated_at: now,
      });

      return created as HarvestSale;
    }

    // Local mode
    const sales = getLocalItems<HarvestSale>('harvest_sales');
    sales.unshift(item);
    setLocalItems('harvest_sales', sales);

    // Also create mirrored transaction in local store
    const transactions = getLocalItems<FinancialTransaction>('farm_financial_transactions');
    transactions.unshift({
      id: generateUUID(),
      owner_id: userId,
      farm_id: data.farm_id,
      plot_id: data.plot_id || null,
      crop_plan_id: data.crop_plan_id || null,
      transaction_type: 'sale_revenue',
      category: 'crop_sale',
      amount: gross_revenue,
      currency: data.currency || 'INR',
      occurred_at: `${data.sale_date}T12:00:00Z`,
      description: `Sale: ${data.quantity_sold} ${data.quantity_unit} of ${data.crop_name} to ${data.buyer_market || 'Market'}`,
      source_harvest_sale_id: saleId,
      payment_method: 'cash',
      payment_status: data.payment_status || 'received',
      vendor_buyer: data.buyer_market || null,
      created_at: now,
      updated_at: now,
    });
    setLocalItems('farm_financial_transactions', transactions);

    return item;
  },

  async updateHarvestSale(
    userId: string,
    saleId: string,
    updates: Partial<HarvestSaleFormData>
  ): Promise<HarvestSale> {
    const now = new Date().toISOString();
    const existing = await this.getHarvestSaleById(userId, saleId);
    if (!existing) throw new Error('Sale record not found');

    const quantity_sold = updates.quantity_sold !== undefined ? Number(updates.quantity_sold) : existing.quantity_sold;
    const quantity_unit = updates.quantity_unit || existing.quantity_unit;
    const unit_price = updates.unit_price !== undefined ? Number(updates.unit_price) : existing.unit_price;
    const price_unit = updates.price_unit || existing.price_unit;
    const selling_cost = updates.selling_cost !== undefined ? Number(updates.selling_cost) : existing.selling_cost;

    const gross_revenue = calculateGrossSaleRevenue(quantity_sold, quantity_unit, unit_price, price_unit);
    const net_proceeds = Math.max(0, gross_revenue - selling_cost);

    const mergedPayload = {
      ...updates,
      gross_revenue,
      selling_cost,
      net_proceeds,
      updated_at: now,
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('harvest_sales')
        .update(mergedPayload)
        .eq('id', saleId)
        .eq('owner_id', userId)
        .select('*')
        .single();
      if (error) throw error;

      // Update linked transaction
      await supabase
        .from('farm_financial_transactions')
        .update({
          amount: gross_revenue,
          updated_at: now,
        })
        .eq('source_harvest_sale_id', saleId)
        .eq('owner_id', userId);

      return data as HarvestSale;
    }

    // Local mode
    const sales = getLocalItems<HarvestSale>('harvest_sales');
    const idx = sales.findIndex((s) => s.id === saleId && s.owner_id === userId);
    if (idx === -1) throw new Error('Sale not found');
    const updated: HarvestSale = { ...sales[idx], ...mergedPayload };
    sales[idx] = updated;
    setLocalItems('harvest_sales', sales);

    // Update mirrored transaction
    const transactions = getLocalItems<FinancialTransaction>('farm_financial_transactions');
    const txIdx = transactions.findIndex((t) => t.source_harvest_sale_id === saleId && t.owner_id === userId);
    if (txIdx !== -1) {
      transactions[txIdx].amount = gross_revenue;
      transactions[txIdx].updated_at = now;
      setLocalItems('farm_financial_transactions', transactions);
    }

    return updated;
  },

  async deleteHarvestSale(userId: string, saleId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('harvest_sales')
        .delete()
        .eq('id', saleId)
        .eq('owner_id', userId);
      if (error) throw error;
      return;
    }

    // Local mode
    let sales = getLocalItems<HarvestSale>('harvest_sales');
    sales = sales.filter((s) => !(s.id === saleId && s.owner_id === userId));
    setLocalItems('harvest_sales', sales);

    let transactions = getLocalItems<FinancialTransaction>('farm_financial_transactions');
    transactions = transactions.filter((t) => !(t.source_harvest_sale_id === saleId && t.owner_id === userId));
    setLocalItems('farm_financial_transactions', transactions);
  },

  // 3. Unified Financial Transactions
  async getFinancialTransactions(
    userId: string,
    filters?: {
      farmId?: string;
      plotId?: string;
      cropPlanId?: string;
      transactionType?: string;
      category?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<FinancialTransaction[]> {
    // Automatically ensure Phase 5 expenses are synced without duplicates
    await this.syncPhase5ExpensesToTransactions(userId);

    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('farm_financial_transactions').select('*').eq('owner_id', userId);
      if (filters?.farmId && filters.farmId !== 'all') {
        query = query.eq('farm_id', filters.farmId);
      }
      if (filters?.plotId && filters.plotId !== 'all') {
        query = query.eq('plot_id', filters.plotId);
      }
      if (filters?.cropPlanId && filters.cropPlanId !== 'all') {
        query = query.eq('crop_plan_id', filters.cropPlanId);
      }
      if (filters?.transactionType && filters.transactionType !== 'all') {
        query = query.eq('transaction_type', filters.transactionType);
      }
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.startDate) {
        query = query.gte('occurred_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('occurred_at', filters.endDate);
      }

      query = query.order('occurred_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return (data as FinancialTransaction[]) || [];
    }

    const transactions = getLocalItems<FinancialTransaction>('farm_financial_transactions');
    let list = transactions.filter((t) => t.owner_id === userId);

    if (filters?.farmId && filters.farmId !== 'all') {
      list = list.filter((t) => t.farm_id === filters.farmId);
    }
    if (filters?.plotId && filters.plotId !== 'all') {
      list = list.filter((t) => t.plot_id === filters.plotId);
    }
    if (filters?.cropPlanId && filters.cropPlanId !== 'all') {
      list = list.filter((t) => t.crop_plan_id === filters.cropPlanId);
    }
    if (filters?.transactionType && filters.transactionType !== 'all') {
      list = list.filter((t) => t.transaction_type === filters.transactionType);
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter((t) => t.category === filters.category);
    }
    if (filters?.startDate) {
      list = list.filter((t) => new Date(t.occurred_at) >= new Date(filters.startDate!));
    }
    if (filters?.endDate) {
      list = list.filter((t) => new Date(t.occurred_at) <= new Date(filters.endDate!));
    }

    return list.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  },

  async getTransactionById(userId: string, transactionId: string): Promise<FinancialTransaction | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('farm_financial_transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('owner_id', userId)
        .single();
      if (error) return null;
      return data as FinancialTransaction;
    }

    const transactions = getLocalItems<FinancialTransaction>('farm_financial_transactions');
    return transactions.find((t) => t.id === transactionId && t.owner_id === userId) || null;
  },

  async createFinancialTransaction(
    userId: string,
    data: TransactionFormData
  ): Promise<FinancialTransaction> {
    const txId = generateUUID();
    const now = new Date().toISOString();

    const item: FinancialTransaction = {
      id: txId,
      owner_id: userId,
      farm_id: data.farm_id,
      plot_id: data.plot_id || null,
      crop_plan_id: data.crop_plan_id || null,
      transaction_type: data.transaction_type,
      category: data.category,
      amount: Number(data.amount),
      currency: data.currency || 'INR',
      occurred_at: data.occurred_at || now,
      description: data.description.trim(),
      source_diary_entry_id: data.source_diary_entry_id || null,
      source_harvest_sale_id: data.source_harvest_sale_id || null,
      payment_method: data.payment_method || 'cash',
      payment_status: data.payment_status || 'paid',
      receipt_photo_url: data.receipt_photo_url || null,
      invoice_number: data.invoice_number?.trim() || null,
      vendor_buyer: data.vendor_buyer?.trim() || null,
      notes: data.notes?.trim() || null,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured() && supabase) {
      const { data: created, error } = await supabase
        .from('farm_financial_transactions')
        .insert(item)
        .select('*')
        .single();
      if (error) throw error;
      return created as FinancialTransaction;
    }

    const transactions = getLocalItems<FinancialTransaction>('farm_financial_transactions');
    transactions.unshift(item);
    setLocalItems('farm_financial_transactions', transactions);
    return item;
  },

  async updateFinancialTransaction(
    userId: string,
    transactionId: string,
    updates: Partial<TransactionFormData>
  ): Promise<FinancialTransaction> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('farm_financial_transactions')
        .update({ ...updates, updated_at: now })
        .eq('id', transactionId)
        .eq('owner_id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return data as FinancialTransaction;
    }

    const transactions = getLocalItems<FinancialTransaction>('farm_financial_transactions');
    const idx = transactions.findIndex((t) => t.id === transactionId && t.owner_id === userId);
    if (idx === -1) throw new Error('Transaction not found');
    const updated: FinancialTransaction = { ...transactions[idx], ...updates, updated_at: now };
    transactions[idx] = updated;
    setLocalItems('farm_financial_transactions', transactions);
    return updated;
  },

  async deleteFinancialTransaction(userId: string, transactionId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('farm_financial_transactions')
        .delete()
        .eq('id', transactionId)
        .eq('owner_id', userId);
      if (error) throw error;
      return;
    }

    let transactions = getLocalItems<FinancialTransaction>('farm_financial_transactions');
    transactions = transactions.filter((t) => !(t.id === transactionId && t.owner_id === userId));
    setLocalItems('farm_financial_transactions', transactions);
  },

  // 4. Synchronization of Phase 5 Farm Diary Expenses (Strict Deduplication)
  async syncPhase5ExpensesToTransactions(userId: string): Promise<number> {
    let syncedCount = 0;

    if (isSupabaseConfigured() && supabase) {
      // 1. Fetch diary entries with expenses
      const { data: diaryEntries } = await supabase
        .from('farm_diary_entries')
        .select('*, expense:farm_expenses(*)')
        .eq('owner_id', userId);

      if (!diaryEntries) return 0;

      for (const entry of diaryEntries) {
        if (!entry.expense) continue;

        // Check if transaction with this source_diary_entry_id already exists
        const { data: existing } = await supabase
          .from('farm_financial_transactions')
          .select('id')
          .eq('source_diary_entry_id', entry.id)
          .eq('owner_id', userId)
          .maybeSingle();

        if (!existing) {
          await supabase.from('farm_financial_transactions').insert({
            id: generateUUID(),
            owner_id: userId,
            farm_id: entry.farm_id,
            plot_id: entry.plot_id,
            crop_plan_id: entry.crop_plan_id,
            transaction_type: 'expense',
            category: diaryToFinanceExpenseCategory(entry.expense.category),
            amount: Number(entry.expense.amount),
            currency: entry.expense.currency || 'INR',
            occurred_at: entry.occurred_at,
            description: entry.title,
            source_diary_entry_id: entry.id,
            payment_method: entry.expense.payment_method || 'cash',
            payment_status: diaryToFinancePaymentStatus(entry.expense.payment_status || 'paid'),
            receipt_photo_url: entry.expense.receipt_photo_url,
            vendor_buyer: entry.expense.vendor_payee,
            created_at: entry.created_at,
            updated_at: entry.updated_at,
          });
          syncedCount++;
        }
      }
      return syncedCount;
    }

    // Local mode sync
    const master = getLocalItems<FarmDiaryEntry>('farm_diary_entries').filter((e) => e.owner_id === userId);
    const expenses = getLocalItems<FarmExpenseRecord>('farm_expenses');
    const transactions = getLocalItems<FinancialTransaction>('farm_financial_transactions');

    for (const entry of master) {
      const exp = expenses.find((e) => e.entry_id === entry.id);
      if (!exp) continue;

      const alreadyExists = transactions.some(
        (t) => t.source_diary_entry_id === entry.id && t.owner_id === userId
      );

      if (!alreadyExists) {
        transactions.push({
          id: generateUUID(),
          owner_id: userId,
          farm_id: entry.farm_id,
          plot_id: entry.plot_id,
          crop_plan_id: entry.crop_plan_id,
          transaction_type: 'expense',
          category: diaryToFinanceExpenseCategory(exp.category),
          amount: Number(exp.amount),
          currency: exp.currency || 'INR',
          occurred_at: entry.occurred_at,
          description: entry.title,
          source_diary_entry_id: entry.id,
          payment_method: (exp.payment_method as any) || 'cash',
          payment_status: diaryToFinancePaymentStatus(exp.payment_status || 'paid'),
          receipt_photo_url: exp.receipt_photo_url,
          vendor_buyer: exp.vendor_payee,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
        });
        syncedCount++;
      }
    }

    if (syncedCount > 0) {
      setLocalItems('farm_financial_transactions', transactions);
    }

    return syncedCount;
  },

  // --- Phase 7: AI Farm Assistant Operations ---
  async getAssistantConversations(userId: string): Promise<AssistantConversation[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('assistant_conversations')
        .select('*')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AssistantConversation[];
    }

    const conversations = getLocalItems<AssistantConversation>('assistant_conversations');
    return conversations
      .filter((c) => c.owner_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  },

  async getAssistantConversationById(
    userId: string,
    conversationId: string
  ): Promise<AssistantConversation | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('assistant_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('owner_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return (data || null) as AssistantConversation | null;
    }

    const conversations = getLocalItems<AssistantConversation>('assistant_conversations');
    return conversations.find((c) => c.id === conversationId && c.owner_id === userId) || null;
  },

  async createAssistantConversation(
    userId: string,
    data: {
      title?: string;
      preferred_language?: Language;
      farm_id?: string | null;
      plot_id?: string | null;
    }
  ): Promise<AssistantConversation> {
    const now = new Date().toISOString();
    const newConv: AssistantConversation = {
      id: generateUUID(),
      owner_id: userId,
      title: data.title || (data.preferred_language === 'ta' ? 'புதிய வேளாண் ஆலோசனை' : 'New Agricultural Consultation'),
      preferred_language: data.preferred_language || 'en',
      farm_id: data.farm_id || null,
      plot_id: data.plot_id || null,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured() && supabase) {
      const { data: inserted, error } = await supabase
        .from('assistant_conversations')
        .insert(newConv)
        .select()
        .single();
      if (error) throw error;
      return inserted as AssistantConversation;
    }

    const conversations = getLocalItems<AssistantConversation>('assistant_conversations');
    conversations.unshift(newConv);
    setLocalItems('assistant_conversations', conversations);
    return newConv;
  },

  async updateAssistantConversation(
    userId: string,
    conversationId: string,
    updates: Partial<AssistantConversation>
  ): Promise<AssistantConversation> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('assistant_conversations')
        .update({ ...updates, updated_at: now })
        .eq('id', conversationId)
        .eq('owner_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data as AssistantConversation;
    }

    const conversations = getLocalItems<AssistantConversation>('assistant_conversations');
    const index = conversations.findIndex((c) => c.id === conversationId && c.owner_id === userId);
    if (index === -1) throw new Error('Conversation not found');
    const updated = { ...conversations[index], ...updates, updated_at: now };
    conversations[index] = updated;
    setLocalItems('assistant_conversations', conversations);
    return updated;
  },

  async deleteAssistantConversation(userId: string, conversationId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('assistant_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('owner_id', userId);
      if (error) throw error;
      return;
    }

    const conversations = getLocalItems<AssistantConversation>('assistant_conversations');
    const filtered = conversations.filter((c) => !(c.id === conversationId && c.owner_id === userId));
    setLocalItems('assistant_conversations', filtered);

    const messages = getLocalItems<AssistantMessage>('assistant_messages');
    const filteredMsgs = messages.filter((m) => m.conversation_id !== conversationId);
    setLocalItems('assistant_messages', filteredMsgs);
  },

  async getAssistantMessages(
    userId: string,
    conversationId: string
  ): Promise<AssistantMessage[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('assistant_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('owner_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as AssistantMessage[];
    }

    const messages = getLocalItems<AssistantMessage>('assistant_messages');
    return messages
      .filter((m) => m.conversation_id === conversationId && m.owner_id === userId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async createAssistantMessage(
    userId: string,
    message: {
      conversation_id: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      sources?: SourceReference[];
      model_name?: string;
    }
  ): Promise<AssistantMessage> {
    const now = new Date().toISOString();
    const newMsg: AssistantMessage = {
      id: generateUUID(),
      conversation_id: message.conversation_id,
      owner_id: userId,
      role: message.role,
      content: message.content,
      sources: message.sources || [],
      model_name: message.model_name || 'icar-tnau-expert-engine',
      created_at: now,
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('assistant_messages')
        .insert(newMsg)
        .select()
        .single();
      if (error) throw error;

      await supabase
        .from('assistant_conversations')
        .update({ updated_at: now })
        .eq('id', message.conversation_id)
        .eq('owner_id', userId);

      return data as AssistantMessage;
    }

    const messages = getLocalItems<AssistantMessage>('assistant_messages');
    messages.push(newMsg);
    setLocalItems('assistant_messages', messages);

    const conversations = getLocalItems<AssistantConversation>('assistant_conversations');
    const convIdx = conversations.findIndex((c) => c.id === message.conversation_id && c.owner_id === userId);
    if (convIdx !== -1) {
      conversations[convIdx].updated_at = now;
      setLocalItems('assistant_conversations', conversations);
    }

    return newMsg;
  },
};
