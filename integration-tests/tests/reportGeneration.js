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
const addEntity   = require('../modules/entity/addEntity.js');
const associate = require('../modules/entity/associateEntities.js');

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
        chakram,
        expect,
        entities: []
    };

    before('Register', register(context));
    before('Create entities', createEntities(context));
    before('Associate entities', associate(context));

    it('Should log created entities', function () {
        console.log(context.entities);
        return chakram.wait();
    });

    /*before('create entities', function () {
        var funds = services.entity.generateEntities(3, 'fund');
        var topics = services.entity.generateEntities(1, 'topic');
        var directions = services.entity.generateEntities(2, 'direction');
        this.fundIds = [];
        this.topicIds = [];
        this.directionIds = [];

        funds.forEach(fund => {
            chakram.post(services.urls.concatUrl('entity'))
        })
    });*/
})
