'use strict'

// author: dm-kamaev
// options for pgp-promise

const logger = require('../../app/components/logger/').getLogger('main');

module.exports = {
    // log error queries
    error(err, e) { logger.critical(e.query); }
};