'use strict';

var userRouter = require('express').Router();
const SECRET = require('../../../config/admin-config').secret;
const checkToken = require('nodules/checkAuth').CheckToken(SECRET);
const errors = require('../../components/errors');

var UserController = require('./controllers/UserController');
var userController = new UserController();

var controllersArray = {};
controllersArray['v1'] = userController;

var VersionedController = require('nodules/controller').VersionedController;
var versionedController = new VersionedController(controllersArray);

const checkRules = (req, res, next) => {
    if (req.header('Token-Header') == SECRET || req.user && req.user.id == req.params.id) {
        return next();
    }
    throw new errors.HttpError('Unathorized', 403);
};

userRouter.post('/user-fund', versionedController.actionCreateUserFund);
// userRouter.delete('/user-fund', userController.actionDeleteUserFund);
// userRouter.get('/:id(\\d+)', userController.actionGetUserById);
// userRouter.get('/all', userController.actionGetUsers);
userRouter.get('/', versionedController.actionFindUser);
userRouter.put('/', versionedController.actionUpdateUser);
userRouter.get('/:id(\\d+)/order', checkRules, versionedController.actionGetOrders);
userRouter.get('/:id(\\d+)/subscription', checkRules, versionedController.actionGetSubscriptions);

userRouter.use(checkToken);

userRouter.get('/:id(\\d+)', versionedController.actionGetUserById);
userRouter.get('/all', versionedController.actionGetUsers);
userRouter.put('/:id(\\d+)', versionedController.actionUpdateUserById);
userRouter.post('/:id(\\d+)/subscription/:subscrptionId(\\d+)/amount', versionedController.actionChangeAmount);


module.exports = userRouter;
