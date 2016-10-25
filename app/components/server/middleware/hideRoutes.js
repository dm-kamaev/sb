'use strict';

const NotFoundError = require('../../errors/NotFoundError');

module.exports = function(req, res, next) {
    if (process.env.NODE_ENV == 'development') next()
    else throw new NotFoundError('Not Found');
}
