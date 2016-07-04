'use strict';

var userRouter = require('express').Router();

var UserController = require('./controllers/UserController');
var userController = new UserController();

userRouter.post('/', userController.actionFindOrCreateUser);
userRouter.post('/:id(\\d+)/user-fund', userController.actionCreateUserFund);
userRouter.get('/:id(\\d+)', userController.actionGetUserById);

module.exports = userRouter;
