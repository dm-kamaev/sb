'use strict';

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const _ = require('lodash');

var EntityService = {};

EntityService.getAllEntities = function(userFundId, published) {
    return await(sequelize.models.Entity.findAll({
        where: {
            published
        },
        include: userFundId ? {
            model: sequelize.models.UserFund,
            as: 'userFund',
            where: {
                id: userFundId
            },
            required: false
        } : undefined
    }));
};


/**
 * getTopicWithDirection
 * @param  {[object]} topics   [ { id }, { id }, ... ]
 * @param  {[int]} userFundId
 * @param  {[boolean]} published
 * @return {[type]}
 */
EntityService.getTopicWithDirection = function(topics, userFundId, published) {
    return await (sequelize.models.Entity.findAll({
        where: {
            id: {
                $in: topics.map(topic => topic.id)
            },
            published
        },
        include: [{
            model: sequelize.models.Entity,
            as: 'direction',
            required: false
        },{
            model: sequelize.models.UserFund,
            as: 'userFund',
            where: {
                id: userFundId
            },
            required: false
        }],
    }));
};


EntityService.getEntity = function(id, userFundId, published, includes) {
    if (published === undefined) published = true;
    includes = includes || [];
    var include = includes.map(e => {
        return {
            model: sequelize.models.Entity,
            as: e,
            required: false
        };
    });
    if (userFundId) {
        include.push({
            model: sequelize.models.UserFund,
            as: 'userFund',
            where: {
                id: userFundId
            },
            required: false
        });
    }
    return await(sequelize.models.Entity.findOne({
        where: {
            id: id,
            published
        },
        include
    }));
};

EntityService.getEntitiesByType = function(type, userFundId, published) {
    return await(sequelize.models.Entity.findAll({
        where: {
            type: {
                $iLike: type
            },
            published
        },
        include: userFundId ? {
            model: sequelize.models.UserFund,
            as: 'userFund',
            where: {
                id: userFundId
            },
            required: false
        } : undefined
    }));
};

EntityService.getEntitiesByOwnerId = function(id, type, userFundId, published) {
    var res = await(sequelize.models.Entity.findOne({
        where: {
            id: id,
            published
        },
        include: {
            model: sequelize.models.Entity,
            as: 'childEntity',
            where: {
                type: type,
                published
            },
            required: false,
            include: userFundId ? {
                model: sequelize.models.UserFund,
                as: 'userFund',
                where: {
                    id: userFundId
                },
                required: false
            } : undefined
        }
    }));
    if (!res) throw new Error('Not found');
    return res.childEntity;
};

EntityService.createEntity = function(data) {
    return await(sequelize.models.Entity.create({
        title: data.title,
        description: data.description,
        type: data.type,
        published: data.published,
        imgUrl: data.imgUrl
    }));
};

EntityService.updateEntity = function(id, data) {
    return await(sequelize.models.Entity.update(data, {
        where: {
            id: id,
            deletedAt: null
        },
        returning: true
    }))[1][0];
};

EntityService.deleteEntity = function(id) {
    return await(sequelize.models.Entity.destroy({
        where: {
            id: id
        }
    }));
};


EntityService.associateEntity = function(id, otherId) {
    var relationsCount = await(sequelize.models.EntityOtherEntity.count({
        where: {
            entityId: id,
            otherEntityId: otherId
        }
    }));

    if (relationsCount) throw new Error('Relation exists');

    return await(sequelize.models.EntityOtherEntity.bulkCreate([{
        entityId: id,
        otherEntityId: otherId
    }, {
        entityId: otherId,
        otherEntityId: id
    }]));
};

EntityService.removeAssociation = function(id, otherId) {
    return await(sequelize.models.EntityOtherEntity.destroy({
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

EntityService.associateEntities = function(id, otherIds) {
    var creating = otherIds.map(otherId => {
        return [{
            entityId: id,
            otherEntityId: otherId
        }, {
            entityId: otherId,
            otherEntityId: id
        }];
    });

    var associations = _.flatten(creating);

    return await(sequelize.models.EntityOtherEntity.bulkCreate(associations));
};

EntityService.removeAssociations = function(id, otherEntityIds) {
    return await(sequelize.models.EntityOtherEntity.destroy({
        where: {
            $or: [{
                entityId: id,
                otherEntityId: {
                    $in: otherEntityIds
                }
            }, {
                otherEntityId: id,
                entityId: {
                    $in: otherEntityIds
                }
            }]
        }
    }));
};

EntityService.getTodayFundsCount = function() {
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

EntityService.getFundsCount = function() {
    return await(sequelize.models.Entity.count({
        where: {
            type: {
                $iLike: 'fund'
            }
        }
    }));
};

EntityService.getUserFunds = function(id, published) {
    return await(sequelize.models.Entity.findOne({
        where: {
            id,
            published
        },
        include: {
            model: sequelize.models.UserFund,
            as: 'userFund',
            required: false,
            where: {
                enabled: true
            }
        }
    }));
};

EntityService.publishAll = function() {
    return await(sequelize.models.Entity.update({
        published: true
    }, {
        where: {
            published: false
        }
    }));
};

EntityService.getEntitiesByTypeWithNested = function(type, includes) {
    var include = includes.map(e => {
        return {
            model: sequelize.models.Entity,
            as: e,
            required: false
        };
    });
    return await(sequelize.models.Entity.findAll({
        where: {
            type: {
                $or: type
            }
        },
        include
    }));
};

EntityService.getAssociated = function(id) {
    return await(sequelize.models.EntityOtherEntity.findAll({
        where: {
            entityId: id
        }
    })).map(e => e.otherEntityId);
}

module.exports = EntityService;
