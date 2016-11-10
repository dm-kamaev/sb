'use strict'

const chakram = require('chakram');
const util    = require('util');
const expect = chakram.expect;
const execSync = require('child_process').execSync;
const await = require('asyncawait/await');
const path = require('path');
const queryString = require('query-string');
const pgpOptions = require('../config/pgpOptions.js');
const config_db = require('../config/db.json');
const pgp = require('pg-promise')(pgpOptions);
const config_admin = require('../config/admin.json');
const db = pgp(config_db);
const services = require('../services');
const entityService = services.entity;
const entityTypes = require('../../app/modules/entity/enums/entityTypes.js');
const addEntity   = require('../modules/entity/addEntity.js');

const getUserInfo = require('../modules/user/getUserInfo.js');
chakram.setRequestDefaults(config_admin);

const logout = require('../modules/user/logout.js');
const register = require('../modules/user/register.js');
const EntitiesApi = require('../modules/entity/entitiesApi.js');
const Context = require('./../../app/components/context');


describe('Payment with inactive user fund test', function() {
    var userFundId,
        orderId,
        orderNumber,
        userId;

    before('Add methods', function() {
        chakram.addMethod('orderNumberSaved', function(respObj) {
            var emulatorOrder = respObj.body;
            orderNumber = emulatorOrder.orderNumber;
            return chakram.wait();
        });

        chakram.addMethod('fundDisabledAndIdSaved', function(respObj) {
            var user = respObj.body;
            this.assert(
                !user.userFund.enabled,
                'User fund is enabled!'
            )
            userFundId = user.userFund.id;
            userId = user.id;
            return chakram.wait();
        });

    });
    before('Logout', function() {
        var url = services.url.concatUrl('auth/logout');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    before('Register', function() {
        var url = services.url.concatUrl('auth/register');
        var user = services.user.genRandomUser();
        var response = chakram.post(url, user);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    it('Should get user with disabled fund', function() {
        var url = services.url.concatUrl('user');
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        expect(response).is.fundDisabledAndIdSaved();
        return chakram.wait();
    });

    it('Should not set amount', function() {
        var url = services.url.concatUrl('user-fund/amount');
        var amount = services.userFund.generateAmount(userFundId);
        var response = chakram.post(url, amount);
        expect(response).to.have.status(400);
        return chakram.wait();
    });
});

describe('Payment with empty fund test', function() {
    var userFundId,
        userId;

    before('Add methods', function() {
        chakram.addMethod('fundEnabledAndIdSaved', function(respObj) {
            var user = respObj.body;
            this.assert(
                user.userFund.enabled,
                'User fund is not enabled!'
            )
            userFundId = user.userFund.id;
            userId = user.id;
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

    it('Should not set amount', function() {
        var url = services.url.concatUrl('user-fund/amount');
        var amount = services.userFund.generateAmount(userFundId);
        var response = chakram.post(url, amount);
        expect(response).to.have.status(400);
        return chakram.wait();
    });
});

describe('Sber acquiring fails test', function() {
    var userFundId,
        paymentRedirectUrl,
        orderId,
        userId,
        orderNumber;

    before('Add methods', function() {
        chakram.addMethod('orderNumberSaved', function(respObj) {
            var emulatorOrder = respObj.body;
            orderNumber = emulatorOrder.orderNumber;
            return chakram.wait();
        });

        chakram.addMethod('fundEnabledAndIdSaved', function(respObj) {
            var user = respObj.body;
            this.assert(
                user.userFund.enabled,
                'User fund is not enabled!'
            )
            userFundId = user.userFund.id;
            userId = user.id;
            return chakram.wait();
        });
    });

    before('Logout', function() {
        var url = services.url.concatUrl('auth/logout');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    before('Register', function() {
        var url = services.url.concatUrl('auth/register');
        var user = services.user.genRandomUser();
        var response = chakram.post(url, user);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    before('Fail orders', function() {
        var url = services.url.concatEmulUrl('fail/1');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
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

    it('Should add entity to userFund', function () {
        return chakram.get(services.url('entity'))
            .then(res => {
                var url = services.url.concatUrl(`user-fund/${res.body[0].id}`);
                var response = chakram.post(url);
                expect(response).to.have.status(200);
                return chakram.wait();
            })
    });

    it('Should not set amount', function() {
        var url = services.url.concatUrl('user-fund/amount');
        var amount = services.userFund.generateAmount(userFundId);
        var response = chakram.post(url, amount);
        expect(response).to.have.status(503);
        return chakram.wait();
    });

    it('Should get orderNumber', function() {
        var url = services.url.concatEmulUrl('client/' + userId + '/last');
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        expect(response).is.orderNumberSaved();
        return chakram.wait();
    });

    it('Should get eqOrderNotCreated status', function() {
        var url = services.url.concatUrl('order/' + orderNumber);
        var response = chakram.get(url);
        expect(response).is.checkStatus('eqOrderNotCreated');
        return chakram.wait();
    });

    after('Cancel ordrers failing', function() {
        var url = services.url.concatEmulUrl('fail/0');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });
});
