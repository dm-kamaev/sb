'use strict';
const userFundView = require('../../userFund/views/userFundView');

exports.renderUser = function(authUser, sberUser) {
    return {
        id: sberUser.id,
        phone: authUser.phone,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        userFund: sberUser.userFund ?
            userFundView.renderUserFund(sberUser.userFund) : null
    };
};
