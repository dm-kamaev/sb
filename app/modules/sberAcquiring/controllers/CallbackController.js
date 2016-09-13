/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const orderStatus = require('../../orders/enums/orderStatus');
const errors = require('../../../components/errors');
const acquiringService = require('../services/sberAcquiring');
const orderService = require('../../orders/services/orderService');
const userService = require('../../user/services/userService');
const userFundService = require('../../userFund/services/userFundService');
const sberConfig = require('../../../../config/config-sberAcquiring.json');
const moment = require('moment');

module.exports = class CallbackController extends Controller {
    actionCallback(ctx) {
        // callback data
        var sberAcquOrderNumber = ctx.request.query.orderNumber;

        var order = await(orderService.getOrderWithInludes(sberAcquOrderNumber));

        if (!order) {
            // panic, order not found!!!
        }

        if (!orderService.isAvalibleForPayment(order)) return;

        var sberAcquiringOrderStatus = orderService.getAcquiringOrder(order);

        if (orderService.isSuccessful(sberAcquiringOrderStatus)) {
            // create new card for user and set pay date
            var userFundSubscription = order.userFundSubscription,
                sberUser = userFundSubscription.sberUser,
                userFund = userFundSubscription.userFund,
                ownUserFund = sberUser.userFund;

            console.log(sberAcquiringOrderStatus);
            var cardAuthInfo = sberAcquiringOrderStatus.cardAuthInfo,
                expiration = cardAuthInfo && cardAuthInfo.expiration,
                PAN = cardAuthInfo && cardAuthInfo.pan,
                cardHolderName = cardAuthInfo && cardAuthInfo.cardholderName,
                year = expiration && parseInt(expiration.substring(0, 4)),
                month = expiration && parseInt(expiration.substring(4, 6));

            await(userService.createCard(sberUser.id, {
                bindingId: sberAcquiringOrderStatus.bindingInfo.bindingId,
                PAN,
                expiration: expiration ? new Date(year, month) : undefined,
                cardHolderName
            }));

            var subscriptionId = userFundSubscription.id;
            await(userFundService.updateUserFundSubscription(subscriptionId, {
                enabled: true
            }));
            if (userFund.id == ownUserFund.id) {
                await(userFundService.toggleEnabled(userFund.id, true));
            }
        } else {
            // handle somehow

        }
        return null;
    }
};
