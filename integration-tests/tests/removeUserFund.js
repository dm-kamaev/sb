'use strict'

// author: dm-kamaev
// remove userFund

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

describe('Remove userFund =>', function() {
    var context = { listEntities: [], userFundId: 0 };

    before('Logout',   logout(context));
    before('Register', register(context));
    before('Create entities if not exists', createEntities(context));

    it('Add enity to userFund',           addEntity(context));
    it('Get user info',                   getUserInfo(context));
    it('First pay (create subscription)', firstPay.withOutCheck(context));

    it('Remove userFund', function () {
        var url      = services.url.addPath('user-fund/remove-userFund');
        var response = chakram.post(url);
        expect(response).to.have.status(200);
        return chakram.wait();
    });

    it('Check removed userFund', function () {
        chakram.addMethod('checkDeletedUserFund', function(deletedAt) {
            this.assert(deletedAt, 'User fund is not deleted');
            return chakram.wait();
        });
        var query = 'SELECT "UserFund"."deletedAt" FROM "UserFund" WHERE id='+context.userFundId;
        return db.one(query).then(data => expect(data.deletedAt).checkDeletedUserFund());
    });

    // --------------------------------------------------------------------------
    after('Logout', logout(context));
    after('Terminate db connection pool', () => pgp.end());
});
