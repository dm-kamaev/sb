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
        var userFundId = data.userFundId || this.userFundId;
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

    /**
     * is empty userFund after remove entity from him
     * @param  {[obj]}  data {
     *   entityIds, // array
     * }
     * @return {Boolean}
     */
    isEmptyAfterRemoveEntity(data) {
        var entityIds  = data.entityIds, entityIdsForRemove = {};
        entityIds.forEach(entityId => entityIdsForRemove[entityId] = true);
        var entities = this.getEntity();
        var remaningEntities = entities.filter(entity => {
            if (!entityIdsForRemove[entity.id]) { return true; }
        });
        if (!remaningEntities.length) { return true; }
        return false;
    }

}