'use strict'

// methods for work with Entities
// dmitrii kamaev

const chakram = require('chakram');
const expect = chakram.expect;
const services = require('../../services');
const util = require('util');
const entityTypes = require('../../../app/modules/entity/enums/entityTypes.js');
const config_db = require('../../config/db.json');
const db = require('pg-promise')()(config_db);


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

    filterEntitiesByType(type, entities) {
        entities = entities || this.context.get('entities');
        if (!entityTypes[type]) { throw new Error('filterEntitiesByType => Not valid type "'+type+'"'); }
        return entities.filter(entity => {
            if (entity.type === type) { return true; }
        });
    }

    associateEntity(firstEntyId, secondEntityId) {
        chakram.addMethod('checkAssociatedEntity', function(respObj) {
            var statusCode = respObj.response.statusCode,
                body = respObj.response.body;
            console.log('HERE', respObj.response);
            this.assert(
                statusCode === 200,
                'Error status ' + statusCode + '; body:' + util.inspect(body, { depth:5 })
            );
            return chakram.wait();
        });

        var url = this.entityUrl+'/'+firstEntyId.id+'/'+secondEntityId.id;
        var responce = chakram.post(url);
        expect(responce).checkAssociatedEntity();
        return chakram.wait();
    }


    /**
     * search random entity by type ande set in context
     * @param  {[str]} type 'fund' || 'topic' || 'direction'
     * @return {[type]}
     */
    searchRandomEntity (type) {
        var context = this.context;
        chakram.addMethod('checkSearchRandomEntity', function(entity) {
            this.assert(
                entity.id,
                'Entity id is not exist => id: '+entity.id+' entity:'+util.inspect(entity, { depth: 5 })
            )
            return chakram.wait();
        });
        var query = `SELECT * FROM "Entity" WHERE type='${type}' LIMIT 1`;
        return db.one(query).then(entity => {
            context.set(type, entity);
            expect(entity).checkSearchRandomEntity();
        });
    }


    /**
     * buildAssociations between entites
     * @param  {[str]} entityType root type 'topic' || 'direction' || 'fund'
     * @param  {[array]} types    sub type 'topic' || 'direction' || 'fund'
     * @return {[type]} set in context assoicantions
     * { '19': [ 126, 42, 70, 46, 51, .. ] }
     */
    buildAssociation (entityType, types) {
        var context = this.context;
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

        var entity = context.get(entityType),
            id = entity.id;
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