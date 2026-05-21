"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRealtimeStatus = exports.getHealth = exports.getStatus = void 0;
const response_ts_1 = require("../utils/response.ts");
const firebaseAdmin_ts_1 = require("../config/firebaseAdmin.ts");
const getStatus = async (req, res) => {
    // Stub for overall system intelligence status
    (0, response_ts_1.sendSuccess)(res, { aiStatus: 'Operational', backend: 'Operational', db: 'Operational' }, 'System status retrieved');
};
exports.getStatus = getStatus;
const getHealth = async (req, res) => {
    let firebaseStatus = 'Disconnected';
    try {
        if (firebaseAdmin_ts_1.adminDb) {
            await firebaseAdmin_ts_1.adminDb.collection('system_ping').limit(1).get();
            firebaseStatus = 'Connected';
        }
    }
    catch (err) {
        firebaseStatus = 'Error';
    }
    (0, response_ts_1.sendSuccess)(res, {
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        firebase: firebaseStatus,
        environment: process.env.NODE_ENV
    }, 'System health retrieved');
};
exports.getHealth = getHealth;
const getRealtimeStatus = async (req, res) => {
    // Stub for pipeline metrics
    (0, response_ts_1.sendSuccess)(res, { activeStreams: 4, messagesPerSecond: 12 }, 'Realtime metrics retrieved');
};
exports.getRealtimeStatus = getRealtimeStatus;
