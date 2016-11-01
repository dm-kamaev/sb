'use strict';

// work with userFund
// author: dmitrii kamaev

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const errors = require('../../../components/errors');
const logger = require('../../../components/logger').getLogger('main');
const userFundService = require('../services/userFundService');
const entityTypes = require('../../entity/enums/entityTypes.js');
const EntitiesApi = require('../../entity/services/entitiesApi.js');
const ExtractEntity = require('../../entity/services/extractEntity.js');

module.exports = class UserFundApi {
    /**
     * constructor
     * @param  {[obj]} params {
     *    userFundId,
     * }
     * @return {[type]}        [description]
     */
    constructor(params) {
        this.userFundId = params.userFundId || null;
        this.UserFundEntity = sequelize.models.UserFundEntity;
    }


    /**
     * get Entity from userFund
     * @param  {[obj]} data {
     *   userFundId, // optional
     *   type,       // get type entity
     * }
     * @return {[array]}  [ { id, title, description }, { id, title, description }]
     */
    getEntity(data) {
        data = data || {};
        var userFundId = data.userFundId || this.userFundId,
            type       = data.type;
        var userFund = userFundService.getUserFund(userFundId, true, true);
        var topics     = userFund.topic     || [],
            directions = userFund.direction || [],
            funds      = userFund.fund      || [],
            res        = [];
        switch (data.type) {
            case entityTypes.TOPIC:
                res = topics;
                break;
            case entityTypes.DIRECTION:
                res = directions;
                break;
            case entityTypes.FUND:
                res = funds;
                break;
            default:
                res = topics.concat(directions).concat(funds);
        }
        return res;
    }


    /**
     * filter exist relations in database,
     * return id's array only not exist relation fro entity
     * @param  {[obj]} data {
     *      userFundId, // int  optional
     *      entityIds, // array [1,2,3]
     * }
     * @return {[array]}      [1,2,3]
     */
    filterExistRelations (data) {
        var userFundId = data.userFundId || this.userFundId,
            entityIds  = data.entityIds;
        var relations = await(this.UserFundEntity.findAll({
            where: {
                userFundId,
                entityId: {
                    $in: entityIds
                }
            }
        }));
        var existInTable = {};
        relations.forEach(entity => existInTable[entity.entityId] = true);

        return entityIds.filter(entityId => {
            if (existInTable[entityId]) { return false; }
            return true;
        });
    }


    /**
     * addEntities in userFund
     * @param {[obj]} data {
     *   userFundId, // int optional
     *   entityIds,  // array [ 1, 2, 3 ]
     * }
     */
    addEntities(data) {
        var userFundId = data.userFundId || this.userFundId,
            entityIds  = data.entityIds;
        var multiRows = entityIds.map(entityId => {
            return { userFundId, entityId };
        });
        await(this.UserFundEntity.bulkCreate(multiRows));
    }


    /**
     * remove entities in userFund
     * @param  {[obj]} data {
     *   userFundId, // int optional
     *   entityIds,  // array [ 1, 2, 3 ]
     * }
     * @return {[type]}      [description]
     */
    removeEntities(data) {
        var userFundId = data.userFundId || this.userFundId,
            entityIds  = data.entityIds;
        await(this.UserFundEntity.destroy({
            where: {
                userFundId,
                entityId: {
                    $in: entityIds
                }
            }
        }));
    }

    remainingEntities(data) {
        var entityIds  = data.entityIds, entityIdsForRemove = {};
        entityIds.forEach(entityId => entityIdsForRemove[entityId] = true);
        var entities = this.getEntity();
        return entities.filter(entity => {
            if (!entityIdsForRemove[entity.id]) { return true; }
        });
    }
    /**
     * is empty userFund after remove entity from him
     * @param  {[obj]}  data {
     *   entityIds, // array
     * }
     * @return {Boolean}
     */
    isEmptyAfterRemoveEntity(data) {
        var entityIdsForRemove = data.entityIds, hashForRemove = {};
        entityIdsForRemove.forEach(entityId => hashForRemove[entityId] = true);
        var fundsUserFund = this.getEntity({ type: entityTypes.FUND });
        // console.log('fundsUserFund=', fundsUserFund);
        var remaningFunds = fundsUserFund.filter(fund => {
            if (!hashForRemove[fund.id]) { return true; }
        });
        // console.log('remaningFunds=', remaningFunds);
        if (!remaningFunds.length) { return true; }
        // global.process.exit();
        return false;
    }


    addEmptyDirectionsTopics(data) {
        var entityIdsForRemove = data.entityIds;
        var remaningEntities = this.remainingEntities({ entityIds: entityIdsForRemove });
        // console.log('entityIdsForRemove=', entityIdsForRemove);
        // console.log('remaningEntities=', remaningEntities);
        var hashRemaning = {};
        remaningEntities.forEach(entity => hashRemaning[entity.id] = true);
        var topics     = remaningEntities.filter(entity => entity.type === entityTypes.TOPIC);
            directions = remaningEntities.filter(entity => entity.type === entityTypes.DIRECTION);

        // { 1: [3,4,5], 2:[10, 9] }
        var relationDirections = new ExtractEntity({
            type: entityTypes.DIRECTION,
            entityIds: directions.map(entity => entity.id) || []
        }).buildTreeId();
        var res = Object.assign(relationDirections);
        console.log('relationDirections=', relationDirections);
        // var ids_directionTopic = Object.keys(hashTree);
        // console.log('++++++++++++++++++++++++++')
        // console.log('entityIds for remove', entityIds);
        // console.log('hashTree=', hashTree);
        // console.log('hashRemaning=', hashRemaning);
        // console.log('++++++++++++++++++++++++++')
        // for (var i = 0, l = ids_directionTopic.length; i < l; i++) {
        //     var id = ids_directionTopic[i], subEntityIds = hashTree[id];
        //     var deleted = true;
        //     for (var j = 0, l1 = subEntityIds.length; j < l1; j++) {
        //         var subEntityId = subEntityIds[j];
        //         // console.log('subEntityId=', subEntityId);
        //         if (hashRemaning[subEntityId]) {
        //             deleted = false;
        //             break;
        //         }
        //     }
        //     console.log(id, deleted);
        //     if (deleted) { entityIds.push(id); }
        // }
        // console.log('entityIds=', entityIds);
        global.process.exit();
    }

}