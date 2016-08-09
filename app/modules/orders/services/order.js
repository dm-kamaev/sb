'use strict';

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');


exports.createPay = function(SberUserUserFundId, amount, listDirTopicFunds, listFunds) {
    return await(sequelize.models.Order.create({
        SberUserUserFundId,
        amount,
        listDirTopicFunds,
        listFunds,
    }));
};