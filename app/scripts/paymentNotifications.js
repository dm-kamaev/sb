'use strict'

const models = require('../components/sequelize').models;
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const userService = require('../modules/user/services/userService')
const userFundService = require('../modules/userFund/services/userFundService')
const orderService = require('../modules/orders/services/orderService')
const mail = require('../modules/mail')
const argv = require('yargs').argv;
const nowDate = argv.now ? new Date(argv.now) : new Date();
const logger = require('../components/logger').getLogger('main');

(async(function() {
    var sberUsers = await (models.SberUser.findAll({
        where: {
            authId: {
                $not: null
            },
            draftNotified: false,
            categories: 'all'
        },
        include: {
            model: models.UserFund,
            as: 'userFund',
            where: {
                updatedAt: {
                    $lt: new Date(nowDate.getTime() - 1000 * 60 * 60 * 24 * 13)
                },
                enabled: false
            }
        }
    }));

    var ids = sberUsers.map(sberUser => sberUser.authId);
    var searchStr = ids.join(',');
    var authUsers = ids.length ? userService.getAuthUsersByIds(searchStr) : [];
    authUsers.forEach(authUser => {
        try {
            mail.sendPendingDraft(authUser.email, {
                userName: authUser.firstName
            })
        } catch (err) {
            logger.critical(err)
        }
    })

    if (ids.length) await(models.SberUser.update({
        draftNotified: true
    }, {
        where: {
            authId: {
                $in: ids
            }
        }
    }))

    var duration = 1000 * 60 * 60 * 24 * 2
    var dayAfterTommorow = new Date(nowDate.getTime() + duration),
        days = orderService.getMissingDays(null, dayAfterTommorow),
        subscriptions = userFundService.getUnhandledSubscriptions(days, dayAfterTommorow),
        ids = subscriptions.filter(sub => sub.categories == 'all')
                           .map(subscription => subscription.sberUserAuthId),
        searchStr = ids.join(','),
        authUsers = searchStr ? userService.getAuthUsersByIds(searchStr) : [];

    subscriptions
    .filter(sub => userService.findSberUserById(sub.sberUserId).paymentNotified)
    .forEach(subscription => {
        var authUser = authUsers.find(authUser => {
            return authUser.id == subscription.sberUserAuthId
        })
        try {
            mail.sendBeforePayment(authUser.email, {
                userName: authUser.firstName,
                amount: Math.trunc(subscription.amount / 100)
            })
        } catch (err) {
            logger.critical(err)
        }
    })

    if (ids.length) await(models.SberUser.update({
        paymentNotified: true
    }, {
        where: {
            authId: {
                $in: ids
            }
        }
    }))
}))();
