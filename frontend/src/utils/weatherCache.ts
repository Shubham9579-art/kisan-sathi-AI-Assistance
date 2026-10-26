import { WeatherData } from "../types";

export const WEATHER_CACHE_KEY = "kisansathi.live-weather";
export const WEATHER_UPDATED_EVENT = "kisansathi:weather-updated";

const getCacheKey = (userId?: number) =>
  `${WEATHER_CACHE_KEY}.${userId === undefined ? "demo" : `user-${userId}`}`;

export interface CachedWeather {
  weather: WeatherData;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export function readWeatherCache(userId?: number): CachedWeather | null {
  try {
    localStorage.removeItem(WEATHER_CACHE_KEY);
    const value = localStorage.getItem(getCacheKey(userId));
    if (!value) return null;

    const cached = JSON.parse(value) as CachedWeather;
    if (
      !cached.weather ||
      typeof cached.weather.location !== "string" ||
      typeof cached.weather.temperature_celsius !== "number" ||
      typeof cached.coordinates?.latitude !== "number" ||
      typeof cached.coordinates?.longitude !== "number"
    ) {
      throw new Error("Stored weather data has an invalid format.");
    }

    return cached;
  } catch (error) {
    console.error("Unable to read cached weather:", error);
    return null;
  }
}

export function saveWeatherCache(
  weather: WeatherData,
  coordinates: CachedWeather["coordinates"],
  userId?: number,
): void {
  try {
    localStorage.removeItem(WEATHER_CACHE_KEY);
    localStorage.setItem(getCacheKey(userId), JSON.stringify({ weather, coordinates }));
    window.dispatchEvent(new Event(WEATHER_UPDATED_EVENT));
  } catch (error) {
    console.error("Unable to save cached weather:", error);
  }
}
