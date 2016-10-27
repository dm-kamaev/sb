'use strict'

const chakram = require('chakram');
const expect = chakram.expect;
const services = require('../services');
const config_db = require('../config/db.json');
const config_admin = require('../config/admin.json');
const pgp = require('pg-promise')();
const db = pgp(config_db);
const util = require('util');
const logger = require('./../../app/components/logger/').getLogger('main');
const Context = require('./../../app/components/context');

const logout = require('../modules/user/logout.js');
const register = require('../modules/user/register.js');
const getUserInfo = require('../modules/user/getUserInfo.js');
const createEntities = require('../modules/entity/createEntities.js');
const EntitiesApi = require('../modules/entity/entitiesApi.js');
const addEntities = require('../modules/entity/addEntities.js');
const userFund    = require('../modules/userFund/userFund.js');

chakram.setRequestDefaults(config_admin);

describe('filling userFund', function() {
    const context = new Context({
        listEntities: []
    });
    const entitiesApi = new EntitiesApi(context);
    const entityService = services.entity;

    // before('Logout',   logout(context));
    // before('Register', register(context));
    /*                               topic 1
                                        |
                                        |
                         direction 1 - - - - - direction 2
                             |                     |
                             |                     |
                    fund 1 - - - fund 2 - - - - - -|
    */
    it('Create 2 funds', function () {
        var funds  = context.set('funds', entityService.generateEntities(2, 'fund'));
        return entitiesApi.create(funds);
    });

    it('Create 2 direction and to associate with funds', function () {
        var funds = context.get('funds');
        var directions = context.set('directions', entityService.generateEntities(2, 'direction'));
        directions[0].entities = [ funds[0].id, funds[1].id ];
        directions[1].entities = [ funds[1].id ];
        return entitiesApi.create(directions);
    });

    it('Create 1 topic and to associate with directions', function () {
        var directions = context.get('directions');
        var topics = context.set('topics', entityService.generateEntities(1, 'topic'));
        topics[0].entities = [ directions[0].id, directions[1].id ];
        return entitiesApi.create(topics);
    });

    // it('Add topic in userFund',function () {});
    // it('Remove topic from userFund',function () {});

    // it('Add    directions in userFund',function () {});
    // it('Remove directions in userFund',function () {});

    // it('Add funds in userFund',function () {})
    // it('Remove funds from userFund',function () {});

    it('Debug', function () {
        console.log(
            context.get('funds').concat(context.get('directions')).concat(context.get('topics'))
        );
        // console.log(context.set('entities', funds.concat(directions).concat(topics)));
    });

    // after('Clean userFund', register(context));
    after('Terminate db connection pool', () => pgp.end());

});