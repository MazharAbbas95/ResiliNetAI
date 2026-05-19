"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeHazard = exports.updateHazard = exports.createHazard = exports.getHazardById = exports.getActiveHazards = exports.getHazards = void 0;
const response_1 = require("@/utils/response");
const firebaseService_1 = require("@/services/firebaseService");
const firebaseAdmin_1 = require("@/config/firebaseAdmin");
const getHazards = async (req, res) => {
    const snapshot = await firebaseAdmin_1.adminDb.collection('hazards').get();
    const hazards = snapshot.docs.map(doc => doc.data());
    (0, response_1.sendSuccess)(res, hazards, 'Hazards retrieved successfully');
};
exports.getHazards = getHazards;
const getActiveHazards = async (req, res) => {
    const snapshot = await firebaseAdmin_1.adminDb.collection('hazards').where('isActive', '==', true).get();
    const hazards = snapshot.docs.map(doc => doc.data());
    (0, response_1.sendSuccess)(res, hazards, 'Active hazards retrieved successfully');
};
exports.getActiveHazards = getActiveHazards;
const getHazardById = async (req, res) => {
    const doc = await firebaseAdmin_1.adminDb.collection('hazards').doc(req.params.id).get();
    if (!doc.exists) {
        return (0, response_1.sendError)(res, null, 'Hazard not found', 404);
    }
    (0, response_1.sendSuccess)(res, doc.data(), 'Hazard retrieved successfully');
};
exports.getHazardById = getHazardById;
const createHazard = async (req, res) => {
    const payload = req.body;
    const hazardId = await firebaseService_1.FirebaseService.createHazard(payload);
    (0, response_1.sendSuccess)(res, { hazardId }, 'Hazard created successfully', 201);
};
exports.createHazard = createHazard;
const updateHazard = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    await firebaseAdmin_1.adminDb.collection('hazards').doc(id).update({
        ...updates,
        updatedAt: Date.now()
    });
    (0, response_1.sendSuccess)(res, { id }, 'Hazard updated successfully');
};
exports.updateHazard = updateHazard;
const removeHazard = async (req, res) => {
    const { id } = req.params;
    await firebaseAdmin_1.adminDb.collection('hazards').doc(id).delete();
    (0, response_1.sendSuccess)(res, { id }, 'Hazard removed successfully');
};
exports.removeHazard = removeHazard;
