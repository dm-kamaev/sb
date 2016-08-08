'use strict';

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');

exports.getAllEntities = function(userFundId, published) {
    return await (sequelize.models.Entity.findAll({
        where: {
            published
        },
        include: {
            model: sequelize.models.UserFund,
            as: 'userFund',
            where: {
                id: userFundId
            },
            required: false
        }
    }));
};

exports.getEntity = function(id, userFundId, published, includes) {
    var include = includes.map(e => {
        return {
            model: sequelize.models.Entity,
            as: e,
            required: false
        };
    });
    include.push({
        model: sequelize.models.UserFund,
        as: 'userFund',
        where: {
            id: userFundId
        },
        required: false
    });
    return await (sequelize.models.Entity.findOne({
        where: {
            id: id,
            published
        },
        include
    }));
};

exports.getEntitiesByType = function(type, userFundId, published) {
    return await (sequelize.models.Entity.findAll({
        where: {
            type: {
                $iLike: type
            },
            published
        },
        include: {
            model: sequelize.models.UserFund,
            as: 'userFund',
            where: {
                id: userFundId
            },
            required: false
        }
    }));
};

exports.getEntitiesByOwnerId = function(id, type, userFundId, published) {
    var res = await (sequelize.models.Entity.findOne({
        where: {
            id: id,
            published
        },
        include: {
            model: sequelize.models.Entity,
            as: 'childEntity',
            where: {
                type: type
            },
            required: false,
            include: {
                model: sequelize.models.UserFund,
                as: 'userFund',
                where: {
                    id: userFundId
                },
                required: false
            }
        }
    }));
    if (!res) throw new Error('Not found');
    return res.childEntity;
};

exports.createEntity = function(data) {
    return await (sequelize.models.Entity.create({
        title: data.title,
        description: data.description,
        type: data.type,
        published: data.published,
        imgUrl: data.imgUrl
    }));
};

exports.updateEntity = function(id, data) {
    return await (sequelize.models.Entity.update(data, {
        where: {
            id: id,
            deletedAt: null
        }
    }));
};

exports.deleteEntity = function(id) {
    return await (sequelize.models.Entity.destroy({
        where: {
            id: id
        }
    }));
};

exports.associateEntity = function(id, otherId) {
    var relationsCount = await (sequelize.models.EntityOtherEntity.count({
        where: {
            entityId: id,
            otherEntityId: otherId
        }
    }));

    if (relationsCount) throw new Error('Relation exists');

    return await (sequelize.models.EntityOtherEntity.bulkCreate([{
        entityId: id,
        otherEntityId: otherId
    }, {
        entityId: otherId,
        otherEntityId: id
    }]));
};

exports.removeAssociation = function(id, otherId) {
    return await (sequelize.models.EntityOtherEntity.destroy({
        where: {
            entityId: {
                $in: [id, otherId]
            },
            otherEntityId: {
                $in: [id, otherId]
            }
        }
    }));
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

exports.getFundsCount = function() {
    return await (sequelize.models.Entity.count({
        where: {
            type: {
                $iLike: 'fund'
            }
        }
    }));
};

exports.getUserFunds = function(id, published) {
    return await (sequelize.models.Entity.findOne({
        where: {
            id,
            published
        },
        include: {
            model: sequelize.models.UserFund,
            as: 'userFund',
            required: false
        }
    }));
};

exports.publishAll = function() {
    return await (sequelize.models.Entity.update({
        published: true
    }, {
        where: {
            published: false
        }
    }));
};

exports.getEntitiesByTypeWithNested = function(type, includes) {
    var include = includes.map(e => {
        return {
            model: sequelize.models.Entity,
            as: e,
            required: false
        };
    });
    return await (sequelize.models.Entity.findAll({
        where: {
            type: {
                $or: type
            }
        },
        include
    }));
};
