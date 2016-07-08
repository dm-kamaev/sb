'use strict';

const userService = require('../../../modules/user/services/userService');
const errors = require('../../errors');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

module.exports = async(function(req, res, next) {
    if (req.isAuthenticated()) return next();
    var anonSberUser = await(userService.createSberUser(null));
    await(req.login(anonSberUser, (err) => {
        if (err) throw new errors.HttpError(err.message, 400);
        next();
    }));
});
