import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { Heart, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-white border-t border-cream-200 mt-12 py-6 px-4 lg:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700">{t.appName}</span>
          <span>•</span>
          <span>{t.tagline}</span>
        </div>
        
        <div className="flex items-center gap-2 text-center sm:text-right">
          <ShieldCheck size={14} className="text-leaf-600 inline" />
          <span>{t.ui.safetyPlatformText}</span>
        </div>
      </div>
    </footer>
  );
};
