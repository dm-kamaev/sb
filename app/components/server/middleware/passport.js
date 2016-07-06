'use strict';

const passport = require('passport');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const userService = require('../../../modules/user/services/userService');

exports.init = passport.initialize();
exports.session = passport.session();

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(async(function(id, done) {
    try {
        var userData = await(userService.findAuthUserByAuthId(id));
        var sberUser = await(userService.findSberUserByAuthId(userData.id));
        userData.sberId = sberUser.id;
        done(null, userData);
    } catch (e) {
        done(e, null);
    }
}));
