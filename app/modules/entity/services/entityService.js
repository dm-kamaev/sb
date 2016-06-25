'use strict';

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');

exports.getAllEntities = function() {
    return await(sequelize.models.Entity.findAll());
};

exports.getEntity = function(id) {
    return await(sequelize.models.Entity.findOne({
        where: {
            id: id
        }
    }));
};

exports.getEntitiesByType = function(type) {
    return await(sequelize.models.Entity.findAll({
        where: {
            type: {
                $iLike: type
            }
        }
    }));
};

exports.getEntitiesByOwnerId = function(id, type) {
    var res = await(sequelize.models.Entity.findOne({
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
    return await(sequelize.models.Entity.create({
        title: data.title,
        description: data.description,
        type: data.type
    }));
};

exports.updateEntity = function(id, data) {
    return await(sequelize.models.Entity.update(
        data, {
            where: {
                id: id,
                deletedAt: null
            }
        }
    ));
};

exports.deleteEntity = function(id) {
    return await(sequelize.models.Entity.destroy({
        where: {
            id: id
        }
    }));
};
//  TODO: make it better
exports.associateEntity = function(id, otherId) {
    var relationsCount = await(sequelize.sequelize_.query('SELECT * FROM ' +
        '"EntityOtherEntity" WHERE "entityId" = :id ' +
        'AND "otherEntityId" = :otherId', {
            replacements: {
                id,
                otherId
            },
            type: sequelize.sequelize_.QueryTypes.SELECT
        }));

    if (relationsCount.length) throw new Error('Relation exists');

    await(sequelize.sequelize_.query('INSERT INTO "EntityOtherEntity" ' +
        '("entityId","otherEntityId","createdAt","updatedAt")' +
        'VALUES (:id, :otherId, :date, :date)', {
            replacements: {
                id,
                otherId,
                date: new Date()
            },
            type: sequelize.sequelize_.QueryTypes.INSERT
        }));
};

//  TODO: make it better too
exports.removeAssociation = function(id, otherId) {
    //  TODO: somehow throw error if relation doesn't exists
    await(sequelize.sequelize_.query('DELETE FROM "EntityOtherEntity" WHERE ' +
        '"entityId" = :id AND "otherEntityId" = :otherId', {
            replacements: {
                id,
                otherId
            },
            type: sequelize.sequelize_.QueryTypes.DELETE
        }));
};

exports.getTodayFundsCount = function() {
    var today = new Date(),
        year = today.getFullYear(),
        month = today.getMonth(),
        date = today.getDate();
    return await(sequelize.models.Entity.count({
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
