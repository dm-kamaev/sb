'use strict';

// work with entity
// author: dmitrii kamaev

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const errors = require('../../../components/errors');
const i18n = require('../../../components/i18n');
const entityTypes = require('../../entity/enums/entityTypes.js');



module.exports = class Entity {
    /**
     * [constructor description]
     * @return {[type]}        [description]
     */
    constructor(params) {
        this.entityId = params.entityId || null;
        var option = params.option || {};
        this.Entity = sequelize.models.Entity;
    }

    setEntity(entity) {
        this.entity = entity;
    }

    getEntity(where) {
        return await (this.Entity.findOne({
            where
        }));
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
     * check type entity
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
};