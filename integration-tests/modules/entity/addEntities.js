'use strict'

const services = require('../../services');
const log = console.log;
const chakram = require('chakram');

module.exports = function(context) {
    var expect  = context.expect;

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
        var url = services.url.concatUrl('user-fund');
        var results = Promise.all(context.entities.map(entity => {
            return chakram.post(url + '/' + entity.id);
        }));
        return chakram.waitFor([
            results.then(res => {
                return Promise.all(res.map(result => {
                    expect(result).checkAddEntity();
                }))
            })
        ]);
    };
};
