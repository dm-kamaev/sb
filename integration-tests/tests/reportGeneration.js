'use strict'

const chakram = require('chakram');
const expect = chakram.expect;
const execSync = require('child_process').execSync;
const path = require('path');
const queryString = require('query-string');
const services = require('../services');

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
describe('Report generation', function() {
    before('Register user', function() {
        var user = services.user.genRandomUser(),
            resp = chakram.post(services.url('auth/register'), user)
        this.email = user.email;
        this.firstName = user.firstName
        this.lastName = user.lastName
        expect(resp).to.have.status(201)
        return resp.then(() => {
            return chakram.get(services.url('user'))
        })
        .then(res => {
            this.sberUserId = res.body.id
            this.userFundId = res.body.userFund.id
            return chakram.wait()
        })
    });

    before('create entities', function () {
        var funds = services.entity.generateEntities(3, 'fund');
        var topics = services.entity.generateEntities(1, 'topic');
        var directions = services.entity.generateEntities(2, 'direction');
        this.fundIds = [];
        this.topicIds = [];
        this.directionIds = [];

        funds.forEach(fund => {
            chakram.post(services.urls.concatUrl('entity'))
        })
    });
})
