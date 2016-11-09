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


describe('Success first payment =>', function() {
    const context     = new Context();
    const entitiesApi = new EntitiesApi(context);

    before('Add methods', function() {
        chakram.addMethod('checkOrderNumberSaved', function(respObj) {
            console.log(respObj);
            var statusCode = respObj.response.statusCode,
                body       = respObj.response.body;
            this.assert(
                statusCode === 200,
                'Error: statuc: '+statusCode+' body: '+util.inspect(body, { depth:5 })
            );
            context.set('orderNumber', body.orderNumber);
            return chakram.wait();
        });

    //     chakram.addMethod('fundEnabledAndIdSaved', function(respObj) {
    //         var user = respObj.body;
    //         this.assert(
    //             user.userFund.enabled == true,
    //             'User fund is not enabled!'
    //         )
    //         userFundId = user.userFund.id;
    //         userId = user.id;
    //         return chakram.wait();
    //     });

        chakram.addMethod('checkFirstPay', function(respObj) {
            var statusCode = respObj.response.statusCode,
                body       = respObj.response.body;
            this.assert(
                statusCode === 200 && !body.errorCode,
                'Error: acquiring body: '+util.inspect(body, { depth:5 })
            );
            console.log(body);
            context.set('orderId', body.orderId)
            return chakram.wait();
        });

    //     chakram.addMethod('checkStatus', function(respObj, status) {
    //         this.assert(
    //             respObj.body.status == status,
    //             'Incorrect status! Expected: ' + status + ' but recieved: ' +
    //             respObj.body.status
    //         );
    //         return chakram.wait();
    //     });
    });

    const TYPE = entityService.getRandomType();
    // --------------------------------------------------------------------------
    before('Search random entity', () => entitiesApi.searchRandomEntity(TYPE));
    before('Set entity in context',() => context.set('listEntities', [ context.get(TYPE) ]));

    // --------------------------------------------------------------------------
    before('Logout',        logout(context));
    before('Register',      register(context));
    before('Get user info', getUserInfo(context));

    it('Add entities in userFund', addEntity(context));

    it('Set amount and first pay', function() {
        var url      = services.url.concatUrl('user-fund/amount'),
            amount   = services.userFund.generateAmount(context.get('userFundId')),
            response = chakram.post(url, amount);
        return expect(response).checkFirstPay();
    });


    it('Should get orderNumber', function() {
        var url = 'payment/rest/' +
                  'getOrderStatusExtended.do?orderId='+context.get('orderId')+'&'+
                  'clientId='+context.get('user').id;
        console.log(url);
        url = services.url.concatEmulUrl(url);
        var response = chakram.get(url);
        return expect(response).checkOrderNumberSaved();
    });


    it('Debug', function () {
        console.log(context.listEntities);
        console.log(context.userFundId);
        console.log(context.orderId);
    });


    // it('Should get waitingForPay status', function() {
    //     var url = services.url.concatUrl('order/' + orderNumber);
    //     var response = chakram.get(url);
    //     expect(response).is.checkStatus('waitingForPay');
    //     return chakram.wait();
    // });

    // it('Should pay', function() {
    //     var url = paymentRedirectUrl;
    //     var response = chakram.get(url);
    //     expect(response).to.have.status(200);
    //     return chakram.wait();
    // });

    // it('Should get paid status', function(done) {
    //     var url = services.url.concatUrl('order/' + orderNumber);
    //     //delay, because server need time to recieve callback from sber
    //     var request = new Promise(function(resolve, reject) {
    //         setTimeout(function() {
    //             try {
    //                 var response = chakram.get(url);
    //                 resolve(response);
    //             } catch (e) {
    //                 reject(e);
    //             }
    //         }, 500);
    //     });
    //     request.then(response => {
    //         chakram.waitFor([
    //             expect(response).is.checkStatus('paid'),
    //             done()
    //         ]);
    //     }).catch(e => {
    //         chakram.waitFor([
    //             done(e)
    //         ])
    //     });
    // });
});