"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    const response = {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, error, message = 'An error occurred', statusCode = 500) => {
    const response = {
        success: false,
        message,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(response);
};
exports.sendError = sendError;
