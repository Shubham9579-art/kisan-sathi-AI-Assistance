import React from 'react';
import { WeatherData } from '../../types';
import { CloudSun, Droplets, Wind, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../shared/Badge';
import { useLanguage } from '../../hooks/useLanguage';
import { getLocalizedWeatherCondition, localizeWeatherDescription } from '../../utils/weatherCondition';

export const WeatherCard: React.FC<{ weather: WeatherData }> = ({ weather }) => {
  const { t, language } = useLanguage();

  return (
    <div className="flex h-full flex-col bg-white border border-cream-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.weather.title}</span>
          <h3 className="font-bold text-gray-900 text-base">{weather.location}</h3>
        </div>
        <Badge variant={weather.is_demo ? "amber" : "green"}>
          {weather.is_demo ? t.ui.demoWeather : t.ui.liveWeather}
        </Badge>
      </div>

      <div className="flex items-center justify-between my-4">
        <div className="flex items-center gap-3">
          <div className="weather-illustration p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CloudSun size={32} />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900">
              {weather.temperature_celsius}°C
            </div>
            <p className="text-xs text-gray-500">
              {weather.weather_code === undefined
                ? localizeWeatherDescription(weather.condition, language)
                : getLocalizedWeatherCondition(weather.weather_code, language)}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-gray-600 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <Droplets size={14} className="text-blue-500" />
            <span>{t.weather.humidity}: {weather.humidity_pct}%</span>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <Wind size={14} className="text-teal-500" />
            <span>{t.weather.wind}: {weather.wind_speed_kmh} km/h</span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-cream-100 flex items-center justify-between text-xs">
        <span className="text-gray-500 truncate max-w-[200px]">
          {t.ui.sprayingTip}
        </span>
        <Link
          to="/weather"
          className="text-forest-800 font-semibold hover:text-forest-950 flex items-center gap-1 shrink-0 ml-2"
        >
          {t.ui.openAdvisory} <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};
