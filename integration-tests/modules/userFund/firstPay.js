'use strict'

const services = require('../../services');
const log = console.log;

// don't check http status, because even if failed then subscription and
// order was created anyway
exports.withOutCheck = function(context) {
    var chakram = context.chakram, expect  = context.expect;

    return function () {
        var url      = services.url.concatUrl('user-fund/amount');
        var params   = services.userFund.generateAmount(context.userFundId);
        if(context.amount) {
            params.amount = context.amount;
        }
        var response = chakram.post(url, params);
        // return response.then((data) => {
        //     log('data=', data);
        // });
        // don't check http status, because even if failed then subscription and
        // order was created anyway
        return chakram.waitFor([
            response.then(resp => context.sberOrderId = resp.body.orderId)
        ]);
    };
};
