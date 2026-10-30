// CropDiary AI — Assistant Conversation Sidebar
import React from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Globe,
  Building,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { AssistantConversation, Language } from '@/types/assistant';
import { Farm, Plot } from '@/types/database';

interface ConversationSidebarProps {
  conversations: AssistantConversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  farms: Farm[];
  plots: Plot[];
  selectedFarmId?: string;
  selectedPlotId?: string;
  onFarmChange: (farmId: string) => void;
  onPlotChange: (plotId: string) => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  language,
  onLanguageChange,
  farms,
  plots,
  selectedFarmId,
  selectedPlotId,
  onFarmChange,
  onPlotChange,
}) => {
  const filteredPlots = selectedFarmId && selectedFarmId !== 'all'
    ? plots.filter((p) => p.farm_id === selectedFarmId)
    : plots;

  return (
    <div className="w-full md:w-80 flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Top Controls: New Chat & Language Toggle */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <button
          type="button"
          onClick={onNewConversation}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-xs"
          aria-label={language === 'ta' ? 'புதிய உரையாடல் தொடங்குக' : 'Start new consultation'}
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ta' ? 'புதிய உரையாடல்' : 'New Consultation'}</span>
        </button>

        {/* Language Switch */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'ta' ? 'மொழி' : 'Language'}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                language === 'en'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              aria-label="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('ta')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                language === 'ta'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              aria-label="தமிழுக்கு மாற்றவும்"
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* Farm & Plot Context Filters */}
        <div className="space-y-2 pt-1">
          <div>
            <label
              htmlFor="assistant-farm-select"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              <span className="flex items-center gap-1">
                <Building className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {language === 'ta' ? 'விவசாய பண்ணை சூழல்' : 'Farm Scope'}
              </span>
            </label>
            <select
              id="assistant-farm-select"
              value={selectedFarmId || 'all'}
              onChange={(e) => onFarmChange(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">
                {language === 'ta' ? 'அனைத்து பண்ணைகளும்' : 'All Farms (Holistic Overview)'}
              </option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.area} {f.area_unit || 'Acres'})
                </option>
              ))}
            </select>
          </div>

          {selectedFarmId && selectedFarmId !== 'all' && (
            <div>
              <label
                htmlFor="assistant-plot-select"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  {language === 'ta' ? 'குறிப்பிட்ட நிலப்பகுதி' : 'Specific Plot'}
                </span>
              </label>
              <select
                id="assistant-plot-select"
                value={selectedPlotId || 'all'}
                onChange={(e) => onPlotChange(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">
                  {language === 'ta' ? 'முழு பண்ணை (அனைத்து நிலங்கள்)' : 'Whole Farm (All Plots)'}
                </option>
                {filteredPlots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.area} {p.area_unit || 'Acres'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-[11px] font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase px-2 mb-1.5">
          {language === 'ta' ? 'முந்தைய உரையாடல்கள்' : 'Past Consultations'}
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-8 px-4 text-xs text-slate-600 dark:text-slate-300">
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-emerald-500 opacity-60" />
            <p>
              {language === 'ta'
                ? 'உரையாடல்கள் ஏதுமில்லை. புதிய கேள்வியை கேட்க தொடங்குங்கள்.'
                : 'No consultations yet. Ask your first agricultural question.'}
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                className={`group flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="truncate">
                    <p className="truncate">{conv.title}</p>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1 font-mono">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(conv.updated_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        language === 'ta'
                          ? 'இந்த உரையாடலை நீக்க விரும்புகிறீர்களா?'
                          : 'Delete this consultation thread?'
                      )
                    ) {
                      onDeleteConversation(conv.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity ml-1"
                  aria-label={language === 'ta' ? 'உரையாடலை நீக்கு' : 'Delete consultation'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};