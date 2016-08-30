'use strict';

const i18n = require('../i18n');

module.exports = class StatusError extends Error {
    /**
     * @constructor
     * @param {String} currentStatus current Status
     * @param {String} status new status
     */
    constructor(currentStatus, status) {
        super(i18n.__('Wrong status: {{status}}. CurrentStatus: {{currentStatus}}', {
            status,
            currentStatus
        }));

        this.name = 'StatusError';
        Error.captureStackTrace(this, this.constructor);
    }
};
