'use strict'

const chakram = require('chakram');
const expect = chakram.expect;
const execSync = require('child_process').execSync;
const path = require('path');
const queryString = require('query-string');
const services = require('../services');

const logout = require('../modules/user/logout.js');
const register = require('../modules/user/register.js');
const getUserInfo = require('../modules/user/getUserInfo.js');
const createEntities = require('../modules/entity/createEntitiesForCounting.js');
const associate = require('../modules/entity/associateEntities.js');
const addEntities = require('../modules/entity/addEntities.js');
const firstPay = require('../modules/userFund/firstPay.js');
const setOrderPaid = require('../modules/order/setOrderPaid.js');
const checkRecommendation =
    require('../modules/recommendation/checkRecommendationResult.js');

const pgp = require('pg-promise')();
const connection = {
    host: 'localhost',
    port: 5432,
    database: 'sber-together-api',
    user: 'gorod',
    password: '123qwe'
}
const db = pgp(connection)

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
describe('Count payments to funds', function() {
    var context = {
        pgpromise: db,
        chakram,
        expect,
        entities: [],
        sberOrderId: '',
        amount: 6969696
    };

    before('Register', register(context));
    before('Create entities', createEntities(context));
    //before('Associate entities', associate(context));

    it('Should add entities', addEntities(context));
    it('Should make first payment', firstPay.withOutCheck(context));
    it('Should set order paid', setOrderPaid(context));
    it('Should check recommendation', checkRecommendation(context));
})
