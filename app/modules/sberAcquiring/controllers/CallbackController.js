/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const acquiringService = require('../services/sberAcquiring');
const orderService = require('../../orders/services/orderService');
const userService = require('../../user/services/userService');
const userFundService = require('../../userFund/services/userFundService');
const sberConfig = require('../../../../config/config_sberAcquiring.json');
const moment = require('moment');

module.exports = class CallbackController extends Controller {
    actionCallback(ctx) {
        // callback data
        var mdOrder = ctx.request.query.mdOrder,
            sberAcquOrderNumber = ctx.request.query.orderNumber,
            operation = ctx.request.query.operation,
            status = ctx.request.query.status;

        var order = await(orderService.getOrderWithInludes(sberAcquOrderNumber));

        if (!order) {
            // panic, order not found!!!
        }

        if (order.status != 'waitingForPay') return;

        await(orderService.updateInfo(sberAcquOrderNumber, {
            status: 'confirmingPayment'
        }));

        var paymentId = order.sberUserUserFund.currentAmount.id,
            userFund = order.sberUserUserFund.userFund,
            sberUser = order.sberUserUserFund.sberUser;

        var eqOrderStatus;

        try {
            eqOrderStatus = await(acquiringService.getStatusAndGetBind({
                sberAcquOrderNumber,
                orderId: order.sberAcquOrderId,
                clientId: order.sberUserUserFund.sberUser.id
            }));
        } catch (err) {
            await(orderService.updateInfo(orderNumber, {
                status: 'waitingForPay'
            }));
            throw new errors.HttpError('Failed to get order status', 500);
        }

        // update order
        await(orderService.updateInfo(sberAcquOrderNumber, {
            sberAcquErrorCode: eqOrderStatus.errorCode,
            sberAcquErrorMessage: eqOrderStatus.errorMessage,
            sberAcquActionCode: eqOrderStatus.actionCode,
            sberAcquActionCodeDescription: eqOrderStatus.actionCodeDescription,
            status: eqOrderStatus.actionCode == 0 ? 'paid' : 'failed'
        }));

        if (eqOrderStatus.actionCode != 0) {
            // handle somehow
        } else {
            // create new card for user and set pay date
            await(userService.createCard(sberUser.id, eqOrderStatus.bindingInfo.bindingId));
            await(userFundService.updateDesiredAmountHistory(paymentId, {
                payDate: moment().add(1, 'month').toDate()
            }));
            var suufId = order.sberUserUserFund.id;
            await(userFundService.updateSberUserUserFund(suufId, {
                enabled: true
            }));
            if (userFund.id == sberUser.userFund.id) {
                await(userFundService.toggleEnabled(userFund.id, true));
            }
        }
        return null;
    }
};
