'use strict';

var entityRouter = require('express').Router();

var EntityController = require('./controllers/EntityController');
var entityController = new EntityController();

entityRouter.get('/:type(topic|direction|fund)', entityController.actionEntities);
entityRouter.get('/:id', entityController.actionEntity);
entityRouter.post('/', entityController.actionCreateEntity);
entityRouter.put('/:id', entityController.actionUpdateEntity);
entityRouter.delete('/:id', entityController.actionDeleteEntity);

module.exports = entityRouter;
