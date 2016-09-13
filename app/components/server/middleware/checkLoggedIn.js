'use strict';
const errors = require('../../errors');

module.exports = function(req, res, next) {
    if (req.user && req.user.authId) throw new errors.HttpError('Already logged in', 400);
    next();
};
