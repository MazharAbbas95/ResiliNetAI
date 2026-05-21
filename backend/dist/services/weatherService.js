"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
class WeatherService {
    /**
     * Aggregates weather data for a specific location.
     */
    static async getLocalWeather(coords) {
        const lat = coords.latitude;
        const lng = coords.longitude;
        // Default fallback structured payload
        const fallbackResponse = {
            location: { lat, lng },
            weather: {
                condition: 'Unknown',
                description: 'data unavailable',
                temperature: 0,
                humidity: 0,
                windSpeed: 0,
                rainfall: 0,
                cloudCoverage: 0
            },
            alerts: [],
            timestamp: Math.floor(Date.now() / 1000)
        };
        if (!env_1.ENV.OPENWEATHER_API_KEY || env_1.ENV.OPENWEATHER_API_KEY.includes('your_openweather')) {
            console.warn('[WeatherService] OPENWEATHER_API_KEY missing or placeholder. Returning mock data.');
            return {
                ...fallbackResponse,
                weather: {
                    condition: 'Rain',
                    description: 'moderate rain',
                    temperature: 28,
                    humidity: 87,
                    windSpeed: 14,
                    rainfall: 12.5,
                    cloudCoverage: 92
                },
                alerts: [
                    { event: 'Storm Warning', severity: 'moderate' }
                ]
            };
        }
        try {
            const url = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&APPID=${env_1.ENV.OPENWEATHER_API_KEY}`;
            const response = await axios_1.default.get(url);
            const data = response.data;
            const rainfall = data.rain ? (data.rain['1h'] || 0) : 0;
            // Basic alert mapping based on conditions
            const alerts = [];
            if (rainfall > 10 || data.wind?.speed > 20) {
                alerts.push({
                    event: 'Storm Warning',
                    severity: rainfall > 20 ? 'high' : 'moderate'
                });
            }
            return {
                location: {
                    lat: data.coord.lat,
                    lng: data.coord.lon
                },
                weather: {
                    condition: data.weather[0]?.main || 'Unknown',
                    description: data.weather[0]?.description || 'data unavailable',
                    temperature: Math.round(data.main?.temp || 0),
                    humidity: data.main?.humidity || 0,
                    windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // Convert m/s to km/h
                    rainfall: rainfall,
                    cloudCoverage: data.clouds?.all || 0
                },
                alerts,
                timestamp: data.dt || Math.floor(Date.now() / 1000)
            };
        }
        catch (error) {
            console.error('[WeatherService] Error fetching weather:', error);
            return fallbackResponse;
        }
    }
}
exports.WeatherService = WeatherService;
