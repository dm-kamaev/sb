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
const FUND      = entityTypes.FUND,
      DIRECTION = entityTypes.DIRECTION,
      TOPIC     = entityTypes.TOPIC;
chakram.setRequestDefaults(config_admin);


describe('Remove entities from userFund (not auth user)  =>', function() {
    const context   = new Context();
    const userFundApi = new UserFundApi(context);

    before('Logout',   logout(context));

    before('Search random topic',     searchRandomEntity_(context, TOPIC));
    before('Search random direction', searchRandomEntity_(context, DIRECTION));
    before('Search random fund',      searchRandomEntity_(context, FUND));

    // --------------------------------------------------------------------------
    it('Add topic in userFund', () => {
        userFundApi.removeEntity(context.get('topic'));
        return chakram.wait();
    });

    it('Check empty userFund', checkEmptyUserFund_(context));


    // --------------------------------------------------------------------------

    it(`Add ${DIRECTION} in userFund`, () => {
        userFundApi.removeEntity(context.get(DIRECTION));
        return chakram.wait();
    });

    it('Check empty userFund', checkEmptyUserFund_(context));

    // --------------------------------------------------------------------------
    it(`Add ${FUND} in userFund`, () => {
        userFundApi.removeEntity(context.get(FUND));
        return chakram.wait();
    });

    it(`Check empty userFund`, checkEmptyUserFund_(context));

    // --------------------------------------------------------------------------
    after('Terminate db connection pool', () => pgp.end());

});


function searchRandomEntity_ (context, type) {
    chakram.addMethod('checkSearchRandomEntity', function(entity) {
        this.assert(
            entity.id,
            'Entity id is not exist => id: '+entity.id+' entity:'+util.inspect(entity, { depth: 5 })
        )
        return chakram.wait();
    });
    var query = `SELECT * FROM "Entity" WHERE type='${type}' LIMIT 1`;
    return function () {
        return db.one(query).then(entity => {
            context.set(type, entity);
            expect(entity).checkSearchRandomEntity();
        });
    }
}


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