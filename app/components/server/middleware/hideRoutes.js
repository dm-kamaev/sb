'use strict';

const NotFoundError = require('../../errors/NotFoundError');
const NODE_ENV = process.env.NODE_ENV;

module.exports = function(req, res, next) {
    if (NODE_ENV == 'development') next()
    else throw new NotFoundError('Not Found');
}
