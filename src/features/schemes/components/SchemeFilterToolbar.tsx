// CropDiary AI — Government Scheme Filter Toolbar
import React from 'react';
import { Search, Filter, X, Globe } from 'lucide-react';
import { SchemeFilterParams } from '@/types/schemes';
import { Language } from '@/types/assistant';

interface SchemeFilterToolbarProps {
  filters: SchemeFilterParams;
  onFilterChange: (filters: SchemeFilterParams) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  totalCount: number;
}

export const SchemeFilterToolbar: React.FC<SchemeFilterToolbarProps> = ({
  filters,
  onFilterChange,
  language,
  onLanguageChange,
  totalCount,
}) => {
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const handleScopeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, scope: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, category: e.target.value });
  };

  const handleBeneficiaryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, beneficiaryType: e.target.value });
  };

  const handleReset = () => {
    onFilterChange({
      searchQuery: '',
      scope: 'all',
      category: 'all',
      beneficiaryType: 'all',
    });
  };

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    (filters.scope && filters.scope !== 'all') ||
    (filters.category && filters.category !== 'all') ||
    (filters.beneficiaryType && filters.beneficiaryType !== 'all');

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-xs space-y-3">
      {/* Search Bar + Language Switch */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.searchQuery || ''}
            onChange={handleSearch}
            placeholder={
              language === 'ta'
                ? 'திட்டத்தின் பெயர், குறியீடு அல்லது துறையை தேடவும் (எ.கா. PM-KISAN, பாசனம், சோலார்)...'
                : 'Search schemes by keyword, crop, or department (e.g. PM-KISAN, Solar, Irrigation)...'
            }
            aria-label={
              language === 'ta'
                ? 'அரசு திட்டங்கள் தேடல்'
                : 'Search government schemes'
            }
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Language Switch */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-1.5" />
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              language === 'en'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            aria-label="Switch scheme display to English"
          >
            English
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('ta')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              language === 'ta'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            aria-label="திட்ட விவரங்களை தமிழில் காண"
          >
            தமிழ்
          </button>
        </div>
      </div>

      {/* Dropdown Filters Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mr-1">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'ta' ? 'வடிகட்டிகள்:' : 'Filters:'}</span>
        </div>

        {/* Scope Filter */}
        <select
          value={filters.scope || 'all'}
          onChange={handleScopeChange}
          aria-label={language === 'ta' ? 'அரசு வரம்பு' : 'Government Jurisdiction'}
          className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
        >
          <option value="all">
            {language === 'ta' ? 'அனைத்து அரசுகள் (மத்திய & மாநில)' : 'All Jurisdictions'}
          </option>
          <option value="central">
            {language === 'ta' ? 'மத்திய அரசு (Central)' : 'Central Schemes'}
          </option>
          <option value="state">
            {language === 'ta' ? 'தமிழ்நாடு மாநில அரசு (State)' : 'Tamil Nadu State'}
          </option>
        </select>

        {/* Category Filter */}
        <select
          value={filters.category || 'all'}
          onChange={handleCategoryChange}
          aria-label={language === 'ta' ? 'திட்ட வகை' : 'Scheme Category'}
          className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
        >
          <option value="all">
            {language === 'ta' ? 'அனைத்து பிரிவுகள்' : 'All Categories'}
          </option>
          <option value="income_support">
            {language === 'ta' ? 'வருமான ஆதரவு' : 'Income Support'}
          </option>
          <option value="crop_insurance">
            {language === 'ta' ? 'பயிர் காப்பீடு' : 'Crop Insurance'}
          </option>
          <option value="irrigation">
            {language === 'ta' ? 'நுண் பாசனம் & துளிப்பாசனம்' : 'Micro Irrigation'}
          </option>
          <option value="equipment_mechanization">
            {language === 'ta' ? 'இயந்திரங்கள் & சோலார் பம்பு' : 'Mechanization & Solar'}
          </option>
          <option value="credit_finance">
            {language === 'ta' ? 'கிசான் கிரெடிட் கார்டு / கடன்' : 'Credit & Loans'}
          </option>
          <option value="soil_health">
            {language === 'ta' ? 'மண் வள அட்டை' : 'Soil Health'}
          </option>
          <option value="organic_farming">
            {language === 'ta' ? 'இயற்கை விவசாயம் (PKVY)' : 'Organic Farming'}
          </option>
        </select>

        {/* Beneficiary Filter */}
        <select
          value={filters.beneficiaryType || 'all'}
          onChange={handleBeneficiaryChange}
          aria-label={language === 'ta' ? 'பயனாளி தகுதி' : 'Beneficiary Type'}
          className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
        >
          <option value="all">
            {language === 'ta' ? 'அனைத்து விவசாயிகள்' : 'All Farmer Categories'}
          </option>
          <option value="small_marginal">
            {language === 'ta' ? 'சிறு & குறு விவசாயிகள் (≤ 5 ஏக்கர்)' : 'Small & Marginal (≤ 5 Acres)'}
          </option>
          <option value="all_farmers">
            {language === 'ta' ? 'பொது விவசாயிகள்' : 'General Farmers'}
          </option>
        </select>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-medium"
            aria-label={language === 'ta' ? 'வடிகட்டிகளை அழிக்க' : 'Clear filters'}
          >
            <X className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'அழிக்க' : 'Reset'}</span>
          </button>
        )}

        {/* Total Count */}
        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 font-mono">
          {totalCount} {language === 'ta' ? 'திட்டங்கள் உள்ளன' : 'schemes found'}
        </span>
      </div>
    </div>
  );
};