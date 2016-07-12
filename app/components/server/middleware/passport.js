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
        var sberUser = await(userService.findSberUserById(id));
        done(null, sberUser);
    } catch (e) {
        done(e, null);
    }
}));
