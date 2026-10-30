// CropDiary AI — Phase 7: AI Farm Assistant Page
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { storageAdapter } from '@/services/storageAdapter';
import { assistantService } from './services/assistantService';
import { AssistantConversation, AssistantMessage, Language } from '@/types/assistant';
import { Farm, Plot } from '@/types/database';
import { ConversationSidebar } from './components/ConversationSidebar';
import { AssistantChatBox } from './components/AssistantChatBox';
import { Bot, PanelLeftOpen, PanelLeftClose, AlertCircle } from 'lucide-react';

export const AIFarmAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId: routeConversationId } = useParams<{ conversationId?: string }>();

  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(
    routeConversationId
  );
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('all');
  const [selectedPlotId, setSelectedPlotId] = useState<string>('all');
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [showSidebarMobile, setShowSidebarMobile] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Initial Load: Farms, Plots, and Conversations
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    async function loadInitialData() {
      try {
        setIsInitializing(true);
        const [userFarms, userConversations] = await Promise.all([
          storageAdapter.getFarms(user!.id),
          assistantService.getConversations(user!.id),
        ]);

        if (!isMounted) return;
        setFarms(userFarms);
        setConversations(userConversations);

        // Load plots for all farms
        if (userFarms.length > 0) {
          const allPlots = await Promise.all(
            userFarms.map((f) => storageAdapter.getPlots(f.id))
          );
          setPlots(allPlots.flat());
        }

        // Active conversation resolution
        if (routeConversationId) {
          setActiveConversationId(routeConversationId);
        } else if (userConversations.length > 0) {
          setActiveConversationId(userConversations[0].id);
        } else {
          // Auto create initial greeting conversation
          const initial = await assistantService.createConversation(
            user!.id,
            language === 'ta' ? 'புதிய வேளாண் ஆலோசனை' : 'Agricultural Consultation',
            language
          );
          if (isMounted) {
            setConversations([initial]);
            setActiveConversationId(initial.id);
          }
        }
      } catch (err) {
        console.error('Failed to initialize AI Assistant:', err);
        if (isMounted) {
          setError('Failed to load consultation records. Please refresh.');
        }
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    }

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // 2. Load Messages when activeConversationId changes
  useEffect(() => {
    if (!user || !activeConversationId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    async function loadMessages() {
      try {
        const msgs = await assistantService.getMessages(user!.id, activeConversationId!);
        if (isMounted) {
          setMessages(msgs);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    }

    loadMessages();
    return () => {
      isMounted = false;
    };
  }, [user, activeConversationId]);

  // 3. Handlers
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    navigate(`/app/assistant/${id}`);
    setShowSidebarMobile(false);
  };

  const handleNewConversation = async () => {
    if (!user) return;
    try {
      const newConv = await assistantService.createConversation(
        user.id,
        language === 'ta' ? 'புதிய வேளாண் ஆலோசனை' : 'New Agricultural Consultation',
        language,
        selectedFarmId !== 'all' ? selectedFarmId : undefined,
        selectedPlotId !== 'all' ? selectedPlotId : undefined
      );
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      navigate(`/app/assistant/${newConv.id}`);
      setMessages([]);
      setShowSidebarMobile(false);
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!user) return;
    try {
      await assistantService.deleteConversation(user.id, id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);

      if (activeConversationId === id) {
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
          navigate(`/app/assistant/${remaining[0].id}`);
        } else {
          setActiveConversationId(undefined);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!user) return;

    let targetConvId = activeConversationId;
    if (!targetConvId) {
      const newConv = await assistantService.createConversation(
        user.id,
        content.slice(0, 30),
        language,
        selectedFarmId !== 'all' ? selectedFarmId : undefined,
        selectedPlotId !== 'all' ? selectedPlotId : undefined
      );
      targetConvId = newConv.id;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      navigate(`/app/assistant/${newConv.id}`);
    }

    // Optimistically add user message
    const tempUserMsg: AssistantMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: targetConvId,
      owner_id: user.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      await assistantService.sendMessage(
        user.id,
        targetConvId,
        content,
        selectedFarmId !== 'all' ? selectedFarmId : undefined,
        selectedPlotId !== 'all' ? selectedPlotId : undefined,
        language
      );

      // Refresh message thread with server-persisted messages
      const updatedMessages = await assistantService.getMessages(user.id, targetConvId);
      setMessages(updatedMessages);

      // Refresh conversation title if it was first message
      const convos = await assistantService.getConversations(user.id);
      setConversations(convos);
    } catch (err) {
      console.error('Error generating assistant response:', err);
      // Fallback message
      const fallbackMsg: AssistantMessage = {
        id: `err-${Date.now()}`,
        conversation_id: targetConvId,
        owner_id: user.id,
        role: 'assistant',
        content:
          language === 'ta'
            ? 'மன்னிக்கவும், பதிலை உருவாக்குவதில் சிக்கல் ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
            : 'I encountered an error analyzing your request. Please try again or rephrase your question.',
        model_name: 'icar-tnau-fallback-engine',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedFarm = farms.find((f) => f.id === selectedFarmId);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Mobile Sidebar Toggle Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowSidebarMobile(!showSidebarMobile)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800"
          aria-label={showSidebarMobile ? 'Hide sidebar' : 'Show consultation history'}
        >
          {showSidebarMobile ? (
            <PanelLeftClose className="w-4 h-4 text-emerald-600" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-emerald-600" />
          )}
          <span>{language === 'ta' ? 'உரையாடல் வரலாறு' : 'Consultations'}</span>
        </button>

        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <Bot className="w-4 h-4" />
          <span>CropDiary AI</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Desktop & Mobile drawer */}
        <div
          className={`${
            showSidebarMobile ? 'absolute inset-0 z-40 flex' : 'hidden'
          } md:relative md:flex md:h-full shrink-0`}
        >
          <ConversationSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            language={language}
            onLanguageChange={setLanguage}
            farms={farms}
            plots={plots}
            selectedFarmId={selectedFarmId}
            selectedPlotId={selectedPlotId}
            onFarmChange={setSelectedFarmId}
            onPlotChange={setSelectedPlotId}
          />
        </div>

        {/* Chat Stream */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {error ? (
            <div className="m-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <AssistantChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading || isInitializing}
              language={language}
              onLanguageChange={setLanguage}
              farmName={selectedFarm?.name}
            />
          )}
        </div>
      </div>
    </div>
  );
};