'use strict'

const services = require('../../services');
const chakram = require('chakram');
const expect = chakram.expect;


module.exports = function(context) {
    chakram.addMethod('getUserInfo', function(respObj) {
        var statusCode = respObj.response.statusCode,
            body       = respObj.response.body;

        var user = respObj.body;
        context.user       = user;
        context.userFundId = user.userFund.id;

        this.assert(
            statusCode === 200,
            'Error status ' + statusCode + '; body:' + body
        );
        return chakram.wait();
    });

    return function () {
        var url = services.url.concatUrl('user');
        var response = chakram.get(url);
        expect(response).getUserInfo();
        return chakram.wait();
    };
};