'use strict'

// author: dm-kamaev
// set amount and first payment in userFund
// used emulator sberAcquiring

const chakram = require('chakram');
const util    = require('util');
const expect = chakram.expect;
const await = require('asyncawait/await');
const path = require('path');
const queryString = require('query-string');
const config_admin = require('../config/admin.json');
const services = require('../services');
const entityService = services.entity;
const emulUrl = services.url.concatEmulUrl;
const urlService = services.url;
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

    const TYPE = entityService.getRandomType();
    before('Mount global chakram methods', mountChakramMethods_());

    // --------------------------------------------------------------------------
    before('Search random entity', () => entitiesApi.searchRandomEntity(TYPE));
    before('Set entity in context',() => context.set('listEntities', [ context.get(TYPE) ]));

    // --------------------------------------------------------------------------
    before('Logout',        logout(context));
    before('Register',      register(context));
    before('Get user info', getUserInfo(context));

    // --------------------------------------------------------------------------
    it('Add entities in userFund', addEntity(context));

    it('Set amount and first pay', function() {
        chakram.addMethod('checkFirstPay', function(respObj) {
            var statusCode = respObj.response.statusCode,
                body       = respObj.response.body;
            this.assert(
                statusCode === 200 && !body.errorCode,
                'Error: acquiring body: '+util.inspect(body, { depth:5 })
            );
            context.set('orderId', body.orderId);
            context.set('paymentRedirectUrl', body.formUrl);
            return chakram.wait();
        });
        var url      = urlService.addPath('user-fund/amount'),
            amount   = services.userFund.generateAmount(context.get('userFundId')),
            response = chakram.post(url, amount);
        return expect(response).checkFirstPay();
    });


    it('Should get orderNumber', function() {
        chakram.addMethod('checkOrderNumberSaved', function(respObj) {
            var statusCode = respObj.response.statusCode,
                body       = respObj.response.body;
            this.assert(
                statusCode === 200 && body.orderNumber,
                'Error: statuc: '+statusCode+' body: '+util.inspect(body, { depth:5 })
            );
            context.set('orderNumber', body.orderNumber);
            return chakram.wait();
        });
        var url = 'payment/rest/' +
                  'getOrderStatusExtended.do?orderId='+context.get('orderId')+'&'+
                  'clientId='+context.get('user').id;
        var response = chakram.get(emulUrl(url));
        return expect(response).checkOrderNumberSaved();
    });


    it('Check order status === "waitingForPay"', function() {
        var url = urlService.addPath('order/'+context.get('orderNumber'));
        var response = chakram.get(url);
        return expect(response).checkOrderStatus('waitingForPay');
    });

    it('Pay', function() {
        var response = chakram.get(context.get('paymentRedirectUrl'));
        return expect(response).to.have.status(200);
    });

    it('Check order status ==== "paid"', function() {
        var url = urlService.addPath('order/'+context.get('orderNumber'));
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
        return request.then(response => expect(response).checkOrderStatus('paid'))
                      .catch(err => console.log(new Error(err).stack));
    });
});


// mount global methods
function mountChakramMethods_ () {
    return function () {
        chakram.addMethod('checkOrderStatus', function(respObj, orderStatus) {
            const body = respObj.body;
            this.assert(
                body.status === orderStatus,
                'Incorrect status! Expected: "'+orderStatus+'" but recieved: "' +
                respObj.body.status+'"'
            );
            return chakram.wait();
        });
    };
}