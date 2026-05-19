"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateShelter = exports.createShelter = exports.getNearbyShelters = exports.getShelters = void 0;
const response_1 = require("@/utils/response");
const shelterService_1 = require("@/services/shelterService");
const getShelters = async (req, res) => {
    const shelters = await shelterService_1.ShelterService.getAllShelters();
    (0, response_1.sendSuccess)(res, shelters, 'Shelters retrieved successfully');
};
exports.getShelters = getShelters;
const getNearbyShelters = async (req, res) => {
    // Stub for geospatial queries (requires lat/lng in query)
    const shelters = await shelterService_1.ShelterService.getAllShelters();
    (0, response_1.sendSuccess)(res, shelters, 'Nearby shelters retrieved successfully');
};
exports.getNearbyShelters = getNearbyShelters;
const createShelter = async (req, res) => {
    const payload = req.body;
    const shelterId = await shelterService_1.ShelterService.createShelter(payload);
    (0, response_1.sendSuccess)(res, { shelterId }, 'Shelter registered successfully', 201);
};
exports.createShelter = createShelter;
const updateShelter = async (req, res) => {
    // Stub for updating shelter capacity/status
    (0, response_1.sendSuccess)(res, { id: req.params.id }, 'Shelter updated successfully');
};
exports.updateShelter = updateShelter;
