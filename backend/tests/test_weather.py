from datetime import datetime, timezone
from datetime import timedelta
from zoneinfo import ZoneInfo

import httpx
import pytest
from fastapi import HTTPException
from app.schemas.weather import WeatherResponse
from app.core.config import settings
from app.services.weather.weather_service import WeatherService


def test_live_weather_uses_forecast_rain_probability_for_advisories(monkeypatch):
    service = WeatherService()
    service.api_key = "test-api-key"
    current_timestamp = int(datetime.now(timezone.utc).timestamp())
    forecast_items = []
    for interval in range(1, 41):
        forecast_items.append(
            {
                "dt": current_timestamp + interval * 3 * 60 * 60,
                "main": {
                    "temp_max": 25 + interval % 4,
                    "temp_min": 18 + interval % 3,
                },
                "weather": [{"main": "Rain" if interval == 2 else "Clouds"}],
                "pop": 0.73 if interval == 2 else 0.1,
            }
        )

    current_data = {
        "dt": current_timestamp,
        "timezone": 19800,
        "main": {"temp": 29.0, "feels_like": 31.0, "humidity": 72},
        "wind": {"speed": 2.0},
        "weather": [{"description": "light rain"}],
    }

    class FakeResponse:
        def __init__(self, payload):
            self.payload = payload

        def raise_for_status(self):
            return None

        def json(self):
            return self.payload

    class FakeClient:
        def __init__(self, timeout):
            assert timeout == 8.0

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        def get(self, url):
            if "/forecast?" in url:
                return FakeResponse({"list": forecast_items})
            return FakeResponse(current_data)

    monkeypatch.setattr(
        "app.services.weather.weather_service.httpx.Client",
        FakeClient,
    )

    result = service.get_weather(
        location="Akola, Maharashtra",
        district="Akola",
        state="Maharashtra",
        crop_context="Soybean",
        growth_stage_context="Flowering",
    )

    assert isinstance(result, WeatherResponse)
    assert result.is_demo is False
    assert result.rainfall_prob_pct == 73
    assert len(result.forecast) == 5
    assert result.risk_summary == service._calculate_risk_scores(
        29.0,
        72,
        73,
        7.2,
        "Soybean",
        "Flowering",
    )
    assert "73% rain probability" in result.advisory_summary
    assert "below 15 km/h is suitable" not in result.guidance.spraying_advice


def test_live_weather_falls_back_to_clearly_labelled_demo_when_forecast_is_missing(monkeypatch):
    service = WeatherService()
    service.api_key = "test-api-key"

    class FakeResponse:
        def __init__(self, payload):
            self.payload = payload

        def raise_for_status(self):
            return None

        def json(self):
            return self.payload

    class FakeClient:
        def __init__(self, timeout):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        def get(self, url):
            if "/forecast?" in url:
                return FakeResponse({"list": []})
            return FakeResponse(
                {
                    "dt": 0,
                    "main": {"temp": 29.0, "feels_like": 31.0, "humidity": 72},
                    "wind": {"speed": 2.0},
                    "weather": [{"description": "light rain"}],
                }
            )

    monkeypatch.setattr(
        "app.services.weather.weather_service.httpx.Client",
        FakeClient,
    )

    result = service.get_weather()

    assert result.is_demo is True
    assert "DEMO DATA" in result.data_source_label


def test_demo_weather_discloses_simulation_and_avoids_specific_spray_or_irrigation_schedule():
    result = WeatherService()._get_demo_weather(
        location="Akola",
        district="Akola",
        state="Maharashtra",
        crop_context="Soybean",
        growth_stage_context="Flowering",
    )

    assert result.is_demo is True
    assert "DEMO DATA" in result.data_source_label
    assert "not current local observations" in result.advisory_summary
    assert "Check root-zone soil moisture" in result.guidance.irrigation_advice
    assert "cannot identify a safe spraying window" in result.guidance.spraying_advice
    assert all("Demo data only" in action or "Inspect several" in action or "Check actual" in action
               for action in result.recommended_actions)


def test_production_weather_uses_live_open_meteo_without_api_key(monkeypatch):
    monkeypatch.setattr(settings, "DEMO_DATA_ENABLED", False)
    current_time = datetime.now(ZoneInfo("Asia/Kolkata")).replace(
        minute=0,
        second=0,
        microsecond=0,
    )
    forecast = {
        "current": {
            "time": current_time.isoformat(),
            "temperature_2m": 29.0,
            "relative_humidity_2m": 72,
            "apparent_temperature": 31.0,
            "precipitation": 0.0,
            "weather_code": 3,
            "wind_speed_10m": 7.2,
        },
        "hourly": {
            "time": [(current_time + timedelta(hours=i)).isoformat() for i in range(24)],
            "precipitation_probability": [15, 20, 73, 10] + [0] * 20,
        },
        "daily": {
            "time": [
                (current_time.date() + timedelta(days=i)).isoformat()
                for i in range(6)
            ],
            "weather_code": [3] * 6,
            "temperature_2m_max": [30.0] * 6,
            "temperature_2m_min": [20.0] * 6,
            "precipitation_probability_max": [20] * 6,
        },
    }

    class FakeResponse:
        def __init__(self, payload):
            self.payload = payload

        def raise_for_status(self):
            return None

        def json(self):
            return self.payload

    class FakeClient:
        def __init__(self, timeout):
            assert timeout == 10.0

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        def get(self, url, params, headers=None):
            if "geocoding" in url:
                return FakeResponse({
                    "results": [{
                        "name": "Akola",
                        "admin1": "Maharashtra",
                        "country_code": "IN",
                        "latitude": 20.7,
                        "longitude": 77.0,
                    }]
                })
            return FakeResponse(forecast)

    monkeypatch.setattr(
        "app.services.weather.weather_service.httpx.Client",
        FakeClient,
    )
    result = WeatherService().get_weather(
        location="Akola, Maharashtra",
        district="Akola",
    )

    assert isinstance(result, WeatherResponse)
    assert result.is_demo is False
    assert result.data_source_label == "Open-Meteo Live Forecast"
    assert result.rainfall_prob_pct == 73
    assert len(result.forecast) == 5


def test_production_weather_reports_provider_outage_instead_of_demo(monkeypatch):
    monkeypatch.setattr(settings, "DEMO_DATA_ENABLED", False)

    class FailedClient:
        def __init__(self, timeout):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        def get(self, url, params, headers=None):
            raise httpx.ConnectError("offline")

    monkeypatch.setattr(
        "app.services.weather.weather_service.httpx.Client",
        FailedClient,
    )

    with pytest.raises(HTTPException) as error:
        WeatherService().get_weather()

    assert error.value.status_code == 503
    assert "temporarily unavailable" in error.value.detail
