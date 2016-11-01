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
        if (!entityTypes[params.type]) {
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
        const FUND      = entityTypes.FUND,
              DIRECTION = entityTypes.DIRECTION,
              TOPIC     = entityTypes.TOPIC;

        var resIds = [];
        if (type === TOPIC) {
            skipType = skipType || FUND;
            var otherEntities = getEntitiesOtherEntity_(entityIds);
            var ids = otherEntities.map(entity => entity.otherEntityId) || [];
            var directions   = getDirectionsFromTopics(ids),
                directionIds = directions.map(direction => direction.id);
            var fundIds = getFundIdsFromDirection_(directionIds);
            // var funds   = getFundsFromDirection_(directions),
            //     fundIds = funds.map(fund => fund.otherEntityId);
            // console.log('entityIds=', entityIds);
            // console.log('directionIds=', directionIds);
            // console.log('fundIds=', fundIds);
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
            // console.log('HERE=', resIds);
            // global.process.exit();
            // return resIds;
        } else if (type === DIRECTION) {
            var fundIds = getFundIdsFromDirection_(entityIds);
            resIds = fundIds;
            // console.log('resIds=', resIds);
            // global.process.exit();
        }
        // console.log('entityIdsNested = ', uniqueIds_(resIds));
        return uniqueIds_(resIds);
    }
};


/**
 * getEntitiesOtherEntity_ get entity from table EntityOtherEntity by entity ids
 * @param  {[array]} entityIds [1,2,3]
 * @return {[type]}           [ { entityId, entityOtherEntity }, ... ]
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


function getDirectionsFromTopics (ids) {
    var entitiesFrom = await(tables.Entity.findAll({
        where: {
            id: {
                $in: ids
            },
            type: entityTypes.DIRECTION
        }
    }));
    return entitiesFrom;
}



/**
 * getEntitiesOtherEntity_ get entity from table EntityOtherEntity by entity ids
 * @param  {[array]} entityIds [1,2,3]
 * @return {[type]}           [ { entityId, entityOtherEntity }, ... ]
 */
function getFundsFromDirection_ (directions, key) {
    var ids = directions.map(direction => direction.id);
    var query = {
        where: {
            entityId: {
                $in: ids
            }
        }
    };
    var otherEntities = await(tables.EntityOtherEntity.findAll(query)) || [];
    return otherEntities;
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

function getFundIdsFromDirection_ (ids) {
    var res = await(sequelize.sequelize.query(
    `SELECT e.id
        FROM "EntityOtherEntity" as eoe
        JOIN "Entity" as e
            ON eoe."otherEntityId"=e.id
        WHERE eoe."entityId" IN ( :ids ) AND e.type= :type
    `, {
        type: sequelize.sequelize.QueryTypes.SELECT,
        replacements: {
            ids,
            type: entityTypes.FUND
        }
    })) || [];
    return res.map(entity => entity.id);
}
