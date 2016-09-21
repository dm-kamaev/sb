'use strict'

const services = require('../../services');
const config_db = require('../../config/db.json');
const db = require('pg-promise')()(config_db);
const log = console.log;
const chakram = require('chakram');

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

module.exports = function(context) {
    var expect  = context.expect;

    function associateEntities () {
        var funds = context.entities.filter(entity => entity.type === 'fund');
        var directions = context.entities.filter(
                entity => entity.type === 'direction');
        var topics = context.entities.filter(entity => entity.type === 'topic');
        var url = services.url.concatUrl('entity');
        return Promise.all([
            Promise.all(directions.map(direction => {
                return chakram.post(url + '/' + direction.id + '/'
                    + topics[0].id);
            })),
            Promise.all(funds.map(fund => {
                return chakram.post(url + '/' + fund.id + '/' + topics[0].id);
            })),
            Promise.all(funds.map(fund => {
                Promise.all(directions.map(direction => {
                    return chakram.post(url + '/' + fund.id + '/'
                        + direction.id);
                }))
            }))
        ]);
    };

    return function() {
        return chakram.waitFor([
            associateEntities()
        ]);
    }
};
