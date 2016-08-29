'use strict';

const config = require('../../../../config/config.json');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const entityService = require('../../entity/services/entityService');
const userFundService = require('../../userFund/services/userFundService');
const sberAcquiring = require('../../sberAcquiring/services/sberAcquiring.js');
const mailService = require('../../auth/services/mailService.js');
const errors = require('../../../components/errors');
const orderStatus = require('../enums/orderStatus');
const os = require('os');
const i18n = require('../../../components/i18n');
const moment  = require('moment');
const _ = require('lodash');

const userConfig = require('../../../../config/user-config/config');
const axios = require('axios').create({
    baseURL: `http://${userConfig.host}:${userConfig.port}`
});


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
 * get authId
 * @param  {[int]} userFundSubscriptionId
 * @return {[type]}
 */
OrderService.getSberUser = function(userFundSubscriptionId) {
    var res = await(sequelize.models.Order.findOne({
        where: {
            userFundSubscriptionId
        },
        include: [{
            model: sequelize.models.UserFundSubsription,
            as: 'userFundSubscription',
            include: [{
                model: sequelize.models.SberUser,
                as: 'sberUser',
            }]
        }]
    }));
    // TODO: Add handler for error
    // return res.userFundSubscription.dataValues.sberUser.dataValues.authId;
    return res.userFundSubscription.sberUser;
};


/**
 * update info in Orders(table) for order
 * @param  {[int]}  sberAcquOrderNumber
 * @param  {[obj]}  data
 * @return {[type]}
 */
OrderService.updateInfo = function(sberAcquOrderNumber, data) {
    return await (sequelize.models.Order.update(data, {
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
        if (!entities.length) {
            throw new errors.HttpError(i18n.__('UserFund is empty'), 400);
        }
        var res = getListDirectionTopicFunds_(entities),
            listDirectionsTopicsFunds = res.listDirectionsTopicsFunds,
            listFunds = res.listFunds;

        var start = new Date();
        entities.map(entity => Object.assign(entity, {
                uncovered: false,
                fund: entity.fund.map(fund => Object.assign(fund, {
                    uncovered: true,
                    parentId: entity.id
                }))
            }))
        console.log(new Date() - start);

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
            responceSberAcqu = sberAcquiring.firstPay({
                orderNumber: sberAcquOrderNumber,
                amount: params.amount,
                returnUrl: `http://${os.hostname()}:${config.port}/#success?app=${params.isCordova}`,
                failUrl: `http://${os.hostname()}:${config.port}/#failure?app=${params.isCordova}`,
                language: 'ru',
                clientId: params.sberUserId,
            });
        } catch (err) {
            await(OrderService.updateInfo(sberAcquOrderNumber, {
                  status: orderStatus.EQ_ORDER_NOT_CREATED
              })
            );
            var textError = i18n.__(
                'Failed connection with sberbank acquiring (first pay). {{error}}',
                { error: JSON.stringify(err) }
            );
            throw new errors.AcquiringError(textError);
        }

        return handlerResponceSberAcqu_(
            sberAcquOrderNumber, responceSberAcqu
        );
    } else {
        return {
            message: i18n.__('You changed the monthly payment amount.')
        };
    }
}


OrderService.isAvalibleForPayment = function(order) {
    return order.status === orderStatus.WAITING_FOR_PAY;
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

    await (OrderService.updateInfo(sberAcquOrderNumber, {
        sberAcquErrorCode: eqOrderStatus.errorCode,
        sberAcquErrorMessage: eqOrderStatus.errorMessage,
        sberAcquActionCode: eqOrderStatus.actionCode,
        sberAcquActionCodeDescription: eqOrderStatus.actionCodeDescription,
        status: eqOrderStatus.actionCode === 0 ? orderStatus.PAID : orderStatus.FAILED
    }));

    return eqOrderStatus;
};

OrderService.isSuccessful = function(sberAcquiringOrderStatus) {
    return sberAcquiringOrderStatus.actionCode === 0;
}

function getAcquiringOrderStatus_(order) {
  try {
      return sberAcquiring.getStatusAndGetBind({
          sberAcquOrderNumber: order.sberAcquOrderNumber,
          orderId: order.sberAcquOrderId,
          clientId: order.userFundSubscription.sberUser.id
      });
  } catch (err) {
      await (OrderService.updateInfo(order.sberAcquOrderNumber, {
          status: orderStatus.WAITING_FOR_PAY
      }));
      var textError = i18n.__(
          'Failed connection with sberbank acquiring (get order status). {{error}}',
          { error: JSON.stringify(err) }
      );
      throw new errors.AcquiringError(textError);
  }
}


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
        var entity = entities[i].dataValues,
            type = entity.type;
        listDirectionsTopicsFunds.push([type, entity.title]);
        if (type === 'direction' || type === 'topic') {
            listFunds = listFunds.concat(await (entityService.getListFundsName(entity.id)));
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
        const ourErrorMessage = i18n.__('Unknown response from Sberbank acquiring');
        var errorCode = responceSberAcqu.errorCode || ourErrorCode,
            errorMessage = responceSberAcqu.errorMessage || ourErrorMessage;
        var data = {
            sberAcquErrorCode: errorCode,
            sberAcquErrorMessage: errorMessage,
            status: orderStatus.EQ_ORDER_NOT_CREATED
        };
        await (OrderService.updateInfo(sberAcquOrderNumber, data));
        var textError = i18n.__(
            "Failed create order in Sberbank acquiring. "+
            "errorCode: '{{errorCode}}', errorMessage: '{{errorMessage}}'",{
                errorCode,
                errorMessage
             });
        throw new errors.HttpError(textError, 503);
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
        status: data.status,
        // orderItems:
    }));
}


/**
 * [getListDatesBefore description]
 * @param  {[digit]}  NumberDays number days before "date"
 * @param  {[string]} date       opitonal
 * @return {[array]}            [ '2016-02-29', '2016-02-28','2016-02-27', '2016-02-26', '2016-02-25', '2016-02-24' ]
 */
OrderService.getListDatesBefore = function (NumberDays, date) {
    var dates = [];
    var now = (date) ? moment(date) : moment();

    dates.push(now.format('YYYY-MM-DD'));
    for (var i = 0; i < NumberDays; i++) {
        now = now.subtract(1, 'day');
        dates.push(now.format('YYYY-MM-DD'));
    }
    return dates;
};


/**
 * if last day in month then push '28', '30', '31'
 * @param  {[aarray]} allDates [ '2016-02-29', '2016-02-28','2016-02-27', '2016-02-26', '2016-02-25', '2016-02-24' ]
 * @param  {[string]} date     '2016-02-29'
 * @return {[array]}          ['29', '28','27', ... ]
 */
OrderService.getMissingDays = function (allDates, date) {
    var formatLastDayMonth = moment(date).endOf('month').format('YYYY-MM-DD');
    var dateObjTime = moment(date);
    if (dateObjTime.format('YYYY-MM-DD') === formatLastDayMonth) {
        var dd = formatLastDayMonth.replace(/^\d{4}-\d{2}-/, '');
        var digitLastDay = parseInt(dd, 10),
            diff = 31 - digitLastDay;
        if (diff) {
            for (var i = diff; i >= 1; i--) {
              allDates.push((digitLastDay+i).toString());
            }
        }
    }
    allDates.push(dateObjTime.format('DD'));
};


OrderService.makeMonthlyPayment = function(params) {
    return;
    //TODO
    var payment = sberAcquiring.createPayByBind(params);

}


OrderService.getMissingDays = function (allDates, date) {
    var formatLastDayMonth = moment(date).endOf('month').format('YYYY-MM-DD');
    var dateObjTime = moment(date);
    if (dateObjTime.format('YYYY-MM-DD') === formatLastDayMonth) {
        var dd = formatLastDayMonth.replace(/^\d{4}-\d{2}-/, '');
        var digitLastDay = parseInt(dd, 10),
            diff = 31 - digitLastDay;
        if (diff) {
            for (var i = diff; i >= 1; i--) {
              allDates.push((digitLastDay+i).toString());
            }
        }
    }
    allDates.push(dateObjTime.format('DD'));
};


/**
 * find orders with status "problemWithCard" in previous month
 * @param  {[int]} userFundSubscriptionId
 * @return {[type]}
 */
OrderService.findOrderWithProblemWithCardInPreviousMonth = function (userFundSubscriptionId) {
    var previousMonth = moment().subtract(1, 'month').format('YYYY-MM');
    return await(sequelize.models.Order.findAll({
            where: {
                userFundSubscriptionId,
                status: orderStatus.PROBLEM_WITH_CARD
             }
        }).filter(function(order) {
            var orderMonth = moment(order.updatedAt).format('YYYY-MM');
            if (previousMonth === orderMonth) { return true; }
            return false;
        })
    );
};


/**
 * if payment failed
 * @param  {[int]} sberAcquOrderNumber
 * @param  {[int]} userFundSubscriptionId
 * @param  {[str]} error                   text from sberbank accuring
 * @return {[type]}
 */
OrderService.failedReccurentPayment = function (sberAcquOrderNumber, userFundSubscriptionId, error) {
    await(OrderService.updateInfo(sberAcquOrderNumber, {
        status: orderStatus.PROBLEM_WITH_CARD
    }));
    var problemOrderInPreviousMonth = await(
        OrderService.findOrderWithProblemWithCardInPreviousMonth(userFundSubscriptionId)
    );

    var sberUser   = await(OrderService.getSberUser(userFundSubscriptionId)),
        sberUserId = sberUser.id,
        authId     = sberUser.authId;

    var userEmail = restGetUserData_(authId).email;
    if (!userEmail) { throw new errors.NotFoundError('email', authId); }
    console.log('userEmail', userEmail, 'authId', authId, 'sberUserId', sberUserId);

    // sberAcquOrderNumber 464
    // !!! NEXT LINE COMMENT ON PRODUCTION
    // problemOrderInPreviousMonth.length = 0;

    var data = '';
    // this is the first time the payment failed
    if (!problemOrderInPreviousMonth.length) {
        data = i18n.__(
            'Money is not written off, check your card. {{error}}', {
            error
        });
        mailService.sendUserRecurrentPayments(
            userEmail, { data }
        );
    // this is the second time the payment failed
    } else {
        data = i18n.__(
            'Money is not written off(for the second month in a row), check your card, '+
            'write-downs will be no more. {{error}}', {
            error
        });
        mailService.sendUserRecurrentPayments(
            userEmail, { data }
        );

        // TODO: get all user subscription and turn off their
        // then get list user fund which haven't subscribers and disable their
        // and send email owner

        // turn off subscription for current id
        await(userFundService.updateUserFundSubscription(userFundSubscriptionId, {
            enabled:false,
        }));

        // TESTING: if subscribers left then turn off userFund
        disableUserFunds_([74, 73]);
        sendEmailOwnerUserFund_([74, 73]);
    }
    // console.log('LEN===', problemOrderInPreviousMonth.length, problemOrderInPreviousMonth);    // был ли платеж в прошлом месяце в статусе  orderStatus.PROBLEM_WITH_CARD
};
// async(() => {
//     OrderService.failedReccurentPayment(465, 10, 'Денег нет');
// })();


/**
 * @param  {[array]} listUserFundId [74, 73]
 * @return {[type]}
 */
function disableUserFunds_ (listUserFundId) {
    listUserFundId.forEach(function(userFundId) {
        await(userFundService.updateUserFund(userFundId, {
            enabled:false
        }));
    });
}
// async(() => {
//     disableUserFunds_([74, 73]);
// })();


/**
 * send email to author UserFund
 * @param  {[array]} listUserFundId [74, 73]
 * @return {[type]}
 */
function sendEmailOwnerUserFund_ (listUserFundId) {
    listUserFundId.map((userFundId) => {
        return await(userFundService.getUserFundWithSberUser(userFundId)).owner.authId;
    }).map((authId) => {
        return restGetUserData_(authId).email;
    }).forEach((userEmail) => {
        if (!userEmail) { return; }
        var data = i18n.__(
            'Your User Fund deactivated.'
        );
        mailService.sendUserRecurrentPayments(
            userEmail, { data }
        );
    });
}
// async(() => {
//     sendEmailOwnerUserFund_([74, 73]);
// })();


/**
 * HTTP request for get user data
 * @param  {[int]} authId
 * @return {[obj]}
 */
function restGetUserData_ (authId) {
    var resp  = await(axios.get(`/user/${authId}`));
    return resp.data || {};
}

module.exports = OrderService;
