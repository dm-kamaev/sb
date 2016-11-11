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

const logout = require('../modules/user/logout.js');
const register = require('../modules/user/register.js');
const getUserInfo = require('../modules/user/getUserInfo.js');
const createEntities = require('../modules/entity/createEntities.js');
const addEntity = require('../modules/entity/addEntity.js');
const firstPay = require('../modules/userFund/firstPay.js');
const userFund = require('../modules/userFund/userFund.js');
const checkCb = require('../modules/order/waitForCallback')
const payOrder = require('../modules/order/payOrder')
const admin = require('../modules/admin/admin')

chakram.setRequestDefaults({
    jar: true
});

const adminOptions = {
    headers: {
        'Token-Header': 'superSecretTokenString'
    }
}

describe('Admin operations', function() {
    var context = {
        chakram,
        expect,
        listEntities: [],
        db,
        adminOptions
    }

    before('create entities if not exists', createEntities(context));
    before('Logout', logout(context));
    before('Register user', register(context));

    it('add entity to userFund', addEntity(context));
    it('get user info', getUserInfo(context))
    it('set amount', firstPay.withOutCheck(context));
    it('pay order', payOrder(context))
    it('wait for cb', checkCb(context))

    it('logout', logout(context))

    it('Should get order', admin.getOrders(context))
    it('Should get entities from order', admin.getOrderEntities(context))
    it('Should get user in global list', admin.getUserList(context))
    it('Should get user profile', admin.getUserProfile(context))
    it('Should update user', admin.updateUser(context))
    it('Should get user subscriptions', admin.getUserSubscriptions(context))
    it('Should set amount on subscription', admin.setSubscriptionAmount(context))

    after('close db connection', pgp.end)
})
