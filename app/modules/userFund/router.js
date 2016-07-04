'use strict';

var userFundRouter = require('express').Router();

var UserFundController = require('./controllers/UserFundController');
var userFundController = new UserFundController();

userFundRouter.get('/', userFundController.actionGetUserFunds);
userFundRouter.get('/:id(\\d+)', userFundController.actionGetUserFund);
userFundRouter.post('/', userFundController.actionCreateUserFund);
userFundRouter.delete('/:id(\\d+)', userFundController.actionDeleteUserFund);
userFundRouter.put('/:id(\\d+)', userFundController.actionUpdateUserFund);
userFundRouter.get('/today', userFundController.actionGetTodayUserFundsCount);
userFundRouter.post('/:id(\\d+)/:entityId(\\d+)', userFundController.actionAddEntity);
userFundRouter.delete('/:id(\\d+)/:entityId(\\d+)', userFundController.actionRemoveEntity);
userFundRouter.get('/:id(\\d+)/entity', userFundController.actionGetEntities);
userFundRouter.get('/count', userFundController.actionGetAllAndTodayUserFundsCount);

module.exports = userFundRouter;
