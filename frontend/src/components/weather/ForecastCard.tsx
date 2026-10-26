
import React from "react";
import { WeatherDay } from "../../types";
import {
  Sun,
  CloudRain,
  Cloud,
  CloudSun,
  CloudFog,
  CloudLightning,
  Snowflake,
} from "lucide-react";

export const ForecastCard: React.FC<{ day: WeatherDay }> = ({ day }) => {
  const getIcon = (condition: string) => {
    const c = condition.toLowerCase();

    if (c.includes("thunder")) {
      return <CloudLightning size={26} className="text-purple-500" />;
    }

    if (
      c.includes("rain") ||
      c.includes("shower") ||
      c.includes("drizzle")
    ) {
      return <CloudRain size={26} className="text-blue-500" />;
    }

    if (c.includes("snow")) {
      return <Snowflake size={26} className="text-sky-500" />;
    }

    if (c.includes("fog")) {
      return <CloudFog size={26} className="text-gray-500" />;
    }

    if (c.includes("partly") || c.includes("scatter")) {
      return <CloudSun size={26} className="text-amber-500" />;
    }

    if (c.includes("cloud") || c.includes("overcast")) {
      return <Cloud size={26} className="text-gray-500" />;
    }

    return <Sun size={26} className="text-amber-500" />;
  };

  const formatDate = (dateValue: string) => {
    if (!dateValue) return "";

    const date = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatDay = (dayValue: string, dateValue: string) => {
    if (!dayValue) return "";

    // Display weekday names supplied by the API or existing data.
    if (dayValue.length > 3) return dayValue;

    // If dayValue is a date, derive its weekday.
    if (/^\d{4}-\d{2}-\d{2}$/.test(dayValue)) {
      return new Date(`${dayValue}T00:00:00`).toLocaleDateString("en-IN", {
        weekday: "short",
      });
    }

    return dayValue || dateValue;
  };

  return (
    <div className="flex flex-col items-center justify-between rounded-xl border border-cream-200 bg-white p-3.5 text-center shadow-sm transition-colors hover:border-forest-300">
      <span className="text-xs font-bold text-gray-700">
        {formatDay(day.day, day.date)}
      </span>

      <span className="mb-2 text-[10px] text-gray-400">
        {formatDate(day.date)}
      </span>

      <div className="my-2 rounded-full bg-cream-50 p-2">
        {getIcon(day.condition)}
      </div>

      <p className="my-1 text-sm font-extrabold text-gray-900">
        {Math.round(day.temp_max)}° /{" "}
        <span className="text-xs font-normal text-gray-500">
          {Math.round(day.temp_min)}°
        </span>
      </p>

      <div className="mt-1 text-[11px] font-semibold text-blue-600">
        <span aria-hidden="true">🌧 </span>
        {day.rain_probability_pct}% rain
      </div>

      <p className="mt-1 max-w-full text-[10px] text-gray-500">
        {day.condition}
      </p>
    </div>
  );
};
