'use strict';

const sequelize = require('../../../components/sequelize');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const logger = require('../../../components/logger').getLogger('main');
const errors = require('../../../components/errors');

exports.getAllEntities = function () {
  return await(sequelize.models.Entity.findAll());  
};

exports.getEntity = function(id) {
    return await (sequelize.models.Entity.findOne({
        where: {
            id: id
        }
    }));
};

exports.getEntitiesByType = function(type) {
    return await (sequelize.models.Entity.findAll({
        where: {
            type: {
                $iLike: type
            }
        }
    }))
}

/**
 * returns array of Topics associated with $id
 * @param  {id} id [identifier of associated entity]
 * @param  {String} type [type of entity we want to get. Can be 'Topic' or 'Direction' or 'Fund']
 * @return {Array<TYPE>}
 */

exports.getEntityByAssociatedId = function(id, type) {
    return getRelationEntities(id, type);
};

exports.createEntity = function(data) {
    return await (sequelize.models.Entity.create({
        title: data.title,
        description: data.description,
        type: data.type
    }))
};

exports.updateEntity = function(id, data) {
    return await (sequelize.models.Entity.update(
        data, {
            where: {
                id: id
            }
        }
    ));
};

exports.deleteEntity = function(id) {
    return await (sequelize.models.Entity.destroy({
        where: {
            id: id
        }
    }));
};

exports.associateEntity = function(id, type, otherId){
    console.log(id);
    console.log(otherId);
    console.log(type);
    sequelize.sequelize_.transaction(async((t1) => {
        var entity = await(sequelize.models.Entity.findById(id));
        var entity2 = await(sequelize.models.Entity.findById(otherId));
        if (!entity || !entity2) throw new Error("Not found");
        return entity.addEntity(entity2);
    }));
};

//is this okay?
function getRelationEntities(id, type) {
    return await (sequelize.sequelize_.transaction(async((t1) => {
        var entity = await (sequelize.models.Entity.findById(id));
        if (!entity) throw new Error("Not found");
        return entity.getEntity({
            where: {
                type: {
                    $iLike: type
                }
            }
        });
    })));
}
