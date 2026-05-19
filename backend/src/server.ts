import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import { requestLogger } from './middleware/loggerMiddleware';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';

// Import Routes
import systemRoutes from './routes/systemRoutes';
import hazardRoutes from './routes/hazardRoutes';
import weatherRoutes from './routes/weather';
import alertRoutes from './routes/alertRoutes';
import aiRoutes from './routes/aiRoutes';
import routeRoutes from './routes/routeRoutes';
import shelterRoutes from './routes/shelterRoutes';
import socialRoutes from './routes/social';
import signalRoutes from './routes/signals';
import sentinelRoutes from './routes/sentinel';
import geminiRoutes from './routes/gemini';
import confidenceRoutes from './routes/confidence';
import analystRoutes from './routes/analyst';
import { getHealth } from './controllers/systemController';

// Initialize Express App
const app = express();

// Global Middleware
app.use(cors({ origin: ENV.CORS_ORIGIN }));
app.use(express.json());
app.use(requestLogger);

// API Routes
app.get('/api/health', getHealth);
app.use('/api/system', systemRoutes);
app.use('/health', systemRoutes); // Aliased for load balancers
app.use('/api/hazards', hazardRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/sentinel', sentinelRoutes);
app.use('/api/gemini-analysis', geminiRoutes);
app.use('/api/system/confidence', confidenceRoutes);
app.use('/api/ai/analyst', analystRoutes);
app.use('/api/confidence-score', confidenceRoutes);
app.use('/api/analyst', analystRoutes);

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
const PORT = Number(ENV.PORT || 5000);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=========================================`);
  console.log(`🚀 ResiliNetAI Backend Operational`);
  console.log(`📍 Port: ${PORT} (bound to 0.0.0.0)`);
  console.log(`🌍 Environment: ${ENV.NODE_ENV}`);
  console.log(`=========================================\n`);
});

export default app;
