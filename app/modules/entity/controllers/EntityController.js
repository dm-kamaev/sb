'use strict';

const Controller = require('nodules/controller').Controller;
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const entityService = require('../services/entityService');
const entityView = require('../views/entityView');
const userFundView = require('../../userFund/views/userFundView');
const errors = require('../../../components/errors');

class EntityController extends Controller {
    /**
     * @api {post} /entity create new Entity
     * @apiName create new Entity
     * @apiGroup Entity
     *
     * @apiParam {String} [title] title name of the entity
     * @apiParam {String} [decsription] entity text decsription
     * @apiParam {String="fund","topic","direction"} type type of the entity
     *
     * @apiParamExample {json} Example request:
     * {
     *     "title": "sample title",
     *     "description": "sample description",
     *     "type": "topic"
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
            var data = actionContext.request.body;
            var entity = await (entityService.createEntity(data));
            actionContext.response.statusCode = 201;
            actionContext.response.set('Location', `/entity/${entity.id}`);
            return entityView.renderEntity(entity);
        } catch (err) {
            if (err.name == 'SequelizeValidationError') {
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
     * @apiParam {String="fund","topic","direction"} type type of entities we want to get
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
     *
     */
    actionGetEntitiesByType(actionContext, type) {
        var entities = await (entityService.getEntitiesByType(type));
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
        var entity = await (entityService.getEntity(id));
        if (!entity) throw new errors.NotFoundError('Entity', id);
        return entityView.renderEntity(entity);
    };
    /**
     * @api {delete} /entity/:id delete entity by id
     * @apiName delete Entity
     * @apiGroup Entity
     *
     * @apiSuccess {String} success success message
     */
    actionDeleteEntity(actionContext, id) {
        var deleted = await (entityService.deleteEntity(id));
        if (!deleted) throw new errors.NotFoundError('Entity', id);
        return {
            message: 'Success'
        }
    };
    /**
     * @api {put} /entity/:id update entity by id
     * @apiName update Entity
     * @apiGroup Entity
     *
     * @apiParam {Number} id unique Entity identifier
     *
     * @apiParamExample {json} Example request:
     * {
     *     "title": "sample title",
     *     "description": "sample description",
     *     "type": "topic"
     * }
     *
     * @apiError (Error 404) NotFound entity with this id not found
     * @apiError (Error 400) ValidationError wrong type field
     *
     * @apiSuccess {String} success success message
     */
    actionUpdateEntity(actionContext, id) {
        try {
            var data = actionContext.request.body;
            delete data.id;
            var entity = await (entityService.updateEntity(id, data));
            if (!entity[0]) throw new errors.NotFoundError('Entity', id);
            return {
                message: 'success'
            }
        } catch (err) {
            if (err.name == 'SequelizeValidationError') {
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
     * @apiParam {String="fund","topic","direction"} type type of entities we want to get
     *
     * @apiSuccess {Object[]} Entities array of entities related to :id
     *
     * @apiError (Error 404) NotFoundError Entity not found
     */
    actionGetEntitiesByAssociatedId(actionContext, id, type) {
        try {
            var entities = await (entityService.getEntitiesByOwnerId(id, type));
            return entityView.renderEntities(entities);
        } catch (err) {
            if (err.message == 'Not found') {
                throw new errors.NotFoundError('Entity', id);
            }
            throw err;
        }
    };

    /**
     * @api {post} /entity/:id/:otherId associate entities
     * @apiName associate Entity
     * @apiGroup Entity
     *
     * @apiParam {Number} id source Entity unique identifier
     * @apiParam {Number} otherId target Entity unique identifier
     * @apiParam {String="fund","topic","direction"} type Entity type we want to set
     *
     * @apiSuccess {String} success message
     *
     * @apiError (Error 404) NotFoundError entity with :id or :otherId not found
     */
    actionAssociate(actionContext, id, otherId) {
        try {
            await (entityService.associateEntity(id, otherId));
        } catch (err) {
            if (err.message == 'Relation exists')
                throw new errors.HttpError('Relation exists', 400);
            throw new errors.NotFoundError('Entity', [id, otherId].join(' OR '));
        }
        return {
            message: 'success'
        }
    };
    /**
     * @api {get} /entity get all entities
     * @apiName All Entities
     * @apiGroup Entity
     *
     * @apiSuccess {Object[]} Entities array of all entities
     */
    actionGetAllEntities(actionContext) {
        var entities = await (entityService.getAllEntities());
        return entityView.renderEntities(entities);
    };
    /**
     * @api {delete} /entity/:id/:otherId remove entities association
     * @apiName remove association
     * @apiGroup Entity
     *
     * @apiParam {Number} id identifier of entity which OWNS relation
     * @apiParam {Number} otherId identifier of entity which OWNED by
     *
     * @apiSuccess {String} success success message
     *
     * @apiError (Error 404) NotFoundError entity with :id or :otherId not found
     */
    actionRemoveAssociation(actionContext, id, otherId) {
        var deletedCount = await (entityService.removeAssociation(id, otherId));
        if (!deletedCount) {
            throw new errors.HttpError('Relation don\'t exists', 400);
        }
        return {
            message: 'success'
        }
    };
    /**
     * @api {get} /entity/fund/today get today created Funds
     * @apiName get today created funds
     * @apiGroup Entity
     *
     * @apiSuccess {Number} count count of funds created today
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
        var entity = await (entityService.getUserFunds(id));
        if (!entity) throw new errors.NotFoundError('Entity', id);
        return userFundView.renderUserFunds(entity.userFund);
    };
}

module.exports = EntityController;
