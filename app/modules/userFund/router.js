'use strict';

var userFundRouter = require('express').Router();

var UserFundController = require('./controllers/UserFundController');
var userFundController = new UserFundController();

userFundRouter.get('/', userFundController.actionGetUserFunds);
userFundRouter.get('/:id(\\d+)', userFundController.actionGetUserFund);
// userFundRouter.post('/', userFundController.actionCreateUserFund);
// userFundRouter.delete('/:id(\\d+)', userFundController.actionDeleteUserFund);
userFundRouter.put('/:id(\\d+)', userFundController.actionUpdateUserFund);
// userFundRouter.get('/today', userFundController.actionGetTodayUserFundsCount);
userFundRouter.post('/:entityId(\\d+)', userFundController.actionAddEntity);
userFundRouter.delete('/:entityId(\\d+)', userFundController.actionRemoveEntity);
userFundRouter.get('/entity', userFundController.actionGetEntities);
userFundRouter.get('/count', userFundController.actionCountUserFunds);

module.exports = userFundRouter;
