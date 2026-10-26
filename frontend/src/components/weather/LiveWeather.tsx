
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSun,
  Wind,
  Droplets,
  RefreshCw,
  MapPin,
  AlertCircle,
  Thermometer,
  Search,
  X,
} from "lucide-react";

type WeatherData = {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  rainProbability: number | null;
  weatherCode: number;
};

type Props = {
  latitude?: number;
  longitude?: number;
  locationName?: string;
};

type Location = {
  latitude: number;
  longitude: number;
  name: string;
};

type GeoResult = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
};

const DEFAULT_LOCATION: Location = {
  latitude: 18.5204,
  longitude: 73.8567,
  name: "Pune, Maharashtra, India",
};

function getCondition(code: number): string {
  if (code === 0) return "Clear sky";
  if ([1, 2].includes(code)) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Unknown conditions";
}

function WeatherIcon({ code }: { code: number }) {
  if (code === 0) {
    return <Sun size={44} className="text-amber-500" />;
  }

  if ([1, 2].includes(code)) {
    return <CloudSun size={44} className="text-amber-500" />;
  }

  if ([3, 45, 48].includes(code)) {
    return <Cloud size={44} className="text-gray-500" />;
  }

  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(
      code
    )
  ) {
    return <CloudRain size={44} className="text-blue-500" />;
  }

  return <Cloud size={44} className="text-gray-500" />;
}

const Metric: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="rounded-xl border border-gray-200 p-3">
    <div className="text-blue-600">{icon}</div>
    <p className="mt-2 text-xs text-gray-500">{label}</p>
    <p className="break-words text-lg font-bold text-gray-900">{value}</p>
  </div>
);

export const LiveWeather: React.FC<Props> = ({
  latitude,
  longitude,
  locationName,
}) => {
  const initialLocation = useRef<Location>({
    latitude: latitude ?? DEFAULT_LOCATION.latitude,
    longitude: longitude ?? DEFAULT_LOCATION.longitude,
    name:
      locationName ||
      (latitude !== undefined && longitude !== undefined
        ? "Selected farm"
        : DEFAULT_LOCATION.name),
  });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<Location>(initialLocation.current);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  // Keep the latest selected location available for refresh.
  const selectedLocationRef = useRef<Location>(initialLocation.current);
  const requestIdRef = useRef(0);

  const fetchWeather = useCallback(async (selected: Location) => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError("");

    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");

      url.search = new URLSearchParams({
        latitude: String(selected.latitude),
        longitude: String(selected.longitude),
        current: [
          "temperature_2m",
          "relative_humidity_2m",
          "apparent_temperature",
          "precipitation",
          "weather_code",
          "wind_speed_10m",
        ].join(","),
        hourly: "precipitation_probability",
        forecast_days: "1",
        timezone: "auto",
      }).toString();

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(
          `Weather request failed (${response.status}). Please try again.`
        );
      }

      const data = await response.json();
      const current = data.current;

      if (!current) {
        throw new Error("No current weather data was returned.");
      }

      const times: string[] = data.hourly?.time ?? [];
      const probabilities: (number | null)[] =
        data.hourly?.precipitation_probability ?? [];

      let hourIndex = times.indexOf(current.time);

      if (hourIndex < 0) {
        for (let i = 0; i < times.length; i++) {
          if (times[i] <= current.time) {
            hourIndex = i;
          } else {
            break;
          }
        }
      }

      // Ignore an older request if the user has searched again.
      if (requestId !== requestIdRef.current) return;

      setWeather({
        time: current.time,
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        precipitation: current.precipitation,
        rainProbability:
          hourIndex >= 0 ? probabilities[hourIndex] ?? null : null,
        weatherCode: current.weather_code,
      });

      selectedLocationRef.current = selected;
      setLocation(selected);

      setUpdatedAt(
        new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })
      );
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load weather. Check your internet connection."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Load the initial location once.
  useEffect(() => {
    void fetchWeather(initialLocation.current);
  }, [fetchWeather]);

  const searchCity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = city.trim();

    if (!query) {
      setError("Enter a city, town, or village name.");
      return;
    }

    setSearching(true);
    setError("");

    try {
      const url = new URL(
        "https://geocoding-api.open-meteo.com/v1/search"
      );

      url.search = new URLSearchParams({
        name: query,
        count: "100",
        language: "en",
        format: "json",
      }).toString();

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Location search failed. Please try again.");
      }

      const data: { results?: GeoResult[] } = await response.json();

      const indianResults = (data.results ?? []).filter(
        (item) => item.country_code?.toUpperCase() === "IN"
      );

      if (indianResults.length === 0) {
        throw new Error(
          `No Indian location found for "${query}". Check the spelling or try a nearby town.`
        );
      }

      const normalizedQuery = query.toLocaleLowerCase();

      const result =
        indianResults.find(
          (item) => item.name.toLocaleLowerCase() === normalizedQuery
        ) ??
        indianResults.find((item) =>
          item.name.toLocaleLowerCase().startsWith(normalizedQuery)
        ) ??
        indianResults[0];

      const nameParts = [
        result.name,
        result.admin2,
        result.admin1,
        result.country || "India",
      ].filter(
        (part, index, array) =>
          Boolean(part) && array.indexOf(part) === index
      );

      const selected: Location = {
        latitude: result.latitude,
        longitude: result.longitude,
        name: nameParts.join(", "),
      };

      // This fetch uses the searched city's coordinates.
      await fetchWeather(selected);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to search for this location."
      );
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      return;
    }

    setError("");
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void fetchWeather({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: "Current location",
        });
      },
      (geoError) => {
        setLoading(false);

        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError(
            "Location access was denied. Allow browser location access or search for a city."
          );
        } else if (geoError.code === geoError.TIMEOUT) {
          setError("Getting your location timed out. Please try again.");
        } else {
          setError("Unable to get your location. Please search for a city.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  const refreshWeather = () => {
    void fetchWeather(selectedLocationRef.current);
  };

  return (
    <section className="space-y-5 rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Current Weather</h2>
          <p className="mt-1 text-xs text-gray-500">
            Current conditions for your selected location
          </p>
        </div>

        <button
          type="button"
          onClick={refreshWeather}
          disabled={loading}
          aria-label="Refresh weather"
          className="rounded-lg border p-2 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={18}
            className={loading ? "animate-spin" : ""}
          />
        </button>
      </div>

      <form onSubmit={searchCity} className="flex gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-300 px-3">
          <Search size={18} className="shrink-0 text-gray-400" />

          <input
            type="search"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Enter any Indian city or village"
            aria-label="Search city or village"
            className="min-w-0 flex-1 py-2 text-sm outline-none"
          />

          {city && (
            <button
              type="button"
              onClick={() => setCity("")}
              aria-label="Clear search"
              className="text-gray-400 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || searching}
          className="flex items-center gap-1.5 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
        >
          <Search size={15} />
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      <p className="text-xs text-gray-500">
        Search for a city, town, or village anywhere in India.
      </p>

      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={loading || searching}
        className="flex items-center gap-2 text-sm font-medium text-green-800 disabled:opacity-50"
      >
        <MapPin size={16} />
        Use my current location
      </button>

      {loading && (
        <p role="status" className="text-sm text-gray-500">
          Loading weather...
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {weather && (
        <>
          <div className="rounded-xl bg-gradient-to-br from-green-50 to-blue-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin size={14} />
                  {location.name}
                </p>

                <p className="mt-3 text-5xl font-extrabold text-gray-900">
                  {Math.round(weather.temperature)}°C
                </p>

                <p className="mt-2 text-sm font-medium text-gray-700">
                  {getCondition(weather.weatherCode)}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Feels like {Math.round(weather.feelsLike)}°C
                </p>
              </div>

              <WeatherIcon code={weather.weatherCode} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric
              icon={<Droplets size={20} />}
              label="Humidity"
              value={`${weather.humidity}%`}
            />

            <Metric
              icon={<Wind size={20} />}
              label="Wind speed"
              value={`${weather.windSpeed} km/h`}
            />

            <Metric
              icon={<CloudRain size={20} />}
              label="Rain probability"
              value={
                weather.rainProbability === null
                  ? "Unavailable"
                  : `${weather.rainProbability}%`
              }
            />

            <Metric
              icon={<Thermometer size={20} />}
              label="Precipitation"
              value={`${weather.precipitation} mm`}
            />
          </div>

          <p className="text-xs text-gray-500">
            Weather model time: {weather.time.replace("T", " ")}
            <br />
            Data retrieved: {updatedAt}
          </p>
        </>
      )}

      <p className="text-xs text-gray-500">
        Source: Open-Meteo. Forecasts are estimates and may not match
        conditions at your exact field.{" "}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          API information
        </a>
      </p>
    </section>
  );
};
