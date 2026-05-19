"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAlert = exports.broadcastAlert = exports.sendAlert = exports.getActiveAlerts = exports.getAlerts = void 0;
const response_1 = require("@/utils/response");
const alertService_1 = require("@/services/alertService");
const firebaseAdmin_1 = require("@/config/firebaseAdmin");
const getAlerts = async (req, res) => {
    const snapshot = await firebaseAdmin_1.adminDb.collection('alerts').get();
    const alerts = snapshot.docs.map(doc => doc.data());
    (0, response_1.sendSuccess)(res, alerts, 'Alerts retrieved successfully');
};
exports.getAlerts = getAlerts;
const getActiveAlerts = async (req, res) => {
    const snapshot = await firebaseAdmin_1.adminDb.collection('alerts').where('status', '==', 'Active').get();
    const alerts = snapshot.docs.map(doc => doc.data());
    (0, response_1.sendSuccess)(res, alerts, 'Active alerts retrieved successfully');
};
exports.getActiveAlerts = getActiveAlerts;
const sendAlert = async (req, res) => {
    const payload = req.body;
    const alertId = await alertService_1.AlertService.processAndDispatchAlert(payload);
    (0, response_1.sendSuccess)(res, { alertId }, 'Alert sent successfully', 201);
};
exports.sendAlert = sendAlert;
const broadcastAlert = async (req, res) => {
    const payload = req.body;
    // Stub for mass-broadcasting (e.g. FCM push notifications)
    const alertId = await alertService_1.AlertService.processAndDispatchAlert({ ...payload, level: 'Critical' });
    (0, response_1.sendSuccess)(res, { alertId, broadcasted: true }, 'Alert broadcasted successfully', 201);
};
exports.broadcastAlert = broadcastAlert;
const removeAlert = async (req, res) => {
    const { id } = req.params;
    await firebaseAdmin_1.adminDb.collection('alerts').doc(id).delete();
    (0, response_1.sendSuccess)(res, { id }, 'Alert removed successfully');
};
exports.removeAlert = removeAlert;
