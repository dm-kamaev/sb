/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';
const await = require('asyncawait/await');
const Controller = require('nodules/controller').Controller;
const OrderService = require('../services/OrderService');
const OrderView = require('../views/OrderView');

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
        }
        try {
            var order = await(OrderService.firstPay(paymentData));
        } catch (e) {
            if(e.name = 'SequelizeUniqueConstraintError') {
                throw new this.errors.orderAlreadyProcessed(e);
            } else {
                throw e;
            }
        }
        return OrderView.renderOrder(order);
    }

    actionSetPaid(actionContext, orderId){
        await(OrderService.setPaid(orderId));
        return {code: 0, message: 'Success'};
    }

    actionGetInfo(actionContext){
        var query = actionContext.request.query;
        var order = await(OrderService.getData(
            query.orderNumber, query.orderId));
        return OrderView.renderInfo(order);
    }
}

module.exports = OrderController;
