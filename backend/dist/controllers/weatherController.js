"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentWeather = void 0;
const weatherService_ts_1 = require("../services/weatherService.ts");
const getCurrentWeather = async (req, res) => {
    const coords = {
        latitude: Number(req.query.lat) || 0,
        longitude: Number(req.query.lng) || 0
    };
    const weatherPayload = await weatherService_ts_1.WeatherService.getLocalWeather(coords);
    // Return the specific structured JSON exactly as requested
    res.json(weatherPayload);
};
exports.getCurrentWeather = getCurrentWeather;
