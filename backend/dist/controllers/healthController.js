"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackendHealth = void 0;
const getBackendHealth = async (req, res) => {
    try {
        const payload = {
            success: true,
            service: 'ResiliNet AI Backend',
            status: 'online',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
        };
        res.status(200).json(payload);
    }
    catch (error) {
        const response = {
            success: false,
            status: 'error',
            message: 'Health check failed',
            timestamp: new Date().toISOString(),
        };
        res.status(500).json(response);
    }
};
exports.getBackendHealth = getBackendHealth;
