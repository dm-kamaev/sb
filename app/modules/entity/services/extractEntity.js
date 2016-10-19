'use strict';

// extract from directions to funds and from funds to directions
// author: dmitrii kamaev

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const entityTypes = require('../../entity/enums/entityTypes.js');


module.exports = class ExtractEntity {
    /**
     * [constructor description]
     * @param  {[obj]} params {
     *   type: 'FUND' || 'DIRECTION' || 'TOPIC'
     *   entityIds, // array [ 1,2,3 ]
     * }
     * @return {[type]}        [description]
     */
    constructor(params) {
        if (!params.entityIds) {
            throw new Error('ExtractEntity => not exist entityIds: "'+params.entityIds+'"');
        }
        if (!entityTypes[params.type]) {
            throw new Error('ExtractEntity => there is no such type: "'+params.type+'"');
        }
        this.type      = params.type;
        this.entityIds = params.entityIds;
        this.EntityOtherEntity = sequelize.models.EntityOtherEntity;
    }
    /**
     * extract from directions to funds and extract from funds to directions (uniq)
     * @return {[type]} [description]
     */
    extract () {
        var EntityOtherEntity = this.EntityOtherEntity,
            type              = this.type,
            entityIds         = this.entityIds;
        var query = {
            where: {
                entityId: {
                    $in: entityIds
                }
            }
        };
        if (type === entityTypes.DIRECTION || type === entityTypes.FUND) {
            var entity     = await(EntityOtherEntity.findAll(query)) || [],
                uniqEntityIds = {};
            entity.map(direction =>
                direction.otherEntityId
            ).forEach(directionId =>
                uniqEntityIds[directionId] = true
            );
            return Object.keys(uniqEntityIds);
        }
    }
};