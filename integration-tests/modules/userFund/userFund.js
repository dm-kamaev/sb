'use strict'

const services = require('../../services');
const config_db = require('../../config/db.json');
const db = require('pg-promise')()(config_db);
const chakram = require('chakram');
const expect = chakram.expect;

exports.switchSubscription = function(context) {
    chakram.addMethod('checkTurnOnSubscribe', function(respObj) {
        var statusCode = respObj.response.statusCode,
            body       = respObj.response.body;

        this.assert(
            statusCode === 200,
            'Error status ' + statusCode + '; body:' + body
        );
        return chakram.wait();
    });

    return function () {
        var url = services.url.concatUrl('user-fund/switching-subscriptions');
        var response = chakram.post(url, { enabled: context.enabled });
        expect(response).checkTurnOnSubscribe();
        return chakram.wait();
    };
};


exports.checkStatusSubscription = function(context) {
    chakram.addMethod('checkStatusSubscribe', function(enabled) {
        this.assert(
            context.enabled === enabled,
            'Enable must be "'+context.enabled+'", but '+enabled
        );
        return chakram.wait();
    });

    return function () {
        var query = 'SELECT enabled FROM "UserFundSubscription" WHERE "userFundId"='+context.userFundId;
        return db.one(query).then(subscribe => expect(subscribe.enabled).checkStatusSubscribe());
    };
};