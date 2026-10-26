import logging
from datetime import datetime, timedelta, timezone
import httpx
from typing import Any
from fastapi import HTTPException
from app.core.config import settings
from app.schemas.weather import WeatherResponse, WeatherForecastDay, WeatherAlert, FarmingGuidance, RiskAssessment, CropAdvisory

logger = logging.getLogger(__name__)

class WeatherService:
    def __init__(self):
        self.api_key = settings.OPENWEATHER_API_KEY

    def get_weather(
        self,
        location: str = "Baramati, Pune",
        district: str = "Pune",
        state: str = "Maharashtra",
        crop_context: str = "Soybean",
        growth_stage_context: str = "Flowering",
    ) -> WeatherResponse:
        # Prefer OpenWeather when configured, then use the public Open-Meteo service.
        if self.api_key and len(self.api_key) > 5:
            try:
                return self._fetch_live_openweather(location, district, state, crop_context, growth_stage_context)
            except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
                logger.warning(
                    "OpenWeather fetch failed (%s); trying Open-Meteo.",
                    type(exc).__name__,
                )
        elif settings.DEMO_DATA_ENABLED:
            return self._get_demo_weather(
                location,
                district,
                state,
                crop_context,
                growth_stage_context,
            )

        try:
            return self._fetch_live_openmeteo(
                location,
                district,
                state,
                crop_context,
                growth_stage_context,
            )
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
            if settings.DEMO_DATA_ENABLED:
                logger.warning(
                    "Open-Meteo fetch failed (%s); using development-only demo weather.",
                    type(exc).__name__,
                )
                return self._get_demo_weather(
                    location,
                    district,
                    state,
                    crop_context,
                    growth_stage_context,
                )

            logger.error(
                "Live weather providers are unavailable (%s): %s",
                type(exc).__name__,
                exc,
            )
            raise HTTPException(
                status_code=503,
                detail="Live weather is temporarily unavailable. Please try again later.",
            ) from exc

    def _fetch_live_openmeteo(
        self,
        location: str,
        district: str,
        state: str,
        crop_context: str,
        growth_stage_context: str,
    ) -> WeatherResponse:
        with httpx.Client(timeout=10.0) as client:
            geocode_response = client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                headers={"User-Agent": "KisanSathi/1.0 (agricultural weather service)"},
                params={
                    "name": district,
                    "count": 5,
                    "language": "en",
                    "format": "json",
                },
            )
            geocode_response.raise_for_status()
            results = geocode_response.json().get("results", [])
            place = next(
                (result for result in results if result.get("country_code") == "IN"),
                None,
            )
            if place is None:
                raise ValueError("Open-Meteo could not find the requested Indian location.")

            response = client.get(
                "https://api.open-meteo.com/v1/forecast",
                headers={"User-Agent": "KisanSathi/1.0 (agricultural weather service)"},
                params={
                    "latitude": place["latitude"],
                    "longitude": place["longitude"],
                    "current": (
                        "temperature_2m,relative_humidity_2m,apparent_temperature,"
                        "precipitation,weather_code,wind_speed_10m"
                    ),
                    "hourly": "precipitation_probability",
                    "daily": (
                        "weather_code,temperature_2m_max,temperature_2m_min,"
                        "precipitation_probability_max"
                    ),
                    "forecast_days": 6,
                    "timezone": "Asia/Kolkata",
                },
            )
            response.raise_for_status()
            data = response.json()

        current = data["current"]
        hourly = data["hourly"]
        daily = data["daily"]
        if not current or not daily.get("time") or not hourly.get("time"):
            raise ValueError("Open-Meteo returned incomplete weather data.")

        current_time = datetime.fromisoformat(current["time"])
        hourly_times = [
            datetime.fromisoformat(value)
            for value in hourly["time"]
        ]
        next_hour_indices = [
            index
            for index, value in enumerate(hourly_times)
            if current_time <= value < current_time + timedelta(hours=6)
        ]
        rain_values = hourly["precipitation_probability"]
        rain_probability = max(
            (rain_values[index] or 0 for index in next_hour_indices),
            default=daily.get("precipitation_probability_max", [0])[0] or 0,
        )

        current_code = int(current["weather_code"])
        condition, icon = self._openmeteo_condition(current_code)
        forecast = []
        for index in range(1, min(6, len(daily["time"]))):
            forecast_condition, forecast_icon = self._openmeteo_condition(
                int(daily["weather_code"][index])
            )
            forecast_date = datetime.fromisoformat(daily["time"][index])
            forecast.append(
                WeatherForecastDay(
                    day=forecast_date.strftime("%A"),
                    date=forecast_date.strftime("%d %b"),
                    temp_max=float(daily["temperature_2m_max"][index]),
                    temp_min=float(daily["temperature_2m_min"][index]),
                    condition=forecast_condition,
                    icon=forecast_icon,
                    rain_probability_pct=int(
                        daily["precipitation_probability_max"][index] or 0
                    ),
                )
            )

        temperature = float(current["temperature_2m"])
        feels_like = float(current["apparent_temperature"])
        humidity = int(current["relative_humidity_2m"])
        wind = float(current["wind_speed_10m"])
        rain_probability = int(rain_probability)
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
            "Check root-zone soil moisture; the forecast indicates a high chance of rain in the next six hours."
            if rain_probability >= 60
            else "Check root-zone soil moisture and the current forecast before deciding whether to irrigate."
        )
        spraying_advice = (
            "Avoid spraying in windy or wet conditions; follow current local advice and the product label."
            if wind >= 15 or rain_probability >= 50
            else "Check current local advice and the product label before spraying."
        )
        harvesting_advice = (
            "Check crop maturity and the live forecast; protect harvested produce from rain."
        )
        soil_work_advice = (
            "Check soil moisture and field drainage before tillage or other soil work."
        )
        recommended_actions = [
            irrigation_advice,
            spraying_advice,
            harvesting_advice,
            soil_work_advice,
        ]
        place_name = place.get("name", district)
        admin_area = place.get("admin1") or state
        display_location = location or f"{place_name}, {admin_area}"

        return WeatherResponse(
            location=display_location,
            district=place_name,
            state=admin_area,
            temperature_celsius=temperature,
            feels_like_celsius=feels_like,
            condition=condition,
            humidity_pct=humidity,
            rainfall_prob_pct=rain_probability,
            wind_speed_kmh=wind,
            updated_at=current_time.strftime("%d %b %Y, %I:%M %p IST"),
            is_demo=False,
            data_source_label="Open-Meteo Live Forecast",
            guidance=FarmingGuidance(
                irrigation_advice=irrigation_advice,
                spraying_advice=spraying_advice,
                harvesting_advice=harvesting_advice,
                soil_work_advice=soil_work_advice,
            ),
            forecast=forecast,
            alerts=[],
            risk_summary=risk_summary,
            recommended_actions=recommended_actions,
            crop_advisories=crop_advisories,
            advisory_summary=(
                f"Live weather for {display_location}: {rain_probability}% maximum "
                "precipitation probability in the next six hours. Check field conditions "
                "before acting."
            ),
        )

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

    def _calculate_risk_scores(self, temp_c, humidity_pct, rain_prob_pct, wind_speed_kmh, crop_context="Soybean", growth_stage_context="Flowering") -> RiskAssessment:
        irrigation = min(95, max(25, int((temp_c * 2.0) + (100 - humidity_pct) * 0.6 + rain_prob_pct * 0.1)))
        spraying = min(95, max(15, int((wind_speed_kmh * 1.8) + (rain_prob_pct * 0.7) + (humidity_pct * 0.2))))
        disease = min(98, max(20, int((humidity_pct * 0.8) + (rain_prob_pct * 0.6) + (temp_c * 0.4))))
        harvesting = min(90, max(12, int((rain_prob_pct * 0.9) + (wind_speed_kmh * 0.5) + (100 - temp_c) * 0.2)))

        crop_name = (crop_context or "Soybean").strip().lower()
        stage = (growth_stage_context or "Flowering").strip().lower()
        if "soybean" in crop_name and "flower" in stage:
            spraying = min(99, spraying + 10)
            disease = min(99, disease + 8)
        elif "cotton" in crop_name and "boll" in stage:
            disease = min(99, disease + 10)
            harvesting = min(90, harvesting + 5)
        elif "wheat" in crop_name and "grain" in stage:
            irrigation = min(95, irrigation + 8)
            harvesting = min(90, harvesting + 12)
        elif "rice" in crop_name:
            irrigation = min(95, irrigation + 12)
            disease = min(99, disease + 5)

        return RiskAssessment(
            irrigation=min(100, irrigation),
            spraying=min(100, spraying),
            disease=min(100, disease),
            harvesting=min(100, harvesting),
        )

    def _build_crop_advisories(self, crop_context: str, growth_stage_context: str, temperature_celsius: float, humidity_pct: int, rainfall_prob_pct: int, wind_speed_kmh: float) -> list[CropAdvisory]:
        crop_name = crop_context.strip() if crop_context else "Soybean"
        growth_stage = growth_stage_context.strip() if growth_stage_context else "Flowering"
        advisories = [
            CropAdvisory(
                crop=crop_name,
                growth_stage=growth_stage,
                recommendation=(
                    f"Weather data for {crop_name} at {growth_stage} is a planning signal only; "
                    "it does not confirm pest pressure or field conditions."
                ),
                risk_level="Indicative",
                action=(
                    "Inspect the crop and root-zone soil. Before any treatment, check a current local advisory, "
                    "weather conditions, and the registered product label."
                ),
            ),
            CropAdvisory(
                crop=crop_name,
                growth_stage=growth_stage,
                recommendation=(
                    f"Temperature is {temperature_celsius:.1f}°C and wind speed is {wind_speed_kmh:.1f} km/h. "
                    "These readings do not measure soil moisture."
                ),
                risk_level="Indicative",
                action="Check root-zone soil moisture and rain forecast before deciding whether to irrigate.",
            ),
        ]

        if "soybean" in crop_name.lower() and "flower" in growth_stage.lower():
            advisories[0].recommendation = (
                "Soybean growth stage is provided as context only. Weather data cannot confirm disease or pest presence."
            )
        elif "cotton" in crop_name.lower() and "boll" in growth_stage.lower():
            advisories[0].recommendation = (
                "Cotton growth stage is provided as context only. Inspect plants and verify current local guidance before treatment."
            )
        elif "wheat" in crop_name.lower():
            advisories[0].recommendation = (
                "Wheat growth stage is provided as context only. Inspect field moisture and drainage; confirm local forecasts."
            )

        return advisories

    def _get_demo_weather(self, location: str, district: str, state: str, crop_context: str, growth_stage_context: str) -> WeatherResponse:
        now = datetime.now()
        updated_str = now.strftime("%d %b %Y, %I:%M %p IST")

        # 5-day forecast
        days = []
        weekday_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        base_temps = [(31.5, 21.0, "Partly Cloudy", "partly-cloudy", 20),
                      (33.0, 22.0, "Sunny & Clear", "sunny", 10),
                      (29.0, 20.5, "Light Rain Showers", "rainy", 65),
                      (28.5, 20.0, "Scattered Cloud", "cloudy", 40),
                      (30.0, 21.5, "Sunny Intervals", "sunny", 15)]

        for i, (t_max, t_min, cond, icon, rain_prob) in enumerate(base_temps):
            dt = now + timedelta(days=i)
            days.append(
                WeatherForecastDay(
                    day="Today" if i == 0 else weekday_names[dt.weekday()],
                    date=dt.strftime("%d %b"),
                    temp_max=t_max,
                    temp_min=t_min,
                    condition=cond,
                    icon=icon,
                    rain_probability_pct=rain_prob
                )
            )

        temperature = 31.2
        humidity = 62
        rain_prob = 20
        wind = 14.5
        risk_summary = self._calculate_risk_scores(temperature, humidity, rain_prob, wind, crop_context, growth_stage_context)
        crop_advisories = self._build_crop_advisories(crop_context, growth_stage_context, temperature, humidity, rain_prob, wind)
        recommended_actions = [
            "Demo data only: inspect root-zone soil moisture and check a live local rain forecast before deciding to irrigate.",
            "Demo data only: do not use this simulation to schedule spraying; follow the product label and current local advice.",
            "Inspect several plants across the field; weather data alone cannot establish crop health or pest pressure.",
            "Check actual field drainage and protect harvested produce when local rain is forecast.",
        ]

        guidance = FarmingGuidance(
            irrigation_advice="Demonstration only, not a local forecast. Check root-zone soil moisture and a current local rain forecast before deciding whether or when to irrigate.",
            spraying_advice="Demonstration weather cannot identify a safe spraying window. Check current wind and rain, the registered product label, and local agricultural guidance before spraying.",
            harvesting_advice="Demonstration only, not a harvest forecast. Check crop maturity, actual field conditions, and a current local forecast before harvest.",
            soil_work_advice="Demonstration only, not a soil assessment. Check actual soil moisture and field drainage before soil work."
        )

        alerts = [
            WeatherAlert(
                severity="Advisory",
                headline="Example weather alert (simulation)",
                description="This demonstration alert is not an observed or location-specific forecast. Check a current local weather source before acting.",
                suggested_action="Use live local conditions and field inspection to plan drainage, spraying, irrigation, or harvest."
            )
        ]

        advisory_summary = (
            "Demonstration weather values are illustrative, not current local observations. "
            "Check live weather and inspect field conditions before making irrigation, spraying, or harvest decisions."
        )

        return WeatherResponse(
            location=location,
            district=district,
            state=state,
            temperature_celsius=temperature,
            feels_like_celsius=33.0,
            condition="Partly Cloudy with Moderate Breeze",
            humidity_pct=humidity,
            rainfall_prob_pct=rain_prob,
            wind_speed_kmh=wind,
            updated_at=updated_str,
            is_demo=True,
            data_source_label="DEMO DATA (Maharashtra Agro-Climatic Simulation)",
            guidance=guidance,
            forecast=days,
            alerts=alerts,
            risk_summary=risk_summary,
            recommended_actions=recommended_actions,
            crop_advisories=crop_advisories,
            advisory_summary=advisory_summary,
        )

    def _fetch_live_openweather(self, location: str, district: str, state: str, crop_context: str, growth_stage_context: str) -> WeatherResponse:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={district},IN&units=metric&appid={self.api_key}"
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.json()

            temp = data["main"]["temp"]
            feels = data["main"]["feels_like"]
            hum = data["main"]["humidity"]
            wind = data.get("wind", {}).get("speed", 0) * 3.6  # m/s to km/h
            cond = data["weather"][0]["description"].title() if data.get("weather") else "Clear"

            forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?q={district},IN&units=metric&appid={self.api_key}"
            forecast_resp = client.get(forecast_url)
            forecast_resp.raise_for_status()
            forecast_items = forecast_resp.json().get("list", [])
            if not isinstance(forecast_items, list) or not forecast_items:
                raise ValueError("OpenWeather returned no forecast intervals.")

            current_timestamp = int(data["dt"])
            timezone_offset = int(data.get("timezone", 19800))
            upcoming_intervals = [
                item for item in forecast_items
                if current_timestamp < int(item["dt"]) <= current_timestamp + 24 * 60 * 60
            ]
            if not upcoming_intervals:
                raise ValueError("OpenWeather returned no forecast intervals for the next 24 hours.")

            rain_probability = round(
                max(min(max(float(item.get("pop", 0)), 0), 1) for item in upcoming_intervals) * 100
            )
            daily_forecasts: dict[str, dict[str, Any]] = {}
            for item in forecast_items:
                local_datetime = datetime.fromtimestamp(
                    int(item["dt"]) + timezone_offset,
                    tz=timezone.utc,
                )
                day_key = local_datetime.date().isoformat()
                forecast = daily_forecasts.setdefault(
                    day_key,
                    {
                        "datetime": local_datetime,
                        "temp_max": float(item["main"]["temp_max"]),
                        "temp_min": float(item["main"]["temp_min"]),
                        "condition": item["weather"][0]["main"],
                        "rain_probability_pct": 0,
                    },
                )
                forecast["temp_max"] = max(forecast["temp_max"], float(item["main"]["temp_max"]))
                forecast["temp_min"] = min(forecast["temp_min"], float(item["main"]["temp_min"]))
                forecast["rain_probability_pct"] = max(
                    forecast["rain_probability_pct"],
                    round(min(max(float(item.get("pop", 0)), 0), 1) * 100),
                )

            forecast_days = [
                WeatherForecastDay(
                    day=forecast["datetime"].strftime("%A"),
                    date=forecast["datetime"].strftime("%d %b"),
                    temp_max=forecast["temp_max"],
                    temp_min=forecast["temp_min"],
                    condition=forecast["condition"],
                    icon="cloudy",
                    rain_probability_pct=forecast["rain_probability_pct"],
                )
                for forecast in list(daily_forecasts.values())[:5]
            ]

            local_now = datetime.fromtimestamp(
                current_timestamp + timezone_offset,
                tz=timezone.utc,
            )
            risk_summary = self._calculate_risk_scores(temp, hum, rain_probability, wind, crop_context, growth_stage_context)
            crop_advisories = self._build_crop_advisories(crop_context, growth_stage_context, temp, hum, rain_probability, wind)
            recommended_actions = [
                "Check current soil moisture before the next irrigation cycle.",
                "Avoid spraying in windy or wet conditions; follow current local advice and the product label.",
                "Inspect canopy health and drainage around vulnerable field zones.",
                "Use the forecast to plan field work and protect harvested produce from rain.",
            ]
            advisory_summary = (
                f"{crop_context or 'Current crop'} at {growth_stage_context or 'current stage'} needs timely decisions in the next 12-24 hours. "
                f"The forecast shows up to {rain_probability}% rain probability in the next 24 hours; check field conditions before acting."
            )
            return WeatherResponse(
                location=location or f"{district}, {state}",
                district=district,
                state=state,
                temperature_celsius=temp,
                feels_like_celsius=feels,
                condition=cond,
                humidity_pct=hum,
                rainfall_prob_pct=rain_probability,
                wind_speed_kmh=round(wind, 1),
                updated_at=local_now.strftime("%d %b %Y, %I:%M %p IST"),
                is_demo=False,
                data_source_label="OpenWeatherMap Live API",
                guidance=FarmingGuidance(
                    irrigation_advice="Check root-zone soil moisture and the upcoming rain forecast before deciding whether to irrigate.",
                    spraying_advice="Avoid spraying in windy or wet conditions. Confirm local recommendations, crop registration, and product-label directions before treatment.",
                    harvesting_advice="Check crop maturity and the forecast; keep harvested produce protected from rain and excess moisture.",
                    soil_work_advice="Check soil moisture and field drainage before tillage or other soil work."
                ),
                forecast=forecast_days,
                alerts=[],
                risk_summary=risk_summary,
                recommended_actions=recommended_actions,
                crop_advisories=crop_advisories,
                advisory_summary=advisory_summary,
            )

weather_service = WeatherService()
