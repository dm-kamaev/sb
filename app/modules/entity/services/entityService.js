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

EntityService.getDonateSum = function(ids) {
    if (typeof ids == 'number') ids = [ids]

    return await(sequelize.sequelize.query(`SELECT
  "Entity".id as "fundId",
  coalesce("a".sum, 0)
FROM "Entity"
  LEFT JOIN (SELECT
               jsonb_array_elements("userFundSnapshot" -> 'fund') ->> 'id' AS "fundId",
               sum(amount / jsonb_array_length("userFundSnapshot" -> 'fund'))::INTEGER AS sum
             FROM "Order"
             GROUP BY "fundId") AS "a" ON "Entity".id = "a"."fundId"::INTEGER
WHERE type = 'fund'`,{
      type: sequelize.sequelize.QueryTypes.SELECT,
      replacements: {
        fundId: ids
      }
    }))[0].sum;
}

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

EntityService.calculateTopicSum = function() {
    return await(sequelize.sequelize.query(`
  SELECT
  "Entity".id                           AS "topicId",
  array_agg(DISTINCT "x"."directionId") AS "directionIds",
  array_agg(DISTINCT "z"."fundId")      AS "fundIds",
  coalesce(sum(DISTINCT "y"."sum"), 0)  AS "sum"
FROM "Entity"
  LEFT JOIN (SELECT
          "entityId"      AS "topicId",
          "otherEntityId" AS "directionId"
        FROM "EntityOtherEntity"
          JOIN "Entity" ON "Entity".id = "EntityOtherEntity"."otherEntityId"
        WHERE type = 'direction' AND "Entity".published = true) "x" ON "Entity".id = x."topicId"
  LEFT JOIN (SELECT
          n.id                AS "directionId",
          "x"."otherEntityId" AS "fundId"
        FROM "Entity" n
          JOIN (SELECT
                  "entityId",
                  "otherEntityId"
                FROM "EntityOtherEntity"
                  JOIN "Entity" ON "EntityOtherEntity"."otherEntityId" = "Entity".id
                WHERE type IN ('fund') AND "Entity".published = true) "x" ON "n".id = "x"."entityId"
        WHERE n.type = 'direction') z ON x."directionId" = z."directionId"
  LEFT JOIN (SELECT
               jsonb_array_elements("Order"."userFundSnapshot" -> 'fund') ->> 'id'                     AS id,
               sum("Order".amount / jsonb_array_length("Order"."userFundSnapshot" -> 'fund'))::INTEGER AS sum
             FROM "Order"
             GROUP BY id) y ON "z"."fundId" = "y".id::INTEGER
WHERE type = 'topic'
GROUP BY "Entity".id`, {
      type: sequelize.sequelize.QueryTypes.SELECT
  }))
}

EntityService.calculateDirectionSum = function() {
    return await(sequelize.sequelize.query(`
      SELECT
  n.id AS "directionId",
  array_agg(DISTINCT "x"."otherEntityId") AS "fundIds",
  coalesce(sum(DISTINCT "y".sum), 0) AS "sum"
FROM "Entity" n
  LEFT JOIN (SELECT "entityId", "otherEntityId"
        FROM "EntityOtherEntity"
          JOIN "Entity" ON "EntityOtherEntity"."otherEntityId" = "Entity".id
        WHERE type IN ('fund')) "x" ON "n".id = "x"."entityId"
  LEFT JOIN (SELECT
               jsonb_array_elements("Order"."userFundSnapshot" -> 'fund') ->> 'id'                     AS id,
               sum("Order".amount / jsonb_array_length("Order"."userFundSnapshot" -> 'fund'))::INTEGER AS sum
             FROM "Order"
             GROUP BY id) y ON "x"."otherEntityId" = "y".id::INTEGER
WHERE n.type = 'direction'
GROUP BY "n".id`, {
  type: sequelize.sequelize.QueryTypes.SELECT
}))
}

EntityService.calculateFundsSum = function() {
    return await(sequelize.sequelize.query(`
      SELECT
  "Entity".id as "fundId",
  coalesce("a".sum, 0) AS "sum"
FROM "Entity"
  LEFT JOIN (SELECT
               jsonb_array_elements("userFundSnapshot" -> 'fund') ->> 'id' AS "fundId",
               sum(amount / jsonb_array_length("userFundSnapshot" -> 'fund'))::INTEGER AS sum
             FROM "Order"
             GROUP BY "fundId") AS "a" ON "Entity".id = "a"."fundId"::INTEGER
WHERE type = 'fund'`, {
    type: sequelize.sequelize.QueryTypes.SELECT
}))
}

module.exports = EntityService;
