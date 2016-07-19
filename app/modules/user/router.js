'use strict';

var userRouter = require('express').Router();

var UserController = require('./controllers/UserController');
var userController = new UserController();

// userRouter.post('/', userController.actionFindOrCreateUser);
userRouter.post('/user-fund', userController.actionCreateUserFund);
userRouter.delete('/user-fund', userController.actionDeleteUserFund);
userRouter.get('/:id(\\d+)', userController.actionGetUserById);
userRouter.get('/', userController.actionGetUser);
userRouter.put('/', userController.actionUpdateUser);

module.exports = userRouter;
