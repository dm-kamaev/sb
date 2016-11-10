'use strict'

const services = require('../../services');
const chakram = require('chakram');
const expect = chakram.expect;

// don't check http status, because even if failed then subscription and
// order was created anyway
exports.withOutCheck = function(context) {
    return function () {
        var url      = services.url.concatUrl('user-fund/amount');
        var params   = services.userFund.generateAmount(context.userFundId);
        if (context.amount) { params.amount = context.amount; }
        var response = chakram.post(url, params);
        // don't check http status, because even if failed then subscription and
        // order was created anyway
        return response.then(resp => {
          context.formUrl = resp.body.formUrl;
          context.sberOrderId = resp.body.orderId
        });
    };
};
