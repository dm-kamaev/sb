'use strict'

const config_db = require('../../config/db.json');
const util = require('util');
const db = require('pg-promise')()(config_db);
const chakram = require('chakram');
const expect = chakram.expect;
const services = require('../../services');
const urlService = services.url;
const _ = require('lodash');

module.exports = class CheckEntityInUserFund {
    /**
     * [constructor description]
     * @param  {[obj]} context
     * @return {[type]}         [description]
     */
    constructor(context) {
        this.context = context;
        /**
         * @param  {[array]} diff            [] || [1,2,3] diff entity id
         * @param  {[array]} resEntities  result after request to server
         * [ {id, title, }, ... ]
         * @param  {[type]} shouldEntities  should be
         * [ {id, title, }, ... ]
         * @return {[type]}                 [description]
         */
        chakram.addMethod('checkNumberAddEntities', function(diff, resEntities, shouldEntities) {
            var diffLength = diff.length;
            this.assert(
                diffLength === 0,
                'Error number of inserted entities "different ids"= '+diff+
                ' !== 0; Should be "entities"='+
                util.inspect(shouldEntities, { depth: 5 })+
                ' , but now entities:' + util.inspect(resEntities, { depth: 5 })
            );
            return chakram.wait();
        });
    }

    /**
     * checkAddedEntity
     * @param  {[type]} key 'funds' || 'directions' || 'topics'
     * @return {[type]}     [description]
     */
    addedEntities(key) {
        var context         = this.context,
            userFund        = context.get('responceEditUserFund'),
            entityIds       = userFund.map(userFund => userFund.id),
            generatedEntity = context.get(key);
        var diff = _.difference(
            entityIds,
            addSubEntityIds_(generatedEntity)
        );
        expect(diff).checkNumberAddEntities(userFund, generatedEntity);
        return chakram.wait();
    }

    /**
     * removed entities  !!! userFund should be empty !!!
     * @param  {[type]} key 'funds' || 'directions' || 'topics'
     * @return {[type]}     [description]
     */
    removedEntities(key) {
        var context         = this.context,
            userFund        = context.get('responceEditUserFund'),
            entityIds       = userFund.map(userFund => userFund.id),
            generatedEntity = context.get(key);
        var diff = _.difference(
            entityIds,
            [] // !!! userFund should be empty !!!
        );
        expect(diff).checkNumberAddEntities(userFund, generatedEntity);
        return chakram.wait();
    }

}


function addSubEntityIds_(entities) {
    return _.flatten(
        entities.map(entity => {
            if (entity.entities) {
                var subEntityIds = entity.entities;
                var res = subEntityIds.map(subEntityId => parseInt(subEntityId, 10));
                res.push(parseInt(entity.id, 10));
                return res;
            }
            return parseInt(entity.id, 10);
        }));
}