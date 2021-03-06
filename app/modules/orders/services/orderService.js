'use strict';

const config = require('../../../../config/config.json');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const util = require('util');
const sequelize = require('../../../components/sequelize');
const entityService = require('../../entity/services/entityService');
const userFundService = require('../../userFund/services/userFundService');
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
const BASEURL = `${config.hostname.replace(/\/+$/, '')}:${config.port}`
const createOrder = require('../Order');


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


OrderService.getOrders = function(where) {
    return await(sequelize.models.Order.findAll({ where }))
}


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


OrderService.makeMonthlyPayment = function(userFundSubscription, nowDate) {
    var userFund = userFundService.getUserFundSnapshot(userFundSubscription.userFundId);

    if (isEmptyUserFund_(userFund)) {
        // this should never happened
        userFund = null;
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

    // var sberAcquOrderNumber = OrderService.createOrder();

    var data = {
        userFundSubscriptionId: userFundSubscription.userFundSubscriptionId,
        userFundSnapshot: userFund,
        amount: userFundSubscription.amount,
        type: orderTypes.RECURRENT,
        clientId: userFundSubscription.sberUserId,
        bindingId: userFundSubscription.bindingId,
        status: orderStatus.CONFIRMING_PAYMENT,
        scheduledPayDate
    }

    var order = createOrder(data)

    await(order.makePayment())
    var status = order.checkStatus();
    if (status.actionCode !== 0) {
      var params = {
        sberAcquOrderNumber: order.sberAcquOrderNumber,
        userFundSubscriptionId: userFundSubscription.userFundSubscriptionId,
        errorMessage: status.errorMessage,
        nowDate,
        amount: userFundSubscription.amount
      }
      OrderService.failedReccurentPayment(params);
    }
};

/**
 * if last day in month then push '28', '30', '31'
 * @param  {[aarray]} allDates [ '2016-02-29', '2016-02-28','2016-02-27', '2016-02-26', '2016-02-25', '2016-02-24' ]
 * @param  {[string]} date     '2016-02-29'
 * @return {[array]}          ['29', '28','27', ... ]
 */
OrderService.getMissingDays = function(allDates, date) {
    allDates = Array.isArray(allDates) ? allDates : []
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
    return allDates;
};

OrderService.getOrderComposition = function(sberAcquOrderNumber) {
    return await(sequelize.sequelize.query(`
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
    }))
}


/**
 * if reccurent payment failed
 * @param  {[int]} sberAcquOrderNumber
 * @param  {[int]} userFundSubscriptionId
 * @param  {[str]} error                   text from sberbank accuring
 * @param  {Object} [nowDate]
 * @return {[type]}
 */
OrderService.failedReccurentPayment = function(params) {
    var sberAcquOrderNumber = params.sberAcquOrderNumber,
        userFundSubscriptionId = params.userFundSubscriptionId,
        errorMessage = params.errorMessage,
        nowDate = params.nowDate,
        amount = params.amount;

    var problemOrderInPreviousMonth = !!findOrderWithProblemCard_(userFundSubscriptionId, nowDate);

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
    if (!problemOrderInPreviousMonth) {
        if (sberUser.categories == mailingCategory.ALL) {
            mail.sendFirstFailure(userEmail, {
                userName: authUser.firstName,
                amount: Math.trunc(amount / 100)
            })
        }
        // this is the second time the payment failed
    } else {
        if (sberUser.categories == mailingCategory.ALL) {
            mail.sendSecondFailure(userEmail, {
                userName: authUser.firstName,
                amount: Math.trunc(amount / 100)
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
    var previousMonth = moment(now).subtract(1, 'month');
    return await(sequelize.models.Order.findOne({
        where: {
            userFundSubscriptionId,
            status: orderStatus.PROBLEM_WITH_CARD,
            scheduledPayDate: {
                $between: [ previousMonth.startOf('month').toDate(),
                            previousMonth.endOf('month').toDate() ]
            }
        }
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
    return userFund && !userFund.fund.length
}

module.exports = OrderService;
