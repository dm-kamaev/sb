
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var userService = require('../../../../modules/user/services/UserService.js');


module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(async(function(userId, done) {
        try {
            var userData = await(userService.getUser(userId));
            done(null, userData);
        } catch (e) {
            done(e, null);
        }
    }));
};
