// CropDiary AI — Phase 7: Government Schemes Directory & Eligibility Page
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { storageAdapter } from '@/services/storageAdapter';
import { schemeService } from './services/schemeService';
import {
  GovernmentScheme,
  SchemeFilterParams,
  SchemeEligibilityAssessment,
} from '@/types/schemes';
import { Farm } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { Language } from '@/types/assistant';
import { SchemeCard } from './components/SchemeCard';
import { SchemeFilterToolbar } from './components/SchemeFilterToolbar';
import { SchemeDetailModal } from './components/SchemeDetailModal';
import { SchemeDeadlineModal } from './components/SchemeDeadlineModal';
import {
  Landmark,
  ShieldCheck,
} from 'lucide-react';

export const GovernmentSchemesPage: React.FC = () => {
  const { user } = useAuth();
  const { schemeId: routeSchemeId } = useParams<{ schemeId?: string }>();

  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [filters, setFilters] = useState<SchemeFilterParams>({
    searchQuery: '',
    scope: 'all',
    category: 'all',
    beneficiaryType: 'all',
  });
  const [language, setLanguage] = useState<Language>('en');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [cropPlans, setCropPlans] = useState<CropPlan[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<GovernmentScheme | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<SchemeEligibilityAssessment | null>(null);
  const [reminderModalScheme, setReminderModalScheme] = useState<GovernmentScheme | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Initial Load of Schemes & Farmer Context
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const [loadedSchemes, userFarms, userCropPlans] = await Promise.all([
          schemeService.getSchemes(filters),
          user ? storageAdapter.getFarms(user.id) : Promise.resolve([]),
          user ? storageAdapter.getCropPlans(user.id) : Promise.resolve([]),
        ]);

        if (!isMounted) return;
        setSchemes(loadedSchemes);
        setFarms(userFarms);
        setCropPlans(userCropPlans);

        // Deep link resolution
        if (routeSchemeId) {
          const matched = loadedSchemes.find(
            (s) => s.id === routeSchemeId || s.code === routeSchemeId
          );
          if (matched) {
            handleOpenDetails(matched, userFarms, userCropPlans);
          }
        }
      } catch (err) {
        console.error('Failed to load government schemes:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // 2. Re-filter when filter params change
  useEffect(() => {
    let isMounted = true;
    async function applyFilters() {
      try {
        const filtered = await schemeService.getSchemes(filters);
        if (isMounted) setSchemes(filtered);
      } catch (err) {
        console.error('Filter error:', err);
      }
    }
    applyFilters();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  // 3. Compute Farmer Context for Eligibility
  const getFarmerContext = (farmerFarms: Farm[], farmerPlans: CropPlan[]) => {
    const totalAcreage = farmerFarms.reduce((sum, f) => sum + (f.area || 0), 0);
    const crops = Array.from(
      new Set(farmerPlans.map((cp) => cp.selected_crop_name).filter(Boolean))
    );
    const state = farmerFarms.length > 0 ? farmerFarms[0].state : 'Tamil Nadu';
    return { totalAcreage, cropsGrown: crops, state };
  };

  const handleOpenDetails = (
    scheme: GovernmentScheme,
    contextFarms = farms,
    contextPlans = cropPlans
  ) => {
    setSelectedScheme(scheme);
    const context = getFarmerContext(contextFarms, contextPlans);
    const assessment = schemeService.assessFarmerEligibility(scheme, context);
    setSelectedAssessment(assessment);
  };

  const handleCheckEligibility = (scheme: GovernmentScheme) => {
    handleOpenDetails(scheme);
  };

  const centralCount = schemes.filter((s) => s.scope === 'central').length;
  const stateCount = schemes.filter((s) => s.scope === 'state').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {language === 'ta' ? 'அரசு மானியங்கள் & நலத்திட்டங்கள்' : 'Agricultural Welfare & Subsidies'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {language === 'ta'
              ? 'அரசு நலத்திட்டங்கள் & நேரடி மானிய வழிகாட்டி'
              : 'Verified Government Schemes & Subsidies'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            {language === 'ta'
              ? 'மத்திய மற்றும் தமிழ்நாடு மாநில அரசுகளின் சரிபார்க்கப்பட்ட விவசாய மானியங்கள். உங்கள் பண்ணை அளவுக்கு ஏற்ப உடனடி தகுதி சரிபார்ப்பு.'
              : 'Explore verified Central & Tamil Nadu State agricultural schemes. Assess your eligibility based on real farm landholding and crops.'}
          </p>
        </div>

        {/* Stats Summary Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-center shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase">
              {language === 'ta' ? 'மத்திய திட்டங்கள்' : 'Central Schemes'}
            </span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              {centralCount}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-center shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase">
              {language === 'ta' ? 'மாநில திட்டங்கள்' : 'TN State Schemes'}
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {stateCount}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-center shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase">
              {language === 'ta' ? 'சரிபார்ப்பு நிலை' : 'Verification'}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Gov Verified</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <SchemeFilterToolbar
        filters={filters}
        onFilterChange={setFilters}
        language={language}
        onLanguageChange={setLanguage}
        totalCount={schemes.length}
      />

      {/* Schemes Grid */}
      {isLoading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">
            {language === 'ta'
              ? 'சரிபார்க்கப்பட்ட திட்டங்களை ஏற்றுகிறது...'
              : 'Loading verified government schemes...'}
          </p>
        </div>
      ) : schemes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 space-y-3">
          <Landmark className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {language === 'ta' ? 'திட்டங்கள் எதுவும் பொருந்தவில்லை' : 'No matching schemes found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {language === 'ta'
              ? 'தேடல் சொல் அல்லது வடிகட்டிகளை மாற்றி மீண்டும் முயற்சிக்கவும்.'
              : 'Try adjusting your search criteria or resetting the category and jurisdiction filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {schemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              language={language}
              onSelectScheme={() => handleOpenDetails(scheme)}
              onCheckEligibility={() => handleCheckEligibility(scheme)}
            />
          ))}
        </div>
      )}

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <SchemeDetailModal
          scheme={selectedScheme}
          language={language}
          assessment={selectedAssessment}
          onClose={() => {
            setSelectedScheme(null);
            setSelectedAssessment(null);
          }}
          onSetReminder={(sch) => {
            setSelectedScheme(null);
            setReminderModalScheme(sch);
          }}
        />
      )}

      {/* Scheme Deadline Reminder Modal */}
      {reminderModalScheme && user && (
        <SchemeDeadlineModal
          scheme={reminderModalScheme}
          farms={farms}
          userId={user.id}
          language={language}
          onClose={() => setReminderModalScheme(null)}
          onSuccess={() => {
            setReminderModalScheme(null);
          }}
        />
      )}
    </div>
  );
};