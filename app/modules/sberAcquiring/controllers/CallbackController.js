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
const mail = require('../../mail')
const sberConfig = require('../../../../config/config-sberAcquiring.json');
const moment = require('moment');
const mailingCategory = require('../../mail/enum/mailingCategory')
const createOrder = require('../../orders/Order');
const UserApi = require('../../micro/services/microService').UserApi;

module.exports = class CallbackController extends Controller {
    actionCallback(ctx) {
        // callback data
        var sberAcquOrderNumber = ctx.request.query.orderNumber;

        var sqOrder = orderService.getOrderWithInludes(sberAcquOrderNumber);
        var order = createOrder(sqOrder)
        if (!order) {
            // panic, order not found!!!
        }

        if (!order.isAvalibleForPayment()) return;

        var sberAcquiringOrderStatus = order.checkStatus()
        console.log(sberAcquiringOrderStatus);

        if (order.isSuccessful()) {
            // create new card for user and set pay date

            var userFundSubscription = order.userFundSubscription,
                sberUser = userFundSubscription.sberUser,
                userFund = userFundSubscription.userFund,
                ownUserFund = sberUser.userFund,
                authUser = new UserApi().getUserData(sberUser.authId);

            // console.log(sberAcquiringOrderStatus);
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

            if (sberUser.categories == mailingCategory.ALL) {
                mail.sendFirstPayment(authUser.email, {
                    userName: authUser.firstName
                })
            }
        } else {
            // handle somehow

        }
        return null;
    }
};
