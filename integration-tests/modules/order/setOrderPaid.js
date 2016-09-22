'use strict'

const services = require('../../services');
const log = console.log;
const chakram = require('chakram');

module.exports = function(context) {
    var expect  = context.expect;
    return function () {
        var query = context.pgpromise.none(`UPDATE "Order"
            SET status = 'paid'
            WHERE "sberAcquOrderId" = '${context.sberOrderId}'`);
        return chakram.waitFor([
            query
        ]);
    };
};
