'use strict'

const services = require('../../services');
const log = console.log;
const chakram = require('chakram');
const _ = require('lodash');

module.exports = function(context) {
    var expect  = context.expect;

    chakram.addMethod('checkRecommendationValues', function(respObj) {
        var statusCode = respObj.response.statusCode,
            body       = respObj.body,
            fundsEntryCount = 18,
            fundsCount = 3,
            paymentPerFund = Math.trunc(context.amount / fundsEntryCount),
            moduloPerFund = (context.amount / fundsEntryCount) - paymentPerFund,
            sumModulo = Math.round(moduloPerFund * fundsEntryCount),
            sumPayment = (paymentPerFund * fundsEntryCount) + sumModulo,
            sumCountedPayment = _.sumBy(body.payments, 'payment') +
            body.sumModulo;

        this.assert(
            sumPayment === sumCountedPayment,
            'Error expectation sum: ' + sumPayment + '; real sum: ' +
                sumCountedPayment
        );
        return chakram.wait();
    });

    return function () {
        var url = services.url.concatUrl('order/generate-report');
        var response = chakram.get(url + '/' + context.sberOrderId);
        return chakram.waitFor([
            response.then(res => {
                expect(res).checkRecommendationValues();
            })
        ]);
    };
};
