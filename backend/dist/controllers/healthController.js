"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = void 0;
const response_1 = require("@/utils/response");
const firebaseAdmin_1 = require("@/config/firebaseAdmin");
const getHealth = async (req, res, next) => {
    try {
        let firebaseStatus = 'Disconnected';
        try {
            if (firebaseAdmin_1.adminDb) {
                // Quick ping to check admin connectivity
                await firebaseAdmin_1.adminDb.collection('system_ping').limit(1).get();
                firebaseStatus = 'Connected';
            }
        }
        catch (err) {
            console.warn('[HealthCheck] Firebase Admin ping failed:', err);
            firebaseStatus = 'Error';
        }
        (0, response_1.sendSuccess)(res, {
            status: 'OK',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            firebase: firebaseStatus,
            environment: process.env.NODE_ENV
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getHealth = getHealth;
