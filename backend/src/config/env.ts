import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const ENV = {
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
