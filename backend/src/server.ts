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
import healthRoutes from './routes/health.routes';
import pingRoutes from './routes/ping.routes';
import readinessRoutes from './routes/readinessRoutes';
import { runReadinessChecks } from './services/readinessService';

// Initialize Express App
const app = express();

// Global Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(requestLogger);

// API Routes
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);
app.use('/ping', pingRoutes);
app.use('/api/ping', pingRoutes);
app.use('/readiness', readinessRoutes);
app.use('/api/readiness', readinessRoutes);
app.use('/api/system', systemRoutes);
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

// Simple route discovery for debugging (non-production: safe info)
app.get('/routes', (req, res) => {
  try {
    // Inspect internal Express router stack
    // Note: this is for debugging only and intentionally lightweight
    const routes: Array<{ path: string; methods: string[] }> = [];
    // @ts-ignore
    app._router.stack.forEach((layer: any) => {
      if (layer.route && layer.route.path) {
        routes.push({ path: layer.route.path, methods: Object.keys(layer.route.methods) });
      }
    });

    res.status(200).json({ success: true, routes });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not enumerate routes' });
  }
});

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
const PORT = Number(process.env.PORT || ENV.PORT || 5000);

// Run quick startup diagnostics, but don't block server from listening.
(async () => {
  try {
    const diag = await runReadinessChecks();
    console.log('[SERVER] Startup Diagnostics:', diag);
  } catch (err) {
    console.error('[SERVER] Startup diagnostics failed', err);
  }
})();

app.listen(PORT, '0.0.0.0', () => {
  console.log('[SERVER] ResiliNet AI Backend Online');
  console.log('[SERVER] CORS Enabled');
  console.log('[SERVER] Frontend Connections Allowed');
  console.log('[SERVER] API Ready');
  console.log(`[SERVER] Environment: ${ENV.NODE_ENV}`);
  console.log(`[SERVER] Port: ${PORT}`);
  console.log('[SERVER] Health Route Ready: /health');
  console.log('[SERVER] Readiness Route Ready: /readiness');
});

export default app;
