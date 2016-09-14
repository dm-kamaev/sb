'use strict';

const orderRouter = require('express').Router();
const orderService = require('./services/orderService');
const userFundService = require('../userFund/services/userFundService')
const await = require('asyncawait/await');
const Controller = require('nodules/controller').Controller;
const errors = require('../../components/errors');
const SECRET = require('../../../config/admin-config').secret;
const checkToken = require('nodules/checkAuth').CheckToken(SECRET);

var orderController = new class extends Controller {
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
}();

var controllersArray = {};
controllersArray['v1'] = orderController;

var VersionedController = require('nodules/controller').VersionedController;
var versionedController = new VersionedController(controllersArray);

orderRouter.get('/:sberAcquOrderNumber(\\d+)', versionedController.actionGetOrderStatus);
orderRouter.get('/:sberAcquOrderNumber(\\d+)/entity', versionedController.actionGetOrderComposition);


module.exports = orderRouter;
