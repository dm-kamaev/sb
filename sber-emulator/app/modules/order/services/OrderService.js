const async = require('asyncawait/async');
const await = require('asyncawait/await');
const models = require('../../../components/sequelize').models;
const logger = require('../../../components/logger').getLogger('main');
const uuid = require('uuid');

var OrderService = {};

OrderService.Exceptions = {
};

OrderService.firstPay = async(function (paymentData) {
    paymentData.orderId = uuid.v4();
    return (await(models.Order.create(paymentData)));
});

OrderService.setPaid = async(function (orderId) {
    var order = await(models.Order.findOne({
        where: {
            orderId: orderId,
        }
    }));

    if(order.dataValues.paid == 0){
        await(order.update({
            binding: uuid.v4(),
            paid: true
        }));
    }
});

OrderService.getData = async(function (orderNumber, orderId) {
    var order = await(models.Order.findOne({
        where: {
            orderId: orderId,
            orderNumber: orderNumber
        }
    }));
    return order;
});
module.exports = OrderService;
