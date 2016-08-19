'use strict';

const config = require('../../../../config/config.json');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const entityService = require('../../entity/services/entityService');
const userFundService = require('../../userFund/services/userFundService');
const sberAcquiring = require('../../sberAcquiring/services/sberAcquiring.js');
const errors = require('../../../components/errors');
const orderStatus = require('../enums/orderStatus');
const os = require('os');

var OrderService = {};

OrderService.getOrderWithInludes = function(sberAcquOrderNumber) {
    return await (sequelize.models.Order.findOne({
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
 * update info in Orders(table) for order
 * @param  {[int]}  sberAcquOrderNumber
 * @param  {[obj]}  data
 * @return {[type]}
 */
OrderService.updateInfo = function(sberAcquOrderNumber, data) {
    return await(sequelize.models.Order.update(data, {
        where: {
            sberAcquOrderNumber,
        }
    }));
};

/**
 * if first pay for user
 * then create order in our system and in sberbank acquring
 * else return message
 * @param  {[obj]}  { userFundId, amount, userFundSubscriptionId, currentCardId, isCordova }
 * @return {[obj]}
 */
OrderService.firstPayOrSendMessage = function(params) {
    // if user with unconfirmed payment, then do first pay
    if (!params.currentCardId) {
        var entities = await (userFundService.getEntities(params.userFundId));
        var res = getListDirectionTopicFunds_(entities),
            listDirectionsTopicsFunds = res.listDirectionsTopicsFunds,
            listFunds = res.listFunds;
        // console.log('HERE','\n', listDirectionsTopicsFunds,'\n',listFunds);
        var data = {
            userFundSubscriptionId: params.userFundSubscriptionId,
            amount: params.amount,
            listDirectionsTopicsFunds,
            listFunds,
            fundInfo: entities,
            status: orderStatus.NEW
        };
        var resInsert = await (insertPay_(data));
        var sberAcquOrderNumber = resInsert.dataValues.sberAcquOrderNumber;

        var responceSberAcqu;
        try {
            responceSberAcqu = await(sberAcquiring.firstPay({
                orderNumber: sberAcquOrderNumber,
                amount: params.amount,
                returnUrl: `${os.hostname()}:3000/#success?app=${params.isCordova}`,
                failUrl: `${os.hostname()}:3000/#failed?app=${params.isCordova}`,
                language: 'ru',
                clientId: params.sberUserId,
                jsonParams: JSON.stringify({
                    recurringFrequency: '10',
                    recurringExpiry: '21000101'
                }),
            }));
        } catch (e) {
            await(OrderService.updateInfo(sberAcquOrderNumber, {
                  status: orderStatus.EQ_ORDER_NOT_CREATED
              })
            );
            // var error = handlerHttpError(e) || JSON.stringify(e);
            throw new errors.HttpError(
                'Failed connection with sberbank acquiring. Error: '+e,
                500
            );
        }

        return handlerResponceSberAcqu_(
            sberAcquOrderNumber, responceSberAcqu
        );
    } else {
        return {
            message: 'Вы изменили сумму ежемесячного платежа.'
        };
    }
}


/**
 * update info in Orders(table) for order
 * @param  {[int]}  sberAcquOrderNumber
 * @param  {[obj]}  data
 * @return {[type]}
 */
OrderService.updateInfo = function(sberAcquOrderNumber, data) {
    console.log(data);
    console.log(sberAcquOrderNumber);
    return await (sequelize.models.Order.update(data, {
        where: {
            sberAcquOrderNumber,
        }
    }));
};

OrderService.isAvalibleForPayment = function(order) {
    return order.status == orderStatus.WAITING_FOR_PAY;
};

OrderService.getAcquiringOrder = function(order) {
    var sberAcquOrderNumber = order.sberAcquOrderNumber;

    await (OrderService.updateInfo(sberAcquOrderNumber, {
        status: orderStatus.CONFIRMING_PAYMENT
    }));

    var paymentId = order.userFundSubscription.currentAmount.id,
        userFund = order.userFundSubscription.userFund,
        sberUser = order.userFundSubscription.sberUser;

    var eqOrderStatus = getAcquiringOrderStatus_(order)

    await(OrderService.updateInfo(sberAcquOrderNumber, {
        sberAcquErrorCode: eqOrderStatus.errorCode,
        sberAcquErrorMessage: eqOrderStatus.errorMessage,
        sberAcquActionCode: eqOrderStatus.actionCode,
        sberAcquActionCodeDescription: eqOrderStatus.actionCodeDescription,
        status: eqOrderStatus.actionCode == 0 ? orderStatus.PAID :
                                                    orderStatus.FAILED
    }));

    return eqOrderStatus;
};

OrderService.isSuccessful = function(sberAcquiringOrderStatus) {
    return sberAcquiringOrderStatus.actionCode == 0;
}

function getAcquiringOrderStatus_(order) {
  try {
      return await(sberAcquiring.getStatusAndGetBind({
          sberAcquOrderNumber: order.sberAcquOrderNumber,
          orderId: order.sberAcquOrderId,
          clientId: order.userFundSubscription.sberUser.id
      }));
  } catch (err) {
      throw err;
      await (OrderService.updateInfo(order.sberAcquOrderNumber, {
          status: orderStatus.WAITING_FOR_PAY
      }));
      throw new errors.AcquiringError('Failed to get order status');
  }
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
function getListDirectionTopicFunds_(entities) {
    var listDirectionsTopicsFunds = [],
        listFunds = [];
    for (var i = 0, l = entities.length; i < l; i++) {
        var entity = entities[i].dataValues, type = entity.type;
        console.log('ENTITY', entity.title, entity.type);
        listDirectionsTopicsFunds.push([type, entity.title]);
        if (type === 'direction' || type === 'topic') {
            console.log('NOT FUND', entity.title, entity.type);
            listFunds = listFunds.concat(await(entityService.getListFundsName(entity.id)));
        } else {
            listFunds.push(entity.title);
        }
    }
    return {
        listDirectionsTopicsFunds,
        listFunds
    };
}

/**
 * study responce sberbank acquiring
 * @param  {[int]}  sberAcquOrderNumber
 * @param  {[obj]}  responceSberAcqu
 * @return {[obj]}  { orderId, formUrl } || { errorCode, errorMessage }
 */
function handlerResponceSberAcqu_(sberAcquOrderNumber, responceSberAcqu) {
    if (responceSberAcqu.orderId && responceSberAcqu.formUrl) {
        await (
            OrderService.updateInfo(sberAcquOrderNumber, {
                sberAcquOrderId: responceSberAcqu.orderId,
                status: orderStatus.WAITING_FOR_PAY
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
            status: orderStatus.EQ_ORDER_NOT_CREATED
        };
        await (OrderService.updateInfo(sberAcquOrderNumber, data));
        return {
            errorCode,
            errorMessage
        };
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
function insertPay_(data) {
    return await (sequelize.models.Order.create({
        userFundSubscriptionId: data.userFundSubscriptionId,
        amount: data.amount,
        directionsTopicsFunds: data.listDirectionsTopicsFunds,
        funds: data.listFunds,
        fundInfo: data.fundInfo,
        status: data.status
    }));
}

module.exports = OrderService;
