'use strict';

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const userService = require('../../user/services/userService');
const userFundService = require('../../userFund/services/userFundService');

var AuthService = {};


/**
 * if not exist sberUser then create id for him
 * if user authorized on another device (example phone) and create draft userFund
 * then set the user current draft userFund (example web-page)
 * @param  {[obj]} params { email, sessionUser }
 * @return {[int]}        sberUser
 */
AuthService.checkSberUserOrSetUserFund = function (params) {
    var email = params.email, sessionUser = params.sessionUser;
    var authUser = userService.findAuthUserByEmail(email),
        sberUser = userService.findSberUserByAuthId(authUser.id);

    if (!sberUser) {
        sberUser = sessionUser || userService.createSberUser(authUser.id);
        userService.setAuthId(sberUser.id, authUser.id);
    } else if (!sberUser.userFund.enabled &&
        sessionUser &&
        userFundService.countEntities(sessionUser.userFund.id)
    ) {
        userService.setUserFund(sessionUser.userFund.id, sberUser.userFund.id);
    }
    return sberUser;
};


AuthService.verifyUser = function(sberUserId) {
    return await (sequelize.models.SberUser.update({
        verified: true
    }, {
        where: {
            id: sberUserId,
            verified: false
        }
    }));
};
module.exports = AuthService;