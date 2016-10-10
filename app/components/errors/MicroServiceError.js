'use strict';

class MicroServiceError extends Error {
    /**
     * [constructor description]
     * @param  {[str]} error
     * @return {[type]}
     */
    constructor(error) {
        super('MicroServiceError');

        this.name = 'MicroServiceError';
        this.statusCode = 422;
        this.microServiceErrors = error;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = MicroServiceError;
