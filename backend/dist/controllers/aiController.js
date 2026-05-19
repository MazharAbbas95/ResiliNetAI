"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triangulateHazard = exports.getConfidence = exports.analyzeSituation = void 0;
const response_1 = require("@/utils/response");
const aiService_1 = require("@/services/aiService");
const analyzeSituation = async (req, res) => {
    const analysis = await aiService_1.AIService.analyzeSituation(req.body);
    (0, response_1.sendSuccess)(res, analysis, 'Situation analyzed successfully');
};
exports.analyzeSituation = analyzeSituation;
const getConfidence = async (req, res) => {
    // Stub for confidence scoring logic
    (0, response_1.sendSuccess)(res, { confidenceScore: 0.92, source: 'Sentinel-1' }, 'Confidence score calculated');
};
exports.getConfidence = getConfidence;
const triangulateHazard = async (req, res) => {
    // Stub for multi-source triangulation
    (0, response_1.sendSuccess)(res, { triangulatedPolygon: [], accuracy: 'High' }, 'Hazard triangulated successfully');
};
exports.triangulateHazard = triangulateHazard;
