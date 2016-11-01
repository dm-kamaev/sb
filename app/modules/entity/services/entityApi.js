'use strict';

// work with entity
// author: dmitrii kamaev

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const errors = require('../../../components/errors');
const i18n = require('../../../components/i18n');
const entityTypes = require('../../entity/enums/entityTypes.js');
const ExtractEntity = require('../../entity/services/extractEntity.js');



module.exports = class EntityApi {
    /**
     * [constructor description]
     * @param  {[obj]} params {
     *   entityId, // int or array [1,2,3]
     *  }
     * @return {[type]}        [description]
     */
    constructor(params) {
        this.entityId = params.entityId || null;
        this.Entity = sequelize.models.Entity;
    }
    /**
     * set entity
     * @param {[obj]} entity { id: 1, title: 'ПОДАРИ ЖИЗНЬ', ... }
     */
    setEntity(entity) {
        this.entity = entity;
    }

    /**
     * get Entity: read database
     * @param  {[obj]} where
     * @return {[type]}       [description]
     */
    getEntity(where) {
        return await(this.Entity.findOne({ where }));
    }

    /**
     * check exist published entity
     * @param  {[int]} entityId, // optional param
     * @return {[obj]} { id: 1, title: 'ПОДАРИ ЖИЗНЬ', ... }
     */
    checkExist(entityId) {
        entityId = entityId || this.entityId;
        var entity = this.getEntity({ id: entityId, published: true });
        if (!entity) {
            throw new errors.NotFoundError(i18n.__('Entity'), entityId);
        }
        this.setEntity(entity);
        return entity;
    }

    /**
     * check type entity, before call "setEntity" or "getEntity"
     * @return {[boolen]}
     */
    checkType() {
        var entity = this.entity || {};
        var type = entity.type;
        if (!entityTypes[type]) {
            throw new errors.NotFoundError(i18n.__('type of organization "{{type}}"', {
                type
            }), entity.id);
        }
        return true;
    }

    /**
     * get nested entityIds
     * if entity is direction, push array id funds
     * @param  {[int or array]} entityId
     * @return {[array]}        [ 1,2,3 ]
     */
    getNestedEntityIds (entityId) {
        entityId = entityId || this.entityId;
        var entityIds = (entityId instanceof Array) ? entityId : [ entityId ];
        var type = this.entity.type;
        const TOPIC = entityTypes.TOPIC, DIRECTION = entityTypes.DIRECTION;
        if (type === TOPIC) {
            var directionFundIds = new ExtractEntity({
                type: entityTypes.TOPIC,
                entityIds,
                skipType: 'nothing',
            }).extract();
            entityIds = entityIds.concat(directionFundIds);
            entityIds = uniqueIds_(entityIds);
            // console.log('directionFundIds=', entityIds);
            // global.process.exit();
        } else if (type === DIRECTION) {
            var fundIds = new ExtractEntity({
                type: entityTypes.DIRECTION,
                entityIds,
                skipType: entityTypes.TOPIC,
            }).extract();
            entityIds = entityIds.concat(fundIds);
            entityIds = uniqueIds_(entityIds);
            // console.log('fundIds=', entityIds);
            // global.process.exit();
        }
        return entityIds;
    }

    /**
     * get nested entityIds to Fund
     * if entity is direction, push array id funds
     * @param  {[int or array]} entityId
     * @return {[array]}        [ 1,2,3 ]
     */
    getNestedEntityIdsToFunds (entityId) {
        entityId = entityId || this.entityId;
        var entityIds = (entityId instanceof Array) ? entityId : [ entityId ];
        var type      = this.entity.type,
            DIRECTION = entityTypes.DIRECTION,
            TOPIC     = entityTypes.TOPIC,
            fundIds   = [];
        if (type === DIRECTION) {
            fundIds = new ExtractEntity({
                type: DIRECTION,
                entityIds,
                skipType: TOPIC,
            }).extract();
            entityIds = entityIds.concat(fundIds);
        } else if (type === TOPIC) {
            fundIds = new ExtractEntity({
                type: TOPIC,
                entityIds,
                skipType: DIRECTION,
            }).extract();
            entityIds = entityIds.concat(fundIds);
        }
        return entityIds;
    }
};


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