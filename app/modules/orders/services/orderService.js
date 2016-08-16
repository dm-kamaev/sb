'use strict';

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const entityService = require('../../entity/services/entityService');


/**
 * create order in our base
 * @param  {[int]}      data.SberUserUserFundId
 * @param  {[int]}      data.amount
 * @param  {[array]}    data.directionsTopicsFunds [ [ 'fund', 'МОЙ ФОНД' ], [ 'topic', 'Рак крови' ] ]
 * @param  {[array]}    data.funds [ 'МОЙ ФОНД', 'ПОДАРИ ЖИЗНь', 'МОЙ ФОНД' ]
 * @param  {[array]}    data.fundInfo  [ entities as in database ]
 * @return {[object]}   [ get id insert ]
 */
exports.insertPay = function(data) {
    return await(sequelize.models.Order.create({
        SberUserUserFundId: data.SberUserUserFundId,
        amount: data.amount,
        directionsTopicsFunds: data.listDirectionsTopicsFunds,
        funds: data.listFunds,
        fundInfo: data.fundInfo,
        status: data.status
    }));
};


exports.getOrderWithInludes = function(sberAcquOrderNumber) {
    return await(sequelize.models.Order.findOne({
        where: {
            sberAcquOrderNumber
        },
        include: [{
            model: sequelize.models.SberUserUserFund,
            as: 'sberUserUserFund',
            include: [{
                model: sequelize.models.SberUser,
                as: 'sberUser',
                include: {
                    model: sequelize.models.UserFund,
                    as: 'userFund'
                }
            }, {
                model: sequelize.models.DesiredAmountHistory,
                as: 'currentAmount'
            }, {
                model: sequelize.models.UserFund,
                as: 'userFund'
            }]
        }]
    }));
};


exports.updateInfo = function(sberAcquOrderNumber, data) {
    return await(sequelize.models.Order.update(data, {
        where: {
            sberAcquOrderNumber,
        }
    }));
};


/**
 * get array with Direction,Topic,Funds and array with funds, where
 * Direction,Topic convert to Funds
 * @param  {[array]} entities [description]
 * @return [ [ 'fund', 'МОЙ ФОНД' ], [ 'topic', 'Рак крови' ] ] [ 'МОЙ ФОНД', 'ПОДАРИ ЖИЗНь', 'МОЙ ФОНД' ]
 */
exports.getListDirectionTopicFunds = function(entities) {
    var listDirectionsTopicsFunds = [], listFunds = [];
    for (var i = 0, l = entities.length; i < l; i++) {
        var entity = entities[i].dataValues, type = entity.type;
        listDirectionsTopicsFunds.push([type, entity.title]);
        if (type === 'direction' || type === 'topic') {
            listFunds = listFunds.concat(await(entityService.getListFundsName(entity.id)));
        } else {
            listFunds.push(entity.title);
        }
    }
    return [ listDirectionsTopicsFunds, listFunds ];
};


exports.handlerResponceSberAcqu = function(sberAcquOrderNumber, responceSberAcqu) {
    if (responceSberAcqu.orderId && responceSberAcqu.formUrl) {
        await(
            exports.updateInfo(sberAcquOrderNumber, {
                sberAcquOrderId: responceSberAcqu.orderId,
                status: 'waitingForPay'
            })
        );
        return responceSberAcqu;
    } else {
        const ourErrorCode = '100'; // "100"(our code not sberbank) if sberbank acquiring is changed key's name in responce object
        const ourErrorMessage = 'Неизвестный ответ от Сбербанк эквайринг';
        var errorCode = responceSberAcqu.errorCode || ourErrorCode,
            errorMessage = responceSberAcqu.errorMessage || ourErrorMessage;
        var data = {
            sberAcquErrorCode: errorCode,
            sberAcquErrorMessage: errorMessage,
            status: 'eqOrderNotCreated'
        };
        await(exports.updateInfo(sberAcquOrderNumber, data));
        return { errorCode, errorMessage };
    }
};
