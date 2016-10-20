'use strict';

const config = require('../../../../config/config.json');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const util = require('util');
const sequelize = require('../../../components/sequelize');
const entityService = require('../../entity/services/entityService');
const userFundService = require('../../userFund/services/userFundService');
const sendMail = require('../../userFund/services/sendMail.js');
const sberAcquiring = require('../../sberAcquiring/services/sberAcquiring.js');
const UserApi = require('../../micro/services/microService.js').UserApi;
const errors = require('../../../components/errors');
const orderStatus = require('../enums/orderStatus');
const orderTypes = require('../enums/orderTypes');
const os = require('os');
const i18n = require('../../../components/i18n');
const logger = require('../../../components/logger').getLogger('main');
const moment = require('moment');
const _ = require('lodash');
const mail = require('../../mail')
const aqconfig = require('../../../../config/config-sberAcquiring')
const mailingCategory = require('../../mail/enum/mailingCategory')


var OrderService = {};


/**
 * update orders by fields
 * @param  {[obj]} where
 * @param  {[obj]} data
 * @return {[type]}       [description]
 */
OrderService.update = function(where, data) {
    return await (sequelize.models.Order.update(data, {
        where
    }));
};


OrderService.getOrderWithInludes = function(sberAcquOrderNumber) {
    return await (sequelize.models.Order.findOne({
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
OrderService.getSberUser = function(userFundSubscriptionId) {
    var res = await (sequelize.models.UserFundSubscription.findOne({
        where: {
            id: userFundSubscriptionId
        },
        include: {
            model: sequelize.models.SberUser,
            as: 'sberUser'
        }
    }));
    if (!res) {
        throw new errors.NotFoundError('subscription', userFundSubscriptionId);
    }
    return res.sberUser;
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
    // prevent order spamming, one order per 60 seconds
    if (!isOrderValid_(params.userFundSubscriptionId, 60)) {
        throw new errors.HttpError(
            i18n.__('One order per 60 seconds'), 429);
    }

    // if user with unconfirmed payment, then do first pay
    var userFund = userFundService.getUserFundWithIncludes(params.userFundId);
    if (isEmptyUserFund_(userFund)) {
        throw new errors.HttpError(i18n.__('UserFund is empty'), 400);
    }

    if (!params.isActiveCard) {
        var data = {
            userFundSubscriptionId: params.userFundSubscriptionId,
            amount: params.amount,
            userFundSnapshot: userFund,
            status: orderStatus.NEW,
            type: orderTypes.FIRST,
        };
        var sberAcquOrderNumber = OrderService.createOrder(data);
        var payDate = createPayDate_(params.userFundSubscriptionId, new Date());

        var responceSberAcqu;
        try {
            responceSberAcqu = sberAcquiring.firstPay({
                orderNumber: sberAcquOrderNumber,
                amount: params.amount,
                returnUrl: `${config.hostname}/#success?app=${params.isCordova}&type=payment`,
                failUrl: `${config.hostname}/#failure?app=${params.isCordova}&type=payment`,
                language: 'ru',
                clientId: params.sberUserId,
            });
        } catch (err) {
            await (OrderService.updateInfo(sberAcquOrderNumber, {
                status: orderStatus.EQ_ORDER_NOT_CREATED
            }));
            var textError = i18n.__(
                'Failed connection with sberbank acquiring (first pay). {{error}}', {
                    error: util.inspect(err, {
                        depth: 5
                    })
                }
            );
            throw new errors.AcquiringError(textError);
        }

        return handlerResponceSberAcqu_(
            sberAcquOrderNumber, responceSberAcqu
        );
    } else {
        await (sequelize.models.UserFundSubscription.update({
            enabled: true
        }, {
            where: {
                id: params.userFundSubscriptionId
            }
        }));
        return {
            message: i18n.__('You changed the monthly payment amount.')
        };
    }
};

/**
 * @private
 * check validity of new order
 * @param {number} subscriptionId
 * @param {number} intervalInSeconds
 * @return {boolean} isPaymentValid
 */
function isOrderValid_(subscriptionId, intervalInSeconds) {
    if(config.preventOrderSpamming) {
        var lastDateOfFirstPayment =
            getDateOfLastNonPaidFirstPayment_(subscriptionId);

        if(lastDateOfFirstPayment) {
            var dateDiff = countDateDifferenceFromNow_(
                lastDateOfFirstPayment.dataValues.updatedAt);
            return (dateDiff > intervalInSeconds);
        } else {
            return true;
        }
    } else {
        return true;
    }
}



/**
 * @private
 * get updation date of last updated first payment
 * @param {number} subscriptionId
 * @return {date} orderDate
 */
function getDateOfLastNonPaidFirstPayment_(subscriptionId) {
    var orderDate = await(sequelize.models.Order.findOne({
        where: {
            userFundSubscriptionId: subscriptionId,
            type: orderTypes.FIRST
        },
        order: [['updatedAt', 'DESC']]
    }));
    return orderDate;
}

/**
 * @private
 * get date difference from now to date in param
 * @param {date} date
 * @return {number} differenceInSeconds
 */
function countDateDifferenceFromNow_(date) {
    var timeDifference = Math.abs(new Date().getTime() - date.getTime());
    //difference in seconds
    var differenceInSeconds = Math.ceil(timeDifference / 1000);
    return differenceInSeconds;
}

OrderService.isAvalibleForPayment = function(order) {
    if (!order) {
        return false;
    } else {
        return order.status === orderStatus.WAITING_FOR_PAY;
    }
};

OrderService.getAcquiringOrder = function(order) {
    var sberAcquOrderNumber = order.sberAcquOrderNumber;

    await (OrderService.updateInfo(sberAcquOrderNumber, {
        status: orderStatus.CONFIRMING_PAYMENT
    }));

    var paymentId = order.userFundSubscription.currentAmount.id,
        userFund = order.userFundSubscription.userFund,
        sberUser = order.userFundSubscription.sberUser;

    var eqOrderStatus = getAcquiringOrderStatus_(order);

    await (OrderService.updateInfo(sberAcquOrderNumber, {
        sberAcquErrorCode: eqOrderStatus.errorCode,
        sberAcquErrorMessage: eqOrderStatus.errorMessage,
        sberAcquActionCode: eqOrderStatus.actionCode,
        sberAcquActionCodeDescription: eqOrderStatus.actionCodeDescription,
        status: eqOrderStatus.actionCode === 0 ? orderStatus.PAID : eqOrderStatus.actionCode === -100 ? orderStatus.WAITING_FOR_PAY : orderStatus.FAILED
    }));

    return eqOrderStatus;
};

OrderService.isSuccessful = function(sberAcquiringOrderStatus) {
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
        await (OrderService.updateInfo(order.sberAcquOrderNumber, {
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
OrderService.createOrder = function(data) {
    return await (sequelize.models.Order.create({
        userFundSubscriptionId: data.userFundSubscriptionId,
        type: data.type,
        amount: data.amount,
        status: data.status,
        userFundSnapshot: data.userFundSnapshot,
        scheduledPayDate: data.scheduledPayDate
    })).sberAcquOrderNumber;
};

function createPayDate_(subscriptionId, payDate) {
    return await (sequelize.models.PayDayHistory.create({
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
OrderService.getListDatesBefore = function(NumberDays, date) {
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
OrderService.getMissingDays = function(allDates, date) {
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


OrderService.makeMonthlyPayment = function(userFundSubscription, nowDate) {
    var userFund = userFundService.getUserFundWithIncludes(userFundSubscription.userFundId);

    if (isEmptyUserFund_(userFund)) {
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
        // needs for unit testing
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
    console.log(paymentResult);
    var orderStatusExtended = sberAcquiring.getStatusAndGetBind({
        userName: aqconfig.userNameSsl,
        password: aqconfig.passwordSsl,
        orderNumber: sberAcquOrderNumber,
        orderId: sberAcquPayment.orderId,
        clientId: userFundSubscription.sberUserId
    });

    if (orderStatusExtended.actionCode !== 0) {
        OrderService.failedReccurentPayment(sberAcquOrderNumber,
            userFundSubscription.userFundSubscriptionId, sberAcquPayment.errorMessage, nowDate, userFundSubscription.amount);
    }
    OrderService.updateInfo(sberAcquOrderNumber, {
        sberAcquErrorCode: orderStatusExtended.errorCode,
        sberAcquErrorMessage: orderStatusExtended.errorMessage,
        sberAcquActionCode: orderStatusExtended.actionCode,
        sberAcquOrderId: sberAcquPayment.orderId,
        sberAcquActionCodeDescription: orderStatusExtended.actionCodeDescription,
        amount: orderStatusExtended.amount,
        status: orderStatusExtended.actionCode === 0 ? orderStatus.PAID : orderStatus.PROBLEM_WITH_CARD
    });
};


OrderService.getMissingDays = function(allDates, date) {
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
 * if reccurent payment failed
 * @param  {[int]} sberAcquOrderNumber
 * @param  {[int]} userFundSubscriptionId
 * @param  {[str]} error                   text from sberbank accuring
 * @param  {Object} [nowDate]
 * @return {[type]}
 */
OrderService.failedReccurentPayment = function(sberAcquOrderNumber, userFundSubscriptionId, error, nowDate, amount) {
    // await (OrderService.updateInfo(sberAcquOrderNumber, {
    //     status: orderStatus.PROBLEM_WITH_CARD
    // }));
    var problemOrderInPreviousMonth = await (
        findOrderWithProblemCard_(userFundSubscriptionId, nowDate)
    );

    var sberUser = await (OrderService.getSberUser(userFundSubscriptionId)),
        sberUserId = sberUser.id,
        authId = sberUser.authId;

    var authUser = new UserApi().getUserData(authId);
    var userEmail = authUser.email;
    if (!userEmail) {
        throw new errors.NotFoundError('email', authId);
    }

    var data = '';
    // this is the first time the payment failed
    if (!problemOrderInPreviousMonth.length) {
        if (sberUser.categories == mailingCategory.ALL) {
            mail.sendFirstFailure(userEmail, {
                userName: authUser.firstName,
                amount
            })
        }
        // this is the second time the payment failed
    } else {
        if (sberUser.categories == mailingCategory.ALL) {
            mail.sendSecondFailure(userEmail, {
                userName: authUser.firstName,
                amount
            })
        }
        // get all user subscription and turn off their
        var userFundIds = disableUserFundSubscription_(sberUserId);
        var hasNotSubscribers = getUserFundsWithoutSubscribers_(userFundIds);
        // get list user fund which haven't subscribers and disable their
        // and send email owner
        if (hasNotSubscribers.length) {
            disableUserFundsAndSendMail_(hasNotSubscribers);
        }
    }
};


/**
 * find orders with status "problemWithCard" in previous month
 * @param  {[int]} userFundSubscriptionId
 * @param {Object} [nowDate]
 * @return {[type]}
 */
function findOrderWithProblemCard_(userFundSubscriptionId, nowDate) {
    var now = nowDate || new Date();
    var previousMonth = moment(now).subtract(1, 'month').format('YYYY-MM');
    return await (sequelize.models.Order.findAll({
        where: {
            userFundSubscriptionId,
            status: orderStatus.PROBLEM_WITH_CARD
        }
    }).filter(order => {
        var orderMonth = moment(order.scheduledPayDate).format('YYYY-MM');
        return previousMonth === orderMonth;
    }));
}


/**
 * disable UserFunds and send mail ownwer
 * @param  {array} hasNotSubscribers [74, 73, 72]
 * @return {[type]}
 */
function disableUserFundsAndSendMail_(hasNotSubscribers) {
    var userFundsWithSberUsers = userFundService.getUserFundsWithSberUser({
        id: {
            $in: hasNotSubscribers
        }
    }) || [];
    var dataForMail = userFundsWithSberUsers.map(userFund => {
        return {
            authId: userFund.owner.authId,
            userFundName: userFund.title,
            reason: i18n.__('No paying users'),
        }
    });
    disableUserFunds_(hasNotSubscribers);
    new sendMail.userFund({
        isReccurent: true
    }).disableUserFunds(dataForMail);
}


OrderService.getOrderComposition = function(sberAcquOrderNumber) {
    return await (sequelize.sequelize.query(`
    SELECT
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
    }));
};


// TODO: add sberbank report to arguments
OrderService.generateReportTest = async(function(sberOrderId) {
    // TODO: sber report parsing
    // TODO: order conflict error handling
    var orders = await (sequelize.models.Order.findAll({
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
    };
    fundsArray = _.flattenDeep(fundsArray);
    fundsArray = _.groupBy(fundsArray, 'id');
    _.forIn(fundsArray, function(val, key) {
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
 * disable user's subsription and return list user fund id
 * @param  {[int]}   sberUserId
 * @return {[array]} userFundIds  [ 74, 73, ... ]
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
 * @param  {[array]} userFundIds    [ 73, 74, 1]
 * @return {[array]}                [ 73, 74 ]
 */
function getUserFundsWithoutSubscribers_(userFundIds) {
    var res = [];
    var activeSubscriptions = userFundService.searchActiveSubscription(userFundIds);

    var userFundIdHasSubscribers = {};
    // { '1': true, '73': true, '74': true }
    activeSubscriptions.forEach(userFundSubsription => {
        userFundIdHasSubscribers[userFundSubsription.UserFundId] = true;
    });

    return userFundIds.filter(userFundId => {
        if (!userFundIdHasSubscribers[userFundId]) {
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
    userFundIds.forEach(userFundId => {
        await (userFundService.updateUserFund(userFundId, {
            enabled: false
        }));
    });
}


function isEmptyUserFund_(userFund) {
    return !(
        userFund &&
        (userFund.topic.length || userFund.direction.length || userFund.fund.length)
    );
}

module.exports = OrderService;
