'use strict';

module.exports = class AcquiringError extends Error {
    constructor(message) {
        message = message || 'Error in Sberbank acquiring system'
        super(message)

        this.name = 'AcquiringError'
        Error.captureStackTrace(this, this.constructor)
    }
}
