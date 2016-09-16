'use strict'

const services = require('../../services');
const log = console.log;

module.exports = function(context) {
    var chakram = context.chakram,
        expect  = context.expect;

    chakram.addMethod('checkRegister', function(respObj) {
        var statusCode = respObj.response.statusCode,
            body       = respObj.response.body;
        this.assert(
            statusCode === 200,
            'Error status ' + statusCode + '; body:' + body
        );
        return chakram.wait();
    });

    return function() {
        var url = services.url.concatUrl('auth/register');
        var user = services.user.genRandomUser();
        var response = chakram.post(url, user);
        // expect(response).to.have.status(200);
        expect(response).to.have.checkRegister();
        return chakram.wait();
    }
};