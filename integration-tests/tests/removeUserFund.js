'use strict'

const chakram = require('chakram');
const expect = chakram.expect;
const services = require('../services');
const config_db = require('../config/db.json');
const db = require('pg-promise')()(config_db);
const util = require('util');
const log = console.log;

chakram.setRequestDefaults({
    jar: true,
    har: {
        headers: [{
            name: 'Token-Header',
            value: 'superSecretTokenString'
        }]
    }
})

describe('Remove userFund =>', function() {
    var listEntities = [], userFundId;

    before('Add methods', function() {
        chakram.addMethod('getUserFundId', function(respObj) {
            var user   = respObj.body;
            userFundId = user.userFund.id;
            return chakram.wait();
        });
        chakram.addMethod('checkDeletedUserFund', function(deletedAt) {
            this.assert(
                deletedAt,
                'User fund is not deleted'
            )
            return chakram.wait();
        });
    });

    before('Logout', function() {
        var url = services.url.concatUrl('auth/logout');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    before('Register', function () {
        var url      = services.url.concatUrl('auth/register');
        var user     = services.user.genRandomUser();
        var response = chakram.post(url, user);
        expect(response).to.have.status(200);
        return chakram.wait();
    });


    before('Should create entities if not exists', function () {
        return db.any('SELECT * FROM "Entity" LIMIT 1').then((entities) => {
          if (!entities.length) {
            entities = services.entity.generateEntities(1);
            var url = services.url.concatUrl('entity');
            return chakram.get(services.url('entity'))
                .then(res => {
                    if (res.body[0]) {
                        return chakram.post(url, entities[0]);
                    }
                })
                .then(() => {
                    listEntities = entities;
                    return chakram.wait();
                })
          } else {
            listEntities = entities;
          }
        })
    });


    it('Added enity to userFund', function () {
        var url      = services.url.concatUrl('user-fund/'+listEntities[0].id);
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });


    it('Get user info', function () {
        var url = services.url.concatUrl('user');
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        expect(response).is.getUserFundId();
        return chakram.wait();
    });


    it('First pay (create subscription)', function () {
        var url      = services.url.concatUrl('user-fund/amount');
        var params   = services.userFund.generateAmount(userFundId);
        var response = chakram.post(url, params);
        // don't check http status, because even if failed then subscription and
        // order was created anyway
        return chakram.wait();
    });


    it('Remove userFund', function () {
        var url      = services.url.concatUrl('user-fund/remove-userFund');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });


    it('Check removed userFund', function () {
        var query = 'SELECT "deletedAt" FROM "UserFund" WHERE id='+userFundId;
        return db.one(query).then(data => expect(data.deletedAt).checkDeletedUserFund());
    });

});