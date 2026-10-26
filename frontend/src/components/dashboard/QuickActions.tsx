import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { MessageSquare, Activity, CloudSun, Award } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const { t } = useLanguage();

  const actions = [
    {
      to: '/assistant',
      label: t.dashboard.askAssistant,
      desc: t.ui.quickAssistant,
      icon: MessageSquare,
      bg: 'bg-emerald-50 text-forest-800 hover:bg-emerald-100 border-emerald-200',
    },
    {
      to: '/crop-health',
      label: t.dashboard.checkHealth,
      desc: t.ui.quickCropHealth,
      icon: Activity,
      bg: 'bg-leaf-50 text-leaf-800 hover:bg-leaf-100 border-leaf-200',
    },
    {
      to: '/weather',
      label: t.dashboard.weatherForecast,
      desc: t.ui.quickWeather,
      icon: CloudSun,
      bg: 'bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-200',
    },
    {
      to: '/schemes',
      label: t.dashboard.browseSchemes,
      desc: t.ui.quickSchemes,
      icon: Award,
      bg: 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200',
    },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-gray-800 tracking-tight">
        {t.dashboard.quickActions}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.to}
              to={act.to}
              className={`p-4 rounded-xl border flex flex-col items-start justify-between shadow-2xs hover:shadow-sm transition-all group ${act.bg}`}
            >
              <div className="p-2.5 rounded-lg bg-white/80 shadow-2xs mb-3 group-hover:scale-110 transition-transform">
                <Icon size={22} />
              </div>
              <div>
                <span className="font-bold text-sm block mb-0.5">{act.label}</span>
                <span className="text-[11px] opacity-80 line-clamp-1">{act.desc}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
