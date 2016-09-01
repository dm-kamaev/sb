'use strict';
const userFundView = require('../../userFund/views/userFundView');

exports.renderUser = function(authUser, sberUser) {
    return {
        id: sberUser.id,
        email: authUser.email,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        userFund: sberUser.userFund ?
            userFundView.renderUserFund(sberUser.userFund) : null,
        loggedIn: !!sberUser.authId
    };
};
