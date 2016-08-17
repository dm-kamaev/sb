'use strict'

const chakram = require('chakram');
const expect = chakram.expect;

var extend = require('util')._extend;


const services = require('../services');

chakram.setRequestDefaults({
    jar: true
});

describe('User fund Actions Test', function() {
    var entitiesIdList = [];

    before('Add methods', function() {
        chakram.addMethod('entitiesAdded', function(respObj) {
            var self = this;
            var entities = respObj.body;

            var entityIds = entities.map((entity) => entity.id);
            entitiesIdList.forEach(function (id) {
                self.assert(
                    !(id in entityIds),
                    'Entity with id '+ id + ' is not added'
                )
            });
        });
        chakram.addMethod('saveAddedEntity', function(respObj) {
            this.assert(
                respObj.body.id,
                'Can\'t run test, entity not added'
            )
            entitiesIdList.push(respObj.body.id);
        });
        chakram.addMethod('entitiesDeleted', function(respObj) {
            var self = this;
            var entities = respObj.body;
            var entityIds = entities.map((entity) => entity.id);
            entitiesIdList.forEach(function (id) {
                self.assert(
                    !(id in entityIds),
                    'Entity with id ' + id + ' is not deleted'
                )
            });
        });
    });

    before('Register', function() {
        var url = services.url.concatUrl('auth/register');
        var user = services.user.genRandomUser();
        var response = chakram.post(url, user);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    before('Load entities', function() {
        var entities = services.entity.generateEntities(3);
        var url = services.url.concatUrl('entity');
        entities.forEach(function(entity) {
            var ent = chakram.post(url, entity);
            expect(ent).saveAddedEntity();
        });
        return chakram.wait();
    });

    it('Should add entities', function() {
        entitiesIdList.forEach(function (entityId) {
            var url = services.url.concatUrl('user-fund/'+entityId);
            var res = chakram.post(url);
            expect(res).to.have.status(200);
            chakram.wait();
        });
        return chakram.wait();
    });

    it('Should get added entities', function () {
        var url = services.url.concatUrl('user-fund/entity');
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        expect(response).entitiesAdded();
        return chakram.wait();
    });

    it('Should delete entities', function () {
        entitiesIdList.forEach(function (entityId) {
            var url = services.url.concatUrl('user-fund/'+entityId);
            var res = chakram.delete(url);
            expect(res).to.have.status(200);
        });
        return chakram.wait();
    });

    it('Should not get deleted entities', function () {
        var url = services.url.concatUrl('user-fund/entity');
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        expect(response).entitiesDeleted();
        return chakram.wait();
    });
});

describe('Success first payment test', function() {
    var userFundId,
        paymentRedirectUrl,
        orderId;

    before('Add methods', function () {
        chakram.addMethod('fundEnabledAndIdSaved', function(respObj) {
            var fund = respObj.body.userFund;
            this.assert(
                fund.enabled,
                'User fund is not enabled!'
            )
            userFundId = fund.id;
            return chakram.wait();
        });

        chakram.addMethod('redirectRecievedAndSaved', function(respObj) {
            var redirect = respObj.body;
            this.assert(
                !(redirect.errorCode = undefined),
                'Acquiring returned error: ' +
                redirect.errorMessage
            );
            paymentRedirectUrl = redirect.formUrl;
            orderId = redirect.orderId;
            return chakram.wait();
        });
    });

    it('Should create user fund', function() {
        var url = services.url.concatUrl('user/user-fund');
        var fund = services.userFund.generateFund();
        var response = chakram.post(url, fund);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    it('Should get user with enabled fund', function() {
        var url = services.url.concatUrl('user');
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        expect(response).is.fundEnabledAndIdSaved();
        return chakram.wait();
    });

    it('Should set amount', function() {
        var url = services.url.concatUrl('user-fund/amount');
        var amount = services.userFund.generateAmount(userFundId);
        var response = chakram.post(url, amount);
        expect(response).to.have.status(200);
        expect(response).is.redirectRecievedAndSaved();
        return chakram.wait();
    });

    it('Should pay', function() {
        var url = paymentRedirectUrl;
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    it('Should get amount', function () {
        var url = services.url.concatUrl('user-fund/amount');
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });
});
