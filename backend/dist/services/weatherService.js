"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherService = void 0;
const env_1 = require("@/config/env");
class WeatherService {
    /**
     * Aggregates weather data for a specific location.
     */
    static async getLocalWeather(coords) {
        if (!env_1.ENV.WEATHER_API_KEY) {
            console.warn('[WeatherService] WEATHER_API_KEY missing. Returning mock data.');
            return { condition: 'Rain', severity: 'High' };
        }
        // Stub for actual OpenWeather/NOAA integration
        // const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${ENV.WEATHER_API_KEY}`;
        // const response = await axios.get(url);
        // return response.data;
        return { status: 'Operational', data: 'Weather stub' };
    }
}
exports.WeatherService = WeatherService;
