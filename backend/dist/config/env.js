"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
exports.ENV = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GOOGLE_MAPS_BACKEND_KEY: process.env.GOOGLE_MAPS_BACKEND_KEY,
    WEATHER_API_KEY: process.env.WEATHER_API_KEY,
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
    API_SECRET: process.env.API_SECRET,
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};
// Simple validation to ensure critical keys are present
const requiredKeys = ['FIREBASE_SERVICE_ACCOUNT_PATH'];
requiredKeys.forEach((key) => {
    if (!process.env[key]) {
        console.warn(`[Config] WARNING: Missing critical environment variable: ${key}`);
    }
});
