'use strict'

// methods for work with Entities
// dmitrii kamaev

const chakram = require('chakram');
const expect = chakram.expect;
const services = require('../../services');
const util = require('util');
// const config_db = require('../../config/db.json');
// const db = require('pg-promise')()(config_db);


module.exports = class EntitiesApi {
    constructor(context) {
        this.context = context;
        this.entityUrl = services.url.concatUrl('entity');
    }

    create(entities) {
        chakram.addMethod('checkAddEntity', function(respObj, entities) {
            var statusCode = respObj.response.statusCode,
                body = respObj.response.body;

            this.assert(
                statusCode === 201,
                'Error status ' + statusCode + '; body:' + util.inspect(body, { depth:5 })
            );
            // save id from database for entity
            var id = body.id, title = body.title, description = body.description;
            entities.forEach(entity => {
                if (
                    entity.title       === title &&
                    entity.description === description
                ) { entity.id = id; }
            });
            return chakram.wait();
        });


        entities = entities || this.context.get('entities');
        var promises = entities.map(entity => chakram.post(this.entityUrl, entity));
        return Promise.all(promises).then(responces =>
          responces.forEach(responce => expect(responce).checkAddEntity(entities))
        );
    }

    associateEntity(firstEntyId, secondEntityId) {
        chakram.addMethod('checkAssociatedEntity', function(respObj) {
            var statusCode = respObj.response.statusCode,
                body = respObj.response.body;
            this.assert(
                statusCode === 200,
                'Error status ' + statusCode + '; body:' + util.inspect(body, { depth:5 })
            );
            return chakram.wait();
        });

        var responce = chakram.post(this.entityUrl+'/'+firstEntyId.id+'/'+secondEntityId.id);
        expect(responce).checkAssociatedEntity();
        return chakram.wait();
    }
}