
import React, { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { WeatherData } from "../types";
import { ForecastCard } from "../components/weather/ForecastCard";
import { FarmingAdvisoryCard } from "../components/weather/FarmingAdvisoryCard";
import { LoadingSpinner } from "../components/shared/LoadingSpinner";
import { SafetyNotice } from "../components/shared/SafetyNotice";
import { AlertTriangle, RefreshCw, Search, Thermometer, Droplets, Wind, CloudRain } from "lucide-react";
import { api } from "../services/api";
import { readWeatherCache, saveWeatherCache } from "../utils/weatherCache";
import { getLocalizedWeatherCondition } from "../utils/weatherCondition";
import { localizeGrowthStage } from "../utils/localizeAgriculture";
import { useAuth } from "../hooks/useAuth";

const cropOptions = ["Soybean", "Cotton", "Wheat", "Rice", "Sugarcane", "Maize"];
const growthStageOptions = ["Flowering", "Boll Formation", "Grain Filling", "Tillering", "Vegetative Stage"];

const getRiskTone = (value: number) => {
  if (value >= 75) return "bg-red-100 text-red-700 border-red-200";
  if (value >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
};

const getSeverityColor = (severity: string) => {
  if (severity.toLowerCase().includes("warning") || severity.toLowerCase().includes("high")) return "border-red-200 bg-red-50 text-red-900";
  if (severity.toLowerCase().includes("advisory")) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-emerald-200 bg-emerald-50 text-emerald-900";
};

export const WeatherPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  const [searchInput, setSearchInput] = useState("Pune");
  const [locationName, setLocationName] = useState("Pune, Maharashtra, India");
  const [coordinates, setCoordinates] = useState({ latitude: 18.5204, longitude: 73.8567 });
  const [cropContext, setCropContext] = useState("Soybean");
  const [growthStageContext, setGrowthStageContext] = useState("Flowering");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWeather = useCallback(async (coords: { latitude: number; longitude: number }, displayLocation: string) => {
    setLoading(true);
    setError("");

    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");

      url.search = new URLSearchParams({
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
        current: [
          "temperature_2m",
          "relative_humidity_2m",
          "apparent_temperature",
          "precipitation",
          "weather_code",
          "wind_speed_10m",
        ].join(","),
        hourly: "precipitation_probability",
        daily: [
          "weather_code",
          "temperature_2m_max",
          "temperature_2m_min",
          "precipitation_probability_max",
        ].join(","),
        forecast_days: "6",
        timezone: "Asia/Kolkata",
      }).toString();

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`${t.ui.weatherLoadError} (${response.status}).`);
      }

      const data = await response.json();
      if (!data.current || !data.daily || !data.hourly) {
        throw new Error("The weather service returned incomplete data.");
      }

      const current = data.current;
      const daily = data.daily;
      const hourIndex = data.hourly.time.indexOf(current.time);
      const nextHoursRainProbability = hourIndex >= 0
        ? Math.max(...data.hourly.precipitation_probability.slice(hourIndex, hourIndex + 6).map((value: number | null) => value ?? 0))
        : daily.precipitation_probability_max[0] ?? 0;
      const currentPrecipitation = current.precipitation ?? 0;
      const rainProbability = nextHoursRainProbability;

      const forecast = daily.time.slice(1, 6).map((date: string, offset: number) => {
        const index = offset + 1;
        const forecastDate = new Date(`${date}T00:00:00`);
        return {
          day: forecastDate.toLocaleDateString(`${language}-IN`, { weekday: "short", timeZone: "Asia/Kolkata" }),
          date: forecastDate.toLocaleDateString(`${language}-IN`, { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" }),
          temp_max: daily.temperature_2m_max[index],
          temp_min: daily.temperature_2m_min[index],
          rain_probability_pct: daily.precipitation_probability_max[index] ?? 0,
          condition: getLocalizedWeatherCondition(daily.weather_code[index], language),
        };
      });

      const decisionValues = (template: string) => template
        .replace("{temp}", Number(current.temperature_2m).toFixed(1))
        .replace("{humidity}", String(current.relative_humidity_2m))
        .replace("{wind}", Number(current.wind_speed_10m).toFixed(1))
        .replace("{rain}", String(rainProbability))
        .replace("{precipitation}", Number(currentPrecipitation).toFixed(1));
      const irrigationAdvice = rainProbability >= 60
        ? decisionValues(t.ui.decisionIrrigationRain)
        : current.temperature_2m >= 30 || current.relative_humidity_2m < 40
          ? decisionValues(t.ui.decisionIrrigationHot)
          : decisionValues(t.ui.decisionIrrigationNormal);
      const sprayingAdvice = currentPrecipitation > 0 || rainProbability >= 50 || current.wind_speed_10m >= 15
        ? decisionValues(t.ui.decisionSprayUnsafe)
        : decisionValues(t.ui.decisionSpraySafe);
      const harvestingAdvice = currentPrecipitation > 0 || rainProbability >= 60
        ? decisionValues(t.ui.decisionHarvestWet)
        : decisionValues(t.ui.decisionHarvestDry);
      const soilWorkAdvice = currentPrecipitation > 0 || rainProbability >= 50
        ? decisionValues(t.ui.decisionSoilWet)
        : decisionValues(t.ui.decisionSoilDry);

      const liveWeather = {
        location: displayLocation,
        district: displayLocation.split(",")[0] || displayLocation,
        state: "India",
        updated_at: new Date().toLocaleString(`${language}-IN`, { timeZone: "Asia/Kolkata" }),
        temperature_celsius: current.temperature_2m,
        feels_like_celsius: current.apparent_temperature,
        humidity_pct: current.relative_humidity_2m,
        precipitation_mm: currentPrecipitation,
        wind_speed_kmh: current.wind_speed_10m,
        rainfall_prob_pct: rainProbability,
        condition: getLocalizedWeatherCondition(current.weather_code, language),
        weather_code: current.weather_code,
        is_demo: false,
        data_source_label: `${t.ui.liveWeather} · Open-Meteo`,
        alerts: [],
        forecast,
        guidance: {
          irrigation_advice: irrigationAdvice,
          spraying_advice: sprayingAdvice,
          harvesting_advice: harvestingAdvice,
          soil_work_advice: soilWorkAdvice,
        },
        risk_summary: {
          irrigation: Math.min(95, Math.max(20, Math.round(current.temperature_2m * 1.5 + (100 - current.relative_humidity_2m) * 0.5 - rainProbability * 0.3))),
          spraying: Math.min(99, Math.max(15, Math.round(current.wind_speed_10m * 1.8 + rainProbability * 0.7 + current.relative_humidity_2m * 0.2))),
          disease: Math.min(99, Math.max(20, Math.round(current.relative_humidity_2m * 0.7 + rainProbability * 0.5 + current.temperature_2m * 0.4))),
          harvesting: Math.min(90, Math.max(12, Math.round(rainProbability * 0.75 + current.wind_speed_10m * 0.4))),
        },
        recommended_actions: [
          irrigationAdvice,
          sprayingAdvice,
          harvestingAdvice,
          soilWorkAdvice,
        ],
        crop_advisories: [
          {
            crop: cropContext,
            growth_stage: growthStageContext,
            recommendation: t.ui.cropAdvisory
              .replace("{city}", displayLocation)
              .replace("{crop}", cropContext)
              .replace("{stage}", growthStageContext),
            risk_level: rainProbability >= 50 ? t.ui.high : t.ui.moderate,
            action: t.ui.cropAction,
          },
        ],
        advisory_summary: t.ui.cropAdvisory
          .replace("{city}", displayLocation)
          .replace("{crop}", cropContext)
          .replace("{stage}", growthStageContext),
      } as WeatherData;

      setWeather(liveWeather);
      setLocationName(displayLocation);
      setCoordinates(coords);
      saveWeatherCache(liveWeather, coords, user?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load live weather. Check your internet connection.");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, [cropContext, growthStageContext, language, t.ui, user?.id]);

  const resolveCity = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setError(t.ui.searchCity);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
      url.search = new URLSearchParams({
        name: trimmed,
        count: "1",
        language: "en",
        format: "json",
      }).toString();

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(t.ui.cityLookupFailed);
      }

      const result = await response.json();
      const match = result.results?.find((item: any) => item.country_code === "IN") ?? result.results?.[0];
      if (!match) {
        throw new Error(t.ui.noCityMatch);
      }

      const nextLocation = `${match.name}, ${match.admin1 || match.country || "India"}, India`;
      const nextCoords = { latitude: match.latitude, longitude: match.longitude };
      setSearchInput(match.name);
      await fetchWeather(nextCoords, nextLocation);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.ui.unableFindCity);
      setLoading(false);
    }
  }, [fetchWeather, t.ui]);

  useEffect(() => {
    if (authLoading) return;
    const cached = readWeatherCache(user?.id);
    const nextCoordinates = cached?.coordinates ?? { latitude: 18.5204, longitude: 73.8567 };
    const nextLocation = cached?.weather.location ?? "Pune, Maharashtra, India";
    setSearchInput(nextLocation.split(",")[0] || "Pune");
    setLocationName(nextLocation);
    setCoordinates(nextCoordinates);
    void fetchWeather(nextCoordinates, nextLocation);
  }, [authLoading, user?.id, fetchWeather]);

  const refreshWeather = () => {
    void fetchWeather(coordinates, locationName);
  };

  const riskSummary = weather?.risk_summary ?? { irrigation: 0, spraying: 0, disease: 0, harvesting: 0 };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 p-5 text-white shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">{t.ui.agroDecisionEngine}</p>
          <h2 className="mt-2 text-3xl font-bold">{locationName}</h2>
          <p className="mt-1 text-sm text-emerald-100">{weather?.updated_at || "Loading field weather..."}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-2 py-2 backdrop-blur-sm">
            <Search size={15} className="text-emerald-100" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void resolveCity(searchInput);
                }
              }}
              placeholder={t.ui.searchCity}
              className="w-40 bg-transparent text-sm text-white placeholder:text-emerald-100/80 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => void resolveCity(searchInput)}
            className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
          >
            {t.ui.search}
          </button>
          <select
            value={cropContext}
            onChange={(e) => setCropContext(e.target.value)}
            className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none backdrop-blur-sm"
          >
            {cropOptions.map((crop) => {
              const cropLabels: Record<string, string> = {
                Soybean: t.ui.soybean,
                Cotton: t.ui.cotton,
                Wheat: t.ui.wheat,
                Rice: t.ui.rice,
                Sugarcane: t.ui.sugarcane,
                Maize: t.ui.maize,
              };
              return (
                <option key={crop} value={crop} className="text-gray-900">
                  {cropLabels[crop]}
                </option>
              );
            })}
          </select>
          <select
            value={growthStageContext}
            onChange={(e) => setGrowthStageContext(e.target.value)}
            className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none backdrop-blur-sm"
          >
            {growthStageOptions.map((stage) => {
              const stageLabels: Record<string, string> = {
                Flowering: t.ui.flowering,
                "Boll Formation": t.ui.bollFormation,
                "Grain Filling": t.ui.grainFilling,
                Tillering: t.ui.tillering,
                "Vegetative Stage": t.ui.vegetativeStage,
              };
              return (
                <option key={stage} value={stage} className="text-gray-900">
                  {stageLabels[stage]}
                </option>
              );
            })}
          </select>
          <button
            type="button"
            onClick={refreshWeather}
            disabled={loading}
            className="rounded-xl border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={t.ui.refreshWeather}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message={t.common.loading} />
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">{t.ui.weatherLoadError}</p>
          <p className="mt-1">{error}</p>
          <button type="button" onClick={refreshWeather} className="mt-3 rounded-lg bg-red-700 px-3 py-2 font-semibold text-white hover:bg-red-800">
            {t.common.retry}
          </button>
        </div>
      ) : weather ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">{t.ui.advisorySummary}</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {weather.advisory_summary || t.ui.cropAdvisory
                .replace("{city}", locationName)
                .replace("{crop}", cropContext)
                .replace("{stage}", growthStageContext)}
            </p>
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              {weather.is_demo ? t.ui.demoWeather : t.ui.liveWeather} · Open-Meteo
            </div>
          </div>

          <section aria-labelledby="current-weather-heading" className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 id="current-weather-heading" className="text-lg font-bold text-slate-900">
                  {t.ui.currentConditions}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{weather.location}</p>
              </div>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                {weather.condition}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-xl bg-sky-50 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Thermometer size={15} className="text-orange-600" />
                  {t.weather.temp}
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900">{weather.temperature_celsius.toFixed(1)}°C</p>
              </div>
              <div className="rounded-xl bg-sky-50 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Thermometer size={15} className="text-rose-600" />
                  {t.ui.feelsLike}
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900">{weather.feels_like_celsius.toFixed(1)}°C</p>
              </div>
              <div className="rounded-xl bg-sky-50 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Droplets size={15} className="text-blue-600" />
                  {t.weather.humidity}
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900">{weather.humidity_pct}%</p>
              </div>
              <div className="rounded-xl bg-sky-50 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Wind size={15} className="text-teal-700" />
                  {t.weather.wind}
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900">{weather.wind_speed_kmh.toFixed(1)} km/h</p>
              </div>
              <div className="rounded-xl bg-sky-50 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <CloudRain size={15} className="text-indigo-600" />
                  {t.ui.currentPrecipitation}
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900">{(weather.precipitation_mm ?? 0).toFixed(1)} mm</p>
              </div>
            </div>
            <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              {t.ui.rainNextHours}: <strong>{weather.rainfall_prob_pct}%</strong>
            </p>
          </section>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900">{t.ui.fieldRisk}</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {weather.is_demo ? t.ui.demoMode : t.ui.liveSource}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [t.ui.irrigation, riskSummary.irrigation],
                [t.ui.spraying, riskSummary.spraying],
                [t.ui.disease, riskSummary.disease],
                [t.ui.harvesting, riskSummary.harvesting],
              ].map(([label, value]) => (
                <div key={label} className={`rounded-xl border p-3 ${getRiskTone(Number(value))}`}>
                  <p className="text-xs uppercase tracking-wide">{label}</p>
                  <p className="mt-2 text-2xl font-bold">{value}%</p>
                </div>
              ))}
            </div>
          </div>

          {weather.recommended_actions && weather.recommended_actions.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">{t.ui.recommendedActions}</h3>
              <ul className="mt-4 space-y-3">
                {weather.recommended_actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">{index + 1}</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {weather.crop_advisories && weather.crop_advisories.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">{t.ui.cropRecommendations}</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {weather.crop_advisories.map((advisory, index) => (
                  <div key={`${advisory.crop}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">{advisory.crop === "Soybean" ? t.ui.soybean : advisory.crop === "Cotton" ? t.ui.cotton : advisory.crop === "Wheat" ? t.ui.wheat : advisory.crop === "Rice" ? t.ui.rice : advisory.crop === "Sugarcane" ? t.ui.sugarcane : advisory.crop === "Maize" ? t.ui.maize : advisory.crop}</p>
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase text-amber-800">
                        {advisory.risk_level}
                      </span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                      {t.ui.growthStage}: {localizeGrowthStage(advisory.growth_stage, t.ui)}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{advisory.recommendation}</p>
                    <p className="mt-3 text-sm font-medium text-emerald-700">{t.ui.action}: {advisory.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weather.alerts && weather.alerts.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              {weather.alerts.map((alert, index) => (
                <div key={index} className={`flex items-start gap-3 rounded-xl border p-3 ${getSeverityColor(alert.severity)}`}>
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold">{alert.headline}</h4>
                    <p className="mt-1 leading-relaxed">{alert.description}</p>
                    <p className="mt-2 font-semibold">{t.ui.action}: {alert.suggested_action}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900">{t.weather.fiveDayForecast}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {weather.forecast.map((day, index) => (
                <ForecastCard key={`${day.date}-${index}`} day={day} />
              ))}
            </div>
          </div>

          <FarmingAdvisoryCard guidance={weather.guidance} />

          <SafetyNotice
            title={t.ui.weatherTransparency}
            message={t.ui.weatherDisclaimer}
          />

          <p className="text-xs text-gray-500">
            {t.ui.source}: Open-Meteo. {t.ui.dataUpdated}: {weather.updated_at}
          </p>
        </div>
      ) : null}
    </div>
  );
};
