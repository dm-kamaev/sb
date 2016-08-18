'use strict';

module.exports = class StatusError extends Error {
    /**
     * @constructor
     * @param {String} currentStatus current Status
     * @param {String} status new status
     */
    constructor(currentStatus, status) {
        super(`Wrong status: ${status}. CurrentStatus: ${currentStatus}`);

        this.name = 'StatusError';
        Error.captureStackTrace(this, this.constructor);
    }
}
