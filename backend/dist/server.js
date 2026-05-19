"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("@/config/env");
const loggerMiddleware_1 = require("@/middleware/loggerMiddleware");
const errorMiddleware_1 = require("@/middleware/errorMiddleware");
// Import Routes
const systemRoutes_1 = __importDefault(require("@/routes/systemRoutes"));
const hazardRoutes_1 = __importDefault(require("@/routes/hazardRoutes"));
const weatherRoutes_1 = __importDefault(require("@/routes/weatherRoutes"));
const alertRoutes_1 = __importDefault(require("@/routes/alertRoutes"));
const aiRoutes_1 = __importDefault(require("@/routes/aiRoutes"));
const routeRoutes_1 = __importDefault(require("@/routes/routeRoutes"));
const shelterRoutes_1 = __importDefault(require("@/routes/shelterRoutes"));

// Initialize Express App
const app = (0, express_1.default)();

// Global Middleware - Overridden for production mobile support
app.use((0, cors_1.default)({ origin: "*" }));
app.use(express_1.default.json());
app.use(loggerMiddleware_1.requestLogger);

// API Routes
app.use('/api/system', systemRoutes_1.default);
app.use('/health', systemRoutes_1.default);
app.use('/api/hazards', hazardRoutes_1.default);
app.use('/api/weather', weatherRoutes_1.default);
app.use('/api/alerts', alertRoutes_1.default);
app.use('/api/ai', aiRoutes_1.default);
app.use('/api/routes', routeRoutes_1.default);
app.use('/api/shelters', shelterRoutes_1.default);

// Error Handling Middleware
app.use(errorMiddleware_1.notFoundHandler);
app.use(errorMiddleware_1.errorHandler);

// Start Server - Prioritizes cloud environment variable port
const PORT = process.env.PORT || env_1.ENV.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 ResiliNetAI Backend Operational`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: ${env_1.ENV.NODE_ENV || 'production'}`);
    console.log(`=========================================\n`);
});
exports.default = app;
