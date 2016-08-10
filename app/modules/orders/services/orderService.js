'use strict';

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');

exports.getOrderWithInludes = function(orderNumber) {
    return await(sequelize.models.Order.findOne({
        where: {
            orderNumber
        },
        include: [{
            model: sequelize.models.SberUserUserFund,
            as: 'sberUserUserFund',
            include: [{
                model: sequelize.models.SberUser,
                as: 'sberUser'
            },{
                model: sequelize.models.DesiredAmountHistory,
                as: 'currentAmount'
            }]
        }]
    }))
};

exports.createPay = function(SberUserUserFundId, amount, listDirTopicFunds, listFunds, entities) {
    return await(sequelize.models.Order.create({
        SberUserUserFundId,
        amount,
        listDirTopicFunds,
        listFunds,
        fundData: entities
    }));
};
