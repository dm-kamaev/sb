'use strict';

class ValidationError extends Error {
    /**
     * @constructor
     * @param {Object[]} validationErrors
     */
    constructor(validationErrors) {
        super('Validation Error');

        this.name = 'ValidationError';
        this.statusCode = 422;
        this.validationErrors = validationErrors;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ValidationError;
