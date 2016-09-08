'use strict';

var userRouter = require('express').Router();
const SECRET = require('../../../config/admin-config').secret;
const checkToken = require('nodules/checkAuth').CheckToken(SECRET);

var UserController = require('./controllers/UserController');
var userController = new UserController();

userRouter.post('/user-fund', userController.actionCreateUserFund);
userRouter.delete('/user-fund', userController.actionDeleteUserFund);
// userRouter.get('/:id(\\d+)', userController.actionGetUserById);
// userRouter.get('/all', userController.actionGetUsers);
userRouter.get('/', userController.actionGetUser);
userRouter.put('/', userController.actionUpdateUser);

userRouter.use(checkToken);
userRouter.get('/:id(\\d+)', userController.actionGetUserById);
userRouter.get('/all', userController.actionGetUsers);
userRouter.get('/:id(\\d+)/order', userController.actionGetOrders);

module.exports = userRouter;
