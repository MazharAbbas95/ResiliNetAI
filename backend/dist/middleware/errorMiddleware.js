"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const response_1 = require("@/utils/response");
const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.url}`, err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    (0, response_1.sendError)(res, err, message, statusCode);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    (0, response_1.sendError)(res, new Error('Route not found'), 'Route not found', 404);
};
exports.notFoundHandler = notFoundHandler;
