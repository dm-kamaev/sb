'use strict'

const services = require('../../services');
const config_db = require('../../config/db.json');
const db = require('pg-promise')()(config_db);
const log = console.log;
const chakram = require('chakram');

module.exports = function(context) {
    var expect  = context.expect,
        listEntities = context.listEntities;

    function createEntities () {
        var funds = services.entity.generateEntities(3, 'fund');
        var directions = services.entity.generateEntities(2, 'direction');
        var topics = services.entity.generateEntities(1, 'topic');
        var entities = funds.concat(directions, topics);
        var url = services.url.concatUrl('entity');
        return Promise.all(entities.map(entity => {
            return chakram.post(url, entity);
        }));
    }

    return function() {
        return chakram.waitFor([
            createEntities().then(ff =>
                context.entities = ff.map(entity => {
                    return entity.body;
            }))
        ]);
    }
};
