'use strict';

class MicroServiceError extends Error {
    /**
     * @constructor
     * @param {Object[]} validationErrors
     */
    constructor(error) {
        super('MicroService Error');

        this.name = 'MicroServiceError';
        this.microServiceErrors = error;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = MicroServiceError;
