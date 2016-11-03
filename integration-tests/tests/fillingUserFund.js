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
const CheckEntityInUserFund = require('../modules/userFund/CheckEntityInUserFund.js');
const FUND      = entityTypes.FUND,
      DIRECTION = entityTypes.DIRECTION,
      TOPIC     = entityTypes.TOPIC;
chakram.setRequestDefaults(config_admin);


describe('Filling userFund', function() {
    const context = new Context();
    var userFundApi   = new UserFundApi(context);

    before('Logout',   logout(context));
    before('Register', register(context));

    before('Search random topic',     searchRandomEntity_(context, TOPIC));
    before('Search random direction', searchRandomEntity_(context, DIRECTION));
    before('Search random fund',      searchRandomEntity_(context, FUND));

    // --------------------------------------------------------------------------
    // { '19': [ 126, 42, 70, 46, 51, .. ] }
    it(`Build association for ${TOPIC}`, buildAssociation_(context, TOPIC, [ DIRECTION, FUND ]));

    it('Add topic in userFund', () => {
        userFundApi.addEntity(context.get('topic'));
        return chakram.wait();
    });

    it('Check added entities in userFund', checkAddedEntities_(context));

    it('Get user info', getUserInfo(context));

    it('Clean userFund via db', cleanUserFund_(context));


    // --------------------------------------------------------------------------
    // { '19': [ 126, 42, 70, 46, 51, .. ] }
    it(`Build association for ${DIRECTION}`, buildAssociation_(context, DIRECTION, [ FUND ]));

    it(`Add ${DIRECTION} in userFund`, () => {
        userFundApi.addEntity(context.get(DIRECTION));
        return chakram.wait();
    });

    it('Check added entities in userFund', checkAddedEntities_(context));

    it('Clean userFund via db', cleanUserFund_(context));

    // --------------------------------------------------------------------------
    it(`Add ${FUND} in userFund`, () => {
        context.change('associations', null);
        userFundApi.addEntity(context.get(FUND));
        return chakram.wait();
    });

    it(`Check added ${FUND} in userFund`, checkAddedEntities_(context));

    it('Clean userFund via db', cleanUserFund_(context));

    // --------------------------------------------------------------------------
    after('Terminate db connection pool', () => pgp.end());

});


function cleanUserFund_ (context) {
    return function () {
        return db.query('DELETE FROM "UserFundEntity" WHERE "userFundId"='+context.userFundId);
    }
}


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


function buildAssociation_(context, entityType, types) {
    var strType = '';
    if (types.length === 1) {
        strType = `e.type='${types[0]}'`;
    } else if (types.length === 2) {
        strType = `e.type='${types[0]}' OR e.type='${types[1]}'`;
    } else {
        throw new Error('Many types');
    }

    chakram.addMethod('checkGetEntityIds', function(entityIds) {
        this.assert(
            entityIds.length,
            'entityIds is not exist => entityIds: '+ util.inspect(entityIds, { depth: 5 })
        )
        return chakram.wait();
    });

    return function() {
        var entity = context.get(entityType),
            id    = entity.id;
        var query =
            `SELECT e.id
                FROM "EntityOtherEntity" as eoe
                JOIN "Entity" as e
                    ON eoe."otherEntityId"=e.id
                WHERE eoe."entityId"=${id} AND
                      ${strType} AND
                      published=true
            `;
        return db.query(query).then(entityIds => {
            expect(entityIds).checkGetEntityIds();
            var associations = entityIds.map(entity => entity.id);
            associations.unshift(id);
            context.associations = associations;
        });
    }
}


function checkAddedEntities_ (context) {
    chakram.addMethod('notExistEnityInUserFund', function(entity) {
        this.assert(
            false,
            'entity is not exist in userFund => entity: '+ util.inspect(entity, { depth: 5 })
        )
        return chakram.wait();
    });
    return function () {
        var associations;
        if (context.exist('associations')) {
            associations = context.get('associations');
        } else {
            associations = [ context.get(FUND).id ];
        }
        var hashId = {};
        associations.forEach(id => hashId[id] = true);
        var userFundEntityIds = context.get('responceEditUserFund').forEach(entity => {
            if (!hashId[entity.id]) {
                expect(entity).notExistEnityInUserFund();
            }
        });
    }
}