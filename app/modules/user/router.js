'use strict';

var userRouter = require('express').Router();
const SECRET = require('../../../config/admin-config').secret;
const checkToken = require('nodules/checkAuth').CheckToken(SECRET);
const errors = require('../../components/errors')

var UserController = require('./controllers/UserController');
var userController = new UserController();

const checkRules = (req, res, next) => {
    if (req.header('Token-Header') == SECRET || req.user && req.user.id == req.params.id) {
        return next()
    }
    throw new errors.HttpError('Unathorized', 403)
}

userRouter.post('/user-fund', userController.actionCreateUserFund);
// userRouter.delete('/user-fund', userController.actionDeleteUserFund);
// userRouter.get('/:id(\\d+)', userController.actionGetUserById);
// userRouter.get('/all', userController.actionGetUsers);
userRouter.get('/', userController.actionFindUser);
userRouter.put('/', userController.actionUpdateUser);
userRouter.get('/:id(\\d+)/order', checkRules, userController.actionGetOrders);
userRouter.get('/:id(\\d+)/subscription', checkRules, userController.actionGetSubscriptions);

userRouter.use(checkToken);
userRouter.get('/:id(\\d+)', userController.actionGetUserById);
userRouter.get('/all', userController.actionGetUsers);
userRouter.put('/:id(\\d+)', userController.actionUpdateUserById);


module.exports = userRouter;
