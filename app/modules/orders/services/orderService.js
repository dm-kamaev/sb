'use strict';

const config = require('../../../../config/config.json');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const entityService = require('../../entity/services/entityService');
const userFundService = require('../../userFund/services/userFundService');
const sberAcquiring = require('../../sberAcquiring/services/sberAcquiring.js');
const mailService = require('../../auth/services/mailService.js');
const microService = require('../../micro/services/microService.js');
const errors = require('../../../components/errors');
const excel = require('../../../components/excel');
const orderStatus = require('../enums/orderStatus');
const orderTypes = require('../enums/orderTypes');
const os = require('os');
const i18n = require('../../../components/i18n');
const logger = require('../../../components/logger').getLogger('main');
const moment = require('moment');
const _ = require('lodash');


var OrderService = {};


/**
 * update orders by fields
 * @param  {[obj]} where
 * @param  {[obj]} data
 * @return {[type]}       [description]
 */
OrderService.update = function (where, data) {
    return await(sequelize.models.Order.update(data, { where }));
};


OrderService.getOrderWithInludes = function (sberAcquOrderNumber) {
    return await(sequelize.models.Order.findOne({
        where: {
            sberAcquOrderNumber
        },
        include: [{
            model: sequelize.models.UserFundSubscription,
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
OrderService.getSberUser = function (userFundSubscriptionId) {
    var res = await(sequelize.models.Order.findOne({
        where: {
            userFundSubscriptionId
        },
        include: [{
            model: sequelize.models.UserFundSubscription,
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
OrderService.updateInfo = function (sberAcquOrderNumber, data) {
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
OrderService.firstPayOrSendMessage = function (params) {
    // if user with unconfirmed payment, then do first pay
    var userFund = userFundService.getUserFundWithIncludes(params.userFundId)
    if (isEmptyUserFund_(userFund)) {
        throw new errors.HttpError(i18n.__('UserFund is empty'), 400);
    }

    if (!params.isActiveCard) {
        var data = {
            userFundSubscriptionId: params.userFundSubscriptionId,
            amount:                 params.amount,
            userFundSnapshot:       userFund,
            status:                 orderStatus.NEW,
            type:                   orderTypes.FIRST,
        };
        var sberAcquOrderNumber = OrderService.createOrder(data);
        var payDate = createPayDate_(params.userFundSubscriptionId, new Date());

        var responceSberAcqu;
        try {
            responceSberAcqu = sberAcquiring.firstPay({
                orderNumber: sberAcquOrderNumber,
                amount: params.amount,
                returnUrl: `${config.hostname}/#success?app=${params.isCordova}`,
                failUrl: `${config.hostname}/#failure?app=${params.isCordova}`,
                language: 'ru',
                clientId: params.sberUserId,
            });
        } catch (err) {
            await(OrderService.updateInfo(sberAcquOrderNumber, {
                status: orderStatus.EQ_ORDER_NOT_CREATED
            }));
            var textError = i18n.__(
                'Failed connection with sberbank acquiring (first pay). {{error}}', {
                    error: JSON.stringify(err)
                }
            );
            throw new errors.AcquiringError(textError);
        }

        return handlerResponceSberAcqu_(
            sberAcquOrderNumber, responceSberAcqu
        );
    } else {
        await(sequelize.models.UserFundSubscription.update({
            enabled: true
        }, {
            where: {
                id: params.userFundSubscriptionId
            }
        }))
        return {
            message: i18n.__('You changed the monthly payment amount.')
        };
    }
};


OrderService.isAvalibleForPayment = function (order) {
    return order.status === orderStatus.WAITING_FOR_PAY;
};

OrderService.getAcquiringOrder = function (order) {
    var sberAcquOrderNumber = order.sberAcquOrderNumber;

    await(OrderService.updateInfo(sberAcquOrderNumber, {
        status: orderStatus.CONFIRMING_PAYMENT
    }));

    var paymentId = order.userFundSubscription.currentAmount.id,
        userFund = order.userFundSubscription.userFund,
        sberUser = order.userFundSubscription.sberUser;

    var eqOrderStatus = getAcquiringOrderStatus_(order);

    await(OrderService.updateInfo(sberAcquOrderNumber, {
        sberAcquErrorCode: eqOrderStatus.errorCode,
        sberAcquErrorMessage: eqOrderStatus.errorMessage,
        sberAcquActionCode: eqOrderStatus.actionCode,
        sberAcquActionCodeDescription: eqOrderStatus.actionCodeDescription,
        status: eqOrderStatus.actionCode === 0 ? orderStatus.PAID : eqOrderStatus.actionCode === -100 ? orderStatus.WAITING_FOR_PAY : orderStatus.FAILED
    }));

    return eqOrderStatus;
};

OrderService.isSuccessful = function (sberAcquiringOrderStatus) {
    return sberAcquiringOrderStatus.actionCode === 0;
};

function getAcquiringOrderStatus_(order) {
    try {
        return sberAcquiring.getStatusAndGetBind({
            sberAcquOrderNumber: order.sberAcquOrderNumber,
            orderId: order.sberAcquOrderId,
            clientId: order.userFundSubscription.sberUser.id
        });
    } catch (err) {
        await(OrderService.updateInfo(order.sberAcquOrderNumber, {
            status: orderStatus.WAITING_FOR_PAY
        }));
        var textError = i18n.__(
            'Failed connection with sberbank acquiring (get order status). {{error}}', {
                error: JSON.stringify(err)
            }
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
        await(
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
        await(OrderService.updateInfo(sberAcquOrderNumber, data));
        var textError = i18n.__(
            'Failed create order in Sberbank acquiring. ' +
            'errorCode: \'{{errorCode}}\', errorMessage: \'{{errorMessage}}\'', {
                errorCode,
                errorMessage
            });
        throw new errors.HttpError(textError, 503);
    }
}

/**
 * create order in our base
 * @param  {[int]}      data.userFundSubscriptionId
 * @param  {[int]}      data.amount
 * @param  {userFund}    data.userFund  [ userFund with included entities ]
 * @return {[object]}   [ get id insert ]
 */
OrderService.createOrder = function (data) {
    return await(sequelize.sequelize.transaction(t => {
        return sequelize.models.Order.create({
                userFundSubscriptionId: data.userFundSubscriptionId,
                type: data.type,
                amount: data.amount,
                status: data.status,
                userFundSnapshot: data.userFundSnapshot,
                scheduledPayDate: data.scheduledPayDate
            })
    })).sberAcquOrderNumber;
};

function createPayDate_(subscriptionId, payDate) {
    return await(sequelize.models.PayDayHistory.create({
        subscriptionId,
        payDate
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
                allDates.push((digitLastDay + i).toString());
            }
        }
    }
    allDates.push(dateObjTime.format('DD'));
};


OrderService.makeMonthlyPayment = function (userFundSubscription, nowDate) {
    var userFund = userFundService.getUserFundWithIncludes(userFundSubscription.userFundId)

    if (!userFund.fund.length && !userFund.topic.length && !userFund.direction.length) {
        // this should never happened
        return;
    }

    const getScheduledDate = (realDate, payDate) => {
        return realDate.getDate() === payDate.getDate() ? realDate :
            realDate.getDate() > payDate.getDate() ?
            moment(realDate).set('date', payDate.getDate()).toDate() :
            moment(realDate).endOf('month').daysInMonth() === moment(realDate).toDate().getDate() ?
            moment(realDate).toDate() :
            moment(realDate).set('month', realDate.getMonth() - 1).daysInMonth() < payDate.getDate() ?
            moment(realDate).subtract(1, 'month').endOf('month').toDate() :
            moment(realDate).set({
                'month': realDate.getMonth() - 1,
                'date': payDate.getDate()
            }).toDate();
    };

    var payDate = userFundSubscription.payDate,
        //needs for unit testing
        realDate = nowDate || userFundSubscription.realDate,
        // realDate = new Date(2016, 8, 1),
        scheduledPayDate = getScheduledDate(realDate, payDate);

    console.log('scheduled: ', scheduledPayDate);
    console.log('payDate: ', payDate.getDate());
    console.log('now: ', realDate);

    var sberAcquOrderNumber = OrderService.createOrder({
        userFundSubscriptionId: userFundSubscription.userFundSubscriptionId,
        userFundSnapshot: userFund,
        amount: userFundSubscription.amount,
        type: orderTypes.RECURRENT,
        status: orderStatus.CONFIRMING_PAYMENT,
        scheduledPayDate
    });

    var sberAcquPayment = sberAcquiring.createPayByBind({
        amount: userFundSubscription.amount,
        sberAcquOrderNumber,
        clientId: userFundSubscription.sberUserId
    });

    if (sberAcquPayment.errorCode) {
        throw new errors.AcquiringError(sberAcquPayment.errorMessage);
    }
    console.log(sberAcquPayment);

    var paymentResultResponse = sberAcquiring.payByBind({
        orderId: sberAcquPayment.orderId,
        bindingId: userFundSubscription.bindingId
    });

    var paymentResult = JSON.parse(paymentResultResponse);
    // return
    console.log(paymentResult)
    var orderStatusExtended = sberAcquiring.getStatusAndGetBind({
        orderNumber: sberAcquOrderNumber,
        orderId: sberAcquPayment.orderId,
        clientId: userFundSubscription.sberUserId
    })
    if (orderStatusExtended.actionCode !== 0) {
        OrderService.failedReccurentPayment(sberAcquOrderNumber,
            userFundSubscription.userFundSubscriptionId, sberAcquPayment.errorMessage, nowDate);
    }
    OrderService.updateInfo(sberAcquOrderNumber, {
        sberAcquErrorCode: orderStatusExtended.errorCode,
        sberAcquErrorMessage: orderStatusExtended.errorMessage,
        sberAcquActionCode: orderStatusExtended.actionCode,
        sberAcquOrderId: sberAcquPayment.orderId,
        sberAcquActionCodeDescription: orderStatusExtended.actionCodeDescription,
        amount: orderStatusExtended.amount,
        status: orderStatusExtended.actionCode === 0 ? orderStatus.PAID : orderStatus.FAILED
    })



};


OrderService.getMissingDays = function (allDates, date) {
    var formatLastDayMonth = moment(date).endOf('month').format('YYYY-MM-DD');
    var dateObjTime = moment(date);
    if (dateObjTime.format('YYYY-MM-DD') === formatLastDayMonth) {
        var dd = formatLastDayMonth.replace(/^\d{4}-\d{2}-/, '');
        var digitLastDay = parseInt(dd, 10),
            diff = 31 - digitLastDay;
        if (diff) {
            for (var i = diff; i >= 1; i--) {
                allDates.push((digitLastDay + i).toString());
            }
        }
    }
    allDates.push(dateObjTime.format('DD'));
};


/**
 * find orders with status "problemWithCard" in previous month
 * @param  {[int]} userFundSubscriptionId
 * @param {Object} [nowDate]
 * @return {[type]}
 */
OrderService.findOrderWithProblemCard = function(userFundSubscriptionId, nowDate) {
    var now = nowDate || new Date();
    var previousMonth = moment(now).subtract(1, 'month').format('YYYY-MM');
    return await(sequelize.models.Order.findAll({
        where: {
            userFundSubscriptionId,
            status: orderStatus.PROBLEM_WITH_CARD
        }
    }).filter(function (order) {
        var orderMonth = moment(order.scheduledPayDate).format('YYYY-MM');
        return previousMonth === orderMonth
    }));
};


/**
 * if payment failed
 * @param  {[int]} sberAcquOrderNumber
 * @param  {[int]} userFundSubscriptionId
 * @param  {[str]} error                   text from sberbank accuring
 * @param  {Object} [nowDate]
 * @return {[type]}
 */
OrderService.failedReccurentPayment = function (sberAcquOrderNumber, userFundSubscriptionId, error, nowDate) {
    await(OrderService.updateInfo(sberAcquOrderNumber, {
        status: orderStatus.PROBLEM_WITH_CARD
    }));
    var problemOrderInPreviousMonth = await(
        OrderService.findOrderWithProblemCard(userFundSubscriptionId, nowDate)
    );

    var sberUser   = await(OrderService.getSberUser(userFundSubscriptionId)),
        sberUserId = sberUser.id,
        authId     = sberUser.authId;

    var userEmail = microService.getUserData(authId).email;
    if (!userEmail) {
        throw new errors.NotFoundError('email', authId);
    }

    var data = '';
    // this is the first time the payment failed
    if (!problemOrderInPreviousMonth.length) {
        data = i18n.__(
            'Money is not written off, check your card. {{error}}', {
                error
            });
        mailService.sendUserRecurrentPayments(
            userEmail, {
                data
            }
        );
    // this is the second time the payment failed
    } else {
        data = i18n.__(
            'Money is not written off(for the second month in a row), check your card, ' +
            'write-downs will be no more. {{error}}', {
                error
            });
        mailService.sendUserRecurrentPayments(
            userEmail, {
                data
            }
        );

        // get all user subscription and turn off their
        var userFundIds = disableUserFundSubscription_(sberUserId);
        var hasNotSubscribers = getUserFundsWithoutSubscribers_(userFundIds);
        // get list user fund which haven't subscribers and disable their
        // and send email owner
        if (hasNotSubscribers.length) {
            disableUserFunds_(hasNotSubscribers);
            sendEmailOwnerUserFund_(hasNotSubscribers);
        }
    }
};

OrderService.getOrderComposition = function(sberAcquOrderNumber) {
    return await(sequelize.sequelize.query(`SELECT
    entities -> 'id' AS "id",
    entities -> 'type' as "type",
    entities -> 'title' AS "title",
    entities -> 'description' AS "description"
    FROM (SELECT jsonb_array_elements(("Order"."userFundSnapshot" -> 'topic') ||
                             ("Order"."userFundSnapshot" -> 'fund') ||
                             ("Order"."userFundSnapshot" -> 'direction')) AS entities
  FROM "Order" WHERE "sberAcquOrderNumber" = :sberAcquOrderNumber) AS entities`, {
        type: sequelize.sequelize.QueryTypes.SELECT,
        replacements: {
            sberAcquOrderNumber
        }
    }))
}


// TODO: add sberbank report to arguments
OrderService.generateReportTest = async(function (sberOrderId) {
    // TODO: sber report parsing
    // TODO: order conflict error handling
    var orders = await(sequelize.models.Order.findAll({
        attributes: ['amount', 'userFundSnapshot'],
        where: {
            status: orderStatus.PAID,
            sberAcquOrderId: sberOrderId,
            userFundSnapshot: {
                $ne: null
            }
        }
    }));
    // TODO: move to private method
    return countPayments_(orders);
});


/**
 * count payments to all funds
 * @param {[array]} paidOrders
 * @return {[object]} {
 *      payments: [{"id": 1, "payment": 123456, "title": "qwerty"}],
 *      sumModulo: 2345
 *  }
 */
function countPayments_(paidOrders) {
    var fundsArray = [];
    var sumModulo = 0;
    paidOrders.forEach(order => {
        var orderFunds = getFundsFromOrder_(order);
        var fundPayment = Math.trunc(order.amount / orderFunds.count);
        var modulo = order.amount - (fundPayment * orderFunds.count);
        orderFunds.funds = _.map(orderFunds.funds, ord => {
            ord.payment = fundPayment;
            return ord;
        });
        fundsArray.push(orderFunds.funds);
        sumModulo += modulo;
    });
    var result = {
        payments: [],
        sumModulo: sumModulo
    }
    fundsArray = _.flattenDeep(fundsArray);
    fundsArray = _.groupBy(fundsArray, 'id');
    _.forIn(fundsArray, function (val, key) {
        var res = {
            id: key,
            title: val[0].title,
            payment: _.sumBy(val, 'payment')
        };

        result.payments.push(res);
    });
    return result;
}


/**
 * get funds array and funds count from order
 * @param {[object]} order
 * @return {object} {
 *      funds: [{"id": 1}, {"id": 2}],
 *      count: 2
 *  }
 */
function getFundsFromOrder_(order) {
    var funds = order.userFundSnapshot.fund;
    var directionFunds = _.map(order.userFundSnapshot.direction,
        direction => {
            return direction.fund;
        }
    );
    var topicFunds = _.map(order.userFundSnapshot.topic, topic => {
        return topic.fund;
    });
    var topicDirectionFunds = _.map(order.userFundSnapshot.topic,
        topic => {
            return _.map(topic.direction, direction => {
                return direction.fund;
            });
        }
    );
    var orderFunds = _.concat(funds, directionFunds, topicFunds,
        topicDirectionFunds);
    orderFunds = _.flattenDeep(orderFunds);
    var fundsCount = orderFunds.length;

    return {
        funds: orderFunds,
        count: fundsCount
    };
}


/**
 * recommendation write in excel.
 * get calculated data for accountant, transform and write in .xlsx
 * @param  {[type]} countPayments { payments: [{"id": 1, "payment": 123456, "title": "qwerty"}], sumModulo: 2345 }
 * @return {[type]}
 */
OrderService.writeInExcel = function (countPayments) {
    var fundPayments      = countPayments.payments,
        remainderDivision = countPayments.sumModulo;
    var dataForSheet = [
        [ 'id', 'Имя фонда', 'рекомендуем начислить в этом периоде (коп.)' ]
    ];
    fundPayments.forEach((fundPayment) => {
        dataForSheet.push(
            [ fundPayment.id, fundPayment.title, fundPayment.payment ]
        );
    });
    dataForSheet.push([ 'Остатки', ' ', remainderDivision ]);

    var sheet = excel.createSheets(
      [
        {
          name: 'Рекомендация',
          value: dataForSheet,
        }
      ]
    );
    excel.write(
        '../../../../public/uploads/recommendation/Рекомендация_'+
        moment().format('YYYY_DD_MM')+'.xlsx',
        sheet
    );
};


/**
 * disable user's subsription and return list user fund id
 * @param  {[int]} sberUserId
 * @return {[array]}            [ 74, 73, ... ]
 */
function disableUserFundSubscription_(sberUserId) {
    var userFundSubscriptions =
        userFundService.updateSubscriptionsReturn(sberUserId, {
            enabled: false
        });
    return userFundSubscriptions.map(subsription => subsription.userFundId);
}


/**
 * get list user fund id for deactive
 * @param  {[array]} userFundIds [ 73, 74, 1]
 * @return {[array]}                [ 73, 74 ]
 */
function getUserFundsWithoutSubscribers_(userFundIds) {
    var res = [];
    var activeSubscriptions = userFundService.searchActiveSubscription(userFundIds);

    var listUserFundIdHasSubscribers = {};
    // { '1': true, '73': true, '74': true }
    activeSubscriptions.forEach((userFundSubsription) => {
        listUserFundIdHasSubscribers[userFundSubsription.UserFundId] = true;
    });

    return userFundIds.filter((userFundId) => {
        if (!listUserFundIdHasSubscribers[userFundId]) {
            return true;
        }
        return false;
    });
}


/**
 * @param  {[array]} userFundIds [74, 73]
 * @return {[type]}
 */
function disableUserFunds_(userFundIds) {
    userFundIds.forEach(function(userFundId) {
        await (userFundService.updateUserFund(userFundId, {
            enabled: false
        }));
    });
}


/**
 * send email to author UserFund
 * @param  {[array]} userFundIds [74, 73]
 * @return {[type]}
 */
function sendEmailOwnerUserFund_(userFundIds) {
    var userFundWithSberUsers = await(
        userFundService.getUserFundsWithSberUser(userFundIds)
    );
    userFundWithSberUsers.map((userFund) => {
        return {
            authId: userFund.owner.authId,
            userFundName: userFund.title
        };
    }).map((user) => {
        user.email = microService.getUserData(user.authId).email;
        return user;
    }).forEach((user) => {
        var email = user.email,
            userFundName = user.userFundName;
        if (!email) { return; }
        var data = i18n.__(
            'Your User Fund "{{userFundName}}" deactivated.', {
                userFundName
            }
        );
        mailService.sendUserRecurrentPayments(
            email, {
                data
            }
        );
    });
}


function isEmptyUserFund_ (userFund) {
    if (!userFund) { return true; }
    if (
        !userFund.fund.length &&
        !userFund.topic.length &&
        !userFund.direction.length
       ) {
        return true;
    }
}

module.exports = OrderService;
