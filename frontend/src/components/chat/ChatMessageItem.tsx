import React, { useState } from 'react';
import { ChatMessage } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { useSpeech } from '../../hooks/useSpeech';
import {
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { Badge } from '../shared/Badge';
import { AssistantBrand } from '../shared/AssistantBrand';

export const ChatMessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const { t, language } = useLanguage();
  const { speakText, stopSpeaking, isSpeaking } = useSpeech(message.language || language);
  const [copied, setCopied] = useState(false);

  const isUser = message.sender === 'user';
  const advice = message.structured_advice;

  const handleCopy = () => {
    let textToCopy = message.content;
    if (advice) {
      textToCopy += `\n\n[${t.assistant.whatMightBeHappening}]: ${advice.what_might_be_happening}\n` +
        `[${t.assistant.whatToDoNow}]:\n${advice.what_to_do_now.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n` +
        `[${t.assistant.whatToMonitor}]:\n${advice.what_to_monitor.map((s) => `- ${s}`).join('\n')}\n` +
        `[${t.assistant.whenToConsultExpert}]: ${advice.when_to_consult_expert}`;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      let speakContent = message.content;
      if (advice) {
        speakContent += `. ${advice.what_might_be_happening}. ` +
          advice.what_to_do_now.join('. ') + '. ' +
          advice.when_to_consult_expert;
      }
      speakText(speakContent);
    }
  };

  return (
    <div className={`ai-message-row flex gap-3 my-4 ${isUser ? 'ai-user-message justify-end' : 'ai-assistant-message justify-start'}`}>
      {!isUser && (
        <div className="mt-1 shrink-0">
          <AssistantBrand showName={false} />
        </div>
      )}

      <div
        className={`ai-message-bubble max-w-[92%] sm:max-w-[82%] rounded-2xl p-4 shadow-2xs ${
          isUser
            ? 'bg-forest-800 text-white rounded-tr-none'
            : 'bg-white text-gray-900 border border-cream-200 rounded-tl-none'
        }`}
      >
        {/* User Message Header */}
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="space-y-3.5">
            {/* Assistant badge and controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-cream-100 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant={message.is_demo ? "amber" : "green"}>
                  {message.is_demo ? t.assistant.demoBadge : t.ui.liveAI}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <button
                  onClick={handleToggleVoice}
                  title={isSpeaking ? t.assistant.stopSpeaking : t.assistant.speakAnswer}
                  className={`p-1.5 rounded-lg hover:bg-cream-100 transition-colors ${
                    isSpeaking ? 'text-forest-700 bg-forest-50 animate-pulse' : 'text-gray-500'
                  }`}
                >
                  {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <button
                  onClick={handleCopy}
                  title={t.assistant.copyButton}
                  className="p-1.5 rounded-lg hover:bg-cream-100 text-gray-500 transition-colors"
                >
                  {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                </button>
              </div>
            </div>

            <div className="flex justify-center py-1">
              <AssistantBrand size="md" />
            </div>

            {/* Main plain text summary */}
            <p className="text-sm font-medium text-gray-800 leading-relaxed">
              {message.content}
            </p>

            {/* Four structured advice sections if available */}
            {advice && (
              <div className="space-y-3 pt-1 text-xs">
                {/* 1. What might be happening */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <HelpCircle size={14} className="text-amber-700" />
                    <span>{t.assistant.whatMightBeHappening}</span>
                  </div>
                  <p className="text-amber-950 leading-relaxed">
                    {advice.what_might_be_happening}
                  </p>
                </div>

                {/* 2. What to do now */}
                <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                    <ShieldCheck size={14} className="text-emerald-700" />
                    <span>{t.assistant.whatToDoNow}</span>
                  </div>
                  <ul className="space-y-1 pl-4 list-disc text-emerald-900">
                    {advice.what_to_do_now.map((act, i) => (
                      <li key={i} className="leading-relaxed">{act}</li>
                    ))}
                  </ul>
                </div>

                {/* 3. What to monitor */}
                <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950">
                    <Clock size={14} className="text-blue-700" />
                    <span>{t.assistant.whatToMonitor}</span>
                  </div>
                  <ul className="space-y-1 pl-4 list-disc text-blue-900">
                    {advice.what_to_monitor.map((mon, i) => (
                      <li key={i} className="leading-relaxed">{mon}</li>
                    ))}
                  </ul>
                </div>

                {/* 4. When to consult expert */}
                <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-950">
                    <AlertTriangle size={14} className="text-rose-700" />
                    <span>{t.assistant.whenToConsultExpert}</span>
                  </div>
                  <p className="text-rose-900 leading-relaxed">
                    {advice.when_to_consult_expert}
                  </p>
                </div>
              </div>
            )}

            {/* Verified Sources */}
            {message.sources && message.sources.length > 0 && (
              <div className="pt-2 border-t border-cream-100 text-[11px] text-gray-500 space-y-1">
                <span className="font-semibold text-gray-600 block">{t.assistant.sources}</span>
                {message.sources.map((src, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-forest-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest-700 shrink-0" />
                    <span className="font-medium">{src.title} ({src.organization})</span>
                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline shrink-0 text-leaf-700 ml-1 inline-flex items-center gap-0.5"
                      >
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center shrink-0 mt-1">
          <User size={18} />
        </div>
      )}
    </div>
  );
};
