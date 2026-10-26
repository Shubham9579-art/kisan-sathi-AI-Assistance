import React from 'react';
import { ChatBox } from '../components/chat/ChatBox';
import { SafetyNotice } from '../components/shared/SafetyNotice';
import { useLanguage } from '../hooks/useLanguage';
import { AssistantBrand } from '../components/shared/AssistantBrand';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowDown, Leaf, ShieldCheck, Sparkles } from 'lucide-react';

export const AssistantPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const fieldIdValue = Number(searchParams.get('fieldId'));
  const initialFieldId = Number.isInteger(fieldIdValue) && fieldIdValue > 0
    ? fieldIdValue
    : undefined;
  const initialCrop = searchParams.get('crop') || undefined;
  const initialGrowthStage = searchParams.get('stage') || undefined;

  return (
    <div className="assistant-page space-y-4 max-w-5xl mx-auto">
      {!authLoading && !user && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
          <span>{t.ui.privateDataDescription}</span>
          <Link to="/account" className="shrink-0 font-bold underline">{t.ui.signUp}</Link>
        </div>
      )}
      <div className="assistant-hero">
        <div className="assistant-hero-content">
          <div className="flex items-start gap-3">
            <span className="assistant-hero-mark">
              <AssistantBrand size="md" showName={false} />
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-leaf-700">
                <Sparkles size={12} /> KisanSathi
              </p>
              <h1 className="mt-1 text-xl font-extrabold tracking-tight text-forest-950 sm:text-2xl">
                {t.assistant.title}
              </h1>
            </div>
          </div>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-gray-600 sm:text-sm">
            {t.assistant.subtitle}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-200/80 bg-white/75 px-3 py-1.5 text-[10px] font-semibold text-forest-900 shadow-sm">
              <Leaf size={12} className="text-leaf-700" /> {t.ui.aiCompanion}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-200/80 bg-white/75 px-3 py-1.5 text-[10px] font-semibold text-forest-900 shadow-sm">
              <ShieldCheck size={12} className="text-leaf-700" /> {t.ui.safetyPlatform}
            </span>
          </div>
        </div>
        <div className="assistant-hero-art hidden items-center justify-center sm:flex" aria-hidden="true">
          <svg viewBox="0 0 190 145" className="h-32 w-44">
            <circle cx="143" cy="34" r="19" fill="#FDE68A" />
            <path d="M13 103c26-32 50-35 77-10 25-25 54-31 87-7v45H13z" fill="#BBF7D0" />
            <path d="M13 116c30-22 54-21 78-1 28-21 56-25 86-8v24H13z" fill="#86EFAC" />
            <path d="M95 132c0-25 8-43 25-56M99 103c-15 0-24-7-27-21 15 0 25 7 27 21Zm17-20c1-14 9-22 23-24 0 16-8 24-23 24Z" fill="#15803D" />
            <path d="M17 137h158" stroke="#166534" strokeWidth="3" strokeLinecap="round" opacity=".35" />
          </svg>
        </div>
        <a href="#assistant-chat" className="assistant-hero-jump" aria-label={t.assistant.chooseQuestion}>
          <ArrowDown size={15} />
        </a>
      </div>

      <div id="assistant-chat" className="assistant-chat-anchor">
        <SafetyNotice
          title={t.ui.assistantSafetyTitle}
          message={t.ui.assistantSafetyText}
        />
        <ChatBox
          key={user?.id ?? 'guest'}
          initialCrop={initialCrop}
          initialFieldId={initialFieldId}
          initialGrowthStage={initialGrowthStage}
        />
      </div>
    </div>
  );
};
