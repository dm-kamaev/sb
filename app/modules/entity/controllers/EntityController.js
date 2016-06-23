'use strict';

const Controller = require('nodules/controller').Controller;
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const entityService = require('../services/entityService');
const entityView = require('../views/entityView');
const errors = require('../../../components/errors');

class EntityController extends Controller {
    actionCreateEntity(actionContext) {
        try {
            var entity = await(entityService.createEntity(actionContext.request.body));
            actionContext.response.statusCode = 201;
            actionContext.response.set('Location', `/entity/${entity.id}`);
            return entityView.renderEntity(entity);
        } catch (err) {
            if (err.name == "SequelizeValidationError") {
                throw new errors.ValidationError(err.errors);
            } else {
                throw err;
            }
        }
    }

    actionEntities(actionContext, type) {
        var entities = await (entityService.getEntitiesByType(type));
        return entityView.renderEntities(entities);
    }

    actionEntity(actionContext, id) {
        try {
            var entity = await (entityService.getEntity(id));
            return entityView.renderEntity(entity);
        } catch (err) {
            throw new errors.NotFoundError();
        }
    }

    actionDeleteEntity(actionContext, id) {
        var deleted = await (entityService.deleteEntity(id));
        if (!deleted) throw new errors.NotFoundError();
        return {
            message: "Success"
        }
    }

    actionUpdateEntity(actionContext, id) {
        try {
            var entity = await (entityService.updateEntity(id, actionContext.request.body));
        } catch (err) {
          if (err.name == "SequelizeValidationError") {
              throw new errors.ValidationError(err.errors);
          } else {
              throw err;
          }
        }
        if (!entity[0]) throw new errors.NotFoundError();
        return {
          message: "success"
        }
    }

    actionGetEntityByAssociatedId(actionContext, id, type) {
        try {
            return await(entityService.getEntityByAssociatedId(id, type));
        } catch (err) {
            if (err.message = "Not found") throw new errors.NotFoundError();
            throw err;
        }
    }

    actionAssociate(actionContext, id, type, otherId){
        await(entityService.associateEntity(id, type, otherId));
        return {
            message: "success"
        }
    }

    actionAllEntities(actionContext) {
        var entities = await(entityService.getAllEntities());
        return entityView.renderEntities(entities);
    }
}

module.exports = EntityController;
