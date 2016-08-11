/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const acquiringService = require('../services/sberAcquiring');
const orderService = require('../../orders/services/orderService');
const userService = require('../../user/services/userService');
const sberConfig = require('../../../../config/config_sberAcquiring.json');
const moment = require('moment');

module.exports = class CallbackController extends Controller {
    actionCallback(ctx) {
        // callback data
        var mdOrder = ctx.request.query.mdOrder,
            orderNumber = ctx.request.query.orderNumber,
            operation = ctx.request.query.operation,
            status = ctx.request.query.status;
        // find order
        var order = await(orderService.getOrderWithInludes(orderNumber));

        if (!order) {
          // panic, order not found!!!
        }

        var paymentId = order.sberUserUserFund.currentAmount.id,
            userFund = order.sberUserUserFund.userFund,
            sberUser = order.sberUserUserFund.sberUser;

        // check order status
        var status = await(acquiringService.getStatusAndGetBind({
            orderNumber,
            orderId: order.orderId,
            clientId: order.sberUserUserFund.sberUser.id
        }));

        // update order
        await(orderService.updateOrder(orderNumber, {
            errorCode: status.errorCode,
            errorMessage: status.errorMessage,
            actionCode: status.actionCode
        }));

        if (status.actionCode != 0) {
            // handle error
        } else {
            // order paid successfully
            // create new card for user and set pay date
            await(userService.createCard(sberUser.id, status.bindingId));
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
