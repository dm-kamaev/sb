'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const acquiringService = require('../services/sberAcquiring');
const orderService = require('../../orders/services/orderService');
const userService = require('../../user/services/userService');
const sberConfig = require('../../../../config/config_sberAcquiring.json');

module.exports = class CallbackController extends Controller {
    actionCallback(ctx) {
        //callback data
        var mdOrder     = ctx.request.query.mdOrder,
            orderNumber = ctx.request.query.orderNumber,
            operation   = ctx.request.query.operation,
            status      = ctx.request.query.status;
        //find order
        var order       = await(orderService.getOrderWithInludes(orderNumber));

        if (!order) {
          //panic, order not found!!!
        }

        var sberUserId = order.sberUserUserFund.sberUser.id,
            paymentId  = order.sberUserUserFund.currentAmount.id;

        //check order status
        var status = await(acquiringService.getStatusAndGetBind({
            orderNumber,
            orderId: order.orderId,
            clientId: order.sberUserUserFund.sberUser.id
        }));

        //update order
        await(orderService.updateOrder(orderNumber, {
          errorCode: status.errorCode,
          errorMessage: status.errorMessage,
          actionCode: status.actionCode
        }))

        if (status.actionCode != 0) {
            //handle error
        } else {
            //order paid successfully
            //create new card for user and set pay date
            var card = await(userService.createCard(sberUserId, status.bindingId));
            await(userFundService.updateDesiredAmountHistory(paymentId, {
                payDate: new Date().setMonth(new Date().getMonth() + 1)
            }));
        }
        return null;
    }
}
