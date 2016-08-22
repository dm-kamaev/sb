'use strict';

const i18n = require('../i18n');

module.exports = class AcquiringError extends Error {
    constructor(message) {
        message = message || i18n.__('Error in Sberbank acquiring system')
        super(message)

        this.name = 'AcquiringError'
        Error.captureStackTrace(this, this.constructor)
    }
}
