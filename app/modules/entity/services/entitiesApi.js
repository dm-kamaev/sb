'use strict';

// work with entities
// author: dmitrii kamaev

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const errors = require('../../../components/errors');
const i18n = require('../../../components/i18n');
const entityTypes = require('../../entity/enums/entityTypes.js');
const ExtractEntity = require('../../entity/services/extractEntity.js');



module.exports = class EntitiesApi {
    /**
     * [constructor description]
     * @param  {[obj]} params {
     *   entityIds, // int or array [1,2,3]
     *  }
     * @return {[type]}        [description]
     */
    constructor(params) {
        this.entityIds = params.entityIds || null;
        this.Entity = sequelize.models.Entity;
    }

    /**
     * get Entities: read database
     * @param  {[obj]} where
     * @return {[type]}       [description]
     */
    getEntities(where) {
        where = where || {};
        var entityIds = this.entityIds;
        if (Object.keys(where).length) {
            return await(this.Entity.findAll({ where }));
        } else if (entityIds.length) {
            return await(this.Entity.findAll({
                where: {
                    id: {
                        $in: entityIds
                    }
                }
            }));
        }
    }

};