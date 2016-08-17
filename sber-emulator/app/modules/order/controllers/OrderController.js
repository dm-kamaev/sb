/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';
const await = require('asyncawait/await');
const Controller = require('nodules/controller').Controller;
const OrderService = require('../services/OrderService');
const OrderView = require('../views/OrderView');
const i18n = require('../../../components/i18n');

class OrderController extends Controller {
    constructor() {
        super();
        this.errors = {
            orderAlreadyProcessed: require('./Errors/OrderAlreadyExists.js')
        };
    }

    actionFirstPay(actionContext) {
        var query = actionContext.request.query;
        var paymentData = {
            amount: query.amount,
            orderNumber: query.orderNumber,
            clientId: query.clientId
        };
        var order;
        try {
            order = await(OrderService.firstPay(paymentData));
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
        return OrderView.renderOrder(order);
    }

    actionSetPaid(actionContext, orderId, delay) {
        var order = await(OrderService.setPaid(orderId));
        await(OrderService.sendCallback(order.orderId, delay || 1));
        return {code: 0, message: 'Success'};
    }

    actionGetInfo(actionContext) {
        var query = actionContext.request.query;
        var order = await(OrderService.getData(
            query.clientId, query.orderId));
        return OrderView.renderInfo(order);
    }

    actionPayByBind(actionContext) {
        var query = actionContext.request.query;
        return await(OrderService.payByBind(query.mdOrder, query.bindingId));
    }
}

module.exports = OrderController;
