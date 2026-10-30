// CropDiary AI — Assistant Chat Box Component
import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  ShieldAlert,
  Loader2,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { AssistantMessage, Language } from '@/types/assistant';
import { SourceReferenceBadge } from './SourceReferenceBadge';
import { VoiceInputButton } from '@/components/shared/VoiceInputButton';

interface AssistantChatBoxProps {
  messages: AssistantMessage[];
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  farmName?: string;
}

const SUGGESTED_PROMPTS_EN = [
  'What activities did I record on my farm this week?',
  'What expenses have I recorded this month?',
  'Summarize my crop plans and sowing dates',
  'Are there any active weather alerts for my farm?',
  'How much have I spent on fertilizers and seeds?',
  'What government schemes can I apply for?',
];

const SUGGESTED_PROMPTS_TA = [
  'இந்த வாரம் எனது பண்ணையில் என்னென்ன வேலைகள் பதிவு செய்யப்பட்டுள்ளன?',
  'இந்த மாதம் நான் செய்த பண்ணை செலவுகள் எவ்வளவு?',
  'எனது பயிர் திட்டங்கள் மற்றும் விதைப்பு தேதிகளை விவரிக்கவும்',
  'எனது பண்ணைக்கு ஏதேனும் தீவிர வானிலை எச்சரிக்கைகள் உள்ளதா?',
  'உரங்கள் மற்றும் விதைகளுக்கு நான் எவ்வளவு செலவு செய்துள்ளேன்?',
  'நான் விண்ணப்பிக்க தகுதியான அரசு மானிய திட்டங்கள் என்ன?',
];

export const AssistantChatBox: React.FC<AssistantChatBoxProps> = ({
  messages,
  onSendMessage,
  isLoading,
  language,
  farmName,
}) => {
  const [input, setInput] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageText = input.trim();
    setInput('');
    await onSendMessage(messageText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestedPromptClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const prompts = language === 'ta' ? SUGGESTED_PROMPTS_TA : SUGGESTED_PROMPTS_EN;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100/50 dark:bg-slate-950">
      {/* Header Banner */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>{language === 'ta' ? 'பண்ணை AI ஆலோசகர்' : 'AI Farm Assistant'}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {language === 'ta' ? 'ICAR / TNAU உறுதிப்படுத்தப்பட்டது' : 'ICAR / TNAU Grounded'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {farmName
                ? `${language === 'ta' ? 'பண்ணை' : 'Farm'}: ${farmName}`
                : language === 'ta'
                ? 'அனைத்து பதிவு செய்யப்பட்ட பண்ணை பதிவுகளுடன் இணைக்கப்பட்டுள்ளது'
                : 'Connected to all verified farm records'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {language === 'ta'
                  ? 'வணக்கம்! உங்கள் பண்ணை ஆலோசகர் தயாராக உள்ளார்'
                  : 'Welcome! Your AI Farm Assistant is ready'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {language === 'ta'
                  ? 'உங்கள் பண்ணை டைரி, செலவுகள், அறுவடைகள், வானிலை மற்றும் அரசு மானியங்கள் குறித்த கேள்விகளை கேட்கலாம்.'
                  : 'Ask questions about your farm diary, expenses, harvests, weather alerts, or eligible government schemes.'}
              </p>
            </div>

            {/* Suggested Prompts Grid */}
            <div className="pt-4">
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'ta' ? 'பரிந்துரைக்கப்பட்ட கேள்விகள்:' : 'Suggested Questions:'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {prompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestedPromptClick(prompt)}
                    className="p-2.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 text-slate-700 dark:text-slate-200 transition-all shadow-2xs hover:shadow-xs group flex items-start gap-2"
                  >
                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                    <span className="group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                    isUser
                      ? 'bg-slate-700 text-white'
                      : 'bg-emerald-600 text-white shadow-xs'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Content Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  {/* Model Name & Timestamp Header */}
                  {!isUser && (
                    <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {msg.model_name || 'ICAR Grounded Agricultural Engine'}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {/* Body Text */}
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Grounded Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <SourceReferenceBadge sources={msg.sources} />
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-2xl rounded-tl-xs px-4 py-3 text-xs border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>
                {language === 'ta'
                  ? 'பண்ணை பதிவுகளை ஆய்வு செய்கிறது...'
                  : 'Analyzing verified farm records...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-2">
          <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                language === 'ta'
                  ? 'விவசாய கேள்வி அல்லது பதிவுகள் குறித்து கேட்கவும்...'
                  : 'Ask about farm activities, expenses, harvests, weather alerts, or schemes...'
              }
              aria-label={
                language === 'ta'
                  ? 'வேளாண் கேள்வி உள்ளீடு'
                  : 'Agricultural inquiry input'
              }
              className="flex-1 bg-transparent resize-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden px-2 py-1 max-h-32"
            />

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Voice Input Button */}
              <VoiceInputButton
                language={language}
                onTranscript={(transcript) => {
                  setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
                  inputRef.current?.focus();
                }}
                disabled={isLoading}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label={language === 'ta' ? 'அனுப்புக' : 'Send message'}
                className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shadow-xs"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Compliance Disclaimer */}
          <div className="flex items-center gap-1.5 justify-center text-[11px] text-slate-400 dark:text-slate-500">
            <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
            <span>
              {language === 'ta'
                ? 'அறிவிப்பு: AI பதில்கள் ICAR / TNAU தரநிலைகளின் அடிப்படையிலான தகவல் வழிகாட்டுதல் மட்டுமே. உங்கள் உள்ளூர் வேளாண் அதிகாரியிடம் உறுதிப்படுத்தவும்.'
                : 'Notice: AI responses are informational guidance grounded in ICAR/TNAU standards. Always verify field actions with your local KVK or agricultural officer.'}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};