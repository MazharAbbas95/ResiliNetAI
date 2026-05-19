"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeatherRisk = exports.getForecast = exports.getCurrentWeather = void 0;
const response_1 = require("@/utils/response");
const weatherService_1 = require("@/services/weatherService");
const getCurrentWeather = async (req, res) => {
    const coords = { latitude: Number(req.query.lat) || 0, longitude: Number(req.query.lng) || 0 };
    const weather = await weatherService_1.WeatherService.getLocalWeather(coords);
    (0, response_1.sendSuccess)(res, weather, 'Current weather retrieved');
};
exports.getCurrentWeather = getCurrentWeather;
const getForecast = async (req, res) => {
    // Stub for forecasting
    (0, response_1.sendSuccess)(res, { forecast: 'Heavy rain expected', precipitation: '40mm' }, 'Weather forecast retrieved');
};
exports.getForecast = getForecast;
const getWeatherRisk = async (req, res) => {
    // Stub for normalizing rainfall severity
    (0, response_1.sendSuccess)(res, { riskLevel: 'High', recommendation: 'Monitor local channels' }, 'Weather risk retrieved');
};
exports.getWeatherRisk = getWeatherRisk;
