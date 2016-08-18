'use strict';

const config = require('../../../../config/config.json');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const entityService = require('../../entity/services/entityService');
const userFundService = require('../../userFund/services/userFundService');
const sberAcquiring = require('../../sberAcquiring/services/sberAcquiring.js');


exports.getOrderWithInludes = function(sberAcquOrderNumber) {
    return await(sequelize.models.Order.findOne({
        where: {
            sberAcquOrderNumber
        },
        include: [{
            model: sequelize.models.UserFundSubsription,
            as: 'userFundSubscription',
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


/**
 * if first pay for user
 * then create order in our system and in sberbank acquring
 * else return message
 * @param  {[obj]}  {}
 * @return {[obj]}
 */
exports.firstPayOrSendMessage = function (params) {
    // if user with unconfirmed payment, then do first pay
    if (!params.currentCardId) {
        var entities = await(userFundService.getEntities(params.userFundId));
        var res = getListDirectionTopicFunds(entities),
            listDirectionsTopicsFunds = res.listDirectionsTopicsFunds,
            listFunds = res.listFunds;

        var data = {
            userFundSubscriptionId: params.userFundSubscriptionId,
            amount: params.amount,
            listDirectionsTopicsFunds,
            listFunds,
            fundInfo: entities,
            status: 'new'
        };
        var resInsert = await(insertPay(data));
        var sberAcquOrderNumber = resInsert.dataValues.sberAcquOrderNumber;

        var responceSberAcqu = await(sberAcquiring.firstPay({
            orderNumber: sberAcquOrderNumber,
            amount: params.amount,
            returnUrl: config.hostname + '#success',
            failUrl: config.hostname + '#failed',
            language: 'ru',
            clientId: params.sberUserId,
            jsonParams: JSON.stringify({
                recurringFrequency: '10',
                recurringExpiry: '21000101'
            }),
        }));
        return handlerResponceSberAcqu(
            sberAcquOrderNumber, responceSberAcqu
        );
    } else {
        return { message: 'Вы изменили сумму ежемесячного платежа.' };
    }
}


/**
 * create order in our base
 * @param  {[int]}      data.SberUserUserFundId
 * @param  {[int]}      data.amount
 * @param  {[array]}    data.directionsTopicsFunds [ [ 'fund', 'МОЙ ФОНД' ], [ 'topic', 'Рак крови' ] ]
 * @param  {[array]}    data.funds [ 'МОЙ ФОНД', 'ПОДАРИ ЖИЗНь', 'МОЙ ФОНД' ]
 * @param  {[array]}    data.fundInfo  [ entities as in database ]
 * @return {[object]}   [ get id insert ]
 */
function insertPay (data) {
    return await(sequelize.models.Order.create({
        userFundSubscriptionId: data.userFundSubscriptionId,
        amount: data.amount,
        directionsTopicsFunds: data.listDirectionsTopicsFunds,
        funds: data.listFunds,
        fundInfo: data.fundInfo,
        status: data.status
    }));
}


/**
 * update info in Orders(table) for order
 * @param  {[int]}  sberAcquOrderNumber
 * @param  {[obj]}  data
 * @return {[type]}
 */
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
 * @return {
 *           listDirectionsTopicsFunds: [ 'fund', 'МОЙ ФОНД' ], [ 'topic', 'Рак крови' ],
 *           listFunds:                 [ 'МОЙ ФОНД', 'ПОДАРИ ЖИЗНь', 'МОЙ ФОНД' ]
 *         }
 */
function getListDirectionTopicFunds (entities) {
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
    return { listDirectionsTopicsFunds, listFunds };
}


/**
 * study responce sberbank acquiring
 * @param  {[int]}  sberAcquOrderNumber
 * @param  {[obj]}  responceSberAcqu
 * @return {[obj]}  { orderId, formUrl } || { errorCode, errorMessage }
 */
function handlerResponceSberAcqu (sberAcquOrderNumber, responceSberAcqu) {
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
}