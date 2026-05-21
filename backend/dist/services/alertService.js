"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertService = void 0;
const firebaseService_ts_1 = require("./firebaseService.ts");
class AlertService {
    /**
     * Processes an incoming alert signal and dispatches it to the realtime database.
     */
    static async processAndDispatchAlert(payload) {
        console.log(`[AlertService] Processing Alert: ${payload.title}`);
        // Additional logic for notification fan-out can be added here
        return await firebaseService_ts_1.FirebaseService.createAlert(payload);
    }
}
exports.AlertService = AlertService;
