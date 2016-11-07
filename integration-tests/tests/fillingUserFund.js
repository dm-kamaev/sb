'use strict'

// author: dm-kamaev
// added entites in userFund

const util = require('util');
const chakram = require('chakram');
const expect = chakram.expect;
const services = require('../services');
const config_db = require('../config/db.json');
const config_admin = require('../config/admin.json');
const pgp = require('pg-promise')();
const db = pgp(config_db);
const logger = require('./../../app/components/logger/').getLogger('main');
const Context = require('./../../app/components/context');
const entityTypes = require('../../app/modules/entity/enums/entityTypes.js');

const logout = require('../modules/user/logout.js');
const register = require('../modules/user/register.js');
const getUserInfo = require('../modules/user/getUserInfo.js');
const EntitiesApi = require('../modules/entity/entitiesApi.js');
const UserFundApi = require('../modules/userFund/userFundApi.js');
const UserFundApiDb = require('../modules/userFund/userFundApiDb.js');
const FUND      = entityTypes.FUND,
      DIRECTION = entityTypes.DIRECTION,
      TOPIC     = entityTypes.TOPIC;
chakram.setRequestDefaults(config_admin);


describe('Filling userFund =>', function() {
    const context       = new Context();
    const userFundApi   = new UserFundApi(context);
    const entitiesApi   = new EntitiesApi(context);
    const userFundApiDb = new UserFundApiDb(context);

    before('Logout',   logout(context));
    before('Register', register(context));

    // --------------------------------------------------------------------------
    before('Search random topic',     () => entitiesApi.searchRandomEntity(TOPIC));
    before('Search random direction', () => entitiesApi.searchRandomEntity(DIRECTION));
    before('Search random fund',      () => entitiesApi.searchRandomEntity(FUND));

    // --------------------------------------------------------------------------
    // { '19': [ 126, 42, 70, 46, 51, .. ] }
    it(`Build association for ${TOPIC}`, () =>
        entitiesApi.buildAssociation(TOPIC, [ DIRECTION, FUND ])
    );

    it(`Add ${TOPIC} in userFund`, () => {
        userFundApi.addEntity(context.get(TOPIC));
        return chakram.wait();
    });

    it('Check added entities in userFund', () => userFundApi.checkAddedEntities());

    it('Get user info', getUserInfo(context));

    it('Clean userFund via db', () => userFundApiDb.cleanUserFund());


    // --------------------------------------------------------------------------
    // { '19': [ 126, 42, 70, 46, 51, .. ] }
    it(`Build association for ${DIRECTION}`, () =>
        entitiesApi.buildAssociation(DIRECTION, [ FUND ])
    );
    it(`Add ${DIRECTION} in userFund`, () => {
        userFundApi.addEntity(context.get(DIRECTION));
        return chakram.wait();
    });

    it('Check added entities in userFund', () => userFundApi.checkAddedEntities());

    it('Clean userFund via db', () => userFundApiDb.cleanUserFund());


    // --------------------------------------------------------------------------
    it(`Add ${FUND} in userFund`, () => {
        context.change('associations', null);
        return userFundApi.addEntity(context.get(FUND));
    });

    it(`Check added ${FUND} in userFund`, () => userFundApi.checkAddedEntities());

    it('Clean userFund via db', () => userFundApiDb.cleanUserFund());


    // --------------------------------------------------------------------------
    after('Terminate db connection pool', () => pgp.end());
});