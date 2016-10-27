'use strict'

const services = require('../../services');
const chakram = require('chakram');
const expect = chakram.expect;


module.exports = function(context) {
    chakram.addMethod('checkLogout', function(respObj) {
        var response   = respObj.response || {},
            statusCode = response.statusCode,
            body       = response.body;
        this.assert(
            statusCode === 200,
            'Error status ' + statusCode + '; body:' + body
        );
        return chakram.wait();
    });

    return function() {
        var url = services.url.concatUrl('auth/logout');
        var response = chakram.post(url);
        expect(response).checkLogout();
        return chakram.wait();
    };
};
