'use strict'

const chakram = require('chakram');
const expect = chakram.expect;
const execSync = require('child_process').execSync;
const await = require('asyncawait/await');
const path = require('path');
const queryString = require('query-string');
var pgp = require('pg-promise')();
var db = pgp({
    host: 'localhost',
    port: 5432,
    database: 'sber-together-api',
    user: 'gorod',
    password: '123qwe'
});

var extend = require('util')._extend;


const services = require('../services');

chakram.setRequestDefaults({
    jar: true,
    har: {
        headers: [{
            name: 'Token-Header',
            value: 'superSecretTokenString'
        }]
    }
})

describe('Recurrent payments', function () {

})


describe('Success first payment test', function() {
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
                user.userFund.enabled == true,
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
                'Incorrect status! Expected: ' + status + ' but recieved: ' +
                respObj.body.status
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
        return chakram.get(services.url('entity'))
            .then(res => {
                var url = services.url.concatUrl(`user-fund/${res.body[0].id}`);
                var response = chakram.post(url);
                expect(response).to.have.status(200);
                return chakram.wait();
            })
    });

    it('Should set amount', function() {
        var url = services.url.concatUrl('user-fund/amount');
        var amount = services.userFund.generateAmount(userFundId);
        var response = chakram.post(url, amount);
        expect(response).to.have.status(200);
        expect(response).is.redirectRecievedAndSaved();
        return chakram.wait();
    });

    it('Should get orderNumber', function() {
        var url = services.url.concatEmulUrl('payment/rest/' +
            'getOrderStatusExtended.do?orderId=' +
            orderId + '&clientId=' + userId);
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        expect(response).is.orderNumberSaved();
        return chakram.wait();
    });

    it('Should get waitingForPay status', function() {
        var url = services.url.concatUrl('order/' + orderNumber);
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

    it('Should get paid status', function(done) {
        var url = services.url.concatUrl('order/' + orderNumber);
        //delay, because server need time to recieve callback from sber
        var request = new Promise(function(resolve, reject) {
            setTimeout(function() {
                try {
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
        }).catch(e => {
            chakram.waitFor([
                done(e)
            ])
        });
    });
});

describe('Unsuccess first payment test', function() {
    var userFundId,
        paymentRedirectUrl,
        orderId,
        orderNumber,
        userId;

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
        return chakram.get(services.url('entity'))
            .then(res => {
                var url = services.url.concatUrl(`user-fund/${res.body[0].id}`);
                var response = chakram.post(url);
                expect(response).to.have.status(200);
                return chakram.wait();
            })
    });

    it('Should set amount', function() {
        var url = services.url.concatUrl('user-fund/amount');
        var amount = services.userFund.generateAmount(userFundId);
        var response = chakram.post(url, amount);
        expect(response).to.have.status(200);
        expect(response).is.redirectRecievedAndSaved();
        return chakram.wait();
    });

    it('Should get orderNumber', function() {
        var url = services.url.concatEmulUrl('payment/rest/' +
            'getOrderStatusExtended.do?orderId=' +
            orderId + '&clientId=' + userId);
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        expect(response).is.orderNumberSaved();
        return chakram.wait();
    });

    it('Should get waitingForPay status', function() {
        var url = services.url.concatUrl('order/' + orderNumber);
        var response = chakram.get(url);
        expect(response).is.checkStatus('waitingForPay');
        return chakram.wait();
    });

    it('Should run cronscript', function() {
        //est. running time = 12000ms
        execSync('node ../app/scripts/checkOrderStatus.js immediate',
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            });
        return chakram.wait();
    });

    it('Should get failed status', function() {
        var url = services.url.concatUrl('order/' + orderNumber);
        var response = chakram.get(url);
        expect(response).is.checkStatus('failed');
        return chakram.wait();
    });
});

process.exit()

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
