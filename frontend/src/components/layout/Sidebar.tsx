import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import {
  LayoutDashboard,
  MessageSquare,
  Activity,
  CloudSun,
  Award,
  Trees,
  Settings,
  X,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  const navItems = [
    { to: '/', label: t.nav.dashboard, icon: LayoutDashboard },
    { to: '/assistant', label: t.nav.assistant, icon: MessageSquare, badge: 'AI' },
    { to: '/crop-health', label: t.nav.cropHealth, icon: Activity },
    { to: '/weather', label: t.nav.weather, icon: CloudSun },
    { to: '/schemes', label: t.nav.schemes, icon: Award },
    { to: '/fields', label: t.nav.fields, icon: Trees },
    { to: '/settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 z-50 h-screen lg:h-[calc(100vh-61px)] w-64 bg-white border-r border-cream-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 flex flex-col h-full overflow-y-auto">
          {/* Mobile close button */}
          <div className="flex items-center justify-between lg:hidden mb-4 pb-2 border-b border-cream-200">
            <span className="font-bold text-forest-950">{t.appName}</span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-cream-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-forest-900 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-cream-100 hover:text-forest-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon size={19} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-leaf-500/20 text-leaf-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Context Card in Sidebar */}
          <div className="mt-auto pt-4">
            <div className="p-3.5 bg-forest-50 border border-forest-100 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-forest-900 font-bold">
                <ShieldCheck size={16} className="text-leaf-600" />
                <span>{t.ui.safetyPlatform}</span>
              </div>
              <p className="text-gray-600 leading-relaxed text-[11px]">
                {t.ui.safetyPlatformText}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
