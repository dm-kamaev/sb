'use strict';

const OrderView = {};

OrderView.renderOrder = function(orderData) {
    var result = {
        orderId: orderData.orderId,
        formUrl: 'http://www60.lan:3005/pay/'+orderData.orderId
    };
    return result;
};

OrderView.renderInfo = function(orderData, errorData, actionData) {
    var result = {
        errorCode: errorData == undefined ? 0 : errorData.code,
        //errorMessage: errorData.message,
        orderStatus: orderData.paid ? 2 : 0,
        amount: orderData.amount,
        attributes: {
            name: 'mdOrder',
            value: orderData.orderId
        },
        bindingInfo: {
            clientId: orderData.clientId,
            bindingId: orderData.binding
        }
    }

    return result;
};

module.exports = OrderView;
