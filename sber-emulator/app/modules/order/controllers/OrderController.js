/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';
const await = require('asyncawait/await');
const Controller = require('nodules/controller').Controller;
const OrderService = require('../services/OrderService');
const OrderView = require('../views/OrderView');
const i18n = require('../../../components/i18n');

var failOrders = false;

class OrderController extends Controller {
    constructor() {
        super();
        this.errors = {
            orderAlreadyProcessed: require('./Errors/OrderAlreadyExists.js')
        };
    }

    /**
     * @api {get} /payment/rest/register.do create an order
     * @apiName Create an order
     * @apiGroup Payment
     *
     * @apiParam {String} amount amount of money in kopeck
     * @apiParam {Number} orderNumber number of order in a shop system
     * @apiParam {NUmber} clientId id of client in a shop system
     *
     * @apiExample {curl} Example usage:
     * {
     *     curl -i http://localhost:3000/payment/rest/register.do?amount=100000&orderNumber=69&clientId=32
     * }
     *
     * @apiError (Error 200) 1 Order already processed
     *
     */
    actionCreateOrder(actionContext) {
        var query = actionContext.request.query;
        var paymentData = {
            amount: query.amount,
            orderNumber: query.orderNumber,
            clientId: query.clientId
        };
        var order;
        try {
            order = await(OrderService.createOrder(paymentData));
        } catch (e) {
            if (e.name == 'SequelizeUniqueConstraintError') {
                return ({
                    errorCode: 1,
                    errorMessage: i18n.__('Order already processed')
                });
            } else {
                throw e;
            }
        }
        if(failOrders == false){
            return OrderView.renderOrder(order);
        } else {
            actionContext.status = 500;
        }
    }

    /**
     * @api {get} /pay/:orderId/wait/:delay do a payment
     * @apiName Do a payment
     * @apiGroup Payment
     *
     * @apiParam {uuid} orderId id of order in sberbank system
     * @apiParam {Number} delay delay for callback sending in milliseconds
     *
     * @apiExample {curl} Example usage:
     * {
     *     curl -i http://localhost:3000/pay/f6ff42ca-4053-4480-aab9-01a69c364361/wait/5000
     * }
     *
     * @apiError (Error 404) NotFoundError order not found
     *
     */
    actionSetPaid(actionContext, orderId, delay) {
        var order = await(OrderService.setPaid(orderId));
        if(!order) {
            actionContext.status = 404;
            return {code: 'NotFoundError', message: 'Order not found'};
        }
        await(OrderService.sendCallback(order.orderId, delay || 1));
        return {code: 0, message: 'Success'};
    }

    /**
     * @api {get} /payment/rest/getOrderStatusExtended.do get info about order
     * @apiName Get full info about order
     * @apiGroup Payment
     *
     * @apiParam {uuid} orderId id of order in sberbank system
     * @apiParam {Number} clientId id of client in shop system
     *
     * @apiExample {curl} Example usage:
     * {
     *     curl -i http://localhost:3000/payment/rest/getOrderStatusExtended.do?orderId=f6ff42ca-4053-4480-aab9-01a69c364361&clientId=69
     * }
     *
     * @apiError (Error 200) 6 orderId not found
     *
     */
    actionGetInfo(actionContext) {
        var query = actionContext.request.query;
        var order = await(OrderService.getData(
            query.clientId, query.orderId));
        if(!order) {
            return {errorCode: 6,
                errorMessage: 'Данный orderId не зарегистрирован'};
        }
        return OrderView.renderInfo(order);
    }

    /**
     * @api {get} /payment/rest/paymentOrderBinding.do pay an order by binding
     * @apiName Pay an order by binding
     * @apiGroup Payment
     *
     * @apiParam {uuid} mdOrder id of order in sberbank system
     * @apiParam {uuid} bindingId id of binding in sberbank system
     *
     * @apiExample {curl} Example usage:
     * {
     *     curl -i http://localhost:3000/payment/rest/paymentOrderBinding.do?mdOrder=f6ff42ca-4053-4480-aab9-01a69c364361&bindingId=f65f42ca-4053-4a80-aab9-61a69c3c4361
     * }
     *
     * @apiError (Error 200) 2 mdOrder or bindingId not found
     *
     */
    actionPayByBind(actionContext) {
        return {
            errorCode: 0,
            errorMessage: 'Success'
        };
    }


    actionLastOrderFromClient(actionContext, clientId) {
        return await(OrderService.lastOrderFromClient(clientId));
    }

    actionFailOrders(actionContext, fail) {
        if(fail == true){
            failOrders = true;
        } else {
            failOrders = false
        }
        return {fail: failOrders}
    }
}

module.exports = OrderController;
