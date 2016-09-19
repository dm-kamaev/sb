/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const Controller = require('nodules/controller')
const errors = require('../../../components/errors');
const orderService = require('../services/orderService');

module.exports = class OrderController extends Controller {
    actionLoadStatement(ctx) {
        console.log(ctx.request.file)
    }

    /**
     * @api /order/:sberAcquOrderNumber get order by id with includes(test)
     * @apiName get order(test)
     * @apiGroup Order
     */
    actionGetOrderStatus(ctx, sberAcquOrderNumber) {
        var order = await(orderService.getOrderWithInludes(sberAcquOrderNumber));
        if (!order) throw new errors.NotFoundError('Order', sberAcquOrderNumber);
        return order;
    }

    /**
     * @api /order/:sberAcquOrderNumber/entity get order composition
     * @apiName get order composition
     * @apiGroup Order
     */
    actionGetOrderComposition(ctx, sberAcquOrderNumber) {
        try {
            var userFundSubscription = userFundService.getUserFundSubscriptionByOrder(sberAcquOrderNumber)
        } catch (err) {
            throw new errors.NotFoundError('Order', sberAcquOrderNumber)
        }

        if (ctx.request.header('Token-Header') == SECRET ||
            userFundSubscription.sberUserId == ctx.request.user && ctx.request.user.id) {
            return orderService.getOrderComposition(sberAcquOrderNumber)
        }
        throw new errors.HttpError('Unathorized', 403)
    }
}