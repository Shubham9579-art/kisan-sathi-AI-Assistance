import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle: React.FC<{ showLabel?: boolean }> = ({ showLabel = false }) => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const nextThemeLabel = theme === 'dark' ? t.ui.lightTheme : t.ui.darkTheme;
  const Icon = theme === 'dark' ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`${t.ui.themeAppearance}: ${nextThemeLabel}`}
      title={`${t.ui.themeAppearance}: ${nextThemeLabel}`}
      aria-pressed={theme === 'dark'}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-cream-300 text-gray-700 transition-colors hover:bg-cream-100 ${
        showLabel ? 'px-3 py-2 text-sm font-semibold' : 'h-10 w-10'
      }`}
    >
      <Icon size={showLabel ? 17 : 19} aria-hidden="true" />
      {showLabel && <span>{theme === 'dark' ? t.ui.darkTheme : t.ui.lightTheme}</span>}
    </button>
  );
};
