"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const response_ts_1 = require("../utils/response.ts");
const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.url}`, err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    (0, response_ts_1.sendError)(res, err, message, statusCode);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    console.warn(`[NotFound] ${req.method} ${req.originalUrl}`);
    const err = new Error('Route not found');
    // attach requested path for easier debugging (non-sensitive)
    err.requestedPath = req.originalUrl;
    (0, response_ts_1.sendError)(res, err, 'Route not found', 404);
};
exports.notFoundHandler = notFoundHandler;
