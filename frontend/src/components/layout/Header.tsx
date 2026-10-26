import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { LanguageSelector } from '../shared/LanguageSelector';
import { Sprout, Menu, Sparkles, LogOut, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../shared/ThemeToggle';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-cream-200 bg-white/95 px-2.5 py-2.5 backdrop-blur-md sm:px-4 sm:py-3 lg:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="shrink-0 rounded-lg p-2 text-gray-600 hover:bg-cream-100 focus:outline-none lg:hidden"
            aria-label={t.ui.menu}
          >
            <Menu size={22} />
          </button>
          
          <Link to="/" className="brand-link flex min-w-0 items-center gap-2 group sm:gap-2.5">
            <div className="brand-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-900 text-leaf-400 shadow-md transition-transform group-hover:scale-105 sm:h-10 sm:w-10">
              <Sprout size={24} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-bold tracking-tight text-forest-950 sm:text-lg">{t.appName}</span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block font-medium">
                {t.tagline}
              </p>
            </div>
          </Link>
        </div>

        {/* Right: Language switch & quick AI badge */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-forest-900 bg-forest-50 px-3 py-1.5 rounded-full border border-forest-200 font-medium">
            <Sparkles size={14} className="text-leaf-600 animate-pulse" />
            <span>{t.ui.aiCompanion}</span>
          </div>
          <div className="scale-90 sm:scale-100">
            <ThemeToggle />
          </div>
          <LanguageSelector compact />
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden sm:block max-w-32 truncate text-xs font-semibold text-forest-900">
                {user.name}
              </span>
              <button
                onClick={() => void logout().catch((error) => window.alert(error instanceof Error ? error.message : t.ui.accountSessionError))}
                aria-label={t.ui.signOut}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cream-300 px-2 text-xs font-semibold text-gray-700 hover:bg-cream-100 sm:px-3"
              >
                <LogOut size={15} className="sm:hidden" />
                <span className="hidden sm:inline">{t.ui.signOut}</span>
              </button>
            </div>
          ) : (
            <Link
              to="/account"
              aria-label={t.ui.signIn}
              className="sign-in-button inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-600/30 bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 px-2.5 text-[11px] font-bold text-white shadow-md shadow-forest-950/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest-950/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:translate-y-0 sm:gap-2 sm:px-4 sm:text-xs"
            >
              <UserRound size={15} strokeWidth={2.5} />
              <span>{t.ui.signIn}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
