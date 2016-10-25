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

    // before('Logout',   logout(context));
    // before('Register', register(context));
    it('Create 2 funds, 2 direction, 1 topic', function () {
        var entity     = services.entity;
        var funds      = context.set('funds',      entity.generateEntities(2, 'fund'));
        var directions = context.set('directions', entity.generateEntities(2, 'fund'));
        var topics     = context.set('topics',     entity.generateEntities(1, 'topics'));
        var entities   = context.set('entities', funds.concat(directions).concat(topics));
        // context.set('test', 'test_set');
        // return chakram.wait();
    });

    it('Add entities', () => entitiesApi.create());
    /*                               topic 1
                                        |
                                        |
                         direction 1 - - - - - direction 2
                             |                     |
                             |                     |
                    fund 1 - - - fund 2 - - - - - -|
    */
    // it('Associated entities', () => {
    //     var funds      = context.get('funds'),
    //         directions = context.get('directions'),
    //         topics     = context.get('topics');
    //     console.log(funds);
    //     entitiesApi.associateEntity(funds[0].id, directions[0].id);
    //     entitiesApi.associateEntity(funds[1].id, directions[0].id);

    //     entitiesApi.associateEntity(funds[1].id, directions[1].id);

    //     entitiesApi.associateEntity(directions[0].id, topics[0].id);
    //     entitiesApi.associateEntity(directions[1].id, topics[0].id);
    //     return chakram.wait();
    // });

    it('Debug', function () {
        console.log(context.get('entities'));
    });

    after('Terminate db connection pool', () => pgp.end());


    // before('Remove entity from db', register(context));
    // before('Clena userFund', register(context));

});