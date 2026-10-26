
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.schemas.weather import (
    WeatherResponse,
    WeatherForecastDay,
    WeatherAlert,
    FarmingGuidance,
    RiskAssessment,
    CropAdvisory,
)

logger = logging.getLogger(__name__)

IST = timezone(timedelta(hours=5, minutes=30))

OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
OPENWEATHER_CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather"
OPENWEATHER_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"

HTTP_HEADERS = {
    "User-Agent": "KisanSathi/1.0 (agricultural weather service)"
}


class WeatherService:
    """Live weather service with provider fallback and crop-aware guidance."""

    def __init__(self):
        self.api_key = (
            getattr(settings, "OPENWEATHER_API_KEY", None) or ""
        ).strip()

    def get_weather(
        self,
        location: str = "Baramati, Pune",
        district: str = "Pune",
        state: str = "Maharashtra",
        crop_context: str = "Soybean",
        growth_stage_context: str = "Flowering",
    ) -> WeatherResponse:
        """
        Try OpenWeather first when configured, then Open-Meteo.
        Demo weather is returned only when DEMO_DATA_ENABLED is true.
        """
        location = location or f"{district}, {state}"
        district = district or "Pune"
        state = state or "Maharashtra"
        crop_context = crop_context or "Soybean"
        growth_stage_context = growth_stage_context or "Flowering"

        providers = []

        if len(self.api_key) > 5:
            providers.append(
                ("OpenWeather", self._fetch_live_openweather)
            )

        providers.append(
            ("Open-Meteo", self._fetch_live_openmeteo)
        )

        last_error = None

        for provider_name, provider in providers:
            try:
                result = provider(
                    location,
                    district,
                    state,
                    crop_context,
                    growth_stage_context,
                )

                if result.is_demo:
                    logger.warning(
                        "%s unexpectedly returned demo data.",
                        provider_name,
                    )
                    continue

                return result

            except Exception as exc:
                last_error = exc
                logger.warning(
                    "%s weather request failed (%s). Trying fallback.",
                    provider_name,
                    type(exc).__name__,
                )

        if getattr(settings, "DEMO_DATA_ENABLED", False):
            logger.warning(
                "Live weather unavailable. Returning clearly labeled demo data."
            )
            return self._get_demo_weather(
                location,
                district,
                state,
                crop_context,
                growth_stage_context,
            )

        logger.error(
            "All live weather providers failed. Last error: %s",
            type(last_error).__name__ if last_error else "Unknown",
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Live weather is temporarily unavailable. "
                "Please try again later."
            ),
        )

    # ---------------------------------------------------------
    # OPEN-METEO LIVE WEATHER
    # ---------------------------------------------------------

    def _fetch_live_openmeteo(
        self,
        location: str,
        district: str,
        state: str,
        crop_context: str,
        growth_stage_context: str,
    ) -> WeatherResponse:

        with httpx.Client(
            timeout=12.0,
            headers=HTTP_HEADERS,
        ) as client:

            place = self._find_openmeteo_location(
                client, location, district, state
            )

            response = client.get(
                OPEN_METEO_FORECAST_URL,
                params={
                    "latitude": place["latitude"],
                    "longitude": place["longitude"],
                    "current": (
                        "temperature_2m,"
                        "relative_humidity_2m,"
                        "apparent_temperature,"
                        "precipitation,"
                        "weather_code,"
                        "wind_speed_10m"
                    ),
                    "hourly": "precipitation_probability",
                    "daily": (
                        "weather_code,"
                        "temperature_2m_max,"
                        "temperature_2m_min,"
                        "precipitation_probability_max"
                    ),
                    "forecast_days": 7,
                    "timezone": "Asia/Kolkata",
                },
            )
            response.raise_for_status()
            data = response.json()

        current = data.get("current") or {}
        hourly = data.get("hourly") or {}
        daily = data.get("daily") or {}

        required_current = (
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "weather_code",
            "wind_speed_10m",
        )

        if any(current.get(key) is None for key in required_current):
            raise ValueError("Incomplete current weather data.")

        daily_times = daily.get("time") or []
        hourly_times = hourly.get("time") or []
        hourly_rain = hourly.get("precipitation_probability") or []

        if not daily_times or not hourly_times:
            raise ValueError("Forecast data is incomplete.")

        current_time = datetime.fromisoformat(current["time"])

        # Rain probability during the next six hours.
        rain_candidates = []

        for index, time_value in enumerate(hourly_times):
            forecast_time = datetime.fromisoformat(time_value)

            if current_time <= forecast_time < (
                current_time + timedelta(hours=6)
            ):
                if index < len(hourly_rain):
                    value = hourly_rain[index]
                    if value is not None:
                        rain_candidates.append(
                            self._clamp(value, 0, 100)
                        )

        daily_rain = daily.get("precipitation_probability_max") or []

        if rain_candidates:
            rain_probability = int(max(rain_candidates))
        elif daily_rain and daily_rain[0] is not None:
            rain_probability = int(
                self._clamp(daily_rain[0], 0, 100)
            )
        else:
            rain_probability = 0

        temperature = float(current["temperature_2m"])
        feels_like = float(current["apparent_temperature"])
        humidity = int(current["relative_humidity_2m"])
        wind = float(current["wind_speed_10m"])

        condition, _ = self._openmeteo_condition(
            int(current["weather_code"])
        )

        forecast = []

        # Include today instead of accidentally skipping index 0.
        count = min(6, len(daily_times))

        for index in range(count):
            try:
                forecast_code = daily["weather_code"][index]
                temp_max = daily["temperature_2m_max"][index]
                temp_min = daily["temperature_2m_min"][index]

                if (
                    forecast_code is None
                    or temp_max is None
                    or temp_min is None
                ):
                    continue

                forecast_condition, forecast_icon = (
                    self._openmeteo_condition(int(forecast_code))
                )

                forecast_date = datetime.fromisoformat(
                    daily_times[index]
                )

                daily_rain_value = (
                    daily_rain[index]
                    if index < len(daily_rain)
                    else 0
                )

                forecast.append(
                    WeatherForecastDay(
                        day=(
                            "Today"
                            if index == 0
                            else forecast_date.strftime("%A")
                        ),
                        date=forecast_date.strftime("%d %b"),
                        temp_max=float(temp_max),
                        temp_min=float(temp_min),
                        condition=forecast_condition,
                        icon=forecast_icon,
                        rain_probability_pct=int(
                            self._clamp(
                                daily_rain_value or 0, 0, 100
                            )
                        ),
                    )
                )
            except (IndexError, TypeError, ValueError):
                logger.warning(
                    "Skipping incomplete Open-Meteo forecast day %s.",
                    index,
                )

        if not forecast:
            raise ValueError("No usable daily forecast was returned.")

        return self._build_weather_response(
            location=location,
            district=place.get("name") or district,
            state=place.get("admin1") or state,
            temperature=temperature,
            feels_like=feels_like,
            condition=condition,
            humidity=humidity,
            rain_probability=rain_probability,
            wind=wind,
            updated_at=current_time.replace(tzinfo=IST).strftime(
                "%d %b %Y, %I:%M %p IST"
            ),
            source="Open-Meteo Live Forecast",
            crop_context=crop_context,
            growth_stage_context=growth_stage_context,
            forecast=forecast,
            next_hours=6,
        )

    def _find_openmeteo_location(
        self,
        client: httpx.Client,
        location: str,
        district: str,
        state: str,
    ) -> dict[str, Any]:
        """
        Search the specific town first, then district.
        Prefer Indian results matching the requested state.
        """
        first_part = location.split(",")[0].strip()

        search_terms = list(
            dict.fromkeys(
                term
                for term in (first_part, district)
                if term
            )
        )

        for term in search_terms:
            response = client.get(
                OPEN_METEO_GEOCODING_URL,
                params={
                    "name": term,
                    "count": 10,
                    "language": "en",
                    "format": "json",
                },
            )
            response.raise_for_status()

            results = response.json().get("results") or []

            indian_places = [
                item
                for item in results
                if item.get("country_code") == "IN"
                and item.get("latitude") is not None
                and item.get("longitude") is not None
            ]

            if not indian_places:
                continue

            requested_state = state.strip().casefold()

            state_matches = [
                item
                for item in indian_places
                if (item.get("admin1") or "").casefold()
                == requested_state
            ]

            candidates = state_matches or indian_places

            # Prefer exact town matches when available.
            exact_matches = [
                item
                for item in candidates
                if (item.get("name") or "").casefold()
                == term.casefold()
            ]

            return (exact_matches or candidates)[0]

        raise ValueError(
            f"Could not locate {location} or {district} in India."
        )

    # ---------------------------------------------------------
    # OPEN-METEO WEATHER CODE MAPPING
    # ---------------------------------------------------------

    @staticmethod
    def _openmeteo_condition(code: int) -> tuple[str, str]:
        if code == 0:
            return "Clear", "sunny"
        if code in (1, 2):
            return "Partly cloudy", "partly-cloudy"
        if code == 3:
            return "Overcast", "cloudy"
        if code in (45, 48):
            return "Fog", "cloudy"
        if code in (51, 53, 55, 56, 57):
            return "Drizzle", "rainy"
        if code in (61, 63, 65, 66, 67, 80, 81, 82):
            return "Rain", "rainy"
        if code in (71, 73, 75, 77, 85, 86):
            return "Snow", "cloudy"
        if code in (95, 96, 99):
            return "Thunderstorm", "rainy"

        return "Unknown", "cloudy"

    # ---------------------------------------------------------
    # SHARED WEATHER RESPONSE BUILDER
    # ---------------------------------------------------------

    def _build_weather_response(
        self,
        location: str,
        district: str,
        state: str,
        temperature: float,
        feels_like: float,
        condition: str,
        humidity: int,
        rain_probability: int,
        wind: float,
        updated_at: str,
        source: str,
        crop_context: str,
        growth_stage_context: str,
        forecast: list[WeatherForecastDay],
        next_hours: int,
    ) -> WeatherResponse:

        risk_summary = self._calculate_risk_scores(
            temperature,
            humidity,
            rain_probability,
            wind,
            crop_context,
            growth_stage_context,
        )

        crop_advisories = self._build_crop_advisories(
            crop_context,
            growth_stage_context,
            temperature,
            humidity,
            rain_probability,
            wind,
        )

        irrigation_advice = (
            f"Rain probability is {rain_probability}% over the next "
            f"{next_hours} hours. Check root-zone soil moisture and "
            "local conditions before deciding whether to irrigate."
        )

        spraying_advice = (
            "Wind or rain may make spraying unsuitable. Check current "
            "conditions, local agricultural guidance, and the registered "
            "product label before spraying."
            if wind >= 15 or rain_probability >= 50
            else "Check local wind and rain conditions and the registered "
                 "product label before spraying."
        )

        harvesting_advice = (
            "Check crop maturity and the current local forecast. "
            "Protect harvested produce from rain."
        )

        soil_work_advice = (
            "Check soil moisture, drainage, and field conditions before "
            "tillage or other soil work."
        )

        return WeatherResponse(
            location=location,
            district=district,
            state=state,
            temperature_celsius=temperature,
            feels_like_celsius=feels_like,
            condition=condition,
            humidity_pct=humidity,
            rainfall_prob_pct=rain_probability,
            wind_speed_kmh=round(wind, 1),
            updated_at=updated_at,
            is_demo=False,
            data_source_label=source,
            guidance=FarmingGuidance(
                irrigation_advice=irrigation_advice,
                spraying_advice=spraying_advice,
                harvesting_advice=harvesting_advice,
                soil_work_advice=soil_work_advice,
            ),
            forecast=forecast,
            alerts=[],
            risk_summary=risk_summary,
            recommended_actions=[
                irrigation_advice,
                spraying_advice,
                harvesting_advice,
                soil_work_advice,
            ],
            crop_advisories=crop_advisories,
            advisory_summary=(
                f"Live weather for {location}: {rain_probability}% "
                f"maximum precipitation probability over the next "
                f"{next_hours} hours. Check actual field conditions "
                "before making farming decisions."
            ),
        )

    # ---------------------------------------------------------
    # CROP RISK ESTIMATES
    # ---------------------------------------------------------

    @staticmethod
    def _clamp(value: Any, minimum: float, maximum: float) -> float:
        return max(minimum, min(maximum, float(value)))

    def _calculate_risk_scores(
        self,
        temp_c,
        humidity_pct,
        rain_prob_pct,
        wind_speed_kmh,
        crop_context="Soybean",
        growth_stage_context="Flowering",
    ) -> RiskAssessment:

        temp_c = self._clamp(temp_c, -50, 60)
        humidity_pct = self._clamp(humidity_pct, 0, 100)
        rain_prob_pct = self._clamp(rain_prob_pct, 0, 100)
        wind_speed_kmh = self._clamp(wind_speed_kmh, 0, 300)

        irrigation = int(
            temp_c * 2.0
            + (100 - humidity_pct) * 0.6
            + rain_prob_pct * 0.1
        )

        spraying = int(
            wind_speed_kmh * 1.8
            + rain_prob_pct * 0.7
            + humidity_pct * 0.2
        )

        disease = int(
            humidity_pct * 0.8
            + rain_prob_pct * 0.6
            + temp_c * 0.4
        )

        harvesting = int(
            rain_prob_pct * 0.9
            + wind_speed_kmh * 0.5
            + (100 - temp_c) * 0.2
        )

        crop = (crop_context or "").strip().lower()
        stage = (growth_stage_context or "").strip().lower()

        if "soybean" in crop and "flower" in stage:
            spraying += 10
            disease += 8
        elif "cotton" in crop and "boll" in stage:
            disease += 10
            harvesting += 5
        elif "wheat" in crop and "grain" in stage:
            irrigation += 8
            harvesting += 12
        elif "rice" in crop:
            irrigation += 12
            disease += 5

        return RiskAssessment(
            irrigation=int(self._clamp(irrigation, 0, 100)),
            spraying=int(self._clamp(spraying, 0, 100)),
            disease=int(self._clamp(disease, 0, 100)),
            harvesting=int(self._clamp(harvesting, 0, 100)),
        )

    def _build_crop_advisories(
        self,
        crop_context: str,
        growth_stage_context: str,
        temperature_celsius: float,
        humidity_pct: int,
        rainfall_prob_pct: int,
        wind_speed_kmh: float,
    ) -> list[CropAdvisory]:

        crop = (crop_context or "Soybean").strip()
        stage = (growth_stage_context or "Flowering").strip()

        recommendation = (
            f"Weather information for {crop} at {stage} is a planning "
            "signal only. It does not confirm pest pressure or disease."
        )

        if "soybean" in crop.lower() and "flower" in stage.lower():
            recommendation = (
                "For flowering soybean, inspect flowers, leaves, and "
                "field moisture. Weather alone cannot confirm pests "
                "or disease."
            )
        elif "cotton" in crop.lower() and "boll" in stage.lower():
            recommendation = (
                "For cotton at boll development, inspect plants and "
                "verify local agricultural guidance before treatment."
            )
        elif "wheat" in crop.lower():
            recommendation = (
                "For wheat, inspect field moisture and drainage, "
                "and confirm local forecasts before field operations."
            )

        return [
            CropAdvisory(
                crop=crop,
                growth_stage=stage,
                recommendation=recommendation,
                risk_level="Indicative",
                action=(
                    "Inspect the crop and root-zone soil. Confirm "
                    "current local guidance and registered product "
                    "label directions before treatment."
                ),
            ),
            CropAdvisory(
                crop=crop,
                growth_stage=stage,
                recommendation=(
                    f"Temperature is {temperature_celsius:.1f}°C, "
                    f"humidity is {humidity_pct}%, rain probability "
                    f"is {rainfall_prob_pct}%, and wind speed is "
                    f"{wind_speed_kmh:.1f} km/h. These values do not "
                    "measure soil moisture or establish crop health."
                ),
                risk_level="Indicative",
                action=(
                    "Check root-zone soil moisture and the local "
                    "rain forecast before deciding whether to irrigate."
                ),
            ),
        ]

    # ---------------------------------------------------------
    # OPENWEATHER LIVE WEATHER
    # ---------------------------------------------------------

    def _fetch_live_openweather(
        self,
        location: str,
        district: str,
        state: str,
        crop_context: str,
        growth_stage_context: str,
    ) -> WeatherResponse:

        with httpx.Client(
            timeout=12.0,
            headers=HTTP_HEADERS,
        ) as client:

            params = {
                "q": f"{district},IN",
                "units": "metric",
                "appid": self.api_key,
            }

            response = client.get(
                OPENWEATHER_CURRENT_URL,
                params=params,
            )
            response.raise_for_status()
            data = response.json()

            main = data.get("main") or {}
            weather_items = data.get("weather") or []

            if (
                main.get("temp") is None
                or main.get("feels_like") is None
                or main.get("humidity") is None
                or not weather_items
            ):
                raise ValueError("Incomplete OpenWeather current data.")

            temperature = float(main["temp"])
            feels_like = float(main["feels_like"])
            humidity = int(main["humidity"])
            wind = float((data.get("wind") or {}).get("speed", 0)) * 3.6
            condition = weather_items[0].get("description", "Clear").title()

            current_timestamp = int(data["dt"])
            timezone_offset = int(data.get("timezone", 19800))

            forecast_response = client.get(
                OPENWEATHER_FORECAST_URL,
                params=params,
            )
            forecast_response.raise_for_status()

            forecast_items = (
                forecast_response.json().get("list") or []
            )

            if not forecast_items:
                raise ValueError("OpenWeather returned no forecast data.")

            end_timestamp = current_timestamp + 24 * 60 * 60

            upcoming = [
                item
                for item in forecast_items
                if current_timestamp < int(item["dt"]) <= end_timestamp
            ]

            if not upcoming:
                raise ValueError(
                    "No OpenWeather intervals found in the next 24 hours."
                )

            rain_probability = int(
                round(
                    max(
                        self._clamp(
                            item.get("pop", 0) or 0, 0, 1
                        )
                        for item in upcoming
                    )
                    * 100
                )
            )

            daily: dict[str, dict[str, Any]] = {}

            for item in forecast_items:
                timestamp = int(item["dt"])

                local_datetime = datetime.fromtimestamp(
                    timestamp + timezone_offset,
                    tz=timezone.utc,
                )

                day_key = local_datetime.date().isoformat()
                item_main = item.get("main") or {}
                item_weather = item.get("weather") or []

                if (
                    item_main.get("temp_max") is None
                    or item_main.get("temp_min") is None
                ):
                    continue

                if day_key not in daily:
                    daily[day_key] = {
                        "datetime": local_datetime,
                        "temp_max": float(item_main["temp_max"]),
                        "temp_min": float(item_main["temp_min"]),
                        "condition": (
                            item_weather[0].get("main", "Unknown")
                            if item_weather
                            else "Unknown"
                        ),
                        "rain_probability_pct": 0,
                    }

                entry = daily[day_key]
                entry["temp_max"] = max(
                    entry["temp_max"], float(item_main["temp_max"])
                )
                entry["temp_min"] = min(
                    entry["temp_min"], float(item_main["temp_min"])
                )
                entry["rain_probability_pct"] = max(
                    entry["rain_probability_pct"],
                    int(
                        round(
                            self._clamp(
                                item.get("pop", 0) or 0, 0, 1
                            )
                            * 100
                        )
                    ),
                )

            forecast = []

            for index, entry in enumerate(list(daily.values())[:6]):
                forecast.append(
                    WeatherForecastDay(
                        day=(
                            "Today"
                            if index == 0
                            else entry["datetime"].strftime("%A")
                        ),
                        date=entry["datetime"].strftime("%d %b"),
                        temp_max=entry["temp_max"],
                        temp_min=entry["temp_min"],
                        condition=entry["condition"],
                        icon=self._openweather_icon(
                            entry["condition"]
                        ),
                        rain_probability_pct=entry[
                            "rain_probability_pct"
                        ],
                    )
                )

            if not forecast:
                raise ValueError("No usable OpenWeather daily forecast.")

            local_now = datetime.fromtimestamp(
                current_timestamp,
                tz=timezone.utc,
            ).astimezone(IST)

        return self._build_weather_response(
            location=location,
            district=district,
            state=state,
            temperature=temperature,
            feels_like=feels_like,
            condition=condition,
            humidity=humidity,
            rain_probability=rain_probability,
            wind=wind,
            updated_at=local_now.strftime(
                "%d %b %Y, %I:%M %p IST"
            ),
            source="OpenWeatherMap Live API",
            crop_context=crop_context,
            growth_stage_context=growth_stage_context,
            forecast=forecast,
            next_hours=24,
        )

    @staticmethod
    def _openweather_icon(condition: str) -> str:
        value = condition.lower()

        if "thunder" in value:
            return "rainy"
        if "rain" in value or "drizzle" in value:
            return "rainy"
        if "snow" in value:
            return "cloudy"
        if "clear" in value:
            return "sunny"
        if "cloud" in value:
            return "partly-cloudy"
        if "mist" in value or "fog" in value or "haze" in value:
            return "cloudy"

        return "cloudy"

    # ---------------------------------------------------------
    # DEMO WEATHER
    # ---------------------------------------------------------

    def _get_demo_weather(
        self,
        location: str,
        district: str,
        state: str,
        crop_context: str,
        growth_stage_context: str,
    ) -> WeatherResponse:

        now = datetime.now(IST)

        # These are illustrative values, not real observations.
        base_temps = [
            (31.5, 21.0, "Partly cloudy", "partly-cloudy", 20),
            (33.0, 22.0, "Clear", "sunny", 10),
            (29.0, 20.5, "Rain", "rainy", 65),
            (28.5, 20.0, "Cloudy", "cloudy", 40),
            (30.0, 21.5, "Clear", "sunny", 15),
        ]

        forecast = []

        for index, values in enumerate(base_temps):
            temp_max, temp_min, condition, icon, rain = values
            forecast_date = now + timedelta(days=index)

            forecast.append(
                WeatherForecastDay(
                    day=(
                        "Today"
                        if index == 0
                        else forecast_date.strftime("%A")
                    ),
                    date=forecast_date.strftime("%d %b"),
                    temp_max=temp_max,
                    temp_min=temp_min,
                    condition=condition,
                    icon=icon,
                    rain_probability_pct=rain,
                )
            )

        temperature = 31.2
        feels_like = 33.0
        humidity = 62
        rain_probability = 20
        wind = 14.5

        risk_summary = self._calculate_risk_scores(
            temperature,
            humidity,
            rain_probability,
            wind,
            crop_context,
            growth_stage_context,
        )

        crop_advisories = self._build_crop_advisories(
            crop_context,
            growth_stage_context,
            temperature,
            humidity,
            rain_probability,
            wind,
        )

        guidance = FarmingGuidance(
            irrigation_advice=(
                "DEMO ONLY: Check actual root-zone soil moisture "
                "and a live local forecast before irrigation."
            ),
            spraying_advice=(
                "DEMO ONLY: Do not use simulated weather to schedule "
                "spraying. Check live wind, rain, local advice, and "
                "the registered product label."
            ),
            harvesting_advice=(
                "DEMO ONLY: Check crop maturity, field conditions, "
                "and a current local forecast before harvesting."
            ),
            soil_work_advice=(
                "DEMO ONLY: Inspect actual soil moisture and drainage "
                "before soil work."
            ),
        )

        alerts = [
            WeatherAlert(
                severity="Advisory",
                headline="Demo weather alert (simulation)",
                description=(
                    "This is an illustrative alert, not a live "
                    "location-specific observation or warning."
                ),
                suggested_action=(
                    "Check a current local weather source and inspect "
                    "the field before making farming decisions."
                ),
            )
        ]

        return WeatherResponse(
            location=location,
            district=district,
            state=state,
            temperature_celsius=temperature,
            feels_like_celsius=feels_like,
            condition="Partly Cloudy (Simulated)",
            humidity_pct=humidity,
            rainfall_prob_pct=rain_probability,
            wind_speed_kmh=wind,
            updated_at=now.strftime("%d %b %Y, %I:%M %p IST"),
            is_demo=True,
            data_source_label="DEMO DATA — NOT LIVE WEATHER",
            guidance=guidance,
            forecast=forecast,
            alerts=alerts,
            risk_summary=risk_summary,
            recommended_actions=[
                "DEMO ONLY: Check soil moisture and a live rain forecast.",
                "DEMO ONLY: Verify live wind and rain before spraying.",
                "Inspect crop maturity and field conditions.",
                "Check actual drainage and protect harvested produce.",
            ],
            crop_advisories=crop_advisories,
            advisory_summary=(
                "These weather values are simulated and are not current "
                "local observations. Verify live weather and field "
                "conditions before acting."
            ),
        )


# Shared service instance used by the existing FastAPI routes.
weather_service = WeatherService()
