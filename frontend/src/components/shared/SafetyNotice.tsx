import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

interface SafetyNoticeProps {
  title?: string;
  message?: string;
  isWarning?: boolean;
}

export const SafetyNotice: React.FC<SafetyNoticeProps> = ({
  title,
  message,
  isWarning = false,
}) => {
  const { t } = useLanguage();

  return (
    <div className={`safety-notice p-4 rounded-xl border flex items-start gap-3 ${
      isWarning
        ? 'bg-amber-50/45 border-amber-200/80 text-amber-900'
        : 'bg-emerald-50/40 border-emerald-200/70 text-emerald-900'
    }`}>
      <div className="shrink-0 mt-0.5">
        {isWarning ? (
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        ) : (
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        )}
      </div>
      <div className="text-xs leading-relaxed">
        <p className="font-semibold mb-0.5">{title ?? t.ui.assistantSafetyTitle}</p>
        <p className="text-gray-700">{message ?? t.ui.assistantSafetyText}</p>
      </div>
    </div>
  );
};
