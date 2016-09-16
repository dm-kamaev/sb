'use strict'

const services = require('../../services');
const log = console.log;

module.exports = function(context) {
    var chakram = context.chakram, expect  = context.expect;

    chakram.addMethod('checkAddEntity', function(respObj) {
        var statusCode = respObj.response.statusCode,
            body       = respObj.response.body;
        this.assert(
            statusCode === 200,
            'Error status ' + statusCode + '; body:' + body
        );
        return chakram.wait();
    });

    return function () {
        var url      = services.url.concatUrl('user-fund/'+context.listEntities[0].id);
        var response = chakram.post(url);
        expect(response).checkAddEntity();
        return chakram.wait();
    };
};