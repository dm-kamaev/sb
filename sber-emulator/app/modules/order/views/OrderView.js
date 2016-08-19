'use strict';

const OrderView = {};

OrderView.renderOrder = function(orderData) {
    var result = {
        orderId: orderData.orderId,
        formUrl: 'http://www60.lan:3005/pay/' + orderData.orderId + '/wait/1'
    };
    return result;
};

OrderView.renderInfo = function(orderData) {
    var result = {
        errorCode: 0,
        actionCode: orderData.paid ? 0 : -101,
        actionMessage: '',
        orderStatus: orderData.paid ? 2 : 0,
        amount: orderData.amount,
        attributes: {
            name: 'mdOrder',
            value: orderData.orderId
        },
        bindingInfo: {
            clientId: orderData.clientId,
            bindingId: orderData.binding
        },
        orderNumber: orderData.orderNumber
    };

    return result;
};

module.exports = OrderView;
