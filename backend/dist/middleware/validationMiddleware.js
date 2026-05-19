"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const response_1 = require("@/utils/response");
/**
 * Validates incoming requests against a provided Zod schema.
 */
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error && error.name === 'ZodError') {
                const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
                return (0, response_1.sendError)(res, error.errors, `Validation failed: ${message}`, 400);
            }
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
