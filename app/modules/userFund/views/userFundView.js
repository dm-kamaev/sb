'use strict';

exports.renderUserFund = function(userFund) {
    return {
        id: userFund.id,
        title: userFund.title,
        description: userFund.escription,
        members: userFund.members,
        owner: userFund.owner,
        createdAt: userFund.createdAt,
        updatedAt: userFund.updatedAt
    };
};

exports.renderUserFunds = function(userFunds) {
    return userFunds.map(exports.renderUserFund);
};
