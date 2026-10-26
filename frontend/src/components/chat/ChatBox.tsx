
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, FieldItem, Language } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';
import { useSpeech } from '../../hooks/useSpeech';
import { useAuth } from '../../hooks/useAuth';
import { ChatMessageItem } from './ChatMessageItem';
import { SuggestedQuestions } from './SuggestedQuestions';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import {
  Send,
  Mic,
  MicOff,
  RefreshCw,
  Sparkles,
  Filter,
  Volume2,
  VolumeX,
  Languages,
  Trash2,
  Check,
  X,
} from 'lucide-react';

const SUPPORTED_LANGUAGES: {
  code: Language;
  label: string;
  speechCode: string;
}[] = [
  { code: 'en', label: 'English', speechCode: 'en-IN' },
  { code: 'hi', label: 'हिंदी', speechCode: 'hi-IN' },
  { code: 'mr', label: 'मराठी', speechCode: 'mr-IN' },
];

const LANGUAGE_STORAGE_KEY = 'kisansathi_language';

const readStoredSession = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const storeSession = (key: string, sessionId: string) => {
  try {
    localStorage.setItem(key, sessionId);
  } catch {
    // Chat remains available in memory when browser storage is unavailable.
  }
};

const formatAssistantSpeech = (message: ChatMessage): string => {
  const advice = message.structured_advice;
  if (!advice) return message.content;

  return [
    message.content,
    advice.what_might_be_happening,
    ...advice.what_to_do_now,
    ...advice.what_to_monitor,
    advice.when_to_consult_expert,
  ].join('. ');
};

export const ChatBox: React.FC<{
  initialCrop?: string;
  initialFieldId?: number;
  initialGrowthStage?: string;
}> = ({ initialCrop, initialFieldId, initialGrowthStage }) => {
  const { t, language: appLanguage, setLanguage } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'hi' || saved === 'mr') {
        return saved;
      }
    } catch {
      // Use the app's language if local storage is unavailable.
    }

    return appLanguage;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState('');

  const [selectedCrop, setSelectedCrop] = useState(
    initialCrop || 'All Crops'
  );
  const [growthStage, setGrowthStage] = useState('');
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  const [lastSubmittedQuestion, setLastSubmittedQuestion] = useState('');

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const currentUserIdRef = useRef<number | null>(user?.id ?? null);
  currentUserIdRef.current = user?.id ?? null;

  const {
    isListening,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    isSpeaking,
    transcript,
    setTranscript,
    interimTranscript,
    hasSpeechRecognition,
    hasSpeechSynthesis,
    errorMessage: speechError,
    clearError: clearSpeechError,
  } = useSpeech(selectedLanguage);

  const uiText = {
    selectLanguage: t.ui.selectLanguage,
    voiceInputUnsupported: t.assistant.micNotSupported,
    listening: t.assistant.listeningState,
    thinking: t.assistant.processingState,
    askQuestion: t.assistant.placeholder,
    retry: t.common.retry,
    stopListening: t.assistant.stopListening,
    askByVoice: t.assistant.askByVoice,
    replay: t.assistant.playAgain,
    stopSpeaking: t.assistant.stopSpeaking,
    send: t.assistant.send,
    clearChat: t.assistant.clearChat,
    clearConversation: t.ui.clearChat,
    chooseQuestion: t.assistant.chooseQuestion,
    liveTranscript: t.assistant.liveTranscript,
    liveTranscriptHint: t.assistant.liveTranscriptHint,
    sendQuestion: t.assistant.sendQuestion,
    speakingState: t.assistant.speakingState,
  };

  // Save selected language and stop any old-language speech.
  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
    } catch {
      // The selection still works for the current session.
    }

    stopSpeaking();
    stopListening();
  }, [selectedLanguage]);

  useEffect(() => {
    if (selectedLanguage !== appLanguage) {
      setSelectedLanguage(appLanguage);
    }
  }, [appLanguage, selectedLanguage]);

  useEffect(() => {
    if (initialCrop) setSelectedCrop(initialCrop);
    if (initialGrowthStage) setGrowthStage(initialGrowthStage);
  }, [initialCrop, initialGrowthStage]);

  useEffect(() => {
    if (authLoading) return;

    const storageKey = user ? `kisansathi_chat_session_${user.id}` : null;
    const savedSession = storageKey ? readStoredSession(storageKey) : null;
    setSessionId(savedSession || `session_${Date.now()}`);
    setMessages([]);
    setTranscript('');
    setFields([]);
    setInput('');
    setError(null);
    setSuggestedFollowUps([]);
  }, [authLoading, user?.id]);

  // Load private history only for the signed-in account; guests keep chat in memory.
  useEffect(() => {
    if (authLoading || !sessionId) return;
    let active = true;

    if (user) {
      api.getChatHistory(sessionId)
        .then((history) => {
          if (active) setMessages(history || []);
        })
        .catch((err) => {
          if (active) console.warn('Could not fetch chat history:', err);
        });
    }

    api.getFields()
      .then((items) => {
        if (active) setFields(items);
      })
      .catch((err) => {
        if (active) console.warn('Could not load fields for chat context:', err);
      });

    return () => {
      active = false;
    };
  }, [sessionId, authLoading, user?.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleLanguageChange = (value: string) => {
    if (value !== 'en' && value !== 'hi' && value !== 'mr') return;

    stopSpeaking();
    stopListening();
    setSelectedLanguage(value);
    setLanguage(value);
    setError(null);
    clearSpeechError();
  };

  const handleSend = async (messageText?: string, isRetry = false) => {
    const textToSend = (messageText ?? input).trim();

    if (!textToSend || loading) return;

    setError(null);
    setInput('');
    setTranscript('');
    setLastSubmittedQuestion(textToSend);
    stopSpeaking();

    if (!isRetry) {
      const tempUserMsg: ChatMessage = {
        id: Date.now(),
        session_id: sessionId,
        sender: 'user',
        content: textToSend,
        language: selectedLanguage,
        is_demo: false,
        sources: [],
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMsg]);
    }
    setLoading(true);

    try {
      const resp = await api.sendChat({
        message: textToSend,
        session_id: sessionId,
        language: selectedLanguage,
        crop_context:
          selectedCrop !== 'All Crops' ? selectedCrop : undefined,
        growth_stage_context: growthStage || undefined,
        field_id: initialFieldId,
      });

      if (currentUserIdRef.current !== (user?.id ?? null)) return;

      if (resp.message) {
        setMessages((prev) => [...prev, resp.message]);

        if (hasSpeechSynthesis && resp.message.content) {
          speakText(formatAssistantSpeech(resp.message));
        }
      }

      setSessionId(resp.session_id);
      if (user) {
        storeSession(`kisansathi_chat_session_${user.id}`, resp.session_id);
      }
      setSuggestedFollowUps(resp.suggested_follow_ups || []);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : t.common.error;

      setError(errorMessage || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!hasSpeechRecognition) {
      setError(uiText.voiceInputUnsupported);
      return;
    }

    setError(null);
    clearSpeechError();

    if (isListening) {
      stopListening();
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
    }

    setTranscript('');
    startListening((transcript) => {
      const spokenQuestion = transcript.trim();

      if (spokenQuestion) {
        setInput(spokenQuestion);
      }
    });
  };

  const handleReplay = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    const latestAssistantMessage = [...messages]
      .reverse()
      .find(
        (message) =>
          message.sender !== 'user' &&
          Boolean(message.content?.trim())
      );

    if (latestAssistantMessage?.content) {
      speakText(formatAssistantSpeech(latestAssistantMessage));
    }
  };

  const handleResetSession = () => {
    stopSpeaking();
    stopListening();

    const newSession = `session_${Date.now()}`;

    setSessionId(newSession);
    if (user) {
      storeSession(`kisansathi_chat_session_${user.id}`, newSession);
    }
    setMessages([]);
    setSuggestedFollowUps([]);
    setError(null);
    setInput('');
    setLastSubmittedQuestion('');
  };

  const hasAssistantMessage = messages.some(
    (message) =>
      message.sender !== 'user' && Boolean(message.content?.trim())
  );

  return (
    <div className="ai-chat-panel flex flex-col h-[75vh] max-h-[780px] min-h-[520px] bg-white border border-cream-200 rounded-3xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="ai-chat-header border-b border-cream-200 px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="ai-sparkle-mark flex h-9 w-9 items-center justify-center rounded-xl bg-forest-900 text-leaf-300 shadow-sm">
              <Sparkles size={17} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-forest-950">
                {t.assistant.title}
              </h3>
              <p className="hidden text-[10px] text-gray-500 sm:block">
                {t.assistant.subtitle}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t.ui.safetyPlatform}
          </span>
        </div>
        <div className="ai-chat-controls mt-3 flex flex-wrap items-center gap-2">
          <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {t.ui.context}
          </span>
          <div className="flex items-center gap-1 bg-white px-2.5 py-2 rounded-xl border border-cream-200 shadow-sm">
            <Languages size={14} className="text-forest-700" />
            <select
              value={selectedLanguage}
              onChange={(event) => handleLanguageChange(event.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-800 outline-none cursor-pointer"
              aria-label={uiText.selectLanguage}
              title={uiText.selectLanguage}
            >
              {SUPPORTED_LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </select>
          </div>

          {/* Crop selector */}
          <div className="flex items-center gap-1 text-gray-600 bg-white px-2.5 py-2 rounded-xl border border-cream-200 shadow-sm">
            <Filter size={13} className="text-forest-700" />

            <select
              value={selectedCrop}
              onChange={(event) => setSelectedCrop(event.target.value)}
              className="max-w-36 cursor-pointer bg-transparent text-xs font-semibold text-gray-800 outline-none"
              aria-label="Select crop context"
            >
              <option value="All Crops">{t.ui.allCrops}</option>
              <option value="Soybean">{t.ui.soybean}</option>
              <option value="Cotton">{t.ui.cotton}</option>
              <option value="Wheat">{t.ui.wheat}</option>
              <option value="Rice">{t.ui.rice}</option>
              <option value="Maize">{t.ui.maize}</option>
              <option value="Sugarcane">{t.ui.sugarcane}</option>
              <option value="Onion">{t.ui.onion}</option>
              <option value="Pomegranate">{t.ui.pomegranate}</option>
              <option value="Tomato">{t.ui.tomato}</option>

              {fields.map((field) => (
                <option key={field.id} value={field.crop}>
                  {field.name} ({field.crop})
                </option>
              ))}
            </select>
          </div>

          <select
            value={growthStage}
            onChange={(event) => setGrowthStage(event.target.value)}
            className="rounded-xl border border-cream-200 bg-white px-2.5 py-2 text-xs font-semibold text-gray-800 outline-none cursor-pointer shadow-sm"
            aria-label="Select crop growth stage"
          >
            <option value="">{t.ui.growthStageOptional}</option>
            <option value="Seedling">{t.ui.seedling}</option>
            <option value="Vegetative">{t.ui.vegetative}</option>
            <option value="Flowering">{t.ui.flowering}</option>
            <option value="Fruiting / pod formation">{t.ui.fruiting}</option>
            <option value="Maturity">{t.ui.maturity}</option>
          </select>

          <button
            type="button"
            onClick={handleResetSession}
            disabled={loading}
            title={uiText.clearChat}
            aria-label={uiText.clearChat}
            className="ml-auto rounded-xl border border-cream-200 bg-white p-2 text-gray-500 shadow-sm transition-colors hover:bg-cream-100 hover:text-forest-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={`ai-chat-messages flex-1 overflow-y-auto space-y-2 bg-cream-50/30 p-4 sm:p-6 ${messages.length === 0 ? 'is-empty' : ''}`}>
        {messages.length === 0 ? (
          <div className="ai-chat-empty text-center py-12 text-gray-500 text-xs">
            <div className="assistant-empty-mark mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-forest-800 to-emerald-500 text-white shadow-lg shadow-forest-900/20">
              <Sparkles size={27} />
            </div>

            <p className="font-extrabold text-forest-950 text-base mb-1">
              {t.assistant.subtitle}
            </p>

            <p className="max-w-md mx-auto text-gray-500 mb-6 leading-relaxed">
              {uiText.chooseQuestion}
            </p>

            <SuggestedQuestions
              onSelect={(question) => void handleSend(question)}
            />
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))}

            {loading && (
              <div className="ai-thinking flex items-center gap-2 text-forest-800 text-xs my-3 bg-white p-3 rounded-xl border border-cream-200 w-fit">
                <LoadingSpinner size={16} />
                <span>{uiText.thinking}</span>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2"
              >
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => void handleSend(lastSubmittedQuestion, true)}
                  disabled={!lastSubmittedQuestion}
                  className="font-bold underline text-rose-900 shrink-0"
                >
                  {uiText.retry}
                </button>
              </div>
            )}

            {suggestedFollowUps.length > 0 && !loading && (
              <SuggestedQuestions
                customQuestions={suggestedFollowUps}
                onSelect={(question) => void handleSend(question)}
              />
            )}

            <div ref={chatBottomRef} />
          </>
        )}
      </div>

      {/* Input and voice controls */}
      <div className="p-3 bg-white border-t border-cream-200">
        {(isListening || interimTranscript || transcript) && (
          <div className="voice-transcript-card mb-3 rounded-2xl border border-forest-200 bg-gradient-to-r from-forest-50 to-white p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isListening ? 'bg-rose-100 text-rose-700' : 'bg-forest-100 text-forest-800'}`}>
                  {isListening ? <Mic size={16} /> : <Check size={16} />}
                </span>
                <div>
                  <p className="text-xs font-extrabold text-forest-950">
                    {isListening ? uiText.listening : uiText.liveTranscript}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {isListening ? interimTranscript || uiText.listening : uiText.liveTranscriptHint}
                  </p>
                </div>
              </div>
              {!isListening && (
                <button
                  type="button"
                  onClick={() => {
                    setInput('');
                    setTranscript('');
                  }}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-gray-800"
                  aria-label={t.common.close}
                  title={t.common.close}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            {!isListening && transcript && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-forest-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-forest-700 focus:ring-2 focus:ring-forest-200"
                  aria-label={uiText.liveTranscript}
                />
                <button
                  type="button"
                  onClick={() => void handleSend(input)}
                  disabled={!input.trim() || loading}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-forest-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-forest-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check size={14} /> {uiText.sendQuestion}
                </button>
              </div>
            )}
          </div>
        )}
        {speechError && (
          <p role="status" className="mb-2 text-xs text-amber-700">
            {speechError}
          </p>
        )}

        {!hasSpeechRecognition && (
          <p className="mb-2 text-xs text-amber-700">
            {uiText.voiceInputUnsupported}
          </p>
        )}

        {isListening && (
          <p className="mb-2 text-xs text-forest-800" role="status">
            {uiText.listening}
          </p>
        )}
        {isSpeaking && (
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-800" role="status">
            <Volume2 size={13} className="animate-pulse" />
            {uiText.speakingState}
          </p>
        )}

        {messages.length > 0 &&
          suggestedFollowUps.length === 0 &&
          !loading && (
            <div className="mb-2">
              <SuggestedQuestions
                onSelect={(question) => void handleSend(question)}
              />
            </div>
          )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={uiText.askQuestion}
              className="w-full pl-4 pr-10 py-3 bg-cream-50 border border-cream-200 focus:border-forest-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-forest-700 transition-all placeholder:text-gray-400"
              disabled={loading}
              aria-label={uiText.askQuestion}
            />

            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={loading || !hasSpeechRecognition}
              title={isListening ? uiText.stopListening : uiText.askByVoice}
              aria-label={isListening ? uiText.stopListening : uiText.askByVoice}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-gray-500 hover:text-forest-800 hover:bg-cream-100'
              }`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>

          {hasSpeechSynthesis && (
            <button
              type="button"
              onClick={handleReplay}
              disabled={!isSpeaking && !hasAssistantMessage}
              title={isSpeaking ? uiText.stopSpeaking : uiText.replay}
              aria-label={isSpeaking ? uiText.stopSpeaking : uiText.replay}
              className="shrink-0 rounded-xl border border-cream-200 px-3 py-3 text-gray-600 transition-colors hover:bg-cream-100 hover:text-forest-800 disabled:opacity-40"
            >
              {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          )}

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-3 bg-forest-900 hover:bg-forest-950 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
          >
            <span>{uiText.send}</span>
            <Send size={15} />
          </button>
        </form>
        {messages.length > 0 && (
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={handleResetSession}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={13} />
              {uiText.clearConversation}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
