'use strict'

const chakram = require('chakram');
const expect = chakram.expect;
const execSync = require('child_process').execSync;
const path = require('path');
const queryString = require('query-string');
const services = require('../services');

const pgp = require('pg-promise')();
const connection = {
    host: 'localhost',
    port: 5432,
    database: 'sber-together-api',
    user: 'gorod',
    password: '123qwe'
}
const db = pgp(connection)

var extend = require('util')._extend;



chakram.setRequestDefaults({
    jar: true,
    har: {
        headers: [
            {
                name: 'Token-Header',
                value: 'superSecretTokenString'
            }
        ]
    }
});

describe('Yesterday recurrent test', function () {
    before('Should register', function() {
        var url = services.url.concatUrl('auth/register');
        var user = services.user.genRandomUser();
        var response = chakram.post(url, user);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    var userFundId,
    paymentRedirectUrl,
    orderId,
    userId,
    orderNumber,
    subscriptionId;

    before('Add methods', function () {
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
                'Incorrect status! Expected: ' + status + ' but recieved: '
                    + respObj.body.status
            );
            return chakram.wait();
        });

        chakram.addMethod('subscriptionIdSaved', function (respObj) {
            subscriptionId = respObj.body.userFundSubscription.id;
            return chakram.wait();
        })
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
                expect(response).is.subscriptionIdSaved(),
                done()
            ]);
        }).catch(e => {
            chakram.waitFor([
                done(e)
            ])
        });
    });

    it('Should change scheduledPayDate', function() {
        var dateString = '2016-08-20';
        var date = new Date(dateString).toUTCString();
        return chakram.waitFor([
            db.none(`UPDATE "Order"
                SET "scheduledPayDate" = '${date}'
                WHERE "sberAcquOrderNumber" = ${orderNumber}`)
        ])
    });

    it('Should change paydate', function() {
        var dateString = '2016-08-20';
        var date = new Date(dateString).toUTCString();
        return chakram.waitFor([
            db.one(`UPDATE "PayDayHistory"
                SET "payDate" = '${date}'
                WHERE "subscriptionId" = ${subscriptionId}
                RETURNING *`)
        ])
    });

    it('Should run monthly payment script', function() {
        execSync('node ../app/scripts/monthlyPayments.js --now \'2016-09-21\'',
            (error, stdout,  stderr) => {
                if (error) {
                    console.error(`execSync error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
        });
        return chakram.wait();
    });

    it('Should get order from this subscription', function() {
        return chakram.waitFor([
            db.one(`SELECT * FROM "Order"
                WHERE "userFundSubscriptionId" = ${subscriptionId}
                AND "type" = 'recurrent'
                AND "status" = 'paid'
                ORDER BY "updatedAt"`)
        ]);
    })

    after('Logout', function () {
        var url = services.url.concatUrl('auth/logout');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });
});

describe('End of  recurrent test', function () {
    before('Should register', function() {
        var url = services.url.concatUrl('auth/register');
        var user = services.user.genRandomUser();
        var response = chakram.post(url, user);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    var userFundId,
    paymentRedirectUrl,
    orderId,
    userId,
    orderNumber,
    subscriptionId;

    before('Add methods', function () {
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
                'Incorrect status! Expected: ' + status + ' but recieved: '
                    + respObj.body.status
            );
            return chakram.wait();
        });

        chakram.addMethod('subscriptionIdSaved', function (respObj) {
            subscriptionId = respObj.body.userFundSubscription.id;
            return chakram.wait();
        })
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
                expect(response).is.subscriptionIdSaved(),
                done()
            ]);
        }).catch(e => {
            chakram.waitFor([
                done(e)
            ])
        });
    });

    it('Should change scheduledPayDate', function() {
        var dateString = '2016-09-29';
        var date = new Date(dateString).toUTCString();
        return chakram.waitFor([
            db.none(`UPDATE "Order"
                SET "scheduledPayDate" = '${date}'
                WHERE "sberAcquOrderNumber" = ${orderNumber}`)
        ])
    });

    it('Should change paydate', function() {
        var dateString = '2016-09-29';
        var date = new Date(dateString).toUTCString();
        return chakram.waitFor([
            db.one(`UPDATE "PayDayHistory"
                SET "payDate" = '${date}'
                WHERE "subscriptionId" = ${subscriptionId}
                RETURNING *`)
        ])
    });

    it('Should run monthly payment script', function() {
        execSync('node ../app/scripts/monthlyPayments.js --now \'2016-10-31\'',
            (error, stdout,  stderr) => {
                if (error) {
                    console.error(`execSync error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
        });
        return chakram.wait();
    });

    it('Should get order from this subscription', function() {
        return chakram.waitFor([
            db.one(`SELECT * FROM "Order"
                WHERE "userFundSubscriptionId" = ${subscriptionId}
                AND "type" = 'recurrent'
                AND "status" = 'paid'
                ORDER BY "updatedAt"`)
        ]);
    })

    after('Logout', function () {
        var url = services.url.concatUrl('auth/logout');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });
});

describe('Stopping payments for two error months', function () {
    before('Should register', function() {
        var url = services.url.concatUrl('auth/register');
        var user = services.user.genRandomUser();
        var response = chakram.post(url, user);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    var userFundId,
    paymentRedirectUrl,
    orderId,
    userId,
    orderNumber,
    subscriptionId;

    before('Add methods', function () {
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
                'Incorrect status! Expected: ' + status + ' but recieved: '
                    + respObj.body.status
            );
            return chakram.wait();
        });

        chakram.addMethod('subscriptionIdSaved', function (respObj) {
            subscriptionId = respObj.body.userFundSubscription.id;
            return chakram.wait();
        })
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
                expect(response).is.subscriptionIdSaved(),
                done()
            ]);
        }).catch(e => {
            chakram.waitFor([
                done(e)
            ])
        });
    });

    it('Should change scheduledPayDate', function() {
        var dateString = '2016-08-10';
        var date = new Date(dateString).toUTCString();
        return chakram.waitFor([
            db.none(`UPDATE "Order"
                SET "scheduledPayDate" = '${date}'
                WHERE "sberAcquOrderNumber" = ${orderNumber}`)
        ])
    });

    it('Should change paydate', function() {
        var dateString = '2016-08-10';
        var date = new Date(dateString).toUTCString();
        return chakram.waitFor([
            db.one(`UPDATE "PayDayHistory"
                SET "payDate" = '${date}'
                WHERE "subscriptionId" = ${subscriptionId}
                RETURNING *`)
        ])
    });

    it('Should set failingBindings', function() {
        var url = services.url.concatEmulUrl('failBindings/1')
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    it('Should run monthly payment script', function() {
        execSync('node ../app/scripts/monthlyPayments.js --now \'2016-09-10\'',
            (error, stdout,  stderr) => {
                if (error) {
                    console.error(`execSync error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
        });
        return chakram.wait();
    });

    it('Should run monthly payment script', function() {
        execSync('node ../app/scripts/monthlyPayments.js --now \'2016-10-10\'',
            (error, stdout,  stderr) => {
                if (error) {
                    console.error(`execSync error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
        });
        return chakram.wait();
    });

    it('Should run monthly payment script', function() {
        execSync('node ../app/scripts/monthlyPayments.js --now \'2016-11-10\'',
            (error, stdout,  stderr) => {
                if (error) {
                    console.error(`execSync error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
        });
        return chakram.wait();
    });


    it('Should get order from this subscription', function() {
        return chakram.waitFor([
            db.one(`SELECT * FROM "UserFundSubsription"
                WHERE "id" = ${subscriptionId}
                AND "enabled" = false`)
        ]);
    });

    it('Should unset failingBindings', function() {
        var url = services.url.concatEmulUrl('failBindings/0');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    after('Logout', function () {
        var url = services.url.concatUrl('auth/logout');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });
});
