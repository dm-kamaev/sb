'use strict';

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');


exports.insertPay = function(SberUserUserFundId, amount, listDirTopicFunds, listFunds, fundInfo) {
    return await(sequelize.models.Order.create({
        SberUserUserFundId,
        amount,
        listDirTopicFunds,
        listFunds,
        fundInfo,
    }));
};


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


function updateInfo (orderNumber, data) {
    return await(sequelize.models.Order.update(data, {
        where: {
            orderNumber,
        }
    }));
}
exports.updateInfo = updateInfo;


exports.handlerResponceSberAcqu = function (orderNumber, responceSberAcqu) {
    if (responceSberAcqu.orderId && responceSberAcqu.formUrl) {
        // TODO: save orderId
        // TODO: redirect
        return responceSberAcqu;
    } else {
        var errorCode    = responceSberAcqu.errorCode    || '100', // "100"(our code not sberbank) if sberbank acquiring is changed key's name in responce object
            errorMessage = responceSberAcqu.errorMessage || 'Неизвестный ответ от Сбербанк эквайринг';
        var res = { errorCode, errorMessage };
        await(updateInfo(orderNumber, res));
        return res;
    }
};