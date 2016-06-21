'use strict';

const Controller = require('nodules/controller').Controller;
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const entityService = require('../services/entityService');
const entityView = require('../views/entityView');
const errors = require('../../../components/errors');

class EntityController extends Controller {
    actionCreateEntity(actionContext) {
        var entity = await (entityService.createEntity(actionContext.request.body));
        actionContext.response.statusCode = 201;
        actionContext.response.set('Location', `/entity/${entity.id}`);
        return entityView.renderEntity(entity);
    }

    actionEntities(actionContext, type) {
        var entities = await (entityService.getAllEntities(type));
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
        await (entityService.deleteEntity(actionContext.id));
        return {};
    }

    actionUpdateEntity(actionContext, id) {
        try {
            var entity = await (entityService.updateEntity(id, actionContext.request.body));
        } catch (err) {
          if (err.name == "SequelizeValidationError") {
              throw new errors.ValidationError(err.errors);
          }


            //throw new errors.NotFoundError();
        }
        if (!entity[0]) throw new errors.NotFoundError();
        return {
          message: "success"
        }
    }

    actionGetEntityByAssociatedId(actionContext, id, type) {
        await (entityService.getEntityByAssociatedId(id, type));
    }
}

module.exports = EntityController;
