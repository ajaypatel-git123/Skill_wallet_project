"""Weather service integrating Open-Meteo geocoding and forecast APIs."""

import logging
from typing import Any, Dict
import requests

logger = logging.getLogger(__name__)


def map_weather_code(code: int) -> str:
    """Map WMO weather code to a human-readable condition description."""
    if code == 0:
        return "Clear Sky"
    elif code in (1, 2):
        return "Partly Cloudy"
    elif code == 3:
        return "Overcast"
    elif code in (45, 48):
        return "Foggy"
    elif code in (51, 53, 55):
        return "Drizzle"
    elif code in (56, 57):
        return "Freezing Drizzle"
    elif code in (61, 63):
        return "Rain"
    elif code == 65:
        return "Heavy Rain"
    elif code in (66, 67):
        return "Freezing Rain"
    elif code in (71, 73, 75, 77):
        return "Snow"
    elif code in (80, 81):
        return "Rain Showers"
    elif code == 82:
        return "Violent Rain Showers"
    elif code in (85, 86):
        return "Snow Showers"
    elif code == 95:
        return "Thunderstorm"
    elif code in (96, 99):
        return "Thunderstorm with Hail"
    return "Partly Cloudy"


def get_weather(city: str) -> Dict[str, Any]:
    """Fetch current weather and rain probability for a given city name.

    Args:
        city: Name of the city (e.g. 'Mumbai', 'London', 'Dubai')

    Returns:
        Dict matching WeatherData schema:
        {
            'temperature': float,
            'rain_probability': float,
            'wind_speed': float,
            'condition': str
        }
    """
    default_weather = {
        "temperature": 25.0,
        "rain_probability": 10.0,
        "wind_speed": 10.0,
        "condition": "Partly Cloudy",
    }

    if not city or not city.strip():
        return default_weather

    try:
        # 1. Geocode city name to latitude and longitude
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city.strip()}&count=1"
        geo_resp = requests.get(geo_url, timeout=6)
        if geo_resp.status_code != 200:
            logger.warning(f"Geocoding failed for city '{city}' with status {geo_resp.status_code}")
            return default_weather

        geo_data = geo_resp.json()
        results = geo_data.get("results")
        if not results or len(results) == 0:
            logger.warning(f"No coordinates found for city '{city}'")
            return default_weather

        lat = results[0].get("latitude")
        lon = results[0].get("longitude")

        # 2. Fetch forecast data from Open-Meteo
        forecast_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current=temperature_2m,wind_speed_10m,weather_code&"
            f"daily=precipitation_probability_max&timezone=auto"
        )
        forecast_resp = requests.get(forecast_url, timeout=6)
        if forecast_resp.status_code != 200:
            logger.warning(f"Forecast API failed with status {forecast_resp.status_code}")
            return default_weather

        forecast_data = forecast_resp.json()
        current = forecast_data.get("current", {})
        daily = forecast_data.get("daily", {})

        temperature = float(current.get("temperature_2m", default_weather["temperature"]))
        wind_speed = float(current.get("wind_speed_10m", default_weather["wind_speed"]))
        weather_code = int(current.get("weather_code", 1))

        # Daily precipitation probability array
        precip_list = daily.get("precipitation_probability_max", [])
        rain_probability = float(precip_list[0]) if precip_list and len(precip_list) > 0 else default_weather["rain_probability"]

        condition = map_weather_code(weather_code)

        return {
            "temperature": round(temperature, 1),
            "rain_probability": round(rain_probability, 1),
            "wind_speed": round(wind_speed, 1),
            "condition": condition,
        }

    except Exception as exc:
        logger.error(f"Error fetching weather for '{city}': {exc}")
        return default_weather
