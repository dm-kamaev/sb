'use strict';

exports.renderUserFund = function(userFund) {
    return {
        id: userFund.id,
        title: userFund.title,
        description: userFund.description,
        draft: userFund.draft,
        creatorId: userFund.creatorId,
        createdAt: userFund.createdAt,
        updatedAt: userFund.updatedAt
    };
};

exports.renderUserFunds = function(userFunds) {
    return userFunds.map(exports.renderUserFund);
};
