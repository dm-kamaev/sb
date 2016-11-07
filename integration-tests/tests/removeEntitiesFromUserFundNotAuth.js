'use strict'

// author: dm-kamaev
// remove entities from userFund
// userFund must be empty

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
const UserFundApi = require('../modules/userFund/userFundApi.js');
const EntitiesApi = require('../modules/entity/entitiesApi.js');
const FUND      = entityTypes.FUND,
      DIRECTION = entityTypes.DIRECTION,
      TOPIC     = entityTypes.TOPIC;
chakram.setRequestDefaults(config_admin);


describe('Remove entities from userFund (not auth user)  =>', function() {
    const context   = new Context();
    const userFundApi = new UserFundApi(context);
    const entitiesApi = new EntitiesApi(context);

    before('Logout',   logout(context));

    before('Search random topic',     () => entitiesApi.searchRandomEntity(TOPIC));
    before('Search random direction', () => entitiesApi.searchRandomEntity(DIRECTION));
    before('Search random fund',      () => entitiesApi.searchRandomEntity(FUND));


    // --------------------------------------------------------------------------
    // { '19': [ 126, 42, 70, 46, 51, .. ] }
    it(`Build association for ${TOPIC}`, () =>
        entitiesApi.buildAssociation(TOPIC, [ DIRECTION, FUND ])
    );

    it(`Add ${TOPIC} in userFund`, ()=>userFundApi.addEntity(context.get(TOPIC)));

    it('Check added entities in userFund', () => userFundApi.checkAddedEntities());

    it(`Remove ${TOPIC} from userFund`, ()=>userFundApi.removeEntity(context.get(TOPIC)));

    it('Check empty userFund', checkEmptyUserFund_(context));


    // --------------------------------------------------------------------------
    // { '19': [ 126, 42, 70, 46, 51, .. ] }
    it(`Build association for ${DIRECTION}`, () =>
        entitiesApi.buildAssociation(DIRECTION, [ FUND ])
    );

    it(`Add ${DIRECTION} in userFund`, () => userFundApi.addEntity(context.get(DIRECTION)));

    it('Check added entities in userFund', () => userFundApi.checkAddedEntities());

    it(`Remove ${DIRECTION} from userFund`, () =>
        userFundApi.removeEntity(context.get(DIRECTION))
    );

    it('Check empty userFund', checkEmptyUserFund_(context));


    // --------------------------------------------------------------------------
    it(`Add ${FUND} in userFund`, ()=>{
        context.change('associations', null);
        return userFundApi.addEntity(context.get(FUND));
    });

    it('Check added entities in userFund', () => userFundApi.checkAddedEntities());

    it(`Remove ${FUND} from userFund`, ()=>userFundApi.removeEntity(context.get(FUND)));

    it('Check empty userFund', checkEmptyUserFund_(context));

    // --------------------------------------------------------------------------
    after('Terminate db connection pool', () => pgp.end());

});


function checkEmptyUserFund_ (context) {
    chakram.addMethod('isEmptyUserFund', function(entities) {
        this.assert(
            !entities.length,
            'entities exist in userFund => entities: '+ util.inspect(entities, { depth: 5 })
        )
        return chakram.wait();
    });
    return function () {
         expect(context.get('responceEditUserFund')).isEmptyUserFund();
    }
}