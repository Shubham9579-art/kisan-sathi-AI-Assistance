import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { Language } from '../../types';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage } = useLanguage();

  const options: { code: Language; label: string; native: string; short: string }[] = [
    { code: 'mr', label: 'Marathi', native: 'मराठी', short: 'मर' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी', short: 'हि' },
    { code: 'en', label: 'English', native: 'English', short: 'EN' },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg border border-cream-200 bg-cream-100 p-0.5 sm:gap-1.5 sm:p-1">
      {!compact && <Globe size={16} className="text-forest-800 ml-1.5" />}
      <div className="flex gap-1">
        {options.map((opt) => {
          const isSelected = language === opt.code;
          return (
            <button
              key={opt.code}
              onClick={() => setLanguage(opt.code)}
              aria-label={opt.label}
              aria-pressed={isSelected}
              className={`rounded-md px-1.5 py-1 text-[10px] font-semibold transition-all sm:px-2.5 sm:text-xs ${
                isSelected
                  ? 'bg-forest-800 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-cream-200'
              }`}
            >
              <span className="hidden min-[480px]:inline">{opt.native}</span>
              <span className="min-[480px]:hidden">{opt.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
