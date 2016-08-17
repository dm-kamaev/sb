const async = require('asyncawait/async');
const await = require('asyncawait/await');
const path = require('path');
const models = require('../../../components/sequelize').models;
const logger = require('../../../components/logger').getLogger('main');
const uuid = require('uuid');
const config = require('../../../../config/urls.json');
const axios = require('axios').create({baseUrl: config.backendUrl});



var OrderService = {};

OrderService.Exceptions = {
};

OrderService.firstPay = async(function(paymentData) {
    paymentData.orderId = uuid.v4();
    return (await(models.Order.create(paymentData)));
});

OrderService.setPaid = async(function(orderId) {
    var order = await(models.Order.findOne({
        where: {
            orderId: orderId,
        }
    }));

    if (order.dataValues.paid == 0) {
        await(order.update({
            binding: uuid.v4(),
            paid: true
        }));
    }
    return order;
});

OrderService.getData = async(function(clientId, orderId) {
    var order = await(models.Order.findOne({
        where: {
            orderId: orderId,
            clientId: clientId
        }
    }));
    return order;
});

OrderService.sendCallback = async(function(orderId, delay) {
    var order = await(models.Order.findOne({
        where: {
            orderId: orderId
        }
    }));
    setTimeout(function() {
        axios.get('http://localhost:3000/callback?', {
            params: {
                mdOrder: order.dataValues.orderId,
                orderNumber: order.dataValues.orderNumber,
                operation: 'DEPOSITED',
                status: order.dataValues.paid == true ? 2 : 0
            }
        });
    }, delay || 1);
});
module.exports = OrderService;
