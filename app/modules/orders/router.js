'use strict';

const orderRouter = require('express').Router();
const orderService = require('./services/orderService');
const await = require('asyncawait/await');
const Controller = require('nodules/controller').Controller;
const errors = require('../../components/errors');

var orderController = new class extends Controller {
      /**
       * @api /order/:id get order by id with includes(test)
       * @apiName get order(test)
       * @apiGroup Order
       */
    actionGetOrderStatus(ctx, id) {
        var order = await(orderService.getOrderWithInludes(id));
        if (!order) throw new errors.NotFoundError('Order', id);
        return order;
    }
}();

orderRouter.get('/:id', orderController.actionGetOrderStatus);

module.exports = orderRouter;
