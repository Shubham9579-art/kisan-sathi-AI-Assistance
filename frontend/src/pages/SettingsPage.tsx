import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { LanguageSelector } from '../components/shared/LanguageSelector';
import { SafetyNotice } from '../components/shared/SafetyNotice';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  Settings,
  User,
  Server,
} from 'lucide-react';
import { Badge } from '../components/shared/Badge';
import { ThemeToggle } from '../components/shared/ThemeToggle';

export const SettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    api.getConfig()
      .then(setConfig)
      .catch((err) => console.warn('Could not load config:', err));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-forest-950 tracking-tight">{t.settings.title}</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {t.ui.settingsSubtitle}
        </p>
      </div>

      {/* Language Preference Card */}
      <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-gray-900">{t.settings.languageSelect}</h3>
        <p className="text-xs text-gray-500">
          {t.ui.languageHelp}
        </p>
        <div className="w-fit">
          <LanguageSelector />
        </div>
      </div>

      <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-gray-900">{t.ui.themeAppearance}</h3>
        <p className="text-xs text-gray-500">{t.ui.themeHelp}</p>
        <ThemeToggle showLabel />
      </div>

      {/* Farmer Profile Card */}
      <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <User size={18} className="text-forest-800" />
          <h3 className="font-bold text-sm text-gray-900">{t.settings.profileSettings}</h3>
        </div>

        {user ? (
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="text-gray-600">{user.email}</p>
            <Link to="/account" className="mt-2 inline-block text-xs font-bold text-forest-900 underline">
              {t.ui.account}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-600">{t.ui.privateDataDescription}</p>
            <Link to="/account" className="inline-block rounded-xl bg-forest-900 px-4 py-2 text-xs font-bold text-white">
              {t.ui.signUp}
            </Link>
          </div>
        )}
      </div>

      {/* System Status & AI Integration Status */}
      <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Server size={18} className="text-forest-800" />
          <h3 className="font-bold text-sm text-gray-900">{t.settings.systemInfo}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-cream-50 rounded-xl border border-cream-200 space-y-1">
            <span className="text-gray-500 block text-[11px] font-bold">{t.settings.aiEngine}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">
                {config?.ai_provider === 'gemini' ? t.ui.liveLlm : t.ui.demoKnowledgeBase}
              </span>
              <Badge variant={config?.ai_provider === 'gemini' ? 'green' : 'amber'}>
                {config?.ai_provider === 'gemini' ? t.ui.liveSource : t.ui.verifiedDemo}
              </Badge>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
              {t.ui.knowledgeBaseDescription}
            </p>
          </div>

          <div className="p-3.5 bg-cream-50 rounded-xl border border-cream-200 space-y-1">
            <span className="text-gray-500 block text-[11px] font-bold">{t.settings.database}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">SQLite ({t.ui.databaseLocal})</span>
              <Badge variant="green">{t.ui.active}</Badge>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
              {t.ui.databaseDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Safety Notice & Disclaimer */}
      <SafetyNotice
        title={t.settings.safetyNoticeTitle}
        message={t.settings.safetyNoticeText}
        isWarning
      />

      {/* Project information */}
      <div className="p-4 bg-forest-50 border border-forest-100 rounded-2xl flex items-center justify-between text-xs text-forest-900">
        <div>
          <span className="font-bold block">KisanSathi AI — {t.ui.prototype} 2026</span>
          <span className="text-gray-600 text-[11px]">{t.settings.teamInfo}</span>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-semibold text-leaf-800 bg-leaf-100 px-2 py-0.5 rounded-full">
            Version 1.0.0
          </span>
        </div>
      </div>
    </div>
  );
};
