'use strict'

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

const logout = require('../modules/user/logout.js');
const register = require('../modules/user/register.js');
const EntitiesApi = require('../modules/entity/entitiesApi.js');
const UserFundApi = require('../modules/userFund/userFundApi.js');
const CheckEntityInUserFund = require('../modules/userFund/CheckEntityInUserFund.js');

chakram.setRequestDefaults(config_admin);



describe('filling userFund', function() {
    const context       = new Context({
        // funds: [{id:'2'}],
        // directions: [{id:'4', entities: [1, 3] }],
    }),
    entityService = services.entity,
    entitiesApi   = new EntitiesApi(context),
    userFundApi   = new UserFundApi(context),
    сheckEntityInUserFund = new CheckEntityInUserFund(context);

    before('Logout',   logout(context));
    before('Register', register(context));
                                /* SCHEMA ASSOCIATION */
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
        var directions = context.set(
            'directions',
            entityService.generateEntities(2, 'direction')
        );
        // directions[0].entities = [ funds[0].id, funds[1].id ];
        // directions[1].entities = [ funds[1].id ];
        // directions[1].entities = [  ];
        return entitiesApi.create(directions);
    });

    // it('Create 1 topic and to associate with directions', function () {
    //     var directions = context.get('directions');
    //     var topics = context.set('topics', entityService.generateEntities(1, 'topic'));
    //     topics[0].entities = [ directions[0].id, directions[1].id ];
    //     return entitiesApi.create(topics);
    // });

    // it('Add funds in userFund',        () => userFundApi.addEntities(context.get('funds')));
    // it('Check added fund in userFund', () => сheckEntityInUserFund.addedEntities('funds'));

    // it('Remove funds from userFund',       () => userFundApi.removeEntities(context.get('funds')));
    // it('Check removed funds from userFund',() => сheckEntityInUserFund.removedEntities('funds'));

    it('Add directions in userFund', () => {
        userFundApi.addEntities(context.get('directions'));
        return chakram.wait();
    });
    // it('Check added directions in userFund', () =>{
    //     сheckEntityInUserFund.addedEntities('directions')
    //     return chakram.wait();
    //     // var userFund  = context.get('responceEditUserFund'),
    //     //     directions= context.get('directions');
    //     // var diff = _.difference(
    //     //     userFund.map(userFund => userFund.id),
    //     //     addSubEntityIds(directions)
    //     // );
    //     // expect(diff).checkNumberAddEntities(directions);
    //     // return chakram.wait();
    // });
    // it('Remove directions from userFund',() => userFundApi.removeEntities(context.get('directions')));
    // it('Check removed funds from userFund',() => сheckEntityInUserFund.removedEntities('directions'));

    // it('Add topics in userFund', () => userFundApi.addEntities(context.get('topics')));
    // it('Check added topics in userFund', () => {
    //     var userFund = context.get('responceEditUserFund'),
    //         topics   = context.get('topics');
    //     var diff = _.difference(
    //         userFund.map(userFund => userFund.id),
    //         addSubEntityIds(topics)
    //     );
    //     expect(diff).checkNumberAddEntities(topics);
    //     return chakram.wait();
    // });



    it('Debug', function () {
        console.log(context.responceEditUserFund);
        // console.log(
        //     context.get('funds').concat(context.get('directions')).concat(context.get('topics'))
        // );
    });

    after('Terminate db connection pool', () => pgp.end());

});