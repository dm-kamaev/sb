'use strict';

var entityRouter = require('express').Router();

var EntityController = require('./controllers/EntityController');
var entityController = new EntityController();

entityRouter.get('/', entityController.actionGetAllEntities);
entityRouter.get('/:type(topic|direction|fund)', entityController.actionGetEntitiesByType);
entityRouter.get('/:id(\\d+)', entityController.actionGetEntity);
entityRouter.post('/', entityController.actionCreateEntity);
entityRouter.put('/:id(\\d+)', entityController.actionUpdateEntity);
entityRouter.delete('/:id(\\d+)', entityController.actionDeleteEntity);
entityRouter.get('/:id(\\d+)/:type(topic|direction|fund)', entityController.actionGetEntitiesByAssociatedId);
entityRouter.post('/:id(\\d+)/:otherId(\\d+)', entityController.actionAssociate);
entityRouter.delete('/:id(\\d+)/:otherId(\\d+)', entityController.actionRemoveAssociation);
entityRouter.get('/fund/today', entityController.actionGetTodayFundsCount);
entityRouter.get('/:id/user-fund', entityController.actionGetUserFunds);

module.exports = entityRouter;
