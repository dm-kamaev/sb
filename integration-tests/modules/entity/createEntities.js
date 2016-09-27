'use strict'

const services = require('../../services');
const config_db = require('../../config/db.json');
const db = require('pg-promise')()(config_db);
const chakram = require('chakram');
const expect = chakram.expect;

module.exports = function(context) {
    var listEntities = context.listEntities;

    function createEntity () {
        var entities = services.entity.generateEntities(1); // one entity
        var entity = entities[0];
        var url = services.url.concatUrl('entity');
        return chakram.get(services.url('entity'))
            .then(res => {
                if (res.body[0]) {
                    return chakram.post(url, entity);
                }
            })
            .then(() => {
                context.listEntities.push(entity);
                return chakram.wait();
            })
    }

    return function() {
        return db.any('SELECT * FROM "Entity" LIMIT 1').then((entities) => {
            if (!entities.length) {
                return createEntity();
            } else {
                context.listEntities = entities;
            }
        })
    }
};



