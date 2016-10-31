'use strict';

// extract from directions to funds and from funds to directions
// author: dmitrii kamaev

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const entityTypes = require('../../entity/enums/entityTypes.js');
const tables = sequelize.models;

module.exports = class ExtractEntity {
    /**
     * [constructor description]
     * @param  {[obj]} params {
     *   type: 'FUND' || 'DIRECTION' || 'TOPIC' // what type entityIds
     *   entityIds, // array [ 1,2,3 ]
     *   skipType: 'FUNDS' || 'DIRECTION' || 'TOPIC' // skip type entity
     * }
     * @return {[array]}  array entityId from FUNDS, TOPIC, DIRECTIONS
     */
    constructor(params) {
        params = params || {};
        if (!params.entityIds) {
            throw new Error('ExtractEntity => not exist entityIds: "'+params.entityIds+'"');
        }
        if (params.type && !entityTypes[params.type]) {
            throw new Error('ExtractEntity => there is no such type: "'+params.type+'"');
        }
        this.type              = params.type;
        this.entityIds         = params.entityIds;
        this.EntityOtherEntity = tables.EntityOtherEntity;
        this.skipType          = params.skipType || false;
    }
    /**
     * extract from directions to funds and extract from funds to directions (uniq)
     * @return {[type]} [description]
     */
    extract () {
        var EntityOtherEntity = this.EntityOtherEntity,
            type              = this.type,
            entityIds         = this.entityIds;

        var skipType = this.skipType;
        var otherEntities = getEntitiesOtherEntity_(entityIds),
            uniqEntityIds = {};
        if (type === entityTypes.DIRECTION || type === entityTypes.FUND) {
            skipType = skipType || entityTypes.TOPIC;
        } else if (type === entityTypes.TOPIC) {
            skipType = skipType || entityTypes.FUND;
            var directions = otherEntities.filter(entity => await(isNotFund_(entity.id)))
            otherEntities = otherEntities.concat(directions);
        }
        var entityIdsNested = skipType_(
            getDescriptionEntities_(otherEntities), skipType
        );
        entityIdsNested.forEach(entityId => uniqEntityIds[entityId] = true);
        // console.log('entityIdsNested = ', entityIdsNested);
        // console.log('uniqEntityIds = ', uniqEntityIds);
        return Object.keys(uniqEntityIds).map(id => parseInt(id, 10));
    }

    buildTreeId() {
        var EntityOtherEntity = this.EntityOtherEntity,
            entityIds         = this.entityIds;

        var hashTree = {};
        entityIds.forEach(entityId => {
            var entities = await(EntityOtherEntity.findAll({
                where: { entityId: entityId }
            })) || [];
            entities = getDescriptionEntities_(entities).filter(entity => entity.type === entityTypes.FUND);
            hashTree[entityId] = entities.map(entity => entity.id);
        });
        return hashTree; // { '1': [ 2, 3, 4 ] }
    }
};


/**
 * skipType_ skip entity by type
 * @param  {[array]} entities [{ id, title, type }, ... ]
 * @param  {[str]}  type      'FUND' || 'DIRECTION' || 'TOPIC'
 * @return {[array]}          [ 1,2 3] // entity id
 */
function skipType_ (entities, type) {
    return entities.filter(entity => entity.type !== type)
                   .map(entity => entity.id) || [];
}


/**
 * getEntitiesOtherEntity_ get entity from table EntityOtherEntity by entity ids
 * @param  {[array]} entityIds [1,2,3]
 * @return {[type]}           [description]
 */
function getEntitiesOtherEntity_ (entityIds) {
    var query = {
        where: {
            entityId: {
                $in: entityIds
            }
        }
    };
    return await(tables.EntityOtherEntity.findAll(query)) || [];
}


/**
 * get description entities from table entity
 * @param  {[type]} entities [description]
 * @return {[type]}          [description]
 */
function getDescriptionEntities_ (entities) {
    return await(tables.Entity.findAll({
        where: {
            id: {
                $in: entities.map(entity => entity.otherEntityId) || []
            }
        }
    }));
}


/**
 * isNotFund_ check entity is DIRECTION OR TOPIC
 * @param  {[int]}  entityId
 * @return {Boolean}
 */
function isNotFund_(entityId) {
    var where = {
        id: entityId,
        type: {
            $ne: entityTypes.FUND
        }
    };
    return Boolean(await (tables.Entity.findOne({ where }))) || false;
}