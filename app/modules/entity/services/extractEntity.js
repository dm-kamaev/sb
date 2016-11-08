'use strict';

// extract from directions to funds and from funds to directions
// author: dmitrii kamaev

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const entityTypes = require('../../entity/enums/entityTypes.js');
const TOPIC     = entityTypes.TOPIC,
      DIRECTION = entityTypes.DIRECTION,
      FUND      = entityTypes.FUND;
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
        // if (!params.entityIds) {
        //     throw new Error('ExtractEntity => not exist entityIds: "'+params.entityIds+'"');
        // }
        // if (!entityTypes[params.type]) {
        //     throw new Error('ExtractEntity => there is no such type: "'+params.type+'"');
        // }
        this.type              = params.type;
        this.entityIds         = params.entityIds;
        this.EntityOtherEntity = tables.EntityOtherEntity;
        this.skipType          = params.skipType || false;
    }

    /**
     * extract from topics: directions and funds (all or part)
     * extract from directions: funds
     * @return {[array]} [ 1,2,3 ] // uniq entites ids
     */
    extract () {
        var EntityOtherEntity = this.EntityOtherEntity,
            type              = this.type,
            entityIds         = this.entityIds;
        var skipType = this.skipType;
        const FUND      = entityTypes.FUND,
              DIRECTION = entityTypes.DIRECTION,
              TOPIC     = entityTypes.TOPIC;

        var resIds = [];
        if (type === TOPIC) {
            skipType = skipType || FUND;
            var directionIds = getNestedIdsFrom_(entityIds, DIRECTION);
            var fundIds      = getNestedIdsFrom_(directionIds, FUND);
            switch (skipType) {
                case DIRECTION:
                    resIds = fundIds;
                    break;
                case FUND:
                    resIds = directionIds;
                    break;
                default:
                    resIds = directionIds.concat(fundIds);
            }
        } else if (type === DIRECTION) {
            var fundIds = getNestedIdsFrom_(entityIds, FUND);
            resIds = fundIds;
        }
        return uniqueIds_(resIds);
    }


    /**
     * buildTreeId  build strcuture according to the associated entity
     * @param  {[str]} type 'direction' || 'topic' // optional
     * @return {[obj]} { 1: [ 2,3,4], ... }
     * it's topic: [ directions ] or direction: [ funds ]
     */
    buildTreeId(type) {
        var EntityOtherEntity = this.EntityOtherEntity,
            entityIds         = this.entityIds;
        type = type || this.type;
        const FUND      = entityTypes.FUND,
              DIRECTION = entityTypes.DIRECTION,
              TOPIC     = entityTypes.TOPIC;
        var hashTree = {};
        switch (type) {
            case TOPIC:
                hashTree = buildRelations(entityIds, DIRECTION);
                break;
            case DIRECTION:
                hashTree = buildRelations(entityIds, FUND);
                break;
            default:
                throw new Error(`select type entity: ${TOPIC}, ${DIRECTION}, or write code for ${FUND}`);
        }
        return hashTree; // { '1': [ 2, 3, 4 ] }

        function buildRelations (entityIds, type) {
            var hashTree = {};
            entityIds.forEach(entityId => {
                var nestedIds = getNestedIdsFrom_(entityId, type) || [];
                hashTree[entityId] = nestedIds;
            });
            return hashTree;
        }
    }
};


/**
 * get nestedIds from entity
 * @param  {[array]} ids [ 4,5,6 ]
 * @param  {[str]} type 'direction' || 'fund'
 * @return {[array]} [ 1,2,3]
 */
function getNestedIdsFrom_ (ids, type) {
    var res = await(sequelize.sequelize.query(
    `SELECT e.id
        FROM "EntityOtherEntity" as eoe
        JOIN "Entity" as e
            ON eoe."otherEntityId"=e.id
        WHERE eoe."entityId" IN ( :ids ) AND
              e.type= :type AND
              published=true
    `, {
        type: sequelize.sequelize.QueryTypes.SELECT,
        replacements: {
            ids,
            type
        }
    })) || [];
    return res.map(entity => entity.id);
}


/**
 * the unique ids
 * @param  {[array]} ids [ "11", 11, '1', 2]
 * @return {[array]}     [ 11, 1, 2 ]
 */
function uniqueIds_ (ids) {
    var uniqEntityIds = {};
    ids.forEach(id => uniqEntityIds[id] = true);
    return Object.keys(uniqEntityIds).map(id => parseInt(id, 10));
}