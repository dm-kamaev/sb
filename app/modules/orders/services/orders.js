'use strict';

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');

exports.createPay = function(sberUserUserFundId, amount) {
    return await(sequelize.models.Orders.create({
        sberUserUserFundId,
        amount,
    }));
};