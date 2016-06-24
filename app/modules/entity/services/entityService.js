'use strict';

const sequelize = require('../../../components/sequelize');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

exports.getAllEntities = function() {
    return await (sequelize.models.Entity.findAll());
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
    }));
};

exports.getEntitiesByOwnerId = function(id, type) {
    var res = await (sequelize.models.Entity.findOne({
        where: {
            id: id
        },
        include: {
            model: sequelize.models.Entity,
            as: 'childEntity',
            where: {
                type: type
            },
            required: false
        }
    }));
    if (!res) throw new Error('Not found');
    return res.childEntity;
};

exports.createEntity = function(data) {
    return await (sequelize.models.Entity.create({
        title: data.title,
        description: data.description,
        type: data.type
    }));
};

exports.updateEntity = function(id, data) {
  data.foo = 1222;
    return await (sequelize.models.Entity.update(
        data, {
            where: {
                id: id,
                deletedAt: {
                    $ne: null
                }
            },
            paranoid: false
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
//TODO: make add/remove through raw sql
exports.associateEntity = function(id, otherId) {
    return await (sequelize.sequelize_.transaction(async((t1) => {
        var entitySource = await (sequelize.models.Entity.findById(id));
        var entityTarget = await (sequelize.models.Entity.findById(otherId));
        if (!entitySource || !entityTarget) throw new Error('Not found');
        return entitySource.addChildEntity(entityTarget);
    })));
};

exports.removeAssociation = function(id, otherId) {
    return await (sequelize.sequelize_.transaction(async((t1) => {
        var entitySource = await (sequelize.models.Entity.findById(id));
        var entityTarget = await (sequelize.models.Entity.findById(otherId));
        if (!entitySource || !entityTarget) throw new Error('Not found');
        return entitySource.removeChildEntity(entityTarget);
    })));
};

exports.getTodayFundsCount = function() {
    var today = new Date(),
        year = today.getFullYear(),
        month = today.getMonth(),
        date = today.getDate();
    return await (sequelize.models.Entity.count({
        where: {
            createdAt: {
                $lt: new Date(year, month, date + 1, 0, 0, 0, 0),
                $gt: new Date(year, month, date, 0, 0, 0, 0)
            },
            type: {
                $iLike: 'fund'
            }
        }
    }));
};
