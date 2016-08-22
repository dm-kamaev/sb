'use strict'

const chakram = require('chakram');
const expect = chakram.expect;
const exec = require('child_process').execSync;
const path = require('path');
const queryString = require('query-string');

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
    orderId,
    userId,
    orderNumber;

    before('Add methods', function () {
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

        chakram.addMethod('redirectRecievedAndSaved', function(respObj) {
            var redirect = respObj.body;
            this.assert(
                redirect.errorCode == undefined,
                'Acquiring returned error: ' +
                redirect.errorMessage
            );
            paymentRedirectUrl = redirect.formUrl;
            orderId = redirect.orderId;
            return chakram.wait();
        });

        chakram.addMethod('checkStatus', function(respObj, status) {
            this.assert(
                respObj.body.status == status,
                'Incorrect status! Expected: ' + status + ' but recieved: '
                    + respObj.body.status
            );
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

    it('Should add entity to userFund', function () {
        var url = services.url.concatUrl('user-fund/1');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
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

    it('Should get orderNumber', function () {
        var url = services.url.concatEmulUrl('payment/rest/' +
            'getOrderStatusExtended.do?orderId=' +
                orderId + '&clientId=' + userId);
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        expect(response).is.orderNumberSaved();
        return chakram.wait();
    });

    it('Should get waitingForPay status', function () {
        var url = services.url.concatUrl('order/'+orderNumber);
        var response = chakram.get(url);
        expect(response).is.checkStatus('waitingForPay');
        return chakram.wait();
    });

    it('Should pay', function() {
        var url = paymentRedirectUrl;
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    it('Should get paid status', function (done) {
        var url = services.url.concatUrl('order/'+orderNumber);
        //delay, because server need time to recieve callback from sber
        var request = new Promise(function(resolve, reject) {
            setTimeout(function() {
                try{
                    var response = chakram.get(url);
                    resolve(response);
                } catch (e) {
                    reject(e);
                }
            }, 500);
        });
        request.then(response => {
            chakram.waitFor([
                expect(response).is.checkStatus('paid'),
                done()
            ]);
        }).catch(e => console.log(e));
    });
});

describe('Unsuccess first payment test', function() {
    var userFundId,
    paymentRedirectUrl,
    orderId,
    orderNumber,
    userId;

    before('Add methods', function () {
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

        chakram.addMethod('redirectRecievedAndSaved', function(respObj) {
            var redirect = respObj.body;
            this.assert(
                redirect.errorCode == undefined,
                'Acquiring returned error: ' +
                redirect.errorMessage
            );
            paymentRedirectUrl = redirect.formUrl;
            orderId = redirect.orderId;
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
        var url = services.url.concatUrl('user-fund/1');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
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

    it('Should get orderNumber', function () {
        var url = services.url.concatEmulUrl('payment/rest/' +
            'getOrderStatusExtended.do?orderId=' +
                orderId + '&clientId=' + userId);
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        expect(response).is.orderNumberSaved();
        return chakram.wait();
    });

    it('Should get waitingForPay status', function () {
        var url = services.url.concatUrl('order/'+orderNumber);
        var response = chakram.get(url);
        expect(response).is.checkStatus('waitingForPay');
        return chakram.wait();
    });

    it('Should run cronscript', function () {
        //est. running time = 12000ms
        exec('node ../app/scripts/checkOrderStatus.js immediate',
            (error, stdout,  stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
        });
        return chakram.wait();
    });

    it('Should get failed status', function () {
        var url = services.url.concatUrl('order/'+orderNumber);
        var response = chakram.get(url);
        expect(response).is.checkStatus('failed');
        return chakram.wait();
    });
});

describe('Payment with inactive user fund test', function () {
    var userFundId,
        orderId,
        userId;

    before('Add methods', function () {
        chakram.addMethod('orderNumberSaved', function(respObj) {
            var emulatorOrder = respObj.body;
            orderNumber = emulatorOrder.orderNumber;
            return chakram.wait();
        });

        chakram.addMethod('fundDisabledAndIdSaved', function(respObj) {
            var user = respObj.body;
            this.assert(
                user.userFund.enabled == false,
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

    it('Should not set amount', function () {
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

    before('Add methods', function () {
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

    before('Add methods', function () {
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

    before('Fail orders', function () {
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
        var url = services.url.concatUrl('user-fund/1');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    it('Should not set amount', function() {
        var url = services.url.concatUrl('user-fund/amount');
        var amount = services.userFund.generateAmount(userFundId);
        var response = chakram.post(url, amount);
        expect(response).to.have.status(500);
        return chakram.wait();
    });

    it('Should get orderNumber', function () {
        var url = services.url.concatEmulUrl('client/' + userId + '/last');
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        expect(response).is.orderNumberSaved();
        return chakram.wait();
    });

    it('Should get eqOrderNotCreated status', function () {
        var url = services.url.concatUrl('order/'+orderNumber);
        var response = chakram.get(url);
        expect(response).is.checkStatus('eqOrderNotCreated');
        return chakram.wait();
    });

    after('Cancel ordrers failing', function () {
        var url = services.url.concatEmulUrl('fail/0');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });
});
