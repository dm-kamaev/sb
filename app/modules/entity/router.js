'use strict';

var entityRouter = require('express').Router();

var EntityController = require('./controllers/EntityController');
var entityController = new EntityController();

entityRouter.get('/', entityController.actionAllEntities);
entityRouter.get('/:type(topic|direction|fund)', entityController.actionEntities);
entityRouter.get('/:id', entityController.actionEntity);
entityRouter.post('/', entityController.actionCreateEntity);
entityRouter.put('/:id', entityController.actionUpdateEntity);
entityRouter.delete('/:id', entityController.actionDeleteEntity);
entityRouter.get('/:id/:type(topic|direction|fund)', entityController.actionGetEntityByAssociatedId);
entityRouter.post('/:id/:type(topic|direction|fund)/:otherId', entityController.actionAssociate);

module.exports = entityRouter;
