import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';
import { DashboardData, Observation } from '../types';
import { ProfileCard } from '../components/dashboard/ProfileCard';
import { WeatherCard } from '../components/dashboard/WeatherCard';
import { FarmDailyPlanCard } from '../components/dashboard/FarmDailyPlanCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { FieldsOverview } from '../components/dashboard/FieldsOverview';
import { TasksCard } from '../components/dashboard/TasksCard';
import { RecentChatsCard } from '../components/dashboard/RecentChatsCard';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { Lightbulb, AlertTriangle, ShieldCheck, Activity, Droplets, ShieldAlert, ArrowRight, CalendarDays } from 'lucide-react';
import { readWeatherCache, WEATHER_UPDATED_EVENT } from '../utils/weatherCache';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const applyCachedWeather = (
  dashboard: DashboardData,
  ui: ReturnType<typeof useLanguage>['t']['ui'],
  userId?: number,
): DashboardData => {
  const cached = readWeatherCache(userId);
  if (!cached || cached.weather.is_demo) return dashboard;

  const weather = cached.weather;
  const risks = weather.risk_summary;
  const riskIndex = risks
    ? Math.round((risks.irrigation + risks.spraying + risks.disease + risks.harvesting) / 4)
    : dashboard.dashboard_summary.risk_index;

  return {
    ...dashboard,
    profile: {
      ...dashboard.profile,
      location: weather.location,
    },
    weather_summary: weather,
    dashboard_summary: {
      ...dashboard.dashboard_summary,
      risk_index: riskIndex,
      irrigation_window: weather.temperature_celsius >= 30
        ? ui.earlyMorning
        : ui.lateEvening,
      pest_pressure: risks && risks.disease >= 75
        ? ui.high
        : risks && risks.disease >= 50
          ? ui.moderate
          : ui.low,
      monitoring_priority: riskIndex >= 70 ? ui.high : riskIndex >= 45 ? ui.moderate : ui.low,
      next_action: weather.rainfall_prob_pct >= 60
        ? ui.nextActionRain
        : weather.temperature_celsius > 32
          ? ui.nextActionHeat
          : ui.nextActionNormal,
    },
  };
};

export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedFor, setLoadedFor] = useState<number | null | undefined>(undefined);
  const requestVersion = useRef(0);

  const fetchDashboard = () => {
    if (authLoading) return;
    const requestId = ++requestVersion.current;
    setLoading(true);
    api.getDashboard()
      .then((res) => {
        if (requestId !== requestVersion.current) return;
        setData(applyCachedWeather(res, t.ui, user?.id));
        setLoadedFor(user?.id ?? null);
        setError(null);
      })
      .catch((err) => {
        if (requestId !== requestVersion.current) return;
        console.error('Failed to load dashboard:', err);
        setError(t.ui.dashboardLoadError);
      })
      .finally(() => {
        if (requestId === requestVersion.current) {
          setLoadedFor(user?.id ?? null);
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    if (authLoading) return;
    setData(null);
    setLoadedFor(undefined);
    fetchDashboard();
    const syncWeather = () => {
      setData((current) => current ? applyCachedWeather(current, t.ui, user?.id) : current);
    };
    window.addEventListener(WEATHER_UPDATED_EVENT, syncWeather);
    window.addEventListener('storage', syncWeather);
    return () => {
      requestVersion.current += 1;
      window.removeEventListener(WEATHER_UPDATED_EVENT, syncWeather);
      window.removeEventListener('storage', syncWeather);
    };
  }, [t.ui, authLoading, user?.id]);

  if (authLoading || loading || loadedFor !== (user?.id ?? null)) {
    return <LoadingSpinner message={t.common.loading} />;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-cream-200 shadow-xs max-w-lg mx-auto my-12">
        <AlertTriangle size={36} className="text-amber-500 mx-auto mb-3" />
        <h3 className="font-bold text-gray-800 text-base mb-1">{t.ui.connectionNotice}</h3>
        <p className="text-xs text-gray-500 mb-4">{error || t.ui.noData}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-forest-900 text-white rounded-xl text-xs font-semibold"
        >
          {t.common.retry}
        </button>
      </div>
    );
  }

  const summaryCards = [
    {
      label: t.ui.fieldHealth,
      value: `${data.dashboard_summary.field_health_score}%`,
      hint: t.ui.cropCondition,
      tone: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: ShieldCheck,
    },
    {
      label: t.ui.riskIndex,
      value: `${data.dashboard_summary.risk_index}%`,
      hint: t.ui.operationalStress,
      tone: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: ShieldAlert,
    },
    {
      label: t.ui.irrigationWindow,
      value: data.dashboard_summary.irrigation_window.toLowerCase().includes('morning')
        ? t.ui.earlyMorning
        : data.dashboard_summary.irrigation_window.toLowerCase().includes('evening')
          ? t.ui.lateEvening
          : data.dashboard_summary.irrigation_window,
      hint: t.ui.bestActionTiming,
      tone: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: Droplets,
    },
    {
      label: t.ui.monitoring,
      value: data.dashboard_summary.monitoring_priority === 'High' ? t.ui.high : data.dashboard_summary.monitoring_priority === 'Medium' || data.dashboard_summary.monitoring_priority === 'Moderate' ? t.ui.moderate : data.dashboard_summary.monitoring_priority === 'Low' ? t.ui.low : data.dashboard_summary.monitoring_priority,
      hint: `${t.ui.pestPressure}: ${data.dashboard_summary.pest_pressure === 'High' ? t.ui.high : data.dashboard_summary.pest_pressure === 'Moderate' ? t.ui.moderate : data.dashboard_summary.pest_pressure === 'Low' ? t.ui.low : data.dashboard_summary.pest_pressure}`,
      tone: 'bg-violet-50 border-violet-200 text-violet-900',
      icon: Activity,
    },
  ];
  const weatherGuidance = data.weather_summary.rainfall_prob_pct >= 60
    ? data.weather_summary.guidance.spraying_advice
    : data.weather_summary.temperature_celsius > 32
      ? data.weather_summary.guidance.irrigation_advice
      : data.weather_summary.guidance.soil_work_advice;
  const handleTaskObservation = (fieldId: number, observation: Observation) => {
    setData((current) => current ? {
      ...current,
      fields: current.fields.map((field) => field.id === fieldId
        ? { ...field, observations: [observation, ...(field.observations ?? [])] }
        : field),
    } : current);
  };

  return (
    <div className="dashboard-page space-y-6">
      <div className="dashboard-welcome flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-forest-700">
            <CalendarDays size={13} />
            <span>{t.ui.dashboardEyebrow}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-forest-950 tracking-tight sm:text-3xl">
            {t.dashboard.welcome}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t.ui.todayOverview} • {data.profile.location}
          </p>
        </div>

        <div className="dashboard-welcome-art hidden h-28 w-36 shrink-0 items-center justify-center sm:flex lg:h-32 lg:w-44" aria-hidden="true">
          <svg viewBox="0 0 180 130" className="h-32 w-44">
            <circle cx="126" cy="39" r="22" fill="#FDE68A" />
            <path d="M16 91c28-35 56-34 83-7 27-28 47-30 65-13v43H16z" fill="#BBF7D0" />
            <path d="M16 101c30-28 57-26 83 0 26-24 47-25 65-10v23H16z" fill="#86EFAC" />
            <path d="M16 112c31-20 59-18 83 1 24-17 47-17 65-8v9H16z" fill="#4ADE80" />
            <path d="M89 89v34M61 91l18 32M115 88l-14 35M37 99l31 24M145 91l-35 32" stroke="#15803D" strokeWidth="2" strokeLinecap="round" opacity=".65" />
            <path d="M87 84c-1-18 5-30 18-39M93 64c-11 0-18-5-21-15 12-1 20 4 21 15Zm9-14c0-11 6-18 17-21 1 12-5 19-17 21Z" fill="#15803D" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,1fr)]">
        <div className="min-w-0">
          <ProfileCard profile={data.profile} />
        </div>
        <div className="min-w-0">
          <WeatherCard weather={data.weather_summary} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, hint, tone, icon: Icon }, index) => (
          <div
            key={label}
            style={{ animationDelay: `${index * 70}ms` }}
            className={`dashboard-stat min-h-32 min-w-0 rounded-2xl border p-4 shadow-xs ${tone}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80 sm:text-[11px]">{label}</span>
              <Icon size={16} />
            </div>
            <div className="mt-3 break-words text-xl font-extrabold leading-tight sm:text-2xl">{value}</div>
            <div className="mt-1 text-xs leading-snug opacity-80">{hint}</div>
          </div>
        ))}
      </div>

      <FarmDailyPlanCard
        fields={data.fields}
        weather={data.weather_summary}
        canSave={Boolean(user)}
        onObservationAdded={handleTaskObservation}
      />

      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-4 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">{t.ui.todayOnFarm}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${data.weather_summary.is_demo ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {data.weather_summary.is_demo ? t.ui.demoMode : t.ui.liveWeather}
              </span>
            </div>
            <p className="mt-2 text-base font-bold text-slate-900">
              {data.weather_summary.rainfall_prob_pct >= 60
                ? t.ui.nextActionRain
                : data.weather_summary.temperature_celsius > 32
                  ? t.ui.nextActionHeat
                  : t.ui.nextActionNormal}
            </p>
            {weatherGuidance && (
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-gray-600">
                <span className="font-semibold text-gray-700">{t.ui.weatherRecommendation}: </span>
                {weatherGuidance}
              </p>
            )}
            <p className="mt-3 text-[11px] font-semibold text-gray-500">{t.ui.currentConditions}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: t.ui.temperature, value: `${Math.round(data.weather_summary.temperature_celsius)}°C` },
                { label: t.ui.rainChance, value: `${Math.round(data.weather_summary.rainfall_prob_pct)}%` },
                { label: t.ui.humidityLabel, value: `${Math.round(data.weather_summary.humidity_pct)}%` },
                { label: t.ui.windLabel, value: `${Math.round(data.weather_summary.wind_speed_kmh)} km/h` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-emerald-100 bg-white/80 px-3 py-2">
                  <p className="text-[10px] text-gray-500">{label}</p>
                  <p className="mt-0.5 text-sm font-bold text-forest-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <Link
            to="/weather"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-forest-900 px-3 py-2 text-xs font-semibold text-white"
          >
            {t.ui.openAdvisory} <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FieldsOverview fields={data.fields} />
        <TasksCard tasks={data.tasks} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          <RecentChatsCard messages={data.recent_conversations} />
        </div>

        <div className="bg-forest-900 text-white rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-3 text-leaf-400 font-bold text-xs uppercase tracking-wider">
              <Lightbulb size={16} />
              <span>{t.dashboard.tipsTitle}</span>
            </div>
            <p className="text-xs text-forest-100 leading-relaxed font-normal">
              "{t.ui.sprayingTip}"
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-forest-800 text-[11px] text-forest-300">
            {t.ui.sourceInstitute}
          </div>
        </div>
      </div>
    </div>
  );
};
