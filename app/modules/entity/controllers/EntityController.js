/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const entityService = require('../services/entityService');
const userService = require('../../user/services/userService');
const userFundService = require('../../userFund/services/userFundService')
const entityView = require('../views/entityView');
const userFundView = require('../../userFund/views/userFundView');
const errors = require('../../../components/errors');
const logger = require('../../../components/logger').getLogger('main');
const mail = require('../../mail')
const _ = require('lodash');
const entityTypes = require('../enums/entityTypes')
const EntityExtractor = require('../services/extractEntity');

class EntityController extends Controller {
    /**
     * @api {post} /entity create new Entity
     * @apiName create new Entity
     * @apiGroup Admin
     *
     * @apiParam {String} [title] title name of the entity
     * @apiParam {String} [decsription] entity text decsription
     * @apiParam {String="fund","topic","direction"} type type of the entity
     * @apiParam {Number[]} entityId id of entities need to associate
     *
     * @apiParamExample {json} Example request:
     * {
     *     "title": "sample title",
     *     "description": "sample description",
     *     "type": "topic",
     *     "entities": [1, 2, 3]
     * }
     *
     * @apiSuccess {Object} Entity created entity object
     * @apiSuccessExample {json} Success-Response:
     *     HTTP/1.1 200 OK
     *     Location: '/entity/1'
     *     {
     *         "id": 1,
     *         "type": "topic",
     *         "title": "sample title",
     *         "description": "sample description",
     *         "createdAt": "2016-06-20T15:46:59.196Z",
     *         "updatedAt": "2016-06-24T09:36:48.822Z"
     *     }
     *
     * @apiError (Error 400) ValidationError wrong type
     */
    actionCreateEntity(actionContext) {
        try {
            var data = actionContext.request.body,
                entities = data.entities;
            entities = _.castArray(entities)
                .map(e => parseInt(e))
                .filter(Number.isInteger);
            var entity = await (entityService.createEntity(data));
            handleCreation_(entity, entities);
            await (entityService.associateEntities(entity.id, entities));
            actionContext.response.statusCode = 201;
            actionContext.response.set('Location', `/entity/${entity.id}`);
            return entityView.renderEntity(entity);
        } catch (err) {
            if (err.name === 'SequelizeValidationError') {
                throw new errors.ValidationError(err.errors);
            } else {
                throw err;
            }
        }
    };
    /**
     * @api {get} /entity/:type get entities by type
     * @apiName get entities by type
     * @apiGroup Entity
     *
     * @apiParam {String="fund","topic","direction"} type type of entities
     *
     * @apiSuccess {Object[]} Entities array of entities with scecific :type
     * @apiSuccessExample {json} Success-Response:
     *     HTTP/1.1 200 OK
     * [
     *  {
     *    "id": 3,
     *    "type": "Direction",
     *    "title": "rak",
     *    "description": null,
     *    "createdAt": "2016-06-20T15:46:59.311Z",
     *    "updatedAt": "2016-06-20T15:46:59.311Z"
     *  },
     *  {
     *    "id": 4,
     *     "type": "Direction",
     *    "title": "priyut",
     *    "description": null,
     *    "createdAt": "2016-06-20T15:46:59.336Z",
     *    "updatedAt": "2016-06-20T15:46:59.336Z"
     *  },
     *  {
     *    "id": 5,
     *    "type": "Fund",
     *    "title": "super fund",
     *    "description": null,
     *    "createdAt": "2016-06-20T15:46:59.387Z",
     *    "updatedAt": "2016-06-20T15:46:59.387Z"
     *  },
     *  {
     *    "id": 6,
     *    "type": "Topic",
     *    "title": "super topic1",
     *    "description": null,
     *    "createdAt": "2016-06-20T15:48:05.985Z",
     *    "updatedAt": "2016-06-20T15:48:05.985Z"
     *  }
     * ]
     */
    actionGetEntitiesByType(actionContext, type) {
        var userFundId = actionContext.request.user && actionContext.request.user.userFund.id;
        var published = actionContext.request.published;
        var entities = await (entityService.getEntitiesByType(type, userFundId, published));
        return entityView.renderEntities(entities);
    };
    /**
     * @api {get} /entity/:id get Entity by id
     * @apiName get Entity
     * @apiGroup Entity
     *
     * @apiParam {Number} id unique identifier of Entity
     *
     * @apiSuccess {Object} Entity object
     * @apiSuccessExample {json} Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         "id": 1,
     *         "type": "topic",
     *         "title": "sample title",
     *         "description": "sample description",
     *         "createdAt": "2016-06-20T15:46:59.196Z",
     *         "updatedAt": "2016-06-24T09:36:48.822Z"
     *     }
     *
     * @apiError (Error 404) NotFoundError entity with this id not found
     */
    actionGetEntity(actionContext, id) {
        var request = actionContext.request,
            user = request.user || {};
        var userFundId = (user.userFund) ? user.userFund.id : null,
            published = request.published,
            include = request.query.include;

        var entity = await (entityService.getEntity(id, userFundId, published, include));
        if (!entity) throw new errors.NotFoundError('Entity', id);
        return entityView.renderEntity(entity);
    };
    /**
     * @api {delete} /entity/:id delete entity by id
     * @apiName delete Entity
     * @apiGroup Admin
     *
     *
     *
     */
    actionDeleteEntity(actionContext, id) {
        var deleted = await (entityService.deleteEntity(id));
        if (!deleted) throw new errors.NotFoundError('Entity', id);
        return null;
    };
    /**
     * @api {put} /entity/:id update entity by id
     * @apiName update Entity
     * @apiGroup Admin
     *
     * @apiParam {Number} id unique Entity identifier
     *
     * @apiParamExample {json} Example request:
     * {
     *     "title": "sample title",
     *     "description": "sample description",
     *     "type": "topic",
     *     "entities": [1, 2, 3]
     * }
     *
     * @apiError (Error 404) NotFound entity with this id not found
     * @apiError (Error 400) ValidationError wrong type field
     *
     */
    actionUpdateEntity(actionContext, id) {
        try {
            var data = actionContext.request.body,
                entities = data.entities;
            entities = _.castArray(entities)
                .map(e => parseInt(e))
                .filter(Number.isInteger);
            delete data.id;
            var entity = await (entityService.updateEntity(id, data));
            if (!entity) throw new errors.NotFoundError('Entity', id);
            if (entities.length) {
                var current = entityService.getAssociated(id),
                    remove  = [],
                    create  = entities.slice()

                current.forEach(id => {
                    var i = create.indexOf(id);
                    if (!~i) remove.push(id)
                    else     create.splice(i, 1)
                });

                if (!remove.length && !create.length) return;

                handleDeletion_(entity, remove)
                handleCreation_(entity, entities)
                await(entityService.removeAssociations(id, remove));
                await(entityService.associateEntities(id, create));
            }
            return null;
        } catch (err) {
            if (err.name === 'SequelizeValidationError') {
                throw new errors.ValidationError(err.errors);
            } else {
                throw err;
            }
        }
    };
    /**
     * @api {get} /entity/:id/:type get associated entities by id
     * @apiName get Entity By Associated Id
     * @apiGroup Entity
     *
     *
     * @apiParam {Number} id identifier of Entity
     * @apiParam {String="fund","topic","direction"} type type of entities
     *
     * @apiSuccess {Object[]} Entities array of entities related to :id
     *
     * @apiError (Error 404) NotFoundError Entity not found
     */
    actionGetEntitiesByAssociatedId(ctx, id, type) {
        try {
            var request = ctx.request,
                sberUserId = request.user && request.user.id;
            var userFundId = request.user && request.user.userFund.id || null,
                published = request.published;
            if (type === 'direction') {
                var entities =
                    await (entityService.getEntitiesByOwnerId(id, type, userFundId, published));
                // console.log(id, type, entities);
                return entityView.renderEntities(entities);
            } else if (type === 'topic') {
                // console.log('TOPIC');
                var directions =
                    await(entityService.getEntitiesByOwnerId(id, 'direction', userFundId, published));
                // console.log('DIRECTIONS=', id, type);
                id = directions[0].id;
                var topics = await(entityService.getEntitiesByOwnerId(id, 'topic', userFundId, published));
                // console.log('TOPICS=', id, type, topics);
                return entityView.renderEntities(topics);
            }
        } catch (err) {
            if (err.message === 'Not found') {
                throw new errors.NotFoundError('Entity', id);
            }
            throw err;
        }
    };

    /**
     * @api {get} /entity get all entities
     * @apiName All Entities
     * @apiGroup Entity
     *
     * @apiSuccess {Object[]} Entities array of all entities
     *
     */
    actionGetAllEntities(actionContext) {
        var request = actionContext.request,
            user = request.user || {};
        var userFundId = (user.userFund) ? user.userFund.id : null,
            published = request.published;
        var entities = await (entityService.getAllEntities(userFundId, published));
        return entityView.renderEntities(entities);
    };
    /**
     * @api {get} /entity/fund/today get today created Funds
     * @apiName get today created funds
     * @apiGroup Entity
     *
     * @apiSuccess {Number} count count of funds created today
     *
     */
    actionGetTodayFundsCount(actionContext) {
        var count = await (entityService.getTodayFundsCount());
        return {
            count: count
        };
    };
    /**
     * @api {get} /entity/:id/user-fund get user funds
     * @apiName get user funds associated with this entity
     * @apiGroup Entity
     *
     * @apiSuccess {Object[]} userFunds
     *
     * @apiError (Error 404) NotFoundError entity with :id not found
     */
    actionGetUserFunds(actionContext, id) {
        var published = actionContext.request.published,
            entity = await (entityService.getUserFunds(id, published));
        if (!entity) throw new errors.NotFoundError('Entity', id);
        return userFundView.renderUserFunds(entity.userFund);
    };
    /**
     * @api {post} /entity/publishall publish all (test)
     * @apiName publish all
     * @apiGroup Admin
     */
    actionPublishAll(actionContext) {
        return await (entityService.publishAll());
    };
    /**
     * @api {get} /entity/all get entities with include
     * @apiNane get entities with include
     * @apiGroup Admin
     * @apiParam (Query Params) {String="fund","topic","direction"} type=["fund","direction","topic"] type of enties
     * @apiParam (Query Params) {String="fund","topic","direction"} type of nested entities
     *
     * @apiSuccessExample {json} example:
     *
     * 			[    {
        "id": 8,
        "type": "direction",
        "title": "sample title",
        "description": "sample description",
        "createdAt": "2016-08-04T10:11:26.585Z",
        "updatedAt": "2016-08-04T10:11:26.585Z",
        "imgUrl": "http://www58.lan:3000/entity_pics/defaultDirection.png",
        "published": false,
        "topics": [
            {
                "id": 1,
                "type": "topic",
                "title": "sample title",
                "description": "sample description",
                "createdAt": "2016-08-04T09:41:04.483Z",
                "updatedAt": "2016-08-04T09:41:37.110Z",
                "imgUrl": "http://www58.lan:3000/entity_pics/defaultTopic.png",
                "published": true
            },
            {
                "id": 2,
                "type": "topic",
                "title": "sample title",
                "description": "sample description",
                "createdAt": "2016-08-04T09:41:04.626Z",
                "updatedAt": "2016-08-04T09:41:37.110Z",
                "imgUrl": "http://www58.lan:3000/entity_pics/defaultTopic.png",
                "published": true
            }
        ]
    }
]
     *
     */
    actionGetEntitiesWithNested(actionContext) {
        var includes = actionContext.request.query.include;
        var type = actionContext.request.query.type;
        var entities;
        try {
            entities = await (entityService.getEntitiesByTypeWithNested(type, includes));
        } catch (err) {
            throw new errors.HttpError('Wrong "include" or "type" query param!', 400);
        }
        return entityView.renderEntities(entities);
    };
}

function handleCreation_(entity, entities) {
    if (entity.type == entityTypes.DIRECTION) {
        var sberUsers = userFundService.getFullSubscribers(entities)
        sberUsers.forEach(sberUser => {
            var authUser = userService.findAuthUserByAuthId(sberUser.authId)
            mail.sendPendingDraft(authUser.email, {
                userName: authUser.userName
            })
        })
    } else if (entity.type == entityTypes.FUND) {
        var userFundIds = userFundService.getSubscribers({
            include: entities,
            exclude: [entity.id]
        }).map(userFund => userFund.id)

        userFundService.subscribeUserFunds(userFundIds, entity.id)
    }
}

function handleDeletion_(entity, entities) {
    if (entity.type == entityTypes.FUND) {
        var directions = new EntityExtractor({
            type: entityTypes.DIRECTION,
            entityIds: [entity.id]
        }).extract()
          .map(dir => parseInt(dir))
          .filter(dir => !~entities.indexOf(dir))

        var userFundIds = userFundService.getSubscribers({
            include: [entity.id],
            exclude: directions
        }).map(userFund => userFund.id)

        userFundService.unsubscribeUserFunds(userFundIds, [entity.id])
    }
}

module.exports = EntityController;
