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
            //fundsEntryCount = 18,
            fundsCount = 5,
            paymentPerFund = Math.trunc(context.amount / fundsCount),
            moduloPerFund = (context.amount / fundsCount) - paymentPerFund,
            sumModulo = Math.round(moduloPerFund * fundsCount),
            sumPayment = (paymentPerFund * fundsCount) + sumModulo,
            sumCountedPayment = _.sumBy(body.payments, 'payment') +
            body.sumModulo;

        var allPaymentsIsEqual = body.payments.every((fund) =>
            fund.payment === paymentPerFund);

        this.assert(
            allPaymentsIsEqual,
            'Error payments to funds is not equal'
        );

        this.assert(
            sumPayment === sumCountedPayment,
            'Error expectation sum: ' + sumPayment + '; real sum: ' +
                sumCountedPayment
        );

        return chakram.wait();
    });

    return function () {
        var url = services.url.concatUrl('statement/count-payments-test');
        var response = chakram.get(url + '/' + context.sberOrderId);
        return chakram.waitFor([
            response.then(res => {
                expect(res).checkRecommendationValues();
            })
        ]);
    };
};
