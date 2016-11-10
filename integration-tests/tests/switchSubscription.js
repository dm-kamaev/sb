'use strict'

// author: dm-kamaev
// swaitch subscription on userFund

const chakram = require('chakram');
const expect = chakram.expect;
const services = require('../services');
const config_db = require('../config/db.json');
const config_admin = require('../config/admin.json');
const pgpOptions = require('../config/pgpOptions.js');
const pgp = require('pg-promise')(pgpOptions);
const db = pgp(config_db);
const util = require('util');
const log = console.log;

const logout = require('../modules/user/logout.js');
const register = require('../modules/user/register.js');
const getUserInfo = require('../modules/user/getUserInfo.js');
const createEntities = require('../modules/entity/createEntities.js');
const addEntity   = require('../modules/entity/addEntity.js');
const firstPay    = require('../modules/userFund/firstPay.js');
const userFund    = require('../modules/userFund/userFund.js');


chakram.setRequestDefaults(config_admin);

describe('Switch subscription =>', function() {
    var context = { listEntities: [], db };

    before('Logout',   logout(context));
    before('Register', register(context));
    before('Create entities if not exists', createEntities(context));

    it('Add enity to userFund',           addEntity(context));
    it('Get user info',                   getUserInfo(context));
    it('First pay (create subscription)', firstPay.withOutCheck(context));


    context.enabled = true;
    it('Turn on subscribtion',                      userFund.switchSubscription(context));
    it('Check field enable the subscribtion in db', userFund.checkStatusSubscription(context));

    context.enabled = false;
    it('Turn off subscribtion',                     userFund.switchSubscription(context));
    it('Check field enable the subscribtion in db', userFund.checkStatusSubscription(context));


    // --------------------------------------------------------------------------
    after('Logout', logout(context));
    after('Terminate db connection pool', () => pgp.end());
});
